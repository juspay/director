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
        const score = await observe('video-scoring', () => runVideoScorerAgent(neurolink, finalVideo));
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

async function phaseVoiceover(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const requested = opts.provider ?? 'elevenlabs';
  const provider = VOICEOVER_ALIAS[requested] ?? 'elevenlabs';
  const outputPath = path.join(outDir, 'voiceover.mp3');
  const text = opts.scriptPath ? await fs.readFile(opts.scriptPath, 'utf-8') : 'Sample narration text';
  return voiceover.generate(nl, provider, text, outputPath);
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

async function phaseBroll(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.videoGenerator ?? 'kling';
  const provider = VIDEO_ALIAS[gen] ?? 'kling';
  const outputPath = path.join(outDir, 'broll.mp4');
  const model = REPLICATE_MODEL[gen];
  return generators.generate(nl, provider, 'Product video B-roll', outputPath, model ? { model } : {});
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
  const compositionName = process.env.REMOTION_COMPOSITION ?? 'MainVideo';
  return rendering.renderLocal(compositionName, path.join(outDir, 'render.mp4'));
}

async function phaseAssembly(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  return rendering.assemble(
    path.join(outDir, 'render.mp4'),
    path.join(outDir, 'music.wav'),
    path.join(outDir, 'final.mp4'),
  );
}

async function phaseCaptions(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const srtPath = path.join(outDir, 'captions.srt');
  await rendering.generateSrt(path.join(outDir, 'voiceover.mp3'), srtPath);
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
    if (args[i] === '--video-gen') opts.videoGenerator = args[++i];
    if (args[i] === '--music-gen') opts.musicGenerator = args[++i];
    if (args[i] === '--avatar-source') opts.avatarSource = args[++i];
    if (args[i] === '--avatar-provider') opts.avatarProvider = args[++i];
    if (args[i] === '--skip-scoring') opts.skipScoring = true;
    if (args[i] === '--dry-run') opts.dryRun = true;
  }

  runPipeline(opts).catch(console.error);
}
