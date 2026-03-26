#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
VideoObject JSON-LD schema generator for SEO.

Generates schema.org VideoObject structured data that gives 30% higher CTR
in search results and enables video carousel eligibility in Google Search.

Usage:
    from schema_generator import generate_video_schema
    schema = generate_video_schema(
        name="Tara: Build What Matters",
        description="AI-native development platform demo",
        duration_seconds=170,
        thumbnail_url="https://example.com/thumb.jpg",
        content_url="https://example.com/video.mp4",
    )
"""

import json
from datetime import datetime, timezone
from typing import Optional


def generate_video_schema(
    name: str,
    description: str,
    duration_seconds: int,
    thumbnail_url: str,
    content_url: str,
    upload_date: str | None = None,
    embed_url: str | None = None,
    interaction_count: int | None = None,
    expires: str | None = None,
) -> dict:
    """Generate VideoObject JSON-LD structured data.

    Args:
        name: Video title.
        description: Video description (1-2 sentences).
        duration_seconds: Duration in seconds.
        thumbnail_url: URL to thumbnail image.
        content_url: Direct URL to video file.
        upload_date: ISO 8601 date (default: today).
        embed_url: URL of embeddable player (optional).
        interaction_count: View count (optional).
        expires: Expiration date ISO 8601 (optional).

    Returns:
        Dict representing valid JSON-LD VideoObject.
    """
    duration_iso = _seconds_to_iso8601(duration_seconds)

    schema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": name,
        "description": description,
        "thumbnailUrl": thumbnail_url,
        "contentUrl": content_url,
        "uploadDate": upload_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "duration": duration_iso,
    }

    if embed_url:
        schema["embedUrl"] = embed_url
    if interaction_count is not None:
        schema["interactionStatistic"] = {
            "@type": "InteractionCounter",
            "interactionType": {"@type": "WatchAction"},
            "userInteractionCount": interaction_count,
        }
    if expires:
        schema["expires"] = expires

    return schema


def generate_video_schema_html(schema: dict) -> str:
    """Wrap JSON-LD schema in a <script> tag for HTML embedding."""
    json_str = json.dumps(schema, indent=2, ensure_ascii=False)
    return f'<script type="application/ld+json">\n{json_str}\n</script>'


def _seconds_to_iso8601(seconds: int) -> str:
    """Convert seconds to ISO 8601 duration (PT#H#M#S)."""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60

    parts = ["PT"]
    if hours:
        parts.append(f"{hours}H")
    if minutes:
        parts.append(f"{minutes}M")
    parts.append(f"{secs}S")

    return "".join(parts)


if __name__ == "__main__":
    # Example usage
    schema = generate_video_schema(
        name="Tara: Build What Matters",
        description="See how Tara turns a Slack conversation into shipped software in 13 minutes.",
        duration_seconds=170,
        thumbnail_url="https://tara.ai/video-thumb.jpg",
        content_url="https://tara.ai/video/tara-builders.mp4",
    )
    print(generate_video_schema_html(schema))
