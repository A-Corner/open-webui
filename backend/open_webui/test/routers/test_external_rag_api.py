import unittest
from unittest.mock import patch, MagicMock, ANY
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Assuming main.py initializes the FastAPI app object
from open_webui.main import app
from open_webui.models.rag_services import RagService
from open_webui.models.users import UserRole, User
from open_webui.internal.db import get_db

# For mocking dependencies
from open_webui.retrieval import external_rag

# Use a fixed test user for authentication
ADMIN_USER = User(id="admin_user_id", name="Admin User", email="admin@example.com", role=UserRole.ADMIN)
NORMAL_USER = User(id="normal_user_id", name="Normal User", email="user@example.com", role=UserRole.USER)

# Mock database session
mock_db_session = MagicMock(spec=Session)

def override_get_db():
    try:
        yield mock_db_session
    finally:
        mock_db_session.reset_mock() # Reset mock after each test to clear call counts etc.

def mock_get_admin_user():
    return ADMIN_USER

def mock_get_verified_user(): # For non-admin endpoints if any, or general user
    return NORMAL_USER


class TestExternalRagAPI(unittest.TestCase):
    client: TestClient

    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_db] = override_get_db
        # For admin-protected routes, we'll override get_admin_user
        # For user-protected routes, override get_verified_user
        # For this router, all are admin initially
        app.dependency_overrides[external_rag.get_admin_user] = mock_get_admin_user # Path to where get_admin_user is imported in the router
        # If the router file is open_webui.routers.external_rag, then:
        # app.dependency_overrides['open_webui.routers.external_rag.get_admin_user'] = mock_get_admin_user
        # Need to ensure the patch target for get_admin_user is correct.
        # It's imported in open_webui.routers.external_rag from open_webui.utils.auth
        # So the actual patch for where it's *used* should be:
        # from open_webui.routers import external_rag as external_rag_router
        # app.dependency_overrides[external_rag_router.get_admin_user] = mock_get_admin_user

        # Let's try to get the correct module for get_admin_user
        # This can be tricky. The most reliable is to patch where it's looked up.
        # For TestClient, it's often easier to override the dependency directly on the app.
        # The key for app.dependency_overrides should be the original dependency function.
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user

        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        # Reset mocks before each test
        mock_db_session.reset_mock()
        # If other mocks are setup here, reset them too

    def test_create_external_rag_service_success(self):
        mock_db_session.query(RagService).filter().first.return_value = None # No existing service with same name
        mock_db_session.add.return_value = None
        mock_db_session.commit.return_value = None
        mock_db_session.refresh.return_value = None

        service_data = {"name": "New RAG", "url": "http://new-rag.com", "api_key": "newkey"}
        response = self.client.post("/api/v1/external_rag_services", json=service_data)

        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(json_response["name"], service_data["name"])
        self.assertEqual(json_response["url"], service_data["url"])
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_create_external_rag_service_name_conflict(self):
        existing_service = RagService(id=1, name="Existing RAG", url="http://existing.com")
        mock_db_session.query(RagService).filter().first.return_value = existing_service

        service_data = {"name": "Existing RAG", "url": "http://new-rag.com"}
        response = self.client.post("/api/v1/external_rag_services", json=service_data)

        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", response.json()["detail"])

    def test_get_all_external_rag_services(self):
        service1 = RagService(id=1, name="Service1", url="http://s1.com", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        service2 = RagService(id=2, name="Service2", url="http://s2.com", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        mock_db_session.query(RagService).all.return_value = [service1, service2]

        response = self.client.get("/api/v1/external_rag_services")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["name"], "Service1")

    def test_get_external_rag_service_by_id_found(self):
        service = RagService(id=1, name="TestService", url="http://test.com", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        mock_db_session.query(RagService).filter(RagService.id == 1).first.return_value = service

        response = self.client.get("/api/v1/external_rag_services/1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "TestService")

    def test_get_external_rag_service_by_id_not_found(self):
        mock_db_session.query(RagService).filter(RagService.id == 99).first.return_value = None
        response = self.client.get("/api/v1/external_rag_services/99")
        self.assertEqual(response.status_code, 404)

    def test_update_external_rag_service_success(self):
        service_to_update = RagService(id=1, name="Old Name", url="http://oldurl.com", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        mock_db_session.query(RagService).filter(RagService.id == 1).first.return_value = service_to_update
        # For name conflict check during update (assume new name doesn't conflict)
        mock_db_session.query(RagService).filter(RagService.name == "New Name").first.return_value = None

        update_data = {"name": "New Name", "url": "http://newurl.com", "api_key": "newkey"}
        response = self.client.put("/api/v1/external_rag_services/1", json=update_data)

        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(json_response["name"], "New Name")
        self.assertEqual(json_response["url"], "http://newurl.com")
        self.assertEqual(service_to_update.name, "New Name") # Check if object was modified
        mock_db_session.commit.assert_called_once()

    def test_update_external_rag_service_not_found(self):
        mock_db_session.query(RagService).filter(RagService.id == 99).first.return_value = None
        update_data = {"name": "New Name", "url": "http://newurl.com"}
        response = self.client.put("/api/v1/external_rag_services/99", json=update_data)
        self.assertEqual(response.status_code, 404)

    def test_delete_external_rag_service_success(self):
        service_to_delete = RagService(id=1, name="ToDelete", url="http://delete.com")
        mock_db_session.query(RagService).filter(RagService.id == 1).first.return_value = service_to_delete

        response = self.client.delete("/api/v1/external_rag_services/1")
        self.assertEqual(response.status_code, 200)
        self.assertIn("deleted successfully", response.json()["message"])
        mock_db_session.delete.assert_called_once_with(service_to_delete)
        mock_db_session.commit.assert_called_once()

    def test_delete_external_rag_service_not_found(self):
        mock_db_session.query(RagService).filter(RagService.id == 99).first.return_value = None
        response = self.client.delete("/api/v1/external_rag_services/99")
        self.assertEqual(response.status_code, 404)

    @patch('open_webui.routers.external_rag.query_external_rag_service')
    def test_query_external_service_endpoint_success(self, mock_query_func):
        service = RagService(id=1, name="QueryableService", url="http://query.com")
        mock_db_session.query(RagService).filter(RagService.id == 1).first.return_value = service

        # Mock the return value of the actual service call function
        mock_query_func.return_value = [
            Document(page_content="Result 1", metadata={"source": "doc A"}),
            Document(page_content="Result 2", metadata={"source": "doc B"}),
        ]

        query_data = {"query": "what is life?"}
        response = self.client.post("/api/v1/external_rag_services/1/query", json=query_data)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["page_content"], "Result 1")
        mock_query_func.assert_called_once_with(rag_service=service, query="what is life?")

    @patch('open_webui.routers.external_rag.query_external_rag_service')
    def test_query_external_service_endpoint_service_not_found(self, mock_query_func):
        mock_db_session.query(RagService).filter(RagService.id == 99).first.return_value = None

        query_data = {"query": "test"}
        response = self.client.post("/api/v1/external_rag_services/99/query", json=query_data)

        self.assertEqual(response.status_code, 404)
        mock_query_func.assert_not_called()

    # Test for authorization (example for one endpoint)
    def test_create_external_rag_service_unauthorized(self):
        # Override get_admin_user to simulate a non-admin or no user
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = lambda: None # Simulate no user / not admin

        service_data = {"name": "Unauthorized RAG", "url": "http://unauth.com"}
        response = self.client.post("/api/v1/external_rag_services", json=service_data)
        self.assertEqual(response.status_code, 403) # Expecting 403 Forbidden

        # Restore for other tests
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user


from datetime import datetime # Add this import for datetime.utcnow()

if __name__ == '__main__':
    unittest.main()

# Notes:
# - The RagService model instances in tests might need all fields expected by Pydantic models
#   used for response_model (like created_at, updated_at). I've added them to some mocks.
# - The patch for `get_admin_user` needs to target where it's imported and used.
#   If `from open_webui.utils.auth import get_admin_user` is in `routers/external_rag.py`,
#   then `app.dependency_overrides[get_admin_user_imported_in_router]` is the way with TestClient.
#   The current setup uses `app.dependency_overrides[actual_get_admin_user_dependency]`.
# - Ensure `datetime` is imported if using `datetime.utcnow()`.
# - `ANY` from `unittest.mock` can be used if checking specific arguments of a call is not needed.
# - This structure assumes `open_webui.main.app` is the FastAPI instance.
# - The `override_get_db` and `mock_get_admin_user` are standard ways to handle dependencies in FastAPI tests.
# - The test for unauthorized access is a good example for other protected endpoints.I've created the test file `backend/open_webui/test/routers/test_external_rag_api.py` for the external RAG API endpoints.

Key features of these tests:
-   Uses `fastapi.testclient.TestClient` to make requests to the app.
-   Mocks the database session using `unittest.mock.MagicMock` and FastAPI's dependency overriding (`app.dependency_overrides`).
-   Mocks the admin user dependency (`get_admin_user`) to simulate an authenticated admin for most tests.
-   Includes a test case for unauthorized access by overriding `get_admin_user` to return `None`.
-   Tests CRUD operations for `/api/v1/external_rag_services`:
    -   `POST`: Success and name conflict scenarios.
    -   `GET` (all): Verifies list response.
    -   `GET` (by ID): Found and not found scenarios.
    -   `PUT`: Success and not found scenarios.
    -   `DELETE`: Success and not found scenarios.
-   Tests the `/api/v1/external_rag_services/{service_id}/query` endpoint:
    -   Mocks the actual `query_external_rag_service` function from `open_webui.retrieval.external_rag` to avoid real network calls.
    -   Tests successful query and service not found scenarios.
-   Uses `datetime.utcnow()` for timestamp fields where necessary for model instantiation, and added the `datetime` import.

A note on dependency overriding for `get_admin_user`: The key for `app.dependency_overrides` should be the actual function object that FastAPI resolves at runtime for that dependency. I've used `from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency` and then `app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_admin_user`. This is generally reliable.

Next, I will create the test file for the admin configuration API endpoints: `backend/open_webui/test/routers/test_configs_api.py`. This will also use `TestClient` and involve mocking `PersistentConfig` interactions or the helper function `update_config_item_by_env_name`.
