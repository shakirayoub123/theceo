from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.utils import DatabaseError
from .models import ChatSession, ChatMessage, AIChatSession, AIChatMessage
from .models import SiteFeatureSettings
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
from authentication.permissions import IsAdmin

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


def _question_intent(question):
    normalized = (question or "").lower()
    terms = _question_terms(normalized)

    if terms & {"case", "study", "studies", "spirit"}:
        return "case_study"
    if terms & {"influencer", "influencers", "team", "mentor", "mentors", "james", "claire", "people"}:
        return "team"
    if terms & {"newsletter", "newsletters", "quarterly", "bulletin"}:
        return "newsletter"
    if terms & {"ebook", "ebooks", "book", "books", "guide", "guides"}:
        return "ebook"
    if terms & {
        "blog", "blogs", "article", "articles", "insight", "insights", "post", "posts",
        "algorithm", "algorithms", "pressure", "resilience", "collaboration",
    }:
        return "blog"
    if "salient" in terms or "feature" in terms or "features" in terms:
        return "feature"
    if "program" in terms or "programs" in terms:
        return "program"
    if terms & {"service", "services", "offer", "offers", "coaching", "consulting", "seminar", "seminars", "keynote", "mastermind"}:
        return "service"
    if terms & {"contact", "email", "phone", "call", "reach"}:
        return "contact"
    return "website"


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
        if (len(term) > 2 or term.isdigit()) and term not in _STOP_WORDS
    }


