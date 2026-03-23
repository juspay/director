#!/usr/bin/env python3
# Origin: v7 — extracted to library on 2026-03-23
"""
generate_sfx_v7.py — SFX synthesis for TARA v7.4 product video.

Three sound effects synthesized from scratch using numpy + scipy:
1. Plucked string (0:33) — Karplus-Strong, Ab sus4 -> Ab major resolution
2. Sub pulse (0:57) — Low sine sweep with envelope
3. Shimmer (2:28) — High harmonic sparkle with reverb tail

Usage:
    python generate_sfx_v7.py [--output-dir OUTPUT_DIR]
"""

import argparse
import os
import sys
import numpy as np

try:
    from scipy.signal import butter, lfilter, fftconvolve
    from scipy.io import wavfile
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy")
    sys.exit(1)

from music_config import SAMPLE_RATE, note


SR = SAMPLE_RATE


# --------------------------------------------------------------------------
# Utilities
# --------------------------------------------------------------------------

def midi_to_freq(midi_note: int) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def normalize(signal: np.ndarray, peak: float = 0.9) -> np.ndarray:
    mx = np.max(np.abs(signal))
    if mx > 0:
        signal = signal / mx * peak
    return signal


def apply_reverb(signal: np.ndarray, decay: float = 0.4, delays_ms: list = None) -> np.ndarray:
    """Simple multi-tap delay reverb."""
    if delays_ms is None:
        delays_ms = [23, 47, 71, 113, 163, 211, 293]
    output = signal.copy()
    for i, delay_ms in enumerate(delays_ms):
        delay_samples = int(delay_ms / 1000.0 * SR)
        gain = decay ** (i + 1) * 0.5
        delayed = np.zeros(len(signal) + delay_samples)
        delayed[delay_samples:delay_samples + len(signal)] = signal * gain
        output = np.pad(output, (0, max(0, len(delayed) - len(output))))
        delayed = np.pad(delayed, (0, max(0, len(output) - len(delayed))))
        output += delayed[:len(output)]
    return output


def lowpass(signal: np.ndarray, cutoff: float, order: int = 4) -> np.ndarray:
    nyq = SR / 2
    if cutoff >= nyq:
        return signal
    b, a = butter(order, cutoff / nyq, btype='low')
    return lfilter(b, a, signal)


