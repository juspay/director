"""
ElevenLabs voiceover generation for Tara announcement video.

Generates per-scene audio files using the ElevenLabs v3 model.
Returns duration metadata for downstream timing synchronization.
"""

import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path

import httpx
from mutagen.mp3 import MP3
from tenacity import retry, stop_after_attempt, wait_exponential

from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ASSETS_DIR

logger = logging.getLogger(__name__)

# ElevenLabs API configuration
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"


@dataclass
class VoiceoverResult:
    """Result of a single voiceover generation."""

    scene_id: str
    audio_path: Path
    duration_seconds: float


def get_audio_duration(path: Path) -> float:
    """Get the duration of an MP3 file in seconds."""
    audio = MP3(str(path))
    return audio.info.length


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=30),
    reraise=True,
)
async def generate_voiceover(
    scene_id: str,
    text: str,
    output_dir: Path | None = None,
) -> VoiceoverResult:
    """
    Generate voiceover audio for a single scene using ElevenLabs TTS.

    Args:
        scene_id: Unique identifier for the scene (used in filename).
        text: The narration text to synthesize.
        output_dir: Directory to save the audio file. Defaults to assets/voiceover/.

    Returns:
        VoiceoverResult with path and duration metadata.
    """
    if output_dir is None:
        output_dir = ASSETS_DIR / "voiceover"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{scene_id}.mp3"

    # Skip generation if file already exists (idempotent re-runs)
    if output_path.exists():
        logger.info(f"[{scene_id}] Voiceover already exists, skipping generation")
        duration = get_audio_duration(output_path)
        return VoiceoverResult(
            scene_id=scene_id,
            audio_path=output_path,
            duration_seconds=duration,
        )

    logger.info(f"[{scene_id}] Generating voiceover ({len(text)} chars)")

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.80,
            "style": 0.35,
            # Slightly warm and conversational — Tara's character is friendly,
            # not robotic. Stability at 0.65 keeps it consistent across scenes
            # while allowing natural expression.
            "use_speaker_boost": True,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()

        output_path.write_bytes(response.content)
        logger.info(f"[{scene_id}] Saved voiceover to {output_path}")

    duration = get_audio_duration(output_path)
    logger.info(f"[{scene_id}] Duration: {duration:.2f}s")

    return VoiceoverResult(
        scene_id=scene_id,
        audio_path=output_path,
        duration_seconds=duration,
    )


async def generate_all_voiceovers(
    scenes: list[dict],
) -> dict[str, VoiceoverResult]:
    """
    Generate voiceovers for all scenes that have narration.

    Runs requests concurrently with a semaphore to respect API rate limits.
    ElevenLabs allows ~5 concurrent requests on Creator tier.

    Args:
        scenes: List of scene configuration dicts from scenes.json.

    Returns:
        Dict mapping scene_id to VoiceoverResult.
    """
    semaphore = asyncio.Semaphore(3)  # Conservative concurrency limit

    async def _generate_with_limit(scene: dict) -> VoiceoverResult | None:
        if not scene.get("has_narration") or not scene.get("narration"):
            logger.info(f"[{scene['id']}] No narration, skipping voiceover")
            return None

        async with semaphore:
            return await generate_voiceover(scene["id"], scene["narration"])

    tasks = [_generate_with_limit(scene) for scene in scenes]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    voiceovers: dict[str, VoiceoverResult] = {}
    for scene, result in zip(scenes, results):
        if isinstance(result, Exception):
            logger.error(f"[{scene['id']}] Voiceover generation failed: {result}")
            raise result
        if result is not None:
            voiceovers[scene["id"]] = result

    logger.info(
        f"Generated {len(voiceovers)} voiceovers, "
        f"total duration: {sum(v.duration_seconds for v in voiceovers.values()):.1f}s"
    )
    return voiceovers


async def generate_music(duration_seconds: float) -> Path:
    """
    Generate background music using ElevenLabs sound effects API.

    We use the sound effects endpoint with a descriptive prompt to generate
    a warm, building, product-launch energy track. The result is a single
    audio file that will be mixed at 15% volume during compositing.

    Args:
        duration_seconds: Target duration for the music track.

    Returns:
        Path to the generated music file.
    """
    output_dir = ASSETS_DIR / "music"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "background_music.mp3"

    if output_path.exists():
        logger.info("Background music already exists, skipping generation")
        return output_path

    logger.info(f"Generating background music ({duration_seconds:.0f}s target)")

    # ElevenLabs sound generation API for ambient/music tracks
    url = f"{ELEVENLABS_BASE_URL}/sound-generation"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": (
            "Warm, inspiring corporate product launch background music. "
            "Soft piano and synthesizer pads with gentle building energy. "
            "Starts quiet and ambient, builds gradually to a hopeful climax, "
            "then pulls back to near-silence before a final warm resolution. "
            "Professional, modern, tech company announcement feel. "
            "No vocals. Subtle and supportive, not overpowering."
        ),
        "duration_seconds": min(duration_seconds, 22.0),
        # ElevenLabs sound generation caps at 22s per call. We'll loop/extend
        # in compositing if the video is longer. The music is ambient enough
        # that a crossfaded loop is seamless.
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()

        output_path.write_bytes(response.content)
        logger.info(f"Saved background music to {output_path}")

    return output_path
