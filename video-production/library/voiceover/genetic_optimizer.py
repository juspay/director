# Origin: v7 — extracted to library on 2026-03-23
"""
V7 Voiceover Iteration — Automated genetic/hill-climbing optimization.

Picks up from previous rounds (9 variations done), generates new batches
of 5, scores each, tracks cumulative results, and stops when the composite
score plateaus or the target iteration count is reached.

Usage:
    python iterate_voiceover_v7.py --rounds 10 --batch-size 5
    python iterate_voiceover_v7.py --rounds 10 --batch-size 5 --dry-run
    python iterate_voiceover_v7.py --rounds 10 --batch-size 5 --ssml
"""

import argparse
import asyncio
import copy
import json
import logging
import random
import sys
import time
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
import librosa
import numpy as np

# ---------------------------------------------------------------------------
# Config import
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).parent.parent.parent.resolve()))
from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "voiceover" / "v7"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CUMULATIVE_FILE = OUTPUT_DIR / "voiceover-iterations-v7.json"

# Parameter bounds
PARAM_BOUNDS = {
    "stability":       (0.30, 0.70),
    "similarity_boost": (0.65, 0.90),
    "style":           (0.20, 0.60),
}

# Scoring weights (same as score_voiceover_v7.py)
TARGET_DURATION = 160.0
TARGET_WPM = 118.0
WORD_COUNT = 296

WEIGHTS = {
    "pacing":           0.15,
    "duration_fit":     0.10,
    "dynamic_range":    0.15,
    "silence_quality":  0.10,
    "energy_arc":       0.20,
    "spectral_warmth":  0.10,
    "consistency":      0.10,
    "clarity":          0.10,
}

# ---------------------------------------------------------------------------
# Narration — plain text (used when SSML is disabled)
# ---------------------------------------------------------------------------
NARRATION_PLAIN = """Twelve tabs open. A review untouched since Tuesday. And somewhere underneath all of it — an idea that was clear this morning.

Half of them still open from yesterday. Context scattered across five tools. Nothing connected.

There was a time when the job was writing code. Then it became engineering — systems thinking, architecture, knowing why things break.

And carrying the weight when they do.

You earned that shift.

The next one is bigger. From engineer — to builder. Less time on the how. More time on the what and the why.

The friction isn't in your skill. It's between the decision and the done.

Tara closes that gap.

She lives in Slack — where your team already thinks. Drop in a screenshot, a question, a half-formed idea. Already reading.

In under a minute — she's searched across your repositories, cross-checked your JIRA history, found the root cause, and built a plan.

And now your team thinks together.

A PM scopes it tighter. An engineer challenges an assumption. A designer spots something nobody else caught. Each message sharpens the plan.

The judgment. The debate. The decisions only humans make. And when it's ready — it moves.

Three repos cloned. Your patterns studied. Three implementations running in parallel — and pull requests opening one after another, connecting back to the thread where it all started.

No one waited for anyone.

Tara reads whatever your team works with — code, documents, designs, configs. She connects to everything you already use. Everything through Slack.

Four hundred threads. Double the PR throughput. From a question to production — in minutes, not days.

You already know what to build next.

Engineers are builders now.

The implementation doesn't disappear. It just happens — right where the conversation started.

Tara. Build what matters."""

