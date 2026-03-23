#!/usr/bin/env python3
# Origin: v9 — extracted to library on 2026-03-23
"""
generate_sfx.py — Programmatic SFX generator for the Tara product video (v9).

Generates 5 WAV files used as UI accent sounds in the Remotion composition.
All output: 44100 Hz, 16-bit, mono WAV.

Usage:
    python3 generate_sfx.py

Output directory:
    ../remotion/public/sfx/
"""

import os
import struct
import numpy as np
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────

SAMPLE_RATE = 44100
BIT_DEPTH = 16
MAX_AMP = 32767  # max for 16-bit signed

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "remotion" / "public" / "sfx"


# ── WAV writer (no external deps) ───────────────────────────────────────────

def write_wav(filepath: Path, samples: np.ndarray, sample_rate: int = SAMPLE_RATE):
    """Write a mono 16-bit WAV file from a float64 numpy array in [-1, 1]."""
    # Clip and convert to int16
    clipped = np.clip(samples, -1.0, 1.0)
    int_samples = (clipped * MAX_AMP).astype(np.int16)

    num_samples = len(int_samples)
    data_size = num_samples * 2  # 2 bytes per sample (16-bit)
    file_size = 36 + data_size   # total file size minus 8 bytes for RIFF header

    with open(filepath, "wb") as f:
        # RIFF header
        f.write(b"RIFF")
        f.write(struct.pack("<I", file_size))
        f.write(b"WAVE")

        # fmt chunk
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))       # chunk size
        f.write(struct.pack("<H", 1))        # PCM format
        f.write(struct.pack("<H", 1))        # mono
        f.write(struct.pack("<I", sample_rate))
        f.write(struct.pack("<I", sample_rate * 2))  # byte rate
        f.write(struct.pack("<H", 2))        # block align
        f.write(struct.pack("<H", 16))       # bits per sample

        # data chunk
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(int_samples.tobytes())

    print(f"  -> {filepath.name}  ({num_samples / sample_rate:.3f}s, {os.path.getsize(filepath)} bytes)")


# ── Envelope helpers ─────────────────────────────────────────────────────────

def envelope_adsr(n: int, attack: int, decay: int, sustain_level: float, release: int) -> np.ndarray:
    """Simple ADSR envelope (all counts in samples)."""
    env = np.zeros(n)
    sustain_end = n - release
    for i in range(n):
        if i < attack:
            env[i] = i / attack
        elif i < attack + decay:
            env[i] = 1.0 - (1.0 - sustain_level) * ((i - attack) / decay)
        elif i < sustain_end:
            env[i] = sustain_level
        else:
            env[i] = sustain_level * (1.0 - (i - sustain_end) / release)
    return env


def exp_decay(n: int, decay_rate: float) -> np.ndarray:
    """Exponential decay from 1.0 to ~0."""
    t = np.arange(n) / SAMPLE_RATE
    return np.exp(-decay_rate * t)


# ── SFX Generators ──────────────────────────────────────────────────────────

def generate_slack_notification() -> np.ndarray:
    """
    slack_notification.wav (~0.3s)
    Subtle soft "pop" / "bloop". Short sine burst at 400Hz with overtone at 800Hz.
    Sharp attack, quick exponential decay.
    """
    duration = 0.3
    n = int(SAMPLE_RATE * duration)
    t = np.arange(n) / SAMPLE_RATE

    # Fundamental: 400Hz sine
    fundamental = np.sin(2 * np.pi * 400 * t) * 0.7
    # Overtone: 800Hz sine (quieter)
    overtone = np.sin(2 * np.pi * 800 * t) * 0.25
    # Slight pitch bend down for "bloop" feel
    bend = np.sin(2 * np.pi * (420 - 40 * t / duration) * t) * 0.15

    signal = fundamental + overtone + bend

    # Sharp attack (2ms), fast exponential decay
    attack_samples = int(0.002 * SAMPLE_RATE)
    env = exp_decay(n, 12.0)
    env[:attack_samples] *= np.linspace(0, 1, attack_samples)

    signal *= env

    # Normalize to ~0.6 peak (subtle accent)
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * 0.6

    return signal


