
from typing import Dict, List
from langchain_upstage import ChatUpstage
from langchain.prompts import ChatPromptTemplate
from datetime import datetime

class BriefingAgent:
    def __init__(self):
        self.llm = ChatUpstage(model="solar-pro3", temperature=0.5)

    def fetch_news(self) -> List[Dict]:
        """Fetch news from external sources (Mock for pilot)"""
        return [
            {
                "title": "OpenAI, GPT-5 출시 발표",
                "content": "OpenAI가 차세대 AI 모델 GPT-5를 공개했습니다. 추론 능력이 대폭 향상되었으며...",
                "source": "TechCrunch",
                "date": datetime.now().isoformat()
            },
            {
                "title": "EU AI 법안 통과",
                "content": "유럽연합 의회가 세계 최초의 포괄적 AI 규제 법안을 통과시켰습니다...",
                "source": "Reuters",
                "date": datetime.now().isoformat()
            }
        ]

    def generate_briefing(self, executive_profile: Dict) -> Dict:
        """Generate daily briefing based on ECIF framework"""
        news_items = self.fetch_news()
        
        # In a real system, we would filter news based on executive_profile['interests']
        
        # Analyze with LLM for ECIF
        briefing_content = []
        for news in news_items:
            analysis = self._analyze_news(news, executive_profile)
            briefing_content.append(analysis)
            
        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "executive_summary": [
                {"title": item["title"], "impact": item["impact"], "urgency": "high"} 
                for item in briefing_content
            ],
            "top_news": briefing_content,
            # ... other fields
        }

    def _analyze_news(self, news: Dict, profile: Dict) -> Dict:
        """Analyze a single news item using ECIF"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Analyze the following news for an executive summary using the ECIF framework.
            Focus on 'So What' (Impact) and 'Now What' (Action).
            Executive Industry: {industry}
            """),
            ("user", "News: {news_content}")
        ])
        
        chain = prompt | self.llm
        
        # For pilot, we return a structured mock based on the 'news' input
        # Real implementation would parse the LLM output into JSON
        return {
            "news_id": "news_" + str(hash(news['title'])),
            "title": news['title'],
            "source": news['source'],
            "published_at": news['date'],
            "what": news['content'][:100] + "...",
            "so_what": "산업 전반에 걸친 AI 도입 가속화가 예상됩니다.",
            "now_what": "내부 AI 전략 점검 및 규제 대응 팀 구성이 필요합니다.",
            "expert_view": {
                "expert_name": "박태웅",
                "comment": "변화의 속도가 빠릅니다. 본질에 집중해야 할 때입니다."
            },
            "relevance_score": 0.95,
            "impact": "규제 리스크 증가 및 기술 격차 확대 우려"
        }
