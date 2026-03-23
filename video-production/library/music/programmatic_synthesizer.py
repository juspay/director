#!/usr/bin/env python3
# Origin: v7 — extracted to library on 2026-03-23
"""
generate_music_v7.py — Programmatic music generation for TARA v7.4 product video.

Generates a single continuous track in Ab major with variable BPM (72-88).
Outputs both a MIDI file and a rendered WAV using pretty_midi + numpy synthesis.

Instruments: analog synth pad, bass, hi-hat, melody, percussion.

Usage:
    python generate_music_v7.py [--output-dir OUTPUT_DIR]
"""

import argparse
import os
import sys
import math
import numpy as np
from typing import List, Tuple

try:
    import pretty_midi
except ImportError:
    print("ERROR: pretty_midi not installed. Run: pip install pretty_midi")
    sys.exit(1)

try:
    from scipy.signal import butter, lfilter, resample
    from scipy.io import wavfile
except ImportError:
    print("ERROR: scipy not installed. Run: pip install scipy")
    sys.exit(1)

from music_config import (
    AB_MAJOR_SCALE, CHORDS, BPM_MAP, TOTAL_DURATION_S,
    PAD_PROGRESSION, VOLUME_CURVES, MIDI_PROGRAMS,
    SAMPLE_RATE, note,
)


# --------------------------------------------------------------------------
# BPM interpolation
# --------------------------------------------------------------------------

def get_bpm_at(t: float) -> float:
    """Get interpolated BPM at time t (seconds)."""
    for start, end, bpm_start, bpm_end in BPM_MAP:
        if start <= t < end:
            frac = (t - start) / (end - start) if end > start else 0
            return bpm_start + frac * (bpm_end - bpm_start)
    return BPM_MAP[-1][3]  # last BPM


def get_beat_duration(t: float) -> float:
    """Duration of one beat at time t."""
    return 60.0 / get_bpm_at(t)


def get_volume_at(t: float, layer: str) -> float:
    """Interpolated volume for a layer at time t."""
    curves = VOLUME_CURVES.get(layer, [(0, TOTAL_DURATION_S, 0.5, 0.5)])
    for start, end, v_start, v_end in curves:
        if start <= t < end:
            frac = (t - start) / (end - start) if end > start else 0
            return v_start + frac * (v_end - v_start)
    return 0.0


# --------------------------------------------------------------------------
# MIDI construction
# --------------------------------------------------------------------------

def build_midi() -> pretty_midi.PrettyMIDI:
    """Build the full MIDI score."""
    # Initial tempo — pretty_midi uses a single initial tempo but we'll add
    # tempo changes throughout.
    midi = pretty_midi.PrettyMIDI(initial_tempo=72)

    # Add tempo changes from BPM map
    for start_s, end_s, bpm_start, bpm_end in BPM_MAP:
        steps = max(1, int((end_s - start_s) / 0.5))  # tempo change every 0.5s
        for i in range(steps):
            frac = i / steps
            t = start_s + frac * (end_s - start_s)
            bpm = bpm_start + frac * (bpm_end - bpm_start)
            midi._tick_scales.append(
                (midi.time_to_tick(t), 60.0 / (bpm * midi.resolution))
            )

    # --- Pad track ---
    pad = pretty_midi.Instrument(program=MIDI_PROGRAMS["pad"], name="Pad")
    for start_s, dur_s, chord_key in PAD_PROGRESSION:
        chord_notes = CHORDS.get(chord_key, CHORDS["Ab_wide"])
        vel = int(get_volume_at(start_s, "pad") * 127)
        vel = max(1, min(127, vel))
        for midi_note in chord_notes:
            n = pretty_midi.Note(
                velocity=vel,
                pitch=midi_note,
                start=start_s,
                end=start_s + dur_s,
            )
            pad.notes.append(n)
    midi.instruments.append(pad)

    # --- Bass track ---
    bass = pretty_midi.Instrument(program=MIDI_PROGRAMS["bass"], name="Bass")
    bass_pattern = _generate_bass_notes()
    for pitch, start, end, vel in bass_pattern:
        bass.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(bass)

    # --- Melody track ---
    melody = pretty_midi.Instrument(program=MIDI_PROGRAMS["melody"], name="Melody")
    melody_notes = _generate_melody_notes()
    for pitch, start, end, vel in melody_notes:
        melody.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(melody)

    # --- Percussion track ---
    perc = pretty_midi.Instrument(program=0, is_drum=True, name="Percussion")
    perc_notes = _generate_percussion_notes()
    for pitch, start, end, vel in perc_notes:
        perc.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
    midi.instruments.append(perc)

    return midi


