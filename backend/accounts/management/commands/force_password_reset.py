from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Force password reset by setting unusable passwords. "
        "Users must use the forgot-password flow to set a new password."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--include-superusers",
            action="store_true",
            help="Also invalidate passwords for superusers.",
        )
        parser.add_argument(
            "--clear-sessions",
            action="store_true",
            help="Delete all Django sessions after invalidating passwords.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many accounts would be affected without changing data.",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        queryset = User.objects.all()

        if not options["include_superusers"]:
            queryset = queryset.exclude(is_superuser=True)

        total = queryset.count()

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(f"Dry run: {total} user(s) would be forced to reset passwords.")
            )
            return

        updated = 0
        for user in queryset.iterator(chunk_size=500):
            user.set_unusable_password()
            user.otp_code = None
            user.otp_expires_at = None
            user.save(update_fields=["password", "otp_code", "otp_expires_at"])
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Forced password reset for {updated} user(s).")
        )

        if options["clear_sessions"]:
            deleted, _ = Session.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Cleared {deleted} session row(s); active sessions were invalidated."
                )
            )
