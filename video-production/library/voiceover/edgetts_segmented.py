# Origin: v9 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate v9 voiceover using Edge-TTS Neerja via segment stitching.

V9 script: ~168 words, 4 scenes, 90-100 seconds target.

Usage:
    python3 generate_voiceover.py
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
# V9 Narration segments with per-segment voice settings
#
# Each segment: (text, rate, pitch, pause_after_ms)
# ---------------------------------------------------------------------------

SEGMENTS = [
    # === HOOK (0:00-0:20) ===

    # Opening line — measured, attention-grabbing
    (
        "Someone drops a screenshot of a broken layout in Slack.",
        "+0%", "+0Hz", 300,
    ),
    # The proof — building momentum
    (
        "Thirteen minutes later — the exact file is identified, "
        "a JIRA ticket is created, and a pull request is opened.",
        "+0%", "+0Hz", 300,
    ),
    # Punch — staccato
    (
        "No IDE. No context-switching.",
        "-5%", "+0Hz", 200,
    ),
    # Tara reveal — the landing
    (
        "Just a conversation in Slack — with Tara.",
        "-5%", "+1Hz", 600,
    ),

    # === COLLABORATION (0:20-0:50) ===

    # Diagnosis sequence — natural building pace
    (
        "She reads the screenshot, searches three repositories, "
        "cross-references JIRA, and comes back with the root cause.",
        "+0%", "+0Hz", 300,
    ),
    # Diagnosis punch — slower, emphatic
    (
        "Not a suggestion. A diagnosis.",
        "-12%", "+0Hz", 500,
    ),
    # Thread as workspace — flowing
    (
        "And now the thread becomes the workspace. "
        "Sarthak adds a requirement. Yaswanth flags an edge case. "
        "Each message sharpens the plan — and Tara adapts.",
        "+0%", "+0Hz", 300,
    ),
    # Human judgment — weight, gravity
    (
        "This is the part that matters "
        "— the thinking, the debating, the human judgment that no AI can replace.",
        "-5%", "+0Hz", 600,
    ),

    # === EXECUTION (0:50-1:10) ===

    # "Make it real" — energetic command
    (
        "Make it real.",
        "+0%", "+2Hz", 300,
    ),
    # Parallel execution — building energy
    (
        "Three branches. Three implementations. Running in parallel.",
        "+3%", "+0Hz", 200,
    ),
    # Code quality — natural
    (
        "Code that looks like your team wrote it.",
        "+0%", "+0Hz", 200,
    ),
    # Rapid fire — faster
    (
        "Tests. Pull requests.",
        "+5%", "+0Hz", 300,
    ),
    # Payoff — slower, emphatic
    (
        "Three PRs. One conversation.",
        "-10%", "+0Hz", 600,
    ),

    # === IDENTITY (1:10-1:35) ===

    # Core message — measured, direct
    (
        "Less time typing. More time thinking, designing, deciding.",
        "-3%", "+0Hz", 400,
    ),
    # Phase Zero tease — quiet, forward-looking
    (
        "And this is just Phase Zero.",
        "-5%", "+0Hz", 600,
    ),
    # Final tagline — slow, emphatic
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

    list_path.unlink()
    return output_path


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*70}")
    print(f"TARA v9 — Edge-TTS Neerja Voiceover")
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

        # Track section boundaries for timing.ts
        section_markers = {
            "hook_start": 0,
            "collab_start": 4,   # segment index where collab begins
            "exec_start": 8,     # segment index where execution begins
            "identity_start": 13, # segment index where identity begins
        }
        section_times: dict[str, float] = {}
        cumulative_time = 0.0

        for i, (text, rate, pitch, pause_ms) in enumerate(SEGMENTS):
            # Record section boundaries
            for name, seg_idx in section_markers.items():
                if i == seg_idx and name not in section_times:
                    section_times[name] = cumulative_time

            seg_path = tmpdir / f"seg_{i:03d}.mp3"
            preview = text[:60] + ("..." if len(text) > 60 else "")

            print(f"  [{i+1:2d}/{len(SEGMENTS)}] rate={rate:>5s} pitch={pitch:>5s}  \"{preview}\"")

            await generate_segment(text, VOICE, rate, pitch, seg_path)
            dur = get_duration(seg_path)
            total_speech += dur
            cumulative_time += dur
            all_files.append(seg_path)

            if pause_ms > 0:
                silence_path = tmpdir / f"silence_{i:03d}.mp3"
                generate_silence(pause_ms, silence_path)
                total_silence += pause_ms / 1000.0
                cumulative_time += pause_ms / 1000.0
                all_files.append(silence_path)

        print(f"\n  Speech: {total_speech:.1f}s")
        print(f"  Silence: {total_silence:.1f}s")
        print(f"  Expected total: {total_speech + total_silence:.1f}s")
        print()

        # Print section times for timing.ts
        print("  Section timestamps (for timing.ts):")
        for name, t in section_times.items():
            print(f"    {name}: {t:.2f}s")
        print(f"    total: {cumulative_time:.2f}s")
        print()

        # Concatenate
        output_path = OUTPUT_DIR / "narration.mp3"
        print(f"  Stitching {len(all_files)} files...")
        concatenate_files(all_files, output_path)

    # Verify
    final_dur = get_duration(output_path)
    final_size = output_path.stat().st_size / 1024
    mins = int(final_dur // 60)
    secs = final_dur % 60

    print(f"\n{'='*70}")
    print(f"RESULT")
    print(f"{'='*70}")
    print(f"  File:     {output_path}")
    print(f"  Duration: {mins}:{secs:04.1f} ({final_dur:.1f}s)")
    print(f"  Size:     {final_size:.0f} KB")
    print()


if __name__ == "__main__":
    asyncio.run(main())
