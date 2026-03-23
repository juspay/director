# Tara Announcement Video — Production Pipeline

Automated pipeline for generating the Tara announcement video (~3:40 runtime).

## Prerequisites

- Python 3.11+
- FFmpeg installed system-wide (`brew install ffmpeg` on macOS)
- API keys for ElevenLabs, HeyGen, and Runway

## Setup

```bash
cd docs/plans/video-production

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env with your API keys
```

## Run

```bash
# Full pipeline (all 6 phases)
python pipeline.py

# Validate config without making API calls
python pipeline.py --dry-run

# Run specific phases
python pipeline.py --phase 1          # Voiceover only
python pipeline.py --phase 1,2,4      # Voiceover + avatar + music
python pipeline.py --phase 5,6        # Composite + captions (needs assets)

# Skip Runway B-roll (uses placeholder backgrounds)
python pipeline.py --skip-broll
```

## Pipeline Phases

| Phase | Module | API | Output |
|-------|--------|-----|--------|
| 1 | `voiceover.py` | ElevenLabs | `assets/voiceover/*.mp3` |
| 2 | `avatar.py` | HeyGen | `assets/avatar/*_avatar.mp4` |
| 3 | `broll.py` | Runway | `assets/broll/*_v{1,2,3}.mp4` |
| 4 | `voiceover.py` | ElevenLabs | `assets/music/background_music.mp3` |
| 5 | `composite.py` | Local | `output/tara_announcement_no_captions.mp4` |
| 6 | `captions.py` | Local | `output/tara_announcement_final.mp4` |

## Asset Selection

Phase 3 generates 3 B-roll variants per scene. After generation, review the variants in `assets/broll/` and rename your preferred variant to `*_v1.mp4` (the pipeline uses v1 by default).

## Estimated Costs

| Service | Tier | Cost |
|---------|------|------|
| ElevenLabs | Creator | $22/mo |
| HeyGen | API Pro | $99/mo |
| Runway | Pro | $35/mo |

## Output

Final video: `output/tara_announcement_final.mp4` (1920x1080, 24fps, H.264)
