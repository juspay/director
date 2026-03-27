#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Remotion Lambda cloud rendering.

Distributes Remotion rendering across AWS Lambda functions for parallel
frame computation. A 170s video renders in <60s (vs 5-10 min locally).

Complements the local remotion_renderer.py — use Lambda for production
renders, local for development previews.

Requires:
- @remotion/lambda npm package
- AWS credentials with Lambda permissions
- Remotion license (free for individuals, $100/mo companies)

Usage:
    from lambda_renderer import render_on_lambda
    result = await render_on_lambda(
        composition="TaraBuilders",
        preset="final",
    )
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# AWS configuration
AWS_REGION = os.environ.get("REMOTION_AWS_REGION", "us-east-1")
AWS_ACCESS_KEY = os.environ.get("REMOTION_AWS_ACCESS_KEY_ID", os.environ.get("AWS_ACCESS_KEY_ID", ""))
AWS_SECRET_KEY = os.environ.get("REMOTION_AWS_SECRET_ACCESS_KEY", os.environ.get("AWS_SECRET_ACCESS_KEY", ""))

# Remotion Lambda configuration
FUNCTION_NAME = os.environ.get("REMOTION_FUNCTION_NAME", "")
SERVE_URL = os.environ.get("REMOTION_SERVE_URL", "")  # S3 URL of deployed Remotion bundle

OUTPUT_DIR = Path(__file__).parent.parent / "output"

# Map our pipeline presets to Remotion Lambda quality settings
LAMBDA_QUALITY = {
    "final": {"quality": 100, "scale": 1, "codec": "h264", "crf": 18},
    "preview": {"quality": 80, "scale": 1, "codec": "h264", "crf": 23},
    "draft": {"quality": 60, "scale": 0.5, "codec": "h264", "crf": 28},
    "av1_final": {"quality": 100, "scale": 1, "codec": "vp8", "crf": 30},
}


async def render_on_lambda(
    composition: str = "TaraBuilders",
    preset: str = "final",
    input_props: dict | None = None,
    output_path: Path | str | None = None,
    function_name: str | None = None,
    serve_url: str | None = None,
    region: str | None = None,
) -> dict:
    """Render a Remotion composition on AWS Lambda.

    Args:
        composition: Remotion composition ID.
        preset: Quality preset (final, preview, draft, av1_final).
        input_props: Props to pass to the Remotion composition.
        output_path: Where to download the rendered video.
        function_name: Lambda function name (or env REMOTION_FUNCTION_NAME).
        serve_url: S3 serve URL (or env REMOTION_SERVE_URL).
        region: AWS region (or env REMOTION_AWS_REGION).

    Returns:
        Dict with render_id, output_url, duration, cost_estimate.
    """
    fn = function_name or FUNCTION_NAME
    url = serve_url or SERVE_URL
    rgn = region or AWS_REGION

    if not fn or not url:
        raise ValueError(
            "Set REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL environment variables, "
            "or deploy with: npx remotion lambda deploy"
        )

    quality = LAMBDA_QUALITY.get(preset, LAMBDA_QUALITY["final"])

    if output_path is None:
        output_path = OUTPUT_DIR / f"lambda_{composition}_{preset}.mp4"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"[Lambda] Rendering {composition} ({preset}) on {fn}")

    # Use Remotion Lambda CLI
    cmd = [
        "npx", "remotion", "lambda", "render",
        "--function-name", fn,
        "--serve-url", url,
        "--composition", composition,
        "--codec", quality["codec"],
        "--crf", str(quality["crf"]),
        "--region", rgn,
    ]

    if quality.get("scale") and quality["scale"] != 1:
        cmd += ["--scale", str(quality["scale"])]

    if input_props:
        cmd += ["--props", json.dumps(input_props)]

    start_time = time.time()

    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=600,
    )

    if result.returncode != 0:
        logger.error(f"[Lambda] Render failed: {result.stderr[:500]}")
        raise RuntimeError(f"Lambda render failed: {result.stderr[:500]}")

    elapsed = time.time() - start_time

    # Parse output for render ID and S3 URL
    render_info = _parse_render_output(result.stdout)
    output_url = render_info.get("output_url", "")

    # Download rendered video
    if output_url:
        logger.info(f"[Lambda] Downloading from S3...")
        dl_cmd = ["curl", "-sL", "-o", str(output_path), output_url]
        subprocess.run(dl_cmd, check=True, timeout=120)

    size_mb = output_path.stat().st_size / 1024 / 1024 if output_path.exists() else 0
    logger.info(f"[Lambda] Complete: {output_path} ({size_mb:.1f} MB, {elapsed:.0f}s)")

    return {
        "render_id": render_info.get("render_id", ""),
        "output_url": output_url,
        "output_path": str(output_path),
        "duration_seconds": round(elapsed, 1),
        "cost_estimate": _estimate_cost(elapsed),
        "preset": preset,
    }


