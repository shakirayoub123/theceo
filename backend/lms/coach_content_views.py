"""Add / delete TCI programs and learning materials from the Coaching Dashboard.

Coaches (role "trainer") and admins can:
  - add a program, and delete (archive) a program -- archived programs disappear
    from the website and dashboards but keep their enrollments/payments, and can
    be restored;
  - add / delete Learning Sessions (chapters) of a program, with an optional PDF;
  - add / delete toolkit files on a Learning Session or on the program itself.

Endpoints (all under /api/lms/):
  GET    coach/programs/?status=archived        list programs (active by default)
  POST   coach/programs/                        {title, shortDescription?, description?, price?}
  DELETE coach/programs/<id>/                   archive
  POST   coach/programs/<id>/restore/           restore an archived program
  POST   coach/programs/<id>/sessions/          multipart {title, summary?, pdf?}
  DELETE coach/sessions/<id>/                 delete a Learning Session (and its files)
  POST   coach/sessions/<id>/files/           multipart {file, title?}
  DELETE coach/session-files/<id>/
  POST   coach/programs/<id>/files/             multipart {file, title?}  (program toolkit)
  DELETE coach/program-files/<id>/
"""

import logging
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .file_validators import validate_uploaded_file
from .models import Chapter, ChapterFile, Service, ServiceFile

logger = logging.getLogger(__name__)

EXTENSION_TYPES = {
    "document": {"pdf", "doc", "docx", "txt", "rtf", "odt"},
    "image": {"jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"},
    "video": {"mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"},
    "audio": {"mp3", "wav", "ogg", "aac", "m4a", "flac"},
    "spreadsheet": {"xls", "xlsx", "csv", "ods"},
    "presentation": {"ppt", "pptx", "odp"},
}


class IsCoachOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", "") in {"trainer", "admin"} or user.is_superuser)
        )


def _file_type_for(name):
    ext = name.rsplit(".", 1)[-1].lower() if "." in (name or "") else ""
    for file_type, extensions in EXTENSION_TYPES.items():
        if ext in extensions:
            return file_type
    return "other"


def _validated_upload(upload):
    """Run the project's standard upload checks; returns (file_type, error)."""
    file_type = _file_type_for(upload.name)
    try:
        result = validate_uploaded_file(
            upload,
            file_type=file_type,
            check_content=getattr(settings, "VALIDATE_FILE_CONTENT", True),
        )
    except Exception as exc:  # ValidationError or validator failure
        return file_type, str(getattr(exc, "message", None) or exc)
    if getattr(settings, "SANITIZE_FILE_NAMES", True) and result.get("sanitized_filename"):
        upload.name = result["sanitized_filename"]
    return file_type, None


def _default_title(upload):
    name = upload.name.rsplit("/", 1)[-1]
    return (name.rsplit(".", 1)[0] if "." in name else name)[:255] or "File"


def _program_data(service):
    return {
        "id": service.id,
        "title": service.title,
        "shortDescription": service.short_description or "",
        "price": str(service.price),
        "status": service.status,
        "order": service.order if hasattr(service, "order") else None,
    }


