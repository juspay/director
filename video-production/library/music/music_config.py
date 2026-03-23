# Origin: v7 — extracted to library on 2026-03-23
"""
music_config.py — Musical constants for TARA v7.4 product video.

Ab major, 72-88 BPM variable tempo, ~2:55 total runtime.
Reference tracks: Tycho "Awake", Olafur Arnalds "Near Light",
Rival Consoles "Articulation", Jon Hopkins "Emerald Rush", Hammock "Together Alone".
"""

# --------------------------------------------------------------------------
# Scale & pitch
# --------------------------------------------------------------------------

# Ab major scale — MIDI note numbers (Ab3 = 56 as root)
AB_MAJOR_SCALE = {
    "Ab": 56,
    "Bb": 58,
    "C": 60,
    "Db": 61,
    "Eb": 63,
    "F": 65,
    "G": 67,
}

# Octave-explicit MIDI helpers
def note(name: str, octave: int = 3) -> int:
    """Return MIDI note number for a named note at a given octave.
    Default octave 3 maps Ab -> 56."""
    base = AB_MAJOR_SCALE[name]
    return base + (octave - 3) * 12


# --------------------------------------------------------------------------
# Chord definitions (Ab major diatonic + extensions)
# --------------------------------------------------------------------------

# Each chord is a list of MIDI offsets from the root (Ab3=56).
CHORDS = {
    # Triads
    "Ab":       [note("Ab"), note("C"),  note("Eb")],
    "Bbm":      [note("Bb"), note("Db"), note("F")],
    "Cm":       [note("C"),  note("Eb"), note("G")],
    "Db":       [note("Db"), note("F"),  note("Ab", 4)],
    "Eb":       [note("Eb"), note("G"),  note("Bb")],
    "Fm":       [note("F"),  note("Ab", 4), note("C", 4)],
    "Gdim":     [note("G"),  note("Bb"), note("Db", 4)],

    # Extended / color chords used in the track
    "Absus4":   [note("Ab"), note("Db"), note("Eb")],           # sus4 before resolve
    "Abmaj7":   [note("Ab"), note("C"),  note("Eb"), note("G")],
    "Dbmaj9":   [note("Db"), note("F"),  note("Ab", 4), note("C", 4), note("Eb", 4)],
    "Eb7":      [note("Eb"), note("G"),  note("Bb"), note("Db", 4)],
    "Fm7":      [note("F"),  note("Ab", 4), note("C", 4), note("Eb", 4)],
    "Bbm7":     [note("Bb"), note("Db"), note("F"),  note("Ab", 4)],

    # Voicings for pad (spread across octaves for warmth)
    "Ab_wide":  [note("Ab", 2), note("Eb"), note("C", 4), note("Ab", 4)],
    "Db_wide":  [note("Db", 2), note("Ab"), note("F", 4), note("Db", 4)],
    "Eb_wide":  [note("Eb", 2), note("Bb"), note("G", 4), note("Eb", 4)],
    "Fm_wide":  [note("F", 2),  note("C"),  note("Ab", 4), note("F", 4)],
    "Bbm_wide": [note("Bb", 2), note("F"),  note("Db", 4), note("Bb", 4)],
}


# --------------------------------------------------------------------------
# BPM timeline map (from script production notes)
# --------------------------------------------------------------------------
# Each entry: (start_seconds, end_seconds, start_bpm, end_bpm)
# Linear interpolation between start_bpm and end_bpm within the window.

BPM_MAP = [
    # Timestamp        BPM           Sonic State
    (0.0,    8.0,     72,  72),    # Pad only
    (8.0,   15.0,     72,  72),    # Tension, two points
    (15.0,  25.0,     72,  72),    # Chord forming, history arc
    (25.0,  30.0,     72,  72),    # "Carrying the weight"
    (30.0,  35.0,     72,  74),    # Peaks -> plucked string -> resolves
    (35.0,  42.0,     74,  76),    # Warmth, thread establishing
    (42.0,  55.0,     76,  80),    # Investigation, bass enters 0:55
    (55.0,  63.0,     80,  82),    # Melody, pre-highlight
    (63.0,  75.0,     82,  84),    # Collaboration
    (75.0,  90.0,     84,  88),    # Two-stage percussion, execution peak
    (90.0,  92.0,     88,  86),    # Gorge: 1.5s, hi-hat LP
    (92.0, 110.0,     86,  84),    # Rebuild, ecosystem + numbers
    (110.0, 115.0,    84,  80),    # Percussion thins
    (115.0, 120.0,    80,  76),    # Dots, smooth descent
    (120.0, 125.0,    76,  76),    # Single note, title card
    (125.0, 155.0,    76,  72),    # Resolution, constellation -> logo
    (155.0, 175.0,    72,  72),    # Fade out / tail
]

TOTAL_DURATION_S = 175.0  # ~2:55


# --------------------------------------------------------------------------
# SFX placements (seconds)
# --------------------------------------------------------------------------

SFX_TIMESTAMPS = {
    "plucked_string": 33.0,   # Ab sus4 -> Ab major, "Tara closes that gap"
    "sub_pulse":      57.0,   # Tendrils retract, separated from bass at 0:55
    "shimmer":       148.0,   # Constellation -> logo (optional, ~2:28)
}


