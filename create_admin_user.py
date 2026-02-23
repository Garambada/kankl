
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from sqlalchemy.orm import Session
from backend.database.session import get_db, engine
from backend.database.models import User, Base
from backend.api.auth import get_password_hash

def create_admin_user():
    # Ensure tables exist (just in case)
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    email = "ankl"
    password = "foundersstudio"
    name = "Ankl Admin"
    role = "admin"
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User '{email}' already exists. Updating password...")
        existing_user.password_hash = get_password_hash(password)
        existing_user.role = role
        db.commit()
        print("User updated successfully.")
        return

    # Create new user
    print(f"Creating user '{email}'...")
    hashed_password = get_password_hash(password)
    
    new_user = User(
        email=email,
        password_hash=hashed_password,
        name=name,
        role=role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"User '{new_user.email}' created successfully with ID {new_user.id}")

if __name__ == "__main__":
    create_admin_user()
