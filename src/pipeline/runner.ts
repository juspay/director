/**
 * Pipeline runner — orchestrates all Neurolink agents sequentially.
 * Matches dopamine's runner.ts pattern: single NeuroLink instance,
 * step-by-step execution with resume support.
 */
import { NeuroLink } from '@juspay/neurolink';
import fs from 'fs/promises';
import path from 'path';
import { CONFIG, LIBRARY_DIR, OUTPUT_DIR } from './config.ts';
import { loadState, saveState } from './state.ts';
import {
  runVideoScorerAgent,
  runScriptScorerAgent,
  runSceneAnalyzerAgent,
  runCreativeDirectorAgent,
  runAcousticAnalyzerAgent,
} from '../agents/index.ts';
import type { PipelineState } from '../types/index.ts';

const STEPS = [
  { name: 'creative_direction', label: 'Creative Direction', fn: stepCreativeDirection },
  { name: 'script_scoring', label: 'Script Scoring', fn: stepScriptScoring },
  { name: 'video_scoring', label: 'Video Scoring', fn: stepVideoScoring },
  { name: 'scene_analysis', label: 'Scene Analysis', fn: stepSceneAnalysis },
  { name: 'acoustic_analysis', label: 'Acoustic Analysis', fn: stepAcousticAnalysis },
] as const;

export async function runPipeline(options: {
  startStep?: number;
  endStep?: number;
  videoPath?: string;
  scriptPath?: string;
  audioPath?: string;
}): Promise<PipelineState> {
  const neurolink = new NeuroLink();
  const startStep = options.startStep ?? 1;
  const endStep = options.endStep ?? STEPS.length;

  const state = await loadState<PipelineState>('pipeline-state.json', {
    currentStep: 0,
    totalSteps: STEPS.length,
    results: {},
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Director AI Pipeline — Steps ${startStep} to ${endStep}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    for (let i = startStep - 1; i < Math.min(endStep, STEPS.length); i++) {
      const step = STEPS[i];
      state.currentStep = i + 1;
      state.updatedAt = new Date().toISOString();

      console.log(`\n--- Step ${i + 1}/${STEPS.length}: ${step.label} ---\n`);

      try {
        const result = await step.fn(neurolink, options);
        state.results[step.name] = result;
        console.log(`  Step ${i + 1} complete.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        state.errors.push(`Step ${i + 1} (${step.name}): ${msg}`);
        console.error(`  Step ${i + 1} FAILED: ${msg}`);
      }

      await saveState('pipeline-state.json', state);
    }
  } finally {
    await neurolink.shutdown();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Pipeline complete. ${Object.keys(state.results).length}/${STEPS.length} steps succeeded.`);
  if (state.errors.length > 0) {
    console.log(`  ${state.errors.length} errors occurred.`);
  }
  console.log(`${'='.repeat(60)}\n`);

  return state;
}

// Step implementations

async function stepCreativeDirection(neurolink: NeuroLink, opts: Record<string, unknown>) {
  const scriptPath = opts.scriptPath as string | undefined;
  if (!scriptPath) {
    console.log('  [skip] No script path provided');
    return null;
  }
  const script = await fs.readFile(scriptPath, 'utf-8');
  return runCreativeDirectorAgent(neurolink, script);
}

async function stepScriptScoring(neurolink: NeuroLink, opts: Record<string, unknown>) {
  const scriptPath = opts.scriptPath as string | undefined;
  if (!scriptPath) {
    console.log('  [skip] No script path provided');
    return null;
  }
  const script = await fs.readFile(scriptPath, 'utf-8');
  return runScriptScorerAgent(neurolink, script);
}

async function stepVideoScoring(neurolink: NeuroLink, opts: Record<string, unknown>) {
  const videoPath = opts.videoPath as string | undefined;
  if (!videoPath) {
    console.log('  [skip] No video path provided');
    return null;
  }
  return runVideoScorerAgent(neurolink, videoPath, 'dev');
}

async function stepSceneAnalysis(neurolink: NeuroLink, opts: Record<string, unknown>) {
  const videoPath = opts.videoPath as string | undefined;
  if (!videoPath) {
    console.log('  [skip] No video path provided');
    return null;
  }
  return runSceneAnalyzerAgent(neurolink, videoPath, 'full_video');
}

async function stepAcousticAnalysis(neurolink: NeuroLink, opts: Record<string, unknown>) {
  const audioPath = opts.audioPath as string | undefined;
  if (!audioPath) {
    console.log('  [skip] No audio path provided');
    return null;
  }
  return runAcousticAnalyzerAgent(neurolink, audioPath);
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    opts[args[i].replace('--', '')] = args[i + 1];
  }

  runPipeline({
    startStep: opts.start ? parseInt(opts.start) : undefined,
    endStep: opts.end ? parseInt(opts.end) : undefined,
    videoPath: opts.video,
    scriptPath: opts.script,
    audioPath: opts.audio,
  }).catch(console.error);
}
