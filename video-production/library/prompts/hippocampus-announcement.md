# Hippocampus Announcement — Storyboard & Creative Direction

## Overview

A 10-scene product announcement video introducing `@juspay/hippocampus` — the condensed memory SDK for AI agents.
1920x1080 @ 30fps, ~62 seconds, with voiceover and background music.

## Visual Identity

- **Background**: Deep violet gradient (#5B21B6 → #4C1D95 → #2E1065) with neural grid overlay
- **Accents**: Amber (#F59E0B), Pink (#EC4899), Green (#10B981), Cyan (#06B6D4)
- **Font**: Inter (400/600/700/800), JetBrains Mono for code
- **Floating**: 12 amber/cyan dots drift subtly (memory "neurons")
- **Logo**: Stylized hippocampus glyph — concentric arcs in amber/cyan radial gradient

## Scene Breakdown

| # | Scene | Duration | Voiceover Script |
|---|-------|----------|------------------|
| 1 | Title | ~4s | "Meet Hippocampus. Condensed memory for AI agents." |
| 2 | Problem | ~8s | "Most memory layers grow without limit. Vectors pile up. Retrieval gets noisier. Your model still misses what matters." |
| 3 | Solution | ~8s | "Hippocampus does it differently. One condensed memory per user, merged by your model on every write." |
| 4 | API surface | ~7s | "Four methods. Add. Get. Delete. Close. That is the entire surface area." |
| 5 | Storage backends | ~7s | "Four storage backends — SQLite, Redis, S3, or your own callbacks. It drops in anywhere." |
| 6 | Any model | ~7s | "Powered by NeuroLink, so every provider just works — OpenAI, Gemini, Claude, Bedrock, Vertex." |
| 7 | LoCoMo benchmark | ~10s | "Benchmarked on LoCoMo, the long-conversation memory standard. Six thousand turns compressed to two thousand words. Fifty-five percent overall. Ninety-two percent on adversarial." |
| 8 | Per-call overrides | ~5s | "Per-call prompts and word limits. Different strategies on the same instance." |
| 9 | NeuroLink auto-memory | ~5s | "Plug it into NeuroLink and memory loads itself on every call. Automatic." |
| 10 | Outro | ~5s | "npm install at-juspay-slash-hippocampus. Build agents that remember." |

## Audio Direction

**Voiceover**: Warm, professional female voice (Bella `hpp4J3VqNfWAUOO0d1Us`, default). Clear enunciation, calm-confident tempo — this is a developer-product announcement, not hype.

**Background Music**: Cerebral, focused tech soundtrack. Soft synth pads, subtle pulsing arpeggios, warm sub bass, modern AI-product feel — instrumental only, no vocals. 9% volume, looped, with 0.8s fade in/out.

## LoCoMo Benchmark — Numbers

Run on the standard `snap-research/locomo` dataset using `bench/locomo/runner.js`:

| Metric | Result |
|--------|--------|
| Overall accuracy | **55.3%** |
| Adversarial (knows what it doesn't know) | **91.5%** |
| Single-hop recall | **58.1%** |
| Open-domain reasoning | **43.9%** |
| Multi-hop | **41.3%** |
| Compression ratio | **~25× (5,800 turns → ~2,000 words)** |

The strong adversarial number means Hippocampus rarely hallucinates — when the answer isn't in memory, it says so. The compression ratio means a full multi-month conversation fits inside a single LLM prompt.

## Generation Pipeline

1. `ELEVENLABS_API_KEY=sk_... node scripts/generate-hippocampus-voiceover.mjs` — generates 10 MP3 voiceover files + durations.json into `public/hippocampus-vo/`
2. `ELEVENLABS_API_KEY=sk_... node scripts/generate-hippocampus-music.mjs` — generates background music (Music API on paid plans, SFX API fallback on free tier) into `public/hippocampus-vo/music-01.mp3`
3. `npx remotion render Hippocampus out/hippocampus.mp4` — renders the final video (requires the composition to be registered in your Remotion root)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No | Voice ID override (default: Bella `hpp4J3VqNfWAUOO0d1Us`) |
| `ELEVENLABS_MODEL_ID` | No | TTS model override (default: `eleven_multilingual_v2`) |
