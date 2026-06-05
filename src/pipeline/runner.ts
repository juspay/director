/**
 * Unified 7-phase pipeline runner — TypeScript primary.
 *
 * Orchestrates the full video production pipeline:
 * Phase 1: Voiceover (ElevenLabs/OpenAI/Fish/EdgeTTS)
 * Phase 2: Avatar (MuseTalk/D-ID) — concurrent
 * Phase 3: B-roll (Kling/Runway/Veo/Wan-Alpha) — concurrent
 * Phase 4: Music (Lyria/Beatoven/NumPy via subprocess) — concurrent
 * Phase 5: Render (Remotion local or Lambda)
 * Phase 6: Assembly (FFmpeg assembler + color grade)
 * Phase 7: Captions (WhisperX + SRT burn-in)
 *
 * Single NeuroLink instance for AI scoring. Resume-safe via JSON state.
 * TypeScript primary — Python only for NumPy/SciPy DSP via execa.
 */
import { NeuroLink } from '@juspay/neurolink';
import fs from 'fs/promises';
import path from 'path';
import { OUTPUT_DIR } from './config.ts';
import { loadState, saveState } from './state.ts';
import type { PipelineState } from '../types/index.ts';

// TypeScript modules (primary)
import * as voiceover from '../voiceover/index.ts';
import * as generators from '../generators/index.ts';
import { generateImage } from '../generators/image.ts';
import * as rendering from '../rendering/index.ts';
import * as avatar from '../avatar/index.ts';
import * as music from '../music/index.ts';
import * as distribution from '../distribution/index.ts';

// Python DSP bridge (subprocess only)
import { synthesizeMusic, synthesizeSfx, mixAudio, analyzeAudio } from '../scripts/python-bridge.ts';

// Neurolink AI agents
import {
  runVideoScorerAgent,
  runScriptScorerAgent,
  runCreativeDirectorAgent,
} from '../agents/index.ts';

// Observability
import { observe } from '../observability/agent-observer.ts';
import { startReporter, stopReporter } from '../observability/reporter.ts';
import { runSuperObserver } from '../observability/super-observer.ts';

// Scoring
import { CostTracker } from '../scoring/index.ts';

const PHASES = [
  { name: 'voiceover', label: '1. Voiceover', fn: phaseVoiceover },
  { name: 'avatar', label: '2. Avatar', fn: phaseAvatar, concurrent: true },
  { name: 'broll', label: '3. B-roll', fn: phaseBroll, concurrent: true },
  { name: 'music', label: '4. Music', fn: phaseMusic, concurrent: true },
  { name: 'render', label: '5. Render', fn: phaseRender },
  { name: 'assembly', label: '6. Assembly', fn: phaseAssembly },
  { name: 'captions', label: '7. Captions', fn: phaseCaptions },
] as const;

import type { PipelineOptions } from '../types/index.ts';
export type { PipelineOptions } from '../types/index.ts';

