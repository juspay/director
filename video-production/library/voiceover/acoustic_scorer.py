# Origin: v7 — extracted to library on 2026-03-23
"""
V7 Voiceover Scoring — Technical audio analysis + composite scoring.

Analyzes each voiceover variation across 8 measurable criteria:
1. Pacing (WPM closeness to 150 target)
2. Duration fit (closeness to 160s target)
3. Dynamic range (RMS energy variation — expressiveness)
4. Silence distribution (natural breath patterns)
5. Energy arc (does energy build and resolve like the script?)
6. Spectral warmth (low-to-mid frequency emphasis)
7. Consistency (RMS stability — avoids jarring shifts)
8. Clarity (spectral centroid — presence without harshness)

Usage:
    python score_voiceover_v7.py
"""

import json
import logging
import sys
from pathlib import Path

import librosa
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# ---------- Constants ----------
VOICEOVER_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "v7"
METADATA_PATH = VOICEOVER_DIR / "voiceover-metadata-v7.json"

TARGET_DURATION = 160.0  # seconds (2:40)
TARGET_WPM = 118.0  # TTS natural delivery rate for this narration length
WORD_COUNT = 296  # from metadata

# Weight each criterion (total = 1.0)
WEIGHTS = {
    "pacing": 0.15,
    "duration_fit": 0.10,
    "dynamic_range": 0.15,
    "silence_quality": 0.10,
    "energy_arc": 0.20,
    "spectral_warmth": 0.10,
    "consistency": 0.10,
    "clarity": 0.10,
}


def load_audio(path: str) -> tuple[np.ndarray, int]:
    """Load audio file, return (waveform, sample_rate)."""
    y, sr = librosa.load(path, sr=22050, mono=True)
    return y, sr


def score_pacing(duration: float) -> float:
    """Score WPM closeness to 150. Perfect = 10."""
    wpm = WORD_COUNT / (duration / 60.0)
    deviation = abs(wpm - TARGET_WPM) / TARGET_WPM
    # 0% deviation = 10, 10% = 7, 20% = 4
    score = max(0, 10 - deviation * 30)
    return round(score, 2), wpm


def score_duration_fit(duration: float) -> float:
    """Score duration closeness to 160s target. Perfect = 10."""
    deviation = abs(duration - TARGET_DURATION) / TARGET_DURATION
    score = max(0, 10 - deviation * 40)
    return round(score, 2)


def score_dynamic_range(y: np.ndarray, sr: int) -> float:
    """Score expressiveness via RMS energy range (speech frames only)."""
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_db = librosa.amplitude_to_db(rms + 1e-10)

    # Filter to speech frames only (above -50dB threshold)
    speech_mask = rms_db > -50
    if speech_mask.sum() < 10:
        return 0.0, 0.0

    speech_db = rms_db[speech_mask]
    dr = float(np.percentile(speech_db, 95) - np.percentile(speech_db, 5))

    # TTS speech frames typically have 20-35 dB range
    # Sweet spot: 24-30 dB for expressive narration
    # Too low = monotone, too high = jarring volume shifts
    if 24 <= dr <= 30:
        score = 10.0
    elif dr < 24:
        score = max(0, 10 - (24 - dr) * 1.0)
    else:
        score = max(0, 10 - (dr - 30) * 0.8)

    return round(float(score), 2), round(dr, 1)


def score_silence_quality(y: np.ndarray, sr: int) -> float:
    """Score natural breath/pause patterns. Good silences = expressive delivery."""
    # Detect silences (below -40dB threshold)
    intervals = librosa.effects.split(y, top_db=40)
    n_segments = len(intervals)

    # Calculate silence durations
    silences = []
    for i in range(len(intervals) - 1):
        gap_start = intervals[i][1]
        gap_end = intervals[i + 1][0]
        silence_dur = (gap_end - gap_start) / sr
        if silence_dur > 0.1:  # Only count meaningful pauses
            silences.append(silence_dur)

    n_pauses = len(silences)
    avg_pause = np.mean(silences) if silences else 0
    total_silence = sum(silences)
    silence_ratio = total_silence / (len(y) / sr)

    # Good narration: 8-15% silence, avg pause 0.3-0.8s, 15-40 pauses
    score = 10.0
    if silence_ratio < 0.05:
        score -= 3  # Too rushed
    elif silence_ratio > 0.20:
        score -= 2  # Too much dead air

    if avg_pause < 0.2:
        score -= 1  # Breaths too short
    elif avg_pause > 1.5:
        score -= 2  # Pauses too long

    if n_pauses < 10:
        score -= 2  # Not enough breathing
    elif n_pauses > 50:
        score -= 1  # Choppy

    return round(max(0, score), 2), {
        "n_pauses": n_pauses,
        "avg_pause_s": round(avg_pause, 2),
        "silence_ratio": round(silence_ratio, 3),
    }


