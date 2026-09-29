from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Client
from accounts.models import UserPermission

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to create profile based on user role when a new user is created.
    """
    if created:  # Only create on new user creation
        if instance.role == "client":
            # Create a basic client record - details will be filled in later
            Client.objects.get_or_create(
                user=instance,
                defaults={
                    "first_name": instance.first_name or "",
                    "last_name": instance.last_name or "",
                    "email": instance.email or "",
                },
            )

        # Create user permissions for all users
        UserPermission.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def manage_user_profiles(sender, instance, **kwargs):
    """
    Signal to manage profiles based on user role changes.
    Ensures the correct profile exists and removes unnecessary ones.
    """
    if instance.role == "client":
        # Ensure client profile exists
        Client.objects.get_or_create(
            user=instance,
            defaults={
                "first_name": instance.first_name or "",
                "last_name": instance.last_name or "",
                "email": instance.email or "",
            },
        )
    else:
        # For other roles (admin, trainer, sales), remove client profile if it exists
        if hasattr(instance, "client_profile"):
            instance.client_profile.delete()

    # Update permissions when role changes
    if hasattr(instance, "permissions"):
        instance.permissions.set_default_permissions()
