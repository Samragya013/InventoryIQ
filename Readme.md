# InventoryIQ – Demand Intelligence Platform

**AI-powered inventory forecasting and order optimization system for retail supply chain planning.**

---

## Business Problem & Motivation

Retail companies lose millions annually to poor inventory decisions:
- **Overstocking**: Excess inventory ties up capital and increases waste
- **Stockouts**: Missed sales and damaged customer relationships
- **Manual forecasting**: Human guesses lack precision and scale

InventoryIQ solves this by automating demand prediction, reducing forecast error, and providing data-driven recommendations that balance customer service with inventory carrying costs.

---

## Solution Overview

InventoryIQ is a **demand intelligence platform** that:

1. **Analyzes** historical weekly sales patterns across products and store locations
2. **Predicts** future demand using machine learning with confidence intervals
3. **Recommends** optimal order quantities accounting for safety stock
4. **Adapts** to multiple scenarios (conservative to aggressive demand)
5. **Monitors** forecast accuracy and model health in real-time

Business users interact through an **intuitive web dashboard** that requires zero data science expertise. Operations teams receive actionable recommendations they can trust.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                       │
│  ├── REST API Endpoints (forecast, analytics, status)  │
│  ├── Jinja2 Template Rendering (dashboard)             │
│  └── Static File Serving (CSS, JavaScript)             │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐      ┌───▼────┐      ┌───▼────┐
    │ ML      │      │ Data   │      │Metadata│
    │ Models  │      │ Layer  │      │Service │
    │(joblib) │      │(CSV)   │      │(status)│
    └─────────┘      └────────┘      └────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   Business Logic Services       │
        │  ├── Forecasting Service        │
        │  ├── Inventory Service          │
        │  ├── Confidence Service         │
        │  ├── Explanation Service        │
        │  └── Scenario Service           │
        └─────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │      Frontend Dashboard         │
        │  ├── Demand Charts              │
        │  ├── Order Recommendations      │
        │  ├── Scenario Analysis          │
        │  └── Health Monitoring          │
        └─────────────────────────────────┘
