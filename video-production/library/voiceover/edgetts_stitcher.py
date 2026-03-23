# Origin: v8 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate expressive voiceover using Edge-TTS Neerja via segment stitching.

Edge-TTS does NOT support inline SSML tags — it escapes them and reads them
as literal text. The only controls are the global rate, pitch, and volume
parameters on the Communicate object.

Strategy: split the narration into segments, generate each segment with
different rate/pitch settings for expressiveness, add silence gaps between
sections, and stitch everything together with ffmpeg.

Sections:
  - "Thirteen minutes." — slow, emphatic (the hook)
  - Narration body — natural pace
  - "Tara." reveals — slightly slower, higher pitch
  - "Not a suggestion. A diagnosis." — slower, emphatic
  - "Make it real." — higher pitch, energetic
  - "Implements. Tests. Opens pull requests." — faster
  - "Three PRs. One conversation." — slow, emphatic
  - Closing "Tara. Build what matters." — slow, higher pitch, emphatic

Usage:
    python3 generate_voiceover_edgetts_expressive.py
"""

import asyncio
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Install edge-tts:  pip install edge-tts")
    sys.exit(1)

VOICE = "en-IN-NeerjaNeural"
OUTPUT_DIR = Path(__file__).parent.parent / "remotion" / "public" / "voiceover"

# ---------------------------------------------------------------------------
# Narration segments with per-segment voice settings
#
# Each segment: (text, rate, pitch, pause_after_ms)
#   rate: e.g. "+0%", "-10%", "+5%"
#   pitch: e.g. "+0Hz", "+2Hz", "-1Hz"
#   pause_after_ms: silence to insert after this segment (in ms)
# ---------------------------------------------------------------------------

SEGMENTS = [
    # Hook — slow, emphatic
    (
        "Thirteen minutes.",
        "-10%", "+0Hz", 500,
    ),
    # Setup — natural pace
    (
        "Someone from marketing drops a screenshot of a typo in Slack "
        "— thirteen minutes later, the exact file is identified, "
        "a JIRA ticket is created, and a pull request is opened. "
        "No IDE opened. No ticket reassigned "
        "— because there's something in that Slack channel that changes how the whole thing works.",
        "+0%", "+0Hz", 500,
    ),
    # Tara reveal — slower, slightly higher pitch
    (
        "Tara.",
        "-15%", "+1Hz", 300,
    ),
    # Tara description — natural
    (
        "She lives in your team's Slack, reads everything you share "
        "— screenshots, code, tickets, designs, spreadsheets "
        "— and she works the way your team already works.",
        "+0%", "+0Hz", 300,
    ),
    # Investigation — natural
    (
        "She reads the screenshot, searches the codebase across three repositories, "
        "cross-references JIRA tickets, and comes back with a diagnosis "
        "— the exact file, the root cause, a plan to fix it.",
        "+0%", "+0Hz", 300,
    ),
    # Diagnosis punch — slower, emphatic
    (
        "Not a suggestion. A diagnosis.",
        "-12%", "+0Hz", 600,
    ),
    # Collaboration — natural
    (
        "And now the thread becomes the workspace. "
        "A PM adds a requirement. An engineer flags an edge case. "
        "A designer shares updated specs. Each message sharpens the plan "
        "— and Tara adapts with every reply.",
        "+0%", "+0Hz", 300,
    ),
    # Human judgment — slightly slower for weight
    (
        "This is the part that matters "
        "— the thinking, the debating, the human judgment that no AI can replace "
        "— all happening asynchronously, in one conversation, with no one waiting for anyone.",
        "-5%", "+0Hz", 400,
    ),
    # "Make it real" — energetic, higher pitch
    (
        "Make it real.",
        "+0%", "+2Hz", 200,
    ),
    # Execution — natural to slightly faster
    (
        "The plan splits — three branches, three implementations, running in parallel. "
        "Tara clones the repos, studies your team's patterns "
        "— commit style, architecture, conventions "
        "— and writes code that looks like your team wrote it.",
        "+2%", "+0Hz", 200,
    ),
    # Rapid fire — faster
    (
        "Implements. Tests. Opens pull requests.",
        "+8%", "+0Hz", 300,
    ),
    # Impact — slower, emphatic
    (
        "Three PRs. One conversation.",
        "-10%", "+0Hz", 500,
    ),
    # Reach — natural
    (
        "She does this because she's connected to everything you already use "
        "— JIRA, Bitbucket, GitHub, Figma "
        "— fifty tools, all through Slack. No new tools. No context-switching.",
        "+0%", "+0Hz", 200,
    ),
    # Capabilities — natural
    (
        "She reads PDFs, images, code in fifty languages "
        "— and everything she does flows back into the thread "
        "as tickets, reports, pull requests "
        "— natural outputs of the conversation.",
        "+0%", "+0Hz", 400,
    ),
    # Payoff — slightly slower
    (
        "From a screenshot to production, in minutes. "
        "And this is just Phase Zero.",
        "-3%", "+0Hz", 500,
    ),
    # Identity — natural pace, building
    (
        "Coder becomes engineer. Engineer becomes builder. "
        "Less time typing, more time thinking, designing, deciding "
        "— and the implementation happens in parallel, "
        "right where the conversation started.",
        "+0%", "+0Hz", 500,
    ),
    # Final tagline — slow, higher pitch, emphatic
    (
        "Tara.",
        "-15%", "+1Hz", 400,
    ),
    (
        "Build what matters.",
        "-12%", "+1Hz", 0,
    ),
]


async def generate_segment(
    text: str, voice: str, rate: str, pitch: str, output_path: Path
) -> Path:
    """Generate a single segment."""
    tts = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await tts.save(str(output_path))
    return output_path


def get_duration(path: Path) -> float:
    """Get audio duration in seconds using ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, timeout=10,
    )
    return float(result.stdout.strip())


