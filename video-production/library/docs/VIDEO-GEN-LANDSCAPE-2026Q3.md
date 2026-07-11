# AI Video Generation Landscape — Q3 2026 Update

Research conducted July 12, 2026. Supersedes `VIDEO-GEN-LANDSCAPE-2026Q1.md` (March 26,
2026), whose central operational warning — Seedance "BLOCKED, do not plan around it" —
has been false since April 2026. Evidence trail: 16 research agents, 254 live source
fetches; per-claim source URLs in the session research log.

---

## 1. What changed since Q1

- **Seedance's API freeze ended in April 2026.** Live access paths today: BytePlus
  ModelArk (official, KYC-gated), fal.ai (official ByteDance partner since 2026-04-09,
  no Chinese KYC), Replicate (`bytedance/seedance-2.0`, `-fast`), Krea API
  (dollar-metered), OpenRouter. The Q1 "do not plan around it" guidance is obsolete —
  the real constraints are price-per-path and compliance (see §4, §6).
- **The leaderboard flipped.** Q1's "#1 Runway Gen-4.5 (Elo 1,247)" is stale: Runway was
  displaced in April–June by Seedance 2.0 (#1 on Artificial Analysis image-to-video and
  text-to-video-with-audio, indep. Elo ~1,226) and Alibaba's stealth-launched
  **HappyHorse 1.0/1.1** (ex-Kling team; #1 raw t2v/i2v quality without audio).
  **Veo 3.1 — our production model — now sits around #3**, though it remains the only
  frontier model with true 48 kHz synchronized dialogue.
- **Two models the Q1 doc doesn't mention at all now sit in the top 5:** HappyHorse
  (above) and **xAI Grok Imagine 1.5** (#2 on image-to-video both with and without
  audio; i2v-only API at $0.08–0.25/s; preview ToS still carries a
  non-commercial-evaluation clause — watch, don't wire).
- **Sora is fully dead**, not just "shutting down": consumer app closed 2026-04-26, API
  sunsets 2026-09-24. Zero planning relevance.
- **Kling closed the largest-ever video-model raise** ($3B at an $18B valuation,
  Feb 2026; ARR $240M→$500M in three months). NeuroLink already ships a Kling adapter.
- **Seedance 2.5** entered enterprise beta June 2026: native 30 s single clips (no
  stitching), up to 50 reference inputs, native 4K; ModelArk API dated 2026-07-16,
  fal/Replicate expected late July.
- **Copyright became a procurement axis** (see §5) — the MPA's first-ever AI
  cease-and-desist went to ByteDance over Seedance 2.0, and SCOTUS declined *Thaler*,
  leaving purely-AI output uncopyrightable.

## 2. Leaderboard snapshot (Artificial Analysis, July 2026)

| Rank (i2v, with audio) | Model | Notes |
|---|---|---|
| 1 | Seedance 2.0 (ByteDance) | Elo ~1,226 indep. (vendor self-claims ~1,450 — treat skeptically); audio generated free in the same pass |
| 2 | Grok Imagine 1.5 (xAI) | Elo ~1,114; i2v-only via API; preview licensing unresolved |
| 3 | HappyHorse 1.1 (Alibaba) | #1 on *no-audio* raw quality; ~3 months old, fast-motion artifacts reported |
| ~3–4 | **Veo 3.1 (ours)** | Only true synchronized 48 kHz dialogue; SynthID watermark non-removable |
| top-5 | Kling 3.0 Pro, Wan 2.7 | Wan: top-5 quality at $0.10/s flat on fal |

Open-weights leader: **LTX-2.3** (Lightricks) — real 4K/50fps with synced audio,
self-hostable, free commercial use under $10M ARR (Juspay does **not** qualify — check
licensing before any self-host plan).

## 3. Current model matrix (July 2026)

| Model | Version | i2v | Native audio | Max dur/res | Cheapest reliable path |
|---|---|---|---|---|---|
| Seedance | 2.0 (Std/Fast/Mini), 2.5 beta | Yes (+ ref-to-video, 12 files) | Yes, free in-pass | 15 s (2.5: 30 s) / 4K | Krea API $0.068–0.085/s (§4) |
| Veo | 3.1 (Lite/Fast/Standard) | Yes | Yes (48 kHz dialogue) | 8 s ext. ~148 s / 4K preview | Vertex (ours): Lite $0.03–0.05/s … Std $0.20–0.40/s |
| Kling | 3.0 (+Turbo/Omni) | Yes | Yes (5 lang) | 15 s ext. 3 min / 4K60 | resellers ~$0.075–0.10/s; official API prepaid packages |
| HappyHorse | 1.1 | Yes (9 ref images) | Yes + lip-sync | 15 s / 1080p | fal $0.18–0.31/s |
| Wan | 2.7 (open-weights lineage) | Yes (+first/last frame) | Yes | ~15 s / 1080p (4K some hosts) | fal $0.10/s flat |
| Hailuo | 2.3 (Std/Fast/Pro) | Yes (Fast is i2v-only) | — | 6–10 s / 1080p | fal Fast ~$0.03/s per-clip |
| Grok Imagine | 1.5-preview | Yes (i2v-only via API) | Yes, bundled | 15 s / 1080p | x.ai $0.08 (480p)–0.25/s (1080p) |
| Vidu | Q2/Q3 | Yes (7 ref images) | Yes | 8–16 s / 1080p | first-party ~$0.0375/s blended |
| LTX | 2.3 (open weights) | Yes | Yes | 20 s / 4K50 | first-party $0.04–0.06/s 1080p; self-host |
| Luma | Ray3.2 / Ray3.14 | Yes | — | ~9 s / 1080p | fal 540p $0.03/s, 720p $0.06/s |
| Runway | Gen-4.5 | Yes | Yes | ~10 s chained | API ~$0.15–0.25/s; strongest edit tooling (Aleph 2.0) |
| Sora | 2 (dead) | — | — | — | API sunsets 2026-09-24 — do not integrate |

## 4. The Seedance pricing trap: same model, 13–40× spread by path

| Path | Rate (per second) | Catch |
|---|---|---|
| BytePlus ModelArk (official) | ~$0.01–0.03 (Fast/Pro est.) | ByteDance-linked enterprise KYC; India availability **undocumented**; vendor-risk review required before any production use |
| Krea API | $0.0677 (Fast) / $0.0849 (2.0) "from" | Dollar-metered pay-as-you-go, commercial license, account-only signup — **best accessible route found**; "from" = base resolution, verify 720p/1080p rates before budgeting |
| fal.ai (official partner) | $0.24 (Fast 720p) – $0.68 (Std 1080p) | No KYC, best reliability record — but **parity-to-worse vs our Veo Standard**; the "cheap Seedance" assumption is false on this path |
| Replicate | unpublished per-model | Billed per-generation; check console before use |

Reference run (8 shots × 6 s = 48 s of b-roll): Veo Standard ≈ $19.20 · Krea-Seedance
≈ $3.25–4.08 · fal-Seedance ≈ $14.56 · BytePlus-Seedance ≈ $1.44 *if compliance clears*.

Public-API constraint on all paths: Seedance blocks recognizable real human faces
(post-MPA filters). HeyGen holds the only verified-real-face carve-out — relevant since
HeyGen is our avatar vendor and uses Seedance as its b-roll engine.

## 5. Copyright is now a procurement axis

- MPA issued its first-ever AI cease-and-desist to ByteDance over Seedance 2.0
  (2026-02-20); Disney, WBD, Paramount Skydance, Netflix and Sony followed; ByteDance
  paused the global rollout in March, added face/character filters, relaunched.
- SCOTUS declined *Thaler v. Perlmutter* (2026-03-02): purely-AI-generated output is
  not copyrightable — an ownership gap on generated b-roll, distinct from infringement
  risk.
- **Moonvalley Marey** ($154M raised) sells licensed-only training + indemnity as the
  product; analysts call vendor indemnification "non-negotiable" for enterprise 2026
  marketing workflows, while a May-2026 gap analysis notes most vendor indemnities are
  hedged (mandatory filters, vendor-controlled defense).
- Implication for us: for brand customers, prefer providers with clear commercial
  licensing (Vertex/Veo, Krea's licensed-output terms) and keep the content-safety
  scorers in the pipeline — they are part of the indemnity story, not just quality.

## 6. Aggregators and the integration reality

NeuroLink (our provider layer) ships exactly four video adapters: `vertex`, `kling`,
`runway`, `replicate`. That makes the integration cost of each aggregator:

- **Replicate — zero-code.** `ReplicateVideoHandler` accepts any `owner/model` string;
  Replicate hosts all six major families *including Veo itself*. Verified slugs:
  `bytedance/seedance-2.0[-fast]`, `minimax/hailuo-2.3[-fast]`, `wan-video/wan-2.7-i2v`,
  `lightricks/ltx-video`. Caveat: per-model prices mostly unpublished — cost-tracker
  needs per-model rates (see Director roadmap, RATES) before multi-model use.
- **fal.ai — best rates/reliability, needs a new adapter.** Wan 2.5 $0.05/s, LTX-2 Fast
  $0.04/s verified; 99.99% uptime claim; Adobe/Shopify/Canva in production; ~$400M ARR.
- **Krea API — dollar-metered multi-model, needs a new adapter** (or direct HTTP).
  Hosted MCP + agent skills; the cheapest accessible Seedance (§4).
- **AIMLAPI — 6-for-6 verified catalog, reliability risk** (Trustpilot 2.7/5, billing
  disputes) — trial before any production spend.
- **BytePlus ModelArk — Seedance-only channel**, compliance-gated (§4).

## 7. Recommendations for our pipeline (Director)

1. **Hero tier**: stay on Veo 3.1 today (only real dialogue audio, zero integration
   cost, clean licensing) — but benchmark Seedance 2.0 via Krea and Kling 3.0 via the
   existing NeuroLink adapter before Q4. Single-sourcing on the #3-quality model at
   premium price is now a measured exposure, not a default.
2. **Draft tier**: pilot on the zero-code Replicate path — `minimax/hailuo-2.3-fast`
   and `wan-video/wan-2.7-i2v` as `BROLL_DRAFT_GENERATOR` options. Prerequisite:
   per-model cost-tracker rates so spend logs stay honest.
3. **Compliance**: run the Seedance/BytePlus vendor-risk review before treating the
   ~$0.01–0.03/s path as real; India availability is undocumented everywhere.
4. **Do not integrate**: Sora (dead), Grok Imagine (preview licensing), Meta Movie Gen
   (no API), Pika (API lags product).
5. **Re-check quarterly** — Q1→Q3 flipped the #1 model twice; this document has the
   same shelf life.

---

*Supersedes the Q1 doc's §3.4 Seedance warning, §14 quality benchmarks, and §15
recommendations. The Q1 capability matrix remains useful for models that did not ship
new versions (Pika 2.5, Hunyuan 1.5).*