def generate_keyboard_typing() -> np.ndarray:
    """
    keyboard_typing.wav (~2s)
    Series of short noise bursts with random timing, filtered to sound
    like soft mechanical keystrokes. ~6-8 clicks per second.
    """
    duration = 2.0
    n = int(SAMPLE_RATE * duration)
    signal = np.zeros(n)

    rng = np.random.default_rng(42)  # deterministic for reproducibility

    # Generate ~14 keystrokes over 2 seconds (7 per second)
    num_clicks = 14
    # Random timing with some jitter
    base_times = np.linspace(0.05, duration - 0.1, num_clicks)
    jitter = rng.uniform(-0.03, 0.03, num_clicks)
    click_times = np.clip(base_times + jitter, 0, duration - 0.05)

    for click_time in click_times:
        # Each click: 10-20ms burst of band-limited noise
        click_duration = rng.uniform(0.010, 0.020)
        click_samples = int(click_duration * SAMPLE_RATE)
        start_idx = int(click_time * SAMPLE_RATE)

        if start_idx + click_samples > n:
            click_samples = n - start_idx

        # Generate noise burst
        noise = rng.standard_normal(click_samples)

        # Simple bandpass effect: apply a short moving-average to cut highs,
        # then subtract a longer average to cut lows
        # This gives a mid-frequency "click" character (500-3000 Hz range feel)
        kernel_hi = int(SAMPLE_RATE / 6000)  # high-cut kernel
        kernel_lo = int(SAMPLE_RATE / 300)   # low-cut kernel
        if kernel_hi < 1:
            kernel_hi = 1

        # High cut (moving average)
        if kernel_hi > 1:
            noise = np.convolve(noise, np.ones(kernel_hi) / kernel_hi, mode="same")

        # Sharp attack + exponential decay envelope for each click
        click_env = np.ones(click_samples)
        attack_s = max(1, int(0.001 * SAMPLE_RATE))
        click_env[:attack_s] = np.linspace(0, 1, attack_s)
        decay_rate = rng.uniform(150, 250)
        click_env *= np.exp(-decay_rate * np.arange(click_samples) / SAMPLE_RATE)

        noise *= click_env

        # Random volume variation between clicks
        volume = rng.uniform(0.3, 0.7)
        noise *= volume

        end_idx = start_idx + click_samples
        signal[start_idx:end_idx] += noise[:end_idx - start_idx]

    # Normalize to ~0.5 peak
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * 0.5

    return signal


def generate_ui_swoosh() -> np.ndarray:
    """
    ui_swoosh.wav (~0.4s)
    Filtered white noise with frequency sweep (high to low).
    Fast attack, medium decay. "Whoosh" for sliding UI elements.
    """
    duration = 0.4
    n = int(SAMPLE_RATE * duration)
    t = np.arange(n) / SAMPLE_RATE

    rng = np.random.default_rng(123)
    noise = rng.standard_normal(n)

    # Frequency sweep: simulate by modulating moving-average kernel width
    # Wider kernel = lower frequency content
    # Sweep from narrow (high freq) to wide (low freq)
    output = np.zeros(n)
    for i in range(n):
        progress = i / n
        # Kernel width sweeps from 2 (high freq) to 30 (low freq)
        kernel_width = int(2 + 28 * progress)
        half_k = kernel_width // 2
        lo = max(0, i - half_k)
        hi = min(n, i + half_k + 1)
        output[i] = np.mean(noise[lo:hi])

    # Envelope: quick attack (5ms), hold briefly, then decay
    env = np.ones(n)
    attack_s = int(0.005 * SAMPLE_RATE)
    env[:attack_s] = np.linspace(0, 1, attack_s)
    # Decay starting at 20% through
    decay_start = int(0.08 * SAMPLE_RATE)
    decay_len = n - decay_start
    if decay_len > 0:
        env[decay_start:] *= np.exp(-6.0 * np.arange(decay_len) / decay_len)

    output *= env

    # Normalize to ~0.55
    peak = np.max(np.abs(output))
    if peak > 0:
        output = output / peak * 0.55

    return output


