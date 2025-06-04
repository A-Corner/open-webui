import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from open_webui.main import app # Assuming main.py initializes the FastAPI app object

# No specific user needed if endpoint is public, but good practice for consistency if other tests need it
# from open_webui.models.users import User, UserRole
# ADMIN_USER = User(id="test_admin_id", name="Test Admin", email="admin@test.com", role=UserRole.ADMIN)

class TestBrandingAPI(unittest.TestCase):
    client: TestClient

    @classmethod
    def setUpClass(cls):
        # No auth override needed if endpoint is public as intended
        cls.client = TestClient(app)

    def test_get_branding_config_success(self):
        # Define a sample branding config that we expect the endpoint to return
        # This should match what APP_BRANDING_CONFIG would be after loading
        expected_config_sample = {
            "app_name": "My Test WebUI",
            "app_title": "My Test WebUI Title",
            "logo_path": "/static/custom_logo.png",
            "favicon_path": "/static/custom_favicon.png",
            # ... other fields from DEFAULT_BRANDING_CONFIG or custom values
            "enable_update_check": False,
            "custom_links": [{"text": "Test Link", "url": "http://test.com"}],
             "meta_tags": {
                "description": "Test description.",
                "keywords": "test, webui"
            },
            "ui_theme": {
                "primary_color": "#ABCDEF",
                "secondary_color": "#123456",
                "font_family": "Comic Sans MS"
            },
            "announcement_banner": {
                "enabled": True,
                "text": "Test Banner",
                "type": "warning"
            }
            # Ensure all keys from DEFAULT_BRANDING_CONFIG are present if testing completeness
        }

        # Patch the APP_BRANDING_CONFIG that the endpoint directly returns
        # The actual APP_BRANDING_CONFIG is in open_webui.core.branding
        with patch('open_webui.core.branding.APP_BRANDING_CONFIG', expected_config_sample):
            # Also need to patch where it's set on app.state for consistency if main.py logic is complex
            # For this specific router, it imports APP_BRANDING_CONFIG directly.
            # However, if main.py logic that uses app.state.APP_BRANDING_CONFIG is ever tested,
            # that would need patching too.
            # For this router test, patching open_webui.core.branding.APP_BRANDING_CONFIG is sufficient.

            response = self.client.get("/api/v1/branding/config")

        self.assertEqual(response.status_code, 200)
        json_response = response.json()

        # Check some key fields
        self.assertEqual(json_response["app_name"], expected_config_sample["app_name"])
        self.assertEqual(json_response["enable_update_check"], expected_config_sample["enable_update_check"])
        self.assertEqual(len(json_response["custom_links"]), 1)
        self.assertEqual(json_response["custom_links"][0]["text"], "Test Link")
        self.assertEqual(json_response["ui_theme"]["primary_color"], "#ABCDEF")

        # Optionally, check if all expected keys are present (if expected_config_sample is comprehensive)
        for key in expected_config_sample:
            self.assertIn(key, json_response)
            self.assertEqual(json_response[key], expected_config_sample[key])

    def test_get_branding_config_is_public(self):
        # This test implicitly checks that no authentication is required
        # by not providing any auth headers and expecting a 200 OK.
        # We can use a different mock config to ensure it's not reusing the one above.
        public_test_config = {"app_name": "Public Access Test"}

        with patch('open_webui.core.branding.APP_BRANDING_CONFIG', public_test_config):
            response = self.client.get("/api/v1/branding/config") # No auth token

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["app_name"], "Public Access Test")

if __name__ == '__main__':
    unittest.main()
