#!/usr/bin/env python3
# Origin: v9 — extracted to library on 2026-03-23
"""
Generate a ~100-second ambient/electronic background music track with a clear narrative arc.

Sections:
  0-23s   HOOK        — Tense, minimal, rhythmic ticking. Building curiosity.
  23-60s  COLLABORATION — Opens up. Melodic, ambient pads. Human warmth.
  60-80s  EXECUTION   — Energetic build. Driving rhythm, percussion, climax.
  80-95s  IDENTITY    — Emotional resolution. Melodic, hopeful, confident.
  95-100s FADE OUT    — Gentle fade.

Output: 44100 Hz, 16-bit stereo WAV
"""

import numpy as np
from scipy import signal
from scipy.io import wavfile
import os

# ── Constants ──────────────────────────────────────────────────────────────────
SR = 44100          # sample rate
DURATION = 102.0    # total duration in seconds
BPM = 110
BEAT = 60.0 / BPM   # seconds per beat

N = int(SR * DURATION)
t = np.linspace(0, DURATION, N, endpoint=False)

# Master output (stereo)
left = np.zeros(N, dtype=np.float64)
right = np.zeros(N, dtype=np.float64)


# ── Utility Functions ──────────────────────────────────────────────────────────

def note_freq(note: str) -> float:
    """Convert note name (e.g. 'C4', 'F#3') to frequency."""
    note_map = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    }
    if note[-1].isdigit():
        octave = int(note[-1])
        name = note[:-1]
    else:
        octave = 4
        name = note
    semitone = note_map[name] + (octave - 4) * 12
    return 440.0 * (2.0 ** ((semitone - 9) / 12.0))


def envelope(length: int, attack: float = 0.01, decay: float = 0.0,
             sustain: float = 1.0, release: float = 0.01) -> np.ndarray:
    """ADSR envelope."""
    env = np.ones(length)
    att_n = int(attack * SR)
    dec_n = int(decay * SR)
    rel_n = int(release * SR)

    if att_n > 0:
        env[:att_n] = np.linspace(0, 1, att_n)
    if dec_n > 0 and att_n + dec_n < length:
        env[att_n:att_n + dec_n] = np.linspace(1, sustain, dec_n)
    if att_n + dec_n < length - rel_n:
        env[att_n + dec_n:length - rel_n] = sustain
    if rel_n > 0:
        env[length - rel_n:] = np.linspace(sustain, 0, rel_n)
    return env


def sine(freq: float, dur: float, phase: float = 0.0) -> np.ndarray:
    """Generate a sine wave."""
    n = int(dur * SR)
    t_local = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t_local + phase)


def saw(freq: float, dur: float) -> np.ndarray:
    """Generate a bandlimited sawtooth wave (softer)."""
    n = int(dur * SR)
    t_local = np.arange(n) / SR
    wave = np.zeros(n)
    # Additive synthesis — first 12 harmonics for warmth
    for k in range(1, 13):
        if k * freq > SR / 2:
            break
        wave += ((-1) ** (k + 1)) * np.sin(2 * np.pi * k * freq * t_local) / k
    return wave * (2.0 / np.pi)


def noise_filtered(dur: float, low: float, high: float) -> np.ndarray:
    """Band-pass filtered white noise."""
    n = int(dur * SR)
    raw = np.random.randn(n) * 0.5
    nyq = SR / 2
    lo = max(low / nyq, 0.001)
    hi = min(high / nyq, 0.999)
    if lo >= hi:
        return raw * 0.01
    b, a = signal.butter(4, [lo, hi], btype='band')
    return signal.lfilter(b, a, raw)


