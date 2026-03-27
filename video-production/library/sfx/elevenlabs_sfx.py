#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
ElevenLabs Sound Effects v2 API integration.

Professional-quality text-to-SFX at 48kHz/24-bit. Use for hero moments:
transitions, reveals, stingers, UI sounds.

Usage:
    from elevenlabs_sfx import generate_sfx
    path = generate_sfx("dramatic orchestral hit with reverb tail", duration_seconds=3)
    path = generate_sfx("subtle UI click sound", duration_seconds=0.5, loopable=True)

API docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "sfx" / "generated"


async def generate_sfx(
    prompt: str,
    output_path: Path | str | None = None,
    duration_seconds: float | None = None,
    prompt_influence: float = 0.3,
    loopable: bool = False,
    output_format: str = "mp3_44100_128",
) -> Path:
    """Generate a sound effect using ElevenLabs SFX v2 API.

    Args:
        prompt: Text description of the desired sound effect.
        output_path: Where to save. Auto-generated from prompt if None.
        duration_seconds: Target duration (None = auto). Max 30s.
        prompt_influence: 0.0-1.0, how closely to follow the prompt.
        loopable: Whether the output should seamlessly loop.
        output_format: Audio format (mp3_44100_128, pcm_16000, etc.).

    Returns:
        Path to the generated audio file.
    """
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed. Run: pip install httpx")

    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not set in environment")

    # Auto-generate output path from prompt
    if output_path is None:
        safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in prompt[:40])
        safe_name = safe_name.strip().replace(" ", "_").lower()
        output_path = OUTPUT_DIR / f"sfx_{safe_name}.mp3"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "text": prompt,
        "prompt_influence": prompt_influence,
    }

    if duration_seconds is not None:
        payload["duration_seconds"] = min(duration_seconds, 30.0)
    if loopable:
        payload["loop"] = True

    logger.info(f"[SFX] Generating: '{prompt[:60]}...' ({duration_seconds or 'auto'}s)")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(ELEVENLABS_SFX_URL, json=payload, headers=headers)

        if response.status_code != 200:
            logger.error(f"[SFX] API error {response.status_code}: {response.text[:300]}")
            raise RuntimeError(f"ElevenLabs SFX API returned {response.status_code}")

        output_path.write_bytes(response.content)

    size_kb = output_path.stat().st_size / 1024
    logger.info(f"[SFX] Saved: {output_path} ({size_kb:.0f} KB)")
    return output_path


async def generate_sfx_batch(
    prompts: list[dict],
    output_dir: Path | None = None,
) -> list[Path]:
    """Generate multiple SFX from a list of prompt dicts.

    Each dict: {"name": "transition_whoosh", "prompt": "cinematic whoosh...", "duration": 2.0}
    """
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for item in prompts:
        name = item["name"]
        output_path = out_dir / f"{name}.mp3"

        if output_path.exists():
            logger.info(f"[SFX] {name} already exists, skipping")
            paths.append(output_path)
            continue

        path = await generate_sfx(
            prompt=item["prompt"],
            output_path=output_path,
            duration_seconds=item.get("duration"),
            loopable=item.get("loopable", False),
        )
        paths.append(path)

    return paths


# Preset SFX prompts for common video production needs
SFX_PRESETS = {
    "transition_whoosh": {
        "prompt": "Smooth cinematic whoosh transition sound, quick left-to-right sweep",
        "duration": 1.5,
    },
    "reveal_shimmer": {
        "prompt": "Magical shimmer reveal with ascending chimes and sparkle",
        "duration": 2.0,
    },
    "bass_drop": {
        "prompt": "Deep cinematic bass drop with sub-bass rumble, dramatic impact",
        "duration": 3.0,
    },
    "ui_click": {
        "prompt": "Clean subtle UI button click, soft and modern",
        "duration": 0.3,
    },
    "notification_bloop": {
        "prompt": "Friendly notification sound, two ascending tones, chat app style",
        "duration": 0.5,
    },
    "success_chime": {
        "prompt": "Positive success chime, bright ascending notes, task complete",
        "duration": 1.0,
    },
    "typing_keyboard": {
        "prompt": "Mechanical keyboard typing sounds, rapid keystrokes, coding",
        "duration": 3.0,
    },
}


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ElevenLabs SFX v2 generator")
    parser.add_argument("prompt", nargs="?", help="SFX text prompt")
    parser.add_argument("--preset", choices=list(SFX_PRESETS.keys()), help="Use a preset")
    parser.add_argument("--duration", type=float, help="Duration in seconds")
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--loop", action="store_true", help="Generate loopable output")
    parser.add_argument("--all-presets", action="store_true", help="Generate all preset SFX")
    args = parser.parse_args()

    if args.all_presets:
        prompts = [{"name": k, **v} for k, v in SFX_PRESETS.items()]
        asyncio.run(generate_sfx_batch(prompts))
    elif args.preset:
        preset = SFX_PRESETS[args.preset]
        asyncio.run(generate_sfx(
            prompt=preset["prompt"],
            duration_seconds=args.duration or preset.get("duration"),
            output_path=args.output,
            loopable=args.loop,
        ))
    elif args.prompt:
        asyncio.run(generate_sfx(
            prompt=args.prompt,
            duration_seconds=args.duration,
            output_path=args.output,
            loopable=args.loop,
        ))
    else:
        parser.print_help()
