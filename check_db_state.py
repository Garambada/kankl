from backend.database.session import get_db, engine, Base
from backend.database.models import User, Speaker
from sqlalchemy.orm import Session

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = next(get_db())

print("--- Users ---")
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, Name: {u.name}")

print("\n--- Speakers ---")
speakers_data = [
    {"name": "Park Taewung", "bio": "Chairman, Hanbit Media", "expertise": "AI Literacy, Tech Humanities"},
    {"name": "Han Sanggi", "bio": "Principal, TechFrontier", "expertise": "Global ICT Trends"},
    {"name": "Yoon Daegyun", "bio": "Professor, Ajou Univ", "expertise": "Tech Management"}
]

print("\n--- Checking/Seeding Speakers ---")
for s_data in speakers_data:
    existing = db.query(Speaker).filter(Speaker.name == s_data["name"]).first()
    if not existing:
        spk = Speaker(**s_data)
        db.add(spk)
        print(f"Seeded: {spk.name}")
    else:
        print(f"Exists: {existing.name} (ID: {existing.id})")

db.commit()
