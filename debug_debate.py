import asyncio
import sys
import os

# Setup path
sys.path.append(os.getcwd())

from backend.database.session import SessionLocal
from backend.database.models import Speaker, Conversation, Message, User
from backend.api.advisory import run_debate_process
from backend.services.ai_service import AIService

# Mock Data
TOPIC = "AI Safety vs Innovation"
SP1_ID = 1
SP2_ID = 3
USER_ID = 1

async def debug_debate():
    print(f"--- Starting Debug Debate on '{TOPIC}' ---")
    
    db = SessionLocal()
    try:
        # Create dummy conversation
        import uuid
        conv_id = str(uuid.uuid4())
        print(f"Created Conversation ID: {conv_id}")
        
        conv = Conversation(
            id=conv_id,
            user_id=USER_ID,
            speaker_id=SP1_ID,
            summary=f"Debug Debate: {TOPIC}"
        )
        db.add(conv)
        db.commit()
        
        print("Triggering run_debate_process...")
        await run_debate_process(conv_id, TOPIC, SP1_ID, SP2_ID, USER_ID)
        
        print("--- Process Finished. Checking Messages ---")
        msgs = db.query(Message).filter(Message.conversation_id == conv_id).all()
        print(f"Total Messages: {len(msgs)}")
        for m in msgs:
            print(f"[{m.role}] {m.content[:50]}...")
            
    except Exception as e:
        print(f"!!! CRISITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(debug_debate())
