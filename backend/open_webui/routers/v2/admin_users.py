from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Dict, Any
import uuid # For generating user_id
import logging # For logging

from pydantic import BaseModel, EmailStr, validator

from open_webui.internal.db import get_db
from open_webui.models.users import User as UserModelDB, Users, UserModel as UserSchema
from open_webui.models.auths import Auths # For updating password and deleting auth entry
from open_webui.utils.auth import get_admin_user, get_password_hash # Assuming get_admin_user is appropriate for v2 admin routes
from datetime import datetime

router = APIRouter()

# Pydantic Models for V2 User Management

class UserResponse(BaseModel):
    id: str
    username: str # In DB, this is 'name'. Need to reconcile or ensure 'name' is used as 'username'
    email: EmailStr
    role: str
    profile_image_url: Optional[str] = None
    created_at: datetime # Changed from int to datetime for consistency
    updated_at: datetime # Changed from int to datetime
    last_active_at: Optional[datetime] = None # Changed from int
    is_active: bool
    is_oauth_user: bool = False # This needs to be derived

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: int(v.timestamp()) # Keep sending as epoch int for now if frontend expects it
        }


class UserCreateForm(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"
    is_active: Optional[bool] = True

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Add more checks (uppercase, number, symbol) if desired
        return v

class UserUpdateForm(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    # Username changes are not typically done via PUT to same resource due to ID implications.
    # Profile image URL can be added if needed.
    # Name/Username change would require careful consideration of ID if username is the ID.
    # Here, ID is separate UUID/email. 'name' field in DB is used as 'username'.

class UserSetPasswordForm(BaseModel):
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    per_page: int

# Helper to convert DB User object to UserResponse, including is_oauth_user
def ensure_user_model_fields(user_db: UserModelDB) -> UserSchema:
    """Converts DB model to Pydantic schema, ensuring all fields, esp. is_active."""
    user_dict = {
        "id": user_db.id,
        "name": user_db.name, # Pydantic model might use 'username'
        "email": user_db.email,
        "role": user_db.role,
        "profile_image_url": user_db.profile_image_url,
        "last_active_at": user_db.last_active_at,
        "updated_at": user_db.updated_at,
        "created_at": user_db.created_at,
        "api_key": user_db.api_key,
        "settings": user_db.settings,
        "info": user_db.info,
        "oauth_sub": user_db.oauth_sub,
        "is_active": getattr(user_db, 'is_active', True) # Default to True if somehow missing
    }
    return UserSchema(**user_dict)


def db_user_to_response(db_user_sa: UserModelDB, db: Session) -> UserResponse:
    # Convert SQLAlchemy model to Pydantic model (UserSchema has is_active)
    user_pydantic = ensure_user_model_fields(db_user_sa)

    # Check if user is an OAuth user by looking at Auths table or oauth_sub
    is_oauth = bool(user_pydantic.oauth_sub)
    if not is_oauth: # Double check in Auths table if oauth_sub is not definitive
        auth_entry = db.query(Auths).filter(Auths.user_id == user_pydantic.id).first()
        if auth_entry and auth_entry.type == "oauth": # Assuming 'type' field exists
            is_oauth = True

    return UserResponse(
        id=user_pydantic.id,
        username=user_pydantic.name, # Map 'name' to 'username'
        email=user_pydantic.email,
        role=user_pydantic.role,
        profile_image_url=user_pydantic.profile_image_url,
        created_at=datetime.fromtimestamp(user_pydantic.created_at),
        updated_at=datetime.fromtimestamp(user_pydantic.updated_at),
        last_active_at=datetime.fromtimestamp(user_pydantic.last_active_at) if user_pydantic.last_active_at else None,
        is_active=user_pydantic.is_active,
        is_oauth_user=is_oauth
    )

# API Endpoints Implementation will follow...
# For now, just creating the file with models and router instance.

log = logging.getLogger(__name__)

# API Endpoints Implementation

@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    form_data: UserCreateForm,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user), # Ensure admin privileges
):
    # Check if username (name in DB) or email already exists
    existing_user_by_name = db.query(UserModelDB).filter(UserModelDB.name == form_data.username).first()
    if existing_user_by_name:
        raise HTTPException(status_code=409, detail=f"Username '{form_data.username}' already registered.")

    existing_user_by_email = db.query(UserModelDB).filter(UserModelDB.email == form_data.email).first()
    if existing_user_by_email:
        raise HTTPException(status_code=409, detail=f"Email '{form_data.email}' already registered.")

    user_id = str(uuid.uuid4()) # Generate a new UUID for user_id

    # Create new user in 'user' table
    new_db_user = Users.insert_new_user(
        id=user_id,
        name=form_data.username, # Store username in 'name' field
        email=form_data.email,
        role=form_data.role,
        profile_image_url="/static/user.png", # Default profile image
        is_active=form_data.is_active
    )
    if not new_db_user:
        raise HTTPException(status_code=500, detail="Failed to create user in database.")

    # Create auth entry for the new user
    hashed_password = get_password_hash(form_data.password)
    auth_entry = Auths.insert_auth(user_id=user_id, hashed_password=hashed_password)
    if not auth_entry:
        # Rollback user creation if auth entry fails? Or handle cleanup.
        # For now, assume Users.insert_new_user and Auths.insert_auth are somewhat atomic or handle errors.
        # If Users.insert_new_user committed, we might have an orphaned user.
        # A better approach might be a transaction or service layer method.
        # However, current Users.insert_new_user also commits.
        # Let's assume if auth fails, we should ideally delete the user record.
        try:
            Users.delete_user_by_id(user_id) # Attempt cleanup
        except Exception as e:
            log.error(f"Failed to cleanup user {user_id} after auth creation failure: {e}")
        raise HTTPException(status_code=500, detail="Failed to create auth entry for user.")

    # Fetch the created user from DB to ensure all fields are populated for the response
    # The new_db_user from insert_new_user is Pydantic, need SQLAlchemy instance for db_user_to_response
    created_user_sa = db.query(UserModelDB).filter(UserModelDB.id == user_id).first()
    if not created_user_sa:
         raise HTTPException(status_code=500, detail="Failed to retrieve created user.") # Should not happen

    return db_user_to_response(created_user_sa, db)


