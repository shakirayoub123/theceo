from django.contrib import admin
from .models import (
    Service,
    Chapter,
    ChapterFile,
    ServiceFile,
    Asset,
    Enrollment,
    Progress,
    Certificate,
    Ebook,
    EbookPurchase,
    EbookSeries,
    Blog,
    Newsletter,
    Referral,
    Cart,
    CartItem,
    Appointment,
    StripePayment,
    Order,
)


class ChapterInline(admin.TabularInline):
    """Inline admin for chapters in services"""

    model = Chapter
    extra = 0
    fields = ("title", "order", "chapter_type", "is_preview", "is_mandatory")
    readonly_fields = ("created_at", "updated_at")
    show_change_link = True


class ServiceFileInline(admin.TabularInline):
    """Inline admin for service files"""

    model = ServiceFile
    extra = 0
    fields = ("title", "file_type", "file_size_display", "is_downloadable")
    readonly_fields = ("file_size_display", "created_at", "updated_at")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin for Service model"""

    list_display = (
        "title",
        "trainer",
        "status",
        "category",
        "difficulty_level",
        "price",
        "is_published",
        "enrolled_clients_count",
        "created_at",
    )
    list_filter = (
        "status",
        "category",
        "difficulty_level",
        "is_published",
        "is_featured",
        "created_at",
        "trainer",
    )
    search_fields = (
        "title",
        "short_description",
        "trainer__username",
        "trainer__email",
    )
    ordering = ("-created_at",)
    readonly_fields = ("enrolled_clients_count", "created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "short_description",
                    "description",
                    "trainer",
                    "advisors",
                )
            },
        ),
        (
            "Settings",
            {
                "fields": (
                    "status",
                    "category",
                    "difficulty_level",
                    "price",
                    "duration_weeks",
                    "is_published",
                    "is_featured",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "prerequisites",
                    "learning_outcomes",
                    "tags",
                    "featured_image",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "AI Features",
            {
                "fields": ("ai_chatbot_enabled", "chatbot_prompt"),
                "classes": ("collapse",),
            },
        ),
        (
            "Statistics",
            {"fields": ("rating", "enrolled_clients_count"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [ChapterInline, ServiceFileInline]

    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("trainer")
            .prefetch_related("advisors")
        )


class ChapterFileInline(admin.TabularInline):
    """Inline admin for chapter files"""

    model = ChapterFile
    extra = 0
    fields = (
        "title",
        "file_type",
        "file_size_display",
        "is_downloadable",
        "download_count",
    )
    readonly_fields = ("file_size_display", "created_at", "updated_at")


class AssetInline(admin.TabularInline):
    """Inline admin for chapter assets"""

    model = Asset
    extra = 0
    fields = ("name", "asset_type", "file")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    """Admin for Chapter model"""

    list_display = (
        "title",
        "service",
        "week",
        "order",
        "chapter_type",
        "duration_minutes",
        "is_preview",
        "is_mandatory",
        "upload_date",
    )
    list_filter = (
        "chapter_type",
        "is_preview",
        "is_mandatory",
        "week",
        "upload_date",
        "service__category",
    )
    search_fields = (
        "title",
        "subtitle",
        "service__title",
        "service__trainer__username",
    )
    ordering = ("service", "week", "order")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Chapter Information",
            {"fields": ("service", "title", "subtitle", "content", "description")},
        ),
        (
            "Settings",
            {
                "fields": (
                    "week",
                    "order",
                    "chapter_type",
                    "duration_minutes",
                    "is_preview",
                    "is_mandatory",
                    "learning_objectives",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Media", {"fields": ("video", "upload_date"), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [ChapterFileInline, AssetInline]

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("service", "service__trainer")
        )


@admin.register(ChapterFile)
class ChapterFileAdmin(admin.ModelAdmin):
    """Admin for ChapterFile model"""

    list_display = (
        "title",
        "chapter",
        "file_type",
        "file_size_display",
        "is_downloadable",
        "download_count",
        "created_at",
    )
    list_filter = ("file_type", "is_downloadable", "created_at")
    search_fields = ("title", "chapter__title", "chapter__service__title")
    readonly_fields = ("file_size_display", "created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("chapter", "chapter__service")
        )


@admin.register(ServiceFile)
class ServiceFileAdmin(admin.ModelAdmin):
    """Admin for ServiceFile model"""

    list_display = (
        "title",
        "service",
        "file_type",
        "file_size_display",
        "is_downloadable",
        "download_count",
        "created_at",
    )
    list_filter = ("file_type", "is_downloadable", "created_at")
    search_fields = ("title", "service__title", "service__trainer__username")
    readonly_fields = ("file_size_display", "created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("service", "service__trainer")
        )


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    """Admin for Asset model"""

    list_display = ("name", "chapter", "asset_type", "created_at")
    list_filter = ("asset_type", "created_at")
    search_fields = ("name", "chapter__title", "chapter__service__title")
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("chapter", "chapter__service")
        )


class ProgressInline(admin.TabularInline):
    """Inline admin for progress in enrollments"""

    model = Progress
    extra = 0
    fields = ("chapter", "completed", "completed_at")
    readonly_fields = ("completed_at",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """Admin for Enrollment model"""

    list_display = ("user", "service", "enrolled_at", "completed")
    list_filter = ("completed", "enrolled_at", "service__category")
    search_fields = ("user__username", "user__email", "service__title")
    ordering = ("-enrolled_at",)
    readonly_fields = ("enrolled_at",)

    inlines = [ProgressInline]

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("user", "service", "service__trainer")
        )


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    """Admin for Progress model"""

    list_display = ("enrollment", "chapter", "completed", "completed_at")
    list_filter = ("completed", "completed_at")
    search_fields = (
        "enrollment__user__username",
        "enrollment__service__title",
        "chapter__title",
    )
    readonly_fields = ("completed_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related(
                "enrollment", "enrollment__user", "enrollment__service", "chapter"
            )
        )


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    """Admin for Certificate model"""

    list_display = ("enrollment", "issued_at")
    search_fields = ("enrollment__user__username", "enrollment__service__title")
    readonly_fields = ("issued_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("enrollment", "enrollment__user", "enrollment__service")
        )


@admin.register(Ebook)
class EbookAdmin(admin.ModelAdmin):
    """Admin for Ebook model"""

    list_display = ("title", "author", "status", "price", "uploaded_by", "created_at")
    list_filter = ("status", "created_at", "uploaded_by")
    search_fields = ("title", "author", "topic", "uploaded_by__username")
    ordering = ("-created_at",)
    readonly_fields = ("total_sold", "created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("title", "topic", "description", "author", "isbn", "pages")},
        ),
        (
            "Files & Media",
            {"fields": ("file", "cover_image"), "classes": ("collapse",)},
        ),
        ("Pricing & Series", {"fields": ("price", "series"), "classes": ("collapse",)}),
        ("Settings", {"fields": ("status", "uploaded_by"), "classes": ("collapse",)}),
        ("Statistics", {"fields": ("total_sold",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("uploaded_by", "series")


@admin.register(EbookPurchase)
class EbookPurchaseAdmin(admin.ModelAdmin):
    """Admin for EbookPurchase model"""

    list_display = ("ebook", "customer_info", "price_paid", "status", "purchased_at")
    list_filter = ("status", "purchased_at", "ebook__title")
    search_fields = (
        "ebook__title",
        "customer_name",
        "customer_email",
        "user__username",
        "user__email",
    )
    ordering = ("-purchased_at",)
    readonly_fields = ("purchased_at", "order_id")

    def customer_info(self, obj):
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        return f"{obj.customer_name} ({obj.customer_email})"

    customer_info.short_description = "Customer"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("ebook", "user")


@admin.register(EbookSeries)
class EbookSeriesAdmin(admin.ModelAdmin):
    """Admin for EbookSeries model"""

    list_display = ("title", "created_by", "ebooks_count", "created_at")
    search_fields = ("title", "description", "created_by__username")
    readonly_fields = ("ebooks_count", "created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("created_by")


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    """Admin for Blog model"""

    list_display = (
        "title",
        "author",
        "status",
        "published_at",
        "views_count",
        "time_to_read",
    )
    list_filter = ("status", "published_at", "author")
    search_fields = ("title", "topic", "author__username")
    ordering = ("-published_at",)
    readonly_fields = (
        "views_count",
        "total_views",
        "published_at",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("title", "topic", "short_description", "content", "author")},
        ),
        (
            "Settings",
            {
                "fields": ("status", "time_to_read", "schedule_on", "thumbnail_image"),
                "classes": ("collapse",),
            },
        ),
        (
            "Statistics",
            {"fields": ("views_count", "total_views"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("published_at", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("author")


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    """Admin for Newsletter model"""

    list_display = ("title", "author", "status", "published_at", "pages", "views_count")
    list_filter = ("status", "published_at", "author")
    search_fields = ("title", "short_description", "author__username")
    ordering = ("-published_at",)
    readonly_fields = (
        "views_count",
        "total_views",
        "published_at",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Basic Information", {"fields": ("title", "short_description", "author")}),
        (
            "Content",
            {"fields": ("file", "thumbnail_image", "pages"), "classes": ("collapse",)},
        ),
        ("Settings", {"fields": ("status", "schedule_on"), "classes": ("collapse",)}),
        (
            "Statistics",
            {"fields": ("views_count", "total_views"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("published_at", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("author")


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    """Admin for Referral model"""

    list_display = (
        "referrer",
        "referred_user",
        "referral_code",
        "is_converted",
        "converted_at",
        "created_at",
    )
    list_filter = ("is_converted", "created_at")
    search_fields = ("referrer__username", "referred_user__username", "referral_code")
    readonly_fields = ("created_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("referrer", "referred_user")


class CartItemInline(admin.TabularInline):
    """Inline admin for cart items"""

    model = CartItem
    extra = 0
    fields = ("ebook", "added_at")
    readonly_fields = ("added_at",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Admin for Cart model"""

    list_display = (
        "user_info",
        "total_items",
        "total_price",
        "created_at",
        "updated_at",
    )
    search_fields = ("user__username", "user__email", "cart_id")
    readonly_fields = ("total_items", "total_price", "created_at", "updated_at")

    inlines = [CartItemInline]

    def user_info(self, obj):
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        return f"Anonymous ({obj.cart_id})"

    user_info.short_description = "User"

    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .prefetch_related("items")
        )


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """Admin for CartItem model"""

    list_display = ("cart", "ebook", "added_at")
    search_fields = ("cart__user__username", "ebook__title")
    readonly_fields = ("added_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("cart", "cart__user", "ebook")
        )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin for Appointment model"""

    list_display = (
        "full_name",
        "email",
        "preferred_date",
        "preferred_time",
        "status",
        "created_at",
    )
    list_filter = ("status", "preferred_date", "created_at")
    search_fields = ("full_name", "email", "phone")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(StripePayment)
class StripePaymentAdmin(admin.ModelAdmin):
    """Admin for StripePayment model"""

    list_display = (
        "id",
        "user_info",
        "stripe_payment_intent_id",
        "amount",
        "currency",
        "status",
        "created_at",
    )
    list_filter = ("status", "currency", "created_at")
    search_fields = (
        "stripe_payment_intent_id",
        "user__username",
        "user__email",
    )
    readonly_fields = ("id", "created_at", "updated_at", "metadata")
    ordering = ("-created_at",)

    def user_info(self, obj):
        return f"{obj.user.username} ({obj.user.email})"

    user_info.short_description = "User"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin for Order model"""

    list_display = (
        "id",
        "user_info",
        "total",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "user__username",
        "user__email",
    )
    readonly_fields = ("id", "items", "created_at", "updated_at")
    ordering = ("-created_at",)

    fieldsets = (
        (
            "Order Information",
            {"fields": ("id", "user", "stripe_payment", "status")},
        ),
        (
            "Items",
            {"fields": ("items",), "classes": ("collapse",)},
        ),
        (
            "Pricing",
            {"fields": ("subtotal", "tax", "total")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def user_info(self, obj):
        return f"{obj.user.username} ({obj.user.email})"

    user_info.short_description = "User"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user", "stripe_payment")
