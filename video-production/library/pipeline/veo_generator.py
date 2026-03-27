#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
Google Veo 3.1 video generation via Gemini API.

Veo 3.1 is the #2 ranked video generation model (Elo 1,226) with native 4K
resolution and synchronized audio generation. Accessible through the
existing Gemini API setup — no additional credentials needed.

Usage:
    from veo_generator import generate_clip
    clip = await generate_clip("A team collaborating in a modern office, warm amber tones")

API docs: https://ai.google.dev/gemini-api/docs/video
"""

import asyncio
import logging
import os
import time
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", os.environ.get("VERTEX_PROJECT", ""))
LOCATION = os.environ.get("GOOGLE_VERTEX_LOCATION", "us-east5")

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "broll" / "veo"

# Veo 3.1 configuration
VEO_MODEL = "veo-3.1"
DEFAULT_DURATION = 5  # seconds
DEFAULT_ASPECT_RATIO = "16:9"


async def generate_clip(
    prompt: str,
    output_path: Path | str | None = None,
    duration: int = DEFAULT_DURATION,
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    negative_prompt: str = "",
    generate_audio: bool = True,
    seed: int | None = None,
) -> Path:
    """Generate a video clip using Google Veo 3.1 via Gemini API.

    Args:
        prompt: Text description of the desired video.
        output_path: Where to save. Auto-generated if None.
        duration: Duration in seconds (5 or 8).
        aspect_ratio: "16:9", "9:16", or "1:1".
        negative_prompt: What to avoid.
        generate_audio: Whether to generate synchronized audio (Veo 3.1 feature).
        seed: Random seed for reproducibility.

    Returns:
        Path to the generated video file.
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("google-genai not installed. Run: pip install google-genai")

    if not PROJECT:
        raise ValueError("GOOGLE_CLOUD_PROJECT not set in environment")

    if output_path is None:
        safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in prompt[:40])
        safe_name = safe_name.strip().replace(" ", "_").lower()
        output_path = OUTPUT_DIR / f"veo_{safe_name}_{duration}s.mp4"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

    logger.info(f"[Veo] Generating: '{prompt[:60]}...' ({duration}s, {aspect_ratio})")

    config = {
        "number_of_videos": 1,
        "duration_seconds": duration,
        "aspect_ratio": aspect_ratio,
        "generate_audio": generate_audio,
    }

    if negative_prompt:
        config["negative_prompt"] = negative_prompt
    if seed is not None:
        config["seed"] = seed

    # Submit generation
    operation = client.models.generate_videos(
        model=VEO_MODEL,
        prompt=prompt,
        config=config,
    )

    logger.info(f"[Veo] Generation submitted, polling for completion...")

    # Poll for completion
    while not operation.done:
        await asyncio.sleep(10)
        operation = client.operations.get(operation)
        logger.info(f"[Veo] Status: {'done' if operation.done else 'processing'}...")

    # Download result
    if operation.result and operation.result.generated_videos:
        video = operation.result.generated_videos[0]

        # Download video data
        video_data = client.files.download(file=video.video)
        output_path.write_bytes(video_data)

        size_mb = output_path.stat().st_size / 1024 / 1024
        logger.info(f"[Veo] Saved: {output_path} ({size_mb:.1f} MB)")
        return output_path
    else:
        raise RuntimeError(f"Veo generation produced no output: {operation.result}")


async def generate_variants(
    prompt: str,
    num_variants: int = 3,
    output_dir: Path | None = None,
    **kwargs,
) -> list[Path]:
    """Generate multiple variants sequentially for A/B comparison."""
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for i in range(num_variants):
        variant_path = out_dir / f"variant_{i+1}.mp4"
        if variant_path.exists():
            logger.info(f"[Veo] Variant {i+1} exists, skipping")
            paths.append(variant_path)
            continue

        try:
            path = await generate_clip(prompt, output_path=variant_path, seed=i * 1000, **kwargs)
            paths.append(path)
        except Exception as e:
            logger.error(f"[Veo] Variant {i+1} failed: {e}")

    return paths


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Veo 3.1 video generator")
    parser.add_argument("prompt", help="Video description prompt")
    parser.add_argument("--duration", type=int, default=5, choices=[5, 8])
    parser.add_argument("--aspect-ratio", default="16:9", choices=["16:9", "9:16", "1:1"])
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--no-audio", action="store_true", help="Disable audio generation")
    parser.add_argument("--variants", type=int, default=1, help="Number of variants")
    args = parser.parse_args()

    if args.variants > 1:
        asyncio.run(generate_variants(args.prompt, args.variants,
                                       duration=args.duration, aspect_ratio=args.aspect_ratio,
                                       generate_audio=not args.no_audio))
    else:
        asyncio.run(generate_clip(args.prompt, output_path=args.output,
                                   duration=args.duration, aspect_ratio=args.aspect_ratio,
                                   generate_audio=not args.no_audio))