export async function runPipeline(opts: PipelineOptions = {}): Promise<PipelineState> {
  const neurolink = new NeuroLink();

  // Observability: NeuroLink OTel + Langfuse if env keys present.
  if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
    try {
      const nl = await import('@juspay/neurolink');
      const init = (nl as unknown as { initializeOpenTelemetry?: () => void | Promise<void> }).initializeOpenTelemetry;
      if (typeof init === 'function') {
        await init();
        console.log('[Observability] OpenTelemetry + Langfuse initialized');
      }
    } catch (e) {
      console.warn('[Observability] Langfuse init skipped:', e instanceof Error ? e.message : e);
    }
  }

  const outDir = opts.outputDir ?? OUTPUT_DIR;
  await fs.mkdir(outDir, { recursive: true });

  const state = await loadState<PipelineState>('pipeline-state.json', {
    currentStep: 0,
    totalSteps: PHASES.length,
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const phasesToRun = opts.phases ?? PHASES.map((_, i) => i + 1);
  startReporter();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Director Pipeline — TypeScript Primary`);
  console.log(`  Phases: ${phasesToRun.join(', ')} | Output: ${outDir}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Phase 1: Voiceover (sequential — everything depends on it)
    if (phasesToRun.includes(1)) {
      await runPhase(PHASES[0], state, neurolink, opts);
    }

    // Phases 2-4: Concurrent (independent of each other)
    const concurrentPhases = [2, 3, 4].filter((p) => phasesToRun.includes(p));
    if (concurrentPhases.length > 0) {
      console.log(`\n--- Phases ${concurrentPhases.join(', ')} (concurrent) ---\n`);
      const tasks = concurrentPhases.map((p) =>
        runPhase(PHASES[p - 1], state, neurolink, opts),
      );
      await Promise.all(tasks);
    }

    // Phases 5-7: Sequential
    for (const p of [5, 6, 7]) {
      if (phasesToRun.includes(p)) {
        await runPhase(PHASES[p - 1], state, neurolink, opts);
      }
    }

    // Post-pipeline: scoring and observability
    if (!opts.skipScoring) {
      const finalVideo = path.join(outDir, 'final_captioned.mp4');
      try {
        await fs.access(finalVideo);
        console.log('\n--- Post-pipeline: AI Scoring ---\n');
        // Give the critic the actual concept (the narration script) so it judges
        // against what the video is, not a hardcoded default product.
        const scoreContext = await readScript(opts.scriptPath).catch(() => undefined);
        const score = await observe('video-scoring', () => runVideoScorerAgent(neurolink, finalVideo, 'dev', scoreContext));
        state.results['scoring'] = score.result;
      } catch {
        // Final video not found — skip scoring
      }

      console.log('\n--- Post-pipeline: Observability Report ---\n');
      await runSuperObserver();
    }
  } finally {
    stopReporter();
    await neurolink.shutdown();
    await saveState('pipeline-state.json', state);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Pipeline complete. ${Object.keys(state.results).length}/${PHASES.length} phases.`);
  console.log(`${'='.repeat(60)}\n`);

  return state;
}

async function runPhase(
  phase: (typeof PHASES)[number],
  state: PipelineState,
  neurolink: NeuroLink,
  opts: PipelineOptions,
): Promise<void> {
  if (state.results[phase.name]) {
    console.log(`  [${phase.label}] Already complete, skipping.`);
    return;
  }

  console.log(`\n--- ${phase.label} ---\n`);

  try {
    const { result } = await observe(phase.name, () => phase.fn(neurolink, opts));
    state.results[phase.name] = result ?? { status: 'complete' };
    state.updatedAt = new Date().toISOString();
    await saveState('pipeline-state.json', state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.errors.push(`${phase.label}: ${msg}`);
    console.error(`  ${phase.label} FAILED: ${msg}`);
  }
}

// Phase implementations

const VOICEOVER_ALIAS: Record<string, voiceover.VoiceoverProvider> = {
  elevenlabs: 'elevenlabs',
  openai: 'openai-tts',
  'openai-tts': 'openai-tts',
  fish: 'fish-audio',
  'fish-audio': 'fish-audio',
  google: 'google-ai',
  'google-tts': 'google-ai',
  'google-ai': 'google-ai',
  azure: 'azure-tts',
  'azure-tts': 'azure-tts',
  cartesia: 'cartesia',
  edgetts: 'edgetts',
};

async function readScript(scriptPath: string | undefined): Promise<string> {
  if (scriptPath) return (await fs.readFile(scriptPath, 'utf-8')).trim();
  const defaultScript = path.resolve('assets/script.txt');
  try { return (await fs.readFile(defaultScript, 'utf-8')).trim(); } catch { /* no default */ }
  throw new Error('No script provided. Pass --script <path> or create assets/script.txt');
}

async function phaseVoiceover(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const requested = opts.provider ?? 'openai';
  const provider = VOICEOVER_ALIAS[requested] ?? 'openai-tts';
  const outputPath = path.join(outDir, 'voiceover.mp3');
  const text = await readScript(opts.scriptPath);
  return voiceover.generate(nl, provider, text, outputPath, opts.voice ? { voice: opts.voice } : {});
}

const AVATAR_ALIAS: Record<string, avatar.AvatarProvider> = {
  did: 'd-id',
  'd-id': 'd-id',
  heygen: 'heygen',
  replicate: 'replicate',
  musetalk: 'replicate',
};

async function phaseAvatar(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  if (!opts.avatarSource) return { status: 'skipped', reason: 'No avatar source configured (use --avatar-source)' };

  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const voiceoverPath = path.join(outDir, 'voiceover.mp3');
  const outputPath = path.join(outDir, 'avatar.mp4');

  try { await fs.access(voiceoverPath); } catch {
    return { status: 'skipped', reason: 'Voiceover not found — run phase 1 first' };
  }

  const provider = AVATAR_ALIAS[opts.avatarProvider ?? 'did'] ?? 'd-id';
  return avatar.generate(nl, provider, opts.avatarSource, { audio: voiceoverPath }, outputPath);
}

const VIDEO_ALIAS: Record<string, generators.VideoProvider> = {
  vertex: 'vertex',
  veo: 'vertex',
  kling: 'kling',
  runway: 'runway',
  replicate: 'replicate',
  'wan-alpha': 'replicate',
};

const REPLICATE_MODEL: Record<string, string> = {
  'wan-alpha': 'wechatcv/wan-alpha',
};

async function ensureSeedImage(seedImg: string): Promise<void> {
  try { await fs.access(seedImg); return; } catch { /* generate */ }
  const { execa } = await import('execa');
  await execa('ffmpeg', [
    '-y', '-f', 'lavfi',
    '-i', 'gradients=size=1280x720:c0=0x0b1d3a:c1=0xd97a3a:duration=1:rate=1',
    '-frames:v', '1', seedImg,
  ], { stdio: 'ignore' });
}

async function probeDuration(file: string): Promise<number> {
  const { execa } = await import('execa');
  try {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', file,
    ]);
    return parseFloat(stdout.trim()) || 0;
  } catch { return 0; }
}

async function phaseBroll(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.videoGenerator ?? 'vertex';
  const provider = VIDEO_ALIAS[gen] ?? 'vertex';
  const outputPath = path.join(outDir, 'broll.mp4');
  const model = REPLICATE_MODEL[gen];

  const seedImg = path.join(outDir, '.broll-seed.jpg');
  await fs.mkdir(outDir, { recursive: true });
  await ensureSeedImage(seedImg);

  // Match b-roll length to voiceover; default to 8s when VO isn't available.
  const voPath = path.join(outDir, 'voiceover.mp3');
  const voDur = await probeDuration(voPath);
  const segLen = 4;

  const GENERIC_PROMPTS = [
    'Cinematic close-up: animated workflow diagram, neon nodes connecting, dark blue tech aesthetic, slow zoom',
    'Cinematic wide shot: futuristic editing studio, multiple monitors showing video pipeline, smooth dolly',
    'Cinematic macro: glowing particles forming a film strip, depth of field, warm gradient backdrop',
    'Cinematic top-down: stylized timeline tracks scrolling, audio waveform pulsing, animated overlay',
    'Cinematic medium shot: holographic interface with TTS, music, captions, abstract product reveal',
    'Cinematic close-up: rendering progress bars filling, sparks and glow, dramatic lighting',
    'Cinematic wide shot: data streams converging into a single polished video frame, dramatic camera move',
    'Cinematic abstract: rotating geometric shapes, deep gradient, soft bokeh, brand-quality b-roll',
  ];

  // Concept-driven b-roll. assets/broll-prompts.json may be either a plain
  // string[] (legacy) or { hero?, scenes: [{prompt, product}] }. When scenes
  // are present we run a two-stage pass: generate a composed keyframe per beat
  // (product beats anchored to a shared hero image for consistency), then
  // animate each keyframe with the video model.
  type Scene = { prompt: string; product?: boolean };
  let heroPrompt: string | null = null;
  let scenes: Scene[] | null = null;
  try {
    const raw = await fs.readFile(path.resolve('assets/broll-prompts.json'), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((p) => typeof p === 'string')) {
      scenes = (parsed as string[]).map((p) => ({ prompt: p }));
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { scenes?: unknown }).scenes)) {
      const obj = parsed as { hero?: unknown; scenes: Array<{ prompt?: unknown; product?: unknown }> };
      scenes = obj.scenes.filter((s) => typeof s.prompt === 'string').map((s) => ({ prompt: s.prompt as string, product: !!s.product }));
      if (typeof obj.hero === 'string') heroPrompt = obj.hero;
    }
  } catch { /* fall back to generic */ }

  const segPaths: string[] = [];

  if (scenes && scenes.length) {
    console.log(`[B-roll] Concept mode: ${scenes.length} keyframe→video beats${heroPrompt ? ' + hero reference' : ''}`);

    // Shared hero image → product beats stay visually consistent.
    let heroBuf: Buffer | undefined;
    if (heroPrompt && scenes.some((s) => s.product)) {
      const heroPath = path.join(outDir, '.hero.png');
      try { heroBuf = await fs.readFile(heroPath); }
      catch {
        try { await generateImage(heroPrompt, heroPath, { aspectRatio: '16:9' }); heroBuf = await fs.readFile(heroPath); }
        catch (e) { console.log(`  [B-roll] hero image failed: ${e instanceof Error ? e.message.slice(0, 90) : String(e)}`); }
      }
    }

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const segOut = path.join(outDir, `.broll-seg-${i}.mp4`);
      try { await fs.access(segOut); segPaths.push(segOut); continue; } catch { /* generate */ }

      // Stage 1: composed keyframe (anchor product beats to the hero ring).
      const keyPath = path.join(outDir, `.broll-key-${i}.png`);
      let keyframe = keyPath;
      try { await fs.access(keyPath); }
      catch {
        try {
          await generateImage(scene.prompt, keyPath, { aspectRatio: '16:9', referenceImages: scene.product && heroBuf ? [heroBuf] : undefined });
        } catch (e) {
          console.log(`  [B-roll] keyframe ${i} failed, falling back to gradient seed: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
          await ensureSeedImage(seedImg);
          keyframe = seedImg;
        }
      }

      // Crop the keyframe to 16:9 before animation — image models often emit a
      // square frame, and the video model would otherwise pillarbox it (black
      // bars baked into the pixels). center-crop keeps the (centered) subject.
      try {
        const { execa } = await import('execa');
        const keyframe169 = keyframe.replace(/\.(png|jpe?g)$/i, '.169.jpg');
        await execa('ffmpeg', ['-y', '-i', keyframe, '-vf', 'crop=iw:trunc(iw*9/16/2)*2', '-q:v', '2', keyframe169], { stdio: 'ignore' });
        keyframe = keyframe169;
      } catch { /* use original keyframe if crop fails */ }

      // Stage 2: animate the keyframe.
      try {
        await generators.generate(nl, provider, scene.prompt, segOut, {
          inputImage: keyframe, length: segLen, resolution: '720p', aspectRatio: '16:9', audio: false,
          ...(model ? { model } : {}),
        });
        segPaths.push(segOut);
      } catch (e) {
        console.log(`  [B-roll] segment ${i} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
      }
    }
  } else {
    // Legacy generic path: single gradient seed + generic prompts.
    await ensureSeedImage(seedImg);
    const segCount = voDur > 0 ? Math.min(8, Math.max(1, Math.ceil(voDur / segLen))) : 2;
    console.log(`[B-roll] VO ${voDur.toFixed(2)}s → ${segCount}×${segLen}s clips`);
    for (let i = 0; i < segCount; i++) {
      const segOut = path.join(outDir, `.broll-seg-${i}.mp4`);
      try { await fs.access(segOut); segPaths.push(segOut); continue; } catch { /* generate */ }
      try {
        await generators.generate(nl, provider, GENERIC_PROMPTS[i % GENERIC_PROMPTS.length], segOut, {
          inputImage: seedImg, length: segLen, resolution: '720p', aspectRatio: '16:9', audio: false,
          ...(model ? { model } : {}),
        });
        segPaths.push(segOut);
      } catch (e) {
        console.log(`  [B-roll] segment ${i} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
      }
    }
  }

  if (segPaths.length === 0) throw new Error('[B-roll] no segments produced');
  if (segPaths.length === 1) {
    await fs.copyFile(segPaths[0], outputPath);
    console.log(`[B-roll] Single segment → ${outputPath}`);
    return outputPath;
  }
  return rendering.concatVideos(segPaths, outputPath, { width: 1280, height: 720, fps: 30 });
}

