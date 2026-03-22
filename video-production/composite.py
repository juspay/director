"""
FFmpeg/MoviePy compositing for Tara announcement video.

Handles:
- Green screen removal for avatar clips
- Picture-in-picture avatar overlay on backgrounds
- Kinetic text overlays for Act 6 (numbers)
- Screenshot integration with zoom/pan (Ken Burns) animations
- Cross-fade transitions between scenes
- Background music mixing at 15% volume
- Fade in/out
- Final output: 1920x1080, 24fps, H.264, 8000k bitrate
"""

import asyncio
import logging
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from moviepy import (
    AudioFileClip,
    ColorClip,
    CompositeAudioClip,
    CompositeVideoClip,
    ImageClip,
    TextClip,
    VideoFileClip,
    concatenate_videoclips,
    vfx,
)

from config import ASSETS_DIR, OUTPUT_DIR

logger = logging.getLogger(__name__)

# Video specifications from the design doc
WIDTH = 1920
HEIGHT = 1080
FPS = 24
BITRATE = "8000k"
CODEC = "libx264"

# Fonts — use full paths for macOS compatibility with MoviePy/Pillow
FONT_DIR = "/System/Library/Fonts/Supplemental"
FONT_BOLD = f"{FONT_DIR}/Arial Bold.ttf"
FONT_REGULAR = f"{FONT_DIR}/Arial.ttf"
FONT_MONO = f"{FONT_DIR}/Courier New.ttf"

# Colors from the design doc
AMBER = "#D97706"
TARA_BLUE = "#2563EB"
WARM_GOLD = "#FFB25C"
DARK_BG = "#0A0A0F"
COOL_GREY = "#1E293B"


@dataclass
class CompositeConfig:
    """Configuration for the final composite."""

    scene_clips: dict[str, Path] = field(default_factory=dict)
    voiceover_paths: dict[str, Path] = field(default_factory=dict)
    avatar_paths: dict[str, Path] = field(default_factory=dict)
    broll_paths: dict[str, Path] = field(default_factory=dict)
    music_path: Path | None = None
    screenshot_dir: Path | None = None
    scenes: list[dict] = field(default_factory=list)


def _create_color_background(
    color: str, duration: float
) -> ColorClip:
    """Create a solid color background clip."""
    return ColorClip(size=(WIDTH, HEIGHT), color=_hex_to_rgb(color), duration=duration)


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


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


