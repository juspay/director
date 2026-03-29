/**
 * Voiceover optimizer — parameter search over TTS providers.
 * Calls Python librosa via subprocess for spectral analysis.
 * Resume-safe JSON persistence.
 */
import fs from 'fs/promises';
import path from 'path';
import * as elevenlabs from './elevenlabs.ts';
import { analyzeAudio } from '../scripts/python-bridge.ts';
import { sleep } from '../utils/rate-limit.ts';
import { loadState, saveState } from '../pipeline/state.ts';

interface TrialResult {
  id: string;
  params: { stability: number; similarityBoost: number; style: number };
  score: number;
  audioPath: string;
  timestamp: string;
}

interface OptimizerState {
  trials: TrialResult[];
  bestScore: number;
  bestId: string;
}

const PARAM_BOUNDS = {
  stability: [0.30, 0.70] as [number, number],
  similarityBoost: [0.65, 0.90] as [number, number],
  style: [0.20, 0.60] as [number, number],
};

export async function runOptimization(
  narrationText: string,
  outputDir: string,
  options: { nTrials?: number; strategy?: 'random' | 'grid' } = {},
): Promise<OptimizerState> {
  const nTrials = options.nTrials ?? 15;
  const state = await loadState<OptimizerState>('optimizer-state.json', {
    trials: [], bestScore: 0, bestId: '',
  });

  console.log(`[Optimizer] Starting. ${state.trials.length} existing trials, target: ${nTrials}`);
  await fs.mkdir(outputDir, { recursive: true });

  for (let i = state.trials.length; i < nTrials; i++) {
    const params = sampleParams(i, state.trials);
    const id = `trial_${String(i).padStart(3, '0')}`;
    const audioPath = path.join(outputDir, `${id}.mp3`);

    console.log(`[Optimizer] Trial ${i + 1}/${nTrials}: stability=${params.stability.toFixed(3)} similarity=${params.similarityBoost.toFixed(3)} style=${params.style.toFixed(3)}`);

    try {
      // Generate voiceover
      await elevenlabs.generate(narrationText, audioPath, {
        stability: params.stability,
        similarityBoost: params.similarityBoost,
        style: params.style,
      });

      // Score via Python librosa
      const analysis = await analyzeAudio(audioPath);
      const score = analysis.composite_score ?? analysis.overall ?? 5.0;

      const trial: TrialResult = {
        id, params, score, audioPath,
        timestamp: new Date().toISOString(),
      };

      state.trials.push(trial);
      if (score > state.bestScore) {
        state.bestScore = score;
        state.bestId = id;
        console.log(`  *** NEW BEST: ${id} @ ${score.toFixed(3)} ***`);
      }

      // Save after each trial (resume-safe)
      await saveState('optimizer-state.json', state);
    } catch (err) {
      console.error(`  Trial ${id} failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    await sleep(2000);
  }

  console.log(`\n[Optimizer] Best: ${state.bestId} @ ${state.bestScore.toFixed(3)}`);
  return state;
}

function sampleParams(index: number, history: TrialResult[]): { stability: number; similarityBoost: number; style: number } {
  if (history.length < 3 || index % 5 === 4) {
    // Random exploration
    return {
      stability: randomInRange(...PARAM_BOUNDS.stability),
      similarityBoost: randomInRange(...PARAM_BOUNDS.similarityBoost),
      style: randomInRange(...PARAM_BOUNDS.style),
    };
  }

  // Perturb best
  const best = history.reduce((a, b) => (a.score > b.score ? a : b));
  const magnitude = index % 5 < 2 ? 0.02 : 0.05;
  return {
    stability: clamp(best.params.stability + (Math.random() - 0.5) * magnitude * 2, ...PARAM_BOUNDS.stability),
    similarityBoost: clamp(best.params.similarityBoost + (Math.random() - 0.5) * magnitude * 2, ...PARAM_BOUNDS.similarityBoost),
    style: clamp(best.params.style + (Math.random() - 0.5) * magnitude * 2, ...PARAM_BOUNDS.style),
  };
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
