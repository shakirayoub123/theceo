"""
URL configuration for tci_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap
from messaging.views import AllChatsView
from comms.views import SendEmailView
from lms.sitemaps import StaticViewSitemap, EbookSitemap, BlogSitemap, ServiceSitemap, NewsletterSitemap
from django.http import HttpResponse, JsonResponse


def _block_direct_upload(request, path=""):
    """Return 403 for any direct access to protected upload directories."""
    return JsonResponse(
        {"detail": "Direct file access is not allowed. Use the download API."},
        status=403,
    )


def robots_txt(request):
    lines = [
        "User-agent: *",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Allow: /",
        "",
        f"Sitemap: https://{request.get_host()}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

sitemaps = {
    'static': StaticViewSitemap,
    'ebooks': EbookSitemap,
    'blogs': BlogSitemap,
    'services': ServiceSitemap,
    'newsletters': NewsletterSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("authentication.urls")),
    path("api/accounts/", include("accounts.urls")),
    path(
        "api/comms/", include("comms.urls")
    ),  # Changed to comms prefix for notifications
    path("api/chat/", include("chatbot.urls")),
    path("api/messaging/", include("messaging.urls")),
    path("api/lms/", include("lms.urls")),
    path("api/people/", include("people.urls")),
    path("api/scheduling/", include("scheduling.urls")),
    path("api/all-chats/", AllChatsView.as_view(), name="all-chats"),
    path("api/email/", SendEmailView.as_view(), name="send-email"),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', robots_txt),
]

# Block direct access to protected upload directories.
# These patterns must appear BEFORE the generic media-serving rule.
urlpatterns += [
    path("uploads/ebooks/<path:path>", _block_direct_upload),
    path("uploads/newsletters/<path:path>", _block_direct_upload),
]

# Serve media files during development (non-protected dirs only)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
