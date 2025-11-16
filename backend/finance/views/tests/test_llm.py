from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from unittest.mock import patch, MagicMock
from finance.views.llm import AIPlanGenerateView, _extract_json

User = get_user_model()

class ExtractJsonTests(TestCase):
    def test_extract_valid_json(self):
        s = '{"a":1, "b":2}'
        self.assertEqual(_extract_json(s), {"a": 1, "b": 2})

    def test_extract_json_inside_codeblock(self):
        s = "```json\n{\"x\":10}\n```"
        self.assertEqual(_extract_json(s), {"x": 10})

    def test_extract_invalid_returns_none(self):
        self.assertIsNone(_extract_json("nada a ver"))


class AIPlanGenerateTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            email="u@example.com", password="123", name="U"
        )
        cache.clear()

    def _req(self, data):
        req = self.factory.post("/ai/plan/", data, format="json")
        force_authenticate(req, user=self.user)
        return req

    def test_rate_limit_exceeded(self):
        cache.set(f"ai_plan_rate:{self.user.id}", 5, timeout=3600)
        view = AIPlanGenerateView.as_view()
        req = self._req({})
        resp = view(req)
        self.assertEqual(resp.status_code, 429)

    def test_custom_template_requires_prompt(self):
        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "custom", "prompt": ""})
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_custom_template_invalid_prompt(self, mock_validate):
        mock_validate.return_value = {"is_valid": False, "errors": ["e"], "intent": "", "lang": "", "warnings": []}
        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "custom", "prompt": "xxx"})
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_default_template_requires_objective(self, mock_validate):
        mock_validate.return_value = {"is_valid": True, "intent": "", "lang": "", "warnings": []}
        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "generic", "objective": ""})
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

    @patch("finance.views.llm.build_user_finance_context", side_effect=Exception("boom"))
    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_context_failure_returns_500(self, mock_validate, mock_ctx):
        mock_validate.return_value = {"is_valid": True, "intent": "", "lang": "", "warnings": []}
        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "generic", "objective": "teste"})
        resp = view(req)
        self.assertEqual(resp.status_code, 500)

    @patch("finance.views.llm.build_messages", side_effect=ValueError("bad"))
    @patch("finance.views.llm.build_user_finance_context", return_value={})
    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_build_messages_value_error(self, mock_validate, mock_ctx, mock_build):
        mock_validate.return_value = {"is_valid": True, "intent": "", "lang": "", "warnings": []}
        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "generic", "objective": "teste"})
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

    @patch("finance.views.llm.get_groq_model", return_value="model-x")
    @patch("finance.views.llm.get_groq_client")
    @patch("finance.views.llm.build_messages", return_value=[])
    @patch("finance.views.llm.build_user_finance_context", return_value={})
    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_successful_generation(self, mock_validate, mock_ctx, mock_build, mock_client, mock_model):
        mock_validate.return_value = {
            "is_valid": True,
            "intent": "plan",
            "lang": "pt",
            "warnings": [],
        }

        fake_resp = MagicMock()
        fake_resp.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"title": "A", "spec": {"dias": []}}'
                )
            )
        ]
        fake_resp.usage = MagicMock(total_tokens=123)

        mock_client.return_value.chat.completions.create.return_value = fake_resp

        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "generic", "objective": "teste"})
        resp = view(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"]["title"], "A")
        self.assertEqual(resp.data["model"], "model-x")
        self.assertEqual(resp.data["tokens_used"], 123)

    @patch("finance.views.llm.get_groq_model", return_value="m")
    @patch("finance.views.llm.get_groq_client")
    @patch("finance.views.llm.build_messages", return_value=[])
    @patch("finance.views.llm.build_user_finance_context", return_value={})
    @patch("finance.views.llm.validate_and_classify_prompt")
    def test_invalid_json_in_response(self, mock_validate, mock_ctx, mock_build, mock_client, mock_model):
        mock_validate.return_value = {"is_valid": True, "intent": "", "lang": "", "warnings": []}

        fake_resp = MagicMock()
        fake_resp.choices = [MagicMock(message=MagicMock(content="notjson"))]
        fake_resp.usage = MagicMock(total_tokens=0)

        mock_client.return_value.chat.completions.create.return_value = fake_resp

        view = AIPlanGenerateView.as_view()
        req = self._req({"template": "generic", "objective": "test"})
        resp = view(req)

        self.assertEqual(resp.status_code, 422)
