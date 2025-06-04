import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from open_webui.main import app # FastAPI app instance
from open_webui.core.branding import DEFAULT_BRANDING_CONFIG # For default values
from open_webui.env import VERSION, OFFLINE_MODE # Import constants
from open_webui.models.users import User, UserRole

# Test user for authentication
VERIFIED_USER = User(id="test_user_id_main", name="Test User", email="test@example.com", role=UserRole.USER)

def mock_get_verified_user():
    return VERIFIED_USER

class TestMainEndpoints(unittest.TestCase):
    client: TestClient

    @classmethod
    def setUpClass(cls):
        from open_webui.utils.auth import get_verified_user as actual_get_verified_user
        app.dependency_overrides[actual_get_verified_user] = mock_get_verified_user
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        # Store original app.state.APP_BRANDING_CONFIG and offline mode to restore them
        self.original_branding_config = app.state.APP_BRANDING_CONFIG
        self.original_offline_mode = OFFLINE_MODE

    def tearDown(self):
        # Restore original values
        app.state.APP_BRANDING_CONFIG = self.original_branding_config
        # Since OFFLINE_MODE is a module-level const, patching it is better if it needs to change per test
        # For now, assuming tests don't modify it, or are okay with its compile-time value for the test run.
        # If OFFLINE_MODE needs to be mocked: @patch('open_webui.main.OFFLINE_MODE', new_value)

    @patch('aiohttp.ClientSession.get') # Target where aiohttp.ClientSession.get is used
    def test_get_app_latest_release_version_check_enabled(self, mock_aiohttp_get):
        # Scenario 1: enable_update_check is True, OFFLINE_MODE is False

        # Set up mock branding config on app.state
        mock_branding_on_state = {**DEFAULT_BRANDING_CONFIG, "enable_update_check": True}
        app.state.APP_BRANDING_CONFIG = mock_branding_on_state

        # Mock OFFLINE_MODE if it's True by default in env, ensure it's False for this test
        with patch('open_webui.main.OFFLINE_MODE', False):
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value={"tag_name": "v0.2.0"}) # Simulate GitHub API response

            # Configure the __aenter__ and __aexit__ methods for async context manager
            mock_session_get_cm = MagicMock()
            mock_session_get_cm.__aenter__.return_value = mock_response
            mock_session_get_cm.__aexit__.return_value = None
            mock_aiohttp_get.return_value = mock_session_get_cm

            response = self.client.get("/api/version/updates")

            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["current"], VERSION)
            self.assertEqual(data["latest"], "0.2.0")
            mock_aiohttp_get.assert_called_once() # Verify external call was made

    @patch('aiohttp.ClientSession.get')
    def test_get_app_latest_release_version_check_disabled_by_branding(self, mock_aiohttp_get):
        # Scenario 2: enable_update_check is False
        mock_branding_on_state = {**DEFAULT_BRANDING_CONFIG, "enable_update_check": False}
        app.state.APP_BRANDING_CONFIG = mock_branding_on_state

        with patch('open_webui.main.OFFLINE_MODE', False): # Ensure offline mode is not interfering
            response = self.client.get("/api/version/updates")

            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["current"], VERSION)
            self.assertEqual(data["latest"], VERSION) # Should return current as latest
            mock_aiohttp_get.assert_not_called() # Verify external call was NOT made

    @patch('aiohttp.ClientSession.get')
    def test_get_app_latest_release_version_check_disabled_by_offline_mode(self, mock_aiohttp_get):
        # Scenario 3: OFFLINE_MODE is True (enable_update_check in branding might be True or False)
        mock_branding_on_state = {**DEFAULT_BRANDING_CONFIG, "enable_update_check": True} # Set to true to isolate OFFLINE_MODE effect
        app.state.APP_BRANDING_CONFIG = mock_branding_on_state

        with patch('open_webui.main.OFFLINE_MODE', True): # Enable OFFLINE_MODE
            response = self.client.get("/api/version/updates")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["current"], VERSION)
            self.assertEqual(data["latest"], VERSION)
            mock_aiohttp_get.assert_not_called()

if __name__ == '__main__':
    unittest.main()
