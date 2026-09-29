#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, '/Users/sajeel/Projects/tci_backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tci_backend.settings')

# Setup Django
django.setup()

from scheduling.models import Meeting
from django.contrib.auth.models import User

def check_meeting_attendees():
    try:
        # Get meeting with id=1
        meeting = Meeting.objects.get(id=1)
        print(f"Meeting found: {meeting}")
        print(f"Meeting ID: {meeting.id}")
        print(f"Meeting Title: {meeting.title}")
        print(f"Meeting Status: {meeting.status}")
        print(f"Scheduled At: {meeting.scheduled_at}")
        print(f"Daily Room Name: {meeting.daily_room_name}")

        # Check attendees
        attendees = meeting.attendees.all()
        print(f"\nTotal attendees: {attendees.count()}")

        if attendees.count() == 0:
            print("No attendees found for this meeting.")
            print("Possible reasons:")
            print("1. No MeetingAttendee records exist for this meeting")
            print("2. The meeting was created but attendees were not added")
            print("3. Attendees were added but then deleted")
        else:
            print("Attendees:")
            for attendee in attendees:
                print(f"  - User: {attendee.user.username} ({attendee.user.email})")
                print(f"    Role: {attendee.role}")
                print(f"    Is currently joined: {attendee.is_currently_joined}")
                print(f"    Joined at: {attendee.joined_at}")
                print()

        # Check if there are any MeetingAttendee records at all
        from scheduling.models import MeetingAttendee
        total_attendees = MeetingAttendee.objects.count()
        print(f"\nTotal MeetingAttendee records in database: {total_attendees}")

        # Check attendees for this specific meeting
        meeting_attendees = MeetingAttendee.objects.filter(meeting=meeting)
        print(f"MeetingAttendee records for meeting {meeting.id}: {meeting_attendees.count()}")

        # Let's also check what users exist
        users = User.objects.all()[:5]  # First 5 users
        print(f"\nSample users in database:")
        for user in users:
            print(f"  - {user.username} (ID: {user.id})")

    except Meeting.DoesNotExist:
        print("Meeting with id=1 does not exist")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_meeting_attendees()