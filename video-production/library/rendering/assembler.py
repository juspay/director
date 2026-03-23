# Origin: v7/scripts/assemble_video_v7.py — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""
FFmpeg assembly pipeline for TARA v7.4 "Builders" video.

Takes Remotion-rendered video and audio assets, mixes audio tracks,
applies color grading, and produces multiple output formats.

Usage:
    python assemble_video_v7.py --quality final
    python assemble_video_v7.py --quality web
    python assemble_video_v7.py --quality social [--social-duration 30]
    python assemble_video_v7.py --all   # generate all formats

Inputs (expected in build/):
    - remotion-render.mp4   — silent video from Remotion
    OR the video + audio can be supplied via --video and --audio flags.

Inputs (from assets/):
    - voiceover, music, SFX files per pipeline_config
"""

import argparse
import os
import subprocess
import sys
import time
from typing import List, Optional

from pipeline_config import (
    BUILD_DIR,
    CANVAS_COLOR,
    MUSIC_FILE,
    OUTPUT_DIR,
    PRESETS,
    QUALITY_PROFILES,
    SFX_FILES,
    VIDEO_DURATION_SECONDS,
    VIDEO_FPS,
    VIDEO_HEIGHT,
    VIDEO_WIDTH,
    VOICEOVER_FILE,
    build_path,
    output_path,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run(cmd: List[str], label: str, dry_run: bool = False) -> bool:
    """Run a subprocess, printing status."""
    print(f"\n  [{label}]")
    print(f"  $ {' '.join(cmd[:6])}{'...' if len(cmd) > 6 else ''}")
    if dry_run:
        print("  (dry run — skipped)")
        return True
    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True)
    elapsed = time.time() - start
    if result.returncode != 0:
        print(f"  FAILED ({elapsed:.1f}s)")
        print(f"  stderr: {result.stderr[:500]}")
        return False
    print(f"  OK ({elapsed:.1f}s)")
    return True


def get_duration(filepath: str) -> float:
    """Get media duration in seconds via ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                filepath,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())
    except Exception:
        return -1.0


# ---------------------------------------------------------------------------
# Audio mixing
# ---------------------------------------------------------------------------

