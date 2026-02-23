from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime

class BriefingItem(BaseModel):
    title: str
    impact: str
    urgency: str # "high", "medium", "low"
    what: Optional[str] = None
    so_what: Optional[str] = None
    now_what: Optional[str] = None
    expert_view: Optional[Dict[str, str]] = None

class NewsItem(BaseModel):
    news_id: str
    title: str
    source: str
    published_at: datetime
    what: str
    so_what: str
    now_what: str
    expert_view: Dict[str, str] = {}
    relevance_score: float

class RecommendationItem(BaseModel):
    type: str
    title: str
    date: str
    url: str

class WatchListItem(BaseModel):
    title: str
    summary: str

class BriefingResponse(BaseModel):
    date: date
    executive_summary: List[BriefingItem]
    top_news: List[NewsItem]
    watch_list: List[WatchListItem]
    recommendations: List[RecommendationItem]
