
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from sqlalchemy.orm import Session
from backend.database.session import get_db, engine
from backend.database.models import Speaker

def check_speakers():
    db = next(get_db())
    speakers = db.query(Speaker).all()
    
    print(f"Found {len(speakers)} speakers.")
    for s in speakers:
        print(f"- [{s.id}] {s.name} ({s.expertise})")

if __name__ == "__main__":
    check_speakers()
