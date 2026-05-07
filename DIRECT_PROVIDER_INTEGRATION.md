# Direct-Fetch Provider → NeuroLink Adapter Plan

NeuroLink 9.61.1 ships with 14 LLM providers and a built-in TTS handler registry (`TTSProcessor`), an image-gen multi-provider service (`ImageGenService`), and a Vertex-only video handler. The 12 vendors below are NOT covered. This doc is the **parallel work track** to add adapter support — either upstream in NeuroLink or as a Director-internal `src/adapters/` module that mimics NeuroLink's interfaces.

**Goal**: every external API Director uses goes through a unified interface (the same shape NeuroLink uses), so the rest of the codebase doesn't care if it's NeuroLink-hosted or Director-hosted.

**Strategy**: build adapters in `src/adapters/{vendor}/` that conform to NeuroLink's `TTSHandler` / `ImageGenProvider` / a new `VideoGenHandler` interface, and expose them through unified entry points:
- `src/voiceover/index.ts` → `synthesizeTTS(text, provider, options)` (mirrors `TTSProcessor.synthesize`)
- `src/generators/index.ts` → `generateVideo(prompt, options)` (mirrors `generateVideoWithVertex`)
- `src/avatar/index.ts` → `generateAvatar(image, audio, options)`
- `src/music/index.ts` → `generateMusic(prompt, options)`
- `src/distribution/index.ts` → `uploadVideo(...)` and `publishToPlatforms(...)`

Once stable, the same adapter classes can be PRed upstream to `@juspay/neurolink`.

---

## Provider catalog and detailed plan

### TTS PROVIDERS

#### 1. ElevenLabs TTS — `src/adapters/elevenlabs/tts.ts`

- [ ] 1.1 Read current `src/voiceover/elevenlabs.ts`
- [ ] 1.2 Define `ElevenLabsTTSHandler implements TTSHandler` (interface from `@juspay/neurolink/types/tts.d.ts`)
- [ ] 1.3 Implement methods: `synthesize(text, options): Promise<TTSResult>`, `getVoices(languageCode?)`, `isConfigured()`, `maxTextLength`
- [ ] 1.4 Map ElevenLabs `voice_settings` (stability, similarityBoost, style, speakerBoost) into `TTSOptions.metadata`
- [ ] 1.5 Map model: `eleven_v3` (default), `eleven_multilingual_v2`, `eleven_turbo_v2`
- [ ] 1.6 Output formats: support `mp3_44100_128`, `mp3_44100_192`, `pcm_44100`, `wav` (mapped from `TTSOptions.format`)
- [ ] 1.7 Error handling: 401 → `TTSError(AUTH)`, 422 → `TTSError(INVALID_INPUT)`, 429 → `TTSError(RATE_LIMIT)`
- [ ] 1.8 Register at startup via `TTSProcessor.register('elevenlabs', new ElevenLabsTTSHandler(apiKey))`
- [ ] 1.9 Live test: `TTSProcessor.synthesize('hello world', 'elevenlabs', {voice: '1qEiC6qsybMkmnNdVMbK', format: 'mp3'})`
- [ ] 1.10 Unit test mocking `fetch`
- [ ] 1.11 Decide upstream vs internal: file PR if upstream-friendly

#### 2. OpenAI TTS — `src/adapters/openai/tts.ts`

- [ ] 2.1 Read current `src/voiceover/openai-tts.ts`
- [ ] 2.2 Define `OpenAITTSHandler implements TTSHandler`
- [ ] 2.3 Models: `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` (newer)
- [ ] 2.4 Voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `coral`, `verse`, `ballad`, `ash`, `sage`
- [ ] 2.5 Format: `mp3`, `opus`, `aac`, `flac`, `wav`, `pcm`
- [ ] 2.6 `speed` 0.25-4.0 supported natively
- [ ] 2.7 Use OpenAI SDK if available; otherwise raw fetch to `/v1/audio/speech`
- [ ] 2.8 Live test
- [ ] 2.9 Unit test
- [ ] 2.10 Register

#### 3. Fish Audio TTS — `src/adapters/fishaudio/tts.ts`

- [ ] 3.1 Read current `src/voiceover/fish-audio.ts`
- [ ] 3.2 Define `FishAudioTTSHandler implements TTSHandler`
- [ ] 3.3 Endpoint: `https://api.fish.audio/v1/tts`
- [ ] 3.4 Models: `s1` (default), voice cloning supported via `reference_id`
- [ ] 3.5 Bearer auth: `Authorization: Bearer ${FISH_AUDIO_API_KEY}`
- [ ] 3.6 Format: `mp3` (with bitrate options)
- [ ] 3.7 Handle 402 Insufficient Balance gracefully (`TTSError.code = 'QUOTA_EXCEEDED'`)
- [ ] 3.8 Live test (will likely fail with 402 — verify error class is right)
- [ ] 3.9 Unit test
- [ ] 3.10 Register

#### 4. Edge-TTS — `src/adapters/edge-tts/tts.ts`

