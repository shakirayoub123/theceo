from django.core.management.base import BaseCommand
from people.models import Lead
from django.contrib.auth import get_user_model
from datetime import date, time

User = get_user_model()


class Command(BaseCommand):
    help = "Populate sample leads for testing"

    def handle(self, *args, **options):
        # Sample lead data
        sample_leads = [
            {
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
                "phone": "555-0101",
                "requested_meeting_date": date.today(),
                "requested_meeting_time": time(10, 0),
            },
            {
                "first_name": "Sarah",
                "last_name": "Johnson",
                "email": "sarah.johnson@example.com",
                "phone": "555-0102",
                "requested_meeting_date": date.today(),
                "requested_meeting_time": time(14, 30),
            },
            {
                "first_name": "Mike",
                "last_name": "Davis",
                "email": "mike.davis@example.com",
                "phone": "555-0103",
                "requested_meeting_date": date.today(),
                "requested_meeting_time": time(16, 0),
            },
        ]

        created_count = 0
        for lead_data in sample_leads:
            if not Lead.objects.filter(email=lead_data["email"]).exists():
                lead = Lead.objects.create(**lead_data)
                # Generate access code and send email
                access_code = lead.generate_access_code()
                lead.send_access_code_email()
                created_count += 1
                self.stdout.write(
                    f"Created lead: {lead.full_name} - Access Code: {access_code}"
                )

        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {created_count} sample leads")
        )
