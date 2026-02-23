import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.services.briefing_service import BriefingService

async def test_search():
    service = BriefingService()
    if service.search_tool:
        print("Invoking DuckDuckGo Search...")
        try:
            results = service.search_tool.invoke("latest AI trends 2024")
            print("Search Results:")
            print(results)
            print("-" * 50)
            print("Test SUCCESS")
        except Exception as e:
            print(f"Search failed: {e}")
    else:
        print("Search tool not initialized")

if __name__ == "__main__":
    asyncio.run(test_search())
