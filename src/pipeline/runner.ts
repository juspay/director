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
import { generateAvatar as didGenerateAvatar, generateLipsync } from '../avatar/index.ts';
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

export interface PipelineOptions {
  phases?: number[];           // Which phases to run (default: all)
  scriptPath?: string;         // Path to script markdown
  videoPath?: string;          // Existing video for scoring
  audioPath?: string;          // Existing voiceover audio
  outputDir?: string;          // Output directory
  provider?: string;           // TTS provider (elevenlabs/openai/fish/edgetts)
  videoGenerator?: string;     // Video generator (kling/runway/veo/wan-alpha)
  musicGenerator?: string;     // Music generator (lyria/beatoven/numpy)
  avatarSource?: string;       // Avatar source image path
  avatarProvider?: string;     // Avatar provider (did/musetalk)
  dryRun?: boolean;
  skipScoring?: boolean;
}

export async function runPipeline(opts: PipelineOptions = {}): Promise<PipelineState> {
  const neurolink = new NeuroLink();
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

async function phaseVoiceover(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const provider = opts.provider ?? 'elevenlabs';
  const outputPath = path.join(outDir, 'voiceover.mp3');
  const text = opts.scriptPath ? await fs.readFile(opts.scriptPath, 'utf-8') : 'Sample narration text';

  if (provider === 'openai') return voiceover.openaiTts.generate(text, outputPath);
  if (provider === 'fish') return voiceover.fishAudio.generate(text, outputPath);
  if (provider === 'edgetts') return voiceover.edgetts.generate(text, outputPath);
  return voiceover.elevenlabs.generate(text, outputPath);
}

async function phaseAvatar(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  if (!opts.avatarSource) return { status: 'skipped', reason: 'No avatar source configured (use --avatar-source)' };

  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const voiceoverPath = path.join(outDir, 'voiceover.mp3');
  const outputPath = path.join(outDir, 'avatar.mp4');

  // Check voiceover exists
  try { await fs.access(voiceoverPath); } catch {
    return { status: 'skipped', reason: 'Voiceover not found — run phase 1 first' };
  }

  const provider = opts.avatarProvider ?? 'did';
  if (provider === 'musetalk') return generateLipsync(opts.avatarSource, voiceoverPath, outputPath);
  return didGenerateAvatar(opts.avatarSource, voiceoverPath, outputPath);
}

async function phaseBroll(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.videoGenerator ?? 'kling';
  const outputPath = path.join(outDir, 'broll.mp4');

  if (gen === 'runway') return generators.runway.generateClip('Product video B-roll', outputPath);
  if (gen === 'veo') return generators.veo.generateClip('Product video B-roll', outputPath);
  if (gen === 'wan-alpha') return generators.wanAlpha.generateRgbaVideo('Product video B-roll', outputPath);
  return generators.kling.generateClip('Product video B-roll', outputPath);
}

async function phaseMusic(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.musicGenerator ?? 'numpy';

  if (gen === 'lyria') return music.generateTrack(path.join(outDir, 'music.wav'));
  if (gen === 'beatoven') return music.generateFromText('Cinematic background', path.join(outDir, 'music.mp3'));
  if (gen === 'elevenlabs') return music.generateMusic('Cinematic background music', path.join(outDir, 'music.mp3'));
  // Default: NumPy synthesis via Python subprocess
  return synthesizeMusic(path.join(outDir, 'music.wav'));
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
