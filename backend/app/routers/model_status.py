from fastapi import APIRouter
from backend.app.services.model_status_service import ModelStatusService

router = APIRouter(
    prefix="/api/v1",
    tags=["Model Status"]
)

try:
    status_service = ModelStatusService()
except Exception as e:
    print(f"WARNING: Failed to load ModelStatusService: {str(e)}")
    status_service = None


@router.get("/model/status")
def get_model_status():
    """
    Returns metadata and performance details
    of the currently active production model.

    This endpoint is:
    - Read-only
    - Lightweight
    - Safe for UI and BI consumption
    """
    return status_service.get_status()
