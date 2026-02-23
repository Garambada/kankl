from backend.database.session import get_db
from backend.database.models import Message
from sqlalchemy import desc

db = next(get_db())
last_msg = db.query(Message).filter(Message.role == 'assistant').order_by(desc(Message.created_at)).first()

if last_msg:
    print(f"Message ID: {last_msg.id}")
    print(f"Content: {last_msg.content[:50]}...")
    print(f"Sources: {last_msg.sources}")
    print(f"Sources Type: {type(last_msg.sources)}")
else:
    print("No assistant messages found.")
