from fastapi import APIRouter, HTTPException
from backend.app.services.forecast_explanation_service import ForecastExplanationService

router = APIRouter(
    prefix="/api/v1",
    tags=["Forecast Explanation"]
)

try:
    explain_service = ForecastExplanationService()
except Exception as e:
    print(f"WARNING: Failed to load ForecastExplanationService: {str(e)}")
    explain_service = None


@router.get("/forecast/explain")
def explain_forecast(store_id: str, product_id: str):
    """
    Returns top contributing features driving the forecast.
    """

    result = explain_service.explain(store_id, product_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No data found for the given store and product"
        )

    return {
        "store_id": store_id,
        "product_id": product_id,
        "top_features": result
    }
