import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import models
import logging
import os
import requests
import uuid
import asyncio
from asgiref.sync import async_to_sync
from django.conf import settings
from lms.models import Service, Ebook, Blog, Newsletter
from .models import ChatSession, ChatMessage, AIChatSession, AIChatMessage

User = get_user_model()

logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_MODEL = getattr(settings, "OLLAMA_MODEL", "qwen2.5:7b-instruct")
OLLAMA_BASE_URL = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
BASE_DIR = getattr(settings, "BASE_DIR", os.getcwd())


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = f"chat_{self.session_id}"

        # Check authentication
        if not self.scope["user"].is_authenticated:
            await self.close()
            return

        # Check if user is part of the session
        if not await self.is_user_in_session(self.scope["user"], self.session_id):
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Save message to database
        saved_message = await self.save_message(self.scope["user"], message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": saved_message.message,
                "sender": saved_message.sender.username,
                "sent_at": saved_message.sent_at.isoformat(),
                "message_id": saved_message.id,
            },
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]
        sent_at = event["sent_at"]
        message_id = event["message_id"]

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "sender": sender,
                    "sent_at": sent_at,
                    "message_id": message_id,
                }
            )
        )

    @database_sync_to_async
    def save_message(self, user, message):
        session = ChatSession.objects.get(id=self.session_id)
        return ChatMessage.objects.create(session=session, sender=user, message=message)

    @database_sync_to_async
    def is_user_in_session(self, user, session_id):
        try:
            session = ChatSession.objects.get(id=session_id)
            return session.members.filter(id=user.id).exists()
        except ChatSession.DoesNotExist:
            return False


class AIChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = f"ai_chat_{self.session_id}"
        self.has_greeted = False

        logger.info(
            f"AI Chat WebSocket connection attempt - Session ID: {self.session_id}, User: {self.scope.get('user', 'Anonymous')}"
        )

        # For AI chat, allow unauthenticated users for public chats
        # But check if session exists and is active
        if not await self.is_session_valid(self.session_id):
            logger.error(f"Invalid session ID: {self.session_id}")
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        logger.info(
            f"AI Chat WebSocket connected successfully - Session ID: {self.session_id}"
        )
        await self.accept()

    async def disconnect(self, close_code):
        logger.info(
            f"AI Chat WebSocket disconnected - Session ID: {self.session_id}, Close code: {close_code}"
        )
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        logger.info(
            f"AI Chat message received - Session ID: {self.session_id}, Data: {text_data[:200]}..."
        )
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json["message"]
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(
                f"Invalid message format - Session ID: {self.session_id}, Error: {e}"
            )
            await self.send_error("Invalid message format")
            return

        # Pre-check: Validate user input for safety
        if not await self.pre_check_message(message):
            logger.warning(
                f"Message failed pre-check - Session ID: {self.session_id}, Message: {message[:100]}..."
            )
            await self.send_error(
                "Your message contains inappropriate content. Please rephrase."
            )
            return

        # Save user message
        user_message = await self.save_message(
            self.session_id,
            "user",
            self.scope["user"] if self.scope["user"].is_authenticated else None,
            message,
        )

        # Send user message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "ai_chat_message",
                "message": user_message.message,
                "sender_type": "user",
                "sender": (
                    user_message.sender.username if user_message.sender else "Anonymous"
                ),
                "sent_at": user_message.sent_at.isoformat(),
                "message_id": user_message.id,
            },
        )

        # Generate AI response with in-check and post-check
        ai_response, stream_id = await self.generate_ai_response(message)

        # Post-check: Validate AI response
        if not await self.post_check_response(ai_response):
            logger.warning(
                f"AI response failed post-check - Session ID: {self.session_id}"
            )
            ai_response = "I'm sorry, but I cannot provide a response to that query as it may violate our content guidelines."

        # Save AI message
        ai_message = await self.save_message(self.session_id, "ai", None, ai_response)

        # Send AI message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "ai_chat_message",
                "message": ai_message.message,
                "sender_type": "ai",
                "sender": "AI",
                "sent_at": ai_message.sent_at.isoformat(),
                "message_id": ai_message.id,
                "stream_id": stream_id,
                "final": True,
            },
        )

    # Receive message from room group
    async def ai_chat_message(self, event):
        message = event["message"]
        sender_type = event["sender_type"]
        sender = event["sender"]
        sent_at = event["sent_at"]
        message_id = event["message_id"]
        stream_id = event.get("stream_id")
        final = event.get("final", False)

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "sender_type": sender_type,
                    "sender": sender,
                    "sent_at": sent_at,
                    "message_id": message_id,
                    "stream_id": stream_id,
                    "final": final,
                }
            )
        )

    async def ai_chat_stream(self, event):
        delta = event.get("delta", "")
        message_id = event.get("message_id")
        sender_type = event.get("sender_type", "ai")

        await self.send(
            text_data=json.dumps(
                {
                    "delta": delta,
                    "sender_type": sender_type,
                    "message_id": message_id,
                    "is_stream": True,
                }
            )
        )

    @database_sync_to_async
    def save_message(self, session_id, sender_type, sender, message):
        logger.debug(
            f"Saving message - Session ID: {session_id}, Type: {sender_type}, Sender: {sender}"
        )
        session = AIChatSession.objects.get(id=session_id)
        saved_message = AIChatMessage.objects.create(
            session=session, sender_type=sender_type, sender=sender, message=message
        )
        logger.debug(f"Message saved - ID: {saved_message.id}")
        return saved_message

    @database_sync_to_async
    def is_session_valid(self, session_id):
        try:
            session = AIChatSession.objects.get(id=session_id, is_active=True)
            logger.info(f"Session validation successful - Session ID: {session_id}")
            return True
        except AIChatSession.DoesNotExist:
            logger.error(
                f"Session validation failed - Session ID: {session_id} does not exist or is inactive"
            )
            return False

    async def generate_ai_response(self, user_message):
        logger.info(f"Generating AI response - Session ID: {self.session_id}")
        stream_id = str(uuid.uuid4())

        # Build concise context (no DB lookups)
        include_greeting = not getattr(self, "has_greeted", False)
        greeting = (
            "Welcome to The CEO Influencers… transforming industry insiders into industry influencers… high-impact, data-driven leadership coaching and business consulting… How can we assist you… today?"
            if include_greeting
            else ""
        )

        context = f"""You are the AI assistant for TCI (The CEO Influencers).
Your job: answer user questions about our services clearly and concisely.

Greeting rule:
- If this is the first reply in this chat session, start with this greeting: "{greeting}"
- After the first reply, do not send any welcome greeting again; respond directly to the user’s question.

Offerings (summarize only what’s relevant to the question):
- Program 1 - Live 2:1 Executive Leadership Coaching Program: Master executive leadership with our bespoke 2:1 virtual coaching. Combine self-paced learning with expert dual guidance for verifiable business ROI.
- Program 2 - Virtual 2:1 Executive Leadership Coaching Program: Master executive leadership with our bespoke 2:1 virtual coaching. Combine self-paced learning with expert dual guidance for verifiable business ROI.
- Program 3 - Business Intensive Seminars: Architect a top-performing executive team. Our bespoke immersion blends real-world simulations with future skills for immediate, measurable business ROI.
- Program 4 - Business Mastermind Group International Networking Event: Join our week-long Madrid executive mastermind. Forge global networks, solve real challenges, and future-proof your legacy for maximum leadership impact.
- Program 5 - Live Zoom Business Mastermind Classes: Build a future-proof organization in our 1-day C-suite masterclass. Gain strategic foresight, empower teams, and drive agility to master market shifts.
- Program 6 - Live Train-The-Trainer Program: Transform executives into master trainers. Our 5-day program builds empathy, strategy, and real-world skills for exceptional 21st-century impact.
- Program 7 - Keynote Guest Speakers: Experience the Power of Two. Our 2-person keynotes replace static speeches with interactive dialogue to drive meaningful, lasting leadership impact.
- Program 8 - Business to Business Consulting: Replace legacy consulting with our agile, senior-led approach. We integrate strategy and execution to future-proof your leadership and drive growth.
- Program 9 - Live Executive Career Coaching: Supercharge your ascent with bespoke 2:1 coaching. Build your brand, secure board seats, access hidden markets, and negotiate your true worth.

Insights (Blog):
- Business-Need-to-Know — “Collaboration or Competition? How Aligned Values Define the Future of Strategic Alliances”: Why shared purpose, not shared profit, now determines which partnerships endure and succeed.
- Business-Hot — “The Human Algorithm: Navigating the Organizational Shockwaves of AI”: Exploring the immediate disruptions and ethical crossroads of rapid AI adoption while balancing innovation with inclusion and efficiency with responsibility.
- Business-Critical — “Pressure Points: The Structural Shift in Global Business Resilience”: A leadership perspective on navigating energy shocks, supply chain fractures, and mineral scarcity amid geopolitical instability.

eBooks:
- Business-Critical - Series 1 — “Leading Through Turbulence: Managing Economic Uncertainty to Drive Positive Change and Sustainable Growth”: An essential guide for senior executives, arguing that economic volatility is constant and should be leveraged as a catalyst for innovation, resilience, and sustainable growth.
- Business-Critical - Series 2 — “The Executive Edge: Cultivating Influence in the C-Suite”: Argues that modern leadership must shift from a hierarchical, command-and-control model to one centered on influence, persuasion, and systemic alignment to navigate contemporary executive challenges.
- Business-Critical - Series 3 — “The Algorithmic CEO: Leading with Data, Not Just Guts”: Presents a framework for 21st-century leadership, arguing that the traditional intuition-driven model is insufficient for today’s volatile business landscape. The eBook guides executives on embedding AI, machine intelligence, and data-driven decision-making into leadership practice.

Show the user relevant knowledge from our offerings, blogs, and eBooks based on their question.
If the user’s question is unrelated to our services, blogs, or eBooks, or just want to talk to a human politely inform about the contact details:
    Contact:
    1. Website: https://theceoinfluencers.com
    2. Email: info@theceoinfluencers.com
    3. Phone: +1 702 760 3158

Safety: never give medical/legal/financial advice; avoid illegal/explicit/harmful content; do not request personal data. Be brief, friendly, and directly answer the user. If you lack info, say so succinctly.
"""

        context += f"User: {user_message}\nAI:"

        payload = {
            "model": OLLAMA_MODEL,
            "prompt": context,
            "stream": True,
        }

        loop = asyncio.get_running_loop()

        def call_ollama():
            try:
                resp = requests.post(
                    OLLAMA_GENERATE_URL, json=payload, timeout=120, stream=True
                )
            except Exception as e:
                logger.error(
                    f"Ollama request error - Session ID: {self.session_id}, Error: {e}"
                )
                return {
                    "error": "I'm sorry, I encountered an error. Please try again."
                }

            if resp.status_code != 200:
                logger.error(
                    f"Ollama error - Session ID: {self.session_id}, Status: {resp.status_code}, Body: {resp.text[:500]}"
                )
                return {
                    "error": "I'm sorry, the AI service is currently unavailable. Please try again later."
                }

            ai_response = ""
            for line in resp.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except Exception:
                    continue

                delta = data.get("response", "")
                if not delta:
                    continue

                ai_response += delta

                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "ai_chat_stream",
                        "delta": delta,
                        "message_id": stream_id,
                        "sender_type": "ai",
                    },
                )

            return {"response": ai_response.strip()}

        result = await loop.run_in_executor(None, call_ollama)

        if not result or result.get("error"):
            return (
                result.get(
                    "error", "I'm sorry, I encountered an error. Please try again."
                ),
                stream_id,
            )

        ai_response = result["response"]
        logger.info(
            f"Ollama response received - Session ID: {self.session_id}, Length: {len(ai_response)}"
        )
        if not ai_response:
            return ("I'm sorry, I couldn't generate a response.", stream_id)

        # Mark greeting as sent for this connection
        self.has_greeted = True

        return ai_response, stream_id

    def get_relevant_knowledge(self, query):
        knowledge = ""

        # Search services
        services = Service.objects.filter(
            models.Q(title__icontains=query)
            | models.Q(description__icontains=query)
            | models.Q(tags__icontains=query)
        )[:3]
        if not services:
            services = Service.objects.all().order_by("-id")[:5]
        if services:
            knowledge += "Services:\n"
            for service in services:
                knowledge += f"- {service.title}: {service.short_description}\n"

        # Search ebooks
        ebooks = Ebook.objects.filter(
            models.Q(title__icontains=query)
            | models.Q(description__icontains=query)
            | models.Q(topic__icontains=query)
        )[:3]
        if not ebooks:
            ebooks = Ebook.objects.all().order_by("-id")[:5]
        if ebooks:
            knowledge += "\nEbooks:\n"
            for ebook in ebooks:
                knowledge += f"- {ebook.title}: {ebook.description}\n"

        # Search blogs
        blogs = Blog.objects.filter(
            models.Q(title__icontains=query)
            | models.Q(content__icontains=query)
            | models.Q(topic__icontains=query),
            status="published",
        )[:3]
        if not blogs:
            blogs = (
                Blog.objects.filter(status="published").order_by("-id")[:5]
                if Blog.objects.filter(status="published").exists()
                else Blog.objects.all().order_by("-id")[:5]
            )
        if blogs:
            knowledge += "\nBlogs:\n"
            for blog in blogs:
                knowledge += f"- {blog.title}: {blog.short_description}\n"

        # Search newsletters
        newsletters = Newsletter.objects.filter(
            models.Q(title__icontains=query)
            | models.Q(short_description__icontains=query),
            status="published",
        )[:3]
        if newsletters:
            knowledge += "\nNewsletters:\n"
            for newsletter in newsletters:
                knowledge += f"- {newsletter.title}: {newsletter.short_description}\n"

        return knowledge


    async def send_error(self, error_message):
        """Send error message to WebSocket"""
        from django.utils import timezone

        await self.send(
            text_data=json.dumps(
                {
                    "error": error_message,
                    "sender_type": "system",
                    "sender": "System",
                    "sent_at": timezone.now().isoformat(),
                }
            )
        )

    @database_sync_to_async
    def pre_check_message(self, message):
        """Pre-check user message for safety before processing"""
        logger.debug(f"Pre-checking message - Length: {len(message)}")
        # Convert to lowercase for case-insensitive checking
        msg_lower = message.lower()

        # Blocked keywords and phrases
        blocked_content = [
            # Illegal activities
            "hack",
            "exploit",
            "crack",
            "pirate",
            "illegal",
            "drugs",
            "weapons",
            "bomb",
            "terrorism",
            "murder",
            "assault",
            "fraud",
            "scam",
            "phishing",
            # Harmful content
            "suicide",
            "self-harm",
            "kill myself",
            "end my life",
            "child abuse",
            "pedophilia",
            "rape",
            "sexual assault",
            # Hate speech
            "nazi",
            "hitler",
            "racist",
            "sexist",
            "homophobic",
            "transphobic",
            # Explicit content
            "porn",
            "sex",
            "nude",
            "naked",
            "erotic",
            # Personal information requests
            "social security",
            "ssn",
            "credit card",
            "password",
            "bank account",
            # Medical advice (we're not doctors)
            "medical advice",
            "diagnosis",
            "treatment",
            "prescription",
            # Legal advice (we're not lawyers)
            "legal advice",
            "lawsuit",
            "contract",
            "divorce",
        ]

        # Check for blocked content
        for blocked in blocked_content:
            if blocked in msg_lower:
                logger.warning(f"Blocked content detected: '{blocked}' in message")
                return False

        # Check message length (prevent extremely long messages)
        if len(message) > 2000:
            logger.warning(f"Message too long: {len(message)} characters")
            return False

        # Check for excessive caps (potential shouting/trolling)
        caps_ratio = (
            sum(1 for c in message if c.isupper()) / len(message) if message else 0
        )
        if caps_ratio > 0.8 and len(message) > 10:
            logger.warning(f"Excessive caps detected: {caps_ratio:.2f} ratio")
            return False

        logger.debug("Message passed pre-check")
        return True

    @database_sync_to_async
    def in_check_conversation(self, history):
        """In-check conversation history for safety patterns"""
        logger.debug(f"In-checking conversation - History length: {len(history)}")
        # Check for repetitive harmful patterns
        harmful_count = 0
        recent_messages = history[-5:]  # Check last 5 messages

        for msg in recent_messages:
            if msg.sender_type == "user":
                msg_lower = msg.message.lower()
                if any(
                    blocked in msg_lower
                    for blocked in ["kill", "harm", "hurt", "die", "death", "suicide"]
                ):
                    harmful_count += 1

        # If too many harmful messages in recent history, flag for moderation
        if harmful_count >= 3:
            logger.warning(
                f"Harmful conversation pattern detected: {harmful_count} harmful messages"
            )
            return False

        logger.debug("Conversation passed in-check")
        return True

    @database_sync_to_async
    def post_check_response(self, response):
        """Post-check AI response for safety before sending"""
        logger.debug(f"Post-checking AI response - Length: {len(response)}")
        response_lower = response.lower()

        # Blocked response content
        blocked_responses = [
            # Harmful advice
            "kill",
            "harm",
            "hurt",
            "suicide",
            "self-harm",
            # Illegal activities
            "hack",
            "exploit",
            "crack",
            "pirate",
            "drugs",
            "weapons",
            # Explicit content
            "porn",
            "sex",
            "nude",
            "naked",
            # Personal information
            "social security",
            "ssn",
            "credit card",
            "password",
            # Professional advice disclaimers
            "medical advice",
            "legal advice",
        ]

        # Check for blocked content in response
        for blocked in blocked_responses:
            if blocked in response_lower:
                logger.warning(f"Blocked content in AI response: '{blocked}'")
                return False

        # Check for potentially harmful patterns
        if "i recommend" in response_lower and any(
            word in response_lower for word in ["kill", "harm", "drugs"]
        ):
            logger.warning("Potentially harmful recommendation pattern detected")
            return False

        logger.debug("AI response passed post-check")
        return True
