from fastapi import APIRouter
from datetime import date, datetime
from typing import List, Optional

from backend.schemas.briefing import BriefingResponse, BriefingItem, NewsItem, WatchListItem, RecommendationItem

router = APIRouter()

from backend.services.briefing_service import BriefingService

# Singleton instance or Depends could be used
briefing_service = BriefingService()

@router.get("/today", response_model=BriefingResponse)
async def get_today_briefing():
    """Get Daily Briefing for the Executive"""
    return await briefing_service.generate_briefing()

@router.get("", response_model=List[BriefingResponse])
async def get_briefing_history(start_date: date, end_date: date):
    """Get Briefing History"""
    return []