@router.get("", response_model=UserListResponse)
def get_users_list(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    query: Optional[str] = Query(None, description="Search query for username or email"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    offset = (page - 1) * per_page

    db_query = db.query(UserModelDB)

    filters = []
    if query:
        search_term = f"%{query}%"
        filters.append(or_(UserModelDB.name.ilike(search_term), UserModelDB.email.ilike(search_term)))
    if role:
        filters.append(UserModelDB.role == role)
    if is_active is not None: # Check for True or False explicitly
        filters.append(UserModelDB.is_active == is_active)

    if filters:
        db_query = db_query.filter(and_(*filters))

    total_users = db_query.count()
    users_db = db_query.order_by(UserModelDB.name).limit(per_page).offset(offset).all()

    user_responses = [db_user_to_response(u, db) for u in users_db]

    return UserListResponse(
        users=user_responses,
        total=total_users,
        page=page,
        per_page=per_page,
    )

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    db_user = db.query(UserModelDB).filter(UserModelDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user_to_response(db_user, db)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    form_data: UserUpdateForm,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    db_user = db.query(UserModelDB).filter(UserModelDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = form_data.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_user.email:
        existing_user_by_email = db.query(UserModelDB).filter(UserModelDB.email == update_data["email"]).first()
        if existing_user_by_email:
            raise HTTPException(status_code=409, detail=f"Email '{update_data['email']}' is already registered by another user.")

    for key, value in update_data.items():
        if hasattr(db_user, key):
            setattr(db_user, key, value)
        # Note: 'username' (db_user.name) is not directly updatable here.
        # If it were, a similar check for username uniqueness would be needed.

    db_user.updated_at = int(datetime.utcnow().timestamp()) # Manually update timestamp as DB model might not auto-update this way

    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        log.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user information.")

    return db_user_to_response(db_user, db)

@router.delete("/{user_id}", status_code=200)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    db_user = db.query(UserModelDB).filter(UserModelDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.id == admin_user.id:
        raise HTTPException(status_code=403, detail="Admins cannot delete their own account.")

    try:
        # Delete associated auth entry first
        auth_deleted = Auths.delete_auth_by_user_id(db_user.id)
        if not auth_deleted:
            # Log this, but proceed to delete user record if auth doesn't exist or fails to delete
            log.warning(f"Auth entry for user {user_id} not found or failed to delete. Proceeding with user deletion.")

        # Users.delete_user_by_id handles deleting user and their chats/group memberships
        user_deleted = Users.delete_user_by_id(db_user.id)
        if not user_deleted:
            # This might happen if there's an issue in the underlying delete logic
            raise HTTPException(status_code=500, detail="Failed to delete user or their associated data.")

        # db.delete(db_user) # Users.delete_user_by_id should handle this
        # db.commit()

        return {"detail": f"User '{db_user.name}' (ID: {user_id}) and associated data deleted successfully."}

    except HTTPException as e:
        db.rollback() # Rollback if HTTPException was raised by helper or here
        raise e
    except Exception as e:
        db.rollback()
        log.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while deleting the user.")

@router.post("/{user_id}/set-password", status_code=200)
def set_user_password(
    user_id: str,
    form_data: UserSetPasswordForm,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    db_user = db.query(UserModelDB).filter(UserModelDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the user is an OAuth user, if so, disallow password changes if oauth_sub is present
    # This check might be too simplistic if users can be both OAuth and local.
    # For now, if oauth_sub exists, assume they are primarily OAuth.
    if db_user.oauth_sub:
        auth_entry = db.query(Auths).filter(Auths.user_id == user_id).first()
        # If an auth entry exists and it's specifically for local password (e.g. type != 'oauth'),
        # then allow password change. Or, if no auth entry, they might be oauth only.
        # Current Auths model doesn't have a clear 'type' field to distinguish local vs oauth password hash.
        # A user with oauth_sub might still have a local password set if they were created locally then linked,
        # or if password was set by admin.
        # For now, let's assume if oauth_sub is set, password management here is complex.
        # A safer rule: if an auth record (password hash) doesn't exist for them, don't allow setting one here
        # if they are an oauth_sub user, as it might be confusing.
        # However, admin should be able to set an initial password or reset one.
        # Let's proceed with allowing admin to set/reset password, but log a warning if user has oauth_sub.
        log.warning(f"User {user_id} has an OAuth association (oauth_sub exists). Setting/resetting password as admin.")


    hashed_password = get_password_hash(form_data.new_password)

    auth_updated = Auths.update_auth_password_by_user_id(user_id=user_id, hashed_password=hashed_password)

    if not auth_updated:
        # This could mean the user had no prior auth entry, or update failed.
        # Try inserting if it didn't exist (e.g. an OAuth user getting a local password set by admin)
        auth_entry = db.query(Auths).filter(Auths.user_id == user_id).first()
        if not auth_entry:
            log.info(f"No existing auth entry for user {user_id}. Creating one for password set.")
            new_auth_entry = Auths.insert_auth(user_id=user_id, hashed_password=hashed_password)
            if not new_auth_entry:
                raise HTTPException(status_code=500, detail="Failed to create auth entry for password set.")
        else:
            # Update failed for an existing entry, which is unexpected if update_auth_password_by_user_id is robust
            raise HTTPException(status_code=500, detail="Failed to update password.")

    # Manually update user's updated_at timestamp as this is a significant change
    db_user.updated_at = int(datetime.utcnow().timestamp())
    try:
        db.commit()
        # No need to db.refresh(db_user) as we are not returning its content here.
    except Exception as e:
        db.rollback()
        log.error(f"Error committing updated_at for user {user_id} after password set: {e}")
        # The password itself was committed by Auths.update_auth_password_by_user_id or Auths.insert_auth
        # This commit is only for user.updated_at. If it fails, it's not critical for password change itself.
        # However, it's better to keep operations atomic if possible.
        # Consider moving user.updated_at update into a transaction with password update if Auths methods allow passing db session.

    return {"detail": "Password updated successfully"}