async def deploy_site(
    remotion_dir: str | Path,
    site_name: str = "tara-video",
    region: str | None = None,
) -> str:
    """Deploy Remotion project to S3 for Lambda rendering.

    Returns the serve URL to use with render_on_lambda().
    """
    rgn = region or AWS_REGION
    remotion_dir = Path(remotion_dir)

    logger.info(f"[Lambda] Deploying {remotion_dir} to S3...")

    cmd = [
        "npx", "remotion", "lambda", "sites", "create",
        "--site-name", site_name,
        "--region", rgn,
        str(remotion_dir),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    if result.returncode != 0:
        raise RuntimeError(f"Deploy failed: {result.stderr[:500]}")

    # Parse serve URL from output
    for line in result.stdout.split("\n"):
        if "https://" in line and ".s3." in line:
            url = line.strip()
            logger.info(f"[Lambda] Deployed: {url}")
            return url

    return result.stdout.strip()


async def deploy_function(region: str | None = None) -> str:
    """Deploy the Remotion Lambda function.

    Returns the function name to use with render_on_lambda().
    """
    rgn = region or AWS_REGION

    logger.info(f"[Lambda] Deploying Lambda function to {rgn}...")

    cmd = [
        "npx", "remotion", "lambda", "functions", "deploy",
        "--region", rgn,
        "--memory", "2048",
        "--timeout", "240",
        "--disk", "2048",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        raise RuntimeError(f"Function deploy failed: {result.stderr[:500]}")

    for line in result.stdout.split("\n"):
        if "remotion-render-" in line:
            fn_name = line.strip()
            logger.info(f"[Lambda] Function deployed: {fn_name}")
            return fn_name

    return result.stdout.strip()


def _parse_render_output(stdout: str) -> dict:
    """Parse Remotion Lambda CLI output for render ID and URL."""
    info = {}
    for line in stdout.split("\n"):
        if "Render ID" in line or "renderId" in line:
            info["render_id"] = line.split(":")[-1].strip()
        if "https://" in line and ".s3." in line:
            info["output_url"] = line.strip()
        if "Output" in line and "http" in line:
            info["output_url"] = line.split("Output")[-1].strip().strip(":")
    return info


def _estimate_cost(render_seconds: float) -> float:
    """Estimate Lambda rendering cost (very approximate).

    Based on typical Lambda pricing: ~$0.0000166667 per GB-second.
    A 170s video at 2GB memory renders in ~60s using ~20 Lambda invocations.
    """
    # ~20 Lambda invocations × ~30s each × 2GB = 1200 GB-seconds
    gb_seconds = 20 * min(render_seconds, 60) * 2  # 2GB memory
    return round(gb_seconds * 0.0000166667, 4)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Remotion Lambda renderer")
    subparsers = parser.add_subparsers(dest="command")

    render_p = subparsers.add_parser("render", help="Render on Lambda")
    render_p.add_argument("--composition", default="TaraBuilders")
    render_p.add_argument("--preset", default="final", choices=list(LAMBDA_QUALITY.keys()))
    render_p.add_argument("--output", help="Output path")

    deploy_site_p = subparsers.add_parser("deploy-site", help="Deploy Remotion to S3")
    deploy_site_p.add_argument("remotion_dir", help="Remotion project directory")

    deploy_fn_p = subparsers.add_parser("deploy-function", help="Deploy Lambda function")

    args = parser.parse_args()

    if args.command == "render":
        result = asyncio.run(render_on_lambda(
            composition=args.composition, preset=args.preset, output_path=args.output,
        ))
        print(json.dumps(result, indent=2))
    elif args.command == "deploy-site":
        url = asyncio.run(deploy_site(args.remotion_dir))
        print(f"Serve URL: {url}")
    elif args.command == "deploy-function":
        fn = asyncio.run(deploy_function())
        print(f"Function: {fn}")
    else:
        parser.print_help()
