#!/usr/bin/env python3
# ORIGIN: video-production/v8/scripts/analyze_video.py
# Extracted to library/scoring/ for reuse across pipeline versions.
"""
Video Analysis Pipeline for TARA Video v8 using Gemini via Vertex AI.

v8 scoring: Tailored to Slack-native UI, real data authenticity, coding agent UX.
Uses 3-run averaging to handle Gemini scoring variance (~±0.8-1.0).

Usage:
  python3 analyze_video.py score --iteration 1                                    # Score default video (3 runs)
  python3 analyze_video.py score --iteration 1 --runs 1                           # Single run (faster)
  python3 analyze_video.py score --iteration 1 --video remotion/out/tara_v8_draft_v2.mp4  # Explicit video path
"""

import sys
import os
import json
import re
import random
import argparse
from pathlib import Path
from datetime import datetime

# Set up credentials from root .env
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
V8_DIR = Path(__file__).resolve().parent.parent  # v8/
DEFAULT_VIDEO = V8_DIR / "remotion" / "out" / "tara_v8_draft_v2.mp4"
ANALYSIS_DIR = V8_DIR / "analysis"
ANALYSIS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Client setup
# ---------------------------------------------------------------------------
def get_client() -> genai.Client:
    """Create Gemini client via Vertex AI."""
    print(f"  Connecting to Vertex AI: project={PROJECT}, location={LOCATION}")
    if CREDS_FILE:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDS_FILE
    return genai.Client(vertexai=True, project=PROJECT, location=LOCATION)


def load_video_as_part(video_path: Path) -> types.Part:
    """Load a video file as an inline Part for Vertex AI."""
    size_mb = video_path.stat().st_size / 1024 / 1024
    print(f"  Loading {video_path.name} ({size_mb:.1f} MB) as inline data...")
    video_bytes = video_path.read_bytes()
    suffix = video_path.suffix.lower()
    mime_map = {".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime"}
    mime_type = mime_map.get(suffix, "video/mp4")
    part = types.Part.from_bytes(data=video_bytes, mime_type=mime_type)
    print(f"  Loaded: {video_path.name} ({mime_type})")
    return part


def analyze(client: genai.Client, prompt: str, video_parts: list, temperature: float = 0.0) -> tuple:
    """Send multimodal prompt with video(s) and return text response + usage."""
    parts = list(video_parts)
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

    text = ""
    candidates = response.candidates
    if candidates and len(candidates) > 0:
        content = candidates[0].content
        if content and content.parts:
            for part in content.parts:
                if hasattr(part, "text") and part.text:
                    text += part.text

    usage = {
        "model": MODEL,
        "timestamp": datetime.now().isoformat(),
        "prompt_length": len(prompt),
        "num_videos": len(video_parts),
    }
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        um = response.usage_metadata
        usage["prompt_tokens"] = getattr(um, "prompt_token_count", None)
        usage["response_tokens"] = getattr(um, "candidates_token_count", None)
        usage["total_tokens"] = getattr(um, "total_token_count", None)

    return text, usage


# ---------------------------------------------------------------------------
# Dimension definitions for shuffleable rubric
# ---------------------------------------------------------------------------

SCORING_DIMENSIONS = [
    {"key": "content_authenticity", "name": "CONTENT AUTHENTICITY", "weight": 0.25, "weight_pct": "25%"},
    {"key": "visual_polish", "name": "VISUAL POLISH", "weight": 0.20, "weight_pct": "20%"},
    {"key": "motion_design", "name": "MOTION DESIGN", "weight": 0.15, "weight_pct": "15%"},
    {"key": "storytelling", "name": "STORYTELLING ARC", "weight": 0.15, "weight_pct": "15%"},
    {"key": "scene_transitions", "name": "SCENE TRANSITIONS", "weight": 0.10, "weight_pct": "10%"},
    {"key": "music_audio", "name": "MUSIC/AUDIO INTEGRATION", "weight": 0.10, "weight_pct": "10%"},
    {"key": "production_value", "name": "PRODUCTION VALUE", "weight": 0.05, "weight_pct": "5%"},
]


def build_scoring_prompt(run_seed: int = 0) -> str:
    """Build the scoring prompt with dimensions in a shuffled order.

    Each run uses a different seed to reduce positional bias in Gemini's scoring.
    The weighted overall formula is always rebuilt to match the shuffled order.
    """
    dims = list(SCORING_DIMENSIONS)
    if run_seed > 0:
        rng = random.Random(run_seed)
        rng.shuffle(dims)

    return _build_prompt_with_order(dims)


