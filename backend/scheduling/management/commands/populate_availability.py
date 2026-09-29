from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from scheduling.models import Availability
from datetime import time

User = get_user_model()


class Command(BaseCommand):
    help = "Populate sample trainer availability data"

    def handle(self, *args, **options):
        # Get all trainers
        trainers = User.objects.filter(role="trainer")

        if not trainers.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No trainers found. Please create some trainer users first."
                )
            )
            return

        # Sample availability data
        sample_availability = [
            {"day": "monday", "start": time(9, 0), "end": time(17, 0)},
            {"day": "tuesday", "start": time(9, 0), "end": time(17, 0)},
            {"day": "wednesday", "start": time(9, 0), "end": time(17, 0)},
            {"day": "thursday", "start": time(9, 0), "end": time(17, 0)},
            {"day": "friday", "start": time(9, 0), "end": time(17, 0)},
        ]

        created_count = 0
        for trainer in trainers:
            for avail_data in sample_availability:
                # Check if availability already exists
                existing = Availability.objects.filter(
                    trainer=trainer, day_of_week=avail_data["day"]
                ).exists()

                if not existing:
                    Availability.objects.create(
                        trainer=trainer,
                        day_of_week=avail_data["day"],
                        start_time=avail_data["start"],
                        end_time=avail_data["end"],
                    )
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created {created_count} availability records"
            )
        )
