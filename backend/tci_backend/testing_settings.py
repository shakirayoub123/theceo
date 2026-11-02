"""Settings for the isolated public-IP client-testing deployment."""

from .settings import *  # noqa: F403

DEBUG = False
ALLOWED_HOSTS = ["72.62.251.242", "localhost", "127.0.0.1"]
CORS_ALLOWED_ORIGINS = ["http://72.62.251.242:3000"]
CSRF_TRUSTED_ORIGINS = ["http://72.62.251.242:3000"]
