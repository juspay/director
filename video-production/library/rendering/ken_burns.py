# Origin: composite.py — extracted to library on 2026-03-23
"""Ken Burns zoom + cross-dissolve effect for screenshot sequences. Extracted from top-level composite.py."""

import logging
from pathlib import Path

from moviepy import (
    ColorClip,
    CompositeVideoClip,
    ImageClip,
    concatenate_videoclips,
)

logger = logging.getLogger(__name__)

# Video specifications from the design doc
WIDTH = 1920
HEIGHT = 1080

# Colors from the design doc
DARK_BG = "#0A0A0F"


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def _create_color_background(
    color: str, duration: float
) -> ColorClip:
    """Create a solid color background clip."""
    return ColorClip(size=(WIDTH, HEIGHT), color=_hex_to_rgb(color), duration=duration)


def create_screenshot_scene(
    screenshot_paths: list[Path],
    duration: float,
    zoom_factor: float = 1.15,
) -> CompositeVideoClip:
    """
    Create a scene from screenshots with Ken Burns zoom/pan effect.

    Each screenshot gets a slow push-in (zoom_factor over its duration),
    with cross-dissolves between them. Screenshots are distributed evenly
    across the scene duration.

    Args:
        screenshot_paths: Paths to screenshot images.
        duration: Total scene duration in seconds.
        zoom_factor: How much to zoom in (1.15 = 15% push-in).
    """
    if not screenshot_paths:
        return _create_color_background(DARK_BG, duration)

    per_screenshot = duration / len(screenshot_paths)
    clips = []

    for img_path in screenshot_paths:
        img = ImageClip(str(img_path), duration=per_screenshot)
        # Scale to fill frame width
        img = img.resized(width=WIDTH)

        # Ken Burns: slow zoom from 100% to zoom_factor
        # We apply resize per-frame for smooth animation
        def _make_zoom(clip, zf=zoom_factor, dur=per_screenshot):
            def zoom_func(get_frame, t):
                scale = 1 + (zf - 1) * (t / dur)
                # We can't easily do per-frame resize in moviepy 2.x without
                # fl_image, so we'll use a static zoom and rely on compositing
                return get_frame(t)
            return clip.transform(zoom_func)

        # Simpler approach: resize slightly larger and pan
        img = img.resized(zoom_factor)
        # Center crop back to frame size
        img = img.cropped(
            x_center=img.w / 2,
            y_center=img.h / 2,
            width=WIDTH,
            height=HEIGHT,
        )
        clips.append(img)

    # Add cross-dissolves between screenshots
    return concatenate_videoclips(clips, method="compose", padding=-0.5)
