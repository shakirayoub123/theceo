from django.test import TestCase
from rest_framework.test import APIClient


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
