# Origin: v8 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate voiceover using Cartesia Sonic 3 TTS API.

Cartesia Sonic 3:
  - 42 languages, ultra-realistic, ~90ms first-byte latency
  - Emotion, speed, and volume controls via generation_config
  - API docs: https://docs.cartesia.ai/api-reference/tts/bytes

Set CARTESIA_API_KEY in your .env file.
"""

import json
import os
import shutil
import sys
from pathlib import Path

try:
    import httpx
except ImportError:
    print("Install httpx:  pip install httpx")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CARTESIA_BASE_URL = "https://api.cartesia.ai"
CARTESIA_API_VERSION = "2025-04-16"
MODEL_ID = "sonic-3"

OUTPUT_FORMAT = {
    "container": "mp3",
    "sample_rate": 44100,
    "bit_rate": 128000,
}

# ---------------------------------------------------------------------------
# Narration — imported from the main generate_voiceover.py
# ---------------------------------------------------------------------------

from generate_voiceover import FULL_NARRATION

# ---------------------------------------------------------------------------
# Voice matrix: each entry generates one audio file
#
# Voices discovered in our Cartesia account:
#   - Riya - College Roommate (hi, feminine, friendly/playful)
#   - Arushi - Hinglish Speaker (hi, feminine, bilingual)
#   - Brooke - Big Sister (en, feminine, confident)
#   - Jacqueline - Reassuring Agent (en, feminine, confident/empathic)
# ---------------------------------------------------------------------------

VOICE_TAKES = [
    # Indian voices — primary candidates
    {
        "voice_name": "Riya",
        "voice_id": "faf0731e-dfb9-4cfc-8119-259a79b27e12",
        "language": "en",  # English script, Indian voice
        "emotion": "confident",
        "speed": 0.9,
        "label": "riya_confident",
    },
    {
        "voice_name": "Riya",
        "voice_id": "faf0731e-dfb9-4cfc-8119-259a79b27e12",
        "language": "en",
        "emotion": "enthusiastic",
        "speed": 0.95,
        "label": "riya_enthusiastic",
    },
    {
        "voice_name": "Arushi",
        "voice_id": "95d51f79-c397-46f9-b49a-23763d3eaa2d",
        "language": "en",
        "emotion": "confident",
        "speed": 0.9,
        "label": "arushi_confident",
    },
    {
        "voice_name": "Arushi",
        "voice_id": "95d51f79-c397-46f9-b49a-23763d3eaa2d",
        "language": "en",
        "emotion": "determined",
        "speed": 0.95,
        "label": "arushi_determined",
    },
    # English voices — for comparison (confident female narrators)
    {
        "voice_name": "Brooke",
        "voice_id": "e07c00bc-4134-4eae-9ea4-1a55fb45746b",
        "language": "en",
        "emotion": "confident",
        "speed": 0.9,
        "label": "brooke_confident",
    },
    {
        "voice_name": "Jacqueline",
        "voice_id": "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        "language": "en",
        "emotion": "confident",
        "speed": 0.9,
        "label": "jacqueline_confident",
    },
]


def load_env():
    """Load .env from video-production directory."""
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and value and key not in os.environ:
                        os.environ[key] = value


def api_headers(api_key: str) -> dict:
    return {
        "X-API-Key": api_key,
        "Cartesia-Version": CARTESIA_API_VERSION,
        "Content-Type": "application/json",
    }


def generate_tts(
    api_key: str,
    transcript: str,
    voice_id: str,
    output_path: Path,
    emotion: str = "confident",
    speed: float = 1.0,
    volume: float = 1.0,
    language: str = "en",
) -> Path:
    """Generate TTS audio bytes via Cartesia Sonic 3."""
    url = f"{CARTESIA_BASE_URL}/tts/bytes"

    payload = {
        "model_id": MODEL_ID,
        "transcript": transcript,
        "voice": {"mode": "id", "id": voice_id},
        "language": language,
        "output_format": OUTPUT_FORMAT,
        "generation_config": {
            "speed": speed,
            "volume": volume,
            "emotion": emotion,
        },
    }

    headers = api_headers(api_key)

    print(f"  Generating audio ({len(transcript)} chars, emotion={emotion}, speed={speed}, lang={language})...")

    with httpx.Client(timeout=300.0) as client:
        resp = client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(resp.content)
        size_kb = len(resp.content) / 1024
        print(f"  Saved: {output_path.name} ({size_kb:.0f} KB)")

    return output_path


def main():
    load_env()

    api_key = os.getenv("CARTESIA_API_KEY")
    if not api_key:
        print("=" * 70)
        print("ERROR: CARTESIA_API_KEY not found.")
        print()
        print("Add to your .env file:")
        print("  CARTESIA_API_KEY=your_key_here")
        env_path = Path(__file__).parent.parent.parent / ".env"
        print(f"  .env location: {env_path}")
        print("=" * 70)
        sys.exit(1)

    output_dir = Path(__file__).parent.parent / "remotion" / "public" / "voiceover"
    output_dir.mkdir(parents=True, exist_ok=True)

    script_words = len(FULL_NARRATION.split())
    print(f"\n{'='*70}")
    print(f"Cartesia Sonic 3 — Voice Generation")
    print(f"{'='*70}")
    print(f"Script: {len(FULL_NARRATION)} chars, ~{script_words} words")
    print(f"Model: {MODEL_ID}")
    print(f"Takes: {len(VOICE_TAKES)}")
    print(f"Output: {output_dir}")
    print()

    generated = []

    for i, take in enumerate(VOICE_TAKES, 1):
        label = take["label"]
        filename = f"voice_test_cartesia_{label}.mp3"
        output_path = output_dir / filename

        print(f"[{i}/{len(VOICE_TAKES)}] {take['voice_name']} — {label}")
        try:
            generate_tts(
                api_key=api_key,
                transcript=FULL_NARRATION,
                voice_id=take["voice_id"],
                output_path=output_path,
                emotion=take["emotion"],
                speed=take["speed"],
                language=take["language"],
            )
            generated.append((label, output_path))
        except httpx.HTTPStatusError as e:
            error_text = e.response.text[:300] if e.response.text else "No body"
            print(f"  FAILED ({e.response.status_code}): {error_text}")
        except Exception as e:
            print(f"  FAILED: {e}")
        print()

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("=" * 70)
    print("RESULTS")
    print("=" * 70)

    if generated:
        print(f"\nGenerated {len(generated)} file(s):\n")
        for label, path in generated:
            size_kb = path.stat().st_size / 1024
            print(f"  [{label}] {path.name} ({size_kb:.0f} KB)")

        print("\nMeasure durations with:")
        for label, path in generated:
            print(f"  ffprobe -v error -show_entries format=duration -of csv=p=0 \"{path}\"")
    else:
        print("\nNo files generated. Check the errors above.")

    print()


if __name__ == "__main__":
    main()
