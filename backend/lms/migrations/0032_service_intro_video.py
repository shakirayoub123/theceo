from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("lms", "0031_alter_service_order"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="intro_video",
            field=models.FileField(
                blank=True,
                help_text="Intro video shown before program access and on overview pages",
                null=True,
                upload_to="services/intro_videos/",
            ),
        ),
    ]
