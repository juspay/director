# Origin: video-production/pipeline.py — extracted to library on 2026-03-23
"""
Main orchestrator for the Tara announcement video production pipeline.

Reads scene configurations and runs the full pipeline:
  Phase 1: Generate voiceover per scene (ElevenLabs)
  Phase 2: Generate Tara character animation for Acts 4, 8 (HeyGen)
  Phase 3: Generate cinematic B-roll for Acts 2, 3 (Runway Gen-4 Turbo)
  Phase 4: Generate background music (ElevenLabs)
  Phase 5: Composite everything (MoviePy + FFmpeg)
  Phase 6: Generate captions (faster-whisper) and burn them in

Usage:
    python pipeline.py                  # Run full pipeline
    python pipeline.py --phase 1       # Run only Phase 1 (voiceover)
    python pipeline.py --phase 1,2,3   # Run specific phases
    python pipeline.py --skip-broll    # Skip Runway (use placeholders)
    python pipeline.py --dry-run       # Validate config without API calls
"""

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.resolve()))

from config import (
    ASSETS_DIR,
    OUTPUT_DIR,
    PROJECT_DIR,
    SCREENSHOT_DIR,
    validate_config,
)

# Configure logging before importing modules that use it
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(PROJECT_DIR / "pipeline.log"),
    ],
)
logger = logging.getLogger("pipeline")


def load_scenes() -> list[dict]:
    """Load scene configurations from scenes.json."""
    scenes_path = PROJECT_DIR / "scenes.json"
    if not scenes_path.exists():
        raise FileNotFoundError(f"scenes.json not found at {scenes_path}")

    with open(scenes_path) as f:
        scenes = json.load(f)

    logger.info(f"Loaded {len(scenes)} scenes from scenes.json")
    return scenes


async def phase_1_voiceover(scenes: list[dict]) -> dict[str, Path]:
    """
    Phase 1: Generate voiceover audio for all narrated scenes.

    Returns a map of scene_id to audio file path.
    """
    logger.info("=" * 60)
    logger.info("PHASE 1: Voiceover Generation (ElevenLabs)")
    logger.info("=" * 60)

    from voiceover import generate_all_voiceovers

    results = await generate_all_voiceovers(scenes)

    paths = {scene_id: r.audio_path for scene_id, r in results.items()}
    durations = {scene_id: r.duration_seconds for scene_id, r in results.items()}

    logger.info("Voiceover durations:")
    for scene_id, dur in durations.items():
        logger.info(f"  {scene_id}: {dur:.2f}s")
    logger.info(f"  Total: {sum(durations.values()):.2f}s")

    # Save duration metadata for downstream phases
    metadata_path = ASSETS_DIR / "voiceover_durations.json"
    with open(metadata_path, "w") as f:
        json.dump(durations, f, indent=2)

    return paths


async def phase_2_avatar(
    scenes: list[dict], voiceover_paths: dict[str, Path]
) -> dict[str, Path]:
    """
    Phase 2: Generate Tara character animations for Acts 4 and 8.

    Uses HeyGen to animate the mascot image with lip sync to voiceover audio.
    Returns a map of scene_id to avatar video path.
    """
    logger.info("=" * 60)
    logger.info("PHASE 2: Avatar Animation (HeyGen)")
    logger.info("=" * 60)

    from avatar import generate_all_avatars

    results = await generate_all_avatars(scenes, voiceover_paths)

    paths = {scene_id: r.video_path for scene_id, r in results.items()}

    for scene_id, path in paths.items():
        logger.info(f"  {scene_id}: {path}")

    return paths


async def phase_3_broll(scenes: list[dict]) -> dict[str, Path]:
    """
    Phase 3: Generate cinematic B-roll for Acts 2 and 3.

    Generates 3 variants per scene via Runway Gen-4 Turbo.
    Returns the path to variant 1 by default (user can swap later).
    """
    logger.info("=" * 60)
    logger.info("PHASE 3: Cinematic B-roll (Runway Gen-4 Turbo)")
    logger.info("=" * 60)

    from broll import generate_all_broll

    results = await generate_all_broll(scenes)

    # Default to variant 1; user can manually select preferred variant
    # after reviewing all 3 in assets/broll/
    paths: dict[str, Path] = {}
    for scene_id, variants in results.items():
        if variants:
            paths[scene_id] = variants[0].video_path
            logger.info(
                f"  {scene_id}: {len(variants)} variants generated, "
                f"using v1 by default"
            )
            for v in variants:
                logger.info(f"    v{v.variant}: {v.video_path}")

    return paths


async def phase_4_music(scenes: list[dict]) -> Path | None:
    """
    Phase 4: Generate background music.

    Uses ElevenLabs sound generation for a warm, building,
    product-launch energy track.
    """
    logger.info("=" * 60)
    logger.info("PHASE 4: Background Music (ElevenLabs)")
    logger.info("=" * 60)

    from voiceover import generate_music

    total_duration = sum(s.get("duration_estimate", 15) for s in scenes)
    music_path = await generate_music(total_duration)

    logger.info(f"  Music saved to: {music_path}")
    return music_path


async def phase_5_composite(
    scenes: list[dict],
    voiceover_paths: dict[str, Path],
    avatar_paths: dict[str, Path],
    broll_paths: dict[str, Path],
    music_path: Path | None,
) -> Path:
    """
    Phase 5: Composite all assets into a single video.

    Combines B-roll, avatar clips, screenshots, text overlays,
    voiceover, and music into the final video (without captions).
    """
    logger.info("=" * 60)
    logger.info("PHASE 5: Video Compositing (MoviePy + FFmpeg)")
    logger.info("=" * 60)

    from composite import CompositeConfig, composite_video

    config = CompositeConfig(
        voiceover_paths=voiceover_paths,
        avatar_paths=avatar_paths,
        broll_paths=broll_paths,
        music_path=music_path,
        screenshot_dir=SCREENSHOT_DIR,
        scenes=scenes,
    )

    video_path = await composite_video(config)
    logger.info(f"  Composited video: {video_path}")
    return video_path


