from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_alter_user_otp_code"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="unencrypted_password",
        ),
    ]
