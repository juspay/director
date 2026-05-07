/**
 * FFmpeg assembler — wraps FFmpeg CLI via execa.
 * Replaces Python assembler.py.
 */
import { execa } from 'execa';
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