```

**Architecture Highlights:**
- **Decoupled services**: Each business function is a separate service class
- **Stateless APIs**: All state lives in CSV files and joblib models
- **Single-model serving**: One production model per deployment
- **Real-time monitoring**: Model metadata and performance metrics on-demand

---

## Machine Learning Workflow

### Training (Offline, Jupyter Notebooks)
1. **Data Exploration**: Analyze raw retail transaction data
2. **Cleaning & Aggregation**: Weekly time series for each product-store pair
3. **Feature Engineering**: Lag features (1-4 weeks), rolling averages, trend decomposition
4. **Model Comparison**: Train multiple algorithms (XGBoost, LightGBM, Ridge Regression)
5. **Selection**: Choose model with lowest MAE and stable cross-validation scores
6. **Evaluation**: Generate performance metrics (RMSE, MAE, MAPE, R²)

### Production (Runtime, FastAPI Service)
1. **Model Loading**: Joblib deserializes pre-trained model at service startup
2. **Feature Lookup**: Metadata-driven feature extraction (no hardcoding)
3. **Prediction**: Generate point forecast with confidence bounds
4. **Adjustment**: Apply business rules (safety stock, scenario multipliers)
5. **Response**: Return recommendation with explainability and risk metrics

**Why This Approach:**
- Offline training decouples data science iteration from production code
- Production code only concerns orchestration and API serving
- Model artifacts are versioned in git (joblib files, metadata CSV)
- No retraining in production (simplifies ops, improves reliability)

---

## Key Features

- **Demand Forecasting**: Weekly demand predictions with 80% and 90% confidence intervals
- **Inventory Recommendations**: Risk-adjusted order quantities balancing service level and carrying cost
- **Scenario Analysis**: Compare conservative, base, and aggressive demand scenarios
- **Forecast Explainability**: Understand which features drive each prediction
- **Confidence Scoring**: Flagged forecasts with low model confidence for manual review
- **Safety Stock Optimization**: Configurable service level targets (90%, 95%, etc.)
- **Model Health Monitoring**: Track model version, feature freshness, and performance drift
- **Lightweight Architecture**: No database—all state in CSV and joblib files
- **Production-Ready APIs**: Comprehensive error handling, request validation
- **Interactive Dashboard**: Fully self-contained static frontend (no Node.js build required)

---

## Dashboard Walkthrough

### Home Page
- **Welcome message** with current model version and last update timestamp
- **Quick stats**: Total stores, products, and forecast coverage
- **Navigation menu** to other sections

### Forecast View
- **Store and Product Selection**: Dropdown filters for store-product pair
- **Historical Chart**: 52-week historical sales with trend line
- **Forecast Display**: Next period demand with confidence interval shading
- **Metrics**: MAPE (model accuracy), service level target, recommended order quantity

### Recommendations Tab
- **Order Summary**: Current inventory, recommended order, and optimal timing
- **Risk Assessment**: Stockout probability, carrying cost impact
- **What-If Analysis**: Slider to adjust scenario (conservative ↔ aggressive)
- **Export**: Download recommendations as CSV

### Analytics Dashboard
- **Forecast Accuracy**: RMSE, MAE across all products
- **High-Risk Items**: Products with low forecast confidence or high stockout probability
- **Model Health**: Feature freshness, data quality checks
- **Trends**: YoY growth rates, seasonality patterns

### Model Status
- **Active Model**: Version, training date, algorithm type
- **Performance**: Validation metrics, cross-validation scores
- **Data Freshness**: Last update timestamp, rows processed
- **Feature List**: Input features and importance ranking

---

## Project Structure

```
retail-inventory-forecasting/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── core/
│   │   │   ├── config.py              # Configuration management
│   │   │   └── settings.yaml          # YAML settings (service level, z-score)
│   │   ├── routers/
│   │   │   ├── forecast.py            # POST /api/v1/forecast
│   │   │   ├── analytics.py           # GET /api/v1/analytics
│   │   │   ├── forecast_explain.py    # GET /api/v1/forecast/{id}/explain
│   │   │   ├── forecast_scenario.py   # POST /api/v1/forecast/scenario
│   │   │   ├── forecast_confidence.py # GET /api/v1/confidence/{product_id}
│   │   │   ├── model_status.py        # GET /api/v1/model/status
│   │   │   ├── metadata.py            # GET /api/v1/stores, /api/v1/products
│   │   │   └── health.py              # GET /api/v1/health
│   │   ├── services/
│   │   │   ├── forecasting_service.py          # Core demand prediction
│   │   │   ├── inventory_service.py            # Order calculations
│   │   │   ├── forecast_explanation_service.py # Feature importance
│   │   │   ├── scenario_service.py             # Scenario generation
│   │   │   ├── confidence_service.py           # Confidence scoring
│   │   │   └── model_status_service.py         # Metadata serving
│   │   ├── static/
│   │   │   ├── css/main.css           # Dashboard styling
│   │   │   └── js/app.js              # Dashboard interactivity
│   │   └── templates/
│   │       └── index.html             # Dashboard layout
│   └── requirements.txt                # Backend dependencies
│
├── models/
│   ├── best_model.joblib              # Production demand forecast model
│   ├── demand_forecast_model.joblib    # Alternative model (reference)
│   ├── production_model_metadata.csv   # Features, metrics, version
│   └── model_metadata.json             # Model configuration
│
├── data/
│   ├── raw/
│   │   └── retail_store_inventory.csv  # Original transaction data
│   └── processed/
│       ├── cleaned_data.csv            # Cleaned transactions
│       ├── feature_engineered_data.csv # Engineered features
│       ├── weekly_time_series.csv      # Weekly aggregations
│       └── inventory_recommendations.csv # Computed recommendations
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_data_cleaning.ipynb
│   ├── 03_weekly_aggregation.ipynb
│   ├── 04_feature_engineering.ipynb
│   ├── 05_baseline_and_model.ipynb
│   ├── 06_inventory_recommendation.ipynb
│   └── 07_model_comparison.ipynb
│
├── docs/
│   ├── persona.md                      # User personas
│   └── problem_statement.md            # Problem definition
│
└── .gitignore                          # Git configuration
```

---

## How to Run Locally

### Prerequisites
- Python 3.9+
- pip (or conda)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inventory-iq.git
   cd inventory-iq
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the FastAPI server**
   ```bash
   uvicorn backend.app.main:app --reload
   ```

5. **Access the dashboard**
   Open your browser to `http://localhost:8000`

### Verify Installation

- **Dashboard loads** at `http://localhost:8000/`
- **Health check** at `http://localhost:8000/api/v1/health`
- **Model status** at `http://localhost:8000/api/v1/model/status`
- **API documentation** at `http://localhost:8000/docs` (auto-generated Swagger UI)

---

