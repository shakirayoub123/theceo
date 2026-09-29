from django.urls import path
from . import views

app_name = "comms"

urlpatterns = [
    # Notification endpoints
    path(
        "notifications/count/",
        views.NotificationCountView.as_view(),
        name="notification-count",
    ),
    path(
        "notifications/", views.NotificationListView.as_view(), name="notification-list"
    ),
    path(
        "notifications/mark-all-read/",
        views.MarkAllNotificationsReadView.as_view(),
        name="mark-all-notifications-read",
    ),
    path(
        "notifications/<int:notification_id>/mark-read/",
        views.MarkNotificationReadView.as_view(),
        name="mark-notification-read",
    ),
    path("email/", views.SendEmailView.as_view(), name="send-email"),
    path("contact/", views.ContactFormView.as_view(), name="contact-form"),
]
