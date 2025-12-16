import pandas as pd
import joblib
from pathlib import Path
from typing import Optional, Dict


# --------------------------------------------------
# Project base directory (robust for any execution)
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[3]


class ForecastingService:
    """
    ForecastingService
    ------------------
    - Loads the selected production demand forecasting model
    - Loads model metadata (features, metrics)
    - Loads feature-engineered dataset
    - Produces next-period demand forecast for a given store-product pair

    Design principles:
    - Model selection happens offline (notebook)
    - Backend only consumes final artifacts
    - Feature list is metadata-driven (no hardcoding)
    """

    def __init__(self):
        # --------------------------------------------------
        # Load production model
        # --------------------------------------------------
        self.model = joblib.load(
            BASE_DIR / "models" / "best_model.joblib"
        )

        # --------------------------------------------------
        # Load model metadata
        # --------------------------------------------------
        metadata = pd.read_csv(
            BASE_DIR / "models" / "production_model_metadata.csv"
        ).iloc[0]

        # Parse feature list safely
        self.features = (
            metadata["features_used"]
            .strip("[]")
            .replace("'", "")
            .split(", ")
        )

        # --------------------------------------------------
        # Load processed feature-engineered data
        # --------------------------------------------------
        self.data = pd.read_csv(
            BASE_DIR / "data" / "processed" / "feature_engineered_data.csv",
            parse_dates=["week"],
        )

    def forecast(
        self,
        store_id: str,
        product_id: str
    ) -> Optional[Dict[str, float]]:
        """
        Generate demand forecast for the latest available week
        for a given store-product pair.

        Returns:
            dict with:
              - forecast_units
              - rolling_std
            OR
            None if data not found
        """

        # --------------------------------------------------
        # Filter data for store-product
        # --------------------------------------------------
        df = self.data[
            (self.data["store_id"] == store_id) &
            (self.data["product_id"] == product_id)
        ].sort_values("week")

        if df.empty:
            return None

        # --------------------------------------------------
        # Use latest available record
        # --------------------------------------------------
        latest_row = df.iloc[-1]

        # --------------------------------------------------
        # Build input DataFrame (preserve feature names)
        # --------------------------------------------------
        X = pd.DataFrame(
            [[latest_row[f] for f in self.features]],
            columns=self.features
        )

        # --------------------------------------------------
        # Predict demand
        # --------------------------------------------------
        forecast_units = self.model.predict(X)[0]

        return {
            "forecast_units": round(float(forecast_units), 2),
            "rolling_std": round(
                float(latest_row.get("rolling_4wk_std", 0.0)), 2
            ),
        }
