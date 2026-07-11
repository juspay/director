# Seedance / BytePlus vendor-risk brief (W-P4-COMPLIANCE)

**Status:** draft for owner review · **Owner decision required** · **Prepared:** 2026-07-12
**Context:** roadmap Part IV (`2026-07-10-competitive-research-roadmap.md`) and
`video-production/library/docs/VIDEO-GEN-LANDSCAPE-2026Q3.md` §4.

## The decision

Whether Director may use ByteDance's Seedance as a b-roll generator, and through
which access path. This is a compliance decision, not an engineering one: the
integration itself is trivial (Replicate route already works today; Krea/fal need
one adapter), and the quality case is made — Seedance 2.0 is the independent #1 on
the Artificial Analysis image-to-video and text-to-video-with-audio arenas
(July 2026). What varies 13–40× by path is price, and what varies with the price
is counterparty exposure.

## The four paths, ranked by exposure

| Path | $/s (verified 2026-07-12) | Counterparty | Exposure notes |
|---|---|---|---|
| BytePlus ModelArk (official) | ~$0.01–0.03 (third-party conversions; JS-gated pricing page unverified first-hand) | ByteDance's international cloud arm | Enterprise KYC against a ByteDance-linked entity; **India availability undocumented in every source checked** — the 100+-country rollout names only the US as excluded; data-residency/subprocessor chain unreviewed |
| Krea API | $0.0849 (2.0) / $0.0677 (Fast) — base resolution; higher-res multipliers unverified | Krea Corp (US) | Dollar-metered PAYG, output licensed for commercial use, account-only signup; Krea is the merchant of record, not ByteDance — materially thinner counterparty link |
| fal.ai (official ByteDance partner) | $0.24–0.30 (720p) / $0.68 (1080p std) | fal Inc. (US) | No KYC; best reliability record (Adobe/Shopify/Canva in production) — but **price parity-to-worse vs our Veo Standard**, so it defeats the purpose |
| Replicate | unpublished per-model (console check needed) | Replicate/Cloudflare (US) | Already integrated (zero code); billing per-generation; rate must be read from the authenticated console before any budgeting |

## Risk register

1. **India availability (BytePlus path)** — undocumented. India banned ByteDance's
   *consumer* apps (TikTok, CapCut) in 2020 under §69A; BytePlus enterprise API is a
   legally distinct product, but that distinction may not satisfy internal vendor
   review at a payments company. Needs a definitive answer from BytePlus sales or
   legal, not a web search.
2. **Counterparty/KYC** — ModelArk onboarding runs enterprise KYC with a
   ByteDance-linked entity. Reseller side-doors (PiAPI, EvoLink, crypto-friendly
   gateways) exist and are cheap; they are recommended **against** — undisclosed
   subprocessor chains and ToS-violation exposure.
3. **Copyright posture** — the MPA sent ByteDance its first-ever AI cease-and-desist
   over Seedance 2.0 (2026-02-20), followed by Disney/WBD/Paramount
   Skydance/Netflix/Sony; ByteDance paused the rollout, added filters, relaunched.
   Public API now blocks recognizable real faces (HeyGen holds the sole verified
   carve-out). For our marketing-video use with brand-owned product imagery the
   direct infringement surface is small, but the vendor's litigation profile is a
   procurement datapoint.
4. **Ownership gap (applies to every generator, Veo included)** — SCOTUS declined
   *Thaler v. Perlmutter* (2026-03-02): purely-AI-generated output is not
   copyrightable. Brand customers should hear this from us before a competitor
   tells them.
5. **Indemnity** — Moonvalley sells licensed-training + indemnity as its entire
   product; the major vendors' indemnities (Google, Adobe, Microsoft, OpenAI) are
   hedged (mandatory filters, vendor-controlled defense). ByteDance/BytePlus terms
   have not been reviewed for any indemnity at all — a KYC-path prerequisite.
6. **Concentration echo** — our avatar vendor (HeyGen) runs Seedance as its b-roll
   engine. Adopting Seedance ourselves narrows the differentiation surface against
   HeyGen Video Agent; the W-DEC positioning (five audit-surviving properties)
   already accounts for this, but it belongs in the conversation.

## Cost stakes (reference run: 8 shots × 6 s = 48 s of b-roll)

Veo Standard (today) ≈ **$19.20** · Krea-Seedance ≈ **$3.25–4.08** · fal-Seedance
≈ $14.56 · BytePlus-Seedance ≈ **$1.44**. At ~50 hero runs/month the Krea-vs-Veo
delta alone is ≈ $750–800/month; BytePlus would be ≈ $890/month saved *if* the
KYC path clears review.

## Recommendation

1. **Near term (no review needed):** pilot Seedance through **Krea's metered API**
   for non-face b-roll — US counterparty, commercial-use license, ~4.7–5.9× cheaper
   than Veo Standard, one small adapter. Verify 720p/1080p multipliers on the live
   rate card first.
2. **Only if volume justifies it:** open the **BytePlus ModelArk** vendor-risk
   review (India availability in writing, DPA/subprocessor chain, indemnity terms,
   sanctions/KYC comfort). Do not use reseller side-doors regardless of outcome.
3. **Keep Veo for dialogue-bearing hero shots** — it remains the only frontier
   model with true synchronized 48 kHz dialogue, and its Vertex licensing is the
   cleanest we have.

## Sources

Leaderboards: artificialanalysis.ai video arenas (July 2026 snapshot). Pricing:
krea.ai/app/api/pricing (fetched 2026-07-12), fal.ai model pages, BytePlus ModelArk
docs (token pricing, JS-gated), Atlas Cloud cost breakdown. Legal: Hollywood
Reporter / Axios / CNBC on the MPA C&Ds (Feb–Mar 2026); SCOTUS *Thaler* cert denial
(2026-03-02); May-2026 indemnification-gap analysis. Full per-claim URL trail in
the session research log (`research2/findings.md`, `research3/*.json`).
