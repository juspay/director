#!/usr/bin/env python3
# Origin: v2 — extracted to library on 2026-03-23
"""Generate background music for TARA Video v2 using ElevenLabs Sound Generation API."""

import os
import subprocess
import sys
from pathlib import Path

try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx")
    sys.exit(1)

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"


def generate_music(api_key: str, output_path: Path) -> None:
    """Generate a 22-second background music clip."""
    url = f"{ELEVENLABS_BASE_URL}/sound-generation"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": (
            "Modern warm ambient background music for a tech product video. "
            "Soft synthesizer pads with gentle percussion. "
            "Starts quiet, builds subtly through the middle, "
            "resolves warmly at the end. "
            "Clean, professional, inspiring. No vocals. "
            "Think Figma or Stripe product video music."
        ),
        "duration_seconds": 22.0,
    }

    print("🎵 Generating background music (22s clip)...")
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        size_kb = len(response.content) / 1024
        print(f"  ✓ Music saved: {output_path.name} ({size_kb:.0f} KB)")


def loop_music(input_path: Path, output_path: Path, target_seconds: int = 160) -> None:
    """Loop the 22s clip to cover the full video duration."""
    loops = (target_seconds // 22) + 1
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", str(loops),
        "-i", str(input_path),
        "-t", str(target_seconds),
        "-c", "copy",
        str(output_path),
    ]
    print(f"  Looping to {target_seconds}s ({loops} loops)...")
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"  ✓ Looped music: {output_path.name}")


def main():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("ERROR: Set ELEVENLABS_API_KEY environment variable")
        sys.exit(1)

    music_dir = Path(__file__).parent / "remotion" / "public" / "music"
    music_dir.mkdir(parents=True, exist_ok=True)

    raw_path = music_dir / "background_music.mp3"
    looped_path = music_dir / "background_music_looped.mp3"

    generate_music(api_key, raw_path)
    loop_music(raw_path, looped_path, target_seconds=160)

    print("\n✅ Music generation complete!")
    print(f"  Raw:    {raw_path}")
    print(f"  Looped: {looped_path}")


if __name__ == "__main__":
    main()
