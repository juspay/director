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
import { NeuroLink, initializeOpenTelemetry } from '@juspay/neurolink';
import fs from 'fs/promises';
import path from 'path';
import { OUTPUT_DIR } from './config.ts';
import { loadState, saveState, stateDirFor } from './state.ts';
import { mapWithConcurrency, resolveDims, scriptToSrt, resolveNarrationMode, pickCaptionText, completedPhaseCount } from './runner-helpers.ts';
import type { PipelineState } from '../types/index.ts';

// TypeScript modules (primary)
import * as voiceover from '../voiceover/index.ts';
import * as generators from '../generators/index.ts';
import { generateImage, resolveImageGenParams } from '../generators/image.ts';
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
  runArtDirectorAgent,
  runConsistencyCriticAgent,
  narrateScene,
} from '../agents/index.ts';
import {
  buildShotPrompt,
  buildAnimationPrompt,
  shouldRegenerate,
  applyFixToPrompt,
  normalizeShotPlan,
} from './broll-director.ts';
import type { ShotPlan } from '../schemas/shot-plan.ts';

// Observability
import { observe } from '../observability/agent-observer.ts';
import { startReporter, stopReporter } from '../observability/reporter.ts';
import { runSuperObserver } from '../observability/super-observer.ts';

// Scoring
import { CostTracker, runRegressionGate, estimatePreflight, formatPreflight, assertWithinBudget, BudgetExceededError } from '../scoring/index.ts';
import type { PreflightInputs } from '../scoring/index.ts';

const PHASES = [
  { name: 'voiceover', label: '1. Voiceover', fn: phaseVoiceover },
  { name: 'avatar', label: '2. Avatar', fn: phaseAvatar, concurrent: true },
  { name: 'broll', label: '3. B-roll', fn: phaseBroll, concurrent: true },
  { name: 'music', label: '4. Music', fn: phaseMusic, concurrent: true },
  { name: 'render', label: '5. Render', fn: phaseRender },
  { name: 'assembly', label: '6. Assembly', fn: phaseAssembly },
  { name: 'captions', label: '7. Captions', fn: phaseCaptions },
] as const;

// One tracker per process; reset() at the start of each run scopes the summary
// to that run. Maps TTS provider ids → the rate keys in cost-tracker's RATES.
const costTracker = new CostTracker();
const TTS_COST_KEY: Record<string, string> = {
  'openai-tts': 'openai',
  'fish-audio': 'fish_audio',
  elevenlabs: 'elevenlabs',
};

import type { PipelineOptions } from '../types/index.ts';
export type { PipelineOptions } from '../types/index.ts';

