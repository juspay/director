# Origin: v8 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate voiceover using Smallest.ai Waves TTS (Lightning v3.1).

Generates the full TARA v8 narration using Smallest.ai's Lightning v3.1 model,
which delivers natural, expressive 44 kHz speech with Indian-accented English
voices.

API docs: https://waves-docs.smallest.ai/v4.0.0/content/api-references/lightning-v3.1

Setup:
  1. Get a free API key at https://app.smallest.ai/dashboard/settings/apikeys
  2. Set SMALLEST_API_KEY in ../../.env (video-production/.env)
     or export it as an environment variable.
  3. pip install httpx python-dotenv
  4. python scripts/generate_voiceover_smallest.py
"""

import asyncio
import os
import sys
import json
from pathlib import Path

try:
    import httpx
except ImportError:
    print("ERROR: Install httpx first:  pip install httpx")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "https://api.smallest.ai"
MODEL = "lightning-v3.1"
SYNTH_ENDPOINT = f"/waves/v1/{MODEL}/get_speech"
VOICES_ENDPOINT = f"/waves/v1/{MODEL}/get_voices"

# Voices to try — Indian-accented first, then American female voices
VOICES_TO_TRY = [
    # Indian-accented female voices (support English + Hindi)
    ("sakshi", "Indian female — Sakshi"),
    ("sana", "Indian female — Sana"),
    # American-accented female voices
    ("olivia", "American female — Olivia"),
    ("rachel", "American female — Rachel"),
    ("nicole", "American female — Nicole"),
    ("elizabeth", "American female — Elizabeth"),
]

# The FULL v8 narration — imported from the existing script
FULL_NARRATION = (
    "Thirteen minutes. Someone from marketing drops a screenshot of a typo in Slack "
    "— thirteen minutes later, the exact file is identified, a JIRA ticket is created, "
    "and a pull request is opened. No IDE opened. No ticket reassigned "
    "— because there's something in that Slack channel that changes how the whole thing works. "
    "Tara. She lives in your team's Slack, reads everything you share "
    "— screenshots, code, tickets, designs, spreadsheets "
    "— and she works the way your team already works. "
    "She reads the screenshot, searches the codebase across three repositories, "
    "cross-references JIRA tickets, and comes back with a diagnosis "
    "— the exact file, the root cause, a plan to fix it. "
    "Not a suggestion. A diagnosis. "
    "And now the thread becomes the workspace. "
    "A PM adds a requirement. An engineer flags an edge case. "
    "A designer shares updated specs. Each message sharpens the plan "
    "— and Tara adapts with every reply. "
    "This is the part that matters "
    "— the thinking, the debating, the human judgment that no AI can replace "
    "— all happening asynchronously, in one conversation, with no one waiting for anyone. "
    '"Make it real." The plan splits '
    "— three branches, three implementations, running in parallel. "
    "Tara clones the repos, studies your team's patterns "
    "— commit style, architecture, conventions "
    "— and writes code that looks like your team wrote it. "
    "Implements. Tests. Opens pull requests. Three PRs. One conversation. "
    "She does this because she's connected to everything you already use "
    "— JIRA, Bitbucket, GitHub, Figma "
    "— fifty tools, all through Slack. No new tools. No context-switching. "
    "She reads PDFs, images, code in fifty languages "
    "— and everything she does flows back into the thread "
    "as tickets, reports, pull requests "
    "— natural outputs of the conversation. "
    "From a screenshot to production, in minutes. "
    "And this is just Phase Zero. "
    "Coder becomes engineer. Engineer becomes builder. "
    "Less time typing, more time thinking, designing, deciding "
    "— and the implementation happens in parallel, "
    "right where the conversation started. "
    "Tara. Build what matters."
)


def load_env():
    """Load SMALLEST_API_KEY from .env files (video-production/.env or root .env)."""
    env_paths = [
        Path(__file__).resolve().parent.parent.parent / ".env",  # video-production/.env
        Path(__file__).resolve().parent.parent.parent.parent.parent.parent / ".env",  # repo root .env
    ]
    for env_path in env_paths:
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key and value and key not in os.environ:
                            os.environ[key] = value


async def list_voices(api_key: str) -> list[dict] | None:
    """Fetch available voices from the API (optional, for discovery)."""
    url = f"{BASE_URL}{VOICES_ENDPOINT}"
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data.get("voices", [])
    except Exception as e:
        print(f"  Warning: Could not fetch voice list: {e}")
        return None


async def synthesize(
    api_key: str,
    text: str,
    voice_id: str,
    output_path: Path,
    output_format: str = "mp3",
    sample_rate: int = 24000,
    speed: float = 1.0,
    language: str = "en",
) -> bool:
    """Call Smallest.ai Lightning v3.1 get_speech and write audio to disk."""
    url = f"{BASE_URL}{SYNTH_ENDPOINT}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "voice_id": voice_id,
        "sample_rate": sample_rate,
        "speed": speed,
        "language": language,
        "output_format": output_format,
    }

    text_preview = text[:80].replace("\n", " ")
    print(f"  Requesting: voice={voice_id}, format={output_format}, "
          f"rate={sample_rate}, speed={speed}")
    print(f"  Text: \"{text_preview}...\" ({len(text)} chars, ~{len(text.split())} words)")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

            if resp.status_code == 401:
                print(f"  ERROR: 401 Unauthorized — check your SMALLEST_API_KEY")
                return False

            if resp.status_code == 400:
                error_body = resp.text
                print(f"  ERROR: 400 Bad Request — {error_body}")
                return False

            resp.raise_for_status()

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.content)
            size_kb = len(resp.content) / 1024
            print(f"  Success: {output_path.name} ({size_kb:.1f} KB)")
            return True

    except httpx.HTTPStatusError as e:
        print(f"  HTTP error: {e.response.status_code} — {e.response.text[:200]}")
        return False
    except httpx.TimeoutException:
        print(f"  ERROR: Request timed out (300s). Text may be too long for a single request.")
        print(f"  Try splitting into smaller chunks (max ~250 chars recommended).")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


async def synthesize_chunked(
    api_key: str,
    text: str,
    voice_id: str,
    output_path: Path,
    output_format: str = "wav",
    sample_rate: int = 24000,
    speed: float = 1.0,
    language: str = "en",
    max_chunk_chars: int = 230,
) -> bool:
    """Split text into sentence-sized chunks and concatenate audio.

    Lightning v3.1 has a max chunk size of ~250 chars. For long narrations,
    we split at sentence boundaries and concatenate the raw audio.

    For WAV output we concatenate raw PCM and re-add the header.
    For MP3 output we concatenate the MP3 frames directly (works for playback).
    """
    # Split at sentence boundaries
    import re
    raw_sentences = re.split(r'(?<=[.!?])\s+', text)

    # Merge short sentences / split long ones to stay under max_chunk_chars
    chunks: list[str] = []
    current = ""
    for sentence in raw_sentences:
        if not sentence.strip():
            continue
        if len(current) + len(sentence) + 1 <= max_chunk_chars:
            current = f"{current} {sentence}".strip() if current else sentence
        else:
            if current:
                chunks.append(current)
            # If a single sentence exceeds max, split at clause boundaries
            if len(sentence) > max_chunk_chars:
                clause_parts = re.split(r'(?<=[,;—])\s+', sentence)
                sub = ""
                for part in clause_parts:
                    if len(sub) + len(part) + 1 <= max_chunk_chars:
                        sub = f"{sub} {part}".strip() if sub else part
                    else:
                        if sub:
                            chunks.append(sub)
                        sub = part
                if sub:
                    chunks.append(sub)
                current = ""
            else:
                current = sentence
    if current:
        chunks.append(current)

    print(f"  Split into {len(chunks)} chunks (max {max_chunk_chars} chars each)")
    for i, c in enumerate(chunks):
        print(f"    Chunk {i+1}: {len(c)} chars — \"{c[:60]}...\"")

    # Synthesize each chunk
    audio_parts: list[bytes] = []
    for i, chunk in enumerate(chunks):
        print(f"\n  [{i+1}/{len(chunks)}] Synthesizing chunk...")
        url = f"{BASE_URL}{SYNTH_ENDPOINT}"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": chunk,
            "voice_id": voice_id,
            "sample_rate": sample_rate,
            "speed": speed,
            "language": language,
            "output_format": output_format,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, json=payload, headers=headers)

                if resp.status_code != 200:
                    print(f"    ERROR: {resp.status_code} — {resp.text[:200]}")
                    return False

                audio_parts.append(resp.content)
                print(f"    OK ({len(resp.content) / 1024:.1f} KB)")

        except Exception as e:
            print(f"    ERROR on chunk {i+1}: {e}")
            return False

    # Concatenate
    if output_format == "mp3":
        # MP3 frames can be concatenated directly
        combined = b"".join(audio_parts)
    elif output_format == "wav":
        # WAV: skip 44-byte header from all but first chunk, then fix header
        combined = audio_parts[0]
        for part in audio_parts[1:]:
            # Skip WAV header (44 bytes) from subsequent chunks
            combined += part[44:] if len(part) > 44 else part
        # Fix the WAV header sizes
        import struct
        data_size = len(combined) - 44
        file_size = len(combined) - 8
        combined = (
            combined[:4]
            + struct.pack('<I', file_size)
            + combined[8:40]
            + struct.pack('<I', data_size)
            + combined[44:]
        )
    else:
        # PCM: just concatenate raw bytes
        combined = b"".join(audio_parts)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(combined)
    total_kb = len(combined) / 1024
    print(f"\n  Combined output: {output_path.name} ({total_kb:.1f} KB)")
    return True


async def main():
    load_env()

    api_key = os.getenv("SMALLEST_API_KEY") or os.getenv("SMALLEST_AI_API_KEY")
    if not api_key:
        print("=" * 70)
        print("ERROR: No Smallest.ai API key found!")
        print()
        print("To set up:")
        print("  1. Sign up free at https://app.smallest.ai")
        print("  2. Go to https://app.smallest.ai/dashboard/settings/apikeys")
        print("  3. Create an API key")
        print("  4. Add to your .env file:")
        print()
        print("     # In docs/plans/video-production/.env")
        print("     SMALLEST_API_KEY=your_key_here")
        print()
        print("  Or export directly:")
        print("     export SMALLEST_API_KEY=your_key_here")
        print("=" * 70)
        sys.exit(1)

    print(f"API key found: {api_key[:8]}...{api_key[-4:]}")
    print(f"Model: {MODEL}")
    print(f"Narration: {len(FULL_NARRATION)} chars, ~{len(FULL_NARRATION.split())} words")
    print()

    # Step 1: List available voices (optional, for discovery)
    print("--- Fetching available voices ---")
    voices = await list_voices(api_key)
    if voices:
        print(f"  Found {len(voices)} voices:")
        for v in voices:
            tags = v.get("tags", {})
            print(f"    {v['voiceId']:15s}  {v.get('displayName', '?'):12s}  "
                  f"gender={tags.get('gender', '?'):7s}  "
                  f"accent={tags.get('accent', '?'):10s}  "
                  f"langs={tags.get('language', [])}")
    print()

    # Step 2: Generate voiceover for each voice
    output_dir = Path(__file__).resolve().parent.parent / "remotion" / "public" / "voiceover"
    output_dir.mkdir(parents=True, exist_ok=True)

    results: list[tuple[str, str, bool]] = []

    for voice_id, label in VOICES_TO_TRY:
        print(f"{'=' * 60}")
        print(f"Voice: {label} (id={voice_id})")
        print(f"{'=' * 60}")

        output_file = output_dir / f"voice_test_smallest_ai_{voice_id}.mp3"

        # Try single-shot first (the API may handle long text)
        print("\n  Attempting single-shot synthesis...")
        success = await synthesize(
            api_key=api_key,
            text=FULL_NARRATION,
            voice_id=voice_id,
            output_path=output_file,
            output_format="mp3",
            sample_rate=24000,
            speed=1.0,
            language="en",
        )

        if not success:
            # Fall back to chunked synthesis
            print("\n  Falling back to chunked synthesis...")
            success = await synthesize_chunked(
                api_key=api_key,
                text=FULL_NARRATION,
                voice_id=voice_id,
                output_path=output_file,
                output_format="mp3",
                sample_rate=24000,
                speed=1.0,
                language="en",
            )

        results.append((voice_id, label, success))
        print()

    # Summary
    print("=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    for voice_id, label, success in results:
        status = "OK" if success else "FAILED"
        file_path = output_dir / f"voice_test_smallest_ai_{voice_id}.mp3"
        size = ""
        if success and file_path.exists():
            size = f" ({file_path.stat().st_size / 1024:.1f} KB)"
        print(f"  [{status}] {label:35s} -> voice_test_smallest_ai_{voice_id}.mp3{size}")

    successful = [r for r in results if r[2]]
    if successful:
        print(f"\n  {len(successful)}/{len(results)} voices generated successfully.")
        print(f"\n  Output directory: {output_dir}")
        print(f"\n  Listen and compare, then copy your pick to narration.mp3:")
        for voice_id, label, _ in successful:
            print(f'    ffprobe -v error -show_entries format=duration -of csv=p=0 '
                  f'"{output_dir}/voice_test_smallest_ai_{voice_id}.mp3"')
    else:
        print("\n  No voices generated successfully.")
        print("  Check your API key and network connection.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
