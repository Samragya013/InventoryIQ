from fastapi import APIRouter, HTTPException
from backend.app.services.forecasting_service import ForecastingService
from backend.app.services.confidence_service import ConfidenceService

router = APIRouter(
    prefix="/api/v1",
    tags=["Forecast Confidence"]
)

try:
    forecast_service = ForecastingService()
except Exception as e:
    print(f"WARNING: Failed to load ForecastingService: {str(e)}")
    forecast_service = None


@router.get("/forecast/confidence")
def forecast_confidence(
    store_id: str,
    product_id: str
):
    """
    Returns confidence bounds around forecast.
    """

    result = forecast_service.forecast(store_id, product_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No data found for the given store and product"
        )

    return ConfidenceService.confidence_band(
        result["forecast_units"],
        result["rolling_std"]
    )
