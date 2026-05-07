# Director × NeuroLink 9.61.1 — Detailed Migration Plan

Generated 2026-05-06. Replaces 9.30.0 → 9.61.1 (23 minor versions of new features).

---

## Part A — Inventory: what NeuroLink 9.61.1 provides that's relevant to Director

### A.1 Already used by Director ✅
- `NeuroLink.generate()` — text gen + structured JSON in agents
- Vertex AI text via service account (creative-director, script-scorer)

### A.2 Available but unused (the gap)

| Capability | NeuroLink module | Replaces in Director |
|---|---|---|
| **Multi-modal `generate()`** with rich inputs (`images`, `videoFiles`, `pdfFiles`, `csvFiles`, `audioFiles`, `segments`) and rich outputs (`mode: "text" \| "video" \| "ppt"`, structured JSON, TTS bundled in `tts:`) | `types/generate.d.ts` `GenerateOptions` | Many one-off `fetch()` calls and the manual file-loading in agents |
| **Veo 3.1 video gen** | `adapters/video/vertexVideoHandler` — `generateVideoWithVertex(image, prompt, options, region)` | `src/generators/veo.ts` (currently uses outdated `veo-3.1:predict`, NeuroLink targets the right Long-Running Operation) |
| **Image-to-image transitions** (first+last frame interpolation) | `vertexVideoHandler.generateTransitionWithVertex(firstFrame, lastFrame, prompt, opts, durationSec)` | new — Director has no transitions |
| **Director-Mode multi-segment pipeline** with parallel clip gen, frame extraction, transition gen, sequential merge, circuit breaker | `adapters/video/directorPipeline.executeDirectorPipeline(segments, videoOptions, directorOptions, region)` | Big chunks of `src/pipeline/runner.ts` phase 3 (B-roll) and phase 6 (assembly) |
| **Frame extraction** | `frameExtractor.extractFirstFrame(buffer)`, `extractLastFrame(buffer)` | new — useful for thumbnails/transitions |
| **Video merging** | `videoMerger.mergeVideoBuffers(buffers[])` | `src/rendering/assembler.ts` |
| **Video analysis with proper rate sampling** (handles >16 frame cap by adaptive sampling) | `adapters/video/videoAnalyzer.analyzeVideo()` | `src/agents/video-scorer.ts` and `src/agents/scene-analyzer.ts` (currently fail because raw `generate({files:[mp4]})` rasterizes 78 frames) |
| **Image generation** with multi-provider (`vertex`, `openai`, `anthropic`, `bedrock`) and reference images | `image-gen/ImageGenService` and `image-gen/imageGenTools` | new — could generate B-roll stills and `tests/fixtures/portrait.jpg` |
| **Google Cloud TTS** (Neural2 voices, SSML, multi-language) | `adapters/tts/googleTTSHandler` and `utils/ttsProcessor.TTSProcessor.synthesize(text, provider, opts)` | adds 5th TTS option alongside ElevenLabs/OpenAI/Fish/EdgeTTS |
| **Cartesia streaming TTS** (sub-200ms latency, websocket) | `adapters/tts/cartesiaHandler.CartesiaStream` | new — streaming voiceover for live demos |
| **TTS bundled in `generate({tts:})`** — generate text and voice it in one call | `GenerateOptions.tts` | new — removes a separate TTS step in agents that produce narration |
| **Built-in evaluation framework**: 10+ LLM scorers (faithfulness, hallucination, bias, toxicity, prompt-alignment, summarization, tone consistency, answer relevancy, context precision/relevancy) + rule scorers (regex, length, format, keyword coverage, similarity) | `evaluation/` and `evaluation/scorers/{llm,rule}/` | replaces `src/agents/script-scorer.ts` rubric, gives free hallucination/bias guards |
| **Workflow engine** with built-in topologies (CONSENSUS_3, MULTI_JUDGE_3/5, ADAPTIVE, FALLBACK), ensembles, model-group execution, judge scoring | `workflow/` | replaces `src/agents/video-scorer.ts` `runMultiRunScoring` (currently a hand-rolled 3-run averager) |
| **RAG**: chunkers (Markdown/HTML/JSON/Sentence/Token/Semantic/Recursive/LaTeX/Character), document loaders (CSV, JSON, MD, HTML, PDF, Web, Text), GraphRAG, rerankers (Cohere, CrossEncoder), hybrid search (BM25 + vector), context assembly with citations | `rag/` | new — index past scripts, score guides, and brand voice |
| **Memory** (Hippocampus) — long-term memory with retrieval tools | `memory/hippocampusInitializer` | new — remember scoring patterns across runs |
| **Files API** — registered file references (no re-upload), streaming reader | `files/{fileReferenceRegistry,streamingReader,fileTools}` | replaces `path.resolve(file)` and re-upload of large videos in scoring |
| **Audio processor** — extracts metadata/tags/cover art from MP3/WAV/OGG/FLAC for LLM context | `processors/media/AudioProcessor` | replaces our Python `analyze-audio.py` for LLM-side context (composite scoring still useful) |
| **Video processor** — adaptive keyframe extraction (caps to 20 frames!), embedded subtitle pull, metadata-as-text for LLMs | `processors/media/VideoProcessor` (`processFile`, `extractFrameRange`) | the **fix** for our 16-image-cap blocker |
| **HITL** (Human-in-the-loop) gating — pause and ask before destructive ops | `hitl/HITLManager` | new — gate Mux uploads / Late posts on human confirmation |
| **Action / GitHub integration** — install + run NeuroLink in CI, post results as comments, write job summaries | `action/` | new — Director CI |
| **Thinking config** (Gemini 3 `thinkingLevel`, Claude `budgetTokens`) for deeper reasoning on hard prompts | `GenerateOptions.thinkingConfig` | upgrade `creative-director` from gemini-2.5-flash to gemini-3-flash-preview thinking |
| **Tasks** — TaskExecutor + TaskManager for backgrounded long jobs with persistent stores | `tasks/` | new — power Director's resume-safe pipeline state |
| **Autoresearch** — multi-phase research with policy-gated tools and state store | `autoresearch/` | new — auto-research a product before generating B-roll prompts |
| **PPT generation** (`mode: "ppt"`) | `features/ppt/` and `GenerateOptions.output.ppt` | new — Director could ship slide-decks alongside videos |
| **Voice server** (websocket, frame bus, turn manager) | `server/voice/` | new — could host live voice demos of Tara |
| **MCP**: tool batching, caching, rate-limiting, retry, elicitation, server registry, agent exposure | `mcp/` | upgrade Director's tool ecosystem |
| **Proxy / cloaking / OAuth fetch / token refresh / rate limiter** | `proxy/` | new — production-grade quota/cost safety net |
| **Observability** — Langfuse + OpenTelemetry, span/trace, analytics middleware, cost calculator | `observability/`, `utils/pricing` (`calculateCost`, `hasPricing`), `middleware/builtin/analytics` | replaces our `src/observability/{super-observer,reporter}.ts` |
| **Image processor utilities** (resize, format conversion, base64) | `utils/imageProcessor` | new |
| **Provider auto-selection** (`getBestProvider()`, `provider: "auto"`) | `utils/providerUtils` | replaces hardcoded `provider: "vertex"` in agents |

