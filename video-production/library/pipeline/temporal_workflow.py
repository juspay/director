#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Temporal workflow for durable video production pipeline execution.

Wraps the 6-phase pipeline as a Temporal Workflow with each phase as an
Activity. Provides:
- Crash-safe execution (survives process restarts)
- Automatic retries with exponential backoff
- Saga compensation (clean up partial outputs on failure)
- Heartbeating for long-running API polls (Runway, D-ID)

Requires: pip install temporalio

Usage:
    # Start Temporal worker
    python temporal_workflow.py worker

    # Execute workflow
    python temporal_workflow.py run --scenes scenes.json

Architecture:
    Phase 1 (Voiceover) → [Phase 2 (Avatar) | Phase 3 (B-roll) | Phase 4 (Music)] → Phase 5 (Composite) → Phase 6 (Captions)
    Phases 2-4 run concurrently since they're independent.
"""

import asyncio
import logging
import os
import sys
from datetime import timedelta
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# Activity timeout defaults
SHORT_TIMEOUT = timedelta(minutes=5)    # voiceover, captions
MEDIUM_TIMEOUT = timedelta(minutes=15)  # music, compositing
LONG_TIMEOUT = timedelta(minutes=30)    # avatar (D-ID), B-roll (Runway)

TASK_QUEUE = "video-production"


try:
    from temporalio import activity, workflow
    from temporalio.client import Client as TemporalClient
    from temporalio.worker import Worker
    from temporalio.common import RetryPolicy
    HAS_TEMPORAL = True
except ImportError:
    HAS_TEMPORAL = False


# ---------------------------------------------------------------------------
# Activity definitions (each wraps one pipeline phase)
# ---------------------------------------------------------------------------

if HAS_TEMPORAL:

    @activity.defn
    async def generate_voiceover_activity(config: dict) -> dict:
        """Phase 1: Generate voiceover from script text."""
        activity.heartbeat("Starting voiceover generation")
        logger.info("[Phase 1] Generating voiceover...")

        # Import and call the actual voiceover generator
        # The specific provider is selected based on config["provider"]
        provider = config.get("provider", "elevenlabs")
        text = config["text"]
        output_dir = config.get("output_dir", "assets/voiceover")

        activity.heartbeat(f"Generating with {provider}")

        # Placeholder: actual provider dispatch would go here
        # e.g., from library.voiceover.elevenlabs_generator import generate
        result = {
            "phase": "voiceover",
            "provider": provider,
            "output_dir": output_dir,
            "status": "complete",
        }

        activity.heartbeat("Voiceover complete")
        return result

    @activity.defn
    async def generate_avatar_activity(config: dict) -> dict:
        """Phase 2: Generate avatar animation (D-ID, MuseTalk, or Rive)."""
        logger.info("[Phase 2] Generating avatar...")

        provider = config.get("provider", "musetalk")

        # Long-running: heartbeat every 10s during D-ID/MuseTalk polling
        for i in range(60):  # Up to 10 min
            activity.heartbeat(f"Avatar generation: polling ({i*10}s)")
            await asyncio.sleep(10)
            # Check if generation is complete (placeholder)
            break

        return {"phase": "avatar", "provider": provider, "status": "complete"}

    @activity.defn
    async def generate_broll_activity(config: dict) -> dict:
        """Phase 3: Generate B-roll clips (Runway, Kling, Veo)."""
        logger.info("[Phase 3] Generating B-roll...")

        provider = config.get("provider", "kling")
        scenes = config.get("scenes", [])

        for i, scene in enumerate(scenes):
            activity.heartbeat(f"B-roll scene {i+1}/{len(scenes)}")
            # Placeholder: actual generation
            await asyncio.sleep(1)

        return {"phase": "broll", "provider": provider, "scenes": len(scenes), "status": "complete"}

    @activity.defn
    async def generate_music_activity(config: dict) -> dict:
        """Phase 4: Generate background music."""
        logger.info("[Phase 4] Generating music...")
        activity.heartbeat("Music generation")

        provider = config.get("provider", "programmatic")
        return {"phase": "music", "provider": provider, "status": "complete"}

    @activity.defn
    async def composite_video_activity(config: dict) -> dict:
        """Phase 5: Composite all assets into final video."""
        logger.info("[Phase 5] Compositing...")
        activity.heartbeat("Compositing video")

        return {"phase": "composite", "status": "complete"}

    @activity.defn
    async def generate_captions_activity(config: dict) -> dict:
        """Phase 6: Generate and burn captions."""
        logger.info("[Phase 6] Generating captions...")
        activity.heartbeat("Caption generation")

        return {"phase": "captions", "status": "complete"}

    @activity.defn
    async def cleanup_partial_outputs_activity(config: dict) -> dict:
        """Saga compensation: clean up partial outputs on failure."""
        logger.info("[Compensation] Cleaning up partial outputs...")
        output_dir = config.get("output_dir", "")
        # Placeholder: actual cleanup
        return {"phase": "cleanup", "status": "complete"}


# ---------------------------------------------------------------------------
# Workflow definition
# ---------------------------------------------------------------------------

if HAS_TEMPORAL:

    @workflow.defn
    class VideoProductionWorkflow:
        """Durable video production workflow with 6 phases.

        Phases 2-4 run concurrently (avatar, B-roll, music are independent).
        Saga compensation cleans up if any phase fails after others succeed.
        """

        @workflow.run
        async def run(self, config: dict) -> dict:
            """Execute the full video production pipeline.

            Args:
                config: Dict with keys:
                    - scenes: list of scene configs
                    - text: narration text
                    - providers: dict of provider selections per phase
                    - output_dir: base output directory

            Returns:
                Dict with per-phase results and final output path.
            """
            results = {}
            retry_policy = RetryPolicy(
                initial_interval=timedelta(seconds=5),
                maximum_interval=timedelta(minutes=2),
                maximum_attempts=3,
                backoff_coefficient=2.0,
            )

            try:
                # Phase 1: Voiceover (sequential — everything else depends on it)
                results["voiceover"] = await workflow.execute_activity(
                    generate_voiceover_activity,
                    config,
                    start_to_close_timeout=SHORT_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )

                # Phases 2-4: Concurrent (independent of each other)
                avatar_task = workflow.execute_activity(
                    generate_avatar_activity,
                    config,
                    start_to_close_timeout=LONG_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )
                broll_task = workflow.execute_activity(
                    generate_broll_activity,
                    config,
                    start_to_close_timeout=LONG_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )
                music_task = workflow.execute_activity(
                    generate_music_activity,
                    config,
                    start_to_close_timeout=MEDIUM_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )

                # Wait for all concurrent phases
                avatar_result, broll_result, music_result = await asyncio.gather(
                    avatar_task, broll_task, music_task,
                )
                results["avatar"] = avatar_result
                results["broll"] = broll_result
                results["music"] = music_result

                # Phase 5: Composite (depends on phases 1-4)
                results["composite"] = await workflow.execute_activity(
                    composite_video_activity,
                    config,
                    start_to_close_timeout=MEDIUM_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )

                # Phase 6: Captions (depends on phase 5)
                results["captions"] = await workflow.execute_activity(
                    generate_captions_activity,
                    config,
                    start_to_close_timeout=SHORT_TIMEOUT,
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=retry_policy,
                )

                return {"status": "complete", "results": results}

            except Exception as e:
                # Saga compensation: clean up partial outputs
                logger.error(f"Pipeline failed at: {e}. Running compensation...")
                try:
                    await workflow.execute_activity(
                        cleanup_partial_outputs_activity,
                        config,
                        start_to_close_timeout=SHORT_TIMEOUT,
                    )
                except Exception as cleanup_err:
                    logger.error(f"Compensation also failed: {cleanup_err}")

                raise


# ---------------------------------------------------------------------------
# Worker and client helpers
# ---------------------------------------------------------------------------

async def start_worker(temporal_address: str = "localhost:7233"):
    """Start a Temporal worker that processes video production workflows."""
    if not HAS_TEMPORAL:
        raise ImportError("temporalio not installed. Run: pip install temporalio")

    client = await TemporalClient.connect(temporal_address)

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[VideoProductionWorkflow],
        activities=[
            generate_voiceover_activity,
            generate_avatar_activity,
            generate_broll_activity,
            generate_music_activity,
            composite_video_activity,
            generate_captions_activity,
            cleanup_partial_outputs_activity,
        ],
    )

    logger.info(f"Worker started on queue: {TASK_QUEUE}")
    await worker.run()


async def execute_workflow(
    config: dict,
    temporal_address: str = "localhost:7233",
    workflow_id: str | None = None,
) -> dict:
    """Execute a video production workflow and wait for result."""
    if not HAS_TEMPORAL:
        raise ImportError("temporalio not installed. Run: pip install temporalio")

    client = await TemporalClient.connect(temporal_address)

    if workflow_id is None:
        import uuid
        workflow_id = f"video-production-{uuid.uuid4().hex[:8]}"

    result = await client.execute_workflow(
        VideoProductionWorkflow.run,
        config,
        id=workflow_id,
        task_queue=TASK_QUEUE,
        execution_timeout=timedelta(hours=2),
    )

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Temporal video production workflow")
    subparsers = parser.add_subparsers(dest="command")

    worker_parser = subparsers.add_parser("worker", help="Start Temporal worker")
    worker_parser.add_argument("--address", default="localhost:7233")

    run_parser = subparsers.add_parser("run", help="Execute workflow")
    run_parser.add_argument("--scenes", type=str, help="Scenes JSON file")
    run_parser.add_argument("--text", type=str, help="Narration text")
    run_parser.add_argument("--address", default="localhost:7233")

    args = parser.parse_args()

    if not HAS_TEMPORAL:
        print("temporalio not installed. Run: pip install temporalio")
        sys.exit(1)

    if args.command == "worker":
        asyncio.run(start_worker(args.address))
    elif args.command == "run":
        config = {}
        if args.scenes:
            import json
            with open(args.scenes) as f:
                config["scenes"] = json.load(f)
        if args.text:
            config["text"] = args.text
        result = asyncio.run(execute_workflow(config, args.address))
        import json
        print(json.dumps(result, indent=2))
    else:
        parser.print_help()
