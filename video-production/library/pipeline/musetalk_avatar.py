#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
MuseTalk open-source lip sync avatar generation.

Tencent's MuseTalk achieves real-time 30fps+ lip sync on GPU. Dramatically
cheaper than D-ID: ~$0.01-0.05/clip via Replicate/fal.ai vs D-ID's credit
pricing.

Supports two modes:
1. Replicate/fal.ai API (cloud, no GPU needed)
2. Local inference (GPU, zero cost per clip)

Usage:
    from musetalk_avatar import generate_lipsync

    # Via Replicate API
    video = await generate_lipsync(
        source_image="tara_portrait.png",
        audio="narration.mp3",
        mode="replicate",
    )

    # Local inference
    video = await generate_lipsync(
        source_image="tara_portrait.png",
        audio="narration.mp3",
        mode="local",
    )

GitHub: https://github.com/TMElyralab/MuseTalk
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

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
FAL_KEY = os.environ.get("FAL_KEY", "")

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "avatar" / "musetalk"

# Replicate model versions (update as new versions are published)
REPLICATE_MODEL = "cjwbw/musetalk:latest"
FAL_MODEL = "fal-ai/musetalk"


async def generate_lipsync(
    source_image: str | Path,
    audio: str | Path,
    output_path: Path | str | None = None,
    mode: str = "replicate",
    bbox_shift: int = 0,
    fps: int = 30,
) -> Path:
    """Generate lip-synced avatar video from source image + audio.

    Args:
        source_image: Path to the character/avatar image.
        audio: Path to the voiceover audio file.
        output_path: Where to save the output video.
        mode: "replicate", "fal", or "local".
        bbox_shift: Vertical face bbox adjustment (positive = lower).
        fps: Output frame rate.

    Returns:
        Path to the generated lip-synced video.
    """
    source_image = Path(source_image)
    audio = Path(audio)

    if not source_image.exists():
        raise FileNotFoundError(f"Source image not found: {source_image}")
    if not audio.exists():
        raise FileNotFoundError(f"Audio not found: {audio}")

    if output_path is None:
        output_path = OUTPUT_DIR / f"lipsync_{source_image.stem}.mp4"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"[MuseTalk] Generating lip sync: {source_image.name} + {audio.name}")
    logger.info(f"[MuseTalk] Mode: {mode}, fps: {fps}")

    if mode == "replicate":
        return await _generate_replicate(source_image, audio, output_path, bbox_shift, fps)
    elif mode == "fal":
        return await _generate_fal(source_image, audio, output_path, bbox_shift, fps)
    elif mode == "local":
        return await _generate_local(source_image, audio, output_path, bbox_shift, fps)
    else:
        raise ValueError(f"Unknown mode: {mode}. Use: replicate, fal, or local")


async def _generate_replicate(
    source_image: Path, audio: Path, output_path: Path,
    bbox_shift: int, fps: int,
) -> Path:
    """Generate via Replicate API (~$0.01-0.05/clip)."""
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed. Run: pip install httpx")

    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not set in environment")

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    # Upload files as data URIs or use URLs
    import base64
    img_b64 = base64.b64encode(source_image.read_bytes()).decode()
    audio_b64 = base64.b64encode(audio.read_bytes()).decode()

    img_mime = "image/png" if source_image.suffix == ".png" else "image/jpeg"
    audio_mime = "audio/mpeg" if audio.suffix == ".mp3" else "audio/wav"

    payload = {
        "version": REPLICATE_MODEL.split(":")[-1] if ":" in REPLICATE_MODEL else "latest",
        "input": {
            "source_image": f"data:{img_mime};base64,{img_b64}",
            "driven_audio": f"data:{audio_mime};base64,{audio_b64}",
            "bbox_shift": bbox_shift,
            "fps": fps,
        },
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        # Submit prediction
        response = await client.post(
            "https://api.replicate.com/v1/predictions",
            json=payload,
            headers=headers,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"Replicate error {response.status_code}: {response.text[:300]}")

        prediction = response.json()
        prediction_id = prediction["id"]
        logger.info(f"[MuseTalk] Replicate prediction: {prediction_id}")

        # Poll for completion
        while True:
            await asyncio.sleep(5)
            poll = await client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers=headers,
            )
            result = poll.json()
            status = result.get("status")

            if status == "succeeded":
                video_url = result["output"]
                if isinstance(video_url, list):
                    video_url = video_url[0]
                # Download video
                video_data = await client.get(video_url)
                output_path.write_bytes(video_data.content)
                break
            elif status == "failed":
                raise RuntimeError(f"MuseTalk failed: {result.get('error')}")
            else:
                logger.info(f"[MuseTalk] Status: {status}")

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[MuseTalk] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