def _build_prompt_with_order(dims: list) -> str:
    """Assemble the full prompt with dimensions in the given order."""
    letters = "ABCDEFG"
    # Build the rubric section header + output format with current letter assignment
    score_lines = []
    formula_parts = []
    for i, dim in enumerate(dims):
        letter = letters[i]
        score_lines.append(f"{letter}. {dim['name'].title().replace('/', '/')}: X.X/10")
        formula_parts.append(f"{letter}x{dim['weight']:.2f}")

    output_block = "\n".join(score_lines)
    formula = " + ".join(formula_parts)

    return SCORING_PROMPT_V8_TEMPLATE.format(
        rubric_sections=_build_rubric_sections(dims, letters),
        output_block=output_block,
        formula=formula,
    )


def _build_rubric_sections(dims: list, letters: str) -> str:
    """Build the detailed rubric sections with assigned letters."""
    sections = []
    for i, dim in enumerate(dims):
        letter = letters[i]
        body = DIMENSION_BODIES[dim["key"]]
        sections.append(f"### {letter}. {dim['name']} (weight: {dim['weight_pct']})\n{body}")
    return "\n\n".join(sections)


# Detailed criteria for each dimension (the body text under each heading)
DIMENSION_BODIES = {
    "content_authenticity": """The #1 differentiator for this video is that it should feel REAL, not like a generic SaaS demo.
1. Does the data look REAL? Real names, real messages, real context?
2. Are Slack messages believable with actual team member names (Sarthak Singh, Sachin Sharma, Sai Ramcharan, Yaswanth Reddy)?
3. Are repo names real and specific (Nimble, Vayu, juspay-portal) — not generic like "my-app"?
4. Does Tara's avatar look like a real character (a distinctive AI assistant identity, not a generic icon/star)?
5. Is the coding agent UI convincing (step list with checkmarks, real-looking terminal output)?
6. Does the Slack UI look like actual Slack (dark mode, proper message layout, avatars, timestamps)?""",

    "visual_polish": """1. Typography: Professional-grade? Good hierarchy, spacing, readability?
2. Slack UI fidelity: Does it look like actual Slack dark mode (#1a1d21 background, proper borders)?
3. Color consistency across ALL scenes (no jarring palette shifts)?
4. Glow/shadow/depth effects quality — subtle or overdone?
5. Overall visual cleanliness — no alignment issues, no orphaned elements?""",

    "motion_design": """1. Animation smoothness and spring quality (Remotion spring() usage)
2. Stagger timing between elements (messages appearing one by one, etc.)
3. Enter/exit transitions for UI elements
4. Scene crossfades — should be smooth 1-second visual-only crossfades
5. Micro-animations adding life (typing indicators, status pulsing, etc.)""",

    "storytelling": """1. Does the "13 minutes" hook grab attention in the first 3 seconds?
2. Does energy build from introduction through collaboration to execution?
3. Is the "human judgment" moment effective in the Collab scene (Tara defers to human)?
4. Does "Three PRs. One conversation." land as a powerful payoff?
5. Does "Build what matters." resolve the video satisfyingly?""",

    "scene_transitions": """1. Do scenes flow INTO each other or feel like hard cuts / "scene walls"?
2. Is there visual continuity between scenes (color, layout, rhythm)?
3. Are crossfades smooth and professional (not abrupt)?
4. Does the pacing feel natural between scenes?""",

    "music_audio": """1. Does the music build one continuous arc across the entire video?
2. Does music volume automation enhance the narrative (quieter for dialogue, louder for climax)?
3. Is narration/voiceover clear and well-paced? (Note: may be using placeholder narration)
4. Do audio transitions between scenes feel seamless?""",

    "production_value": """1. Does this look like a $5K+ agency production?
2. Any rough edges, alignment issues, or amateur tells?
3. Professional impression — would you be proud to show this to a VP of Engineering?
4. Consistency between all scenes (same visual language throughout)?""",
}


