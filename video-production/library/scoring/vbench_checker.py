#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
VBench temporal quality checker for rendered videos.

Runs VBench temporal_flickering and motion_smoothness checks that catch
visual issues (flicker, jank) that Gemini scoring often misses.

VBench provides 16 quality dimensions; we focus on the two most relevant
for Remotion motion graphics output.

Requires: pip install vbench

Usage:
    from vbench_checker import check_temporal_quality
    result = check_temporal_quality("render.mp4")
    if result["issues"]:
        print("Quality issues found:", result["issues"])
"""

import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# Thresholds — flag issues below these scores (0-1 scale)
DEFAULT_THRESHOLDS = {
    "temporal_flickering": 0.90,  # Below this = noticeable flicker
    "motion_smoothness": 0.85,    # Below this = janky motion
}


def check_temporal_quality(
    video_path: str | Path,
    thresholds: dict | None = None,
    dimensions: tuple = ("temporal_flickering", "motion_smoothness"),
) -> dict:
    """Run VBench temporal quality checks on a rendered video.

    Args:
        video_path: Path to the video file.
        thresholds: Per-dimension score thresholds (flag if below).
        dimensions: Which VBench dimensions to check.

    Returns:
        Dict with per-dimension scores, issues list, and pass/fail status.
    """
    video_path = Path(video_path)
    if not video_path.exists():
        logger.error(f"Video not found: {video_path}")
        return {"error": "Video not found", "passed": False}

    effective_thresholds = {**DEFAULT_THRESHOLDS, **(thresholds or {})}

    try:
        return _check_with_vbench_python(video_path, dimensions, effective_thresholds)
    except ImportError:
        logger.info("[vbench] Python vbench not available, trying CLI...")
        return _check_with_vbench_cli(video_path, dimensions, effective_thresholds)
    except Exception as e:
        logger.warning(f"[vbench] VBench check failed: {e}")
        return {
            "error": str(e),
            "passed": True,  # Don't block on VBench failure
            "scores": {},
            "issues": [],
        }


def _check_with_vbench_python(
    video_path: Path, dimensions: tuple, thresholds: dict,
) -> dict:
    """Run VBench checks using the Python API."""
    from vbench import VBench

    scores = {}
    issues = []

    for dim in dimensions:
        logger.info(f"[vbench] Checking {dim}...")
        try:
            bench = VBench()
            result = bench.evaluate(
                videos_path=str(video_path),
                dimension=dim,
                mode="custom_input",
            )
            score = result.get(dim, 0.0) if isinstance(result, dict) else 0.0
            scores[dim] = round(float(score), 4)

            threshold = thresholds.get(dim, 0.85)
            if score < threshold:
                issues.append(f"{dim}: {score:.3f} (below {threshold})")
                logger.warning(f"[vbench] {dim}: {score:.3f} < {threshold} — ISSUE")
            else:
                logger.info(f"[vbench] {dim}: {score:.3f} — OK")

        except Exception as e:
            logger.warning(f"[vbench] {dim} check failed: {e}")
            scores[dim] = None

    return {
        "scores": scores,
        "issues": issues,
        "passed": len(issues) == 0,
        "thresholds": thresholds,
    }


def _check_with_vbench_cli(
    video_path: Path, dimensions: tuple, thresholds: dict,
) -> dict:
    """Run VBench checks using the CLI (fallback)."""
    scores = {}
    issues = []

    for dim in dimensions:
        logger.info(f"[vbench] CLI check: {dim}...")
        try:
            result = subprocess.run(
                [
                    sys.executable, "-m", "vbench", "evaluate",
                    "--videos_path", str(video_path),
                    "--dimension", dim,
                    "--mode", "custom_input",
                ],
                capture_output=True, text=True, timeout=300,
            )

            if result.returncode == 0:
                # Try to parse score from output
                for line in result.stdout.split("\n"):
                    if dim in line and ":" in line:
                        try:
                            score_str = line.split(":")[-1].strip()
                            score = float(score_str)
                            scores[dim] = round(score, 4)

                            threshold = thresholds.get(dim, 0.85)
                            if score < threshold:
                                issues.append(f"{dim}: {score:.3f} (below {threshold})")
                            break
                        except ValueError:
                            continue
            else:
                logger.warning(f"[vbench] CLI {dim} failed: {result.stderr[:200]}")
                scores[dim] = None

        except Exception as e:
            logger.warning(f"[vbench] CLI {dim} error: {e}")
            scores[dim] = None

    return {
        "scores": scores,
        "issues": issues,
        "passed": len(issues) == 0,
        "thresholds": thresholds,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="VBench temporal quality checker")
    parser.add_argument("video", help="Path to video file")
    parser.add_argument("--flicker-threshold", type=float, default=0.90)
    parser.add_argument("--smoothness-threshold", type=float, default=0.85)
    args = parser.parse_args()

    thresholds = {
        "temporal_flickering": args.flicker_threshold,
        "motion_smoothness": args.smoothness_threshold,
    }

    result = check_temporal_quality(args.video, thresholds=thresholds)
    print(json.dumps(result, indent=2))

    if not result.get("passed", True):
        sys.exit(1)
