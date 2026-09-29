from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class Service(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("archived", "Archived"),
        ("draft", "Draft"),
    )

    CATEGORY_CHOICES = (
        ("general", "General Fitness"),
        ("nutrition", "Nutrition"),
        ("mindfulness", "Mindfulness"),
        ("strength", "Strength Training"),
        ("cardio", "Cardio"),
        ("yoga", "Yoga"),
    )

    DIFFICULTY_CHOICES = (
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    )

    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="general"
    )
    difficulty_level = models.CharField(
        max_length=15, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_weeks = models.PositiveIntegerField(
        default=4, help_text="Duration in weeks"
    )
    trainer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="services_created"
    )
    advisors = models.ManyToManyField(
        User,
        related_name="services_advised",
        blank=True,
        limit_choices_to={"role": "trainer"},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)
    featured_image = models.ImageField(
        upload_to="services/featured/", null=True, blank=True
    )
    intro_video = models.FileField(
        upload_to="services/intro_videos/",
        null=True,
        blank=True,
        help_text="Intro video shown before program access and on overview pages",
    )
    ai_chatbot_enabled = models.BooleanField(default=False)
    chatbot_prompt = models.TextField(
        blank=True, null=True, help_text="Prompt for AI chatbot"
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    tags = models.CharField(
        max_length=255, blank=True, null=True, help_text="Comma-separated tags"
    )
    prerequisites = models.TextField(blank=True, null=True)
    learning_outcomes = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, help_text="Order for displaying services")
    coming_soon = models.BooleanField(default=False, help_text="Mark as coming soon")
    coming_soon = models.BooleanField(default=False, help_text="Mark as coming soon")
    is_featured = models.BooleanField(default=False)
    ai_chatbot_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    @property
    def enrolled_clients_count(self):
        return self.enrollments.filter(user__role="client").count()

    @property
    def advisors_list(self):
        return list(self.advisors.values_list("username", flat=True))

    @property
    def rating_display(self):
        """Returns a human-readable rating like 4.5/5.0"""
        return f"{self.rating:.1f}/5.0"

    @property
    def has_prerequisites(self):
        """Check if service has prerequisites defined"""
        return bool(self.prerequisites and self.prerequisites.strip())

    @property
    def tags_list(self):
        """Return tags as a list"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]


class Chapter(models.Model):
    """Enhanced chapter model for services with metadata"""

    CHAPTER_TYPE_CHOICES = (
        ("lesson", "Lesson"),
        ("assessment", "Assessment"),
        ("exercise", "Exercise"),
        ("quiz", "Quiz"),
        ("workshop", "Workshop"),
    )

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="chapters"
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    week = models.PositiveIntegerField(default=1)
    short_description = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    upload_date = models.DateField(default=timezone.now)
    is_expanded = models.BooleanField(default=False)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    chapter_type = models.CharField(
        max_length=20, choices=CHAPTER_TYPE_CHOICES, default="lesson"
    )
    duration_minutes = models.PositiveIntegerField(
        default=30, help_text="Estimated time to complete in minutes"
    )
    is_preview = models.BooleanField(
        default=False, help_text="If true, this chapter is available as a preview"
    )
    is_mandatory = models.BooleanField(
        default=True, help_text="If true, this chapter must be completed"
    )
    learning_objectives = models.TextField(blank=True, null=True)
    video = models.FileField(
        upload_to="chapter_videos/",
        blank=True,
        null=True,
        help_text="Video file for this chapter",
    )

    class Meta:
        ordering = ["week", "order"]

    def __str__(self):
        return f"{self.service.title} - {self.title}"

    @property
    def has_files(self):
        """Check if chapter has associated files"""
        return self.assets.exists() or self.chapter_files.exists()


class ChapterFile(models.Model):
    """Model for files associated with chapters"""

    FILE_TYPE_CHOICES = (
        ("document", "Document"),
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("spreadsheet", "Spreadsheet"),
        ("presentation", "Presentation"),
        ("other", "Other"),
    )

    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="chapter_files"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to="service_files/")
    file_type = models.CharField(
        max_length=20, choices=FILE_TYPE_CHOICES, default="document"
    )
    file_size = models.PositiveIntegerField(default=0, help_text="Size in bytes")
    file_extension = models.CharField(max_length=10, blank=True, null=True)
    is_downloadable = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        verbose_name = "Chapter File"
        verbose_name_plural = "Chapter Files"

    def __str__(self):
        return f"{self.chapter.title} - {self.title}"

    def save(self, *args, **kwargs):
        """Auto-calculate file size and extension"""
        if self.file and not self.file_size:
            self.file_size = self.file.size

        if self.file and not self.file_extension:
            # Extract extension from filename
            filename = self.file.name
            if "." in filename:
                self.file_extension = filename.split(".")[-1].lower()

        super().save(*args, **kwargs)

    @property
    def file_size_display(self):
        """Returns human-readable file size"""
        size = self.file_size
        # Convert bytes to KB, MB, etc.
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024 or unit == "GB":
                return f"{size:.2f} {unit}"
            size /= 1024


class ServiceFile(models.Model):
    """Model for files associated directly with services"""

    FILE_TYPE_CHOICES = (
        ("document", "Document"),
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("spreadsheet", "Spreadsheet"),
        ("presentation", "Presentation"),
        ("other", "Other"),
    )

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="service_files"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to="service_resources/")
    file_type = models.CharField(
        max_length=20, choices=FILE_TYPE_CHOICES, default="document"
    )
    file_size = models.PositiveIntegerField(default=0, help_text="Size in bytes")
    file_extension = models.CharField(max_length=10, blank=True, null=True)
    is_downloadable = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        verbose_name = "Service File"
        verbose_name_plural = "Service Files"

    def __str__(self):
        return f"{self.service.title} - {self.title}"

    def save(self, *args, **kwargs):
        """Auto-calculate file size and extension"""
        if self.file and not self.file_size:
            self.file_size = self.file.size

        if self.file and not self.file_extension:
            # Extract extension from filename
            filename = self.file.name
            if "." in filename:
                self.file_extension = filename.split(".")[-1].lower()

        super().save(*args, **kwargs)

    @property
    def file_size_display(self):
        """Returns human-readable file size"""
        size = self.file_size
        # Convert bytes to KB, MB, etc.
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024 or unit == "GB":
                return f"{size:.2f} {unit}"
            size /= 1024


class Asset(models.Model):
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="assets"
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="assets/")
    asset_type = models.CharField(
        max_length=50,
        choices=[
            ("video", "Video"),
            ("image", "Image"),
            ("document", "Document"),
        ],
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="enrollments"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "service")

    def __str__(self):
        return f"{self.user.username} enrolled in {self.service.title}"


class Progress(models.Model):
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="progress"
    )
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percentage = models.PositiveIntegerField(
        default=0,
        help_text="Progress percentage (0-100)",
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    class Meta:
        unique_together = ("enrollment", "chapter")

    def __str__(self):
        return f"Progress: {self.enrollment} - {self.chapter} ({self.progress_percentage}%)"

    def save(self, *args, **kwargs):
        """Auto-set completed status when progress reaches 100%"""
        if self.progress_percentage >= 100 and not self.completed:
            self.completed = True
            self.completed_at = timezone.now()
        elif self.progress_percentage < 100 and self.completed:
            # Reset completed status if progress goes below 100%
            self.completed = False
            self.completed_at = None
        super().save(*args, **kwargs)


class Certificate(models.Model):
    enrollment = models.OneToOneField(
        Enrollment, on_delete=models.CASCADE, related_name="certificate"
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_file = models.FileField(
        upload_to="certificates/", null=True, blank=True
    )

    def __str__(self):
        return f"Certificate for {self.enrollment}"


class Ebook(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("draft", "Draft"),
    )

    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    file = models.FileField(upload_to="ebooks/", null=True, blank=True)
    cover_image = models.ImageField(upload_to="ebooks/covers/", null=True, blank=True)
    author = models.CharField(max_length=255, blank=True, null=True)
    isbn = models.CharField(max_length=13, blank=True, null=True)
    pages = models.PositiveIntegerField(default=0)
    series = models.ForeignKey(
        "EbookSeries",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ebooks",
    )
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="uploaded_ebooks"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def total_sold(self):
        return self.purchases.count()


class EbookPurchase(models.Model):
    PURCHASE_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    ebook = models.ForeignKey(Ebook, on_delete=models.CASCADE, related_name="purchases")
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ebook_purchases",
        null=True,
        blank=True,  # Allow guest purchases
    )

    # Guest customer fields for checkout without account
    customer_name = models.CharField(max_length=255, null=True, blank=True)
    customer_email = models.EmailField(null=True, blank=True)
    customer_phone = models.CharField(max_length=20, null=True, blank=True)

    purchased_at = models.DateTimeField(auto_now_add=True)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)

    # Group multiple ebooks purchased together
    order_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=PURCHASE_STATUS_CHOICES, default="completed"
    )

    def __str__(self):
        if self.user:
            return f"{self.user.username} purchased {self.ebook.title}"
        return f"{self.customer_name} purchased {self.ebook.title}"


class EbookEmailDownloadLink(models.Model):
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    purchase = models.OneToOneField(
        EbookPurchase,
        on_delete=models.CASCADE,
        related_name="email_download_link",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Email download link for {self.purchase}"


class EbookSeries(models.Model):
    """Series for grouping ebooks"""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    cover_image = models.ImageField(
        upload_to="ebook_series/covers/", null=True, blank=True
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_series"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def ebooks_count(self):
        return self.ebooks.count()


class Blog(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("scheduled", "Scheduled"),
        ("archived", "Archived"),
    )

    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255, blank=True, null=True)
    short_description = models.TextField(blank=True, null=True)
    content = models.TextField()  # Rich text content
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    thumbnail_image = models.ImageField(
        upload_to="blogs/thumbnails/", null=True, blank=True
    )
    time_to_read = models.PositiveIntegerField(
        default=5, help_text="Time to read in minutes"
    )
    views_count = models.PositiveIntegerField(default=0)
    schedule_on = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blogs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-set published_at when status changes to published
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()

        if not self.slug:
            from django.utils.text import slugify

            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Blog.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def total_views(self):
        return self.views_count


class Newsletter(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("scheduled", "Scheduled"),
        ("archived", "Archived"),
    )

    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    file = models.FileField(upload_to="newsletters/", null=True, blank=True)
    thumbnail_image = models.ImageField(
        upload_to="newsletters/thumbnails/", null=True, blank=True
    )
    pages = models.PositiveIntegerField(default=1)
    views_count = models.PositiveIntegerField(default=0)
    schedule_on = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="newsletters"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-set published_at when status changes to published
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def total_views(self):
        return self.views_count


class Referral(models.Model):
    referrer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="referrals_made"
    )
    referred_user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="referred_by"
    )
    referral_code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_converted = models.BooleanField(
        default=False
    )  # Whether the referred user completed signup
    converted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.referrer.username} referred {self.referred_user.username}"

    class Meta:
        ordering = ["-created_at"]


class Cart(models.Model):
    """Shopping cart for ebooks"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="cart", null=True, blank=True
    )
    cart_id = models.UUIDField(unique=True, null=True, blank=True, editable=False)
    items = models.ManyToManyField(Ebook, through="CartItem", related_name="cart_items")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.username}"
        else:
            return f"Anonymous Cart {self.cart_id}"

    @property
    def total_items(self):
        return self.cart_items.count()

    @property
    def total_price(self):
        return sum(item.ebook.price for item in self.cart_items.all())


