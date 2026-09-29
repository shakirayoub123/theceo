from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from .models import Enrollment, Service, Chapter, ChapterFile, ServiceFile, Progress


class ClientOverviewSerializer(serializers.Serializer):
    """
    Serializer for the client overview API endpoint
    Returns statistics about the client's enrollment, ebooks, and meetings
    """

    programsEnrolled = serializers.IntegerField()
    ebooksBought = serializers.IntegerField()
    meetingsToday = serializers.IntegerField()
    latestMeetingOn = serializers.CharField(allow_null=True)
    meetingsByMonth = serializers.ListField(child=serializers.DictField())
    clientName = serializers.CharField()
    clientId = serializers.CharField()
    salesInfluencer = serializers.CharField(
        allow_blank=True, required=False, allow_null=True
    )
    salesAdvisor = serializers.CharField(
        allow_blank=True, required=False, allow_null=True
    )
    sales_influencer = serializers.CharField(
        allow_blank=True, required=False, allow_null=True
    )
    sales_advisor = serializers.CharField(
        allow_blank=True, required=False, allow_null=True
    )
    coachingInfluencers = serializers.ListField(
        child=serializers.CharField(), allow_empty=True, required=False
    )
    hasFullDashboardAccess = serializers.BooleanField(required=False)
    dashboardAccessLevel = serializers.CharField(required=False)
    clientProgramStatus = serializers.CharField(
        allow_null=True, required=False, allow_blank=True
    )
    clientContractStatus = serializers.CharField(
        allow_null=True, required=False, allow_blank=True
    )
    discoveryCall = serializers.DictField(required=False, allow_null=True)
    latestBookedMeeting = serializers.DictField(required=False, allow_null=True)


class EnrolledProgramSerializer(serializers.ModelSerializer):
    """
    Serializer for enrolled programs
    Returns id, name, and enrolledOn for each program
    """

    id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    enrolledOn = serializers.DateTimeField(source="enrolled_at")
    coachingInfluencers = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ["id", "name", "enrolledOn", "coachingInfluencers"]

    def get_id(self, obj):
        return str(obj.service.id) if obj.service else None

    def get_name(self, obj):
        return obj.service.title if obj.service else None

    def get_coachingInfluencers(self, obj):
        if not obj.service:
            return []

        influencers = []
        trainer = getattr(obj.service, "trainer", None)
        if trainer:
            trainer_name = trainer.get_full_name().strip() or trainer.username
            if trainer_name:
                influencers.append(trainer_name)

        for advisor in obj.service.advisors.all():
            advisor_name = advisor.get_full_name().strip() or advisor.username
            if advisor_name and advisor_name not in influencers:
                influencers.append(advisor_name)

        return influencers


class ServiceFileSerializer(serializers.ModelSerializer):
    """
    Serializer for service and chapter files
    """

    id = serializers.CharField(source="pk")
    title = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    fileUrl = serializers.SerializerMethodField()
    fileType = serializers.CharField(source="file_type")
    fileSize = serializers.IntegerField(source="file_size")
    fileExtension = serializers.CharField(source="file_extension")
    isDownloadable = serializers.BooleanField(source="is_downloadable")
    downloadCount = serializers.IntegerField(source="download_count")
    order = serializers.IntegerField()
    createdAt = serializers.SerializerMethodField()
    isServiceFile = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ServiceFile
        fields = [
            "id",
            "title",
            "description",
            "fileUrl",
            "fileType",
            "fileSize",
            "fileExtension",
            "isDownloadable",
            "downloadCount",
            "order",
            "createdAt",
            "isServiceFile",
        ]

    def get_fileUrl(self, obj):
        return obj.file.url if obj.file else None

    def get_createdAt(self, obj):
        return (
            obj.created_at.isoformat()
            if hasattr(obj, "created_at")
            else timezone.now().date().isoformat()
        )

    def get_isServiceFile(self, obj):
        return isinstance(obj, ServiceFile)


class ChapterFileSerializer(ServiceFileSerializer):
    """
    Serializer for chapter files, extending the ServiceFileSerializer
    """

    chapterId = serializers.SerializerMethodField()
    chapterTitle = serializers.SerializerMethodField()
    isChapterVideo = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ChapterFile
        fields = ServiceFileSerializer.Meta.fields + [
            "chapterId",
            "chapterTitle",
            "isChapterVideo",
        ]

    def get_chapterId(self, obj):
        return str(obj.chapter.id) if hasattr(obj, "chapter") else None

    def get_chapterTitle(self, obj):
        return obj.chapter.title if hasattr(obj, "chapter") else None

    def get_isChapterVideo(self, obj):
        # Determine if this file is the main video for the chapter
        return obj.file_type == "video"


