from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.http import FileResponse
from django.core.mail import send_mail
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
import logging
import mimetypes
from datetime import datetime, timedelta
from comms.models import Notification
from comms.utils import send_ops_email
from tci_backend import settings
from .admin_serializers import ServiceDetailAdminSerializer
from .models import (
    Service,
    Chapter,
    ChapterFile,
    ServiceFile,
    Ebook,
    EbookPurchase,
    EbookSeries,
    Blog,
    Newsletter,
    Referral,
    Cart,
    CartItem,
    Enrollment,
    Progress,
)
from scheduling.models import (
    Meeting,
    MeetingType,
    MeetingAttendee,
    Appointment as SchedulingAppointment,
)
from .serializers import (
    AdminServicesResponseSerializer,
    ServiceCreateUpdateSerializer,
    AdminEbooksResponseSerializer,
    AddEbookSerializer,
    EbookPurchaseHistorySerializer,
    AdminBlogsResponseSerializer,
    AddBlogSerializer,
    EditBlogSerializer,
    AdminBlogDetailSerializer,
    AdminNewslettersResponseSerializer,
    AddNewsletterSerializer,
    EditNewsletterSerializer,
    AdminNewsletterDetailSerializer,
    AdminReferralsResponseSerializer,
    ClientEbookSerializer,
    CartSerializer,
    ClientBlogSerializer,
    ClientBlogDetailSerializer,
    ClientNewsletterSerializer,
    ClientNewsletterDetailSerializer,
    ScheduleAppointmentSerializer,
)
from .download_security import (
    user_has_ebook_access,
    user_has_newsletter_access,
    validate_public_ebook_cover_view_token,
    validate_public_newsletter_thumbnail_view_token,
    validate_public_newsletter_view_token,
    validate_signed_download_token,
)
from accounts.permissions import IsAdmin, IsSales

User = get_user_model()

# Set up logger
logger = logging.getLogger(__name__)


class AdminClientsView(APIView):
    """GET /api/lms/admin/clients/ - Get admin overview of all clients"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from people.models import Client

        # Get total clients count
        total_clients = Client.objects.count()

        # Get active clients (logged in within last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        active_clients = Client.objects.filter(
            user__last_login__gte=thirty_days_ago
        ).count()

        # Get clients awaiting purchase (program_status = "unpaid")
        clients_awaiting_purchase = Client.objects.filter(
            program_status="unpaid"
        ).count()

        # Get all clients with their details
        clients = (
            Client.objects.select_related("user", "assigned_sales")
            .prefetch_related("user__enrollments__service")
            .order_by("-created_at")
        )

        clients_data = []
        for client in clients:
            # Get enrolled programs
            enrollments = client.user.enrollments.select_related("service").all()
            programs_enrolled = [
                {"id": str(enrollment.service.id), "name": enrollment.service.title}
                for enrollment in enrollments
            ]

            clients_data.append(
                {
                    "id": str(client.user.id),
                    "clientName": client.full_name,
                    "programsEnrolled": programs_enrolled,
                    "status": client.program_status,
                    "lastLogIn": (
                        client.user.last_login.isoformat()
                        if client.user.last_login
                        else None
                    ),
                }
            )

        response_data = {
            "totalClients": total_clients,
            "activeClients": active_clients,
            "clientsAwaitingPurchase": clients_awaiting_purchase,
            "clients": clients_data,
        }

        response = Response(response_data, status=status.HTTP_200_OK)
        # Response contains short-lived signed media links.
        response["Cache-Control"] = "no-store, max-age=0"
        return response


class AdminServicesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Get service statistics
        total_services = Service.objects.count()
        active_services = Service.objects.filter(status="active").count()
        archived_services = Service.objects.filter(status="archived").count()

        # Get all services with related data
        services = (
            Service.objects.prefetch_related(
                "advisors",
                "enrollments",
                "chapters__chapter_files",
            )
            .order_by("order")
        )

        # Prepare response data
        response_data = {
            "totalServices": total_services,
            "activeServices": active_services,
            "archivedServices": archived_services,
            "services": services,
        }

        serializer = AdminServicesResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminServiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, service_uuid):
        # Get the service by UUID
        service = get_object_or_404(Service, id=service_uuid)

        # Prefetch related data for performance
        service = Service.objects.prefetch_related(
            "advisors",
            "chapters__chapter_files",
            "chapters__assets",
            "enrollments__user",
        ).get(id=service_uuid)

        # Use ServiceDetailAdminSerializer from admin_serializers.py
        serializer = ServiceDetailAdminSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EditServiceView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, service_uuid):
        # Get the service
        service = get_object_or_404(Service, id=service_uuid)

        # Log request details for debugging
        import logging

        logger = logging.getLogger(__name__)
        logger.info("=== EditServiceView PUT request started ===")
        logger.info(f"Request content type: {request.content_type}")
        logger.info(
            f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}"
        )

        # Log each key-value pair in request data for thorough debugging
        if hasattr(request.data, "keys"):
            logger.info("=== Request data details ===")
            for key in request.data.keys():
                value = request.data.get(key)
                logger.info(f"Key: {key}, Value: {value}, Type: {type(value)}")

                # Special logging for form data we're having issues with
                if key == "assignedAdvisors":
                    logger.info(f"assignedAdvisors raw value: {repr(value)}")

            logger.info("=== End request data details ===")

        # Log FILES data
        if request.FILES:
            files_info = {}
            for key, file_obj in request.FILES.items():
                files_info[key] = {
                    "name": file_obj.name,
                    "size": file_obj.size,
                    "content_type": getattr(file_obj, "content_type", "unknown"),
                }
            logger.info(f"Request FILES info: {files_info}")

        # Handle assignedAdvisors field (convert to advisorIds)
        if "assignedAdvisors" in request.data:
            try:
                import json

                assigned_advisors = request.data.get("assignedAdvisors")
                logger.info(
                    f"assignedAdvisors found: {assigned_advisors}, type: {type(assigned_advisors)}"
                )

                advisor_ids = []

                # Handle different input formats
                if isinstance(assigned_advisors, str):
                    # Log the exact string for debugging
                    logger.info(
                        f"assignedAdvisors string (raw): {repr(assigned_advisors)}"
                    )

                    # Try parsing as JSON first
                    try:
                        parsed_advisors = json.loads(assigned_advisors)
                        logger.info(
                            f"Successfully parsed JSON as: {parsed_advisors}, type: {type(parsed_advisors)}"
                        )

                        if isinstance(parsed_advisors, list):
                            # It's a JSON array like [3,6]
                            for advisor_id in parsed_advisors:
                                try:
                                    advisor_ids.append(int(advisor_id))
                                except (ValueError, TypeError):
                                    logger.warning(
                                        f"Could not convert advisor ID to integer: {advisor_id}"
                                    )
                        elif isinstance(parsed_advisors, (int, str)):
                            # It's a single value in JSON format
                            try:
                                advisor_ids.append(int(parsed_advisors))
                            except (ValueError, TypeError):
                                logger.warning(
                                    f"Could not convert single JSON value to integer: {parsed_advisors}"
                                )
                        else:
                            logger.warning(
                                f"Unexpected JSON structure: {parsed_advisors}"
                            )
                    except json.JSONDecodeError:
                        # Not valid JSON, try string parsing
                        logger.info(
                            f"Not valid JSON, trying string parsing: {assigned_advisors}"
                        )

                        # If it contains a comma, treat as a comma-separated list
                        if "," in assigned_advisors:
                            # First clean the string
                            s = assigned_advisors.strip()

                            # Remove brackets if present
                            if s.startswith("[") and s.endswith("]"):
                                s = s[1:-1]

                            # Split by comma and process each item
                            items = [
                                item.strip() for item in s.split(",") if item.strip()
                            ]
                            logger.info(f"Split into items: {items}")

                            for item in items:
                                # Remove any quotes
                                item = item.strip().strip("\"'")
                                if item:
                                    try:
                                        advisor_ids.append(int(item))
                                        logger.info(f"Added advisor ID: {int(item)}")
                                    except (ValueError, TypeError):
                                        logger.warning(
                                            f"Could not convert item to integer: {item}"
                                        )
                        else:
                            # Single value, not in JSON format
                            s = assigned_advisors.strip().strip("\"'")
                            if s:
                                try:
                                    advisor_ids.append(int(s))
                                    logger.info(f"Added single advisor ID: {int(s)}")
                                except (ValueError, TypeError):
                                    logger.warning(
                                        f"Could not convert single value to integer: {s}"
                                    )
                elif isinstance(assigned_advisors, list):
                    # It's already a list, try to convert each item to int
                    logger.info(
                        f"assignedAdvisors is already a list with {len(assigned_advisors)} items"
                    )
                    for advisor_id in assigned_advisors:
                        try:
                            advisor_ids.append(int(advisor_id))
                            logger.info(
                                f"Added advisor ID from list: {int(advisor_id)}"
                            )
                        except (ValueError, TypeError):
                            logger.warning(
                                f"Could not convert advisor ID to integer from list: {advisor_id}"
                            )
                elif isinstance(assigned_advisors, int):
                    # It's a single integer
                    advisor_ids.append(assigned_advisors)
                    logger.info(f"Added single integer advisor ID: {assigned_advisors}")
                else:
                    logger.warning(
                        f"Unhandled assignedAdvisors type: {type(assigned_advisors)}"
                    )

                logger.info(f"Final parsed advisor_ids: {advisor_ids}")

                # Set the processed list in request data
                if advisor_ids:
                    logger.info(f"Final advisor IDs: {advisor_ids}")
                    try:
                        request.data._mutable = True
                    except AttributeError:
                        logger.warning(
                            "Request data is not mutable, creating new QueryDict"
                        )
                        from django.http import QueryDict

                        # Copy existing data to a new QueryDict
                        new_data = QueryDict("", mutable=True)
                        for key, value in request.data.items():
                            new_data[key] = value
                        request.data = new_data

                    request.data["advisorIds"] = advisor_ids

                    try:
                        request.data._mutable = False
                    except AttributeError:
                        pass  # No need to set immutable if we're using a dict
                else:
                    logger.warning("No valid advisor IDs found")
            except Exception as e:
                logger.error(f"Error processing assignedAdvisors: {e}")
                import traceback

                logger.error(f"Traceback: {traceback.format_exc()}")

        # Process video files for chapters with validation
        videos = {}
        for key in request.FILES:
            # Handle chapter videos with multiple possible formats:
            # "chapter[0]video", "chapters[0][video]", etc.
            if ("chapter[" in key and "]video" in key) or (
                "chapters[" in key and "][video]" in key
            ):
                try:
                    video_file = request.FILES[key]

                    # Extract chapter index from key
                    if key.startswith("chapter[") and key.endswith("]video"):
                        # Format: chapter[0]video
                        chapter_index = int(key[8:-6])
                    elif key.startswith("chapters[") and "][video]" in key:
                        # Format: chapters[0][video]
                        chapter_index = int(key[9 : key.index("][video]")])
                    else:
                        # Try a more generic approach
                        import re

                        match = re.search(r"\[(\d+)\]", key)
                        if match:
                            chapter_index = int(match.group(1))
                        else:
                            continue

                    logger.info(
                        f"Found video for chapter index {chapter_index}: {video_file.name}"
                    )
                    videos[chapter_index] = video_file
                except (ValueError, IndexError) as e:
                    logger.error(f"Error parsing chapter video key {key}: {e}")
                    continue

        # Process chapters field directly if present
        chapters_data = None
        if "chapters" in request.data:
            try:
                import json

                raw_chapters = request.data.get("chapters")
                logger.info(f"Raw chapters data type: {type(raw_chapters)}")
                logger.info(
                    f"Raw chapters data: {raw_chapters[:200] if isinstance(raw_chapters, str) else str(raw_chapters)[:200]}"
                )

                if isinstance(raw_chapters, str):
                    try:
                        chapters_data = json.loads(raw_chapters)
                        logger.info(
                            f"Parsed chapters data: {chapters_data if chapters_data else 'Empty'}"
                        )

                        # Add videos to chapters
                        if chapters_data and videos:
                            for idx, chapter in enumerate(chapters_data):
                                if idx in videos:
                                    logger.info(
                                        f"Adding video to chapter {idx}: {chapter.get('title')}"
                                    )
                                    chapter["video"] = videos[idx]
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse chapters as JSON: {e}")
                        chapters_data = []
                else:
                    chapters_data = raw_chapters
                    # Add videos to chapters if chapters_data is already a list
                    if isinstance(chapters_data, list) and videos:
                        for idx, chapter in enumerate(chapters_data):
                            if idx in videos:
                                logger.info(
                                    f"Adding video to chapter {idx}: {chapter.get('title')}"
                                )
                                chapter["video"] = videos[idx]
            except Exception as e:
                logger.error(f"Error processing chapters: {str(e)}")
                logger.error(f"Chapters processing traceback: {traceback.format_exc()}")

        # Create custom data dict with normalized advisorIds if needed
        normalized_data = {}
        for key, value in request.data.items():
            if key != "assignedAdvisors":  # Skip this as we handle it separately
                normalized_data[key] = value

        # Map front-end field name to serializer field
        if "shortDesc" not in normalized_data and "shortDescription" in normalized_data:
            normalized_data["shortDesc"] = normalized_data.pop("shortDescription")

        # If advisorIds is present from our earlier processing, include it in normalized_data
        if "advisorIds" in request.data:
            logger.info(f"Using advisorIds from request: {request.data['advisorIds']}")
            normalized_data["advisorIds"] = request.data["advisorIds"]

        # If chapters_data was processed with videos, update normalized_data
        if chapters_data is not None:
            normalized_data["chapters"] = chapters_data

        logger.info(f"Final normalized data keys: {normalized_data.keys()}")

        # Create a service object with the normalized data and pass request in context
        serializer = ServiceCreateUpdateSerializer(
            service, data=normalized_data, partial=True, context={"request": request}
        )

        # Log validation issues
        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")
            # Add more debugging for advisorIds errors
            if "advisorIds" in serializer.errors:
                logger.error(f"advisorIds error: {serializer.errors['advisorIds']}")
                logger.error(
                    f"Request advisorIds: {request.data.get('advisorIds', 'Not present')}"
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_service = serializer.save()
            return Response(
                {
                    "message": "Service updated successfully",
                    "service_id": updated_service.id,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(f"Failed to update service: {str(e)}")
            # Get full traceback
            import traceback

            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": "Failed to update service", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminEbooksView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Get ebook statistics
        total_ebooks = Ebook.objects.count()
        total_ebooks_sold = sum(ebook.total_sold for ebook in Ebook.objects.all())

        # Get all ebooks
        ebooks = Ebook.objects.all().order_by("-created_at")

        # Prepare response data
        response_data = {
            "totalEbooks": total_ebooks,
            "totalEbooksSold": total_ebooks_sold,
            "ebooks": ebooks,
        }

        serializer = AdminEbooksResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AddEbookView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]  # Specify parsers for this view

    def post(self, request):
        print("AddEbookView: Received request")
        serializer = AddEbookSerializer(data=request.data, context={"request": request})
        print("AddEbookView: Serializer created")

        if not serializer.is_valid():
            print("AddEbookView: Serializer not valid", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        print("AddEbookView: Serializer valid, saving")
        try:
            ebook = serializer.save()
            print("AddEbookView: Ebook saved", ebook.id)
            return Response(
                {
                    "message": "Ebook added successfully",
                    "ebook_id": ebook.id,
                    "title": ebook.title,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": "Failed to save ebook", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EbookPurchaseHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, ebook_uuid):
        # Get the ebook
        ebook = get_object_or_404(Ebook, id=ebook_uuid)

        # Get all purchases for this ebook
        purchases = (
            EbookPurchase.objects.filter(ebook=ebook)
            .select_related("user")
            .order_by("-purchased_at")
        )

        # Serialize the purchase history
        serializer = EbookPurchaseHistorySerializer(purchases, many=True)

        return Response(
            {
                "ebook_title": ebook.title,
                "total_purchases": purchases.count(),
                "purchase_history": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ToggleEbookStatusView(APIView):
    """PUT /api/lms/admin/ebook/toggle-status/<ebook_uuid>/ - Toggle ebook status between DRAFT and ACTIVE"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, ebook_uuid):
        # Get the ebook
        ebook = get_object_or_404(Ebook, id=ebook_uuid)

        # Toggle status between DRAFT and ACTIVE
        if ebook.status == "draft":
            ebook.status = "active"
            new_status = "ACTIVE"
        elif ebook.status == "active":
            ebook.status = "draft"
            new_status = "DRAFT"
        else:
            # Handle other statuses by defaulting to draft
            ebook.status = "draft"
            new_status = "DRAFT"

        ebook.save()

        return Response(
            {
                "message": f"Ebook status toggled to {new_status}",
                "ebook_id": str(ebook.id),
                "title": ebook.title,
                "status": ebook.status,
                "previous_status": "DRAFT" if new_status == "ACTIVE" else "ACTIVE",
            },
            status=status.HTTP_200_OK,
        )


