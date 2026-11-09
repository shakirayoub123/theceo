from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import SiteFeatureSettings


class WebsiteQuestionViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_service_question_returns_site_based_answer(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "What services do you offer?"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("services", response.data["answer"].lower())
        self.assertIn("The CEO Influencers", response.data["answer"])
        self.assertTrue(response.data["sources"])

    def test_influencer_question_returns_team_names(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "Who are the influencers?"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("James", response.data["answer"])
        self.assertIn("Claire", response.data["answer"])
        self.assertEqual(response.data["sources"][0]["title"], "Our Influencers")
        self.assertNotIn("Program 1", response.data["answer"])

    def test_questions_about_different_topics_return_different_content(self):
        questions = {
            "Who are the influencers?": ("Our Influencers", "james"),
            "What services do you offer?": ("Our Services", "keynote"),
            "Tell me about newsletters": ("Quarterly Newsletters", "quarterly"),
            "What is The Human Algorithm?": ("Website Insights and Blogs", "algorithm"),
        }

        answers = {}
        for question, (expected_source, expected_term) in questions.items():
            response = self.client.post(
                "/api/chat/website-question/",
                {"question": question},
                format="json",
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data["sources"])
            self.assertEqual(response.data["sources"][0]["title"], expected_source)
            self.assertIn(expected_term, response.data["answer"].lower())
            answers[question] = response.data["answer"]

        self.assertEqual(len(set(answers.values())), len(answers))

    def test_case_study_three_full_text_and_pdf_are_available(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "Give me Case Study 3 text"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Spirit Media Network", response.data["answer"])
        self.assertIn("GLOBAL EXPANSION STRATEGY", response.data["answer"])
        self.assertTrue(response.data["sources"])
        self.assertIn("case-study-3.pdf", response.data["sources"][0]["download_url"])

    def test_salient_features_question_returns_feature_summary(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "what are salient features"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("salient", response.data["answer"].lower())
        self.assertIn("leadership", response.data["answer"].lower())
        self.assertTrue(response.data["sources"])

    def test_program_question_returns_program_details(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "tell me about program 1"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("program 1", response.data["answer"].lower())
        self.assertIn("2:1", response.data["answer"].lower())
        self.assertTrue(response.data["sources"])

    def test_follow_up_question_uses_previous_user_turn(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {
                "question": "Is that virtual?",
                "conversation": [
                    {"role": "user", "content": "Tell me about program 1"},
                    {"role": "assistant", "content": "Program 1 is a coaching program."},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("program 1", response.data["answer"].lower())
        self.assertIn("virtual", response.data["answer"].lower())

    def test_response_uses_conversational_tone(self):
        response = self.client.post(
            "/api/chat/website-question/",
            {"question": "What services do you offer?"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["answer"].startswith("Sure!"))
        self.assertIn("Would you like", response.data["answer"])


class SiteFeatureSettingsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        SiteFeatureSettings.objects.all().delete()

    def test_public_endpoint_returns_chatbot_visibility(self):
        response = self.client.get("/api/chat/settings/public/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["chatbot_enabled"])

    def test_admin_can_toggle_chatbot_visibility(self):
        user = get_user_model().objects.create_user(
            username="chatbot-admin",
            email="chatbot-admin@example.com",
            password="test-password",
            role="admin",
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            "/api/chat/settings/admin/",
            {"chatbot_enabled": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["chatbot_enabled"])
        self.assertFalse(SiteFeatureSettings.objects.get(pk=1).chatbot_enabled)

    def test_non_admin_cannot_toggle_chatbot_visibility(self):
        user = get_user_model().objects.create_user(
            username="chatbot-client",
            email="chatbot-client@example.com",
            password="test-password",
            role="client",
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            "/api/chat/settings/admin/",
            {"chatbot_enabled": False},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SiteFeatureSettings.objects.filter(pk=1).exists())
