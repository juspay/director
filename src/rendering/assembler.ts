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

export async function assembleFinal(
  brollPath: string,
  voiceoverPath: string,
  musicPath: string | null,
  outputPath: string,
  options: { width?: number; height?: number; musicGainDb?: number } = {},
): Promise<string> {
  const w = options.width ?? 1280;
  const h = options.height ?? 720;
  const musicGainDb = options.musicGainDb ?? -18;

  const voDur = await getDuration(voiceoverPath);
  const brollDur = await getDuration(brollPath);
  console.log(`[Assembler] Target duration ${voDur.toFixed(2)}s (VO); b-roll ${brollDur.toFixed(2)}s → loop=${(voDur / brollDur).toFixed(2)}x`);

  const args: string[] = ['-y'];
  args.push('-stream_loop', '-1', '-i', brollPath);
  args.push('-i', voiceoverPath);
  if (musicPath) args.push('-stream_loop', '-1', '-i', musicPath);

  const vChain = `[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1[v]`;
  let aChain: string;
  if (musicPath) {
    aChain =
      `[1:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[vo];` +
      `[2:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${musicGainDb}dB[bgm];` +
      `[vo][bgm]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.98[a]`;
  } else {
    aChain = `[1:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a]`;
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

export async function getDuration(filePath: string): Promise<number> {
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ]);
  return parseFloat(stdout.trim());
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