# ---------------------------------------------------------------------------
# v8 Scoring Prompt Template — dimensions injected via build_scoring_prompt()
# ---------------------------------------------------------------------------
SCORING_PROMPT_V8_TEMPLATE = """You are an expert video production critic specializing in motion graphics and SaaS product videos.

I'm showing you a product announcement video for "Tara" — an AI coding agent that lives in Slack and turns conversations into shipped software. This video was built with Remotion (React-based programmatic animation framework). It's a 2D motion graphics explainer video with Slack-native UI design.

## VIDEO STRUCTURE (7 scenes)
1. **Hook** (~0:00-0:08): Opens with the provocative claim — "Thirteen minutes. From screenshot to production." Timer countdown, screenshot of a bug report arrives, result badges stack showing the fix.
2. **Meet Tara** (~0:08-0:25): Introduction of Tara as an AI that lives in Slack. Shows Tara's avatar (a stylized character, not a generic icon). Slack messages from real team members (Sarthak Singh, Sachin Sharma, Sai Ramcharan, Yaswanth Reddy). Demonstrates investigation/diagnosis flow.
3. **Collab** (~0:25-0:50): The collaboration scene — a Slack thread where a PM, engineer, and designer discuss a plan. Plan card with status updates. The key "human judgment" moment: Tara defers to the human's decision. Shows that Tara augments, not replaces.
4. **Execution** (~0:50-1:15): "Make it real" — Tara creates PRs across multiple repos (Nimble, Vayu, juspay-portal). Shows a coding agent UI with step list and checkmarks. Parallel execution across repos.
5. **Reach** (~1:15-1:35): Hub-and-spoke ecosystem showing 50+ tool integrations. Bitbucket, JIRA, GitHub, Figma connections. Data flowing between tools.
6. **Payoff** (~1:35-1:50): "Three PRs. One conversation." — the key value proposition. Timeline showing the speed/efficiency. "Phase Zero" concept.
7. **Identity** (~1:50-2:10): TARA logo reveal. "Build what matters." tagline. Final branding moment.

## TARGET QUALITY
Agency-level motion graphics. Dark Slack-like theme with professional polish. Clean 2D, no live action.

## v8 SCORING RUBRIC — Rate each dimension 1-10:

{rubric_sections}

## OUTPUT FORMAT (CRITICAL — follow this exactly)

### SCORES
For each dimension, provide scores AND brief justification:
```
{output_block}
```

### WEIGHTED OVERALL SCORE
Calculate: ({formula})
```
OVERALL: X.XX/10
```

### TOP 5 IMPROVEMENTS (ranked by impact)
Each must be specific: what to change, where (scene name/timestamp), and how to fix it.

### DEAL-BREAKERS
Anything that looks unprofessional and MUST be fixed before release.

### WHAT WORKS WELL
Top 3 things that should NOT be changed — keep these.

Be brutally honest. We're iterating toward 9.0+/10."""


def extract_overall_score(text: str) -> float | None:
    """Extract the OVERALL score from Gemini's response.

    Handles various formats including:
    - OVERALL: 9.32/10
    - **OVERALL: 9.32 / 10**
    - **9.32 / 10**
    - OVERALL: **9.32/10**
    """
    # Strip markdown bold markers for easier matching
    cleaned = text.replace("**", "")

    patterns = [
        r"OVERALL[:\s]+(\d+\.?\d*)\s*/\s*10",
        r"overall[:\s]+(\d+\.?\d*)\s*/\s*10",
        r"Overall Score[:\s]+(\d+\.?\d*)\s*/\s*10",
        r"Weighted Overall[:\s]+(\d+\.?\d*)\s*/\s*10",
        r"weighted overall[:\s]+(\d+\.?\d*)\s*/\s*10",
        r"Weighted Overall Score[:\s]+(\d+\.?\d*)\s*/\s*10",
    ]
    for pattern in patterns:
        match = re.search(pattern, cleaned, re.IGNORECASE)
        if match:
            return float(match.group(1))

    # Fallback: look for pattern after "OVERALL" header on same or next line
    fallback = re.search(r"OVERALL.*?(\d+\.?\d+)\s*/\s*10", cleaned, re.IGNORECASE | re.DOTALL)
    if fallback:
        return float(fallback.group(1))

    return None


