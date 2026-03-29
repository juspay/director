/**
 * Edge-TTS provider — free Microsoft Neural TTS via subprocess.
 * Replaces Python edgetts_stitcher.py.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_VOICE = 'en-IN-NeerjaNeural';

export interface Segment {
  text: string;
  rate?: string;   // e.g., "+5%" or "-10%"
  pitch?: string;  // e.g., "+2st"
}

export async function generate(
  text: string,
  outputPath: string,
  options: { voice?: string; rate?: string } = {},
): Promise<string> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const voice = options.voice ?? DEFAULT_VOICE;

  const args = ['--voice', voice, '--text', text, '--write-media', outputPath];
  if (options.rate) args.push('--rate', options.rate);

  await execa('edge-tts', args);
  console.log(`[Edge-TTS] Saved: ${outputPath}`);
  return outputPath;
}

export async function generateSegmented(
  segments: Segment[],
  outputPath: string,
  options: { voice?: string } = {},
): Promise<string> {
  const voice = options.voice ?? DEFAULT_VOICE;
  const tmpDir = path.join(path.dirname(outputPath), '.edgetts-tmp');
  await fs.mkdir(tmpDir, { recursive: true });

  const segmentPaths: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segPath = path.join(tmpDir, `seg_${String(i).padStart(3, '0')}.mp3`);
    const args = ['--voice', voice, '--text', seg.text, '--write-media', segPath];
    if (seg.rate) args.push('--rate', seg.rate);
    if (seg.pitch) args.push('--pitch', seg.pitch);

    await execa('edge-tts', args);
    segmentPaths.push(segPath);
  }

  // Concatenate with ffmpeg
  const listFile = path.join(tmpDir, 'concat.txt');
  const listContent = segmentPaths.map((p) => `file '${p}'`).join('\n');
  await fs.writeFile(listFile, listContent);

  await execa('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outputPath]);

  // Cleanup
  await fs.rm(tmpDir, { recursive: true, force: true });
  console.log(`[Edge-TTS] Stitched ${segments.length} segments: ${outputPath}`);
  return outputPath;
}
