import pandas as pd
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]

# Map ML feature names to business-friendly explanations
FEATURE_NAMES = {
    "lag_1_units_sold": "Most recent sales trend",
    "lag_2_units_sold": "Sales from two weeks ago",
    "lag_3_units_sold": "Sales from three weeks ago",
    "lag_4_units_sold": "Sales from four weeks ago",
    "rolling_4wk_mean": "Average demand over past month",
    "rolling_4wk_std": "Recent demand volatility",
    "rolling_8wk_mean": "Average demand over two months",
    "rolling_8wk_std": "Volatility over two months",
    "day_of_week": "Weekly seasonal pattern",
    "month_of_year": "Monthly seasonal pattern",
    "trend": "Overall demand trend",
    "seasonality": "Seasonal patterns in demand",
}


class ForecastExplanationService:
    def __init__(self):
        self.model = joblib.load(
            BASE_DIR / "models" / "best_model.joblib"
        )

        metadata = pd.read_csv(
            BASE_DIR / "models" / "production_model_metadata.csv"
        ).iloc[0]

        self.features = (
            metadata["features_used"]
            .strip("[]")
            .replace("'", "")
            .split(", ")
        )

        self.data = pd.read_csv(
            BASE_DIR / "data" / "processed" / "feature_engineered_data.csv",
            parse_dates=["week"]
        )

    def explain(self, store_id: str, product_id: str):
        df = self.data[
            (df := self.data)["store_id"].eq(store_id) &
            (df)["product_id"].eq(product_id)
        ].sort_values("week")

        if df.empty:
            return None

        latest = df.iloc[-1]
        X = pd.DataFrame([[latest[f] for f in self.features]], columns=self.features)

        importances = self.model.feature_importances_
        contributions = X.iloc[0] * importances

        explanation = (
            contributions
            .abs()
            .sort_values(ascending=False)
            .head(5)
            .reset_index()
        )

        explanation.columns = ["feature", "impact"]
        
        # Normalize impact to percentage (0-100)
        total_impact = explanation["impact"].sum()
        if total_impact > 0:
            explanation["impact"] = (explanation["impact"] / total_impact * 100).round(1)
        else:
            explanation["impact"] = 0.0

        # Convert ML feature names to business-friendly names
        explanation["feature"] = explanation["feature"].map(
            lambda x: FEATURE_NAMES.get(x, x)
        )

        return explanation.to_dict(orient="records")
