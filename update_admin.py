import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tci_backend.settings")
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.filter(username="admin").first() or User.objects.filter(email="admin@theceoinfluencers.com").first() or User.objects.filter(email="info@theceoinfluencers.com").first()
if user:
    user.set_password("StrongPass123!")
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print("User reset")
else:
    try:
        User.objects.create_superuser(username="admin", email="admin@theceoinfluencers.com", password="StrongPass123!")
    except TypeError:
        User.objects.create_superuser("admin", "admin@theceoinfluencers.com", "StrongPass123!")
    print("User created")