def score_energy_arc(y: np.ndarray, sr: int) -> float:
    """
    Score whether energy follows the script's arc:
    - Quiet opening (0-20%)
    - Building middle (20-60%)
    - Peak (60-80%)
    - Quiet resolution (80-100%)
    """
    rms = librosa.feature.rms(y=y, frame_length=4096, hop_length=2048)[0]
    n = len(rms)

    # Split into 5 sections matching script arc
    sections = {
        "opening": rms[: int(n * 0.15)],
        "recognition": rms[int(n * 0.15) : int(n * 0.30)],
        "thesis": rms[int(n * 0.30) : int(n * 0.50)],
        "demo_peak": rms[int(n * 0.50) : int(n * 0.75)],
        "resolution": rms[int(n * 0.75) :],
    }

    means = {k: round(float(np.mean(v)), 6) for k, v in sections.items()}

    # Expected pattern: opening < recognition < thesis ≈ demo_peak > resolution
    score = 10.0

    # Opening should be quieter than demo peak
    if means["opening"] >= means["demo_peak"]:
        score -= 2.0

    # Demo peak should be the loudest section
    peak_section = max(means, key=means.get)
    if peak_section not in ("demo_peak", "thesis"):
        score -= 1.5

    # Resolution should be quieter than peak
    if means["resolution"] >= means["demo_peak"]:
        score -= 1.5

    # Energy should generally build from opening to peak
    if means["recognition"] < means["opening"]:
        score -= 1.0

    # Thesis should be close to or above recognition
    if means["thesis"] < means["recognition"] * 0.9:
        score -= 0.5

    return round(max(0, score), 2), {k: round(v, 4) for k, v in means.items()}


def score_spectral_warmth(y: np.ndarray, sr: int) -> float:
    """Score warmth via low-to-mid frequency emphasis. Warm voice = better for this script."""
    spec = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)

    # Energy in bands
    low_mask = freqs < 500
    mid_mask = (freqs >= 500) & (freqs < 2000)
    high_mask = freqs >= 2000

    low_energy = np.mean(spec[low_mask, :])
    mid_energy = np.mean(spec[mid_mask, :])
    high_energy = np.mean(spec[high_mask, :])

    # Warmth ratio: (low + mid) / high. Higher = warmer.
    warmth_ratio = (low_energy + mid_energy) / (high_energy + 1e-10)

    # Sweet spot: ratio 3-8. Too low = thin/harsh. Too high = muddy.
    if 3 <= warmth_ratio <= 8:
        score = 10.0
    elif warmth_ratio < 3:
        score = max(0, 10 - (3 - warmth_ratio) * 2)
    else:
        score = max(0, 10 - (warmth_ratio - 8) * 0.5)

    return round(float(score), 2), round(float(warmth_ratio), 2)


def score_consistency(y: np.ndarray, sr: int) -> float:
    """Score RMS stability — avoid jarring volume shifts."""
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]

    # Calculate frame-to-frame RMS changes
    rms_diff = np.abs(np.diff(rms))
    mean_diff = np.mean(rms_diff)
    max_diff = np.percentile(rms_diff, 99)  # 99th percentile to ignore outliers

    # Coefficient of variation of RMS
    cv = np.std(rms) / (np.mean(rms) + 1e-10)

    # TTS narration with pauses typically has CV 0.8-1.2
    # Sweet spot: 0.85-1.05. Too low = flat. Too high = uneven.
    if 0.85 <= cv <= 1.05:
        score = 10.0
    elif cv < 0.85:
        score = max(0, 10 - (0.85 - cv) * 15)
    else:
        score = max(0, 10 - (cv - 1.05) * 10)

    return round(float(score), 2), round(float(cv), 3)


def score_clarity(y: np.ndarray, sr: int) -> float:
    """Score voice clarity via spectral centroid. Should have presence without harshness."""
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    mean_centroid = np.mean(centroid)

    # Good voice centroid for narration: 1500-3000 Hz
    if 1500 <= mean_centroid <= 3000:
        score = 10.0
    elif mean_centroid < 1500:
        score = max(0, 10 - (1500 - mean_centroid) / 200)
    else:
        score = max(0, 10 - (mean_centroid - 3000) / 300)

    return round(float(score), 2), round(float(mean_centroid), 0)