class ToggleBlogStatusView(APIView):
    """PUT /api/lms/admin/blog/toggle-status/<blog_uuid>/ - Toggle blog status between DRAFT and PUBLISHED"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, blog_uuid):
        # Get the blog
        blog = get_object_or_404(Blog, id=blog_uuid)

        # Toggle status between DRAFT and PUBLISHED
        if blog.status == "draft":
            blog.status = "published"
            new_status = "PUBLISHED"
            # Set published_at when publishing
            if not blog.published_at:
                from django.utils import timezone

                blog.published_at = timezone.now()
        elif blog.status == "published":
            blog.status = "draft"
            new_status = "DRAFT"
            # Clear published_at when unpublishing
            blog.published_at = None
        else:
            # Handle other statuses by defaulting to draft
            blog.status = "draft"
            new_status = "DRAFT"
            blog.published_at = None

        blog.save()

        return Response(
            {
                "message": f"Blog status toggled to {new_status}",
                "blog_id": str(blog.id),
                "title": blog.title,
                "status": blog.status,
                "previous_status": (
                    "DRAFT" if new_status == "PUBLISHED" else "PUBLISHED"
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminBlogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Get blog statistics
        total_blogs_views = sum(blog.total_views for blog in Blog.objects.all())
        blogs = Blog.objects.all().order_by("-created_at")

        response_data = {
            "totalBlogsSold": total_blogs_views,  # Using views as "sold" metric
            "blogs": blogs,
        }

        serializer = AdminBlogsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AddBlogView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]  # Specify parsers for this view

    def post(self, request):
        serializer = AddBlogSerializer(data=request.data, context={"request": request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            blog = serializer.save()
            return Response(
                {
                    "message": "Blog added successfully",
                    "blog_id": blog.id,
                    "title": blog.title,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": "Failed to save blog", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EditBlogView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]  # Specify parsers for this view

    def put(self, request, blog_uuid):
        blog = get_object_or_404(Blog, id=blog_uuid)

        serializer = EditBlogSerializer(blog, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            blog = serializer.save()
            return Response(
                {
                    "message": "Blog updated successfully",
                    "blog_id": blog.id,
                    "title": blog.title,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": "Failed to update blog", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminBlogDetailView(APIView):
    """GET /api/lms/admin/blog/<blog_uuid>/ - Get comprehensive blog details for admin"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, blog_uuid):
        # Get the blog with related author data
        blog = get_object_or_404(Blog.objects.select_related("author"), id=blog_uuid)

        serializer = AdminBlogDetailSerializer(blog)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminNewslettersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Get newsletter statistics
        total_newsletters = Newsletter.objects.count()
        total_views = sum(
            newsletter.total_views for newsletter in Newsletter.objects.all()
        )
        newsletters = Newsletter.objects.all().order_by("-created_at")

        response_data = {
            "totalNewsletters": total_newsletters,
            "totalViews": total_views,
            "newsletters": newsletters,
        }

        serializer = AdminNewslettersResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AddNewsletterView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]  # Specify parsers for this view

    def post(self, request):
        logger.info("=== AddNewsletterView POST request started ===")
        logger.info(f"Request method: {request.method}")
        logger.info(
            f"Request user: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'N/A'})"
        )
        logger.info(
            f"Request user role: {request.user.role if request.user.is_authenticated else 'N/A'}"
        )
        logger.info(f"Request headers: {dict(request.headers)}")
        # Store request data to avoid multiple stream reads
        request_data = request.data
        request_files = request.FILES

        logger.info(
            f"Request data keys: {list(request_data.keys()) if request_data else 'No data'}"
        )
        logger.info(
            f"Request FILES keys: {list(request_files.keys()) if request_files else 'No files'}"
        )
        logger.info(
            f"Request.POST keys: {list(request.POST.keys()) if request.POST else 'No POST data'}"
        )
        logger.info(f"Request content type: {request.content_type}")

        # Log parser information
        logger.info(
            f"Request accepted renderer: {getattr(request, 'accepted_renderer', 'No accepted renderer')}"
        )
        logger.info(
            f"Request accepted media type: {getattr(request, 'accepted_media_type', 'No accepted media type')}"
        )
        logger.info(
            f"Request parser classes: {[parser.__class__.__name__ for parser in getattr(request, 'parsers', [])]}"
        )

        # Log the full request data (be careful with sensitive data)
        if request_data:
            safe_data = {}
            for key, value in request_data.items():
                if "password" in key.lower() or "token" in key.lower():
                    safe_data[key] = "[REDACTED]"
                else:
                    safe_data[key] = str(value)[:500]  # Truncate long values
            logger.info(f"Request data (sanitized): {safe_data}")

        # Log FILES data
        if request_files:
            files_info = {}
            for key, file_obj in request_files.items():
                files_info[key] = {
                    "name": file_obj.name,
                    "size": file_obj.size,
                    "content_type": getattr(file_obj, "content_type", "unknown"),
                }
            logger.info(f"Request FILES info: {files_info}")

        # Check if request parsing is working
        logger.info(
            f"Request parser context: {getattr(request, '_parser_context', 'No parser context')}"
        )
        logger.info(
            f"Request accepted media types: {getattr(request, 'accepted_media_type', 'No accepted media type')}"
        )

        if not request_files:
            logger.warning("No FILES found in request - this might be the issue!")

        try:
            logger.info("Creating AddNewsletterSerializer...")
            serializer = AddNewsletterSerializer(
                data=request_data, context={"request": request}
            )

            logger.info("Checking serializer validity...")
            if not serializer.is_valid():
                logger.error("=== Serializer validation failed ===")
                logger.error(f"Serializer errors: {serializer.errors}")
                logger.error(f"Validated data: {serializer.validated_data}")

                # Log field-specific errors
                for field, errors in serializer.errors.items():
                    logger.error(f"Field '{field}' errors: {errors}")

                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            logger.info("Serializer validation passed")
            logger.info(f"Validated data: {serializer.validated_data}")

            logger.info("Attempting to save newsletter...")
            newsletter = serializer.save()

            logger.info("=== Newsletter saved successfully ===")
            logger.info(f"Newsletter ID: {newsletter.id}")
            logger.info(f"Newsletter title: {newsletter.title}")
            logger.info(f"Newsletter author: {newsletter.author}")
            logger.info(f"Newsletter status: {newsletter.status}")

            success_response = {
                "message": "Newsletter added successfully",
                "newsletter_id": newsletter.id,
                "title": newsletter.title,
            }
            logger.info(f"Success response: {success_response}")

            return Response(success_response, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error("=== Exception occurred while saving newsletter ===")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception message: {str(e)}")
            logger.error(f"Exception args: {e.args}")

            # Log the full traceback
            import traceback

            logger.error(f"Full traceback: {traceback.format_exc()}")

            # Log additional context
            logger.error(
                f"Request user permissions: {request.user.get_all_permissions() if request.user.is_authenticated else 'N/A'}"
            )
            logger.error(
                f"Request user groups: {list(request.user.groups.values_list('name', flat=True)) if request.user.is_authenticated else 'N/A'}"
            )

            return Response(
                {
                    "error": "Failed to save newsletter",
                    "details": str(e),
                    "error_type": type(e).__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EditNewsletterView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]  # Specify parsers for this view

    def put(self, request, newsletter_uuid):
        newsletter = get_object_or_404(Newsletter, id=newsletter_uuid)

        serializer = EditNewsletterSerializer(
            newsletter, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            newsletter = serializer.save()
            return Response(
                {
                    "message": "Newsletter updated successfully",
                    "newsletter_id": newsletter.id,
                    "title": newsletter.title,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": "Failed to update newsletter", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ToggleNewsletterStatusView(APIView):
    """PUT /api/lms/admin/newsletter/toggle-status/<newsletter_uuid>/ - Toggle newsletter status between DRAFT and PUBLISHED"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, newsletter_uuid):
        # Get the newsletter
        newsletter = get_object_or_404(Newsletter, id=newsletter_uuid)

        # Toggle status between DRAFT and PUBLISHED
        if newsletter.status == "draft":
            newsletter.status = "published"
            new_status = "PUBLISHED"
            # Set published_at when publishing
            if not newsletter.published_at:
                from django.utils import timezone

                newsletter.published_at = timezone.now()
        elif newsletter.status == "published":
            newsletter.status = "draft"
            new_status = "DRAFT"
            # Clear published_at when unpublishing
            newsletter.published_at = None
        else:
            # Handle other statuses by defaulting to draft
            newsletter.status = "draft"
            new_status = "DRAFT"
            newsletter.published_at = None

        newsletter.save()

        return Response(
            {
                "message": f"Newsletter status toggled to {new_status}",
                "newsletter_id": str(newsletter.id),
                "title": newsletter.title,
                "status": newsletter.status,
                "previous_status": (
                    "DRAFT" if new_status == "PUBLISHED" else "PUBLISHED"
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminNewsletterDetailView(APIView):
    """GET /api/lms/admin/newsletter/<newsletter_uuid>/ - Get comprehensive newsletter details for admin"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, newsletter_uuid):
        # Get the newsletter with related author data
        newsletter = get_object_or_404(
            Newsletter.objects.select_related("author"), id=newsletter_uuid
        )

        serializer = AdminNewsletterDetailSerializer(newsletter)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminReferralsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Get referral statistics
        total_users_via_referrals = Referral.objects.filter(is_converted=True).count()
        referrals = Referral.objects.all().order_by("-created_at")

        response_data = {
            "totalUsersViaReferrals": total_users_via_referrals,
            "referrals": referrals,
        }

        serializer = AdminReferralsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminEbookSeriesView(APIView):
    """GET/POST /api/lms/admin/ebook-series/ - Manage ebook series"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        series = EbookSeries.objects.all().order_by("-created_at")
        series_data = []

        for s in series:
            series_data.append(
                {
                    "id": str(s.id),
                    "title": s.title,
                    "description": s.description,
                    "coverImage": s.cover_image.url if s.cover_image else None,
                    "ebooksCount": s.ebooks_count,
                    "createdBy": s.created_by.get_full_name(),
                    "createdAt": s.created_at.isoformat(),
                }
            )

        return Response({"series": series_data}, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get("title")
        description = request.data.get("description", "")

        if not title:
            return Response(
                {"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        series = EbookSeries.objects.create(
            title=title, description=description, created_by=request.user
        )

        return Response(
            {
                "message": "Series created successfully",
                "series_id": str(series.id),
                "title": series.title,
            },
            status=status.HTTP_201_CREATED,
        )


# Client-facing views
class EbooksListView(APIView):
    """GET /api/lms/ebooks/all/ - Get all available ebooks"""

    permission_classes = [AllowAny]

    def get(self, request):
        ebooks = Ebook.objects.filter(status="active").order_by("-created_at")
        serializer = ClientEbookSerializer(
            ebooks, many=True, context={"request": request}
        )
        return Response({"ebooks": serializer.data}, status=status.HTTP_200_OK)


class EbookSeriesView(APIView):
    """GET /api/lms/ebook/series/<series_uuid>/ - Get ebooks in a specific series"""

    permission_classes = [AllowAny]

    def get(self, request, series_uuid):
        try:
            series = EbookSeries.objects.get(id=series_uuid)
        except EbookSeries.DoesNotExist:
            return Response(
                {"error": "Series not found"}, status=status.HTTP_404_NOT_FOUND
            )

        ebooks = Ebook.objects.filter(series=series, status="active").order_by(
            "created_at"
        )
        serializer = ClientEbookSerializer(
            ebooks, many=True, context={"request": request}
        )

        series_data = {
            "series": {
                "id": str(series.id),
                "title": series.title,
                "description": series.description,
                "coverImage": series.cover_image.url if series.cover_image else None,
                "ebooksCount": series.ebooks_count,
                "createdAt": series.created_at.isoformat(),
            },
            "ebooks": serializer.data,
        }

        return Response(series_data, status=status.HTTP_200_OK)


class EbookDetailView(APIView):
    """GET /api/lms/ebook/details/<ebook_uuid>/ - Get specific ebook details"""

    permission_classes = [AllowAny]

    def get(self, request, ebook_uuid):
        try:
            ebook = Ebook.objects.get(id=ebook_uuid, status="active")
            serializer = ClientEbookSerializer(ebook, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Ebook.DoesNotExist:
            return Response(
                {"error": "Ebook not found"}, status=status.HTTP_404_NOT_FOUND
            )


class AddToCartView(APIView):
    """POST /api/lms/client/cart/add/<ebook_uuid>/ - Add ebook to cart"""

    permission_classes = [AllowAny]

    def post(self, request, ebook_uuid):
        try:
            ebook = Ebook.objects.get(id=ebook_uuid, status="active")
        except Ebook.DoesNotExist:
            return Response(
                {"error": "Ebook not found"}, status=status.HTTP_404_NOT_FOUND
            )

        cart_id = request.data.get("cart_id")

        if request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=request.user)
        else:
            if not cart_id:
                return Response(
                    {"error": "cart_id required for anonymous users"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                cart = Cart.objects.get(cart_id=cart_id)
            except Cart.DoesNotExist:
                cart = Cart.objects.create(cart_id=cart_id)

        # Check if user already purchased this ebook
        if (
            request.user.is_authenticated
            and EbookPurchase.objects.filter(ebook=ebook, user=request.user).exists()
        ):
            return Response(
                {"error": "You have already purchased this ebook"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if ebook is already in cart
        if CartItem.objects.filter(cart=cart, ebook=ebook).exists():
            return Response(
                {"error": "Ebook is already in your cart"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add ebook to cart
        CartItem.objects.create(cart=cart, ebook=ebook)

        return Response(
            {"message": "Ebook added to cart successfully"},
            status=status.HTTP_201_CREATED,
        )


class CartView(APIView):
    """GET /api/lms/client/cart/ - Get user's cart contents"""

    permission_classes = [AllowAny]

    def get(self, request):
        cart_id = request.query_params.get("cart_id")

        if request.user.is_authenticated:
            try:
                cart = Cart.objects.get(user=request.user)
            except Cart.DoesNotExist:
                return Response(
                    {"items": [], "totalItems": 0, "totalPrice": 0},
                    status=status.HTTP_200_OK,
                )
        else:
            if not cart_id:
                return Response(
                    {"error": "cart_id required for anonymous users"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                cart = Cart.objects.get(cart_id=cart_id)
            except Cart.DoesNotExist:
                return Response(
                    {"items": [], "totalItems": 0, "totalPrice": 0},
                    status=status.HTTP_200_OK,
                )

        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientBlogsView(APIView):
    """GET /api/lms/client/blogs/ - Get all published blogs"""

    permission_classes = [AllowAny]

    def get(self, request):
        blogs = Blog.objects.filter(status="published").order_by("-published_at")
        serializer = ClientBlogSerializer(blogs, many=True)
        return Response({"blogs": serializer.data}, status=status.HTTP_200_OK)


class ClientBlogDetailView(APIView):
    """GET /api/lms/client/blog/<blog_slug>/ - Get specific blog details"""

    permission_classes = [AllowAny]

    def get(self, request, blog_slug):
        try:
            blog = Blog.objects.get(slug=blog_slug, status="published")

            blog.views_count += 1
            blog.save()

            serializer = ClientBlogDetailSerializer(blog)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Blog.DoesNotExist:
            return Response(
                {"error": "Blog not found"}, status=status.HTTP_404_NOT_FOUND
            )


class ClientNewslettersView(APIView):
    """GET /api/lms/client/newsletters/ - Get all published newsletters"""

    permission_classes = [AllowAny]

    def get(self, request):
        newsletters = Newsletter.objects.filter(status="published").order_by(
            "-published_at"
        )

        # Get statistics
        total_newsletters = newsletters.count()
        total_views = sum(newsletter.total_views for newsletter in newsletters)
        total_pages = sum(newsletter.pages for newsletter in newsletters)

        # Get recent newsletters (last 30 days)
        from django.utils import timezone

        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        recent_newsletters = newsletters.filter(
            published_at__gte=thirty_days_ago
        ).count()

        serializer = ClientNewsletterSerializer(
            newsletters,
            many=True,
            context={
                "request": request,
                "allow_newsletter_file_url": True,
            },
        )

        response_data = {
            "newsletters": serializer.data,
            "statistics": {
                "totalNewsletters": total_newsletters,
                "totalViews": total_views,
                "totalPages": total_pages,
                "recentNewsletters": recent_newsletters,
                "averagePagesPerNewsletter": (
                    round(total_pages / total_newsletters, 1)
                    if total_newsletters > 0
                    else 0
                ),
                "averageViewsPerNewsletter": (
                    round(total_views / total_newsletters, 1)
                    if total_newsletters > 0
                    else 0
                ),
            },
            "metadata": {
                "lastUpdated": (
                    newsletters.first().updated_at.isoformat()
                    if newsletters.exists()
                    else None
                ),
                "oldestNewsletter": (
                    newsletters.last().published_at.isoformat()
                    if newsletters.exists()
                    else None
                ),
                "newestNewsletter": (
                    newsletters.first().published_at.isoformat()
                    if newsletters.exists()
                    else None
                ),
            },
        }

        response = Response(response_data, status=status.HTTP_200_OK)
        # Response contains short-lived signed media links.
        response["Cache-Control"] = "no-store, max-age=0"
        return response


class ClientNewsletterDetailView(APIView):
    """GET /api/lms/client/newsletter/<newsletter_uuid>/ - Get specific newsletter details"""

    permission_classes = [AllowAny]

    def get(self, request, newsletter_uuid):
        try:
            newsletter = Newsletter.objects.get(id=newsletter_uuid, status="published")

            # Increment view count
            newsletter.views_count += 1
            newsletter.save()

            serializer = ClientNewsletterDetailSerializer(
                newsletter, context={"request": request}
            )

            # Get related newsletters (same author or similar topics if available)
            related_newsletters = (
                Newsletter.objects.filter(status="published", author=newsletter.author)
                .exclude(id=newsletter.id)
                .order_by("-published_at")[:3]
            )

            related_serializer = ClientNewsletterSerializer(
                related_newsletters, many=True, context={"request": request}
            )

            response_data = {
                "newsletter": serializer.data,
                "relatedNewsletters": related_serializer.data,
                "metadata": {
                    "isNew": (timezone.now() - newsletter.published_at).days <= 7,
                    "isPopular": newsletter.views_count > 100,  # Arbitrary threshold
                    "readingTime": f"{newsletter.pages * 2} minutes",  # Rough estimate
                    "lastViewed": timezone.now().isoformat(),
                },
            }

            response = Response(response_data, status=status.HTTP_200_OK)
            # Response contains short-lived signed media links.
            response["Cache-Control"] = "no-store, max-age=0"
            return response
        except Newsletter.DoesNotExist:
            return Response(
                {"error": "Newsletter not found"}, status=status.HTTP_404_NOT_FOUND
            )


class ClientNewsletterDownloadView(APIView):
    """GET /api/lms/client/newsletters/<newsletter_id>/download/ - Signed download for newsletters"""

    permission_classes = [IsAuthenticated]

    def get(self, request, newsletter_id):
        token = request.query_params.get("token", "")
        if not token:
            return Response(
                {"error": "Missing download token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not validate_signed_download_token(
            token=token,
            user_id=request.user.id,
            resource_type="newsletter",
            resource_id=newsletter_id,
        ):
            return Response(
                {"error": "Invalid or expired download link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        newsletter = get_object_or_404(
            Newsletter,
            id=newsletter_id,
            status="published",
        )

        if not user_has_newsletter_access(request.user):
            return Response(
                {"error": "You are not authorized to download this newsletter"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not newsletter.file:
            return Response(
                {"error": "Newsletter file is not available"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = newsletter.file.name.rsplit("/", 1)[-1] or "newsletter.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            newsletter.file.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class ClientNewsletterViewFileView(APIView):
    """GET /api/lms/client/newsletters/<newsletter_id>/view/ - Signed inline view for newsletters"""

    permission_classes = [AllowAny]

    def get(self, request, newsletter_id):
        token = request.query_params.get("token", "")
        if not token:
            return Response(
                {"error": "Missing view token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not validate_public_newsletter_view_token(token=token, resource_id=newsletter_id):
            return Response(
                {"error": "Invalid or expired view link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        newsletter = get_object_or_404(
            Newsletter,
            id=newsletter_id,
            status="published",
        )

        if not newsletter.file:
            return Response(
                {"error": "Newsletter file is not available"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = newsletter.file.name.rsplit("/", 1)[-1] or "newsletter.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            newsletter.file.open("rb"),
            as_attachment=False,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class PublicEbookCoverView(APIView):
    """GET /api/lms/public/ebooks/<ebook_id>/cover/ - Signed inline cover image view"""

    permission_classes = [AllowAny]

    def get(self, request, ebook_id):
        token = request.query_params.get("token", "")
        if not token:
            return Response(
                {"error": "Missing view token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not validate_public_ebook_cover_view_token(token=token, resource_id=ebook_id):
            return Response(
                {"error": "Invalid or expired view link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        ebook = get_object_or_404(Ebook, id=ebook_id, status="active")
        if not ebook.cover_image:
            return Response(
                {"error": "Cover image is not available"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = ebook.cover_image.name.rsplit("/", 1)[-1] or "cover-image"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            ebook.cover_image.open("rb"),
            as_attachment=False,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class PublicNewsletterThumbnailView(APIView):
    """GET /api/lms/public/newsletters/<newsletter_id>/thumbnail/ - Signed inline thumbnail view"""

    permission_classes = [AllowAny]

    def get(self, request, newsletter_id):
        token = request.query_params.get("token", "")
        if not token:
            return Response(
                {"error": "Missing view token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not validate_public_newsletter_thumbnail_view_token(
            token=token, resource_id=newsletter_id
        ):
            return Response(
                {"error": "Invalid or expired view link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        newsletter = get_object_or_404(Newsletter, id=newsletter_id, status="published")
        if not newsletter.thumbnail_image:
            return Response(
                {"error": "Thumbnail image is not available"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = newsletter.thumbnail_image.name.rsplit("/", 1)[-1] or "thumbnail-image"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            newsletter.thumbnail_image.open("rb"),
            as_attachment=False,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class EbookDownloadView(APIView):
    """GET /api/lms/ebook/download/<ebook_id>/

    Simple authenticated download — no signed token required.
    Checks that the requesting user has purchased / is enrolled before
    streaming the file via Django's ``FileResponse``.
    """

    permission_classes = [IsAuthenticated]
    throttle_scope = "download"

    def get(self, request, ebook_id):
        ebook = get_object_or_404(Ebook, id=ebook_id, status="active")

        if not user_has_ebook_access(request.user, ebook):
            return Response(
                {"detail": "Purchase required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not ebook.file:
            return Response(
                {"detail": "Ebook file is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = ebook.file.name.rsplit("/", 1)[-1] or f"{ebook.title}.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            ebook.file.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class NewsletterDownloadView(APIView):
    """GET /api/lms/newsletter/download/<newsletter_id>/

    Simple authenticated download for newsletters.
    Requires the user to have newsletter access (paid ebook purchase or
    active enrollment).
    """

    permission_classes = [IsAuthenticated]
    throttle_scope = "download"

    def get(self, request, newsletter_id):
        newsletter = get_object_or_404(
            Newsletter, id=newsletter_id, status="published"
        )

        if not user_has_newsletter_access(request.user):
            return Response(
                {"detail": "Purchase required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not newsletter.file:
            return Response(
                {"detail": "Newsletter file is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = newsletter.file.name.rsplit("/", 1)[-1] or "newsletter.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            newsletter.file.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


# Define a specific serializer for the ClientProgramsView to avoid conflicts
from rest_framework import serializers


# Advisor serializer for the programs response
class AdvisorSerializer(serializers.Serializer):
    displayName = serializers.SerializerMethodField()

    def get_displayName(self, obj):
        return obj.get_full_name().strip() or obj.username


# Serializer for individual program in the response
class SimpleProgramSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()
    name = serializers.CharField(source="title")
    enrolledOn = serializers.DateTimeField(source="created_at")
    assignedAdvisors = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ["id", "name", "enrolledOn", "assignedAdvisors", "introVideo"]

    def get_assignedAdvisors(self, obj):
        # Get the advisors for this program
        advisors = obj.advisors.all()
        return AdvisorSerializer(advisors, many=True).data

    def get_introVideo(self, obj):
        if obj.intro_video:
            return obj.intro_video.url
        return None


class LandingPageProgramSerializer(serializers.ModelSerializer):
    comingSoon = serializers.BooleanField(source="coming_soon", read_only=True)
    shortDesc = serializers.CharField(source="short_description")
    thumbnailImage = serializers.CharField(source="featured_image")
    order = serializers.IntegerField(read_only=True)
    name = serializers.CharField(source="title")
    enrolledOn = serializers.DateTimeField(source="created_at")
    assignedAdvisors = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "shortDesc",
            "comingSoon",
            "thumbnailImage",
            "price",
            "duration_weeks",
            "difficulty_level",
            "category",
            "rating",
            "enrolled_clients_count",
            "order",
            "name",
            "enrolledOn",
            "assignedAdvisors",
            "introVideo",
        ]

    def get_assignedAdvisors(self, obj):
        advisors = obj.advisors.all()
        return AdvisorSerializer(advisors, many=True).data

    def get_introVideo(self, obj):
        if obj.intro_video:
            return obj.intro_video.url
        return None


class ClientProgramsListSerializer(serializers.Serializer):
    programs = LandingPageProgramSerializer(many=True)
    totalPrograms = serializers.SerializerMethodField()

    def get_totalPrograms(self, obj):
        return len(obj["programs"])


class ClientProgramsView(APIView):
    """GET /api/lms/client/programs/ - Get all available programs/services for clients

    Supports filtering by:
    - category: string (e.g., "general", "nutrition", "mindfulness", etc.)
    - difficulty: string (e.g., "beginner", "intermediate", "advanced")
    - min_price: decimal (e.g., 0.00)
    - max_price: decimal (e.g., 100.00)
    - sort_by: string (e.g., "created_at", "price", "rating", "title")
    - sort_order: string (e.g., "asc", "desc")
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # Get filter parameters
        category = request.query_params.get("category", None)
        difficulty = request.query_params.get("difficulty", None)
        min_price = request.query_params.get("min_price", None)
        max_price = request.query_params.get("max_price", None)
        sort_by = request.query_params.get("sort_by", "created_at")
        sort_order = request.query_params.get("sort_order", "desc")

        # Base queryset for active and published programs
        programs = Service.objects.filter(status="active", is_published=True)

        # Apply filters
        if category:
            programs = programs.filter(category=category)

        if difficulty:
            programs = programs.filter(difficulty_level=difficulty)

        if min_price is not None:
            try:
                min_price = float(min_price)
                programs = programs.filter(price__gte=min_price)
            except ValueError:
                # Invalid min_price format, ignore this filter
                pass

        if max_price is not None:
            try:
                max_price = float(max_price)
                programs = programs.filter(price__lte=max_price)
            except ValueError:
                # Invalid max_price format, ignore this filter
                pass

        # Apply sorting
        valid_sort_fields = {
            "created_at": "created_at",
            "price": "price",
            "rating": "rating",
            "title": "title",
            "duration": "duration_weeks",
        }

        sort_field = valid_sort_fields.get(sort_by, "created_at")

        # Determine sorting direction
        if sort_order.lower() == "asc":
            order_prefix = ""
        else:
            order_prefix = "-"

        programs = programs.prefetch_related("advisors", "chapters").order_by(
            "order", f"{order_prefix}{sort_field}"
        )

        # Prepare response data
        response_data = {"programs": programs}

        # Use the serializer defined at the module level with the correct data structure
        serializer = ClientProgramsListSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ScheduleAppointmentView(APIView):
    """POST /api/lms/client/scheduleCall/ - Schedule a call appointment"""

    permission_classes = [AllowAny]
    frontend_base_url = "https://theceoinfluencers.com"

    @staticmethod
    def _split_full_name(full_name):
        parts = (full_name or "").strip().split()
        if not parts:
            return "", ""
        return parts[0], " ".join(parts[1:])

    def _build_meeting_links(self, meeting, user):
        base_url = self.frontend_base_url.rstrip("/")
        links = {
            "login_url": f"{base_url}/login",
            "forgot_password_url": f"{base_url}/forget-password",
            "meeting_url": f"{base_url}/client/meeting/{meeting.id}",
            "direct_meeting_url": None,
        }
        try:
            links["direct_meeting_url"] = meeting.get_room_join_url(
                user, is_owner=False
            )
        except Exception:
            logger.exception(
                "Failed to generate direct Daily.co link for discovery meeting %s",
                meeting.id,
            )
        return links

    def _build_discovery_call_email(
        self,
        *,
        user,
        appointment,
        meeting,
        salesperson_name,
        salesperson_email,
        temporary_password=None,
    ):
        links = self._build_meeting_links(meeting, user)
        scheduled_for = f"{appointment.preferred_date} at {appointment.preferred_time}"
        first_name = (user.first_name or "").strip() or "there"
        join_link_text = (
            f"Direct video call link: {links['direct_meeting_url']}\n"
            if links.get("direct_meeting_url")
            else f"Meeting page: {links['meeting_url']}\n"
        )

        if temporary_password:
            subject = "Your New Account Credentials and Discovery Call Details"
            message = (
                f"Hi {first_name},\n\n"
                "Your discovery call has been scheduled and a client account is ready for you.\n\n"
                f"Your appointment is scheduled for {scheduled_for}.\n"
                f"You have been assigned to {salesperson_name} who will be your point of contact. "
                f"You can reach them at {salesperson_email}.\n\n"
                "Sign in using:\n"
                f"Username: {user.username}\n"
                f"Email: {user.email}\n"
                f"Temporary password: {temporary_password}\n"
                f"Login page: {links['login_url']}\n\n"
                "To join your video call at the scheduled time, use:\n"
                f"{join_link_text}"
                f"Client meeting page: {links['meeting_url']}\n\n"
                "Please open the meeting page at your scheduled time to join the call.\n"
                f"If you have trouble signing in, reset your password here: {links['forgot_password_url']}\n"
            )
        else:
            subject = "Your Salesperson Assignment and Discovery Call Details"
            message = (
                f"Hi {first_name},\n\n"
                f"Your appointment is scheduled for {scheduled_for}.\n"
                f"You have been assigned to {salesperson_name} who will be your point of contact. "
                f"You can reach them at {salesperson_email}.\n\n"
                f"Sign in at {links['login_url']} using your email address ({user.email}) "
                f"or username ({user.username}) and your existing password.\n\n"
                "To join your video call at the scheduled time, use:\n"
                f"{join_link_text}"
                f"Client meeting page: {links['meeting_url']}\n\n"
                "Please open the meeting page at your scheduled time to join the call.\n"
                f"If you do not remember your password, reset it here: {links['forgot_password_url']}\n"
            )

        return subject, message, links

    def post(self, request):
        serializer = ScheduleAppointmentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            normalized_email = serializer.validated_data["email"].strip().lower()
            submitted_full_name = serializer.validated_data["full_name"].strip()
            submitted_phone = serializer.validated_data["phone"]
            profile_details = {
                "address": serializer.validated_data.get("address", ""),
                "job_title": serializer.validated_data.get("job_title", ""),
                "position": serializer.validated_data.get("position", ""),
                "industry": serializer.validated_data.get("industry", ""),
                "country": serializer.validated_data.get("country", ""),
                "referred_by": serializer.validated_data.get("referred_by", ""),
            }
            first_name, last_name = self._split_full_name(submitted_full_name)
            scheduled_datetime = timezone.datetime.combine(
                serializer.validated_data["preferred_date"],
                serializer.validated_data["preferred_time"],
            )
            if timezone.is_naive(scheduled_datetime):
                scheduled_datetime = timezone.make_aware(
                    scheduled_datetime, timezone.get_current_timezone()
                )

            if scheduled_datetime <= timezone.now():
                return Response(
                    {"error": "Appointment must be scheduled in the future"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_slot = serializer.Meta.model.objects.filter(
                email__iexact=normalized_email,
                preferred_date=serializer.validated_data["preferred_date"],
                preferred_time=serializer.validated_data["preferred_time"],
                status__in=["pending", "confirmed"],
            ).exists()
            if existing_slot:
                return Response(
                    {
                        "error": "An appointment already exists for this email at the selected date and time"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if user already exists with this email
            user = None
            user_created = False
            generated_password = None
            try:
                user = User.objects.get(email__iexact=normalized_email)
                user_updates = []
                if user.email != normalized_email:
                    user.email = normalized_email
                    user_updates.append("email")
                if user.first_name != first_name:
                    user.first_name = first_name
                    user_updates.append("first_name")
                if user.last_name != last_name:
                    user.last_name = last_name
                    user_updates.append("last_name")
                # If user exists but is not a client, update their role
                if user.role != "client":
                    user.role = "client"
                    user_updates.append("role")
                if user_updates:
                    user.save(update_fields=list(dict.fromkeys(user_updates)))
            except User.DoesNotExist:
                # Create new user
                from django.utils.crypto import get_random_string

                username = serializer.validated_data["email"].split("@")[
                    0
                ] + get_random_string(4)
                while User.objects.filter(username=username).exists():
                    username = serializer.validated_data["email"].split("@")[
                        0
                    ] + get_random_string(4)

                # Generate a random strong password
                generated_password = get_random_string(
                    length=12,
                    allowed_chars="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*",
                )

                user = User.objects.create_user(
                    username=username,
                    email=normalized_email,
                    password=generated_password,
                    first_name=first_name,
                    last_name=last_name,
                    role="client",
                    is_active=True,
                )

                user_created = True

            # Assign a random salesperson to the client
            from people.models import Client
            client, _ = Client.objects.get_or_create(
                user=user,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": normalized_email,
                    "phone": submitted_phone,
                },
            )
            client.first_name = first_name
            client.last_name = last_name
            client.email = normalized_email
            client.phone = submitted_phone
            profile_update_fields = []
            for field, value in profile_details.items():
                cleaned_value = value.strip() if isinstance(value, str) else value
                if cleaned_value:
                    setattr(client, field, cleaned_value)
                    profile_update_fields.append(field)

            is_paid_client = (
                getattr(client, "program_status", None) == "paid"
                or getattr(user, "status", None) == "paid"
            )
            if not user_created and not is_paid_client:
                generated_password = user.generate_strong_password()

            # Get salesperson candidates
            sales_users = list(
                User.objects.filter(
                    role="sales", is_active=True, is_suspended=False
                )
            )
            meeting_duration = timedelta(hours=1)
            assigned_sales = None

            if sales_users:
                import random

                random.shuffle(sales_users)
                for candidate in sales_users:
                    if Meeting.find_conflict(
                        users=[candidate, user],
                        start_dt=scheduled_datetime,
                        duration=meeting_duration,
                    ):
                        continue
                    if SchedulingAppointment.find_conflict(
                        users=[candidate, user],
                        start_dt=scheduled_datetime,
                        duration=meeting_duration,
                    ):
                        continue
                    assigned_sales = candidate
                    break

                if assigned_sales is None:
                    return Response(
                        {
                            "error": "No salesperson is available at the selected date and time"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                salesperson_name = assigned_sales.get_full_name() or assigned_sales.username
                salesperson_email = assigned_sales.email
            else:
                salesperson_name = "Our Sales Team"
                salesperson_email = settings.DEFAULT_FROM_EMAIL

            # Create a meeting for the appointment
            # Get or create meeting type
            meeting_type, created = MeetingType.objects.get_or_create(
                name="Discovery Call",
                defaults={
                    "description": "Initial discovery call with a salesperson",
                    "requires_trainers": False,
                },
            )

            participants = [user]
            if assigned_sales:
                participants.append(assigned_sales)

            with transaction.atomic():
                Meeting.lock_users_for_scheduling(participants)

                if Meeting.find_conflict(
                    users=participants,
                    start_dt=scheduled_datetime,
                    duration=meeting_duration,
                ):
                    return Response(
                        {"error": "Selected time conflicts with an existing meeting"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if SchedulingAppointment.find_conflict(
                    users=participants,
                    start_dt=scheduled_datetime,
                    duration=meeting_duration,
                ):
                    return Response(
                        {"error": "Selected time conflicts with an existing appointment"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                duplicate_slot = serializer.Meta.model.objects.filter(
                    email__iexact=normalized_email,
                    preferred_date=serializer.validated_data["preferred_date"],
                    preferred_time=serializer.validated_data["preferred_time"],
                    status__in=["pending", "confirmed"],
                ).exists()
                if duplicate_slot:
                    return Response(
                        {
                            "error": "An appointment already exists for this email at the selected date and time"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                appointment = serializer.save(user=user, status="confirmed")

                client_update_fields = [
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "updated_at",
                ]
                client_update_fields.extend(profile_update_fields)

                if assigned_sales:
                    client.assigned_sales = assigned_sales
                    client.meeting_status = "scheduled"
                    client.meeting_scheduled_at = scheduled_datetime
                    client_update_fields.extend(
                        [
                            "assigned_sales",
                            "meeting_status",
                            "meeting_scheduled_at",
                        ]
                    )

                    user.sales_influencer_assigned = (
                        assigned_sales.get_full_name() or assigned_sales.username
                    )
                    user.save(update_fields=["sales_influencer_assigned"])
                else:
                    client.meeting_status = "scheduled"
                    client.meeting_scheduled_at = scheduled_datetime
                    client_update_fields.extend(
                        [
                            "meeting_status",
                            "meeting_scheduled_at",
                        ]
                    )

                client.save(update_fields=list(dict.fromkeys(client_update_fields)))

                meeting = Meeting.objects.create(
                    title=f"Discovery Call with {user.get_full_name()}",
                    meeting_type=meeting_type,
                    scheduled_by=assigned_sales or user,
                    scheduled_at=scheduled_datetime,
                    duration=meeting_duration,
                    notes=f"Discovery call appointment booked by {user.get_full_name()}",
                    status="scheduled",
                )

                attendees = [MeetingAttendee(meeting=meeting, user=user, role="client")]
                if assigned_sales:
                    attendees.append(
                        MeetingAttendee(meeting=meeting, user=assigned_sales, role="sales")
                    )

                MeetingAttendee.objects.bulk_create(attendees)

            # Ops email for appointment booking
            send_ops_email(
                subject="Appointment Booked",
                message=(
                    f"User: {user.email}\n"
                    f"Industry: {client.industry or '-'}\n"
                    f"Company: {client.position or '-'}\n"
                    f"Job title: {client.job_title or '-'}\n"
                    f"Country: {client.country or '-'}\n"
                    f"Preferred date/time: {appointment.preferred_date} {appointment.preferred_time}\n"
                    f"Salesperson: {salesperson_name} ({salesperson_email})\n"
                    f"Meeting ID: {meeting.id}\n"
                    f"Appointment ID: {appointment.id}"
                ),
            )

            subject, message, links = self._build_discovery_call_email(
                user=user,
                appointment=appointment,
                meeting=meeting,
                salesperson_name=salesperson_name,
                salesperson_email=salesperson_email,
                temporary_password=generated_password,
            )
            send_mail(
                subject=subject,
                message=message,
                recipient_list=[user.email],
                fail_silently=False,
                from_email=settings.DEFAULT_FROM_EMAIL,
            )

            return Response(
                {
                    "message": "Appointment scheduled successfully",
                    "appointment_id": str(appointment.id),
                    "meeting_id": str(meeting.id),
                    "status": appointment.status,
                    "scheduled_for": f"{appointment.preferred_date} at {appointment.preferred_time}",
                    "user_created": user_created,
                    "assigned_salesperson": {
                        "name": salesperson_name,
                        "email": salesperson_email,
                    },
                    "meeting_url": links["meeting_url"],
                    "direct_meeting_url": links["direct_meeting_url"],
                    "login_url": links["login_url"],
                    "forgot_password_url": links["forgot_password_url"],
                    "login_credentials": (
                        {
                            "email": user.email,
                            "username": user.username,
                            "temporary_password_sent": True,
                        }
                        if generated_password
                        else None
                    ),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": "Failed to schedule appointment", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RecreatePasswordView(APIView):
    """POST /api/lms/sales/recreatePassword/<user_uuid>/ - Recreate password for a lead/client"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_uuid):
        try:
            user = User.objects.get(id=user_uuid)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Generate new strong password and set it immediately (hashed)
        new_password = user.generate_strong_password()

        return Response(
            {
                "message": "Password recreated successfully",
                "user_id": str(user.id),
                "username": user.username,
                "email": user.email,
                "new_password": new_password,
                "password_set": True,
            },
            status=status.HTTP_200_OK,
        )


class SalesScheduleMeetingView(APIView):
    """POST /api/lms/sales/schedule-meeting/ - Schedule a meeting between sales and client"""

    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        """Schedule a meeting with date, time, client_id, meeting_type, notes"""
        data = request.data

        # Required fields
        required_fields = ["date", "time", "client_id", "meeting_type", "notes"]
        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            # Parse date and time
            meeting_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            meeting_time = datetime.strptime(data["time"], "%H:%M").time()
            scheduled_at = timezone.make_aware(
                timezone.datetime.combine(meeting_date, meeting_time)
            )

            # Validate that the meeting is in the future
            if scheduled_at <= timezone.now():
                return Response(
                    {"error": "Meeting must be scheduled in the future"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get client
            from people.models import Client

            try:
                client = Client.objects.get(user_id=data["client_id"])
            except Client.DoesNotExist:
                return Response(
                    {"error": "Client not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Verify that the client is assigned to this sales user
            if client.assigned_sales != request.user:
                return Response(
                    {
                        "error": "You are not authorized to schedule meetings with this client"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get or create meeting type
            meeting_type_name = data["meeting_type"]
            meeting_type, created = MeetingType.objects.get_or_create(
                name=meeting_type_name,
                defaults={
                    "description": f"Meeting type: {meeting_type_name}",
                    "requires_trainers": False,
                },
            )

            # Prevent double-booking for client or sales person
            participants = [request.user, client.user]
            meeting_duration = timedelta(hours=1)

            with transaction.atomic():
                Meeting.lock_users_for_scheduling(participants)

                conflict = Meeting.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
                    duration=meeting_duration,
                )

                if conflict:
                    return Response(
                        {
                            "error": "Selected time conflicts with an existing meeting",
                            "conflict_meeting_id": conflict.id,
                            "conflict_title": conflict.title,
                            "conflict_start": conflict.scheduled_at,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                appointment_conflict = SchedulingAppointment.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
                    duration=meeting_duration,
                )
                if appointment_conflict:
                    return Response(
                        {
                            "error": "Selected time conflicts with an existing appointment",
                            "conflict_appointment_id": appointment_conflict.id,
                            "conflict_start": appointment_conflict.scheduled_at,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create the meeting
                meeting = Meeting.objects.create(
                    title=f"Sales Meeting with {client.full_name}",
                    meeting_type=meeting_type,
                    scheduled_by=request.user,
                    scheduled_at=scheduled_at,
                    duration=meeting_duration,
                    notes=data.get("notes", ""),
                    status="scheduled",
                )

                # Keep sales dashboards in sync (new vs existing clients).
                client.meeting_status = "scheduled"
                client.meeting_scheduled_at = scheduled_at
                client.save(
                    update_fields=["meeting_status", "meeting_scheduled_at", "updated_at"]
                )

                attendees = [
                    MeetingAttendee(meeting=meeting, user=request.user, role="sales"),
                    MeetingAttendee(meeting=meeting, user=client.user, role="client"),
                ]

                MeetingAttendee.objects.bulk_create(attendees)

            # Ops email for sales meeting booking
            send_ops_email(
                subject="Sales Meeting Scheduled",
                message=(
                    f"Sales: {request.user.email}\n"
                    f"Client: {client.full_name} ({client.user.email})\n"
                    f"When: {scheduled_at}\n"
                    f"Meeting ID: {meeting.id}"
                ),
            )

            # Create notifications for all attendees
            meeting_time = meeting.scheduled_at.strftime("%I:%M %p on %B %d, %Y")

            # Notification for client
            Notification.objects.create(
                user=client.user,
                title="New Meeting Scheduled",
                message=f"Sales meeting scheduled with {request.user.get_full_name()} at {meeting_time}",
                type="meeting",
                related_id=meeting.id,
            )

            # Notification for sales user
            Notification.objects.create(
                user=request.user,
                title="New Meeting Scheduled",
                message=f"You have scheduled a meeting with {client.full_name} at {meeting_time}",
                type="meeting",
                related_id=meeting.id,
            )

            # Send invitation emails (optional - can be implemented later)
            # meeting.send_invitation_emails()

            return Response(
                {
                    "message": "Meeting scheduled successfully",
                    "meeting_id": meeting.id,
                    "scheduled_at": meeting.scheduled_at.isoformat(),
                    "client_name": client.full_name,
                    "meeting_type": meeting_type.name,
                    "duration_minutes": 60,
                    "notes": meeting.notes,
                },
                status=status.HTTP_201_CREATED,
            )

        except ValueError as e:
            return Response(
                {"error": f"Invalid date/time format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "Failed to schedule meeting", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SalesEnrollProgramView(APIView):
    """Deprecated: program enrollment is now payment-driven."""

    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        return Response(
            {
                "error": (
                    "Program enrollment is completed automatically after a "
                    "successful Stripe payment. Create and send a payment link instead."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class SalesAssignTrainerView(APIView):
    """POST /api/lms/sales/assign-trainer/ - Assign a trainer to a program"""

    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        """Assign a trainer to a program as an advisor"""
        trainer_id = request.data.get("trainer_id")
        program_id = request.data.get("program_id")

        if not trainer_id or not program_id:
            return Response(
                {"error": "trainer_id and program_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Get the trainer
            trainer = User.objects.get(id=trainer_id, role="trainer")
        except User.DoesNotExist:
            return Response(
                {"error": "Trainer not found or user is not a trainer"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            # Get the service (program)
            service = Service.objects.get(id=program_id)
        except Service.DoesNotExist:
            return Response(
                {"error": "Program not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if trainer is already assigned to this program
        if service.advisors.filter(id=trainer.id).exists():
            return Response(
                {"error": "Trainer is already assigned to this program"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if trainer is the main trainer
        if service.trainer.id == trainer.id:
            return Response(
                {"error": "Trainer is already the main trainer for this program"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add trainer as an advisor
        service.advisors.add(trainer)
        service.save()

        # Create notification for the trainer
        Notification.objects.create(
            user=trainer,
            title="Program Assignment",
            message=f"You have been assigned as an advisor to the program '{service.title}'",
            type="system",
            related_id=service.id,
        )

        # Create notification for the main trainer
        if service.trainer != trainer:
            Notification.objects.create(
                user=service.trainer,
                title="New Advisor Assigned",
                message=f"Trainer {trainer.get_full_name()} has been assigned as an advisor to your program '{service.title}'",
                type="system",
                related_id=service.id,
            )

        return Response(
            {
                "message": "Trainer successfully assigned to program",
                "trainer_name": trainer.get_full_name(),
                "program_name": service.title,
                "assignment_type": "advisor",
                "notifications_sent": 2 if service.trainer != trainer else 1,
            },
            status=status.HTTP_200_OK,
        )


class SalesProgramsView(APIView):
    """GET /api/lms/sales/programs/ - Get all programs"""

    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        """Get all programs/services"""
        # Get all services (programs) with related data
        programs = (
            Service.objects.select_related("trainer")
            .prefetch_related(
                "advisors",
                "enrollments__user",
                "chapters__chapter_files",
            )
            .order_by("order")
        )

        # Serialize the programs
        from .serializers import ServiceSerializer

        serializer = ServiceSerializer(programs, many=True)

        response_data = {
            "programs": serializer.data,
            "totalPrograms": len(serializer.data),
        }

        return Response(response_data, status=status.HTTP_200_OK)


class AdminEbookDetailView(APIView):
    """
    GET /api/lms/admin/ebook/<ebook_id>/ - Get detailed information about an ebook
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, ebook_id):
        try:
            ebook = Ebook.objects.get(id=ebook_id)

            # Create a more detailed response for admin
            response_data = {
                "id": ebook.id,
                "title": ebook.title,
                "topic": ebook.topic,
                "description": ebook.description,
                "status": ebook.status,
                "price": ebook.price,
                "coverImage": ebook.cover_image.url if ebook.cover_image else None,
                "file": ebook.file.url if ebook.file else None,
                "fileName": ebook.file.name if ebook.file else None,
                "fileSize": ebook.file.size if ebook.file else None,
                "author": ebook.author,
                "isbn": ebook.isbn,
                "pages": ebook.pages,
                "series": (
                    {
                        "id": str(ebook.series.id),
                        "name": ebook.series.title,
                    }
                    if ebook.series
                    else None
                ),
                "uploadedBy": {
                    "id": str(ebook.uploaded_by.id),
                    "name": ebook.uploaded_by.get_full_name(),
                    "email": ebook.uploaded_by.email,
                },
                "totalSold": ebook.total_sold,
                "createdAt": ebook.created_at,
                "updatedAt": ebook.updated_at,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Ebook.DoesNotExist:
            return Response(
                {"error": "Ebook not found"}, status=status.HTTP_404_NOT_FOUND
            )


class DeleteServiceFileView(APIView):
    """
    DELETE /api/lms/admin/service-file/<file_id>/ - Delete a service file and remove from server
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, file_id):
        try:
            # Try to find the file in ChapterFile first
            try:
                file_obj = ChapterFile.objects.get(id=file_id)
                file_name = file_obj.title
                # Delete the file from storage and database
                file_obj.delete()
                return Response(
                    {"message": f"Chapter file '{file_name}' deleted successfully"},
                    status=status.HTTP_200_OK,
                )
            except ChapterFile.DoesNotExist:
                pass

            # If not found in ChapterFile, try ServiceFile
            try:
                file_obj = ServiceFile.objects.get(id=file_id)
                file_name = file_obj.title
                # Delete the file from storage and database
                file_obj.delete()
                return Response(
                    {"message": f"Service file '{file_name}' deleted successfully"},
                    status=status.HTTP_200_OK,
                )
            except ServiceFile.DoesNotExist:
                return Response(
                    {"error": "File not found"}, status=status.HTTP_404_NOT_FOUND
                )

        except Exception as e:
            logger.error(f"Error deleting service file: {str(e)}")
            return Response(
                {"error": f"Failed to delete file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EditEbookView(APIView):
    """
    PUT /api/lms/admin/ebook/edit/<ebook_id>/ - Update an existing ebook
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, ebook_id):
        try:
            # Print the incoming request data for debugging
            print(f"EditEbookView PUT request data: {request.data}")
            print(f"Content-Type: {request.content_type}")

            ebook = Ebook.objects.get(id=ebook_id)

            # Extract data from request
            data = request.data.copy()

            # Process and clean up potential array/list values in form data
            for key, value in data.items():
                if isinstance(value, list) and len(value) == 1:
                    print(
                        f"Converting list value for {key}: {value} to single value: {value[0]}"
                    )
                    data[key] = value[0]

            # Process the series_id if provided (check both seriesId and seriesID formats)
            series_id = data.pop("seriesId", None) or data.pop("seriesID", None)
            print(
                f"Series ID from request: {series_id}, Type: {type(series_id)}"
            )  # Debug log

            # Check if series_id is explicitly set to null/empty or has a value
            if series_id in ["", "null", "undefined", None, 0, "0"]:
                # Clear the series relationship
                print("Clearing series relationship")
                ebook.series = None
            elif series_id:
                try:
                    # Handle case when series_id is a list
                    if isinstance(series_id, list):
                        if len(series_id) > 0:
                            series_id = series_id[0]
                        else:
                            series_id = None

                    # Convert to integer if it's a string
                    if isinstance(series_id, str) and series_id.isdigit():
                        series_id = int(series_id)

                    if series_id:
                        print(
                            f"Looking for series with ID: {series_id}, Type: {type(series_id)}"
                        )
                        series = EbookSeries.objects.get(id=series_id)
                        print(f"Found series: {series.id}, {series.title}")  # Debug log
                        ebook.series = series
                except EbookSeries.DoesNotExist:
                    print(f"Series not found with ID: {series_id}")  # Debug log
                    return Response(
                        {"error": f"Series not found with ID: {series_id}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                except ValueError as e:
                    print(f"Value error processing series ID: {str(e)}")  # Debug log
                    return Response(
                        {"error": f"Invalid series ID format: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                except TypeError as e:
                    print(f"Type error processing series ID: {str(e)}")  # Debug log
                    return Response(
                        {"error": f"Invalid series ID type: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                except Exception as e:
                    print(f"Error setting series: {str(e)}")  # Debug log
                    return Response(
                        {"error": f"Error setting series: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Handle file upload if provided
            if "file" in request.FILES:
                ebook.file = request.FILES["file"]

            # Handle cover image if provided
            if "coverImage" in request.FILES:
                ebook.cover_image = request.FILES["coverImage"]

            # Update basic fields
            if "title" in data:
                ebook.title = data["title"]

            if "topic" in data:
                ebook.topic = data["topic"]

            if "description" in data:
                ebook.description = data["description"]

            if "price" in data:
                ebook.price = data["price"]

            if "author" in data:
                ebook.author = data["author"]

            if "isbn" in data:
                ebook.isbn = data["isbn"]

            if "pages" in data:
                ebook.pages = data["pages"]

            if "status" in data:
                ebook.status = data["status"]

            # Save the changes
            ebook.save()

            # Return the updated ebook details with series information
            response_data = {
                "message": "Ebook updated successfully",
                "id": ebook.id,
                "title": ebook.title,
                "status": ebook.status,
                "updatedAt": ebook.updated_at,
            }

            # Add series information if exists
            if ebook.series:
                response_data["series"] = {
                    "id": str(ebook.series.id),
                    "name": ebook.series.title,
                }
            else:
                response_data["series"] = None

            return Response(response_data, status=status.HTTP_200_OK)

        except Ebook.DoesNotExist:
            return Response(
                {"error": "Ebook not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to update ebook: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DeleteChapterView(APIView):
    """
    DELETE /api/lms/admin/delete-chapter/<chapter_id>/ - Delete a chapter by ID
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, chapter_id):
        """Delete a chapter by its ID"""
        try:
            # Get the chapter
            chapter = get_object_or_404(Chapter, id=chapter_id)

            # Store chapter title for response
            chapter_title = chapter.title

            # Delete the chapter (this will also delete associated files due to CASCADE)
            chapter.delete()

            logger.info(
                f"Chapter '{chapter_title}' (ID: {chapter_id}) deleted successfully"
            )

            return Response(
                {"message": f"Chapter '{chapter_title}' deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )

        except Chapter.DoesNotExist:
            return Response(
                {"error": "Chapter not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error deleting chapter {chapter_id}: {str(e)}")
            return Response(
                {"error": f"Failed to delete chapter: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UpdateChapterProgressView(APIView):
    """
    PUT /api/lms/client/chapter-progress/<chapter_id>/progress/<progress>/ - Update chapter progress for authenticated user
    """

    permission_classes = [IsAuthenticated]

    def put(self, request, chapter_id, progress):
        """Update the progress percentage for a chapter for the authenticated user"""
        try:
            # Validate progress value
            try:
                progress_value = int(progress)
                if progress_value < 0 or progress_value > 100:
                    return Response(
                        {"error": "Progress must be between 0 and 100"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                return Response(
                    {
                        "error": "Invalid progress value. Must be an integer between 0 and 100"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the chapter
            chapter = get_object_or_404(Chapter, id=chapter_id)

            # Check if user is enrolled in the service that contains this chapter
            try:
                enrollment = Enrollment.objects.get(
                    user=request.user, service=chapter.service
                )
            except Enrollment.DoesNotExist:
                return Response(
                    {"error": "You are not enrolled in this program"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get or create progress record for this enrollment and chapter
            progress_record, created = Progress.objects.get_or_create(
                enrollment=enrollment,
                chapter=chapter,
                defaults={"progress_percentage": progress_value},
            )

            if not created:
                # Update existing progress
                progress_record.progress_percentage = progress_value
                progress_record.save()

            # Determine completion status based on progress
            was_completed = progress_record.completed
            is_now_completed = progress_value >= 100

            # Update completion status and timestamp if needed
            if is_now_completed and not was_completed:
                progress_record.completed = True
                progress_record.completed_at = timezone.now()
                progress_record.save()

                logger.info(
                    f"Chapter '{chapter.title}' marked as completed for user {request.user.username}"
                )

            elif not is_now_completed and was_completed:
                # Reset completion if progress goes below 100%
                progress_record.completed = False
                progress_record.completed_at = None
                progress_record.save()

                logger.info(
                    f"Chapter '{chapter.title}' completion reset for user {request.user.username}"
                )

            return Response(
                {
                    "message": "Chapter progress updated successfully",
                    "chapter_id": str(chapter.id),
                    "chapter_title": chapter.title,
                    "progress_percentage": progress_record.progress_percentage,
                    "completed": progress_record.completed,
                    "completed_at": progress_record.completed_at.isoformat()
                    if progress_record.completed_at
                    else None,
                },
                status=status.HTTP_200_OK,
            )

        except Chapter.DoesNotExist:
            return Response(
                {"error": "Chapter not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error updating chapter progress: {str(e)}")
            return Response(
                {"error": f"Failed to update chapter progress: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SitemapAPIView(APIView):
    """GET /api/lms/sitemap/ - Return sitemap data as JSON for frontend display"""

    permission_classes = [AllowAny]

    def get(self, request):
        from .sitemaps import StaticViewSitemap, EbookSitemap, BlogSitemap, ServiceSitemap, NewsletterSitemap

        sitemaps = {
            'static': StaticViewSitemap(),
            'ebooks': EbookSitemap(),
            'blogs': BlogSitemap(),
            'services': ServiceSitemap(),
            'newsletters': NewsletterSitemap(),
        }

        sitemap_data = []
        for name, sitemap in sitemaps.items():
            for item in sitemap.items():
                url = sitemap.location(item)
                lastmod = getattr(sitemap, 'lastmod', lambda obj: None)(item) if hasattr(sitemap, 'lastmod') else None
                priority = getattr(sitemap, 'priority', 0.5)
                changefreq = getattr(sitemap, 'changefreq', 'monthly')

                sitemap_data.append({
                    'url': url,
                    'lastmod': lastmod.isoformat() if lastmod else None,
                    'priority': priority,
                    'changefreq': changefreq,
                    'type': name,
                })

        return Response({'sitemap': sitemap_data}, status=status.HTTP_200_OK)
