class ScenarioService:
    """Service for simulating forecast scenarios with demand multipliers."""
    
    @staticmethod
    def simulate(base_forecast, demand_multiplier):
        """
        Simulate a what-if scenario by applying a demand multiplier to base forecast.
        
        Args:
            base_forecast: Base forecasted quantity
            demand_multiplier: Multiplier to apply (e.g., 0.8 for 20% reduction, 1.2 for 20% increase)
        
        Returns:
            Dictionary with original and adjusted forecast
        """
        adjusted_forecast = base_forecast * demand_multiplier
        
        return {
            "base_forecast": base_forecast,
            "demand_multiplier": demand_multiplier,
            "adjusted_forecast": adjusted_forecast,
            "difference": adjusted_forecast - base_forecast,
            "percent_change": ((adjusted_forecast - base_forecast) / base_forecast * 100) if base_forecast else 0
        }