class ChapterSerializer(serializers.ModelSerializer):
    """
    Serializer for chapters in service details
    """

    id = serializers.CharField(source="pk")
    week = serializers.IntegerField()
    title = serializers.CharField()
    shortDescription = serializers.CharField(
        source="short_description", allow_null=True, required=False
    )
    description = serializers.SerializerMethodField()
    uploadDate = serializers.DateField(source="upload_date")
    files = ChapterFileSerializer(source="chapter_files", many=True)
    isExpanded = serializers.BooleanField(source="is_expanded")
    isCompleted = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

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
            "isCompleted",
            "progress",
        ]

    def get_description(self, obj):
        # First try to get the description field
        if obj.description:
            return obj.description
        # Fall back to content field if description is empty
        return obj.content if obj.content else None

    def get_isCompleted(self, obj):
        """Get completion status based on progress"""
        progress_percentage = self.get_progress(obj)
        return progress_percentage == 100

    def get_progress(self, obj):
        """Get the actual progress percentage for this chapter"""
        request = self.context.get("request")
        if not request or not request.user:
            return 0

        user = request.user

        # Get the service from the parent serializer context
        service = self.context.get("service")
        if not service:
            return 0

        try:
            # Get enrollment for this user and service
            enrollment = Enrollment.objects.filter(user=user, service=service).first()

            if not enrollment:
                return 0

            # Get progress for this enrollment and chapter
            progress_record = Progress.objects.filter(
                enrollment=enrollment, chapter=obj
            ).first()

            if progress_record:
                return progress_record.progress_percentage
            else:
                return 0

        except Exception:
            # If anything fails, return 0
            return 0


class ClientServiceDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed view of a service for clients
    """

    id = serializers.IntegerField(source="pk")
    title = serializers.CharField()
    shortDescription = serializers.CharField(
        source="short_description", allow_null=True
    )
    description = serializers.CharField()
    chapters = serializers.SerializerMethodField()
    featuredImage = serializers.SerializerMethodField()
    introVideo = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    status = serializers.CharField()
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    assignedAdvisors = serializers.SerializerMethodField()
    trainer = serializers.SerializerMethodField()
    meetingsScheduled = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "shortDescription",
            "description",
            "chapters",
            "featuredImage",
            "introVideo",
            "files",
            "status",
            "createdAt",
            "updatedAt",
            "assignedAdvisors",
            "trainer",
            "meetingsScheduled",
        ]

    def get_chapters(self, obj):
        """Serialize chapters with service context for progress calculation"""
        chapters = obj.chapters.all()
        serializer = ChapterSerializer(
            chapters,
            many=True,
            context={"request": self.context.get("request"), "service": obj},
        )
        return serializer.data

    def get_featuredImage(self, obj):
        return obj.featured_image.url if obj.featured_image else None

    def get_introVideo(self, obj):
        return obj.intro_video.url if obj.intro_video else None

    def get_files(self, obj):
        # Get service files
        service_files = ServiceFileSerializer(obj.service_files.all(), many=True).data

        # Get chapter files and mark them as chapter files
        chapter_files_list = []
        for chapter in obj.chapters.all():
            for chapter_file in chapter.chapter_files.all():
                serialized = ChapterFileSerializer(chapter_file).data
                chapter_files_list.append(serialized)

        # Combine both file types
        all_files = service_files + chapter_files_list
        return all_files

    def get_assignedAdvisors(self, obj):
        advisors = []
        for advisor in obj.advisors.all():
            advisors.append(
                {
                    "id": advisor.id,
                    "name": f"{advisor.first_name} {advisor.last_name}",
                    "profileImage": (
                        advisor.profile.profile_picture.url
                        if hasattr(advisor, "profile")
                        and advisor.profile.profile_picture
                        else None
                    ),
                }
            )
        return advisors

    def get_trainer(self, obj):
        trainer = getattr(obj, "trainer", None)
        if not trainer:
            return None
        return {
            "id": trainer.id,
            "name": trainer.get_full_name().strip() or trainer.username,
        }

    def get_meetingsScheduled(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return []

        client_user = request.user

        # Import Meeting and MeetingAttendee here to avoid circular imports
        from scheduling.models import Meeting, MeetingAttendee

        # Get meetings where client is an attendee
        client_meetings = Meeting.objects.filter(
            attendees__user=client_user,
            attendees__role="client",
            status__in=["scheduled", "confirmed", "active"],
        ).distinct()

        # Filter meetings that are related to this service
        # Method 1: Title contains service title
        title_matches = client_meetings.filter(title__icontains=obj.title)

        # Method 2: Meetings organized by the client that involve this service's trainers
        service_trainers = set()
        if obj.trainer:
            service_trainers.add(obj.trainer)
        service_trainers.update(obj.advisors.all())

        trainer_meetings = client_meetings.filter(
            scheduled_by=client_user,
            attendees__user__in=service_trainers,
            attendees__role="trainer"
        ).distinct()

        # Method 3: Meetings where service trainers are attendees or organizers
        trainer_involved_meetings = Meeting.objects.filter(
            Q(attendees__user__in=service_trainers, attendees__role="trainer") |
            Q(scheduled_by__in=service_trainers),
            attendees__user=client_user,
            attendees__role="client",
            status__in=["scheduled", "confirmed", "active"],
        ).distinct()

        # Combine all matching meetings
        all_matching_meetings = (title_matches | trainer_meetings | trainer_involved_meetings).distinct()

        meetings_data = []
        for meeting in all_matching_meetings.order_by("-scheduled_at"):
            meetings_data.append(
                {
                    "id": meeting.id,
                    "date": meeting.scheduled_at.date().isoformat(),
                    "time": meeting.scheduled_at.strftime("%H:%M"),
                    "status": meeting.status,
                }
            )

        return meetings_data
