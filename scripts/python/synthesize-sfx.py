#!/usr/bin/env python3
"""
synthesize-sfx.py — Self-contained SFX generation for Director pipeline.

Generates three sound effects using Karplus-Strong and additive synthesis:
1. Plucked string — Ab sus4 -> Ab major resolution
2. Sub pulse — Low sine sweep with envelope
3. Shimmer — High harmonic sparkle with reverb tail

CLI:
    python synthesize-sfx.py --output-dir PATH

Called from TypeScript via python-bridge.ts.
"""

import argparse
import os
import sys
import numpy as np

try:
    from scipy.signal import butter, lfilter
    from scipy.io import wavfile
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy", file=sys.stderr)
    sys.exit(1)


# ==========================================================================
# Inlined constants (self-contained, no cross-module imports)
# ==========================================================================

SAMPLE_RATE = 44100
SR = SAMPLE_RATE

AB_MAJOR_SCALE = {
    "Ab": 56, "Bb": 58, "C": 60, "Db": 61,
    "Eb": 63, "F": 65, "G": 67,
}


def note(name: str, octave: int = 3) -> int:
    """Return MIDI note number for a named note at a given octave."""
    base = AB_MAJOR_SCALE[name]
    return base + (octave - 3) * 12


def midi_to_freq(midi_note: int) -> float:
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


# ==========================================================================
# Utilities
# ==========================================================================

def normalize(signal: np.ndarray, peak: float = 0.9) -> np.ndarray:
    """Normalize signal to target peak amplitude."""
    mx = np.max(np.abs(signal))
    if mx > 0:
        signal = signal / mx * peak
    return signal


def apply_reverb(signal: np.ndarray, decay: float = 0.4,
                 delays_ms: list = None) -> np.ndarray:
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
    """Butterworth low-pass filter."""
    nyq = SR / 2
    if cutoff >= nyq:
        return signal
    b, a = butter(order, cutoff / nyq, btype='low')
    return lfilter(b, a, signal)


