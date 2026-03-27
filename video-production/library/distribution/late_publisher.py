#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
Late API multi-platform video distribution.

Single API call posts video to YouTube, LinkedIn, TikTok, X, Instagram,
and 8 more platforms. Handles format adaptation automatically.

Pricing: $19/mo. API: https://getlate.dev/

Usage:
    from late_publisher import publish_video
    results = await publish_video(
        video_path="final.mp4",
        platforms=["youtube", "linkedin", "twitter"],
        title="Tara: Build What Matters",
        description="See how Tara ships software from Slack.",
    )
"""

import asyncio
import json
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

LATE_API_KEY = os.environ.get("LATE_API_KEY", "")
LATE_API_BASE = "https://api.getlate.dev/v1"

SUPPORTED_PLATFORMS = [
    "youtube", "linkedin", "tiktok", "twitter", "instagram",
    "facebook", "threads", "reddit", "pinterest", "bluesky",
    "telegram", "google_business",
]


async def publish_video(
    video_path: str | Path,
    platforms: list[str],
    title: str,
    description: str,
    tags: list[str] | None = None,
    thumbnail_path: str | Path | None = None,
    schedule_at: str | None = None,
) -> dict:
    """Publish video to multiple platforms via Late API.

    Args:
        video_path: Path to the video file.
        platforms: List of platform names to post to.
        title: Video title.
        description: Video description/caption.
        tags: Optional list of tags/hashtags.
        thumbnail_path: Optional custom thumbnail image.
        schedule_at: ISO 8601 datetime to schedule post (None = immediate).

    Returns:
        Dict with per-platform results: {platform: {url, id, status}}.
    """
    try:
        import httpx
    except ImportError:
        raise ImportError("httpx not installed")

    if not LATE_API_KEY:
        raise ValueError("LATE_API_KEY not set in environment")

    video_path = Path(video_path)
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    invalid = [p for p in platforms if p not in SUPPORTED_PLATFORMS]
    if invalid:
        logger.warning(f"Unsupported platforms (skipping): {invalid}")
        platforms = [p for p in platforms if p in SUPPORTED_PLATFORMS]

    headers = {"Authorization": f"Bearer {LATE_API_KEY}"}

    logger.info(f"[Late] Publishing to {len(platforms)} platforms: {', '.join(platforms)}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        files = {"video": (video_path.name, video_path.read_bytes(), "video/mp4")}
        data = {
            "platforms": json.dumps(platforms),
            "title": title,
            "description": description,
        }
        if tags:
            data["tags"] = json.dumps(tags)
        if schedule_at:
            data["schedule_at"] = schedule_at
        if thumbnail_path:
            thumb = Path(thumbnail_path)
            if thumb.exists():
                files["thumbnail"] = (thumb.name, thumb.read_bytes(), "image/png")

        response = await client.post(
            f"{LATE_API_BASE}/posts/create",
            files=files, data=data, headers=headers,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"Late API error {response.status_code}: {response.text[:300]}")

        result = response.json()

    per_platform = {}
    for platform_result in result.get("results", result.get("posts", [])):
        platform = platform_result.get("platform", "unknown")
        per_platform[platform] = {
            "url": platform_result.get("url", ""),
            "id": platform_result.get("post_id", platform_result.get("id", "")),
            "status": platform_result.get("status", "published"),
        }
        logger.info(f"  [{platform}] {per_platform[platform]['status']}: {per_platform[platform]['url']}")

    return per_platform


async def get_post_analytics(post_id: str) -> dict:
    """Get analytics for a published post."""
    import httpx

    headers = {"Authorization": f"Bearer {LATE_API_KEY}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{LATE_API_BASE}/posts/{post_id}/analytics", headers=headers)
        return response.json()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Late API video publisher")
    parser.add_argument("video", help="Video file path")
    parser.add_argument("--platforms", nargs="+", default=["youtube", "linkedin", "twitter"])
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--tags", nargs="*")
    parser.add_argument("--thumbnail", help="Thumbnail image path")
    args = parser.parse_args()

    results = asyncio.run(publish_video(
        video_path=args.video, platforms=args.platforms,
        title=args.title, description=args.description,
        tags=args.tags, thumbnail_path=args.thumbnail,
    ))
    print(json.dumps(results, indent=2))
