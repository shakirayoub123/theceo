from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("people", "0007_client_country_client_referred_by_clientnote_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="address",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="lead",
            name="industry",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="lead",
            name="job_title",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="lead",
            name="position",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="client",
            name="address",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="client",
            name="industry",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="client",
            name="job_title",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="client",
            name="position",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
