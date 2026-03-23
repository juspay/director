# Origin: v7 — extracted to library on 2026-03-23
"""
V7.4 Voiceover Generation — Continuous single-take with multiple variations.

Generates 5 variations of the full v7.4 narration as one continuous piece,
each with different voice settings to find the optimal delivery.

Usage:
    python generate_voiceover_v7.py
"""

import asyncio
import json
import logging
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime

import httpx

# Add parent dir for config import
sys.path.insert(0, str(Path(__file__).parent.parent.parent.resolve()))
from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# ---------- Constants ----------
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "v7"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------- The v7.4 Narration (One Continuous Piece) ----------
NARRATION = """Twelve tabs open. A review untouched since Tuesday. And somewhere underneath all of it — an idea that was clear this morning.

Half of them still open from yesterday. Context scattered across five tools. Nothing connected.

There was a time when the job was writing code. Then it became engineering — systems thinking, architecture, knowing why things break.

And carrying the weight when they do.

You earned that shift.

The next one is bigger. From engineer — to builder. Less time on the how. More time on the what and the why.

The friction isn't in your skill. It's between the decision and the done.

Tara closes that gap.

She lives in Slack — where your team already thinks. Drop in a screenshot, a question, a half-formed idea. Already reading.

In under a minute — she's searched across your repositories, cross-checked your JIRA history, found the root cause, and built a plan.

And now your team thinks together.

A PM scopes it tighter. An engineer challenges an assumption. A designer spots something nobody else caught. Each message sharpens the plan.

The judgment. The debate. The decisions only humans make. And when it's ready — it moves.

Three repos cloned. Your patterns studied. Three implementations running in parallel — and pull requests opening one after another, connecting back to the thread where it all started.

No one waited for anyone.

Tara reads whatever your team works with — code, documents, designs, configs. She connects to everything you already use. Everything through Slack.

Four hundred threads. Double the PR throughput. From a question to production — in minutes, not days.

You already know what to build next.

Engineers are builders now.

The implementation doesn't disappear. It just happens — right where the conversation started.

Tara. Build what matters."""


# ---------- Voice Setting Variations ----------
# Each variation tweaks stability, similarity_boost, and style
# to find the optimal balance between consistency and natural expression.
VARIATIONS = [
    {
        "id": "v1_warm_stable",
        "description": "Warm and stable — baseline from previous iterations",
        "settings": {
            "stability": 0.55,
            "similarity_boost": 0.80,
            "style": 0.35,
            "use_speaker_boost": True,
        },
    },
    {
        "id": "v2_natural_flow",
        "description": "More natural variation — lower stability for organic feel",
        "settings": {
            "stability": 0.45,
            "similarity_boost": 0.80,
            "style": 0.40,
            "use_speaker_boost": True,
        },
    },
    {
        "id": "v3_confident",
        "description": "Confident and measured — higher stability, lower style for authority",
        "settings": {
            "stability": 0.60,
            "similarity_boost": 0.85,
            "style": 0.25,
            "use_speaker_boost": True,
        },
    },
    {
        "id": "v4_conversational",
        "description": "Conversational — low stability, high style for 'colleague telling you' feel",
        "settings": {
            "stability": 0.40,
            "similarity_boost": 0.75,
            "style": 0.50,
            "use_speaker_boost": True,
        },
    },
    {
        "id": "v5_balanced",
        "description": "Balanced sweet spot — tuned from scoring feedback",
        "settings": {
            "stability": 0.50,
            "similarity_boost": 0.82,
            "style": 0.35,
            "use_speaker_boost": True,
        },
    },
]


@dataclass
class VoiceoverResult:
    variation_id: str
    description: str
    settings: dict
    audio_path: str
    duration_seconds: float
    file_size_bytes: int
    generated_at: str


def get_audio_duration(path: Path) -> float:
    """Get duration of MP3 file using mutagen."""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(str(path))
        return audio.info.length
    except ImportError:
        # Fallback: estimate from file size (128kbps = 16KB/s)
        size = path.stat().st_size
        return size / 16000.0


async def generate_variation(variation: dict) -> VoiceoverResult:
    """Generate one voiceover variation."""
    var_id = variation["id"]
    output_path = OUTPUT_DIR / f"tara-v7-{var_id}.mp3"

    # Skip if already generated
    if output_path.exists():
        logger.info(f"[{var_id}] Already exists, skipping")
        duration = get_audio_duration(output_path)
        return VoiceoverResult(
            variation_id=var_id,
            description=variation["description"],
            settings=variation["settings"],
            audio_path=str(output_path),
            duration_seconds=duration,
            file_size_bytes=output_path.stat().st_size,
            generated_at=datetime.now().isoformat(),
        )

    logger.info(f"[{var_id}] Generating: {variation['description']}")
    logger.info(f"[{var_id}] Settings: stability={variation['settings']['stability']}, "
                f"similarity={variation['settings']['similarity_boost']}, "
                f"style={variation['settings']['style']}")

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": NARRATION,
        "model_id": ELEVENLABS_MODEL,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": variation["settings"],
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        output_path.write_bytes(response.content)

    duration = get_audio_duration(output_path)
    file_size = output_path.stat().st_size

    logger.info(f"[{var_id}] Done — {duration:.1f}s, {file_size/1024:.0f}KB")

    return VoiceoverResult(
        variation_id=var_id,
        description=variation["description"],
        settings=variation["settings"],
        audio_path=str(output_path),
        duration_seconds=duration,
        file_size_bytes=file_size,
        generated_at=datetime.now().isoformat(),
    )


async def main():
    logger.info(f"Generating {len(VARIATIONS)} voiceover variations for v7.4")
    logger.info(f"Narration: {len(NARRATION)} chars, ~{len(NARRATION.split())} words")
    logger.info(f"Output: {OUTPUT_DIR}")

    # Generate sequentially to avoid rate limits on long-form audio
    results = []
    for variation in VARIATIONS:
        try:
            result = await generate_variation(variation)
            results.append(result)
        except Exception as e:
            logger.error(f"[{variation['id']}] FAILED: {e}")
            continue

    # Save metadata
    metadata = {
        "script_version": "v7.4",
        "narration_word_count": len(NARRATION.split()),
        "narration_char_count": len(NARRATION),
        "voice_id": ELEVENLABS_VOICE_ID,
        "model": ELEVENLABS_MODEL,
        "generated_at": datetime.now().isoformat(),
        "variations": [asdict(r) for r in results],
    }

    metadata_path = OUTPUT_DIR / "voiceover-metadata-v7.json"
    metadata_path.write_text(json.dumps(metadata, indent=2))

    # Summary
    logger.info("\n=== GENERATION COMPLETE ===")
    for r in results:
        logger.info(f"  {r.variation_id}: {r.duration_seconds:.1f}s — {r.description}")

    if results:
        durations = [r.duration_seconds for r in results]
        logger.info(f"\n  Duration range: {min(durations):.1f}s - {max(durations):.1f}s")
        logger.info(f"  Target: ~2:40 (160s)")
        logger.info(f"  Files: {OUTPUT_DIR}")

    return results


if __name__ == "__main__":
    asyncio.run(main())
