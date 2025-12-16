class ConfidenceService:
    """Service for calculating confidence bounds around forecasts."""
    
    @staticmethod
    def confidence_band(forecast_units, rolling_std, confidence_level=0.95):
        """
        Calculate confidence bounds using rolling standard deviation.
        
        Args:
            forecast_units: Forecasted quantity
            rolling_std: Rolling standard deviation of historical data
            confidence_level: Confidence level (default 95%)
        
        Returns:
            Dictionary with lower_bound and upper_bound
        """
        # Use rolling_std as margin of error
        # For 95% confidence, use ~1.96 * std, but rolling_std already captures volatility
        margin = rolling_std * 1.96 if rolling_std else forecast_units * 0.15
        
        return {
            "forecast": forecast_units,
            "lower_bound": max(0, forecast_units - margin),
            "upper_bound": forecast_units + margin,
            "margin_of_error": margin
        }