def add_to_mix(buf_l: np.ndarray, buf_r: np.ndarray,
               wave: np.ndarray, start: float, vol: float = 1.0,
               pan: float = 0.5):
    """Mix a mono wave into stereo buffers at a given start time with panning."""
    idx = int(start * SR)
    end = min(idx + len(wave), len(buf_l))
    seg_len = end - idx
    if seg_len <= 0:
        return
    w = wave[:seg_len] * vol
    buf_l[idx:end] += w * (1.0 - pan)  # pan 0=left, 1=right
    buf_r[idx:end] += w * pan


def reverb_simple(wave: np.ndarray, decay: float = 0.3,
                  delay_ms: float = 40.0, taps: int = 6) -> np.ndarray:
    """Simple multi-tap delay reverb."""
    out = wave.copy()
    for i in range(1, taps + 1):
        delay_samples = int(delay_ms * i * SR / 1000.0)
        gain = decay ** i
        if delay_samples < len(wave):
            out[delay_samples:] += wave[:len(wave) - delay_samples] * gain
    return out


def lowpass(wave: np.ndarray, cutoff: float) -> np.ndarray:
    """Simple low-pass filter."""
    nyq = SR / 2
    c = min(cutoff / nyq, 0.99)
    if c <= 0.001:
        return wave * 0
    b, a = signal.butter(4, c, btype='low')
    return signal.lfilter(b, a, wave)


def section_gain(start_s: float, end_s: float) -> np.ndarray:
    """Create a gain envelope for a section with smooth edges."""
    n = int((end_s - start_s) * SR)
    env = np.ones(n)
    fade = int(0.5 * SR)  # 0.5s crossfade
    if fade > 0 and fade < n // 2:
        env[:fade] = np.linspace(0, 1, fade)
        env[-fade:] = np.linspace(1, 0, fade)
    return env


# ── Key & Chord Definitions ───────────────────────────────────────────────────
# Key: D minor (D, E, F, G, A, Bb, C)
# Provides a cinematic, slightly melancholic but resolved feel.

CHORDS = {
    'Dm':  ['D3', 'F3', 'A3'],
    'Am':  ['A2', 'C3', 'E3'],
    'Bb':  ['Bb2', 'D3', 'F3'],
    'C':   ['C3', 'E3', 'G3'],
    'F':   ['F2', 'A2', 'C3'],
    'Gm':  ['G2', 'Bb2', 'D3'],
    'Dm7': ['D3', 'F3', 'A3', 'C4'],
    'Bbmaj7': ['Bb2', 'D3', 'F3', 'A3'],
}

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1: HOOK (0-23s) — Tense, minimal, rhythmic ticking
# ══════════════════════════════════════════════════════════════════════════════
print("Generating Section 1: Hook (0-23s)...")

# 1a. Rhythmic tick/clock pulse
for beat_i in range(int(23 / BEAT)):
    t_start = beat_i * BEAT
    # Main tick — short, high-frequency click
    tick_dur = 0.02
    tick = sine(3200, tick_dur) * envelope(int(tick_dur * SR), 0.001, 0.005, 0.0, 0.01)
    vol = 0.12 + 0.03 * np.sin(beat_i * 0.3)  # subtle volume variation
    add_to_mix(left, right, tick, t_start, vol, 0.45)

    # Off-beat subtle ghost tick (every other beat)
    if beat_i % 2 == 1:
        ghost = sine(4500, 0.01) * envelope(int(0.01 * SR), 0.001, 0.003, 0.0, 0.005)
        add_to_mix(left, right, ghost, t_start + BEAT * 0.5, 0.04, 0.6)

# 1b. Low sub pulse — building tension
for i in range(int(23 / (BEAT * 4))):
    t_start = i * BEAT * 4
    pulse_dur = BEAT * 3.5
    sub = sine(note_freq('D1'), pulse_dur)
    sub *= envelope(int(pulse_dur * SR), 0.3, 0.5, 0.4, 1.0)
    sub = lowpass(sub, 120)
    # Slowly increase volume across section
    vol = 0.08 + 0.06 * (t_start / 23.0)
    add_to_mix(left, right, sub, t_start, vol, 0.5)

