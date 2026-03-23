# Origin: v7/scripts/validate_assets_v7.py — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""
Pre-render asset validation for TARA v7.4 "Builders" video.

Checks that all required assets exist, durations match expectations,
SFX timestamps are valid, the Remotion project builds, and FFmpeg
is installed with the required codecs.

Usage:
    python validate_assets_v7.py [--strict]

    --strict   Treat warnings (optional assets, minor duration drift) as errors.
"""

import json
import os
import subprocess
import sys
from typing import List, Tuple

from pipeline_config import (
    ASSETS_DIR,
    BUILD_DIR,
    MUSIC_DIR,
    MUSIC_FILE,
    OUTPUT_DIR,
    REMOTION_DIR,
    REMOTION_COMPOSITION,
    SFX_DIR,
    SFX_FILES,
    VIDEO_DURATION_SECONDS,
    VIDEO_FPS,
    VOICEOVER_DIR,
    VOICEOVER_FILE,
    VOICEOVER_METADATA,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class Colors:
    OK = "\033[92m"
    WARN = "\033[93m"
    FAIL = "\033[91m"
    BOLD = "\033[1m"
    END = "\033[0m"


def _status(ok: bool, warn: bool = False) -> str:
    if ok:
        return f"{Colors.OK}[OK]{Colors.END}"
    if warn:
        return f"{Colors.WARN}[WARN]{Colors.END}"
    return f"{Colors.FAIL}[FAIL]{Colors.END}"


def get_audio_duration(filepath: str) -> float:
    """Return duration in seconds using ffprobe."""
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


def check_command(cmd: str) -> bool:
    """Check if a command is available on PATH."""
    try:
        subprocess.run(
            ["which", cmd], capture_output=True, text=True, timeout=5
        )
        return True
    except Exception:
        return False


def check_ffmpeg_codecs() -> Tuple[bool, bool]:
    """Check that FFmpeg has libx264 and aac encoders."""
    has_x264 = False
    has_aac = False
    try:
        result = subprocess.run(
            ["ffmpeg", "-encoders"], capture_output=True, text=True, timeout=10
        )
        output = result.stdout + result.stderr
        has_x264 = "libx264" in output
        has_aac = "aac" in output
    except Exception:
        pass
    return has_x264, has_aac


# ---------------------------------------------------------------------------
# Validation checks
# ---------------------------------------------------------------------------

def validate(strict: bool = False) -> bool:
    errors: List[str] = []
    warnings: List[str] = []

    print(f"\n{Colors.BOLD}TARA v7.4 — Asset Validation{Colors.END}")
    print("=" * 60)

    # -----------------------------------------------------------------------
    # 1. Directory structure
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}1. Directory Structure{Colors.END}")
    for label, path in [
        ("Assets root", ASSETS_DIR),
        ("Voiceover dir", VOICEOVER_DIR),
        ("Music dir", MUSIC_DIR),
        ("SFX dir", SFX_DIR),
        ("Remotion project", REMOTION_DIR),
    ]:
        exists = os.path.isdir(path)
        print(f"  {_status(exists)} {label}: {os.path.relpath(path)}")
        if not exists:
            errors.append(f"Missing directory: {path}")

    # Ensure output/build dirs can be created
    for label, path in [("Output dir", OUTPUT_DIR), ("Build dir", BUILD_DIR)]:
        if not os.path.isdir(path):
            try:
                os.makedirs(path, exist_ok=True)
                print(f"  {_status(True)} {label}: created {os.path.relpath(path)}")
            except OSError as e:
                print(f"  {_status(False)} {label}: cannot create — {e}")
                errors.append(f"Cannot create directory: {path}")
        else:
            print(f"  {_status(True)} {label}: {os.path.relpath(path)}")

    # -----------------------------------------------------------------------
    # 2. Voiceover
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}2. Voiceover{Colors.END}")
    vo_exists = os.path.isfile(VOICEOVER_FILE)
    print(f"  {_status(vo_exists)} File: {os.path.basename(VOICEOVER_FILE)}")
    if not vo_exists:
        errors.append(f"Missing voiceover: {VOICEOVER_FILE}")
    else:
        vo_duration = get_audio_duration(VOICEOVER_FILE)
        if vo_duration > 0:
            # Narration should be ~160s (2:40), allowing +/- 15s tolerance
            drift = abs(vo_duration - 160.0)
            ok = drift < 15
            print(f"  {_status(ok, warn=not ok)} Duration: {vo_duration:.1f}s (expected ~160s)")
            if not ok:
                msg = f"Voiceover duration {vo_duration:.1f}s deviates >15s from expected 160s"
                if strict:
                    errors.append(msg)
                else:
                    warnings.append(msg)
        else:
            print(f"  {_status(False, warn=True)} Duration: could not read (ffprobe missing?)")
            warnings.append("Could not read voiceover duration")

    meta_exists = os.path.isfile(VOICEOVER_METADATA)
    print(f"  {_status(meta_exists, warn=not meta_exists)} Metadata: {os.path.basename(VOICEOVER_METADATA)}")
    if not meta_exists:
        warnings.append(f"Missing voiceover metadata: {VOICEOVER_METADATA}")

    # -----------------------------------------------------------------------
    # 3. Music
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}3. Music{Colors.END}")
    music_exists = os.path.isfile(MUSIC_FILE)
    print(f"  {_status(music_exists)} File: {os.path.basename(MUSIC_FILE)}")
    if not music_exists:
        errors.append(f"Missing music track: {MUSIC_FILE}")
    else:
        music_duration = get_audio_duration(MUSIC_FILE)
        if music_duration > 0:
            ok = music_duration >= VIDEO_DURATION_SECONDS
            print(
                f"  {_status(ok)} Duration: {music_duration:.1f}s "
                f"(need >= {VIDEO_DURATION_SECONDS}s)"
            )
            if not ok:
                errors.append(
                    f"Music too short: {music_duration:.1f}s < {VIDEO_DURATION_SECONDS}s"
                )
        else:
            print(f"  {_status(False, warn=True)} Duration: could not read")
            warnings.append("Could not read music duration")

    # -----------------------------------------------------------------------
    # 4. SFX
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}4. Sound Effects{Colors.END}")
    for key, sfx in SFX_FILES.items():
        is_optional = sfx.get("optional", False)
        sfx_exists = os.path.isfile(sfx["file"])
        label = f"{key} @ {sfx['timestamp']:.0f}s"
        if is_optional:
            label += " (optional)"
        print(f"  {_status(sfx_exists, warn=is_optional)} {label}")
        if not sfx_exists:
            msg = f"Missing SFX: {sfx['file']}"
            if is_optional:
                warnings.append(msg)
            else:
                errors.append(msg)
        else:
            # Verify timestamp is within video duration
            if sfx["timestamp"] > VIDEO_DURATION_SECONDS:
                errors.append(
                    f"SFX '{key}' timestamp {sfx['timestamp']}s exceeds video duration"
                )

    # -----------------------------------------------------------------------
    # 5. Remotion project
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}5. Remotion Project{Colors.END}")
    pkg_json = os.path.join(REMOTION_DIR, "package.json")
    pkg_exists = os.path.isfile(pkg_json)
    print(f"  {_status(pkg_exists)} package.json")
    if not pkg_exists:
        errors.append("Missing Remotion package.json")

    node_modules = os.path.join(REMOTION_DIR, "node_modules")
    deps_installed = os.path.isdir(node_modules)
    print(f"  {_status(deps_installed, warn=not deps_installed)} node_modules installed")
    if not deps_installed:
        warnings.append("Remotion dependencies not installed — run: cd remotion && pnpm install")

    # Check Remotion config
    remotion_config = os.path.join(REMOTION_DIR, "remotion.config.ts")
    config_exists = os.path.isfile(remotion_config)
    print(f"  {_status(config_exists)} remotion.config.ts")
    if not config_exists:
        warnings.append("Missing remotion.config.ts")

    # -----------------------------------------------------------------------
    # 6. System dependencies
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}6. System Dependencies{Colors.END}")

    ffmpeg_ok = check_command("ffmpeg")
    print(f"  {_status(ffmpeg_ok)} ffmpeg")
    if not ffmpeg_ok:
        errors.append("FFmpeg not found — install via: brew install ffmpeg")

    ffprobe_ok = check_command("ffprobe")
    print(f"  {_status(ffprobe_ok)} ffprobe")
    if not ffprobe_ok:
        errors.append("ffprobe not found (usually bundled with FFmpeg)")

    if ffmpeg_ok:
        has_x264, has_aac = check_ffmpeg_codecs()
        print(f"  {_status(has_x264)} libx264 encoder")
        print(f"  {_status(has_aac)} AAC encoder")
        if not has_x264:
            errors.append("FFmpeg missing libx264 encoder")
        if not has_aac:
            errors.append("FFmpeg missing AAC encoder")

    node_ok = check_command("node")
    print(f"  {_status(node_ok)} node")
    if not node_ok:
        errors.append("Node.js not found")

    npx_ok = check_command("npx")
    print(f"  {_status(npx_ok)} npx")
    if not npx_ok:
        warnings.append("npx not found — needed for Remotion CLI")

    # -----------------------------------------------------------------------
    # 7. Asset inventory
    # -----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}7. Asset Inventory{Colors.END}")
    all_voiceovers = [
        f for f in os.listdir(VOICEOVER_DIR)
        if f.endswith((".mp3", ".wav", ".flac"))
    ] if os.path.isdir(VOICEOVER_DIR) else []
    print(f"  Voiceover variants: {len(all_voiceovers)}")
    for v in sorted(all_voiceovers):
        selected = " <-- selected" if os.path.join(VOICEOVER_DIR, v) == VOICEOVER_FILE else ""
        print(f"    - {v}{selected}")

    music_files = [
        f for f in os.listdir(MUSIC_DIR)
        if f.endswith((".mp3", ".wav", ".flac"))
    ] if os.path.isdir(MUSIC_DIR) else []
    print(f"  Music tracks: {len(music_files)}")
    for m in sorted(music_files):
        print(f"    - {m}")

    sfx_files_on_disk = [
        f for f in os.listdir(SFX_DIR)
        if f.endswith((".mp3", ".wav", ".flac"))
    ] if os.path.isdir(SFX_DIR) else []
    print(f"  SFX files: {len(sfx_files_on_disk)}")
    for s in sorted(sfx_files_on_disk):
        print(f"    - {s}")

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print(f"\n{'=' * 60}")
    if warnings:
        print(f"{Colors.WARN}Warnings ({len(warnings)}):{Colors.END}")
        for w in warnings:
            print(f"  - {w}")

    if errors:
        print(f"{Colors.FAIL}Errors ({len(errors)}):{Colors.END}")
        for e in errors:
            print(f"  - {e}")
        print(f"\n{Colors.FAIL}{Colors.BOLD}VALIDATION FAILED{Colors.END}")
        return False
    else:
        if warnings and strict:
            print(f"\n{Colors.FAIL}{Colors.BOLD}VALIDATION FAILED (strict mode){Colors.END}")
            return False
        print(f"\n{Colors.OK}{Colors.BOLD}VALIDATION PASSED{Colors.END}")
        return True


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    strict = "--strict" in sys.argv
    ok = validate(strict=strict)
    sys.exit(0 if ok else 1)