class CartItem(models.Model):
    """Individual items in the cart"""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="cart_items")
    ebook = models.ForeignKey(Ebook, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["cart", "ebook"]

    def __str__(self):
        user_str = (
            self.cart.user.username
            if self.cart.user
            else f"Anonymous {self.cart.cart_id}"
        )
        return f"{self.ebook.title} in {user_str}'s cart"


class Appointment(models.Model):
    """Scheduled call appointments"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="appointments",
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    preferred_date = models.DateField()
    preferred_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment for {self.full_name} on {self.preferred_date} at {self.preferred_time}"


class ClientFormAnswers(models.Model):
    """Model to store client onboarding questionnaire answers"""

    user_email = models.EmailField(help_text="Email of the user submitting the form")
    questionnaire_title = models.CharField(
        max_length=255, help_text="Title of the questionnaire"
    )
    data = models.JSONField(
        help_text="Array of question-answer pairs: [{question: string, answer: string}]"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Form answers for {self.user_email} - {self.questionnaire_title}"

    class Meta:
        verbose_name = "Client Form Answer"
        verbose_name_plural = "Client Form Answers"


class StripePayment(models.Model):
    """Model to store Stripe payment information"""

    STATUS_CHOICES = (
        ("requires_payment_method", "Requires Payment Method"),
        ("succeeded", "Succeeded"),
        ("failed", "Failed"),
        ("processing", "Processing"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="stripe_payments"
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Stripe Payment Intent ID",
        null=True,
        blank=True,
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Amount in dollars"
    )
    currency = models.CharField(max_length=3, default="usd")
    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default="requires_payment_method"
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Stripe Payment"
        verbose_name_plural = "Stripe Payments"

    def __str__(self):
        return f"StripePayment {self.stripe_payment_intent_id} - {self.user.email}"


class Order(models.Model):
    """Model to store order information"""

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    stripe_payment = models.OneToOneField(
        StripePayment,
        on_delete=models.CASCADE,
        related_name="order",
        null=True,
        blank=True,
    )
    items = models.JSONField(help_text="Array of ordered items")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order {self.id} - {self.user.email}"
