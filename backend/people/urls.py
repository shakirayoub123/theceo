from django.urls import path
from . import views

urlpatterns = [
    path("sales/clients/", views.SalesClientsView.as_view(), name="sales-clients"),
    path(
        "sales/clients/new/",
        views.SalesNewClientsView.as_view(),
        name="sales-new-clients",
    ),
    path(
        "sales/clients/create/",
        views.SalesCreateClientView.as_view(),
        name="sales-create-client",
    ),
    path(
        "sales/clients/existing/",
        views.SalesExistingClientsView.as_view(),
        name="sales-clients-existing",
    ),
    path(
        "sales/dashboard/", views.SalesDashboardView.as_view(), name="sales-dashboard"
    ),
    path(
        "sales/clientDetails/<user_uuid>/",
        views.SalesClientDetailView.as_view(),
        name="sales-client-detail",
    ),
    path(
        "sales/generatePassword/<user_uuid>/",
        views.GeneratePasswordView.as_view(),
        name="generate-password",
    ),
    path(
        "sales/ExistingClients/",
        views.ExistingClientsView.as_view(),
        name="existing-clients",
    ),
    path("sales/clients/leads/", views.LeadsView.as_view(), name="leads"),
    path("sales/calendar/", views.SalesCalendarView.as_view(), name="sales-calendar"),
    path(
        "sales/create-payment-link/",
        views.SalesCreatePaymentLinkView.as_view(),
        name="sales-create-payment-link",
    ),
    path(
        "sales/assign-sales/<client_id>/",
        views.AssignSalesToClientView.as_view(),
        name="assign-sales-to-client",
    ),
    # Lead Management URLs
    path("leads/create/", views.CreateLeadView.as_view(), name="create-lead"),
    path("leads/list/", views.LeadsListView.as_view(), name="leads-list"),
    path(
        "leads/<int:lead_id>/approve-meeting/",
        views.ApproveMeetingView.as_view(),
        name="approve-meeting",
    ),
    path(
        "leads/<int:lead_id>/send-payment-link/",
        views.SendPaymentLinkView.as_view(),
        name="send-payment-link",
    ),
    # Assessment URLs
    path(
        "assessment/login/",
        views.AccessCodeLoginView.as_view(),
        name="access-code-login",
    ),
    path(
        "assessment/<int:lead_id>/submit/",
        views.SubmitAssessmentView.as_view(),
        name="submit-assessment",
    ),
    # Client Management URLs
    path(
        "sales/fetchUserDetails/<user_uuid>/",
        views.FetchUserDetailsView.as_view(),
        name="fetch-user-details",
    ),
    path(
        "sales/updateUserDetails/<user_uuid>/",
        views.UpdateUserDetailsView.as_view(),
        name="update-user-details",
    ),
    # Lead Progress Tracking URLs
    path(
        "lead/verifyCode/", views.VerifyLeadCodeView.as_view(), name="verify-lead-code"
    ),
    path(
        "lead/getProgress/<lead_uuid>/",
        views.GetLeadProgressView.as_view(),
        name="get-lead-progress",
    ),
    path(
        "lead/getProgress/<lead_uuid>/<int:assessment_id>/",
        views.GetLeadAssessmentProgressView.as_view(),
        name="get-assessment-progress",
    ),
    path(
        "lead/saveProgress/<lead_uuid>/<int:assessment_id>/",
        views.SaveLeadAssessmentProgressView.as_view(),
        name="save-assessment-progress",
    ),
    # Stripe Webhook
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
    # Trainer Clients URL
    path(
        "trainer/clients/", views.TrainerClientsView.as_view(), name="trainer-clients"
    ),
    # Client Dashboard API URLs
    path(
        "clients/<clientId>/",
        views.ClientProfileView.as_view(),
        name="client-profile",
    ),
    path(
        "clients/<clientId>/overview/",
        views.ClientOverviewView.as_view(),
        name="client-overview",
    ),
    path(
        "clients/<clientId>/meetings/",
        views.ClientMeetingsView.as_view(),
        name="client-meetings",
    ),
    path(
        "clients/<clientId>/meetings/<meetingId>/transcript/",
        views.ClientMeetingTranscriptView.as_view(),
        name="client-meeting-transcript",
    ),
    path(
        "clients/<clientId>/services/",
        views.ClientProgramsView.as_view(),
        name="client-services",
    ),
    path(
        "clients/<clientId>/notes/",
        views.ClientNotesView.as_view(),
        name="client-notes",
    ),
    path(
        "clients/<clientId>/notes/<noteId>/",
        views.ClientNoteDetailView.as_view(),
        name="client-note-detail",
    ),
    path(
        "clients/<clientId>/progress/",
        views.ClientProgressView.as_view(),
        name="client-progress",
    ),
    path(
        "clients/<clientId>/chat/sessions/",
        views.ClientChatSessionsView.as_view(),
        name="client-chat-sessions",
    ),
    path(
        "clients/<clientId>/chat/messages/<sessionId>/",
        views.ClientChatMessagesView.as_view(),
        name="client-chat-messages",
    ),
    # New Chat and Meeting Management URLs
    path("chats/", views.InitiateChatSessionView.as_view(), name="initiate-chat"),
    path(
        "chats/<chat_id>/messages/",
        views.SendChatMessageView.as_view(),
        name="send-chat-message",
    ),
    path(
        "chats/<chat_id>/",
        views.EndChatSessionView.as_view(),
        name="end-chat-session",
    ),
    path(
        "meetings/<meeting_id>/",
        views.CancelMeetingView.as_view(),
        name="cancel-meeting",
    ),
]
