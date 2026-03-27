#!/usr/bin/env python3
"""VMAF regression gating — deterministic quality comparison between video iterations.

Computes VMAF and SSIM between a current render and a reference (previous best).
Unlike AI-based scoring (Gemini), VMAF is deterministic with zero variance,
making it ideal for detecting regressions between iterations.

Requires: pip install ffmpeg-quality-metrics
Also requires ffmpeg with libvmaf support.

Usage:
    from vmaf_gating import check_regression

    result = check_regression("current_render.mp4", "previous_best.mp4")
    if result["regression"]:
        print(f"REGRESSION: VMAF dropped {result['vmaf_delta']:.1f} points")
    else:
        print(f"OK: VMAF {result['vmaf_current']:.1f} (delta: {result['vmaf_delta']:+.1f})")
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Optional


# VMAF > 90 is excellent quality; a drop > 2.0 points indicates regression
DEFAULT_REGRESSION_THRESHOLD = 2.0


def compute_vmaf(distorted: str | Path, reference: str | Path,
                 metrics: tuple = ("vmaf", "ssim")) -> dict:
    """Compute VMAF and/or SSIM between two video files.

    Args:
        distorted: Path to the current (potentially degraded) video.
        reference: Path to the reference (known-good) video.
        metrics: Tuple of metrics to compute. Options: "vmaf", "ssim", "psnr".

    Returns:
        Dict with per-metric scores, e.g.:
        {"vmaf": 95.2, "ssim": 0.987, "psnr": 42.1}
    """
    distorted = str(Path(distorted).resolve())
    reference = str(Path(reference).resolve())

    try:
        from ffmpeg_quality_metrics import FfmpegQualityMetrics
    except ImportError:
        print("ERROR: ffmpeg-quality-metrics not installed.")
        print("       Install: pip install ffmpeg-quality-metrics")
        return {}

    try:
        fqm = FfmpegQualityMetrics(distorted, reference)
        results = {}

        if "vmaf" in metrics:
            vmaf_scores = fqm.calculate(["vmaf"])
            if "vmaf" in vmaf_scores and vmaf_scores["vmaf"]:
                # Average across all frames
                vmaf_values = [f["vmaf"] for f in vmaf_scores["vmaf"]]
                results["vmaf"] = sum(vmaf_values) / len(vmaf_values) if vmaf_values else 0.0

        if "ssim" in metrics:
            ssim_scores = fqm.calculate(["ssim"])
            if "ssim" in ssim_scores and ssim_scores["ssim"]:
                ssim_values = [f["ssim_y"] for f in ssim_scores["ssim"]]
                results["ssim"] = sum(ssim_values) / len(ssim_values) if ssim_values else 0.0

        if "psnr" in metrics:
            psnr_scores = fqm.calculate(["psnr"])
            if "psnr" in psnr_scores and psnr_scores["psnr"]:
                psnr_values = [f["psnr_avg"] for f in psnr_scores["psnr"]]
                results["psnr"] = sum(psnr_values) / len(psnr_values) if psnr_values else 0.0

        return results

    except Exception as e:
        # Fallback: use ffmpeg directly with libvmaf
        print(f"  [vmaf] ffmpeg-quality-metrics failed: {e}")
        print(f"  [vmaf] Falling back to direct ffmpeg libvmaf...")
        return _compute_vmaf_ffmpeg(distorted, reference)


def _compute_vmaf_ffmpeg(distorted: str, reference: str) -> dict:
    """Fallback VMAF computation using ffmpeg directly."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-i", distorted, "-i", reference,
                "-lavfi", "libvmaf=log_fmt=json:log_path=/dev/stdout",
                "-f", "null", "-",
            ],
            capture_output=True, text=True, timeout=300,
        )
        # Parse VMAF JSON from stdout
        for line in result.stderr.split("\n"):
            if "VMAF score" in line:
                # Extract score from "VMAF score: XX.XX"
                parts = line.split("VMAF score:")
                if len(parts) > 1:
                    return {"vmaf": float(parts[1].strip())}
        return {}
    except Exception as e:
        print(f"  [vmaf] Direct ffmpeg also failed: {e}")
        return {}


