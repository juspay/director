# Origin: captions.py — extracted to library on 2026-03-23
"""
Caption generation and burn-in for Tara announcement video.

Uses faster-whisper for word-level timestamp generation from the
combined voiceover audio, then burns captions into the final video
using FFmpeg's subtitles filter with styled ASS formatting.
"""

import asyncio
import logging
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.resolve() / 'pipeline'))

from config import ASSETS_DIR, OUTPUT_DIR

logger = logging.getLogger(__name__)

# Caption styling — white text on semi-transparent black background,
# positioned near the bottom with enough margin to not overlap UI elements.
# ASS format gives us precise control over font, color, positioning.
ASS_STYLE = (
    "FontName=Arial,FontSize=32,PrimaryColour=&H00FFFFFF,"
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
    model_size: str = "large-v3-turbo",
    language: str = "en",
) -> Path:
    """
    Generate SRT captions from audio with precise word-level timestamps.

    Uses WhisperX (wav2vec2 forced alignment, ~20-30ms precision) when available,
    falling back to faster-whisper (~50-100ms precision). WhisperX matters for
    animated word-by-word captions where timing precision is critical.

    Args:
        audio_path: Path to the combined voiceover audio.
        output_path: Where to save the SRT file. Defaults to assets/captions.srt.
        model_size: Whisper model size. large-v3-turbo recommended for production.
        language: Language code for transcription.

    Returns:
        Path to the generated SRT file.
    """
    if output_path is None:
        output_path = ASSETS_DIR / "captions.srt"

    if output_path.exists():
        logger.info("SRT file already exists, skipping generation")
        return output_path

    # Try WhisperX first (better word alignment), fall back to faster-whisper
    try:
        import whisperx
        words = _transcribe_whisperx(audio_path, model_size, language)
        logger.info(f"  Using WhisperX (wav2vec2 forced alignment, ~20-30ms precision)")
    except ImportError:
        logger.info("  WhisperX not installed, using faster-whisper (~50-100ms precision)")
        logger.info("  For better timing: pip install whisperx")
        words = _transcribe_faster_whisper(audio_path, model_size, language)

    # Build SRT entries from word-level timestamps
    srt_entries = []
    current_words: list[dict] = []
    entry_index = 1

    for word in words:
        current_words.append(word)

        should_break = False
        if len(current_words) >= 10:
            should_break = True
        elif len(current_words) >= 6 and word["text"].endswith((".", "?", "!", ",")):
            should_break = True

        if should_break and current_words:
            entry = _format_srt_entry(entry_index, current_words)
            srt_entries.append(entry)
            entry_index += 1
            current_words = []

    if current_words:
        entry = _format_srt_entry(entry_index, current_words)
        srt_entries.append(entry)

    srt_content = "\n\n".join(srt_entries) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(srt_content, encoding="utf-8")

    logger.info(f"Generated {entry_index - 1} subtitle entries to {output_path}")
    return output_path


def _transcribe_whisperx(audio_path: Path, model_size: str, language: str) -> list[dict]:
    """Transcribe with WhisperX — wav2vec2 forced alignment for ~20-30ms word precision."""
    import whisperx

    device = "cuda" if _has_cuda() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    # Step 1: Transcribe with Whisper
    model = whisperx.load_model(model_size, device, compute_type=compute_type, language=language)
    audio = whisperx.load_audio(str(audio_path))
    result = model.transcribe(audio, batch_size=16)

    # Step 2: Align with wav2vec2 for precise word timestamps
    align_model, metadata = whisperx.load_align_model(language_code=language, device=device)
    result = whisperx.align(result["segments"], align_model, metadata, audio, device,
                            return_char_alignments=False)

    # Extract words with timestamps
    words = []
    for segment in result["segments"]:
        for word_info in segment.get("words", []):
            if "start" in word_info and "end" in word_info:
                words.append({
                    "text": word_info["word"].strip(),
                    "start": word_info["start"],
                    "end": word_info["end"],
                })

    logger.info(f"  WhisperX: {len(words)} words with forced alignment")
    return words


def _transcribe_faster_whisper(audio_path: Path, model_size: str, language: str) -> list[dict]:
    """Transcribe with faster-whisper — native Whisper word timestamps (~50-100ms)."""
    from faster_whisper import WhisperModel

    model = WhisperModel(model_size, device="auto", compute_type="auto")

    segments, info = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language=language,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    logger.info(
        f"  Detected language: {info.language} "
        f"(probability: {info.language_probability:.2f})"
    )

    words = []
    for segment in segments:
        if not segment.words:
            continue
        for word in segment.words:
            words.append({
                "text": word.word.strip(),
                "start": word.start,
                "end": word.end,
            })

    logger.info(f"  faster-whisper: {len(words)} words with native timestamps")
    return words


