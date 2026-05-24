"""Analytics pipeline for prism-analytics.

Uses pandas to compute KPIs, conversion funnels, and generate charts.
"""

import io
import base64
from datetime import date
from typing import Any

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="darkgrid")


def compute_conversion_rate(quotes: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute lead conversion rate from quotes data."""
    df = pd.DataFrame(quotes)
    if df.empty:
        return {
            "total_leads": 0,
            "accepted": 0,
            "paid": 0,
            "conversion_rate": 0.0,
            "chart_url": None,
        }

    total = len(df)
    accepted = len(df[df["status"] == "accepted"])
    paid = len(df[df["status"].isin(["paid", "sent"])])
    rate = round(accepted / total * 100, 2) if total else 0.0

    return {
        "total_leads": total,
        "accepted": int(accepted),
        "paid": int(paid),
        "conversion_rate": rate,
        "chart_url": _generate_conversion_chart(df),
    }


def compute_kpi_summary(
    quotes: list[dict[str, Any]],
    invoices: list[dict[str, Any]],
    projects: list[dict[str, Any]],
    period: str = "monthly",
) -> dict[str, Any]:
    """Compute KPI summary across quotes, invoices, and projects."""
    quotes_df = pd.DataFrame(quotes)
    invoices_df = pd.DataFrame(invoices)
    projects_df = pd.DataFrame(projects)

    # Revenue metrics
    total_revenue = (
        invoices_df[invoices_df["status"].isin(["paid", "sent"])]["total"].sum()
        if not invoices_df.empty
        else 0
    )

    # Quote metrics
    avg_quote_value = (
        quotes_df["amount"].mean() if not quotes_df.empty else 0
    )

    # Project metrics
    active_projects = (
        len(projects_df[projects_df["status"] == "in_progress"])
        if not projects_df.empty
        else 0
    )
    completed_projects = (
        len(projects_df[projects_df["status"] == "completed"])
        if not projects_df.empty
        else 0
    )

    return {
        "total_revenue": float(total_revenue),
        "avg_quote_value": float(avg_quote_value) if pd.notna(avg_quote_value) else 0,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "total_projects": len(projects_df),
        "total_quotes": len(quotes_df),
        "total_invoices": len(invoices_df),
        "chart_url": _generate_revenue_chart(invoices_df, period),
    }


def compute_funnel(quotes: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute conversion funnel stages."""
    df = pd.DataFrame(quotes)
    stages = {
        "draft": 0,
        "sent": 0,
        "accepted": 0,
        "paid": 0,
    }

    if df.empty:
        return {"stages": stages, "chart_url": None}

    for status in stages:
        stages[status] = int(len(df[df["status"] == status]))

    return {
        "stages": stages,
        "chart_url": _generate_funnel_chart(stages),
    }


def _generate_conversion_chart(df: pd.DataFrame) -> str | None:
    """Generate a bar chart of quotes by status and return as base64."""
    if df.empty:
        return None

    status_counts = df["status"].value_counts()
    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    status_counts.plot(kind="bar", ax=ax, color=colors[: len(status_counts)])
    ax.set_title("Quotes by Status", color="white", fontsize=14)
    ax.set_xlabel("Status", color="white")
    ax.set_ylabel("Count", color="white")
    ax.tick_params(colors="white")
    ax.spines["bottom"].set_color("white")
    ax.spines["left"].set_color("white")

    return _fig_to_base64(fig)


def _generate_revenue_chart(df: pd.DataFrame, period: str) -> str | None:
    """Generate a revenue trend chart."""
    if df.empty or "total" not in df.columns:
        return None

    df["created_at"] = pd.to_datetime(df["created_at"])
    if period == "monthly":
        df["period"] = df["created_at"].dt.to_period("M").astype(str)
    else:
        df["period"] = df["created_at"].dt.to_period("W").astype(str)

    revenue = df.groupby("period")["total"].sum()

    fig, ax = plt.subplots(figsize=(10, 4))
    revenue.plot(kind="line", ax=ax, marker="o", color="#06b6d4", linewidth=2)
    ax.fill_between(range(len(revenue)), revenue.values, alpha=0.15, color="#06b6d4")
    ax.set_title("Revenue Trend", color="white", fontsize=14)
    ax.set_xlabel("Period", color="white")
    ax.set_ylabel("Revenue", color="white")
    ax.tick_params(colors="white")
    ax.spines["bottom"].set_color("white")
    ax.spines["left"].set_color("white")

    return _fig_to_base64(fig)


def _generate_funnel_chart(stages: dict[str, int]) -> str | None:
    """Generate a funnel bar chart."""
    fig, ax = plt.subplots(figsize=(6, 5))
    labels = list(stages.keys())
    values = list(stages.values())
    colors = ["#6b7280", "#f59e0b", "#10b981", "#06b6d4"]

    bars = ax.barh(labels, values, color=colors)
    ax.set_title("Conversion Funnel", color="white", fontsize=14)
    ax.tick_params(colors="white")
    ax.spines["bottom"].set_color("white")
    ax.spines["left"].set_color("white")

    for bar, val in zip(bars, values):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2,
                str(val), va="center", color="white")

    return _fig_to_base64(fig)


def _fig_to_base64(fig: plt.Figure) -> str:
    """Convert a matplotlib figure to a base64 PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight",
                facecolor="#0a0a0f", dpi=100)
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return f"data:image/png;base64,{img_str}"