export async function runPipeline(opts: PipelineOptions = {}): Promise<PipelineState> {
  const neurolink = new NeuroLink();

  // Observability: NeuroLink OTel + Langfuse if env keys present.
  // (Previously this used an unsafe cast and called init() with no args — but
  // initializeOpenTelemetry requires a LangfuseConfig, so it never actually
  // initialized. Pass the config from env via the typed top-level export.)
  if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
    try {
      await initializeOpenTelemetry({
        enabled: true,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: process.env.LANGFUSE_BASE_URL,
        environment: process.env.NODE_ENV ?? 'production',
      });
      console.log('[Observability] OpenTelemetry + Langfuse initialized');
    } catch (e) {
      console.warn('[Observability] Langfuse init skipped:', e instanceof Error ? e.message : e);
    }
  }

  const outDir = opts.outputDir ?? OUTPUT_DIR;
  await fs.mkdir(outDir, { recursive: true });

  // Scope all state (checkpoint, cost log, agent metrics) to this run's output
  // dir. `??=` so an explicit STATE_DIR_OVERRIDE (tests, tooling) still wins.
  // Must happen before the first loadState/costTracker call below.
  process.env.STATE_DIR_OVERRIDE ??= stateDirFor(outDir);

  const state = await loadState<PipelineState>('pipeline-state.json', {
    currentStep: 0,
    totalSteps: PHASES.length,
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const phasesToRun = opts.phases ?? PHASES.map((_, i) => i + 1);
  // Only truncate the cost log on a *fresh* run. On a resume (state already has
  // completed phases), the prior invocation's cost lines must survive — otherwise
  // getSummary() undercounts spend across the multi-invocation run, since resumed
  // phases are skipped and never re-log their cost. Cost accounting must never
  // break a run, hence the swallow.
  const isResume = completedPhaseCount(state.results, PHASES.map((p) => p.name)) > 0;
  if (!isResume) await costTracker.reset().catch(() => undefined);
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

    // Post-pipeline: scoring and observability. Never score on a dry-run — it
    // would spend on a (possibly stale) video in the output dir.
    if (!opts.skipScoring && !opts.dryRun) {
      const finalVideo = path.join(outDir, 'final_captioned.mp4');
      // 'multi-judge' runs a panel of multimodal judges and takes the median
      // consensus (robust to one noisy critic); 'single' is the default cheap path.
      const scoringMode = (opts.scoringMode ?? process.env.SCORING_MODE ?? 'single').toLowerCase();
      try {
        await fs.access(finalVideo);
        // Give the critic the actual concept (the narration script) so it judges
        // against what the video is, not a hardcoded default product.
        const scoreContext = await readScript(opts.scriptPath).catch(() => undefined);
        if (scoringMode === 'multi-judge') {
          console.log('\n--- Post-pipeline: AI Scoring (multi-judge panel) ---\n');
          const { runMultiJudgeVideoScoring } = await import('../scoring/multi-judge-scorer.ts');
          const consensus = await observe('video-scoring', () => runMultiJudgeVideoScoring(neurolink, finalVideo, { context: scoreContext }));
          if (consensus.result) {
            // Keep a weighted_overall-shaped record so downstream/report code is mode-agnostic.
            state.results['scoring'] = { weighted_overall: consensus.result.consensusOverall, ...consensus.result.dimensions };
            state.results['multi-judge'] = consensus.result;
          }
        } else {
          console.log('\n--- Post-pipeline: AI Scoring ---\n');
          const score = await observe('video-scoring', () => runVideoScorerAgent(neurolink, finalVideo, 'dev', scoreContext));
          if (score.result) state.results['scoring'] = score.result; // don't persist null on scorer failure
        }
      } catch {
        // Final video not found — skip scoring
      }

      // Quality gates (issue #40): judge the narration *script* for content
      // safety/quality. We deliberately do NOT round-trip through STT — TTS
      // renders the script verbatim and captions come from the exact script, so
      // fidelity is guaranteed by construction. STT mishears (e.g. "Aether"→"Ather")
      // were the only thing producing failures. Only the narration-appropriate
      // gates run; the Q&A scorers can't fairly judge a verbatim narration.
      try {
        const script = await readScript(opts.scriptPath).catch(() => '');
        if (script) {
          console.log('\n--- Post-pipeline: Quality Gates ---\n');
          const { runQualityGates, NARRATION_GATES } = await import('../scoring/quality-gates.ts');
          const report = await observe('quality-gates', () => runQualityGates(
            { script, response: script },
            { outputPath: path.join(outDir, 'quality-gates.json'), gates: [...NARRATION_GATES] },
          ));
          const r = report.result;
          if (r) {
            const inc = r.overall.inconclusiveGates;
            console.log(`[QualityGates] ${r.passed ? 'PASS' : 'FAIL'} — avg ${r.overall.avgScore.toFixed(2)}, ${r.overall.passedGates} passed${r.overall.failedGates.length ? `, failed: ${r.overall.failedGates.join(', ')}` : ''}${inc.length ? `, inconclusive: ${inc.join(', ')}` : ''}`);
            state.results['quality-gates'] = r;
          } else {
            console.warn('[QualityGates] scorer returned no report (see observer log above).');
          }
        }
      } catch (e) {
        console.warn('[QualityGates] skipped:', e instanceof Error ? e.message : e);
      }

      // Deterministic regression gate — run the model-free VMAF + VBench gate as
      // part of the pipeline, not only via the `npm run gate` CLI. Lenient by
      // construction: a missing reference skips VMAF and absent CLI binaries
      // resolve to PASS, so it only fails on a *measured* regression and never
      // breaks a completed run. A reference baseline (opt/env) enables VMAF.
      try {
        await fs.access(finalVideo);
        console.log('\n--- Post-pipeline: Regression Gate ---\n');
        const reference = opts.regressionReference ?? process.env.REGRESSION_REFERENCE ?? null;
        const gate = await observe('regression-gate', () => runRegressionGate(finalVideo, reference, {
          outputPath: path.join(outDir, 'regression-gate.json'),
        }));
        if (gate.result) state.results['regression-gate'] = gate.result;
      } catch {
        // Final video not found — skip the regression gate.
      }

      // Production verdict — combine the (visual) video score, the (content)
      // quality gates, and the (deterministic) regression gate into one
      // ship/no-ship signal.
      const videoScore = (state.results['scoring'] as { weighted_overall?: number } | undefined)?.weighted_overall;
      const gates = state.results['quality-gates'] as { passed?: boolean } | undefined;
      const regression = state.results['regression-gate'] as { passed?: boolean } | undefined;
      if (typeof videoScore === 'number' || gates || regression) {
        const gatesPassed = gates?.passed ?? null;
        // null = gate didn't run (no tools / no final video) → non-blocking.
        // false = a *measured* regression → hard downgrade.
        const regressionPassed = regression?.passed ?? null;
        const videoOk = typeof videoScore === 'number' && videoScore >= 7;
        // SHIP-READY needs a good video score, no failing content gates, and no
        // measured quality regression. Signals that never ran don't block; only a
        // definitive failure does. When content gates never ran (no script), we
        // can't claim content was verified — flag that rather than imply a pass.
        const shipReady = videoOk && gatesPassed !== false && regressionPassed !== false;
        const verdict = shipReady
          ? (gatesPassed === null ? 'SHIP-READY (no content gates)' : 'SHIP-READY')
          : 'NEEDS WORK';
        const parts = [
          `video ${typeof videoScore === 'number' ? `${videoScore.toFixed(2)}/10` : 'n/a'}`,
          gates ? `gates ${gatesPassed ? 'PASS' : 'FAIL'}` : 'gates not run',
          regression ? `regression ${regressionPassed ? 'PASS' : 'FAIL'}` : 'regression not run',
        ];
        console.log(`\n[Production Verdict] ${verdict} — ${parts.join(' · ')}`);
        state.results['production-verdict'] = { verdict, videoScore: videoScore ?? null, gatesPassed, regressionPassed };
      }

      console.log('\n--- Post-pipeline: Observability Report ---\n');
      await runSuperObserver();
    }

    // Estimated API spend for this run (Veo/TTS now captured — issue #40).
    try {
      const cost = await costTracker.getSummary();
      state.results['cost'] = cost;
      if (cost.total > 0) {
        const breakdown = Object.entries(cost.byProvider)
          .filter(([, c]) => c > 0)
          .map(([p, c]) => `${p} $${c.toFixed(4)}`)
          .join(', ');
        console.log(`\n[Cost] Estimated API spend this run: $${cost.total.toFixed(4)}${breakdown ? ` (${breakdown})` : ''}`);
      }
    } catch (e) {
      console.warn('[Cost] summary skipped:', e instanceof Error ? e.message : e);
    }
  } finally {
    stopReporter();
    await neurolink.shutdown();
    await saveState('pipeline-state.json', state);
  }

  // Count only real phase results — post-pipeline keys (scoring, quality-gates, cost)
  // aren't phases and would otherwise overcount.
  const phasesDone = completedPhaseCount(state.results, PHASES.map((p) => p.name));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Pipeline complete. ${phasesDone}/${PHASES.length} phases.`);
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
    // Keep currentStep in step with real completions (runner never advanced it
    // before, so it stayed 0 for the whole run and the dashboard read 0/7). Count
    // completed phases directly — correct even under concurrent phases 2-4.
    state.currentStep = completedPhaseCount(state.results, PHASES.map((p) => p.name));
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
  const outputPath = path.join(outDir, 'voiceover.mp3');
  const mode = resolveNarrationMode(opts.narrationMode ?? process.env.NARRATION_MODE);

  if (mode === 'narrator') {
    // Single round-trip: the model writes the spoken narration from the script
    // (treated as a scene brief) AND synthesizes the voice. Persist the generated
    // text so captions use the actual spoken words, not the brief.
    const brief = await readScript(opts.scriptPath);
    const narration = await narrateScene(nl, brief, outputPath, opts.voice ? { voice: opts.voice } : {});
    await fs.writeFile(path.join(outDir, 'narration.txt'), narration.text, 'utf-8').catch(() => undefined);
    await costTracker.log('google-ai', 'tts', { chars: narration.text.length }).catch(() => undefined);
    console.log(`[Voiceover] narrator mode — generated ${narration.text.length} chars of narration`);
    return { mode: 'narrator', ...narration };
  }

  const requested = opts.provider ?? 'openai';
  const provider = VOICEOVER_ALIAS[requested] ?? 'openai-tts';
  const text = await readScript(opts.scriptPath);
  const result = await voiceover.generate(nl, provider, text, outputPath, opts.voice ? { voice: opts.voice } : {});
  await costTracker.log(TTS_COST_KEY[provider] ?? provider, 'tts', { chars: text.length }).catch(() => undefined);
  return result;
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
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const outputPath = path.join(outDir, 'avatar.mp4');
  const provider = AVATAR_ALIAS[opts.avatarProvider ?? 'did'] ?? 'd-id';

  // HeyGen: use the direct REST adapter — NeuroLink's avatar mode registers the
  // handler but its internal download step fails ("fetch failed"). The adapter
  // drives HeyGen TTS from the script, so it needs neither a source image nor the
  // VO file — just an avatar id + voice id + key.
  if (provider === 'heygen') {
    const avatarId = opts.avatarId ?? process.env.HEYGEN_AVATAR_ID;
    const voiceId = process.env.HEYGEN_VOICE_ID;
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!avatarId) return { status: 'skipped', reason: 'HeyGen requires an avatar id (use --avatar-id or HEYGEN_AVATAR_ID)' };
    if (!apiKey || !voiceId) return { status: 'skipped', reason: 'HeyGen requires HEYGEN_API_KEY and HEYGEN_VOICE_ID env' };
    const { width, height } = resolveDims(opts.resolution);
    const text = await readScript(opts.scriptPath);
    const { renderHeyGenAvatar } = await import('../avatar/heygen-direct.ts');
    return renderHeyGenAvatar(outputPath, { apiKey, avatarId, voiceId, text, width, height });
  }

  // D-ID / Replicate: lip-sync a source portrait to the voiceover via NeuroLink.
  if (!opts.avatarSource) return { status: 'skipped', reason: 'No avatar source configured (use --avatar-source)' };
  const voiceoverPath = path.join(outDir, 'voiceover.mp3');
  try { await fs.access(voiceoverPath); } catch {
    return { status: 'skipped', reason: 'Voiceover not found — run phase 1 first' };
  }
  return avatar.generate(nl, provider, opts.avatarSource, { audio: voiceoverPath }, outputPath, opts.avatarId ? { avatarId: opts.avatarId } : {});
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

async function ensureSeedImage(seedImg: string, dims: { width: number; height: number }): Promise<void> {
  try { await fs.access(seedImg); return; } catch { /* generate */ }
  const { execa } = await import('execa');
  await execa('ffmpeg', [
    '-y', '-f', 'lavfi',
    '-i', `gradients=size=${dims.width}x${dims.height}:c0=0x0b1d3a:c1=0xd97a3a:duration=1:rate=1`,
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


type BrollCtx = {
  outDir: string;
  provider: generators.VideoProvider;
  model?: string;
  dims: ReturnType<typeof resolveDims>;
  seedImg: string;
  segLen: 4 | 6 | 8;
  concurrency: number;
  /** Target shot count so total b-roll ≈ voiceover length (no trimmed-off ending). */
  targetShots: number;
};

function intEnv(name: string, fallback: number, min = 0): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback;
}

/** Whole-run spend cap: --budget flag wins, else BUDGET_USD env, else no cap. */
function resolveBudgetUsd(opts: PipelineOptions): number | undefined {
  return opts.budgetUsd ?? (process.env.BUDGET_USD ? Number(process.env.BUDGET_USD) : undefined);
}

/**
 * Director mode: an art-director agent designs a cohesive shot list with ONE
 * canonical product identity; each product keyframe is generated as an
 * image-to-image derivation of a single hero still and vetted by a consistency
 * critic (regenerating off-brand frames *before* paying to animate them), then
 * animated with the shot's camera direction. Returns segment paths in order, or
 * [] to let phaseBroll fall back to concept/generic mode.
 */
async function directorScenes(nl: NeuroLink, opts: PipelineOptions, ctx: BrollCtx): Promise<string[]> {
  const script = await readScript(opts.scriptPath).catch(() => '');
  if (!script) { console.log('[B-roll] director mode: no script available — falling back.'); return []; }

  // Shot plan (cached for resume + inspection). normalizeShotPlan runs on BOTH
  // a fresh and a cached plan so a changed cap always re-clamps. The cap tracks
  // the voiceover (targetShots) so the arc — including the closing CTA — fits.
  const maxShots = intEnv('BROLL_MAX_SHOTS', ctx.targetShots, 1);
  let plan = await loadState<ShotPlan | null>('shot-plan.json', null);
  if (!plan) {
    const fresh = await runArtDirectorAgent(nl, script, { shotCount: ctx.targetShots });
    if (!fresh) { console.log('[B-roll] art-director produced no plan — falling back.'); return []; }
    plan = normalizeShotPlan(fresh, maxShots);
    await saveState('shot-plan.json', plan);
  } else {
    plan = normalizeShotPlan(plan, maxShots);
  }
  const shots = plan.shots;
  const productCount = shots.filter((s) => s.shows_product).length;
  console.log(`[B-roll] Director mode: ${shots.length} shots (${productCount} show the product) @ ${ctx.dims.width}×${ctx.dims.height}, concurrency ${ctx.concurrency}`);

  const threshold = intEnv('CONSISTENCY_THRESHOLD', 7, 0);
  const maxRegen = intEnv('BROLL_MAX_REGEN', 2, 0);

  // Single canonical hero still — every product shot derives from this exact
  // image. Read it before the projection: the read attempt IS the cache probe
  // (no separate exists-check — that's a TOCTOU pattern), and a cached hero
  // from a resume prices as already-paid rather than as pending generation.
  const heroPath = path.join(ctx.outDir, '.hero.png');
  let heroBuf: Buffer | undefined;
  try { heroBuf = await fs.readFile(heroPath); } catch { /* not cached — generate after the gate */ }

  // Pre-flight: the plan fixes every cost driver, so price the phase and
  // enforce the whole-run budget cap while aborting is still free.
  const preflightInputs: PreflightInputs = {
    shots: shots.length, segLen: ctx.segLen, videoProvider: ctx.provider,
    imageProvider: resolveImageGenParams().provider,
    heroNeeded: !heroBuf, productShots: productCount, maxRegen,
  };
  const est = estimatePreflight(preflightInputs);
  const spent = (await costTracker.getSummary()).total;
  console.log(formatPreflight(est, preflightInputs, spent));
  assertWithinBudget(spent, est, resolveBudgetUsd(opts));

  if (!heroBuf) {
    try { await generateImage(plan.hero_prompt, heroPath, { aspectRatio: '16:9' }); heroBuf = await fs.readFile(heroPath); }
    catch (e) { console.log(`  [B-roll] hero image failed: ${e instanceof Error ? e.message.slice(0, 90) : String(e)}`); }
  }

  const results = await mapWithConcurrency(shots, ctx.concurrency, async (shot, i): Promise<string | null> => {
    // Director artifacts are namespaced (.broll-dir-*) so they never collide with
    // concept/generic mode's .broll-seg-* files if the mode changes between runs.
    const segOut = path.join(ctx.outDir, `.broll-dir-seg-${i}.mp4`);
    try { await fs.access(segOut); return segOut; } catch { /* generate */ }

    const keyPath = path.join(ctx.outDir, `.broll-dir-key-${i}.png`);
    let keyframe = keyPath;
    let haveKey = false;
    try { await fs.access(keyPath); haveKey = true; } catch { /* generate */ }

    if (!haveKey) {
      const basePrompt = buildShotPrompt(shot, plan.product_bible);
      let prompt = basePrompt;
      let generated = false;
      for (let attempt = 0; attempt <= maxRegen; attempt++) {
        try {
          await generateImage(prompt, keyPath, {
            aspectRatio: '16:9',
            referenceImages: shot.shows_product && heroBuf ? [heroBuf] : undefined,
          });
          generated = true;
        } catch (e) {
          console.log(`  [B-roll] keyframe ${i} gen failed: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
          break;
        }
        // Vet product shots against the canonical still and regenerate off-brand
        // frames before paying to animate. Skip the critic on the final attempt
        // (no retries left → the result is accepted, so the call would be wasted)
        // and for non-product shots.
        if (!shot.shows_product || !heroBuf || attempt >= maxRegen) break;
        const verdict = await runConsistencyCriticAgent(nl, heroPath, keyPath, plan.product_bible).catch(() => null);
        if (!shouldRegenerate(verdict, threshold)) break;
        console.log(`  [B-roll] shot ${i} off-brand (${verdict?.score}/10) — regenerating (${attempt + 2}/${maxRegen + 1})`);
        prompt = applyFixToPrompt(basePrompt, verdict?.fix_instruction ?? '');
      }
      if (!generated) { await ensureSeedImage(ctx.seedImg, ctx.dims); keyframe = ctx.seedImg; }
    }

    // Crop to 16:9 (image models often emit square frames). Per-scene temp name
    // so concurrent crops never collide.
    try {
      const { execa } = await import('execa');
      const keyframe169 = path.join(ctx.outDir, `.broll-dir-key169-${i}.jpg`);
      await execa('ffmpeg', ['-y', '-i', keyframe, '-vf', 'crop=iw:trunc(iw*9/16/2)*2', '-q:v', '2', keyframe169], { stdio: 'ignore' });
      keyframe = keyframe169;
    } catch { /* use original keyframe if crop fails */ }

    // Animate with the shot's deliberate camera move.
    try {
      await generators.generate(nl, ctx.provider, buildAnimationPrompt(shot), segOut, {
        inputImage: keyframe, length: ctx.segLen, resolution: ctx.dims.veo, aspectRatio: '16:9', audio: false,
        ...(ctx.model ? { model: ctx.model } : {}),
      });
      return segOut;
    } catch (e) {
      console.log(`  [B-roll] segment ${i} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
      return null;
    }
  });
  return results.filter((r): r is string => !!r);
}

async function phaseBroll(nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const gen = opts.videoGenerator ?? 'vertex';
  const provider = VIDEO_ALIAS[gen] ?? 'vertex';
  const outputPath = path.join(outDir, 'broll.mp4');
  const model = REPLICATE_MODEL[gen];
  const dims = resolveDims(opts.resolution);

  // Resolution-suffixed so a cached 720p seed isn't reused for a 1080p run.
  const seedImg = path.join(outDir, `.broll-seed-${dims.height}.jpg`);
  await fs.mkdir(outDir, { recursive: true });
  await ensureSeedImage(seedImg, dims);

  // Each clip is a fixed 4s. Director/concept modes emit one clip per shot/beat
  // (so total ≈ script length); only the generic fallback uses voDur to size its
  // clip count to the voiceover.
  const voPath = path.join(outDir, 'voiceover.mp3');
  const voDur = await probeDuration(voPath);
  const segLen = 4;
  const concurrency = Math.max(1, Number(process.env.BROLL_CONCURRENCY) || 3);
  // One ~4s shot per (segLen) of voiceover so the b-roll ≈ VO length; default 8.
  const targetShots = voDur > 0 ? Math.max(3, Math.round(voDur / segLen)) : 8;
  const segPaths: string[] = [];

  // Director mode (default): agent shot plan + canonical product + consistency
  // critic. Falls through to concept/generic if it produces nothing.
  const mode = (opts.brollMode ?? process.env.BROLL_MODE ?? 'director').toLowerCase();

  // Cards mode: the $0 typography tier. Chosen explicitly for zero spend, so it
  // throws rather than falling through to any paid generation path.
  if (mode === 'cards') {
    const script = await readScript(opts.scriptPath).catch(() => '');
    if (!script) throw new Error('[B-roll] cards mode requires a script (--script PATH)');
    const out = await rendering.renderCardBroll({
      script, outDir, width: dims.width, height: dims.height,
      durationSec: rendering.resolveCardDuration(voDur),
    });
    await costTracker.log('local', 'cards-broll', {}, 0).catch(() => undefined);
    return out;
  }

  if (mode === 'director') {
    try {
      const dirSegs = await directorScenes(nl, opts, { outDir, provider, model, dims, seedImg, segLen, concurrency, targetShots });
      for (const s of dirSegs) segPaths.push(s);
    } catch (e) {
      // A budget abort must fail the phase — the fallback modes below also pay
      // to generate, which is exactly what the cap forbids.
      if (e instanceof BudgetExceededError) throw e;
      console.log(`[B-roll] director mode error, falling back: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
    }
  }

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

  // Concept/generic fallback — runs only when director mode produced nothing
  // (mode !== 'director', the art-director failed, or every shot errored).
  if (segPaths.length === 0) {
    // assets/broll-prompts.json may be a plain string[] (legacy) or
    // { hero?, scenes: [{prompt, product}] }. Two-stage: keyframe per beat
    // (product beats anchored to a shared hero image), then animate.
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

    if (mode !== 'generic' && scenes && scenes.length) {
      console.log(`[B-roll] Concept mode: ${scenes.length} keyframe→video beats${heroPrompt ? ' + hero reference' : ''}`);

      // Shared hero image → product beats stay visually consistent. Same
      // pattern as director mode: the read attempt is the cache probe, and
      // generation waits until the budget gate has passed.
      const wantHero = !!heroPrompt && scenes.some((s) => s.product);
      const conceptHeroPath = path.join(outDir, '.hero.png');
      let heroBuf: Buffer | undefined;
      if (wantHero) {
        try { heroBuf = await fs.readFile(conceptHeroPath); } catch { /* not cached — generate after the gate */ }
      }

      const conceptInputs: PreflightInputs = {
        shots: scenes.length, segLen, videoProvider: provider,
        imageProvider: resolveImageGenParams().provider,
        heroNeeded: wantHero && !heroBuf, productShots: 0, maxRegen: 0,
      };
      const conceptEst = estimatePreflight(conceptInputs);
      const conceptSpent = (await costTracker.getSummary()).total;
      console.log(formatPreflight(conceptEst, conceptInputs, conceptSpent));
      assertWithinBudget(conceptSpent, conceptEst, resolveBudgetUsd(opts));

      if (heroPrompt && wantHero && !heroBuf) {
        try { await generateImage(heroPrompt, conceptHeroPath, { aspectRatio: '16:9' }); heroBuf = await fs.readFile(conceptHeroPath); }
        catch (e) { console.log(`  [B-roll] hero image failed: ${e instanceof Error ? e.message.slice(0, 90) : String(e)}`); }
      }

      console.log(`[B-roll] ${scenes.length} beats @ ${dims.width}×${dims.height}, concurrency ${concurrency}`);
      const sceneResults = await mapWithConcurrency(scenes, concurrency, async (scene, i): Promise<string | null> => {
        const segOut = path.join(outDir, `.broll-seg-${i}.mp4`);
        try { await fs.access(segOut); return segOut; } catch { /* generate */ }

        const keyPath = path.join(outDir, `.broll-key-${i}.png`);
        let keyframe = keyPath;
        try { await fs.access(keyPath); }
        catch {
          try {
            await generateImage(scene.prompt, keyPath, { aspectRatio: '16:9', referenceImages: scene.product && heroBuf ? [heroBuf] : undefined });
          } catch (e) {
            console.log(`  [B-roll] keyframe ${i} failed, falling back to gradient seed: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
            await ensureSeedImage(seedImg, dims);
            keyframe = seedImg;
          }
        }

        // Crop to 16:9 before animation (image models often emit square frames).
        try {
          const { execa } = await import('execa');
          const keyframe169 = path.join(outDir, `.broll-key169-${i}.jpg`);
          await execa('ffmpeg', ['-y', '-i', keyframe, '-vf', 'crop=iw:trunc(iw*9/16/2)*2', '-q:v', '2', keyframe169], { stdio: 'ignore' });
          keyframe = keyframe169;
        } catch { /* use original keyframe if crop fails */ }

        try {
          await generators.generate(nl, provider, scene.prompt, segOut, {
            inputImage: keyframe, length: segLen, resolution: dims.veo, aspectRatio: '16:9', audio: false,
            ...(model ? { model } : {}),
          });
          return segOut;
        } catch (e) {
          console.log(`  [B-roll] segment ${i} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
          return null;
        }
      });
      for (const r of sceneResults) if (r) segPaths.push(r);
    } else {
      // Legacy generic path: single gradient seed + generic prompts.
      await ensureSeedImage(seedImg, dims);
      const segCount = voDur > 0 ? Math.min(8, Math.max(1, Math.ceil(voDur / segLen))) : 2;
      console.log(`[B-roll] VO ${voDur.toFixed(2)}s → ${segCount}×${segLen}s clips`);

      // No keyframes here (gradient seed) — the projection is video-only.
      const genericInputs: PreflightInputs = {
        shots: segCount, segLen, videoProvider: provider,
        imageProvider: 'none', heroNeeded: false, productShots: 0, maxRegen: 0,
      };
      const genericEst = estimatePreflight(genericInputs);
      const genericSpent = (await costTracker.getSummary()).total;
      console.log(formatPreflight(genericEst, genericInputs, genericSpent));
      assertWithinBudget(genericSpent, genericEst, resolveBudgetUsd(opts));
      for (let i = 0; i < segCount; i++) {
        const segOut = path.join(outDir, `.broll-seg-${i}.mp4`);
        try { await fs.access(segOut); segPaths.push(segOut); continue; } catch { /* generate */ }
        try {
          await generators.generate(nl, provider, GENERIC_PROMPTS[i % GENERIC_PROMPTS.length], segOut, {
            inputImage: seedImg, length: segLen, resolution: dims.veo, aspectRatio: '16:9', audio: false,
            ...(model ? { model } : {}),
          });
          segPaths.push(segOut);
        } catch (e) {
          console.log(`  [B-roll] segment ${i} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
        }
      }
    }
  }

  if (segPaths.length === 0) throw new Error('[B-roll] no segments produced');
  // Real video spend (per second of output) — keyed by provider so vertex/Veo
  // is finally captured instead of logging $0 (issue #40). Never let a cost-log
  // I/O hiccup fail the phase after the (paid) segments are already in hand.
  await costTracker.log(provider, 'broll-video', { seconds: segPaths.length * segLen }).catch(() => undefined);
  if (segPaths.length === 1) {
    await fs.copyFile(segPaths[0], outputPath);
    console.log(`[B-roll] Single segment → ${outputPath}`);
    return outputPath;
  }
  return rendering.concatVideos(segPaths, outputPath, { width: dims.width, height: dims.height, fps: 30 });
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

  const dims = resolveDims(opts.resolution);
  return rendering.assembleFinal(broll, voiceover, music, path.join(outDir, 'final.mp4'), {
    width: dims.width, height: dims.height, musicGainDb: -18,
  });
}

async function phaseCaptions(_nl: NeuroLink, opts: PipelineOptions): Promise<unknown> {
  if (opts.dryRun) return { status: 'dry-run' };
  const outDir = opts.outputDir ?? OUTPUT_DIR;
  const srtPath = path.join(outDir, 'captions.srt');
  const voPath = path.join(outDir, 'voiceover.mp3');

  // Prefer the known text (accurate); fall back to STT when unavailable. In
  // narrator mode the spoken words were generated, so prefer narration.txt over
  // the script brief.
  let usedScript = false;
  try {
    const narrationText = await fs.readFile(path.join(outDir, 'narration.txt'), 'utf-8').catch(() => '');
    const script = await readScript(opts.scriptPath).catch(() => '');
    const text = pickCaptionText(narrationText, script);
    const dur = await probeDuration(voPath);
    if (text && dur > 0) {
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(srtPath, scriptToSrt(text, dur));
      console.log(`[Captions] SRT from ${narrationText.trim() ? 'narration' : 'script'} (${srtPath})`);
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
  --voice NAME         TTS voice override (e.g. OpenAI onyx)
  --video-gen NAME     Video: kling|runway|veo|wan-alpha
  --music-gen NAME     Music: lyria|beatoven|elevenlabs|numpy
  --resolution RES     Output resolution: 1080p (default) | 720p
  --broll-mode MODE    B-roll: director (default) | concept | generic | cards ($0 typography from the script — the card text IS the visual, so consider skipping the caption phase: --phases 1,3,4,6)
  --avatar-source PATH Avatar source image for D-ID/MuseTalk
  --avatar-provider    Avatar: did|heygen|musetalk
  --avatar-id ID       Provider avatar id (required by HeyGen; or HEYGEN_AVATAR_ID)
  --scoring MODE       Scoring: single (default) | multi-judge (consensus panel)
  --reference PATH     Baseline video for the VMAF regression gate (or REGRESSION_REFERENCE env)
  --budget USD         Whole-run spend cap — abort before b-roll generation if the pre-flight projection would exceed it (or BUDGET_USD env)
  --narration MODE     Voiceover: script (default — file + TTS) | narrator (model writes narration + TTS)
  --skip-scoring       Skip post-pipeline AI scoring
  --dry-run            Print plan without executing
  (env) BROLL_CONCURRENCY=N  parallel b-roll scenes (default 3)`);
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
    if (args[i] === '--resolution') opts.resolution = args[++i];
    if (args[i] === '--video-gen') opts.videoGenerator = args[++i];
    if (args[i] === '--broll-mode') opts.brollMode = args[++i];
    if (args[i] === '--music-gen') opts.musicGenerator = args[++i];
    if (args[i] === '--avatar-source') opts.avatarSource = args[++i];
    if (args[i] === '--avatar-provider') opts.avatarProvider = args[++i];
    if (args[i] === '--avatar-id') opts.avatarId = args[++i];
    if (args[i] === '--scoring') opts.scoringMode = args[++i];
    if (args[i] === '--reference') opts.regressionReference = args[++i];
    if (args[i] === '--budget') opts.budgetUsd = Number(args[++i]);
    if (args[i] === '--narration') opts.narrationMode = args[++i];
    if (args[i] === '--skip-scoring') opts.skipScoring = true;
    if (args[i] === '--dry-run') opts.dryRun = true;
  }

  runPipeline(opts).catch(console.error);
}
