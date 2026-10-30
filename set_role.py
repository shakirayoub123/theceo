import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tci_backend.settings")
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
email = "admin@theceoinfluencers.com"
user = User.objects.filter(email=email).first()
if user:
    user.role = "admin"
    user.save()
    print("User role set to admin")
else:
    print("User not found")
