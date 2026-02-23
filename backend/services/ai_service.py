
import uuid
from ai_engine.agents.orchestrator import app as orchestrator
from langchain_core.messages import HumanMessage

class AIService:
    def generate_response(self, speaker_id: str, user_id: int, message: str, conversation_id: str = None):
        """
        Connects to the AI Engine (RAG/Agents) to generate a response.
        """
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            
        print(f"[AIService] Generating response for Speaker {speaker_id}, User {user_id}: {message}")
        
        # 1. Prepare State for LangGraph
        initial_state = {
            "user_query": message,
            "speaker_id": speaker_id,
            "messages": [HumanMessage(content=message)],
            "context": {"user_id": user_id, "conversation_id": conversation_id},
            "intent": "",
            "response": "",
            "next_agent": ""
        }
        
        # 2. Run Workflow
        try:
            # invoke the orchestrator
            result = orchestrator.invoke(initial_state)
            response_text = result.get("response", "AI 처리 중 오류가 발생했습니다.")
            sources = result.get("sources", [])
        except Exception as e:
            print(f"AI Engine Error: {e}")
            # Fallback for pilot if LLM/DB fails
            response_text = f"죄송합니다. AI 엔진에 연결할 수 없습니다. (Error: {str(e)})"
            sources = []

        return {
            "conversation_id": conversation_id,
            "message_id": str(uuid.uuid4()),
            "response": response_text,
            "sources": sources
        }

    def generate_debate_session(self, topic: str, speaker_id_1: int, speaker_id_2: int):
        """
        Orchestrates a multi-turn debate between two experts.
        """
        print(f"[AIService] Starting Debate on: {topic}")
        
        debate_log = []
        
        # Turn 1: Speaker 1 (Opening)
        prompt_1 = f"Topic: {topic}\n\nPlease provide your core perspective on this topic based on your philosophy."
        response_1 = self.generate_response(str(speaker_id_1), 1, prompt_1) # User ID 1 is system/admin
        debate_log.append({
            "turn": 1,
            "speaker_id": speaker_id_1,
            "content": response_1["response"]
        })
        
        # Turn 2: Speaker 2 (Critique)
        prompt_2 = f"The previous speaker said: \"{response_1['response']}\"\n\nPlease critique this view from your perspective. What are the risks or missing points?"
        response_2 = self.generate_response(str(speaker_id_2), 1, prompt_2)
        debate_log.append({
            "turn": 2,
            "speaker_id": speaker_id_2,
            "content": response_2["response"]
        })
        
        # Turn 3: Speaker 1 (Rebuttal/Synthesis)
        prompt_3 = f"The critic said: \"{response_2['response']}\"\n\nPlease provide a closing rebuttal or synthesis of the discussion."
        response_3 = self.generate_response(str(speaker_id_1), 1, prompt_3)
        debate_log.append({
            "turn": 3,
            "speaker_id": speaker_id_1,
            "content": response_3["response"]
        })
        
        return debate_log
