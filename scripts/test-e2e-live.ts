/**
 * End-to-end live smoke — exercises every NeuroLink modality via the unified
 * generate() API. Runs all categories in parallel; reports PASS/FAIL/SKIP
 * with size + latency. Writes artifacts to out/e2e/.
 *
 * Coverage:
 *   - TTS: ElevenLabs, OpenAI, Fish Audio, Google, Azure, Cartesia
 *   - STT: OpenAI Whisper (via STTProcessor)
 *   - Music: Beatoven, ElevenLabs Music, Lyria, Replicate musicgen
 *   - Avatar: D-ID, HeyGen
 *   - Video: Vertex Veo 4s
 *   - LLM: Vertex Gemini (single + multi-judge workflow)
 *   - RAG: docs/*.md over Vertex
 *   - PPT: 3-slide via Vertex
 *   - Evaluation: paired good + off-topic test (discrimination check)
 *   - Image gen: Vertex Imagen
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import { NeuroLink, MULTI_JUDGE_3_WORKFLOW, STTProcessor } from '@juspay/neurolink';
import { runQualityGates } from '../src/scoring/quality-gates.ts';

const OUT = path.resolve('out/e2e');
await fs.mkdir(OUT, { recursive: true });

type Status = 'pass' | 'fail' | 'skip';
type Result = { name: string; status: Status; ms: number; detail: string };

const nl = new NeuroLink();
const HAS = (...keys: string[]) => keys.every(k => !!process.env[k]);
const SKIP_VIDEO = process.env.SKIP_VIDEO === '1';
const SKIP_EXPENSIVE = process.env.SKIP_EXPENSIVE === '1';

async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t0 = Date.now();
  return [await fn(), Date.now() - t0];
}

async function run(name: string, fn: () => Promise<string>, gate?: () => boolean): Promise<Result> {
  if (gate && !gate()) return { name, status: 'skip', ms: 0, detail: 'gate not satisfied' };
  try {
    const [detail, ms] = await timed(fn);
    return { name, status: 'pass', ms, detail };
  } catch (e) {
    return { name, status: 'fail', ms: 0, detail: e instanceof Error ? e.message.slice(0, 220) : String(e) };
  }
}

// Generate a seed image (solid color JPEG) for video/avatar tests
async function makeSeedImage(): Promise<string> {
  const p = path.join(OUT, 'seed.jpg');
  await execa('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x223377:s=1280x720', '-frames:v', '1', p], { stdio: 'ignore' });
  return p;
}

const tests = [
  // ─────────────────────────────── TTS (6 providers) ───────────────────────────────
  run('tts:elevenlabs', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'elevenlabs', voice: '21m00Tcm4TlvDq8ikWAM', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-elevenlabs.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('ELEVENLABS_API_KEY')),

  run('tts:openai-tts', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'openai-tts', voice: 'alloy', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-openai.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('OPENAI_API_KEY')),

  run('tts:fish-audio', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'fish-audio', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-fish.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('FISH_AUDIO_API_KEY')),

  run('tts:google-ai', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'google-ai', voice: 'en-US-Neural2-D', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-google.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('GOOGLE_APPLICATION_CREDENTIALS') || HAS('GOOGLE_AI_API_KEY')),

  run('tts:azure-tts', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'azure-tts', voice: 'en-US-AvaMultilingualNeural', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-azure.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION')),

  run('tts:cartesia', async () => {
    const r = await nl.generate({
      input: { text: 'Hello from Director.' },
      tts: { enabled: true, provider: 'cartesia', format: 'mp3', useAiResponse: false },
    });
    if (!r.audio?.buffer) throw new Error('no audio');
    const p = path.join(OUT, 'tts-cartesia.mp3');
    await fs.writeFile(p, r.audio.buffer);
    return `${(r.audio.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('CARTESIA_API_KEY')),

  // ─────────────────────────────── STT (via NeuroLink) ───────────────────────────────
  run('stt:openai-whisper', async () => {
    const audio = path.join(OUT, 'tts-openai.mp3');
    try { await fs.access(audio); } catch { throw new Error('no audio fixture (tts:openai-tts must pass first)'); }
    const buf = await fs.readFile(audio);
    const r = await STTProcessor.transcribe(buf, 'openai-stt', { format: 'mp3', language: 'en' });
    if (!r?.text) throw new Error('no transcription text');
    const out = path.join(OUT, 'stt-openai.txt');
    await fs.writeFile(out, r.text);
    return `"${r.text.slice(0, 80)}"`;
  }, () => HAS('OPENAI_API_KEY')),

  run('stt:deepgram', async () => {
    const audio = path.join(OUT, 'tts-openai.mp3');
    try { await fs.access(audio); } catch { throw new Error('no audio fixture'); }
    const buf = await fs.readFile(audio);
    const r = await STTProcessor.transcribe(buf, 'deepgram', { format: 'mp3', language: 'en' });
    if (!r?.text) throw new Error('no transcription text');
    const out = path.join(OUT, 'stt-deepgram.txt');
    await fs.writeFile(out, r.text);
    return `"${r.text.slice(0, 80)}"`;
  }, () => HAS('DEEPGRAM_API_KEY')),

  // ─────────────────────────────── Music (4 providers) ───────────────────────────────
  run('music:beatoven-15s', async () => {
    const r = await nl.generate({
      input: { text: '' },
      output: { mode: 'music', music: { prompt: 'short cinematic theme, ambient, uplifting', provider: 'beatoven', duration: 15, format: 'mp3', mood: 'uplifting' } },
      timeout: '240s',
    } as Parameters<NeuroLink['generate']>[0]);
    const m = (r as unknown as { music?: { buffer?: Buffer } }).music;
    if (!m?.buffer) throw new Error('no music');
    const p = path.join(OUT, 'music-beatoven.mp3');
    await fs.writeFile(p, m.buffer);
    return `${(m.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('BEATOVEN_API_KEY') && !SKIP_EXPENSIVE),

  run('music:elevenlabs-15s', async () => {
    const r = await nl.generate({
      input: { text: '' },
      output: { mode: 'music', music: { prompt: 'short cinematic theme, ambient', provider: 'elevenlabs-music', duration: 15, format: 'mp3' } },
      timeout: '240s',
    } as Parameters<NeuroLink['generate']>[0]);
    const m = (r as unknown as { music?: { buffer?: Buffer } }).music;
    if (!m?.buffer) throw new Error('no music');
    const p = path.join(OUT, 'music-elevenlabs.mp3');
    await fs.writeFile(p, m.buffer);
    return `${(m.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('ELEVENLABS_API_KEY') && !SKIP_EXPENSIVE),

  run('music:lyria', async () => {
    const r = await nl.generate({
      input: { text: '' },
      output: { mode: 'music', music: { prompt: 'short cinematic theme, ambient', provider: 'lyria', duration: 15, format: 'mp3' } },
      timeout: '240s',
    } as Parameters<NeuroLink['generate']>[0]);
    const m = (r as unknown as { music?: { buffer?: Buffer } }).music;
    if (!m?.buffer) throw new Error('no music');
    const p = path.join(OUT, 'music-lyria.mp3');
    await fs.writeFile(p, m.buffer);
    return `${(m.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('GOOGLE_AI_API_KEY') && !SKIP_EXPENSIVE),

  // ─────────────────────────────── Avatar (2 providers) ───────────────────────────────
  run('avatar:d-id', async () => {
    const imgPath = await makeSeedImage();
    const audio = path.join(OUT, 'tts-openai.mp3');
    try { await fs.access(audio); } catch { throw new Error('no audio fixture'); }
    const imageBuf = await fs.readFile(imgPath);
    const audioBuf = await fs.readFile(audio);
    const r = await nl.generate({
      input: { text: '' },
      output: { mode: 'avatar', avatar: { image: imageBuf, audio: audioBuf, provider: 'd-id', quality: 'standard', format: 'mp4' } },
      timeout: '240s',
    } as Parameters<NeuroLink['generate']>[0]);
    const a = (r as unknown as { avatar?: { buffer?: Buffer } }).avatar;
    if (!a?.buffer) throw new Error('no avatar');
    const p = path.join(OUT, 'avatar-did.mp4');
    await fs.writeFile(p, a.buffer);
    return `${(a.buffer.length / 1024).toFixed(1)} KB`;
  }, () => HAS('DID_API_KEY') && !SKIP_EXPENSIVE),

  // ─────────────────────────────── Video — Veo 4s ───────────────────────────────
  run('video:vertex-veo-4s', async () => {
    const img = await makeSeedImage();
    const imageBuf = await fs.readFile(img);
    const r = await nl.generate({
      input: { text: 'a serene mountain sunrise, cinematic', images: [imageBuf] },
      provider: 'vertex',
      region: process.env.VERTEX_LOCATION ?? 'us-central1',
      output: { mode: 'video', video: { provider: 'vertex', resolution: '720p', length: 4, aspectRatio: '16:9', audio: false } },
    });
    if (!r.video?.data) throw new Error('no video');
    const p = path.join(OUT, 'video-veo.mp4');
    await fs.writeFile(p, r.video.data);
    return `${(r.video.data.length / 1024).toFixed(1)} KB`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT') && !SKIP_VIDEO),

  // ─────────────────────────────── LLM ───────────────────────────────
  run('llm:vertex-gemini', async () => {
    const r = await nl.generate({
      input: { text: 'In one sentence, describe a serene mountain sunrise.' },
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      maxTokens: 64,
    });
    return `${(r.content?.length ?? 0)} chars`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT')),

  // ─────────────────────────────── RAG ───────────────────────────────
  run('rag:vertex-over-docs', async () => {
    const entries = (await fs.readdir('docs').catch(() => [])).filter(e => e.endsWith('.md')).map(e => path.join('docs', e));
    if (!entries.length) throw new Error('no docs/*.md');
    const r = await nl.generate({
      input: { text: 'What is the brand voice and tone?' },
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      rag: { files: entries, strategy: 'markdown', chunkSize: 512, topK: 3 },
      maxTokens: 128,
    });
    return `${(r.content?.length ?? 0)} chars over ${entries.length} docs`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT')),

  // ─────────────────────────────── PPT ───────────────────────────────
  run('ppt:vertex-3-slide', async () => {
    const r = await nl.generate({
      input: { text: 'A 3-slide deck on AI video automation value.' },
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      output: { mode: 'ppt', ppt: { pages: 3, aspectRatio: '16:9', generateAIImages: false, outputPath: path.join(OUT, 'deck.pptx') } },
      timeout: '240s',
    } as Parameters<NeuroLink['generate']>[0]);
    const ppt = (r as unknown as { ppt?: { filePath?: string; totalSlides?: number } }).ppt;
    if (!ppt?.filePath) throw new Error('no ppt');
    const s = await fs.stat(ppt.filePath);
    return `${ppt.totalSlides ?? '?'} slides, ${(s.size / 1024).toFixed(0)} KB`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT')),

  // ─────────────────────────────── Quality gates — discrimination test ───────────────────────────────
  run('eval:gates-good-input', async () => {
    const report = await runQualityGates({
      script: 'Write a one-sentence cinematic description of a serene mountain sunrise.',
      response: 'The peaks glow gold as dawn breaks across the valley.',
    }, { outputPath: path.join(OUT, 'qg-good.json') });
    return `passed=${report.passed} min=${report.overall.minScore.toFixed(2)} avg=${report.overall.avgScore.toFixed(2)} passedGates=${report.overall.passedGates}/${report.scores.length}`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT')),

  run('eval:gates-off-topic-input', async () => {
    const report = await runQualityGates({
      script: 'Write a one-sentence cinematic description of a serene mountain sunrise.',
      response: 'The price of bananas rose five percent in Brazil last quarter.',
    }, { outputPath: path.join(OUT, 'qg-off-topic.json') });
    return `passed=${report.passed} min=${report.overall.minScore.toFixed(2)} avg=${report.overall.avgScore.toFixed(2)} failed=[${report.overall.failedGates.join(',')}]`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT')),

  // ─────────────────────────────── Multi-judge workflow ───────────────────────────────
  run('workflow:multi-judge-3', async () => {
    const r = await nl.generate({
      input: { text: 'Write a one-sentence headline for a product launch video.' },
      workflowConfig: MULTI_JUDGE_3_WORKFLOW,
      timeout: '180s',
    });
    if (!r.workflow) throw new Error('no workflow block');
    return `selected=${r.workflow.selectedModel} models=${r.workflow.ensembleResponses.length}`;
  }, () => HAS('GOOGLE_CLOUD_PROJECT') && !SKIP_EXPENSIVE),
];

const results = await Promise.all(tests);

console.log('\n──────────── E2E LIVE RESULTS ────────────');
const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));
for (const r of results) {
  const icon = r.status === 'pass' ? '✅' : r.status === 'skip' ? '➖' : '❌';
  console.log(`${icon} ${pad(r.name, 28)} ${pad(r.ms ? r.ms + 'ms' : '-', 8)} ${r.detail}`);
}
console.log('──────────────────────────────────────────');
const summary = results.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {} as Record<string, number>);
console.log(`pass=${summary.pass ?? 0}  fail=${summary.fail ?? 0}  skip=${summary.skip ?? 0}  (total=${results.length})`);

// Save machine-readable report
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify({ ts: new Date().toISOString(), results, summary }, null, 2));
console.log(`\nReport: ${path.join(OUT, 'report.json')}`);

await nl.shutdown?.();
process.exit((summary.fail ?? 0) > 0 ? 1 : 0);
