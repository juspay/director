#!/usr/bin/env python3
"""
synthesize-music.py — Self-contained music synthesis for Director pipeline.

Generates a continuous track in Ab major with variable BPM (72-88).
Outputs a rendered WAV using pretty_midi + numpy synthesis.

Instruments: analog synth pad, bass, hi-hat, melody, percussion.

CLI:
    python synthesize-music.py --output PATH [--config PATH]

Called from TypeScript via python-bridge.ts.
"""

import argparse
import json
import math
import os
import sys
import numpy as np
from typing import List, Tuple

try:
    import pretty_midi
except ImportError:
    print("ERROR: pretty_midi not installed. Run: pip install pretty_midi", file=sys.stderr)
    sys.exit(1)

try:
    from scipy.signal import butter, lfilter
    from scipy.io import wavfile
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy", file=sys.stderr)
    sys.exit(1)


# ==========================================================================
# Inlined config constants (from music_config.py — self-contained)
# ==========================================================================

SAMPLE_RATE = 44100

AB_MAJOR_SCALE = {
    "Ab": 56, "Bb": 58, "C": 60, "Db": 61,
    "Eb": 63, "F": 65, "G": 67,
}


def note(name: str, octave: int = 3) -> int:
    """Return MIDI note number for a named note at a given octave."""
    base = AB_MAJOR_SCALE[name]
    return base + (octave - 3) * 12


# Chord definitions (wide voicings for pad)
CHORDS = {
    "Ab":       [note("Ab"), note("C"),  note("Eb")],
    "Bbm":      [note("Bb"), note("Db"), note("F")],
    "Cm":       [note("C"),  note("Eb"), note("G")],
    "Db":       [note("Db"), note("F"),  note("Ab", 4)],
    "Eb":       [note("Eb"), note("G"),  note("Bb")],
    "Fm":       [note("F"),  note("Ab", 4), note("C", 4)],
    "Absus4":   [note("Ab"), note("Db"), note("Eb")],
    "Ab_wide":  [note("Ab", 2), note("Eb"), note("C", 4), note("Ab", 4)],
    "Db_wide":  [note("Db", 2), note("Ab"), note("F", 4), note("Db", 4)],
    "Eb_wide":  [note("Eb", 2), note("Bb"), note("G", 4), note("Eb", 4)],
    "Fm_wide":  [note("F", 2),  note("C"),  note("Ab", 4), note("F", 4)],
    "Bbm_wide": [note("Bb", 2), note("F"),  note("Db", 4), note("Bb", 4)],
}

# BPM timeline: (start_s, end_s, bpm_start, bpm_end)
BPM_MAP = [
    (0.0,    8.0,   72, 72),
    (8.0,   15.0,   72, 72),
    (15.0,  25.0,   72, 72),
    (25.0,  30.0,   72, 72),
    (30.0,  35.0,   72, 74),
    (35.0,  42.0,   74, 76),
    (42.0,  55.0,   76, 80),
    (55.0,  63.0,   80, 82),
    (63.0,  75.0,   82, 84),
    (75.0,  90.0,   84, 88),
    (90.0,  92.0,   88, 86),
    (92.0, 110.0,   86, 84),
    (110.0, 115.0,  84, 80),
    (115.0, 120.0,  80, 76),
    (120.0, 125.0,  76, 76),
    (125.0, 155.0,  76, 72),
    (155.0, 175.0,  72, 72),
]

TOTAL_DURATION_S = 175.0

# Pad chord progression
PAD_PROGRESSION = [
    (0.0,    8.0,  "Ab_wide"),
    (8.0,    7.0,  "Db_wide"),
    (15.0,   5.0,  "Fm_wide"),
    (20.0,   5.0,  "Eb_wide"),
    (25.0,   5.0,  "Fm_wide"),
    (30.0,   3.0,  "Absus4"),
    (33.0,   9.0,  "Ab_wide"),
    (42.0,   6.5,  "Db_wide"),
    (48.5,   6.5,  "Eb_wide"),
    (55.0,   8.0,  "Ab_wide"),
    (63.0,   6.0,  "Bbm_wide"),
    (69.0,   6.0,  "Db_wide"),
    (75.0,   7.5,  "Eb_wide"),
    (82.5,   7.5,  "Ab_wide"),
    (90.0,   2.0,  "Fm_wide"),
    (92.0,   9.0,  "Db_wide"),
    (101.0,  9.0,  "Eb_wide"),
    (110.0,  5.0,  "Fm_wide"),
    (115.0,  5.0,  "Bbm_wide"),
    (120.0,  5.0,  "Ab_wide"),
    (125.0, 15.0,  "Db_wide"),
    (140.0, 15.0,  "Ab_wide"),
    (155.0, 20.0,  "Ab_wide"),
]

