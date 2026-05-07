# Providers Inventory

Verified against `@juspay/neurolink@9.65.0` (latest, installed) and Director's `src/` tree on 2026-05-08.

> **Post-cleanup state** (commit `1ad4341`): 14 duplicated vendor files deleted, `src/adapters/` removed, every provider call now goes through `nl.generate({...})`. Only thing left direct-fetched is what NeuroLink genuinely doesn't ship.

Reading guide:
- ✅ wired through `nl.generate(...)`
- 🔴 kept direct because NeuroLink doesn't ship this (or it isn't an AI provider)

---

## 1. NeuroLink 9.65.0 — what's built in

### 1.1 LLM / embedder / image providers — 31 (was 18)

Source: `node_modules/@juspay/neurolink/dist/lib/providers/*.d.ts` + `dist/constants/enums.d.ts` `AIProviderName`

| Provider key | Module | Category |
|---|---|---|
| `openai` | `openAI.d.ts` | LLM |
| `openai-compatible` | `openaiCompatible.d.ts` | LLM |
| `openrouter` | `openRouter.d.ts` | LLM |
| `anthropic` | `anthropic.d.ts` | LLM |
| `vertex` | `googleVertex.d.ts` | LLM (also image: Imagen, Gemini-3-Image) |
| `google-ai` | `googleAiStudio.d.ts` + `googleNativeGemini3.d.ts` | LLM |
| `azure` | `azureOpenai.d.ts` | LLM |
| `bedrock` | `amazonBedrock.d.ts` | LLM (also image: SD on AWS) |
| `sagemaker` | `amazonSagemaker.d.ts` | LLM |
| `huggingface` | `huggingFace.d.ts` | LLM |
| `mistral` | `mistral.d.ts` | LLM |
| `litellm` | `litellm.d.ts` | LLM |
| `deepseek` | `deepseek.d.ts` | LLM |
| `nvidia-nim` | `nvidiaNim.d.ts` | LLM |
| `ollama` | `ollama.d.ts` | LLM (local) |
| `lm-studio` | `lmStudio.d.ts` | LLM (local) |
| `llamacpp` | `llamaCpp.d.ts` | LLM (local) |
| **`xai`** | `xai.d.ts` | LLM (Grok) |
| **`groq`** | `groq.d.ts` | LLM (fast inference) |
| **`cohere`** | `cohere.d.ts` | LLM + embeddings + rerank |
| **`together-ai`** | `togetherAi.d.ts` | LLM (open-model hosting) |
| **`fireworks`** | `fireworks.d.ts` | LLM (open-model hosting) |
| **`perplexity`** | `perplexity.d.ts` | LLM (web-grounded) |
| **`cloudflare`** | `cloudflare.d.ts` | LLM (Workers AI) |
| **`replicate`** | `replicate.d.ts` | universal hosted-model gateway |
| **`voyage`** | `voyage.d.ts` | embeddings |
| **`jina`** | `jina.d.ts` | embeddings |
| **`stability`** | `stability.d.ts` | image gen (SD) |
| **`ideogram`** | `ideogram.d.ts` | image gen |
| **`recraft`** | `recraft.d.ts` | image gen |
| `auto` | (router across the above) | meta |

(Bold rows are new since 9.62.0.)

### 1.2 TTS handlers — 6 (was 5)

Source: `dist/voice/providers/` (5) + `dist/adapters/tts/` (1, Cartesia)

| Provider key (`tts.provider`) | Class | New in 9.65? |
|---|---|---|
| `azure-tts` | `AzureTTS` | |
| `cartesia` | `CartesiaStream` | |
| `elevenlabs` | `ElevenLabsTTS` | |
| `google-ai` | `GoogleTTSHandler` | |
| `openai-tts` | `OpenAITTS` | |
| **`fish-audio`** | `FishAudioTTS` | ✅ new |

All driven via `nl.generate({tts: {provider, voice, format, ...}})`.

### 1.3 STT handlers — 4

Source: `dist/voice/providers/`

| Provider | Class |
|---|---|
| Azure | `AzureSTT` |
| Deepgram | `DeepgramSTT` |
| Google | `GoogleSTT` |
| OpenAI Whisper | `OpenAISTT` (also exported as `WhisperSTT`) |

Public API: `STTProcessor`.

### 1.4 Realtime voice (bidirectional) — 2

| Provider | Class |
|---|---|
| Gemini Live | `GeminiLive` |
| OpenAI Realtime | `OpenAIRealtime` |

Public API: `RealtimeProcessor.connect(provider, config)`.

