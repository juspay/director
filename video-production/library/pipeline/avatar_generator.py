# Origin: video-production/avatar.py — extracted to library on 2026-03-23
"""
D-ID avatar animation for Tara announcement video.

Generates lip-synced avatar animations for Acts 4 (Meet Tara) and 8 (CTA)
using the Tara mascot image as the avatar source. Outputs green-screen
video for compositing.
"""

import asyncio
import base64
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import DID_API_KEY, ASSETS_DIR

logger = logging.getLogger(__name__)

DID_BASE_URL = "https://api.d-id.com"

TARA_MASCOT_SQUARE = Path("/Users/sachinsharma/Downloads/tara-neurolink-square.png")
TARA_MASCOT_PORTRAIT = Path("/Users/sachinsharma/Downloads/tara-neurolink.png")


@dataclass
class AvatarResult:
    """Result of avatar animation generation."""

    scene_id: str
    video_path: Path
    duration_seconds: float


def _get_headers() -> dict[str, str]:
    return {
        "Authorization": f"Basic {DID_API_KEY}",
        "Accept": "application/json",
    }


def _mime_type(path: Path) -> str:
    suffix = path.suffix.lower()
    return {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
    }.get(suffix, "application/octet-stream")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=5, min=10, max=120),
    reraise=True,
)
async def _upload_image(client: httpx.AsyncClient, file_path: Path) -> str:
    """Upload an image to D-ID and return the URL for use in talks."""
    logger.info(f"Uploading image: {file_path.name}")

    headers = _get_headers()
    file_bytes = file_path.read_bytes()

    response = await client.post(
        f"{DID_BASE_URL}/images",
        headers=headers,
        files={"image": (file_path.name, file_bytes, _mime_type(file_path))},
    )
    response.raise_for_status()

    data = response.json()
    image_url = data["url"]
    logger.info(f"Uploaded {file_path.name} -> url={image_url}")
    return image_url


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=5, min=10, max=120),
    reraise=True,
)
async def _upload_audio(client: httpx.AsyncClient, file_path: Path) -> str:
    """Upload audio to D-ID and return the URL for use in talks."""
    logger.info(f"Uploading audio: {file_path.name}")

    headers = _get_headers()
    file_bytes = file_path.read_bytes()

    response = await client.post(
        f"{DID_BASE_URL}/audios",
        headers=headers,
        files={"audio": (file_path.name, file_bytes, _mime_type(file_path))},
    )
    response.raise_for_status()

    data = response.json()
    audio_url = data["url"]
    logger.info(f"Uploaded {file_path.name} -> url={audio_url}")
    return audio_url


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=5, min=10, max=120),
    reraise=True,
)
async def _create_talk(
    client: httpx.AsyncClient,
    source_url: str,
    audio_url: str,
    scene_id: str,
) -> str:
    """Create a D-ID talk (lip-synced video) and return the talk ID."""
    headers = _get_headers()
    headers["Content-Type"] = "application/json"

    payload = {
        "source_url": source_url,
        "script": {
            "type": "audio",
            "audio_url": audio_url,
            "subtitles": False,
        },
        "config": {
            "stitch": True,
            "result_format": "mp4",
        },
        "name": f"tara_{scene_id}",
    }

    response = await client.post(
        f"{DID_BASE_URL}/talks", json=payload, headers=headers
    )
    response.raise_for_status()

    data = response.json()
    talk_id = data["id"]
    logger.info(f"[{scene_id}] Created D-ID talk: {talk_id}")
    return talk_id


async def _poll_talk(
    client: httpx.AsyncClient,
    talk_id: str,
    scene_id: str,
    poll_interval: float = 10.0,
    max_wait: float = 600.0,
) -> str:
    """Poll D-ID until the talk video is ready, then return the result URL."""
    headers = _get_headers()
    elapsed = 0.0

    while elapsed < max_wait:
        response = await client.get(
            f"{DID_BASE_URL}/talks/{talk_id}", headers=headers
        )
        response.raise_for_status()
        data = response.json()
        status = data.get("status")

        if status == "done":
            result_url = data["result_url"]
            logger.info(f"[{scene_id}] D-ID talk ready: {result_url}")
            return result_url
        elif status in ("error", "rejected"):
            error = data.get("error", data.get("reject_reason", "Unknown error"))
            raise RuntimeError(f"[{scene_id}] D-ID talk failed: {error}")
        else:
            logger.info(
                f"[{scene_id}] D-ID status: {status} (elapsed: {elapsed:.0f}s)"
            )
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

    raise TimeoutError(
        f"[{scene_id}] D-ID talk generation timed out after {max_wait}s"
    )


async def _download_video(
    client: httpx.AsyncClient,
    video_url: str,
    output_path: Path,
) -> None:
    """Download the completed video from D-ID."""
    response = await client.get(video_url)
    response.raise_for_status()
    output_path.write_bytes(response.content)
    logger.info(f"Downloaded avatar video to {output_path}")


async def generate_avatar_animation(
    scene_id: str,
    audio_path: Path,
    mascot_image: Path | None = None,
) -> AvatarResult:
    """
    Generate a lip-synced avatar animation for a single scene using D-ID.

    Pipeline:
    1. Upload mascot image to D-ID
    2. Upload scene audio to D-ID
    3. Create talk with green screen background
    4. Poll until completion
    5. Download result
    """
    if mascot_image is None:
        mascot_image = TARA_MASCOT_SQUARE

    output_dir = ASSETS_DIR / "avatar"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{scene_id}_avatar.mp4"

    if output_path.exists():
        logger.info(f"[{scene_id}] Avatar video already exists, skipping")
        duration = await _get_video_duration(output_path)
        return AvatarResult(
            scene_id=scene_id, video_path=output_path, duration_seconds=duration
        )

    logger.info(f"[{scene_id}] Generating avatar animation via D-ID")

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Upload both assets in parallel
        image_task = _upload_image(client, mascot_image)
        audio_task = _upload_audio(client, audio_path)
        source_url, audio_url = await asyncio.gather(image_task, audio_task)

        # Create the talk
        talk_id = await _create_talk(client, source_url, audio_url, scene_id)

        # Poll until ready
        result_url = await _poll_talk(client, talk_id, scene_id)

        # Download
        await _download_video(client, result_url, output_path)

    duration = await _get_video_duration(output_path)
    logger.info(f"[{scene_id}] Avatar animation complete ({duration:.2f}s)")

    return AvatarResult(
        scene_id=scene_id, video_path=output_path, duration_seconds=duration
    )


async def _get_video_duration(path: Path) -> float:
    """Get video duration using ffprobe."""
    proc = await asyncio.create_subprocess_exec(
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    data = json.loads(stdout)
    return float(data["format"]["duration"])


async def generate_all_avatars(
    scenes: list[dict],
    voiceover_paths: dict[str, Path],
) -> dict[str, AvatarResult]:
    """
    Generate avatar animations for all scenes that need them.

    Runs sequentially because D-ID's API limits concurrent
    video generation on most plans.
    """
    results: dict[str, AvatarResult] = {}

    for scene in scenes:
        if not scene.get("needs_avatar"):
            continue

        scene_id = scene["id"]
        audio_path = voiceover_paths.get(scene_id)
        if audio_path is None:
            logger.warning(f"[{scene_id}] Needs avatar but no voiceover found, skipping")
            continue

        result = await generate_avatar_animation(scene_id, audio_path)
        results[scene_id] = result

    logger.info(f"Generated {len(results)} avatar animations")
    return results