# 1c. Eerie high-frequency texture — filtered noise swells
for i in range(6):
    t_start = i * 3.8
    swell_dur = 3.0
    swell = noise_filtered(swell_dur, 2000, 8000)
    swell *= envelope(int(swell_dur * SR), 1.2, 0.3, 0.3, 1.5)
    swell = reverb_simple(swell, 0.25, 50)
    pan = 0.3 + 0.4 * np.sin(i * 1.2)
    add_to_mix(left, right, swell, t_start, 0.025, pan)

# 1d. Sparse dissonant tones — building unease
sparse_notes = [('F5', 2.0), ('A5', 5.5), ('C6', 9.0), ('E5', 13.0), ('Bb5', 17.0)]
for note_name, t_start in sparse_notes:
    freq = note_freq(note_name)
    dur = 2.5
    tone = sine(freq, dur) * 0.5 + sine(freq * 1.003, dur) * 0.5  # slight detune
    tone *= envelope(int(dur * SR), 0.8, 0.3, 0.3, 1.2)
    tone = reverb_simple(tone, 0.35, 60)
    add_to_mix(left, right, tone, t_start, 0.05, 0.3 + 0.4 * np.random.random())

# 1e. Building tension riser in last 5 seconds of hook
riser_start = 18.0
riser_dur = 5.0
riser_n = int(riser_dur * SR)
riser_t = np.arange(riser_n) / SR
# Sweep from 200Hz to 1500Hz
riser_freq = np.linspace(200, 1500, riser_n)
riser_phase = np.cumsum(2 * np.pi * riser_freq / SR)
riser = np.sin(riser_phase) * envelope(riser_n, 2.0, 0.5, 0.8, 0.5)
riser = lowpass(riser, 2000)
add_to_mix(left, right, riser, riser_start, 0.06, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2: COLLABORATION (23-60s) — Opens up. Melodic, warm, ambient pads
# ══════════════════════════════════════════════════════════════════════════════
print("Generating Section 2: Collaboration (23-60s)...")

# 2a. Warm pad chords — lush layered synthesis
chord_progression_collab = [
    ('Dm7', 23.0, 7.0),
    ('Bbmaj7', 30.0, 7.0),
    ('F', 37.0, 6.0),
    ('C', 43.0, 6.0),
    ('Dm7', 49.0, 5.5),
    ('Bbmaj7', 54.5, 5.5),
]

for chord_name, t_start, dur in chord_progression_collab:
    notes = CHORDS[chord_name]
    for j, n in enumerate(notes):
        freq = note_freq(n)
        # Layer 1: warm sine
        pad1 = sine(freq, dur)
        # Layer 2: slightly detuned sine for richness
        pad2 = sine(freq * 1.004, dur)
        # Layer 3: octave up, quieter
        pad3 = sine(freq * 2.0, dur) * 0.3
        # Layer 4: soft sawtooth for texture
        pad4 = saw(freq, dur) * 0.15
        pad4 = lowpass(pad4, 800 + 200 * j)

        combined = (pad1 + pad2 + pad3 + pad4) * 0.25
        combined *= envelope(int(dur * SR), 1.5, 0.5, 0.7, 2.0)
        combined = reverb_simple(combined, 0.3, 55, 8)

        pan = 0.3 + 0.1 * j  # spread across stereo
        vol = 0.10
        add_to_mix(left, right, combined, t_start, vol, pan)

# 2b. Gentle melodic motif — simple arpeggio-like pattern
melody_notes_collab = [
    ('A4', 24.0, 1.0), ('F4', 25.5, 0.8), ('D4', 27.0, 1.2),
    ('C4', 29.0, 0.6), ('D4', 30.0, 1.0),
    ('F4', 32.0, 0.8), ('A4', 33.5, 1.0), ('G4', 35.0, 1.5),
    ('F4', 37.5, 0.8), ('A4', 39.0, 1.2), ('C5', 41.0, 1.0),
    ('Bb4', 43.0, 1.5), ('A4', 45.0, 0.8), ('G4', 46.5, 1.0),
    ('F4', 48.5, 1.2), ('D4', 50.0, 1.5),
    ('A4', 52.0, 0.8), ('C5', 53.5, 1.0), ('D5', 55.5, 1.5),
    ('C5', 57.5, 0.8), ('A4', 58.5, 1.5),
]

for note_name, t_start, dur in melody_notes_collab:
    freq = note_freq(note_name)
    # Bell-like tone: sine + 3rd harmonic
    tone = sine(freq, dur) * 0.7 + sine(freq * 3.0, dur) * 0.08
    tone += sine(freq * 2.0, dur) * 0.15
    tone *= envelope(int(dur * SR), 0.05, 0.2, 0.5, 0.4)
    tone = reverb_simple(tone, 0.35, 45, 8)
    pan = 0.35 + 0.3 * np.sin(t_start * 0.5)
    add_to_mix(left, right, tone, t_start, 0.09, pan)

# 2c. Soft rhythmic pulse (continuation but softer, more musical)
for beat_i in range(int((60 - 23) / BEAT)):
    t_start = 23.0 + beat_i * BEAT
    # Gentle kick-like thump
    if beat_i % 4 == 0:
        kick_dur = 0.15
        kick = sine(55, kick_dur) * envelope(int(kick_dur * SR), 0.005, 0.05, 0.3, 0.08)
        kick = lowpass(kick, 150)
        add_to_mix(left, right, kick, t_start, 0.10, 0.5)

    # Hi-hat-like texture (every other beat)
    if beat_i % 2 == 0:
        hh_dur = 0.04
        hh = noise_filtered(hh_dur, 6000, 14000)
        hh *= envelope(int(hh_dur * SR), 0.002, 0.01, 0.0, 0.02)
        add_to_mix(left, right, hh, t_start, 0.03, 0.55)

# 2d. Warm ambient texture layer
amb_dur = 37.0
amb = noise_filtered(amb_dur, 200, 1200) * 0.3
amb += sine(note_freq('D2'), amb_dur) * 0.15
amb *= envelope(int(amb_dur * SR), 3.0, 2.0, 0.5, 4.0)
amb = reverb_simple(amb, 0.4, 70, 10)
amb = lowpass(amb, 800)
add_to_mix(left, right, amb, 23.0, 0.04, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3: EXECUTION (60-80s) — Energetic build, driving rhythm, climax
# ══════════════════════════════════════════════════════════════════════════════
print("Generating Section 3: Execution (60-80s)...")

# 3a. Driving four-on-the-floor kick pattern
for beat_i in range(int((80 - 60) / BEAT)):
    t_start = 60.0 + beat_i * BEAT
    # Punchy kick
    kick_dur = 0.18
    kick_n = int(kick_dur * SR)
    kick_t_local = np.arange(kick_n) / SR
    # Pitch-dropping sine (classic electronic kick)
    kick_freq = 150 * np.exp(-kick_t_local * 30) + 45
    kick_phase = np.cumsum(2 * np.pi * kick_freq / SR)
    kick = np.sin(kick_phase)
    kick *= envelope(kick_n, 0.002, 0.03, 0.4, 0.08)
    add_to_mix(left, right, kick, t_start, 0.18, 0.5)

    # Snare on beats 2 and 4
    if beat_i % 4 in [2, 3]:
        snare_dur = 0.08
        snare = noise_filtered(snare_dur, 1500, 8000) * 0.7
        snare += sine(200, snare_dur) * 0.3
        snare *= envelope(int(snare_dur * SR), 0.002, 0.02, 0.2, 0.04)
        vol = 0.08 + 0.04 * (beat_i / int(20 / BEAT))  # build volume
        add_to_mix(left, right, snare, t_start, vol, 0.5)

    # Hi-hats — 16th note feel
    for sub in range(4):
        hh_time = t_start + sub * BEAT * 0.25
        if hh_time >= 80.0:
            break
        hh_dur = 0.025
        hh = noise_filtered(hh_dur, 8000, 16000)
        hh *= envelope(int(hh_dur * SR), 0.001, 0.005, 0.0, 0.015)
        vol = 0.04 if sub % 2 == 0 else 0.02  # accented
        pan = 0.4 + 0.2 * (sub / 4.0)
        add_to_mix(left, right, hh, hh_time, vol, pan)

# 3b. Energetic bass line
bass_pattern = [
    ('D2', 60.0, 1.5), ('D2', 61.5, 0.5), ('F2', 62.0, 1.0),
    ('A2', 63.0, 0.5), ('G2', 63.5, 0.5), ('F2', 64.0, 1.5),
    ('D2', 65.5, 0.5), ('Bb1', 66.0, 1.5), ('C2', 67.5, 0.5),
    ('D2', 68.0, 1.5), ('D2', 69.5, 0.5), ('F2', 70.0, 1.0),
    ('A2', 71.0, 0.5), ('G2', 71.5, 0.5), ('F2', 72.0, 1.5),
    ('G2', 73.5, 0.5), ('A2', 74.0, 1.0), ('Bb2', 75.0, 1.0),
    ('A2', 76.0, 1.0), ('G2', 77.0, 1.0), ('F2', 78.0, 1.0),
    ('D2', 79.0, 1.0),
]

for note_name, t_start, dur in bass_pattern:
    freq = note_freq(note_name)
    bass = saw(freq, dur) * 0.6 + sine(freq, dur) * 0.4
    bass *= envelope(int(dur * SR), 0.01, 0.05, 0.7, 0.05)
    bass = lowpass(bass, 400)
    add_to_mix(left, right, bass, t_start, 0.14, 0.5)

# 3c. Power chords — full, bright pads
chord_progression_exec = [
    ('Dm', 60.0, 5.0),
    ('Bb', 65.0, 3.0),
    ('C', 68.0, 4.0),
    ('Dm', 72.0, 4.0),
    ('Bb', 76.0, 2.0),
    ('C', 78.0, 2.0),
]

for chord_name, t_start, dur in chord_progression_exec:
    notes = CHORDS[chord_name]
    for j, n in enumerate(notes):
        freq = note_freq(n)
        # Brighter, more present pads
        pad = saw(freq, dur) * 0.3 + sine(freq, dur) * 0.4
        pad += sine(freq * 2.0, dur) * 0.2 + sine(freq * 4.0, dur) * 0.05
        pad *= envelope(int(dur * SR), 0.3, 0.2, 0.8, 0.5)
        # Higher cutoff for brightness, increasing over section
        progress = (t_start - 60.0) / 20.0
        cutoff = 1200 + 2000 * progress
        pad = lowpass(pad, cutoff)
        pad = reverb_simple(pad, 0.25, 35, 6)
        pan = 0.25 + 0.15 * j
        add_to_mix(left, right, pad, t_start, 0.08, pan)

# 3d. Rising energy — sweep and intensity build
sweep_dur = 20.0
sweep_n = int(sweep_dur * SR)
sweep_freq = np.linspace(300, 4000, sweep_n)
sweep_phase = np.cumsum(2 * np.pi * sweep_freq / SR)
sweep = np.sin(sweep_phase) * 0.3
sweep += noise_filtered(sweep_dur, 500, 3000) * 0.15
sweep *= np.linspace(0, 1, sweep_n) ** 2  # exponential volume build
sweep *= envelope(sweep_n, 2.0, 1.0, 0.8, 1.0)
add_to_mix(left, right, sweep, 60.0, 0.05, 0.5)

# 3e. Melodic lead in execution section
lead_notes_exec = [
    ('D5', 61.0, 0.5), ('F5', 61.5, 0.5), ('A5', 62.0, 1.0),
    ('G5', 63.5, 0.5), ('F5', 64.0, 1.0),
    ('D5', 66.0, 0.5), ('F5', 66.5, 0.5), ('G5', 67.0, 0.5),
    ('A5', 67.5, 1.5),
    ('Bb5', 70.0, 0.5), ('A5', 70.5, 0.5), ('G5', 71.0, 0.5),
    ('F5', 71.5, 0.5), ('A5', 72.0, 1.5),
    ('D5', 74.0, 0.5), ('F5', 74.5, 0.5), ('G5', 75.0, 0.5),
    ('A5', 75.5, 0.5), ('Bb5', 76.0, 1.0),
    ('C6', 77.5, 0.5), ('D6', 78.0, 2.0),  # Climax note!
]

for note_name, t_start, dur in lead_notes_exec:
    freq = note_freq(note_name)
    lead = sine(freq, dur) * 0.5 + saw(freq, dur) * 0.2
    lead += sine(freq * 2.0, dur) * 0.15
    lead *= envelope(int(dur * SR), 0.02, 0.1, 0.6, 0.15)
    lead = reverb_simple(lead, 0.3, 40, 6)
    add_to_mix(left, right, lead, t_start, 0.08, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4: IDENTITY / RESOLVE (80-95s) — Emotional resolution, hopeful
# ══════════════════════════════════════════════════════════════════════════════
print("Generating Section 4: Identity / Resolve (80-95s)...")

# 4a. Resolved, warm pad chords — major-leaning resolutions
chord_progression_resolve = [
    ('F', 80.0, 5.0),
    ('C', 85.0, 5.0),
    ('Dm', 90.0, 3.0),
    ('Bb', 93.0, 4.0),   # extends into fade
]

for chord_name, t_start, dur in chord_progression_resolve:
    notes = CHORDS[chord_name]
    for j, n in enumerate(notes):
        freq = note_freq(n)
        pad = sine(freq, dur) * 0.5 + sine(freq * 1.003, dur) * 0.5
        pad += sine(freq * 2.0, dur) * 0.2
        pad += saw(freq, dur) * 0.08
        pad = lowpass(pad, 1500)
        pad *= envelope(int(dur * SR), 1.5, 0.5, 0.7, 2.5)
        pad = reverb_simple(pad, 0.35, 60, 10)
        pan = 0.3 + 0.12 * j
        add_to_mix(left, right, pad, t_start, 0.09, pan)

# 4b. Beautiful melodic resolution
melody_resolve = [
    ('A4', 80.5, 1.0), ('C5', 82.0, 1.5), ('D5', 84.0, 1.0),
    ('C5', 85.5, 0.8), ('A4', 86.5, 1.2), ('G4', 88.0, 1.5),
    ('F4', 90.0, 1.0), ('A4', 91.5, 1.5), ('D5', 93.0, 2.0),
]

for note_name, t_start, dur in melody_resolve:
    freq = note_freq(note_name)
    # Warm bell tone
    tone = sine(freq, dur) * 0.6
    tone += sine(freq * 2.0, dur) * 0.2
    tone += sine(freq * 3.0, dur) * 0.06
    tone += sine(freq * 1.002, dur) * 0.3  # chorus effect
    tone *= envelope(int(dur * SR), 0.05, 0.3, 0.5, 0.5)
    tone = reverb_simple(tone, 0.4, 55, 10)
    add_to_mix(left, right, tone, t_start, 0.10, 0.5)

# 4c. Gentle rhythm — half-time feel
for beat_i in range(int((95 - 80) / BEAT)):
    t_start = 80.0 + beat_i * BEAT
    if t_start >= 95.0:
        break
    # Soft kick every 2 beats
    if beat_i % 4 == 0:
        kick_dur = 0.12
        kick = sine(50, kick_dur) * envelope(int(kick_dur * SR), 0.005, 0.03, 0.2, 0.06)
        vol = 0.10 * (1.0 - (t_start - 80.0) / 20.0)  # gradually decrease
        add_to_mix(left, right, kick, t_start, vol, 0.5)

# 4d. Ambient wash
wash_dur = 17.0
wash = noise_filtered(wash_dur, 300, 2000) * 0.2
wash += sine(note_freq('D3'), wash_dur) * 0.1
wash *= envelope(int(wash_dur * SR), 3.0, 2.0, 0.4, 5.0)
wash = reverb_simple(wash, 0.45, 80, 12)
wash = lowpass(wash, 1200)
add_to_mix(left, right, wash, 80.0, 0.04, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5: FADE OUT (95-102s) — Gentle fade
# ══════════════════════════════════════════════════════════════════════════════
print("Generating Section 5: Fade out (95-102s)...")

# Apply global fade out from 95s to end
fade_start = int(95.0 * SR)
fade_end = N
fade_len = fade_end - fade_start
if fade_len > 0:
    fade_curve = np.linspace(1.0, 0.0, fade_len) ** 2  # quadratic fade
    left[fade_start:fade_end] *= fade_curve
    right[fade_start:fade_end] *= fade_curve

# Add a final resolving tone that fades with the track
final_dur = 7.0
final_tone = sine(note_freq('D4'), final_dur) * 0.4
final_tone += sine(note_freq('A3'), final_dur) * 0.3
final_tone += sine(note_freq('F3'), final_dur) * 0.2
final_tone *= envelope(int(final_dur * SR), 1.0, 1.0, 0.4, 4.0)
final_tone = reverb_simple(final_tone, 0.4, 70, 10)
add_to_mix(left, right, final_tone, 95.0, 0.06, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# POST-PROCESSING & EXPORT
# ══════════════════════════════════════════════════════════════════════════════
print("Post-processing...")

# Combine to stereo
stereo = np.column_stack([left, right])

# Gentle overall compression (soft clipping / tanh saturation)
# First normalize to prevent extreme peaks
peak = np.max(np.abs(stereo))
if peak > 0:
    stereo = stereo / peak  # normalize to -1..1

# Apply soft saturation for warmth
stereo = np.tanh(stereo * 1.3) / np.tanh(1.3)

# Apply gentle overall EQ — slight bass boost, slight presence cut
# Bass boost around 80-200Hz
bass_boost_signal = np.zeros_like(stereo)
for ch in range(2):
    b, a = signal.butter(2, [80 / (SR / 2), 200 / (SR / 2)], btype='band')
    bass_boost_signal[:, ch] = signal.lfilter(b, a, stereo[:, ch])
stereo += bass_boost_signal * 0.15

# Slight high-shelf cut above 12kHz for smoothness
for ch in range(2):
    b, a = signal.butter(2, 12000 / (SR / 2), btype='low')
    stereo[:, ch] = signal.lfilter(b, a, stereo[:, ch]) * 0.85 + stereo[:, ch] * 0.15

# Final normalization to -1 dB headroom
peak = np.max(np.abs(stereo))
if peak > 0:
    target = 10 ** (-1.0 / 20.0)  # -1 dB
    stereo = stereo * (target / peak)

# Convert to 16-bit PCM
stereo_16 = np.clip(stereo * 32767, -32768, 32767).astype(np.int16)

# Export
output_path = "/Users/sachinsharma/Developer/Official/curator-fork/curator/docs/plans/video-production/v9/remotion/public/music/background.wav"
wavfile.write(output_path, SR, stereo_16)
print(f"\nExported: {output_path}")
print(f"Duration: {DURATION:.1f} seconds")
print(f"Sample rate: {SR} Hz")
print(f"Channels: 2 (stereo)")
print(f"Bit depth: 16-bit")
print(f"File size: {os.path.getsize(output_path) / (1024 * 1024):.1f} MB")
print("\nDone!")
