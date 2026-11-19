"""Send client-journey "where you are / next steps" reminders.

Emails + dashboard notifications go to each client, their assigned salesperson
and their program coaches. A reminder is sent when a client enters a new stage,
then repeated every few days while they stay in it (no duplicates in between).

Run daily from cron, e.g.:
    0 9 * * * cd /path/to/backend && venv/bin/python manage.py send_journey_reminders

Preview without sending anything:
    python manage.py send_journey_reminders --dry-run
"""

from django.core.management.base import BaseCommand

from people.journey import send_journey_reminders_for_client
from people.models import Client


class Command(BaseCommand):
    help = "Send client journey next-step reminders (email + dashboard notification)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show who would be reminded without sending emails or notifications.",
        )
        parser.add_argument(
            "--client-id",
            type=int,
            help="Only process this Client id.",
        )

    def handle(self, *args, dry_run=False, client_id=None, **options):
        clients = Client.objects.select_related("user", "assigned_sales").order_by("id")
        if client_id:
            clients = clients.filter(id=client_id)

        total = 0
        for client in clients:
            try:
                sent = send_journey_reminders_for_client(client, dry_run=dry_run)
            except Exception as exc:  # keep going for other clients
                self.stderr.write(f"Client {client.id}: failed ({exc})")
                continue
            for message in sent:
                total += 1
                self.stdout.write(
                    f"{'[dry-run] ' if dry_run else ''}client={client.id} "
                    f"role={message.role} to={message.user.email} :: {message.subject}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"{'Would send' if dry_run else 'Sent'} {total} journey reminder(s)."
            )
        )
