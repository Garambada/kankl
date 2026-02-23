
from typing import TypedDict, Dict, Annotated
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import operator

from ai_engine.rag.retriever import HybridRetriever
from ai_engine.rag.generator import IDRAGGenerator

class AgentState(TypedDict):
    """Agent State Definition"""
    messages: Annotated[list[BaseMessage], operator.add]
    user_query: str
    intent: str
    context: Dict
    speaker_id: str
    response: str
    sources: list # List of retrieved documents
    next_agent: str

# Initialize Components
retriever = HybridRetriever()
generator = IDRAGGenerator()

def concierge_agent(state: AgentState) -> Dict:
    """Concierge Agent: Routes based on intent"""
    query = state['user_query']
    print(f"[Concierge] Analyzing: {query}")
    
    # Simple routing logic (can be replaced with LLM router)
    if "예약" in query or "일정" in query:
        return {"intent": "booking", "next_agent": "operations"}
    else:
        return {"intent": "advisory", "next_agent": "intelligence"}

def operations_agent(state: AgentState) -> Dict:
    """Operations Agent: Mock booking logic"""
    return {"response": "일정 확인 후 예약을 도와드리겠습니다. (Operations Agent)"}

def intelligence_agent(state: AgentState) -> Dict:
    """Intelligence Agent: Real RAG execution"""
    query = state['user_query']
    # 0. Fetch Speaker & Persona
    # Lazy import to avoid circular dep
    from backend.database.session import SessionLocal
    from backend.database.models import Speaker
    
    db = SessionLocal()
    persona_config = {}
    speaker_name = "Expert"
    
    try:
        speaker_id = state.get("speaker_id")
        speaker = db.query(Speaker).filter(Speaker.id == int(speaker_id)).first()
        if speaker:
            speaker_name = speaker.name
            persona_config = speaker.persona_model or {} 
            # Fallback if persona_model is empty but we know the name? 
            # ideally the seeder fixes this.
            if not persona_config:
                 persona_config = {"name": speaker.name}
    except Exception as e:
        print(f"[Intelligence] DB Lookup failed: {e}")
    finally:
        db.close()

    print(f"[Intelligence] RAG for {speaker_name}...")
    
    # 1. Retrieve
    # For pilot without Qdrant/Neo4j running with data, this might return empty or error
    # We'll wrap in try/except or assume mock data if empty for stability
    try:
        retrieved_docs = retriever.hybrid_search(query, top_k=3, speaker_name=speaker_name)
    except Exception as e:
        print(f"Retrieval failed: {e}")
        retrieved_docs = []

    # If no docs found (e.g. empty DB), provide fallback context
    if not retrieved_docs:
        retrieved_docs = [{"content": "현재 지식 베이스에 관련 내용이 없습니다. 일반적인 AI 지식으로 답변합니다.", "metadata": {}}]

    # 2. Generate
    response_text = generator.generate_response(query, retrieved_docs, persona_config)
    
    return {"response": response_text, "sources": retrieved_docs}

def create_workflow():
    workflow = StateGraph(AgentState)

    workflow.add_node("concierge", concierge_agent)
    workflow.add_node("operations", operations_agent)
    workflow.add_node("intelligence", intelligence_agent)

    workflow.set_entry_point("concierge")

    # Conditional Edges from Concierge
    workflow.add_conditional_edges(
        "concierge",
        lambda x: x['next_agent'],
        {
            "operations": "operations",
            "intelligence": "intelligence"
        }
    )

    workflow.add_edge("operations", END)
    workflow.add_edge("intelligence", END)

    return workflow.compile()

# Global App Instance
app = create_workflow()
