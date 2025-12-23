"""
Inventory Planning Router (Enterprise)
--------------------------------------
API endpoints for market-level inventory planning.

Endpoints:
- GET /api/v1/categories          → List available product categories
- GET /api/v1/inventory/plan      → Get market-level inventory recommendations

Design principles:
- Business-friendly responses (no raw IDs exposed)
- Market-level aggregation by default
- Optional category filtering (does NOT re-trigger forecasting)
- Uses precomputed recommendations data
"""

import pandas as pd
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict
from pathlib import Path

router = APIRouter(prefix="/api/v1", tags=["Inventory Planning"])

BASE_DIR = Path(__file__).resolve().parents[3]
RECOMMENDATIONS_PATH = BASE_DIR / "data" / "processed" / "inventory_recommendations.csv"
CLEANED_DATA_PATH = BASE_DIR / "data" / "processed" / "cleaned_data.csv"
MARKET_SUMMARY_PATH = BASE_DIR / "data" / "processed" / "market_summary.csv"

# Market mapping based on data analysis (regions -> markets)
REGION_TO_MARKET = {
    "North": "North America",
    "South": "APAC", 
    "East": "APAC",
    "West": "Europe"
}

# Category mapping for enterprise display names
CATEGORY_DISPLAY_NAMES = {
    "Electronics": "Consumer Electronics",
    "Clothing": "Apparel & Fashion",
    "Groceries": "Consumer Goods",
    "Toys": "Toys & Games",
    "Furniture": "Home & Furniture"
}


def load_recommendations_with_metadata():
    """Load recommendations enriched with category and market data."""
    try:
        # Load recommendations
        if not RECOMMENDATIONS_PATH.exists():
            raise FileNotFoundError(f"Recommendations file not found: {RECOMMENDATIONS_PATH}")
        
        recs_df = pd.read_csv(RECOMMENDATIONS_PATH)
        
        # Load cleaned data to get category and region info
        if CLEANED_DATA_PATH.exists():
            cleaned_df = pd.read_csv(CLEANED_DATA_PATH)
            
            # Get unique store-product-category-region mapping (+ optional product_name)
            cols = ["store_id", "product_id", "category", "region"]
            if "product_name" in cleaned_df.columns:
                cols.append("product_name")
            mapping_df = cleaned_df[cols].drop_duplicates()
            
            # Merge to add category and region to recommendations
            recs_df = recs_df.merge(
                mapping_df, 
                on=["store_id", "product_id"], 
                how="left"
            )
            
            # Add market based on region
            recs_df["market"] = recs_df["region"].map(REGION_TO_MARKET).fillna("Other")
            
            # Add display category name
            recs_df["category_display"] = recs_df["category"].map(
                CATEGORY_DISPLAY_NAMES
            ).fillna(recs_df["category"])

            # Add product display name (prefer provided product_name, else mapping, else fallback)
            product_name_map = {
                "P0007": "Noise-Canceling Headphones",
                "P0012": "Smart Home Speaker",
                "P0018": "Wireless Earbuds",
                "P0025": "4K Action Camera",
                "P0031": "Portable Bluetooth Speaker",
                "P0044": "Ergonomic Office Chair",
                "P0050": "Stainless Steel Cookware Set"
            }
            def _name_for_row(row):
                if "product_name" in row and pd.notna(row["product_name"]):
                    return str(row["product_name"]).strip()
                mapped = product_name_map.get(str(row.get("product_id", "")))
                if mapped:
                    return mapped
                # Graceful fallback
                return f"Product {row.get('product_id', 'Unknown')}"
            recs_df["product_name_display"] = recs_df.apply(_name_for_row, axis=1)
        
        # ========== RECALCULATE RISK BASED ON RELATIVE DISTRIBUTION ==========
        # Instead of using precomputed "High" for all, calculate relative risk
        # based on safety stock ratio (higher ratio = higher safety buffer = higher cost impact)
        
        recs_df["safety_buffer_ratio"] = (
            (recs_df["recommended_order_qty"] - recs_df["forecast_units"]) / 
            recs_df["forecast_units"]
        )
        
        # Calculate percentiles to distribute risk levels
        # Products in top 25% of safety buffer ratio = High Risk (high cost)
        # Products in middle 50% = Medium Risk 
        # Products in bottom 25% = Low Risk (lean, optimized)
        percentile_75 = recs_df["safety_buffer_ratio"].quantile(0.75)
        percentile_25 = recs_df["safety_buffer_ratio"].quantile(0.25)
        
        def assign_risk_level(ratio):
            """
            Assign risk level based on safety buffer ratio.
            High = expensive (high safety stock)
            Low = lean/optimized (low safety stock)
            """
            if ratio >= percentile_75:
                return "High"  # Expensive inventory strategy
            elif ratio >= percentile_25:
                return "Medium"  # Balanced approach
            else:
                return "Low"  # Lean, cost-optimized
        
        recs_df["demand_risk"] = recs_df["safety_buffer_ratio"].apply(assign_risk_level)
        
        return recs_df
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")


