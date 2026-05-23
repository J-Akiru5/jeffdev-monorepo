"""KPI dashboard analytics route."""

from datetime import date
from fastapi import APIRouter, Query

from services.supabase import fetch_quotes, fetch_invoices, fetch_projects
from services.analytics import compute_kpi_summary
from models.schemas import KpiSummaryResponse

router = APIRouter(prefix="/api/v1/kpi", tags=["kpi"])


@router.get("/summary", response_model=KpiSummaryResponse)
def get_kpi_summary(
    start: date,
    end: date,
    period: str = Query("monthly", pattern="^(monthly|weekly)$"),
):
    """KPI summary across quotes, invoices, and projects."""
    quotes = fetch_quotes(start.isoformat(), end.isoformat())
    invoices = fetch_invoices(start.isoformat(), end.isoformat())
    projects = fetch_projects()
    return compute_kpi_summary(quotes, invoices, projects, period)
