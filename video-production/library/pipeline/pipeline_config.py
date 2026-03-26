# Origin: video-production/v7/scripts/pipeline_config.py — extracted to library on 2026-03-23
"""
Pipeline configuration for TARA v7.4 "Builders" video.

All file paths, encoding presets, Remotion settings, and quality profiles
for the video assembly and rendering pipeline.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Base paths
# ---------------------------------------------------------------------------
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V7_ROOT = os.path.normpath(os.path.join(_SCRIPT_DIR, ".."))

ASSETS_DIR = os.path.join(V7_ROOT, "assets")
REMOTION_DIR = os.path.join(V7_ROOT, "remotion")
OUTPUT_DIR = os.path.join(V7_ROOT, "output")
BUILD_DIR = os.path.join(V7_ROOT, "build")

# ---------------------------------------------------------------------------
# Asset paths
# ---------------------------------------------------------------------------
VOICEOVER_DIR = os.path.join(ASSETS_DIR, "voiceover", "v7")
MUSIC_DIR = os.path.join(ASSETS_DIR, "music")
SFX_DIR = os.path.join(ASSETS_DIR, "sfx")

# Default voiceover — r23v4 scored highest (9.18/10, 150.4s)
VOICEOVER_FILE = os.path.join(VOICEOVER_DIR, "tara-v7-r23v4.mp3")
VOICEOVER_METADATA = os.path.join(VOICEOVER_DIR, "voiceover-metadata-v7.json")

# Music track (single continuous track, to be placed by producer)
MUSIC_FILE = os.path.join(MUSIC_DIR, "tara_v74_music.wav")

# SFX files with their timestamps (seconds)
SFX_FILES = {
    "plucked_string": {
        "file": os.path.join(SFX_DIR, "sfx_plucked_string.wav"),
        "timestamp": 33.0,
        "description": "Ab sus4 -> Ab major. 'Tara closes that gap.'",
    },
    "sub_pulse": {
        "file": os.path.join(SFX_DIR, "sfx_sub_pulse.wav"),
        "timestamp": 57.0,
        "description": "Tendrils retract. Separated from bass at 0:55.",
    },
    "shimmer": {
        "file": os.path.join(SFX_DIR, "sfx_shimmer.wav"),
        "timestamp": 148.0,
        "description": "Optional: constellation -> logo.",
        "optional": True,
    },
}

# ---------------------------------------------------------------------------
# Video specifications
# ---------------------------------------------------------------------------
VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080
VIDEO_FPS = 30
VIDEO_DURATION_SECONDS = 170  # ~2:50
VIDEO_TOTAL_FRAMES = VIDEO_FPS * VIDEO_DURATION_SECONDS  # 5100

# Color references (for validation / FFmpeg filters)
CANVAS_COLOR = "#0f172a"  # dark navy
CANVAS_RGB = "15:23:42"   # decimal RGB for FFmpeg

# ---------------------------------------------------------------------------
# Remotion settings
# ---------------------------------------------------------------------------
REMOTION_COMPOSITION = "TaraBuilders"
REMOTION_ENTRY = os.path.join(REMOTION_DIR, "src", "index.ts")

# ---------------------------------------------------------------------------
# FFmpeg encoding presets
# ---------------------------------------------------------------------------

@dataclass
class EncodingPreset:
    """FFmpeg encoding parameters for a quality level."""
    name: str
    video_codec: str = "libx264"
    video_crf: int = 18
    video_preset: str = "slow"
    video_profile: str = "high"
    video_level: str = "4.1"
    pixel_format: str = "yuv420p"
    audio_codec: str = "aac"
    audio_bitrate: str = "320k"
    audio_sample_rate: int = 44100
    audio_channels: int = 2
    width: int = 1920
    height: int = 1080
    max_bitrate: Optional[str] = None
    bufsize: Optional[str] = None

    def ffmpeg_video_args(self) -> List[str]:
        args = [
            "-c:v", self.video_codec,
            "-crf", str(self.video_crf),
            "-preset", self.video_preset,
            "-profile:v", self.video_profile,
            "-level", self.video_level,
            "-pix_fmt", self.pixel_format,
        ]
        # -tune animation optimizes for flat color and hard edges (ideal for Remotion motion graphics)
        if self.video_codec == "libx264":
            args += ["-tune", "animation"]
        if self.max_bitrate:
            args += ["-maxrate", self.max_bitrate, "-bufsize", self.bufsize or self.max_bitrate]
        if self.width != 1920 or self.height != 1080:
            args += ["-vf", f"scale={self.width}:{self.height}"]
        return args

    def ffmpeg_audio_args(self) -> List[str]:
        return [
            "-c:a", self.audio_codec,
            "-b:a", self.audio_bitrate,
            "-ar", str(self.audio_sample_rate),
            "-ac", str(self.audio_channels),
        ]


PRESETS: Dict[str, EncodingPreset] = {
    "final": EncodingPreset(
        name="final",
        video_crf=18,
        video_preset="slow",
        audio_bitrate="320k",
    ),
    "preview": EncodingPreset(
        name="preview",
        video_crf=23,
        video_preset="medium",
        audio_bitrate="192k",
    ),
    "draft": EncodingPreset(
        name="draft",
        video_crf=28,
        video_preset="ultrafast",
        audio_bitrate="128k",
    ),
    "web": EncodingPreset(
        name="web",
        video_crf=28,
        video_preset="medium",
        audio_bitrate="128k",
        width=1280,
        height=720,
        max_bitrate="2M",
        bufsize="4M",
    ),
    "social": EncodingPreset(
        name="social",
        video_crf=23,
        video_preset="medium",
        audio_bitrate="192k",
        width=1080,
        height=1080,
    ),
}

# ---------------------------------------------------------------------------
# Quality profiles (orchestration-level)
# ---------------------------------------------------------------------------

@dataclass
class QualityProfile:
    """Orchestration settings for a render quality level."""
    name: str
    encoding_preset: str
    remotion_concurrency: int = 4
    remotion_scale: float = 1.0
    remotion_jpeg_quality: int = 95
    remotion_every_nth_frame: int = 1
    audio_fade_in: float = 0.5   # seconds
    audio_fade_out: float = 2.0  # seconds
    generate_thumbnail: bool = True
    thumbnail_time: float = 52.0  # "Tara closes that gap" — amber line moment

QUALITY_PROFILES: Dict[str, QualityProfile] = {
    "draft": QualityProfile(
        name="draft",
        encoding_preset="draft",
        remotion_concurrency=8,
        remotion_jpeg_quality=70,
        remotion_every_nth_frame=2,
        generate_thumbnail=False,
    ),
    "preview": QualityProfile(
        name="preview",
        encoding_preset="preview",
        remotion_concurrency=4,
        remotion_jpeg_quality=85,
    ),
    "final": QualityProfile(
        name="final",
        encoding_preset="final",
        remotion_concurrency=2,
        remotion_scale=1.0,
        remotion_jpeg_quality=100,
        audio_fade_in=0.5,
        audio_fade_out=2.0,
    ),
}

# ---------------------------------------------------------------------------
# Output file naming
# ---------------------------------------------------------------------------

def output_path(quality: str, suffix: str = "", ext: str = "mp4") -> str:
    """Generate an output file path for a given quality and optional suffix."""
    tag = f"-{suffix}" if suffix else ""
    return os.path.join(OUTPUT_DIR, f"tara-builders-v7.4-{quality}{tag}.{ext}")


def build_path(filename: str) -> str:
    """Generate a path inside the build (intermediate) directory."""
    return os.path.join(BUILD_DIR, filename)