- [ ] 4.1 Read current `src/voiceover/edgetts.ts`
- [ ] 4.2 Define `EdgeTTSHandler implements TTSHandler` — uses CLI subprocess via `execa`
- [ ] 4.3 Voices: `en-US-AvaMultilingualNeural`, `en-US-AndrewMultilingualNeural`, etc.
- [ ] 4.4 No API key; check `command -v edge-tts` in `isConfigured()`
- [ ] 4.5 Format: `mp3` (CLI output)
- [ ] 4.6 SSML support via flag
- [ ] 4.7 Live test
- [ ] 4.8 Unit test (mock execa)
- [ ] 4.9 Register

---

### VIDEO GEN PROVIDERS

NeuroLink's existing pattern is a single `generateVideoWithVertex` function. We mirror with a registry-based approach:

```ts
// src/adapters/_video/types.ts
export interface VideoGenHandler {
  generate(prompt: string, options: VideoGenOptions): Promise<VideoGenResult>;
  isConfigured(): boolean;
}
```

#### 5. Runway Gen-4 Turbo — `src/adapters/runway/video.ts`

- [ ] 5.1 Read current `src/generators/runway.ts` — note bug: uses `image_to_video` without `promptImage`
- [ ] 5.2 Decide path: **(a)** `text_to_video` endpoint at `api.dev.runwayml.com/v1/text_to_video` if available, **(b)** `image_to_video` with auto-generated input image via `ImageGenService`
- [ ] 5.3 Use `RUNWAY_API_BASE=https://api.dev.runwayml.com/v1` (already set in .env)
- [ ] 5.4 Header: `X-Runway-Version: 2024-11-06`
- [ ] 5.5 Models: `gen4_turbo`, `gen4_aleph`
- [ ] 5.6 Ratios: `1280:720`, `720:1280`, `960:960`, `1104:832`, `832:1104`, `1584:672`
- [ ] 5.7 Polling: GET `/tasks/{id}` until `SUCCEEDED`/`FAILED`
- [ ] 5.8 Live test with cheapest 5s clip
- [ ] 5.9 Unit test (mock fetch)
- [ ] 5.10 Register
- [ ] 5.11 Document cost: $0.05/second of generated video

#### 6. Kling official API — `src/adapters/kling/video.ts`

- [ ] 6.1 Read current `src/generators/kling.ts` (uses PiAPI proxy)
- [ ] 6.2 Add JWT signing helper using `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` (HS256, exp+30min, nbf-5s)
- [ ] 6.3 Endpoint: `https://api.klingai.com/v1/videos/text2video` (POST) and `/v1/videos/text2video/{task_id}` (GET poll)
- [ ] 6.4 Models: `kling-v1`, `kling-v1-6`, `kling-v2-1-master`
- [ ] 6.5 Modes: `std`, `pro`
- [ ] 6.6 Duration: 5 or 10 seconds
- [ ] 6.7 Live test (we already have working JWT, just port it)
- [ ] 6.8 Unit test
- [ ] 6.9 Register

#### 7. Replicate Wan-Alpha (RGBA video) — `src/adapters/replicate/wan-alpha.ts`

- [ ] 7.1 Read current `src/generators/wan-alpha.ts`
- [ ] 7.2 BLOCKED — no Replicate token (sign-up was blocked). Document and skip; revisit if user supplies token
- [ ] 7.3 Adapter scaffolded but `isConfigured()` returns false until `REPLICATE_API_TOKEN` is set
- [ ] 7.4 If unblocked: model `aleph-alpha/wan-alpha-rgba`, polling via `/v1/predictions`

#### 8. Replicate MuseTalk (avatar) — `src/adapters/replicate/musetalk.ts`

- [ ] 8.1 Same blocker as 7. Scaffold + skip
- [ ] 8.2 If unblocked: model `cjwbw/musetalk:latest`

---

### AVATAR PROVIDERS

#### 9. D-ID — `src/adapters/did/avatar.ts`

- [ ] 9.1 Read current `src/avatar/did.ts`
- [ ] 9.2 Define `DIDAvatarHandler` interface (image + audio in, video out)
- [ ] 9.3 Auth: `Authorization: Basic ${DID_API_KEY}` (already a base64-formatted concatenation)
- [ ] 9.4 Three-step flow: POST /images → POST /audios → POST /talks → poll GET /talks/{id}
- [ ] 9.5 Fix error parsing: `r.error ?? 'unknown error'` currently produces `[object Object]` — add `JSON.stringify(r.error, null, 2)`
- [ ] 9.6 Add config: `result_format`, `stitch`, `driver_url`, `expressions`
- [ ] 9.7 Live test with the Unsplash portrait we know works
- [ ] 9.8 Unit test
- [ ] 9.9 Register

---

### MUSIC GEN PROVIDERS

#### 10. Beatoven — `src/adapters/beatoven/music.ts`

