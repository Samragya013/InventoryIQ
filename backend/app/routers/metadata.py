import pandas as pd
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter(prefix="/api/v1", tags=["Metadata"])

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = BASE_DIR / "data/processed/feature_engineered_data.csv"

def load_data():
    """Load data with better error handling."""
    try:
        if not DATA_PATH.exists():
            raise FileNotFoundError(f"Data file not found at {DATA_PATH}")
        
        df = pd.read_csv(DATA_PATH)
        
        if df.empty:
            raise ValueError("Data file is empty")
        
        if "store_id" not in df.columns:
            raise ValueError("store_id column not found in data")
        
        if "product_id" not in df.columns:
            raise ValueError("product_id column not found in data")
        
        return df
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Data file not found: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading data: {str(e)}"
        )

@router.get("/stores")
def get_stores():
    """Get list of unique stores from the dataset."""
    try:
        df = load_data()
        stores = sorted(df["store_id"].unique().tolist())
        
        if not stores:
            raise HTTPException(
                status_code=404,
                detail="No stores found in the dataset"
            )
        
        return stores
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving stores: {str(e)}"
        )

@router.get("/products/{store_id}")
def get_products(store_id: str):
    """Get list of unique products for a specific store."""
    try:
        df = load_data()
        products = df[df["store_id"] == store_id]["product_id"].unique()
        
        if len(products) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No products found for store: {store_id}"
            )
        
        return sorted(products.tolist())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving products: {str(e)}"
        )
