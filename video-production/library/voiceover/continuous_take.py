# Origin: v5 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate voiceover audio segments for TARA Video v5 using ElevenLabs API.

v5 narration: continuous river flow with force-based morph transitions.
Generates both individual segments (for Remotion sync) and one continuous take.
"""

import asyncio
import os
import sys
from pathlib import Path

try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx")
    sys.exit(1)

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"

VOICE_SETTINGS = {
    "stability": 0.58,       # Warm but controlled — slightly lower than v2 for more natural feel
    "similarity_boost": 0.80,
    "style": 0.35,
    "use_speaker_boost": True,
}

# v5 narration — 7 segments that form one continuous river
SEGMENTS = {
    "seg1_hook": (
        "Thirteen minutes. Someone from marketing drops a screenshot of a typo in Slack "
        "— thirteen minutes later, the exact file is identified, a JIRA ticket is created, "
        "and a pull request is opened. No IDE opened. No ticket reassigned "
        "— because there's something in that Slack channel that changes how the whole thing works."
    ),
    "seg2_tara": (
        "Tara. She lives in your team's Slack, reads everything you share "
        "— screenshots, code, tickets, designs, spreadsheets "
        "— and she works the way your team already works. "
        "She reads the screenshot, searches the codebase across three repositories, "
        "cross-references JIRA tickets, and comes back with a diagnosis "
        "— the exact file, the root cause, a plan to fix it. "
        "Not a suggestion. A diagnosis."
    ),
    "seg3_collab": (
        "And now the thread becomes the workspace. "
        "A PM adds a requirement. An engineer flags an edge case. "
        "A designer shares updated specs. Each message sharpens the plan "
        "— and Tara adapts with every reply. "
        "This is the part that matters "
        "— the thinking, the debating, the human judgment that no AI can replace "
        "— all happening asynchronously, in one conversation, with no one waiting for anyone."
    ),
    "seg4_execute": (
        '"Make it real." The plan splits '
        "— three branches, three implementations, running in parallel. "
        "Tara clones the repos, studies your team's patterns "
        "— commit style, architecture, conventions "
        "— and writes code that looks like your team wrote it. "
        "Implements. Tests. Opens pull requests. Three PRs. One conversation."
    ),
    "seg5_reach": (
        "She does this because she's connected to everything you already use "
        "— JIRA, Bitbucket, GitHub, Figma "
        "— fifty tools, all through Slack. No new tools. No context-switching. "
        "She reads PDFs, images, code in fifty languages "
        "— and everything she does flows back into the thread "
        "as tickets, reports, pull requests "
        "— natural outputs of the conversation."
    ),
    "seg6_payoff": (
        "From a screenshot to production, in minutes. "
        "And this is just Phase Zero."
    ),
    "seg7_identity": (
        "Coder becomes engineer. Engineer becomes builder. "
        "Less time typing, more time thinking, designing, deciding "
        "— and the implementation happens in parallel, "
        "right where the conversation started. "
        "Tara. Build what matters."
    ),
}

# Full continuous narration — for generating one consistent take
FULL_NARRATION = " ".join(SEGMENTS.values())


async def generate_voiceover(
    scene_id: str,
    text: str,
    output_path: Path,
    voice_id: str,
    api_key: str,
) -> Path:
    """Generate a single voiceover segment."""
    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": MODEL,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": VOICE_SETTINGS,
    }

    print(f"  Generating {scene_id}...")
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        size_kb = len(response.content) / 1024
        print(f"  ✓ {scene_id} → {output_path.name} ({size_kb:.0f} KB)")

    return output_path


async def main():
    # Load API keys from video-production/.env
    env_path = Path(__file__).parent.parent / ".env"
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

    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")

    if not api_key:
        print("ERROR: Set ELEVENLABS_API_KEY environment variable or add to ../. env")
        sys.exit(1)
    if not voice_id:
        print("ERROR: Set ELEVENLABS_VOICE_ID environment variable or add to ../.env")
        print("  Suggestions: 1qEiC6qsybMkmnNdVMbK (v1 voice)")
        sys.exit(1)

    output_dir = Path(__file__).parent / "remotion" / "public" / "voiceover"
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Generate continuous take first for voice consistency ---
    print(f"\n🎙  Generating continuous narration ({len(FULL_NARRATION)} chars)...\n")
    complete_path = output_dir / "complete_narration.mp3"
    await generate_voiceover("complete_narration", FULL_NARRATION, complete_path, voice_id, api_key)

    # --- Generate individual segments ---
    print(f"\n🎙  Generating {len(SEGMENTS)} individual segments...\n")
    tasks = []
    for scene_id, text in SEGMENTS.items():
        output_path = output_dir / f"{scene_id}.mp3"
        tasks.append(generate_voiceover(scene_id, text, output_path, voice_id, api_key))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Report results
    print("\n--- Results ---")
    success = 0
    for scene_id, result in zip(SEGMENTS.keys(), results):
        if isinstance(result, Exception):
            print(f"  ✗ {scene_id}: {result}")
        else:
            success += 1

    print(f"\n{success}/{len(SEGMENTS)} segments generated successfully.")
    print(f"Complete narration: {'✓' if complete_path.exists() else '✗'}")

    if success == len(SEGMENTS):
        print("\n📏 Measure durations with ffprobe:")
        print("  cd remotion/public/voiceover")
        for scene_id in SEGMENTS:
            print(f'  ffprobe -v error -show_entries format=duration -of csv=p=0 {scene_id}.mp3')
        print("\nThen update src/durations.ts with actual values + 0.5s breathing room.")


if __name__ == "__main__":
    asyncio.run(main())