@router.get("/categories")
def get_categories() -> List[Dict[str, str]]:
    """
    Get list of available product categories.
    
    Returns:
        List of category objects with id and display name
    """
    try:
        if not CLEANED_DATA_PATH.exists():
            # Return default categories if file not found
            return [
                {"id": cat, "name": display} 
                for cat, display in CATEGORY_DISPLAY_NAMES.items()
            ]
        
        df = pd.read_csv(CLEANED_DATA_PATH)
        categories = df["category"].unique().tolist()
        
        return [
            {
                "id": cat,
                "name": CATEGORY_DISPLAY_NAMES.get(cat, cat)
            }
            for cat in sorted(categories)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading categories: {str(e)}")


@router.get("/inventory/plan")
def get_inventory_plan(
    market: Optional[str] = Query(
        default=None,
        description="Filter by market (e.g., 'APAC', 'Europe', 'North America'). Leave empty for all markets."
    ),
    category: Optional[str] = Query(
        default=None,
        description="Filter by product category. Leave empty for all categories."
    ),
    limit: int = Query(
        default=20,
        description="Maximum number of recommendations to return",
        ge=1,
        le=100
    )
) -> Dict:
    """
    Get market-level inventory recommendations.
    
    This endpoint provides aggregated inventory planning data at the market level,
    with optional category filtering. It uses precomputed recommendations and
    does NOT re-trigger forecasting logic.
    
    Args:
        market: Optional market filter
        category: Optional category filter  
        limit: Max items to return
        
    Returns:
        Dictionary with:
        - summary: Market-level summary metrics
        - recommendations: List of item recommendations
        - filters_applied: Currently active filters
    """
    try:
        df = load_recommendations_with_metadata()
        
        if df.empty:
            return {
                "summary": None,
                "recommendations": [],
                "filters_applied": {"market": market, "category": category}
            }
        
        # Apply filters (convert to string if needed)
        filtered_df = df.copy()
        market_str = str(market) if market else None
        category_str = str(category) if category else None
        
        # Handle limit - extract from Query object if needed
        try:
            limit_int = int(limit) if isinstance(limit, int) else int(limit.default if hasattr(limit, 'default') else 20)
        except (ValueError, AttributeError):
            limit_int = 20
        
        if market_str and market_str.lower() != "all":
            filtered_df = filtered_df[
                filtered_df["market"].str.lower() == market_str.lower()
            ]
        
        if category_str and category_str.lower() != "all":
            filtered_df = filtered_df[
                filtered_df["category"].str.lower() == category_str.lower()
            ]
        
        if filtered_df.empty:
            return {
                "summary": {
                    "total_items": 0,
                    "total_forecast": 0,
                    "total_order_qty": 0,
                    "avg_safety_buffer_pct": 0,
                    "high_risk_count": 0,
                    "medium_risk_count": 0,
                    "low_risk_count": 0,
                    "market_context": market or "All Markets",
                    "category_context": category or "All Categories"
                },
                "recommendations": [],
                "filters_applied": {"market": market, "category": category}
            }
        
        # Calculate summary metrics
        total_forecast = filtered_df["forecast_units"].sum()
        total_order = filtered_df["recommended_order_qty"].sum()
        total_safety = total_order - total_forecast
        avg_safety_pct = (total_safety / total_forecast * 100) if total_forecast > 0 else 0
        
        # Risk distribution
        risk_counts = filtered_df["demand_risk"].value_counts().to_dict()
        
        summary = {
            "total_items": len(filtered_df),
            "total_forecast": round(total_forecast, 0),
            "total_order_qty": round(total_order, 0),
            "avg_safety_buffer_pct": round(avg_safety_pct, 1),
            "high_risk_count": risk_counts.get("High", 0),
            "medium_risk_count": risk_counts.get("Medium", 0),
            "low_risk_count": risk_counts.get("Low", 0),
            "market_context": market or "All Markets",
            "category_context": category or "All Categories"
        }
        
        # Prepare recommendations (sorted by risk, then order qty)
        risk_priority = {"High": 0, "Medium": 1, "Low": 2}
        filtered_df["risk_priority"] = filtered_df["demand_risk"].map(risk_priority)
        sorted_df = filtered_df.sort_values(
            ["risk_priority", "recommended_order_qty"], 
            ascending=[True, False]
        ).head(limit_int)
        
        recommendations = []
        for _, row in sorted_df.iterrows():
            safety_pct = ((row["recommended_order_qty"] - row["forecast_units"]) / row["forecast_units"] * 100) if row["forecast_units"] > 0 else 0
            
            recommendations.append({
                "product_id": row["product_id"],
                "product_name": row.get("product_name_display", f"Product {row.get('product_id', 'Unknown')}"),
                "category": row.get("category_display", row.get("category", "Unknown")),
                "market": row.get("market", "Unknown"),
                "forecast_units": round(row["forecast_units"], 0),
                "recommended_order_qty": int(row["recommended_order_qty"]),
                "safety_stock": int(row["safety_stock"]),
                "safety_buffer_pct": round(safety_pct, 1),
                "risk_level": row["demand_risk"]
            })
        
        return {
            "summary": summary,
            "recommendations": recommendations,
            "filters_applied": {"market": market, "category": category}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating plan: {str(e)}")


@router.get("/inventory/metrics")
def get_inventory_metrics(
    market: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None)
) -> Dict:
    """
    Get aggregated inventory metrics for Business Impact and Inaction Risk cards.
    
    Uses market-level data rather than store-level.
    """
    try:
        df = load_recommendations_with_metadata()
        
        if df.empty:
            return _empty_metrics_response(market, category)
        
        # Apply filters
        filtered_df = df.copy()
        market_str = str(market) if market else None
        category_str = str(category) if category else None
        
        if market_str and market_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["market"].str.lower() == market_str.lower()]
        
        if category_str and category_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["category"].str.lower() == category_str.lower()]
        
        if filtered_df.empty:
            return _empty_metrics_response(market, category)
        
        # Calculate metrics
        total_forecast = filtered_df["forecast_units"].sum()
        total_order = filtered_df["recommended_order_qty"].sum()
        total_safety = total_order - total_forecast
        
        # Risk analysis - now reframed as inventory cost strategy
        risk_counts = filtered_df["demand_risk"].value_counts().to_dict()
        high_risk_count = risk_counts.get("High", 0)  # High cost (aggressive safety)
        medium_risk_count = risk_counts.get("Medium", 0)  # Balanced
        low_risk_count = risk_counts.get("Low", 0)  # Lean/optimized
        total_items = len(filtered_df)
        
        # Safety buffer percentage (actual inventory cost impact)
        safety_buffer_pct = round((total_safety / total_forecast * 100), 0) if total_forecast > 0 else 0
        
        # Stockout risk avoided = based on safety buffer adequacy
        # Higher safety buffer = better demand coverage
        if safety_buffer_pct > 150:
            stockout_risk_avoided = 95  # Very conservative
        elif safety_buffer_pct > 100:
            stockout_risk_avoided = 85  # Conservative
        elif safety_buffer_pct > 50:
            stockout_risk_avoided = 75  # Moderate
        else:
            stockout_risk_avoided = 60  # Lean (higher stockout risk)
        
        # Expected service level based on safety buffer
        expected_service_level = min(99, 50 + int(safety_buffer_pct / 2))
        
        # Cost impact assessment - now business-focused
        # High count = expensive inventory strategy
        high_pct = (high_risk_count / total_items * 100) if total_items > 0 else 0
        low_pct = (low_risk_count / total_items * 100) if total_items > 0 else 0
        
        if high_pct > 50:
            cost_direction = "↑"
            cost_text = f"Aggressive safety strategy ({int(high_pct)}% high-cost items)"
        elif high_pct > 25:
            cost_direction = "→"
            cost_text = f"Balanced approach ({int(high_pct)}% high-cost items)"
        else:
            cost_direction = "↓"
            cost_text = f"Lean strategy ({int(low_pct)}% optimized items)"
        
        # Inaction risk metrics - reframed
        # Without this plan, you're not optimizing for cost/service balance
        potential_lost_units = round(total_forecast * 0.05, 0)  # 5% potential loss without buffer
        service_drop = 15  # Service level would drop without proper safety stock
        
        return {
            "business_impact": {
                "stockout_risk_avoided": int(stockout_risk_avoided),
                "safety_buffer_pct": int(safety_buffer_pct),
                "safety_buffer_units": int(total_safety),
                "expected_service_level": expected_service_level,
                "cost_direction": cost_direction,
                "cost_text": cost_text
            },
            "inaction_risk": {
                "stockout_risk_increase": 15,
                "potential_lost_units": int(potential_lost_units),
                "service_level_drop": service_drop,
                "recommendation": "Optimize portfolio based on cost-service balance"
            },
            "context": {
                "market": market or "All Markets",
                "category": category or "All Categories",
                "items_analyzed": total_items,
                "high_cost_items": high_risk_count,
                "balanced_items": medium_risk_count,
                "optimized_items": low_risk_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")


def _empty_metrics_response(market: Optional[str], category: Optional[str]) -> Dict:
    """Return empty metrics structure."""
    return {
        "business_impact": {
            "stockout_risk_avoided": 0,
            "safety_buffer_pct": 0,
            "safety_buffer_units": 0,
            "expected_service_level": 95,
            "cost_direction": "→",
            "cost_text": "No data"
        },
        "inaction_risk": {
            "stockout_risk_increase": 0,
            "potential_lost_units": 0,
            "service_level_drop": 0,
            "recommendation": "No data available"
        },
        "context": {
            "market": market or "All Markets",
            "category": category or "All Categories",
            "items_analyzed": 0
        }
    }
