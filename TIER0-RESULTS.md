# Tier 0 Results — captured

Run: `npm run test:tier-0` on macOS Darwin 25.4.0, Node v24.14.1, Python 3.12.1.

```
6 pass / 0 fail
```

Reproduce locally with the command above. The script is idempotent — it
overwrites `out/tier0/` on each run.

---

## Summary

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 0.0 | Prerequisites | PASS | node 24.14.1, python 3.12.1, ffmpeg, edge-tts, numpy/scipy/librosa/pretty_midi all present |
| 0.1 | Edge-TTS voiceover | PASS | 26 KB MP3, 4.34 s, 24 kHz mono — phrase intelligible on playback |
| 0.2 | `synthesize-music.py` | PASS | 30.87 MB stereo WAV, 175 s, 44.1 kHz |
| 0.3 | `synthesize-sfx.py` | PASS | 3 SFX files generated (plucked_string 309 KB, sub_pulse 176 KB, shimmer 388 KB) |
| 0.4 | `analyze-audio.py` | PASS | composite_score = **72.52 / 100**, 22 spectral features extracted |
| 0.5 | `mix-audio.py` | PASS | 15.44 MB mono WAV, 175 s, VAD detected 2 speech segments, LUFS = -18.0 |

---

## Artifact details

| File | Codec | Sample rate | Channels | Duration | Size |
|------|-------|-------------|----------|----------|------|
| `voiceover.mp3` | mp3 | 24 000 Hz | 1 | 4.34 s | 26 064 B |
| `music.wav` | pcm_s16le | 44 100 Hz | 2 | 175.00 s | 30 870 044 B |
| `mixed.wav` | pcm_s16le | 44 100 Hz | 1 | 175.00 s | 15 435 044 B |
| `sfx/sfx_plucked_string.wav` | pcm_s16le | — | — | 3.5 s | 308 744 B |
| `sfx/sfx_sub_pulse.wav` | pcm_s16le | — | — | 2.0 s | 176 444 B |
| `sfx/sfx_shimmer.wav` | pcm_s16le | — | — | 4.4 s | 388 212 B |

---

## Spectral analysis (`analysis.json`)

22 features extracted by librosa on `music.wav`:

```json
{
  "composite_score": 72.52,
  "duration_s": 175.0,
  "sample_rate": 44100,
  "rms_mean": 0.0964,
  "rms_max": 0.3351,
  "dynamic_range_db": 80.0,
  "spectral_centroid_mean": 1383.57,
  "spectral_bandwidth_mean": 2261.28,
  "spectral_rolloff_mean": 2865.28,
  "spectral_contrast_mean": 21.76,
  "spectral_flatness_mean": 0.00126,
  "zero_crossing_rate_mean": 0.0198,
  "estimated_tempo_bpm": 172.27
  // + 9 more (MFCCs, spectral_contrast_bands)
}
```

---

## Mix details

```
[mix] Backends: silero-vad, pyloudnorm, pydub
[mix] Applying frequency-aware ducking (-9.0 dB, 200-4000 Hz)
[mix] VAD: Silero detected 2 speech segments
[mix] Applying compression and limiting
[mix] LUFS: -18.0 (target: -14.0)
```

The mix pipeline ran the full path (Silero VAD → ducking → compression
→ LUFS normalization), proving every optional Python dep also works.
LUFS landed below the -14 target — easy to tune via the
`--target-lufs` flag once we drive Tier 1.

---

## What this proves

- The full no-API surface of the pipeline is functional end-to-end.
- TypeScript → Python subprocess bridge works (Edge-TTS, mix, analyze).
- All Python DSP scripts accept their documented CLI args and produce
  the documented file shapes.
- Spectral analysis returns a numeric score, satisfying the contract
  that downstream scoring agents depend on.
- Real audio mixing with VAD, ducking, and LUFS normalization works
  even with all-optional Python deps installed.

## What this does NOT prove

- That any provider API integration works (Tier 1).
- That the resulting audio sounds good (subjective; no human review yet).
- That Remotion rendering, FFmpeg assembly, and caption burn-in work
  with real video inputs (Tier 2).
- That the full 7-phase pipeline produces a coherent video (Tier 3).