async def _generate_fal(
    source_image: Path, audio: Path, output_path: Path,
    bbox_shift: int, fps: int,
) -> Path:
    """Generate via fal.ai API."""
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed")

    if not FAL_KEY:
        raise ValueError("FAL_KEY not set in environment")

    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }

    import base64
    img_b64 = base64.b64encode(source_image.read_bytes()).decode()
    audio_b64 = base64.b64encode(audio.read_bytes()).decode()

    payload = {
        "source_image_url": f"data:image/png;base64,{img_b64}",
        "driven_audio_url": f"data:audio/mpeg;base64,{audio_b64}",
        "bbox_shift": bbox_shift,
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(
            f"https://queue.fal.run/{FAL_MODEL}",
            json=payload,
            headers=headers,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"fal.ai error {response.status_code}: {response.text[:300]}")

        result = response.json()
        request_id = result.get("request_id")

        # Poll for completion
        while True:
            await asyncio.sleep(3)
            poll = await client.get(
                f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}/status",
                headers=headers,
            )
            status_result = poll.json()

            if status_result.get("status") == "COMPLETED":
                # Get result
                result_resp = await client.get(
                    f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}",
                    headers=headers,
                )
                final = result_resp.json()
                video_url = final.get("video", {}).get("url", "")
                if video_url:
                    video_data = await client.get(video_url)
                    output_path.write_bytes(video_data.content)
                break
            elif status_result.get("status") == "FAILED":
                raise RuntimeError(f"fal.ai failed: {status_result}")

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[MuseTalk] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


async def _generate_local(
    source_image: Path, audio: Path, output_path: Path,
    bbox_shift: int, fps: int,
) -> Path:
    """Generate locally using MuseTalk (requires GPU + cloned repo)."""
    import subprocess

    # Check if musetalk is installed
    musetalk_dir = os.environ.get("MUSETALK_DIR", "")
    if not musetalk_dir or not Path(musetalk_dir).exists():
        raise RuntimeError(
            "MUSETALK_DIR not set or not found. Clone MuseTalk:\n"
            "  git clone https://github.com/TMElyralab/MuseTalk.git\n"
            "  export MUSETALK_DIR=/path/to/MuseTalk"
        )

    logger.info(f"[MuseTalk] Local inference from {musetalk_dir}")

    cmd = [
        sys.executable, "-m", "musetalk.inference",
        "--source_image", str(source_image),
        "--driven_audio", str(audio),
        "--output", str(output_path),
        "--bbox_shift", str(bbox_shift),
        "--fps", str(fps),
    ]

    result = subprocess.run(
        cmd, capture_output=True, text=True, cwd=musetalk_dir, timeout=600,
    )

    if result.returncode != 0:
        raise RuntimeError(f"MuseTalk local inference failed: {result.stderr[:500]}")

    if not output_path.exists():
        raise RuntimeError("MuseTalk produced no output file")

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[MuseTalk] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


# Need sys for local mode subprocess
import sys


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MuseTalk lip sync avatar generator")
    parser.add_argument("--image", required=True, help="Source character image")
    parser.add_argument("--audio", required=True, help="Voiceover audio file")
    parser.add_argument("--output", help="Output video path")
    parser.add_argument("--mode", default="replicate", choices=["replicate", "fal", "local"])
    parser.add_argument("--bbox-shift", type=int, default=0, help="Face bbox vertical shift")
    parser.add_argument("--fps", type=int, default=30, help="Output frame rate")
    args = parser.parse_args()

    asyncio.run(generate_lipsync(
        source_image=args.image,
        audio=args.audio,
        output_path=args.output,
        mode=args.mode,
        bbox_shift=args.bbox_shift,
        fps=args.fps,
    ))
