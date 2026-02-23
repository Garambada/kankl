
from typing import List, Dict, Any
from ai_engine.database.connector import get_qdrant_client, get_neo4j_driver
from langchain_upstage import UpstageEmbeddings

class HybridRetriever:
    def __init__(self):
        try:
            self.qdrant = get_qdrant_client()
            self.qdrant_available = True
        except Exception as e:
            print(f"Warning: Qdrant not available: {e}")
            self.qdrant = None
            self.qdrant_available = False

        try:
            self.neo4j = get_neo4j_driver()
            self.neo4j_available = True
        except Exception as e:
            print(f"Warning: Neo4j not available: {e}")
            self.neo4j = None
            self.neo4j_available = False

        # solar-embedding-1-large
        self.embeddings = UpstageEmbeddings(model="solar-embedding-1-large")
        self.collection_name = "speaker_knowledge"

    def vector_search(self, query: str, top_k: int = 5, speaker_name: str = None) -> List[Dict]:
        """Search in Vector DB (Qdrant)"""
        if not self.qdrant_available:
            print("Vector DB unused (Offline Mode)")
            return []

        try:
            vector = self.embeddings.embed_query(query)
        except Exception as e:
            print(f"Embedding failed: {e}")
            return []
        
        search_params = {"limit": top_k}
        from qdrant_client.http import models
        filter = None
        if speaker_name:
            filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="speaker_name",
                        match=models.MatchValue(value=speaker_name)
                    )
                ]
            )

        results = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=vector,
            query_filter=filter,
            limit=top_k
        )
        
        return [
            {
                "content": hit.payload.get("chunk_text", ""),
                "metadata": hit.payload,
                "score": hit.score,
                "source": "vector"
            }
            for hit in results
        ]

    def graph_search(self, query: str, top_k: int = 5, speaker_name: str = None) -> List[Dict]:
        """Search in Knowledge Graph (Neo4j)"""
        if not self.neo4j_available:
            return []

        # 1. Extract Keywords/Entities using LLM (simple implementation)
        # Ideally, use a smaller model or specific extraction chain
        from langchain_upstage import ChatUpstage
        from langchain_core.prompts import ChatPromptTemplate
        
        try:
            llm = ChatUpstage(model="solar-mini", temperature=0)
            prompt = ChatPromptTemplate.from_messages([
                ("system", "Extract important keywords or entities from the user query for a knowledge graph search. Return only comma-separated keywords."),
                ("user", query)
            ])
            chain = prompt | llm
            response = chain.invoke({})
            keywords = [k.strip() for k in response.content.split(',')]
        except Exception as e:
            print(f"Entity extraction failed: {e}")
            keywords = [query] # Fallback to using the whole query

        # 2. Construct Cypher Query
        # Search for nodes with names matching keywords
        cypher_query = """
        MATCH (c:Concept)
        WHERE any(keyword IN $keywords WHERE c.name CONTAINS keyword)
        RETURN c.name as name, c.definition as definition
        LIMIT $limit
        """
        
        results = []
        try:
            with self.neo4j.session() as session:
                graph_data = session.run(cypher_query, keywords=keywords, limit=top_k)
                for record in graph_data:
                    results.append({
                        "content": f"{record['name']}: {record['definition']}",
                        "metadata": {"source": "graph", "name": record['name']},
                        "score": 1.0, # Default score for graph match
                        "source": "graph"
                    })
        except Exception as e:
            print(f"Graph search failed: {e}")
            
        return results

    def hybrid_search(self, query: str, top_k: int = 5, speaker_name: str = None) -> List[Dict]:
        """Combine Vector and Graph Search using RRF"""
        # 1. Get results from both sources
        vector_results = self.vector_search(query, top_k, speaker_name)
        graph_results = self.graph_search(query, top_k, speaker_name)
        
        # 2. RRF (Reciprocal Rank Fusion)
        k = 60 # Constant for RRF
        scores = {}
        
        # Process Vector Results
        for rank, doc in enumerate(vector_results):
            content = doc['content']
            if content not in scores:
                scores[content] = {"doc": doc, "score": 0}
            scores[content]["score"] += 1.0 / (k + rank + 1)
            
        # Process Graph Results
        for rank, doc in enumerate(graph_results):
            content = doc['content']
            if content not in scores:
                scores[content] = {"doc": doc, "score": 0}
            scores[content]["score"] += 1.0 / (k + rank + 1)
            
        # 3. Sort by combined score
        combined_results = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
        top_results = [item["doc"] for item in combined_results[:top_k]]
        
        # 4. Rerank (Optional but recommended for Advanced RAG)
        return self.rerank(query, top_results)

    def rerank(self, query: str, results: List[Dict]) -> List[Dict]:
        """Rerank results using Solar LLM as a judge"""
        if not results:
            return []
            
        from langchain_upstage import ChatUpstage
        from langchain_core.prompts import ChatPromptTemplate
        
        try:
            # Use solar-mini for speed in reranking
            llm = ChatUpstage(model="solar-mini", temperature=0)
            
            candidates = "\n\n".join([f"[{i}] {doc['content'][:200]}..." for i, doc in enumerate(results)])
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a relevance judge. Given a query and a list of document snippets, selects the indices of the documents that are most relevant to the query.
                Return only the indices (0-indexed) of the relevant documents in order of relevance, separated by commas.
                If none are relevant, return nothing."""),
                ("user", f"Query: {query}\n\nDocuments:\n{candidates}")
            ])
            
            chain = prompt | llm
            response = chain.invoke({})
            
            try:
                indices = [int(idx.strip()) for idx in response.content.split(',') if idx.strip().isdigit()]
                reranked_results = [results[i] for i in indices if i < len(results)]
                
                # Append any missing docs at the end (or discard if strict)
                # For now, let's keep only what LLM selected to reduce noise
                if not reranked_results:
                     return results # Fallback if LLM returns nothing
                     
                return reranked_results
            except ValueError:
                return results # Fallback on parsing error
                
        except Exception as e:
            print(f"Reranking failed: {e}")
            return results
