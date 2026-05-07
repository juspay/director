/**
 * Companion PPT generation via NeuroLink's `generate({output:{mode:"ppt"}})`.
 * Useful for shipping a sales-deck alongside the video.
 */
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { PptOptions, PptResult } from '../types/index.ts';

export type { PptOptions, PptResult } from '../types/index.ts';

export async function generatePpt(
  neurolink: NeuroLink,
  scriptOrTopic: string,
  outputPath: string,
  options: PptOptions = {},
): Promise<PptResult> {
  const result = await neurolink.generate({
    input: { text: scriptOrTopic },
    provider: process.env.AGENT_PROVIDER ?? 'vertex',
    model: process.env.MODEL ?? 'gemini-2.5-flash',
    output: {
      mode: 'ppt',
      ppt: {
        pages: options.pages ?? 8,
        theme: options.theme,
        audience: options.audience,
        tone: options.tone,
        generateAIImages: options.generateAIImages ?? false,
        aspectRatio: options.aspectRatio ?? '16:9',
        outputPath,
      },
    },
    timeout: '300s',
  } as Parameters<NeuroLink['generate']>[0]);

  const r = result as unknown as { ppt?: { filePath?: string; totalSlides?: number } };
  if (!r.ppt?.filePath) {
    throw new Error('No ppt in generate response — check NeuroLink version and provider support for ppt mode');
  }
  return {
    filePath: path.resolve(r.ppt.filePath),
    totalSlides: r.ppt.totalSlides,
  };
}
