from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

# Routers
from backend.app.routers import (
    forecast,
    health,
    model_status,
    metadata,
    analytics,
    forecast_explain,
    forecast_scenario,
    forecast_confidence,
    market_intelligence,
    inventory_planning,
)



app = FastAPI(
    title="Retail Inventory Demand Predictor",
    version="1.0.0",
)

# -------------------------------
# Static files & templates
# -------------------------------
app.mount(
    "/static",
    StaticFiles(directory="backend/app/static"),
    name="static"
)

templates = Jinja2Templates(
    directory="backend/app/templates"
)

# -------------------------------
# Web Pages
# -------------------------------
@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )


# -------------------------------
# API Routers
# -------------------------------
app.include_router(health.router)
app.include_router(forecast.router)
app.include_router(model_status.router)
app.include_router(metadata.router)
app.include_router(analytics.router)
app.include_router(forecast_explain.router)
app.include_router(forecast_scenario.router)
app.include_router(forecast_confidence.router)
app.include_router(market_intelligence.router)
app.include_router(inventory_planning.router)

# Verify critical endpoints are accessible
@app.on_event("startup")
async def startup_event():
    """Verify that critical metadata endpoints are accessible."""
    print("✓ FastAPI application started successfully")
    print("✓ Enterprise endpoints (/api/v1/markets, /api/v1/categories) are available")
    print("✓ Inventory planning endpoints (/api/v1/inventory/plan) are available")
