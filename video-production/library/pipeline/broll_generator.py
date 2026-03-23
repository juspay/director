# Origin: video-production/broll.py — extracted to library on 2026-03-23
"""
Runway Gen-4 Turbo cinematic B-roll generation for Tara announcement video.

Generates cinematic establishing shots for Acts 2 (Vision) and 3 (Problem).
Produces 3 variants per scene for manual selection of the best take.
"""

import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import RUNWAY_API_KEY, ASSETS_DIR

logger = logging.getLogger(__name__)

RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1"
RUNWAY_MODEL = "gen4.5"
CLIP_DURATION = 5  # seconds per clip (gen4.5 supports 5 or 10)
ASPECT_RATIO = "1280:720"
VARIANTS_PER_SCENE = 3

# Detailed cinematic prompts for each B-roll scene.
# These are crafted to maintain visual continuity across the video while
# creating the intended emotional contrast between Acts 2 and 3.
BROLL_PROMPTS: dict[str, list[str]] = {
    "act2_vision": [
        # Variant 1: Wide establishing shot of collaborative workspace
        (
            "Cinematic wide shot of a modern open-plan tech office. Four diverse software engineers "
            "gathered around a glass whiteboard covered in architectural diagrams, flowcharts, and "
            "colorful sticky notes. Warm amber golden hour sunlight streams through floor-to-ceiling "
            "windows casting long warm shadows. Slow smooth dolly push-in toward the group. "
            "Shallow depth of field with beautiful anamorphic bokeh from city lights visible through "
            "windows in background. One engineer gestures enthusiastically while others lean in. "
            "Coffee cups on nearby standing desk. Plants and warm wood accents. "
            "Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel."
        ),
        # Variant 2: Medium shot focusing on the human connection
        (
            "Medium cinematic shot of two engineers having an animated technical discussion, "
            "one sketching a system architecture diagram on a whiteboard while the other points "
            "at a specific component. Natural warm amber lighting from large windows behind them "
            "creating a gentle backlight rim. Laptop screens glow softly in the foreground, "
            "slightly out of focus. Slow orbital camera movement around the pair. "
            "Feeling of creative energy and intellectual collaboration. Modern minimalist office "
            "with exposed brick and warm pendant lights. "
            "Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel."
        ),
        # Variant 3: Close-up detail shot with rack focus
        (
            "Cinematic close-up of hands writing on a glass whiteboard, drawing connected boxes "
            "and arrows representing a software architecture diagram. Rack focus from the diagram "
            "in foreground to a team of engineers nodding in agreement in the soft bokeh background. "
            "Warm golden hour amber light catches the whiteboard marker ink. Slow steady camera movement. "
            "Feeling of purposeful planning, creative problem solving, collaborative innovation. "
            "Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel."
        ),
    ],
    "act3_problem": [
        # Variant 1: Overwhelming tabs and notifications
        (
            "Cinematic close-up of a software developer's monitor showing an overwhelming number "
            "of open browser tabs, at least twelve visible. Slack notifications pile up in the "
            "corner. A code review sits with a red unresolved badge. The developer's face is "
            "partially reflected in the screen, looking fatigued. Cool blue-grey desaturated "
            "lighting from the monitor is the only light source. Slight handheld camera shake "
            "adding tension. The desk is cluttered with empty coffee cups and crumpled notes. "
            "Cinematic, cool blue-grey color grading with desaturated tones, slight film grain, "
            "anamorphic bokeh, 35mm lens feel. Anxious, overwhelming mood."
        ),
        # Variant 2: Context-switching chaos
        (
            "Cinematic medium shot of a developer rapidly switching between applications on a "
            "wide ultrawide monitor — code editor, Slack, JIRA board, browser documentation, "
            "terminal. Each switch creates a slight motion blur. Cool harsh fluorescent overhead "
            "lighting casts unflattering shadows. The developer rubs their temples. Stack Overflow "
            "is visible on one tab. A PR review notification badge shows '3 days ago'. "
            "Empty energy drink cans. Dark circles under eyes reflected in screen. "
            "Cinematic, cool blue-grey color grading with desaturated tones, slight film grain, "
            "anamorphic bokeh, 35mm lens feel. Feeling of cognitive overload and frustration."
        ),
        # Variant 3: Dolly zoom vertigo effect
        (
            "Cinematic dolly zoom shot creating a vertigo effect on a software developer sitting "
            "at their desk surrounded by multiple monitors showing code, chat messages, and task "
            "boards. The background stretches while the subject stays the same size, creating "
            "disorientation. Cool blue-grey lighting with harsh monitor glow. Papers and sticky "
            "notes scattered. The clock on the wall shows late evening. Notification sounds implied "
            "by multiple red badges visible on screen. Feeling of being trapped in busywork. "
            "Cinematic, cool blue-grey color grading with desaturated tones, slight film grain, "
            "anamorphic bokeh, 35mm lens feel. Anxious, claustrophobic mood."
        ),
    ],
}


