import unittest
import uuid
from unittest.mock import patch, MagicMock, ANY
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from open_webui.main import app # Main FastAPI app
from open_webui.models.users import User as UserModelDB, Users as UsersTableAccessor, UserModel as UserSchema
from open_webui.models.auths import Auths as AuthsTableAccessor
from open_webui.internal.db import get_db
from open_webui.utils.auth import get_admin_user, get_password_hash, verify_password
from open_webui.routers.v2.admin_users import UserResponse, UserCreateForm, UserUpdateForm, UserSetPasswordForm, UserListResponse # Pydantic models from the router

# Mock User Data
MOCK_ADMIN_USER_ID = str(uuid.uuid4())
MOCK_NORMAL_USER_ID = str(uuid.uuid4())

MOCK_ADMIN_USER = UserSchema(
    id=MOCK_ADMIN_USER_ID,
    name="Test Admin",
    email="admin@example.com",
    role="admin",
    profile_image_url="/static/user.png",
    created_at=int(datetime.now(timezone.utc).timestamp()),
    updated_at=int(datetime.now(timezone.utc).timestamp()),
    last_active_at=int(datetime.now(timezone.utc).timestamp()),
    is_active=True,
    oauth_sub=None,
)

MOCK_NORMAL_USER = UserSchema(
    id=MOCK_NORMAL_USER_ID,
    name="Test User",
    email="user@example.com",
    role="user",
    profile_image_url="/static/user.png",
    created_at=int(datetime.now(timezone.utc).timestamp()),
    updated_at=int(datetime.now(timezone.utc).timestamp()),
    last_active_at=int(datetime.now(timezone.utc).timestamp()),
    is_active=True,
    oauth_sub=None,
)


# In-memory SQLite for testing (or mock Session directly)
# For simplicity here, we'll mock the Session methods directly.
mock_db_session = MagicMock(spec=Session)

def override_get_db():
    mock_db_session.reset_mock() # Reset for each call/test
    return mock_db_session

# Dependency overrides for authentication
def mock_get_current_admin_user():
    # In a real scenario, this would come from a decoded token
    return MOCK_ADMIN_USER

def mock_get_current_normal_user():
    return MOCK_NORMAL_USER