- [ ] 10.1 Read current `src/music/beatoven.ts` — note bug: wrong base URL (`api.beatoven.ai/v1`)
- [ ] 10.2 Fix base: `https://public-api.beatoven.ai/api/v1`
- [ ] 10.3 POST `/tracks/compose` → returns `{task_id, track_id, status: "composing"}`
- [ ] 10.4 GET `/tasks/{task_id}` polling until `status: "composed"`, then download `meta.track_url`
- [ ] 10.5 Body shape: `{prompt: {text}, format, duration}` (NEW format) vs old `{prompt, duration, genre, mood, tempo}` (deprecated)
- [ ] 10.6 Live test (we already have working raw curl)
- [ ] 10.7 Unit test
- [ ] 10.8 Register
- [ ] 10.9 50 free credits on new account documented

#### 11. ElevenLabs Music — `src/adapters/elevenlabs/music.ts`

- [ ] 11.1 Read current `src/music/elevenlabs-music.ts`
- [ ] 11.2 Endpoint: `https://api.elevenlabs.io/v1/music`
- [ ] 11.3 Auth: `xi-api-key`
- [ ] 11.4 Body: `{prompt, length_ms, music_length_ms}` — verify against latest API
- [ ] 11.5 Output: streaming MP3
- [ ] 11.6 Live test with 30s clip
- [ ] 11.7 Unit test
- [ ] 11.8 Register

---

### DISTRIBUTION

#### 12. Mux — `src/adapters/mux/hosting.ts`

- [ ] 12.1 Read current `src/distribution/mux-hosting.ts`
- [ ] 12.2 Already works (live-verified). Add HITL gate from sprint 3.4
- [ ] 12.3 Add `getAnalytics(assetId)` real implementation (currently stub)
- [ ] 12.4 Use Mux Data API for real metrics
- [ ] 12.5 Webhook verification helper
- [ ] 12.6 Unit test
- [ ] 12.7 Register

#### 13. Late — `src/adapters/late/publisher.ts`

- [ ] 13.1 Read current `src/distribution/late-publisher.ts`
- [ ] 13.2 Fix base URL: `https://getlate.dev/api/v1` (current `api.getlate.dev` is NXDOMAIN)
- [ ] 13.3 Add `listAccounts()` to discover connected platforms before publishing
- [ ] 13.4 Add `--dry-run` mode that doesn't actually publish
- [ ] 13.5 Add HITL gate
- [ ] 13.6 Live test (dry run only — no social accounts connected for real publish yet)
- [ ] 13.7 Unit test
- [ ] 13.8 Register

---

## Cross-cutting work for the parallel track

- [ ] X.1 Define unified types in `src/adapters/_types.ts`:
  - `TTSHandler` (NeuroLink-compatible)
  - `VideoGenHandler` (new — model after `generateVideoWithVertex`)
  - `AvatarHandler` (new)
  - `MusicGenHandler` (new)
  - `DistributionHandler` (new)
- [ ] X.2 Build a registry pattern (`src/adapters/registry.ts`) that lazy-loads handlers based on `isConfigured()`
- [ ] X.3 Wire registries into existing entry points: `src/voiceover/index.ts`, `src/generators/index.ts`, etc.
- [ ] X.4 Add provider-selection auto-fallback: try preferred, fall through to next configured if quota / error
- [ ] X.5 Add unified retry + exponential backoff across all adapters via shared util
- [ ] X.6 Add unified rate-limiter
- [ ] X.7 Add cost tracking per adapter (so `super-observer` / Langfuse can attribute spend)
- [ ] X.8 Add `npm run providers:status` CLI showing each adapter's `isConfigured()` + last-tested time

---

## Upstream contribution decision matrix

| Provider | Upstream-friendly? | Effort | Recommendation |
|---|---|---|---|
| ElevenLabs TTS | YES (popular, well-documented) | M | File PR after stable in Director |
| OpenAI TTS | YES (matches `openai` LLM provider) | S | File PR — quickest win |
| Fish Audio TTS | MAYBE (less popular) | M | Director-internal first |
| Edge-TTS | YES (free, dev-friendly) | S | File PR |
| Runway | YES (high demand) | M | File PR after working |
| Kling | YES | L (JWT signing) | File PR after working |
| Replicate Wan-Alpha | DEFERRED | — | Skip until token |
| Replicate MuseTalk | DEFERRED | — | Skip until token |
| D-ID | YES | M | File PR after working |
| Beatoven | YES | M | File PR after fix |
| ElevenLabs Music | YES (sibling to TTS) | S | File PR |
| Mux | MAYBE (distribution, not gen) | S | Director-internal |
| Late | MAYBE (distribution) | S | Director-internal |

---

## Definition of done (parallel track)

- [ ] All 13 adapters implemented behind unified interfaces
- [ ] Each has live + unit tests
- [ ] Registry-based selection works in pipeline
- [ ] Auto-fallback survives a single-provider outage
- [ ] Upstream PRs filed for the YES-rated providers
- [ ] Director's existing `src/voiceover/`, `src/generators/`, `src/music/`, `src/avatar/`, `src/distribution/` files re-export from adapters with backward-compatible signatures
