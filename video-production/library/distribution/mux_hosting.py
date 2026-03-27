#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Mux video hosting with HLS transcoding and engagement analytics.

Free tier: 100K minutes/month delivered. Auto HLS transcoding,
engagement analytics, QoE metrics.

Requires: pip install mux-python (or use httpx directly)
Environment: MUX_TOKEN_ID, MUX_TOKEN_SECRET

Usage:
    from mux_hosting import upload_video, get_analytics
    asset = await upload_video("final.mp4")
    analytics = await get_analytics(asset["asset_id"])
"""

import asyncio
import base64
import json
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

MUX_TOKEN_ID = os.environ.get("MUX_TOKEN_ID", "")
MUX_TOKEN_SECRET = os.environ.get("MUX_TOKEN_SECRET", "")
MUX_API_BASE = "https://api.mux.com"


def _auth_header() -> str:
    if not MUX_TOKEN_ID or not MUX_TOKEN_SECRET:
        raise ValueError("MUX_TOKEN_ID and MUX_TOKEN_SECRET not set")
    creds = base64.b64encode(f"{MUX_TOKEN_ID}:{MUX_TOKEN_SECRET}".encode()).decode()
    return f"Basic {creds}"


async def upload_video(
    video_path: str | Path,
    playback_policy: str = "public",
) -> dict:
    """Upload video to Mux. Returns asset ID and playback URL.

    Mux automatically transcodes to HLS with adaptive bitrate.
    """
    import httpx

    video_path = Path(video_path)
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    headers = {"Authorization": _auth_header(), "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Step 1: Create upload URL
        response = await client.post(
            f"{MUX_API_BASE}/video/v1/uploads",
            json={
                "new_asset_settings": {"playback_policy": [playback_policy]},
                "cors_origin": "*",
            },
            headers=headers,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"Mux error {response.status_code}: {response.text[:300]}")

        upload = response.json()["data"]
        upload_url = upload["url"]
        upload_id = upload["id"]

        logger.info(f"[Mux] Upload URL created: {upload_id}")

        # Step 2: Upload video via PUT
        with open(video_path, "rb") as f:
            put_response = await client.put(
                upload_url, content=f.read(),
                headers={"Content-Type": "video/mp4"},
            )

        if put_response.status_code not in (200, 201):
            raise RuntimeError(f"Mux upload failed: {put_response.status_code}")

        logger.info(f"[Mux] Video uploaded, processing...")

        # Step 3: Poll for asset creation
        asset_id = None
        for _ in range(60):
            await asyncio.sleep(5)
            check = await client.get(
                f"{MUX_API_BASE}/video/v1/uploads/{upload_id}",
                headers=headers,
            )
            data = check.json()["data"]
            if data.get("asset_id"):
                asset_id = data["asset_id"]
                break

        if not asset_id:
            raise RuntimeError("Mux asset creation timed out")

        # Get playback ID
        asset_resp = await client.get(
            f"{MUX_API_BASE}/video/v1/assets/{asset_id}",
            headers=headers,
        )
        asset_data = asset_resp.json()["data"]
        playback_ids = asset_data.get("playback_ids", [])
        playback_url = ""
        if playback_ids:
            pid = playback_ids[0]["id"]
            playback_url = f"https://stream.mux.com/{pid}.m3u8"

    logger.info(f"[Mux] Asset ready: {asset_id}")
    logger.info(f"[Mux] Playback: {playback_url}")

    return {
        "asset_id": asset_id,
        "playback_url": playback_url,
        "upload_id": upload_id,
        "status": asset_data.get("status", "ready"),
        "duration": asset_data.get("duration"),
    }


async def get_analytics(asset_id: str) -> dict:
    """Get engagement analytics for a Mux asset."""
    import httpx

    headers = {"Authorization": _auth_header()}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{MUX_API_BASE}/data/v1/video-views",
            params={"filters[]": f"asset_id:{asset_id}"},
            headers=headers,
        )

        if response.status_code != 200:
            return {"error": f"Analytics API returned {response.status_code}"}

        data = response.json().get("data", [])

    total_views = len(data)
    total_watch_time = sum(v.get("watch_time", 0) for v in data)

    return {
        "asset_id": asset_id,
        "total_views": total_views,
        "total_watch_time_seconds": total_watch_time,
        "avg_watch_time": total_watch_time / max(total_views, 1),
    }


async def create_playback_id(asset_id: str, policy: str = "public") -> str:
    """Create a new playback ID for an asset."""
    import httpx

    headers = {"Authorization": _auth_header(), "Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MUX_API_BASE}/video/v1/assets/{asset_id}/playback-ids",
            json={"policy": policy},
            headers=headers,
        )

        pid = response.json()["data"]["id"]
        return f"https://stream.mux.com/{pid}.m3u8"


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Mux video hosting")
    sub = parser.add_subparsers(dest="cmd")

    up = sub.add_parser("upload")
    up.add_argument("video", help="Video file path")

    an = sub.add_parser("analytics")
    an.add_argument("asset_id")

    args = parser.parse_args()
    if args.cmd == "upload":
        result = asyncio.run(upload_video(args.video))
        print(json.dumps(result, indent=2))
    elif args.cmd == "analytics":
        result = asyncio.run(get_analytics(args.asset_id))
        print(json.dumps(result, indent=2))
    else:
        parser.print_help()