def _generate_bass_notes() -> List[Tuple[int, float, float, int]]:
    """Generate bass notes following the pad progression, active from 55s onward."""
    notes = []
    bass_root_map = {
        "Ab_wide": note("Ab", 2),
        "Db_wide": note("Db", 2),
        "Eb_wide": note("Eb", 2),
        "Fm_wide": note("F", 2),
        "Bbm_wide": note("Bb", 1),
        "Absus4": note("Ab", 2),
    }

    for start_s, dur_s, chord_key in PAD_PROGRESSION:
        if start_s < 53.0:
            continue
        root = bass_root_map.get(chord_key, note("Ab", 2))
        t = start_s
        end_limit = start_s + dur_s
        while t < end_limit:
            beat_dur = get_beat_duration(t)
            # Eighth note pulse for energy sections, quarter notes otherwise
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
    """Generate a simple melodic line in Ab major, active from ~55s."""
    notes = []
    # Melodic phrases — pentatonic-ish fragments in Ab major
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
        # Vary rhythm: some quarter, some half notes
        if idx % 3 == 0:
            dur = beat_dur * 2.0  # half note
        elif idx % 5 == 0:
            dur = beat_dur * 0.5  # eighth
        else:
            dur = beat_dur * 1.0  # quarter
        pitch = melody_pitches[idx % len(melody_pitches)]
        vel = int(vol * 110)
        vel = max(1, min(127, vel))
        notes.append((pitch, t, t + dur, vel))
        t += dur
        idx += 1
    return notes


def _generate_percussion_notes() -> List[Tuple[int, float, float, int]]:
    """Generate percussion — hi-hat pattern + kick + side stick."""
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

        # Hi-hat: 16th-note pattern
        for i in range(4):
            ht = t + i * beat / 4
            if ht >= 120.0:
                break
            hh_vel = vel if i == 0 else int(vel * 0.6)
            hh_pitch = HH_OPEN if i == 0 and int(t) % 2 == 0 else HH_CLOSED
            # Gorge section: lower velocity hi-hat
            if 90.0 <= ht <= 92.0:
                hh_vel = int(hh_vel * 0.4)
            notes.append((hh_pitch, ht, ht + beat / 8, max(1, hh_vel)))

        # Kick on beats 1 and 3 (within each bar ~ every 2 beats)
        if int((t - 75.0) / beat) % 2 == 0:
            notes.append((KICK, t, t + beat * 0.3, vel))

        # Rimshot on beat 2 and 4
        if int((t - 75.0) / beat) % 2 == 1:
            rim_vel = int(vel * 0.5)
            notes.append((RIMSHOT, t, t + beat * 0.15, max(1, rim_vel)))

        # Shaker — continuous light texture during peak
        if 82.0 <= t <= 90.0:
            notes.append((SHAKER, t, t + beat * 0.1, int(vel * 0.3)))

        t += beat

    return notes


# --------------------------------------------------------------------------
# WAV synthesis (no soundfont required)
# --------------------------------------------------------------------------

