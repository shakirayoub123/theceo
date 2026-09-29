from rest_framework import permissions


class IsTrainerOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.role == "trainer" and obj.trainer == request.user


class IsClientOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.role == "client" and obj.client == request.user


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "admin"


class IsSales(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "sales"


class IsTrainer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "trainer"


class IsClientOrAssignedAdvisor(permissions.BasePermission):
    """
    Custom permission to allow:
    - Clients to access their own data
    - Trainers/Sales to access data of clients assigned to them
    - Admins to access all data
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admins can access everything
        if user.role == "admin":
            return True

        # Clients can only access their own data
        if user.role == "client":
            if hasattr(obj, "user"):
                return str(obj.user.id) == str(user.id)
            elif hasattr(obj, "client") and hasattr(obj.client, "user"):
                return str(obj.client.user.id) == str(user.id)
            return False

        # Trainers and Sales can access data of assigned clients
        if user.role in ["trainer", "sales"]:
            if hasattr(obj, "user"):
                # Check if this user is assigned to the client
                try:
                    from people.models import Client

                    client = Client.objects.get(user=obj.user)
                    return client.assigned_sales == user
                except:
                    return False
            elif hasattr(obj, "client") and hasattr(obj.client, "user"):
                return obj.client.assigned_sales == user

        return False
