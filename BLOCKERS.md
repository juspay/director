# Blockers (auto-maintained by autonomous loop)

Append-only. Each entry: timestamp, item ID, error/reason, attempted resolution, decision.

## Pre-existing (carried over from key-retrieval session)

### 2026-05-06 — NeuroLink ImageGenService routes Vertex Imagen through text-gen path
- **Item**: §2.1.2 (veo seed image), §3.1 (portrait generation), and any §B.5 image gen via `ImageGenService`
- **Reason**: `ImageGenService.generate()` calls `neurolink.generate({input, provider: 'vertex', model: 'imagen-3.0-generate-001'})`, which dispatches to `generateTextInternal`. Vertex returns "Internal error encountered" because Imagen models don't accept text-gen requests — they need the dedicated `:predict` endpoint with `instances/parameters` body.
- **Direct API works**: `curl POST .../models/imagen-3.0-generate-001:predict {instances:[{prompt}],parameters:{sampleCount:1}}` returns a real PNG.
- **Workaround**: `scripts/tools/gen-portrait.mjs` calls Vertex Imagen REST directly via `gcloud auth print-access-token`. Generated 1.2MB 1024x1024 portrait successfully.
- **Decision**: ImageGenService will work once upstream fix lands. Director's Imagen path uses direct fetch in the meantime. File upstream issue.

---

### 2026-05-05 — Replicate sign-up blocked
- **Item**: any `src/adapters/replicate/*` work (7.2.3, 7.2.4 from MASTER_TODO; #7 and #8 from DIRECT_PROVIDER_INTEGRATION)
- **Reason**: Replicate's anti-fraud rejects new account creation via Google→GitHub OAuth (no GitHub history on `hello@neurolink.ink`). Page literally says *"Unable to sign up. Please reach out to support@replicate.com."*
- **Attempted**: Google OAuth chain via Chrome MCP, GitHub Continue-with-Google → bounced back to login.
- **Decision**: scaffold adapters with `isConfigured()` returning false. Skip until user supplies a Replicate token or completes manual signup.

---
