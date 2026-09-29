from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("lms", "0033_ebookemaildownloadlink"),
    ]

    operations = [
        migrations.AddField(
            model_name="chapter",
            name="short_description",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