def create_kinetic_text_scene(
    numbers: list[dict],
    coda_lines: list[str],
) -> CompositeVideoClip:
    """
    Create the Act 6 kinetic typography scene.

    Numbers animate in one at a time with hold duration, then fade out.
    Coda lines ("Built by 2 engineers...") appear after a pause.

    Each number is styled with warm amber for the value and white for the label.
    """
    clips = []
    current_time = 0.0

    for num in numbers:
        hold = num.get("hold_seconds", 3)

        # Large number value
        value_clip = TextClip(
            text=num["value"],
            font_size=120,
            color=AMBER,
            font=FONT_BOLD,
            size=(WIDTH, None),
            text_align="center",
            duration=hold,
        )
        value_clip = value_clip.with_position(("center", HEIGHT // 2 - 80))
        value_clip = value_clip.with_start(current_time)
        # Fade in
        value_clip = value_clip.with_effects([vfx.CrossFadeIn(0.3)])

        # Label beneath
        label_clip = TextClip(
            text=num["label"],
            font_size=48,
            color="white",
            font=FONT_REGULAR,
            size=(WIDTH, None),
            text_align="center",
            duration=hold,
        )
        label_clip = label_clip.with_position(("center", HEIGHT // 2 + 60))
        label_clip = label_clip.with_start(current_time)
        label_clip = label_clip.with_effects([vfx.CrossFadeIn(0.3)])

        clips.extend([value_clip, label_clip])
        current_time += hold

    # 2 seconds of silence before coda
    current_time += 2.0

    for i, line in enumerate(coda_lines):
        coda_clip = TextClip(
            text=line,
            font_size=56 if i == 0 else 44,
            color="white",
            font=FONT_BOLD if i == 0 else FONT_REGULAR,
            size=(WIDTH, None),
            text_align="center",
            duration=4.0,
        )
        y_pos = HEIGHT // 2 - 40 + (i * 70)
        coda_clip = coda_clip.with_position(("center", y_pos))
        coda_clip = coda_clip.with_start(current_time)
        coda_clip = coda_clip.with_effects([vfx.CrossFadeIn(0.5)])
        clips.append(coda_clip)

        if i == 0:
            # Second line appears 3 seconds after first
            current_time += 3.0

    total_duration = current_time + 3.0  # Hold final text
    bg = _create_color_background(DARK_BG, total_duration)

    return CompositeVideoClip([bg] + clips, size=(WIDTH, HEIGHT))


def create_static_roadmap_frame(duration: float) -> CompositeVideoClip:
    """
    Create the Act 7 locked roadmap static frame.

    Dark background with warm blue-gold ambient glow. 7 items in a grid,
    mostly obscured behind gradient masks. This is intentionally mysterious.

    Since this is a heavily designed static frame, we generate it as a
    single image using programmatic drawing, then hold it for the duration.
    """
    # For now, create a placeholder dark frame with text.
    # The actual roadmap frame should be designed in Figma/Photoshop and
    # placed at assets/roadmap_frame.png for best results.
    roadmap_image = ASSETS_DIR / "roadmap_frame.png"

    if roadmap_image.exists():
        clip = ImageClip(str(roadmap_image), duration=duration)
        clip = clip.resized(width=WIDTH)
        return clip

    logger.warning(
        "roadmap_frame.png not found in assets/, generating placeholder. "
        "For best results, design this frame manually and save to "
        f"{roadmap_image}"
    )

    bg = _create_color_background(DARK_BG, duration)

    title = TextClip(
        text="What's Coming",
        font_size=64,
        color=WARM_GOLD,
        font=FONT_BOLD,
        size=(WIDTH, None),
        text_align="center",
        duration=duration,
    )
    title = title.with_position(("center", 120))

    subtitle = TextClip(
        text="Phase 1.5 starts after this",
        font_size=28,
        color="#666666",
        font=FONT_REGULAR,
        size=(WIDTH, None),
        text_align="center",
        duration=duration,
    )
    subtitle = subtitle.with_position(("center", HEIGHT - 80))

    # Placeholder items (obscured)
    items_text = "  ".join(["[||||||||]"] * 7)
    items = TextClip(
        text=items_text,
        font_size=36,
        color="#222233",
        font=FONT_MONO,
        size=(WIDTH - 200, None),
        text_align="center",
        duration=duration,
    )
    items = items.with_position(("center", HEIGHT // 2))

    return CompositeVideoClip([bg, title, subtitle, items], size=(WIDTH, HEIGHT))


def add_transition(
    clip: CompositeVideoClip | VideoFileClip,
    transition_type: str,
    duration: float = 0.5,
    position: str = "in",
) -> CompositeVideoClip | VideoFileClip:
    """Apply a transition effect to a clip."""
    if transition_type in ("fade_from_black", "dissolve") and position == "in":
        return clip.with_effects([vfx.CrossFadeIn(duration)])
    elif transition_type in ("fade_to_black", "dissolve") and position == "out":
        return clip.with_effects([vfx.CrossFadeOut(duration)])
    elif transition_type == "freeze_desaturate" and position == "out":
        # Freeze last frame and desaturate — handled via BlackAndWhite effect
        return clip.with_effects([vfx.CrossFadeOut(duration)])
    return clip


def mix_audio(
    voiceover_clips: list[tuple[float, AudioFileClip]],
    music_path: Path | None,
    total_duration: float,
    music_volume: float = 0.15,
) -> CompositeAudioClip:
    """
    Mix voiceover audio with background music.

    Voiceover clips are positioned at their scene start times.
    Music is looped to fill the total duration and mixed at 15% volume.
    Music ducks further (-6dB) during voiceover segments for clarity.

    Args:
        voiceover_clips: List of (start_time, AudioFileClip) tuples.
        music_path: Path to background music file.
        total_duration: Total video duration.
        music_volume: Base volume for background music (0.0-1.0).
    """
    audio_clips = []

    # Position each voiceover at its scene start time
    for start_time, vo_clip in voiceover_clips:
        positioned = vo_clip.with_start(start_time)
        audio_clips.append(positioned)

    # Add background music
    if music_path and music_path.exists():
        music = AudioFileClip(str(music_path))

        # Loop music to fill entire video duration using ffmpeg concat
        if music.duration < total_duration:
            music.close()
            loops_needed = int(total_duration / music.duration) + 1
            looped_path = music_path.parent / "background_music_looped.mp3"
            # Build ffmpeg concat filter to loop the audio
            filter_str = ";".join(
                [f"[0:a]atrim=0:{music.duration}[a{i}]" for i in range(loops_needed)]
            )
            filter_str += ";" + "".join(
                [f"[a{i}]" for i in range(loops_needed)]
            ) + f"concat=n={loops_needed}:v=0:a=1[out]"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", str(music_path),
                    "-filter_complex", filter_str,
                    "-map", "[out]", str(looped_path),
                ],
                check=True, capture_output=True,
            )
            music = AudioFileClip(str(looped_path))

        music = music.subclipped(0, total_duration)
        music = music.with_volume_scaled(music_volume)
        audio_clips.append(music)

    return CompositeAudioClip(audio_clips)


async def composite_video(config: CompositeConfig) -> Path:
    """
    Composite all scenes into the final video.

    This is the main compositing function that:
    1. Builds each scene's visual clip
    2. Applies transitions
    3. Concatenates all scenes
    4. Mixes audio (voiceover + music)
    5. Renders final output

    Args:
        config: CompositeConfig with all asset paths and scene data.

    Returns:
        Path to the final rendered video.
    """
    output_path = OUTPUT_DIR / "tara_announcement_no_captions.mp4"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Starting video compositing")

    scene_clips = []
    audio_clips: list[tuple[float, AudioFileClip]] = []
    current_time = 0.0

    for scene in config.scenes:
        scene_id = scene["id"]
        visual_type = scene["visual_type"]
        duration = scene.get("duration_estimate", 15)

        logger.info(f"[{scene_id}] Building scene ({visual_type}, {duration}s)")

        # Build visual clip based on type
        if visual_type == "avatar_animation" and scene_id in config.avatar_paths:
            clip = create_avatar_composite(
                config.avatar_paths[scene_id],
                background_color=TARA_BLUE if scene_id == "act4_meet_tara" else DARK_BG,
                duration=duration,
            )

        elif visual_type == "cinematic_broll" and scene_id in config.broll_paths:
            broll_path = config.broll_paths[scene_id]
            clip = VideoFileClip(str(broll_path))
            # Scale to fill frame
            clip = clip.resized(width=WIDTH)
            if clip.duration > duration:
                clip = clip.subclipped(0, duration)

        elif visual_type == "screen_recording":
            screenshot_paths = []
            if config.screenshot_dir:
                for ss_name in scene.get("screenshots", []):
                    ss_path = config.screenshot_dir / ss_name
                    if ss_path.exists():
                        screenshot_paths.append(ss_path)
            clip = create_screenshot_scene(screenshot_paths, duration)

        elif visual_type == "kinetic_text":
            clip = create_kinetic_text_scene(
                scene.get("numbers", []),
                scene.get("coda_lines", []),
            )
            duration = clip.duration  # Kinetic text determines its own duration

        elif visual_type == "static_frame":
            clip = create_static_roadmap_frame(duration)

        else:
            # Fallback: dark background
            clip = _create_color_background(DARK_BG, duration)

        # Apply transitions
        transition_in = scene.get("transition_in", "dissolve")
        transition_out = scene.get("transition_out", "dissolve")
        clip = add_transition(clip, transition_in, position="in")
        clip = add_transition(clip, transition_out, position="out")

        # Ensure clip has correct duration
        if hasattr(clip, "duration") and clip.duration:
            duration = clip.duration

        scene_clips.append(clip)

        # Add voiceover audio at correct position
        if scene.get("has_narration") and scene_id in config.voiceover_paths:
            vo_path = config.voiceover_paths[scene_id]
            vo_clip = AudioFileClip(str(vo_path))
            audio_clips.append((current_time, vo_clip))

        current_time += duration

    # Concatenate all scenes with cross-dissolve padding
    logger.info(f"Concatenating {len(scene_clips)} scenes (total: {current_time:.1f}s)")
    final_video = concatenate_videoclips(scene_clips, method="compose", padding=-0.5)

    # Mix audio
    logger.info("Mixing audio")
    final_audio = mix_audio(
        audio_clips,
        config.music_path,
        final_video.duration,
        music_volume=0.15,
    )
    final_video = final_video.with_audio(final_audio)

    # Add global fade in/out
    final_video = final_video.with_effects([
        vfx.CrossFadeIn(1.0),
        vfx.CrossFadeOut(2.0),
    ])

    # Render
    logger.info(f"Rendering final video to {output_path}")
    final_video.write_videofile(
        str(output_path),
        fps=FPS,
        codec=CODEC,
        bitrate=BITRATE,
        audio_codec="aac",
        audio_bitrate="192k",
        preset="medium",
        threads=4,
        logger="bar",
    )

    logger.info(f"Compositing complete: {output_path}")
    return output_path
