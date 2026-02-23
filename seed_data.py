from backend.database.session import engine, SessionLocal, Base
from backend.database.models import User, Speaker, Keyword
from backend.api.auth import get_password_hash
from sqlalchemy.orm import Session

def seed():
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Seed Admin User
        admin_email = "ankl@boardroom.club"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            print(f"Seeding admin user: {admin_email}")
            new_user = User(
                email=admin_email,
                password_hash=get_password_hash("boardroom123"),
                name="Advisory Board Administrator",
                role="admin"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            admin_id = new_user.id
        else:
            print(f"Admin user already exists: {admin_email}")
            admin_id = admin_user.id

        # 2. Seed Speakers
        speakers_data = [
            {"name": "Park Taewung", "bio": "Chairman, Hanbit Media", "expertise": "AI Literacy, Tech Humanities", 
             "persona_model": {"traits": ["analytical", "visionary"], "voice": "academic yet accessible"}},
            {"name": "Han Sanggi", "bio": "Principal, TechFrontier", "expertise": "Global ICT Trends",
             "persona_model": {"traits": ["pragmatic", "detailed"], "voice": "strategic expert"}},
            {"name": "Yoon Daegyun", "bio": "Professor, Ajou Univ", "expertise": "Tech Management",
             "persona_model": {"traits": ["critical", "constructive"], "voice": "balanced mentor"}}
        ]
        
        for s_data in speakers_data:
            existing = db.query(Speaker).filter(Speaker.name == s_data["name"]).first()
            if not existing:
                spk = Speaker(**s_data)
                db.add(spk)
                print(f"Seeded speaker: {spk.name}")
            else:
                print(f"Speaker exists: {existing.name}")

        # 3. Seed some initial keywords for the admin
        keywords = ["AI power", "green energy", "semiconductor", "strategic risk"]
        for word in keywords:
            existing_kw = db.query(Keyword).filter(Keyword.user_id == admin_id, Keyword.word == word).first()
            if not existing_kw:
                kw = Keyword(user_id=admin_id, word=word, category="topic")
                db.add(kw)
                print(f"Seeded keyword: {word}")

        db.commit()
        print("Seeding completed successfully!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
