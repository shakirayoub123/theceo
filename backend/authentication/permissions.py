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
