import sys
import os

from backend.database.session import SessionLocal
from backend.database.models import User
from backend.api.auth import get_password_hash

db = SessionLocal()
u = db.query(User).filter(User.email == 'kjbyun@foundersstud.io').first()
if getattr(u, 'id', None):
    print("Found user. Old hash:", u.password_hash[:20])
    u.password_hash = get_password_hash("password123")
    db.commit()
    print("Password reset successfully. New hash:", u.password_hash[:20])
else:
    print("User not found.")