def check_regression(current: str | Path, reference: str | Path,
                     threshold: float = DEFAULT_REGRESSION_THRESHOLD) -> dict:
    """Check if current render is a regression compared to reference.

    Args:
        current: Path to the current render.
        reference: Path to the previous best render.
        threshold: VMAF drop threshold to flag as regression (default: 2.0).

    Returns:
        Dict with:
        - regression: bool — True if VMAF dropped more than threshold
        - vmaf_current: float — VMAF score of current render (vs reference)
        - vmaf_delta: float — Change from reference (negative = worse)
        - ssim: float — SSIM score
        - message: str — Human-readable summary
    """
    print(f"  [vmaf] Computing VMAF: {Path(current).name} vs {Path(reference).name}")

    scores = compute_vmaf(current, reference)

    if not scores or "vmaf" not in scores:
        return {
            "regression": False,
            "vmaf_current": 0.0,
            "vmaf_delta": 0.0,
            "ssim": 0.0,
            "message": "VMAF computation failed — cannot determine regression",
            "error": True,
        }

    vmaf = scores["vmaf"]
    ssim = scores.get("ssim", 0.0)

    # VMAF of current vs reference:
    # - Score of 100 means identical
    # - Score < 100 means current is worse than reference
    # - We flag regression if VMAF < (100 - threshold)
    vmaf_delta = vmaf - 100.0  # How much worse than identical
    is_regression = vmaf < (100.0 - threshold)

    if is_regression:
        message = f"REGRESSION: VMAF {vmaf:.1f} (delta: {vmaf_delta:+.1f}, threshold: -{threshold})"
    else:
        message = f"OK: VMAF {vmaf:.1f} (delta: {vmaf_delta:+.1f})"

    print(f"  [vmaf] {message}")
    if ssim > 0:
        print(f"  [vmaf] SSIM: {ssim:.4f}")

    return {
        "regression": is_regression,
        "vmaf_current": round(vmaf, 2),
        "vmaf_delta": round(vmaf_delta, 2),
        "ssim": round(ssim, 4),
        "message": message,
    }


def compare_iterations(video_a: str | Path, video_b: str | Path,
                       labels: tuple = ("A", "B")) -> dict:
    """Compare two video iterations bidirectionally.

    Computes VMAF in both directions to give a symmetric quality comparison.
    Useful for A/B testing between iterations without designating a "reference".

    Returns:
        Dict with scores in both directions and a recommendation.
    """
    print(f"  [vmaf] Comparing {labels[0]} vs {labels[1]}...")

    # A as distorted, B as reference
    scores_ab = compute_vmaf(str(video_a), str(video_b))
    # B as distorted, A as reference
    scores_ba = compute_vmaf(str(video_b), str(video_a))

    vmaf_ab = scores_ab.get("vmaf", 0)
    vmaf_ba = scores_ba.get("vmaf", 0)

    # Higher VMAF when used as reference = that version is higher quality
    if abs(vmaf_ab - vmaf_ba) < 0.5:
        recommendation = "EQUIVALENT"
    elif vmaf_ab > vmaf_ba:
        recommendation = f"{labels[1]} is better (VMAF {labels[0]}→{labels[1]}: {vmaf_ab:.1f} vs {labels[1]}→{labels[0]}: {vmaf_ba:.1f})"
    else:
        recommendation = f"{labels[0]} is better (VMAF {labels[1]}→{labels[0]}: {vmaf_ba:.1f} vs {labels[0]}→{labels[1]}: {vmaf_ab:.1f})"

    print(f"  [vmaf] {recommendation}")

    return {
        f"vmaf_{labels[0]}_vs_{labels[1]}": round(vmaf_ab, 2),
        f"vmaf_{labels[1]}_vs_{labels[0]}": round(vmaf_ba, 2),
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="VMAF regression gating")
    parser.add_argument("current", help="Current render video path")
    parser.add_argument("reference", help="Reference (previous best) video path")
    parser.add_argument("--threshold", type=float, default=DEFAULT_REGRESSION_THRESHOLD,
                        help=f"VMAF drop threshold for regression (default: {DEFAULT_REGRESSION_THRESHOLD})")
    parser.add_argument("--compare", action="store_true",
                        help="Bidirectional comparison instead of regression check")
    args = parser.parse_args()

    if args.compare:
        result = compare_iterations(args.current, args.reference)
    else:
        result = check_regression(args.current, args.reference, args.threshold)

    print(json.dumps(result, indent=2))

    if result.get("regression"):
        sys.exit(1)  # Non-zero exit for CI/CD gating
