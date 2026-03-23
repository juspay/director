# Origin: composite.py — extracted to library on 2026-03-23
"""Green screen removal pipeline: FFmpeg colorkey=0x00FF00:0.3:0.1 → VP9 WebM with alpha → overlay on background. Extracted from top-level composite.py."""

import logging
import subprocess
from pathlib import Path

from moviepy import (
    ColorClip,
    CompositeVideoClip,
    VideoFileClip,
)

logger = logging.getLogger(__name__)

# Video specifications from the design doc
WIDTH = 1920
HEIGHT = 1080


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def _create_color_background(
    color: str, duration: float
) -> ColorClip:
    """Create a solid color background clip."""
    return ColorClip(size=(WIDTH, HEIGHT), color=_hex_to_rgb(color), duration=duration)


def _remove_green_screen(clip: VideoFileClip) -> VideoFileClip:
    """
    Remove green screen background from avatar video using chroma key.

    Uses FFmpeg's chromakey filter via MoviePy's fl_image for frame-level
    processing. The green screen (#00FF00) is replaced with transparency.

    We use a two-pass approach:
    1. FFmpeg colorkey filter for initial key
    2. Post-process to clean up edges (despill)
    """
    # Write intermediate file with alpha channel via FFmpeg colorkey
    input_path = clip.filename if hasattr(clip, "filename") else None
    if input_path is None:
        raise ValueError("Clip must have a filename for green screen removal")

    output_path = Path(str(input_path).replace(".mp4", "_keyed.webm"))

    if not output_path.exists():
        cmd = [
            "ffmpeg", "-y",
            "-i", str(input_path),
            "-vf", (
                # colorkey removes the green, similarity=0.3 is tolerance,
                # blend=0.1 softens edges to avoid harsh fringing
                "colorkey=0x00FF00:0.3:0.1,"
                "format=yuva420p"
            ),
            "-c:v", "libvpx-vp9",
            "-auto-alt-ref", "0",
            "-an",  # No audio — we handle audio separately
            str(output_path),
        ]
        logger.info(f"Running green screen removal: {' '.join(cmd)}")
        subprocess.run(cmd, check=True, capture_output=True)

    return VideoFileClip(str(output_path), has_mask=True)


def create_avatar_composite(
    avatar_path: Path,
    background_color: str,
    duration: float,
) -> CompositeVideoClip:
    """
    Composite avatar clip over a colored background.

    Used for Acts 4 and 8 where Tara appears against a gradient.
    Avatar is centered and scaled to ~60% of frame height.
    """
    bg = _create_color_background(background_color, duration)
    avatar = _remove_green_screen(VideoFileClip(str(avatar_path)))

    # Scale avatar to 60% of frame height, maintain aspect ratio
    avatar = avatar.resized(height=int(HEIGHT * 0.6))
    avatar = avatar.with_position("center")

    return CompositeVideoClip([bg, avatar], size=(WIDTH, HEIGHT))
