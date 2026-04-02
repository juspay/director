#!/usr/bin/env python3
"""
mix-audio.py — Self-contained audio mixing with VAD ducking for Director pipeline.

Mixes music + voiceover with frequency-aware ducking in the voice range (200-4000 Hz).
Includes soft compression and brick-wall limiting.

CLI:
    python mix-audio.py --music PATH --voiceover PATH --output PATH [--duck-db FLOAT]

Called from TypeScript via python-bridge.ts.
"""

import argparse
import os
import sys
import numpy as np

try:
    from scipy.io import wavfile
    from scipy.signal import butter, lfilter, resample
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy", file=sys.stderr)
    sys.exit(1)

# Optional dependencies — degrade gracefully
HAS_PYDUB = False
try:
    from pydub import AudioSegment
    HAS_PYDUB = True
except ImportError:
    pass

HAS_PYLOUDNORM = False
try:
    import pyloudnorm as pyln
    HAS_PYLOUDNORM = True
except ImportError:
    pass

HAS_SILERO = False
try:
    import torch
    HAS_SILERO = True
except ImportError:
    pass

HAS_PEDALBOARD = False
try:
    import pedalboard
    HAS_PEDALBOARD = True
except ImportError:
    pass


# ==========================================================================
# Inlined constants
# ==========================================================================

SAMPLE_RATE = 44100
SR = SAMPLE_RATE

# Ducking defaults
DUCK_DB = -6.0
DUCK_ATTACK_MS = 200
DUCK_RELEASE_MS = 400

# Limiter
LIMITER_THRESHOLD_DB = -1.0

# LUFS target for web video
TARGET_LUFS = -14.0
LUFS_TOLERANCE = 2.0


# ==========================================================================
# Audio loading
# ==========================================================================

def load_wav(path: str) -> np.ndarray:
    """Load WAV file, return mono float64 array normalized to [-1, 1]."""
    rate, data = wavfile.read(path)
    if data.dtype == np.int16:
        data = data.astype(np.float64) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float64) / 2147483648.0
    elif data.dtype == np.float32:
        data = data.astype(np.float64)
    else:
        data = data.astype(np.float64)

    # Stereo to mono
    if len(data.shape) > 1:
        data = data.mean(axis=1)

    # Resample if needed
    if rate != SR:
        print(f"[mix] Resampling from {rate} Hz to {SR} Hz...", file=sys.stderr)
        ratio = SR / rate
        new_len = int(len(data) * ratio)
        data = resample(data, new_len)

    return data


def pad_to_length(signal: np.ndarray, length: int) -> np.ndarray:
    """Pad or trim signal to exact length."""
    if len(signal) >= length:
        return signal[:length]
    return np.pad(signal, (0, length - len(signal)))


# ==========================================================================
# Voice Activity Detection
# ==========================================================================

def detect_voice_activity(voiceover: np.ndarray, frame_ms: int = 20,
                          threshold: float = 0.01) -> np.ndarray:
    """Detect voice activity per sample. Uses Silero VAD if available, else RMS."""
    if HAS_SILERO:
        return _detect_voice_silero(voiceover)
    return _detect_voice_rms(voiceover, frame_ms, threshold)


def _detect_voice_silero(voiceover: np.ndarray) -> np.ndarray:
    """Voice activity detection using Silero VAD model."""
    SILERO_SR = 16000
    activity = np.zeros(len(voiceover))

    try:
        model, utils = torch.hub.load(
            repo_or_dir='snakers4/silero-vad',
            model='silero_vad',
            trust_repo=True
        )
        (get_speech_timestamps, _, _, _, _) = utils

        if SR != SILERO_SR:
            num_samples_16k = int(len(voiceover) * SILERO_SR / SR)
            audio_16k = resample(voiceover, num_samples_16k)
        else:
            audio_16k = voiceover

        wav_tensor = torch.FloatTensor(audio_16k)
        speech_timestamps = get_speech_timestamps(
            wav_tensor, model, sampling_rate=SILERO_SR, threshold=0.5
        )

        ratio = SR / SILERO_SR
        for ts in speech_timestamps:
            start = max(0, int(ts['start'] * ratio))
            end = min(len(activity), int(ts['end'] * ratio))
            activity[start:end] = 1.0

        print(f"[mix] VAD: Silero detected {len(speech_timestamps)} speech segments", file=sys.stderr)
    except Exception as e:
        print(f"[mix] VAD: Silero failed ({e}), falling back to RMS", file=sys.stderr)
        return _detect_voice_rms(voiceover)

    return activity


def _detect_voice_rms(voiceover: np.ndarray, frame_ms: int = 20,
                      threshold: float = 0.01) -> np.ndarray:
    """Fallback RMS-based voice activity detection."""
    print("[mix] VAD: Using RMS fallback", file=sys.stderr)
    frame_size = int(frame_ms / 1000.0 * SR)
    activity = np.zeros(len(voiceover))

    for start in range(0, len(voiceover) - frame_size, frame_size):
        frame = voiceover[start:start + frame_size]
        rms = np.sqrt(np.mean(frame ** 2))
        if rms > threshold:
            activity[start:start + frame_size] = 1.0

    return activity


