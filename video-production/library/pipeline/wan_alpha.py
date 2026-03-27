#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Wan-Alpha RGBA video generation — native transparent backgrounds.

CVPR 2026, open source. The first model to generate video with native alpha
channel, eliminating the need for green screen + FFmpeg colorkey pipeline.

Directly replaces the green_screen.py workflow for avatar compositing.
Currently limited to 832x480 resolution.

Modes:
- Replicate/fal.ai API (cloud)
- Local inference (GPU, requires cloned repo)

GitHub: https://github.com/WeChatCV/Wan-Alpha
"""

import asyncio
import logging
import os
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
FAL_KEY = os.environ.get("FAL_KEY", "")

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "avatar" / "wan_alpha"

REPLICATE_MODEL = "wechatcv/wan-alpha"
FAL_MODEL = "fal-ai/wan-alpha"


async def generate_rgba_video(
    prompt: str,
    output_path: Path | str | None = None,
    duration_seconds: int = 5,
    width: int = 832,
    height: int = 480,
    mode: str = "replicate",
    source_image: str | Path | None = None,
) -> Path:
    """Generate video with native alpha channel (transparent background).

    Args:
        prompt: Text description of the subject/action.
        output_path: Where to save (WebM with alpha or ProRes 4444).
        duration_seconds: Clip duration.
        width: Output width (max 832 currently).
        height: Output height (max 480 currently).
        mode: "replicate", "fal", or "local".
        source_image: Optional source image for image-to-video with transparency.

    Returns:
        Path to the generated RGBA video (WebM VP9 with alpha).
    """
    if output_path is None:
        safe = "".join(c if c.isalnum() or c in "-_ " else "" for c in prompt[:30])
        safe = safe.strip().replace(" ", "_").lower()
        output_path = OUTPUT_DIR / f"rgba_{safe}.webm"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"[Wan-Alpha] Generating RGBA: '{prompt[:50]}...' ({width}x{height}, {duration_seconds}s)")

    if mode == "replicate":
        return await _generate_replicate(prompt, output_path, duration_seconds, width, height, source_image)
    elif mode == "fal":
        return await _generate_fal(prompt, output_path, duration_seconds, width, height, source_image)
    elif mode == "local":
        return await _generate_local(prompt, output_path, duration_seconds, width, height, source_image)
    else:
        raise ValueError(f"Unknown mode: {mode}")


async def _generate_replicate(
    prompt: str, output_path: Path, duration: int,
    width: int, height: int, source_image: Path | str | None,
) -> Path:
    """Generate via Replicate API."""
    import httpx
    import base64

    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not set")

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "input": {
            "prompt": prompt,
            "width": width,
            "height": height,
            "num_frames": duration * 24,  # ~24fps
            "output_format": "webm",  # VP9 with alpha
        },
    }

    if source_image:
        img_path = Path(source_image)
        if img_path.exists():
            img_b64 = base64.b64encode(img_path.read_bytes()).decode()
            mime = "image/png" if img_path.suffix == ".png" else "image/jpeg"
            payload["input"]["image"] = f"data:{mime};base64,{img_b64}"

    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(
            f"https://api.replicate.com/v1/models/{REPLICATE_MODEL}/predictions",
            json=payload,
            headers=headers,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"Replicate error {response.status_code}: {response.text[:300]}")

        prediction = response.json()
        pred_id = prediction["id"]
        logger.info(f"[Wan-Alpha] Prediction: {pred_id}")

        while True:
            await asyncio.sleep(5)
            poll = await client.get(
                f"https://api.replicate.com/v1/predictions/{pred_id}",
                headers=headers,
            )
            result = poll.json()
            status = result.get("status")

            if status == "succeeded":
                video_url = result["output"]
                if isinstance(video_url, list):
                    video_url = video_url[0]
                video_data = await client.get(video_url)
                output_path.write_bytes(video_data.content)
                break
            elif status == "failed":
                raise RuntimeError(f"Wan-Alpha failed: {result.get('error')}")
            logger.info(f"[Wan-Alpha] Status: {status}")

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[Wan-Alpha] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


async def _generate_fal(
    prompt: str, output_path: Path, duration: int,
    width: int, height: int, source_image: Path | str | None,
) -> Path:
    """Generate via fal.ai API."""
    import httpx
    import base64

    if not FAL_KEY:
        raise ValueError("FAL_KEY not set")

    headers = {"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"}

    payload = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "num_frames": duration * 24,
    }

    if source_image:
        img_path = Path(source_image)
        if img_path.exists():
            img_b64 = base64.b64encode(img_path.read_bytes()).decode()
            payload["image_url"] = f"data:image/png;base64,{img_b64}"

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

        while True:
            await asyncio.sleep(3)
            poll = await client.get(
                f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}/status",
                headers=headers,
            )
            st = poll.json()
            if st.get("status") == "COMPLETED":
                final = await client.get(
                    f"https://queue.fal.run/{FAL_MODEL}/requests/{request_id}",
                    headers=headers,
                )
                video_url = final.json().get("video", {}).get("url", "")
                if video_url:
                    video_data = await client.get(video_url)
                    output_path.write_bytes(video_data.content)
                break
            elif st.get("status") == "FAILED":
                raise RuntimeError(f"fal.ai failed: {st}")

    size_mb = output_path.stat().st_size / 1024 / 1024
    logger.info(f"[Wan-Alpha] Saved: {output_path} ({size_mb:.1f} MB)")
    return output_path


async def _generate_local(
    prompt: str, output_path: Path, duration: int,
    width: int, height: int, source_image: Path | str | None,
) -> Path:
    """Generate locally (requires cloned Wan-Alpha repo + GPU)."""
    import subprocess, sys

    wan_dir = os.environ.get("WAN_ALPHA_DIR", "")
    if not wan_dir or not Path(wan_dir).exists():
        raise RuntimeError(
            "WAN_ALPHA_DIR not set. Clone: git clone https://github.com/WeChatCV/Wan-Alpha.git"
        )

    cmd = [
        sys.executable, "generate.py",
        "--prompt", prompt,
        "--output", str(output_path),
        "--width", str(width),
        "--height", str(height),
        "--num_frames", str(duration * 24),
    ]
    if source_image:
        cmd += ["--image", str(source_image)]

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=wan_dir, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"Wan-Alpha local failed: {result.stderr[:500]}")

    logger.info(f"[Wan-Alpha] Saved: {output_path}")
    return output_path


def composite_rgba_on_background(
    rgba_video: str | Path,
    background_color: str = "#0f172a",
    output_path: str | Path | None = None,
) -> Path:
    """Composite RGBA video onto a solid color background using FFmpeg.

    This replaces the green_screen.py colorkey pipeline — no green screen
    artifacts, no key spill, pixel-perfect alpha compositing.
    """
    import subprocess

    rgba_video = Path(rgba_video)
    if output_path is None:
        output_path = rgba_video.with_suffix(".composited.mp4")
    output_path = Path(output_path)

    # Parse hex color to FFmpeg format
    color = background_color.lstrip("#")

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=0x{color}:s=1920x1080:d=300",
        "-i", str(rgba_video),
        "-filter_complex",
        "[1:v]scale=1920:-1[fg];[0:v][fg]overlay=(W-w)/2:(H-h)/2:shortest=1",
        "-c:v", "libx264", "-crf", "18", "-preset", "slow",
        "-tune", "animation",
        "-movflags", "+faststart",
        str(output_path),
    ]

    subprocess.run(cmd, capture_output=True, check=True, timeout=120)
    logger.info(f"[Wan-Alpha] Composited: {output_path}")
    return output_path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Wan-Alpha RGBA video generator")
    parser.add_argument("prompt", help="Subject/action description")
    parser.add_argument("--mode", default="replicate", choices=["replicate", "fal", "local"])
    parser.add_argument("--duration", type=int, default=5)
    parser.add_argument("--image", help="Source image for image-to-video")
    parser.add_argument("--output", help="Output path")
    parser.add_argument("--composite", help="Composite onto background color (hex)")
    args = parser.parse_args()

    result_path = asyncio.run(generate_rgba_video(
        prompt=args.prompt, mode=args.mode,
        duration_seconds=args.duration, source_image=args.image,
        output_path=args.output,
    ))

    if args.composite:
        composite_rgba_on_background(result_path, args.composite)
