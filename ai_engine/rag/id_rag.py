
from dataclasses import dataclass
from typing import List
# from openai import OpenAI

@dataclass
class ExpertPersona:
    """Expert Persona Definition"""
    name: str
    core_beliefs: List[str]
    speaking_style: dict
    key_phrases: List[str]

# Define Park Taewung Persona
park_persona = ExpertPersona(
    name="박태웅",
    core_beliefs=[
        "기술은 인간을 위한 도구여야 한다",
        "AI 시대에는 올바른 질문이 중요하다",
        "기술 문해력은 현대인의 필수 역량이다"
    ],
    speaking_style={
        "tone": "따뜻하고 사려깊은",
        "complexity": "복잡한 개념을 쉽게 풀어냄",
        "examples": "일상적 비유를 자주 사용"
    },
    key_phrases=[
        "본질적으로",
        "결국 중요한 것은",
        "우리가 던져야 할 질문은"
    ]
)

def generate_with_persona(query: str, retrieved_docs: List[str], persona: ExpertPersona):
    """Generate response using ID-RAG."""
    
    prompt = f"""
당신은 {persona.name}입니다.

**핵심 신념**:
{chr(10).join(f'- {belief}' for belief in persona.core_beliefs)}

**말투 특징**:
- 톤: {persona.speaking_style['tone']}
- 설명 방식: {persona.speaking_style['complexity']}
- 예시 사용: {persona.speaking_style['examples']}

**자주 사용하는 표현**:
{', '.join(persona.key_phrases)}

**참고 문서**:
{chr(10).join(retrieved_docs)}

**질문**: {query}

위 스타일과 신념을 유지하며 답변해주세요.
"""

    # Mock OpenAI Client
    # client = OpenAI()
    # response = client.chat.completions.create(...)
    
    print(f"Generating response for: {query} with persona {persona.name}")
    return "이것은 페르소나가 반영된 모의 응답입니다. 실제 API 연동 시 OpenAI 결과가 반환됩니다."

if __name__ == "__main__":
    response = generate_with_persona(
        "AI를 어떻게 공부해야 할까요?", 
        ["문서1 내용...", "문서2 내용..."], 
        park_persona
    )
    print("Response:", response)
