from django.urls import path
from . import views

urlpatterns = [
    # Get available trainers
    path(
        "trainers/available/",
        views.GetAvailableTrainersView.as_view(),
        name="available-trainers",
    ),
    # Get meeting types
    path("meeting-types/", views.GetMeetingTypesView.as_view(), name="meeting-types"),
    # Get available time slots
    path(
        "slots/available/",
        views.GetAvailableSlotsView.as_view(),
        name="available-slots",
    ),
    # Schedule a meeting
    path("schedule/", views.ScheduleMeetingView.as_view(), name="schedule-meeting"),
    # Meeting details
    path(
        "meeting/<meeting_id>/",
        views.MeetingDetailView.as_view(),
        name="meeting-detail",
    ),
    # Confirm meeting attendance
    path(
        "meeting/<meeting_id>/confirm/",
        views.ConfirmMeetingAttendanceView.as_view(),
        name="confirm-attendance",
    ),
    # Get user's meetings
    path("my-meetings/", views.MyMeetingsView.as_view(), name="my-meetings"),
    # Calendar view
    path("calendar/", views.CalendarView.as_view(), name="calendar"),
    # Trainer calendar view
    path(
        "trainer/calendar/",
        views.TrainerCalendarView.as_view(),
        name="trainer-calendar",
    ),
    # Trainer schedule meeting
    path(
        "trainer/schedule-meeting/",
        views.TrainerScheduleMeetingView.as_view(),
        name="trainer-schedule-meeting",
    ),
]
