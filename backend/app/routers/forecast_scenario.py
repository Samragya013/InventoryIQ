from fastapi import APIRouter, HTTPException
from backend.app.services.forecasting_service import ForecastingService
from backend.app.services.scenario_service import ScenarioService

router = APIRouter(
    prefix="/api/v1",
    tags=["Forecast Scenario"]
)

try:
    forecast_service = ForecastingService()
except Exception as e:
    print(f"WARNING: Failed to load ForecastingService: {str(e)}")
    forecast_service = None


@router.post("/forecast/scenario")
def simulate_scenario(
    store_id: str,
    product_id: str,
    demand_multiplier: float
):
    """
    Simulates a demand change scenario without retraining.
    """

    base = forecast_service.forecast(store_id, product_id)

    if not base:
        raise HTTPException(
            status_code=404,
            detail="No data found for the given store and product"
        )

    return ScenarioService.simulate(
        base["forecast_units"],
        demand_multiplier
    )
