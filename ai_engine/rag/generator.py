
from typing import List, Dict
from langchain_upstage import ChatUpstage
from langchain.prompts import ChatPromptTemplate
from dataclasses import dataclass
import os

@dataclass
class ExpertPersona:
    name: str
    core_beliefs: List[str]
    speaking_style: Dict[str, str]
    key_phrases: List[str]
    example_outputs: List[str] # New field for Few-Shot

    @property
    def style_description(self) -> str:
        return f"""
        Tone: {self.speaking_style.get('tone', 'professional')}
        Complexity: {self.speaking_style.get('complexity', 'moderate')}
        Key Phrases: {', '.join(self.key_phrases)}
        Core Beliefs: {', '.join(self.core_beliefs)}
        """

class IDRAGGenerator:
    def __init__(self):
        # solar-pro or solar-mini
        self.llm = ChatUpstage(model="solar-pro3", temperature=0.7)

    def get_persona(self, persona_config: Dict) -> ExpertPersona:
        """Factory method to get expert persona from DB config"""
        # Default fallback
        if not persona_config:
            return ExpertPersona(
                name="Expert", 
                core_beliefs=["Providing accurate information"], 
                speaking_style={"tone": "Professional"}, 
                key_phrases=[],
                example_outputs=[]
            )

        return ExpertPersona(
            name=persona_config.get("name", "Expert"),
            core_beliefs=persona_config.get("core_beliefs", []),
            speaking_style=persona_config.get("speaking_style", {}),
            key_phrases=persona_config.get("key_phrases", []),
            example_outputs=persona_config.get("example_outputs", [])
        )

    def generate_response(self, query: str, context: List[Dict], persona_config: Dict) -> str:
        persona = self.get_persona(persona_config)
        
        context_text = "\n\n".join([item['content'] for item in context])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """당신은 대한민국의 대표적인 IT 인사이트 리더, **{expert_name}**입니다.
            제공된 [Context]를 바탕으로, 당신의 독보적인 통찰력을 담아 질문에 답변하십시오.

            ### 페르소나 지침 (반드시 준수)
            1. **Tone & Manner**: {style_description}
            2. **화법**:
               - 단순한 정보 나열을 지양하고, **현상의 이면과 의미**를 해석하십시오.
               - "{key_phrases}" 같은 표현을 적절히 사용하여 당신만의 문체를 살리십시오.
               - 답변의 끝에는 사용자에게 깊은 울림을 주는 질문이나 제언을 덧붙이십시오.
            3. **핵심 가치**:
               - 답변 전반에 다음 신념이 묻어나야 합니다: {core_beliefs}
            
            ### 답변 예시 (Few-Shot Style)
            다음은 당신이 과거에 답변한 스타일입니다. 이 문체와 논리 전개를 모방하십시오:
            {example_outputs}

            ### 답변 작성 규칙
            - **출처 기반**: 반드시 아래 [Context]에 있는 내용에 기반하여 답변하십시오. 
            - **페르소나 유지**: 만약 [Context]에 다른 전문가(예: 박태웅, 한상기 등)의 의견이 포함되어 있다면, 이를 당신의 의견인 것처럼 말하지 마십시오. 당신은 오직 **{expert_name}**의 관점에서만 해석하고 답변해야 합니다.
            - **명확성**: 필요하다면 번호 매기기나 불렛포인트를 사용하여 가독성을 높이십시오.
            """),
            ("user", """
            [Context]
            {context}
            
            [Question]
            {query}
            """)
        ])
        
        chain = prompt | self.llm
        
        response = chain.invoke({
            "expert_name": persona.name,
            "style_description": persona.style_description,
            "key_phrases": ", ".join(persona.key_phrases),
            "core_beliefs": ", ".join(persona.core_beliefs),
            "example_outputs": "\n".join([f"- {ex}" for ex in persona.example_outputs]),
            "context": context_text,
            "query": query
        })
        

        
        return response.content
