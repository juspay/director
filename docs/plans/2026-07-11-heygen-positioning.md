# W-DEC — HeyGen positioning: differentiate on the pipeline, absorb tactically as a provider

**Status:** recommended (drafted from the 2026-07-11 wider-field re-scan; flip to *accepted* on owner sign-off) · **Owner:** core · **Origin:** roadmap Part III, W-DEC.

## Context

HeyGen — the vendor Director already pays for avatar clips — now sells the shape of this entire pipeline as a product. Video Agent 2.0 (verified 2026-07 from first-party docs and changelogs):

- Prompt → a complete creative blueprint (scenes, pacing, visuals, music, narration, captions) shown **before** rendering, with a credit-cost estimate — the same contract as our pre-flight projection (#71), as a consumer feature.
- Editable motion graphics after generation (text, position, color, timing — no full regenerate).
- Engine auto-selection: composes Seedance 2.0 cinematic shots with Avatar V scenes, casting the same Digital Twin across both (April 2026 release).
- `POST /v3/video-agents` async API (session tracking, pinned avatar/voice, multi-turn Interactive Sessions) **and an official CLI with structured JSON output** — our AGENT_GUIDE.md direction, productized.
- Fast: a reviewer measured a 39s, 8-scene video in ~44s of render.

The strategic question the re-scan forced: does Director differentiate against this, or absorb it?

## Decision

**Differentiate on the pipeline. Absorb tactically as one more provider. Never adopt their agent as the orchestrator.**

### Differentiate — Director's defensible ground is what a SaaS structurally can't be

1. **Self-hosted and data-resident** — briefs, product imagery, and finished cuts never live in a vendor's workspace.
2. **Provider-portable** — every phase swaps vendors (TTS, avatar, image, video, music, STT); the draft/hero tiering (#79) and stock tier (#78) exist precisely because no single vendor is load-bearing.
3. **Auditable spend** — JSONL cost accounting, pre-flight projection, `--budget` hard caps. HeyGen shows an estimate; Director enforces one.
4. **Independent quality and safety gates** — VMAF/VBench regression gate, consistency critic, multi-judge scoring, content-safety scorers, all run by models *we* choose. A vendor grading its own output is not a quality gate.
5. **Deterministic, resumable, agent-drivable** — per-run state, replayable history (Backlot), documented CLI entry points. An agent can drive *and repair* a run; a SaaS session can only be retried.

These five are exactly the claims from the Part III audit that survived industry-wide scrutiny. They are the moat; everything else we shipped this cycle (captions, tiers, doctor loop) is table-stakes catch-up.

### Absorb tactically — one more provider, two concrete uses

- **Benchmark path:** a `heygen-agent` comparison target — same brief through `POST /v3/video-agents`, scored by our own judging CLIs next to Director's cut. If their quality×cost beats ours on a brief class, that's a per-phase improvement signal, not a surrender.
- **Escape hatch:** for callers who want a video in minutes and accept vendor terms, the v3 API is a legitimate express lane — as an explicit mode, priced by the cost tracker like any provider.

### Never — Director as a wrapper over their agent

Adopting Video Agent as the orchestrator forfeits all five differentiators, inherits their pricing and content-policy risk wholesale, and concentrates avatar *and* orchestration in one vendor. A wrapper has no reason to exist; HeyGen's own CLI already is one.

## Concentration-risk action

The avatar phase already supports `did | heygen | musetalk`. Keep that parity real: the open lip-sync field (MuseTalk, LatentSync, EchoMimic v3, HunyuanVideo-Avatar) is strong enough that HeyGen must stay a choice, not a dependency. Re-evaluate open avatar quality when the avatar phase next gets attention.

## What would change this decision

- HeyGen's quality×cost beating Director's by a wide, sustained margin across our brief classes (measured by our own judges via the benchmark path) → revisit the absorb boundary.
- Their CLI/API surface becoming a de-facto standard for agent-driven video → pursue interop (accept/emit their blueprint format), still not adoption.
- HeyGen pricing or policy shifts that break the avatar phase → accelerate the open lip-sync migration; the moat does not depend on their existence.
