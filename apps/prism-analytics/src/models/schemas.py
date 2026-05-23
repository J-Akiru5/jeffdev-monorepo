"""Pydantic models for prism-analytics API responses."""

from datetime import date
from typing import Any
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class LeadConversionResponse(BaseModel):
    total_leads: int
    accepted: int
    paid: int
    conversion_rate: float
    chart_url: str | None = None


class KpiSummaryResponse(BaseModel):
    total_revenue: float
    avg_quote_value: float
    active_projects: int
    completed_projects: int
    total_projects: int
    total_quotes: int
    total_invoices: int
    chart_url: str | None = None


class FunnelStage(BaseModel):
    draft: int = 0
    sent: int = 0
    accepted: int = 0
    paid: int = 0


class FunnelResponse(BaseModel):
    stages: FunnelStage
    chart_url: str | None = None


class GtmMetric(BaseModel):
    channel: str
    impressions: int
    clicks: int
    conversions: int
    cost: float
    revenue: float


class GtmResponse(BaseModel):
    period: str
    metrics: list[GtmMetric]


class ReportExportResponse(BaseModel):
    format: str
    csv_content: str | None = None
    error: str | None = None