def mix_audio(
    voiceover: str,
    music: str,
    sfx_entries: dict,
    output_file: str,
    duration: float,
    fade_in: float = 0.5,
    fade_out: float = 2.0,
    dry_run: bool = False,
) -> bool:
    """
    Mix voiceover, music, and SFX into a single audio track using FFmpeg.

    Music is ducked under voiceover using sidechaincompress.
    SFX are placed at their configured timestamps.
    """
    # Build FFmpeg complex filter for audio mixing
    inputs: List[str] = []
    filter_parts: List[str] = []
    input_idx = 0

    # Input 0: voiceover
    inputs += ["-i", voiceover]
    vo_idx = input_idx
    input_idx += 1

    # Input 1: music (trimmed to duration, faded)
    inputs += ["-i", music]
    music_idx = input_idx
    input_idx += 1

    # Fade and trim music
    filter_parts.append(
        f"[{music_idx}:a]atrim=0:{duration},"
        f"afade=t=in:st=0:d={fade_in},"
        f"afade=t=out:st={duration - fade_out}:d={fade_out},"
        f"volume=0.35[music]"
    )

    # Process voiceover (normalize)
    filter_parts.append(
        f"[{vo_idx}:a]loudnorm=I=-16:TP=-1.5:LRA=11[vo]"
    )

    # SFX inputs
    sfx_labels: List[str] = []
    for key, sfx in sfx_entries.items():
        if not os.path.isfile(sfx["file"]):
            if sfx.get("optional"):
                continue
            print(f"  WARNING: Missing SFX {key}, skipping")
            continue
        inputs += ["-i", sfx["file"]]
        label = f"sfx_{key}"
        # Delay SFX to its timestamp (adelay uses milliseconds)
        delay_ms = int(sfx["timestamp"] * 1000)
        filter_parts.append(
            f"[{input_idx}:a]adelay={delay_ms}|{delay_ms},volume=0.7[{label}]"
        )
        sfx_labels.append(f"[{label}]")
        input_idx += 1

    # Mix all tracks
    mix_inputs = f"[vo][music]{' '.join(sfx_labels)}"
    n_tracks = 2 + len(sfx_labels)
    filter_parts.append(
        f"{mix_inputs}amix=inputs={n_tracks}:duration=longest:dropout_transition=2,"
        f"loudnorm=I=-14:TP=-1:LRA=11[out]"
    )

    filter_complex = ";\n".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "pcm_s24le",
        "-ar", "44100",
        "-ac", "2",
        output_file,
    ]

    return run(cmd, "Mix audio", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Video assembly
# ---------------------------------------------------------------------------

def assemble(
    video_file: str,
    audio_file: str,
    output_file: str,
    preset_name: str,
    dry_run: bool = False,
) -> bool:
    """Combine rendered video with mixed audio using the specified preset."""
    preset = PRESETS[preset_name]

    cmd = [
        "ffmpeg", "-y",
        "-i", video_file,
        "-i", audio_file,
        "-map", "0:v:0",
        "-map", "1:a:0",
        *preset.ffmpeg_video_args(),
        *preset.ffmpeg_audio_args(),
        "-movflags", "+faststart",
        "-metadata", "title=TARA - Build What Matters",
        "-metadata", "artist=Juspay",
        "-metadata", "year=2026",
        output_file,
    ]

    return run(cmd, f"Assemble ({preset_name})", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Color grading (ensure dark navy renders correctly)
# ---------------------------------------------------------------------------

def apply_color_grade(
    input_file: str,
    output_file: str,
    dry_run: bool = False,
) -> bool:
    """
    Apply subtle color grading to ensure the dark navy #0f172a canvas
    renders correctly across displays. Adjusts black levels and ensures
    the navy hue isn't crushed to pure black.
    """
    # Lift blacks slightly to preserve the navy-vs-black distinction,
    # add a tiny blue tint to shadows to keep the slate feel.
    color_filter = (
        "eq=brightness=0.02:saturation=1.05,"
        "curves=m='0/0.01 0.1/0.11 0.5/0.5 1/1':"
        "b='0/0.02 0.1/0.12 0.5/0.5 1/1'"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_file,
        "-vf", color_filter,
        "-c:v", "libx264", "-crf", "16", "-preset", "slow",
        "-c:a", "copy",
        output_file,
    ]

    return run(cmd, "Color grading", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Thumbnail generation
# ---------------------------------------------------------------------------

def generate_thumbnail(
    video_file: str,
    output_file: str,
    timestamp: float = 52.0,
    dry_run: bool = False,
) -> bool:
    """Extract a frame at the given timestamp as a PNG thumbnail."""
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(timestamp),
        "-i", video_file,
        "-vframes", "1",
        "-q:v", "2",
        output_file,
    ]
    return run(cmd, f"Thumbnail @ {timestamp}s", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Social clip
# ---------------------------------------------------------------------------

def create_social_clip(
    video_file: str,
    output_file: str,
    duration: float = 30.0,
    square: bool = False,
    dry_run: bool = False,
) -> bool:
    """Create a short clip for social media. Optionally square-cropped."""
    preset = PRESETS["social"]

    vf_filters = []
    if square:
        # Center-crop to 1080x1080 from 1920x1080
        vf_filters.append("crop=1080:1080:420:0")
    else:
        vf_filters.append(f"scale={preset.width}:{preset.height}")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_file,
        "-t", str(duration),
        "-vf", ",".join(vf_filters),
        "-c:v", preset.video_codec,
        "-crf", str(preset.video_crf),
        "-preset", preset.video_preset,
        "-pix_fmt", preset.pixel_format,
        *preset.ffmpeg_audio_args(),
        "-movflags", "+faststart",
        output_file,
    ]

    return run(cmd, f"Social clip ({duration:.0f}s, {'square' if square else 'wide'})", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Web preview
# ---------------------------------------------------------------------------

def create_web_preview(
    video_file: str,
    output_file: str,
    dry_run: bool = False,
) -> bool:
    """Create a 720p web-optimized version."""
    preset = PRESETS["web"]
    cmd = [
        "ffmpeg", "-y",
        "-i", video_file,
        *preset.ffmpeg_video_args(),
        *preset.ffmpeg_audio_args(),
        "-movflags", "+faststart",
        output_file,
    ]
    return run(cmd, "Web preview (720p)", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Full assembly pipeline
# ---------------------------------------------------------------------------

def run_assembly(
    quality: str,
    video_input: Optional[str] = None,
    voiceover_input: Optional[str] = None,
    music_input: Optional[str] = None,
    skip_color_grade: bool = False,
    social_duration: float = 30.0,
    social_square: bool = False,
    dry_run: bool = False,
) -> bool:
    """
    Run the full assembly pipeline for a given quality level.

    Steps:
        1. Mix audio (voiceover + music + SFX)
        2. Combine video + mixed audio
        3. Apply color grading (final only)
        4. Generate thumbnail
        5. Create web preview (final only)
        6. Create social clip (final only)
    """
    profile = QUALITY_PROFILES.get(quality)
    if not profile:
        print(f"ERROR: Unknown quality '{quality}'. Use: {list(QUALITY_PROFILES.keys())}")
        return False

    preset_name = profile.encoding_preset
    video_src = video_input or build_path("remotion-render.mp4")
    vo_src = voiceover_input or VOICEOVER_FILE
    music_src = music_input or MUSIC_FILE

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(BUILD_DIR, exist_ok=True)

    print(f"\n{'=' * 60}")
    print(f"TARA v7.4 Assembly — quality={quality}")
    print(f"{'=' * 60}")

    # 1. Mix audio
    mixed_audio = build_path("mixed-audio.wav")
    duration = get_duration(video_src)
    if duration <= 0:
        duration = float(VIDEO_DURATION_SECONDS)
        print(f"  Could not read video duration, using default {duration}s")

    if not mix_audio(
        voiceover=vo_src,
        music=music_src,
        sfx_entries=SFX_FILES,
        output_file=mixed_audio,
        duration=duration,
        fade_in=profile.audio_fade_in,
        fade_out=profile.audio_fade_out,
        dry_run=dry_run,
    ):
        return False

    # 2. Assemble video + audio
    assembled = build_path("assembled.mp4")
    if not assemble(video_src, mixed_audio, assembled, preset_name, dry_run=dry_run):
        return False

    # 3. Color grading (final quality only)
    if quality == "final" and not skip_color_grade:
        graded = output_path("final")
        if not apply_color_grade(assembled, graded, dry_run=dry_run):
            return False
        final_output = graded
    else:
        final_output = output_path(quality)
        # Just copy/move assembled to output
        if not dry_run:
            cmd = ["cp", assembled, final_output]
            run(cmd, "Copy to output", dry_run=dry_run)
        final_output = output_path(quality)

    print(f"\n  Output: {final_output}")

    # 4. Thumbnail
    if profile.generate_thumbnail:
        thumb = output_path(quality, suffix="thumbnail", ext="png")
        generate_thumbnail(
            final_output, thumb, timestamp=profile.thumbnail_time, dry_run=dry_run
        )

    # 5. Web preview (final quality only)
    if quality == "final":
        web_out = output_path("web")
        create_web_preview(final_output, web_out, dry_run=dry_run)

    # 6. Social clip (final quality only)
    if quality == "final":
        social_out = output_path("social", suffix="30s")
        create_social_clip(
            final_output, social_out,
            duration=social_duration,
            square=social_square,
            dry_run=dry_run,
        )

    print(f"\n{'=' * 60}")
    print(f"Assembly complete ({quality})")
    print(f"{'=' * 60}\n")
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="TARA v7.4 FFmpeg assembly pipeline"
    )
    parser.add_argument(
        "--quality", choices=["draft", "preview", "final"],
        default="preview",
        help="Quality profile (default: preview)",
    )
    parser.add_argument("--all", action="store_true", help="Generate all formats")
    parser.add_argument("--video", help="Override video input path")
    parser.add_argument("--voiceover", help="Override voiceover input path")
    parser.add_argument("--music", help="Override music input path")
    parser.add_argument("--skip-color-grade", action="store_true")
    parser.add_argument("--social-duration", type=float, default=30.0)
    parser.add_argument("--social-square", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Print commands without executing")

    args = parser.parse_args()

    if args.all:
        for q in ["draft", "preview", "final"]:
            ok = run_assembly(
                quality=q,
                video_input=args.video,
                voiceover_input=args.voiceover,
                music_input=args.music,
                skip_color_grade=args.skip_color_grade,
                social_duration=args.social_duration,
                social_square=args.social_square,
                dry_run=args.dry_run,
            )
            if not ok:
                sys.exit(1)
    else:
        ok = run_assembly(
            quality=args.quality,
            video_input=args.video,
            voiceover_input=args.voiceover,
            music_input=args.music,
            skip_color_grade=args.skip_color_grade,
            social_duration=args.social_duration,
            social_square=args.social_square,
            dry_run=args.dry_run,
        )
        if not ok:
            sys.exit(1)


if __name__ == "__main__":
    main()
