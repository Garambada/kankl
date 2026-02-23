from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
import uuid
import time

from backend.database.session import get_db, SessionLocal
from backend.database.models import User, Conversation, Message, Speaker
from backend.api.auth import get_current_user
from backend.services.ai_service import AIService

router = APIRouter()

class ChatRequest(BaseModel):
    speaker_id: int
    conversation_id: Optional[str] = None
    message: str

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    response: str
    sources: list

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Real-time AI Advisory Chat with Persistence"""
    
    # 1. Validate Speaker
    speaker = db.query(Speaker).filter(Speaker.id == request.speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    # 2. Get or Create Conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        conversation = Conversation(
            id=conversation_id,
            user_id=current_user.id,
            speaker_id=speaker.id,
            summary=f"Chat with {speaker.name}"
        )
        db.add(conversation)
        db.commit()
    else:
        # Verify ownership
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # 3. Save User Message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()
    
    # 4. Generate AI Response
    ai_service = AIService()
    response_data = ai_service.generate_response(
        speaker_id=str(request.speaker_id),
        user_id=current_user.id,
        message=request.message,
        conversation_id=conversation_id
    )
    
    # 5. Save AI Message
    ai_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=response_data["response"],
        sources=response_data["sources"]
    )
    db.add(ai_msg)
    db.commit()
    
    # 6. Update Conversation Timestamp
    conversation.updated_at = ai_msg.created_at
    db.commit()
    
    return ChatResponse(
        conversation_id=conversation_id,
        message_id=str(ai_msg.id), # DB ID
        response=ai_msg.content,
        sources=ai_msg.sources or []
    )

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Conversation History"""
    conversation = db.query(Conversation).options(
        joinedload(Conversation.messages),
        joinedload(Conversation.speaker)
    ).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return {
        "conversation_id": conversation.id,
        "speaker": {
            "speaker_id": conversation.speaker.id,
            "name": conversation.speaker.name
        },
        "messages": [
            {
                "message_id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "sources": msg.sources,
                "created_at": msg.created_at
            } for msg in conversation.messages
        ],
        "summary": conversation.summary,
        "updated_at": conversation.updated_at
    }

class PreAdvisoryRequest(BaseModel):
    speaker_id: int
    query: str

@router.post("/pre-advisory")
async def create_pre_advisory(request: PreAdvisoryRequest):
    """Create Pre-Advisory Report (Stub)"""
    return {
        "report_id": "rep_001",
        "speaker_id": request.speaker_id,
        "query": request.query,
        "status": "processing",
        "estimated_completion": "2026-02-16T09:50:00Z"
    }



# ... (Previous ChatRequest, ChatResponse, etc.)

class DebateRequest(BaseModel):
    topic: str
    speaker_id_1: int
    speaker_id_2: int

import asyncio
from concurrent.futures import ThreadPoolExecutor