def _content_candidates():
    candidates = [
        {
            "title": "The CEO Influencers",
            "kind": "About us",
            "topics": {"website", "contact"},
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
            "title": "Our Influencers",
            "kind": "Team overview",
            "topics": {"team"},
            "text": (
                "James H. Armstrong is a visionary thought leader and executive coach, and Dr. Claire Keogh is an international "
                "business consultant and keynote speaker. "
                "Together they bring more than 20 years of combined experience and have advised over 7,500 executive clients worldwide."
            ),
        },
        {
            "title": "Our Services",
            "kind": "Service overview",
            "topics": {"service"},
            "text": (
                "The CEO Influencers' services include live and virtual executive leadership coaching, client-site leadership seminars, "
                "international mastermind networking events and classes, train-the-trainer programs, keynote guest speakers, "
                "business-to-business consulting, and live executive career coaching."
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
            "topics": {"program"},
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
                qna_data = json.load(handle)
                qna_items = qna_data.get("faqs", []) if isinstance(qna_data, dict) else qna_data
            for item in qna_items:
                answer = (item.get("answer") or "").strip()
                section = (item.get("section") or "Website FAQ").strip()
                if not answer:
                    continue
                questions = item.get("questions") or [item.get("question", "")]
                questions = [value.strip() for value in questions if isinstance(value, str) and value.strip()]
                keywords = item.get("keywords", [])
                if isinstance(keywords, str):
                    keywords = [keywords]
                query_text = " ".join(questions + [str(value) for value in keywords])
                normalized_section = " ".join([
                    section.lower(),
                    str(item.get("category", "")).lower(),
                ])
                if "case stud" in normalized_section:
                    topic = "case_study"
                elif "program" in normalized_section:
                    topic = "program"
                elif "service" in normalized_section:
                    topic = "service"
                elif "feature" in normalized_section or "salient" in normalized_section:
                    topic = "feature"
                else:
                    topic = _question_intent(query_text)
                    if topic == "website" and any(word in normalized_section for word in ("company", "support", "content")):
                        topic = "website"
                question_title = questions[0] if questions else section
                candidates.append({
                    "title": question_title,
                    "kind": "Website FAQ",
                    "topics": {topic},
                    "text": f"{section}. {question_title}. {answer}",
                    "question_variants": questions,
                    "keywords": keywords,
                    "category": item.get("category", ""),
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

    frontend_root = Path(__file__).resolve().parent.parent.parent / "frontend"
    for markdown_path in sorted(frontend_root.glob("case-study-*.md")):
        match = re.search(r"case-study-(\d+)", markdown_path.stem)
        if not match:
            continue
        case_number = match.group(1)
        try:
            markdown = markdown_path.read_text(encoding="utf-8").strip()
        except OSError:
            logger.exception("Website Q&A could not load %s", markdown_path.name)
            continue
        title_match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
        case_title = title_match.group(1).strip() if title_match else f"Case Study {case_number}"
        candidates.append({
            "title": f"Case Study {case_number}: {case_title}",
            "kind": "Case study",
            "topics": {"case_study"},
            "text": markdown,
            "question_variants": [f"case study {case_number}", case_title],
            "url": f"/case-studies/{case_number}",
            "download_url": f"/pdfs/case-study-{case_number}.pdf",
        })

    content_sources = (
        (
            "services",
            lambda: Service.objects.filter(status="active", is_published=True).order_by("order", "id"),
            "Service",
            lambda item: " ".join(filter(None, [item.short_description, item.description])),
            {"service"},
            lambda item: item.featured_image,
            lambda item: "/#services-section",
        ),
        (
            "eBooks",
            lambda: Ebook.objects.filter(status="active").order_by("title"),
            "eBook",
            lambda item: item.description,
            {"ebook"},
            lambda item: item.cover_image,
            lambda item: f"/ebook-detail/{item.id}",
        ),
        (
            "blogs",
            lambda: Blog.objects.filter(status="published").order_by("-published_at", "-id"),
            "Blog",
            lambda item: " ".join(filter(None, [item.short_description, item.content])),
            {"blog"},
            lambda item: item.thumbnail_image,
            lambda item: f"/blog/{item.slug}",
        ),
        (
            "newsletters",
            lambda: Newsletter.objects.filter(status="published").order_by("-published_at", "-id"),
            "Newsletter",
            lambda item: item.short_description,
            {"newsletter"},
            lambda item: item.thumbnail_image,
            lambda item: f"/newsletters/{item.id}",
        ),
    )

    for source_name, queryset_factory, kind, text_getter, topics, image_getter, url_getter in content_sources:
        try:
            for item in queryset_factory():
                candidate = {
                    "title": item.title,
                    "kind": kind,
                    "text": _plain_text(text_getter(item)),
                    "topics": topics,
                    "url": url_getter(item),
                }
                try:
                    image = image_getter(item)
                    if image:
                        candidate["image_url"] = image.url
                except (ValueError, OSError):
                    pass
                candidates.append(candidate)
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
    normalized = question_text.lower()
    intent = _question_intent(question_text)
    if not results:
        return "I couldn’t find that detail in the published website content. You can ask me about our services, programs, influencers, blogs, eBooks, or newsletters."

    candidate = results[0][1]
    terms = _question_terms(question_text)
    if candidate.get("kind") == "Case study" and terms & {"text", "full", "complete", "entire", "all"}:
        answer = candidate["text"]
        if candidate.get("download_url"):
            answer += f"\n\n[Download the original PDF]({candidate['download_url']})"
        return answer

    snippet = _best_excerpt(candidate["text"], _question_terms(question_text), limit=500)

    if intent == "service":
        opening = "Sure!"
    elif intent == "team":
        opening = "The team includes"
    elif any(word in normalized for word in ["program"]):
        opening = "Sure! The CEO Influencers offers"
    elif any(word in normalized for word in ["blog", "article", "insight"]):
        opening = "Sure! Here’s a useful overview"
    elif any(word in normalized for word in ["ebook", "book", "guide"]):
        opening = "Of course! Here’s what’s available"
    elif any(word in normalized for word in ["newsletter", "quarterly"]):
        opening = "Sure! Our quarterly newsletters"
    elif any(word in normalized for word in ["who", "team", "influencer", "mentor"]):
        opening = "The team includes"
    else:
        opening = "Sure —"

    answer = f"{opening} {snippet}"
    if len(results) > 1 and intent not in {"team", "service", "newsletter", "ebook", "blog", "feature", "contact"}:
        related = results[1][1]
        related_snippet = _best_excerpt(
            related["text"], _question_terms(question_text), limit=240
        )
        if related["title"].lower() != candidate["title"].lower():
            answer += f"\n\nYou may also find **{related['title']}** helpful: {related_snippet}"
    answer += "\n\nWould you like to know more about this, or explore another part of the site?"
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

        conversation = request.data.get("conversation", [])
        previous_user_messages = []
        if isinstance(conversation, list):
            for message in conversation[-8:]:
                if not isinstance(message, dict) or message.get("role") != "user":
                    continue
                content = message.get("content", "")
                if isinstance(content, str) and content.strip():
                    previous_user_messages.append(content.strip()[:500])

        retrieval_question = question
        is_follow_up = bool(re.search(
            r"\b(it|that|this|they|them|those|these|which one|what about|tell me more|more about|why|how so|and then)\b",
            question.lower(),
        ))
        if previous_user_messages and is_follow_up:
            retrieval_question = " ".join(previous_user_messages[-2:] + [question])

        terms = _question_terms(retrieval_question)
        expanded_terms = _expanded_terms(retrieval_question)
        intent = _question_intent(retrieval_question)
        ranked = []
        for candidate in _content_candidates():
            if intent != "website" and intent not in candidate.get("topics", set()):
                continue
            title_terms = _expanded_terms(candidate["title"])
            content_terms = _expanded_terms(candidate["text"])
            topic_bonus = 4 * len(expanded_terms & candidate.get("topics", set()))
            question_match = max(
                (
                    len(terms & _expanded_terms(variant))
                    for variant in candidate.get("question_variants", [])
                ),
                default=0,
            )
            keyword_match = len(terms & _expanded_terms(" ".join(candidate.get("keywords", []))))
            score = (
                len(expanded_terms & content_terms)
                + 2 * len(expanded_terms & title_terms)
                + topic_bonus
                + 6 * question_match
                + 3 * keyword_match
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
        answer = _build_ai_answer(retrieval_question, results)
        public_base = getattr(settings, "PUBLIC_SITE_URL", "https://theceoinfluencers.com").rstrip("/")
        image_requested = bool(terms & {"image", "picture", "photo", "thumbnail", "cover"})
        source_data = []
        for _, candidate in results:
            source = {"title": candidate["title"], "type": candidate["kind"]}
            for key in ("url", "download_url", "image_url"):
                value = candidate.get(key)
                if value:
                    if value.startswith("/"):
                        if key == "url":
                            value = f"{public_base}/theceo{value}" if value.startswith("/case-studies/") or value.startswith("/blog/") or value.startswith("/ebook-detail/") else f"{public_base}{value}"
                        else:
                            value = f"{public_base}{value}"
                    source[key] = value
            source_data.append(source)
        return Response({
            "answer": answer,
            "sources": source_data,
            "image_requested": image_requested,
        })


class PublicSiteFeatureSettingsView(APIView):
    """Expose only public feature visibility flags."""

    permission_classes = [AllowAny]

    def get(self, request):
        feature_settings = SiteFeatureSettings.load()
        return Response({"chatbot_enabled": feature_settings.chatbot_enabled})


class AdminSiteFeatureSettingsView(APIView):
    """Allow administrators to update public feature visibility."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        feature_settings = SiteFeatureSettings.load()
        return Response({"chatbot_enabled": feature_settings.chatbot_enabled})

    def patch(self, request):
        enabled = request.data.get("chatbot_enabled")
        if not isinstance(enabled, bool):
            return Response(
                {"chatbot_enabled": ["Must be a boolean value."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feature_settings = SiteFeatureSettings.load()
        feature_settings.chatbot_enabled = enabled
        feature_settings.save(update_fields=["chatbot_enabled", "updated_at"])
        return Response({"chatbot_enabled": feature_settings.chatbot_enabled})


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
