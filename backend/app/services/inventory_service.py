import numpy as np
from typing import List, Dict
from backend.app.core.config import Z_SCORE


class InventoryService:
    """
    InventoryService
    ----------------
    - Converts demand forecasts into inventory order recommendations
    - Applies safety stock using demand volatility
    - Classifies demand risk using RELATIVE (percentile-based) logic

    This design ensures:
    - Meaningful risk differentiation
    - Dataset-agnostic behavior
    - Business-trustworthy outputs
    """

    @staticmethod
    def calculate_safety_stock(volatility: float) -> float:
        """
        Safety stock based on demand volatility.
        """
        return volatility * Z_SCORE

    @staticmethod
    def recommend(
        forecast_units: float,
        volatility: float
    ) -> Dict[str, float]:
        """
        Core recommendation logic (risk-agnostic).
        Risk classification is applied separately for batch context.
        """
        safety_stock = InventoryService.calculate_safety_stock(volatility)
        recommended_qty = max(0, round(forecast_units + safety_stock))

        return {
            "forecast_units": round(float(forecast_units), 2),
            "safety_stock": round(float(safety_stock), 2),
            "recommended_order_qty": recommended_qty,
            "rolling_std": float(volatility),
        }

    @staticmethod
    def apply_relative_risk(
        recommendations: List[Dict[str, float]]
    ) -> List[Dict[str, float]]:
        """
        Assign risk levels using percentile-based volatility ranking.

        Low    → bottom 33%
        Medium → middle 33%
        High   → top 33%
        """

        if not recommendations:
            return recommendations

        volatilities = [
            item["rolling_std"] for item in recommendations
        ]

        p33 = np.percentile(volatilities, 33)
        p66 = np.percentile(volatilities, 66)

        for item in recommendations:
            vol = item["rolling_std"]

            if vol <= p33:
                item["risk_level"] = "Low"
            elif vol <= p66:
                item["risk_level"] = "Medium"
            else:
                item["risk_level"] = "High"

        return recommendations