### A.3 Out of NeuroLink scope (must remain direct fetch)
NeuroLink doesn't proxy to these vendors at all — keep the existing direct-API code:

- ElevenLabs (TTS + Music), OpenAI TTS, Fish Audio, Edge-TTS
- Runway, Kling, Replicate (Wan-Alpha, MuseTalk)
- D-ID (avatar lip-sync)
- Beatoven (music)
- Mux (distribution)
- Late (distribution)

(NeuroLink's 14 providers are LLM-only: bedrock, openai, openai-compatible, openrouter, vertex, anthropic, azure, google-ai, huggingface, ollama, mistral, litellm, sagemaker, auto.)

---

## Part B — Migration plan, ordered by impact and dependency

Each step lists: **goal · files · API used · validation · estimated effort**.

### B.1 — Unblock video scoring (highest impact, fixes the actual broken thing) [≈ 2 hrs]

**Problem we hit**: `runVideoScorerAgent` and `runSceneAnalyzerAgent` fail with *"Image count (78) exceeds the maximum limit for vertex. Maximum allowed: 16"* because NeuroLink's `generate({files: [video.mp4]})` rasterizes the full file.

**Fix**: route through `VideoProcessor` and `analyzeVideo()` instead.

**Files to edit**:
- `src/agents/video-scorer.ts` — replace `neurolink.generate({input: {text, files:[video]}})` with:
  ```ts
  import { processVideo } from '@juspay/neurolink/processors/media/VideoProcessor';
  import { analyzeVideo } from '@juspay/neurolink/adapters/video/videoAnalyzer';
  // OR cleaner: use the high-level analyzeVideo with adaptive frame sampling
  const result = await analyzeVideo(messages, { provider: 'vertex', project, location });
  ```
- `src/agents/scene-analyzer.ts` — same swap.
- `src/agents/video-comparator.ts` — same swap.

**Validation**: re-run `node --import tsx -e '... runVideoScorerAgent(nl, "output/final_captioned.mp4")'`. Expected: real `weighted_overall` score, not `Image count … exceeds 16`.

### B.2 — Replace `src/generators/veo.ts` with NeuroLink call [≈ 30 min]

**Problem**: Director's `veo.ts` uses outdated `veo-3.1:predict` (404). NeuroLink uses the current LRO endpoint and supported model name.

**Files to edit**: `src/generators/veo.ts` — full rewrite from:
```ts
const response = await fetch(`${apiBase}/publishers/google/models/veo-3.1:predict`, {...});
```
to:
```ts
import { generateVideoWithVertex } from '@juspay/neurolink/adapters/video/vertexVideoHandler';

export async function generateClip(prompt: string, outputPath: string, opts = {}) {
  const image = await loadFirstFrame(opts);  // Veo needs an input image
  const result = await generateVideoWithVertex(image, prompt, {
    resolution: '1080p',
    length: opts.duration ?? 8,
    aspectRatio: opts.aspectRatio ?? '16:9',
    audio: opts.generateAudio ?? true,
  });
  await fs.writeFile(outputPath, result.video.data);
  return outputPath;
}
```

**Validation**: `npm start -- --phases 3 --video-gen veo --script tests/fixtures/script.md`. Expect `output/broll.mp4` >1 MB with audio track.

### B.3 — Replace `src/rendering/assembler.ts` merge step [≈ 30 min]

**Files to edit**: `src/rendering/assembler.ts` — keep `assemble()` (audio mux is custom) but swap the underlying multi-clip merge to:
```ts
import { mergeVideoBuffers } from '@juspay/neurolink/adapters/video/videoMerger';
```

Useful for phase 3 (multi-clip B-roll).

### B.4 — Replace phase 3 broll generation with `executeDirectorPipeline` [≈ 1.5 hrs, biggest single win]

**Problem**: Director currently generates a single B-roll clip. NeuroLink's `executeDirectorPipeline` generates **multiple clips with cinematic transitions, parallel + circuit-breaker**.

**Files to edit**:
- `src/pipeline/runner.ts` `phaseBroll()` — replace with:
  ```ts
  import { executeDirectorPipeline } from '@juspay/neurolink/adapters/video/directorPipeline';

  const segments = creative.scenes.map(s => ({
    prompt: s.video_prompt,
    image: await generateOrLoadKeyImage(s.scene_id),  // use ImageGenService
  }));
  const result = await executeDirectorPipeline(segments, {
    resolution: '1080p', length: 8, aspectRatio: '16:9', audio: true,
  }, {
    transitionPrompts: creative.scenes.slice(0,-1).map((_,i) =>
      `Smooth cinematic transition from scene ${i+1} to ${i+2}`),
    transitionDurations: Array(segments.length-1).fill(4),
  });
  await fs.writeFile(path.join(outDir, 'broll.mp4'), result.video.data);
  ```

**Validation**: full pipeline produces a multi-scene B-roll with smooth transitions.

### B.5 — Use `ImageGenService` for B-roll keyframes and avatar fixtures [≈ 1 hr]

**Files**:
- `src/generators/image-gen.ts` (new) — wraps `ImageGenService`
- `tests/fixtures/portrait.jpg` — replace with a real generated face (current is a 1760-byte placeholder)

```ts
import { ImageGenService } from '@juspay/neurolink/image-gen';
const svc = new ImageGenService();
const result = await svc.generate({
  prompt: 'Professional portrait of an AI assistant, friendly, neutral background',
  provider: 'vertex',
  aspectRatio: '1:1',
  style: 'photorealistic',
});
await fs.writeFile('tests/fixtures/portrait.jpg', result.base64Buffer);
```

**Validation**: D-ID lip-sync against generated portrait works without our Unsplash workaround.

### B.6 — Add `provider: 'google-tts'` voiceover via NeuroLink TTS [≈ 30 min]

**Files**:
- `src/voiceover/google-tts.ts` (new) — wraps `TTSProcessor.synthesize(text, 'google-ai', opts)`
- `src/voiceover/index.ts` — register
- `src/pipeline/runner.ts` `phaseVoiceover` — add `provider === 'google-tts'` branch

```ts
import { TTSProcessor } from '@juspay/neurolink';
const result = await TTSProcessor.synthesize(text, 'google-ai', {
  voice: 'en-US-Neural2-D', speed: 1.0, format: 'mp3',
});
await fs.writeFile(outputPath, result.buffer);
```

### B.7 — Unify single-call narration (text + voice) via `generate({tts:})` [≈ 45 min]

For agents that produce script + narration (e.g., scene-by-scene readouts), one call returns both:
```ts
const r = await neurolink.generate({
  input: { text: 'Write a 30s narration for scene 1' },
  provider: 'vertex',
  tts: { enabled: true, useAiResponse: true, voice: 'en-US-Neural2-C', format: 'mp3' },
});
await fs.writeFile('output/scene-1.mp3', r.audio.buffer);
console.log(r.content);  // also has the script
```

### B.8 — Replace `runMultiRunScoring` with NeuroLink workflow ensemble [≈ 1.5 hrs]

**Problem**: current scorer hand-rolls a 3-run loop (`src/agents/video-scorer.ts:runMultiRunScoring`).

**Replace with** `MULTI_JUDGE_3_WORKFLOW` or `CONSENSUS_3_WORKFLOW`:
```ts
import { runWorkflow, MULTI_JUDGE_3_WORKFLOW } from '@juspay/neurolink/workflow';
const r = await runWorkflow(MULTI_JUDGE_3_WORKFLOW, {
  prompt: VIDEO_SCORING_PROMPT,
  inputs: { video: videoPath },
});
console.log(r.scores, r.consensus);
```

Free benefits: judge scoring, confidence calc, consensus across 3+ models.

### B.9 — Add LLM scorers (faithfulness, bias, prompt-alignment) for safety [≈ 1 hr]

In post-pipeline scoring (after `runVideoScorerAgent`), run:
```ts
import {
  createAnswerRelevancyScorer,
  createPromptAlignmentScorer,
  createHallucinationScorer,
} from '@juspay/neurolink/evaluation/scorers/llm';

const alignment = await (await createPromptAlignmentScorer()).score({
  prompt: scriptText, response: result.transcript ?? voiceoverText,
});
const halluc = await (await createHallucinationScorer()).score({...});
```

Add to `output/score.json` for quality gates.

### B.10 — Replace `super-observer` with NeuroLink analytics middleware + Langfuse [≈ 1.5 hrs]

**Files to edit**: `src/observability/`

```ts
import { createAnalyticsMiddleware, getAnalyticsMetrics } from '@juspay/neurolink/middleware/builtin/analytics';
import { initializeOpenTelemetry, initializeLangfuseObservability } from '@juspay/neurolink';

initializeLangfuseObservability(); // reads LANGFUSE_* env vars
neurolink.use(createAnalyticsMiddleware());
// later:
const metrics = getAnalyticsMetrics();  // tokens, cost, latency, errors per provider
```

Replaces ~400 lines in `src/observability/super-observer.ts`. Cost calc via `calculateCost(provider, model, tokens)`.

### B.11 — Use `processVideo` in CreativeDirector / sceneAnalyzer for video context [≈ 30 min]

When agents receive a reference video (e.g. competitor video), use:
```ts
import { processVideo } from '@juspay/neurolink/processors/media';
const processed = await processVideo({uri: file, mimetype: 'video/mp4', name: 'ref.mp4'});
neurolink.generate({ input: { text: prompt + processed.data.textContent, images: processed.data.frames }});
```

Adaptive frame extraction caps at 20 frames — never hits Vertex's 16-image limit.

### B.12 — Adopt FileReferenceRegistry for large-video reuse across agents [≈ 30 min]

For pipelines that score the same final.mp4 across multiple agents:
```ts
import { FileReferenceRegistry } from '@juspay/neurolink/files';
const reg = new FileReferenceRegistry();
const ref = await reg.register('output/final_captioned.mp4');  // upload once
// pass `ref.id` to each agent — re-upload avoided
```

Cuts scoring run time by ~50% when running multi-judge workflows on the same video.

### B.13 — Add `thinkingConfig` to creative-director for higher-quality direction [≈ 15 min]

`src/agents/creative-director.ts`:
```ts
const response = await neurolink.generate({
  ...,
  model: 'gemini-3.1-pro-preview',  // upgrade
  thinkingConfig: { thinkingLevel: 'high' },
});
```

### B.14 — Provider auto-selection / fallback [≈ 30 min]

Replace hardcoded `provider: 'vertex'` in agents with `provider: 'auto'` or use `FAST_FALLBACK_WORKFLOW` so when Vertex hits rate-limits we automatically fall through to google-ai → openrouter → anthropic.

### B.15 — Wire HITL on irreversible ops (Mux upload, Late post) [≈ 45 min]

```ts
import { HITLManager } from '@juspay/neurolink/hitl';
const hitl = new HITLManager({ approvalChannel: 'cli' });
await hitl.requestApproval({
  action: 'mux:upload',
  context: { file: 'output/final_captioned.mp4', size: 7411949 },
  description: 'Upload final video to Mux for public streaming?',
});
// only then: await uploadVideo(...)
```

### B.16 — RAG pipeline for script knowledge & brand voice [≈ 2 hrs]

For longer scripts that reference product docs:
```ts
import { createRAGPipeline, MarkdownLoader, RecursiveChunker, GraphRAG } from '@juspay/neurolink/rag';
const docs = await MarkdownLoader.load('./docs/brand-voice.md', './docs/product-features.md');
const pipeline = createRAGPipeline({ chunker: new RecursiveChunker(), reranker: 'cross-encoder' });
const ctx = await pipeline.retrieve('How should Tara introduce herself?', 5);
neurolink.generate({ input: { text: prompt + ctx.formattedWithCitations }, ... });
```

### B.17 — Tasks / autoresearch for "research the product before generating" [≈ 2 hrs]

```ts
import { TaskExecutor } from '@juspay/neurolink/tasks';
import { ExperimentRunner, resolveConfig } from '@juspay/neurolink/autoresearch';
// Multi-phase research: discover → analyze → synthesize
const runner = new ExperimentRunner(resolveConfig({ topic: 'Tara AI coding agent in Slack' }));
const research = await runner.execute();
// feed `research.summary` into creative-director
```

### B.18 — Generate companion PPT alongside video [≈ 1 hr]

```ts
const r = await neurolink.generate({
  input: { text: scriptText },
  output: { mode: 'ppt', ppt: { slides: 5, theme: 'modern' } },
});
await fs.writeFile('output/final.pptx', r.ppt.data);
```

Useful when distributing for sales decks.

### B.19 — Wire NeuroLink GitHub Action for CI scoring [≈ 1 hr]

`.github/workflows/score-pr.yml`:
```yaml
- uses: juspay/neurolink-action@v1
  with:
    workflow: video-quality-gate
    input: output/final_captioned.mp4
    threshold: 7.0
```

(Uses `action/actionExecutor` + `action/githubIntegration`.)

---

## Part C — Suggested execution order (what to do first)

| Sprint | Items | Outcome |
|---|---|---|
| **Sprint 1 — Make scoring work** (1 day) | B.1, B.11, B.12, B.13 | Real `weighted_overall` scores on every video produced |
| **Sprint 2 — Quality multipliers** (1.5 days) | B.2, B.3, B.4 (Veo + Director Pipeline + merger) | Multi-scene B-roll with cinematic transitions |
| **Sprint 3 — Scale & safety** (1 day) | B.5, B.6, B.14, B.15 (image gen + Google TTS + auto provider + HITL) | More provider options, gated production posts |
| **Sprint 4 — Observability & quality gates** (1 day) | B.8, B.9, B.10 (workflow ensembles + LLM scorers + Langfuse) | Production-grade quality gates with consensus |
| **Sprint 5 — Power features** (2 days) | B.7, B.16, B.17, B.18 (TTS-in-generate + RAG + autoresearch + PPT) | Tara becomes a context-aware video studio |
| **Sprint 6 — CI/CD** (0.5 days) | B.19 | PR-time quality scoring |

Total: ~7 days for full migration.

---

## Part D — Verification checklist after migration

- [ ] `npm test` passes (53 unit + integration tests)
- [ ] `npm start -- --dry-run` boots without error
- [ ] Tier 0 still 6/6 PASS
- [ ] `runVideoScorerAgent` returns real score (not 16-image-cap error) on 7.4 MB video
- [ ] `executeDirectorPipeline` produces multi-segment broll with transitions
- [ ] Langfuse trace appears for every NeuroLink call
- [ ] HITL prompts before Mux upload
- [ ] No regressions in any non-NeuroLink provider (Runway/Kling/Replicate/D-ID/Beatoven/Mux/Late/ElevenLabs/OpenAI/Fish/EdgeTTS still call direct APIs unchanged)

---

## Part E — Files staying as direct-fetch (out of NeuroLink scope, **do not touch**)

- `src/voiceover/elevenlabs.ts` ElevenLabs TTS
- `src/voiceover/openai-tts.ts` OpenAI TTS
- `src/voiceover/fish-audio.ts` Fish Audio TTS
- `src/voiceover/edgetts.ts` Edge-TTS CLI
- `src/generators/runway.ts` (fix the `image_to_video`/`promptImage` bug, keep direct fetch)
- `src/generators/kling.ts` (keep direct fetch + JWT signing)
- `src/generators/wan-alpha.ts` (Replicate)
- `src/avatar/did.ts` D-ID
- `src/avatar/musetalk.ts` Replicate MuseTalk
- `src/music/beatoven.ts` (fix base URL: `public-api.beatoven.ai/api/v1`)
- `src/music/elevenlabs-music.ts` ElevenLabs Music
- `src/distribution/mux-hosting.ts` Mux upload
- `src/distribution/late-publisher.ts` Late publish (fix base URL: `getlate.dev/api/v1`)

These vendors aren't in NeuroLink's provider catalog; their direct-fetch implementations stay.
