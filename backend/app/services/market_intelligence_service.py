"""
Market Intelligence Service
---------------------------
Provides market-level insights from precomputed CSVs.
Designed for business-friendly consumption — no ML jargon.

This service:
- Reads from precomputed market summary data
- Transforms technical metrics into plain-English insights
- Does NOT recompute forecasts or modify existing data
"""

import pandas as pd
from pathlib import Path
from typing import List, Dict, Optional


# --------------------------------------------------
# Project base directory
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[3]

# --------------------------------------------------
# Precomputed data paths
# --------------------------------------------------
MARKET_SUMMARY_PATH = BASE_DIR / "data" / "processed" / "market_summary.csv"
MARKET_COMPARISON_PATH = BASE_DIR / "data" / "processed" / "market_comparison.csv"


class MarketIntelligenceService:
    """
    MarketIntelligenceService
    -------------------------
    Provides market-level business intelligence.
    
    Key design decisions:
    - Reads from precomputed CSVs (no on-the-fly calculations)
    - Translates technical metrics to business language
    - Market Pressure Index (MPI) is used only for relative prioritization
    - No country-vs-country comparisons
    """

    def __init__(self):
        """Load precomputed market data on initialization."""
        self._load_data()

    def _load_data(self):
        """Load market summary and comparison data."""
        try:
            self.market_summary = pd.read_csv(MARKET_SUMMARY_PATH)
        except FileNotFoundError:
            self.market_summary = pd.DataFrame()

        try:
            self.market_comparison = pd.read_csv(MARKET_COMPARISON_PATH)
        except FileNotFoundError:
            self.market_comparison = pd.DataFrame()

    def get_markets(self) -> List[str]:
        """
        Get list of available markets.
        
        Returns:
            List of market names (e.g., ["APAC", "Europe", "North America"])
        """
        if self.market_summary.empty:
            return []
        return self.market_summary["market"].tolist()

    def get_market_summary(self, market: Optional[str] = None) -> List[Dict]:
        """
        Get business-friendly market summary.
        
        Args:
            market: Optional filter for specific market
            
        Returns:
            List of market intelligence objects with:
            - market: Market name
            - attention_level: High / Medium / Low
            - explanation: Plain-English insight
            - demand_trend: Current demand status
        """
        if self.market_summary.empty:
            return []

        df = self.market_summary.copy()

        # Filter by market if specified
        if market and market != "all":
            df = df[df["market"].str.lower() == market.lower()]
            if df.empty:
                return []

        results = []
        for _, row in df.iterrows():
            results.append(self._transform_to_business_insight(row))

        # Sort by attention level (High first)
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        results.sort(key=lambda x: priority_order.get(x["attention_level"], 99))

        return results

    def _transform_to_business_insight(self, row: pd.Series) -> Dict:
        """
        Transform raw market data into business-friendly insight.
        
        Uses Market Pressure Index (MPI) for relative prioritization:
        - MPI >= 0.95: High attention needed
        - MPI >= 0.90: Medium attention needed
        - MPI < 0.90: Low attention needed
        
        Note: MPI is a composite of normalized demand and volatility.
        Higher MPI = more demand pressure relative to other markets.
        """
        market_name = row["market"]
        mpi = row.get("market_pressure_index", 0.5)
        avg_demand = row.get("avg_weekly_demand", 0)
        volatility = row.get("demand_volatility", 0)
        strategy = row.get("inventory_strategy", "")

        # Determine attention level based on MPI
        if mpi >= 0.98:
            attention_level = "High"
            explanation = f"{market_name} is showing the highest relative demand pressure. Prioritize inventory replenishment to prevent stockouts."
        elif mpi >= 0.93:
            attention_level = "Medium"
            explanation = f"{market_name} has moderate demand pressure. Monitor closely and adjust orders if trends continue."
        else:
            attention_level = "Low"
            explanation = f"{market_name} is operating within normal parameters. Standard inventory planning is sufficient."

        # Add demand context
        if volatility > 100:
            demand_trend = "Variable demand patterns detected"
        elif avg_demand > 950:
            demand_trend = "Strong consistent demand"
        else:
            demand_trend = "Stable demand levels"

        return {
            "market": market_name,
            "attention_level": attention_level,
            "explanation": explanation,
            "demand_trend": demand_trend,
            "strategy_recommendation": self._simplify_strategy(strategy)
        }

    def _simplify_strategy(self, strategy: str) -> str:
        """
        Simplify technical strategy to actionable recommendation.
        """
        if not strategy:
            return "Review inventory levels"
        
        if "optimize" in strategy.lower():
            return "Focus on cost optimization"
        elif "safety stock" in strategy.lower():
            return "Maintain safety stock buffers"
        elif "reduce" in strategy.lower():
            return "Consider reducing safety stock"
        else:
            return "Continue current approach"


# --------------------------------------------------
# Singleton instance for import
# --------------------------------------------------
market_intelligence_service = MarketIntelligenceService()
