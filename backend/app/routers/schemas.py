from pydantic import BaseModel
from typing import List


class ForecastRequest(BaseModel):
    store_id: str
    product_id: str


class BatchForecastRequest(BaseModel):
    items: List[ForecastRequest]


class ForecastResponse(BaseModel):
    store_id: str
    product_id: str
    forecast_units: float
    recommended_order_qty: int
    safety_stock: float
    risk_level: str
