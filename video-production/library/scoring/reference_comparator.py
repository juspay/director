#!/usr/bin/env python3
# ORIGIN: video-production/v2/analyze_video.py
# Extracted to library/scoring/ for reuse across pipeline versions.
"""
Video Analysis Pipeline using Gemini via Vertex AI.

Uploads videos to Gemini and runs multimodal analysis with detailed scoring.
Supports three modes:
  1. reference  — Analyze reference videos to extract visual benchmarks
  2. score      — Score our video against reference benchmarks + spec
  3. compare    — Side-by-side comparison of our video vs references

Usage:
  python3 analyze_video.py reference   # Analyze reference videos
  python3 analyze_video.py score       # Score tara_v2.mp4
  python3 analyze_video.py compare     # Compare our video vs references
  python3 analyze_video.py score --iteration 2  # Tag as iteration 2
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

# Set up credentials from root .env if not already set
ROOT_DIR = Path(__file__).resolve().parents[4]  # curator/
ENV_FILE = ROOT_DIR / ".env"

def load_env():
    """Load environment variables from .env file."""
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and value and key not in os.environ:
                        os.environ[key] = value

load_env()

from google import genai
from google.genai import types

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT = os.environ.get("GOOGLE_VERTEX_PROJECT", "dev-ai-beta")
LOCATION = os.environ.get("GOOGLE_VERTEX_LOCATION", "us-east5")
CREDS_FILE = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
MODEL = "gemini-2.5-pro"

# Paths
V2_DIR = Path(__file__).resolve().parent
REFERENCES_DIR = V2_DIR / "references"
OUR_VIDEO = V2_DIR / "remotion" / "out" / "tara_v2.mp4"
ANALYSIS_DIR = V2_DIR / "analysis"
ANALYSIS_DIR.mkdir(exist_ok=True)

REF_SUPAHUB = REFERENCES_DIR / "ref_supahub_zelios.mp4"
REF_ELEVENLABS = REFERENCES_DIR / "ref_elevenlabs_conv.mp4"

# ---------------------------------------------------------------------------
# Client setup
# ---------------------------------------------------------------------------
def get_client() -> genai.Client:
    """Create Gemini client via Vertex AI."""
    print(f"  Connecting to Vertex AI: project={PROJECT}, location={LOCATION}")
    if CREDS_FILE:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDS_FILE
    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    return client


def load_video_as_part(video_path: Path) -> types.Part:
    """Load a video file as an inline Part for Vertex AI."""
    size_mb = video_path.stat().st_size / 1024 / 1024
    print(f"  Loading {video_path.name} ({size_mb:.1f} MB) as inline data...")

    video_bytes = video_path.read_bytes()

    # Determine mime type
    suffix = video_path.suffix.lower()
    mime_map = {".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime"}
    mime_type = mime_map.get(suffix, "video/mp4")

    part = types.Part.from_bytes(data=video_bytes, mime_type=mime_type)
    print(f"  Loaded: {video_path.name} ({mime_type})")
    return part


def analyze(client: genai.Client, prompt: str, video_parts: list, temperature: float = 0.3) -> tuple:
    """Send a multimodal prompt with video(s) and return the text response."""
    parts = list(video_parts)  # Copy the video parts
    parts.append(types.Part.from_text(text=prompt))

    print(f"  Sending to {MODEL} ({len(video_parts)} video(s), ~{len(prompt)} chars prompt)...")

    response = client.models.generate_content(
        model=MODEL,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=8192,
            thinking_config=types.ThinkingConfig(thinking_budget=4096),
        ),
    )

    # Extract text from response
    text = ""
    candidates = response.candidates
    if candidates and len(candidates) > 0:
        content = candidates[0].content
        if content and content.parts:
            for part in content.parts:
                if hasattr(part, 'text') and part.text:
                    text += part.text

    # Save raw response metadata
    usage = {
        "model": MODEL,
        "timestamp": datetime.now().isoformat(),
        "prompt_length": len(prompt),
        "num_videos": len(video_parts),
    }
    if hasattr(response, 'usage_metadata') and response.usage_metadata:
        um = response.usage_metadata
        usage["prompt_tokens"] = getattr(um, 'prompt_token_count', None)
        usage["response_tokens"] = getattr(um, 'candidates_token_count', None)
        usage["total_tokens"] = getattr(um, 'total_token_count', None)

    return text, usage


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
REFERENCE_ANALYSIS_PROMPT = """You are an expert video production analyst specializing in SaaS product explainer videos and motion design.