def highpass(signal: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    nyq = SR / 2
    if cutoff >= nyq or len(signal) < order * 3 + 1:
        return signal
    b, a = butter(order, cutoff / nyq, btype='high')
    return lfilter(b, a, signal)


# --------------------------------------------------------------------------
# SFX 1: Plucked String (Karplus-Strong) — Ab sus4 -> Ab major
# --------------------------------------------------------------------------

def karplus_strong(freq: float, duration: float, decay: float = 0.996,
                   brightness: float = 0.5) -> np.ndarray:
    """Karplus-Strong plucked string synthesis."""
    n_samples = int(duration * SR)
    delay_length = int(SR / freq)
    if delay_length < 2:
        delay_length = 2

    # Initialize with filtered noise burst
    buf = np.random.uniform(-1, 1, delay_length)
    # Shape the initial excitation
    buf = buf * np.hanning(delay_length)

    output = np.zeros(n_samples)
    idx = 0

    for i in range(n_samples):
        output[i] = buf[idx]
        # Averaging filter with brightness control
        next_idx = (idx + 1) % delay_length
        new_val = brightness * buf[idx] + (1 - brightness) * buf[next_idx]
        buf[idx] = new_val * decay
        idx = next_idx

    return output


def generate_plucked_string(duration: float = 3.5) -> np.ndarray:
    """
    Plucked string SFX: Ab sus4 resolving to Ab major.
    Two-part: sus4 chord pluck (0.0-1.5s), then major resolve (1.0-3.5s, overlapping).
    """
    n_samples = int(duration * SR)
    output = np.zeros(n_samples)

    # Ab sus4 notes: Ab, Db, Eb
    sus4_notes = [note("Ab", 3), note("Db", 4), note("Eb", 4)]
    # Ab major notes: Ab, C, Eb
    major_notes = [note("Ab", 3), note("C", 4), note("Eb", 4)]

    # Part 1: Sus4 pluck
    for midi_n in sus4_notes:
        freq = midi_to_freq(midi_n)
        pluck = karplus_strong(freq, 2.0, decay=0.9985, brightness=0.45)
        # Fade out over 2s
        fade = np.exp(-np.arange(len(pluck)) / (0.8 * SR))
        pluck *= fade
        start = 0
        end = min(start + len(pluck), n_samples)
        output[start:end] += pluck[:end - start] * 0.4

    # Part 2: Major resolution (slight overlap for smooth transition)
    resolve_start = int(1.0 * SR)
    for midi_n in major_notes:
        freq = midi_to_freq(midi_n)
        pluck = karplus_strong(freq, 2.5, decay=0.9990, brightness=0.55)
        # Longer sustain for the resolved chord
        fade = np.exp(-np.arange(len(pluck)) / (1.2 * SR))
        pluck *= fade
        start = resolve_start
        end = min(start + len(pluck), n_samples)
        output[start:end] += pluck[:end - start] * 0.5

    # Add a touch of reverb
    output = apply_reverb(output, decay=0.35, delays_ms=[31, 67, 97, 137, 197])
    output = output[:n_samples]

    return normalize(output, 0.85)


# --------------------------------------------------------------------------
# SFX 2: Sub Pulse — Low sine sweep with envelope
# --------------------------------------------------------------------------

def generate_sub_pulse(duration: float = 2.0) -> np.ndarray:
    """
    Sub pulse SFX: a deep, gut-level sine sweep.
    Starts at ~60Hz, sweeps down to ~30Hz with a punchy envelope.
    """
    n_samples = int(duration * SR)
    t = np.arange(n_samples) / SR

    # Frequency sweep: 60Hz -> 30Hz exponential decay
    freq_start = 60.0
    freq_end = 30.0
    freq_curve = freq_start * np.exp(-t * np.log(freq_start / freq_end) / duration)

    # Phase integration for smooth sweep
    phase = np.cumsum(freq_curve / SR) * 2 * np.pi
    signal = np.sin(phase)

    # Add subtle second harmonic for presence
    signal += 0.2 * np.sin(phase * 2)

    # Punchy envelope: fast attack, medium sustain, smooth release
    attack_samples = int(0.02 * SR)
    sustain_end = int(0.6 * SR)
    env = np.zeros(n_samples)
    # Attack
    env[:attack_samples] = np.linspace(0, 1, attack_samples)
    # Sustain with slight decay
    env[attack_samples:sustain_end] = np.linspace(1, 0.7, sustain_end - attack_samples)
    # Release
    env[sustain_end:] = 0.7 * np.exp(-(t[sustain_end:] - t[sustain_end]) * 3)

    signal *= env

    # Low-pass to keep it purely sub
    signal = lowpass(signal, 120)

    # Add a subtle transient click at the start for definition
    click_len = int(0.005 * SR)
    click = np.random.randn(click_len) * np.exp(-np.arange(click_len) / (0.001 * SR))
    click = lowpass(click, 300)
    signal[:click_len] += click * 0.15

    return normalize(signal, 0.9)


# --------------------------------------------------------------------------
# SFX 3: Shimmer — High harmonic sparkle with reverb tail
# --------------------------------------------------------------------------

def generate_shimmer(duration: float = 4.0) -> np.ndarray:
    """
    Shimmer SFX: ethereal high-frequency sparkle.
    Multiple harmonics of Ab in the upper register with staggered entrances
    and a long reverb tail.
    """
    n_samples = int(duration * SR)
    t = np.arange(n_samples) / SR
    output = np.zeros(n_samples)

    # Ab harmonics in upper register
    base_freq = midi_to_freq(note("Ab", 5))  # Ab5
    harmonics = [
        (base_freq * 1.0,   1.0,  0.00),   # fundamental
        (base_freq * 2.0,   0.5,  0.08),   # octave, delayed
        (base_freq * 3.0,   0.3,  0.15),   # 12th
        (base_freq * 4.0,   0.2,  0.22),   # 2 octaves
        (base_freq * 5.0,   0.15, 0.30),   # major 3rd (2 oct up)
        (base_freq * 6.0,   0.1,  0.38),   # 5th (2 oct up)
        (base_freq * 1.5,   0.4,  0.05),   # perfect 5th
        (base_freq * 2.5,   0.25, 0.12),   # major 3rd (1 oct up)
    ]

    for freq, amplitude, delay_s in harmonics:
        if freq > SR / 2:
            continue
        delay_samples = int(delay_s * SR)
        remaining = n_samples - delay_samples
        if remaining <= 0:
            continue

        t_local = np.arange(remaining) / SR

        # Sine with slight vibrato
        vibrato = 0.3 * np.sin(2 * np.pi * 4.5 * t_local)  # 4.5 Hz vibrato
        sig = np.sin(2 * np.pi * freq * t_local + vibrato)

        # Bell-like envelope: fast attack, exponential decay
        atk = min(int(0.03 * SR), remaining)
        env = np.zeros(remaining)
        env[:atk] = np.linspace(0, 1, atk)
        env[atk:] = np.exp(-(t_local[atk:]) * 2.0)

        sig *= env * amplitude
        output[delay_samples:delay_samples + remaining] += sig

    # High-pass to keep it airy
    output = highpass(output, 2000)

    # Rich reverb for shimmer tail
    output = apply_reverb(
        output, decay=0.5,
        delays_ms=[17, 37, 59, 83, 109, 139, 173, 211, 251, 293, 347, 401]
    )
    output = output[:int((duration + 1.0) * SR)]  # allow reverb tail

    # Gentle fade in and long fade out
    fade_in = int(0.1 * SR)
    fade_out = int(2.0 * SR)
    if fade_in < len(output):
        output[:fade_in] *= np.linspace(0, 1, fade_in)
    if fade_out < len(output):
        output[-fade_out:] *= np.linspace(1, 0, fade_out)

    return normalize(output, 0.75)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate TARA v7.4 SFX")
    parser.add_argument("--output-dir", default=".", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("=== TARA v7.4 SFX Generator ===")
    print(f"Sample rate: {SR} Hz")
    print()

    # SFX 1: Plucked string
    print("[1/3] Generating plucked string (Ab sus4 -> Ab major)...")
    plucked = generate_plucked_string(duration=3.5)
    plucked_path = os.path.join(args.output_dir, "sfx_plucked_string.wav")
    plucked_16 = np.int16(plucked * 32767)
    wavfile.write(plucked_path, SR, plucked_16)
    print(f"      Saved: {plucked_path} ({len(plucked_16)/SR:.1f}s)")

    # SFX 2: Sub pulse
    print("[2/3] Generating sub pulse...")
    pulse = generate_sub_pulse(duration=2.0)
    pulse_path = os.path.join(args.output_dir, "sfx_sub_pulse.wav")
    pulse_16 = np.int16(pulse * 32767)
    wavfile.write(pulse_path, SR, pulse_16)
    print(f"      Saved: {pulse_path} ({len(pulse_16)/SR:.1f}s)")

    # SFX 3: Shimmer
    print("[3/3] Generating shimmer...")
    shimmer = generate_shimmer(duration=4.0)
    shimmer_path = os.path.join(args.output_dir, "sfx_shimmer.wav")
    shimmer_16 = np.int16(shimmer * 32767)
    wavfile.write(shimmer_path, SR, shimmer_16)
    print(f"      Saved: {shimmer_path} ({len(shimmer_16)/SR:.1f}s)")

    print()
    print("Done. All SFX ready for mixing.")


if __name__ == "__main__":
    main()