def analyze_variation(variation: dict) -> dict:
    """Full analysis of one voiceover variation."""
    var_id = variation["variation_id"]
    audio_path = variation["audio_path"]
    duration = variation["duration_seconds"]

    logger.info(f"[{var_id}] Analyzing...")

    y, sr = load_audio(audio_path)

    # Score all criteria
    pacing_score, wpm = score_pacing(duration)
    duration_score = score_duration_fit(duration)
    dynamic_score, dynamic_range = score_dynamic_range(y, sr)
    silence_score, silence_details = score_silence_quality(y, sr)
    energy_score, energy_sections = score_energy_arc(y, sr)
    warmth_score, warmth_ratio = score_spectral_warmth(y, sr)
    consistency_score, consistency_cv = score_consistency(y, sr)
    clarity_score, clarity_centroid = score_clarity(y, sr)

    scores = {
        "pacing": pacing_score,
        "duration_fit": duration_score,
        "dynamic_range": dynamic_score,
        "silence_quality": silence_score,
        "energy_arc": energy_score,
        "spectral_warmth": warmth_score,
        "consistency": consistency_score,
        "clarity": clarity_score,
    }

    # Weighted composite
    composite = sum(scores[k] * WEIGHTS[k] for k in scores)

    result = {
        "variation_id": var_id,
        "description": variation["description"],
        "settings": variation["settings"],
        "duration_seconds": duration,
        "scores": scores,
        "composite_score": round(composite, 2),
        "details": {
            "wpm": round(wpm, 1),
            "dynamic_range_db": dynamic_range,
            "silence": silence_details,
            "energy_sections": energy_sections,
            "warmth_ratio": warmth_ratio,
            "consistency_cv": consistency_cv,
            "clarity_centroid_hz": clarity_centroid,
        },
    }

    logger.info(f"[{var_id}] Composite: {composite:.2f}/10 | "
                f"Pacing={pacing_score} Duration={duration_score} "
                f"Dynamic={dynamic_score} Silence={silence_score} "
                f"Energy={energy_score} Warmth={warmth_score} "
                f"Consistency={consistency_score} Clarity={clarity_score}")

    return result


def print_comparison(results: list[dict]):
    """Print side-by-side comparison table."""
    print("\n" + "=" * 100)
    print("VOICEOVER VARIATION COMPARISON — v7.4")
    print("=" * 100)

    # Header
    ids = [r["variation_id"] for r in results]
    header = f"{'Criterion':<20}" + "".join(f"{v:>15}" for v in ids)
    print(header)
    print("-" * 100)

    # Each criterion
    for criterion in WEIGHTS:
        row = f"{criterion:<20}"
        for r in results:
            s = r["scores"][criterion]
            row += f"{s:>15.2f}"
        print(row)

    print("-" * 100)

    # Composite
    row = f"{'COMPOSITE':<20}"
    for r in results:
        row += f"{r['composite_score']:>15.2f}"
    print(row)

    # Duration
    row = f"{'Duration (s)':<20}"
    for r in results:
        row += f"{r['duration_seconds']:>15.1f}"
    print(row)

    # WPM
    row = f"{'WPM':<20}"
    for r in results:
        row += f"{r['details']['wpm']:>15.1f}"
    print(row)

    print("=" * 100)

    # Winner
    winner = max(results, key=lambda r: r["composite_score"])
    print(f"\nBEST VARIATION: {winner['variation_id']} — {winner['composite_score']:.2f}/10")
    print(f"  Description: {winner['description']}")
    print(f"  Settings: stability={winner['settings']['stability']}, "
          f"similarity={winner['settings']['similarity_boost']}, "
          f"style={winner['settings']['style']}")
    print(f"  Duration: {winner['duration_seconds']:.1f}s ({winner['details']['wpm']:.0f} WPM)")

    # Recommendations
    print("\nRECOMMENDATIONS:")
    best_scores = winner["scores"]
    weakest = min(best_scores, key=best_scores.get)
    print(f"  Weakest criterion: {weakest} ({best_scores[weakest]:.2f})")

    if best_scores["pacing"] < 8:
        print(f"  - Pacing off target. WPM={winner['details']['wpm']:.0f} vs target 150.")
    if best_scores["energy_arc"] < 8:
        print(f"  - Energy arc doesn't match script structure. Consider adjusting stability.")
    if best_scores["dynamic_range"] < 8:
        print(f"  - Dynamic range issues. Try adjusting style parameter.")
    if best_scores["consistency"] < 8:
        print(f"  - Consistency issues. Try increasing stability.")


def main():
    if not METADATA_PATH.exists():
        logger.error(f"Metadata not found: {METADATA_PATH}")
        logger.error("Run generate_voiceover_v7.py first.")
        sys.exit(1)

    metadata = json.loads(METADATA_PATH.read_text())
    variations = metadata["variations"]

    logger.info(f"Scoring {len(variations)} voiceover variations")

    results = []
    for var in variations:
        if not Path(var["audio_path"]).exists():
            logger.warning(f"[{var['variation_id']}] File not found, skipping")
            continue
        result = analyze_variation(var)
        results.append(result)

    if not results:
        logger.error("No variations to score!")
        sys.exit(1)

    # Save scores
    scores_path = VOICEOVER_DIR / "voiceover-scores-v7.json"
    # Convert numpy types to Python native for JSON serialization
    def convert(obj):
        if isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    class NumpyEncoder(json.JSONEncoder):
        def default(self, obj):
            converted = convert(obj)
            if converted is not obj:
                return converted
            return super().default(obj)

    scores_path.write_text(json.dumps(results, indent=2, cls=NumpyEncoder))
    logger.info(f"Scores saved to {scores_path}")

    # Print comparison
    print_comparison(results)

    return results


if __name__ == "__main__":
    main()