I'm showing you {count} reference video(s) that represent our target quality level for a product announcement video we're building.

For EACH reference video, provide an extremely detailed analysis covering:

## 1. VISUAL DESIGN LANGUAGE
- Color palette (specific hex codes if identifiable, or descriptive)
- Background treatment (solid, gradient, texture, particle effects, etc.)
- Typography style (font weight, size hierarchy, animation style)
- Icon/illustration style (flat, 3D, isometric, etc.)
- Overall visual density (minimal, moderate, rich)

## 2. MOTION DESIGN QUALITY
- Animation easing (linear, ease-in-out, spring/bounce, custom curves)
- Entrance animations (fade, slide, scale, morph, etc.)
- Exit animations (how elements leave the screen)
- Stagger timing between elements (exact millisecond estimates)
- Micro-animations (subtle movements that add polish)
- Camera/viewport movements (pans, zooms, parallax)
- Particle effects or ambient motion

## 3. SCENE TRANSITIONS
- Types of transitions used (cuts, fades, wipes, morphs, etc.)
- Duration of transitions (in seconds)
- Use of motion blur or depth of field
- Scene-to-scene visual continuity

## 4. LAYOUT & COMPOSITION
- Screen regions used (full screen, split screen, thirds, etc.)
- Whitespace/breathing room management
- Information hierarchy (what draws the eye first)
- Use of visual metaphors

## 5. PACING & RHYTHM
- How long each visual element stays on screen
- Visual density per second (elements visible simultaneously)
- Rest beats (moments of visual simplicity)
- Build-up and release patterns

## 6. PRODUCTION VALUE INDICATORS
- What specifically makes this look "premium" vs "template"?
- Subtle details that elevate quality
- Things that would be expensive/time-consuming to replicate

## 7. SPECIFIC TECHNIQUES TO STEAL
- List 10+ specific visual techniques we should replicate
- Include timestamp references for each technique

Be extremely specific and actionable. We need to reverse-engineer these production techniques."""

SCORING_PROMPT = """You are an expert video production critic. I'm showing you a product announcement video for "Tara" — an AI coding agent that lives in Slack.

This video was built with Remotion (React-based video framework) using programmatic animations. It's a 2D motion graphics explainer video, NOT live action.

## CONTEXT
The video has 7 scenes:
1. **Trigger** (0:00-0:13): Bug report arrives in Slack, Tara activates
2. **Analysis** (0:13-0:30): Tara investigates — reads screenshot, searches code, checks JIRA
3. **Discussion** (0:30-1:14): Team discusses in thread, plan evolves, then THE FORK — thread splits into 3 parallel branches (hero visual)
4. **Build** (1:14-1:37): Three parallel coding agent tracks with progress bars
5. **Ecosystem** (1:37-1:56): Hub-and-spoke diagram of connected tools
6. **Numbers** (1:56-2:06): Kinetic typography stats — "50+ tools, 16+ file types"
7. **Vision** (2:06-2:22): Constellation of threads forming Tara logo, "Build what matters"

## TARGET QUALITY
We're aiming for the visual quality of professional SaaS explainer videos (Zelios agency style). Clean 2D motion graphics, dark navy background (#0f172a), warm amber accents (#d97706), smooth spring animations, staggered reveals.

## SCORING RUBRIC — Rate each dimension 1-10 with SPECIFIC feedback:

### A. MOTION DESIGN QUALITY (weight: 25%)
1. **Animation smoothness**: Do elements move with professional easing? Any jarring pops?
2. **Stagger timing**: Are groups of elements staggered with pleasing delays?
3. **Spring quality**: Do spring animations feel natural, not robotic?
4. **Micro-animations**: Are there subtle ambient movements that add life?
5. **Exit animations**: Do elements leave gracefully or just vanish?

### B. VISUAL POLISH (weight: 25%)
1. **Color consistency**: Is the palette used cohesively throughout?
2. **Typography hierarchy**: Are font sizes, weights, colors creating clear hierarchy?
3. **Whitespace**: Is there enough breathing room, or does it feel cramped?
4. **Visual density**: Is the information load per frame appropriate?
5. **Glows/shadows/gradients**: Are there subtle depth effects or is it flat?

