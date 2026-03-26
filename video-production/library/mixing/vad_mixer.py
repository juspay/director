#!/usr/bin/env python3
# Origin: v7 — extracted to library on 2026-03-23
"""
mix_audio_v7.py — Mix voiceover + music + SFX for TARA v7.4 product video.

Layers:
1. Music bed (from generate_music_v7.py)
2. SFX placed at exact timestamps (from generate_sfx_v7.py)
3. Voiceover on top with automatic ducking

Features:
- Music ducking during narration (-6dB)
- Exact SFX timestamp placement per script
- Gentle compression and brick-wall limiting
- Output: final WAV + MP3

Usage:
    python mix_audio_v7.py [OPTIONS]

Options:
    --music PATH        Music WAV (default: tara_v74_music.wav)
    --voiceover PATH    Voiceover WAV (default: voiceover.wav)
    --sfx-dir PATH      Directory with SFX WAVs (default: .)
    --output-dir PATH   Output directory (default: .)
    --no-voiceover      Mix without voiceover (music + SFX only)
"""

import argparse
import os
import sys
import numpy as np

try:
    from scipy.io import wavfile
    from scipy.signal import butter, lfilter
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy")
    sys.exit(1)

try:
    from pydub import AudioSegment
    from pydub.effects import compress_dynamic_range, normalize as pydub_normalize
    HAS_PYDUB = True
except ImportError:
    print("WARNING: pydub not installed. Will use scipy-only pipeline.")
    print("         For MP3 export, install: pip install pydub")
    HAS_PYDUB = False

try:
    import pyloudnorm as pyln
    HAS_PYLOUDNORM = True
except ImportError:
    HAS_PYLOUDNORM = False

from music_config import (
    SFX_TIMESTAMPS, SAMPLE_RATE, DUCK_DB, DUCK_ATTACK_MS,
    DUCK_RELEASE_MS, LIMITER_THRESHOLD_DB, MP3_BITRATE,
    TOTAL_DURATION_S,
)


SR = SAMPLE_RATE

# LUFS target for web video (YouTube, Spotify normalize to ~-14 LUFS)
TARGET_LUFS = -14.0
LUFS_TOLERANCE = 2.0  # warn if outside target +/- this


def measure_loudness(wav_path: str, sample_rate: int = None) -> dict | None:
    """Measure integrated LUFS and true peak of a WAV file using pyloudnorm.

    Returns dict with 'integrated_lufs', 'true_peak_dbtp', and 'on_target' flag,
    or None if pyloudnorm is not installed.
    """
    if not HAS_PYLOUDNORM:
        print("      [loudness] pyloudnorm not installed — skipping LUFS measurement")
        return None

    sr = sample_rate or SR
    data, _ = None, None
    try:
        from scipy.io import wavfile as _wf
        _sr, _data = _wf.read(wav_path)
        sr = _sr
        # Convert to float64 in [-1, 1] range
        if _data.dtype == np.int16:
            data = _data.astype(np.float64) / 32768.0
        elif _data.dtype == np.int32:
            data = _data.astype(np.float64) / 2147483648.0
        else:
            data = _data.astype(np.float64)
    except Exception as e:
        print(f"      [loudness] Could not read {wav_path}: {e}")
        return None

    # Ensure mono or stereo (pyloudnorm needs shape (samples,) or (samples, channels))
    if data.ndim == 1:
        data = data.reshape(-1, 1)

    meter = pyln.Meter(sr)
    integrated_lufs = meter.integrated_loudness(data)
    true_peak = pyln.true_peak(data, sr)

    on_target = abs(integrated_lufs - TARGET_LUFS) <= LUFS_TOLERANCE
    status = "OK" if on_target else "WARNING"

    print(f"      [loudness] Integrated: {integrated_lufs:.1f} LUFS (target: {TARGET_LUFS} +/- {LUFS_TOLERANCE})")
    print(f"      [loudness] True Peak: {true_peak:.1f} dBTP (max: -1.0 dBTP)")
    if not on_target:
        print(f"      [loudness] {status}: LUFS is {abs(integrated_lufs - TARGET_LUFS):.1f} outside target range")
    if true_peak > -1.0:
        print(f"      [loudness] WARNING: True peak exceeds -1.0 dBTP")

    return {
        "integrated_lufs": round(integrated_lufs, 2),
        "true_peak_dbtp": round(true_peak, 2),
        "on_target": on_target,
    }


# --------------------------------------------------------------------------
# Audio loading
# --------------------------------------------------------------------------

