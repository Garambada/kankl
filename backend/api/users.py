from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from backend.database.session import get_db
from backend.database.models import User, Booking, Briefing, Keyword, Conversation, Message
from backend.api.auth import get_current_user, require_admin, get_password_hash

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None 
    # Password update should be a separate secure endpoint

class AdminUserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "member"

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.name:
        current_user.name = user_update.name
    if user_update.email:
        # Check if email is taken
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    db.commit()
    db.refresh(current_user)
    return current_user

# Admin Routes
@router.get("/", response_model=List[UserResponse])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(user: AdminUserCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, password_hash=hashed_password, name=user.name, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user_admin(user_id: int, user_update: AdminUserUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.name:
        user.name = user_update.name
    if user_update.role:
        user.role = user_update.role
    if user_update.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_update.email
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    # Delete related records to maintain referential integrity
    db.query(Keyword).filter(Keyword.user_id == user_id).delete(synchronize_session=False)
    db.query(Booking).filter(Booking.user_id == user_id).delete(synchronize_session=False)
    db.query(Briefing).filter(Briefing.user_id == user_id).delete(synchronize_session=False)
    
    # Delete messages for user's conversations
    conversations = db.query(Conversation).filter(Conversation.user_id == user_id).all()
    conversation_ids = [c.id for c in conversations]
    if conversation_ids:
        db.query(Message).filter(Message.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.user_id == user_id).delete(synchronize_session=False)
        
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user_id} deleted"}
