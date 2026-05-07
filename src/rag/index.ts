/**
 * Brand-voice RAG via `NeuroLink.generate({rag: {files}})`.
 *
 * NeuroLink loads the listed markdown files, chunks them, embeds, and exposes
 * a search tool the model invokes during generation. We just hand it the
 * docs and the user's query; everything else (chunking, retrieval, reranking)
 * is internal.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { BrandVoiceRAG } from '../types/index.ts';

export type { BrandVoiceRAG } from '../types/index.ts';

export async function buildBrandVoiceRAG(
  nl: NeuroLink,
  docsDir = 'docs',
): Promise<BrandVoiceRAG> {
  const entries = await fs.readdir(docsDir).catch(() => [] as string[]);
  const files = entries.filter((e) => e.endsWith('.md')).map((e) => path.join(docsDir, e));
  return {
    files,
    async ask(query, options = {}) {
      if (!files.length) return '';
      const r = await nl.generate({
        input: { text: query },
        rag: {
          files,
          strategy: 'markdown',
          chunkSize: 512,
          topK: options.topK ?? 5,
        },
      });
      return r.content ?? '';
    },
  };
}