# ==========================================================================
# Ducking
# ==========================================================================

def create_duck_envelope(voiceover: np.ndarray, duck_db: float = DUCK_DB) -> np.ndarray:
    """Create ducking envelope from voiceover activity."""
    activity = detect_voice_activity(voiceover)
    duck_linear = 10 ** (duck_db / 20.0)

    attack_samples = int(DUCK_ATTACK_MS / 1000.0 * SR)
    release_samples = int(DUCK_RELEASE_MS / 1000.0 * SR)

    envelope = np.ones(len(voiceover))
    duck_level = 1.0

    for i in range(len(voiceover)):
        if activity[i] > 0.5:
            target = duck_linear
            rate = (1.0 - duck_linear) / max(attack_samples, 1)
            duck_level = max(target, duck_level - rate)
        else:
            rate = (1.0 - duck_linear) / max(release_samples, 1)
            duck_level = min(1.0, duck_level + rate)
        envelope[i] = duck_level

    return envelope


def apply_frequency_aware_ducking(
    music: np.ndarray,
    duck_envelope: np.ndarray,
    low_cutoff: float = 200.0,
    high_cutoff: float = 4000.0,
) -> np.ndarray:
    """Duck only the voice frequency range (200-4000 Hz), preserve bass and shimmer."""
    if HAS_PEDALBOARD:
        return _freq_duck_pedalboard(music, duck_envelope, low_cutoff, high_cutoff)
    return _freq_duck_scipy(music, duck_envelope, low_cutoff, high_cutoff)


def _freq_duck_pedalboard(
    music: np.ndarray, duck_envelope: np.ndarray,
    low_cutoff: float, high_cutoff: float,
) -> np.ndarray:
    """Frequency-aware ducking using Pedalboard filters."""
    audio_f32 = music.astype(np.float32).reshape(1, -1)

    low_board = pedalboard.Pedalboard([pedalboard.LowpassFilter(cutoff_frequency_hz=low_cutoff)])
    low_band = low_board(audio_f32, SR).flatten()

    high_board = pedalboard.Pedalboard([pedalboard.HighpassFilter(cutoff_frequency_hz=high_cutoff)])
    high_band = high_board(audio_f32, SR).flatten()

    mid_band = music - low_band.astype(music.dtype) - high_band.astype(music.dtype)
    mid_ducked = mid_band * duck_envelope

    return low_band.astype(music.dtype) + mid_ducked + high_band.astype(music.dtype)


def _freq_duck_scipy(
    music: np.ndarray, duck_envelope: np.ndarray,
    low_cutoff: float, high_cutoff: float,
) -> np.ndarray:
    """Frequency-aware ducking using scipy butterworth filters."""
    nyquist = SR / 2.0

    b_low, a_low = butter(4, low_cutoff / nyquist, btype='low')
    b_high, a_high = butter(4, high_cutoff / nyquist, btype='high')
    b_band, a_band = butter(4, [low_cutoff / nyquist, high_cutoff / nyquist], btype='band')

    low_band = lfilter(b_low, a_low, music)
    high_band = lfilter(b_high, a_high, music)
    mid_band = lfilter(b_band, a_band, music)

    mid_ducked = mid_band * duck_envelope

    return low_band + mid_ducked + high_band


# ==========================================================================
# Compression & limiting
# ==========================================================================

def soft_compress(signal: np.ndarray, threshold_db: float = -12.0,
                  ratio: float = 3.0, attack_ms: float = 5.0,
                  release_ms: float = 50.0) -> np.ndarray:
    """Soft-knee compressor. Uses Pedalboard if available, else sample-by-sample."""
    if HAS_PEDALBOARD:
        return _compress_pedalboard(signal, threshold_db, ratio, attack_ms, release_ms)
    return _compress_numpy(signal, threshold_db, ratio, attack_ms, release_ms)


def brick_wall_limiter(signal: np.ndarray,
                       threshold_db: float = LIMITER_THRESHOLD_DB) -> np.ndarray:
    """Brick-wall limiter. Uses Pedalboard if available."""
    if HAS_PEDALBOARD:
        return _limit_pedalboard(signal, threshold_db)
    return _limit_numpy(signal, threshold_db)


def _compress_pedalboard(signal, threshold_db, ratio, attack_ms, release_ms):
    board = pedalboard.Pedalboard([
        pedalboard.Compressor(
            threshold_db=threshold_db, ratio=ratio,
            attack_ms=attack_ms, release_ms=release_ms,
        ),
    ])
    audio = signal.astype(np.float32).reshape(1, -1)
    processed = board(audio, SR)
    return processed.flatten().astype(signal.dtype)