def load_wav(path: str) -> np.ndarray:
    """Load WAV file, return mono float64 array normalized to [-1, 1]."""
    rate, data = wavfile.read(path)
    if data.dtype == np.int16:
        data = data.astype(np.float64) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float64) / 2147483648.0
    elif data.dtype == np.float32:
        data = data.astype(np.float64)

    # Convert stereo to mono
    if len(data.shape) > 1:
        data = data.mean(axis=1)

    # Resample if needed
    if rate != SR:
        print(f"      Resampling from {rate} Hz to {SR} Hz...")
        ratio = SR / rate
        new_len = int(len(data) * ratio)
        from scipy.signal import resample
        data = resample(data, new_len)

    return data


def pad_to_length(signal: np.ndarray, length: int) -> np.ndarray:
    """Pad or trim signal to exact length."""
    if len(signal) >= length:
        return signal[:length]
    return np.pad(signal, (0, length - len(signal)))


# --------------------------------------------------------------------------
# Music ducking
# --------------------------------------------------------------------------

def detect_voice_activity(voiceover: np.ndarray, frame_ms: int = 20,
                          threshold: float = 0.01) -> np.ndarray:
    """Detect voice activity per sample (returns 0/1 array)."""
    frame_size = int(frame_ms / 1000.0 * SR)
    activity = np.zeros(len(voiceover))

    for start in range(0, len(voiceover) - frame_size, frame_size):
        frame = voiceover[start:start + frame_size]
        rms = np.sqrt(np.mean(frame ** 2))
        if rms > threshold:
            activity[start:start + frame_size] = 1.0

    return activity


def create_duck_envelope(voiceover: np.ndarray, duck_db: float | None = None) -> np.ndarray:
    """
    Create a ducking envelope from voiceover activity.
    Returns a gain multiplier array (1.0 = full volume, duck_gain = ducked).
    """
    activity = detect_voice_activity(voiceover)
    effective_db = duck_db if duck_db is not None else DUCK_DB
    duck_linear = 10 ** (effective_db / 20.0)

    # Smooth the activity with attack/release
    attack_samples = int(DUCK_ATTACK_MS / 1000.0 * SR)
    release_samples = int(DUCK_RELEASE_MS / 1000.0 * SR)

    envelope = np.ones(len(voiceover))
    ducking = False
    duck_level = 1.0

    for i in range(len(voiceover)):
        if activity[i] > 0.5:
            if not ducking:
                ducking = True
            # Ramp down
            target = duck_linear
            rate = (1.0 - duck_linear) / attack_samples
            duck_level = max(target, duck_level - rate)
        else:
            if ducking and duck_level >= (1.0 - 0.01):
                ducking = False
            # Ramp up
            rate = (1.0 - duck_linear) / release_samples
            duck_level = min(1.0, duck_level + rate)

        envelope[i] = duck_level

    return envelope


# --------------------------------------------------------------------------
# Compression & limiting
# --------------------------------------------------------------------------

def soft_compress(signal: np.ndarray, threshold_db: float = -12.0,
                  ratio: float = 3.0, attack_ms: float = 5.0,
                  release_ms: float = 50.0) -> np.ndarray:
    """Simple soft-knee compressor."""
    threshold = 10 ** (threshold_db / 20.0)
    attack_coeff = np.exp(-1.0 / (attack_ms / 1000.0 * SR))
    release_coeff = np.exp(-1.0 / (release_ms / 1000.0 * SR))

    output = np.copy(signal)
    gain = 1.0

    for i in range(len(signal)):
        level = abs(signal[i])
        if level > threshold:
            target_gain = threshold + (level - threshold) / ratio
            target_gain /= level if level > 0 else 1
            coeff = attack_coeff
        else:
            target_gain = 1.0
            coeff = release_coeff

        gain = coeff * gain + (1 - coeff) * target_gain
        output[i] = signal[i] * gain

    return output


def brick_wall_limiter(signal: np.ndarray,
                       threshold_db: float = -1.0) -> np.ndarray:
    """Brick-wall limiter to prevent clipping."""
    threshold = 10 ** (threshold_db / 20.0)
    peak = np.max(np.abs(signal))
    if peak > threshold:
        signal = signal * (threshold / peak)
    return signal


# --------------------------------------------------------------------------
# Pydub-based pipeline (higher quality, MP3 support)
# --------------------------------------------------------------------------

