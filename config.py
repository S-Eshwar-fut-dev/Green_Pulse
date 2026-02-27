"""
RouteZero Configuration Module.

Centralizes all path resolution, environment variables, and constants
for both Docker-containerized (Pathway) and native (FastAPI/Next.js) runtimes.

Environment Variables:
    GEMINI_API_KEY: Required. Google AI Studio API key for Gemini 1.5 Pro.
    TMP_DIR: Override for shared volume path. Defaults to ./tmp.
    DEMO_MODE: Set to 1 to use pre-recorded demo data. Defaults to 0.
    LOG_LEVEL: Logging verbosity. Defaults to INFO.
"""

import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ── Base paths ──────────────────────────────────────────────────────────────
ROOT_DIR: Path = Path(__file__).parent.resolve()
TMP_DIR: Path = Path(os.environ.get("TMP_DIR", str(ROOT_DIR / "tmp")))
DATA_DIR: Path = ROOT_DIR / "data"

# ── Runtime flags ────────────────────────────────────────────────────────────
DEMO_MODE: bool = os.environ.get("DEMO_MODE", "0") == "1"
LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")

# ── API keys ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY: Optional[str] = os.environ.get("GEMINI_API_KEY")

# ── Streaming configuration ───────────────────────────────────────────────────
TELEMETRY_INTERVAL_SEC: float = 2.0
TUMBLING_WINDOW_SEC: int = 300    # 5-minute CO₂ windows
SLIDING_WINDOW_SEC: int = 1800    # 30-minute rolling baseline

# ── Alert thresholds ──────────────────────────────────────────────────────────
EMISSION_SPIKE_MULTIPLIER: float = 2.0   # Alert if 5-min avg > 2× 30-min baseline
COLD_CHAIN_TEMP_SLA_C: float = -18.0     # ASHRAE standard for frozen cargo
ROUTE_DEVIATION_THRESHOLD_KM: float = 2.0

# ── Output paths ──────────────────────────────────────────────────────────────
FLEET_SUMMARY_PATH: Path = TMP_DIR / "fleet_summary.jsonl"
ETA_SUMMARY_PATH: Path = TMP_DIR / "eta_summary.jsonl"

# ── Policy document paths ──────────────────────────────────────────────────────
NLP_2022_PATH: Path = DATA_DIR / "nlp_2022_summary.txt"
IPCC_AR6_PATH: Path = DATA_DIR / "ipcc_ar6_factors.txt"
BEE_ICM_PATH: Path = DATA_DIR / "bee_icm_guidelines.txt"


def ensure_directories() -> None:
    """Create required runtime directories if they don't exist."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Runtime directories verified. TMP_DIR={TMP_DIR}")


if GEMINI_API_KEY is None:
    logger.warning("GEMINI_API_KEY not set — RouteZero AI will use fallback cached responses.")