VOLUME_CURVES = {
    "pad": [
        (0.0, 175.0, 0.55, 0.55),
    ],
    "bass": [
        (0.0,   55.0, 0.0,  0.0),
        (55.0,  58.0, 0.0,  0.50),
        (58.0,  90.0, 0.50, 0.60),
        (90.0,  92.0, 0.60, 0.35),
        (92.0, 110.0, 0.35, 0.50),
        (110.0, 120.0, 0.50, 0.0),
        (120.0, 175.0, 0.0,  0.0),
    ],
    "melody": [
        (0.0,   55.0, 0.0,  0.0),
        (55.0,  63.0, 0.0,  0.40),
        (63.0,  90.0, 0.40, 0.50),
        (90.0,  92.0, 0.50, 0.20),
        (92.0, 110.0, 0.20, 0.40),
        (110.0, 120.0, 0.40, 0.0),
        (120.0, 175.0, 0.0,  0.0),
    ],
    "percussion": [
        (0.0,   75.0, 0.0,  0.0),
        (75.0,  78.0, 0.0,  0.30),
        (78.0,  82.0, 0.30, 0.45),
        (82.0,  90.0, 0.45, 0.55),
        (90.0,  92.0, 0.55, 0.15),
        (92.0, 110.0, 0.15, 0.40),
        (110.0, 115.0, 0.40, 0.15),
        (115.0, 120.0, 0.15, 0.0),
        (120.0, 175.0, 0.0,  0.0),
    ],
}

MIDI_PROGRAMS = {
    "pad":            89,
    "bass":           39,
    "melody":         81,
    "percussion":     0,
    "hi_hat_closed":  42,
    "hi_hat_open":    46,
    "kick":           36,
    "snare_rim":      37,
    "shaker":         70,
}


# ==========================================================================
# BPM / volume interpolation
# ==========================================================================

def get_bpm_at(t: float) -> float:
    for start, end, bpm_start, bpm_end in BPM_MAP:
        if start <= t < end:
            frac = (t - start) / (end - start) if end > start else 0
            return bpm_start + frac * (bpm_end - bpm_start)
    return BPM_MAP[-1][3]


def get_beat_duration(t: float) -> float:
    return 60.0 / get_bpm_at(t)


def get_volume_at(t: float, layer: str) -> float:
    curves = VOLUME_CURVES.get(layer, [(0, TOTAL_DURATION_S, 0.5, 0.5)])
    for start, end, v_start, v_end in curves:
        if start <= t < end:
            frac = (t - start) / (end - start) if end > start else 0
            return v_start + frac * (v_end - v_start)
    return 0.0


# ==========================================================================
# MIDI construction
# ==========================================================================

def build_midi() -> pretty_midi.PrettyMIDI:
    midi = pretty_midi.PrettyMIDI(initial_tempo=72)

    for start_s, end_s, bpm_start, bpm_end in BPM_MAP:
        steps = max(1, int((end_s - start_s) / 0.5))
        for i in range(steps):
            frac = i / steps
            t = start_s + frac * (end_s - start_s)
            bpm = bpm_start + frac * (bpm_end - bpm_start)
            midi._tick_scales.append(
                (midi.time_to_tick(t), 60.0 / (bpm * midi.resolution))
            )

    # Pad track
    pad = pretty_midi.Instrument(program=MIDI_PROGRAMS["pad"], name="Pad")
    for start_s, dur_s, chord_key in PAD_PROGRESSION:
        chord_notes = CHORDS.get(chord_key, CHORDS["Ab_wide"])
        vel = int(get_volume_at(start_s, "pad") * 127)
        vel = max(1, min(127, vel))
        for midi_note in chord_notes:
            n = pretty_midi.Note(velocity=vel, pitch=midi_note, start=start_s, end=start_s + dur_s)
            pad.notes.append(n)
    midi.instruments.append(pad)

    # Bass track
    bass = pretty_midi.Instrument(program=MIDI_PROGRAMS["bass"], name="Bass")
    for pitch, start, end, vel in _generate_bass_notes():
        bass.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(bass)

    # Melody track
    melody = pretty_midi.Instrument(program=MIDI_PROGRAMS["melody"], name="Melody")
    for pitch, start, end, vel in _generate_melody_notes():
        melody.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(melody)

    # Percussion track
    perc = pretty_midi.Instrument(program=0, is_drum=True, name="Percussion")
    for pitch, start, end, vel in _generate_percussion_notes():
        perc.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(perc)

    return midi


