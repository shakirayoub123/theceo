from rest_framework import serializers
from os.path import basename
from django.db.models import Q
from .models import (
    Service,
    Chapter,
    ChapterFile,
    Enrollment,
    Ebook,
    EbookPurchase,
    EbookSeries,
    Blog,
    Newsletter,
    Referral,
    CartItem,
    Cart,
    Appointment,
)
from django.contrib.auth import get_user_model
from django.utils import timezone
from .download_security import (
    build_signed_download_url,
    create_public_ebook_cover_view_token,
    create_public_newsletter_thumbnail_view_token,
    create_public_newsletter_view_token,
    create_signed_download_token,
    user_has_ebook_access,
    user_has_newsletter_access,
)

User = get_user_model()


class AdvisorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class ServiceSerializer(serializers.ModelSerializer):
    enrolledClients = serializers.SerializerMethodField()
    assignedAdvisors = AdvisorSerializer(many=True, source="advisors")
    modules = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(
        source="created_at", format="%Y-%m-%d %H:%M:%S"
    )
    comingSoon = serializers.BooleanField(source="coming_soon", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "status",
            "price",
            "enrolledClients",
            "assignedAdvisors",
            "modules",
            "createdAt",
            "order",
            "comingSoon",
        ]

    def to_representation(self, instance):
        """Override to ensure consistent field names in the response"""
        data = super().to_representation(instance)
        # Make sure we consistently use assignedAdvisors
        if "advisorsAssigned" in data:
            data["assignedAdvisors"] = data.pop("advisorsAssigned")
        return data

    def get_enrolledClients(self, obj):
        return obj.enrolled_clients_count

    def get_modules(self, obj):
        """
        Return chapter/module data for dashboard program rails.
        Includes multiple title/content aliases for frontend compatibility.
        """
        return [
            {
                "id": chapter.id,
                "title": chapter.title,
                "name": chapter.title,
                "chapter_title": chapter.title,
                "subtitle": chapter.subtitle,
                "shortDescription": chapter.short_description,
                "description": chapter.description or chapter.content,
                "content": chapter.content,
                "order": chapter.order,
                "week": chapter.week,
                "files": [
                    {
                        "id": str(file.id),
                        "title": file.title,
                        "description": file.description,
                        "fileUrl": file.file.url if file.file else None,
                        "fileType": file.file_type,
                        "fileExtension": file.file_extension,
                    }
                    for file in chapter.chapter_files.all()
                ],
            }
            for chapter in obj.chapters.all()
        ]


class AdminServicesResponseSerializer(serializers.Serializer):
    totalServices = serializers.IntegerField()
    activeServices = serializers.IntegerField()
    archivedServices = serializers.IntegerField()
    services = ServiceSerializer(many=True)


class ChapterSerializer(serializers.ModelSerializer):
    weekNum = serializers.IntegerField(source="order")
    shortDescription = serializers.CharField(
        source="short_description", required=False, allow_blank=True, allow_null=True
    )
    description = serializers.CharField(source="content")
    uploadedOn = serializers.SerializerMethodField()
    videoUrl = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = [
            "weekNum",
            "title",
            "shortDescription",
            "description",
            "uploadedOn",
            "videoUrl",
        ]

    def get_uploadedOn(self, obj):
        """Return the created_at as a string in ISO format to avoid timezone issues."""
        if obj.created_at:
            return obj.created_at.isoformat()
        return None

    def get_videoUrl(self, obj):
        """Return the video URL if available."""
        if obj.video:
            return obj.video.url
        return None


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class EnrollmentSerializer(serializers.ModelSerializer):
    client = ClientSerializer(source="user")
    enrolled_at = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ["client", "enrolled_at", "completed"]

    def get_enrolled_at(self, obj):
        """Return the enrolled_at as a string in ISO format to avoid timezone issues."""
        if obj.enrolled_at:
            return obj.enrolled_at.isoformat()
        return None


class ServiceDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="title")
    shortDesc = serializers.CharField(source="short_description", required=False)
    assignedAdvisors = AdvisorSerializer(source="advisors", many=True)
    chapters = ChapterSerializer(many=True)
    enrollments = EnrollmentSerializer(many=True)
    files = serializers.SerializerMethodField()
    featuredImage = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "name",
            "shortDesc",
            "status",
            "assignedAdvisors",
            "description",
            "chapters",
            "enrollments",
            "files",
            "featuredImage",
            "introVideo",
        ]

    def get_featuredImage(self, obj):
        """Return the featured_image URL if available."""
        if obj.featured_image:
            return obj.featured_image.url
        return None

    def get_introVideo(self, obj):
        """Return the intro_video URL if available."""
        if obj.intro_video:
            return obj.intro_video.url
        return None

    def get_files(self, obj):
        """Return any files associated with the service."""
        # Collect files from all chapters and direct service files
        files_data = []

        # Get direct service files first
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

        # Return both direct service files and any chapter files
        return files_data


class ChapterFileSerializer(serializers.ModelSerializer):
    """Serializer for ChapterFile model"""

    fileUrl = serializers.SerializerMethodField()
    fileSize = serializers.SerializerMethodField()
    fileType = serializers.CharField(source="file_type")

    class Meta:
        model = ChapterFile
        fields = [
            "id",
            "title",
            "description",
            "fileUrl",
            "fileType",
            "fileSize",
            "is_downloadable",
            "file_extension",
            "order",
            "created_at",
        ]

    def get_fileUrl(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def get_fileSize(self, obj):
        return obj.file_size_display


class EnhancedChapterSerializer(serializers.ModelSerializer):
    """Serializer for Chapter model with enhanced fields"""

    files = ChapterFileSerializer(source="chapter_files", many=True, read_only=True)
    chapterType = serializers.CharField(source="chapter_type")
    durationMinutes = serializers.IntegerField(source="duration_minutes")
    isPreview = serializers.BooleanField(source="is_preview")
    isMandatory = serializers.BooleanField(source="is_mandatory")
    learningObjectives = serializers.CharField(source="learning_objectives")
    shortDescription = serializers.CharField(
        source="short_description", required=False, allow_blank=True, allow_null=True
    )
    created_at = serializers.SerializerMethodField()
    videoUrl = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = [
            "id",
            "title",
            "subtitle",
            "content",
            "description",
            "shortDescription",
            "chapterType",
            "durationMinutes",
            "week",
            "order",
            "isPreview",
            "isMandatory",
            "learningObjectives",
            "files",
            "created_at",
            "videoUrl",
            "video",
        ]
        extra_kwargs = {"video": {"write_only": True}}

    def get_created_at(self, obj):
        """Return the created_at as a string in ISO format to avoid timezone issues."""
        if obj.created_at:
            return obj.created_at.isoformat()
        return None

    def get_videoUrl(self, obj):
        """Return the video URL if available."""
        if obj.video:
            return obj.video.url
        return None


class EnhancedServiceSerializer(serializers.ModelSerializer):
    """Enhanced serializer for Service model with all fields"""

    chapters = EnhancedChapterSerializer(many=True, read_only=True)
    categoryDisplay = serializers.SerializerMethodField()
    difficultyDisplay = serializers.SerializerMethodField()
    advisors = AdvisorSerializer(many=True, read_only=True)
    featuredImageUrl = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()
    ratingDisplay = serializers.CharField(source="rating_display", read_only=True)
    tagsList = serializers.ListField(source="tags_list", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "short_description",
            "description",
            "status",
            "category",
            "categoryDisplay",
            "difficulty_level",
            "difficultyDisplay",
            "price",
            "duration_weeks",
            "ai_chatbot_enabled",
            "chatbot_prompt",
            "rating",
            "ratingDisplay",
            "tags",
            "tagsList",
            "prerequisites",
            "learning_outcomes",
            "is_featured",
            "is_published",
            "featured_image",
            "featuredImageUrl",
            "introVideo",
            "advisors",
            "chapters",
            "created_at",
            "updated_at",
        ]

    def get_categoryDisplay(self, obj):
        return dict(Service.CATEGORY_CHOICES).get(obj.category, obj.category)

    def get_difficultyDisplay(self, obj):
        return dict(Service.DIFFICULTY_CHOICES).get(
            obj.difficulty_level, obj.difficulty_level
        )

    def get_featuredImageUrl(self, obj):
        if obj.featured_image:
            return obj.featured_image.url
        return None

    def get_introVideo(self, obj):
        if obj.intro_video:
            return obj.intro_video.url
        return None


class ChapterEditSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    files = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )


class EditServiceSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    shortDesc = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField()
    assignedAdvisors = serializers.ListField(
        child=serializers.UUIDField(), required=False, allow_empty=True
    )
    chapters = serializers.ListField(
        child=ChapterEditSerializer(), required=False, allow_empty=True
    )


class ChapterFileCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading files to a chapter"""

    file = serializers.FileField()

    class Meta:
        model = ChapterFile
        fields = [
            "title",
            "description",
            "file",
            "file_type",
            "is_downloadable",
            "order",
        ]

    def validate_file(self, value):
        """Validate file size and type with enhanced security"""
        from .file_validators import validate_uploaded_file
        from django.conf import settings

        # Get expected file type from initial data
        file_type = self.initial_data.get("file_type", "document")

        try:
            # Use comprehensive file validation
            check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
            result = validate_uploaded_file(
                value, file_type=file_type, check_content=check_content
            )

            # Update filename if sanitization is enabled
            if getattr(settings, "SANITIZE_FILE_NAMES", True):
                value.name = result["sanitized_filename"]

        except Exception as e:
            raise serializers.ValidationError(str(e))

        return value


class ChapterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a chapter"""

    files = ChapterFileCreateSerializer(many=True, required=False)
    video = serializers.FileField(required=False)

    class Meta:
        model = Chapter
        fields = [
            "title",
            "subtitle",
            "content",
            "short_description",
            "chapter_type",
            "duration_minutes",
            "week",
            "order",
            "is_preview",
            "is_mandatory",
            "learning_objectives",
            "files",
            "video",
            "external_id",
            "description",
            "upload_date",
            "is_expanded",
        ]

    def validate_upload_date(self, value):
        """Handle upload_date parsing from string"""
        if isinstance(value, str):
            # Try to parse date from string like "Uploaded on 29 September 2025"
            try:
                from datetime import datetime

                # Extract date part
                if "Uploaded on" in value:
                    date_str = value.replace("Uploaded on", "").strip()
                    # Parse the date
                    parsed_date = datetime.strptime(date_str, "%d %B %Y").date()
                    return parsed_date
            except (ValueError, TypeError):
                pass
        return value or timezone.now().date()

    def validate_video(self, value):
        """Validate video file type and size with enhanced security"""
        if value:
            from .file_validators import validate_uploaded_file
            from django.conf import settings

            try:
                # Use comprehensive file validation
                check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
                result = validate_uploaded_file(
                    value, file_type="video", check_content=check_content
                )

                # Update filename if sanitization is enabled
                if getattr(settings, "SANITIZE_FILE_NAMES", True):
                    value.name = result["sanitized_filename"]

            except Exception as e:
                raise serializers.ValidationError(str(e))

        return value


