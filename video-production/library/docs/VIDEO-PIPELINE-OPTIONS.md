# AI Video Pipeline Options — Research Summary

## The Core Problem

Our current pipeline (ElevenLabs + D-ID + Runway + Remotion) has:
- Avatar watermarks (D-ID free tier)
- Audio-video sync issues (duration mismatches)
- B-roll watermarks (Runway free tier)
- Manual composition that breaks

## What Works in Industry (2026)

### The Winning Pattern: Audio-First Pipeline

Every successful automated video pipeline in 2026 follows the same pattern:

```
Script → Audio FIRST → Video matched to audio duration → FFmpeg assembly
```

Audio drives timing. Not the other way around.

---

## Option 1: Pokemon Pipeline Pattern (RECOMMENDED)

**Source:** github.com/bhancockio/pokemon-ai-video-generator

The cleanest architecture found. Uses Claude Code as orchestrator + simple Python scripts.

### Architecture:
```
Claude Agent (orchestrator)
  ├── generate_audio.py    → ElevenLabs API (voiceover per scene)
  ├── generate_video.py    → Kling 2.5 API via KIE.ai (video per scene)
  ├── generate_sfx.py      → ElevenLabs Sound Effects API
  └── assemble_video.py    → FFmpeg (trim + sync + concatenate)
```

### Key Design Decisions:
1. **Each script does ONE thing** — calls one API, returns one file
2. **assembly_manifest.json** — maps video→audio→sfx for each clip
3. **FFmpeg trims video to audio duration** — not the other way around
4. **Async polling** — polls Kling API every 5-10s, 10min timeout
5. **No MoviePy** — pure FFmpeg for reliability

### Why This Is Better Than What We Have:
- Audio-first (no sync issues)
- FFmpeg trims video to match audio (no gaps/overlaps)
- Simple scripts (no complex Remotion builds)
- Manifest-based assembly (easy to debug)

---

## Option 2: n8n Workflow Pipeline

**Source:** n8n.io workflow templates

### Architecture:
```
n8n (visual workflow orchestrator)
  ├── OpenAI → Script generation
  ├── Flux → Image generation (keyframes)
  ├── Kling → Image-to-video (animate keyframes)
  ├── ElevenLabs → Voiceover
  └── Creatomate → Final composition with templates
```

### Pros:
- Visual workflow editor
- Self-hostable
- Pre-built templates available
- Handles async API polling natively

### Cons:
- Another tool to learn/maintain
- Creatomate subscription for composition
- Less control than code-based approach

---

## Option 3: Hybrid Remotion + API Pipeline

Keep Remotion for text/UI scenes, use APIs for cinematic scenes.

### Architecture:
```
Pipeline Script (Node.js/Python)
  ├── ElevenLabs → Generate all voiceovers FIRST
  ├── ffprobe → Get exact durations
  ├── Kling/Runway → Generate B-roll matched to audio durations
  ├── Remotion → Render text/UI scenes (kinetic text, screenshots, roadmap)
  └── FFmpeg → Assemble: Remotion scenes + API scenes + audio
```

### Pros:
- Leverages existing Remotion work (text scenes are good)
- Best quality for UI/screenshot scenes
- API for cinematic scenes only

### Cons:
- Two rendering systems to maintain
- More complex assembly

---

## Option 4: Kling 3.0 + ElevenLabs (Simplest)

### Architecture:
```
1. ElevenLabs → Generate all voiceover clips
2. ffprobe → Get durations
3. Kling 3.0 Audio-to-Video → Feed audio + image → synced video
4. FFmpeg → Concatenate all clips
```

### Why Kling 3.0:
- **$0.03/sec** (cheapest premium option)
- **Up to 120s per generation** (longest)
- **Audio-to-Video mode** — native audio sync (no manual alignment!)
- **4K output**
- **API available**

### The Key Insight:
Kling 3.0's Audio-to-Video mode takes your voiceover audio as INPUT and generates video synced to it. This eliminates the entire sync problem.

---

## Cost Comparison (for 3-minute video, 10 scenes)

| Approach | Video Cost | Audio Cost | Total | Quality |
|----------|-----------|------------|-------|---------|
| Pokemon Pattern (Kling) | ~$5.40 | ~$1.00 | ~$6.40 | High |
| Pokemon Pattern (Runway) | ~$27.00 | ~$1.00 | ~$28.00 | High |
| n8n + Creatomate | ~$5.40 + $19/mo | ~$1.00 | ~$25.40 | Medium-High |
| Hybrid Remotion + Kling | ~$2.70 (B-roll only) | ~$1.00 | ~$3.70 | High |
| Kling Audio-to-Video | ~$5.40 | ~$1.00 | ~$6.40 | Highest (native sync) |
| Synthesia (avatar) | ~$89/mo plan | included | ~$89.00 | Medium |

---

## RECOMMENDATION

### For Tara Video RIGHT NOW:

**Go with Option 1 (Pokemon Pattern) + Kling 3.0 API:**

1. We already have ElevenLabs voiceovers (8 clips, good quality)
2. Use Kling 3.0 API for cinematic B-roll (scenes 2, 3) — cheapest, longest, best quality
3. Keep Remotion renders for text/UI scenes (1, 4, 5A-C, 6, 7, 8) — already working
4. FFmpeg assembly with manifest — trim video to audio, concatenate

**Total cost: ~$3-5 for the 2 B-roll scenes**

### For Future Videos:

Build the Pokemon-pattern pipeline as a reusable tool:
- `scripts/generate_voiceover.py` → ElevenLabs
- `scripts/generate_video.py` → Kling 3.0 API
- `scripts/generate_sfx.py` → ElevenLabs SFX
- `scripts/assemble.py` → FFmpeg with manifest
- `manifest.json` → Scene → audio → video → sfx mapping

This becomes your reusable video factory.

---

## API Quick Reference

### Kling 3.0 API
- Sign up: https://klingai.com/developer
- Text-to-video: POST /v1/videos/text2video
- Image-to-video: POST /v1/videos/image2video
- Audio-to-video: POST /v1/videos/audio2video
- Pricing: ~$0.03/sec
- Max duration: 120s
- Resolution: up to 4K

### ElevenLabs (already configured)
- Voice ID: 1qEiC6qsybMkmnNdVMbK
- Model: eleven_v3
- Quality: mp3_44100_128

### Runway Gen-4.5 (already configured)
- Text-to-video: POST /v1/text_to_video
- Model: gen4.5
- Pricing: ~$0.05-0.15/sec
- Max duration: 45s

### FFmpeg Assembly Pattern
```bash
# Trim video to match audio duration
AUDIO_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio.mp3)
ffmpeg -i video.mp4 -t $AUDIO_DUR -c:v copy -an trimmed_video.mp4

# Combine video + audio
ffmpeg -i trimmed_video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest scene.mp4

# Concatenate all scenes
ffmpeg -f concat -safe 0 -i manifest.txt -c copy final.mp4
```
