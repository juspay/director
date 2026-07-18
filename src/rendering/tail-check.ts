/**
 * Deterministic CTA-tail check — the model-free half of the fidelity gate.
 * The tail wrap-around (#109) shipped in BOTH observed finals and was missed
 * by the AI judge at 0.9 confidence AND by human review; this makes that class
 * of corruption mechanically detectable: the deliverable's final frame must
 * match its intended source — the configured end-card, else the b-roll's own
 * closing frame.
 */
import { execa } from 'execa';

/**
 * Mean absolute pixel difference between two equal-length grayscale buffers,
 * normalized to 0-1. Pure — exported for tests.
 */
export function frameDiffScore(a: Buffer, b: Buffer): number {
  if (a.length === 0 || a.length !== b.length) {
    throw new Error(`frameDiffScore: buffers must be equal-length and non-empty (${a.length} vs ${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  return sum / a.length / 255;
}

// Compare only the top 70% of the frame: the caption band burned into the
// deliverable (but absent from the b-roll / end-card source) lives in the
// bottom strip and would otherwise register as a false mismatch.
const GRAY_CHAIN = 'crop=iw:ih*0.7:0:0,scale=64:64,format=gray';

const FRAME_BYTES = 64 * 64;

/**
 * The video's literal final frame: decode the last second and keep the last
 * raw frame. A single `-sseof -0.3 -frames:v 1` grab lands on the first frame
 * after a keyframe seek and can sit just BEFORE a sub-second tail corruption —
 * calibration showed exactly that on the hero cut's 0.27s wrap.
 */
async function lastVideoFrame(videoPath: string): Promise<Buffer> {
  const { stdout } = await execa('ffmpeg', ['-v', 'error', '-sseof', '-1', '-i', videoPath, '-vf', GRAY_CHAIN, '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  const buf = Buffer.from(stdout);
  if (buf.length < FRAME_BYTES) throw new Error(`tail-check: decoded no frames from the last second of ${videoPath}`);
  return buf.subarray(buf.length - FRAME_BYTES);
}

async function imageFrame(imagePath: string): Promise<Buffer> {
  const { stdout } = await execa('ffmpeg', ['-v', 'error', '-i', imagePath, '-vf', GRAY_CHAIN, '-frames:v', '1', '-f', 'rawvideo', '-'], { encoding: 'buffer' });
  return Buffer.from(stdout);
}

/**
 * Extract the video's literal final frame as a full-color PNG (same last-frame
 * discipline as the gray path above). The fidelity judge attaches this beside
 * the video: video ingestion samples frames sparsely and provably misses a 2s
 * end-card — calibration showed the judge claiming "no logo, ends on a phone"
 * on a video whose final frame is a branded end-card.
 */
export async function extractLastFramePng(videoPath: string, outPath: string): Promise<string> {
  await execa('ffmpeg', ['-y', '-v', 'error', '-sseof', '-1', '-i', videoPath, '-vf', 'reverse', '-frames:v', '1', outPath]);
  return outPath;
}

export type TailCheck = { passed: boolean; score: number; reference: 'end-card' | 'broll' };

/**
 * Does the finished video's final frame match what should be there? With a
 * brand end-card configured, that's the end-card; otherwise the b-roll's own
 * closing frame (which #109 guarantees the assembler holds, never wraps).
 * The 0.12 threshold sits far above re-encode noise (measured ~0.0-0.03 on
 * identical content) and far below a wrong-shot mismatch (~0.2+).
 */
export async function runTailCheck(
  finalPath: string,
  brollPath: string,
  endCardPath?: string,
  threshold = 0.12,
): Promise<TailCheck> {
  const reference: TailCheck['reference'] = endCardPath ? 'end-card' : 'broll';
  const [finalLast, expected] = await Promise.all([
    lastVideoFrame(finalPath),
    endCardPath ? imageFrame(endCardPath) : lastVideoFrame(brollPath),
  ]);
  const score = frameDiffScore(finalLast, expected);
  return { passed: score <= threshold, score, reference };
}
