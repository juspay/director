# AI Video Generation Landscape -- Q1 2026

Research conducted March 26, 2026. Covers the current state of the art in AI video
generation, with emphasis on programmatic API access for production pipelines.

**Our current pipeline uses:** Runway Gen-4.5 (text-to-video B-roll), Google Veo 3.1
(via Gemini API), and D-ID (avatar). See `broll_generator.py` and `VIDEO-API-RESEARCH.md`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Major Event: Sora Shutdown](#2-major-event-sora-shutdown)
3. [Model-by-Model Breakdown](#3-model-by-model-breakdown)
4. [Capability Matrix](#4-capability-matrix)
5. [Pricing Comparison](#5-pricing-comparison)
6. [Generation Speed](#6-generation-speed)
7. [Text-to-Video Capabilities](#7-text-to-video-capabilities)
8. [Image-to-Video Capabilities](#8-image-to-video-capabilities)
9. [Video-to-Video / Style Transfer](#9-video-to-video--style-transfer)
10. [Camera Control](#10-camera-control)
11. [Character & Scene Consistency](#11-character--scene-consistency)
12. [Compositing: Alpha Channel / Depth Maps](#12-compositing-alpha-channel--depth-maps)
13. [Open-Source / Self-Hostable Models](#13-open-source--self-hostable-models)
14. [Quality Benchmarks](#14-quality-benchmarks)
15. [Recommendations for Our Pipeline](#15-recommendations-for-our-pipeline)

---

## 1. Executive Summary

The AI video generation landscape shifted dramatically in Q1 2026:

- **Sora is dead.** OpenAI confirmed shutdown on March 24, 2026. No more API access.
- **Kling 3.0** (Feb 2026) and **Seedance 2.0** (Feb 2026) represent the Chinese labs'
  leap to 4K/60fps with native audio and multi-shot storyboarding.
- **Runway Gen-4.5** holds the #1 Elo rating (1,247) on Artificial Analysis benchmarks.
- **Google Veo 3.1** is the only model with native 4K output through a major cloud API,
  plus synchronized dialogue/audio generation.
- **LTX-2.3** and **Wan 2.2** are the open-source leaders, with LTX-2.3 offering 4K/50fps
  with synchronized audio under Apache 2.0.
- **Wan-Alpha** (CVPR 2026) is the first model to natively generate RGBA video with
  transparent backgrounds -- directly relevant to our avatar compositing pipeline.

**Bottom line for our pipeline:** Our Runway + Veo stack remains strong. The main
upgrades to consider are (1) Kling 3.0 for cost reduction and multi-shot consistency,
(2) Wan-Alpha for native transparent-background avatar generation, and (3) LTX-2.3
for self-hosted batch generation.

---

## 2. Major Event: Sora Shutdown

On March 24, 2026, OpenAI announced the complete shutdown of Sora (app + API).

**Why it died:**
- Massive GPU costs with revenue far below GPT text/code products.
- OpenAI pivoting GPU compute to GPT-5.x series and Codex ahead of IPO.
- Unresolved licensing/IP disputes (Disney deal collapsed).

**Impact on us:** None -- we never depended on Sora. But it validates our multi-vendor
strategy and makes Runway/Veo/Kling the clear remaining tier-1 options.

---

## 3. Model-by-Model Breakdown

### 3.1 Runway Gen-4.5 (our current primary)

| Attribute | Value |
|-----------|-------|
| **URL** | https://runwayml.com / https://dev.runwayml.com |
| **API** | Yes -- REST API, fully programmatic |
| **Elo Rating** | 1,247 (#1 globally) |
| **Resolution** | Up to 4K |
| **Duration** | 5-10 seconds per generation |
| **FPS** | 24fps |
| **Pricing** | 12 credits/sec = $0.12/sec ($0.01/credit) |
| **Gen Time** | ~30-90 seconds for a 5s clip |
| **Audio** | No native audio (use external TTS) |
| **Strengths** | Best overall quality, motion brushes, physical accuracy, VFX effects |
| **Weaknesses** | No native audio, 10s max duration, expensive at scale |

Also available via Runway API: **Gen-4 Turbo** (5 credits/sec = $0.05/sec, good for
prototyping), **Gen-4 Aleph** (15 credits/sec), **Act-Two** (character animation).

Runway also resells Google models: Veo 3, Veo 3.1, Veo 3.1 Fast -- all through the
same API with unified billing.

**Runway API pricing table (credits/sec, $0.01/credit):**

| Model | Credits/sec | $/sec |
|-------|------------|-------|
| Gen-4.5 | 12 | $0.12 |
| Gen-4 Turbo | 5 | $0.05 |
| Gen-4 Aleph | 15 | $0.15 |
| Gen-3 Turbo | 5 | $0.05 |
| Act-Two | 5 | $0.05 |
| Veo 3 | 40 | $0.40 |
| Veo 3.1 (with audio) | 40 | $0.40 |
| Veo 3.1 (no audio) | 20 | $0.20 |
| Veo 3.1 Fast (with audio) | 15 | $0.15 |
| Veo 3.1 Fast (no audio) | 10 | $0.10 |

### 3.2 Google Veo 3.1 (our current secondary)

| Attribute | Value |
|-----------|-------|
| **URL** | https://aistudio.google.com / https://ai.google.dev/gemini-api/docs/video |
| **API** | Yes -- Gemini API (predictLongRunning endpoint) + Vertex AI |
| **Elo Rating** | 1,226 (#2) |
| **Resolution** | 720p / 1080p / 4K (3840x2160) -- only model with native 4K |
| **Duration** | 4, 6, or 8 seconds; extendable to 60s+ via Scene Extension |
| **FPS** | 24fps (up to 60fps at 4K) |
| **Pricing** | $0.15/sec (Fast) to $0.40/sec (Standard) at 1080p; $0.35-0.60/sec at 4K |
| **Gen Time** | ~2-4 minutes for 8s clip (standard); ~60s (fast) |
| **Audio** | Native synchronized dialogue, SFX, and ambient audio |
| **Strengths** | Best audio integration, 4K, strong prompt adherence, Ingredients feature |
| **Weaknesses** | 8s max per clip, expensive at 4K, no free tier |

**Key 2026 update (Jan):** Added native 9:16 vertical video, "Ingredients to Video"
(up to 4 reference images per generation), improved character consistency.

### 3.3 Kling 3.0 (Kuaishou) -- NEW Feb 2026

| Attribute | Value |
|-----------|-------|
| **URL** | https://klingai.com / https://klingai.com/global/dev |
| **API** | Yes -- official REST API + third-party (fal.ai, PiAPI, Atlas Cloud) |
| **Elo Rating** | 1,225 (#3) |
| **Resolution** | Up to 4K (3840x2160) |
| **Duration** | 5-15s per clip; extendable to 3 minutes via stitching |
| **FPS** | 60fps (first model to hit this natively) |
| **Pricing** | $0.084-0.168/sec official; ~$0.029/sec via third-party providers |
| **Gen Time** | ~90 sec (standard), ~3-4 min (pro) |
| **Audio** | Native multilingual audio, lip-sync in 8 languages |
| **Strengths** | Best character consistency, motion brush, 6-cut multi-shot storyboarding, 60fps, cheapest premium option |
| **Weaknesses** | Some geographic access restrictions, JWT auth complexity |

**Key models in suite:**
- **Kling 3.0** -- flagship cinematic generation
- **Kling 3.0 Omni (O3)** -- subject consistency with custom voice/face cloning
- **Kling 2.6 Pro/Std** -- previous gen, still available and cheaper

**Multi-shot storyboarding:** Kling 3.0 introduced a 6-cut system that maintains
character identity across camera angles and scenes. This is directly useful for our
multi-act video structure.

### 3.4 Seedance 2.0 (ByteDance) -- NEW Feb 2026

| Attribute | Value |
|-----------|-------|
| **URL** | https://seed.bytedance.com/en/seedance2_0 |
| **API** | NOT YET AVAILABLE -- global API rollout postponed due to copyright disputes |
| **Resolution** | 2K (2560x1440) |
| **Duration** | Up to 15 seconds |
| **FPS** | 24fps |
| **Pricing** | Consumer: $19.90/mo; API (when available): ~$0.10-0.80/min |
| **Gen Time** | ~30-120 seconds |
| **Audio** | Native audio-video joint generation (not post-processed) |
| **Strengths** | Best-in-class realism, World ID for character lock, 12-file multimodal input, phoneme-level lip-sync, director-level camera control |
| **Weaknesses** | API unavailable due to Hollywood copyright disputes, TikTok/ByteDance political risk, Disney/MPA legal pressure |

**WARNING:** Despite being arguably the most technically advanced model, Seedance 2.0
is currently unusable in production pipelines due to the API freeze. Monitor
https://seed.bytedance.com for updates, but do not plan around it.

### 3.5 MiniMax Hailuo 2.3

| Attribute | Value |
|-----------|-------|
| **URL** | https://www.minimax.io / https://platform.minimax.io |
| **API** | Yes -- official REST API |
| **Elo Rating** | 1,208 |
| **Resolution** | Up to 1080p |
| **Duration** | 6-10 seconds |
| **Pricing** | ~$0.01-0.03/sec (cheapest premium model with API) |
| **Gen Time** | ~45 seconds |
| **Audio** | Limited |
| **Strengths** | Extremely cheap, good for batch generation, strong stylization (anime, ink wash, game CG), face consistency, Media Agent workflow |
| **Weaknesses** | Lower resolution ceiling, shorter duration, weaker physics |

Also offers **Hailuo 2.3 Fast** variant at 50% lower cost for batch workflows.

### 3.6 Luma Ray3.14 (Dream Machine)

| Attribute | Value |
|-----------|-------|
| **URL** | https://lumalabs.ai/ray |
| **API** | Yes -- https://docs.lumalabs.ai/docs/api |
| **Elo Rating** | 1,211 |
| **Resolution** | Native 1080p |
| **Duration** | 5-9 seconds |
| **Pricing** | From $7.99/mo subscription; API pricing varies |
| **Gen Time** | ~30-53 seconds (one of the fastest) |
| **Audio** | No |
| **Strengths** | Best video-to-video (Ray3 Modify), keyframe control, character reference, HDR pipeline, draft mode for rapid iteration, 4x faster than Ray3 |
| **Weaknesses** | Max 1080p, no native audio, third-party API only |

**Unique feature:** Ray3 Modify supports start+end frame generation (generate the
video between two keyframes). Useful for controlled transitions.

### 3.7 Pika 2.5

| Attribute | Value |
|-----------|-------|
| **URL** | https://pika.art |
| **API** | Yes -- via fal.ai (not direct) |
| **Resolution** | 720p-1080p |
| **Duration** | 5-10 seconds |
| **Pricing** | $10/mo (700 credits); API via fal.ai ~$0.20-0.45/5s video |
| **Gen Time** | ~30-40 seconds (fastest in class) |
| **Strengths** | Fastest generation, creative effects (Pikadditions, Pikaffects: inflate, melt, explode, etc.), strong for social media |
| **Weaknesses** | Lower cinematic quality, effects-focused rather than realism-focused |

### 3.8 Vidu Q3 Pro

| Attribute | Value |
|-----------|-------|
| **URL** | https://www.vidu.com |
| **API** | Yes -- official API platform |
| **Resolution** | 1080p |
| **Duration** | Up to 16 seconds |
| **Pricing** | ~$0.0375/sec (55% below industry average) |
| **Gen Time** | ~60-120 seconds |
| **Strengths** | Native audio-video generation in single pass, narrative multi-shot storytelling, good value |
| **Weaknesses** | Newer entrant, smaller ecosystem, less third-party tooling |

### 3.9 Haiper AI -- DISCONTINUED

Haiper AI has shut down its consumer webapp. The Haiper 2.5 model is no longer
available. Remove from consideration.

### 3.10 OpenAI Sora 2 -- SHUTTING DOWN

Confirmed shutdown March 24, 2026. Was $0.10-0.50/sec, up to 1080p, 25s duration.
No longer a viable option. The Disney licensing deal collapsed with it.

---

## 4. Capability Matrix

| Model | API | Max Res | Max Duration | Native Audio | I2V | V2V | Camera Ctrl | Multi-shot | Alpha/Depth |
|-------|-----|---------|-------------|--------------|-----|-----|-------------|------------|-------------|
| Runway Gen-4.5 | Direct | 4K | 10s | No | Yes | Yes | Prompt-based | No | No |
| Runway Gen-4 Turbo | Direct | 720p | 10s | No | Yes | No | Prompt-based | No | No |
| Google Veo 3.1 | Direct | 4K | 8s (ext 60s+) | Yes | Yes | No | Prompt-based | Scene Extension | No |
| Kling 3.0 | Direct | 4K | 15s (ext 3min) | Yes (8 lang) | Yes | Yes | Motion Brush | 6-cut system | No |
| Seedance 2.0 | BLOCKED | 2K | 15s | Yes | Yes | Yes | Director-level | World ID | No |
| Hailuo 2.3 | Direct | 1080p | 10s | Limited | Yes | No | Prompt-based | No | No |
| Luma Ray3.14 | Third-party | 1080p | 9s | No | Yes | Best-in-class | Keyframe | Char ref | No |
| Pika 2.5 | fal.ai | 1080p | 10s | No | Yes | Limited | No | No | No |
| Vidu Q3 | Direct | 1080p | 16s | Yes | Yes | No | Prompt-based | Yes | No |
| LTX-2.3 (OSS) | Self-host | 4K | 20s | Yes | Yes | No | Limited | No | No |
| Wan 2.2 (OSS) | fal/Replicate | 720p-1080p | 5-10s | No | Yes | No | Limited | No | No |
| Wan-Alpha (OSS) | Self-host | 832x480 | ~3s | No | No | No | No | No | YES (RGBA) |

---

## 5. Pricing Comparison

### Per-second cost (5-second clip at default resolution)

| Model | $/sec | 5s clip cost | Notes |
|-------|-------|-------------|-------|
| **Hailuo 2.3** | $0.01-0.03 | $0.05-0.15 | Cheapest premium API |
| **Kling 3.0 (third-party)** | $0.029 | $0.15 | Via PiAPI/Atlas Cloud |
| **Vidu Q3** | $0.038 | $0.19 | |
| **Wan 2.2 (fal.ai)** | $0.05-0.10 | $0.25-0.50 | Open-source hosted |
| **Runway Gen-4 Turbo** | $0.05 | $0.25 | Our current B-roll model |
| **Kling 3.0 (official)** | $0.084-0.168 | $0.42-0.84 | |
| **Veo 3.1 Fast (no audio)** | $0.10 | $0.50 | |
| **Runway Gen-4.5** | $0.12 | $0.60 | Our current primary |
| **Veo 3.1 Fast (audio)** | $0.15 | $0.75 | |
| **Pika 2.5 (fal.ai)** | ~$0.04-0.09 | $0.20-0.45 | |
| **Veo 3.1 Standard** | $0.20-0.40 | $1.00-2.00 | |
| **Veo 3.1 4K** | $0.35-0.60 | $1.75-3.00 | |

### Budget for a 3-minute video (10 scenes, ~18s of generated footage)

| Strategy | Cost | Quality |
|----------|------|---------|
| All Hailuo 2.3 | ~$0.50 | Good (1080p, no audio) |
| All Kling 3.0 (third-party) | ~$0.52 | High (4K, multi-shot) |
| Runway Gen-4 Turbo (B-roll only) | ~$0.90 | High (720p) |
| Mix: Runway Gen-4.5 + Veo 3.1 Fast | ~$2.50 | Very High |
| All Veo 3.1 Standard 4K | ~$10.80 | Excellent (4K + audio) |

---

## 6. Generation Speed

| Model | 5s clip gen time | 10s clip gen time | Notes |
|-------|-----------------|-------------------|-------|
| **Pika 2.5** | ~30-40s | ~45s | Fastest |
| **Luma Ray3.14** | ~30-53s | -- | Very fast with Draft Mode |
| **Runway Gen-4 Turbo** | ~30s | ~60s | Fast |
| **Hailuo 2.3** | ~45s | ~60s | |
| **Runway Gen-4.5** | ~60-90s | ~90-120s | |
| **Kling 3.0 Standard** | ~90s | ~120s | |
| **Veo 3.1 Fast** | ~60s | -- | 8s max |
| **Kling 3.0 Pro** | ~3-4 min | ~4-5 min | |
| **Veo 3.1 Standard** | ~2-4 min | -- | 8s max |
| **Sora 2 Pro** | ~4 min | ~6 min | SHUTTING DOWN |

For our pipeline (generating ~6 B-roll clips): using Runway Gen-4 Turbo in parallel,
total wall-clock time is ~90 seconds. Switching to Kling 3.0 would be ~3 minutes.

---

## 7. Text-to-Video Capabilities

### Resolution landscape (March 2026)

- **4K native:** Veo 3.1, Kling 3.0, LTX-2.3 (open source)
- **2K:** Seedance 2.0
- **1080p:** Runway Gen-4.5, Hailuo 2.3, Luma Ray3.14, Vidu Q3, Pika 2.5
- **720p:** Runway Gen-4 Turbo, Wan 2.2

### Duration limits

- **25s:** Sora 2 (shutting down)
- **20s:** LTX-2.3 (open source)
- **16s:** Vidu Q3
- **15s:** Kling 3.0, Seedance 2.0
- **10s:** Runway Gen-4.5, Hailuo 2.3, Pika 2.5
- **8s:** Veo 3.1 (but Scene Extension chains to 60s+)
- **5s:** Wan 2.2

### Controllability

Best prompt adherence: Runway Gen-4.5, Veo 3.1, Seedance 2.0.
Best motion control: Kling 3.0 (Motion Brush), Luma Ray3.14 (Keyframe Control).
Best physics simulation: Runway Gen-4.5, Seedance 2.0.

---

## 8. Image-to-Video Capabilities

Critical for our pipeline -- animating product screenshots and stills.

### Best for product screenshot animation

1. **Runway Gen-4 Turbo / Gen-4.5** (image_to_video endpoint) -- Already in our
   pipeline via Runway API. Supports `promptImage` URL + `promptText` for motion
   direction. Strong at maintaining source image fidelity.

2. **Kling 3.0** (image2video endpoint) -- Produces most natural-looking movement,
   especially for portrait-to-video. Strong lip-sync for talking-head content.

3. **Veo 3.1** (Ingredients to Video) -- Accepts up to 4 reference images per
   generation. Good for maintaining brand consistency across scenes.

4. **Luma Ray3 Modify** -- Best for controlled animation from keyframes. Can generate
   video between a start frame and end frame.

5. **Wan 2.1/2.2 I2V** (open source) -- Available on fal.ai and Replicate. Cheapest
   option for batch I2V work. ~$0.10/sec on fal.ai.

### For our use case (animating UI screenshots)

Recommendation: Continue using Runway Gen-4 Turbo for I2V. Add Kling 3.0 as fallback
for scenes requiring more natural motion. For batch/prototype work, use Wan 2.2 on
fal.ai at 1/5 the cost.

---

## 9. Video-to-Video / Style Transfer

| Model | V2V Quality | Key Feature |
|-------|------------|-------------|
| **Luma Ray3 Modify** | Best-in-class | Modify Video: change style while preserving motion/structure |
| **Kling 3.0** | Excellent | V2V endpoint with style/subject transfer |
| **Seedance 2.0** | Excellent | Reference-based style transfer (API blocked) |
| **Runway Gen-4.5** | Good | Scene relighting, VFX effects overlay |
| **Pika 2.5** | Good | Pikaffects: material/physics effects (melt, inflate, etc.) |

For transforming existing footage to different visual styles, **Luma Ray3 Modify** is
the current leader. It preserves the motion and structure of the source video while
applying dramatic style changes.

---

## 10. Camera Control

### Explicit camera control (not just prompt-based)

| Model | Control Type | Movements | Precision |
|-------|-------------|-----------|-----------|
| **Kling 3.0** | Motion Brush | Custom per-region motion vectors | High |
| **Seedance 2.0** | Director Controls | Full cinematic grammar (API blocked) | Highest |
| **Luma Ray3.14** | Keyframe Control | Start/end frame interpolation | High |
| **Higgsfield** | 50+ Camera Presets | Pan, zoom, dolly, orbit, crane | High |
| **Imagera** | Path Editor | Custom camera path curves | Medium |
| **Runway Gen-4.5** | Prompt-based only | Described in text | Medium |
| **Veo 3.1** | Prompt-based only | Described in text | Medium |
| **NVIDIA GEN3C** | 3D Camera Poses | Full 6DOF from depth maps | Research-only |

**For our pipeline:** Our current approach of embedding camera instructions in text
prompts (see `broll_generator.py` prompts: "Slow smooth dolly push-in", "Slow orbital
camera movement") works adequately with Runway Gen-4.5. For more precise control,
Kling 3.0's Motion Brush or Luma's Keyframe Control would be upgrades.

---

## 11. Character & Scene Consistency

This was the biggest pain point in AI video through 2025. The 2026 generation has
made significant progress:

### Native multi-shot consistency

| Model | Approach | Effectiveness |
|-------|----------|---------------|
| **Kling 3.0** | 6-cut multi-shot storyboarding | Best -- characters locked across angles/scenes |
| **Seedance 2.0** | World ID | Best (but API unavailable) |
| **Kling O3** | Custom subject/voice cloning from image/video input | Excellent |
| **Veo 3.1** | Ingredients to Video (4 reference images) | Good |
| **Luma Ray3.14** | Character Reference system | Good |
| **LTX Studio** | Elements system (persistent characters) | Good |

### Practical workflow for our multi-act video

1. Generate a reference image of each key character/scene.
2. Use Kling 3.0's multi-shot storyboard to generate 6 consistent cuts per scene.
3. For cross-scene consistency: extract the last frame of each clip as the reference
   for the next (frame-to-frame chaining).
4. For avatar (Tara): Use Kling O3's voice/face cloning or continue with D-ID +
   green screen removal.

---

## 12. Compositing: Alpha Channel / Depth Maps

### Current state

No mainstream commercial video generation model outputs RGBA (transparent background)
video natively. Our current pipeline uses green screen + FFmpeg colorkey
(see `green_screen.py`).

### Wan-Alpha (CVPR 2026) -- game-changer for compositing

| Attribute | Value |
|-----------|-------|
| **URL** | https://github.com/WeChatCV/Wan-Alpha |
| **License** | Open source (research) |
| **Base** | Wan2.1-14B with custom RGB-A VAE |
| **Resolution** | 832x480 |
| **Output** | Native RGBA video with true transparency |
| **Capabilities** | Semi-transparent objects, glow effects, fine hair detail |
| **Hardware** | 8 GPUs with FSDP |
| **Status** | Checkpoints released March 2026 |

Wan-Alpha generates video with stable transparency directly -- no green screen, no
post-processing keying. This could replace our entire green_screen.py pipeline for
avatar compositing if resolution improves.

### Other compositing approaches

- **CorridorKey** (open source) -- Neural network for perfect green screen separation.
  Reconstructs un-multiplied foreground color and produces clean linear alpha.
- **Beeble** -- Transforms footage into rotoscoped, camera-tracked, relightable 2.5D
  assets with AI rotoscoping.
- **NVIDIA Maxine VFX SDK** -- AI Green Screen filter for real-time background removal.
- **VEGAS Pro Z-Depth** -- AI depth map compositing for video editing.

### Depth map generation

Most video models do not expose depth maps. For depth-based compositing:
- Use **Depth Anything V2** (open source) to extract depth maps from generated clips.
- Use **Marigold** for high-quality monocular depth estimation.
- Post-process with FFmpeg or After Effects for parallax/3D effects.

---

## 13. Open-Source / Self-Hostable Models

### Tier 1: Production-viable

| Model | Params | Resolution | Duration | Audio | License | VRAM | Notes |
|-------|--------|-----------|----------|-------|---------|------|-------|
| **LTX-2.3** | 22B | 4K @ 50fps | 20s | Yes (synced) | Apache 2.0 | 24GB+ | Best open-source overall. First with 4K+audio. |
| **Wan 2.2** | 14B | 720p-1080p | 5-10s | No | Apache 2.0 | 16-24GB | Most cinematic open-source. Tops leaderboards. |
| **Wan 2.1** | 14B/1.3B | 480p-720p | 5s | No | Apache 2.0 | 8-24GB | Smaller variants for limited hardware. |

### Tier 2: Good for specific use cases

| Model | Params | Resolution | Duration | License | Notes |
|-------|--------|-----------|----------|---------|-------|
| **CogVideoX** | 2B/5B | 480p-720p | 6-10s | Apache 2.0 | From Tsinghua/Zhipu. Good fine-tuning pipeline. |
| **HunyuanVideo 1.5** | -- | 720p | 5s | Open | From Tencent. Strong quality/VRAM ratio. |
| **Wan-Alpha** | 14B+ | 832x480 | ~3s | Research | RGBA output! For compositing. CVPR 2026. |
| **SkyReels V1** | -- | 720p | 5s | Open | Cinematic realism focus. |
| **MAGI-1** | -- | 720p | 5-10s | Open | Long-form synthesis. |

### Tier 3: Legacy / niche

| Model | Notes |
|-------|-------|
| **AnimateDiff** | Adds motion to SD 1.5/SDXL images. Not standalone. 8-12GB VRAM. |
| **Stable Video Diffusion (SVD 2.0)** | Image-to-video, up to 60s, 1.5B params. Fine-tunable. |
| **CogVideo (original)** | Superseded by CogVideoX. |
| **Text2Video-Zero** | Minimal VRAM, minimal quality. |

### Self-hosting economics

Hosting Wan 2.2 on an A100 (80GB) costs ~$1.50-3.00/hr. At ~150 seconds per 5s clip
generation, that works out to ~$0.06-0.13 per clip -- comparable to fal.ai pricing
but with full control and no rate limits.

For LTX-2.3, expect 2-4x the compute cost but with 4K output and audio.

### Best interface for local models

**ComfyUI** is the standard for running video models locally. Node-based workflow,
supports most open-source models, active community.

---

## 14. Quality Benchmarks

### Elo Ratings (Artificial Analysis Video Arena, March 2026)

| Rank | Model | Elo |
|------|-------|-----|
| 1 | Runway Gen-4.5 | 1,247 |
| 2 | Google Veo 3.1 | 1,226 |
| 3 | Kling 3.0 | 1,225 |
| 4 | Seedance 2.0 | ~1,220 (est.) |
| 5 | Luma Ray3.14 | 1,211 |
| 6 | MiniMax Hailuo 2.3 | 1,208 |
| 7 | Sora 2 | 1,206 |

### FVD / FID Scores

No publicly disclosed FVD (Frechet Video Distance) or FID (Frechet Inception Distance)
scores from the major commercial models as of March 2026. The industry has moved to
human-preference Elo ratings as the primary benchmark.

### Key quality differentiators

- **Physical accuracy:** Runway Gen-4.5 (best), Seedance 2.0
- **Cinematic color grading:** Sora 2 was best (now dead), Runway Gen-4.5
- **Motion fluidity:** Kling 3.0 (best for action), Seedance 2.0
- **Human realism:** Kling 3.0 (best faces/movements), Seedance 2.0
- **Audio quality:** Veo 3.1 (best overall), Seedance 2.0 (native joint generation)

---

## 15. Recommendations for Our Pipeline

### Immediate (no migration needed)

Our current stack is strong:
- **Runway Gen-4.5** via direct API for cinematic B-roll (Elo #1)
- **Veo 3.1 via Runway API** for scenes needing synchronized audio
- **D-ID + green screen removal** for Tara avatar

### Short-term upgrades (next production cycle)

1. **Add Kling 3.0 as B-roll provider** -- $0.029/sec via third-party (vs $0.12/sec
   for Gen-4.5). Use for scenes where cost matters more than peak quality. Its
   multi-shot storyboarding would improve cross-scene consistency.

2. **Add Hailuo 2.3 for prototype/draft generation** -- At $0.01-0.03/sec, use for
   rapid prompt iteration before committing to expensive Gen-4.5 generations.

3. **Switch `broll_generator.py` to support multiple backends** -- Abstract the
   generation behind a provider interface so we can route different scenes to
   different models based on requirements (quality vs cost vs speed).

### Medium-term upgrades (next quarter)

4. **Evaluate Wan-Alpha for avatar compositing** -- If resolution improves beyond
   832x480, native RGBA generation could eliminate our green screen pipeline entirely.

5. **Self-host LTX-2.3 or Wan 2.2** for unlimited batch generation during development
   and prototyping. Estimated cost: ~$0.06-0.13/clip on rented A100.

6. **Adopt Kling 3.0's multi-shot storyboarding** for our multi-act video structure.
   Generate all 6+ scenes with consistent characters in a single storyboard session.

### Models to watch

- **Seedance 2.0** -- Most technically advanced but API frozen. If the copyright
  disputes resolve, it becomes the top choice for cinematic production.
- **NVIDIA GEN3C** -- Full 6DOF camera control from 3D depth maps. Currently research
  only but could be transformative for precise camera work.
- **Google Veo 4** -- Expected later 2026. Likely to push 4K quality further.

### Models to avoid

- **Sora 2** -- Shutting down. Do not build any new dependencies on it.
- **Haiper AI** -- Discontinued.
- **Seedance 2.0 in production** -- Until API access is restored.

---

## API Quick Reference

### Direct APIs (we control the integration)

| Provider | Auth Method | Base URL | Docs |
|----------|------------|----------|------|
| Runway | Bearer token | `https://api.dev.runwayml.com/v1` | https://docs.dev.runwayml.com |
| Google Veo | API key header | `https://generativelanguage.googleapis.com/v1beta` | https://ai.google.dev/gemini-api/docs/video |
| Kling | JWT (HS256) | `https://api.klingapi.com/v1` | https://klingai.com/global/dev |
| MiniMax | Bearer token | `https://api.minimax.io/v1` | https://platform.minimax.io/docs |
| Luma | Bearer token | `https://api.lumalabs.ai` | https://docs.lumalabs.ai |
| Vidu | Bearer token | `https://api.vidu.com` | https://docs.vidu.com |

### Aggregator APIs (multi-model access, single billing)

| Provider | Models Available | URL |
|----------|----------------|-----|
| fal.ai | Wan 2.2, Kling, Pika 2.5, Veo 3.1, LTX, Sora 2 | https://fal.ai |
| Replicate | Wan 2.2, PixVerse, Kling, Hailuo, Sora 2 | https://replicate.com |
| Atlas Cloud | Kling 3.0, Hailuo, Veo 3.1 (30% cheaper) | https://atlascloud.ai |
| WaveSpeed | 600+ models, no waitlists | https://wavespeed.ai |
| PiAPI | Kling, Seedance, various | https://piapi.ai |

---

*Last updated: 2026-03-26. Next review recommended when Seedance 2.0 API status changes
or when Google announces Veo 4.*