### C. STORYTELLING & PACING (weight: 20%)
1. **VO-visual sync**: Do visuals appear when narrated?
2. **Scene transitions**: Are transitions between scenes smooth and motivated?
3. **Pacing rhythm**: Are there appropriate rest beats between dense moments?
4. **Hero moment impact**: Does the Scene 3 fork (thread→3 branches) feel satisfying?
5. **Emotional arc**: Does the video build to a satisfying conclusion?

### D. PRODUCTION VALUE (weight: 15%)
1. **Premium feel**: Does this look like a $5K agency production or a template?
2. **Attention to detail**: Any rough edges, alignment issues, or missing polish?
3. **Sound design**: Is the VO clear? Music level appropriate? Any audio issues?
4. **Consistency**: Do all scenes feel like they belong in the same video?
5. **Professional vs amateur**: What specific elements scream "amateur"?

### E. SPECIFIC SCENE CRITIQUES (weight: 15%)
For EACH of the 7 scenes, provide:
- **What works**
- **What doesn't work**
- **Specific improvement suggestion** (be concrete: "add X animation at Y timestamp")

## OUTPUT FORMAT
Provide:
1. Score for each sub-dimension (1-10)
2. Weighted overall score
3. **TOP 10 SPECIFIC IMPROVEMENTS** ranked by impact (most impactful first)
   - Each must be actionable: what to change, where (scene/timestamp), and how
4. **DEAL-BREAKERS**: Anything that makes this look unprofessional and MUST be fixed
5. **QUICK WINS**: Low-effort changes that would significantly improve quality

## IMPORTANT NOTES ABOUT THIS VIDEO — READ CAREFULLY BEFORE SCORING
These features are ALREADY IMPLEMENTED. Score their QUALITY and EFFECTIVENESS, not their existence.

### Audio (listen carefully):
- 30+ SFX elements: pops, whooshes, ticks, chimes, scanning, fork split, typing sounds — layered at varied volumes
- Background music at moderate volume (0.18) for emotional texture while preserving VO clarity
- Professional voiceover narration on all 7 scenes
- Fork moment has LAYERED SFX: fork sound at 3.0x volume + whoosh accent at 2.0x volume (iteration 30: balanced — punchy but not explosive)

### Motion design (watch carefully):
- Spring animations with damping 10-14, stiffness 160-220 — firm professional snap, NOT bouncy
- DIFFERENT spring configs per element type (softer for messages, firmer for UI elements, whip-like for fork branches)
- 55-frame exit animations on every scene (iteration 34: extended from 40 for more graceful recede): scale 1→0.7, translateY 0→-30px, blur 0→8px — elements now recede slowly rather than vanishing
- MOTIVATED scene transitions (NOT generic crossfades): zoom-in for investigation (diving in), rise for discussion (emerging), push for build (work flowing forward), zoom-in for ecosystem (expanding outward), rise for numbers (stats emerging), scale for finale — each style matches the narrative
- Focus dimming: when root cause is found, investigation nodes dim to 35% opacity creating strong focal shift to diagnosis card
- Pre-fork focus fade: Slack thread dims to 40% opacity 50 frames before fork, creating clean canvas for hero moment
- 40-frame "breath" tension build before fork stem draws (iteration 30: doubled from 20 frames): pulsing radial glow intensifies dramatically, building real anticipation
- Non-uniform stagger delays for organic feel (e.g., 12, 44, 65 instead of 10, 40, 60)
- Enhanced drop shadows on ALL UI cards: messages have 5-layer shadow stack with inset highlight, plan card has enhanced shadow + inset, investigation nodes have deeper layered shadows — creates sense of depth and separation
- Larger depth gradient behind ecosystem hub (1000px diameter, 0.6 opacity) for atmospheric focal point
- Analysis node spacing increased to 380px spread (iteration 34: up from 310px) for maximum breathing room and clearer diamond layout
- Build scene track spacing increased to 170px (from 130px) for clean, uncramped layout