const MUSIC_ALIAS: Record<string, music.MusicProvider> = {
  lyria: 'lyria',
  beatoven: 'beatoven',
  elevenlabs: 'elevenlabs-music',
  'elevenlabs-music': 'elevenlabs-music',
  replicate: 'replicate',
};

async function phaseMusic(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.musicGenerator ?? 'numpy';
  if (gen === 'numpy') return synthesizeMusic(path.join(outDir, 'music.wav'));
  const provider = MUSIC_ALIAS[gen] ?? 'beatoven';
  const outFile = provider === 'beatoven' || provider === 'elevenlabs-music' || provider === 'replicate'
    ? path.join(outDir, 'music.mp3')
    : path.join(outDir, 'music.wav');
  return music.generate(nl, provider, 'Cinematic background music for a product video', outFile, {
    format: outFile.endsWith('.wav') ? 'wav' : 'mp3',
    mood: 'cinematic',
  });
}

async function phaseRender(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  // Remotion is optional — skip cleanly when no remotion/ project exists.
  try { await fs.access('remotion/package.json'); } catch {
    console.log('[Render] No remotion/ project — skipping (b-roll is primary video).');
    return { status: 'skipped', reason: 'No remotion/ project configured' };
  }
  const compositionName = process.env.REMOTION_COMPOSITION ?? 'MainVideo';
  return rendering.renderLocal(compositionName, path.join(outDir, 'render.mp4'));
}

