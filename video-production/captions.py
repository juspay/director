"""
Caption generation and burn-in for Tara announcement video.

Uses faster-whisper for word-level timestamp generation from the
combined voiceover audio, then burns captions into the final video
using FFmpeg's subtitles filter with styled ASS formatting.
"""

import asyncio
import logging
import subprocess
from pathlib import Path

from config import ASSETS_DIR, OUTPUT_DIR

logger = logging.getLogger(__name__)

# Caption styling — white text on semi-transparent black background,
# positioned near the bottom with enough margin to not overlap UI elements.
# ASS format gives us precise control over font, color, positioning.
ASS_STYLE = (
    "FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,"
    "OutlineColour=&H80000000,BackColour=&H80000000,"
    "Bold=1,Outline=2,Shadow=0,MarginV=25,"
    "Alignment=2,BorderStyle=4"
    # BorderStyle=4 = opaque box background behind text
    # MarginV=25 = 25px from bottom edge
    # Alignment=2 = bottom-center
)


def generate_srt(
    audio_path: Path,
    output_path: Path | None = None,
    model_size: str = "large-v2",
) -> Path:
    """
    Generate SRT captions from audio using faster-whisper.

    Uses the large-v2 model for best accuracy. Word-level timestamps
    are used to create precise subtitle timing that matches speech cadence.

    Args:
        audio_path: Path to the combined voiceover audio.
        output_path: Where to save the SRT file. Defaults to assets/captions.srt.
        model_size: Whisper model size. large-v2 recommended for production.

    Returns:
        Path to the generated SRT file.
    """
    if output_path is None:
        output_path = ASSETS_DIR / "captions.srt"

    if output_path.exists():
        logger.info("SRT file already exists, skipping generation")
        return output_path

    logger.info(f"Generating captions from {audio_path} using {model_size}")

    from faster_whisper import WhisperModel

    # Use GPU if available (CUDA), otherwise fall back to CPU.
    # large-v2 on CPU takes ~2x realtime; on GPU it's near-instant.
    model = WhisperModel(
        model_size,
        device="auto",
        compute_type="auto",
    )

    segments, info = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language="en",
        # VAD filter removes silence gaps that would create empty subtitle lines
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=500,
        ),
    )

    logger.info(
        f"Detected language: {info.language} "
        f"(probability: {info.language_probability:.2f})"
    )

    # Build SRT entries from word-level timestamps.
    # We group words into subtitle lines of ~8-12 words for readability,
    # breaking at natural pauses (>300ms gap) or punctuation.
    srt_entries = []
    current_words: list[dict] = []
    entry_index = 1

    for segment in segments:
        if not segment.words:
            continue

        for word in segment.words:
            current_words.append({
                "text": word.word.strip(),
                "start": word.start,
                "end": word.end,
            })

            # Determine if we should break the current subtitle line
            should_break = False

            if len(current_words) >= 10:
                should_break = True
            elif len(current_words) >= 6 and word.word.strip().endswith((".", "?", "!", ",")):
                # Break at punctuation for natural reading
                should_break = True

            if should_break and current_words:
                entry = _format_srt_entry(entry_index, current_words)
                srt_entries.append(entry)
                entry_index += 1
                current_words = []

    # Flush remaining words
    if current_words:
        entry = _format_srt_entry(entry_index, current_words)
        srt_entries.append(entry)

    srt_content = "\n\n".join(srt_entries) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(srt_content, encoding="utf-8")

    logger.info(f"Generated {entry_index - 1} subtitle entries to {output_path}")
    return output_path


def _format_srt_entry(index: int, words: list[dict]) -> str:
    """Format a group of words as an SRT entry."""
    start_time = words[0]["start"]
    end_time = words[-1]["end"]
    text = " ".join(w["text"] for w in words)

    return (
        f"{index}\n"
        f"{_format_timestamp(start_time)} --> {_format_timestamp(end_time)}\n"
        f"{text}"
    )


def _format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


async def burn_captions(
    video_path: Path,
    srt_path: Path,
    output_path: Path | None = None,
) -> Path:
    """
    Burn SRT captions into the video using FFmpeg's subtitles filter.

    Uses ASS styling for professional-looking captions with semi-transparent
    black background, white bold text, and bottom-center positioning.

    Args:
        video_path: Path to the video without captions.
        srt_path: Path to the SRT subtitle file.
        output_path: Where to save the captioned video.

    Returns:
        Path to the final captioned video.
    """
    if output_path is None:
        output_path = OUTPUT_DIR / "tara_announcement_final.mp4"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"Burning captions into video: {video_path}")

    # FFmpeg subtitles filter with forced style override.
    # We escape colons and backslashes in the path for FFmpeg's filter syntax.
    srt_escaped = str(srt_path).replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"subtitles='{srt_escaped}':force_style='{ASS_STYLE}'",
        "-c:v", CODEC,
        "-b:v", BITRATE,
        "-c:a", "aac",
        "-b:a", "192k",
        "-preset", "medium",
        "-movflags", "+faststart",  # Enable progressive download
        str(output_path),
    ]

    logger.info(f"Running FFmpeg: {' '.join(cmd)}")

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode() if stderr else "Unknown error"
        raise RuntimeError(f"FFmpeg caption burn-in failed: {error_msg}")

    logger.info(f"Final video with captions: {output_path}")
    return output_path


# Re-export constants used by burn_captions from composite module
CODEC = "libx264"
BITRATE = "8000k"


async def generate_and_burn_captions(
    video_path: Path,
    voiceover_paths: dict[str, Path],
) -> Path:
    """
    End-to-end caption pipeline: generate SRT from voiceover, then burn into video.

    This combines multiple voiceover files into a single audio track,
    runs Whisper on it, and burns the result into the final video.

    Args:
        video_path: Path to the composited video (without captions).
        voiceover_paths: Map of scene_id to voiceover audio paths.

    Returns:
        Path to the final video with burned-in captions.
    """
    # Concatenate all voiceover files for Whisper processing.
    # We use the video's own audio track since it has voiceovers
    # properly positioned in time.
    combined_audio = ASSETS_DIR / "combined_voiceover.wav"

    if not combined_audio.exists():
        logger.info("Extracting audio from video for caption generation")
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-vn",  # No video
            "-acodec", "pcm_s16le",
            "-ar", "16000",  # 16kHz for Whisper
            "-ac", "1",  # Mono
            str(combined_audio),
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

    # Generate SRT
    srt_path = generate_srt(combined_audio)

    # Burn captions
    final_path = await burn_captions(video_path, srt_path)

    return final_path
