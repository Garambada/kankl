from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.database.session import get_db
from backend.database.models import Keyword

router = APIRouter()

# Schema
class KeywordCreate(BaseModel):
    word: str
    category: Optional[str] = "topic"

class KeywordResponse(BaseModel):
    id: int
    word: str
    category: str
    is_active: bool

    class Config:
        from_attributes = True

from backend.api.auth import get_current_user
from backend.database.models import User

# Endpoints
@router.get("/", response_model=List[KeywordResponse])
def list_keywords(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all active keywords for current user"""
    return db.query(Keyword).filter(
        Keyword.user_id == current_user.id,
        Keyword.is_active == True
    ).all()

@router.post("/", response_model=KeywordResponse)
def add_keyword(item: KeywordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add a new keyword for current user. If exists/inactive, reactivate it."""
    # Check existence for THIS user
    existing = db.query(Keyword).filter(
        Keyword.user_id == current_user.id,
        Keyword.word == item.word
    ).first()
    
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing
    
    new_keyword = Keyword(
        user_id=current_user.id,
        word=item.word, 
        category=item.category
    )
    db.add(new_keyword)
    db.commit()
    db.refresh(new_keyword)
    return new_keyword

@router.delete("/{keyword_id}")
def delete_keyword(keyword_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Soft delete a keyword"""
    keyword = db.query(Keyword).filter(
        Keyword.id == keyword_id,
        Keyword.user_id == current_user.id
    ).first()
    
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    keyword.is_active = False
    db.commit()
    return {"status": "deleted", "id": keyword_id}
