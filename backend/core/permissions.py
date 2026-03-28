from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        user_field = getattr(obj, 'user', None) or getattr(obj, 'user_id', None)
        if user_field is None:
            return False
        if hasattr(user_field, 'pk'):
            return user_field.pk == request.user.pk
        return user_field == request.user.pk
