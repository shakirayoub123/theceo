from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from scheduling.models import Meeting, MeetingType, MeetingAttendee
from django.utils import timezone
from datetime import timedelta, time

User = get_user_model()


class Command(BaseCommand):
    help = "Populate sample meeting data for calendar testing"

    def handle(self, *args, **options):
        # Get existing users
        sales_users = User.objects.filter(role="sales")
        trainers = User.objects.filter(role="trainer")
        clients = User.objects.filter(role="client")

        if not sales_users.exists() or not trainers.exists() or not clients.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Need sales users, trainers, and clients to create sample meetings"
                )
            )
            return

        # Get meeting types
        meeting_types = MeetingType.objects.all()
        if not meeting_types.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No meeting types found. Run meeting type creation first."
                )
            )
            return

        sales_user = sales_users.first()
        trainer = trainers.first()
        client = clients.first()

        # Create sample meetings for the next 30 days
        base_date = timezone.now().date()
        created_count = 0

        for i in range(30):
            meeting_date = base_date + timedelta(days=i)

            # Skip weekends for this example
            if meeting_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                continue

            # Create 1-2 meetings per day
            num_meetings = 1 if i % 3 == 0 else 2

            for j in range(num_meetings):
                meeting_type = meeting_types[i % len(meeting_types)]

                # Create meeting time (9 AM to 5 PM)
                hour = 9 + (j * 2) + (i % 4)  # Spread meetings throughout the day
                if hour > 17:
                    hour = 17

                scheduled_at = timezone.datetime.combine(meeting_date, time(hour, 0))

                meeting = Meeting.objects.create(
                    title=f"Sample {meeting_type.name} {i + 1}-{j + 1}",
                    meeting_type=meeting_type,
                    scheduled_by=sales_user,
                    scheduled_at=scheduled_at,
                    duration=timedelta(minutes=60),
                    status="scheduled",
                    notes=f"Sample meeting notes for {meeting_type.name}",
                    location="Conference Room A",
                )

                # Add attendees
                attendees_data = [
                    (sales_user, "organizer"),
                    (client, "client"),
                ]

                # Add trainer if meeting type requires it
                if meeting_type.requires_trainers:
                    attendees_data.append((trainer, "trainer"))

                for attendee_user, role in attendees_data:
                    MeetingAttendee.objects.create(
                        meeting=meeting, user=attendee_user, role=role
                    )

                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {created_count} sample meetings")
        )
