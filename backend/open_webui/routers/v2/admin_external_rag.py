from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from open_webui.internal.db import get_db
from open_webui.models.users import UserModel as UserSchema
from open_webui.utils.auth import get_admin_user

# Re-use Pydantic models from the v1 external_rag router if they are suitable
# Or define specific v2 versions if changes are needed.
# For simplicity, let's assume we can reuse or slightly adapt.
from open_webui.routers.external_rag import (
    RagServiceCreate as RagServiceCreateV1, # Renamed in v1 to RagServiceCreate
    RagServiceUpdate as RagServiceUpdateV1, # New model for V1 updates
    RagServiceResponse as RagServiceResponseV1,
    # RagServiceQuery, DocumentResponse - these are for querying, not admin CRUD
)

# Import the actual CRUD service functions that interact with the DB
# These are not directly in the v1 router file, but are called by its endpoints.
# The v1 router directly uses db.query(RagService)...
# So, we will replicate that logic here, or ideally refactor it into service functions.
# For now, let's replicate DB interaction logic similar to v1 router.
from open_webui.models.rag_services import RagService as RagServiceDBModel

import logging

router = APIRouter()
log = logging.getLogger(__name__)


# V2 Pydantic models (can be same as V1 or slightly adapted if needed)
class RagServiceCreate(RagServiceCreateV1):
    pass

class RagServiceUpdate(RagServiceUpdateV1):
    pass

class RagServiceResponse(RagServiceResponseV1):
    pass


@router.post("", response_model=RagServiceResponse, status_code=201)
def create_external_rag_service_v2(
    rag_service_data: RagServiceCreate,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    existing_service = db.query(RagServiceDBModel).filter(RagServiceDBModel.name == rag_service_data.name).first()
    if existing_service:
        raise HTTPException(status_code=409, detail=f"RAG service with name '{rag_service_data.name}' already exists.")

    db_rag_service = RagServiceDBModel(
        name=rag_service_data.name,
        url=rag_service_data.url,
        api_key=rag_service_data.api_key,
    )
    db.add(db_rag_service)
    db.commit()
    db.refresh(db_rag_service)
    return db_rag_service


@router.get("", response_model=List[RagServiceResponse])
def get_all_external_rag_services_v2(
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    services = db.query(RagServiceDBModel).all()
    return services


@router.get("/{service_id}", response_model=RagServiceResponse)
def get_external_rag_service_by_id_v2(
    service_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    rag_service = db.query(RagServiceDBModel).filter(RagServiceDBModel.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")
    return rag_service


@router.put("/{service_id}", response_model=RagServiceResponse)
def update_external_rag_service_v2(
    service_id: int,
    rag_service_update_data: RagServiceUpdate,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    rag_service = db.query(RagServiceDBModel).filter(RagServiceDBModel.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")

    update_data = rag_service_update_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != rag_service.name:
        existing_service = db.query(RagServiceDBModel).filter(RagServiceDBModel.name == update_data["name"]).first()
        if existing_service and existing_service.id != service_id:
            raise HTTPException(status_code=409, detail=f"RAG service with name '{update_data['name']}' already exists.")

    for key, value in update_data.items():
        setattr(rag_service, key, value)

    # updated_at is handled by the model's onupdate in RagServiceDBModel
    db.commit()
    db.refresh(rag_service)
    return rag_service


@router.delete("/{service_id}", status_code=200)
def delete_external_rag_service_v2(
    service_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(get_admin_user),
):
    rag_service = db.query(RagServiceDBModel).filter(RagServiceDBModel.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")

    service_name = rag_service.name # For the message
    db.delete(rag_service)
    db.commit()
    return {"message": f"External RAG service '{service_name}' (ID: {service_id}) deleted successfully"}
