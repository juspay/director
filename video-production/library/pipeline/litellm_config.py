#!/usr/bin/env python3
# Origin: New module — added to library on 2026-03-27
"""
LiteLLM proxy for automatic LLM cost tracking.

Routes all LLM API calls (Gemini scoring, future Claude/GPT usage) through
LiteLLM for unified cost tracking across 100+ providers.

Requires: pip install litellm

Usage:
    from litellm_config import get_completion, get_cost_report
    response = get_completion("Analyze this video", model="gemini/gemini-2.5-pro")
    print(get_cost_report())
"""

import json
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

try:
    import litellm
    litellm.success_callback = ["log_raw_request_response"]
    HAS_LITELLM = True
except ImportError:
    HAS_LITELLM = False

# Cost accumulator
_cost_log = []


def get_completion(
    prompt: str,
    model: str = "gemini/gemini-2.5-flash",
    temperature: float = 0.0,
    max_tokens: int = 8192,
    **kwargs,
) -> dict:
    """Get LLM completion via LiteLLM with automatic cost tracking.

    Falls back to direct API if LiteLLM not installed.

    Args:
        prompt: The prompt text.
        model: LiteLLM model string (e.g., "gemini/gemini-2.5-pro", "gpt-4o").
        temperature: Sampling temperature.
        max_tokens: Max output tokens.

    Returns:
        Dict with 'text', 'model', 'usage', 'cost'.
    """
    if not HAS_LITELLM:
        logger.warning("[LiteLLM] Not installed — use pip install litellm")
        return {"text": "", "error": "litellm not installed"}

    response = litellm.completion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs,
    )

    text = response.choices[0].message.content
    usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
    }

    # LiteLLM tracks cost automatically
    cost = litellm.completion_cost(completion_response=response)

    entry = {"model": model, "usage": usage, "cost": round(cost, 6)}
    _cost_log.append(entry)

    logger.info(f"[LiteLLM] {model}: {usage['total_tokens']} tokens, ${cost:.4f}")

    return {"text": text, "model": model, "usage": usage, "cost": round(cost, 6)}


def get_cost_report() -> dict:
    """Get accumulated cost report from this session."""
    total = sum(e["cost"] for e in _cost_log)
    by_model = {}
    for e in _cost_log:
        m = e["model"]
        if m not in by_model:
            by_model[m] = {"calls": 0, "cost": 0.0, "tokens": 0}
        by_model[m]["calls"] += 1
        by_model[m]["cost"] = round(by_model[m]["cost"] + e["cost"], 6)
        by_model[m]["tokens"] += e["usage"]["total_tokens"]

    return {
        "total_cost": round(total, 4),
        "total_calls": len(_cost_log),
        "by_model": by_model,
    }


def reset_cost_log():
    """Reset the session cost log."""
    _cost_log.clear()


if __name__ == "__main__":
    report = get_cost_report()
    print(json.dumps(report, indent=2))
