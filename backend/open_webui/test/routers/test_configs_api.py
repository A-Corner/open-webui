import unittest
from unittest.mock import patch, MagicMock, ANY
from fastapi.testclient import TestClient

from open_webui.main import app # Assuming main.py initializes the FastAPI app object
from open_webui.models.users import UserRole, User
from open_webui.config import PersistentConfig, PERSISTENT_CONFIG_REGISTRY

# For mocking dependencies and config items
from open_webui.routers import configs as configs_router # To patch items within this module

# Test user for authentication
ADMIN_USER = User(id="admin_user_id_configs", name="Config Admin", email="configadmin@example.com", role=UserRole.ADMIN)

def mock_get_admin_user_for_configs():
    return ADMIN_USER

# Store original registry to restore it later if necessary, though mocks should handle isolation.
ORIGINAL_PERSISTENT_CONFIG_REGISTRY = list(PERSISTENT_CONFIG_REGISTRY)

class TestConfigsAPI(unittest.TestCase):
    client: TestClient

    @classmethod
    def setUpClass(cls):
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user_for_configs
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        # It's crucial to mock PersistentConfig instances or the registry for isolation.
        # We'll mock the `update_config_item_by_env_name` helper directly as it's the point of interaction.
        # We also need to ensure that the GET endpoints can read "mocked" current values.
        # For GET, we can prepare some mock PersistentConfig objects and make them available
        # via request.app.state.config, or ensure that they are in PERSISTENT_CONFIG_REGISTRY
        # if the GET handlers read from there.

        # The GET handlers read from `app.state.config.CONFIG_NAME.value`.
        # `app.state.config` is an `AppConfig` instance.
        # `AppConfig.__getattr__` returns `self._state[key].value`.
        # So, we need to ensure `app.state.config._state` has mock PersistentConfig objects.

        self.mock_configs = {
            "ENABLE_SIGNUP": MagicMock(spec=PersistentConfig, value=True, env_name="ENABLE_SIGNUP", config_path="ui.enable_signup", env_value=True),
            "DEFAULT_MODELS": MagicMock(spec=PersistentConfig, value=["model1"], env_name="DEFAULT_MODELS", config_path="ui.default_models", env_value=["model1"]),
            "WEBUI_URL": MagicMock(spec=PersistentConfig, value="http://localhost:3000", env_name="WEBUI_URL", config_path="webui.url", env_value="http://localhost:3000"),
            "DEFAULT_LOCALE": MagicMock(spec=PersistentConfig, value="en-US", env_name="DEFAULT_LOCALE", config_path="ui.default_locale", env_value="en-US"),
            "ENABLE_COMMUNITY_SHARING": MagicMock(spec=PersistentConfig, value=True, env_name="ENABLE_COMMUNITY_SHARING", config_path="ui.enable_community_sharing", env_value=True),
            "ENABLE_MESSAGE_RATING": MagicMock(spec=PersistentConfig, value=True, env_name="ENABLE_MESSAGE_RATING", config_path="ui.enable_message_rating", env_value=True),
            "DEFAULT_PROMPT_SUGGESTIONS": MagicMock(spec=PersistentConfig, value=[], env_name="DEFAULT_PROMPT_SUGGESTIONS", config_path="ui.prompt_suggestions", env_value=[]),
            "JWT_EXPIRES_IN": MagicMock(spec=PersistentConfig, value="-1", env_name="JWT_EXPIRES_IN", config_path="auth.jwt_expiry", env_value="-1"),
            "ENABLE_OAUTH_SIGNUP": MagicMock(spec=PersistentConfig, value=False, env_name="ENABLE_OAUTH_SIGNUP", config_path="oauth.enable_signup", env_value=False),
            "ENABLE_API_KEY": MagicMock(spec=PersistentConfig, value=True, env_name="ENABLE_API_KEY", config_path="auth.api_key.enable", env_value=True),
            "DEFAULT_USER_ROLE": MagicMock(spec=PersistentConfig, value="user", env_name="DEFAULT_USER_ROLE", config_path="ui.default_user_role", env_value="user"),
            "RAG_TEMPLATE": MagicMock(spec=PersistentConfig, value="Test template {{QUERY}} {{CONTEXT}}", env_name="RAG_TEMPLATE", config_path="rag.template", env_value=""),
            "CHUNK_SIZE": MagicMock(spec=PersistentConfig, value=1000, env_name="CHUNK_SIZE", config_path="rag.chunk_size", env_value=1000),
            "CHUNK_OVERLAP": MagicMock(spec=PersistentConfig, value=100, env_name="CHUNK_OVERLAP", config_path="rag.chunk_overlap", env_value=100),
            "RAG_TOP_K": MagicMock(spec=PersistentConfig, value=3, env_name="RAG_TOP_K", config_path="rag.top_k", env_value=3),
            "RAG_RELEVANCE_THRESHOLD": MagicMock(spec=PersistentConfig, value=0.1, env_name="RAG_RELEVANCE_THRESHOLD", config_path="rag.relevance_threshold", env_value=0.0),
            "ENABLE_WEB_SEARCH": MagicMock(spec=PersistentConfig, value=False, env_name="ENABLE_WEB_SEARCH", config_path="rag.web.search.enable", env_value=False),
            "WEB_SEARCH_ENGINE": MagicMock(spec=PersistentConfig, value="searxng", env_name="WEB_SEARCH_ENGINE", config_path="rag.web.search.engine", env_value=""),
            "WEB_SEARCH_RESULT_COUNT": MagicMock(spec=PersistentConfig, value=3, env_name="WEB_SEARCH_RESULT_COUNT", config_path="rag.web.search.result_count", env_value=3),
            "PDF_EXTRACT_IMAGES": MagicMock(spec=PersistentConfig, value=False, env_name="PDF_EXTRACT_IMAGES", config_path="rag.pdf_extract_images", env_value=False),
        }

        # Patch app.state.config to return these mock objects via its __getattr__
        # This requires that AppConfig._state is populated with these mocks.
        # We can directly patch AppConfig._state for the duration of tests if simpler.
        self.original_app_state_config_state = app.state.config._state
        app.state.config._state = self.mock_configs

        # Also, ensure PERSISTENT_CONFIG_REGISTRY contains these mocks for the update helper
        self.original_registry = list(PERSISTENT_CONFIG_REGISTRY) # Make a copy
        PERSISTENT_CONFIG_REGISTRY.clear()
        PERSISTENT_CONFIG_REGISTRY.extend(self.mock_configs.values())


    def tearDown(self):
        # Restore original state
        app.state.config._state = self.original_app_state_config_state
        PERSISTENT_CONFIG_REGISTRY.clear()
        PERSISTENT_CONFIG_REGISTRY.extend(self.original_registry)


    def test_get_ui_configs(self):
        response = self.client.get("/api/v1/configs/ui")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["ENABLE_SIGNUP"], self.mock_configs["ENABLE_SIGNUP"].value)
        self.assertEqual(data["WEBUI_URL"], self.mock_configs["WEBUI_URL"].value)
        self.assertEqual(data["DEFAULT_MODELS"], self.mock_configs["DEFAULT_MODELS"].value)

    @patch('open_webui.routers.configs.update_config_item_by_env_name')
    def test_update_ui_configs_success(self, mock_update_helper):
        update_data = {"ENABLE_SIGNUP": False, "WEBUI_URL": "http://newurl.com"}

        # Mock the helper to do nothing or check calls
        mock_update_helper.return_value = None

        response = self.client.put("/api/v1/configs/ui", json=update_data)
        self.assertEqual(response.status_code, 200)

        mock_update_helper.assert_any_call("ENABLE_SIGNUP", False)
        mock_update_helper.assert_any_call("WEBUI_URL", "http://newurl.com")

        # Verify the response contains the (mocked) updated values
        # The GET part of the PUT handler will use the mocked values from setUp
        # If mock_update_helper actually changed them, this would reflect.
        # Since it's mocked to do nothing, we check if the GET part still works.
        json_response = response.json()
        self.assertEqual(json_response["ENABLE_SIGNUP"], self.mock_configs["ENABLE_SIGNUP"].value) # This will be the original mock value
        self.assertEqual(json_response["WEBUI_URL"], self.mock_configs["WEBUI_URL"].value)

    @patch('open_webui.routers.configs.update_config_item_by_env_name')
    def test_update_ui_configs_invalid_key(self, mock_update_helper):
        mock_update_helper.side_effect = AttributeError("Config key INVALID_KEY not found")
        update_data = {"INVALID_KEY": True}
        response = self.client.put("/api/v1/configs/ui", json=update_data)
        self.assertEqual(response.status_code, 400) # Due to AttributeError from helper
        self.assertIn("Config key INVALID_KEY not found", response.json()["detail"])

    @patch('open_webui.routers.configs.update_config_item_by_env_name')
    def test_update_ui_configs_invalid_value_type(self, mock_update_helper):
        # Simulate a ValueError from the helper (e.g., trying to cast "abc" to int)
        mock_update_helper.side_effect = ValueError("Invalid value type for CHUNK_SIZE")
        # We'll use RAG config for this, but the principle is the same
        update_data = {"CHUNK_SIZE": "not-an-integer"}
        response = self.client.put("/api/v1/configs/rag", json=update_data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid value type for CHUNK_SIZE", response.json()["detail"])

    def test_get_auth_configs(self):
        response = self.client.get("/api/v1/configs/auth")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["JWT_EXPIRES_IN"], self.mock_configs["JWT_EXPIRES_IN"].value)
        self.assertEqual(data["ENABLE_API_KEY"], self.mock_configs["ENABLE_API_KEY"].value)

    @patch('open_webui.routers.configs.update_config_item_by_env_name')
    def test_update_auth_configs(self, mock_update_helper):
        update_data = {"DEFAULT_USER_ROLE": "admin", "ENABLE_OAUTH_SIGNUP": True}
        mock_update_helper.return_value = None

        response = self.client.put("/api/v1/configs/auth", json=update_data)
        self.assertEqual(response.status_code, 200)
        mock_update_helper.assert_any_call("DEFAULT_USER_ROLE", "admin")
        mock_update_helper.assert_any_call("ENABLE_OAUTH_SIGNUP", True)

    def test_get_rag_configs(self):
        response = self.client.get("/api/v1/configs/rag")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["RAG_TEMPLATE"], self.mock_configs["RAG_TEMPLATE"].value)
        self.assertEqual(data["CHUNK_SIZE"], self.mock_configs["CHUNK_SIZE"].value)

    @patch('open_webui.routers.configs.update_config_item_by_env_name')
    def test_update_rag_configs(self, mock_update_helper):
        update_data = {"ENABLE_WEB_SEARCH": True, "RAG_TOP_K": 5}
        mock_update_helper.return_value = None

        response = self.client.put("/api/v1/configs/rag", json=update_data)
        self.assertEqual(response.status_code, 200)
        mock_update_helper.assert_any_call("ENABLE_WEB_SEARCH", True)
        mock_update_helper.assert_any_call("RAG_TOP_K", 5)

    def test_unauthorized_access_to_get_ui(self):
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = lambda: None # Simulate no user

        response = self.client.get("/api/v1/configs/ui")
        self.assertEqual(response.status_code, 403)

        # Restore
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user_for_configs

    def test_unauthorized_access_to_put_ui(self):
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = lambda: None

        response = self.client.put("/api/v1/configs/ui", json={"ENABLE_SIGNUP": True})
        self.assertEqual(response.status_code, 403)

        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user_for_configs


