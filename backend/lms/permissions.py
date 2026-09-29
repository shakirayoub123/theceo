from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsTrainer(permissions.BasePermission):
    """
    Permission check for trainer role.
    """

    message = "You must be a trainer to perform this action."

    def has_permission(self, request, view):
        """
        Check if the user has trainer role or permissions.
        """
        user = request.user

        # Check if user has trainer profile
        if hasattr(user, "profile"):
            # Check if profile has role or user_type attribute
            if hasattr(user.profile, "role"):
                return user.profile.role == "trainer"
            elif hasattr(user.profile, "user_type"):
                return user.profile.user_type == "trainer"

        # Check if user is part of trainer group
        return user.groups.filter(name="Trainers").exists()

    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission for the specific object.
        For meetings, check if user is assigned as a trainer.
        """
        user = request.user

        # For Meeting objects
        if hasattr(obj, "attendees"):
            return obj.attendees.filter(user=user, role="trainer").exists()

        return False
