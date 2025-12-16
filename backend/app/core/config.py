import yaml
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / "settings.yaml", "r") as f:
    settings = yaml.safe_load(f)

SERVICE_LEVEL = settings.get("service_level", 0.9)
Z_SCORE = settings.get("z_score", 1.65)