def midi_to_freq(midi_note: int) -> float:
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def synthesize_pad(duration_s: float) -> np.ndarray:
    """Synthesize the pad layer as a warm analog-style sound with stereo chorus."""
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    # Stereo output: [samples, 2]
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

        # Exponential attack/release envelope (more natural than linear)
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
            # Slow LFO for gentle pitch drift (analog warmth)
            lfo_rate = 0.15 + idx * 0.07  # slightly different per voice
            lfo = 1.0 + 0.0008 * np.sin(2 * np.pi * lfo_rate * t_arr)

            # Richer pad: fundamental + 3 detuned pairs + sub-octave
            sig = np.sin(2 * np.pi * freq * lfo * t_arr)
            sig += 0.4 * np.sin(2 * np.pi * freq * 1.004 * t_arr)
            sig += 0.4 * np.sin(2 * np.pi * freq * 0.996 * t_arr)
            sig += 0.25 * np.sin(2 * np.pi * freq * 1.007 * t_arr)  # wider detune
            sig += 0.25 * np.sin(2 * np.pi * freq * 0.993 * t_arr)
            sig += 0.2 * np.sin(2 * np.pi * freq * 0.5 * t_arr)     # sub

            # Stereo spread: alternate notes slightly L/R
            pan = 0.5 + 0.2 * math.sin(idx * 1.3)  # 0.3 to 0.7
            chord_L += sig * (1.0 - pan)
            chord_R += sig * pan

        norm = max(len(chord_notes) * 2.2, 1.0)
        chord_L = chord_L / norm * env * vol
        chord_R = chord_R / norm * env * vol

        output_L[start_sample:end_sample] += chord_L
        output_R[start_sample:end_sample] += chord_R

    # Low-pass filter for warmth (cutoff ~2.5kHz — slightly brighter)
    output_L = _lowpass(output_L, 2500, sr)
    output_R = _lowpass(output_R, 2500, sr)

    # Subtle stereo chorus: delay R channel by ~7ms for width
    chorus_delay = int(0.007 * sr)
    output_R = np.roll(output_R, chorus_delay)
    output_R[:chorus_delay] = 0

    return np.column_stack([output_L, output_R])


def synthesize_bass(duration_s: float) -> np.ndarray:
    """Synthesize bass — fat sub-bass with slight saturation. Mono, centered."""
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output = np.zeros(total_samples, dtype=np.float64)

    bass_notes = _generate_bass_notes()
    for pitch, start, end, vel in bass_notes:
        freq = midi_to_freq(pitch)
        start_sample = int(start * sr)
        end_sample = min(int(end * sr), total_samples)
        n = end_sample - start_sample
        if n <= 0:
            continue

        t_arr = np.arange(n) / sr
        vol = vel / 127.0

        # Sub bass + harmonics for warmth
        sig = np.sin(2 * np.pi * freq * t_arr)
        sig += 0.35 * np.sin(2 * np.pi * freq * 2 * t_arr)
        sig += 0.1 * np.sin(2 * np.pi * freq * 3 * t_arr)  # added 3rd harmonic
        # Soft saturation (drive slightly higher for thickness)
        sig = np.tanh(sig * 1.8)

        # Exponential attack, smoother release
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
    # Return as stereo (centered)
    return np.column_stack([output, output])


