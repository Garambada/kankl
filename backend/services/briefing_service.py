from datetime import date, datetime
from typing import List, Dict
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_upstage import ChatUpstage
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchResults

from ai_engine.rag.retriever import HybridRetriever
from backend.schemas.briefing import BriefingResponse, BriefingItem, NewsItem, WatchListItem, RecommendationItem

class BriefingService:
    def __init__(self):
        self.retriever = HybridRetriever()
        self.llm = ChatUpstage(model="solar-pro3", temperature=0.7)
        # k=3 for top 3 results
        try:
            self.search_tool = DuckDuckGoSearchResults(max_results=3)
        except Exception as e:
            print(f"Warning: DuckDuckGo Search not available: {e}")
            self.search_tool = None

    async def generate_briefing(self) -> BriefingResponse:
        # 0. Fetch Keywords
        from backend.database.session import SessionLocal
        from backend.database.models import Keyword
        
        db = SessionLocal()
        keywords = db.query(Keyword).filter(Keyword.is_active == True).all()
        valuable_keywords = [k.word for k in keywords]
        db.close()

        # 1. Fetch Real-time Web News
        print("Fetching web news via DuckDuckGo...")
        base_query = "latest strategic trends AI power energy Korea"
        if valuable_keywords:
            # Append user keywords to query
            custom_terms = " ".join(valuable_keywords)
            web_query = f"latest strategic trends {custom_terms}"
        else:
            web_query = base_query
            
        print(f"Web Query: {web_query}")
        
        web_results = "Web search unavailable."
        if self.search_tool:
            try:
                # DuckDuckGo returns results as a string or list depending on implementation
                # Usually it returns a string of results
                results = self.search_tool.invoke(web_query)
                web_results = results
            except Exception as e:
                print(f"Web search failed: {e}")
                web_results = "Web search failed during execution."

        # 2. Retrieve Internal Context
        query = "Strategic risks, compliance requirements, and future trends in power systems and AI"
        
        try:
            retrieved_docs = self.retriever.vector_search(query, top_k=5)
        except Exception as e:
            print(f"Vector search failed: {e}")
            retrieved_docs = []
        
        vector_context = "\n\n".join([doc['content'] for doc in retrieved_docs])
        
        # Combine Contexts
        context_text = f"""
        [Real-time Web News]
        {web_results}
        
        [Internal Knowledge Base]
        {vector_context}
        """

        if not context_text.strip():
            print("No context available for briefing. Returning fallback.")
            return self._get_fallback_briefing()

        # 2. Generate Structured Briefing using LLM
        parser = JsonOutputParser(pydantic_object=BriefingResponse)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an elite Executive AI Assistant for a Boardroom.
            Your task is to generate a "Daily Intelligence Briefing" based on the provided [Context].
            
            CRITICAL: All content (titles, summaries, insights, recommendations) MUST be written in KOREAN (한국어).
            
            The briefing must be structured EXACTLY as the following JSON format:
            {{
                "date": "YYYY-MM-DD",
                "executive_summary": [
                    {{
                        "title": "string (Korean)", 
                        "impact": "string (Korean)", 
                        "urgency": "high" | "medium" | "low",
                        "what": "string (Korean) - Detailed explanation",
                        "so_what": "string (Korean) - Strategic implication",
                        "now_what": "string (Korean) - Recommended action"
                    }}
                ],
                "top_news": [
                    {{
                        "news_id": "string",
                        "title": "string (Korean)", 
                        "source": "Internal Knowledge Base",
                        "published_at": "ISO string",
                        "what": "string (Korean)",
                        "so_what": "string (Korean)", 
                        "now_what": "string (Korean)",
                        "expert_view": {{ "expert_name": "Park Taewung", "comment": "string (Korean)" }},
                        "relevance_score": float
                    }}
                ],
                "watch_list": [
                    {{"title": "string (Korean)", "summary": "string (Korean)"}}
                ],
                "recommendations": [
                    {{"type": "string", "title": "string (Korean)", "date": "string", "url": "string"}}
                ]
            }}

            Rules:
            1. Language: KOREAN (한국어) for all text fields.
            2. Use the [Context] content to populate the "top_news" and "executive_summary". 
            3. "what", "so_what", "now_what" framework is CRITICAL.
               - What (핵심 내용): What does the document say?
               - So What (시사점): Why does it matter to the executive?
               - Now What (대응 방안): What should they do next?
            4. If context is limited, infer strategic implications based on the available text.
            5. Keep the tone professional, concise, and insightful (Executive Summaries).
            """),
            ("user", """
            [Context]
            {context}
            
            Current Date: {date}
            
            Generate the Daily Briefing JSON in KOREAN.
            """)
        ])

        chain = prompt | self.llm | parser

        try:
            result = chain.invoke({
                "context": context_text,
                "date": date.today().isoformat()
            })
            
            for news in result.get("top_news", []):
                news["published_at"] = datetime.now()
            
            return BriefingResponse(**result)
            
        except Exception as e:
            print(f"Briefing Generation Failed: {e}")
            return self._get_fallback_briefing()

    def _get_fallback_briefing(self):
        return BriefingResponse(
            date=date.today(),
            executive_summary=[
                BriefingItem(title="System Update", impact="AI Service Unavailable", urgency="medium")
            ],
            top_news=[],
            watch_list=[],
            recommendations=[]
        )