if __name__ == '__main__':
    unittest.main()

# Notes:
# - Mocking `app.state.config._state` and `PERSISTENT_CONFIG_REGISTRY` in setUp is key for isolating tests.
# - The `update_config_item_by_env_name` is patched for PUT requests to avoid actual modification
#   and to assert that it's called correctly.
# - Tests for invalid keys and value types demonstrate error handling.
# - Authorization tests ensure admin protection.I've created the test file `backend/open_webui/test/routers/test_configs_api.py`.

Key aspects of this test suite:
-   **TestClient:** Uses `fastapi.testclient.TestClient` for API requests.
-   **Authentication Mocking:** Mocks `get_admin_user` to simulate an authenticated admin user for all tests by default. Includes tests for unauthorized access by temporarily overriding this mock.
-   **Configuration State Mocking:**
    -   In `setUp`, it populates `app.state.config._state` with `MagicMock(spec=PersistentConfig)` instances for each configuration key that the API endpoints interact with. This ensures that GET requests can retrieve "current" values.
    -   It also replaces the live `PERSISTENT_CONFIG_REGISTRY` with a list containing these mocked `PersistentConfig` objects. This is crucial because the `update_config_item_by_env_name` helper (which is called by PUT endpoints) iterates over this registry.
    -   `tearDown` restores the original `app.state.config._state` and `PERSISTENT_CONFIG_REGISTRY`.