class ChaptersField(serializers.Field):
    """Custom field to handle chapters data from form submissions"""

    def to_internal_value(self, data):
        """Convert form data to internal value"""
        import json
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"ChaptersField received data of type: {type(data)}")

        # Handle different input formats from multipart form data
        if isinstance(data, str):
            # Log the first part of the string for debugging
            logger.info(f"String data (first 100 chars): {data[:100]}")

            # Single JSON string
            try:
                parsed_data = json.loads(data)
                if isinstance(parsed_data, list):
                    logger.info(
                        f"Successfully parsed string as JSON list with {len(parsed_data)} items"
                    )
                    return parsed_data
                else:
                    logger.warning(
                        f"String parsed as JSON but not a list: {type(parsed_data)}"
                    )
                    return []
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"Failed to parse JSON string: {str(e)}")
                return []
        elif isinstance(data, dict):
            # Dictionary with numeric keys (e.g., {"0": "...", "1": "..."})
            logger.info(f"Dictionary data with keys: {list(data.keys())}")

            parsed_data = []
            for key in sorted(data.keys()):
                item = data[key]
                if isinstance(item, str):
                    # Parse JSON string
                    try:
                        parsed_item = json.loads(item)
                        parsed_data.append(parsed_item)
                        logger.info(f"Parsed dict item {key} successfully")
                    except (json.JSONDecodeError, TypeError) as e:
                        logger.error(f"Failed to parse dict item {key}: {str(e)}")
                        continue  # Skip invalid items
                elif isinstance(item, dict):
                    parsed_data.append(item)
                    logger.info(f"Added dict item {key} directly")
                else:
                    logger.warning(f"Skipped dict item {key} of type {type(item)}")
                    continue  # Skip invalid items
            return parsed_data
        elif isinstance(data, list):
            # List of items (possibly strings or dicts)
            logger.info(f"List data with {len(data)} items")

            parsed_data = []
            for i, item in enumerate(data):
                if isinstance(item, str):
                    # Parse JSON string
                    try:
                        parsed_item = json.loads(item)
                        parsed_data.append(parsed_item)
                        logger.info(f"Parsed list item {i} successfully")
                    except (json.JSONDecodeError, TypeError) as e:
                        logger.error(f"Failed to parse list item {i}: {str(e)}")
                        continue  # Skip invalid items
                elif isinstance(item, dict):
                    parsed_data.append(item)
                    logger.info(f"Added list item {i} directly")
                else:
                    logger.warning(f"Skipped list item {i} of type {type(item)}")
                    continue  # Skip invalid items
            return parsed_data
        elif data is None or data == "":
            logger.info("Empty data received")
            return []
        else:
            logger.warning(f"Unsupported data type: {type(data)}")
            return []

    def to_representation(self, value):
        """Convert internal value to representation"""
        return value


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating or updating a service with chapters and files"""

    featuredImage = serializers.ImageField(source="featured_image", required=False)
    introVideo = serializers.FileField(
        source="intro_video", required=False, allow_null=True
    )
    shortDesc = serializers.CharField(
        source="short_description", required=False, allow_blank=True
    )
    aiChatbotEnabled = serializers.BooleanField(
        source="ai_chatbot_enabled", required=False
    )
    chatbotPrompt = serializers.CharField(
        source="chatbot_prompt", required=False, allow_blank=True
    )
    difficultyLevel = serializers.ChoiceField(
        source="difficulty_level", choices=Service.DIFFICULTY_CHOICES, required=False
    )
    durationWeeks = serializers.IntegerField(source="duration_weeks", required=False)
    learningOutcomes = serializers.CharField(
        source="learning_outcomes", required=False, allow_blank=True
    )
    isFeatured = serializers.BooleanField(source="is_featured", required=False)
    isPublished = serializers.BooleanField(source="is_published", required=False)
    comingSoon = serializers.BooleanField(source="coming_soon", required=False)
    advisorIds = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
    )
    chapters = ChaptersField(required=False)
    comingSoon = serializers.BooleanField(source="coming_soon", required=False)

    class Meta:
        model = Service
        fields = [
            "title",
            "shortDesc",
            "description",
            "status",
            "category",
            "difficultyLevel",
            "price",
            "durationWeeks",
            "aiChatbotEnabled",
            "chatbotPrompt",
            "tags",
            "prerequisites",
            "learningOutcomes",
            "isFeatured",
            "isPublished",
            "featuredImage",
            "introVideo",
            "advisorIds",
            "chapters",
            "order",
            "comingSoon",
        ]

    def validate_featuredImage(self, value):
        """Validate featured image file type and size with enhanced security"""
        if value:
            from .file_validators import validate_uploaded_file
            from django.conf import settings

            try:
                # Use comprehensive file validation
                check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
                result = validate_uploaded_file(
                    value, file_type="image", check_content=check_content
                )

                # Update filename if sanitization is enabled
                if getattr(settings, "SANITIZE_FILE_NAMES", True):
                    value.name = result["sanitized_filename"]

            except Exception as e:
                raise serializers.ValidationError(str(e))

        return value

    def validate_introVideo(self, value):
        """Validate intro video type and enforce 100MB size limit."""
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

    def validate_advisorIds(self, value):
        """Validate advisor IDs"""
        import logging

        logger = logging.getLogger(__name__)

        logger.info(f"Validating advisorIds: {value}, type: {type(value)}")

        # Ensure all values are integers
        validated_ids = []
        for item in value:
            try:
                if isinstance(item, str):
                    validated_ids.append(int(item))
                else:
                    validated_ids.append(item)
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid advisor ID: {item}, error: {str(e)}")
                raise serializers.ValidationError(
                    f"Invalid advisor ID: {item} must be an integer"
                )

        logger.info(f"Validated advisor IDs: {validated_ids}")
        return validated_ids

    def validate_order(self, value):
        """Validate that the order is unique"""
        if value is not None:
            # Check if order is already taken by another service
            existing = Service.objects.filter(order=value)
            if self.instance:
                # For update, exclude current instance
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                print(f"Order {value} is already taken")
        return value

    def create(self, validated_data):
        """Create a service with chapters and files"""
        # Extract nested data
        advisor_ids = validated_data.pop("advisorIds", [])
        chapters_data = validated_data.pop("chapters", [])

        # Create service
        service = Service.objects.create(**validated_data)

        # Add advisors
        if advisor_ids:
            import logging

            logger = logging.getLogger(__name__)
            logger.info(f"Creating service with advisor IDs: {advisor_ids}")

            # Convert any string IDs to integers
            normalized_ids = []
            for adv_id in advisor_ids:
                try:
                    if isinstance(adv_id, str):
                        normalized_ids.append(int(adv_id))
                    else:
                        normalized_ids.append(adv_id)
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert advisor ID to integer: {adv_id}")

            logger.info(f"Normalized advisor IDs: {normalized_ids}")

            if normalized_ids:
                advisors = User.objects.filter(id__in=normalized_ids, role="trainer")
                logger.info(
                    f"Found advisors: {list(advisors.values_list('id', 'username'))}"
                )
                service.advisors.set(advisors)
                logger.info(
                    f"After setting advisors: {list(service.advisors.values_list('id', 'username'))}"
                )
            else:
                logger.warning("No valid advisor IDs after normalization")

        # Create chapters and files
        self._save_chapters_with_files(service, chapters_data)

        return service

    def update(self, instance, validated_data):
        """Update a service with chapters and files"""
        import logging

        logger = logging.getLogger(__name__)

        # Extract nested data
        advisor_ids = validated_data.pop("advisorIds", None)
        chapters_data = validated_data.pop("chapters", None)

        logger.info(
            f"Updating service {instance.id} with chapters_data: {chapters_data is not None}"
        )
        if chapters_data is not None:
            logger.info(f"Chapters data type: {type(chapters_data)}")
            if isinstance(chapters_data, list):
                logger.info(f"Number of chapters: {len(chapters_data)}")

        # Check if there are direct service files in the request data
        direct_files = (
            self.context.get("request").FILES if self.context.get("request") else None
        )
        logger.info(f"Direct files in request: {direct_files}")

        # Update service fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update advisors if provided
        if advisor_ids is not None:
            logger.info(
                f"Updating advisors with IDs: {advisor_ids}, type: {type(advisor_ids)}"
            )
            try:
                # Convert any string IDs to integers
                normalized_ids = []

                # Handle different input types
                if isinstance(advisor_ids, list):
                    # Process each ID in the list
                    for adv_id in advisor_ids:
                        try:
                            if isinstance(adv_id, str):
                                normalized_ids.append(int(adv_id))
                            else:
                                normalized_ids.append(adv_id)
                        except (ValueError, TypeError):
                            logger.warning(
                                f"Could not convert advisor ID to integer: {adv_id}"
                            )
                elif isinstance(advisor_ids, str):
                    # Handle string format like '[3,6]' or '3,6'

                    # Strip brackets and split by commas
                    clean_str = advisor_ids.strip("[]")
                    items = [item.strip() for item in clean_str.split(",")]

                    for item in items:
                        try:
                            normalized_ids.append(int(item))
                        except (ValueError, TypeError):
                            logger.warning(
                                f"Could not convert advisor ID string to integer: {item}"
                            )
                elif advisor_ids is None or advisor_ids == "":
                    # Handle empty case
                    logger.info("Empty advisor_ids received, will clear advisors")
                    normalized_ids = []
                else:
                    # Try to handle single value
                    try:
                        normalized_ids.append(int(advisor_ids))
                    except (ValueError, TypeError):
                        logger.warning(
                            f"Could not convert single advisor ID to integer: {advisor_ids}"
                        )

                logger.info(f"Normalized advisor IDs: {normalized_ids}")

                if normalized_ids:
                    advisors = User.objects.filter(
                        id__in=normalized_ids, role="trainer"
                    )
                    logger.info(
                        f"Found advisors: {list(advisors.values_list('id', 'username'))}"
                    )
                    instance.advisors.set(advisors)
                    logger.info(
                        f"After setting advisors: {list(instance.advisors.values_list('id', 'username'))}"
                    )
                else:
                    logger.warning(
                        "No valid advisor IDs after normalization, clearing advisors"
                    )
                    instance.advisors.clear()
            except Exception as e:
                logger.error(f"Error setting advisors: {str(e)}")
                import traceback

                logger.error(f"Advisor setting traceback: {traceback.format_exc()}")

        # Update chapters if provided
        if chapters_data is not None:
            try:
                self._sync_chapters_with_files(instance, chapters_data)
                logger.info(f"Synced {instance.chapters.count()} chapters")
            except Exception as e:
                logger.error(f"Error updating chapters: {str(e)}")
                import traceback

                logger.error(f"Traceback: {traceback.format_exc()}")
                raise

        # Handle direct service files
        if direct_files:
            try:
                logger.info("Processing direct service files")
                self._handle_direct_service_files(instance, direct_files)
            except Exception as e:
                logger.error(f"Error processing direct service files: {str(e)}")
                import traceback

                logger.error(
                    f"Direct file processing traceback: {traceback.format_exc()}"
                )
                # Continue even if file processing fails

        return instance

    def _map_chapter_data(self, chapter_data):
        """Map frontend chapter fields onto Chapter model fields."""
        upload_date = timezone.now().date()
        upload_date_str = chapter_data.get("uploadDate")

        if upload_date_str and isinstance(upload_date_str, str):
            if "Uploaded on" in upload_date_str:
                date_str = upload_date_str.replace("Uploaded on", "").strip()
                try:
                    from datetime import datetime

                    upload_date = datetime.strptime(date_str, "%d %B %Y").date()
                except (ValueError, TypeError):
                    upload_date = timezone.now().date()

        mapped_data = {
            "external_id": chapter_data.get("id"),
            "title": chapter_data.get("title"),
            "short_description": chapter_data.get("shortDescription")
            or chapter_data.get("short_description"),
            "content": chapter_data.get("description", ""),
            "description": chapter_data.get("description", ""),
            "week": chapter_data.get("week", 1),
            "is_expanded": chapter_data.get("isExpanded", False),
            "upload_date": upload_date,
        }

        video_file = chapter_data.get("video")
        if video_file and hasattr(video_file, "name"):
            mapped_data["video"] = video_file

        return mapped_data

    def _find_existing_chapter(self, service, chapter_data):
        """Find an existing chapter by UUID id first, then legacy external_id."""
        chapter_id = chapter_data.get("id")
        if not chapter_id:
            return None

        existing = service.chapters.filter(id=chapter_id).first()
        if existing:
            return existing

        return service.chapters.filter(external_id=chapter_id).first()

    def _sync_chapters_with_files(self, service, chapters_data):
        """Update chapters in place so existing chapter files remain linked."""
        import logging

        logger = logging.getLogger(__name__)
        request = self.context.get("request")
        request_files = getattr(request, "FILES", None)
        kept_chapter_ids = []

        logger.info(f"Syncing chapters with {len(chapters_data)} chapter items")

        for i, chapter_data in enumerate(chapters_data):
            mapped_data = self._map_chapter_data(chapter_data)
            chapter = self._find_existing_chapter(service, chapter_data)

            if chapter:
                logger.info(f"Updating existing chapter {chapter.id}")
                for attr, value in mapped_data.items():
                    if value is not None:
                        setattr(chapter, attr, value)
                chapter.save()
            else:
                logger.info("Creating new chapter")
                chapter = Chapter.objects.create(service=service, **mapped_data)

            kept_chapter_ids.append(chapter.id)
            self._sync_chapter_files(chapter, chapter_data, i, request_files)

        service.chapters.exclude(id__in=kept_chapter_ids).delete()

    def _sync_chapter_files(self, chapter, chapter_data, chapter_index, request_files):
        """Keep existing files by id/path, delete explicit removals, add uploads."""
        existing_file_payload = chapter_data.get("existingChapterFiles", [])
        keep_file_ids = set()
        keep_file_names = set()

        for existing_file in existing_file_payload:
            file_id = existing_file.get("id")
            file_url = existing_file.get("fileUrl")

            if file_id:
                keep_file_ids.add(str(file_id))

            if file_url:
                normalized_file = (
                    file_url.split("/media/", 1)[1]
                    if "/media/" in file_url
                    else file_url.lstrip("/")
                )
                keep_file_names.add(normalized_file)

                existing_by_path = chapter.chapter_files.filter(
                    file=normalized_file
                ).exists()
                if not file_id and not existing_by_path:
                    ChapterFile.objects.create(
                        chapter=chapter,
                        title=existing_file.get("title") or chapter.title,
                        file=normalized_file,
                        file_type=existing_file.get("fileType")
                        or self._get_file_type(normalized_file),
                        file_size=existing_file.get("fileSize") or 0,
                        file_extension=existing_file.get("fileExtension")
                        or (
                            normalized_file.split(".")[-1].lower()
                            if "." in normalized_file
                            else ""
                        ),
                        is_downloadable=existing_file.get("isDownloadable", True),
                        order=existing_file.get("order") or 0,
                    )

        for chapter_file in chapter.chapter_files.all():
            if str(chapter_file.id) in keep_file_ids:
                continue
            if chapter_file.file and chapter_file.file.name in keep_file_names:
                continue
            chapter_file.delete()

        chapter_file_uploads = []
        if request_files:
            chapter_file_prefix = f"chapters[{chapter_index}][files]["
            for key in request_files:
                if key.startswith(chapter_file_prefix):
                    chapter_file_uploads.append((key, request_files.get(key)))
            chapter_file_uploads.sort(key=lambda item: item[0])

        next_order = chapter.chapter_files.count()
        for file_order, (_, uploaded_file) in enumerate(
            chapter_file_uploads,
            start=next_order,
        ):
            if not uploaded_file:
                continue
            ChapterFile.objects.create(
                chapter=chapter,
                title=uploaded_file.name,
                file=uploaded_file,
                file_type=self._get_file_type(uploaded_file.name),
                file_size=uploaded_file.size,
                file_extension=uploaded_file.name.split(".")[-1].lower()
                if "." in uploaded_file.name
                else "",
                is_downloadable=True,
                order=file_order,
            )

    def _save_chapters_with_files(self, service, chapters_data):
        """Helper method to save chapters with files, skipping existing chapters"""
        import logging

        logger = logging.getLogger(__name__)
        request = self.context.get("request")
        request_files = getattr(request, "FILES", None)

        logger.info(f"Saving chapters with {len(chapters_data)} chapter items")

        for i, chapter_data in enumerate(chapters_data):
            logger.info(f"Processing chapter {i + 1}/{len(chapters_data)}")
            logger.info(f"Chapter data keys: {list(chapter_data.keys())}")

            external_id = chapter_data.get("id")
            logger.info("Creating chapter")

            # Map frontend field names to model fields
            mapped_data = {
                "external_id": external_id,
                "title": chapter_data.get("title"),
                "short_description": chapter_data.get("shortDescription")
                or chapter_data.get("short_description"),
                "content": chapter_data.get(
                    "description", ""
                ),  # Store in content for backwards compatibility
                "description": chapter_data.get(
                    "description", ""
                ),  # Also store in description field
                "week": chapter_data.get("week", 1),
                "is_expanded": chapter_data.get("isExpanded", False),
            }

            # Handle upload_date parsing
            upload_date_str = chapter_data.get("uploadDate")
            logger.info(f"Upload date string: {upload_date_str}")

            if upload_date_str and isinstance(upload_date_str, str):
                if "Uploaded on" in upload_date_str:
                    date_str = upload_date_str.replace("Uploaded on", "").strip()
                    logger.info(f"Parsing date string: '{date_str}'")
                    try:
                        from datetime import datetime

                        parsed_date = datetime.strptime(date_str, "%d %B %Y").date()
                        mapped_data["upload_date"] = parsed_date
                        logger.info(f"Successfully parsed date as: {parsed_date}")
                    except (ValueError, TypeError) as e:
                        logger.error(f"Error parsing date: {str(e)}")
                        mapped_data["upload_date"] = timezone.now().date()
                else:
                    mapped_data["upload_date"] = timezone.now().date()
            else:
                mapped_data["upload_date"] = timezone.now().date()

            # Handle video file if provided
            if "video" in chapter_data:
                video_file = chapter_data.get("video")
                logger.info(
                    f"Chapter has video: {video_file}, type: {type(video_file)}"
                )
                if video_file and hasattr(video_file, "name"):
                    # This is a file object
                    logger.info(
                        f"Chapter has video file object: {getattr(video_file, 'name', 'Unknown')}"
                    )
                    mapped_data["video"] = video_file
                elif video_file and isinstance(video_file, str):
                    # This is just a filename reference, which means we need to look for a file object
                    logger.info(f"Chapter has video filename reference: {video_file}")
                    # We'll continue without setting the video here since
                    # the video file should be found in the videos dictionary by the chapter's index

            # Extract files data before creating chapter
            files_data = chapter_data.get("files", [])
            logger.info(f"Files data: {files_data}")

            # Log the final mapped data for the chapter
            logger.info(f"Creating chapter with data: {mapped_data}")

            try:
                # Create the chapter
                chapter = Chapter.objects.create(service=service, **mapped_data)
                logger.info(f"Created chapter with ID: {chapter.id}")

                # Create files for this chapter
                for j, file_data in enumerate(files_data):
                    try:
                        logger.info(
                            f"Creating file {j + 1}/{len(files_data)} for chapter {chapter.id}"
                        )
                        logger.info(f"File data: {file_data}")

                        # Map camelCase to snake_case for ChapterFile model
                        mapped_file_data = {
                            "title": file_data.get("title", ""),
                            "description": file_data.get("description", ""),
                            "file_type": file_data.get("fileType", "document"),
                            "file_size": file_data.get("fileSize", 0),
                            "file_extension": file_data.get("fileExtension", ""),
                            "is_downloadable": file_data.get("isDownloadable", True),
                            "order": file_data.get("order", 0),
                        }

                        # Handle file URL or file object
                        if "file" in file_data:
                            mapped_file_data["file"] = file_data["file"]
                        elif "fileUrl" in file_data:
                            # If fileUrl is provided but no file object, skip this file
                            logger.warning(
                                f"File has fileUrl but no file object, skipping"
                            )
                            continue

                        # Remove None values
                        mapped_file_data = {
                            k: v for k, v in mapped_file_data.items() if v is not None
                        }

                        logger.info(f"Mapped file data: {mapped_file_data}")
                        ChapterFile.objects.create(chapter=chapter, **mapped_file_data)
                    except Exception as e:
                        logger.error(
                            f"Error creating file for chapter {chapter.id}: {str(e)}"
                        )
                        import traceback

                        logger.error(
                            f"File creation traceback: {traceback.format_exc()}"
                        )
                        # Continue with other files even if this one fails

                chapter_file_uploads = []
                if request_files:
                    chapter_file_prefix = f"chapters[{i}][files]["
                    for key in request_files:
                        if key.startswith(chapter_file_prefix):
                            chapter_file_uploads.append((key, request_files.get(key)))
                    chapter_file_uploads.sort(key=lambda item: item[0])

                for file_order, (_, uploaded_file) in enumerate(chapter_file_uploads):
                    if not uploaded_file:
                        continue
                    ChapterFile.objects.create(
                        chapter=chapter,
                        title=uploaded_file.name,
                        file=uploaded_file,
                        file_type=self._get_file_type(uploaded_file.name),
                        file_size=uploaded_file.size,
                        file_extension=uploaded_file.name.split(".")[-1].lower()
                        if "." in uploaded_file.name
                        else "",
                        is_downloadable=True,
                        order=file_order,
                    )

                for file_order, existing_file in enumerate(
                    chapter_data.get("existingChapterFiles", []),
                    start=len(chapter_file_uploads),
                ):
                    file_url = existing_file.get("fileUrl")
                    if not file_url:
                        continue
                    normalized_file = (
                        file_url.split("/media/", 1)[1]
                        if "/media/" in file_url
                        else file_url.lstrip("/")
                    )
                    ChapterFile.objects.create(
                        chapter=chapter,
                        title=existing_file.get("title") or chapter.title,
                        file=normalized_file,
                        file_type=self._get_file_type(normalized_file),
                        is_downloadable=True,
                        order=file_order,
                    )
            except Exception as e:
                logger.error(f"Error creating chapter: {str(e)}")
                import traceback

                logger.error(f"Chapter creation traceback: {traceback.format_exc()}")
                # Continue with other chapters even if this one fails

    def _handle_direct_service_files(self, service, files):
        """Helper method to create files linked directly to the service"""
        import logging

        logger = logging.getLogger(__name__)
        from .models import ServiceFile

        logger.info(f"Processing {len(files)} direct service files")

        for field_name, file_obj in files.items():
            # Skip fields that are not file fields or are already processed
            if field_name in {"featuredImage", "introVideo", "intro_video"}:
                logger.info(f"Skipping non-resource file field: {field_name}")
                continue

            # Skip chapter video files as they are handled separately
            if "chapters[" in field_name and "][video]" in field_name:
                logger.info(f"Skipping chapter video file: {field_name}")
                continue

            # Skip chapter resource files as they are handled in _save_chapters_with_files
            if "chapters[" in field_name and "][files][" in field_name:
                logger.info(f"Skipping chapter resource file: {field_name}")
                continue

            try:
                logger.info(
                    f"Processing file field: {field_name}, file: {file_obj.name}"
                )

                # Create title from filename
                filename = file_obj.name
                title = filename

                # Determine file type
                file_type = "document"  # Default
                if filename.lower().endswith(
                    (".jpg", ".jpeg", ".png", ".gif", ".webp")
                ):
                    file_type = "image"
                elif filename.lower().endswith((".mp4", ".avi", ".mov", ".wmv")):
                    file_type = "video"
                elif filename.lower().endswith((".mp3", ".wav", ".ogg")):
                    file_type = "audio"
                elif filename.lower().endswith((".xls", ".xlsx", ".csv")):
                    file_type = "spreadsheet"
                elif filename.lower().endswith((".ppt", ".pptx")):
                    file_type = "presentation"
                elif filename.lower().endswith((".pdf", ".doc", ".docx", ".txt")):
                    file_type = "document"

                # Get file extension
                file_extension = ""
                if "." in filename:
                    file_extension = filename.split(".")[-1].lower()

                # Create the service file
                service_file = ServiceFile.objects.create(
                    service=service,
                    title=title,
                    file=file_obj,
                    file_type=file_type,
                    file_size=file_obj.size,
                    file_extension=file_extension,
                    is_downloadable=True,
                    order=0,  # Default order
                )

                logger.info(
                    f"Created service file with ID: {service_file.id}, title: {title}"
                )

            except Exception as e:
                logger.error(f"Error creating service file: {str(e)}")
                import traceback

                logger.error(
                    f"Service file creation traceback: {traceback.format_exc()}"
                )
                # Continue with other files even if this one fails

    def _get_file_type(self, filename):
        """Determine file type from filename."""
        extension = filename.split(".")[-1].lower() if "." in filename else ""

        if extension in ["pdf", "doc", "docx", "txt", "rtf", "odt"]:
            return "document"
        if extension in ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"]:
            return "image"
        if extension in ["mp4", "avi", "mov", "wmv", "flv", "webm"]:
            return "video"
        if extension in ["mp3", "wav", "ogg", "aac", "m4a"]:
            return "audio"
        if extension in ["xls", "xlsx", "csv", "ods"]:
            return "spreadsheet"
        if extension in ["ppt", "pptx", "odp"]:
            return "presentation"
        return "document"


class EbookSerializer(serializers.ModelSerializer):
    totalSold = serializers.SerializerMethodField()
    seriesName = serializers.CharField(source="series.title", read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        model = Ebook
        fields = [
            "id",
            "title",
            "status",
            "totalSold",
            "seriesName",
            "created_at",
            "price",
        ]

    def get_totalSold(self, obj):
        return obj.total_sold


class AdminEbooksResponseSerializer(serializers.Serializer):
    totalEbooks = serializers.IntegerField()
    totalEbooksSold = serializers.IntegerField()
    ebooks = EbookSerializer(many=True)


class AddEbookSerializer(serializers.ModelSerializer):
    shortDescription = serializers.CharField(required=False, allow_blank=True)
    thumbnailImage = serializers.ImageField(required=False)
    seriesId = serializers.IntegerField(required=False, allow_null=True)
    # Also accept seriesID for consistency
    seriesID = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Ebook
        fields = [
            "title",
            "topic",
            "shortDescription",
            "price",
            "thumbnailImage",
            "file",
            "author",
            "isbn",
            "pages",
            "seriesId",
            "seriesID",  # Add the alternate format
        ]

    def validate_file(self, value):
        # Validate that the uploaded file is a PDF
        if value:
            if not value.name.lower().endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed.")
        return value

    def validate_thumbnailImage(self, value):
        # Validate image file types
        if value:
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
            if (
                hasattr(value, "content_type")
                and value.content_type not in allowed_types
            ):
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and GIF images are allowed."
                )
        return value

    def validate_seriesId(self, value):
        if value:
            try:
                # Handle case when value is a list
                if isinstance(value, list):
                    if len(value) > 0:
                        value = value[0]
                    else:
                        return value

                # Convert to integer if it's a string
                if isinstance(value, str) and value.isdigit():
                    value = int(value)

                EbookSeries.objects.get(id=value)
            except EbookSeries.DoesNotExist:
                raise serializers.ValidationError("Series not found.")
            except (ValueError, TypeError) as e:
                raise serializers.ValidationError(f"Invalid series ID format: {str(e)}")
        return value

    def validate_seriesID(self, value):
        # Same validation for the alternate format
        if value:
            try:
                # Handle case when value is a list
                if isinstance(value, list):
                    if len(value) > 0:
                        value = value[0]
                    else:
                        return value

                # Convert to integer if it's a string
                if isinstance(value, str) and value.isdigit():
                    value = int(value)

                EbookSeries.objects.get(id=value)
            except EbookSeries.DoesNotExist:
                raise serializers.ValidationError("Series not found.")
            except (ValueError, TypeError) as e:
                raise serializers.ValidationError(f"Invalid series ID format: {str(e)}")
        return value

    def create(self, validated_data):
        # Extract custom fields
        short_description = validated_data.pop("shortDescription", "")
        thumbnail_image = validated_data.pop("thumbnailImage", None)

        # Handle both seriesId and seriesID formats
        series_id = validated_data.pop("seriesId", None)
        # Check for alternate format and remove it if exists
        if "seriesID" in validated_data:
            series_id = series_id or validated_data.pop("seriesID", None)

        # Set default values
        validated_data["uploaded_by"] = self.context["request"].user
        validated_data["description"] = short_description
        if thumbnail_image:
            validated_data["cover_image"] = thumbnail_image

        # Create the ebook instance first without setting the series
        ebook = super().create(validated_data)

        # Then set the series relationship if provided
        if series_id:
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
                    series = EbookSeries.objects.get(id=series_id)
                    ebook.series = series
                    ebook.save()
            except EbookSeries.DoesNotExist:
                # This shouldn't happen due to validate_seriesId, but just in case
                pass
            except (ValueError, TypeError) as e:
                print(f"Error processing series ID in AddEbookSerializer: {str(e)}")
                # Continue without setting the series

        return ebook


class EbookPurchaseHistorySerializer(serializers.ModelSerializer):
    clientId = serializers.SerializerMethodField()
    clientName = serializers.SerializerMethodField()
    clientEmail = serializers.SerializerMethodField()
    purchaseDate = serializers.DateTimeField(source="purchased_at")
    pricePaid = serializers.DecimalField(
        source="price_paid", max_digits=10, decimal_places=2
    )

    def get_clientId(self, obj):
        return obj.user.id if obj.user else None

    def get_clientName(self, obj):
        if obj.user:
            full_name = obj.user.get_full_name().strip()
            return full_name or obj.user.username or obj.user.email

        return obj.customer_name or "Guest"

    def get_clientEmail(self, obj):
        if obj.user:
            return obj.user.email

        return obj.customer_email

    class Meta:
        model = EbookPurchase
        fields = ["clientId", "clientName", "clientEmail", "purchaseDate", "pricePaid"]


class BlogSerializer(serializers.ModelSerializer):
    timeToRead = serializers.IntegerField(source="time_to_read")
    uploadedOn = serializers.DateTimeField(source="created_at")
    slug = serializers.SlugField()

    class Meta:
        model = Blog
        fields = ["id", "title", "status", "timeToRead", "uploadedOn", "slug"]


class AdminBlogsResponseSerializer(serializers.Serializer):
    totalBlogsSold = serializers.IntegerField()
    blogs = BlogSerializer(many=True)


class AdminBlogDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for admin blog view with all information"""

    author = serializers.SerializerMethodField()
    thumbnailImage = serializers.SerializerMethodField()
    thumbnailImageUrl = serializers.SerializerMethodField()
    totalViews = serializers.SerializerMethodField()
    wordCount = serializers.SerializerMethodField()
    readingTime = serializers.SerializerMethodField()
    statusDisplay = serializers.SerializerMethodField()
    scheduleOnFormatted = serializers.SerializerMethodField()
    publishedAtFormatted = serializers.SerializerMethodField()
    createdAtFormatted = serializers.SerializerMethodField()
    updatedAtFormatted = serializers.SerializerMethodField()

    class Meta:
        model = Blog
        fields = [
            "id",
            "title",
            "topic",
            "short_description",
            "content",
            "status",
            "statusDisplay",
            "slug",
            "thumbnailImage",
            "thumbnailImageUrl",
            "time_to_read",
            "readingTime",
            "views_count",
            "totalViews",
            "wordCount",
            "schedule_on",
            "scheduleOnFormatted",
            "published_at",
            "publishedAtFormatted",
            "author",
            "created_at",
            "createdAtFormatted",
            "updated_at",
            "updatedAtFormatted",
        ]

    def get_author(self, obj):
        return {
            "id": str(obj.author.id),
            "username": obj.author.username,
            "fullName": obj.author.get_full_name(),
            "email": obj.author.email,
            "role": obj.author.role,
        }

    def get_thumbnailImage(self, obj):
        if obj.thumbnail_image:
            return {
                "name": obj.thumbnail_image.name,
                "size": obj.thumbnail_image.size,
                "url": obj.thumbnail_image.url,
            }
        return None

    def get_thumbnailImageUrl(self, obj):
        if obj.thumbnail_image:
            return obj.thumbnail_image.url
        return None

    def get_totalViews(self, obj):
        return obj.total_views

    def get_wordCount(self, obj):
        if obj.content:
            # Simple word count (you might want to use a more sophisticated method for HTML content)
            import re

            # Remove HTML tags and count words
            clean_text = re.sub(r"<[^>]+>", "", obj.content)
            return len(clean_text.split())
        return 0

    def get_readingTime(self, obj):
        word_count = self.get_wordCount(obj)
        # Average reading speed is about 200-250 words per minute
        if word_count > 0:
            minutes = max(1, round(word_count / 200))  # At least 1 minute
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        return "1 minute"

    def get_statusDisplay(self, obj):
        status_choices = dict(Blog.STATUS_CHOICES)
        return status_choices.get(obj.status, obj.status)

    def get_scheduleOnFormatted(self, obj):
        if obj.schedule_on:
            return obj.schedule_on.isoformat()
        return None

    def get_publishedAtFormatted(self, obj):
        if obj.published_at:
            return obj.published_at.isoformat()
        return None

    def get_createdAtFormatted(self, obj):
        return obj.created_at.isoformat()

    def get_updatedAtFormatted(self, obj):
        return obj.updated_at.isoformat()