# ---------------------------------------------------------------------------
# Narration — SSML-enhanced version
# ---------------------------------------------------------------------------
NARRATION_SSML = """<speak>
Twelve tabs open. A review untouched since Tuesday. <break time="0.4s"/> And somewhere underneath all of it — an idea that was clear this morning.

<break time="0.6s"/>

Half of them still open from yesterday. Context scattered across five tools. <break time="0.3s"/> Nothing connected.

<break time="0.7s"/>

There was a time when the job was writing code. <break time="0.3s"/> Then it became engineering — systems thinking, architecture, knowing why things break.

<break time="0.5s"/>

And carrying the weight when they do.

<break time="0.4s"/>

You earned that shift.

<break time="0.6s"/>

<prosody rate="95%" pitch="+2%">The next one is bigger.</prosody> From engineer — to builder. Less time on the how. <break time="0.3s"/> <emphasis level="moderate">More time on the what and the why.</emphasis>

<break time="0.5s"/>

The friction isn't in your skill. <break time="0.3s"/> <emphasis level="strong">It's between the decision and the done.</emphasis>

<break time="0.6s"/>

<prosody rate="90%" pitch="+3%"><emphasis level="strong">Tara closes that gap.</emphasis></prosody>

<break time="0.8s"/>

She lives in Slack — where your team already thinks. Drop in a screenshot, a question, a half-formed idea. <break time="0.3s"/> Already reading.

<break time="0.5s"/>

<prosody rate="105%">In under a minute — she's searched across your repositories, cross-checked your JIRA history, found the root cause, and built a plan.</prosody>

<break time="0.6s"/>

And now your team thinks together.

<break time="0.5s"/>

A PM scopes it tighter. An engineer challenges an assumption. A designer spots something nobody else caught. <break time="0.3s"/> Each message sharpens the plan.

<break time="0.5s"/>

The judgment. The debate. <break time="0.3s"/> The decisions only humans make. <break time="0.3s"/> And when it's ready — it moves.

<break time="0.6s"/>

<prosody rate="105%">Three repos cloned. Your patterns studied. Three implementations running in parallel — and pull requests opening one after another, connecting back to the thread where it all started.</prosody>

<break time="0.5s"/>

<emphasis level="moderate">No one waited for anyone.</emphasis>

<break time="0.6s"/>

Tara reads whatever your team works with — code, documents, designs, configs. She connects to everything you already use. <break time="0.3s"/> Everything through Slack.

<break time="0.7s"/>

<prosody rate="95%">Four hundred threads. Double the PR throughput. From a question to production — in minutes, not days.</prosody>

<break time="0.6s"/>

You already know what to build next.

<break time="0.5s"/>

<prosody rate="90%" pitch="+2%"><emphasis level="strong">Engineers are builders now.</emphasis></prosody>

<break time="0.6s"/>

The implementation doesn't disappear. It just happens — right where the conversation started.

<break time="0.8s"/>

<prosody rate="85%"><emphasis level="strong">Tara. Build what matters.</emphasis></prosody>
</speak>"""


# ============================================================================
# Scoring functions (inlined from score_voiceover_v7.py)
# ============================================================================

def load_audio(path: str) -> tuple[np.ndarray, int]:
    y, sr = librosa.load(path, sr=22050, mono=True)
    return y, sr


def score_pacing(duration: float) -> tuple[float, float]:
    wpm = WORD_COUNT / (duration / 60.0)
    deviation = abs(wpm - TARGET_WPM) / TARGET_WPM
    score = max(0, 10 - deviation * 30)
    return round(score, 2), round(wpm, 1)


def score_duration_fit(duration: float) -> float:
    deviation = abs(duration - TARGET_DURATION) / TARGET_DURATION
    return round(max(0, 10 - deviation * 40), 2)


def score_dynamic_range(y: np.ndarray, sr: int) -> tuple[float, float]:
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


def score_silence_quality(y: np.ndarray, sr: int) -> tuple[float, dict]:
    intervals = librosa.effects.split(y, top_db=40)
    silences = []
    for i in range(len(intervals) - 1):
        gap = (intervals[i + 1][0] - intervals[i][1]) / sr
        if gap > 0.1:
            silences.append(gap)
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