def _limit_pedalboard(signal, threshold_db):
    board = pedalboard.Pedalboard([
        pedalboard.Limiter(threshold_db=threshold_db),
    ])
    audio = signal.astype(np.float32).reshape(1, -1)
    processed = board(audio, SR)
    return processed.flatten().astype(signal.dtype)


def _compress_numpy(signal, threshold_db=-12.0, ratio=3.0,
                    attack_ms=5.0, release_ms=50.0):
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


def _limit_numpy(signal, threshold_db=-1.0):
    threshold = 10 ** (threshold_db / 20.0)
    peak = np.max(np.abs(signal))
    if peak > threshold:
        signal = signal * (threshold / peak)
    return signal


# ==========================================================================
# LUFS measurement
# ==========================================================================

def measure_loudness(wav_path: str) -> dict:
    """Measure integrated LUFS if pyloudnorm is available."""
    if not HAS_PYLOUDNORM:
        return {}

    try:
        sr, data = wavfile.read(wav_path)
        if data.dtype == np.int16:
            data = data.astype(np.float64) / 32768.0
        elif data.dtype == np.int32:
            data = data.astype(np.float64) / 2147483648.0
        else:
            data = data.astype(np.float64)

        if data.ndim == 1:
            data = data.reshape(-1, 1)

        meter = pyln.Meter(sr)
        integrated_lufs = meter.integrated_loudness(data)
        on_target = abs(integrated_lufs - TARGET_LUFS) <= LUFS_TOLERANCE

        print(f"[mix] LUFS: {integrated_lufs:.1f} (target: {TARGET_LUFS})", file=sys.stderr)
        return {
            "integrated_lufs": round(integrated_lufs, 2),
            "on_target": on_target,
        }
    except Exception as e:
        print(f"[mix] LUFS measurement failed: {e}", file=sys.stderr)
        return {}


# ==========================================================================
# Main
# ==========================================================================

def main():
    parser = argparse.ArgumentParser(description="Mix music + voiceover with ducking")
    parser.add_argument("--music", required=True, help="Music WAV file path")
    parser.add_argument("--voiceover", required=True, help="Voiceover WAV file path")
    parser.add_argument("--output", required=True, help="Output WAV file path")
    parser.add_argument("--duck-db", type=float, default=DUCK_DB,
                        help=f"Ducking level in dB (default: {DUCK_DB})")
    args = parser.parse_args()

    # Validate inputs
    if not os.path.exists(args.music):
        print(f"ERROR: Music file not found: {args.music}", file=sys.stderr)
        sys.exit(1)

    has_voiceover = os.path.exists(args.voiceover)
    if not has_voiceover:
        print(f"[mix] Warning: Voiceover not found at {args.voiceover}, mixing music only", file=sys.stderr)

    output_dir = os.path.dirname(args.output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    # Report backend availability
    backends = []
    if HAS_PEDALBOARD:
        backends.append("pedalboard")
    if HAS_SILERO:
        backends.append("silero-vad")
    if HAS_PYLOUDNORM:
        backends.append("pyloudnorm")
    if HAS_PYDUB:
        backends.append("pydub")
    print(f"[mix] Backends: {', '.join(backends) if backends else 'scipy-only (base)'}", file=sys.stderr)

    # Load music
    print(f"[mix] Loading music: {args.music}", file=sys.stderr)
    music = load_wav(args.music)

    if has_voiceover:
        # Load voiceover
        print(f"[mix] Loading voiceover: {args.voiceover}", file=sys.stderr)
        vo = load_wav(args.voiceover)

        # Match lengths
        max_len = max(len(music), len(vo))
        music = pad_to_length(music, max_len)
        vo = pad_to_length(vo, max_len)

        # Apply frequency-aware ducking
        print(f"[mix] Applying frequency-aware ducking ({args.duck_db} dB, 200-4000 Hz)...", file=sys.stderr)
        duck_env = create_duck_envelope(vo, duck_db=args.duck_db)
        music = apply_frequency_aware_ducking(music, duck_env)

        # Combine (VO slightly louder)
        combined = music + vo * 1.2
    else:
        combined = music

    # Compress and limit
    print("[mix] Applying compression and limiting...", file=sys.stderr)
    combined = soft_compress(combined, threshold_db=-12, ratio=3)
    combined = brick_wall_limiter(combined, LIMITER_THRESHOLD_DB)

    # Write output
    combined_16 = np.int16(np.clip(combined, -1, 1) * 32767)
    wavfile.write(args.output, SR, combined_16)
    print(f"[mix] Saved: {args.output} ({len(combined_16)/SR:.1f}s)", file=sys.stderr)

    # Measure loudness
    measure_loudness(args.output)

    print("[mix] Done.", file=sys.stderr)


if __name__ == "__main__":
    main()