def extract_dimension_scores(text: str) -> dict:
    """Extract per-dimension scores from Gemini's response.

    Uses dimension NAME matching (not letter prefixes) so extraction works
    regardless of the dimension order presented in the prompt.
    """
    dimensions = {
        "content_authenticity": r"[A-G]\.\s*Content\s*Authenticity.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "visual_polish": r"[A-G]\.\s*Visual\s*Polish.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "motion_design": r"[A-G]\.\s*Motion\s*Design.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "storytelling": r"[A-G]\.\s*Storytelling.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "scene_transitions": r"[A-G]\.\s*Scene\s*Transitions.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "music_audio": r"[A-G]\.\s*Music.*?Audio.*?:\s*(\d+\.?\d*)\s*/\s*10",
        "production_value": r"[A-G]\.\s*Production\s*Value.*?:\s*(\d+\.?\d*)\s*/\s*10",
    }
    scores = {}
    for key, pattern in dimensions.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            scores[key] = float(match.group(1))
    return scores


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_score(args):
    """Score the video with 3-run averaging."""
    video_path = Path(args.video)
    if not video_path.is_absolute():
        video_path = V8_DIR / video_path

    if not video_path.exists():
        print(f"ERROR: Video not found at {video_path}")
        print(f"  Provide a valid path with --video or render first.")
        sys.exit(1)

    client = get_client()
    print(f"\nLoading video: {video_path}")
    video_part = load_video_as_part(video_path)

    num_runs = args.runs
    print(f"\nRunning {num_runs} scoring run(s) for iteration {args.iteration}...")

    all_scores = []
    all_texts = []
    all_dimension_scores = []

    for run in range(1, num_runs + 1):
        print(f"\n{'='*40}")
        print(f"  RUN {run}/{num_runs}")
        print(f"{'='*40}")

        # Each run uses a different dimension order to reduce positional bias
        scoring_prompt = build_scoring_prompt(run_seed=run)
        text, usage = analyze(client, scoring_prompt, [video_part], temperature=0.0)
        all_texts.append(text)

        overall = extract_overall_score(text)
        dims = extract_dimension_scores(text)

        if overall is not None:
            all_scores.append(overall)
            print(f"  Run {run} overall score: {overall:.2f}/10")
        else:
            print(f"  Run {run}: Could not extract overall score")

        if dims:
            all_dimension_scores.append(dims)
            for k, v in dims.items():
                print(f"    {k}: {v:.1f}")

    # Calculate averages
    avg_overall = sum(all_scores) / len(all_scores) if all_scores else 0
    avg_dims = {}
    if all_dimension_scores:
        all_keys = set()
        for d in all_dimension_scores:
            all_keys.update(d.keys())
        for k in all_keys:
            vals = [d[k] for d in all_dimension_scores if k in d]
            avg_dims[k] = sum(vals) / len(vals) if vals else 0

    # Print summary
    print(f"\n{'='*60}")
    print(f"  ITERATION {args.iteration} — AVERAGED RESULTS ({num_runs} runs)")
    print(f"{'='*60}")
    print(f"  Overall: {avg_overall:.2f}/10 (individual: {', '.join(f'{s:.2f}' for s in all_scores)})")
    if len(all_scores) > 1:
        print(f"  Variance: ±{max(all_scores) - min(all_scores):.2f}")
    for k, v in sorted(avg_dims.items()):
        print(f"    {k}: {v:.2f}")
    print(f"{'='*60}")

    # Save results
    video_name = video_path.stem  # e.g. tara_v8_draft_v2
    tag = f"v8_iter{args.iteration}_{video_name}"
    result = {
        "iteration": args.iteration,
        "video_file": str(video_path.name),
        "num_runs": num_runs,
        "timestamp": datetime.now().isoformat(),
        "model": MODEL,
        "overall_scores": all_scores,
        "average_overall": avg_overall,
        "variance": max(all_scores) - min(all_scores) if len(all_scores) > 1 else 0,
        "dimension_averages": avg_dims,
        "dimension_scores_per_run": all_dimension_scores,
        "target": 9.0,
        "target_reached": avg_overall >= 9.0,
    }

    out_json = ANALYSIS_DIR / f"score_{tag}.json"
    out_json.write_text(json.dumps(result, indent=2))

    # Save full text of all runs for detailed analysis
    out_md = ANALYSIS_DIR / f"score_{tag}.md"
    header = f"# Tara v8 Video Analysis — Iteration {args.iteration}\n\n"
    header += f"Generated: {datetime.now().isoformat()}\n"
    header += f"Video: {video_path.name}\n"
    header += f"Model: {MODEL}\n"
    header += f"Runs: {num_runs}\n"
    header += f"Average Overall: {avg_overall:.2f}/10\n"
    header += f"Individual: {', '.join(f'{s:.2f}' for s in all_scores)}\n\n"
    header += "---\n\n"

    body = ""
    for i, txt in enumerate(all_texts, 1):
        body += f"## Run {i} {'(Full Analysis)' if i == 1 else ''}\n\n{txt}\n\n---\n\n"

    out_md.write_text(header + body)

    print(f"\n  Results saved to:")
    print(f"    {out_json}")
    print(f"    {out_md}")

    if avg_overall >= 9.0:
        print(f"\n  TARGET REACHED! Average: {avg_overall:.2f}/10 >= 9.0")
    else:
        print(f"\n  Below target. Average: {avg_overall:.2f}/10 < 9.0")
        print(f"  Gap: {9.0 - avg_overall:.2f}")

    return avg_overall


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="TARA Video v8 Analysis Pipeline")
    subparsers = parser.add_subparsers(dest="command")

    score_parser = subparsers.add_parser("score", help="Score the video (3-run average)")
    score_parser.add_argument("--iteration", type=int, default=1, help="Iteration number")
    score_parser.add_argument("--runs", type=int, default=3, help="Number of scoring runs for averaging")
    score_parser.add_argument(
        "--video",
        type=str,
        default="remotion/out/tara_v8_draft_v2.mp4",
        help="Path to video file (relative to v8/ or absolute)",
    )

    args = parser.parse_args()

    if args.command == "score":
        cmd_score(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