# --------------------------------------------------------------------------
# Pad chord progression (timestamp -> chord name from CHORDS dict)
# --------------------------------------------------------------------------
# Uses wide voicings for the pad, switching at musically meaningful moments.

PAD_PROGRESSION = [
    # (start_s, duration_s, chord_key)
    (0.0,    8.0,  "Ab_wide"),       # Opening pad
    (8.0,    7.0,  "Db_wide"),       # Tension — two points
    (15.0,   5.0,  "Fm_wide"),       # History arc — unresolved
    (20.0,   5.0,  "Eb_wide"),       # Still forming
    (25.0,   5.0,  "Fm_wide"),       # "Carrying the weight" — heavier
    (30.0,   3.0,  "Absus4"),        # Pre-resolve (sus4)
    (33.0,   9.0,  "Ab_wide"),       # RESOLVE — plucked string moment
    (42.0,   6.5,  "Db_wide"),       # Investigation begins
    (48.5,   6.5,  "Eb_wide"),       # Building
    (55.0,   8.0,  "Ab_wide"),       # Bass enters
    (63.0,   6.0,  "Bbm_wide"),     # Collaboration — PM
    (69.0,   6.0,  "Db_wide"),       # Engineer
    (75.0,   7.5,  "Eb_wide"),       # Execution ramp
    (82.5,   7.5,  "Ab_wide"),       # Peak
    (90.0,   2.0,  "Fm_wide"),       # Gorge
    (92.0,   9.0,  "Db_wide"),       # Rebuild
    (101.0,  9.0,  "Eb_wide"),       # Numbers
    (110.0,  5.0,  "Fm_wide"),       # Percussion thins
    (115.0,  5.0,  "Bbm_wide"),     # Dots
    (120.0,  5.0,  "Ab_wide"),       # Single note / title
    (125.0, 15.0,  "Db_wide"),       # Resolution
    (140.0, 15.0,  "Ab_wide"),       # Constellation -> logo -> fade
    (155.0, 20.0,  "Ab_wide"),       # Final sustain / tail
]


# --------------------------------------------------------------------------
# Volume curves (0.0 – 1.0) for each instrument layer
# --------------------------------------------------------------------------
# Each entry: (start_s, end_s, start_vol, end_vol)

VOLUME_CURVES = {
    "pad": [
        (0.0,   175.0,  0.55, 0.55),   # Constant warm bed (ducked by mixer)
    ],
    "bass": [
        (0.0,    55.0,  0.0,  0.0),    # Silent until 0:55
        (55.0,   58.0,  0.0,  0.50),   # Fade in
        (58.0,   90.0,  0.50, 0.60),   # Build
        (90.0,   92.0,  0.60, 0.35),   # Gorge drop
        (92.0,  110.0,  0.35, 0.50),   # Rebuild
        (110.0, 120.0,  0.50, 0.0),    # Fade out
        (120.0, 175.0,  0.0,  0.0),    # Silent
    ],
    "melody": [
        (0.0,    55.0,  0.0,  0.0),
        (55.0,   63.0,  0.0,  0.40),   # Enters with bass
        (63.0,   90.0,  0.40, 0.50),   # Collaboration / peak
        (90.0,   92.0,  0.50, 0.20),   # Gorge
        (92.0,  110.0,  0.20, 0.40),   # Rebuild
        (110.0, 120.0,  0.40, 0.0),    # Thins
        (120.0, 175.0,  0.0,  0.0),
    ],
    "percussion": [
        (0.0,    75.0,  0.0,  0.0),
        (75.0,   78.0,  0.0,  0.30),   # First stage at "it moves"
        (78.0,   82.0,  0.30, 0.45),   # Second stage — full percussion
        (82.0,   90.0,  0.45, 0.55),   # Peak
        (90.0,   92.0,  0.55, 0.15),   # Gorge — hi-hat only
        (92.0,  110.0,  0.15, 0.40),   # Rebuild
        (110.0, 115.0,  0.40, 0.15),   # Thins
        (115.0, 120.0,  0.15, 0.0),    # Gone
        (120.0, 175.0,  0.0,  0.0),
    ],
}


# --------------------------------------------------------------------------
# MIDI program numbers (General MIDI)
# --------------------------------------------------------------------------

MIDI_PROGRAMS = {
    "pad":        89,   # Pad 2 (warm) — analog synth pad
    "bass":       39,   # Synth Bass 2
    "melody":     81,   # Lead 2 (sawtooth) — will be softened by velocity
    "percussion": 0,    # Channel 10 (GM percussion — program ignored)
    "hi_hat_closed": 42,   # GM percussion note
    "hi_hat_open":   46,
    "kick":          36,
    "snare_rim":     37,   # Side stick — subtle
    "shaker":        70,   # Maracas
}


# --------------------------------------------------------------------------
# Mix settings
# --------------------------------------------------------------------------

SAMPLE_RATE = 44100
BIT_DEPTH = 16

# Music ducking during voiceover narration
DUCK_DB = -6.0          # Reduce music by 6 dB when VO is active
DUCK_ATTACK_MS = 200    # Fade-down time
DUCK_RELEASE_MS = 400   # Fade-up time

# Final limiter
LIMITER_THRESHOLD_DB = -1.0
LIMITER_RATIO = 10.0    # Near brick-wall

# Output
OUTPUT_FORMAT_WAV = "wav"
OUTPUT_FORMAT_MP3 = "mp3"
MP3_BITRATE = "192k"