def _has_cuda() -> bool:
    """Check if CUDA is available."""
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def validate_wer(transcript: str, source_text: str, warn_threshold: float = 0.05) -> dict:
    """Compute Word Error Rate between Whisper transcript and source script.

    Since our voiceover text is scripted (not live speech), we have the ground
    truth — a luxury most captioning workflows don't have. This lets us measure
    exact transcription accuracy.

    Args:
        transcript: The text produced by Whisper (from SRT or word list).
        source_text: The original voiceover script text.
        warn_threshold: WER threshold above which to log a warning (default: 5%).

    Returns:
        Dict with 'wer', 'word_count', 'errors', 'warning' (if above threshold).
    """
    try:
        import jiwer
    except ImportError:
        logger.warning("[WER] jiwer not installed — skipping WER validation. pip install jiwer")
        return {"wer": None, "error": "jiwer not installed"}

    # Normalize both texts
    transforms = jiwer.Compose([
        jiwer.RemoveMultipleSpaces(),
        jiwer.Strip(),
        jiwer.ToLowerCase(),
        jiwer.RemovePunctuation(),
        jiwer.ReduceToListOfListOfWords(),
    ])

    wer = jiwer.wer(
        source_text,
        transcript,
        truth_transform=transforms,
        hypothesis_transform=transforms,
    )

    source_words = len(source_text.split())
    result = {
        "wer": round(wer, 4),
        "wer_percent": round(wer * 100, 2),
        "source_word_count": source_words,
        "estimated_errors": round(wer * source_words),
    }

    if wer > warn_threshold:
        result["warning"] = f"WER {wer*100:.1f}% exceeds {warn_threshold*100:.0f}% threshold"
        logger.warning(f"[WER] {result['warning']}")
    else:
        logger.info(f"[WER] {wer*100:.2f}% — {result['estimated_errors']} errors in {source_words} words")

    return result


def validate_srt(srt_path: str | Path) -> list[str]:
    """Validate SRT file for common quality issues using pysubs2.

    Checks:
    - No timing overlaps between consecutive entries
    - No entries shorter than 0.5s or longer than 7s
    - Max 42 characters per line
    - Max 2 lines per entry
    - Minimum 150ms per word display time

    Returns list of warning strings (empty = all checks passed).
    """
    try:
        import pysubs2
    except ImportError:
        logger.warning("[SRT] pysubs2 not installed — skipping validation. pip install pysubs2")
        return ["pysubs2 not installed"]

    subs = pysubs2.load(str(srt_path))
    warnings = []

    for i, event in enumerate(subs):
        duration_s = (event.end - event.start) / 1000.0
        text = event.text.replace("\\N", "\n")
        lines = text.split("\n")
        word_count = len(text.split())

        # Duration checks
        if duration_s < 0.5:
            warnings.append(f"Entry {i+1}: too short ({duration_s:.2f}s < 0.5s)")
        if duration_s > 7.0:
            warnings.append(f"Entry {i+1}: too long ({duration_s:.2f}s > 7.0s)")

        # Line length checks
        for j, line in enumerate(lines):
            if len(line) > 42:
                warnings.append(f"Entry {i+1} line {j+1}: {len(line)} chars (max 42)")

        # Max 2 lines
        if len(lines) > 2:
            warnings.append(f"Entry {i+1}: {len(lines)} lines (max 2)")

        # Minimum display time per word (150ms)
        if word_count > 0 and duration_s > 0:
            ms_per_word = (duration_s * 1000) / word_count
            if ms_per_word < 150:
                warnings.append(f"Entry {i+1}: {ms_per_word:.0f}ms/word (min 150ms)")

        # Overlap check with next entry
        if i < len(subs) - 1:
            next_event = subs[i + 1]
            if event.end > next_event.start:
                overlap_ms = event.end - next_event.start
                warnings.append(f"Entry {i+1}-{i+2}: overlap of {overlap_ms}ms")

    if warnings:
        logger.warning(f"[SRT] {len(warnings)} validation issues found:")
        for w in warnings[:10]:  # Show first 10
            logger.warning(f"  - {w}")
        if len(warnings) > 10:
            logger.warning(f"  ... and {len(warnings) - 10} more")
    else:
        logger.info(f"[SRT] All {len(subs)} entries passed validation")

    return warnings


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
