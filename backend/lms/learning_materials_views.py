"""Learning materials for one program: its Learning Sessions and toolkits.

GET /api/lms/programs/<service_id>/learning-materials/

- Learning Session N = each Chapter of the program, in order. Its PDF is the
  session's first PDF file.
- Session toolkit = the session's other files (worksheets, templates, ...).
- Program toolkit = the program's own resource files (ServiceFile).

Access: coaches, sales and admin can see any program. A client only sees the
materials of programs they have purchased (are enrolled in, with full access);
for other programs the response is {"locked": true} with no materials.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Enrollment, Service

STAFF_ROLES = {"trainer", "sales", "admin"}


def _file_data(file_obj, request):
    url = file_obj.file.url if file_obj.file else None
    if url and request is not None and not url.startswith("http"):
        url = request.build_absolute_uri(url)
    extension = (file_obj.file_extension or "").lower()
    if not extension and file_obj.file:
        name = file_obj.file.name
        extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    return {
        "id": str(file_obj.id),
        "title": file_obj.title,
        "description": file_obj.description or "",
        "fileType": file_obj.file_type,
        "fileExtension": extension,
        "url": url,
    }


def _is_pdf(file_data):
    return file_data["fileExtension"] == "pdf" or str(file_data["url"] or "").lower().endswith(".pdf")


def build_learning_materials(service, request=None):
    sessions = []
    chapters = service.chapters.all().prefetch_related("chapter_files")  # ordered by week, order
    for number, chapter in enumerate(chapters, start=1):
        files = [_file_data(f, request) for f in chapter.chapter_files.all()]
        pdf = next((f for f in files if _is_pdf(f)), None)
        toolkits = [f for f in files if f is not pdf]
        sessions.append(
            {
                "id": chapter.id,
                "number": number,
                "title": chapter.title,
                "subtitle": chapter.subtitle or "",
                "pdf": pdf,
                "toolkits": toolkits,
            }
        )

    program_toolkits = [_file_data(f, request) for f in service.service_files.all()]
    return {
        "program": {"id": str(service.id), "title": service.title},
        "locked": False,
        "sessions": sessions,
        "programToolkits": program_toolkits,
    }


def client_can_view_program(user, service):
    """Clients only see learning materials for programs they purchased."""
    from people.models import Client

    if not Enrollment.objects.filter(user=user, service=service).exists():
        return False
    profile = Client.objects.filter(user=user).first()  # fresh, not the cached relation
    if profile is not None and not profile.has_full_dashboard_access:
        return False
    return True


class ProgramLearningMaterialsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, service_id):
        service = get_object_or_404(Service, id=service_id)
        role = getattr(request.user, "role", "")

        if role in STAFF_ROLES or request.user.is_superuser:
            return Response(build_learning_materials(service, request), status=status.HTTP_200_OK)

        if role == "client":
            if not client_can_view_program(request.user, service):
                return Response(
                    {
                        "program": {"id": str(service.id), "title": service.title},
                        "locked": True,
                        "message": "Learning materials are available after you purchase this program.",
                        "sessions": [],
                        "programToolkits": [],
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(build_learning_materials(service, request), status=status.HTTP_200_OK)

        return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
