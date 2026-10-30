import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tci_backend.settings")
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
email = "admin@theceoinfluencers.com"
user = User.objects.filter(email=email).first()
if user:
    user.set_password("StrongPass123!")
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print("User reset")
else:
    try:
        User.objects.create_superuser(email=email, password="AdminUser123!")
    except TypeError:
        User.objects.create_superuser(email, email, "AdminUser123!")
    print("User created")
