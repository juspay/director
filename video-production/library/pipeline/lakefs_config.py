#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
lakeFS configuration for large media asset versioning.

Git-like branching, commits, and merges for video/audio/image files stored
in S3-compatible object storage. Replaces Git LFS for large media assets.

Requires: pip install lakefs-sdk
Environment: LAKEFS_ENDPOINT, LAKEFS_ACCESS_KEY_ID, LAKEFS_SECRET_ACCESS_KEY

Usage:
    from lakefs_config import upload_asset, download_asset, create_branch, commit_assets

    create_branch("experiment-new-voice", source="main")
    upload_asset("experiment-new-voice", "voiceover/narration.mp3", "local/narration.mp3")
    commit_assets("experiment-new-voice", "Try new ElevenLabs voice")
"""

import logging
import os
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

LAKEFS_ENDPOINT = os.environ.get("LAKEFS_ENDPOINT", "http://localhost:8000")
LAKEFS_ACCESS_KEY = os.environ.get("LAKEFS_ACCESS_KEY_ID", "")
LAKEFS_SECRET_KEY = os.environ.get("LAKEFS_SECRET_ACCESS_KEY", "")
LAKEFS_REPO = os.environ.get("LAKEFS_REPO", "director-assets")

try:
    import lakefs_sdk
    from lakefs_sdk.client import LakeFSClient
    HAS_LAKEFS = True
except ImportError:
    HAS_LAKEFS = False


def _get_client() -> "LakeFSClient":
    if not HAS_LAKEFS:
        raise ImportError("lakefs-sdk not installed. Run: pip install lakefs-sdk")
    if not LAKEFS_ACCESS_KEY:
        raise ValueError("LAKEFS_ACCESS_KEY_ID not set")

    configuration = lakefs_sdk.Configuration(
        host=LAKEFS_ENDPOINT,
        username=LAKEFS_ACCESS_KEY,
        password=LAKEFS_SECRET_KEY,
    )
    return LakeFSClient(configuration)


def upload_asset(branch: str, remote_path: str, local_file: str | Path,
                 repo: str = LAKEFS_REPO) -> str:
    """Upload a local file to lakeFS."""
    client = _get_client()
    local_file = Path(local_file)
    if not local_file.exists():
        raise FileNotFoundError(f"Local file not found: {local_file}")

    logger.info(f"[lakeFS] Uploading {local_file.name} → {repo}/{branch}/{remote_path}")

    with open(local_file, "rb") as f:
        client.objects_api.upload_object(
            repository=repo, branch=branch, path=remote_path, content=f,
        )

    return f"lakefs://{repo}/{branch}/{remote_path}"


def download_asset(branch: str, remote_path: str, local_file: str | Path,
                   repo: str = LAKEFS_REPO) -> Path:
    """Download a file from lakeFS to local path."""
    client = _get_client()
    local_file = Path(local_file)
    local_file.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"[lakeFS] Downloading {repo}/{branch}/{remote_path} → {local_file}")

    response = client.objects_api.get_object(
        repository=repo, ref=branch, path=remote_path,
    )

    local_file.write_bytes(response.read())
    logger.info(f"[lakeFS] Downloaded: {local_file} ({local_file.stat().st_size / 1024:.0f} KB)")
    return local_file


def create_branch(name: str, source: str = "main", repo: str = LAKEFS_REPO) -> str:
    """Create a new branch from source."""
    client = _get_client()
    logger.info(f"[lakeFS] Creating branch: {name} from {source}")

    client.branches_api.create_branch(
        repository=repo,
        branch_creation=lakefs_sdk.BranchCreation(name=name, source=source),
    )
    return name


def commit_assets(branch: str, message: str, repo: str = LAKEFS_REPO,
                  metadata: dict | None = None) -> str:
    """Commit staged changes on a branch."""
    client = _get_client()
    logger.info(f"[lakeFS] Committing on {branch}: {message}")

    commit = client.commits_api.commit(
        repository=repo,
        branch=branch,
        commit_creation=lakefs_sdk.CommitCreation(
            message=message,
            metadata=metadata or {},
        ),
    )
    logger.info(f"[lakeFS] Committed: {commit.id}")
    return commit.id


def merge_branch(source: str, destination: str = "main", repo: str = LAKEFS_REPO) -> str:
    """Merge source branch into destination."""
    client = _get_client()
    logger.info(f"[lakeFS] Merging {source} → {destination}")

    result = client.refs_api.merge_into_branch(
        repository=repo,
        source_ref=source,
        destination_branch=destination,
    )
    return result.reference


def list_assets(branch: str, prefix: str = "", repo: str = LAKEFS_REPO) -> list[dict]:
    """List assets on a branch with optional path prefix."""
    client = _get_client()
    response = client.objects_api.list_objects(
        repository=repo, ref=branch, prefix=prefix,
    )
    return [{"path": obj.path, "size": obj.size_bytes} for obj in response.results]


if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="lakeFS asset manager")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("list").add_argument("--branch", default="main")
    b = sub.add_parser("branch")
    b.add_argument("name")
    b.add_argument("--source", default="main")

    args = parser.parse_args()
    if args.cmd == "list":
        assets = list_assets(args.branch)
        print(json.dumps(assets, indent=2))
    elif args.cmd == "branch":
        create_branch(args.name, args.source)
    else:
        parser.print_help()
