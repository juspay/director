# How to actually analyse the video

Every craft judgement made about this reproduction came from an analysis
pipeline that had never been tested. This document records the test, what it
found, and the configuration that passes it.

## The test

Ground truth was established **numerically**, by frame differencing, not by
asking a model: the reference has exactly four hard cuts, at frames
66 / 147 / 200 / 243 of 435 @30fps — t = 2.200 / 4.900 / 6.667 / 8.100 s
(`evidence/AUDIT.md`).

An analyser is handed the clip, told nothing about the cuts, and asked to find
them. Something that cannot recover four discontinuities it was never told
about has no standing to describe easing curves or lighting.

Harness: `probe-video-analysis.mjs`, `probe-variants.mjs`, `probe-ab.mjs`.
Raw results in `analysis/probe-*.json`.

## What was wrong

`analyze-seconds.mjs` — which produced every per-second craft finding — sent
**inline PNG stills**, not video. `gemini-lib.mjs` has had `uploadAndWait()` and
`videoPart()` since the beginning; the craft pass never called them. So the
model got a bag of images with no temporal signal, no timestamps, and no
motion, and was asked to judge motion.

Three faults compounded:

| | was | should be |
|---|---|---|
| Input modality | inline PNG stills | the complete video, Files API |
| Sampling rate | 1.0 fps (the default) | 24.0 fps (the API maximum) |
| Model | `gemini-2.5-pro` | `gemini-3.5-flash` / `gemini-3.1-pro-preview` |

Scored against ground truth, the old configuration finds **0 of 4 cuts** — and
reports one at 9.00s that does not exist. Twice, deterministically.

## Results

N runs per row, `--sec`-style ±0.15s tolerance:

| configuration | hits/4 per run | false pos | mean timing err | prompt tokens |
|---|---|---|---|---|
| 2.5-pro · fps 1 · low **(what was used)** | 0, 0 | 1, 1 | — | 1,635 |
| 3.1-pro · fps 24 · medium | 3, 3, 4, 4, 4 | 1,1,0,0,0 | 0.015 s | 22,377 |
| 3.5-flash · fps 24 · medium | 4, 4, 4, 4, 4 | 0 | 0.011 s | 22,377 |
| **3.1-pro · fps 24 · medium · 2× slowed** | **4, 4, 4, 4, 4** | 0 | **0.004 s** | 43,875 |
| **3.5-flash · fps 24 · medium · 2× slowed** | **4, 4, 4, 4, 4** | 0 | **0.004 s** | 43,875 |
| 3.1-pro · fps 24 · per-part HIGH | 4, 4 | 0 | 0.025 s | 88,149 |
| 3.1-pro · fps 24 · per-part ULTRA_HIGH | — | — | — | HTTP 400 |

## The configuration

**Feed the complete video, retimed 2× slower, at 24 fps, medium resolution.**

```js
{ fileData: { fileUri, mimeType }, videoMetadata: { fps: 24 } }
// config.mediaResolution = 'MEDIA_RESOLUTION_MEDIUM'
```

```sh
ffmpeg -i in.mp4 -vf "scale=720:900:flags=lanczos,setpts=2.0*PTS" -an out.mp4
```

Why each part:

- **Retiming is the single biggest accuracy win** — 0.015 s → 0.004 s, an
  eighth of a frame, and it makes 3.1-pro go from erratic (avg 3.6) to perfect.
  The discovery document caps sampling at 24 fps (`"The fps range is
  (0.0, 24.0]"`), but the source is 30 fps, so **6 of every 30 frames were never
  seen by the model at any setting**. Slowing to 15 fps lets 24 fps sampling
  cover every frame. Rescale the returned timestamps **in code** — asking the
  model to halve its own numbers is unreliable and scores as a miss when it
  simply does not comply.
- **Medium, not high.** Per-part `MEDIA_RESOLUTION_HIGH` costs 4× the tokens and
  is *worse* (0.025 s). `MEDIA_RESOLUTION_ULTRA_HIGH` appears in the discovery
  schema but the API rejects it with 400.
- **Flash is not a downgrade here.** `gemini-3.5-flash` matches
  `gemini-3.1-pro-preview` at identical token count, so analysis is cheap enough
  to run repeatedly rather than trusting one pass.
- **Resolution-match the pair before judging.** The reference is 720×900; the
  master renders at 2160×2700. `src/agents/comparator-media.ts` exists for this.
  Medium tokenisation resamples anyway, so the extra pixels buy nothing and an
  unmatched pair invites resolution-driven verdicts.

## A/B in a single request works

The docs advise one video per prompt. Both clips in one request, labelled,
resolution-matched and both 2× slowed:

| model | runs | A | B | kept distinct | tokens |
|---|---|---|---|---|---|
| 3.1-pro | 3 | 4/4 @ 0.004 s | 4/4 @ 0.004 s | yes | 87,762 |
| 3.5-flash | 3 | 4/4 @ 0.004 s | 4/4 @ 0.004 s | yes | 87,762 |

6 of 6. A full A/B of the entire clip at maximum usable fidelity costs ~88k
prompt tokens.

## Caveats that remain

- **Retimed footage misrepresents pacing.** Use it for forensic questions (what
  happens on which frame). For "does the timing *feel* right", run native speed
  as well and treat disagreement as a signal.
- **Specific claims still need numeric confirmation.** This test validates that
  the model can localise real events; it does not make its colour or geometry
  assertions true. The earlier per-second pass claimed frames 90–119 were
  identical (measured delta 0.0128) and that a blue was `#0000FF` (measured
  82,129,239). Directional readings were reliable; specific values were not.
- **`videoMetadata` is deprecated** in the discovery doc, pointing at
  `GenerateContentRequest.processing_options` — which is not exposed on v1, v1beta
  or v1alpha yet. `videoMetadata.fps` remains the only working control.

## First finding from the working pipeline

Unprompted, and on first contact, both models independently named the same
defect:

> In Video B, the cards and buttons animate by popping up onto the screen after
> each cut, whereas in Video A they are already present on the tiles.

That is the entrance animation. The reference cuts to shots already in progress;
the reproduction cuts and *then* builds. It matches the "20 soft frames, all at
shot entrances" residual already in `AUDIT.md` — previously logged as a minor
sharpness note rather than the structural staging error it is.