class CoachProgramsView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        wanted = request.query_params.get("status", "active")
        if wanted not in dict(Service.STATUS_CHOICES):
            wanted = "active"
        programs = Service.objects.filter(status=wanted).order_by("order", "id")
        return Response({"programs": [_program_data(s) for s in programs]})

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"error": "Program title is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(title) > 255:
            return Response({"error": "Program title is too long."}, status=status.HTTP_400_BAD_REQUEST)
        if Service.objects.filter(title__iexact=title).exclude(status="archived").exists():
            return Response(
                {"error": "A program with this title already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            price = Decimal(str(request.data.get("price") or "0"))
        except (InvalidOperation, ValueError):
            return Response({"error": "Price must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        if price < 0:
            return Response({"error": "Price cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        short_description = (request.data.get("shortDescription") or "").strip()[:500]
        description = (request.data.get("description") or "").strip() or short_description or title

        with transaction.atomic():
            next_order = (Service.objects.aggregate(m=Max("order"))["m"] or 0) + 1
            service = Service.objects.create(
                title=title,
                short_description=short_description or None,
                description=description,
                price=price,
                status="active",
                trainer=request.user,
                order=next_order,
            )
            if getattr(request.user, "role", "") == "trainer":
                service.advisors.add(request.user)
        logger.info("Program %s created by %s", service.id, request.user.id)
        return Response({"program": _program_data(service)}, status=status.HTTP_201_CREATED)


class CoachProgramDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]

    def delete(self, request, service_id):
        """Archive (soft delete): enrollments and payments are kept; admin can restore."""
        service = get_object_or_404(Service, id=service_id)
        service.status = "archived"
        service.save(update_fields=["status", "updated_at"])
        logger.info("Program %s archived by %s", service.id, request.user.id)
        return Response({"message": f"'{service.title}' was removed.", "program": _program_data(service)})


class CoachProgramRestoreView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]

    def post(self, request, service_id):
        service = get_object_or_404(Service, id=service_id)
        service.status = "active"
        service.save(update_fields=["status", "updated_at"])
        return Response({"message": f"'{service.title}' was restored.", "program": _program_data(service)})


class CoachSessionsView(APIView):
    """Add a Learning Session (chapter) to a program, with an optional PDF."""

    permission_classes = [IsAuthenticated, IsCoachOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, service_id):
        service = get_object_or_404(Service, id=service_id)
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"error": "Session title is required."}, status=status.HTTP_400_BAD_REQUEST)
        summary = (request.data.get("summary") or "").strip()
        pdf = request.FILES.get("pdf")
        if pdf is not None:
            file_type, error = _validated_upload(pdf)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            last = service.chapters.order_by("-week", "-order").first()
            chapter = Chapter.objects.create(
                service=service,
                title=title[:255],
                short_description=summary[:500] or None,
                description=summary or None,
                content=summary or "",
                week=last.week if last else 1,
                order=(last.order + 1) if last else 1,
            )
            if pdf is not None:
                ChapterFile.objects.create(
                    chapter=chapter,
                    title=f"{title[:240]} (PDF)",
                    file=pdf,
                    file_type=file_type,
                    file_size=pdf.size,
                    order=0,
                )
        return Response({"id": str(chapter.id), "title": chapter.title}, status=status.HTTP_201_CREATED)


class CoachSessionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]

    def delete(self, request, chapter_id):
        chapter = get_object_or_404(Chapter, id=chapter_id)
        title = chapter.title
        chapter.delete()
        logger.info("Learning session %s deleted by %s", chapter_id, request.user.id)
        return Response({"message": f"'{title}' was deleted."})


class CoachSessionFilesView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, chapter_id):
        chapter = get_object_or_404(Chapter, id=chapter_id)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"error": "Choose a file to upload."}, status=status.HTTP_400_BAD_REQUEST)
        file_type, error = _validated_upload(upload)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
        next_order = (chapter.chapter_files.aggregate(m=Max("order"))["m"] or 0) + 1
        file_obj = ChapterFile.objects.create(
            chapter=chapter,
            title=((request.data.get("title") or "").strip() or _default_title(upload))[:255],
            file=upload,
            file_type=file_type,
            file_size=upload.size,
            order=next_order,
        )
        return Response({"id": str(file_obj.id), "title": file_obj.title}, status=status.HTTP_201_CREATED)


class CoachSessionFileDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]

    def delete(self, request, file_id):
        file_obj = get_object_or_404(ChapterFile, id=file_id)
        title = file_obj.title
        file_obj.delete()
        return Response({"message": f"'{title}' was deleted."})


class CoachProgramFilesView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, service_id):
        service = get_object_or_404(Service, id=service_id)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"error": "Choose a file to upload."}, status=status.HTTP_400_BAD_REQUEST)
        file_type, error = _validated_upload(upload)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
        next_order = (service.service_files.aggregate(m=Max("order"))["m"] or 0) + 1
        file_obj = ServiceFile.objects.create(
            service=service,
            title=((request.data.get("title") or "").strip() or _default_title(upload))[:255],
            file=upload,
            file_type=file_type,
            file_size=upload.size,
            order=next_order,
        )
        return Response({"id": str(file_obj.id), "title": file_obj.title}, status=status.HTTP_201_CREATED)


class CoachProgramFileDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCoachOrAdmin]

    def delete(self, request, file_id):
        file_obj = get_object_or_404(ServiceFile, id=file_id)
        title = file_obj.title
        file_obj.delete()
        return Response({"message": f"'{title}' was deleted."})