def generate_check_complete() -> np.ndarray:
    """
    check_complete.wav (~0.3s)
    Two quick ascending tones: C5 (~523Hz) and E5 (~659Hz).
    Short sustain, gentle decay. Satisfying completion "ding".
    """
    duration = 0.3
    n = int(SAMPLE_RATE * duration)
    t = np.arange(n) / SAMPLE_RATE

    # Tone 1: C5 (523.25 Hz), starts at t=0
    tone1_freq = 523.25
    tone1_dur = 0.15
    tone1_n = int(tone1_dur * SAMPLE_RATE)
    tone1 = np.zeros(n)
    t1 = np.arange(tone1_n) / SAMPLE_RATE
    tone1[:tone1_n] = np.sin(2 * np.pi * tone1_freq * t1) * 0.6
    # Add gentle overtone for richness
    tone1[:tone1_n] += np.sin(2 * np.pi * tone1_freq * 2 * t1) * 0.1
    # Envelope: 2ms attack, exponential decay
    tone1_env = np.zeros(n)
    attack1 = int(0.002 * SAMPLE_RATE)
    tone1_env[:attack1] = np.linspace(0, 1, attack1)
    tone1_env[attack1:tone1_n] = np.exp(-8.0 * np.arange(tone1_n - attack1) / SAMPLE_RATE)
    tone1 *= tone1_env

    # Tone 2: E5 (659.25 Hz), starts at t=0.06s (slight overlap)
    tone2_freq = 659.25
    tone2_start = int(0.06 * SAMPLE_RATE)
    tone2_dur = 0.2
    tone2_n = min(int(tone2_dur * SAMPLE_RATE), n - tone2_start)
    tone2 = np.zeros(n)
    t2 = np.arange(tone2_n) / SAMPLE_RATE
    tone2[tone2_start:tone2_start + tone2_n] = np.sin(2 * np.pi * tone2_freq * t2) * 0.65
    tone2[tone2_start:tone2_start + tone2_n] += np.sin(2 * np.pi * tone2_freq * 2 * t2) * 0.1
    # Envelope
    tone2_env = np.zeros(n)
    attack2 = int(0.002 * SAMPLE_RATE)
    tone2_env[tone2_start:tone2_start + attack2] = np.linspace(0, 1, attack2)
    remaining = tone2_n - attack2
    if remaining > 0:
        tone2_env[tone2_start + attack2:tone2_start + tone2_n] = np.exp(-6.0 * np.arange(remaining) / SAMPLE_RATE)
    tone2 *= tone2_env

    signal = tone1 + tone2

    # Normalize to ~0.6
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * 0.6

    return signal


def generate_pr_created() -> np.ndarray:
    """
    pr_created.wav (~0.5s)
    Three ascending tones: C5, E5, G5 (~523, ~659, ~784 Hz).
    Played in quick succession with a slight reverb tail.
    More substantial "confirmation stamp" sound.
    """
    duration = 0.5
    n = int(SAMPLE_RATE * duration)
    signal = np.zeros(n)

    freqs = [523.25, 659.25, 783.99]  # C5, E5, G5
    start_times = [0.0, 0.07, 0.14]    # staggered starts
    tone_duration = 0.25

    for freq, start_t in zip(freqs, start_times):
        start_idx = int(start_t * SAMPLE_RATE)
        tone_n = min(int(tone_duration * SAMPLE_RATE), n - start_idx)
        if tone_n <= 0:
            continue

        t = np.arange(tone_n) / SAMPLE_RATE
        tone = np.sin(2 * np.pi * freq * t) * 0.5
        # Subtle overtones for warmth
        tone += np.sin(2 * np.pi * freq * 2 * t) * 0.08
        tone += np.sin(2 * np.pi * freq * 3 * t) * 0.03

        # Envelope: 2ms attack, exponential decay
        tone_env = np.ones(tone_n)
        attack = int(0.002 * SAMPLE_RATE)
        tone_env[:attack] = np.linspace(0, 1, attack)
        tone_env *= np.exp(-5.0 * np.arange(tone_n) / SAMPLE_RATE)

        tone *= tone_env
        signal[start_idx:start_idx + tone_n] += tone

    # Simple reverb tail: add a quieter, delayed copy of the signal
    delay_samples = int(0.03 * SAMPLE_RATE)  # 30ms delay
    reverb = np.zeros(n)
    if delay_samples < n:
        end = min(n, n - delay_samples)
        reverb[delay_samples:delay_samples + end] = signal[:end] * 0.2
    # Second reflection
    delay2 = int(0.06 * SAMPLE_RATE)
    if delay2 < n:
        end2 = min(n, n - delay2)
        reverb[delay2:delay2 + end2] += signal[:end2] * 0.08

    signal += reverb

    # Normalize to ~0.6
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * 0.6

    return signal


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating SFX to: {OUTPUT_DIR}\n")

    sfx = [
        ("slack_notification.wav", generate_slack_notification),
        ("keyboard_typing.wav",   generate_keyboard_typing),
        ("ui_swoosh.wav",         generate_ui_swoosh),
        ("check_complete.wav",    generate_check_complete),
        ("pr_created.wav",        generate_pr_created),
    ]

    for filename, gen_fn in sfx:
        samples = gen_fn()
        write_wav(OUTPUT_DIR / filename, samples)

    print(f"\nDone! {len(sfx)} files generated.")


if __name__ == "__main__":
    main()
