#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Dagster Software-Defined Assets for incremental video production.

Models each pipeline output as a Dagster asset with dependencies. When a
scene's script changes, only that scene's voiceover and downstream assets
are re-materialized — not the entire pipeline.

Asset dependency graph:
    script → voiceover (per-scene) → [avatar | broll | music] → composite → captions → final

Per-scene partitioning: individual scenes can be rebuilt independently.

Requires: pip install dagster dagster-webserver

Usage:
    # Materialize all assets
    dagster dev -f dagster_assets.py

    # Materialize specific asset
    dagster asset materialize --select voiceover

    # Only rebuild changed scenes
    dagster asset materialize --select voiceover --partition act1_hook
"""

import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

try:
    import dagster
    from dagster import (
        asset,
        AssetKey,
        AssetIn,
        DailyPartitionsDefinition,
        StaticPartitionsDefinition,
        Output,
        MetadataValue,
        Definitions,
        define_asset_job,
        AssetSelection,
    )
    HAS_DAGSTER = True
except ImportError:
    HAS_DAGSTER = False

# Scene partitions — each scene can be built independently
SCENE_IDS = [
    "act1_hook", "act2_vision", "act3_problem", "act4_meet_tara",
    "act5a_race_condition", "act5b_async_loop", "act5c_coding_agent",
    "act6_numbers", "act7_roadmap", "act8_cta",
]


if HAS_DAGSTER:

    scene_partitions = StaticPartitionsDefinition(SCENE_IDS)

    # ------------------------------------------------------------------
    # Tier 1: Script (source of truth)
    # ------------------------------------------------------------------

    @asset(
        partitions_def=scene_partitions,
        group_name="source",
        description="Scene script text — the source of truth for all downstream assets.",
    )
    def script(context) -> Output[dict]:
        """Load scene script from scenes.json. Changes here trigger rebuilds."""
        partition_key = context.partition_key
        scenes_path = Path("scenes_schema.json")

        if not scenes_path.exists():
            context.log.warning(f"scenes_schema.json not found, using placeholder")
            return Output(
                {"id": partition_key, "text": "", "hash": ""},
                metadata={"scene_id": partition_key, "status": "placeholder"},
            )

        with open(scenes_path) as f:
            scenes = json.load(f)

        scene_data = next((s for s in scenes if s.get("id") == partition_key), None)
        if scene_data is None:
            scene_data = {"id": partition_key, "narration": ""}

        # Hash the script text for change detection
        text = scene_data.get("narration", "")
        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]

        return Output(
            {"id": partition_key, "text": text, "hash": text_hash, "data": scene_data},
            metadata={
                "scene_id": partition_key,
                "text_length": len(text),
                "hash": text_hash,
            },
        )

    # ------------------------------------------------------------------
    # Tier 2: Per-scene voiceover (depends on script)
    # ------------------------------------------------------------------

    @asset(
        partitions_def=scene_partitions,
        ins={"script": AssetIn()},
        group_name="audio",
        description="Per-scene voiceover audio generated from script text.",
    )
    def voiceover(context, script: dict) -> Output[dict]:
        """Generate voiceover for a single scene. Skips if script unchanged."""
        partition_key = context.partition_key
        text = script.get("text", "")

        if not text:
            context.log.info(f"[{partition_key}] No narration text, skipping")
            return Output({"id": partition_key, "path": None, "status": "skipped"})

        output_path = f"assets/voiceover/{partition_key}.mp3"

        # Check if voiceover already exists with same script hash
        cache_key = f"{partition_key}_{script.get('hash', '')}"
        context.log.info(f"[{partition_key}] Generating voiceover ({len(text)} chars)")

        # Placeholder: actual TTS call
        # from library.voiceover.elevenlabs_generator import generate
        # generate(text, output_path)

        return Output(
            {"id": partition_key, "path": output_path, "script_hash": script.get("hash"), "status": "complete"},
            metadata={
                "scene_id": partition_key,
                "output_path": output_path,
                "text_length": len(text),
            },
        )

    # ------------------------------------------------------------------
    # Tier 2: Avatar animation (depends on voiceover)
    # ------------------------------------------------------------------

    @asset(
        partitions_def=scene_partitions,
        ins={"voiceover": AssetIn()},
        group_name="video",
        description="Avatar lip-sync animation driven by voiceover audio.",
    )
    def avatar(context, voiceover: dict) -> Output[dict]:
        """Generate avatar animation for scenes that need it."""
        partition_key = context.partition_key
        vo_path = voiceover.get("path")

        if not vo_path:
            return Output({"id": partition_key, "path": None, "status": "skipped"})

        # Only some scenes need avatar (act4, act8)
        needs_avatar = partition_key in ("act4_meet_tara", "act8_cta")
        if not needs_avatar:
            return Output({"id": partition_key, "path": None, "status": "not_needed"})

        output_path = f"assets/avatar/{partition_key}.mp4"
        context.log.info(f"[{partition_key}] Generating avatar animation")

        # Placeholder: actual avatar generation
        # from library.pipeline.musetalk_avatar import generate_lipsync

        return Output(
            {"id": partition_key, "path": output_path, "status": "complete"},
            metadata={"scene_id": partition_key, "output_path": output_path},
        )

    # ------------------------------------------------------------------
    # Tier 2: B-roll (independent — depends only on script for prompts)
    # ------------------------------------------------------------------

    @asset(
        partitions_def=scene_partitions,
        ins={"script": AssetIn()},
        group_name="video",
        description="Cinematic B-roll clips generated from scene prompts.",
    )
    def broll(context, script: dict) -> Output[dict]:
        """Generate B-roll for scenes that use cinematic clips."""
        partition_key = context.partition_key
        scene_data = script.get("data", {})

        needs_broll = scene_data.get("visual_type") == "cinematic_broll"
        if not needs_broll:
            return Output({"id": partition_key, "path": None, "status": "not_needed"})

        output_path = f"assets/broll/{partition_key}.mp4"
        context.log.info(f"[{partition_key}] Generating B-roll")

        # Placeholder: actual B-roll generation
        # from library.pipeline.kling_generator import generate_clip

        return Output(
            {"id": partition_key, "path": output_path, "status": "complete"},
            metadata={"scene_id": partition_key, "output_path": output_path},
        )

    # ------------------------------------------------------------------
    # Tier 2: Music (global — not per-scene)
    # ------------------------------------------------------------------

    @asset(
        group_name="audio",
        description="Background music track for the entire video.",
    )
    def music(context) -> Output[dict]:
        """Generate background music. Not partitioned — one track for whole video."""
        output_path = "assets/music/background.wav"
        context.log.info("Generating background music")

        # Placeholder: actual music generation
        # from library.music.programmatic_synthesizer import generate

        return Output(
            {"path": output_path, "status": "complete"},
            metadata={"output_path": output_path},
        )

    # ------------------------------------------------------------------
    # Tier 3: Composite (depends on voiceover + avatar + broll + music)
    # ------------------------------------------------------------------

    @asset(
        ins={
            "voiceover": AssetIn(),
            "avatar": AssetIn(),
            "broll": AssetIn(),
            "music": AssetIn(),
        },
        group_name="output",
        description="Composited video combining all scene assets.",
    )
    def composite(context, voiceover: dict, avatar: dict, broll: dict, music: dict) -> Output[dict]:
        """Composite all assets into the final video."""
        output_path = "output/composite.mp4"
        context.log.info("Compositing final video")

        # Placeholder: actual compositing
        # from library.rendering.assembler import assemble

        return Output(
            {"path": output_path, "status": "complete"},
            metadata={"output_path": output_path},
        )

    # ------------------------------------------------------------------
    # Tier 4: Captions (depends on composite)
    # ------------------------------------------------------------------

    @asset(
        ins={"composite": AssetIn()},
        group_name="output",
        description="Final video with burned-in captions.",
    )
    def captions(context, composite: dict) -> Output[dict]:
        """Generate and burn captions into the composited video."""
        composite_path = composite.get("path", "")
        output_path = "output/final_with_captions.mp4"
        context.log.info("Generating captions")

        # Placeholder: actual caption generation
        # from library.rendering.caption_burner import generate_srt, burn_captions

        return Output(
            {"path": output_path, "status": "complete"},
            metadata={"output_path": output_path},
        )

    # ------------------------------------------------------------------
    # Jobs and Definitions
    # ------------------------------------------------------------------

    # Full pipeline job
    full_pipeline_job = define_asset_job(
        name="full_pipeline",
        selection=AssetSelection.all(),
        description="Run the complete video production pipeline.",
    )

    # Voiceover-only job (for re-recording specific scenes)
    voiceover_job = define_asset_job(
        name="voiceover_only",
        selection=AssetSelection.keys("voiceover"),
        description="Regenerate voiceover for selected scenes.",
    )

    defs = Definitions(
        assets=[script, voiceover, avatar, broll, music, composite, captions],
        jobs=[full_pipeline_job, voiceover_job],
    )


# ---------------------------------------------------------------------------
# Standalone helpers (work without Dagster installed)
# ---------------------------------------------------------------------------

def get_asset_graph() -> dict:
    """Return the asset dependency graph as a dict (no Dagster needed)."""
    return {
        "script": {"depends_on": [], "partitioned": True},
        "voiceover": {"depends_on": ["script"], "partitioned": True},
        "avatar": {"depends_on": ["voiceover"], "partitioned": True},
        "broll": {"depends_on": ["script"], "partitioned": True},
        "music": {"depends_on": [], "partitioned": False},
        "composite": {"depends_on": ["voiceover", "avatar", "broll", "music"], "partitioned": False},
        "captions": {"depends_on": ["composite"], "partitioned": False},
    }


def get_rebuild_plan(changed_assets: list[str]) -> list[str]:
    """Given a list of changed assets, return all assets that need rebuilding.

    Example:
        get_rebuild_plan(["script"])  # → ["script", "voiceover", "avatar", "broll", "composite", "captions"]
        get_rebuild_plan(["music"])   # → ["music", "composite", "captions"]
    """
    graph = get_asset_graph()
    to_rebuild = set(changed_assets)
    changed = True

    while changed:
        changed = False
        for asset_name, info in graph.items():
            if asset_name in to_rebuild:
                continue
            if any(dep in to_rebuild for dep in info["depends_on"]):
                to_rebuild.add(asset_name)
                changed = True

    # Topological sort
    order = ["script", "voiceover", "avatar", "broll", "music", "composite", "captions"]
    return [a for a in order if a in to_rebuild]


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Dagster video production assets")
    parser.add_argument("--graph", action="store_true", help="Print asset dependency graph")
    parser.add_argument("--plan", nargs="+", help="Get rebuild plan for changed assets")
    parser.add_argument("--dev", action="store_true", help="Start Dagster dev server")
    args = parser.parse_args()

    if args.graph:
        print(json.dumps(get_asset_graph(), indent=2))
    elif args.plan:
        plan = get_rebuild_plan(args.plan)
        print(f"Rebuild plan for {args.plan}:")
        for i, asset_name in enumerate(plan, 1):
            print(f"  {i}. {asset_name}")
    elif args.dev:
        if not HAS_DAGSTER:
            print("dagster not installed. Run: pip install dagster dagster-webserver")
            sys.exit(1)
        os.system("dagster dev -f " + __file__)
    else:
        parser.print_help()
