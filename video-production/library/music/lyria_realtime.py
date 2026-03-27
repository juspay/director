#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Google Lyria RealTime music generation via Gemini API.

Lyria RealTime allows real-time WebSocket-based music steering — change key,
tempo, brightness, and mood in 2-second chunks. This maps directly to the
pipeline's BPM_MAP and VOLUME_CURVES architecture in music_config.py.

Free via the Gemini API (public preview, March 2026).

Usage:
    from lyria_realtime import generate_music_track
    path = await generate_music_track(
        duration_seconds=170,
        bpm_map=[(0, 72), (55, 80), (75, 88), (120, 72)],
        mood_map=[(0, "contemplative"), (55, "building"), (75, "energetic"), (120, "resolving")],
    )

API docs: https://ai.google.dev/gemini-api/docs/music-generation
"""

import asyncio
import json
import logging
import os
import struct
import wave
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", os.environ.get("VERTEX_PROJECT", ""))
LOCATION = os.environ.get("GOOGLE_VERTEX_LOCATION", "us-central1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "music" / "lyria"

# Lyria models
LYRIA_REALTIME = "lyria-realtime-exp"  # WebSocket streaming
LYRIA_PRO = "lyria-3-pro"  # Batch generation (up to 3 min)

# Default generation parameters
DEFAULT_SAMPLE_RATE = 48000
DEFAULT_CHANNELS = 2


async def generate_music_track(
    duration_seconds: int = 170,
    prompt: str | None = None,
    bpm_map: list[tuple[float, int]] | None = None,
    mood_map: list[tuple[float, str]] | None = None,
    key: str = "Ab major",
    output_path: Path | str | None = None,
    model: str = LYRIA_PRO,
) -> Path:
    """Generate a full music track using Lyria, optionally with time-based steering.

    Args:
        duration_seconds: Target duration.
        prompt: Text description of desired music style.
        bpm_map: List of (time_seconds, bpm) tuples for tempo changes.
        mood_map: List of (time_seconds, mood_name) tuples for mood steering.
        key: Musical key (e.g., "Ab major", "D minor").
        output_path: Where to save. Auto-generated if None.
        model: Lyria model (lyria-3-pro for batch, lyria-realtime-exp for streaming).

    Returns:
        Path to the generated WAV file.
    """
    if output_path is None:
        output_path = OUTPUT_DIR / f"lyria_track_{duration_seconds}s.wav"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Build generation prompt from parameters
    full_prompt = _build_prompt(prompt, bpm_map, mood_map, key, duration_seconds)

    if model == LYRIA_REALTIME:
        return await _generate_realtime(full_prompt, duration_seconds, output_path)
    else:
        return await _generate_batch(full_prompt, duration_seconds, output_path)


async def _generate_batch(prompt: str, duration_seconds: int, output_path: Path) -> Path:
    """Generate music using Lyria 3 Pro (batch mode, up to 3 minutes)."""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("google-genai not installed. Run: pip install google-genai")

    logger.info(f"[Lyria] Batch generation: {duration_seconds}s")
    logger.info(f"[Lyria] Prompt: {prompt[:100]}...")

    # Initialize client
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    elif PROJECT:
        client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    else:
        raise ValueError("Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT")

    # Generate music
    response = client.models.generate_content(
        model=f"models/{LYRIA_PRO}",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Lyria"),
                ),
            ),
        ),
    )

    # Extract audio data from response
    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                audio_bytes = part.inline_data.data
                output_path.write_bytes(audio_bytes)
                size_mb = output_path.stat().st_size / 1024 / 1024
                logger.info(f"[Lyria] Saved: {output_path} ({size_mb:.1f} MB)")
                return output_path

    raise RuntimeError("Lyria generation produced no audio output")


async def _generate_realtime(prompt: str, duration_seconds: int, output_path: Path) -> Path:
    """Generate music using Lyria RealTime (WebSocket streaming).

    Generates in 2-second chunks that can be steered in real-time.
    """
    try:
        from google import genai
    except ImportError:
        raise ImportError("google-genai not installed. Run: pip install google-genai")

    logger.info(f"[Lyria] RealTime streaming: {duration_seconds}s")

    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    elif PROJECT:
        client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    else:
        raise ValueError("Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT")

    all_audio_chunks = []

    async with client.aio.live.connect(model=f"models/{LYRIA_REALTIME}") as session:
        # Send initial prompt
        await session.send(input=prompt, end_of_turn=True)

        # Collect audio chunks
        chunks_received = 0
        target_chunks = duration_seconds // 2 + 1  # ~2s per chunk

        async for response in session.receive():
            if response.server_content and response.server_content.model_turn:
                for part in response.server_content.model_turn.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                        all_audio_chunks.append(part.inline_data.data)
                        chunks_received += 1
                        if chunks_received % 10 == 0:
                            logger.info(f"[Lyria] Received {chunks_received}/{target_chunks} chunks")

            if chunks_received >= target_chunks:
                break

    # Combine chunks into WAV file
    if all_audio_chunks:
        combined = b"".join(all_audio_chunks)
        _write_wav(output_path, combined, DEFAULT_SAMPLE_RATE, DEFAULT_CHANNELS)
        size_mb = output_path.stat().st_size / 1024 / 1024
        logger.info(f"[Lyria] Saved: {output_path} ({size_mb:.1f} MB, {len(all_audio_chunks)} chunks)")
        return output_path

    raise RuntimeError("Lyria RealTime produced no audio chunks")


def _build_prompt(
    base_prompt: str | None,
    bpm_map: list[tuple[float, int]] | None,
    mood_map: list[tuple[float, str]] | None,
    key: str,
    duration: int,
) -> str:
    """Build a detailed music generation prompt from structured parameters."""
    parts = []

    if base_prompt:
        parts.append(base_prompt)
    else:
        parts.append(
            "Create a cinematic background music track for a tech product video. "
            "Warm electronic with subtle ambient textures. Suitable for narration overlay."
        )

    parts.append(f"Duration: {duration} seconds. Key: {key}.")

    if bpm_map:
        tempo_desc = ", ".join(f"{bpm} BPM at {t}s" for t, bpm in bpm_map)
        parts.append(f"Tempo progression: {tempo_desc}.")

    if mood_map:
        mood_desc = ", ".join(f"{mood} at {t}s" for t, mood in mood_map)
        parts.append(f"Mood arc: {mood_desc}.")

    parts.append(
        "The music should be mixed at low volume, suitable for playing under narration. "
        "Include strategic silence moments for dramatic emphasis."
    )

    return " ".join(parts)


def _write_wav(path: Path, pcm_data: bytes, sample_rate: int, channels: int, sample_width: int = 2):
    """Write raw PCM data to a WAV file."""
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)


# Preset mood maps matching common video narrative structures
MOOD_PRESETS = {
    "product_demo": [
        (0, "contemplative"),
        (15, "curious"),
        (40, "building"),
        (60, "collaborative"),
        (80, "energetic"),
        (100, "triumphant"),
        (120, "reflective"),
        (150, "resolving"),
    ],
    "problem_solution": [
        (0, "tense"),
        (30, "searching"),
        (60, "hopeful"),
        (90, "confident"),
        (120, "celebratory"),
    ],
    "storytelling": [
        (0, "gentle"),
        (20, "intriguing"),
        (50, "dramatic"),
        (80, "uplifting"),
        (110, "peaceful"),
    ],
}


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Lyria RealTime music generator")
    parser.add_argument("--duration", type=int, default=170, help="Duration in seconds")
    parser.add_argument("--prompt", type=str, help="Music description prompt")
    parser.add_argument("--key", default="Ab major", help="Musical key")
    parser.add_argument("--mood-preset", choices=list(MOOD_PRESETS.keys()), help="Mood preset")
    parser.add_argument("--realtime", action="store_true", help="Use RealTime streaming model")
    parser.add_argument("--output", type=str, help="Output file path")
    args = parser.parse_args()

    mood_map = MOOD_PRESETS.get(args.mood_preset) if args.mood_preset else None
    model = LYRIA_REALTIME if args.realtime else LYRIA_PRO

    asyncio.run(generate_music_track(
        duration_seconds=args.duration,
        prompt=args.prompt,
        mood_map=mood_map,
        key=args.key,
        output_path=args.output,
        model=model,
    ))
