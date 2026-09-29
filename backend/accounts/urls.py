from django.urls import path
from authentication.jwt_cookies import CookieTokenRefreshView, LogoutView
from .views import (
    RegisterView,
    LoginView,
    UserDetailView,
    SuspendUserView,
    ApproveTrainerView,
    VerifyEmailView,
    ForgotPasswordView,
    VerifyOTPView,
    ResetPasswordView,
    AdminDashboardView,
    ClientDetailView,
    ModifyPermissionsView,
    GetUserPermissionsView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="refresh"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", UserDetailView.as_view(), name="user_detail"),
    path("forgot_password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("verify_otp/", VerifyOTPView.as_view(), name="verify_otp"),
    path("reset_password/", ResetPasswordView.as_view(), name="reset_password"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path(
        "modify_permissions/",
        ModifyPermissionsView.as_view(),
        name="modify_permissions",
    ),
    path(
        "modify_permissions/<int:user_id>/",
        ModifyPermissionsView.as_view(),
        name="get_user_permissions",
    ),
    path(
        "my_permissions/", GetUserPermissionsView.as_view(), name="get_my_permissions"
    ),
    path("client/<int:user_id>/", ClientDetailView.as_view(), name="client_detail"),
    path("client/", ClientDetailView.as_view(), name="my_client_detail"),
    path("suspend/<int:user_id>/", SuspendUserView.as_view(), name="suspend_user"),
    path(
        "approve_trainer/<int:user_id>/",
        ApproveTrainerView.as_view(),
        name="approve_trainer",
    ),
    path("verify_email/", VerifyEmailView.as_view(), name="verify_email"),
]
