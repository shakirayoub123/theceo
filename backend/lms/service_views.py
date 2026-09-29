from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
import json
import logging
from .models import (
    Service,
    Chapter,
    ChapterFile,
)
from .serializers import (
    EnhancedServiceSerializer,
    ServiceCreateUpdateSerializer,
    EnhancedChapterSerializer,
    ChapterFileSerializer,
    ChapterFileCreateSerializer,
)
from accounts.permissions import IsAdmin

User = get_user_model()

# Set up logger
logger = logging.getLogger(__name__)


class ServiceCreateView(APIView):
    """
    POST /api/lms/admin/service/add/ - Create a new service
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        """Create a new service with optional chapters and files"""
        try:
            # Extract data from request
            data = self._extract_request_data(request)

            # Validate service data
            serializer = ServiceCreateUpdateSerializer(
                data=data, context={"request": request}
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    # Create service and set current user as trainer
                    service = serializer.save(trainer=request.user)

                    # Return the created service
                    response_serializer = EnhancedServiceSerializer(service)
                    return Response(
                        response_serializer.data, status=status.HTTP_201_CREATED
                    )

            except Exception as e:
                logger.error(f"Error creating service: {str(e)}")
                return Response(
                    {"error": f"Failed to create service: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return Response(
                {"error": f"Request processing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _extract_request_data(self, request):
        """Extract and process data from multipart request"""
        data = request.data.copy()
        logger = logging.getLogger(__name__)

        # Process chapters if provided as JSON string
        if "chapters" in data and isinstance(data["chapters"], str):
            try:
                data["chapters"] = json.loads(data["chapters"])
            except json.JSONDecodeError:
                data["chapters"] = []

        # Handle featured image
        if "featuredImage" in request.FILES:
            data["featuredImage"] = request.FILES["featuredImage"]

        # Process boolean fields
        for boolean_field in ["aiChatbotEnabled", "isFeatured", "isPublished"]:
            if boolean_field in data:
                value = data[boolean_field]
                if isinstance(value, str):
                    data[boolean_field] = value.lower() == "true"

        # Handle advisor IDs
        if "advisorIds" in data and isinstance(data["advisorIds"], str):
            try:
                data["advisorIds"] = json.loads(data["advisorIds"])
            except json.JSONDecodeError:
                data["advisorIds"] = []

        # Handle field name variations
        if "shortDescription" in data and (
            "shortDesc" not in data or not data["shortDesc"]
        ):
            data["shortDesc"] = data["shortDescription"]

        # Ensure short_description is provided
        if (
            "shortDesc" not in data
            or data["shortDesc"] is None
            or data["shortDesc"] == ""
        ):
            # Use title or first part of description as fallback
            if "title" in data:
                data["shortDesc"] = (
                    data["title"][:495] + "..."
                    if len(data["title"]) > 498
                    else data["title"]
                )
            elif "description" in data:
                data["shortDesc"] = (
                    data["description"][:495] + "..."
                    if len(data["description"]) > 498
                    else data["description"]
                )
            else:
                data["shortDesc"] = "No description provided"

        # Process files
        if request.FILES:
            # Look for files in the request
            files = []
            videos = {}  # Dictionary to store videos by chapter index

            for key in request.FILES:
                if key == "featuredImage":
                    continue

                # Handle chapter videos - format expected: "chapter[0]video", "chapter[1]video", etc.
                if key.startswith("chapter[") and key.endswith("]video"):
                    try:
                        # Validate video file before processing
                        from .file_validators import validate_uploaded_file
                        from django.core.exceptions import ValidationError

                        video_file = request.FILES[key]
                        try:
                            check_content = getattr(
                                settings, "VALIDATE_FILE_CONTENT", True
                            )
                            validation_result = validate_uploaded_file(
                                video_file,
                                file_type="video",
                                check_content=check_content,
                            )

                            # Use sanitized filename if enabled
                            if getattr(settings, "SANITIZE_FILE_NAMES", True):
                                video_file.name = validation_result[
                                    "sanitized_filename"
                                ]

                        except ValidationError as e:
                            logger.error(f"Video validation failed for {key}: {str(e)}")
                            continue

                        # Extract chapter index from key
                        chapter_index = int(
                            key[8:-6]
                        )  # Extract the number between "chapter[" and "]video"
                        logger.info(
                            f"Found video for chapter index {chapter_index}: {video_file.name}"
                        )
                        videos[chapter_index] = video_file
                    except (ValueError, IndexError) as e:
                        logger.error(f"Error parsing chapter video key {key}: {e}")
                        continue
                elif key.startswith("chapters[") and "][video]" in key:
                    try:
                        from .file_validators import validate_uploaded_file
                        from django.core.exceptions import ValidationError

                        video_file = request.FILES[key]
                        try:
                            check_content = getattr(
                                settings, "VALIDATE_FILE_CONTENT", True
                            )
                            validation_result = validate_uploaded_file(
                                video_file,
                                file_type="video",
                                check_content=check_content,
                            )
                            if getattr(settings, "SANITIZE_FILE_NAMES", True):
                                video_file.name = validation_result[
                                    "sanitized_filename"
                                ]
                        except ValidationError as e:
                            logger.error(f"Video validation failed for {key}: {str(e)}")
                            continue

                        chapter_index = int(key[9 : key.index("][video]")])
                        logger.info(
                            f"Found video for chapter index {chapter_index}: {video_file.name}"
                        )
                        videos[chapter_index] = video_file
                    except (ValueError, IndexError) as e:
                        logger.error(f"Error parsing chapter video key {key}: {e}")
                        continue
                # Handle regular files
                elif key.startswith("files["):
                    # Validate file before adding
                    from .file_validators import validate_uploaded_file
                    from django.core.exceptions import ValidationError

                    regular_file = request.FILES[key]
                    try:
                        check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
                        validation_result = validate_uploaded_file(
                            regular_file,
                            file_type=None,  # Auto-detect
                            check_content=check_content,
                        )

                        # Use sanitized filename if enabled
                        if getattr(settings, "SANITIZE_FILE_NAMES", True):
                            regular_file.name = validation_result["sanitized_filename"]

                        files.append(
                            {
                                "file": regular_file,
                                "title": regular_file.name,
                                "description": f"File: {regular_file.name}",
                                "file_type": self._get_file_type(regular_file.name),
                            }
                        )
                    except ValidationError as e:
                        logger.error(f"File validation failed for {key}: {str(e)}")
                        continue

            # Process chapters to assign videos
            if "chapters" in data and isinstance(data["chapters"], list) and videos:
                for idx, chapter in enumerate(data["chapters"]):
                    if idx in videos:
                        logger.info(
                            f"Assigning video to chapter {idx}: {chapter.get('title')}"
                        )
                        chapter["video"] = videos[idx]

            # If we found regular files but no chapters, create a default chapter
            if files and ("chapters" not in data or not data["chapters"]):
                # Create a default chapter if none exists
                data["chapters"] = [
                    {
                        "title": "Resources",
                        "description": "Additional resources for this service",
                        "week": 1,
                        "order": 1,
                        "files": files,
                    }
                ]

        return data

    def _get_file_type(self, filename):
        """Helper to determine file type from filename"""
        extension = filename.split(".")[-1].lower() if "." in filename else ""

        if extension in ["pdf", "doc", "docx", "txt", "rtf", "odt"]:
            return "document"
        elif extension in ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"]:
            return "image"
        elif extension in ["mp4", "avi", "mov", "wmv", "flv", "webm"]:
            return "video"
        elif extension in ["mp3", "wav", "ogg", "aac", "m4a"]:
            return "audio"
        elif extension in ["xls", "xlsx", "csv", "ods"]:
            return "spreadsheet"
        elif extension in ["ppt", "pptx", "odp"]:
            return "presentation"
        else:
            return "document"


class ServiceStatusUpdateView(APIView):
    """
    POST /api/lms/admin/service/update-status/:service_id/ - Update service status
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, service_id):
        """Update the status of a service"""
        service = get_object_or_404(Service, id=service_id)

        # Get status from request body
        new_status = request.data.get("status")

        # Validate status
        valid_statuses = dict(Service.STATUS_CHOICES).keys()
        if not new_status or new_status not in valid_statuses:
            return Response(
                {
                    "error": f"Invalid status. Valid options are: {', '.join(valid_statuses)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Update service status
            service.status = new_status
            service.save(update_fields=["status", "updated_at"])

            # Return updated service
            serializer = EnhancedServiceSerializer(service)
            return Response(
                {
                    "message": f"Service status updated to '{new_status}' successfully",
                    "service": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error updating service status: {str(e)}")
            return Response(
                {"error": f"Failed to update service status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ServiceEnhancedDetailView(APIView):
    """
    GET /api/lms/services/:service_id/ - Get enhanced service details
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, service_id):
        service = get_object_or_404(Service, id=service_id)
        serializer = EnhancedServiceSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChapterFileManageView(APIView):
    """
    API endpoint for managing chapter files
    POST: Add a file to a chapter
    DELETE: Remove a file from a chapter
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, chapter_id):
        """Add a file to a chapter"""
        chapter = get_object_or_404(Chapter, id=chapter_id)

        serializer = ChapterFileCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create file and associate with chapter
            file = serializer.save(chapter=chapter)

            # Return file details
            response_serializer = ChapterFileSerializer(file)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding file to chapter: {str(e)}")
            return Response(
                {"error": f"Failed to add file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, chapter_id, file_id):
        """Remove a file from a chapter"""
        file = get_object_or_404(ChapterFile, id=file_id, chapter_id=chapter_id)

        try:
            # Delete the file
            file_name = file.title
            file.delete()

            return Response(
                {"message": f"File '{file_name}' deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )

        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return Response(
                {"error": f"Failed to delete file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChapterManageView(APIView):
    """
    API endpoint for managing chapters
    GET: List all chapters for a service
    POST: Add a new chapter to a service
    PUT: Update a chapter
    DELETE: Delete a chapter
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, service_id):
        """Get all chapters for a service"""
        service = get_object_or_404(Service, id=service_id)
        chapters = Chapter.objects.filter(service=service).order_by("week", "order")
        serializer = EnhancedChapterSerializer(chapters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, service_id):
        """Add a new chapter to a service"""
        service = get_object_or_404(Service, id=service_id)

        # Check if multipart form data contains file uploads
        has_files = bool(request.FILES)

        # Process chapter data
        serializer = EnhancedChapterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create chapter
                chapter = serializer.save(service=service)

                # Process file uploads if present
                if has_files:
                    for file_key, file_obj in request.FILES.items():
                        # Skip if not a file upload field
                        if not file_key.startswith("files["):
                            continue

                        # Extract file information from the request
                        file_title = request.data.get(
                            f"{file_key}_title", file_obj.name
                        )
                        file_type = request.data.get(f"{file_key}_type", "document")
                        file_description = request.data.get(
                            f"{file_key}_description", ""
                        )

                        # Create file record
                        ChapterFile.objects.create(
                            chapter=chapter,
                            title=file_title,
                            description=file_description,
                            file=file_obj,
                            file_type=file_type,
                            file_size=file_obj.size,
                        )

                # Return updated chapter with files
                response_serializer = EnhancedChapterSerializer(chapter)
                return Response(
                    response_serializer.data, status=status.HTTP_201_CREATED
                )

        except Exception as e:
            logger.error(f"Error adding chapter: {str(e)}")
            return Response(
                {"error": f"Failed to add chapter: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, service_id, chapter_id):
        """Update a chapter"""
        chapter = get_object_or_404(Chapter, id=chapter_id, service_id=service_id)

        serializer = EnhancedChapterSerializer(chapter, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Update chapter
            chapter = serializer.save()

            # Return updated chapter
            response_serializer = EnhancedChapterSerializer(chapter)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error updating chapter: {str(e)}")
            return Response(
                {"error": f"Failed to update chapter: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, service_id, chapter_id):
        """Delete a chapter"""
        chapter = get_object_or_404(Chapter, id=chapter_id, service_id=service_id)

        try:
            # Delete chapter
            chapter_title = chapter.title
            chapter.delete()

            return Response(
                {"message": f"Chapter '{chapter_title}' deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )

        except Exception as e:
            logger.error(f"Error deleting chapter: {str(e)}")
            return Response(
                {"error": f"Failed to delete chapter: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
