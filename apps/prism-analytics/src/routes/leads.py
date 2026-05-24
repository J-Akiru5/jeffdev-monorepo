"""Leads conversion analytics route."""

from datetime import date
from fastapi import APIRouter

from services.supabase import fetch_leads
from services.analytics import compute_conversion_rate
from models.schemas import LeadConversionResponse

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.get("/conversion-rate", response_model=LeadConversionResponse)
def get_conversion_rate(start: date, end: date):
    """Lead conversion rate: quotes → accepted → paid invoices."""
    quotes = fetch_leads(start.isoformat(), end.isoformat())
    return compute_conversion_rate(quotes)