async def run_debate_process(conversation_id: str, topic: str, speaker_id_1: int, speaker_id_2: int, user_id: int):
    """
    Background task to generate debate turns and save to DB.
    Optimized "Symposium" Mode: Parallel Statements -> Synthesis
    """
    print(f"[Debate] Starting background process for {conversation_id}")
    db = SessionLocal()
    
    # Verify DB connection and Task Start
    try:
        start_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=f"**[System]** 'Parallel Symposium' mode initiated for topic: *{topic}*.\nAsking both experts for their position statements simultaneously...",
            sources=[]
        )
        db.add(start_msg)
        db.commit()
    except Exception as e:
        print(f"[Debate] Critical DB Error: {e}")
        return

    ai_service = AIService()
    
    try:
        # Define prompts
        prompt_1 = f"Topic: {topic}\n\nPlease provide your core perspective on this topic based on your philosophy. **Keep it concise (max 3 bullets)**."
        prompt_2 = f"Topic: {topic}\n\nPlease provide your core perspective on this topic based on your philosophy. **Keep it concise (max 3 bullets)**."

        # Helper for blocking calls
        def generate_sync(s_id, prompt):
            try:
                return ai_service.generate_response(str(s_id), user_id, prompt, conversation_id)
            except Exception as e:
                print(f"Gen Error {s_id}: {e}")
                return {"response": f"(Error generating response for Speaker {s_id})"}

        # 1. Parallel Execution
        loop = asyncio.get_event_loop()
        print(f"[Debate] Requesting parallel statements...")
        
        future1 = loop.run_in_executor(None, generate_sync, speaker_id_1, prompt_1)
        future2 = loop.run_in_executor(None, generate_sync, speaker_id_2, prompt_2)
        
        resp_1, resp_2 = await asyncio.gather(future1, future2)
        
        content_1 = resp_1['response']
        content_2 = resp_2['response']
        
        # Save Statements (in order of ID usually, or just 1 then 2)
        msg_1 = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=f"**[Position A]**\n{content_1}",
            sources=[]
        )
        db.add(msg_1)
        
        msg_2 = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=f"**[Position B]**\n{content_2}",
            sources=[]
        )
        db.add(msg_2)
        db.commit()
        
        # 2. Immediate Synthesis (Moderator)
        print(f"[Debate] Synthesizing results...")
        prompt_mod = f"""
        Review the two expert positions on '{topic}':
        
        [Expert A]: {content_1}
        [Expert B]: {content_2}
        
        As a Boardroom Moderator, compare these views and provide a **Strategic Result/Takeaway** for the executive team.
        - Common ground?
        - Key conflict?
        - Actionable advice?
        Keep it brief.
        """
        
        # Use Speaker 2 (or a neutral persona if ID 0 existed) as Mod
        # We'll just use Speaker 2 for now, or maybe Speaker 1. Let's use Speaker 1 to balance.
        resp_mod = await loop.run_in_executor(None, generate_sync, speaker_id_1, prompt_mod)
        content_mod = resp_mod['response']

        msg_mod = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=f"**[Strategic Conclusion]**\n{content_mod}",
            sources=[]
        )
        db.add(msg_mod)
        db.commit()
        
        print(f"[Debate] Completed process for {conversation_id}")

    except Exception as e:
        print(f"[Debate] General Error: {e}")
        try:
             err_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content="**[System]** The session was interrupted.",
                sources=[]
            )
             db.add(err_msg)
             db.commit()
        except:
            pass
    finally:
        db.close()

@router.post("/round-table")
async def start_round_table(
    request: DebateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an AI Round Table Debate (Async)"""
    
    # 0. Validate Speakers & Seed if missing (for robustness)
    sp1 = db.query(Speaker).filter(Speaker.id == request.speaker_id_1).first()
    if not sp1 and request.speaker_id_1 == 1:
        # Seed Park Taewung
        sp1 = Speaker(
            id=1, 
            name="박태웅", 
            expertise="거대언어모델, AI 주권", 
            bio="한빛미디어 의장. 기술의 본질을 꿰뚫는 통찰력을 가진 비평가.",
            persona_model={"tone": "insightful", "style": "critical"}
        )
        db.add(sp1)
        db.commit()
        db.refresh(sp1)

    sp2 = db.query(Speaker).filter(Speaker.id == request.speaker_id_2).first()
    if not sp2 and request.speaker_id_2 == 3:
        # Seed Han Sang-gi
        sp2 = Speaker(
            id=3, 
            name="한상기", 
            expertise="AI 윤리, 소버린 AI", 
            bio="테크프론티어 대표. AI 안전과 신뢰성, 그리고 기술의 사회적 영향력을 연구.",
            persona_model={"tone": "analytical", "style": "warning"}
        )
        db.add(sp2)
        db.commit()
        db.refresh(sp2)
    
    # Reload validation
    if not sp1:
        sp1 = db.query(Speaker).filter(Speaker.id == request.speaker_id_1).first()
    if not sp2:
        sp2 = db.query(Speaker).filter(Speaker.id == request.speaker_id_2).first()

    if not sp1 or not sp2:
        raise HTTPException(status_code=404, detail="One or more speakers not found.")

    try:
        # 1. Create Conversation immediately
        conversation_id = str(uuid.uuid4())
        conversation = Conversation(
            id=conversation_id,
            user_id=current_user.id,
            speaker_id=request.speaker_id_1, # Assign to primary speaker for ownership
            summary=f"Debate: {request.topic}"
        )
        db.add(conversation)
        db.commit()
        
        # 2. Trigger Background Task
        background_tasks.add_task(
            run_debate_process,
            conversation_id,
            request.topic,
            request.speaker_id_1,
            request.speaker_id_2,
            current_user.id
        )
        
        return {
            "topic": request.topic,
            "conversation_id": conversation_id,
            "participants": [request.speaker_id_1, request.speaker_id_2],
            "status": "started"
        }
    except Exception as e:
        print(f"Error starting debate: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
