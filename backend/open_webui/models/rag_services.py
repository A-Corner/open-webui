from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from open_webui.internal.db import Base

class RagService(Base):
    __tablename__ = "rag_services"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    url = Column(String, nullable=False)
    api_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<RagService {self.name}>"
