"""Go-to-market metrics analytics route."""

from fastapi import APIRouter, Query

from models.schemas import GtmResponse, GtmMetric

router = APIRouter(prefix="/api/v1/gtm", tags=["gtm"])


@router.get("/metrics", response_model=GtmResponse)
async def get_gtm_metrics(
    channel: str = Query("all", description="Channel filter (all, organic, paid, social, email)"),
):
    """Go-to-market metrics by channel.

    Currently returns mock data. Will integrate with Google Analytics API.
    """
    channels = ["all", "organic", "paid", "social", "email"]

    if channel != "all" and channel not in channels:
        return GtmResponse(
            period="monthly",
            metrics=[],
        )

    mock_metrics = [
        GtmMetric(
            channel="organic",
            impressions=12500,
            clicks=892,
            conversions=45,
            cost=0,
            revenue=22500,
        ),
        GtmMetric(
            channel="paid",
            impressions=32000,
            clicks=2100,
            conversions=120,
            cost=4500,
            revenue=48000,
        ),
        GtmMetric(
            channel="social",
            impressions=18000,
            clicks=1450,
            conversions=78,
            cost=1200,
            revenue=31200,
        ),
        GtmMetric(
            channel="email",
            impressions=5000,
            clicks=380,
            conversions=32,
            cost=200,
            revenue=16000,
        ),
    ]

    if channel != "all":
        mock_metrics = [m for m in mock_metrics if m.channel == channel]

    return GtmResponse(
        period="monthly",
        metrics=mock_metrics,
    )