class AddBlogSerializer(serializers.ModelSerializer):
    thumbnailImage = serializers.ImageField(required=False)

    class Meta:
        model = Blog
        fields = [
            "title",
            "topic",
            "short_description",
            "content",
            "thumbnailImage",
            "time_to_read",
            "schedule_on",
        ]

    def validate_thumbnailImage(self, value):
        if value:
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
            if (
                hasattr(value, "content_type")
                and value.content_type not in allowed_types
            ):
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and GIF images are allowed."
                )
        return value

    def create(self, validated_data):
        thumbnail_image = validated_data.pop("thumbnailImage", None)

        validated_data["author"] = self.context["request"].user
        if thumbnail_image:
            validated_data["thumbnail_image"] = thumbnail_image

        # Set status based on schedule_on
        if validated_data.get("schedule_on"):
            validated_data["status"] = "scheduled"
        else:
            validated_data["status"] = "published"

        return super().create(validated_data)


class EditBlogSerializer(serializers.ModelSerializer):
    thumbnailImage = serializers.ImageField(required=False)

    class Meta:
        model = Blog
        fields = [
            "title",
            "topic",
            "short_description",
            "content",
            "thumbnailImage",
            "time_to_read",
            "schedule_on",
            "status",
        ]

    def validate_thumbnailImage(self, value):
        if value:
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
            if (
                hasattr(value, "content_type")
                and value.content_type not in allowed_types
            ):
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and GIF images are allowed."
                )
        return value

    def update(self, instance, validated_data):
        thumbnail_image = validated_data.pop("thumbnailImage", None)

        if thumbnail_image:
            validated_data["thumbnail_image"] = thumbnail_image

        # Update status based on schedule_on
        if validated_data.get("schedule_on"):
            validated_data["status"] = "scheduled"
        elif instance.status == "scheduled" and not validated_data.get("schedule_on"):
            validated_data["status"] = "published"

        return super().update(instance, validated_data)


class NewsletterSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField(source="id")
    name = serializers.CharField(source="title")
    uploadedOn = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Newsletter
        fields = ["uuid", "name", "status", "pages", "uploadedOn"]


class AdminNewsletterDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for admin newsletter view with all information"""

    author = serializers.SerializerMethodField()
    thumbnailImage = serializers.SerializerMethodField()
    thumbnailImageUrl = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    fileDetails = serializers.SerializerMethodField()
    totalViews = serializers.SerializerMethodField()
    statusDisplay = serializers.SerializerMethodField()
    scheduleOnFormatted = serializers.SerializerMethodField()
    publishedAtFormatted = serializers.SerializerMethodField()
    createdAtFormatted = serializers.SerializerMethodField()
    updatedAtFormatted = serializers.SerializerMethodField()

    class Meta:
        model = Newsletter
        fields = [
            "id",
            "title",
            "short_description",
            "status",
            "statusDisplay",
            "file",
            "fileUrl",
            "fileDetails",
            "thumbnailImage",
            "thumbnailImageUrl",
            "pages",
            "views_count",
            "totalViews",
            "schedule_on",
            "scheduleOnFormatted",
            "published_at",
            "publishedAtFormatted",
            "author",
            "created_at",
            "createdAtFormatted",
            "updated_at",
            "updatedAtFormatted",
        ]

    def get_author(self, obj):
        return {
            "id": str(obj.author.id),
            "username": obj.author.username,
            "fullName": obj.author.get_full_name(),
            "email": obj.author.email,
            "role": obj.author.role,
        }

    def get_thumbnailImage(self, obj):
        if obj.thumbnail_image:
            return {
                "name": obj.thumbnail_image.name,
                "size": obj.thumbnail_image.size,
                "url": obj.thumbnail_image.url,
            }
        return None

    def get_thumbnailImageUrl(self, obj):
        if obj.thumbnail_image:
            return obj.thumbnail_image.url
        return None

    def get_fileUrl(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def get_fileDetails(self, obj):
        if obj.file:
            return {
                "name": obj.file.name,
                "size": obj.file.size,
                "type": (
                    obj.file.name.split(".")[-1].upper()
                    if "." in obj.file.name
                    else "PDF"
                ),
                "url": obj.file.url,
            }
        return None

    def get_totalViews(self, obj):
        return obj.total_views

    def get_statusDisplay(self, obj):
        status_choices = dict(Newsletter.STATUS_CHOICES)
        return status_choices.get(obj.status, obj.status)

    def get_scheduleOnFormatted(self, obj):
        if obj.schedule_on:
            return obj.schedule_on.isoformat()
        return None

    def get_publishedAtFormatted(self, obj):
        if obj.published_at:
            return obj.published_at.isoformat()
        return None

    def get_createdAtFormatted(self, obj):
        return obj.created_at.isoformat()

    def get_updatedAtFormatted(self, obj):
        return obj.updated_at.isoformat()


class AdminNewslettersResponseSerializer(serializers.Serializer):
    totalNewsletters = serializers.IntegerField()
    totalViews = serializers.IntegerField()
    newsletters = NewsletterSerializer(many=True)


class AddNewsletterSerializer(serializers.ModelSerializer):
    thumbnailImage = serializers.ImageField(required=False)
    file = serializers.FileField()

    class Meta:
        model = Newsletter
        fields = [
            "title",
            "short_description",
            "file",
            "thumbnailImage",
            "pages",
            "schedule_on",
        ]

    def validate_file(self, value):
        if value:
            if not value.name.lower().endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed.")
        return value

    def validate_thumbnailImage(self, value):
        if value:
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
            if (
                hasattr(value, "content_type")
                and value.content_type not in allowed_types
            ):
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and GIF images are allowed."
                )
        return value

    def create(self, validated_data):
        thumbnail_image = validated_data.pop("thumbnailImage", None)

        validated_data["author"] = self.context["request"].user
        if thumbnail_image:
            validated_data["thumbnail_image"] = thumbnail_image

        # Set status based on schedule_on
        if validated_data.get("schedule_on"):
            validated_data["status"] = "scheduled"
        else:
            validated_data["status"] = "published"

        return super().create(validated_data)


class EditNewsletterSerializer(serializers.ModelSerializer):
    thumbnailImage = serializers.ImageField(required=False)
    file = serializers.FileField(required=False)

    class Meta:
        model = Newsletter
        fields = [
            "title",
            "short_description",
            "file",
            "thumbnailImage",
            "pages",
            "schedule_on",
            "status",
        ]

    def validate_file(self, value):
        if value:
            if not value.name.lower().endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed.")
        return value

    def validate_thumbnailImage(self, value):
        if value:
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
            if (
                hasattr(value, "content_type")
                and value.content_type not in allowed_types
            ):
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and GIF images are allowed."
                )
        return value

    def update(self, instance, validated_data):
        thumbnail_image = validated_data.pop("thumbnailImage", None)
        file = validated_data.pop("file", None)

        if thumbnail_image:
            validated_data["thumbnail_image"] = thumbnail_image
        if file:
            validated_data["file"] = file

        # Update status based on schedule_on
        if validated_data.get("schedule_on"):
            validated_data["status"] = "scheduled"
        elif instance.status == "scheduled" and not validated_data.get("schedule_on"):
            validated_data["status"] = "published"

        return super().update(instance, validated_data)


class ReferralSerializer(serializers.ModelSerializer):
    referredBy = serializers.CharField(source="referrer.get_full_name")
    referredUser = serializers.CharField(source="referred_user.get_full_name")
    date = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Referral
        fields = ["referredBy", "referredUser", "date"]


class AdminReferralsResponseSerializer(serializers.Serializer):
    totalUsersViaReferrals = serializers.IntegerField()
    referrals = ReferralSerializer(many=True)


# Client-facing serializers
class ClientEbookSerializer(serializers.ModelSerializer):
    """Serializer for ebooks as seen by clients"""

    id = serializers.UUIDField()
    title = serializers.CharField()
    topic = serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    coverImage = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    fileName = serializers.SerializerMethodField()
    fileSize = serializers.SerializerMethodField()
    author = serializers.CharField()
    pages = serializers.IntegerField()
    series = serializers.SerializerMethodField()
    totalSold = serializers.SerializerMethodField()
    isPurchased = serializers.SerializerMethodField()

    class Meta:
        model = Ebook
        fields = [
            "id",
            "title",
            "topic",
            "description",
            "price",
            "coverImage",
            "file",
            "downloadUrl",
            "fileName",
            "fileSize",
            "author",
            "pages",
            "series",
            "totalSold",
            "isPurchased",
        ]

    def get_file(self, obj):
        return self.get_downloadUrl(obj)

    def get_coverImage(self, obj):
        if not obj.cover_image:
            return None
        request = self.context.get("request")
        if not request:
            return obj.cover_image.url
        token = create_public_ebook_cover_view_token(obj.id)
        return build_signed_download_url(
            request=request,
            route_name="public-ebook-cover",
            route_kwargs={"ebook_id": str(obj.id)},
            token=token,
        )

    def get_downloadUrl(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        if not user_has_ebook_access(request.user, obj):
            return None

        token = create_signed_download_token(request.user.id, "ebook", obj.id)
        return build_signed_download_url(
            request=request,
            route_name="client-ebook-download",
            route_kwargs={"ebook_id": obj.id},
            token=token,
        )

    def get_fileName(self, obj):
        if self._can_expose_file_metadata(obj) and obj.file:
            return basename(obj.file.name)
        return None

    def get_fileSize(self, obj):
        if self._can_expose_file_metadata(obj) and obj.file:
            return obj.file.size
        return None

    def get_totalSold(self, obj):
        return obj.total_sold

    def get_isPurchased(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return EbookPurchase.objects.filter(
                ebook=obj,
                status="completed",
            ).filter(
                Q(user=request.user) | Q(customer_email__iexact=request.user.email)
            ).exists()
        return False

    def get_series(self, obj):
        if obj.series:
            return {
                "id": str(obj.series.id),
                "title": obj.series.title,
                "description": obj.series.description,
                "coverImage": (
                    obj.series.cover_image.url if obj.series.cover_image else None
                ),
            }
        return None

    def _can_expose_file_metadata(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return user_has_ebook_access(request.user, obj)


class ClientBlogSerializer(serializers.ModelSerializer):
    """Serializer for blogs as seen by clients"""

    id = serializers.UUIDField()
    title = serializers.CharField()
    topic = serializers.CharField()
    shortDescription = serializers.CharField(source="short_description")
    thumbnailImage = serializers.ImageField(source="thumbnail_image")
    timeToRead = serializers.IntegerField(source="time_to_read")
    publishedAt = serializers.DateTimeField(source="published_at")
    author = serializers.CharField(source="author.get_full_name")
    viewsCount = serializers.IntegerField(source="views_count")
    slug = serializers.SlugField()

    class Meta:
        model = Blog
        fields = [
            "id",
            "title",
            "topic",
            "shortDescription",
            "thumbnailImage",
            "timeToRead",
            "publishedAt",
            "author",
            "viewsCount",
            "slug",
        ]


class ClientBlogDetailSerializer(ClientBlogSerializer):
    """Detailed serializer for individual blog posts"""

    content = serializers.CharField()

    class Meta:
        model = Blog
        fields = ClientBlogSerializer.Meta.fields + ["content"]


class ClientNewsletterSerializer(serializers.ModelSerializer):
    """Serializer for newsletters as seen by clients"""

    id = serializers.UUIDField()
    title = serializers.CharField()
    shortDescription = serializers.CharField(source="short_description")
    description = serializers.CharField(
        source="short_description"
    )  # Alias for consistency
    thumbnailImage = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    pages = serializers.IntegerField()
    status = serializers.CharField()
    publishedAt = serializers.DateTimeField(source="published_at")
    scheduledOn = serializers.DateTimeField(source="schedule_on")
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    author = serializers.SerializerMethodField()
    viewsCount = serializers.IntegerField(source="views_count")
    totalViews = serializers.IntegerField(source="total_views")  # Alias for consistency
    downloadUrl = serializers.SerializerMethodField()
    fileSize = serializers.SerializerMethodField()
    fileType = serializers.SerializerMethodField()

    class Meta:
        model = Newsletter
        fields = [
            "id",
            "title",
            "shortDescription",
            "description",
            "thumbnailImage",
            "fileUrl",
            "pages",
            "status",
            "publishedAt",
            "scheduledOn",
            "createdAt",
            "updatedAt",
            "author",
            "viewsCount",
            "totalViews",
            "downloadUrl",
            "fileSize",
            "fileType",
        ]

    def get_thumbnailImage(self, obj):
        if obj.thumbnail_image:
            request = self.context.get("request")
            if not request:
                return obj.thumbnail_image.url
            token = create_public_newsletter_thumbnail_view_token(obj.id)
            return build_signed_download_url(
                request=request,
                route_name="public-newsletter-thumbnail",
                route_kwargs={"newsletter_id": str(obj.id)},
                token=token,
            )
        return None

    def get_fileUrl(self, obj):
        # Only allow fileUrl exposure for the newsletters listing endpoint.
        if not self.context.get("allow_newsletter_file_url", False):
            return None
        if not obj.file:
            return None
        request = self.context.get("request")
        if not request:
            return None
        token = create_public_newsletter_view_token(obj.id)
        return build_signed_download_url(
            request=request,
            route_name="client-newsletter-view",
            route_kwargs={"newsletter_id": str(obj.id)},
            token=token,
        )

    def get_downloadUrl(self, obj):
        # Newsletter downloads are intentionally disabled in client responses.
        return None

    def _get_signed_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        if not user_has_newsletter_access(request.user):
            return None

        token = create_signed_download_token(
            request.user.id, "newsletter", obj.id
        )
        return build_signed_download_url(
            request=request,
            route_name="client-newsletter-download",
            route_kwargs={"newsletter_id": str(obj.id)},
            token=token,
        )

    def get_author(self, obj):
        display_name = obj.author.get_full_name().strip() or obj.author.username
        return {"displayName": display_name}

    def get_fileSize(self, obj):
        if self._can_expose_file_metadata(obj) and obj.file:
            try:
                return obj.file.size
            except:
                return None
        return None

    def get_fileType(self, obj):
        if self._can_expose_file_metadata(obj) and obj.file:
            try:
                return obj.file.name.split(".")[-1].upper()
            except:
                return "PDF"  # Default assumption
        return None

    def _can_expose_file_metadata(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return user_has_newsletter_access(request.user)


class ClientNewsletterDetailSerializer(ClientNewsletterSerializer):
    """Detailed serializer for individual newsletters"""

    file = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()  # For future rich content if added

    class Meta:
        model = Newsletter
        fields = ClientNewsletterSerializer.Meta.fields + ["file", "content"]

    def get_file(self, obj):
        """Return file details for in-browser viewing."""
        file_url = self.get_fileUrl(obj)
        if obj.file and file_url:
            return {
                "url": file_url,
                "name": basename(obj.file.name),
                "size": obj.file.size,
                "type": (
                    obj.file.name.split(".")[-1].upper()
                    if "." in obj.file.name
                    else "PDF"
                ),
            }
        return None

    def get_content(self, obj):
        """Placeholder for future rich content"""
        return None


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""

    ebook = ClientEbookSerializer()

    class Meta:
        model = CartItem
        fields = ["ebook", "added_at"]


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""

    items = CartItemSerializer(source="cart_items", many=True)
    totalItems = serializers.SerializerMethodField()
    totalPrice = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["items", "totalItems", "totalPrice", "updated_at"]

    def get_totalItems(self, obj):
        return obj.total_items

    def get_totalPrice(self, obj):
        return obj.total_price


class ClientProgramSerializer(serializers.ModelSerializer):
    """Serializer for programs/services as seen by clients"""

    id = serializers.UUIDField()
    title = serializers.CharField()
    shortDesc = serializers.CharField(
        source="short_description", required=False, allow_blank=True
    )
    description = serializers.CharField()
    status = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration = serializers.SerializerMethodField()
    difficulty = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    enrolledCount = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    thumbnailImage = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    chaptersCount = serializers.SerializerMethodField()
    assignedAdvisors = serializers.SerializerMethodField()
    comingSoon = serializers.BooleanField(source="coming_soon", read_only=True)
    order = serializers.IntegerField(read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "shortDesc",
            "description",
            "status",
            "price",
            "duration",
            "difficulty",
            "category",
            "enrolledCount",
            "rating",
            "thumbnailImage",
            "introVideo",
            "createdAt",
            "chaptersCount",
            "assignedAdvisors",
            "comingSoon",
            "order",
        ]

    def get_duration(self, obj):
        # Calculate duration based on chapters or return default
        chapters_count = obj.chapters.count()
        if chapters_count > 0:
            # Assume 1 week per chapter
            return f"{chapters_count} weeks"
        return "Self-paced"

    def get_difficulty(self, obj):
        # For now, return a default difficulty level
        # This could be enhanced with a difficulty field in the model
        return "Beginner"

    def get_category(self, obj):
        # For now, return a default category
        # This could be enhanced with a category field in the model
        return "General Fitness"

    def get_enrolledCount(self, obj):
        return obj.enrolled_clients_count

    def get_rating(self, obj):
        # For now, return a default rating
        # This could be enhanced with a rating system
        return 4.5

    def get_thumbnailImage(self, obj):
        # Return the featured image URL if it exists
        if obj.featured_image:
            return obj.featured_image.url
        return None

    def get_introVideo(self, obj):
        if obj.intro_video:
            return obj.intro_video.url
        return None

    def get_chaptersCount(self, obj):
        return obj.chapters.count()

    def get_assignedAdvisors(self, obj):
        advisors = []
        for advisor in obj.advisors.all():
            display_name = advisor.get_full_name().strip() or advisor.username
            advisors.append({"displayName": display_name})
        return advisors


class ClientProgramsResponseSerializer(serializers.Serializer):
    """Response serializer for client programs list"""

    programs = ClientProgramSerializer(many=True)
    totalPrograms = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()

    def get_totalPrograms(self, obj):
        return len(obj["programs"])

    def get_categories(self, obj):
        # Return unique categories from programs
        categories = set()
        for program in obj["programs"]:
            categories.add(program.category)
        return list(categories)


class ClientEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for client enrollments showing program details"""

    programId = serializers.UUIDField(source="service.id")
    programName = serializers.CharField(source="service.title")
    programDescription = serializers.CharField(source="service.short_description")
    programStatus = serializers.CharField(source="service.status")
    enrolledAt = serializers.DateTimeField(source="enrolled_at")
    completed = serializers.BooleanField()
    progress = serializers.SerializerMethodField()
    trainer = serializers.SerializerMethodField()
    advisors = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "programId",
            "programName",
            "programDescription",
            "programStatus",
            "enrolledAt",
            "completed",
            "progress",
            "trainer",
            "advisors",
        ]

    def get_progress(self, obj):
        """Calculate progress percentage based on completed chapters"""
        total_chapters = obj.service.chapters.count()
        if total_chapters == 0:
            return 0

        completed_chapters = obj.progress.filter(completed=True).count()
        return int((completed_chapters / total_chapters) * 100)

    def get_trainer(self, obj):
        """Get main trainer information"""
        trainer = obj.service.trainer
        return {
            "id": str(trainer.id),
            "name": trainer.get_full_name(),
            "email": trainer.email,
        }

    def get_advisors(self, obj):
        """Get advisors information"""
        advisors = obj.service.advisors.all()
        return [
            {
                "id": str(advisor.id),
                "name": advisor.get_full_name(),
                "email": advisor.email,
            }
            for advisor in advisors
        ]