def mix_with_pydub(music_path: str, sfx_dir: str,
                   voiceover_path: str | None,
                   output_dir: str, suffix: str = "",
                   duck_db_override: float | None = None):
    """Full mix pipeline using pydub for operations."""

    print("[1/5] Loading music...")
    music = AudioSegment.from_wav(music_path)

    # Load SFX
    print("[2/5] Loading and placing SFX...")
    sfx_files = {
        "plucked_string": "sfx_plucked_string.wav",
        "sub_pulse": "sfx_sub_pulse.wav",
        "shimmer": "sfx_shimmer.wav",
    }

    # Start with music as base
    mix = music

    for sfx_name, filename in sfx_files.items():
        sfx_path = os.path.join(sfx_dir, filename)
        if not os.path.exists(sfx_path):
            print(f"      WARNING: {sfx_path} not found, skipping {sfx_name}")
            continue

        sfx = AudioSegment.from_wav(sfx_path)
        timestamp_s = SFX_TIMESTAMPS.get(sfx_name, 0)
        timestamp_ms = int(timestamp_s * 1000)

        # Adjust SFX volume relative to music
        if sfx_name == "sub_pulse":
            sfx = sfx - 3  # sub pulse slightly quieter
        elif sfx_name == "shimmer":
            sfx = sfx - 6  # shimmer subtle

        # Overlay SFX at exact timestamp
        if timestamp_ms < len(mix):
            mix = mix.overlay(sfx, position=timestamp_ms)
            print(f"      Placed {sfx_name} at {timestamp_s:.1f}s")
        else:
            print(f"      WARNING: {sfx_name} timestamp ({timestamp_s}s) exceeds mix duration")

    # Load and apply voiceover with ducking
    if voiceover_path and os.path.exists(voiceover_path):
        print("[3/5] Loading voiceover and applying ducking...")
        vo = AudioSegment.from_wav(voiceover_path)

        # Create ducked version of mix
        # pydub ducking: reduce mix volume where VO is present
        # We'll do this via numpy for precision, then convert back
        mix_array = np.array(mix.get_array_of_samples(), dtype=np.float64)
        mix_array /= 32768.0
        if mix.channels == 2:
            mix_array = mix_array.reshape(-1, 2).mean(axis=1)

        vo_array = np.array(vo.get_array_of_samples(), dtype=np.float64)
        vo_array /= 32768.0
        if vo.channels == 2:
            vo_array = vo_array.reshape(-1, 2).mean(axis=1)

        # Match lengths
        max_len = max(len(mix_array), len(vo_array))
        mix_array = pad_to_length(mix_array, max_len)
        vo_array = pad_to_length(vo_array, max_len)

        # Apply ducking (use override if provided)
        effective_duck_db = duck_db_override if duck_db_override is not None else DUCK_DB
        duck_env = create_duck_envelope(vo_array, duck_db=effective_duck_db)
        mix_array *= duck_env
        print(f"      Ducking level: {effective_duck_db} dB")

        # Combine
        combined = mix_array + vo_array * 1.2  # VO slightly louder than music

        # Compress and limit
        print("[4/5] Applying compression and limiting...")
        combined = soft_compress(combined, threshold_db=-12, ratio=3)
        combined = brick_wall_limiter(combined, LIMITER_THRESHOLD_DB)

        # Convert back to pydub
        combined_16 = np.int16(np.clip(combined, -1, 1) * 32767)
        mix = AudioSegment(
            combined_16.tobytes(),
            frame_rate=SR,
            sample_width=2,
            channels=1,
        )
    else:
        if voiceover_path:
            print(f"      WARNING: Voiceover not found at {voiceover_path}")
        print("[3/5] No voiceover — mixing music + SFX only...")

        # Still compress and limit the instrumental
        print("[4/5] Applying compression and limiting...")
        mix_array = np.array(mix.get_array_of_samples(), dtype=np.float64)
        mix_array /= 32768.0
        if mix.channels == 2:
            mix_array = mix_array.reshape(-1, 2).mean(axis=1)

        mix_array = soft_compress(mix_array, threshold_db=-12, ratio=2.5)
        mix_array = brick_wall_limiter(mix_array, LIMITER_THRESHOLD_DB)

        combined_16 = np.int16(np.clip(mix_array, -1, 1) * 32767)
        mix = AudioSegment(
            combined_16.tobytes(),
            frame_rate=SR,
            sample_width=2,
            channels=1,
        )

    # Export
    print("[5/5] Exporting...")
    base_name = f"tara_v74_final_mix{suffix}"
    wav_path = os.path.join(output_dir, f"{base_name}.wav")
    mix.export(wav_path, format="wav")
    print(f"      WAV: {wav_path} ({len(mix)/1000:.1f}s)")
    measure_loudness(wav_path)

    try:
        mp3_path = os.path.join(output_dir, f"{base_name}.mp3")
        mix.export(mp3_path, format="mp3", bitrate=MP3_BITRATE)
        print(f"      MP3: {mp3_path} ({MP3_BITRATE})")
    except Exception as e:
        print(f"      MP3 export failed (need ffmpeg): {e}")
        print("      Install ffmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)")


# --------------------------------------------------------------------------
# Scipy-only fallback pipeline
# --------------------------------------------------------------------------