def _generate_bass_notes() -> List[Tuple[int, float, float, int]]:
    notes = []
    bass_root_map = {
        "Ab_wide": note("Ab", 2), "Db_wide": note("Db", 2),
        "Eb_wide": note("Eb", 2), "Fm_wide": note("F", 2),
        "Bbm_wide": note("Bb", 1), "Absus4": note("Ab", 2),
    }
    for start_s, dur_s, chord_key in PAD_PROGRESSION:
        if start_s < 53.0:
            continue
        root = bass_root_map.get(chord_key, note("Ab", 2))
        t = start_s
        end_limit = start_s + dur_s
        while t < end_limit:
            beat_dur = get_beat_duration(t)
            if 75.0 <= t <= 90.0:
                note_dur = beat_dur * 0.5
            else:
                note_dur = beat_dur * 0.9
            vel = int(get_volume_at(t, "bass") * 127)
            vel = max(1, min(127, vel))
            if vel > 1:
                notes.append((root, t, min(t + note_dur, end_limit), vel))
            t += beat_dur if t < 75.0 or t > 90.0 else beat_dur * 0.5
    return notes


def _generate_melody_notes() -> List[Tuple[int, float, float, int]]:
    notes = []
    melody_pitches = [
        note("C", 5), note("Eb", 5), note("Ab", 4),
        note("Bb", 4), note("Eb", 5), note("C", 5),
        note("F", 5), note("Eb", 5), note("Db", 5), note("C", 5),
        note("Ab", 4), note("Bb", 4), note("C", 5), note("Eb", 5),
    ]
    t = 55.0
    idx = 0
    while t < 120.0:
        vol = get_volume_at(t, "melody")
        if vol < 0.05:
            t += get_beat_duration(t)
            continue
        beat_dur = get_beat_duration(t)
        if idx % 3 == 0:
            dur = beat_dur * 2.0
        elif idx % 5 == 0:
            dur = beat_dur * 0.5
        else:
            dur = beat_dur * 1.0
        pitch = melody_pitches[idx % len(melody_pitches)]
        vel = int(vol * 110)
        vel = max(1, min(127, vel))
        notes.append((pitch, t, t + dur, vel))
        t += dur
        idx += 1
    return notes


def _generate_percussion_notes() -> List[Tuple[int, float, float, int]]:
    notes = []
    HH_CLOSED = MIDI_PROGRAMS["hi_hat_closed"]
    HH_OPEN = MIDI_PROGRAMS["hi_hat_open"]
    KICK = MIDI_PROGRAMS["kick"]
    RIMSHOT = MIDI_PROGRAMS["snare_rim"]
    SHAKER = MIDI_PROGRAMS["shaker"]

    t = 75.0
    while t < 120.0:
        vol = get_volume_at(t, "percussion")
        if vol < 0.03:
            t += get_beat_duration(t)
            continue
        beat = get_beat_duration(t)
        vel = int(vol * 100)
        vel = max(1, min(127, vel))

        for i in range(4):
            ht = t + i * beat / 4
            if ht >= 120.0:
                break
            hh_vel = vel if i == 0 else int(vel * 0.6)
            hh_pitch = HH_OPEN if i == 0 and int(t) % 2 == 0 else HH_CLOSED
            if 90.0 <= ht <= 92.0:
                hh_vel = int(hh_vel * 0.4)
            notes.append((hh_pitch, ht, ht + beat / 8, max(1, hh_vel)))

        if int((t - 75.0) / beat) % 2 == 0:
            notes.append((KICK, t, t + beat * 0.3, vel))
        if int((t - 75.0) / beat) % 2 == 1:
            rim_vel = int(vel * 0.5)
            notes.append((RIMSHOT, t, t + beat * 0.15, max(1, rim_vel)))
        if 82.0 <= t <= 90.0:
            notes.append((SHAKER, t, t + beat * 0.1, int(vel * 0.3)))

        t += beat
    return notes


