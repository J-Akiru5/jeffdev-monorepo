"""Supabase client service for prism-analytics.

Read-only client to query agency data for analytics.
Uses service role key for access to all tables.
"""

import os
from typing import Any
from supabase import create_client, Client

_supabase: Client | None = None


def get_supabase() -> Client:
    """Get or create a Supabase client instance."""
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
            )
        _supabase = create_client(url, key)
    return _supabase


def fetch_quotes(start: str, end: str) -> list[dict[str, Any]]:
    """Fetch quotes within a date range."""
    client = get_supabase()
    result = (
        client.table("quotes")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )
    return result.data


def fetch_invoices(start: str, end: str) -> list[dict[str, Any]]:
    """Fetch invoices within a date range."""
    client = get_supabase()
    result = (
        client.table("invoices")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )
    return result.data


def fetch_projects() -> list[dict[str, Any]]:
    """Fetch all projects."""
    client = get_supabase()
    result = client.table("projects").select("*").execute()
    return result.data


def fetch_leads(start: str, end: str) -> list[dict[str, Any]]:
    """Fetch leads (quotes as proxy for leads)."""
    return fetch_quotes(start, end)


def fetch_feedback(start: str, end: str) -> list[dict[str, Any]]:
    """Fetch feedback within a date range."""
    client = get_supabase()
    result = (
        client.table("feedback")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )
    return result.data
