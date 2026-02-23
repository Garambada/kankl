from backend.database.session import SessionLocal
from backend.database.models import Conversation, Message

db = SessionLocal()
conversations = db.query(Conversation).order_by(Conversation.created_at.desc()).limit(5).all()

print(f"Found {len(conversations)} recent conversations:")
for c in conversations:
    print(f"\nID: {c.id} | Summary: {c.summary} | Created: {c.created_at}")
    msgs = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at).all()
    print(f"Message Count: {len(msgs)}")
    for m in msgs:
        content_preview = m.content[:50].replace('\n', ' ')
        print(f" - [{m.role}] {content_preview}...")
db.close()