# ==========================================================================
# WAV synthesis
# ==========================================================================

def midi_to_freq(midi_note: int) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def _lowpass(signal: np.ndarray, cutoff: float, sr: int, order: int = 4) -> np.ndarray:
    nyq = sr / 2
    if cutoff >= nyq:
        return signal
    b, a = butter(order, cutoff / nyq, btype='low')
    return lfilter(b, a, signal)


def _highpass_short(signal: np.ndarray, cutoff: float, sr: int, order: int = 2) -> np.ndarray:
    nyq = sr / 2
    if cutoff >= nyq or len(signal) < order * 3 + 1:
        return signal
    b, a = butter(order, cutoff / nyq, btype='high')
    return lfilter(b, a, signal)


def synthesize_pad(duration_s: float) -> np.ndarray:
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output_L = np.zeros(total_samples, dtype=np.float64)
    output_R = np.zeros(total_samples, dtype=np.float64)

    for start_s, dur_s, chord_key in PAD_PROGRESSION:
        chord_notes = CHORDS.get(chord_key, CHORDS["Ab_wide"])
        vol = get_volume_at(start_s + dur_s / 2, "pad")
        if vol < 0.01:
            continue
        start_sample = int(start_s * sr)
        end_sample = min(int((start_s + dur_s) * sr), total_samples)
        n_samples = end_sample - start_sample
        if n_samples <= 0:
            continue

        t_arr = np.arange(n_samples) / sr
        env = np.ones(n_samples)
        attack = min(int(1.0 * sr), n_samples // 2)
        release = min(int(1.5 * sr), n_samples // 2)
        if attack > 0:
            env[:attack] = 1 - np.exp(-3.0 * np.linspace(0, 1, attack))
        if release > 0:
            env[-release:] = np.exp(-3.0 * np.linspace(0, 1, release))

        chord_L = np.zeros(n_samples)
        chord_R = np.zeros(n_samples)
        for idx, midi_n in enumerate(chord_notes):
            freq = midi_to_freq(midi_n)
            lfo_rate = 0.15 + idx * 0.07
            lfo = 1.0 + 0.0008 * np.sin(2 * np.pi * lfo_rate * t_arr)
            sig = np.sin(2 * np.pi * freq * lfo * t_arr)
            sig += 0.4 * np.sin(2 * np.pi * freq * 1.004 * t_arr)
            sig += 0.4 * np.sin(2 * np.pi * freq * 0.996 * t_arr)
            sig += 0.25 * np.sin(2 * np.pi * freq * 1.007 * t_arr)
            sig += 0.25 * np.sin(2 * np.pi * freq * 0.993 * t_arr)
            sig += 0.2 * np.sin(2 * np.pi * freq * 0.5 * t_arr)
            pan = 0.5 + 0.2 * math.sin(idx * 1.3)
            chord_L += sig * (1.0 - pan)
            chord_R += sig * pan

        norm = max(len(chord_notes) * 2.2, 1.0)
        chord_L = chord_L / norm * env * vol
        chord_R = chord_R / norm * env * vol
        output_L[start_sample:end_sample] += chord_L
        output_R[start_sample:end_sample] += chord_R

    output_L = _lowpass(output_L, 2500, sr)
    output_R = _lowpass(output_R, 2500, sr)
    chorus_delay = int(0.007 * sr)
    output_R = np.roll(output_R, chorus_delay)
    output_R[:chorus_delay] = 0
    return np.column_stack([output_L, output_R])


def synthesize_bass(duration_s: float) -> np.ndarray:
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output = np.zeros(total_samples, dtype=np.float64)

    for pitch, start, end, vel in _generate_bass_notes():
        freq = midi_to_freq(pitch)
        start_sample = int(start * sr)
        end_sample = min(int(end * sr), total_samples)
        n = end_sample - start_sample
        if n <= 0:
            continue
        t_arr = np.arange(n) / sr
        vol = vel / 127.0
        sig = np.sin(2 * np.pi * freq * t_arr)
        sig += 0.35 * np.sin(2 * np.pi * freq * 2 * t_arr)
        sig += 0.1 * np.sin(2 * np.pi * freq * 3 * t_arr)
        sig = np.tanh(sig * 1.8)
        env = np.ones(n)
        atk = min(int(0.008 * sr), n)
        rel = min(int(0.08 * sr), n)
        if atk > 0:
            env[:atk] = 1 - np.exp(-5.0 * np.linspace(0, 1, atk))
        if rel > 0:
            env[-rel:] = np.exp(-4.0 * np.linspace(0, 1, rel))
        sig *= env * vol * 0.6
        output[start_sample:end_sample] += sig

    output = _lowpass(output, 400, sr)
    return np.column_stack([output, output])


def synthesize_melody(duration_s: float) -> np.ndarray:
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output_L = np.zeros(total_samples, dtype=np.float64)
    output_R = np.zeros(total_samples, dtype=np.float64)

    for pitch, start, end, vel in _generate_melody_notes():
        freq = midi_to_freq(pitch)
        start_sample = int(start * sr)
        end_sample = min(int(end * sr), total_samples)
        n = end_sample - start_sample
        if n <= 0:
            continue
        t_arr = np.arange(n) / sr
        vol = vel / 127.0
        vib_depth = 0.003 * np.clip((t_arr - 0.1) * 5, 0, 1)
        vibrato = 1.0 + vib_depth * np.sin(2 * np.pi * 5.0 * t_arr)
        sig = np.sin(2 * np.pi * freq * vibrato * t_arr)
        sig += 0.3 * np.sin(2 * np.pi * freq * 2 * t_arr)
        sig += 0.12 * np.sin(2 * np.pi * freq * 3 * t_arr)
        sig += 0.05 * np.sin(2 * np.pi * freq * 4 * t_arr)
        env = np.ones(n)
        atk = min(int(0.04 * sr), n // 2)
        rel = min(int(0.2 * sr), n // 2)
        if atk > 0:
            env[:atk] = 1 - np.exp(-4.0 * np.linspace(0, 1, atk))
        if rel > 0:
            env[-rel:] = np.exp(-3.5 * np.linspace(0, 1, rel))
        sig *= env * vol * 0.35
        output_L[start_sample:end_sample] += sig * 0.6
        output_R[start_sample:end_sample] += sig * 0.4

    output_L = _lowpass(output_L, 6000, sr)
    output_R = _lowpass(output_R, 6000, sr)
    return np.column_stack([output_L, output_R])


def synthesize_percussion(duration_s: float) -> np.ndarray:
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output_L = np.zeros(total_samples, dtype=np.float64)
    output_R = np.zeros(total_samples, dtype=np.float64)

    for pitch, start, end, vel in _generate_percussion_notes():
        start_sample = int(start * sr)
        vol = vel / 127.0
        n = min(int((end - start) * sr), int(0.3 * sr))
        if start_sample + n > total_samples:
            n = total_samples - start_sample
        if n <= 0:
            continue
        t_arr = np.arange(n) / sr

        if pitch == MIDI_PROGRAMS["kick"]:
            freq_curve = 160.0 * np.exp(-t_arr * 35)
            phase = np.cumsum(freq_curve) / sr * 2 * np.pi
            sig = np.sin(phase)
            click = np.exp(-t_arr * 80) * 0.3
            sig = sig * np.exp(-t_arr * 12) + click
            sig *= vol * 0.7
            output_L[start_sample:start_sample + n] += sig
            output_R[start_sample:start_sample + n] += sig
        elif pitch in (MIDI_PROGRAMS["hi_hat_closed"], MIDI_PROGRAMS["hi_hat_open"]):
            sig = np.random.randn(n)
            ring_freq = 8000 + np.random.uniform(-500, 500)
            sig += 0.15 * np.sin(2 * np.pi * ring_freq * t_arr)
            decay = 8.0 if pitch == MIDI_PROGRAMS["hi_hat_closed"] else 3.5
            sig *= np.exp(-t_arr * decay) * vol * 0.25
            sig = _highpass_short(sig, 4500, sr)
            output_L[start_sample:start_sample + n] += sig * 0.35
            output_R[start_sample:start_sample + n] += sig * 0.65
        elif pitch == MIDI_PROGRAMS["snare_rim"]:
            noise = np.random.randn(n)
            tone = np.sin(2 * np.pi * 900 * t_arr) * 0.3
            sig = (noise + tone) * np.exp(-t_arr * 18) * vol * 0.3
            sig = _highpass_short(sig, 1800, sr)
            output_L[start_sample:start_sample + n] += sig * 0.6
            output_R[start_sample:start_sample + n] += sig * 0.4
        elif pitch == MIDI_PROGRAMS["shaker"]:
            sig = np.random.randn(n)
            sig *= np.exp(-t_arr * 12) * vol * 0.12
            sig = _highpass_short(sig, 6000, sr)
            output_L[start_sample:start_sample + n] += sig * 0.2
            output_R[start_sample:start_sample + n] += sig * 0.8

    return np.column_stack([output_L, output_R])


# ==========================================================================
# Main
# ==========================================================================

def main():
    parser = argparse.ArgumentParser(description="Synthesize music track")
    parser.add_argument("--output", required=True, help="Output WAV file path")
    parser.add_argument("--config", default=None, help="Optional JSON config override")
    args = parser.parse_args()

    # Load config overrides if provided
    duration = TOTAL_DURATION_S
    if args.config and os.path.exists(args.config):
        try:
            with open(args.config, "r") as f:
                cfg = json.load(f)
            duration = cfg.get("duration", duration)
            print(f"[config] Loaded overrides from {args.config}", file=sys.stderr)
        except Exception as e:
            print(f"[config] Warning: could not load config: {e}", file=sys.stderr)

    output_dir = os.path.dirname(args.output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    print(f"[music] Generating {duration:.0f}s track in Ab major (72-88 BPM)", file=sys.stderr)

    # Build MIDI
    print("[music] Building MIDI score...", file=sys.stderr)
    midi = build_midi()

    # Synthesize each layer
    print("[music] Synthesizing pad...", file=sys.stderr)
    pad_audio = synthesize_pad(duration)

    print("[music] Synthesizing bass...", file=sys.stderr)
    bass_audio = synthesize_bass(duration)

    print("[music] Synthesizing melody...", file=sys.stderr)
    melody_audio = synthesize_melody(duration)

    print("[music] Synthesizing percussion...", file=sys.stderr)
    perc_audio = synthesize_percussion(duration)

    # Mix layers
    print("[music] Mixing stereo layers...", file=sys.stderr)
    total_samples = int(duration * SAMPLE_RATE)

    def pad_or_trim_stereo(arr, length):
        if arr.shape[0] >= length:
            return arr[:length]
        pad_width = length - arr.shape[0]
        return np.pad(arr, ((0, pad_width), (0, 0)))

    pad_audio = pad_or_trim_stereo(pad_audio, total_samples)
    bass_audio = pad_or_trim_stereo(bass_audio, total_samples)
    melody_audio = pad_or_trim_stereo(melody_audio, total_samples)
    perc_audio = pad_or_trim_stereo(perc_audio, total_samples)

    mix = pad_audio + bass_audio + melody_audio + perc_audio

    # Analog noise floor for warmth
    noise_level = 10 ** (-60.0 / 20.0)
    noise = np.random.randn(total_samples, 2) * noise_level
    noise[:, 0] = _lowpass(noise[:, 0], 8000, SAMPLE_RATE)
    noise[:, 1] = _lowpass(noise[:, 1], 8000, SAMPLE_RATE)
    mix += noise

    # Normalize
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = mix / peak * 0.85

    # Fade out last 5 seconds
    fade_samples = int(5.0 * SAMPLE_RATE)
    fade_curve = np.linspace(1, 0, fade_samples).reshape(-1, 1)
    mix[-fade_samples:] *= fade_curve

    # Write WAV
    mix_16 = np.int16(np.clip(mix, -1, 1) * 32767)
    wavfile.write(args.output, SAMPLE_RATE, mix_16)

    print(f"[music] Saved: {args.output} ({mix_16.shape[0]/SAMPLE_RATE:.1f}s, stereo)", file=sys.stderr)


if __name__ == "__main__":
    main()
