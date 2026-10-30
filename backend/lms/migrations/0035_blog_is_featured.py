from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lms", "0034_chapter_short_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="blog",
            name="is_featured",
            field=models.BooleanField(
                default=False,
                help_text="Show this blog as the featured post on the homepage",
            ),
        ),
    ]