async def phase_6_captions(
    video_path: Path,
    voiceover_paths: dict[str, Path],
) -> Path:
    """
    Phase 6: Generate captions and burn them into the video.

    Uses faster-whisper (large-v2) to transcribe voiceover audio,
    generates an SRT file, then burns captions via FFmpeg.
    """
    logger.info("=" * 60)
    logger.info("PHASE 6: Caption Generation & Burn-in (faster-whisper + FFmpeg)")
    logger.info("=" * 60)

    from captions import generate_and_burn_captions

    final_path = await generate_and_burn_captions(video_path, voiceover_paths)
    logger.info(f"  Final video with captions: {final_path}")
    return final_path


async def run_pipeline(
    phases: set[int] | None = None,
    dry_run: bool = False,
    skip_broll: bool = False,
) -> None:
    """
    Run the complete video production pipeline.

    Args:
        phases: Set of phase numbers to run (1-6). None = all phases.
        dry_run: If True, validate config without making API calls.
        skip_broll: If True, skip Runway B-roll generation (use placeholders).
    """
    start_time = time.monotonic()

    logger.info("Tara Announcement Video — Production Pipeline")
    logger.info(f"Project directory: {PROJECT_DIR}")
    logger.info(f"Assets directory:  {ASSETS_DIR}")
    logger.info(f"Output directory:  {OUTPUT_DIR}")

    # Validate configuration
    issues = validate_config()
    if issues:
        logger.warning("Configuration issues:")
        for issue in issues:
            logger.warning(f"  - {issue}")

    if dry_run:
        logger.info("Dry run complete. Fix any issues above before running.")
        return

    # Load scene configurations
    scenes = load_scenes()

    if phases is None:
        phases = {1, 2, 3, 4, 5, 6}

    # Phase 1: Voiceover
    voiceover_paths: dict[str, Path] = {}
    if 1 in phases:
        voiceover_paths = await phase_1_voiceover(scenes)
    else:
        # Try to load from existing assets
        vo_dir = ASSETS_DIR / "voiceover"
        if vo_dir.exists():
            for f in vo_dir.glob("*.mp3"):
                voiceover_paths[f.stem] = f
            logger.info(f"Loaded {len(voiceover_paths)} existing voiceovers")

    # Phase 2 and 3 can run concurrently — avatar and B-roll are independent
    avatar_paths: dict[str, Path] = {}
    broll_paths: dict[str, Path] = {}

    concurrent_tasks = []

    if 2 in phases:
        concurrent_tasks.append(("avatar", phase_2_avatar(scenes, voiceover_paths)))

    if 3 in phases and not skip_broll:
        concurrent_tasks.append(("broll", phase_3_broll(scenes)))

    if concurrent_tasks:
        results = await asyncio.gather(
            *[task for _, task in concurrent_tasks],
            return_exceptions=True,
        )
        for (name, _), result in zip(concurrent_tasks, results):
            if isinstance(result, Exception):
                logger.error(f"Phase {name} failed: {result}")
                raise result
            if name == "avatar":
                avatar_paths = result
            elif name == "broll":
                broll_paths = result
    else:
        # Load existing assets
        avatar_dir = ASSETS_DIR / "avatar"
        if avatar_dir.exists():
            for f in avatar_dir.glob("*_avatar.mp4"):
                scene_id = f.stem.replace("_avatar", "")
                avatar_paths[scene_id] = f

        broll_dir = ASSETS_DIR / "broll"
        if broll_dir.exists():
            for f in sorted(broll_dir.glob("*_v1.mp4")):
                scene_id = f.stem.replace("_v1", "")
                broll_paths[scene_id] = f

    # Phase 4: Music
    music_path: Path | None = None
    if 4 in phases:
        music_path = await phase_4_music(scenes)
    else:
        candidate = ASSETS_DIR / "music" / "background_music.mp3"
        if candidate.exists():
            music_path = candidate

    # Phase 5: Compositing
    video_path = OUTPUT_DIR / "tara_announcement_no_captions.mp4"
    if 5 in phases:
        video_path = await phase_5_composite(
            scenes, voiceover_paths, avatar_paths, broll_paths, music_path
        )

    # Phase 6: Captions
    if 6 in phases:
        if not video_path.exists():
            logger.error(
                f"Cannot generate captions: video not found at {video_path}. "
                "Run phase 5 first."
            )
        else:
            final_path = await phase_6_captions(video_path, voiceover_paths)
            logger.info(f"FINAL OUTPUT: {final_path}")

    elapsed = time.monotonic() - start_time
    logger.info(f"Pipeline complete in {elapsed:.1f}s")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tara Announcement Video Production Pipeline",
    )
    parser.add_argument(
        "--phase",
        type=str,
        default=None,
        help="Comma-separated phase numbers to run (1-6). Default: all.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate configuration without making API calls.",
    )
    parser.add_argument(
        "--skip-broll",
        action="store_true",
        help="Skip Runway B-roll generation (use placeholders).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    phases: set[int] | None = None
    if args.phase:
        phases = {int(p.strip()) for p in args.phase.split(",")}
        invalid = phases - {1, 2, 3, 4, 5, 6}
        if invalid:
            logger.error(f"Invalid phase numbers: {invalid}. Valid: 1-6.")
            sys.exit(1)

    asyncio.run(
        run_pipeline(
            phases=phases,
            dry_run=args.dry_run,
            skip_broll=args.skip_broll,
        )
    )


if __name__ == "__main__":
    main()