async function phaseAssembly(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const broll = path.join(outDir, 'broll.mp4');
  const voiceover = path.join(outDir, 'voiceover.mp3');
  const musicWav = path.join(outDir, 'music.wav');
  const musicMp3 = path.join(outDir, 'music.mp3');

  let music: string | null = null;
  try { await fs.access(musicWav); music = musicWav; } catch { /* try mp3 */ }
  if (!music) { try { await fs.access(musicMp3); music = musicMp3; } catch { /* none */ } }

  return rendering.assembleFinal(broll, voiceover, music, path.join(outDir, 'final.mp4'), {
    width: 1280, height: 720, musicGainDb: -18,
  });
}

function srtTime(t: number): string {
  const ms = Math.floor((t % 1) * 1000), s = Math.floor(t) % 60, m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Build an SRT directly from the known script — 100% accurate text, timed
 * proportionally to word count across the voiceover duration. Avoids STT
 * mishearing brand names / homophones (e.g. "Aether" → "Ather", "know" → "no").
 */
function scriptToSrt(script: string, durationSec: number): string {
  const words = script.split(/\s+/).filter(Boolean);
  const cues: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 6 || (/[.!?]$/.test(w) && cur.length >= 3)) { cues.push(cur); cur = []; }
  }
  if (cur.length) cues.push(cur);

  const lead = 0.08;
  const total = words.length || 1;
  let acc = 0, out = '';
  cues.forEach((c, i) => {
    const start = lead + (acc / total) * (durationSec - lead);
    acc += c.length;
    const end = lead + (acc / total) * (durationSec - lead);
    out += `${i + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${c.join(' ')}\n\n`;
  });
  return out;
}

