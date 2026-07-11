/**
 * Stock-footage b-roll retrieval (Pexels Videos API).
 *
 * The $0-API middle tier between cards (typography) and director (generated):
 * real footage, no generation spend — only a free Pexels key. Search queries
 * are derived from the narration script so clips track the story beat order,
 * mirroring the retrieval pattern the faceless-shortform ecosystem converged on.
 */
import fs from 'fs/promises';

export type StockVideoFile = {
  link: string;
  width: number;
  height: number;
  file_type: string;
};

export type StockClip = {
  id: number;
  duration: number;
  video_files: StockVideoFile[];
};

const PEXELS_SEARCH_URL = 'https://api.pexels.com/videos/search';

// Rotated when the script is missing or a chunk yields no usable keywords.
export const FALLBACK_QUERIES: readonly string[] = [
  'technology abstract background',
  'team working office',
  'city timelapse night',
  'hands typing laptop',
  'data network visualization',
  'creative studio workspace',
  'people collaborating whiteboard',
  'modern architecture motion',
];

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has',
  'have', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'like', 'more', 'most',
  'no', 'not', 'now', 'of', 'on', 'or', 'our', 'out', 'so', 'that', 'the',
  'their', 'them', 'then', 'there', 'they', 'this', 'to', 'up', 'was', 'we',
  'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with', 'you',
  'your', 'can', 'get', 'about', 'all', 'also', 'any', 'because', 'been',
  'do', 'does', 'how', 'i', 'me', 'my', 'new', 'one', 'only', 'other', 'over',
  'than', 'too', 'us', 'use', 'very', 'why', 'would',
]);

/**
 * Derive one search query per b-roll segment from the narration script.
 * Pure and deterministic: the script is split into `count` word chunks in
 * story order, and each chunk contributes its first few salient keywords.
 * Chunks with nothing usable fall back to the generic rotation so the
 * result always has exactly `count` entries.
 */
export function scriptToQueries(script: string, count: number): string[] {
  const n = Math.max(1, count);
  const words = script
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const chunkSize = Math.max(1, Math.ceil(words.length / n));
  const queries: string[] = [];
  for (let i = 0; i < n; i++) {
    const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize);
    const keywords: string[] = [];
    for (const w of chunk) {
      if (w.length < 3 || STOPWORDS.has(w) || keywords.includes(w)) continue;
      keywords.push(w);
      if (keywords.length === 3) break;
    }
    queries.push(keywords.length > 0 ? keywords.join(' ') : FALLBACK_QUERIES[i % FALLBACK_QUERIES.length]);
  }
  return queries;
}

/**
 * Choose the best downloadable file across a search result page: the first
 * clip long enough for the segment, and within it the smallest mp4 that
 * still covers the target width (avoids pulling 4K masters for a 720p run).
 * Falls back to the widest mp4 anywhere in the results.
 */
export function pickClipFile(
  clips: readonly StockClip[],
  targetWidth: number,
  minDurationSec: number,
): StockVideoFile | null {
  const candidates = (clip: StockClip): StockVideoFile[] =>
    clip.video_files
      .filter((f) => f.file_type === 'video/mp4' && f.width > 0)
      .sort((a, b) => a.width - b.width);

  for (const clip of clips) {
    if (clip.duration < minDurationSec) continue;
    const files = candidates(clip);
    const covering = files.find((f) => f.width >= targetWidth);
    if (covering) return covering;
    if (files.length > 0) return files[files.length - 1];
  }
  let widest: StockVideoFile | null = null;
  for (const clip of clips) {
    for (const f of candidates(clip)) {
      if (!widest || f.width > widest.width) widest = f;
    }
  }
  return widest;
}

export async function searchStockClips(
  query: string,
  apiKey: string,
  opts?: { perPage?: number },
): Promise<StockClip[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(opts?.perPage ?? 5),
    orientation: 'landscape',
  });
  const res = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) throw new Error(`Pexels search failed for "${query}": HTTP ${res.status}`);
  const body: unknown = await res.json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { videos?: unknown }).videos)) return [];
  return (body as { videos: StockClip[] }).videos.filter(
    (v) => typeof v.duration === 'number' && Array.isArray(v.video_files),
  );
}

export async function downloadStockClip(url: string, dest: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stock clip download failed: HTTP ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}
