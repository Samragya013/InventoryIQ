from pathlib import Path
import joblib


def try_load(path: Path) -> None:
    print(f"\n== {path}")
    try:
        model = joblib.load(path)
        print("Loaded:", type(model))
    except Exception as exc:
        print("FAILED:", repr(exc))


if __name__ == "__main__":
    base = Path(__file__).resolve().parents[1]
    candidates = [
        base / "models" / "best_model.joblib",
        base / "models" / "demand_forecast_model.joblib",
    ]

    for p in candidates:
        try_load(p)
