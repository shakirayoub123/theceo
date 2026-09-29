import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("lms", "0032_service_intro_video"),
    ]

    operations = [
        migrations.CreateModel(
            name="EbookEmailDownloadLink",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "token",
                    models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "purchase",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="email_download_link",
                        to="lms.ebookpurchase",
                    ),
                ),
            ],
        ),
    ]
