from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from backend.database.session import get_db
from backend.database.models import Booking, User, Speaker
from backend.api.auth import get_current_user, require_admin

router = APIRouter()

# Schemas
class BookingCreate(BaseModel):
    speaker_id: int
    booking_time: datetime
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    speaker_name: str
    booking_time: datetime
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True

@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify speaker exists
    speaker = db.query(Speaker).filter(Speaker.id == booking.speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    new_booking = Booking(
        user_id=current_user.id,
        speaker_id=booking.speaker_id,
        booking_time=booking.booking_time,
        notes=booking.notes,
        status="confirmed" # Auto-confirm for demo
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return BookingResponse(
        id=new_booking.id,
        speaker_name=speaker.name,
        booking_time=new_booking.booking_time,
        status=new_booking.status,
        notes=new_booking.notes
    )

@router.get("/", response_model=List[BookingResponse])
def list_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Share all bookings globally across users as requested
    bookings = db.query(Booking).all()
    
    response = []
    for b in bookings:
        speaker = db.query(Speaker).filter(Speaker.id == b.speaker_id).first()
        response.append(BookingResponse(
            id=b.id,
            speaker_name=speaker.name if speaker else "Unknown Speaker",
            booking_time=b.booking_time,
            status=b.status,
            notes=b.notes
        ))
    return response

@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not authorized")
    
    db.delete(booking)
    db.commit()
    return {"status": "deleted", "id": booking_id}

# Admin Routes
@router.get("/all", response_model=List[BookingResponse])
def list_all_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    bookings = db.query(Booking).offset(skip).limit(limit).all()
    
    response = []
    for b in bookings:
        speaker = db.query(Speaker).filter(Speaker.id == b.speaker_id).first()
        response.append(BookingResponse(
            id=b.id,
            speaker_name=speaker.name if speaker else "Unknown Speaker",
            booking_time=b.booking_time,
            status=b.status,
            notes=b.notes
        ))
    return response

@router.delete("/admin/{booking_id}")
def admin_delete_booking(booking_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    db.delete(booking)
    db.commit()
    return {"status": "deleted", "id": booking_id, "message": f"Booking {booking_id} administratively deleted"}
