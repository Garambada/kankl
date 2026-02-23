import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ai_engine.rag.retriever import HybridRetriever
from dotenv import load_dotenv

load_dotenv()

def test_retrieval():
    print("Initializing HybridRetriever...")
    retriever = HybridRetriever()
    
    query = "AI Literacy의 중요성"
    
    print("\n--- Testing Vector Search (Baseline) ---")
    vector_results = retriever.vector_search(query, top_k=3)
    for i, res in enumerate(vector_results):
        print(f"[{i+1}] {res['content'][:100]}... (Score: {res.get('score', 0):.4f})")
        
    print("\n--- Testing Graph Search (New) ---")
    graph_results = retriever.graph_search(query, top_k=3)
    for i, res in enumerate(graph_results):
        print(f"[{i+1}] {res['content'][:100]}... (Source: {res['metadata'].get('source')})")

    print("\n--- Testing Hybrid Search + Rerank (Advanced) ---")
    hybrid_results = retriever.hybrid_search(query, top_k=3)
    for i, res in enumerate(hybrid_results):
        print(f"[{i+1}] {res['content'][:100]}... (Source: {res.get('source', 'unknown')})")

if __name__ == "__main__":
    test_retrieval()