def synthesize_melody(duration_s: float) -> np.ndarray:
    """Synthesize melody — soft sawtooth-ish lead with subtle vibrato."""
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output_L = np.zeros(total_samples, dtype=np.float64)
    output_R = np.zeros(total_samples, dtype=np.float64)

    melody_notes = _generate_melody_notes()
    for pitch, start, end, vel in melody_notes:
        freq = midi_to_freq(pitch)
        start_sample = int(start * sr)
        end_sample = min(int(end * sr), total_samples)
        n = end_sample - start_sample
        if n <= 0:
            continue

        t_arr = np.arange(n) / sr
        vol = vel / 127.0

        # Delayed vibrato: kicks in after 0.1s for expressiveness
        vib_depth = 0.003 * np.clip((t_arr - 0.1) * 5, 0, 1)
        vibrato = 1.0 + vib_depth * np.sin(2 * np.pi * 5.0 * t_arr)

        # Soft lead: sin + harmonics with vibrato
        sig = np.sin(2 * np.pi * freq * vibrato * t_arr)
        sig += 0.3 * np.sin(2 * np.pi * freq * 2 * t_arr)
        sig += 0.12 * np.sin(2 * np.pi * freq * 3 * t_arr)
        sig += 0.05 * np.sin(2 * np.pi * freq * 4 * t_arr)  # more shimmer

        # Exponential envelope
        env = np.ones(n)
        atk = min(int(0.04 * sr), n // 2)
        rel = min(int(0.2 * sr), n // 2)
        if atk > 0:
            env[:atk] = 1 - np.exp(-4.0 * np.linspace(0, 1, atk))
        if rel > 0:
            env[-rel:] = np.exp(-3.5 * np.linspace(0, 1, rel))

        sig *= env * vol * 0.35
        # Melody slightly left of center
        output_L[start_sample:end_sample] += sig * 0.6
        output_R[start_sample:end_sample] += sig * 0.4

    output_L = _lowpass(output_L, 6000, sr)
    output_R = _lowpass(output_R, 6000, sr)
    return np.column_stack([output_L, output_R])


def synthesize_percussion(duration_s: float) -> np.ndarray:
    """Synthesize percussion — electronic hi-hats, kick, rimshot. Stereo."""
    sr = SAMPLE_RATE
    total_samples = int(duration_s * sr)
    output_L = np.zeros(total_samples, dtype=np.float64)
    output_R = np.zeros(total_samples, dtype=np.float64)

    perc_notes = _generate_percussion_notes()
    for pitch, start, end, vel in perc_notes:
        start_sample = int(start * sr)
        vol = vel / 127.0
        n = min(int((end - start) * sr), int(0.3 * sr))
        if start_sample + n > total_samples:
            n = total_samples - start_sample
        if n <= 0:
            continue

        t_arr = np.arange(n) / sr

        if pitch == MIDI_PROGRAMS["kick"]:
            # Kick: pitch-dropping sine with body resonance
            freq_curve = 160.0 * np.exp(-t_arr * 35)
            phase = np.cumsum(freq_curve) / sr * 2 * np.pi
            sig = np.sin(phase)
            # Add body click transient
            click = np.exp(-t_arr * 80) * 0.3
            sig = sig * np.exp(-t_arr * 12) + click
            sig *= vol * 0.7
            # Kick centered
            output_L[start_sample:start_sample + n] += sig
            output_R[start_sample:start_sample + n] += sig
        elif pitch in (MIDI_PROGRAMS["hi_hat_closed"], MIDI_PROGRAMS["hi_hat_open"]):
            # Hi-hat: filtered noise with metallic tone
            sig = np.random.randn(n)
            # Add a metallic ring component
            ring_freq = 8000 + np.random.uniform(-500, 500)
            sig += 0.15 * np.sin(2 * np.pi * ring_freq * t_arr)
            decay = 8.0 if pitch == MIDI_PROGRAMS["hi_hat_closed"] else 3.5
            sig *= np.exp(-t_arr * decay) * vol * 0.25
            sig = _highpass_short(sig, 4500, sr)
            # Hi-hats slightly right
            output_L[start_sample:start_sample + n] += sig * 0.35
            output_R[start_sample:start_sample + n] += sig * 0.65
        elif pitch == MIDI_PROGRAMS["snare_rim"]:
            # Rimshot: click + short noise + tonal body
            noise = np.random.randn(n)
            tone = np.sin(2 * np.pi * 900 * t_arr) * 0.3  # tonal body
            sig = (noise + tone) * np.exp(-t_arr * 18) * vol * 0.3
            sig = _highpass_short(sig, 1800, sr)
            # Rimshot slightly left
            output_L[start_sample:start_sample + n] += sig * 0.6
            output_R[start_sample:start_sample + n] += sig * 0.4
        elif pitch == MIDI_PROGRAMS["shaker"]:
            sig = np.random.randn(n)
            sig *= np.exp(-t_arr * 12) * vol * 0.12
            sig = _highpass_short(sig, 6000, sr)
            # Shaker far right
            output_L[start_sample:start_sample + n] += sig * 0.2
            output_R[start_sample:start_sample + n] += sig * 0.8
        else:
            continue

    return np.column_stack([output_L, output_R])


def _lowpass(signal: np.ndarray, cutoff: float, sr: int, order: int = 4) -> np.ndarray:
    """Apply Butterworth low-pass filter."""
    nyq = sr / 2
    if cutoff >= nyq:
        return signal
    b, a = butter(order, cutoff / nyq, btype='low')
    return lfilter(b, a, signal)


def _highpass_short(signal: np.ndarray, cutoff: float, sr: int, order: int = 2) -> np.ndarray:
    """Apply high-pass filter to a short signal."""
    nyq = sr / 2
    if cutoff >= nyq or len(signal) < order * 3 + 1:
        return signal
    b, a = butter(order, cutoff / nyq, btype='high')
    return lfilter(b, a, signal)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate TARA v7.4 music track")
    parser.add_argument("--output-dir", default=".", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("=== TARA v7.4 Music Generator ===")
    print(f"Duration: {TOTAL_DURATION_S:.0f}s (~{int(TOTAL_DURATION_S)//60}:{int(TOTAL_DURATION_S)%60:02d})")
    print(f"Key: Ab major | BPM: 72-88 variable")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print()

    # Build MIDI
    print("[1/6] Building MIDI score...")
    midi = build_midi()
    midi_path = os.path.join(args.output_dir, "tara_v74_music.mid")
    midi.write(midi_path)
    print(f"      MIDI saved: {midi_path}")

    # Synthesize each layer
    duration = TOTAL_DURATION_S

    print("[2/6] Synthesizing pad layer...")
    pad_audio = synthesize_pad(duration)

    print("[3/6] Synthesizing bass layer...")
    bass_audio = synthesize_bass(duration)

    print("[4/6] Synthesizing melody layer...")
    melody_audio = synthesize_melody(duration)

    print("[5/6] Synthesizing percussion layer...")
    perc_audio = synthesize_percussion(duration)

    # Mix layers (all are stereo: [samples, 2])
    print("[6/6] Mixing stereo layers...")
    total_samples = int(duration * SAMPLE_RATE)

    # Ensure all stereo arrays are the same length
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

    # Add subtle analog noise floor for warmth (-60dB)
    noise_level = 10 ** (-60.0 / 20.0)
    noise = np.random.randn(total_samples, 2) * noise_level
    noise[:, 0] = _lowpass(noise[:, 0], 8000, SAMPLE_RATE)
    noise[:, 1] = _lowpass(noise[:, 1], 8000, SAMPLE_RATE)
    mix += noise

    # Normalize
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = mix / peak * 0.85  # leave headroom

    # Fade out last 5 seconds (longer for smoother ending)
    fade_samples = int(5.0 * SAMPLE_RATE)
    fade_curve = np.linspace(1, 0, fade_samples).reshape(-1, 1)
    mix[-fade_samples:] *= fade_curve

    # Convert to 16-bit stereo
    mix_16 = np.int16(np.clip(mix, -1, 1) * 32767)

    wav_path = os.path.join(args.output_dir, "tara_v74_music.wav")
    wavfile.write(wav_path, SAMPLE_RATE, mix_16)
    print(f"      WAV saved: {wav_path} (stereo)")
    print(f"      Duration: {mix_16.shape[0]/SAMPLE_RATE:.1f}s")
    print()
    print("Done. Music track ready for mixing.")


if __name__ == "__main__":
    main()