class TestAdminUsersV2API(unittest.TestCase):
    client: TestClient

    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_db] = override_get_db
        # Assuming get_admin_user is the dependency used in the v2 router
        app.dependency_overrides[get_admin_user] = mock_get_current_admin_user
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        mock_db_session.reset_mock()
        # Clear any user "created" in previous tests (mocked DB)
        self.users_in_db = {} # Simulate DB user storage
        self.auths_in_db = {} # Simulate DB auth storage

        # Mock DB query results
        def mock_query_filter_first(model_class):
            def filter_by(**kwargs):
                # Simplified mock: assumes filtering by unique ID, email or name
                if model_class == UserModelDB:
                    if 'id' in kwargs:
                        return self.users_in_db.get(kwargs['id'])
                    if 'email' in kwargs:
                        for u in self.users_in_db.values():
                            if u.email == kwargs['email']: return u
                        return None
                    if 'name' in kwargs: # 'name' in DB is 'username' in API
                        for u in self.users_in_db.values():
                            if u.name == kwargs['name']: return u
                        return None
                elif model_class == AuthsTableAccessor: # Assuming Auths is the class for auths table
                     if 'user_id' in kwargs:
                        return self.auths_in_db.get(kwargs['user_id'])
                return None

            mock_query_obj = MagicMock()
            mock_query_obj.filter_by.side_effect = filter_by
            mock_query_obj.filter.return_value.first.side_effect = filter_by # for user_id
            return mock_query_obj

        mock_db_session.query.side_effect = mock_query_filter_first

        # Mock add, commit, refresh, delete
        def mock_add(instance):
            if isinstance(instance, UserModelDB):
                self.users_in_db[instance.id] = instance
            elif isinstance(instance, AuthsTableAccessor): # Assuming Auths is the class for auths table
                self.auths_in_db[instance.user_id] = instance

        mock_db_session.add.side_effect = mock_add
        mock_db_session.commit = MagicMock()
        mock_db_session.refresh = MagicMock()

        def mock_delete(instance):
            if isinstance(instance, UserModelDB):
                if instance.id in self.users_in_db: del self.users_in_db[instance.id]
            elif isinstance(instance, AuthsTableAccessor):
                 if instance.user_id in self.auths_in_db: del self.auths_in_db[instance.user_id]

        mock_db_session.delete.side_effect = mock_delete

        # Mock UsersTableAccessor methods used by the API that are not simple queries
        # Users.insert_new_user is complex, mock its behavior or the underlying DB interactions
        # For create_user, we are essentially re-implementing parts of insert_new_user and insert_auth logic
        # within the endpoint. So direct DB mocks (add, commit) are more relevant there.
        # Let's ensure UsersTableAccessor.delete_user_by_id and AuthsTableAccessor.delete_auth_by_user_id are robustly mocked if used.

        # Mock UsersTableAccessor.delete_user_by_id
        self.mock_users_delete_user_by_id = patch.object(UsersTableAccessor, 'delete_user_by_id').start()
        self.mock_users_delete_user_by_id.return_value = True # Assume success

        # Mock AuthsTableAccessor.delete_auth_by_user_id
        self.mock_auths_delete_auth_by_user_id = patch.object(AuthsTableAccessor, 'delete_auth_by_user_id').start()
        self.mock_auths_delete_auth_by_user_id.return_value = True

        # Mock AuthsTableAccessor.update_auth_password_by_user_id
        self.mock_auths_update_password = patch.object(AuthsTableAccessor, 'update_auth_password_by_user_id').start()
        self.mock_auths_update_password.return_value = True

        # Mock AuthsTableAccessor.insert_auth (for set_password if user had no auth entry)
        self.mock_auths_insert_auth = patch.object(AuthsTableAccessor, 'insert_auth').start()
        # self.mock_auths_insert_auth.return_value = True # or the created object

    def tearDown(self):
        patch.stopall()


    # Helper to create a user directly in our mock DB for testing GET/PUT/DELETE
    def _create_direct_db_user(self, user_details: dict) -> UserModelDB:
        now = int(datetime.now(timezone.utc).timestamp())
        user_id = user_details.get("id", str(uuid.uuid4()))

        db_user = UserModelDB(
            id=user_id,
            name=user_details["username"], # map username to name
            email=user_details["email"],
            role=user_details.get("role", "user"),
            profile_image_url=user_details.get("profile_image_url", "/static/user.png"),
            created_at=user_details.get("created_at", now),
            updated_at=user_details.get("updated_at", now),
            last_active_at=user_details.get("last_active_at", now),
            is_active=user_details.get("is_active", True),
            oauth_sub=user_details.get("oauth_sub")
        )
        self.users_in_db[user_id] = db_user

        if "password" in user_details:
            auth_entry = AuthsTableAccessor(
                user_id=user_id,
                hashed_password=get_password_hash(user_details["password"])
            )
            self.auths_in_db[user_id] = auth_entry
        return db_user

    # --- Test Cases Start Here ---

    def test_create_user_success(self):
        form_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "ValidPassword123",
            "role": "user",
            "is_active": True,
        }
        # Ensure user/email doesn't exist for this test
        mock_db_session.query(UserModelDB).filter().first.return_value = None

        response = self.client.post("/api/v2/admin/users", json=form_data)

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["username"], form_data["username"])
        self.assertEqual(data["email"], form_data["email"])
        self.assertEqual(data["role"], form_data["role"])
        self.assertEqual(data["is_active"], form_data["is_active"])

        # Verify DB interactions (simplified: check our mock DB)
        self.assertIn(data["id"], self.users_in_db)
        self.assertIn(data["id"], self.auths_in_db)
        self.assertTrue(verify_password(form_data["password"], self.auths_in_db[data["id"]].hashed_password))

    def test_create_user_username_conflict(self):
        # Pre-populate with a user having the conflicting username
        self._create_direct_db_user({"username": "existinguser", "email": "unique1@example.com", "password": "password123"})

        # Mock the specific query for username check to return the existing user
        # The general mock_query_filter_first in setUp should handle this by checking self.users_in_db

        form_data = {"username": "existinguser", "email": "newemail@example.com", "password": "Password123"}
        response = self.client.post("/api/v2/admin/users", json=form_data)
        self.assertEqual(response.status_code, 409)
        self.assertIn("Username 'existinguser' already registered", response.json()["detail"])

    def test_create_user_email_conflict(self):
        self._create_direct_db_user({"username": "anotheruser", "email": "existing@example.com", "password": "password123"})

        form_data = {"username": "newusername", "email": "existing@example.com", "password": "Password123"}
        response = self.client.post("/api/v2/admin/users", json=form_data)
        self.assertEqual(response.status_code, 409)
        self.assertIn("Email 'existing@example.com' already registered", response.json()["detail"])

    def test_create_user_invalid_payload_short_password(self):
        form_data = {"username": "testuser", "email": "test@example.com", "password": "short"}
        # This will be caught by Pydantic validation in UserCreateForm
        response = self.client.post("/api/v2/admin/users", json=form_data)
        self.assertEqual(response.status_code, 422)

    def test_create_user_forbidden_for_normal_user(self):
        # Override dependency to simulate normal user
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency # Import the actual dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_current_normal_user

        form_data = {"username": "testuser_forbidden", "email": "forbidden@example.com", "password": "Password123"}
        response = self.client.post("/api/v2/admin/users", json=form_data)
        # Assuming the endpoint is protected by get_admin_user, which would raise 403 if not admin.
        # However, mock_get_current_normal_user returns a User, but the endpoint expects an Admin user.
        # The get_admin_user dependency itself should raise HTTPException(status_code=403) if user.role != 'admin'.
        # Let's verify that mock_get_current_admin_user is indeed the one that would be called and cause 403
        # if a normal user's token was somehow passed to an admin-only route.
        # The current setup for test class uses mock_get_current_admin_user for all tests by default.
        # For this test, we need to ensure the dependency override is specific to this test method
        # or that get_admin_user correctly raises 403 if a non-admin User object is returned by the mock.
        # The Depends(get_admin_user) in the route will call mock_get_current_normal_user.
        # The get_admin_user function in open_webui.utils.auth should check user.role.
        # If get_admin_user is correctly implemented, it will raise 403 if the user from token isn't admin.

        # Forcing the get_admin_user dependency to simulate what would happen if a non-admin user's
        # token was used on an admin-protected route.
        # A more direct way to test this is if get_admin_user itself raises HTTPException.
        # Here, we are testing the route's behavior when the dependency returns a non-admin user.
        # The actual get_admin_user in open_webui.utils.auth.py does:
        #   if user.role != "admin": raise HTTPException(status_code=403, detail="User does not have admin privileges")
        # So, if mock_get_current_normal_user (role='user') is returned by the dependency, this should trigger 403.

        self.assertEqual(response.status_code, 403)

        # Restore admin user for subsequent tests
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_current_admin_user

    def test_get_users_list_paginated_and_filtered(self):
        # Create some test users
        user1_details = {"id": "id1", "username": "alice", "email": "alice@example.com", "role": "admin", "is_active": True}
        user2_details = {"id": "id2", "username": "bob", "email": "bob@example.com", "role": "user", "is_active": True}
        user3_details = {"id": "id3", "username": "charlie_disabled", "email": "charlie@example.com", "role": "user", "is_active": False}
        user4_details = {"id": "id4", "username": "david_admin", "email": "david@example.com", "role": "admin", "is_active": True}

        self._create_direct_db_user(user1_details)
        self._create_direct_db_user(user2_details)
        self._create_direct_db_user(user3_details)
        self._create_direct_db_user(user4_details)

        # Mock the db.query(UserModelDB) part for list operations
        mock_query_obj = MagicMock()

        # This list will be filtered by the side_effect function
        all_db_users_list = list(self.users_in_db.values())

        def mock_list_query_side_effect(*args, **kwargs):
            # Simulate filtering, ordering, offset, limit based on how the endpoint constructs its query
            # This is a simplified version. A more accurate mock would parse the SQLAlchemy filter objects.
            current_list = list(all_db_users_list) # Start with all users in the mock DB

            # Simulate filtering based on query parameters used by the endpoint
            # This part needs to align with how the actual endpoint builds its query conditions
            # For simplicity, let's assume the mock_db_session.query().filter()... chain is complex to replicate fully here.
            # Instead, we'll mock the final result of all(), count().

            # The endpoint does: db_query = db.query(UserModelDB); then filters; then .count() and .all()
            # We need to mock the chain.

            # This lambda will be the .all()
            mock_query_obj.order_by.return_value.limit.return_value.offset.return_value.all.return_value = current_list
            # This lambda will be the .count()
            mock_query_obj.count.return_value = len(current_list)

            # If filters were applied, this should be smarter:
            # mock_query_obj.filter.return_value.count.return_value = ...
            # mock_query_obj.filter.return_value.order_by. ... .all.return_value = ...

            return mock_query_obj # Return the mock_query_obj itself to allow chaining like .filter, .order_by etc.

        mock_db_session.query.return_value = mock_query_obj # query(UserModelDB) returns our mock_query_obj

        # Test 1: Default pagination
        mock_query_obj.order_by.return_value.limit.return_value.offset.return_value.all.return_value = all_db_users_list[:20] # Default per_page
        mock_query_obj.count.return_value = len(all_db_users_list)
        response = self.client.get("/api/v2/admin/users")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 4)
        self.assertEqual(len(data["users"]), 4) # All users since less than per_page=20 default
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["per_page"], 20)

        # Test 2: Search query for 'alice'
        # We need to refine the mock_list_query_side_effect or how filter().count() and filter().all() are mocked
        # For a specific filter test, we directly set the return values for .count() and .all() after filter
        filtered_for_alice = [u for u in all_db_users_list if "alice" in u.name or "alice" in u.email]
        mock_filtered_query = MagicMock()
        mock_filtered_query.count.return_value = len(filtered_for_alice)
        mock_filtered_query.order_by.return_value.limit.return_value.offset.return_value.all.return_value = filtered_for_alice
        mock_db_session.query.return_value.filter.return_value = mock_filtered_query # After .filter()

        response = self.client.get("/api/v2/admin/users?query=alice")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["users"][0]["username"], "alice")

        # Test 3: Filter by role 'admin'
        filtered_for_admin_role = [u for u in all_db_users_list if u.role == "admin"]
        mock_filtered_query.count.return_value = len(filtered_for_admin_role)
        mock_filtered_query.order_by.return_value.limit.return_value.offset.return_value.all.return_value = filtered_for_admin_role
        # mock_db_session.query.return_value.filter.return_value remains mock_filtered_query

        response = self.client.get("/api/v2/admin/users?role=admin")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 2)
        self.assertTrue(all(u["role"] == "admin" for u in data["users"]))

        # Test 4: Filter by is_active=False
        filtered_for_inactive = [u for u in all_db_users_list if not u.is_active]
        mock_filtered_query.count.return_value = len(filtered_for_inactive)
        mock_filtered_query.order_by.return_value.limit.return_value.offset.return_value.all.return_value = filtered_for_inactive

        response = self.client.get("/api/v2/admin/users?is_active=false")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["users"][0]["username"], "charlie_disabled")
        self.assertFalse(data["users"][0]["is_active"])

        # Restore general query mock for other tests
        mock_db_session.query.side_effect = mock_query_filter_first


    def test_get_users_list_forbidden_for_normal_user(self):
        from open_webui.utils.auth import get_admin_user as actual_get_admin_user_dependency
        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_current_normal_user

        response = self.client.get("/api/v2/admin/users")
        self.assertEqual(response.status_code, 403)

        app.dependency_overrides[actual_get_admin_user_dependency] = mock_get_current_admin_user

    def test_get_user_by_id_success(self):
        user_details = {"id": "test_id_123", "username": "getme", "email": "getme@example.com", "password": "password"}
        created_user_db_model = self._create_direct_db_user(user_details)

        # Ensure the general query mock in setUp will find this user by ID
        # self.users_in_db[user_details["id"]] = created_user_db_model
        # The _create_direct_db_user helper already does this.

        response = self.client.get(f"/api/v2/admin/users/{user_details['id']}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], user_details["id"])
        self.assertEqual(data["username"], user_details["username"])
        self.assertEqual(data["email"], user_details["email"])

    def test_get_user_by_id_not_found(self):
        non_existent_id = "non_existent_id_404"
        # Ensure the general query mock in setUp will return None for this ID
        # self.users_in_db.pop(non_existent_id, None) # Ensure it's not there
        # The mock_query_filter_first in setUp will return None if ID not in self.users_in_db

        response = self.client.get(f"/api/v2/admin/users/{non_existent_id}")
        self.assertEqual(response.status_code, 404)
        self.assertIn("User not found", response.json()["detail"])

    def test_update_user_success(self):
        user_details = {"id": "update_me_id", "username": "updatable", "email": "update@example.com", "role": "user", "is_active": True, "password": "password123"}
        self._create_direct_db_user(user_details)

        update_payload = {
            "email": "updated_successfully@example.com",
            "role": "admin",
            "is_active": False
        }
        # Mock query for email conflict check (assume new email is not taken)
        # This will be called by: db.query(UserModelDB).filter(UserModelDB.email == update_payload["email"]).first()
        # We need to ensure our mock_query_filter_first in setUp handles this correctly or provide a specific mock here.
        # Current mock_query_filter_first should return None if email not in self.users_in_db.

        response = self.client.put(f"/api/v2/admin/users/{user_details['id']}", json=update_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], update_payload["email"])
        self.assertEqual(data["role"], update_payload["role"])
        self.assertEqual(data["is_active"], update_payload["is_active"])

        # Verify in our mock DB
        updated_db_user = self.users_in_db[user_details["id"]]
        self.assertEqual(updated_db_user.email, update_payload["email"])
        self.assertEqual(updated_db_user.role, update_payload["role"])
        self.assertEqual(updated_db_user.is_active, update_payload["is_active"])
        mock_db_session.commit.assert_called() # Should be called once after updates

    def test_update_user_email_conflict(self):
        user1_details = {"id": "user1_id", "username": "userone", "email": "user1@example.com", "role": "user", "password": "p1"}
        user2_details = {"id": "user2_id", "username": "usertwo", "email": "user2@example.com", "role": "user", "password": "p2"}
        self._create_direct_db_user(user1_details)
        self._create_direct_db_user(user2_details)

        update_payload = {"email": user2_details["email"]} # Try to update user1's email to user2's email

        # Mock query for email conflict check to return user2
        # The general mock_query_filter_first in setUp should handle this.

        response = self.client.put(f"/api/v2/admin/users/{user1_details['id']}", json=update_payload)
        self.assertEqual(response.status_code, 409)
        self.assertIn(f"Email '{user2_details['email']}' is already registered", response.json()["detail"])

    def test_update_user_not_found(self):
        update_payload = {"email": "doesntexist@example.com"}
        response = self.client.put("/api/v2/admin/users/non_existent_user_id", json=update_payload)
        self.assertEqual(response.status_code, 404)
        self.assertIn("User not found", response.json()["detail"])

    def test_delete_user_success(self):
        user_details = {"id": "delete_me_id", "username": "deletable", "email": "delete@example.com", "password": "pw"}
        self._create_direct_db_user(user_details)

        # Ensure UsersTableAccessor.delete_user_by_id is mocked to return True (done in setUp)
        # Ensure AuthsTableAccessor.delete_auth_by_user_id is mocked to return True (done in setUp)

        response = self.client.delete(f"/api/v2/admin/users/{user_details['id']}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("deleted successfully", response.json()["detail"])

        # Verify mocks were called
        self.mock_auths_delete_auth_by_user_id.assert_called_once_with(user_details['id'])
        self.mock_users_delete_user_by_id.assert_called_once_with(user_details['id'])
        # No direct db.commit() in endpoint, it's in the TableAccessor methods.

    def test_delete_self_admin_user_forbidden(self):
        # Current admin user is MOCK_ADMIN_USER, with id MOCK_ADMIN_USER_ID
        response = self.client.delete(f"/api/v2/admin/users/{MOCK_ADMIN_USER_ID}")
        self.assertEqual(response.status_code, 403) # As per endpoint logic
        self.assertIn("Admins cannot delete their own account", response.json()["detail"])

    def test_delete_user_not_found(self):
        response = self.client.delete("/api/v2/admin/users/non_existent_user_for_delete")
        self.assertEqual(response.status_code, 404)
        self.assertIn("User not found", response.json()["detail"])

    def test_set_password_success(self):
        user_details = {"id": "set_pass_id", "username": "passuser", "email": "pass@example.com", "password": "oldPassword123"}
        db_user = self._create_direct_db_user(user_details) # This creates an auth entry with oldPassword123

        set_password_payload = {"new_password": "newValidPassword456"}

        # Mock Auths.update_auth_password_by_user_id to indicate success
        self.mock_auths_update_password.return_value = True
        # Mock Auths.insert_auth to not be called ideally, or handle if it is
        self.mock_auths_insert_auth.return_value = True # Should not be called if update succeeds

        response = self.client.post(f"/api/v2/admin/users/{user_details['id']}/set-password", json=set_password_payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Password updated successfully", response.json()["detail"])

        self.mock_auths_update_password.assert_called_once_with(user_id=user_details['id'], hashed_password=ANY)
        # Verify the new password hash would be different from old one
        # And that the new password matches (by verifying it against the ANY hash passed to the mock)
        # This requires capturing the argument passed to the mock.
        args, kwargs = self.mock_auths_update_password.call_args
        self.assertTrue(verify_password(set_password_payload["new_password"], kwargs['hashed_password']))
        self.assertFalse(verify_password(user_details["password"], kwargs['hashed_password']))

        mock_db_session.commit.assert_called() # For user.updated_at

    def test_set_password_for_user_without_auth_entry(self):
        # User exists but has no entry in Auths table (e.g. an OAuth user)
        user_details = {"id": "oauth_user_id", "username": "oauthuser", "email": "oauth@example.com", "oauth_sub": "somesub"}
        self._create_direct_db_user(user_details) # No password, so no auths entry via this helper

        set_password_payload = {"new_password": "newLocalPassword123"}

        self.mock_auths_update_password.return_value = False # Simulate update failing (no record to update)
        self.mock_auths_insert_auth.return_value = True    # Simulate insert succeeding

        response = self.client.post(f"/api/v2/admin/users/{user_details['id']}/set-password", json=set_password_payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Password updated successfully", response.json()["detail"])

        self.mock_auths_update_password.assert_called_once_with(user_id=user_details['id'], hashed_password=ANY)
        self.mock_auths_insert_auth.assert_called_once_with(user_id=user_details['id'], hashed_password=ANY)
        args_insert, kwargs_insert = self.mock_auths_insert_auth.call_args
        self.assertTrue(verify_password(set_password_payload["new_password"], kwargs_insert['hashed_password']))


    def test_set_password_user_not_found(self):
        set_password_payload = {"new_password": "Password123"}
        response = self.client.post("/api/v2/admin/users/non_existent_user_pass/set-password", json=set_password_payload)
        self.assertEqual(response.status_code, 404)
        self.assertIn("User not found", response.json()["detail"])

    def test_set_password_invalid_password_short(self):
        user_details = {"id": "shortpass_id", "username": "shortpass", "email": "short@example.com", "password": "pw"}
        self._create_direct_db_user(user_details)

        set_password_payload = {"new_password": "short"}
        response = self.client.post(f"/api/v2/admin/users/{user_details['id']}/set-password", json=set_password_payload)
        self.assertEqual(response.status_code, 422) # Pydantic validation for UserSetPasswordForm

if __name__ == "__main__":
    unittest.main()
