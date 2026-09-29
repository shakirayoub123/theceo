from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json
import logging
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Service, EbookSeries
from .admin_serializers import (
    ServiceAdminSerializer,
    ServiceListSerializer,
    ServiceDetailAdminSerializer,
    TrainerSerializer,
)
from .serializers import (
    CreateEbookSeriesSerializer,
    UpdateEbookSeriesSerializer,
)
from accounts.permissions import IsAdmin
from django.db import transaction

User = get_user_model()

logger = logging.getLogger(__name__)


class AdminServiceManageView(APIView):
    """
    API endpoint for managing services
    GET: List all services
    POST: Create a new service
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Get all services"""
        services = Service.objects.all().order_by("-created_at")
        serializer = ServiceListSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new service"""
        try:
            # Extract data
            data = self._extract_request_data(request)

            # Create a new service
            with transaction.atomic():
                serializer = ServiceAdminSerializer(
                    data=data, context={"request": request}
                )
                if serializer.is_valid():
                    # Set trainer to current user
                    service = serializer.save(trainer=request.user)
                    return Response(
                        ServiceDetailAdminSerializer(service).data,
                        status=status.HTTP_201_CREATED,
                    )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating service: {str(e)}")
            return Response(
                {"error": f"Failed to create service: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _extract_request_data(self, request):
        """Extract and process data from multipart request"""
        data = request.data.copy()

        # Log raw data
        logger.info(f"AdminServiceManageView: Raw data keys: {list(data.keys())}")
        if "assignedAdvisors" in data:
            logger.info(
                f"AdminServiceManageView: Raw assignedAdvisors data: {data['assignedAdvisors']}"
            )

        # Process chapters if provided as JSON string
        if "chapters" in data and isinstance(data["chapters"], str):
            try:
                data["chapters"] = json.loads(data["chapters"])
            except json.JSONDecodeError:
                data["chapters"] = []

        # Process assignedAdvisors if provided as JSON string
        logger.info(f"Raw data keys: {data.keys()}")
        logger.info(f"Raw advisors data: {data.get('assignedAdvisors', 'Not found')}")

        if "assignedAdvisors" in data:
            if isinstance(data["assignedAdvisors"], str):
                logger.info(f"advisors as string: {data['assignedAdvisors']}")
                try:
                    # Try parsing as JSON
                    parsed_data = json.loads(data["assignedAdvisors"])
                    logger.info(
                        f"JSON parsed: {parsed_data}, type: {type(parsed_data)}"
                    )
                    data["assignedAdvisors"] = parsed_data
                except json.JSONDecodeError as e:
                    logger.info(f"JSON parsing failed: {str(e)}")
                    # If not valid JSON, try evaluating as a Python list literal
                    try:
                        import ast

                        parsed_data = ast.literal_eval(data["assignedAdvisors"])
                        logger.info(
                            f"AST parsed: {parsed_data}, type: {type(parsed_data)}"
                        )
                        if isinstance(parsed_data, list):
                            data["assignedAdvisors"] = parsed_data
                        else:
                            data["assignedAdvisors"] = []
                    except (SyntaxError, ValueError) as e:
                        logger.info(f"AST parsing failed: {str(e)}")
                        # Try a simple string-based approach for ["value1", "value2"]
                        s = data["assignedAdvisors"].strip()
                        if s.startswith("[") and s.endswith("]"):
                            s = s[1:-1]  # Remove brackets
                            items = [
                                item.strip().strip("\"'")
                                for item in s.split(",")
                                if item.strip()
                            ]
                            logger.info(f"Manual parsing result: {items}")
                            data["assignedAdvisors"] = items
                        else:
                            data["assignedAdvisors"] = []
            elif isinstance(data["assignedAdvisors"], list):
                logger.info(f"advisors already a list: {data['assignedAdvisors']}")
            else:
                logger.info(f"advisors unknown type: {type(data['assignedAdvisors'])}")

            # Make sure all IDs are strings
            if isinstance(data["assignedAdvisors"], list):
                data["assignedAdvisors"] = [str(id) for id in data["assignedAdvisors"]]
                logger.info(f"Final advisors list: {data['assignedAdvisors']}")

        # Handle featured image
        if "featuredImage" in request.FILES:
            data["featuredImage"] = request.FILES["featuredImage"]

        # Handle multiple files
        files = []
        for key in request.FILES:
            if key.startswith("files["):
                files.append(request.FILES[key])

        if files:
            data["files"] = files

        # Process aiChatbotEnabled
        if "aiChatbotEnabled" in data:
            value = data["aiChatbotEnabled"]
            if isinstance(value, str):
                data["aiChatbotEnabled"] = value.lower() == "true"

        return data


class AdminServiceDetailManageView(APIView):
    """
    API endpoint for managing specific services
    GET: Retrieve service details
    PUT: Update service
    DELETE: Delete service
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, service_id):
        """Get service details"""
        service = get_object_or_404(Service, id=service_id)
        serializer = ServiceDetailAdminSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, service_id):
        """Update service"""
        try:
            service = get_object_or_404(Service, id=service_id)
            data = AdminServiceManageView._extract_request_data(self, request)

            # Debug logging
            logger.info(f"Service {service_id} update - data received: {data}")
            logger.info(f"Original request data: {request.data}")
            if "assignedAdvisors" in data:
                logger.info(
                    f"assignedAdvisors from extracted data: {data['assignedAdvisors']}, type: {type(data['assignedAdvisors'])}"
                )

            with transaction.atomic():
                serializer = ServiceAdminSerializer(
                    service,
                    data=data,
                    partial=True,
                    context={"request": request},
                )
                if serializer.is_valid():
                    # Log validated data before saving
                    logger.info(
                        f"Validated data before save: {serializer.validated_data}"
                    )
                    service = serializer.save()
                    return Response(
                        ServiceDetailAdminSerializer(service).data,
                        status=status.HTTP_200_OK,
                    )
                logger.error(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error updating service: {str(e)}")
            return Response(
                {"error": f"Failed to update service: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, service_id):
        """Delete service"""
        try:
            service = get_object_or_404(Service, id=service_id)
            service.delete()
            return Response(
                {"message": "Service deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Exception as e:
            logger.error(f"Error deleting service: {str(e)}")
            return Response(
                {"error": f"Failed to delete service: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminTrainersView(APIView):
    """
    API endpoint for listing trainers
    GET: List all trainers with id and name
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """Get all trainers"""
        trainers = User.objects.filter(role="trainer")
        serializer = TrainerSerializer(trainers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminEbookSeriesCreateView(APIView):
    """
    API endpoint for creating a new ebook series
    POST: Create a new ebook series
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    def post(self, request):
        """Create a new ebook series"""
        try:
            serializer = CreateEbookSeriesSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                series = serializer.save()
                # Manual response formatting
                return Response(
                    {
                        "id": str(series.id),
                        "name": series.title,
                        "totalEbooksAssigned": series.ebooks.count(),
                        "createdOn": series.created_at,
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating ebook series: {str(e)}")
            return Response(
                {"error": f"Failed to create ebook series: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminEbookSeriesListView(APIView):
    """
    API endpoint for listing all ebook series
    GET: List all ebook series for admin users
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """List all ebook series"""
        try:
            # Fetch all series ordered by creation date
            series_list = EbookSeries.objects.all().order_by("-created_at")

            # Create a manual response without using the serializer directly
            result = []
            for series in series_list:
                result.append(
                    {
                        "id": str(series.id),
                        "name": series.title,
                        "totalEbooksAssigned": series.ebooks.count(),
                        "createdOn": series.created_at,
                    }
                )

            # Format the response
            return Response(
                {"totalSeries": len(result), "series": result},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error listing ebook series: {str(e)}")
            return Response(
                {"error": f"Failed to list ebook series: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminEbookSeriesUpdateView(APIView):
    """
    API endpoint for updating an ebook series
    PUT: Update an ebook series
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    def put(self, request, series_id):
        """Update an ebook series"""
        try:
            # Get the series by ID
            series = get_object_or_404(EbookSeries, id=series_id)

            # Validate and update the series
            serializer = UpdateEbookSeriesSerializer(
                series, data=request.data, partial=True
            )
            if serializer.is_valid():
                series = serializer.save()
                # Manual response formatting
                return Response(
                    {
                        "id": str(series.id),
                        "name": series.title,
                        "totalEbooksAssigned": series.ebooks.count(),
                        "createdOn": series.created_at,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error updating ebook series: {str(e)}")
            return Response(
                {"error": f"Failed to update ebook series: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
