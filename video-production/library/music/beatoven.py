#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Beatoven.ai music generation API integration.

Supports text-to-music and video-to-music with scene markers for mood shifts.
Scene markers map directly to our existing act/scene structure.

Key features:
- Text prompt → music track
- Video upload → automatically scored soundtrack
- Per-timestamp mood/energy markers for section-level control
- Fine-tune instruments, tempo, genre post-generation

Pricing: $100-200/yr (Creator/Visionary), $3/min a la carte.
Lifetime non-exclusive license for all generated music.

API docs: https://www.beatoven.ai/api
"""

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

BEATOVEN_API_KEY = os.environ.get("BEATOVEN_API_KEY", "")
BEATOVEN_API_BASE = "https://api.beatoven.ai/v1"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "music" / "beatoven"

# Supported moods for scene markers
MOODS = [
    "happy", "sad", "angry", "calm", "energetic", "mysterious",
    "romantic", "epic", "dark", "hopeful", "tense", "triumphant",
    "contemplative", "playful", "dramatic", "serene",
]

# Supported genres
GENRES = [
    "cinematic", "electronic", "ambient", "corporate", "indie",
    "classical", "jazz", "lo-fi", "pop", "rock",
]


async def generate_from_text(
    prompt: str,
    duration_seconds: int = 170,
    genre: str = "cinematic",
    mood: str = "contemplative",
    tempo: int = 80,
    scene_markers: list[dict] | None = None,
    output_path: Path | str | None = None,
) -> Path:
    """Generate music from a text prompt with optional scene markers.

    Args:
        prompt: Description of desired music.
        duration_seconds: Target duration.
        genre: Music genre (cinematic, electronic, ambient, etc.).
        mood: Overall mood (contemplative, energetic, triumphant, etc.).
        tempo: BPM.
        scene_markers: List of dicts for per-section mood control:
            [{"time": 0, "mood": "contemplative"}, {"time": 55, "mood": "energetic"}]
        output_path: Where to save. Auto-generated if None.

    Returns:
        Path to the generated audio file.
    """
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed. Run: pip install httpx")

    if not BEATOVEN_API_KEY:
        raise ValueError("BEATOVEN_API_KEY not set in environment")

    if output_path is None:
        output_path = OUTPUT_DIR / f"beatoven_{genre}_{duration_seconds}s.mp3"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    headers = {
        "Authorization": f"Bearer {BEATOVEN_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": prompt,
        "duration": duration_seconds,
        "genre": genre,
        "mood": mood,
        "tempo": tempo,
    }

    if scene_markers:
        payload["scene_markers"] = scene_markers

    logger.info(f"[Beatoven] Generating: {genre}, {mood}, {tempo} BPM, {duration_seconds}s")
    if scene_markers:
        logger.info(f"[Beatoven] {len(scene_markers)} scene markers")

    async with httpx.AsyncClient(timeout=600.0) as client:
        # Submit generation
        response = await client.post(
            f"{BEATOVEN_API_BASE}/tracks/generate",
            json=payload,
            headers=headers,
        )

        if response.status_code not in (200, 201, 202):
            logger.error(f"[Beatoven] API error {response.status_code}: {response.text[:300]}")
            raise RuntimeError(f"Beatoven API returned {response.status_code}")

        result = response.json()
        track_id = result.get("track_id") or result.get("id")

        if not track_id:
            raise RuntimeError(f"No track_id in response: {result}")

        logger.info(f"[Beatoven] Track submitted: {track_id}")

        # Poll for completion
        download_url = await _poll_track(client, track_id, headers)

        # Download
        audio_response = await client.get(download_url, timeout=120.0)
        output_path.write_bytes(audio_response.content)

    size_kb = output_path.stat().st_size / 1024
    logger.info(f"[Beatoven] Saved: {output_path} ({size_kb:.0f} KB)")
    return output_path


async def generate_from_video(
    video_path: str | Path,
    genre: str = "cinematic",
    output_path: Path | str | None = None,
) -> Path:
    """Generate music scored to match a video's visual pacing.

    Beatoven analyzes the video content and generates a soundtrack
    that matches visual transitions, energy, and mood.

    Args:
        video_path: Path to the video file.
        genre: Desired music genre.
        output_path: Where to save the music.

    Returns:
        Path to the generated audio file.
    """
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed")

    if not BEATOVEN_API_KEY:
        raise ValueError("BEATOVEN_API_KEY not set")

    video_path = Path(video_path)
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    if output_path is None:
        output_path = OUTPUT_DIR / f"beatoven_scored_{video_path.stem}.mp3"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    headers = {"Authorization": f"Bearer {BEATOVEN_API_KEY}"}

    logger.info(f"[Beatoven] Video-to-music: {video_path.name} ({genre})")

    async with httpx.AsyncClient(timeout=600.0) as client:
        # Upload video with multipart form
        files = {"video": (video_path.name, video_path.read_bytes(), "video/mp4")}
        data = {"genre": genre}

        response = await client.post(
            f"{BEATOVEN_API_BASE}/tracks/generate-from-video",
            files=files,
            data=data,
            headers=headers,
        )

        if response.status_code not in (200, 201, 202):
            logger.error(f"[Beatoven] Upload error {response.status_code}: {response.text[:300]}")
            raise RuntimeError(f"Beatoven API returned {response.status_code}")

        result = response.json()
        track_id = result.get("track_id") or result.get("id")

        logger.info(f"[Beatoven] Video uploaded, track: {track_id}")

        download_url = await _poll_track(client, track_id, headers)

        audio_response = await client.get(download_url, timeout=120.0)
        output_path.write_bytes(audio_response.content)

    size_kb = output_path.stat().st_size / 1024
    logger.info(f"[Beatoven] Saved: {output_path} ({size_kb:.0f} KB)")
    return output_path


async def _poll_track(client, track_id: str, headers: dict, timeout: int = 300) -> str:
    """Poll Beatoven API for track completion. Returns download URL."""
    start = time.time()

    while time.time() - start < timeout:
        response = await client.get(
            f"{BEATOVEN_API_BASE}/tracks/{track_id}",
            headers=headers,
        )

        if response.status_code != 200:
            await asyncio.sleep(5)
            continue

        result = response.json()
        status = result.get("status", "")

        if status in ("completed", "ready", "done"):
            url = result.get("download_url") or result.get("audio_url")
            if url:
                return url
            raise RuntimeError(f"Track ready but no download URL: {result}")

        if status in ("failed", "error"):
            raise RuntimeError(f"Beatoven generation failed: {result.get('error', result)}")

        elapsed = int(time.time() - start)
        logger.info(f"[Beatoven] Status: {status} ({elapsed}s)")
        await asyncio.sleep(5)

    raise TimeoutError(f"Beatoven generation timed out after {timeout}s")


def build_scene_markers_from_config(scenes: list[dict]) -> list[dict]:
    """Convert pipeline scene config to Beatoven scene markers.

    Takes a list of scene dicts (like from scenes_schema.json) and converts
    to Beatoven's marker format. Each scene should have:
        - "start_time": float (seconds)
        - "mood": str (one of MOODS)
        - "energy": float (0.0 to 1.0, optional)

    Example:
        scenes = [
            {"start_time": 0, "mood": "contemplative", "energy": 0.3},
            {"start_time": 55, "mood": "energetic", "energy": 0.8},
        ]
    """
    markers = []
    for scene in scenes:
        marker = {
            "time": scene["start_time"],
            "mood": scene.get("mood", "calm"),
        }
        if "energy" in scene:
            marker["energy"] = scene["energy"]
        markers.append(marker)
    return markers


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Beatoven.ai music generator")
    subparsers = parser.add_subparsers(dest="command")

    text_parser = subparsers.add_parser("text", help="Generate from text prompt")
    text_parser.add_argument("prompt", help="Music description")
    text_parser.add_argument("--duration", type=int, default=170)
    text_parser.add_argument("--genre", default="cinematic", choices=GENRES)
    text_parser.add_argument("--mood", default="contemplative", choices=MOODS)
    text_parser.add_argument("--tempo", type=int, default=80)
    text_parser.add_argument("--output", type=str)

    video_parser = subparsers.add_parser("video", help="Generate from video")
    video_parser.add_argument("video_path", help="Path to video file")
    video_parser.add_argument("--genre", default="cinematic", choices=GENRES)
    video_parser.add_argument("--output", type=str)

    args = parser.parse_args()

    if args.command == "text":
        asyncio.run(generate_from_text(
            prompt=args.prompt, duration_seconds=args.duration,
            genre=args.genre, mood=args.mood, tempo=args.tempo,
            output_path=args.output,
        ))
    elif args.command == "video":
        asyncio.run(generate_from_video(
            video_path=args.video_path, genre=args.genre,
            output_path=args.output,
        ))
    else:
        parser.print_help()
