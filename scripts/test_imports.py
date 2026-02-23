import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("Testing imports...")
    from backend.database.session import SessionLocal
    print(" - backend.database.session: OK")
    from backend.api import advisory
    print(" - backend.api.advisory: OK")
    from backend.services.ai_service import AIService
    print(" - backend.services.ai_service: OK")
    from ai_engine.agents.orchestrator import app
    print(" - ai_engine.agents.orchestrator: OK")
    print("All imports successful.")
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)
