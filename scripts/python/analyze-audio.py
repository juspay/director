#!/usr/bin/env python3
"""
analyze-audio.py — Spectral analysis for Director pipeline.

Analyzes an audio file using librosa and outputs JSON with spectral features
and a composite quality score.

CLI:
    python analyze-audio.py --audio PATH --json

Always outputs JSON to stdout. Diagnostics go to stderr.
Called from TypeScript via python-bridge.ts.
"""

import argparse
import json
import os
import sys
import numpy as np

try:
    import librosa
except ImportError:
    print(json.dumps({
        "error": "librosa not installed. Run: pip install librosa",
        "composite_score": 0.0,
    }))
    sys.exit(1)


# ==========================================================================
# Constants
# ==========================================================================

SAMPLE_RATE = 44100


# ==========================================================================
# Feature extraction
# ==========================================================================

def extract_spectral_features(y: np.ndarray, sr: int) -> dict:
    """Extract a comprehensive set of spectral features from audio."""

    features = {}

    # Duration
    duration = len(y) / sr
    features["duration_s"] = round(duration, 2)
    features["sample_rate"] = sr
    features["num_samples"] = len(y)

    # RMS energy
    rms = librosa.feature.rms(y=y)[0]
    features["rms_mean"] = round(float(np.mean(rms)), 6)
    features["rms_std"] = round(float(np.std(rms)), 6)
    features["rms_max"] = round(float(np.max(rms)), 6)

    # Dynamic range (dB)
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)
    features["dynamic_range_db"] = round(float(np.max(rms_db) - np.min(rms_db)), 2)

    # Spectral centroid — brightness indicator
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    features["spectral_centroid_mean"] = round(float(np.mean(centroid)), 2)
    features["spectral_centroid_std"] = round(float(np.std(centroid)), 2)

    # Spectral bandwidth — timbral width
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    features["spectral_bandwidth_mean"] = round(float(np.mean(bandwidth)), 2)

    # Spectral rolloff — frequency below which 85% of energy lies
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]
    features["spectral_rolloff_mean"] = round(float(np.mean(rolloff)), 2)

    # Spectral contrast — valley-to-peak energy ratio per subband
    try:
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        features["spectral_contrast_mean"] = round(float(np.mean(contrast)), 2)
        features["spectral_contrast_bands"] = [round(float(x), 2) for x in np.mean(contrast, axis=1)]
    except Exception:
        features["spectral_contrast_mean"] = 0.0
        features["spectral_contrast_bands"] = []

    # Spectral flatness — tonal vs. noise-like (0 = tonal, 1 = noise)
    flatness = librosa.feature.spectral_flatness(y=y)[0]
    features["spectral_flatness_mean"] = round(float(np.mean(flatness)), 6)

    # Zero crossing rate — percussiveness indicator
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    features["zero_crossing_rate_mean"] = round(float(np.mean(zcr)), 6)

    # MFCCs — timbral fingerprint (first 13 coefficients)
    try:
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        features["mfcc_means"] = [round(float(x), 4) for x in np.mean(mfccs, axis=1)]
    except Exception:
        features["mfcc_means"] = []

    # Tempo estimation
    try:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        # librosa may return an array; extract scalar
        if hasattr(tempo, '__len__'):
            tempo = float(tempo[0]) if len(tempo) > 0 else 0.0
        features["estimated_tempo_bpm"] = round(float(tempo), 2)
    except Exception:
        features["estimated_tempo_bpm"] = 0.0

    # Onset strength (transient density)
    try:
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        features["onset_strength_mean"] = round(float(np.mean(onset_env)), 4)
        features["onset_strength_max"] = round(float(np.max(onset_env)), 4)
    except Exception:
        features["onset_strength_mean"] = 0.0
        features["onset_strength_max"] = 0.0

    # Harmonic-percussive ratio
    try:
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        harmonic_energy = float(np.sum(y_harmonic ** 2))
        percussive_energy = float(np.sum(y_percussive ** 2))
        total_energy = harmonic_energy + percussive_energy
        if total_energy > 0:
            features["harmonic_ratio"] = round(harmonic_energy / total_energy, 4)
            features["percussive_ratio"] = round(percussive_energy / total_energy, 4)
        else:
            features["harmonic_ratio"] = 0.0
            features["percussive_ratio"] = 0.0
    except Exception:
        features["harmonic_ratio"] = 0.0
        features["percussive_ratio"] = 0.0

    # Silence ratio (frames below -40 dB)
    try:
        rms_db_full = librosa.amplitude_to_db(rms, ref=np.max)
        silence_frames = np.sum(rms_db_full < -40)
        features["silence_ratio"] = round(float(silence_frames / len(rms_db_full)), 4)
    except Exception:
        features["silence_ratio"] = 0.0

    return features