## Deployment Overview (Render)

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Create Render Service**
   - Visit [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select Python 3.11 environment

3. **Configure Service**
   - **Name**: `inventory-iq`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Region**: Choose closest to your users
   - **Plan**: Free tier suitable for demo; paid for production

4. **Deploy**
   - Click "Create Web Service"
   - Render automatically installs dependencies and starts the app
   - Watch logs in Render dashboard

### Production Configuration

- **Environment Variables**: None required (CSV + joblib only)
- **Database**: Not used
- **Scaling**: Free tier auto-sleeps after 15 min inactivity
- **SSL**: Automatic via Render (HTTPS by default)

Your app will be live at `https://inventory-iq.onrender.com`

---

## Model & Data Details

### Input Data Format
- **Source**: CSV file with transaction-level retail data
- **Columns**: store_id, product_id, date, quantity_sold, price
- **Aggregation**: Data is aggregated to weekly level per store-product pair
- **Coverage**: Minimum 52 weeks of history required per product

### Features Used
1. **Lag Features**: Demand from 1, 2, 3, 4 weeks ago
2. **Rolling Averages**: 4-week and 8-week moving averages
3. **Trend**: Week-over-week growth rate
4. **Seasonality**: Indicators for promotional periods (if available)
5. **Derived**: Coefficient of variation, trend direction

### Model Details
- **Algorithm**: Scikit-learn regression model (tuned ensemble)
- **Target**: Weekly demand (quantity units)
- **Training Approach**: Time-series cross-validation (prevent data leakage)
- **Validation**: Hold-out test set (last 12 weeks)
- **Output**: Point forecast + confidence intervals (via quantile regression)

### Performance Metrics
- **RMSE**: Root Mean Squared Error (scale of demand units)
- **MAE**: Mean Absolute Error (scale of demand units)
- **MAPE**: Mean Absolute Percentage Error (% error)
- **R²**: Proportion of variance explained (0-1)

---

## API Endpoints (Summary)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Dashboard homepage |
| `/api/v1/health` | GET | Health check (deployment verification) |
| `/api/v1/forecast` | POST | Generate demand forecast + recommendation |
| `/api/v1/analytics` | GET | Aggregate metrics and insights |
| `/api/v1/model/status` | GET | Active model metadata and performance |
| `/api/v1/stores` | GET | List all store IDs in system |
| `/api/v1/products` | GET | List all product IDs in system |
| `/api/v1/forecast/{id}/explain` | GET | Feature importance for specific prediction |
| `/api/v1/forecast/scenario` | POST | Scenario analysis (conservative/base/aggressive) |
| `/api/v1/confidence/{product_id}` | GET | Forecast confidence scoring |

Full API documentation available at `/docs` when running locally.

---

## Production Readiness Highlights

✓ **Robust Error Handling**: All service classes validate inputs and gracefully handle missing data  
✓ **Metadata-Driven Logic**: Feature lists and model config loaded from CSV (no hardcoding)  
✓ **Safe Model Loading**: Joblib models validated at startup; startup warnings if missing  
✓ **Stateless Design**: No in-memory state; all persistence via git-tracked files  
✓ **Type Hints**: Full Pydantic validation on all API inputs  
✓ **Logging**: Structured startup logs for debugging deployment issues  
✓ **CORS Support**: APIs callable from external dashboards (if needed)  
✓ **Static Asset Handling**: CSS/JS served by FastAPI with proper caching headers  
✓ **Template Safety**: Jinja2 auto-escaping enabled (XSS protection)  
✓ **Version Control**: Models and metadata versioned in git for reproducibility  

---

## Future Improvements

- **Auto-retraining pipeline**: Schedule weekly model retraining based on new data
- **Multi-model ensemble**: Weight predictions from multiple models for better accuracy
- **Demand shaping analytics**: Recommend pricing or promotions to influence demand
- **Supply chain integration**: API hooks to ERP and fulfillment systems
- **Advanced scenarios**: Stress testing (supply disruptions, demand spikes)
- **Mobile dashboard**: React Native app for on-the-go decision making
- **Anomaly detection**: Flag unusual demand patterns for investigation
- **Forecast comparison**: Track actual vs. predicted, visualize performance over time

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **Web Framework** | FastAPI 0.104+ |
| **ASGI Server** | Uvicorn with Gunicorn workers |
| **ML Library** | Scikit-learn 1.8+ |
| **Model Serialization** | Joblib 1.5+ |
| **Data Processing** | Pandas 2.3+, NumPy 2.3+ |
| **Template Engine** | Jinja2 3.1+ |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Configuration** | YAML (PyYAML 6.0+) |
| **Deployment** | Render (Cloud) or Docker (On-prem) |

---

## License

This project is proprietary software. All rights reserved.

---

## Author

**Samragya**  
Retail Analytics & ML Engineering

For questions or collaboration opportunities, please contact via GitHub Issues.

---

## Acknowledgments

- Retail inventory data sourced from transaction logs
- Model development and validation performed using Jupyter notebooks
- Dashboard UI inspired by best practices in operational intelligence platforms
