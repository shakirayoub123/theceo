from rest_framework import serializers
from .models import Service, Chapter, Asset, ChapterFile
from django.contrib.auth import get_user_model

User = get_user_model()


class TrainerSerializer(serializers.ModelSerializer):
    """Simple serializer for listing trainers with id and name"""

    name = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ["id", "name"]


class ChapterAdminSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, allow_blank=True)
    week = serializers.IntegerField(required=False, default=1)
    title = serializers.CharField(required=True, max_length=255)
    shortDescription = serializers.CharField(
        source="short_description",
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    # Using SerializerMethodField instead of DateField to avoid timezone issues with date objects
    uploadDate = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    isExpanded = serializers.BooleanField(
        source="is_expanded", default=False, required=False
    )
    videoUrl = serializers.SerializerMethodField()
    video = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    existingVideoUrl = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, write_only=True
    )
    existingChapterFiles = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Chapter
        fields = [
            "id",
            "week",
            "title",
            "shortDescription",
            "description",
            "uploadDate",
            "files",
            "isExpanded",
            "video",
            "videoUrl",
            "existingVideoUrl",
            "existingChapterFiles",
        ]

    def get_videoUrl(self, obj):
        """Return the video URL if available."""
        if hasattr(obj, "video") and obj.video:
            return obj.video.url
        return None

    def get_uploadDate(self, obj):
        """
        Return the upload_date as a string in ISO format to avoid timezone issues.
        """
        if obj.upload_date:
            return obj.upload_date.isoformat()

    def get_files(self, obj):
        """Return the files associated with this chapter."""
        files_data = []
        # Get files from ChapterFile model
        for file in obj.chapter_files.all():
            files_data.append(
                {
                    "id": str(file.id),
                    "title": file.title,
                    "description": file.description,
                    "fileUrl": file.file.url if file.file else None,
                    "fileType": file.file_type,
                    "fileSize": file.file_size,
                    "fileExtension": file.file_extension,
                    "isDownloadable": file.is_downloadable,
                    "downloadCount": file.download_count,
                    "order": file.order,
                    "createdAt": (
                        file.created_at.isoformat() if file.created_at else None
                    ),
                }
            )

        # Also get files from Asset model
        for asset in obj.assets.all():
            files_data.append(
                {
                    "id": str(asset.id),
                    "title": asset.name,
                    "description": "",  # Asset model might not have description
                    "fileUrl": (
                        asset.file.url
                        if hasattr(asset, "file") and asset.file
                        else None
                    ),
                    "fileType": getattr(asset, "asset_type", "document"),
                    "fileSize": getattr(asset, "file_size", 0),
                    "fileExtension": "",  # Asset model might not have extension
                    "isDownloadable": True,  # Default to True
                    "downloadCount": 0,  # Asset model might not track downloads
                    "order": 0,  # Asset model might not have order
                    "createdAt": (
                        asset.created_at.isoformat()
                        if hasattr(asset, "created_at") and asset.created_at
                        else None
                    ),
                    "isAsset": True,
                }
            )

        # Add chapter's video if available
        if hasattr(obj, "video") and obj.video:
            # Get the file extension
            filename = obj.video.name
            file_extension = filename.split(".")[-1] if "." in filename else ""

            # Estimate file size if available
            try:
                file_size = obj.video.size
            except:
                file_size = 0

            # Add video as a file in the list
            files_data.append(
                {
                    "id": f"video_{obj.id}",  # Unique identifier for the video
                    "title": f"{obj.title} - Video",  # Use chapter title in the video name
                    "description": "Chapter video",
                    "fileUrl": obj.video.url,
                    "fileType": "video",
                    "fileSize": file_size,
                    "fileExtension": file_extension,
                    "isDownloadable": True,
                    "downloadCount": 0,
                    "order": 0,  # Place it first
                    "createdAt": obj.created_at.isoformat() if obj.created_at else None,
                    "isChapterVideo": True,  # Flag to indicate it's the chapter's main video
                }
            )

        return files_data


class ServiceAdminSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True, max_length=255)
    shortDescription = serializers.CharField(
        source="short_description", required=False, allow_blank=True
    )
    description = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False)
    comingSoon = serializers.BooleanField(
        source="coming_soon", required=False, default=False
    )
    assignedAdvisors = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    aiChatbotEnabled = serializers.BooleanField(
        source="ai_chatbot_enabled", default=False, required=False
    )
    chapters = ChapterAdminSerializer(many=True, required=False)
    featuredImage = serializers.ImageField(source="featured_image", required=False)
    introVideo = serializers.FileField(
        source="intro_video", required=False, allow_null=True
    )
    files = serializers.ListField(child=serializers.FileField(), required=False)

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "shortDescription",
            "description",
            "aiChatbotEnabled",
            "chapters",
            "featuredImage",
            "introVideo",
            "files",
            "status",
            "order",
            "comingSoon",
        ]

    def validate_introVideo(self, value):
        if value:
            from .file_validators import validate_uploaded_file
            from django.conf import settings

            max_intro_video_size = 100 * 1024 * 1024  # 100 MB
            if value.size > max_intro_video_size:
                raise serializers.ValidationError(
                    "Intro video must be 100MB or less."
                )

            try:
                check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
                result = validate_uploaded_file(
                    value, file_type="video", check_content=check_content
                )
                if getattr(settings, "SANITIZE_FILE_NAMES", True):
                    value.name = result["sanitized_filename"]
            except Exception as e:
                raise serializers.ValidationError(str(e))

        return value

    def create(self, validated_data):
        chapters_data = validated_data.pop("chapters", [])
        files = validated_data.pop("files", [])

        # Extract assigned advisors IDs
        advisors_ids = validated_data.pop("assignedAdvisors", [])

        # Create service
        service = Service.objects.create(**validated_data)

        # Add assigned advisors
        if advisors_ids:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            advisors = User.objects.filter(id__in=advisors_ids, role="trainer")
            service.advisors.set(advisors)

        # Create chapters
        self._process_chapters(service, chapters_data, files)

        return service

    def update(self, instance, validated_data):
        import logging

        logger = logging.getLogger(__name__)

        logger.info(f"ServiceAdminSerializer.update called for service {instance.id}")
        logger.info(f"Validated data: {validated_data}")

        chapters_data = validated_data.pop("chapters", [])
        files = validated_data.pop("files", [])

        # Extract assigned advisors IDs
        advisors_ids = validated_data.pop("assignedAdvisors", None)
        logger.info(f"Extracted advisors_ids: {advisors_ids}")

        # Update service fields
        for attr, value in validated_data.items():
            logger.info(f"Setting {attr} = {value}")
            setattr(instance, attr, value)
        instance.save()

        # Update assigned advisors if provided
        if advisors_ids is not None:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            logger.info(f"Looking for trainers with ids: {advisors_ids}")
            advisors = User.objects.filter(id__in=advisors_ids, role="trainer")
            logger.info(
                f"Found advisors: {list(advisors.values_list('id', 'username'))}"
            )
            instance.advisors.set(advisors)
            logger.info(
                f"After setting advisors: {list(instance.advisors.values_list('id', 'username'))}"
            )

        # Update chapters - optionally remove existing ones first
        if chapters_data:
            instance.chapters.all().delete()
            self._process_chapters(instance, chapters_data, files)

        return instance

    def _process_chapters(self, service, chapters_data, files=None):
        """Process chapters and their associated files"""
        if not chapters_data:
            return

        request = self.context.get("request")
        request_files = getattr(request, "FILES", None)

        for index, chapter_data in enumerate(chapters_data):
            chapter_files = chapter_data.pop("files", [])
            chapter_data.pop("video", None)
            existing_video_url = chapter_data.pop("existingVideoUrl", None)
            existing_chapter_files = chapter_data.pop("existingChapterFiles", [])
            chapter_data.pop("uploadDate", None)

            chapter = Chapter.objects.create(service=service, order=index, **chapter_data)

            if request_files:
                chapter_video_file = request_files.get(f"chapters[{index}][video]")
                if chapter_video_file:
                    chapter.video = chapter_video_file
                    chapter.save(update_fields=["video"])
                elif existing_video_url:
                    existing_video_name = self._normalize_media_name(existing_video_url)
                    if existing_video_name:
                        chapter.video = existing_video_name
                        chapter.save(update_fields=["video"])

            # Process files for this chapter if any
            for file_info in chapter_files:
                if isinstance(file_info, dict) and "id" in file_info:
                    # Handle existing file reference
                    try:
                        asset = Asset.objects.get(id=file_info["id"])
                        asset.chapter = chapter
                        asset.save()
                    except Asset.DoesNotExist:
                        pass

            chapter_file_uploads = []
            if request_files:
                chapter_file_prefix = f"chapters[{index}][files]["
                for key in request_files:
                    if key.startswith(chapter_file_prefix):
                        chapter_file_uploads.append((key, request_files.get(key)))
                chapter_file_uploads.sort(key=lambda item: item[0])

            chapter_file_uploads = [
                uploaded_file
                for _, uploaded_file in chapter_file_uploads
                if uploaded_file is not None
            ]
            for file_order, chapter_file_upload in enumerate(chapter_file_uploads):
                ChapterFile.objects.create(
                    chapter=chapter,
                    title=chapter_file_upload.name,
                    file=chapter_file_upload,
                    file_type=self._determine_file_type(chapter_file_upload.name),
                    order=file_order,
                )

            for file_order, existing_file in enumerate(
                existing_chapter_files, start=len(chapter_file_uploads)
            ):
                existing_file_name = self._normalize_media_name(
                    existing_file.get("fileUrl")
                )
                if existing_file_name:
                    ChapterFile.objects.create(
                        chapter=chapter,
                        title=existing_file.get("title") or chapter.title,
                        file=existing_file_name,
                        file_type=self._determine_file_type(existing_file_name),
                        order=file_order,
                    )

    def _determine_asset_type(self, filename):
        """Determine the asset type based on file extension"""
        lowercase_name = filename.lower()
        if any(ext in lowercase_name for ext in [".mp4", ".mov", ".avi", ".wmv"]):
            return "video"
        elif any(ext in lowercase_name for ext in [".jpg", ".jpeg", ".png", ".gif"]):
            return "image"
        else:
            return "document"

    def _determine_file_type(self, filename):
        lowercase_name = filename.lower()
        if any(
            lowercase_name.endswith(ext)
            for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
        ):
            return "image"
        if any(lowercase_name.endswith(ext) for ext in [".mp4", ".mov", ".avi", ".wmv"]):
            return "video"
        if any(lowercase_name.endswith(ext) for ext in [".mp3", ".wav", ".aac"]):
            return "audio"
        if any(lowercase_name.endswith(ext) for ext in [".xls", ".xlsx", ".csv"]):
            return "spreadsheet"
        if any(lowercase_name.endswith(ext) for ext in [".ppt", ".pptx"]):
            return "presentation"
        return "document"

    def _normalize_media_name(self, file_url):
        if not file_url:
            return None
        if "/media/" in file_url:
            return file_url.split("/media/", 1)[1]
        return file_url.lstrip("/")


class ServiceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing services"""

    shortDescription = serializers.CharField(source="short_description")
    aiChatbotEnabled = serializers.BooleanField(source="ai_chatbot_enabled")
    chaptersCount = serializers.SerializerMethodField()
    featuredImage = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "shortDescription",
            "status",
            "aiChatbotEnabled",
            "chaptersCount",
            "featuredImage",
            "created_at",
        ]

    def get_chaptersCount(self, obj):
        return obj.chapters.count()

    def get_featuredImage(self, obj):
        if obj.featured_image:
            return obj.featured_image.url
        return None


class ServiceDetailAdminSerializer(ServiceAdminSerializer):
    """Extended serializer for retrieving service details"""

    chapters = ChapterAdminSerializer(many=True, read_only=True)
    # Using SerializerMethodField instead of DateTimeField to avoid timezone issues
    createdAt = serializers.SerializerMethodField()
    updatedAt = serializers.SerializerMethodField()
    featuredImage = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    assignedAdvisors = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()

    class Meta(ServiceAdminSerializer.Meta):
        fields = ServiceAdminSerializer.Meta.fields + [
            "createdAt",
            "updatedAt",
            "files",
            "featuredImage",
            "assignedAdvisors",
            "enrollments",
        ]

    def get_createdAt(self, obj):
        """Return the created_at as a string in ISO format to avoid timezone issues."""
        if obj.created_at:
            return obj.created_at.isoformat()
        return None

    def get_updatedAt(self, obj):
        """Return the updated_at as a string in ISO format to avoid timezone issues."""
        if obj.updated_at:
            return obj.updated_at.isoformat()
        return None

    def get_assignedAdvisors(self, obj):
        """Return list of assigned advisor IDs."""
        import logging

        logger = logging.getLogger(__name__)
        advisor_ids = list(obj.advisors.values_list("id", flat=True))
        logger.info(f"Returning assignedAdvisors for service {obj.id}: {advisor_ids}")
        return advisor_ids

    def get_enrollments(self, obj):
        """Return list of enrollments with client details."""
        enrollments_data = []

        for enrollment in obj.enrollments.select_related("user").all():
            enrollments_data.append(
                {
                    "id": enrollment.id,
                    "name": enrollment.user.get_full_name() or enrollment.user.username,
                    "email": enrollment.user.email,
                    "joinedOn": enrollment.enrolled_at.isoformat()
                    if enrollment.enrolled_at
                    else None,
                    "status": "completed" if enrollment.completed else "active",
                    "completed": enrollment.completed,
                }
            )

        return enrollments_data

    def get_featuredImage(self, obj):
        """Return the featured_image URL if available."""
        if obj.featured_image:
            return obj.featured_image.url
        return None

    def get_files(self, obj):
        """Return files associated directly with the service."""
        files_data = []

        for file in obj.service_files.all():
            files_data.append(
                {
                    "id": str(file.id),
                    "title": file.title,
                    "description": file.description,
                    "fileUrl": file.file.url if file.file else None,
                    "fileType": file.file_type,
                    "fileSize": file.file_size,
                    "fileExtension": file.file_extension,
                    "isDownloadable": file.is_downloadable,
                    "downloadCount": file.download_count,
                    "order": file.order,
                    "createdAt": (
                        file.created_at.isoformat() if file.created_at else None
                    ),
                    "isServiceFile": True,  # Indicate this is a direct service file
                }
            )

        return files_data
