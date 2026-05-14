# Tara Sensors Announcement — Storyboard & Creative Direction

## Overview

A 10-scene pitch video introducing **Sensors** — a runtime intelligence engine that lives next to every Juspay application.
1920x1080 @ 30fps, ~70 seconds, with voiceover and background music.

Adopts the visual system established by the Hippocampus announcement (PR #16): deep navy + parallax aurora, cyan-dominant palette, heavy typography, floating neurons.

## Narrative arc

The video tells one continuous story, no backtracking:

1. **Reactive is broken.** Logs → pagers → humans → patches. We've all lived it. Not anymore.
2. **Introducing Sensors.** The product reveal — formal name, gradient wordmark, eyebrow "Introducing".
3. **The inversion.** Move the observability engine *next to* the application. It reads its own runtime, ranks its own work.
4. **The pattern.** Reads / ranks / recommends — every line grounded in a real trace.
5. **Live on Tara.** Three real catches today (JIRA webhook 500s, search_all_streams timeout, Read-tool token blowups). All caught before the page fired.
6. **It gets autonomous.** Sensors stops just reporting — opens its own research threads, files its own work.
7. **It becomes a product.** Not just internal tooling. Something we ship externally.
8. **And this is just the beginning.** The same engine, brought closer to every Juspay product: Dashboard, UPI stack, Breeze and every service inside it.
9. **The vision.** Every app on its own feedback loop. Software that improves itself, cycle by cycle.
10. **Outro.** Build What Matters.

The "reactive→proactive" message is carried by:
- Scene 1 (the loop strikethrough, ending on "Not anymore")
- Scene 5 outcome chip ("Caught before the page fired")

…not by a dedicated comparison scene, which would force the story to rewind.

## Visual identity

- **Background**: deep navy gradient (`#070C1E` → `#0B1226` → `#1E1B4B`) with parallax aurora drift and a 96×96 grid overlay
- **Accents**: Cyan `#22D3EE`, Amber `#F59E0B`, Pink `#F472B6`, Green `#34D399`, Violet `#A78BFA`, Sky `#7DD3FC`
- **Distress accent**: Red `#F87171` (only on scene 1 hook for the reactive loop)
- **Font**: Inter (400/600/700/800/900) for display; ui-monospace for technical labels
- **Floating**: 14 neuron-style points in cyan/amber/violet drift throughout
- **Watermark**: small `:: SENSORS` wordmark with a pulsing cyan dot in top-left
- **Brand reveal**: full `SENSORS` wordmark on scenes 2 (Intro), 7 (Product), 10 (Outro)
- **Tara avatar**: 1024×1536 source PNG. Uses `objectFit: cover` with `objectPosition: '50% 18%'` to show head + shoulders + brain logo (the upper ~70% of the source). Robust to source image changes. Used at 120 px in scene 5 (Live Tara) with a white border, and at 180 px in the outro.

## Scene breakdown

| # | Scene | Duration | Voiceover Script |
|---|-------|----------|------------------|
| 1 | Hook | ~9s | "Logs catch the fire. Alerts wake humans. Humans patch it... We've all lived this loop... Not anymore." |
| 2 | Intro | ~6s | "Introducing Sensors. Tara's runtime intelligence — observing itself, every cycle." |
| 3 | Inversion | ~7s | "An observability engine, right next to the application. It reads its own runtime. It ranks its own work." |
| 4 | Pattern | ~7s | "It reads telemetry. It ranks signals. It recommends fixes. Every line grounded in a real trace." |
| 5 | Live on Tara | ~13s | "Tara has Sensors today... A JIRA webhook stuck on five hundreds... A streams search timing out... The Read tool burning tokens... All caught — before the alert fired." |
| 6 | Self-fixing | ~6s | "Then Sensors stops just reporting. It opens research threads on its own. Files its own work." |
| 7 | Standalone product | ~6s | "And the engine itself becomes a product. Not just internal tooling. Something we ship." |
| 8 | Multi-app | ~12s | "And this is just the beginning... Next, every product gets one. The Dashboard... UPI... Breeze and all other stacks... An engine of its own, for each." |
| 9 | Vision | ~6s | "Every app on its own feedback loop. Software that improves itself. Cycle by cycle." |
| 10 | Outro | ~5s | "Try it in tara-dev. Powered by NeuroLink. Build what matters." |

## Real catches in scene 5

The three findings on the "Three real catches" card come from the Sensors daily reports (2026-03-21, 2026-03-25, 2026-04-05). These are the same examples the Slack announcement post should reference verbatim:

| Severity | Finding | Signal | Outcome |
|---|---|---|---|
| P1 | JIRA webhook — recurring 500s | `fp_8484abd60d9d06a6` (across 5 batches) | Backoff retry queued |
| P2 | search_all_streams — 60s timeout | `trace_stall_8m` (real user 8+ min stall) | Pagination queued |
| P2 | Read tool — 25k token blowups | `pattern_token_burn` | Auto-chunking in progress |

Outcomes use cautious "queued / in progress" wording — they reflect Sensors recommendations, not necessarily completed engineering work. Update once the work ships.

## Multi-app status (scene 8)

Status badges per Sachin's clarification (2026-05-07):

| Product | Status | Sub-line |
|---|---|---|
| Tara | LIVE | AI coding agent |
| Dashboard | NEXT | merchant control plane |
| UPI | NEXT | real-time payments |
| Breeze | NEXT | AI growth sidekick |

Only Tara is voiced as live. Everything else is future-tense, anchored by the eyebrow "And this is just the beginning" and the sub-headline "observability, brought closer to every application we build."

## Pronoun usage

Sensors is referred to as **"It"** throughout — never "She". The engine is genderless; mixing pronouns reads as inconsistent.

## Audio direction

**Voiceover**: ElevenLabs voice `90ipbRoKi4CpHXvKVtl0` (matching the Hippocampus video), `style: 0.35`. Calm-confident pacing that lifts on scene 2 (Intro reveal), scene 5 (proof), and scene 7 (standalone product).

**Background music**: Cinematic AI product launch soundtrack — building synth pads with pulsing arpeggios, deep sub bass, observability/monitoring tech vibe, calm-confident lifting to triumphant. 8% volume, looped, with 0.8s fade in/out.

## Generation pipeline

```bash
# 1. Voiceover (per-scene MP3s + durations.json)
ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover.mjs tara-sensors

# 2. Background music
ELEVENLABS_API_KEY=sk_... node scripts/generate-music.mjs tara-sensors

# 3. Render
npx remotion render src/remotion/index.ts TaraSensors out/tara-sensors.mp4
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes (for audio) | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No | Voice ID override (default: `90ipbRoKi4CpHXvKVtl0`, matching Hippocampus) |
| `ELEVENLABS_MODEL_ID` | No | TTS model override (default: `eleven_multilingual_v2`) |
