"""
Market Intelligence Router
--------------------------
API endpoints for market-level business intelligence.

Endpoints:
- GET /api/v1/markets           → List available markets
- GET /api/v1/market/summary    → Get market intelligence summary

Design principles:
- Business-friendly responses (no ML jargon)
- Reads from precomputed data only
- Does NOT modify existing forecast/scenario logic
"""

from fastapi import APIRouter, Query
from typing import Optional, List, Dict

from backend.app.services.market_intelligence_service import (
    market_intelligence_service
)

router = APIRouter(prefix="/api/v1", tags=["Market Intelligence"])


@router.get("/markets")
def get_markets() -> List[str]:
    """
    Get list of available markets.
    
    Returns:
        List of market names (e.g., ["APAC", "Europe", "North America"])
    """
    return market_intelligence_service.get_markets()


@router.get("/market/summary")
def get_market_summary(
    market: Optional[str] = Query(
        default=None,
        description="Filter by market name (e.g., 'APAC', 'Europe'). Leave empty for all markets."
    )
) -> List[Dict]:
    """
    Get business-friendly market intelligence summary.
    
    This endpoint provides:
    - Market name
    - Attention level (High / Medium / Low)
    - Plain-English explanation of what's happening
    - Current demand trend
    - Strategy recommendation
    
    Note: Results are sorted by attention level (High first).
    
    Args:
        market: Optional market filter
        
    Returns:
        List of market intelligence objects
    """
    return market_intelligence_service.get_market_summary(market)