def compute_composite_score(features: dict) -> float:
    """
    Compute a composite quality score (0-100) based on extracted features.

    Heuristic scoring:
    - Dynamic range: prefer 15-30 dB (25 pts)
    - Spectral balance: centroid in 1000-4000 Hz sweet spot (20 pts)
    - Harmonic content: higher harmonic ratio = more musical (20 pts)
    - Energy consistency: low RMS std relative to mean (15 pts)
    - Low silence ratio for music/mix (10 pts)
    - Tonal quality: low spectral flatness (10 pts)
    """
    score = 0.0

    # Dynamic range (25 pts) — sweet spot is 15-30 dB
    dr = features.get("dynamic_range_db", 0)
    if 15 <= dr <= 30:
        score += 25.0
    elif 10 <= dr < 15 or 30 < dr <= 40:
        score += 15.0
    elif 5 <= dr < 10:
        score += 8.0
    elif dr > 0:
        score += 3.0

    # Spectral centroid (20 pts) — sweet spot 1000-4000 Hz
    centroid = features.get("spectral_centroid_mean", 0)
    if 1000 <= centroid <= 4000:
        score += 20.0
    elif 500 <= centroid < 1000 or 4000 < centroid <= 6000:
        score += 12.0
    elif centroid > 0:
        score += 5.0

    # Harmonic ratio (20 pts)
    hr = features.get("harmonic_ratio", 0)
    score += hr * 20.0

    # Energy consistency (15 pts) — lower coefficient of variation is better
    rms_mean = features.get("rms_mean", 0)
    rms_std = features.get("rms_std", 0)
    if rms_mean > 0:
        cv = rms_std / rms_mean
        if cv < 0.5:
            score += 15.0
        elif cv < 1.0:
            score += 10.0
        elif cv < 2.0:
            score += 5.0

    # Silence ratio (10 pts) — less silence = more content
    silence = features.get("silence_ratio", 1.0)
    score += max(0, (1.0 - silence)) * 10.0

    # Tonal quality (10 pts) — lower spectral flatness = more tonal
    flatness = features.get("spectral_flatness_mean", 1.0)
    score += max(0, (1.0 - flatness * 5)) * 10.0  # flatness is usually 0-0.2 for music

    return round(min(100.0, max(0.0, score)), 2)


# ==========================================================================
# Main
# ==========================================================================

def main():
    parser = argparse.ArgumentParser(description="Analyze audio spectral features")
    parser.add_argument("--audio", required=True, help="Audio file path to analyze")
    parser.add_argument("--json", action="store_true", default=True,
                        help="Output as JSON (always enabled)")
    args = parser.parse_args()

    if not os.path.exists(args.audio):
        result = {
            "error": f"Audio file not found: {args.audio}",
            "composite_score": 0.0,
        }
        print(json.dumps(result))
        sys.exit(1)

    print(f"[analyze] Loading: {args.audio}", file=sys.stderr)

    try:
        y, sr = librosa.load(args.audio, sr=SAMPLE_RATE, mono=True)
    except Exception as e:
        result = {
            "error": f"Failed to load audio: {str(e)}",
            "composite_score": 0.0,
        }
        print(json.dumps(result))
        sys.exit(1)

    print(f"[analyze] Loaded {len(y)/sr:.1f}s @ {sr} Hz", file=sys.stderr)
    print("[analyze] Extracting spectral features...", file=sys.stderr)

    features = extract_spectral_features(y, sr)

    print("[analyze] Computing composite score...", file=sys.stderr)
    features["composite_score"] = compute_composite_score(features)

    # Output JSON to stdout (this is what TypeScript reads)
    print(json.dumps(features, indent=2))

    print(f"[analyze] Done. Score: {features['composite_score']}/100", file=sys.stderr)


if __name__ == "__main__":
    main()
