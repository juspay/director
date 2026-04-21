# Tara GitHub Support Announcement — Storyboard & Creative Direction

## Overview

A 10-scene product announcement video unveiling GitHub coding support for Tara (Slack bot).
1920x1080 @ 30fps, ~60 seconds, with voiceover and background music.

## Visual Identity

- **Background**: Royal blue gradient (#1E50E0 → #1640B8 → #0F2E80) with grid overlay
- **Accents**: Gold (#FFD24A), Pink (#FF5A7A), Green (#4ADE80), Sky (#7DD3FC)
- **Platform marks**: Bitbucket blue (#2684FF), GitHub black (#0D1117)
- **Font**: Inter (400/600/700/800)
- **Floating**: 10 white circular dots drift subtly throughout

## Scene Breakdown

| # | Scene | Duration | Voiceover Script |
|---|-------|----------|------------------|
| 1 | Title | ~4s | "Tara just learned a new language. The language of GitHub." |
| 2 | Recap | ~7s | "You already know what Tara does. She reads your threads, plans with you, and ships code — straight from Slack." |
| 3 | The Drop | ~6s | "Until today, she built on Bitbucket. From today, she builds on GitHub too." |
| 4 | Same Flow | ~10s | "Same conversation. Same thread. Same Tara. Context gathered. Repo cloned. Branch configured. Code analyzed. Changes implemented. Commit pushed. Pull request created." |
| 5 | Where to Use | ~6s | "Point her at any GitHub repository your team has access to. Public, private, mono-repo, micro-repo — she handles them the same way." |
| 6 | Example: Bug Fix | ~7s | "Drop a GitHub issue link in a thread. Say fix this. Tara reads the issue, traces the code, opens a pull request with the fix." |
| 7 | Example: Feature Build | ~6s | "Share a Figma and a GitHub repo. Tara plans the feature, implements it, and pushes a PR for review — no context switch." |
| 8 | Example: Code Review | ~5s | "Tag Tara on a GitHub PR. She reviews it the way a senior engineer would — line by line, with reasoning." |
| 9 | What's Next | ~5s | "This is one of seven capabilities rolling out in Phase 1. Watch this thread." |
| 10 | Outro | ~3s | "Build what matters. Now on GitHub too." |

## Audio Direction

**Voiceover**: Warm, professional female voice (Bella `hpp4J3VqNfWAUOO0d1Us` — same as tara-skills for brand continuity). Clear enunciation, confident, upbeat but not rushed.

**Background Music**: Upbeat optimistic corporate tech soundtrack. Light playful synth arpeggios, soft electronic drums, warm bassline. 9% volume, looped, with 0.8s fade in/out. Reuse the tara-skills music track for consistency — no new music generation needed.

## Generation Pipeline

1. `ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover-tara-github.mjs` — generates 10 MP3 voiceover files + durations.json
2. `ELEVENLABS_API_KEY=sk_... node scripts/generate-music.mjs` — generates `public/voiceover/music-01.mp3` (skip if already present from tara-skills)
3. `npx remotion render TaraGithub out/tara-github.mp4` — renders the final video

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No | Voice ID override (default: Bella `hpp4J3VqNfWAUOO0d1Us`) |
| `ELEVENLABS_MODEL_ID` | No | TTS model override (default: `eleven_multilingual_v2`) |

## Reuse Notes

`TaraGithubComposition.tsx` inlines the same shared primitives as `TaraSkillsComposition.tsx` (`Background`, `FloatingShapes`, `BackgroundMusic`, `TaraAvatar`) and reuses the flow-step + parameterized example patterns. Only the headline copy, the scene-3 platform-logo moment, scene-4's 8-step pipeline, and scene-9's roadmap capsules are new. This keeps the two videos visually consistent as a series.
