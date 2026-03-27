#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
Kling 3.0 B-roll video generation.

4K/60fps output at $0.029/sec (vs $0.12/sec for Runway Gen-4.5) — 75% cost
reduction. Supports multi-shot character lock across 6 cuts.

Usage:
    from kling_generator import generate_clip
    clip = await generate_clip("A developer coding at night, amber glow", duration=5)

Note: Kling does not have an official first-party API as of early 2026.
This uses third-party API providers (PiAPI, fal.ai, or similar) that
expose Kling generation capabilities. Update the base URL and auth
when official API becomes available.

API providers:
- PiAPI: https://piapi.ai/kling-api
- fal.ai: https://fal.ai/models/kling
"""

import asyncio
import logging
import os
import time
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

KLING_API_KEY = os.environ.get("KLING_API_KEY", "")
KLING_API_BASE = os.environ.get("KLING_API_BASE", "https://api.piapi.ai/api/kling/v1")

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "broll" / "kling"

# Kling 3.0 supports these resolutions
RESOLUTIONS = {
    "1080p": {"width": 1920, "height": 1080},
    "4k": {"width": 3840, "height": 2160},
    "720p": {"width": 1280, "height": 720},
    "vertical": {"width": 1080, "height": 1920},
    "square": {"width": 1080, "height": 1080},
}


async def generate_clip(
    prompt: str,
    output_path: Path | str | None = None,
    duration: int = 5,
    resolution: str = "1080p",
    negative_prompt: str = "",
    seed: int | None = None,
) -> Path:
    """Generate a video clip using Kling 3.0.

    Args:
        prompt: Text description of the desired video.
        output_path: Where to save. Auto-generated if None.
        duration: Clip duration in seconds (5 or 10).
        resolution: One of: 1080p, 4k, 720p, vertical, square.
        negative_prompt: What to avoid in the generation.
        seed: Random seed for reproducibility.

    Returns:
        Path to the generated video file.
    """
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed. Run: pip install httpx")

    if not KLING_API_KEY:
        raise ValueError("KLING_API_KEY not set in environment")

    if output_path is None:
        safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in prompt[:40])
        safe_name = safe_name.strip().replace(" ", "_").lower()
        output_path = OUTPUT_DIR / f"kling_{safe_name}_{duration}s.mp4"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    res = RESOLUTIONS.get(resolution, RESOLUTIONS["1080p"])

    headers = {
        "Authorization": f"Bearer {KLING_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "kling-v3",
        "prompt": prompt,
        "duration": duration,
        "width": res["width"],
        "height": res["height"],
    }

    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    if seed is not None:
        payload["seed"] = seed

    logger.info(f"[Kling] Generating: '{prompt[:60]}...' ({duration}s, {resolution})")

    async with httpx.AsyncClient(timeout=600.0) as client:
        # Submit generation task
        response = await client.post(
            f"{KLING_API_BASE}/videos/generations",
            json=payload,
            headers=headers,
        )

        if response.status_code not in (200, 201, 202):
            logger.error(f"[Kling] Submit error {response.status_code}: {response.text[:300]}")
            raise RuntimeError(f"Kling API returned {response.status_code}")

        result = response.json()
        task_id = result.get("data", {}).get("task_id") or result.get("task_id") or result.get("id")

        if not task_id:
            raise RuntimeError(f"No task_id in response: {result}")

        logger.info(f"[Kling] Task submitted: {task_id}")

        # Poll for completion
        video_url = await _poll_task(client, task_id, headers)

        # Download video
        logger.info(f"[Kling] Downloading video...")
        video_response = await client.get(video_url, timeout=120.0)
        output_path.write_bytes(video_response.content)

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[Kling] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


async def _poll_task(client, task_id: str, headers: dict, timeout: int = 600) -> str:
    """Poll Kling API for task completion. Returns video URL."""
    start = time.time()
    poll_interval = 5

    while time.time() - start < timeout:
        response = await client.get(
            f"{KLING_API_BASE}/videos/generations/{task_id}",
            headers=headers,
        )

        if response.status_code != 200:
            logger.warning(f"[Kling] Poll error {response.status_code}")
            await asyncio.sleep(poll_interval)
            continue

        result = response.json()
        data = result.get("data", result)
        status = data.get("status", data.get("state", ""))

        if status in ("completed", "succeed", "done"):
            video_url = (
                data.get("video_url")
                or data.get("output", {}).get("video_url")
                or data.get("results", [{}])[0].get("url", "")
            )
            if video_url:
                return video_url
            raise RuntimeError(f"Completed but no video URL: {data}")

        if status in ("failed", "error"):
            raise RuntimeError(f"Kling generation failed: {data.get('error', data)}")

        elapsed = int(time.time() - start)
        logger.info(f"[Kling] Status: {status} ({elapsed}s elapsed)")
        await asyncio.sleep(poll_interval)

    raise TimeoutError(f"Kling generation timed out after {timeout}s")


async def generate_variants(
    prompt: str,
    num_variants: int = 3,
    output_dir: Path | None = None,
    **kwargs,
) -> list[Path]:
    """Generate multiple variants of the same prompt for selection."""
    out_dir = output_dir or OUTPUT_DIR
    paths = []

    tasks = []
    for i in range(num_variants):
        variant_path = out_dir / f"variant_{i+1}.mp4"
        if variant_path.exists():
            logger.info(f"[Kling] Variant {i+1} exists, skipping")
            paths.append(variant_path)
            continue
        tasks.append(generate_clip(prompt, output_path=variant_path, seed=i * 1000, **kwargs))

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Path):
                paths.append(r)
            elif isinstance(r, Exception):
                logger.error(f"[Kling] Variant failed: {r}")

    return paths


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Kling 3.0 video generator")
    parser.add_argument("prompt", help="Video description prompt")
    parser.add_argument("--duration", type=int, default=5, choices=[5, 10])
    parser.add_argument("--resolution", default="1080p", choices=list(RESOLUTIONS.keys()))
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--variants", type=int, default=1, help="Number of variants")
    args = parser.parse_args()

    if args.variants > 1:
        asyncio.run(generate_variants(args.prompt, args.variants,
                                       duration=args.duration, resolution=args.resolution))
    else:
        asyncio.run(generate_clip(args.prompt, output_path=args.output,
                                   duration=args.duration, resolution=args.resolution))
