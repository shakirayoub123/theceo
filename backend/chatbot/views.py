from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.utils import DatabaseError
from .models import ChatSession, ChatMessage, AIChatSession, AIChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
)
import json
import logging
import re
from html import unescape
from pathlib import Path
from django.utils.html import strip_tags
from lms.models import Service, Ebook, Blog, Newsletter

User = get_user_model()

logger = logging.getLogger(__name__)

_STOP_WORDS = {
    "about", "are", "and", "any", "can", "could", "does", "for", "from",
    "have", "how", "i", "in", "is", "it", "me", "of", "our", "please",
    "tell", "that", "the", "their", "them", "there", "this", "to", "us",
    "was", "what", "when", "where", "which", "who", "with", "would", "you",
    "know", "wana", "want", "like", "information", "info", "learn", "about",
}

_TOPIC_SYNONYMS = {
    "blog": {"blog", "blogs", "article", "articles", "insight", "insights", "post", "posts"},
    "service": {"service", "services", "program", "programs", "coaching", "consulting", "seminar", "seminars", "mastermind", "keynote"},
    "ebook": {"ebook", "ebooks", "book", "books", "guide", "guides"},
    "newsletter": {"newsletter", "newsletters", "quarterly", "bulletin"},
    "team": {"team", "influencer", "influencers", "mentor", "mentors", "james", "claire", "people"},
    "contact": {"contact", "email", "phone", "call", "reach"},
    "website": {"website", "site", "company", "business", "organization", "organisation", "consultancy"},
}


def _expanded_terms(value):
    terms = _question_terms(value)
    expanded = set(terms)
    for canonical, synonyms in _TOPIC_SYNONYMS.items():
        if terms & synonyms:
            expanded.add(canonical)
            expanded.update(synonyms)
    return expanded


def _plain_text(value):
    return re.sub(r"\s+", " ", unescape(strip_tags(value or ""))).strip()


def _question_terms(value):
    return {
        term for term in re.findall(r"[a-z0-9]+", (value or "").lower())
        if len(term) > 2 and term not in _STOP_WORDS
    }


