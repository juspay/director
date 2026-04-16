# Tara Skills Announcement — Storyboard & Creative Direction

## Overview

A 10-scene product announcement video introducing the Skills feature for Tara (Slack bot).
1920x1080 @ 30fps, ~60 seconds, with voiceover and background music.

## Visual Identity

- **Background**: Royal blue gradient (#1E50E0 → #1640B8 → #0F2E80) with grid overlay
- **Accents**: Gold (#FFD24A), Pink (#FF5A7A), Green (#4ADE80), Sky (#7DD3FC)
- **Font**: Inter (400/600/700/800)
- **Floating**: 10 white circular dots drift subtly throughout

## Scene Breakdown

| # | Scene | Duration | Voiceover Script |
|---|-------|----------|------------------|
| 1 | Title | ~4s | "Tara has Skills now. A new feature for everyone using Tara." |
| 2 | What are Skills | ~8s | "Skills are elaborate steps or instructions for repetitive tasks. Create them once, and Tara reuses them whenever they're needed." |
| 3 | Slash Commands | ~9s | "Four slash commands run the show. Skill-create, skill-update, skill-list, and skill-delete. These commands only work inside the tara-skills channel." |
| 4 | Approval Flow | ~6s | "Each command raises a request. Once approved, the skill goes live, and Tara picks it up automatically." |
| 5 | Scoping | ~5s | "Skills are scoped. Make them global, or specific to a single channel." |
| 6 | Example: ACL Finder | ~7s | "Here's an ACL Finder skill. Instructions tell Tara where to find ACL definitions in the dashboard codebase." |
| 7 | Example: Jira-First | ~6s | "A Jira-first coding skill creates a ticket in the example project before any implementation begins." |
| 8 | Example: Blend UI | ~5s | "And a Blend UI skill — always use the shared component library instead of raw markup." |
| 9 | Coming Soon | ~5s | "And coming soon — Tara will start creating skills for you, automatically." |
| 10 | Outro | ~3s | "Try it out today. Build what matters. Not XYNE." |

## Audio Direction

**Voiceover**: Warm, professional female voice (Bella or similar). Clear enunciation, upbeat but not rushed.

**Background Music**: Upbeat optimistic corporate tech soundtrack. Light playful synth arpeggios, soft electronic drums, warm bassline. 9% volume, looped, with 0.8s fade in/out.

## Generation Pipeline

1. `ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover.mjs` — generates 10 MP3 voiceover files + durations.json
2. `ELEVENLABS_API_KEY=sk_... node scripts/generate-music.mjs` — generates background music (Music API on paid plans, SFX API fallback on free tier)
3. `npx remotion render TaraSkills out/tara-skills.mp4` — renders the final video

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No | Voice ID override (default: Bella `hpp4J3VqNfWAUOO0d1Us`) |
| `ELEVENLABS_MODEL_ID` | No | TTS model override (default: `eleven_multilingual_v2`) |