def highpass(signal: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    """Butterworth high-pass filter."""
    nyq = SR / 2
    if cutoff >= nyq or len(signal) < order * 3 + 1:
        return signal
    b, a = butter(order, cutoff / nyq, btype='high')
    return lfilter(b, a, signal)


# ==========================================================================
# SFX 1: Plucked String (Karplus-Strong)
# ==========================================================================

def karplus_strong(freq: float, duration: float, decay: float = 0.996,
                   brightness: float = 0.5) -> np.ndarray:
    """Karplus-Strong plucked string synthesis."""
    n_samples = int(duration * SR)
    delay_length = int(SR / freq)
    if delay_length < 2:
        delay_length = 2

    buf = np.random.uniform(-1, 1, delay_length)
    buf = buf * np.hanning(delay_length)

    output = np.zeros(n_samples)
    idx = 0

    for i in range(n_samples):
        output[i] = buf[idx]
        next_idx = (idx + 1) % delay_length
        new_val = brightness * buf[idx] + (1 - brightness) * buf[next_idx]
        buf[idx] = new_val * decay
        idx = next_idx

    return output


def generate_plucked_string(duration: float = 3.5) -> np.ndarray:
    """
    Plucked string SFX: Ab sus4 resolving to Ab major.
    Two-part: sus4 chord pluck, then major resolve with overlap.
    """
    n_samples = int(duration * SR)
    output = np.zeros(n_samples)

    sus4_notes = [note("Ab", 3), note("Db", 4), note("Eb", 4)]
    major_notes = [note("Ab", 3), note("C", 4), note("Eb", 4)]

    # Part 1: Sus4 pluck
    for midi_n in sus4_notes:
        freq = midi_to_freq(midi_n)
        pluck = karplus_strong(freq, 2.0, decay=0.9985, brightness=0.45)
        fade = np.exp(-np.arange(len(pluck)) / (0.8 * SR))
        pluck *= fade
        end = min(len(pluck), n_samples)
        output[:end] += pluck[:end] * 0.4

    # Part 2: Major resolution (overlapping at 1.0s)
    resolve_start = int(1.0 * SR)
    for midi_n in major_notes:
        freq = midi_to_freq(midi_n)
        pluck = karplus_strong(freq, 2.5, decay=0.9990, brightness=0.55)
        fade = np.exp(-np.arange(len(pluck)) / (1.2 * SR))
        pluck *= fade
        start = resolve_start
        end = min(start + len(pluck), n_samples)
        output[start:end] += pluck[:end - start] * 0.5

    # Reverb
    output = apply_reverb(output, decay=0.35, delays_ms=[31, 67, 97, 137, 197])
    output = output[:n_samples]

    return normalize(output, 0.85)


# ==========================================================================
# SFX 2: Sub Pulse
# ==========================================================================

def generate_sub_pulse(duration: float = 2.0) -> np.ndarray:
    """
    Sub pulse SFX: deep sine sweep 60Hz -> 30Hz with punchy envelope.
    """
    n_samples = int(duration * SR)
    t = np.arange(n_samples) / SR

    freq_start = 60.0
    freq_end = 30.0
    freq_curve = freq_start * np.exp(-t * np.log(freq_start / freq_end) / duration)

    phase = np.cumsum(freq_curve / SR) * 2 * np.pi
    signal = np.sin(phase)
    signal += 0.2 * np.sin(phase * 2)

    # Envelope: fast attack, medium sustain, smooth release
    attack_samples = int(0.02 * SR)
    sustain_end = int(0.6 * SR)
    env = np.zeros(n_samples)
    env[:attack_samples] = np.linspace(0, 1, attack_samples)
    env[attack_samples:sustain_end] = np.linspace(1, 0.7, sustain_end - attack_samples)
    env[sustain_end:] = 0.7 * np.exp(-(t[sustain_end:] - t[sustain_end]) * 3)

    signal *= env
    signal = lowpass(signal, 120)

    # Transient click for definition
    click_len = int(0.005 * SR)
    click = np.random.randn(click_len) * np.exp(-np.arange(click_len) / (0.001 * SR))
    click = lowpass(click, 300)
    signal[:click_len] += click * 0.15

    return normalize(signal, 0.9)


# ==========================================================================
# SFX 3: Shimmer
# ==========================================================================

def generate_shimmer(duration: float = 4.0) -> np.ndarray:
    """
    Shimmer SFX: ethereal high-frequency sparkle with staggered harmonics
    and a long reverb tail.
    """
    n_samples = int(duration * SR)
    t = np.arange(n_samples) / SR
    output = np.zeros(n_samples)

    base_freq = midi_to_freq(note("Ab", 5))
    harmonics = [
        (base_freq * 1.0,   1.0,  0.00),
        (base_freq * 2.0,   0.5,  0.08),
        (base_freq * 3.0,   0.3,  0.15),
        (base_freq * 4.0,   0.2,  0.22),
        (base_freq * 5.0,   0.15, 0.30),
        (base_freq * 6.0,   0.1,  0.38),
        (base_freq * 1.5,   0.4,  0.05),
        (base_freq * 2.5,   0.25, 0.12),
    ]

    for freq, amplitude, delay_s in harmonics:
        if freq > SR / 2:
            continue
        delay_samples = int(delay_s * SR)
        remaining = n_samples - delay_samples
        if remaining <= 0:
            continue

        t_local = np.arange(remaining) / SR

        vibrato = 0.3 * np.sin(2 * np.pi * 4.5 * t_local)
        sig = np.sin(2 * np.pi * freq * t_local + vibrato)

        atk = min(int(0.03 * SR), remaining)
        env = np.zeros(remaining)
        env[:atk] = np.linspace(0, 1, atk)
        env[atk:] = np.exp(-(t_local[atk:]) * 2.0)

        sig *= env * amplitude
        output[delay_samples:delay_samples + remaining] += sig

    output = highpass(output, 2000)

    output = apply_reverb(
        output, decay=0.5,
        delays_ms=[17, 37, 59, 83, 109, 139, 173, 211, 251, 293, 347, 401]
    )
    output = output[:int((duration + 1.0) * SR)]

    fade_in = int(0.1 * SR)
    fade_out = int(2.0 * SR)
    if fade_in < len(output):
        output[:fade_in] *= np.linspace(0, 1, fade_in)
    if fade_out < len(output):
        output[-fade_out:] *= np.linspace(1, 0, fade_out)

    return normalize(output, 0.75)


# ==========================================================================
# Main
# ==========================================================================

def main():
    parser = argparse.ArgumentParser(description="Generate SFX WAV files")
    parser.add_argument("--output-dir", required=True, help="Output directory for SFX WAVs")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print(f"[sfx] Generating SFX to {args.output_dir}", file=sys.stderr)

    # SFX 1: Plucked string
    print("[sfx] 1/3 Plucked string (Ab sus4 -> Ab major)...", file=sys.stderr)
    plucked = generate_plucked_string(duration=3.5)
    plucked_path = os.path.join(args.output_dir, "sfx_plucked_string.wav")
    wavfile.write(plucked_path, SR, np.int16(plucked * 32767))
    print(f"[sfx]   Saved: {plucked_path} ({len(plucked)/SR:.1f}s)", file=sys.stderr)

    # SFX 2: Sub pulse
    print("[sfx] 2/3 Sub pulse...", file=sys.stderr)
    pulse = generate_sub_pulse(duration=2.0)
    pulse_path = os.path.join(args.output_dir, "sfx_sub_pulse.wav")
    wavfile.write(pulse_path, SR, np.int16(pulse * 32767))
    print(f"[sfx]   Saved: {pulse_path} ({len(pulse)/SR:.1f}s)", file=sys.stderr)

    # SFX 3: Shimmer
    print("[sfx] 3/3 Shimmer...", file=sys.stderr)
    shimmer = generate_shimmer(duration=4.0)
    shimmer_path = os.path.join(args.output_dir, "sfx_shimmer.wav")
    wavfile.write(shimmer_path, SR, np.int16(shimmer * 32767))
    print(f"[sfx]   Saved: {shimmer_path} ({len(shimmer)/SR:.1f}s)", file=sys.stderr)

    print("[sfx] Done. All SFX ready.", file=sys.stderr)


if __name__ == "__main__":
    main()