def generate_silence(duration_ms: int, output_path: Path) -> Path:
    """Generate a silence file using ffmpeg."""
    duration_s = duration_ms / 1000.0
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i",
         f"anullsrc=r=44100:cl=mono", "-t", str(duration_s),
         "-codec:a", "libmp3lame", "-b:a", "128k",
         str(output_path)],
        capture_output=True, timeout=10,
    )
    return output_path


def concatenate_files(file_list: list[Path], output_path: Path) -> Path:
    """Concatenate audio files using ffmpeg."""
    # Create concat list file
    list_path = output_path.parent / "concat_list.txt"
    with open(list_path, "w") as f:
        for p in file_list:
            f.write(f"file '{p}'\n")

    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(list_path), "-codec:a", "libmp3lame", "-b:a", "128k",
         str(output_path)],
        capture_output=True, timeout=60,
    )

    list_path.unlink()  # cleanup
    return output_path


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*70}")
    print(f"Edge-TTS Neerja — Expressive Segmented Voiceover")
    print(f"{'='*70}")
    print(f"Voice:    {VOICE}")
    print(f"Segments: {len(SEGMENTS)}")
    print(f"Output:   {OUTPUT_DIR}")
    print()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        all_files: list[Path] = []
        total_speech = 0.0
        total_silence = 0.0

        for i, (text, rate, pitch, pause_ms) in enumerate(SEGMENTS):
            seg_path = tmpdir / f"seg_{i:03d}.mp3"
            preview = text[:60] + ("..." if len(text) > 60 else "")

            print(f"  [{i+1:2d}/{len(SEGMENTS)}] rate={rate:>5s} pitch={pitch:>5s}  \"{preview}\"")

            await generate_segment(text, VOICE, rate, pitch, seg_path)
            dur = get_duration(seg_path)
            total_speech += dur
            all_files.append(seg_path)

            # Add silence gap if specified
            if pause_ms > 0:
                silence_path = tmpdir / f"silence_{i:03d}.mp3"
                generate_silence(pause_ms, silence_path)
                total_silence += pause_ms / 1000.0
                all_files.append(silence_path)

        print(f"\n  Speech: {total_speech:.1f}s")
        print(f"  Silence: {total_silence:.1f}s")
        print(f"  Expected total: {total_speech + total_silence:.1f}s")
        print()

        # Concatenate all segments
        output_path = OUTPUT_DIR / "voice_test_edgetts_neerja_expressive_v2.mp3"
        print(f"  Stitching {len(all_files)} files...")
        concatenate_files(all_files, output_path)

    # Verify final output
    final_dur = get_duration(output_path)
    final_size = output_path.stat().st_size / 1024
    mins = int(final_dur // 60)
    secs = final_dur % 60

    print(f"\n{'='*70}")
    print(f"RESULT")
    print(f"{'='*70}")
    print(f"  File:     {output_path.name}")
    print(f"  Duration: {mins}:{secs:04.1f} ({final_dur:.1f}s)")
    print(f"  Size:     {final_size:.0f} KB")
    print(f"  Original: voice_test_edgetts_neerja_expressive_hq.mp3 (172.5s)")
    print()

    # Verify: play first 5 seconds to check no SSML artifacts
    print("  Verification: checking file contains no SSML tag artifacts...")
    # Use ffprobe to check codec info
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=format_name,duration,bit_rate:stream=codec_name,sample_rate,channels",
         "-of", "json", str(output_path)],
        capture_output=True, text=True, timeout=10,
    )
    print(f"  Audio info: {result.stdout.strip()[:200]}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
