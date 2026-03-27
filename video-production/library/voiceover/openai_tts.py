#!/usr/bin/env python3
# Origin: New provider — added to library on 2026-03-26
"""
OpenAI gpt-4o-mini-tts voiceover generator.

The key differentiator: prompt-steerable delivery. You describe the desired
delivery in natural language (e.g., "speak with quiet contemplation, building
to confident energy") and the model adjusts tone, pacing, and emotion.

This is uniquely suited to video narration where the energy arc must match
the script's emotional progression.

Usage:
    python openai_tts.py --text "Your narration text" --voice alloy
    python openai_tts.py --text-file script.txt --delivery-prompt "Speak with gravitas"
    python openai_tts.py --scenes scenes.json  # Per-scene delivery instructions

Voices: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer
Model: gpt-4o-mini-tts (~$15/1M characters)
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
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Default voice and model
DEFAULT_MODEL = "gpt-4o-mini-tts"
DEFAULT_VOICE = "nova"  # Warm, natural — good for product narration
DEFAULT_FORMAT = "mp3"
DEFAULT_SPEED = 1.0

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "openai"


async def generate_voiceover(
    text: str,
    output_path: Path,
    voice: str = DEFAULT_VOICE,
    delivery_prompt: str | None = None,
    speed: float = DEFAULT_SPEED,
    model: str = DEFAULT_MODEL,
    response_format: str = DEFAULT_FORMAT,
) -> Path:
    """Generate voiceover using OpenAI gpt-4o-mini-tts.

    Args:
        text: The narration text to speak.
        output_path: Where to save the audio file.
        voice: Voice ID (alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer).
        delivery_prompt: Natural language instruction for delivery style.
            e.g., "Speak with quiet contemplation for the opening, building to
            confident energy in the middle, and ending with warm resolve."
        speed: Playback speed multiplier (0.25 to 4.0).
        model: TTS model (gpt-4o-mini-tts or tts-1 or tts-1-hd).
        response_format: Output format (mp3, opus, aac, flac, wav, pcm).

    Returns:
        Path to the generated audio file.
    """
    try:
        from openai import OpenAI
    except ImportError:
        logger.error("openai SDK not installed. Run: pip install openai")
        sys.exit(1)

    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY not set in environment.")
        sys.exit(1)

    client = OpenAI(api_key=OPENAI_API_KEY)

    # Build the input — for gpt-4o-mini-tts, the delivery prompt goes in "instructions"
    logger.info(f"Generating voiceover: voice={voice}, model={model}")
    if delivery_prompt:
        logger.info(f"  Delivery: {delivery_prompt[:100]}...")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # gpt-4o-mini-tts supports an "instructions" field for delivery control
    kwargs = {
        "model": model,
        "voice": voice,
        "input": text,
        "response_format": response_format,
        "speed": speed,
    }

    # The instructions parameter controls delivery style (gpt-4o-mini-tts only)
    if delivery_prompt and model == "gpt-4o-mini-tts":
        kwargs["instructions"] = delivery_prompt

    response = client.audio.speech.create(**kwargs)

    # Stream response to file
    response.stream_to_file(str(output_path))

    logger.info(f"  Saved: {output_path} ({output_path.stat().st_size / 1024:.0f} KB)")
    return output_path


async def generate_per_scene(
    scenes_config: list[dict],
    output_dir: Path | None = None,
    voice: str = DEFAULT_VOICE,
) -> list[Path]:
    """Generate voiceover per scene with scene-specific delivery instructions.

    Each scene dict should have:
        - "id": scene identifier (e.g., "act1_hook")
        - "text": narration text for this scene
        - "delivery": natural language delivery instruction

    Example scenes_config:
    [
        {
            "id": "act1_hook",
            "text": "Thirteen minutes. From screenshot to production.",
            "delivery": "Quiet, almost whispered. Let the number land."
        },
        {
            "id": "act4_execution",
            "text": "Three repos cloned. Your patterns studied.",
            "delivery": "Build energy rapidly. Confident, fast-paced, exciting."
        }
    ]
    """
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for scene in scenes_config:
        scene_id = scene["id"]
        text = scene["text"]
        delivery = scene.get("delivery", None)

        output_path = out_dir / f"{scene_id}.mp3"

        if output_path.exists():
            logger.info(f"[{scene_id}] Already exists, skipping")
            paths.append(output_path)
            continue

        logger.info(f"[{scene_id}] Generating with delivery: {delivery[:60] if delivery else 'default'}...")

        await generate_voiceover(
            text=text,
            output_path=output_path,
            voice=voice,
            delivery_prompt=delivery,
        )
        paths.append(output_path)

    return paths


async def generate_with_variants(
    text: str,
    delivery_prompts: list[str],
    output_dir: Path | None = None,
    voice: str = DEFAULT_VOICE,
) -> list[Path]:
    """Generate multiple variants with different delivery styles for A/B comparison.

    Useful for finding the best delivery approach — generate 3-5 variants,
    then score them with the acoustic scorer to pick the winner.
    """
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    for i, prompt in enumerate(delivery_prompts):
        output_path = out_dir / f"variant_{i+1}.mp3"

        if output_path.exists():
            logger.info(f"[variant_{i+1}] Already exists, skipping")
            paths.append(output_path)
            continue

        logger.info(f"[variant_{i+1}] Delivery: {prompt[:80]}...")
        await generate_voiceover(
            text=text,
            output_path=output_path,
            voice=voice,
            delivery_prompt=prompt,
        )
        paths.append(output_path)

    return paths


# Default delivery prompts for product video narration
DELIVERY_PRESETS = {
    "contemplative_build": (
        "Begin with quiet, almost intimate contemplation — as if sharing a personal "
        "realization. Gradually build confidence through the middle section. "
        "End with warm, resolute conviction. Natural pauses between key ideas."
    ),
    "storyteller": (
        "Speak like a seasoned storyteller around a campfire. Varied pacing — "
        "slow for dramatic moments, quicker for exciting sequences. "
        "Let the audience lean in during quiet parts."
    ),
    "ted_talk": (
        "Confident, polished delivery like a well-rehearsed TED talk. "
        "Clear enunciation, strategic pauses for emphasis, building to a "
        "powerful conclusion. Professional but warm."
    ),
    "documentary": (
        "Authoritative documentary narrator voice. Measured, clear, "
        "with gravitas on key statistics and names. "
        "Neutral emotion but deeply engaged with the subject."
    ),
    "founder_pitch": (
        "Passionate founder presenting to investors. Genuine excitement "
        "about the product, urgency when describing the problem, "
        "pride when showing the solution. Conversational but compelling."
    ),
}


def main():
    parser = argparse.ArgumentParser(description="OpenAI gpt-4o-mini-tts voiceover generator")
    parser.add_argument("--text", type=str, help="Narration text (inline)")
    parser.add_argument("--text-file", type=str, help="Narration text from file")
    parser.add_argument("--scenes", type=str, help="Per-scene config JSON file")
    parser.add_argument("--voice", default=DEFAULT_VOICE,
                        choices=["alloy", "ash", "ballad", "coral", "echo", "fable",
                                 "onyx", "nova", "sage", "shimmer"],
                        help=f"Voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--delivery", type=str, help="Delivery style instruction")
    parser.add_argument("--delivery-preset", choices=list(DELIVERY_PRESETS.keys()),
                        help="Use a predefined delivery style")
    parser.add_argument("--output", type=str, default=None, help="Output file path")
    parser.add_argument("--variants", action="store_true",
                        help="Generate all 5 delivery preset variants")
    args = parser.parse_args()

    if not OPENAI_API_KEY:
        logger.error("Set OPENAI_API_KEY environment variable")
        sys.exit(1)

    delivery = args.delivery
    if args.delivery_preset:
        delivery = DELIVERY_PRESETS[args.delivery_preset]

    if args.scenes:
        with open(args.scenes) as f:
            scenes = json.load(f)
        asyncio.run(generate_per_scene(scenes, voice=args.voice))

    elif args.variants:
        text = args.text or Path(args.text_file).read_text() if args.text_file else None
        if not text:
            logger.error("Provide --text or --text-file with --variants")
            sys.exit(1)
        asyncio.run(generate_with_variants(
            text=text,
            delivery_prompts=list(DELIVERY_PRESETS.values()),
            voice=args.voice,
        ))

    else:
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
            voice=args.voice,
            delivery_prompt=delivery,
        ))


if __name__ == "__main__":
    main()