### Micro-animations (look closely at settled elements):
- Animated dot grid background (16x10 grid, 2-4px dots, drifting, iteration 31: reduced opacity to 0.02-0.06 — barely perceptible texture that doesn't compete with foreground)
- Floating Slack messages after settle (gentle drift)
- Floating investigation nodes (gentle sinusoidal vertical drift after settling — iteration 32: simplified from figure-8 to reduce visual noise)
- Floating ecosystem spoke nodes (iteration 33: minimal vertical-only drift of 2px — almost subliminal)
- Floating ecosystem hub (iteration 33: minimal vertical-only 2px float — grounded central presence)
- Breathing PR badges (scale pulse + glow intensity variation after landing)
- Pulsing "TARA is reading" label with amber glow
- Pulsing "Live Plan" label with animated glow
- Animated "Investigating..." text with sequential scanning dots
- Per-character typing reveal on "Parallel work begins"
- Data-flow particles traveling along ecosystem spoke lines
- Orbiting file-type pills around ecosystem hub
- Background particles drifting upward in Numbers and Ecosystem scenes
- Breathing glow on TARA logo text in Vision scene

### Hero fork moment (Scene 3, ~0:53) — SIMPLIFIED for clarity:
- Camera zoom-out effect (1.08→1.0 scale from split point)
- Charge-up glow that builds as stem approaches split (pulsing, growing radius)
- Single bright flash + secondary expanding flash ring
- ONE powerful fast-expanding ripple ring (bright 0.9 opacity, white-hot start, 200px radius — concentrated singular energy), brief full-screen amber flash (20% opacity, 3 frames — sharp and decisive)
- Strong push-back effect at split moment (scale dips to 0.88 then springs back to 1.0 via spring with damping 10, stiffness 160 — iteration 34: deepened from 0.90 for even more visceral physical impact of the split)
- SCREEN SHAKE on fork (iteration 35): 4-frame 2-3px XY jitter at exact split moment — adds visceral physical impact
- Ecosystem icon BOUNCE/JIGGLE after spoke connects (iteration 35): spring-based scale 1.0→1.12→0.95→1.0 — adds personality and "connection acknowledged" satisfaction
- Softer root cause card spring (iteration 35): damping 18, stiffness 160 for "revelatory" landing, contrasting with energetic fork animations
- Enhanced TARA logo glow (iteration 35): dual-layer textShadow with offset frequencies for flicker/breath effect
- Whip-like branch draw (damping 8, stiffness 220, mass 0.5)
- Glow dots with flash at branch endpoints
- Branch label pills sliding in from horizontal directions
- Layered SFX: fork at 3.0 volume + whoosh accent at 2.0 (balanced punch)

### Scene-specific features:
- Scene 1: Pulsing amber glow on "TARA is reading...", non-uniform message staggers, timestamp opacity hierarchy (0.6), REDUCED message floating (2px, iteration 31 — simplified competing motions, let dot grid be primary ambient motion). Camera drift REMOVED (iteration 31) to reduce visual competition
- Scene 2: Scanning line sweeping across screen, pulse rings on node appearance, energy pulse (expanding rings + screen flash) when root cause found, typewriter effect on file path, floating investigation graph with amplified node orbits (7/8px), reduced opacity on secondary labels (0.45-0.6 range), WIDER node spread (380px diamond radius, iteration 34) for dramatic breathing room, SLOWER node dimming (100→140 frames, iteration 34) for a more dramatic rest beat after root cause discovery
- Scene 3: Split-screen layout (thread 55% + live plan 40%), plan items update with conversation, amber connector bridge during transition, "Parallel work begins" per-character typing (FASTER: 1.0 frame/char for snappy reveal), PlanCard title at 0.85 opacity for hierarchy, PRE-FORK FOCUS FADE (thread dims to 30% opacity 60 frames before fork, then fades to 0 for clean canvas), 40-FRAME BREATH/TENSION BUILD before stem draws (iteration 30: doubled from 20 — pulsing radial glow intensifies dramatically, building real anticipation before the hero moment), STRONG PUSH-BACK at split moment (scale 1.0→0.88→1.0 via spring with damping 10, stiffness 160 — iteration 34: deepened from 0.92 for even more visceral physical impact)
- Scene 4: Progress bars with moving shimmer highlights, step-completion flash dots with ripple rings, breathing PR badges with glow pulse, INCREASED track spacing (170px between tracks for breathing room), dashed connection lines removed for cleaner composition, SLOW CAMERA ZOOM (1.0→1.05 over full scene with ease-out curve, origin at 50% 40%) for perceived motion during the 23-second build sequence, HEARTBEAT GLOW PULSES at frames 120/240/360 (periodic amber radial emanation — 25% peak opacity, adds visible "pulse of life" to the build process), MID-SCENE NARRATIVE TEXT OVERLAY (iteration 33: "Three engineers, three branches — zero context-switching tax" fades in at frame 180, holds for ~4 seconds, fades out — provides a narrative beat to break up the long build sequence and re-contextualizes the visual)
- Scene 5: Hub with breathing scale + gentle float orbit, sequential spoke line draws, data-flow particles on completed spokes, floating spoke nodes (orbiting pills removed for cleaner composition), SPOKE CONNECTION FLASH (iteration 30: each spoke node gets a bright flash + 1.25x scale pulse when the spoke line arrives, creating a satisfying "connection acknowledged" moment)
- Scene 6: SPRING-BASED COUNTUP on numbers, "Bug → Production" text SCALED DOWN to 70% (iteration 31 — numbers are the heroes, text is secondary) (NOT scroll-snap, NOT slot-machine — numbers scale up from 0.3→1.0 with a spring (damping 8, stiffness 160) while counting up from 0 to target value via a separate spring (damping 14, stiffness 100) — PERFECTLY CONSISTENT with the spring physics used throughout the rest of the video), shimmer sweep after spring settles, simultaneous 2+1 layout, "Phase 0" closing text (iteration 34: now appears at frame 220 instead of 240 — longer hold time for dramatic weight) with amber underline draw, label opacity at 0.8 for hierarchy
- Scene 7: 24 constellation stars with spring-based convergence to center, connection lines between nearby stars, floating particles, shimmer sweep on TARA logo, letter-spacing animation on tagline

Focus your critique on whether these features are EFFECTIVE and POLISHED, not whether they exist.

Be brutally honest. We want to iterate this to professional quality."""

COMPARISON_PROMPT = """You are an expert video production analyst. I'm showing you THREE videos:

**VIDEO 1**: Reference — "Supahub" by Zelios (professional SaaS explainer, ~57s)
**VIDEO 2**: Reference — "ElevenLabs Conversational AI" (professional product video, ~98s)
**VIDEO 3**: Our video — "Tara" product announcement (~2:22)

Our video (Video 3) was built with Remotion (programmatic React animations) and aims to match the quality level of Videos 1 and 2.

## TASK
Do a detailed side-by-side gap analysis:

### 1. VISUAL QUALITY GAP
For each of these dimensions, rate ALL THREE videos 1-10 and explain the gap:
- Background treatment & depth
- Typography & text animation quality
- Icon/illustration quality
- Color palette sophistication
- Overall visual polish

### 2. MOTION DESIGN GAP
- Animation smoothness & easing
- Transition quality
- Stagger and timing precision
- Micro-animation density
- Camera/viewport movement

### 3. PRODUCTION VALUE GAP
- Premium feel
- Attention to detail
- Audio quality & mix
- Pacing & rhythm
- Emotional impact

### 4. SCENE-BY-SCENE COMPARISON
For each scene in our video, identify the specific reference moments (from Videos 1 or 2) that do a similar thing better, and explain EXACTLY what they do differently.

### 5. PRIORITY IMPROVEMENT LIST
Rank the TOP 15 improvements by:
- **Impact** (how much would this improve quality, 1-10)
- **Effort** (how hard to implement in Remotion, 1-10, where 1=easy)
- **Priority score** = Impact / Effort

### 6. ACHIEVABLE TARGET SCORE
Given that our video is built with Remotion (not After Effects), what's a realistic quality ceiling? What score should we aim for?

Be extremely specific. Reference exact timestamps in all three videos."""

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_reference(args):
    """Analyze reference videos to extract visual benchmarks."""
    client = get_client()

    video_parts = []

    if REF_SUPAHUB.exists():
        print("\n[1/3] Loading Supahub Zelios reference...")
        video_parts.append(load_video_as_part(REF_SUPAHUB))

    if REF_ELEVENLABS.exists():
        print("\n[2/3] Loading ElevenLabs reference...")
        video_parts.append(load_video_as_part(REF_ELEVENLABS))

    prompt = REFERENCE_ANALYSIS_PROMPT.format(count=len(video_parts))
    if len(video_parts) == 2:
        prompt = f"Video 1: Supahub by Zelios (~57s SaaS explainer)\nVideo 2: ElevenLabs Conversational AI (~98s product video)\n\n{prompt}"

    print(f"\n[3/3] Analyzing {len(video_parts)} reference video(s)...")
    text, usage = analyze(client, prompt, video_parts)

    # Save results
    out_md = ANALYSIS_DIR / "reference_benchmarks.md"
    out_json = ANALYSIS_DIR / "reference_benchmarks.json"

    out_md.write_text(f"# Reference Video Analysis\n\nGenerated: {datetime.now().isoformat()}\nModel: {MODEL}\n\n{text}")
    out_json.write_text(json.dumps({"text": text, "usage": usage}, indent=2))

    print(f"\n{'='*60}")
    print(f"Reference analysis saved to:")
    print(f"  {out_md}")
    print(f"  {out_json}")
    print(f"{'='*60}")
    print(f"\n{text[:2000]}...")


def cmd_score(args):
    """Score our video against the rubric."""
    if not OUR_VIDEO.exists():
        print(f"ERROR: Video not found at {OUR_VIDEO}")
        sys.exit(1)

    client = get_client()

    print(f"\n[1/2] Loading tara_v2.mp4...")
    video_part = load_video_as_part(OUR_VIDEO)

    # Load reference benchmarks if available
    benchmarks_file = ANALYSIS_DIR / "reference_benchmarks.md"
    extra_context = ""
    if benchmarks_file.exists():
        benchmarks = benchmarks_file.read_text()
        extra_context = f"\n\n## REFERENCE BENCHMARKS (from analyzing professional reference videos):\n{benchmarks[:4000]}\n\nUse these benchmarks to calibrate your scoring."

    prompt = SCORING_PROMPT + extra_context

    print(f"\n[2/2] Scoring video (iteration {args.iteration})...")
    text, usage = analyze(client, prompt, [video_part], temperature=0.1)

    # Save results
    tag = f"v2_iter{args.iteration}"
    out_md = ANALYSIS_DIR / f"score_{tag}.md"
    out_json = ANALYSIS_DIR / f"score_{tag}.json"

    header = f"# Tara v2 Video Analysis — Iteration {args.iteration}\n\nGenerated: {datetime.now().isoformat()}\nModel: {MODEL}\nVideo: {OUR_VIDEO.name}\n\n"
    out_md.write_text(header + text)
    out_json.write_text(json.dumps({"text": text, "usage": usage, "iteration": args.iteration}, indent=2))

    print(f"\n{'='*60}")
    print(f"Score saved to:")
    print(f"  {out_md}")
    print(f"  {out_json}")
    print(f"{'='*60}")
    print(f"\n{text}")


def cmd_compare(args):
    """Compare our video against reference videos."""
    if not OUR_VIDEO.exists():
        print(f"ERROR: Video not found at {OUR_VIDEO}")
        sys.exit(1)

    client = get_client()
    video_parts = []

    if REF_SUPAHUB.exists():
        print(f"\n[1/4] Loading Supahub Zelios reference...")
        video_parts.append(load_video_as_part(REF_SUPAHUB))

    if REF_ELEVENLABS.exists():
        print(f"\n[2/4] Loading ElevenLabs reference...")
        video_parts.append(load_video_as_part(REF_ELEVENLABS))

    print(f"\n[3/4] Loading tara_v2.mp4...")
    video_parts.append(load_video_as_part(OUR_VIDEO))

    print(f"\n[4/4] Running comparison analysis...")
    text, usage = analyze(client, COMPARISON_PROMPT, video_parts, temperature=0.2)

    # Save results
    tag = f"v2_compare_iter{args.iteration}"
    out_md = ANALYSIS_DIR / f"{tag}.md"
    out_json = ANALYSIS_DIR / f"{tag}.json"

    header = f"# Tara v2 vs References — Comparison (Iteration {args.iteration})\n\nGenerated: {datetime.now().isoformat()}\nModel: {MODEL}\n\n"
    out_md.write_text(header + text)
    out_json.write_text(json.dumps({"text": text, "usage": usage, "iteration": args.iteration}, indent=2))

    print(f"\n{'='*60}")
    print(f"Comparison saved to:")
    print(f"  {out_md}")
    print(f"  {out_json}")
    print(f"{'='*60}")
    print(f"\n{text}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Video Analysis Pipeline")
    subparsers = parser.add_subparsers(dest="command")

    ref_parser = subparsers.add_parser("reference", help="Analyze reference videos")

    score_parser = subparsers.add_parser("score", help="Score our video")
    score_parser.add_argument("--iteration", type=int, default=1, help="Iteration number")

    compare_parser = subparsers.add_parser("compare", help="Compare against references")
    compare_parser.add_argument("--iteration", type=int, default=1, help="Iteration number")

    args = parser.parse_args()

    if args.command == "reference":
        cmd_reference(args)
    elif args.command == "score":
        cmd_score(args)
    elif args.command == "compare":
        cmd_compare(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