-   **Testing GET Endpoints (`/ui`, `/auth`, `/rag`):**
    -   Verifies that the endpoints return a 200 status.
    -   Checks if the returned JSON data matches the `.value` of the corresponding mocked `PersistentConfig` objects.
-   **Testing PUT Endpoints (`/ui`, `/auth`, `/rag`):**
    -   Patches the `update_config_item_by_env_name` helper function itself for most update tests. This allows asserting that the helper is called with the correct parameters (config key and new value) without actually executing the save logic.
    -   Tests for successful updates by checking the call arguments to the mocked helper.
    -   Includes tests for error handling:
        -   Attempting to update a non-existent config key (simulated by `AttributeError` from the helper).
        -   Providing an invalid data type for a configuration value (simulated by `ValueError` from the helper).
-   **Covers UI, Auth, and RAG configuration categories.**

This set of tests focuses on the API layer's logic: request handling, data validation (implicitly via Pydantic models), interaction with the configuration update mechanism, and authorization.

The backend unit tests are now mostly covered. The next steps would involve frontend unit tests and then E2E tests, which are progressively more complex and might hit limitations of the current tooling environment if they require browser engines or specific JS runtimes not available.

Given the scope and potential complexity of frontend and E2E tests, I will pause here for this turn and can proceed to those in subsequent turns if indicated.