def mix_with_scipy(music_path: str, sfx_dir: str,
                   voiceover_path: str | None,
                   output_dir: str, suffix: str = "",
                   duck_db_override: float | None = None):
    """Fallback mix pipeline using scipy only (no MP3 export)."""

    print("[1/5] Loading music...")
    music = load_wav(music_path)
    total_samples = len(music)

    # Load and place SFX
    print("[2/5] Loading and placing SFX...")
    sfx_files = {
        "plucked_string": ("sfx_plucked_string.wav", 1.0),
        "sub_pulse": ("sfx_sub_pulse.wav", 0.7),
        "shimmer": ("sfx_shimmer.wav", 0.5),
    }

    for sfx_name, (filename, gain) in sfx_files.items():
        sfx_path = os.path.join(sfx_dir, filename)
        if not os.path.exists(sfx_path):
            print(f"      WARNING: {sfx_path} not found, skipping {sfx_name}")
            continue

        sfx = load_wav(sfx_path)
        timestamp_s = SFX_TIMESTAMPS.get(sfx_name, 0)
        start_sample = int(timestamp_s * SR)

        if start_sample < total_samples:
            end_sample = min(start_sample + len(sfx), total_samples)
            sfx_len = end_sample - start_sample
            music[start_sample:end_sample] += sfx[:sfx_len] * gain
            print(f"      Placed {sfx_name} at {timestamp_s:.1f}s (gain: {gain})")

    # Voiceover ducking
    if voiceover_path and os.path.exists(voiceover_path):
        print("[3/5] Loading voiceover and applying ducking...")
        vo = load_wav(voiceover_path)

        max_len = max(len(music), len(vo))
        music = pad_to_length(music, max_len)
        vo = pad_to_length(vo, max_len)

        effective_duck_db = duck_db_override if duck_db_override is not None else DUCK_DB
        duck_env = create_duck_envelope(vo, duck_db=effective_duck_db)
        music *= duck_env
        print(f"      Ducking level: {effective_duck_db} dB")
        combined = music + vo * 1.2
    else:
        if voiceover_path:
            print(f"      WARNING: Voiceover not found at {voiceover_path}")
        print("[3/5] No voiceover — music + SFX only...")
        combined = music

    # Compress and limit
    print("[4/5] Applying compression and limiting...")
    combined = soft_compress(combined, threshold_db=-12, ratio=3)
    combined = brick_wall_limiter(combined, LIMITER_THRESHOLD_DB)

    # Export WAV
    print("[5/5] Exporting...")
    combined_16 = np.int16(np.clip(combined, -1, 1) * 32767)
    base_name = f"tara_v74_final_mix{suffix}"
    wav_path = os.path.join(output_dir, f"{base_name}.wav")
    wavfile.write(wav_path, SR, combined_16)
    print(f"      WAV: {wav_path} ({len(combined_16)/SR:.1f}s)")
    measure_loudness(wav_path)
    print("      (Install pydub + ffmpeg for MP3 export)")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Mix TARA v7.4 audio")
    parser.add_argument("--music", default="tara_v74_music.wav",
                        help="Music WAV file")
    parser.add_argument("--voiceover", default="voiceover.wav",
                        help="Voiceover WAV file")
    parser.add_argument("--sfx-dir", default=".",
                        help="Directory containing SFX WAV files")
    parser.add_argument("--output-dir", default=".",
                        help="Output directory")
    parser.add_argument("--no-voiceover", action="store_true",
                        help="Mix without voiceover")
    parser.add_argument("--duck-db", type=float, default=None,
                        help="Override ducking level in dB (e.g. -6, -9, -3)")
    parser.add_argument("--output-suffix", default="",
                        help="Suffix for output filename (e.g. '_mix_a')")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("=== TARA v7.4 Audio Mixer ===")
    print(f"Music:     {args.music}")
    print(f"Voiceover: {'(disabled)' if args.no_voiceover else args.voiceover}")
    print(f"SFX dir:   {args.sfx_dir}")
    print(f"Output:    {args.output_dir}")
    print()

    vo_path = None if args.no_voiceover else args.voiceover

    # Override ducking level if specified
    if args.duck_db is not None:
        import music_config
        music_config.DUCK_DB = args.duck_db
        # Re-import into local scope
        global DUCK_DB
        from music_config import DUCK_DB
        print(f"Ducking override: {args.duck_db} dB")

    if not os.path.exists(args.music):
        print(f"ERROR: Music file not found: {args.music}")
        print("       Run generate_music_v7.py first.")
        sys.exit(1)

    if HAS_PYDUB:
        print("Using pydub pipeline (WAV + MP3 output)")
        print()
        mix_with_pydub(args.music, args.sfx_dir, vo_path, args.output_dir,
                       suffix=args.output_suffix, duck_db_override=args.duck_db)
    else:
        print("Using scipy-only pipeline (WAV output only)")
        print()
        mix_with_scipy(args.music, args.sfx_dir, vo_path, args.output_dir,
                       suffix=args.output_suffix, duck_db_override=args.duck_db)

    print()
    print("Done. Final mix ready.")


if __name__ == "__main__":
    main()
