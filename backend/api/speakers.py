
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from backend.database.session import get_db
from backend.database.models import Speaker, Conversation, Booking

# ... (rest of imports)

# ... (inside cleanup_speakers)



router = APIRouter()

class SpeakerResponse(BaseModel):
    id: int
    name: str
    title: str = "Expert"
    expertise: str
    image: str = "https://via.placeholder.com/150"

    class Config:
        from_attributes = True

@router.get("/", response_model=List[SpeakerResponse])
def list_speakers(db: Session = Depends(get_db)):
    speakers = db.query(Speaker).all()
    
    if not speakers:
        # Auto-seed if empty
        sp1 = Speaker(
            id=1, 
            name="Park Taewung", 
            expertise="Technology Strategy, AI Insight", 
            bio="Chairman of Hansbit Media. A critical thinker deeply understanding the nature of technology.",
            persona_model={"tone": "insightful", "style": "critical"}
        )
        sp2 = Speaker(
            id=3, 
            name="Han Sang-gi", 
            expertise="AI Ethics, Tech Policy", 
            bio="Tech Frontier Leader. Focuses on AI safety, alignment, and sovereign AI.",
            persona_model={"tone": "analytical", "style": "warning"}
        )
        db.add(sp1)
        db.add(sp2)
        db.commit()
        speakers = [sp1, sp2]

    return speakers

@router.post("/cleanup")
def cleanup_speakers(db: Session = Depends(get_db)):
    """
    Merge duplicates and standardize names to Korean.
    target: ID 1 -> 박태웅, ID 3 -> 한상기
    """
    # 1. Park Taewung / 박태웅
    parks = db.query(Speaker).filter(Speaker.name.in_(["Park Taewung", "박태웅"])).all()
    park_target = db.query(Speaker).filter(Speaker.id == 1).first()
    
    if not park_target and parks:
        # If ID 1 doesn't exist but we have parks, promote one
        park_target = parks[0]
        park_target.id = 1 # Force ID (might fail if distinct object exists, handle carefully)
        # Actually safer to create new or update existing
    
    if not park_target:
        # Create if missing entirely
        park_target = Speaker(id=1, name="박태웅", expertise="거대언어모델, AI 주권", bio="한빛미디어 의장. 기술의 본질을 꿰뚫는 통찰력을 가진 비평가.", persona_model={"tone": "insightful", "style": "critical"})
        db.add(park_target)
    
    park_target.name = "박태웅"
    park_target.expertise = "거대언어모델, AI 주권" 
    park_target.bio = "한빛미디어 의장. 기술의 본질을 꿰뚫는 통찰력을 가진 비평가."
    
    # Remove others
    for p in parks:
        if p.id != 1:
            db.delete(p)
            
    # 2. Han Sang-gi / 한상기
    hans = db.query(Speaker).filter(Speaker.name.in_(["Han Sang-gi", "한상기"])).all()
    han_target = db.query(Speaker).filter(Speaker.id == 3).first()
    
    if not han_target:
        han_target = Speaker(id=3, name="한상기", expertise="AI 윤리, 소버린 AI", bio="테크프론티어 대표. AI 안전과 신뢰성, 그리고 기술의 사회적 영향력을 연구.", persona_model={"tone": "analytical", "style": "warning"})
        db.add(han_target)

    han_target.name = "한상기"
    han_target.expertise = "AI 윤리, 소버린 AI"
    # 3. Yoon Daegyun / 윤대균
    yoons = db.query(Speaker).filter(Speaker.name.in_(["Yoon Daegyun", "윤대균"])).all()
    # Check if ID 2 exists specifically
    target_speaker = db.query(Speaker).filter(Speaker.id == 2).first()

    # If ID 2 doesn't exist, we must create it. 
    # We cannot just "rename" an existing one because of FK constraints on the ID.
    if not target_speaker:
        target_speaker = Speaker(
            id=2, 
            name="윤대균", 
            expertise="소프트웨어 플랫폼, 디지털 경제", 
            bio="아주대 소프트웨어학과 교수. IT 트렌드와 플랫폼 경제의 실체를 분석하는 실용주의자.",
            is_active=True,
            persona_model={} # Will update below
        )
        db.add(target_speaker)
        db.commit() # Commit to ensure ID 2 exists for FKs
        db.refresh(target_speaker)

    # Now update metadata
    target_speaker.name = "윤대균"
    target_speaker.expertise = "소프트웨어 플랫폼, 디지털 경제"
    target_speaker.bio = "아주대 소프트웨어학과 교수. IT 트렌드와 플랫폼 경제의 실체를 분석하는 실용주의자."
    
    target_speaker.persona_model = {
        "name": "윤대균",
        "role": "Pragmatic Educator / Tech Economist",
        "core_beliefs": [
            "기술은 경제 안보와 직결된다 (Tech is economic security)",
            "현실적인 비즈니스 모델이 없는 기술은 거품이다 (Tech without business model is a bubble)",
            "소프트웨어 교육은 문제 해결 능력이 핵심이다 (SW education is about problem solving)"
        ],
        "speaking_style": {
            "tone": "차분하고 설명적인, 교육자적인 (Calm, Explanatory, Educational)",
            "complexity": "대중이 이해하기 쉽게 풀어서 설명함 (Accessible to public)",
            "rhetoric": "구체적인 기업 사례와 경제적 파급 효과를 예시로 듦 (Case studies & Economic impact)"
        },
        "key_phrases": [
            "비즈니스 관점에서 보면 (From a business perspective)", 
            "경제 안보 (Economic Security)", 
            "실질적인 가치 (Practical Value)",
            "우리가 주목해야 할 점은 (What we should focus on is)"
        ],
        "example_outputs": [
            "Q: 특정 플랫폼 매각설에 대한 견해는? -> A: 비즈니스적으로는 거래가 가능할지 몰라도, 경제 안보 측면에서는 신중해야 합니다. 데이터 주권이 걸린 문제입니다.",
            "Q: 개발자 취업난, 어떻게 보나? -> A: 단순 코더의 시대는 갔습니다. 이제는 아키텍처를 이해하고 비즈니스 문제를 해결할 수 있는 '진짜 개발자'가 되어야 합니다."
        ]
    }

    # Reassign and Delete Duplicates
    for y in yoons:
        if y.id != 2:
            print(f"Merging speaker {y.id} into 2...")
            # Reassign dependencies
            db.query(Conversation).filter(Conversation.speaker_id == y.id).update({Conversation.speaker_id: 2}, synchronize_session=False)
            db.query(Booking).filter(Booking.speaker_id == y.id).update({Booking.speaker_id: 2}, synchronize_session=False)
            db.commit()
            
            db.delete(y)

    db.commit()
    return {"status": "cleaned", "details": "Merged duplicates for Park, Han, and Yoon."}

    # Remove duplicates
    for y in yoons:
        if y.id != 2:
            # Reassign dependencies
            db.query(Conversation).filter(Conversation.speaker_id == y.id).update({"speaker_id": 2})
            db.query(Booking).filter(Booking.speaker_id == y.id).update({"speaker_id": 2})
            db.commit()
            
            db.delete(y)

    db.commit()
    return {"status": "cleaned", "details": "Merged duplicates for Park, Han, and Yoon."}