@dataclass
class BrollResult:
    """Result of a single B-roll generation."""

    scene_id: str
    variant: int
    video_path: Path
    duration_seconds: float


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=5, min=10, max=120),
    reraise=True,
)
async def _create_generation(
    client: httpx.AsyncClient,
    prompt: str,
    scene_id: str,
    variant: int,
) -> str:
    """
    Submit a video generation task to Runway.

    Returns the task ID for polling.
    """
    url = f"{RUNWAY_BASE_URL}/text_to_video"
    headers = {
        "Authorization": f"Bearer {RUNWAY_API_KEY}",
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
    }

    # Runway Gen-4 Turbo text-to-video payload
    payload = {
        "model": RUNWAY_MODEL,
        "promptText": prompt,
        "duration": CLIP_DURATION,
        "ratio": ASPECT_RATIO,
    }

    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    task_id = data["id"]
    logger.info(
        f"[{scene_id}/v{variant}] Created Runway task: {task_id}"
    )
    return task_id


async def _poll_task(
    client: httpx.AsyncClient,
    task_id: str,
    scene_id: str,
    variant: int,
    poll_interval: float = 10.0,
    max_wait: float = 1200.0,
) -> str:
    """
    Poll Runway until the generation is complete.

    Runway Gen-4 Turbo typically takes 30-90 seconds for a 10s clip.
    We poll every 10 seconds with a 10-minute timeout.

    Returns the video download URL.
    """
    url = f"{RUNWAY_BASE_URL}/tasks/{task_id}"
    headers = {
        "Authorization": f"Bearer {RUNWAY_API_KEY}",
        "X-Runway-Version": "2024-11-06",
    }
    elapsed = 0.0

    while elapsed < max_wait:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        status = data.get("status")

        if status == "SUCCEEDED":
            video_url = data["output"][0]
            logger.info(f"[{scene_id}/v{variant}] Generation complete")
            return video_url
        elif status == "FAILED":
            failure = data.get("failure", "Unknown error")
            raise RuntimeError(
                f"[{scene_id}/v{variant}] Runway generation failed: {failure}"
            )
        else:
            logger.info(
                f"[{scene_id}/v{variant}] Status: {status} "
                f"(elapsed: {elapsed:.0f}s)"
            )
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

    raise TimeoutError(
        f"[{scene_id}/v{variant}] Runway generation timed out after {max_wait}s"
    )


async def _download_video(
    client: httpx.AsyncClient,
    video_url: str,
    output_path: Path,
) -> None:
    """Download the completed video from Runway."""
    response = await client.get(video_url)
    response.raise_for_status()
    output_path.write_bytes(response.content)
    logger.info(f"Downloaded B-roll to {output_path}")


async def generate_broll_variant(
    scene_id: str,
    prompt: str,
    variant: int,
) -> BrollResult:
    """
    Generate a single B-roll variant for a scene.

    Args:
        scene_id: Scene identifier.
        prompt: Detailed cinematic prompt for Runway.
        variant: Variant number (1-based).

    Returns:
        BrollResult with video path and metadata.
    """
    output_dir = ASSETS_DIR / "broll"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{scene_id}_v{variant}.mp4"

    if output_path.exists():
        logger.info(f"[{scene_id}/v{variant}] B-roll already exists, skipping")
        duration = await _get_video_duration(output_path)
        return BrollResult(
            scene_id=scene_id,
            variant=variant,
            video_path=output_path,
            duration_seconds=duration,
        )

    async with httpx.AsyncClient(timeout=300.0) as client:
        task_id = await _create_generation(client, prompt, scene_id, variant)
        video_url = await _poll_task(client, task_id, scene_id, variant)
        await _download_video(client, video_url, output_path)

    duration = await _get_video_duration(output_path)

    return BrollResult(
        scene_id=scene_id,
        variant=variant,
        video_path=output_path,
        duration_seconds=duration,
    )


async def _get_video_duration(path: Path) -> float:
    """Get video duration using ffprobe."""
    proc = await asyncio.create_subprocess_exec(
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    import json
    data = json.loads(stdout)
    return float(data["format"]["duration"])


async def generate_all_broll(
    scenes: list[dict],
) -> dict[str, list[BrollResult]]:
    """
    Generate all B-roll variants for scenes that need cinematic footage.

    Generates 3 variants per scene concurrently (Runway supports parallel
    generation). All variants are saved so the editor can pick the best one.

    Args:
        scenes: Scene configs from scenes.json.

    Returns:
        Dict mapping scene_id to list of BrollResults (3 per scene).
    """
    results: dict[str, list[BrollResult]] = {}

    # Collect all generation tasks
    tasks: list[tuple[str, int, asyncio.Task]] = []

    for scene in scenes:
        if scene.get("visual_type") != "cinematic_broll":
            continue

        scene_id = scene["id"]
        prompts = BROLL_PROMPTS.get(scene_id, [])

        if not prompts:
            # Fall back to the prompt from scenes.json
            broll_prompt = scene.get("broll_prompt")
            if broll_prompt:
                prompts = [broll_prompt] * VARIANTS_PER_SCENE

        if not prompts:
            logger.warning(f"[{scene_id}] No B-roll prompts found, skipping")
            continue

        results[scene_id] = []

        for variant_idx, prompt in enumerate(prompts, start=1):
            task = asyncio.create_task(
                generate_broll_variant(scene_id, prompt, variant_idx)
            )
            tasks.append((scene_id, variant_idx, task))

    # Wait for all generations
    for scene_id, variant_idx, task in tasks:
        try:
            result = await task
            results[scene_id].append(result)
        except Exception as e:
            logger.error(
                f"[{scene_id}/v{variant_idx}] B-roll generation failed: {e}"
            )
            raise

    total = sum(len(v) for v in results.values())
    logger.info(f"Generated {total} B-roll variants across {len(results)} scenes")
    return results
