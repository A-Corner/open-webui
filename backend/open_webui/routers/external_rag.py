from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from open_webui.internal.db import get_db
from open_webui.models.rag_services import RagService
from open_webui.models.users import User
from open_webui.utils.auth import get_admin_user
from open_webui.retrieval.external_rag import query_external_rag_service
from langchain_core.documents import Document # For response model of query endpoint

router = APIRouter()

from pydantic import BaseModel # Ensure BaseModel is imported at the top
from datetime import datetime # Ensure datetime is imported at the top

# Pydantic models for request bodies
class RagServiceCreate(BaseModel): # Renamed for clarity
    name: str
    url: str
    api_key: Optional[str] = None

class RagServiceUpdate(BaseModel): # New model for updates
    name: Optional[str] = None
    url: Optional[str] = None
    api_key: Optional[str] = None

class RagServiceQuery(BaseModel):
    query: str

class RagServiceResponse(BaseModel):
    id: int
    name: str
    url: str
    api_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class DocumentResponse(BaseModel):
    page_content: str
    metadata: dict

    class Config:
        orm_mode = True


@router.post("", response_model=RagServiceResponse)
async def create_external_rag_service(
    rag_service_data: RagServiceCreate, # Changed to RagServiceCreate
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Create a new external RAG service connection.
    Only accessible by admin users.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if a service with the same name already exists
    existing_service = db.query(RagService).filter(RagService.name == rag_service_data.name).first()
    if existing_service:
        raise HTTPException(status_code=400, detail=f"RAG service with name '{rag_service_data.name}' already exists.")

    db_rag_service = RagService(
        name=rag_service_data.name,
        url=rag_service_data.url,
        api_key=rag_service_data.api_key,
    )
    db.add(db_rag_service)
    db.commit()
    db.refresh(db_rag_service)
    return db_rag_service

@router.get("", response_model=List[RagServiceResponse])
async def get_all_external_rag_services(
    db: Session = Depends(get_db),
    # Depending on requirements, listing might be for admin or all authenticated users
    # For now, let's assume admin only for consistency with create/delete
    admin_user: User = Depends(get_admin_user),
):
    """
    Get all external RAG service connections.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(RagService).all()

@router.get("/{service_id}", response_model=RagServiceResponse)
async def get_external_rag_service_by_id(
    service_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Get a specific external RAG service connection by its ID.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    rag_service = db.query(RagService).filter(RagService.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")
    return rag_service

@router.put("/{service_id}", response_model=RagServiceResponse)
async def update_external_rag_service(
    service_id: int,
    rag_service_update_data: RagServiceUpdate, # Changed to RagServiceUpdate
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update an external RAG service connection.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    rag_service = db.query(RagService).filter(RagService.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")

    update_data = rag_service_update_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != rag_service.name:
        existing_service = db.query(RagService).filter(RagService.name == update_data["name"]).first()
        if existing_service and existing_service.id != service_id:
            raise HTTPException(status_code=400, detail=f"RAG service with name '{update_data['name']}' already exists.")

    for key, value in update_data.items():
        setattr(rag_service, key, value)
    # updated_at is handled by the model's onupdate

    db.commit()
    db.refresh(rag_service)
    return rag_service

@router.delete("/{service_id}", response_model=dict)
async def delete_external_rag_service(
    service_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Delete an external RAG service connection.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    rag_service = db.query(RagService).filter(RagService.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")

    db.delete(rag_service)
    db.commit()
    return {"message": f"RAG service '{rag_service.name}' (ID: {service_id}) deleted successfully"}

@router.post("/{service_id}/query", response_model=List[DocumentResponse])
async def query_external_service_endpoint(
    service_id: int,
    query_data: RagServiceQuery,
    db: Session = Depends(get_db),
    # This endpoint might be accessible by non-admin users, adjust auth if needed
    # For now, keeping it admin-only for simplicity and security by default.
    admin_user: User = Depends(get_admin_user),
):
    """
    Query a specific external RAG service.
    """
    if not admin_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    rag_service = db.query(RagService).filter(RagService.id == service_id).first()
    if not rag_service:
        raise HTTPException(status_code=404, detail="RAG service not found")

    try:
        # Removed await as query_external_rag_service is synchronous
        documents = query_external_rag_service(rag_service=rag_service, query=query_data.query)
        # Convert Langchain Document to DocumentResponse
        return [DocumentResponse(page_content=doc.page_content, metadata=doc.metadata) for doc in documents]
    except Exception as e:
        # The query_external_rag_service function logs errors, but we might want to return a generic error here
        raise HTTPException(status_code=500, detail=f"Failed to query RAG service: {str(e)}")
