import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from ai_engine.rag.generator import IDRAGGenerator

def test_chat():
    print("Initializing IDRAGGenerator with solar-pro3...")
    try:
        generator = IDRAGGenerator()
        print("Generator initialized.")
        
        query = "양자 AI가 전력망에 미치는 영향은?"
        context = [
            {"content": "양자 컴퓨터는 최적화 문제를 해결하는 데 탁월하며, 2030년경 상용화될 전망이다."}
        ]
        speaker = "박태웅"
        
        print(f"Generating response for: {query}")
        response = generator.generate_response(query, context, speaker)
        print("\n[Response]")
        print(response)
        print("\nTest Passed!")
        
    except Exception as e:
        print(f"\nTest Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_chat()
