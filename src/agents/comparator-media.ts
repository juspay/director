/**
 * Media normalization for A/B video comparison (W-COMP-FIDELITY).
 *
 * The comparator's first live cross-tier verdict was overturned on human
 * review: it picked the 1080p draft over the 720p hero baseline at 0.9
 * confidence, with both winning dimensions driven purely by resolution.
 * Judges must never see a resolution delta — when the two inputs differ,
 * the larger one is downscaled to the smaller one's dimensions so every
 * visible difference is about content, not delivery specs.
 *
 * @module agents/comparator-media
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export type VideoDims = { width: number; height: number };

/**
 * Target dimensions for a matched-resolution comparison: null when the pair
 * already matches (no work), otherwise the smaller video's dimensions
 * (smaller by height, then width — downscaling loses less than upscaling
 * invents).
 */
export function pickTargetDims(a: VideoDims, b: VideoDims): VideoDims | null {
  if (a.width === b.width && a.height === b.height) return null;
  if (a.height !== b.height) return a.height < b.height ? a : b;
  return a.width < b.width ? a : b;
}

export async function probeVideoDims(file: string): Promise<VideoDims> {
  const { execa } = await import('execa');
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file,
  ]);
  const [width, height] = stdout.trim().split(',').map(Number);
  if (!width || !height) throw new Error(`[Comparator] could not probe dimensions of ${file}`);
  return { width, height };
}

export type NormalizedPair = {
  pathA: string;
  pathB: string;
  normalized: boolean;
  cleanup: () => Promise<void>;
};

/**
 * Return comparison-ready paths for the pair: the originals when their
 * dimensions already match, otherwise with the larger video downscaled to
 * the smaller's dimensions in a temp dir. Callers must await `cleanup()`.
 */
export async function normalizeToMatchedResolution(
  videoA: string,
  videoB: string,
): Promise<NormalizedPair> {
  const [dimsA, dimsB] = await Promise.all([probeVideoDims(videoA), probeVideoDims(videoB)]);
  const target = pickTargetDims(dimsA, dimsB);
  if (!target) {
    return { pathA: videoA, pathB: videoB, normalized: false, cleanup: async () => undefined };
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compare-norm-'));
  const { execa } = await import('execa');
  const scale = async (src: string, dims: VideoDims, out: string): Promise<string> => {
    if (dims.width === target.width && dims.height === target.height) return src;
    await execa('ffmpeg', [
      '-y', '-i', src,
      '-vf', `scale=${target.width}:${target.height}:flags=lanczos`,
      '-c:a', 'copy', out,
    ], { stdio: 'ignore' });
    return out;
  };

  console.log(
    `[Comparator] resolution mismatch (${dimsA.width}x${dimsA.height} vs ${dimsB.width}x${dimsB.height}) — normalizing both to ${target.width}x${target.height}`,
  );
  const pathA = await scale(videoA, dimsA, path.join(tmpDir, 'a.mp4'));
  const pathB = await scale(videoB, dimsB, path.join(tmpDir, 'b.mp4'));
  return {
    pathA,
    pathB,
    normalized: true,
    cleanup: () => fs.rm(tmpDir, { recursive: true, force: true }),
  };
}