def _content_candidates():
    candidates = [
        {
            "title": "The CEO Influencers",
            "kind": "About us",
            "topics": {"website", "team", "contact", "service"},
            "text": (
                "The CEO Influencers website describes an international executive "
                "leadership coaching and organizational performance consultancy. "
                "The coaching team includes James Armstrong and Dr. Claire Keogh. "
                "Our services include live and virtual executive leadership coaching, "
                "client-site leadership seminars, mastermind networking and classes, "
                "train-the-trainer programs, keynote speaking, business-to-business "
                "consulting, and executive career coaching. "
                "Contact us at info@theceoinfluencers.com or +1 702 760 3158."
            ),
        },
        {
            "title": "Website Insights and Blogs",
            "kind": "Blog overview",
            "topics": {"blog"},
            "text": (
                "The website's published blogs and insights include Collaboration or Competition? "
                "How Aligned Values Define the Future of Strategic Alliances, about shared purpose "
                "and values in partnerships; The Human Algorithm: Navigating the Organizational "
                "Shockwaves of AI, about leadership and responsible AI adoption; and Pressure Points: "
                "The Structural Shift in Global Business Resilience, about energy, supply chains, "
                "and geopolitical change. Open Insights or Our Blogs to read the articles."
            ),
        },
        {
            "title": "Executive eBooks",
            "kind": "eBook overview",
            "topics": {"ebook"},
            "text": (
                "The website features executive eBooks including Leading Through Turbulence: "
                "Managing Economic Uncertainty to Drive Positive Change and Sustainable Growth; "
                "The Executive Edge: Cultivating Influence in the C-Suite; and The Algorithmic CEO: "
                "Leading with Data, Not Just Guts. Browse Our eBooks for descriptions and previews."
            ),
        },
        {
            "title": "Quarterly Newsletters",
            "kind": "Newsletter overview",
            "topics": {"newsletter"},
            "text": (
                "The website has a quarterly newsletter section with leadership and business insights. "
                "Visit Our Quarterly Newsletters to browse available editions."
            ),
        },
        {
            "title": "Salient Features",
            "kind": "Website overview",
            "topics": {"feature", "features", "salient", "website"},
            "text": (
                "The website highlights salient features including holistic 360 leadership development, "
                "long-term profitability and trust, global expertise with local impact, empathy at the core, "
                "strategic partnerships and alliances, and maximizing AI technology strategy. "
                "These features help C-suite leaders drive performance, build resilient teams, and make better strategic decisions."
            ),
        },
        {
            "title": "Program 1: Live 2:1 Executive Leadership Coaching",
            "kind": "Program overview",
            "topics": {"program", "programs", "service", "coaching"},
            "text": (
                "Program 1 is the Live 2:1 Executive Leadership Coaching program. It is a live twelve-week Zoom coaching program with nine months of continuous support. "
                "It uses the Two-to-One Advantage model, where leaders receive guidance from two expert mentors focused on their real-world leadership advantage. "
                "The program covers financial and technology strategy, emotional intelligence, strategic vision, AI and business innovation, organizational dynamics, and decision-making under pressure."
            ),
        },
    ]

    qna_path = Path(__file__).resolve().parent.parent / "qna.json"
    if qna_path.exists():
        try:
            with qna_path.open("r", encoding="utf-8") as handle:
                qna_items = json.load(handle)
            for item in qna_items:
                answer = (item.get("answer") or "").strip()
                question = (item.get("question") or "").strip()
                section = (item.get("section") or "Website FAQ").strip()
                if not answer:
                    continue
                content = f"{section}. {question}. {answer}"
                candidates.append({
                    "title": section,
                    "kind": "Website FAQ",
                    "topics": {"program", "service", "website", "feature", "faq"},
                    "text": content,
                })
        except (json.JSONDecodeError, OSError):
            logger.exception("Website Q&A could not load qna index")

    static_features_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "config" / "salientFeatures.json"
    if static_features_path.exists():
        try:
            with static_features_path.open("r", encoding="utf-8") as handle:
                features = json.load(handle)
            feature_text = " ".join(
                " ".join(item.get("summary", []))
                for item in features
            )
            candidates.append({
                "title": "Salient Features",
                "kind": "Feature overview",
                "topics": {"feature", "features", "salient", "website"},
                "text": (
                    "The website’s salient features include holistic leadership, long-term profitability, global expertise, empathy at the core, strategic partnerships, and AI technology strategy. "
                    f"{feature_text}"
                ),
            })
        except (json.JSONDecodeError, OSError):
            logger.exception("Website Q&A could not load frontend salient features")

    content_sources = (
        (
            "services",
            lambda: Service.objects.filter(status="active", is_published=True).order_by("order", "id"),
            "Service",
            lambda item: " ".join(filter(None, [item.short_description, item.description])),
            {"service"},
        ),
        (
            "eBooks",
            lambda: Ebook.objects.filter(status="active").order_by("title"),
            "eBook",
            lambda item: item.description,
            {"ebook"},
        ),
        (
            "blogs",
            lambda: Blog.objects.filter(status="published").order_by("-published_at", "-id"),
            "Blog",
            lambda item: " ".join(filter(None, [item.short_description, item.content])),
            {"blog"},
        ),
        (
            "newsletters",
            lambda: Newsletter.objects.filter(status="published").order_by("-published_at", "-id"),
            "Newsletter",
            lambda item: item.short_description,
            {"newsletter"},
        ),
    )

    for source_name, queryset_factory, kind, text_getter, topics in content_sources:
        try:
            for item in queryset_factory():
                candidates.append({
                    "title": item.title,
                    "kind": kind,
                    "text": _plain_text(text_getter(item)),
                    "topics": topics,
                })
        except DatabaseError:
            logger.exception("Website Q&A could not load %s content", source_name)

    deduped = []
    seen = set()
    for candidate in candidates:
        key = (str(candidate.get("title", "")).strip().lower(), str(candidate.get("kind", "")).strip().lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(candidate)

    return deduped


def _best_excerpt(text, terms, limit=420):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    ranked = sorted(
        enumerate(sentences),
        key=lambda entry: (
            -len(_question_terms(entry[1]) & terms),
            entry[0],
        ),
    )
    chosen = []
    length = 0
    for _, sentence in ranked:
        sentence = sentence.strip()
        if not sentence:
            continue
        if length and length + len(sentence) > limit:
            continue
        chosen.append(sentence)
        length += len(sentence) + 1
        if length >= limit * 0.75:
            break
    excerpt = " ".join(chosen) or text
    if len(excerpt) <= limit:
        return excerpt
    return excerpt[:limit].rsplit(" ", 1)[0] + "…"


def _build_ai_answer(question, results):
    question_text = (question or "").strip()
    intro = "I found a few relevant details from the website."

    if not question_text:
        return intro

    normalized = question_text.lower()
    if any(word in normalized for word in ["service", "services", "offer", "coaching", "program"]):
        intro = "Here are the services and programs offered by The CEO Influencers, based on the website content:"
    elif any(word in normalized for word in ["blog", "article", "insight"]):
        intro = "Here are the most relevant blog insights from the site:"
    elif any(word in normalized for word in ["ebook", "book", "guide"]):
        intro = "I found the most relevant reading resources on the site:"
    elif any(word in normalized for word in ["newsletter", "quarterly"]):
        intro = "Here are the newsletter highlights I found:"
    elif any(word in normalized for word in ["who", "team", "influencer", "mentor"]):
        intro = "Here’s what the site says about the team and influencers:"
    elif any(word in normalized for word in ["what", "about", "website", "company"]):
        intro = "Here’s a quick summary of the website and its focus:"

    body = []
    for _, candidate in results:
        snippet = _best_excerpt(candidate["text"], _question_terms(question_text))
        body.append(f"• {candidate['title']} — {snippet}")

    answer = f"{intro}\n\n" + "\n\n".join(body)
    if len(answer) < 220:
        answer += "\n\nIf you want, I can also help you narrow it down to services, blogs, newsletters, or the leadership team."
    return answer


class WebsiteQuestionView(APIView):
    """Answer public questions using published site content only."""

    permission_classes = [AllowAny]
    throttle_scope = "public"

    def post(self, request):
        question = str(request.data.get("question", "")).strip()
        if not question:
            return Response({"error": "Please enter a question."}, status=status.HTTP_400_BAD_REQUEST)
        if len(question) > 500:
            return Response({"error": "Please keep your question under 500 characters."}, status=status.HTTP_400_BAD_REQUEST)

        terms = _question_terms(question)
        expanded_terms = _expanded_terms(question)
        ranked = []
        qna_items = []
        qna_path = Path(__file__).resolve().parent.parent / "qna.json"
        if qna_path.exists():
            try:
                with qna_path.open("r", encoding="utf-8") as handle:
                    qna_items = json.load(handle)
            except (json.JSONDecodeError, OSError):
                qna_items = []

        kb_boost = 0
        for item in qna_items:
            kb_title = (item.get("section") or "").lower()
            kb_question = (item.get("question") or "").lower()
            kb_text = f"{kb_title} {kb_question} {(item.get('answer') or '')}".lower()
            kb_terms = _expanded_terms(kb_text)
            score = len(expanded_terms & kb_terms)
            if "program" in (question.lower()) and "program" in kb_title:
                score += 4
            if "salient" in question.lower() and "salient" in kb_title:
                score += 4
            if "feature" in question.lower() and ("feature" in kb_text or "salient" in kb_text):
                score += 4
            if score > kb_boost:
                kb_boost = score

        for candidate in _content_candidates():
            title_terms = _expanded_terms(candidate["title"])
            content_terms = _expanded_terms(candidate["text"])
            topic_bonus = 4 * len(expanded_terms & candidate.get("topics", set()))
            score = (
                len(expanded_terms & content_terms)
                + 2 * len(expanded_terms & title_terms)
                + topic_bonus
                + (10 if kb_boost and ("program" in question.lower() and "program" in candidate["title"].lower()) else 0)
                + (10 if kb_boost and ("salient" in question.lower() and "salient" in candidate["title"].lower()) else 0)
            )
            if score:
                ranked.append((score, candidate))

        ranked.sort(key=lambda result: result[0], reverse=True)
        if not ranked or ranked[0][0] < 1:
            answer = (
                "I couldn’t find that information in the published website content. "
                "For help, contact info@theceoinfluencers.com or call +1 702 760 3158."
            )
            return Response({"answer": answer, "sources": []})

        results = ranked[:3]
        answer = _build_ai_answer(question, results)
        return Response({
            "answer": answer,
            "sources": [{"title": candidate["title"], "type": candidate["kind"]} for _, candidate in results],
        })


class GetChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get all chat sessions for this user
        chat_sessions = ChatSession.objects.filter(
            participants=request.user, is_active=True
        ).prefetch_related("participants", "messages")

        serializer = ChatSessionSerializer(
            chat_sessions, many=True, context={"request": request}
        )
        return Response(serializer.data)


class GetChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_uuid, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the chat session
        chat_session = get_object_or_404(
            ChatSession, id=chat_uuid, participants=request.user, is_active=True
        )

        # Get the other participant
        other_participant = chat_session.participants.exclude(
            id=request.user.id
        ).first()
        if not other_participant:
            return Response(
                {"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get messages
        messages = ChatMessage.objects.filter(session=chat_session).order_by("sent_at")
        message_serializer = ChatMessageSerializer(messages, many=True)

        return Response(
            {"user": other_participant.username, "messages": message_serializer.data}
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data["session_id"]
            message_text = serializer.validated_data["message"]

            # Verify user is participant in the session
            chat_session = get_object_or_404(
                ChatSession, id=session_id, participants=request.user, is_active=True
            )

            # Create the message
            message = ChatMessage.objects.create(
                session=chat_session, sender=request.user, message=message_text
            )

            # Return the created message
            message_serializer = ChatMessageSerializer(message)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("other_user_id")
        if not other_user_id:
            return Response(
                {"error": "other_user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if chat session already exists
        existing_session = (
            ChatSession.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if existing_session:
            return Response(
                {
                    "message": "Chat session already exists",
                    "session_id": existing_session.id,
                }
            )

        # Create new chat session
        chat_session = ChatSession.objects.create()
        chat_session.participants.add(request.user, other_user)

        return Response(
            {"message": "Chat session created", "session_id": chat_session.id},
            status=status.HTTP_201_CREATED,
        )


class StartAIChatView(APIView):
    permission_classes = [AllowAny]  # Allow public access

    def post(self, request):
        logger.info(
            f"StartAIChatView called - User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
        session_name = request.data.get("session_name", "")
        is_public = request.data.get("is_public", False)

        user = request.user if request.user.is_authenticated else None

        try:
            # Create new AI chat session
            ai_chat_session = AIChatSession.objects.create(
                user=user, session_name=session_name, is_public=is_public
            )
            logger.info(
                f"AI Chat session created - ID: {ai_chat_session.id}, User: {user}"
            )
            return Response(
                {
                    "message": "AI Chat session created",
                    "session_id": ai_chat_session.id,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating AI chat session - Error: {e}")
            return Response(
                {"error": "Failed to create chat session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetAIChatMessagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, chat_uuid):
        logger.info(
            f"GetAIChatMessagesView called - Chat UUID: {chat_uuid}, User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
        try:
            # Get the AI chat session
            ai_chat_session = get_object_or_404(
                AIChatSession, id=chat_uuid, is_active=True
            )

            # Get messages
            messages = AIChatMessage.objects.filter(session=ai_chat_session).order_by(
                "sent_at"
            )

            # Serialize messages
            message_data = []
            for message in messages:
                message_data.append(
                    {
                        "id": message.id,
                        "sender_type": message.sender_type,
                        "sender": message.sender.username
                        if message.sender
                        else "Anonymous"
                        if message.sender_type == "user"
                        else "AI",
                        "message": message.message,
                        "sent_at": message.sent_at.isoformat(),
                    }
                )

            logger.info(f"Retrieved {len(message_data)} messages for chat {chat_uuid}")
            return Response({"messages": message_data})
        except AIChatSession.DoesNotExist:
            logger.warning(f"AI Chat session not found - UUID: {chat_uuid}")
            return Response(
                {"error": "Chat session not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(
                f"Error retrieving AI chat messages - Chat UUID: {chat_uuid}, Error: {e}"
            )
            return Response(
                {"error": "Failed to retrieve messages"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get all chat sessions for this user
        chat_sessions = ChatSession.objects.filter(
            participants=request.user, is_active=True
        ).prefetch_related("participants", "messages")

        serializer = ChatSessionSerializer(
            chat_sessions, many=True, context={"request": request}
        )
        return Response(serializer.data)


class GetChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_uuid, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the chat session
        chat_session = get_object_or_404(
            ChatSession, id=chat_uuid, participants=request.user, is_active=True
        )

        # Get the other participant
        other_participant = chat_session.participants.exclude(
            id=request.user.id
        ).first()
        if not other_participant:
            return Response(
                {"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get messages
        messages = ChatMessage.objects.filter(session=chat_session).order_by("sent_at")
        message_serializer = ChatMessageSerializer(messages, many=True)

        return Response(
            {"user": other_participant.username, "messages": message_serializer.data}
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data["session_id"]
            message_text = serializer.validated_data["message"]

            # Verify user is participant in the session
            chat_session = get_object_or_404(
                ChatSession, id=session_id, participants=request.user, is_active=True
            )

            # Create the message
            message = ChatMessage.objects.create(
                session=chat_session, sender=request.user, message=message_text
            )

            # Return the created message
            message_serializer = ChatMessageSerializer(message)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("other_user_id")
        if not other_user_id:
            return Response(
                {"error": "other_user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if chat session already exists
        existing_session = (
            ChatSession.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if existing_session:
            return Response(
                {
                    "message": "Chat session already exists",
                    "session_id": existing_session.id,
                }
            )

        # Create new chat session
        chat_session = ChatSession.objects.create()
        chat_session.participants.add(request.user, other_user)

        return Response(
            {"message": "Chat session created", "session_id": chat_session.id},
            status=status.HTTP_201_CREATED,
        )
