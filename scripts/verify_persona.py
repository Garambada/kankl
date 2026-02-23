
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_engine.rag.generator import IDRAGGenerator

def test_persona():
    generator = IDRAGGenerator()
    
    query = "AGI가 도래하면 인류에게 어떤 위험이 있습니까? 우리는 어떻게 대비해야 합니까?"
    
    context = [
        {"content": "AGI는 인간의 지능을 초월하는 강력한 도구이지만, 잘못된 목표를 설정하면 돌이킬 수 없는 재앙이 될 수 있다."},
        {"content": "한상기 박사는 '얼라인먼트' 문제의 중요성을 강조하며, AI가 인간의 가치에 부합하도록 만드는 것이 기술 개발보다 우선되어야 한다고 말했다."}
    ]
    
    print(f"Query: {query}")
    print("-" * 50)
    
    response = generator.generate_response(query, context, "한상기")
    
    print("Response from Han Sanggi:")
    print(response)
    print("-" * 50)
    
    # Simple check for persona traits
    traits = ["얼라인먼트", "통제", "가치", "소버린"]
    found_traits = [t for t in traits if t in response]
    print(f"Found Persona Traits: {found_traits}")

if __name__ == "__main__":
    test_persona()