class ClientProgramsResponseSerializer(serializers.Serializer):
    """Response serializer for client's enrolled programs"""

    programs = ClientEnrollmentSerializer(many=True)
    totalPrograms = serializers.SerializerMethodField()

    def get_totalPrograms(self, obj):
        return len(obj["programs"])


class ScheduleAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for scheduling appointments"""

    fullName = serializers.CharField(source="full_name")
    phone = serializers.CharField()
    address = serializers.CharField(required=False, allow_blank=True)
    jobTitle = serializers.CharField(
        source="job_title", required=False, allow_blank=True
    )
    position = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    referredBy = serializers.CharField(
        source="referred_by", required=False, allow_blank=True
    )
    date = serializers.DateField(
        source="preferred_date",
        input_formats=["%Y-%m-%d"],
    )
    time = serializers.TimeField(
        source="preferred_time",
        input_formats=["%H:%M", "%H:%M:%S"],
        format="%H:%M:%S",
    )
    email = serializers.EmailField()

    class Meta:
        model = Appointment
        fields = [
            "fullName",
            "email",
            "phone",
            "address",
            "jobTitle",
            "position",
            "industry",
            "country",
            "referredBy",
            "date",
            "time",
        ]

    def create(self, validated_data):
        for field in (
            "address",
            "job_title",
            "position",
            "industry",
            "country",
            "referred_by",
        ):
            validated_data.pop(field, None)
        return super().create(validated_data)

    def validate_date(self, value):
        """Ensure appointment date is not in the past"""
        from django.utils import timezone

        if value < timezone.now().date():
            raise serializers.ValidationError("Appointment date cannot be in the past.")
        return value

    def validate_time(self, value):
        """Validate time format and business hours"""
        # You can add more validation here for business hours
        return value


class AdminEbookSeriesListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing ebook series for admin users
    Returns id, name, totalEbooksAssigned, and createdOn
    """

    id = serializers.UUIDField(format="hex")
    name = serializers.CharField(source="title")
    totalEbooksAssigned = serializers.SerializerMethodField()
    createdOn = serializers.DateTimeField(source="created_at")

    class Meta:
        model = EbookSeries
        fields = ["id", "name", "totalEbooksAssigned", "createdOn"]

    def get_totalEbooksAssigned(self, obj):
        """Get the count of ebooks assigned to this series"""
        if hasattr(obj, "ebooks_count"):
            return obj.ebooks_count
        return obj.ebooks.count()


class CreateEbookSeriesSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new ebook series
    """

    name = serializers.CharField(source="title")

    class Meta:
        model = EbookSeries
        fields = ["name"]

    def create(self, validated_data):
        """Create a new ebook series"""
        title = validated_data.pop("title")
        user = self.context["request"].user

        series = EbookSeries.objects.create(title=title, created_by=user)

        return series


class UpdateEbookSeriesSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an ebook series
    """

    name = serializers.CharField(source="title")

    class Meta:
        model = EbookSeries
        fields = ["name"]


class PeopleCheckoutEbookSerializer(serializers.Serializer):
    """
    Serializer for public checkout of ebooks
    """

    customerName = serializers.CharField(max_length=255)
    customerEmail = serializers.EmailField()
    customerPhone = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    ebooks = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)


class ClientScheduleMeetingSerializer(serializers.Serializer):
    """
    Serializer for client scheduling meetings with trainers
    """

    time = serializers.TimeField()
    date = serializers.DateField(
        input_formats=["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"]
    )
