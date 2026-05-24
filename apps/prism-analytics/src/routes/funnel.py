"""Conversion funnel analytics route."""

from datetime import date
from fastapi import APIRouter

from services.supabase import fetch_quotes
from services.analytics import compute_funnel
from models.schemas import FunnelResponse

router = APIRouter(prefix="/api/v1/funnel", tags=["funnel"])


@router.get("/stages", response_model=FunnelResponse)
def get_funnel_stages(start: date, end: date):
    """Conversion funnel stages: draft → sent → accepted → paid."""
    quotes = fetch_quotes(start.isoformat(), end.isoformat())
    return compute_funnel(quotes)
