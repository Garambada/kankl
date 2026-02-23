from backend.database.session import SessionLocal
from backend.database.models import Speaker

def list_speakers():
    db = SessionLocal()
    speakers = db.query(Speaker).all()
    print("-" * 30)
    print(f"{'ID':<5} | {'Name':<20}")
    print("-" * 30)
    for s in speakers:
        print(f"{s.id:<5} | {s.name:<20}")
    print("-" * 30)
    db.close()

if __name__ == "__main__":
    list_speakers()
