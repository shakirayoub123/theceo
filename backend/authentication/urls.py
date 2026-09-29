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
)

app_name = "auth"

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", CookieTokenRefreshView.as_view(), name="refresh"),
    path("token/refresh", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("me", UserDetailView.as_view(), name="user_detail"),
    path("suspend/<int:user_id>", SuspendUserView.as_view(), name="suspend_user"),
    path(
        "approve_trainer/<int:user_id>",
        ApproveTrainerView.as_view(),
        name="approve_trainer",
    ),
    path("verify_email", VerifyEmailView.as_view(), name="verify_email"),
    # Password Management URLs
    path("forgot-password", ForgotPasswordView.as_view(), name="forgot_password"),
    path("verify-otp", VerifyOTPView.as_view(), name="verify_otp"),
    path("reset-password", ResetPasswordView.as_view(), name="reset_password"),
]