### 1.5 Image generation — 4 explicit + 3 via LLM provider routing

`dist/types/imageGen.d.ts`:
```
type ImageGenProvider = "vertex" | "openai" | "anthropic" | "bedrock";
```

Plus Stability, Ideogram, Recraft via the LLM provider enum (image-only providers accessed through normal `nl.generate({provider: 'stability', ...})` returning `imageOutput`).

> Vertex Imagen routing is still **broken upstream** for Gemini-3-Image-Preview (BLOCKERS.md). Workaround in `scripts/tools/gen-portrait.mjs`.

### 1.6 Video generation — 4 (was 1)

| Provider key | Module | New? |
|---|---|---|
| Vertex Veo | `adapters/video/vertexVideoHandler.d.ts` | |
| **Kling** | `adapters/video/klingVideoHandler.d.ts` | ✅ new |
| **Runway** | `adapters/video/runwayVideoHandler.d.ts` | ✅ new |
| **Replicate** (generic) | `adapters/video/replicateVideoHandler.d.ts` | ✅ new |

Plus utilities: `directorPipeline`, `videoMerger`, `frameExtractor`, `videoAnalyzer`, `ffmpegAdapter`.

Driven via `nl.generate({input, output: {mode: 'video', video: {...}}})`.

### 1.7 Music generation — 4 (was 0)

Source: `dist/music/providers/`

| Provider | Module |
|---|---|
| **Lyria** (Google) | `LyriaMusic.d.ts` |
| **Beatoven** | `BeatovenMusic.d.ts` |
| **ElevenLabs Music** | `ElevenLabsMusic.d.ts` |
| **Replicate** (MusicGen / Riffusion) | `ReplicateMusic.d.ts` |

Public API: `MusicProcessor.generate(provider, options)` OR `nl.generate({output: {mode: 'music', music: {...}}})`.

### 1.8 Avatar / lip-sync — 3 (was 0)

Source: `dist/avatar/providers/`

| Provider | Module |
|---|---|
| **D-ID** | `DIDAvatar.d.ts` |
| **HeyGen** | `HeyGenAvatar.d.ts` |
| **Replicate** (MuseTalk / SadTalker / Wav2Lip) | `ReplicateAvatar.d.ts` |

Public API: `AvatarProcessor.generate(provider, options)` OR `nl.generate({output: {mode: 'avatar', avatar: {...}}})`.

### 1.9 RAG infra

`dist/rag/`: chunkers, graph RAG, reranker, retrieval, document loaders. Plus Cohere/Voyage/Jina available as embedders via the new LLM provider list.

Driven via `nl.generate({rag: {files, strategy, chunkSize, topK}})`.

### 1.10 Other capabilities via `generate()` options

| Capability | Field |
|---|---|
| PPT generation | `output: {mode: 'ppt', ppt: {...}}` |
| Built-in evaluation | `enableEvaluation: true, evaluationDomain` |
| Workflow ensembles | `workflowConfig: <preset>` |
| Tools / MCP | `tools`, `enabledToolNames`, `toolFilter`, `excludeTools` |
| Structured output | `schema: <Zod>` |
| Thinking | `thinkingConfig: {thinkingLevel | budgetTokens}` |
| Telemetry | top-level `initializeOpenTelemetry()` |

---

## 2. Director — what's implemented (file by file)

### 2.1 Voiceover / TTS — `src/voiceover/`

| File | Path | Status |
|---|---|---|
| `index.ts` | router → `nl.generate({tts: {provider}})` for elevenlabs / openai-tts / fish-audio / google-ai / azure-tts / cartesia | ✅ |
| `edgetts.ts` | `edge-tts` Python CLI via `execa` | 🔴 NeuroLink has no Edge-TTS handler |

### 2.2 Video generation — `src/generators/`

| File | Path | Status |
|---|---|---|
| `index.ts` | router → `nl.generate({output: {mode: 'video', video: {provider}}})` for vertex / kling / runway / replicate | ✅ |

### 2.3 Avatar / lip-sync — `src/avatar/`

| File | Path | Status |
|---|---|---|
| `index.ts` | router → `nl.generate({output: {mode: 'avatar', avatar: {provider}}})` for d-id / heygen / replicate | ✅ |

### 2.4 Music generation — `src/music/`

| File | Path | Status |
|---|---|---|
| `index.ts` | router → `nl.generate({output: {mode: 'music', music: {provider}}})` for lyria / beatoven / elevenlabs-music / replicate | ✅ |

