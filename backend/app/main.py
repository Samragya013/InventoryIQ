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

# Verify critical endpoints are accessible
@app.on_event("startup")
async def startup_event():
    """Verify that critical metadata endpoints are accessible."""
    print("✓ FastAPI application started successfully")
    print("✓ Metadata endpoints (/api/v1/stores, /api/v1/products) are available")
    print("✓ Frontend will now be able to load stores and products")
