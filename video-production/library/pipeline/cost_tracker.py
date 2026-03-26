#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-26
"""
API cost tracker for the video production pipeline.

Logs costs to a JSON-lines file for monitoring spend across providers.
Supports ElevenLabs, Runway, D-ID, Gemini, OpenAI, Fish Audio, and custom providers.

Usage:
    tracker = CostTracker()
    tracker.log_cost("elevenlabs", "tts", {"chars": 1700}, cost=0.34)
    tracker.log_cost("gemini", "score", {"tokens": 43000}, cost=0.054)
    print(tracker.get_summary())
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# Default cost estimates per provider (configurable)
COST_ESTIMATES = {
    "elevenlabs": {"tts_per_1k_chars": 0.30, "sfx_per_generation": 0.10},
    "openai": {"tts_per_1k_chars": 0.015},
    "fish_audio": {"tts_per_1k_chars": 0.015},
    "runway": {"video_per_second": 0.12},
    "kling": {"video_per_second": 0.029},
    "did": {"avatar_per_minute": 0.50},
    "gemini_pro": {"input_per_1m_tokens": 1.25, "output_per_1m_tokens": 10.00},
    "gemini_flash": {"input_per_1m_tokens": 0.30, "output_per_1m_tokens": 2.50},
}


class CostTracker:
    """Track API costs across providers to a JSON-lines file."""

    def __init__(self, log_path: str | Path | None = None):
        self.log_path = Path(log_path or
                             os.environ.get("COST_LOG_PATH",
                                            Path(__file__).parent / "cost_log.jsonl"))
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def log_cost(
        self,
        provider: str,
        operation: str,
        params: dict | None = None,
        cost: float | None = None,
        auto_estimate: bool = True,
    ) -> dict:
        """Log an API cost entry.

        Args:
            provider: Service name (elevenlabs, gemini, runway, etc.)
            operation: Operation type (tts, score, video_gen, avatar, sfx, etc.)
            params: Operation parameters (chars, tokens, seconds, etc.)
            cost: Exact cost if known. If None and auto_estimate=True, estimates from params.
            auto_estimate: Auto-estimate cost from COST_ESTIMATES if cost not provided.

        Returns:
            The logged entry dict.
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "provider": provider,
            "operation": operation,
            "params": params or {},
        }

        if cost is not None:
            entry["cost"] = round(cost, 6)
        elif auto_estimate and params:
            estimated = self._estimate_cost(provider, operation, params)
            if estimated is not None:
                entry["cost"] = round(estimated, 6)
                entry["estimated"] = True

        with open(self.log_path, "a") as f:
            f.write(json.dumps(entry) + "\n")

        return entry

    def _estimate_cost(self, provider: str, operation: str, params: dict) -> float | None:
        """Estimate cost from provider rates and operation parameters."""
        rates = COST_ESTIMATES.get(provider, {})

        if provider in ("elevenlabs", "openai", "fish_audio") and "chars" in params:
            rate = rates.get("tts_per_1k_chars", 0)
            return (params["chars"] / 1000) * rate

        if provider in ("runway", "kling") and "seconds" in params:
            rate = rates.get("video_per_second", 0)
            return params["seconds"] * rate

        if provider == "did" and "minutes" in params:
            rate = rates.get("avatar_per_minute", 0)
            return params["minutes"] * rate

        if provider.startswith("gemini") and "input_tokens" in params:
            input_rate = rates.get("input_per_1m_tokens", 0)
            output_rate = rates.get("output_per_1m_tokens", 0)
            input_cost = (params.get("input_tokens", 0) / 1_000_000) * input_rate
            output_cost = (params.get("output_tokens", 0) / 1_000_000) * output_rate
            return input_cost + output_cost

        return None

    def get_total_cost(
        self,
        provider: str | None = None,
        since: str | None = None,
    ) -> float:
        """Get total cost, optionally filtered by provider and/or date.

        Args:
            provider: Filter by provider name (None = all).
            since: ISO date string to filter entries after (None = all time).

        Returns:
            Total cost in USD.
        """
        total = 0.0
        for entry in self._read_log():
            if provider and entry.get("provider") != provider:
                continue
            if since and entry.get("timestamp", "") < since:
                continue
            total += entry.get("cost", 0)
        return round(total, 4)

    def get_summary(self, since: str | None = None) -> dict:
        """Get cost summary grouped by provider.

        Returns:
            Dict with per-provider totals, operation counts, and grand total.
        """
        providers: dict = {}
        for entry in self._read_log():
            if since and entry.get("timestamp", "") < since:
                continue
            prov = entry.get("provider", "unknown")
            if prov not in providers:
                providers[prov] = {"total": 0.0, "operations": 0, "by_operation": {}}
            cost = entry.get("cost", 0)
            providers[prov]["total"] = round(providers[prov]["total"] + cost, 6)
            providers[prov]["operations"] += 1
            op = entry.get("operation", "unknown")
            providers[prov]["by_operation"][op] = (
                providers[prov]["by_operation"].get(op, 0) + 1
            )

        grand_total = sum(p["total"] for p in providers.values())
        return {
            "grand_total": round(grand_total, 4),
            "providers": providers,
        }

    def _read_log(self) -> list[dict]:
        """Read all entries from the JSONL log file."""
        if not self.log_path.exists():
            return []
        entries = []
        with open(self.log_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        return entries


if __name__ == "__main__":
    # Demo
    tracker = CostTracker("/tmp/demo_costs.jsonl")
    tracker.log_cost("elevenlabs", "tts", {"chars": 1700})
    tracker.log_cost("gemini_pro", "score", {"input_tokens": 43000, "output_tokens": 4000})
    tracker.log_cost("runway", "video_gen", {"seconds": 5})
    print(json.dumps(tracker.get_summary(), indent=2))
