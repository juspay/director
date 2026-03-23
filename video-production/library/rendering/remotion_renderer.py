# Origin: v7/scripts/render_video_v7.py — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""
Master render orchestration for TARA v7.4 "Builders" video.

Pipeline:
    1. Validate all required assets
    2. Render video frames via Remotion CLI
    3. Mix audio tracks via FFmpeg (delegates to assemble_video_v7)
    4. Compose final video via FFmpeg
    5. Output: final MP4 at 1920x1080, 30fps, H.264

Quality presets:
    draft   — fast/low quality (ultrafast, CRF 28, skip every other frame)
    preview — medium quality (medium preset, CRF 23)
    final   — slow/high quality (slow preset, CRF 18, color grading)

Usage:
    python render_video_v7.py --quality draft
    python render_video_v7.py --quality preview
    python render_video_v7.py --quality final
    python render_video_v7.py --quality final --skip-validation --skip-remotion
"""

import argparse
import os
import subprocess
import sys
import time
from typing import List, Optional

from pipeline_config import (
    BUILD_DIR,
    MUSIC_FILE,
    OUTPUT_DIR,
    QUALITY_PROFILES,
    REMOTION_COMPOSITION,
    REMOTION_DIR,
    VIDEO_DURATION_SECONDS,
    VIDEO_FPS,
    VIDEO_HEIGHT,
    VIDEO_WIDTH,
    VOICEOVER_FILE,
    build_path,
    output_path,
)

# ---------------------------------------------------------------------------
# Chrome detection (macOS arm64 workaround)
# ---------------------------------------------------------------------------

def find_chrome_executable() -> Optional[str]:
    """
    Find a working Chrome/Chromium executable.

    Remotion bundles Chrome Headless Shell, but on macOS arm64 the downloaded
    binary can fail codesign validation (spawn ENOTSUP / error -88).
    This function finds the system Chrome as a fallback.
    """
    candidates = [
        # Standard macOS install
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        # User-specific installs
        os.path.expanduser("~/Desktop/Apps/Google Chrome.app/Contents/MacOS/Google Chrome"),
        os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        # Chromium
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        # Brave
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    ]
    # Also try mdfind on macOS
    try:
        result = subprocess.run(
            ["mdfind", "kMDItemCFBundleIdentifier == 'com.google.Chrome'"],
            capture_output=True, text=True, timeout=5,
        )
        for app_path in result.stdout.strip().split("\n"):
            if app_path:
                chrome_bin = os.path.join(app_path, "Contents", "MacOS", "Google Chrome")
                if chrome_bin not in candidates:
                    candidates.insert(0, chrome_bin)
    except Exception:
        pass

    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def banner(msg: str):
    width = 60
    print(f"\n{'=' * width}")
    print(f"  {msg}")
    print(f"{'=' * width}")


def run_cmd(cmd: List[str], label: str, cwd: Optional[str] = None) -> bool:
    """Execute a command, stream output, and return success status."""
    print(f"\n  [{label}]")
    cmd_preview = " ".join(cmd[:8])
    if len(cmd) > 8:
        cmd_preview += " ..."
    print(f"  $ {cmd_preview}")

    start = time.time()
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=cwd,
        )
        last_line = ""
        for line in proc.stdout:
            stripped = line.rstrip()
            if stripped:
                last_line = stripped
                # Print progress lines (Remotion/FFmpeg both emit progress)
                if any(k in stripped.lower() for k in ["frame", "render", "progress", "time=", "speed="]):
                    print(f"    {stripped}")
        proc.wait()
        elapsed = time.time() - start

        if proc.returncode != 0:
            print(f"  FAILED (exit {proc.returncode}, {elapsed:.1f}s)")
            if last_line:
                print(f"  Last output: {last_line}")
            return False
        print(f"  OK ({elapsed:.1f}s)")
        return True
    except FileNotFoundError:
        print(f"  FAILED: command not found — {cmd[0]}")
        return False
    except Exception as e:
        print(f"  FAILED: {e}")
        return False


# ---------------------------------------------------------------------------
# Step 1: Validation
# ---------------------------------------------------------------------------

def step_validate() -> bool:
    """Run asset validation."""
    banner("Step 1/4 — Validate Assets")
    from validate_assets_v7 import validate
    return validate(strict=False)


# ---------------------------------------------------------------------------
# Step 2: Remotion render
# ---------------------------------------------------------------------------

def step_render_remotion(quality: str) -> bool:
    """Render video frames using Remotion CLI."""
    banner("Step 2/4 — Render Video (Remotion)")

    profile = QUALITY_PROFILES[quality]
    output_file = build_path("remotion-render.mp4")
    os.makedirs(BUILD_DIR, exist_ok=True)

    # Check if npx/remotion is available
    node_modules_bin = os.path.join(REMOTION_DIR, "node_modules", ".bin", "remotion")
    if os.path.isfile(node_modules_bin):
        remotion_cmd = node_modules_bin
    else:
        remotion_cmd = "npx"

    cmd = []
    if remotion_cmd == "npx":
        cmd = ["npx", "remotion", "render"]
    else:
        cmd = [remotion_cmd, "render"]

    cmd += [
        REMOTION_COMPOSITION,
        output_file,
        "--codec", "h264",
        "--image-format", "jpeg",
        "--jpeg-quality", str(profile.remotion_jpeg_quality),
        "--concurrency", str(profile.remotion_concurrency),
        "--fps", str(VIDEO_FPS),
        "--width", str(VIDEO_WIDTH),
        "--height", str(VIDEO_HEIGHT),
    ]

    if profile.remotion_every_nth_frame > 1:
        cmd += ["--every-nth-frame", str(profile.remotion_every_nth_frame)]

    if profile.remotion_scale != 1.0:
        cmd += ["--scale", str(profile.remotion_scale)]

    # Mute — we mix audio separately
    cmd += ["--muted"]

    # On macOS arm64, Remotion's bundled Chrome Headless Shell may fail with
    # ENOTSUP (-88) due to codesign issues. Use system Chrome as fallback.
    chrome = os.environ.get("REMOTION_CHROME_EXECUTABLE") or find_chrome_executable()
    if chrome:
        cmd += ["--browser-executable", chrome]
        print(f"  Using browser: {chrome}")

    return run_cmd(cmd, f"Remotion render ({quality})", cwd=REMOTION_DIR)


# ---------------------------------------------------------------------------
# Step 3: Audio mixing
# ---------------------------------------------------------------------------

def step_mix_audio(quality: str) -> bool:
    """Mix voiceover, music, and SFX into a single audio track."""
    banner("Step 3/4 — Mix Audio")

    from assemble_video_v7 import mix_audio
    from pipeline_config import SFX_FILES

    profile = QUALITY_PROFILES[quality]
    output_file = build_path("mixed-audio.wav")
    os.makedirs(BUILD_DIR, exist_ok=True)

    return mix_audio(
        voiceover=VOICEOVER_FILE,
        music=MUSIC_FILE,
        sfx_entries=SFX_FILES,
        output_file=output_file,
        duration=float(VIDEO_DURATION_SECONDS),
        fade_in=profile.audio_fade_in,
        fade_out=profile.audio_fade_out,
    )


# ---------------------------------------------------------------------------
# Step 4: Final composition
# ---------------------------------------------------------------------------

def step_compose_final(quality: str) -> bool:
    """Compose final video from rendered frames + mixed audio."""
    banner("Step 4/4 — Compose Final Video")

    from assemble_video_v7 import assemble, apply_color_grade, generate_thumbnail, create_web_preview, create_social_clip

    profile = QUALITY_PROFILES[quality]
    video_input = build_path("remotion-render.mp4")
    audio_input = build_path("mixed-audio.wav")
    assembled = build_path("assembled.mp4")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Assemble video + audio
    if not assemble(video_input, audio_input, assembled, profile.encoding_preset):
        return False

    # Color grading for final quality
    if quality == "final":
        final_out = output_path("final")
        if not apply_color_grade(assembled, final_out):
            return False
    else:
        final_out = output_path(quality)
        run_cmd(["cp", assembled, final_out], "Copy to output")

    print(f"\n  Primary output: {final_out}")

    # Thumbnail
    if profile.generate_thumbnail:
        thumb = output_path(quality, suffix="thumbnail", ext="png")
        generate_thumbnail(final_out, thumb, timestamp=profile.thumbnail_time)
        print(f"  Thumbnail: {thumb}")

    # Additional formats for final quality
    if quality == "final":
        web_out = output_path("web")
        create_web_preview(final_out, web_out)
        print(f"  Web preview: {web_out}")

        social_out = output_path("social", suffix="30s")
        create_social_clip(final_out, social_out, duration=30.0)
        print(f"  Social clip: {social_out}")

    return True


# ---------------------------------------------------------------------------
# Master pipeline
# ---------------------------------------------------------------------------

def render_pipeline(
    quality: str,
    skip_validation: bool = False,
    skip_remotion: bool = False,
    skip_audio: bool = False,
) -> bool:
    """
    Run the full render pipeline.

    Args:
        quality:          draft | preview | final
        skip_validation:  Skip asset validation step
        skip_remotion:    Skip Remotion render (use existing build/remotion-render.mp4)
        skip_audio:       Skip audio mixing (use existing build/mixed-audio.wav)
    """
    total_start = time.time()

    banner(f"TARA v7.4 Render Pipeline — {quality.upper()}")
    print(f"  Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT} @ {VIDEO_FPS}fps")
    print(f"  Duration:   ~{VIDEO_DURATION_SECONDS}s ({VIDEO_DURATION_SECONDS // 60}:{VIDEO_DURATION_SECONDS % 60:02d})")
    print(f"  Codec:      H.264 (libx264)")

    profile = QUALITY_PROFILES[quality]
    print(f"  Preset:     {profile.encoding_preset}")
    print(f"  Remotion:   concurrency={profile.remotion_concurrency}, "
          f"jpeg_q={profile.remotion_jpeg_quality}")

    # Step 1: Validate
    if not skip_validation:
        if not step_validate():
            print("\nAsset validation failed. Fix issues above or use --skip-validation.")
            return False
    else:
        print("\n  (validation skipped)")

    # Step 2: Remotion render
    if not skip_remotion:
        if not step_render_remotion(quality):
            print("\nRemotion render failed.")
            return False
    else:
        expected = build_path("remotion-render.mp4")
        if not os.path.isfile(expected):
            print(f"\n  ERROR: --skip-remotion but {expected} not found")
            return False
        print(f"\n  (Remotion render skipped — using {expected})")

    # Step 3: Audio mixing
    if not skip_audio:
        if not step_mix_audio(quality):
            print("\nAudio mixing failed.")
            return False
    else:
        expected = build_path("mixed-audio.wav")
        if not os.path.isfile(expected):
            print(f"\n  ERROR: --skip-audio but {expected} not found")
            return False
        print(f"\n  (Audio mixing skipped — using {expected})")

    # Step 4: Final composition
    if not step_compose_final(quality):
        print("\nFinal composition failed.")
        return False

    total_elapsed = time.time() - total_start
    minutes = int(total_elapsed // 60)
    seconds = total_elapsed % 60

    banner("Pipeline Complete")
    print(f"  Quality: {quality}")
    print(f"  Time:    {minutes}m {seconds:.0f}s")
    print(f"  Output:  {output_path(quality)}")
    if quality == "final":
        print(f"  Web:     {output_path('web')}")
        print(f"  Social:  {output_path('social', suffix='30s')}")
    print()
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="TARA v7.4 master render orchestration"
    )
    parser.add_argument(
        "--quality", choices=["draft", "preview", "final"],
        default="preview",
        help="Quality preset (default: preview)",
    )
    parser.add_argument(
        "--skip-validation", action="store_true",
        help="Skip asset validation step",
    )
    parser.add_argument(
        "--skip-remotion", action="store_true",
        help="Skip Remotion render (reuse existing build/remotion-render.mp4)",
    )
    parser.add_argument(
        "--skip-audio", action="store_true",
        help="Skip audio mixing (reuse existing build/mixed-audio.wav)",
    )

    args = parser.parse_args()

    ok = render_pipeline(
        quality=args.quality,
        skip_validation=args.skip_validation,
        skip_remotion=args.skip_remotion,
        skip_audio=args.skip_audio,
    )
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
