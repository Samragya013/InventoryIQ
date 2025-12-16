from fastapi import APIRouter, HTTPException
import pandas as pd
from pathlib import Path

router = APIRouter(prefix="/api/v1", tags=["Analytics"])

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = BASE_DIR / "data/processed/feature_engineered_data.csv"

df = pd.read_csv(DATA_PATH, parse_dates=["week"])

@router.get("/timeseries")
def get_timeseries(store_id: str, product_id: str):
    """
    Get time-series data for a specific product in a store.
    Includes historical units sold and volatility metrics.
    """
    subset = df[
        (df["store_id"] == store_id) &
        (df["product_id"] == product_id)
    ].sort_values("week")

    if subset.empty:
        raise HTTPException(status_code=404, detail="No data found")

    weeks = subset["week"].astype(str).tolist()
    units_sold = subset["units_sold"].tolist()
    rolling_std = subset["rolling_4wk_std"].tolist()
    
    # Calculate additional metrics for the overview
    valid_units = [u for u in units_sold if u is not None and isinstance(u, (int, float))]
    valid_volatility = [v for v in rolling_std if v is not None and isinstance(v, (int, float))]
    
    avg_demand = sum(valid_units) / len(valid_units) if valid_units else 0
    peak_demand = max(valid_units) if valid_units else 0
    min_demand = min(valid_units) if valid_units else 0
    avg_volatility = sum(valid_volatility) / len(valid_volatility) if valid_volatility else 0
    
    # Calculate trend (recent vs early weeks)
    if len(valid_units) >= 8:
        recent_avg = sum(valid_units[-4:]) / 4
        early_avg = sum(valid_units[:4]) / 4
        trend_direction = "increasing" if recent_avg > early_avg else "declining"
        trend_pct = round(((recent_avg - early_avg) / early_avg * 100), 1) if early_avg > 0 else 0
    else:
        trend_direction = "insufficient_data"
        trend_pct = 0

    return {
        "weeks": weeks,
        "units_sold": units_sold,
        "rolling_std": rolling_std,
        "metrics": {
            "avg_demand": round(avg_demand, 2),
            "peak_demand": int(peak_demand),
            "min_demand": int(min_demand),
            "avg_volatility": round(avg_volatility, 2),
            "trend_direction": trend_direction,
            "trend_pct": trend_pct,
            "data_points": len(weeks)
        }
    }
