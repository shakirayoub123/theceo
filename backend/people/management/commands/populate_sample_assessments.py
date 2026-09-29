from django.core.management.base import BaseCommand
from people.models import Lead, LeadAssessmentEntry
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Populate sample assessment entries for testing"

    def handle(self, *args, **options):
        # Get existing leads
        leads = Lead.objects.filter(access_code_used=True)

        if not leads.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No leads with used access codes found. Create some leads first."
                )
            )
            return

        # Sample assessment data for different assessments
        sample_data = {
            1: {  # Fitness Assessment
                "current_weight": 75,
                "target_weight": 70,
                "height": 175,
                "fitness_level": "intermediate",
                "exercise_frequency": "3-4 times per week",
                "preferred_activities": ["running", "weight training"],
            },
            2: {  # Nutrition Assessment
                "diet_type": "mixed",
                "meal_frequency": 3,
                "water_intake": "2 liters",
                "food_allergies": ["nuts"],
                "supplements": ["protein powder"],
                "eating_habits": "regular meals",
            },
            3: {  # Lifestyle Assessment
                "sleep_hours": 7,
                "stress_level": "moderate",
                "work_schedule": "9-5",
                "smoking": False,
                "alcohol_consumption": "occasional",
                "daily_routine": "structured",
            },
            4: {  # Goal Setting
                "primary_goal": "weight loss",
                "timeline": "3 months",
                "motivation_level": "high",
                "past_attempts": 2,
                "support_system": "family and friends",
                "measurement_preference": "weight and photos",
            },
            5: {  # Medical History
                "medical_conditions": ["mild hypertension"],
                "medications": ["lisinopril"],
                "injuries": [],
                "surgeries": [],
                "family_history": ["diabetes"],
                "doctor_visits": "annual checkup",
            },
            6: {  # Preferences & Availability
                "preferred_time": "morning",
                "available_days": ["monday", "wednesday", "friday"],
                "communication_preference": "email",
                "workout_location": "gym",
                "equipment_access": True,
                "group_preference": "small group",
            },
        }

        created_count = 0
        for lead in leads[:3]:  # Only process first 3 leads
            for assessment_id in range(1, 7):
                # Create some entries with partial data, some complete
                if assessment_id <= 4:  # Make first 4 assessments have some progress
                    data = sample_data[assessment_id]
                    is_completed = assessment_id <= 2  # First 2 are completed

                    entry, created = LeadAssessmentEntry.objects.get_or_create(
                        lead=lead,
                        assessment_id=assessment_id,
                        defaults={
                            "assessment_data": data,
                            "is_completed": is_completed,
                        },
                    )

                    if created:
                        if is_completed:
                            entry.mark_completed()
                        created_count += 1
                        self.stdout.write(
                            f"Created assessment {assessment_id} for {lead.full_name} ({'completed' if is_completed else 'in progress'})"
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created {created_count} sample assessment entries"
            )
        )
