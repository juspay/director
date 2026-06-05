/**
 * SceneAnalyzerAgent — analyzes individual rendered scenes for quality issues.
 * Pattern A: file + schema.
 */

import type { NeuroLink } from '@juspay/neurolink';
import path from 'path';
import { SceneAnalysisSchema, type SceneAnalysis } from '../schemas/scene-analysis.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

const SCENE_ANALYSIS_PROMPT = `You are a motion graphics quality inspector. Analyze this video scene for:

1. Temporal quality — any flickering, frame drops, or temporal artifacts
2. Motion smoothness — spring animations feel natural, no jank
3. Composition — visual balance, hierarchy, spacing
4. Color consistency — palette matches the design system
5. Typography — font rendering, readability, hierarchy

Flag any visual artifacts with their type, severity, and approximate timestamp.
Rate each dimension 0-10 and determine if the scene passes production quality bar (7+ on all dimensions).`;

export async function runSceneAnalyzerAgent(
  neurolink: NeuroLink,
  videoPath: string,
  sceneId: string,
): Promise<SceneAnalysis | null> {
  console.log(`[SceneAnalyzer] Analyzing ${sceneId}: ${path.basename(videoPath)}`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `${SCENE_ANALYSIS_PROMPT}\n\nScene ID: ${sceneId}`,
        files: [path.resolve(videoPath)],
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: CONFIG.MODEL,
      schema: SceneAnalysisSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 4096,
      timeout: '120s',
    });

    return SceneAnalysisSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[SceneAnalyzer] Failed for ${sceneId}: ${result.error}`);
    return null;
  }

  const a = result.value;
  const status = a.pass ? 'PASS' : 'FAIL';
  console.log(`[SceneAnalyzer] ${sceneId}: ${status} | Artifacts: ${a.artifacts.length} | Motion: ${a.motion_smoothness}/10`);
  return a;
}

// CLI: npm run analyze -- <video.mp4> [sceneId]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [videoPath, sceneId] = process.argv.slice(2);
  if (!videoPath) {
    console.error('Usage: npm run analyze -- <video.mp4> [sceneId]');
    process.exit(1);
  }
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const analysis = await runSceneAnalyzerAgent(nl, videoPath, sceneId ?? 'scene-1');
    if (!analysis) process.exit(1);
    console.log(JSON.stringify(analysis, null, 2));
  } finally {
    await nl.shutdown();
  }
}
