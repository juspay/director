#!/usr/bin/env python3
# Origin: New provider — added to library on 2026-03-26
"""
Fish Audio S2 Pro voiceover generator.

80% cheaper than ElevenLabs (~$15/1M chars vs ~$200/1M) with comparable
quality. Supports 15-second voice cloning and 80+ languages. Dual-AR
architecture + RL alignment trained on 10M+ hours.

Key features:
- Voice cloning from a 15-second reference audio sample
- 80+ languages with natural accent preservation
- Apache 2.0 open-source base model (Fish Speech) available for self-hosting
- Streaming and batch generation modes

Usage:
    python fish_audio.py --text "Your narration" --voice-id YOUR_VOICE_ID
    python fish_audio.py --text-file script.txt --reference-audio voice_sample.mp3
    python fish_audio.py --clone-voice voice_sample.mp3 --name "My Voice"

API docs: https://docs.fish.audio/
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# Configuration from environment
FISH_API_KEY = os.environ.get("FISH_AUDIO_API_KEY", "")
FISH_API_BASE = "https://api.fish.audio/v1"

# Defaults
DEFAULT_MODEL = "speech-1.5"  # S2 Pro model
DEFAULT_FORMAT = "mp3"
DEFAULT_SAMPLE_RATE = 44100
DEFAULT_BITRATE = 128

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "fish"


async def generate_voiceover(
    text: str,
    output_path: Path,
    voice_id: str | None = None,
    reference_audio: str | None = None,
    model: str = DEFAULT_MODEL,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    bitrate: int = DEFAULT_BITRATE,
    output_format: str = DEFAULT_FORMAT,
) -> Path:
    """Generate voiceover using Fish Audio S2 Pro.

    Args:
        text: The narration text to speak.
        output_path: Where to save the audio file.
        voice_id: Fish Audio voice model ID (from cloned or preset voices).
        reference_audio: Path to a reference audio file for zero-shot cloning.
            If provided, the voice is cloned on-the-fly (15+ seconds recommended).
        model: Fish Audio model ID.
        sample_rate: Output sample rate in Hz.
        bitrate: Output bitrate in kbps.
        output_format: Output format (mp3, wav, opus, flac).

    Returns:
        Path to the generated audio file.
    """
    try:
        import httpx
    except ImportError:
        logger.error("httpx not installed. Run: pip install httpx")
        sys.exit(1)

    if not FISH_API_KEY:
        logger.error("FISH_AUDIO_API_KEY not set in environment.")
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    headers = {
        "Authorization": f"Bearer {FISH_API_KEY}",
    }

    # Build request payload
    payload = {
        "text": text,
        "format": output_format,
        "mp3_bitrate": bitrate,
        "sample_rate": sample_rate,
    }

    if voice_id:
        payload["reference_id"] = voice_id
        logger.info(f"Generating with voice ID: {voice_id}")

    # Handle reference audio for zero-shot cloning
    files = None
    if reference_audio:
        ref_path = Path(reference_audio)
        if not ref_path.exists():
            logger.error(f"Reference audio not found: {ref_path}")
            sys.exit(1)
        logger.info(f"Zero-shot cloning from: {ref_path.name}")
        # For multipart upload with reference audio
        files = {
            "reference_audio": (ref_path.name, ref_path.read_bytes(), "audio/mpeg"),
        }

    async with httpx.AsyncClient(timeout=300.0) as client:
        url = f"{FISH_API_BASE}/tts"

        if files:
            # Multipart form data for reference audio cloning
            form_data = {k: str(v) if not isinstance(v, str) else v for k, v in payload.items()}
            response = await client.post(
                url, data=form_data, files=files, headers=headers,
            )
        else:
            # JSON request for voice ID based generation
            headers["Content-Type"] = "application/json"
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            logger.error(f"Fish Audio API error {response.status_code}: {response.text[:500]}")
            raise RuntimeError(f"Fish Audio API returned {response.status_code}")

        output_path.write_bytes(response.content)

    size_kb = output_path.stat().st_size / 1024
    logger.info(f"  Saved: {output_path} ({size_kb:.0f} KB)")
    return output_path


async def clone_voice(
    reference_audio: str,
    name: str,
    description: str = "",
) -> str:
    """Create a persistent cloned voice from a reference audio sample.

    Args:
        reference_audio: Path to reference audio (15+ seconds recommended).
        name: Name for the cloned voice.
        description: Optional description.

    Returns:
        Voice model ID for use in generate_voiceover().
    """
    try:
        import httpx
    except ImportError:
        logger.error("httpx not installed. Run: pip install httpx")
        sys.exit(1)

    ref_path = Path(reference_audio)
    if not ref_path.exists():
        logger.error(f"Reference audio not found: {ref_path}")
        sys.exit(1)

    logger.info(f"Cloning voice from {ref_path.name} as '{name}'...")

    headers = {"Authorization": f"Bearer {FISH_API_KEY}"}

    async with httpx.AsyncClient(timeout=120.0) as client:
        files = {
            "audio": (ref_path.name, ref_path.read_bytes(), "audio/mpeg"),
        }
        data = {
            "name": name,
            "description": description or f"Cloned from {ref_path.name}",
        }

        response = await client.post(
            f"{FISH_API_BASE}/models",
            data=data,
            files=files,
            headers=headers,
        )

        if response.status_code not in (200, 201):
            logger.error(f"Clone failed {response.status_code}: {response.text[:500]}")
            raise RuntimeError(f"Voice cloning failed: {response.status_code}")

        result = response.json()
        voice_id = result.get("id") or result.get("model_id")
        logger.info(f"  Voice cloned! ID: {voice_id}")
        return voice_id


async def generate_batch(
    segments: list[dict],
    voice_id: str | None = None,
    reference_audio: str | None = None,
    output_dir: Path | None = None,
) -> list[Path]:
    """Generate voiceover for multiple segments.

    Each segment dict should have:
        - "id": segment identifier
        - "text": narration text

    Generates sequentially to maintain voice consistency.
    """
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for seg in segments:
        seg_id = seg["id"]
        output_path = out_dir / f"{seg_id}.mp3"

        if output_path.exists():
            logger.info(f"[{seg_id}] Already exists, skipping")
            paths.append(output_path)
            continue

        logger.info(f"[{seg_id}] Generating...")
        await generate_voiceover(
            text=seg["text"],
            output_path=output_path,
            voice_id=voice_id,
            reference_audio=reference_audio,
        )
        paths.append(output_path)

    return paths


def main():
    parser = argparse.ArgumentParser(description="Fish Audio S2 Pro voiceover generator")
    subparsers = parser.add_subparsers(dest="command")

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate voiceover")
    gen_parser.add_argument("--text", type=str, help="Narration text (inline)")
    gen_parser.add_argument("--text-file", type=str, help="Narration text from file")
    gen_parser.add_argument("--voice-id", type=str, help="Fish Audio voice model ID")
    gen_parser.add_argument("--reference-audio", type=str,
                            help="Reference audio for zero-shot cloning")
    gen_parser.add_argument("--output", type=str, default=None, help="Output file path")

    # Clone command
    clone_parser = subparsers.add_parser("clone", help="Clone a voice from audio")
    clone_parser.add_argument("audio", type=str, help="Reference audio file (15+ seconds)")
    clone_parser.add_argument("--name", type=str, required=True, help="Voice name")
    clone_parser.add_argument("--description", type=str, default="", help="Voice description")

    args = parser.parse_args()

    if not FISH_API_KEY:
        logger.error("Set FISH_AUDIO_API_KEY environment variable")
        sys.exit(1)

    if args.command == "clone":
        voice_id = asyncio.run(clone_voice(args.audio, args.name, args.description))
        print(f"Voice ID: {voice_id}")

    elif args.command == "generate":
        text = args.text
        if args.text_file:
            text = Path(args.text_file).read_text()
        if not text:
            logger.error("Provide --text or --text-file")
            sys.exit(1)

        output = Path(args.output) if args.output else OUTPUT_DIR / "narration.mp3"
        asyncio.run(generate_voiceover(
            text=text,
            output_path=output,
            voice_id=args.voice_id,
            reference_audio=args.reference_audio,
        ))

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
