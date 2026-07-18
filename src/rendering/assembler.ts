/**
 * FFmpeg assembler — wraps FFmpeg CLI via execa.
 * Replaces Python assembler.py.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { getPreset } from './presets.ts';

export async function assemble(
  videoInput: string,
  audioInput: string,
  outputPath: string,
  preset: string = 'final',
): Promise<string> {
  const p = getPreset(preset);
  const args = [
    '-y', '-i', videoInput, '-i', audioInput,
    '-map', '0:v', '-map', '1:a',
    ...p.videoArgs(), ...p.audioArgs(),
    '-movflags', '+faststart', outputPath,
  ];

  console.log(`[Assembler] ${preset}: ${path.basename(videoInput)} + ${path.basename(audioInput)}`);
  await execa('ffmpeg', args);
  console.log(`[Assembler] Output: ${outputPath}`);
  return outputPath;
}

export async function concatVideos(
  inputs: string[],
  outputPath: string,
  options: { width?: number; height?: number; fps?: number } = {},
): Promise<string> {
  if (inputs.length === 0) throw new Error('[Assembler] concatVideos: no inputs');
  const w = options.width ?? 1280;
  const h = options.height ?? 720;
  const fps = options.fps ?? 30;

  const inputArgs = inputs.flatMap(i => ['-i', i]);
  // Crop-fill (not letterbox): scale up to cover the frame, then center-crop.
  // Keeps the output edge-to-edge 16:9 even when source clips are square
  // (e.g. image-to-video from a 1:1 keyframe that the model pillarboxed).
  const normFilters = inputs.map((_, i) =>
    `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps}[v${i}]`,
  );
  const concatInputs = inputs.map((_, i) => `[v${i}]`).join('');
  const filter = `${normFilters.join(';')};${concatInputs}concat=n=${inputs.length}:v=1:a=0[outv]`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await execa('ffmpeg', [
    '-y', ...inputArgs,
    '-filter_complex', filter,
    '-map', '[outv]',
    '-c:v', 'libx264', '-crf', '20', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-an',
    outputPath,
  ]);
  console.log(`[Assembler] Concat → ${outputPath} (${inputs.length} clips @ ${w}×${h})`);
  return outputPath;
}

// Neutral filmic grade applied across the whole cut so disparate shots (moody
// lifestyle + cleaner product) read as one film. A gentle S-curve + mild contrast/
// saturation, no colour cast — keeps the titanium product its true silver.
const CINEMATIC_GRADE =
  "eq=contrast=1.06:saturation=1.10:brightness=0.005,curves=all='0/0.02 0.25/0.22 0.5/0.5 0.75/0.78 1/0.985'";

export async function assembleFinal(
  brollPath: string,
  voiceoverPath: string,
  musicPath: string | null,
  outputPath: string,
  options: { width?: number; height?: number; musicGainDb?: number; colorGrade?: boolean; loudnessLufs?: number | null } = {},
): Promise<string> {
  const w = options.width ?? 1280;
  const h = options.height ?? 720;
  const musicGainDb = options.musicGainDb ?? -18;
  const grade = options.colorGrade === false ? '' : `,${CINEMATIC_GRADE}`;
  // EBU R128 loudness master so the deliverable lands near streaming/social target
  // (~-14 LUFS) instead of the ~-25 LUFS the raw VO+music mix produces. loudnorm
  // also enforces true-peak, so it replaces the separate limiter.
  const norm = options.loudnessLufs === null ? '' : `,loudnorm=I=${options.loudnessLufs ?? -14}:TP=-1.5:LRA=11`;

  const voDur = await getDuration(voiceoverPath);
  const brollDur = await getDuration(brollPath);
  const pad = tailPadSeconds(voDur, brollDur);
  console.log(`[Assembler] Target duration ${voDur.toFixed(2)}s (VO); b-roll ${brollDur.toFixed(2)}s → ${pad > 0 ? `hold last frame ${pad.toFixed(2)}s` : `trim ${(brollDur - voDur).toFixed(2)}s`}`);

  const args: string[] = ['-y'];
  // The b-roll is never looped: when it runs shorter than the VO the overrun
  // must freeze on the closing shot (tpad below), not wrap back to shot 0 —
  // looping put the opening hook clip under the closing CTA caption.
  args.push('-i', brollPath);
  args.push('-i', voiceoverPath);
  if (musicPath) args.push('-stream_loop', '-1', '-i', musicPath);

  const tailHold = pad > 0 ? `,tpad=stop_mode=clone:stop_duration=${pad.toFixed(3)}` : '';
  const vChain = `[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1${grade}${tailHold}[v]`;
  let aChain: string;
  if (musicPath) {
    aChain =
      `[1:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[vo];` +
      `[2:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${musicGainDb}dB[bgm];` +
      `[vo][bgm]amix=inputs=2:duration=first:dropout_transition=0:normalize=0${norm}[a]`;
  } else {
    aChain = `[1:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo${norm}[a]`;
  }

  args.push('-filter_complex', `${vChain};${aChain}`);
  args.push('-map', '[v]', '-map', '[a]');
  args.push('-t', String(voDur));
  args.push('-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1');
  args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2');
  args.push('-movflags', '+faststart', outputPath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await execa('ffmpeg', args);
  console.log(`[Assembler] Final → ${outputPath} (${w}×${h}, ${voDur.toFixed(2)}s, vo+music)`);
  return outputPath;
}

export async function applyColorGrade(
  inputPath: string,
  outputPath: string,
): Promise<string> {
  const colorFilter = "eq=brightness=0.02:saturation=1.05,curves=m='0/0.01 0.1/0.11 0.5/0.5 1/1':b='0/0.02 0.1/0.12 0.5/0.5 1/1'";
  await execa('ffmpeg', [
    '-y', '-i', inputPath, '-vf', colorFilter,
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-tune', 'animation',
    '-c:a', 'copy', outputPath,
  ]);
  return outputPath;
}

/**
 * Seconds of freeze-frame padding needed for the b-roll to cover the voiceover.
 * A shortfall must never be covered by looping the b-roll input — playback
 * wraps to shot 0 (the hook) under the closing CTA. Pure — exported for tests.
 */
export function tailPadSeconds(voDur: number, brollDur: number): number {
  if (!Number.isFinite(voDur) || voDur <= 0) throw new Error(`tailPadSeconds: bad VO duration (${voDur})`);
  if (!Number.isFinite(brollDur) || brollDur <= 0) throw new Error(`tailPadSeconds: bad b-roll duration (${brollDur})`);
  return Math.max(0, voDur - brollDur);
}

/**
 * Parse an ffprobe `format=duration` line into seconds. ffprobe prints `N/A`
 * for streams without a container duration (raw H.264, corrupt files); a bare
 * parseFloat would yield NaN and silently flow into ffmpeg's `-t NaN`. Throwing
 * here surfaces a clear error instead. Pure — exported for tests.
 */
export function parseDuration(probeStdout: string): number {
  const seconds = parseFloat(probeStdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`getDuration: ffprobe returned no usable duration ("${probeStdout.trim()}")`);
  return seconds;
}

export async function getDuration(filePath: string): Promise<number> {
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ]);
  return parseDuration(stdout);
}

export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: number = 52.0,
): Promise<string> {
  await execa('ffmpeg', [
    '-y', '-ss', String(timestamp), '-i', videoPath,
    '-frames:v', '1', '-q:v', '2', outputPath,
  ]);
  return outputPath;
}
