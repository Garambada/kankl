from sqlalchemy.orm import Session
from backend.database.session import SessionLocal
from backend.database.models import Speaker, Conversation
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_speakers():
    db: Session = SessionLocal()
    try:
        # 1. Update Speaker 1 (박태웅)
        speaker1 = db.query(Speaker).filter(Speaker.id == 1).first()
        if speaker1:
            speaker1.expertise = "AI Ethics, AI Literacy, Tech Humanities"
            logger.info("Updated Speaker 1 (박태웅) expertise.")
        
        # 2. Handle Speaker 2 (Park Taewung)
        speaker2 = db.query(Speaker).filter(Speaker.id == 2).first()
        if speaker2:
            # Reassign conversations to Speaker 1
            conversations = db.query(Conversation).filter(Conversation.speaker_id == 2).all()
            for conv in conversations:
                conv.speaker_id = 1
            logger.info(f"Reassigned {len(conversations)} conversations from Speaker 2 to Speaker 1.")
            
            # Now delete Speaker 2
            db.delete(speaker2)
            logger.info("Deleted Speaker 2 (Park Taewung).")
            
        # 3. Rename Speaker 3 (Han Sanggi -> 한상기)
        speaker3 = db.query(Speaker).filter(Speaker.id == 3).first()
        if speaker3:
            speaker3.name = "한상기"
            logger.info("Renamed Speaker 3 to 한상기.")
            
        # 4. Rename Speaker 4 (Yoon Daegyun -> 윤대균)
        speaker4 = db.query(Speaker).filter(Speaker.id == 4).first()
        if speaker4:
            speaker4.name = "윤대균"
            logger.info("Renamed Speaker 4 to 윤대균.")
            
        db.commit()
        logger.info("Speaker data standardization complete.")
        
    except Exception as e:
        logger.error(f"Error updating speakers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_speakers()
