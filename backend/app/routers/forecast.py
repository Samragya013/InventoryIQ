from fastapi import APIRouter, HTTPException
from typing import List

from backend.app.services.forecasting_service import ForecastingService
from backend.app.services.inventory_service import InventoryService
from backend.app.routers.schemas import (
    BatchForecastRequest,
    ForecastResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Forecast"])

# Initialize forecast service with error handling
try:
    forecast_service = ForecastingService()
except Exception as e:
    print(f"WARNING: Failed to load ForecastingService: {str(e)}")
    print("The /api/v1/forecast endpoints may not work, but metadata endpoints will.")
    forecast_service = None


# --------------------------------------------------
# SINGLE FORECAST (NO RELATIVE RISK)
# --------------------------------------------------
@router.get("/forecast")
def get_forecast(store_id: str, product_id: str):
    """
    Single forecast endpoint.
    Risk is NOT applied here because relative risk
    requires batch context.
    """
    if forecast_service is None:
        raise HTTPException(
            status_code=503,
            detail="Forecast service unavailable. Please check model dependencies."
        )
    
    result = forecast_service.forecast(store_id, product_id)

    if result is None:
        raise HTTPException(status_code=404, detail="No data found")

    inventory_decision = InventoryService.recommend(
        result["forecast_units"],
        result["rolling_std"]
    )

    return {
        "store_id": store_id,
        "product_id": product_id,
        **inventory_decision,
    }


# --------------------------------------------------
# BATCH FORECAST (RELATIVE RISK APPLIED)
# --------------------------------------------------
@router.post(
    "/forecast/batch",
    response_model=List[ForecastResponse]
)
def batch_forecast(request: BatchForecastRequest):
    """
    Batch forecast endpoint.
    Relative risk is calculated AFTER collecting
    all recommendations.
    """
    if forecast_service is None:
        raise HTTPException(
            status_code=503,
            detail="Forecast service unavailable. Please check model dependencies."
        )
    
    responses = []

    for item in request.items:
        result = forecast_service.forecast(
            item.store_id, item.product_id
        )

        if result is None:
            continue  # skip missing data safely

        rec = InventoryService.recommend(
            result["forecast_units"],
            result["rolling_std"]
        )

        responses.append({
            "store_id": item.store_id,
            "product_id": item.product_id,
            **rec
        })

    # --------------------------------------------------
    # APPLY RELATIVE (PERCENTILE-BASED) RISK
    # --------------------------------------------------
    responses = InventoryService.apply_relative_risk(responses)

    return responses