### 2.5 Distribution — `src/distribution/`

| File | Endpoint | Status |
|---|---|---|
| `mux-hosting.ts` | Mux Direct Upload + Asset API | 🔴 not in NeuroLink (out of scope — upload sink) |
| `late-publisher.ts` | `https://getlate.dev/api/v1` direct fetch | 🔴 not in NeuroLink (out of scope — publishing) |
| `ppt-generator.ts` | `nl.generate({output: {mode: 'ppt'}})` | ✅ |
| `schema-generator.ts` | structured-data builder | ✅ no provider |
| `hitl-gate.ts` | app-level CLI prompt | ✅ |

### 2.6 ~~Adapters~~ (deleted)

The `src/adapters/` directory was removed. NeuroLink's `TTSProcessor` / `VideoProcessor` / `AvatarProcessor` / `MusicProcessor` handle handler dispatch internally — the local registry was redundant.

### 2.7 Captions / ASR — `src/rendering/caption-burner.ts`

| Endpoint | Status |
|---|---|
| local `whisperx` / `faster-whisper` subprocess | 🔴 NeuroLink has `OpenAISTT` / Deepgram / Google / Azure STT, Director doesn't call them (no required swap; subprocess is free) |

### 2.8 Tools — `scripts/tools/gen-portrait.mjs`

Direct Vertex Imagen REST workaround — still needed (upstream Vertex routing bug).

---

## 3. Remaining real gap after 9.65.0

This is the entire list:

| Gap | What it is | Notes |
|---|---|---|
| **Edge-TTS** | `src/voiceover/edgetts.ts` (Microsoft Neural via the `edge-tts` Python CLI) | No public REST API exists; awkward fit for any API-based platform. Keep as-is or drop entirely. |
| **Mux** | `src/distribution/mux-hosting.ts` — video host + HLS transcoding | Not an AI provider. Keep local. |
| **Late** | `src/distribution/late-publisher.ts` — multi-platform social publish | Not an AI provider. Keep local. |
| **WhisperX local** | `src/rendering/caption-burner.ts` | Optional — could swap to NeuroLink STT, but the local subprocess is free and works. |

That's it. Everything else Director does directly that NeuroLink also offers is **duplication that can be deleted**.

---

## 4. Cleanup completed (commit `1ad4341`)

**14 vendor files deleted, `src/adapters/` removed, -2079 net lines.**

Every provider call now routes through `nl.generate({...})`. The router modules
(`voiceover/index.ts`, `generators/index.ts`, `music/index.ts`, `avatar/index.ts`)
each export a single `generate(nl, provider, ...)` function that dispatches via NeuroLink.

---

## 5. Status counters

|  | Before (9.62.0) | After (9.65.0) | Δ |
|---|---|---|---|
| LLM/embedder providers | 18 | 31 | +13 |
| TTS handlers | 5 | 6 | +1 (Fish Audio) |
| Video gen handlers | 1 | 4 | +3 (Kling, Runway, Replicate) |
| Music handlers | 0 | 4 | +4 (Lyria, Beatoven, ElevenLabs Music, Replicate) |
| Avatar handlers | 0 | 3 | +3 (D-ID, HeyGen, Replicate) |
| Image gen providers | 4 | 7 | +3 (Stability, Ideogram, Recraft via LLM enum) |
| STT handlers | 4 | 4 | 0 |
| Realtime voice | 2 | 2 | 0 |
| Director files that NeuroLink now duplicates | 4 | 14 | +10 |
| Real Director gaps (not in NeuroLink) | 12+ | **3** | -9+ |

**Director's "must-do-locally" surface is now: Edge-TTS, Mux, Late. Everything else is duplication.**

---

## 6. Recommended next steps (only what makes sense given 9.65.0)

1. **Delete-and-route cleanup** — Drop 14 duplicated files, route all 11 vendor calls through `nl.generate({...})`. This is the big win.
2. **Test the new generate() modes live** — `output.mode: 'music'` and `output.mode: 'avatar'` are new; confirm they actually work end-to-end before deleting the local fallbacks.
3. **Keep**: `src/distribution/mux-hosting.ts`, `src/distribution/late-publisher.ts`, `src/distribution/hitl-gate.ts`, `src/rendering/caption-burner.ts`, `src/voiceover/edgetts.ts` (or drop Edge-TTS entirely).
4. **No upstream PRs needed for category gaps anymore** — only marginal contributions remain (e.g. add ASR voiceover-side via `STTProcessor` in NeuroLink-driven SRT generation if we want).
