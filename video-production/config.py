"""
Shared configuration and constants for the video production pipeline.

Loads API keys from environment variables and defines common paths.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ---------- Directories ----------
# All paths are relative to this file's directory
PROJECT_DIR = Path(__file__).parent.resolve()
ASSETS_DIR = PROJECT_DIR / "assets"
OUTPUT_DIR = PROJECT_DIR / "output"

# Create directories on import
ASSETS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------- API Keys ----------
ELEVENLABS_API_KEY: str = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID: str = os.environ.get("ELEVENLABS_VOICE_ID", "1qEiC6qsybMkmnNdVMbK")

HEYGEN_API_KEY: str = os.environ.get("HEYGEN_API_KEY", "")

DID_API_KEY: str = os.environ.get("DID_API_KEY", "")

RUNWAY_API_KEY: str = os.environ.get("RUNWAY_API_KEY", "")

# ---------- Tara Assets ----------
TARA_MASCOT_SQUARE = Path(
    os.environ.get(
        "TARA_MASCOT_SQUARE",
        "/Users/sachinsharma/Downloads/tara-neurolink-square.png",
    )
)
TARA_MASCOT_PORTRAIT = Path(
    os.environ.get(
        "TARA_MASCOT_PORTRAIT",
        "/Users/sachinsharma/Downloads/tara-neurolink.png",
    )
)

# Screenshot directory for screen recording scenes
SCREENSHOT_DIR = Path(
    os.environ.get(
        "SCREENSHOT_DIR",
        "/Users/sachinsharma/Desktop",
    )
)

# ---------- Video Specs ----------
VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080
VIDEO_FPS = 24
VIDEO_BITRATE = "8000k"
VIDEO_CODEC = "libx264"


def validate_config() -> list[str]:
    """
    Validate that required configuration is present.

    Returns a list of warnings/errors. Empty list means all good.
    """
    issues: list[str] = []

    if not ELEVENLABS_API_KEY:
        issues.append("ELEVENLABS_API_KEY not set — voiceover generation will fail")
    if not DID_API_KEY:
        issues.append("DID_API_KEY not set — avatar generation will fail")
    if not RUNWAY_API_KEY:
        issues.append("RUNWAY_API_KEY not set — B-roll generation will fail")
    if not TARA_MASCOT_SQUARE.exists():
        issues.append(f"Tara mascot image not found: {TARA_MASCOT_SQUARE}")

    return issues