async function phaseCaptions(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const srtPath = path.join(outDir, 'captions.srt');
  const voPath = path.join(outDir, 'voiceover.mp3');

  // Prefer the known script (accurate text); fall back to STT when unavailable.
  let usedScript = false;
  try {
    const script = await readScript(opts.scriptPath);
    const dur = await probeDuration(voPath);
    if (script && dur > 0) {
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(srtPath, scriptToSrt(script, dur));
      console.log(`[Captions] SRT from script (${srtPath})`);
      usedScript = true;
    }
  } catch { /* fall back to STT */ }

  if (!usedScript) await rendering.generateSrt(voPath, srtPath);
  return rendering.burnCaptions(path.join(outDir, 'final.mp4'), srtPath, path.join(outDir, 'final_captioned.mp4'));
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(`Director Pipeline — TypeScript Primary

Usage: tsx src/pipeline/runner.ts [options]

Options:
  --phases 1,2,3       Run specific phases (default: all)
  --script PATH        Script file for voiceover
  --video PATH         Existing video for scoring
  --output DIR         Output directory
  --provider NAME      TTS: elevenlabs|openai|fish|edgetts
  --video-gen NAME     Video: kling|runway|veo|wan-alpha
  --music-gen NAME     Music: lyria|beatoven|elevenlabs|numpy
  --avatar-source PATH Avatar source image for D-ID/MuseTalk
  --avatar-provider    Avatar: did|musetalk
  --skip-scoring       Skip post-pipeline AI scoring
  --dry-run            Print plan without executing`);
    process.exit(0);
  }

  const opts: PipelineOptions = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phases') opts.phases = args[++i].split(',').map(Number);
    if (args[i] === '--script') opts.scriptPath = args[++i];
    if (args[i] === '--video') opts.videoPath = args[++i];
    if (args[i] === '--output') opts.outputDir = args[++i];
    if (args[i] === '--provider') opts.provider = args[++i];
    if (args[i] === '--voice') opts.voice = args[++i];
    if (args[i] === '--video-gen') opts.videoGenerator = args[++i];
    if (args[i] === '--music-gen') opts.musicGenerator = args[++i];
    if (args[i] === '--avatar-source') opts.avatarSource = args[++i];
    if (args[i] === '--avatar-provider') opts.avatarProvider = args[++i];
    if (args[i] === '--skip-scoring') opts.skipScoring = true;
    if (args[i] === '--dry-run') opts.dryRun = true;
  }

  runPipeline(opts).catch(console.error);
}
