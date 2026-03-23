# Origin: v7 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""
Score ALL MP3 voiceover files in v7/assets/voiceover/v7/ and update
voiceover-scores-comprehensive.json with the full leaderboard.

Reuses the same scoring functions from score_voiceover_v7.py.
"""

import json
import os
import sys
from pathlib import Path

import librosa
import numpy as np

# ---------- Constants ----------
VOICEOVER_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "v7"
SCORES_PATH = VOICEOVER_DIR / "voiceover-scores-comprehensive.json"

TARGET_DURATION = 160.0
TARGET_WPM = 118.0
WORD_COUNT = 296

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


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


# ---------- Scoring functions (from score_voiceover_v7.py) ----------

def score_pacing(duration):
    wpm = WORD_COUNT / (duration / 60.0)
    deviation = abs(wpm - TARGET_WPM) / TARGET_WPM
    score = max(0, 10 - deviation * 30)
    return round(score, 2), round(wpm, 1)


def score_duration_fit(duration):
    deviation = abs(duration - TARGET_DURATION) / TARGET_DURATION
    score = max(0, 10 - deviation * 40)
    return round(score, 2)


def score_dynamic_range(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_db = librosa.amplitude_to_db(rms + 1e-10)
    speech_mask = rms_db > -50
    if speech_mask.sum() < 10:
        return 0.0, 0.0
    speech_db = rms_db[speech_mask]
    dr = float(np.percentile(speech_db, 95) - np.percentile(speech_db, 5))
    if 24 <= dr <= 30:
        score = 10.0
    elif dr < 24:
        score = max(0, 10 - (24 - dr) * 1.0)
    else:
        score = max(0, 10 - (dr - 30) * 0.8)
    return round(float(score), 2), round(dr, 1)


def score_silence_quality(y, sr):
    intervals = librosa.effects.split(y, top_db=40)
    silences = []
    for i in range(len(intervals) - 1):
        gap_start = intervals[i][1]
        gap_end = intervals[i + 1][0]
        silence_dur = (gap_end - gap_start) / sr
        if silence_dur > 0.1:
            silences.append(silence_dur)
    n_pauses = len(silences)
    avg_pause = float(np.mean(silences)) if silences else 0
    total_silence = sum(silences)
    silence_ratio = total_silence / (len(y) / sr)
    score = 10.0
    if silence_ratio < 0.05:
        score -= 3
    elif silence_ratio > 0.20:
        score -= 2
    if avg_pause < 0.2:
        score -= 1
    elif avg_pause > 1.5:
        score -= 2
    if n_pauses < 10:
        score -= 2
    elif n_pauses > 50:
        score -= 1
    return round(max(0, score), 2), {
        "n_pauses": n_pauses,
        "avg_pause_s": round(avg_pause, 2),
        "silence_ratio": round(silence_ratio, 3),
    }


def score_energy_arc(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=4096, hop_length=2048)[0]
    n = len(rms)
    sections = {
        "opening": rms[: int(n * 0.15)],
        "recognition": rms[int(n * 0.15) : int(n * 0.30)],
        "thesis": rms[int(n * 0.30) : int(n * 0.50)],
        "demo_peak": rms[int(n * 0.50) : int(n * 0.75)],
        "resolution": rms[int(n * 0.75) :],
    }
    means = {k: float(np.mean(v)) for k, v in sections.items()}
    score = 10.0
    if means["opening"] >= means["demo_peak"]:
        score -= 2.0
    peak_section = max(means, key=means.get)
    if peak_section not in ("demo_peak", "thesis"):
        score -= 1.5
    if means["resolution"] >= means["demo_peak"]:
        score -= 1.5
    if means["recognition"] < means["opening"]:
        score -= 1.0
    if means["thesis"] < means["recognition"] * 0.9:
        score -= 0.5
    return round(max(0, score), 2), {k: round(v, 4) for k, v in means.items()}


def score_spectral_warmth(y, sr):
    spec = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    low_mask = freqs < 500
    mid_mask = (freqs >= 500) & (freqs < 2000)
    high_mask = freqs >= 2000
    low_energy = float(np.mean(spec[low_mask, :]))
    mid_energy = float(np.mean(spec[mid_mask, :]))
    high_energy = float(np.mean(spec[high_mask, :]))
    warmth_ratio = (low_energy + mid_energy) / (high_energy + 1e-10)
    if 3 <= warmth_ratio <= 8:
        score = 10.0
    elif warmth_ratio < 3:
        score = max(0, 10 - (3 - warmth_ratio) * 2)
    else:
        score = max(0, 10 - (warmth_ratio - 8) * 0.5)
    return round(float(score), 2), round(float(warmth_ratio), 2)


def score_consistency(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    cv = float(np.std(rms) / (np.mean(rms) + 1e-10))
    if 0.85 <= cv <= 1.05:
        score = 10.0
    elif cv < 0.85:
        score = max(0, 10 - (0.85 - cv) * 15)
    else:
        score = max(0, 10 - (cv - 1.05) * 10)
    return round(float(score), 2), round(float(cv), 3)


def score_clarity(y, sr):
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    mean_centroid = float(np.mean(centroid))
    if 1500 <= mean_centroid <= 3000:
        score = 10.0
    elif mean_centroid < 1500:
        score = max(0, 10 - (1500 - mean_centroid) / 200)
    else:
        score = max(0, 10 - (mean_centroid - 3000) / 300)
    return round(float(score), 2), round(float(mean_centroid), 0)


# ---------- Main ----------

def score_file(mp3_path, variation_id):
    """Score a single MP3 file and return result dict."""
    y, sr = librosa.load(str(mp3_path), sr=22050, mono=True)
    duration = float(len(y) / sr)

    pacing_s, wpm = score_pacing(duration)
    duration_s = score_duration_fit(duration)
    dynamic_s, dynamic_range = score_dynamic_range(y, sr)
    silence_s, silence_details = score_silence_quality(y, sr)
    energy_s, energy_sections = score_energy_arc(y, sr)
    warmth_s, warmth_ratio = score_spectral_warmth(y, sr)
    consistency_s, consistency_cv = score_consistency(y, sr)
    clarity_s, clarity_centroid = score_clarity(y, sr)

    scores = {
        "pacing": pacing_s,
        "duration_fit": duration_s,
        "dynamic_range": dynamic_s,
        "silence_quality": silence_s,
        "energy_arc": energy_s,
        "spectral_warmth": warmth_s,
        "consistency": consistency_s,
        "clarity": clarity_s,
    }

    composite = round(sum(scores[k] * WEIGHTS[k] for k in scores), 2)

    return {
        "variation_id": variation_id,
        "filename": os.path.basename(str(mp3_path)),
        "duration_seconds": round(duration, 2),
        "scores": scores,
        "composite_score": composite,
        "details": {
            "wpm": wpm,
            "dynamic_range_db": dynamic_range,
            "silence": silence_details,
            "energy_sections": energy_sections,
            "warmth_ratio": warmth_ratio,
            "consistency_cv": consistency_cv,
            "clarity_centroid_hz": clarity_centroid,
        },
    }


def main():
    # Find all MP3 files
    mp3_files = sorted(VOICEOVER_DIR.glob("tara-v7-*.mp3"))
    print(f"Found {len(mp3_files)} MP3 files in {VOICEOVER_DIR}")

    # Load existing scores
    existing = []
    existing_ids = set()
    if SCORES_PATH.exists():
        existing = json.loads(SCORES_PATH.read_text())
        existing_ids = {e["variation_id"] for e in existing}
        print(f"Loaded {len(existing)} existing scores from {SCORES_PATH.name}")

    # Determine which files need scoring
    to_score = []
    for mp3 in mp3_files:
        vid = mp3.stem.replace("tara-v7-", "")
        if vid not in existing_ids:
            to_score.append((mp3, vid))

    print(f"Need to score: {len(to_score)} files")

    # Score each unscored file
    new_results = []
    for i, (mp3, vid) in enumerate(to_score):
        print(f"  [{i+1}/{len(to_score)}] Scoring {vid}...", end=" ", flush=True)
        try:
            result = score_file(mp3, vid)
            new_results.append(result)
            print(f"composite={result['composite_score']:.2f}")
        except Exception as e:
            print(f"ERROR: {e}")

    # Merge existing + new
    all_results = existing + new_results
    print(f"\nTotal scored: {len(all_results)}")

    # Sort by composite score descending
    all_results.sort(key=lambda r: r["composite_score"], reverse=True)

    # Save updated scores
    SCORES_PATH.write_text(json.dumps(all_results, indent=2, cls=NumpyEncoder))
    print(f"Saved all scores to {SCORES_PATH.name}")

    # Print full leaderboard
    print("\n" + "=" * 110)
    print("FULL VOICEOVER LEADERBOARD — ALL 60 FILES")
    print("=" * 110)
    print(f"{'Rank':<6}{'Variation':<25}{'Composite':>10}{'Pacing':>9}{'DurFit':>9}{'DynRng':>9}"
          f"{'Silence':>9}{'Energy':>9}{'Warmth':>9}{'Consist':>9}{'Clarity':>9}{'WPM':>7}{'Dur(s)':>8}")
    print("-" * 110)

    for i, r in enumerate(all_results):
        s = r["scores"]
        wpm = r.get("details", {}).get("wpm", 0)
        dur = r.get("duration_seconds", 0)
        print(f"{i+1:<6}{r['variation_id']:<25}{r['composite_score']:>10.2f}"
              f"{s['pacing']:>9.2f}{s['duration_fit']:>9.2f}{s['dynamic_range']:>9.2f}"
              f"{s['silence_quality']:>9.2f}{s['energy_arc']:>9.2f}{s['spectral_warmth']:>9.2f}"
              f"{s['consistency']:>9.2f}{s['clarity']:>9.2f}{wpm:>7.1f}{dur:>8.1f}")

    print("=" * 110)

    # Top 10
    print("\n" + "=" * 80)
    print("TOP 10 LEADERBOARD")
    print("=" * 80)
    for i, r in enumerate(all_results[:10]):
        s = r["scores"]
        wpm = r.get("details", {}).get("wpm", 0)
        dur = r.get("duration_seconds", 0)
        print(f"  #{i+1:>2}  {r['variation_id']:<25} Composite: {r['composite_score']:.2f}/10  "
              f"({wpm:.0f} WPM, {dur:.1f}s)")
        print(f"       Pacing={s['pacing']:.1f} DurFit={s['duration_fit']:.1f} "
              f"DynRng={s['dynamic_range']:.1f} Silence={s['silence_quality']:.1f} "
              f"Energy={s['energy_arc']:.1f} Warmth={s['spectral_warmth']:.1f} "
              f"Consist={s['consistency']:.1f} Clarity={s['clarity']:.1f}")
    print("=" * 80)


if __name__ == "__main__":
    main()