def score_energy_arc(y: np.ndarray, sr: int) -> tuple[float, dict]:
    rms = librosa.feature.rms(y=y, frame_length=4096, hop_length=2048)[0]
    n = len(rms)
    sections = {
        "opening":     rms[: int(n * 0.15)],
        "recognition": rms[int(n * 0.15): int(n * 0.30)],
        "thesis":      rms[int(n * 0.30): int(n * 0.50)],
        "demo_peak":   rms[int(n * 0.50): int(n * 0.75)],
        "resolution":  rms[int(n * 0.75):],
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


def score_spectral_warmth(y: np.ndarray, sr: int) -> tuple[float, float]:
    spec = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    low_energy = np.mean(spec[freqs < 500, :])
    mid_energy = np.mean(spec[(freqs >= 500) & (freqs < 2000), :])
    high_energy = np.mean(spec[freqs >= 2000, :])
    warmth_ratio = (low_energy + mid_energy) / (high_energy + 1e-10)

    if 3 <= warmth_ratio <= 8:
        score = 10.0
    elif warmth_ratio < 3:
        score = max(0, 10 - (3 - warmth_ratio) * 2)
    else:
        score = max(0, 10 - (warmth_ratio - 8) * 0.5)
    return round(float(score), 2), round(float(warmth_ratio), 2)


def score_consistency(y: np.ndarray, sr: int) -> tuple[float, float]:
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    cv = float(np.std(rms) / (np.mean(rms) + 1e-10))
    if 0.85 <= cv <= 1.05:
        score = 10.0
    elif cv < 0.85:
        score = max(0, 10 - (0.85 - cv) * 15)
    else:
        score = max(0, 10 - (cv - 1.05) * 10)
    return round(float(score), 2), round(cv, 3)


def score_clarity(y: np.ndarray, sr: int) -> tuple[float, float]:
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    mean_centroid = float(np.mean(centroid))
    if 1500 <= mean_centroid <= 3000:
        score = 10.0
    elif mean_centroid < 1500:
        score = max(0, 10 - (1500 - mean_centroid) / 200)
    else:
        score = max(0, 10 - (mean_centroid - 3000) / 300)
    return round(float(score), 2), round(mean_centroid, 0)


def analyze_audio(audio_path: str, duration: float) -> dict:
    """Run all 8 scoring criteria on an audio file. Returns scores + details."""
    y, sr = load_audio(audio_path)

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
    composite = round(sum(scores[k] * WEIGHTS[k] for k in scores), 2)

    return {
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


# ============================================================================
# Numpy-safe JSON encoder
# ============================================================================

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


# ============================================================================
# Duration helper
# ============================================================================

def get_audio_duration(path: Path) -> float:
    try:
        from mutagen.mp3 import MP3
        return MP3(str(path)).info.length
    except ImportError:
        return path.stat().st_size / 16000.0


# ============================================================================
# Cumulative results tracking
# ============================================================================

def load_cumulative() -> dict:
    """Load or initialize the cumulative iteration tracker."""
    if CUMULATIVE_FILE.exists():
        return json.loads(CUMULATIVE_FILE.read_text())
    return {
        "created_at": datetime.now().isoformat(),
        "voice_id": ELEVENLABS_VOICE_ID,
        "model": ELEVENLABS_MODEL,
        "total_iterations": 0,
        "best_composite": 0.0,
        "best_variation_id": None,
        "rounds": [],
        "all_results": [],
    }


def save_cumulative(data: dict):
    CUMULATIVE_FILE.write_text(json.dumps(data, indent=2, cls=NumpyEncoder))


def seed_from_existing_scores(cumulative: dict) -> dict:
    """Import results from previous R1/R2 score files if cumulative is empty."""
    if cumulative["all_results"]:
        return cumulative

    score_files = sorted(OUTPUT_DIR.glob("voiceover-scores-v7*.json"))
    imported = []
    seen_ids = set()

    for sf in score_files:
        results = json.loads(sf.read_text())
        for r in results:
            vid = r["variation_id"]
            if vid not in seen_ids:
                seen_ids.add(vid)
                imported.append(r)

    if imported:
        cumulative["all_results"] = imported
        cumulative["total_iterations"] = len(imported)
        best = max(imported, key=lambda x: x["composite_score"])
        cumulative["best_composite"] = best["composite_score"]
        cumulative["best_variation_id"] = best["variation_id"]
        cumulative["rounds"].append({
            "round": 0,
            "label": "seed (R1+R2 import)",
            "imported_from": [str(sf) for sf in score_files],
            "count": len(imported),
            "best_composite": best["composite_score"],
            "timestamp": datetime.now().isoformat(),
        })
        save_cumulative(cumulative)
        logger.info(
            f"Seeded {len(imported)} results from previous rounds "
            f"(best: {best['variation_id']} @ {best['composite_score']:.2f})"
        )

    return cumulative


# ============================================================================
# Genetic / hill-climbing strategy
# ============================================================================

def clamp(val: float, lo: float, hi: float) -> float:
    return round(max(lo, min(hi, val)), 3)


def perturb(settings: dict, magnitude: float = 0.03) -> dict:
    """Apply small random perturbations to each tunable parameter."""
    new = dict(settings)
    for param, (lo, hi) in PARAM_BOUNDS.items():
        delta = random.uniform(-magnitude, magnitude)
        new[param] = clamp(settings[param] + delta, lo, hi)
    new["use_speaker_boost"] = True
    return new


def crossover(a: dict, b: dict) -> dict:
    """Cross-breed two settings dicts — pick each param from either parent."""
    new = {}
    for param in PARAM_BOUNDS:
        if random.random() < 0.5:
            new[param] = a[param]
        else:
            new[param] = b[param]
    # Optionally interpolate one param
    param = random.choice(list(PARAM_BOUNDS.keys()))
    lo, hi = PARAM_BOUNDS[param]
    alpha = random.uniform(0.3, 0.7)
    new[param] = clamp(a[param] * alpha + b[param] * (1 - alpha), lo, hi)
    new["use_speaker_boost"] = True
    return new


def random_settings() -> dict:
    """Generate fully random settings within bounds."""
    s = {}
    for param, (lo, hi) in PARAM_BOUNDS.items():
        s[param] = round(random.uniform(lo, hi), 3)
    s["use_speaker_boost"] = True
    return s


def generate_batch_settings(
    all_results: list[dict],
    batch_size: int,
    round_num: int,
) -> list[dict]:
    """
    Generate a batch of variation settings using genetic/hill-climbing.

    Strategy per batch of N:
    - 1 perturbation of #1 performer (small: +/-0.02)
    - 1 perturbation of #1 performer (medium: +/-0.05)
    - 1 crossover of top-2 performers
    - 1 perturbation of #2 or #3 performer
    - 1 random exploration

    Adjusts if batch_size differs from 5.
    """
    if not all_results:
        # Cold start — return a spread
        return [random_settings() for _ in range(batch_size)]

    # Sort by composite descending
    ranked = sorted(all_results, key=lambda x: x["composite_score"], reverse=True)
    top = [r["settings"] for r in ranked[:min(5, len(ranked))]]

    batch = []

    # Strategy slots
    strategies = []

    # Fine perturbation of #1
    strategies.append(("perturb_top1_fine", lambda: perturb(top[0], 0.02)))
    # Medium perturbation of #1
    strategies.append(("perturb_top1_med", lambda: perturb(top[0], 0.05)))

    # Crossover of top-2
    if len(top) >= 2:
        strategies.append(("crossover_1_2", lambda: crossover(top[0], top[1])))
    else:
        strategies.append(("perturb_top1_wide", lambda: perturb(top[0], 0.07)))

    # Perturbation of #2 or #3
    if len(top) >= 3:
        strategies.append(("perturb_top3", lambda: perturb(top[2], 0.04)))
    elif len(top) >= 2:
        strategies.append(("perturb_top2", lambda: perturb(top[1], 0.04)))
    else:
        strategies.append(("perturb_top1_alt", lambda: perturb(top[0], 0.06)))

    # Random exploration
    strategies.append(("random", lambda: random_settings()))

    # If batch_size > 5, add more crossovers and perturbations
    extra_needed = max(0, batch_size - len(strategies))
    for i in range(extra_needed):
        if len(top) >= 2:
            a_idx = random.randint(0, min(2, len(top) - 1))
            b_idx = random.randint(0, min(4, len(top) - 1))
            strategies.append((
                f"crossover_extra_{i}",
                lambda a=a_idx, b=b_idx: crossover(top[a], top[b]),
            ))
        else:
            strategies.append((
                f"random_extra_{i}",
                lambda: random_settings(),
            ))

    # Trim to batch_size
    strategies = strategies[:batch_size]

    for label, gen_fn in strategies:
        settings = gen_fn()
        batch.append({
            "settings": settings,
            "strategy": label,
        })

    return batch


# ============================================================================
# ElevenLabs API with retry + backoff
# ============================================================================

async def call_elevenlabs(
    text: str,
    settings: dict,
    output_path: Path,
    use_ssml: bool = False,
    max_retries: int = 5,
) -> None:
    """Call ElevenLabs TTS with exponential backoff on rate limits."""
    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": {
            "stability": settings["stability"],
            "similarity_boost": settings["similarity_boost"],
            "style": settings["style"],
            "use_speaker_boost": settings.get("use_speaker_boost", True),
        },
    }

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 429:
                    # Rate limited — exponential backoff
                    wait = min(2 ** attempt * 5, 120)  # 5, 10, 20, 40, 80s
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        wait = max(wait, int(retry_after))
                    logger.warning(
                        f"Rate limited (429). Waiting {wait}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
                output_path.write_bytes(response.content)
                return

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                wait = min(2 ** attempt * 5, 120)
                logger.warning(f"Rate limited. Waiting {wait}s...")
                await asyncio.sleep(wait)
                continue
            raise
        except httpx.TimeoutException:
            wait = min(2 ** attempt * 3, 60)
            logger.warning(f"Timeout. Retrying in {wait}s...")
            await asyncio.sleep(wait)
            continue

    raise RuntimeError(f"Failed after {max_retries} retries")


# ============================================================================
# Main iteration loop
# ============================================================================

async def generate_and_score_variation(
    var_id: str,
    settings: dict,
    strategy: str,
    narration_text: str,
    use_ssml: bool,
    dry_run: bool,
) -> Optional[dict]:
    """Generate one variation and score it. Returns full result dict."""
    output_path = OUTPUT_DIR / f"tara-v7-{var_id}.mp3"

    # Resume-safe: skip if file + score already exist
    if output_path.exists():
        logger.info(f"[{var_id}] Audio exists, scoring only")
    elif dry_run:
        logger.info(
            f"[{var_id}] DRY RUN — would generate with "
            f"stability={settings['stability']:.3f} "
            f"similarity={settings['similarity_boost']:.3f} "
            f"style={settings['style']:.3f} "
            f"(strategy: {strategy})"
        )
        return None
    else:
        logger.info(
            f"[{var_id}] Generating — "
            f"stability={settings['stability']:.3f} "
            f"similarity={settings['similarity_boost']:.3f} "
            f"style={settings['style']:.3f} "
            f"(strategy: {strategy})"
        )
        await call_elevenlabs(narration_text, settings, output_path, use_ssml)
        logger.info(f"[{var_id}] Audio saved ({output_path.stat().st_size / 1024:.0f} KB)")

    # Score
    duration = get_audio_duration(output_path)
    analysis = analyze_audio(str(output_path), duration)

    result = {
        "variation_id": var_id,
        "description": f"Auto-generated ({strategy})",
        "settings": settings,
        "strategy": strategy,
        "duration_seconds": duration,
        "audio_path": str(output_path),
        "generated_at": datetime.now().isoformat(),
        "use_ssml": use_ssml,
        **analysis,
    }

    logger.info(
        f"[{var_id}] Score: {result['composite_score']:.2f}/10 | "
        f"pacing={result['scores']['pacing']:.1f} "
        f"dur={result['scores']['duration_fit']:.1f} "
        f"dyn={result['scores']['dynamic_range']:.1f} "
        f"sil={result['scores']['silence_quality']:.1f} "
        f"energy={result['scores']['energy_arc']:.1f} "
        f"warm={result['scores']['spectral_warmth']:.1f} "
        f"cons={result['scores']['consistency']:.1f} "
        f"clar={result['scores']['clarity']:.1f}"
    )

    return result


def print_leaderboard(all_results: list[dict], top_n: int = 10):
    """Print a ranked leaderboard of all variations."""
    ranked = sorted(all_results, key=lambda x: x["composite_score"], reverse=True)
    top = ranked[:top_n]

    print()
    print("=" * 110)
    print(f"  LEADERBOARD — Top {min(top_n, len(top))} of {len(all_results)} iterations")
    print("=" * 110)
    print(
        f"  {'Rank':<5} {'Variation':<25} {'Composite':>9} "
        f"{'Stab':>6} {'Sim':>6} {'Style':>6} "
        f"{'Pace':>6} {'Dur':>5} {'Dyn':>5} {'Sil':>5} "
        f"{'Enrg':>5} {'Warm':>5} {'Cons':>5} {'Clar':>5}"
    )
    print("-" * 110)

    for i, r in enumerate(top, 1):
        s = r["scores"]
        st = r["settings"]
        marker = " *" if i <= 3 else ""
        print(
            f"  {i:<5} {r['variation_id']:<25} {r['composite_score']:>8.2f}{marker}"
            f" {st['stability']:>6.3f} {st['similarity_boost']:>6.3f} {st['style']:>6.3f}"
            f" {s['pacing']:>6.1f} {s['duration_fit']:>5.1f} {s['dynamic_range']:>5.1f}"
            f" {s['silence_quality']:>5.1f} {s['energy_arc']:>5.1f}"
            f" {s['spectral_warmth']:>5.1f} {s['consistency']:>5.1f} {s['clarity']:>5.1f}"
        )

    print("=" * 110)
    best = ranked[0]
    print(f"\n  BEST: {best['variation_id']} — {best['composite_score']:.2f}/10")
    print(
        f"  Settings: stability={best['settings']['stability']:.3f}, "
        f"similarity={best['settings']['similarity_boost']:.3f}, "
        f"style={best['settings']['style']:.3f}"
    )
    print()


def check_plateau(cumulative: dict, window: int = 3) -> bool:
    """
    Return True if composite score has plateaued:
    less than 0.01 improvement over the last `window` rounds.
    """
    rounds = cumulative["rounds"]
    # Need at least window+1 rounds (seed + window scored rounds)
    scored_rounds = [r for r in rounds if "best_composite" in r and r.get("label") != "seed (R1+R2 import)"]
    if len(scored_rounds) < window:
        return False

    recent = scored_rounds[-window:]
    best_scores = [r["best_composite"] for r in recent]

    improvement = max(best_scores) - min(best_scores)
    if improvement < 0.01:
        logger.info(
            f"Plateau detected: best scores over last {window} rounds = "
            f"{[f'{s:.2f}' for s in best_scores]} (improvement={improvement:.4f})"
        )
        return True
    return False


async def run_iteration(
    rounds: int,
    batch_size: int,
    use_ssml: bool,
    dry_run: bool,
    target_total: int = 50,
):
    """Main entry point — run multiple rounds of generate + score."""
    cumulative = load_cumulative()
    cumulative = seed_from_existing_scores(cumulative)

    existing_ids = {r["variation_id"] for r in cumulative["all_results"]}
    start_iteration = cumulative["total_iterations"]

    logger.info(f"Starting from iteration {start_iteration}, target {target_total}")
    logger.info(f"Rounds: {rounds}, batch size: {batch_size}, SSML: {use_ssml}")

    if start_iteration >= target_total:
        logger.info(f"Already at {start_iteration} iterations (target: {target_total}). Done.")
        print_leaderboard(cumulative["all_results"])
        return

    narration_text = NARRATION_SSML if use_ssml else NARRATION_PLAIN

    for round_idx in range(1, rounds + 1):
        current_total = cumulative["total_iterations"]
        if current_total >= target_total:
            logger.info(f"Reached target of {target_total} iterations. Stopping.")
            break

        # Check plateau
        if check_plateau(cumulative, window=3):
            logger.info("Score has plateaued. Stopping early.")
            break

        remaining = target_total - current_total
        actual_batch = min(batch_size, remaining)

        # Compute round label that won't collide with existing r1/r2 variations
        existing_round_nums = set()
        for rid in existing_ids:
            # Extract round number from IDs like "r2v1", "r3v2", etc.
            if rid.startswith("r") and "v" in rid:
                try:
                    rnum = int(rid.split("v")[0][1:])
                    existing_round_nums.add(rnum)
                except ValueError:
                    pass
        next_round_num = max(
            len(cumulative["rounds"]) + 1,
            (max(existing_round_nums) + 1) if existing_round_nums else 1,
        )
        round_label = f"r{next_round_num + round_idx - 1}"
        logger.info(f"\n{'='*60}")
        logger.info(f"ROUND {round_idx}/{rounds} — {round_label} — generating {actual_batch} variations")
        logger.info(f"{'='*60}")

        # Generate batch settings
        batch_specs = generate_batch_settings(
            cumulative["all_results"],
            actual_batch,
            round_idx,
        )

        round_results = []

        for i, spec in enumerate(batch_specs):
            var_id = f"{round_label}v{i + 1}"

            # Ensure unique ID
            while var_id in existing_ids:
                var_id += "_"

            result = await generate_and_score_variation(
                var_id=var_id,
                settings=spec["settings"],
                strategy=spec["strategy"],
                narration_text=narration_text,
                use_ssml=use_ssml,
                dry_run=dry_run,
            )

            if result is None:
                continue

            round_results.append(result)
            existing_ids.add(var_id)

            # Save after EACH variation (crash-safe)
            cumulative["all_results"].append(result)
            cumulative["total_iterations"] += 1

            if result["composite_score"] > cumulative["best_composite"]:
                cumulative["best_composite"] = result["composite_score"]
                cumulative["best_variation_id"] = result["variation_id"]
                logger.info(
                    f"  *** NEW BEST: {result['variation_id']} "
                    f"@ {result['composite_score']:.2f} ***"
                )

            save_cumulative(cumulative)

            # Brief pause between API calls to be kind to rate limits
            if not dry_run and i < len(batch_specs) - 1:
                await asyncio.sleep(2)

        # Round summary
        if round_results:
            round_best = max(round_results, key=lambda x: x["composite_score"])
            round_avg = sum(r["composite_score"] for r in round_results) / len(round_results)

            round_meta = {
                "round": len(cumulative["rounds"]) + 1,
                "label": round_label,
                "batch_size": len(round_results),
                "best_composite": round_best["composite_score"],
                "best_variation_id": round_best["variation_id"],
                "avg_composite": round(round_avg, 2),
                "use_ssml": use_ssml,
                "timestamp": datetime.now().isoformat(),
            }
            cumulative["rounds"].append(round_meta)
            save_cumulative(cumulative)

            logger.info(f"\nRound {round_label} complete:")
            logger.info(f"  Best this round: {round_best['variation_id']} @ {round_best['composite_score']:.2f}")
            logger.info(f"  Round average: {round_avg:.2f}")
            logger.info(f"  Overall best: {cumulative['best_variation_id']} @ {cumulative['best_composite']:.2f}")
            logger.info(f"  Total iterations: {cumulative['total_iterations']}")

        # Print leaderboard after each round
        print_leaderboard(cumulative["all_results"])

    # Final summary
    print("\n" + "=" * 60)
    print("  ITERATION COMPLETE")
    print("=" * 60)
    print(f"  Total iterations: {cumulative['total_iterations']}")
    print(f"  Overall best: {cumulative['best_variation_id']} @ {cumulative['best_composite']:.2f}/10")

    # Round-by-round improvement
    scored_rounds = [r for r in cumulative["rounds"] if "best_composite" in r]
    if len(scored_rounds) > 1:
        print("\n  Round-by-round improvement:")
        for r in scored_rounds:
            label = r.get("label", f"round {r.get('round', '?')}")
            print(f"    {label}: best={r['best_composite']:.2f}  avg={r.get('avg_composite', 'n/a')}")

    print()


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Automated voiceover iteration with genetic/hill-climbing optimization"
    )
    parser.add_argument(
        "--rounds", type=int, default=10,
        help="Number of rounds to run (default: 10)",
    )
    parser.add_argument(
        "--batch-size", type=int, default=5,
        help="Variations per round (default: 5)",
    )
    parser.add_argument(
        "--target", type=int, default=50,
        help="Stop at this many total iterations (default: 50)",
    )
    parser.add_argument(
        "--ssml", action="store_true",
        help="Use SSML-enhanced narration with pauses and emphasis",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be generated without calling ElevenLabs",
    )
    parser.add_argument(
        "--plateau-window", type=int, default=3,
        help="Stop if <0.01 improvement over this many rounds (default: 3)",
    )
    args = parser.parse_args()

    if not ELEVENLABS_API_KEY and not args.dry_run:
        logger.error("ELEVENLABS_API_KEY not set. Use --dry-run to test without API calls.")
        sys.exit(1)

    asyncio.run(run_iteration(
        rounds=args.rounds,
        batch_size=args.batch_size,
        use_ssml=args.ssml,
        dry_run=args.dry_run,
        target_total=args.target,
    ))


if __name__ == "__main__":
    main()
