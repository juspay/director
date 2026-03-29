/**
 * Caption burner — WhisperX transcription + SRT burn-in via FFmpeg.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';

export async function generateSrt(
  audioPath: string,
  outputPath: string,
  options: { model?: string; language?: string } = {},
): Promise<string> {
  const model = options.model ?? 'large-v3-turbo';
  const lang = options.language ?? 'en';

  console.log(`[Captions] Transcribing ${path.basename(audioPath)} with ${model}...`);

  // Try whisperx first, fall back to faster-whisper
  try {
    await execa('whisperx', [
      audioPath, '--model', model, '--language', lang,
      '--output_format', 'srt', '--output_dir', path.dirname(outputPath),
    ]);
  } catch {
    console.log('[Captions] WhisperX unavailable, trying faster-whisper...');
    await execa('python3', ['-m', 'faster_whisper', audioPath,
      '--model_size', model, '--language', lang,
      '--output_format', 'srt', '--output_dir', path.dirname(outputPath),
    ]);
  }

  console.log(`[Captions] SRT: ${outputPath}`);
  return outputPath;
}

export async function burnCaptions(
  videoPath: string,
  srtPath: string,
  outputPath: string,
): Promise<string> {
  const style = 'FontName=Arial,FontSize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=0,MarginV=25,Alignment=2,BorderStyle=4';
  const srtEscaped = srtPath.replace(/'/g, "\\'").replace(/:/g, '\\:');

  await execa('ffmpeg', [
    '-y', '-i', videoPath,
    '-vf', `subtitles='${srtEscaped}':force_style='${style}'`,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-tune', 'animation',
    '-c:a', 'copy', '-movflags', '+faststart', outputPath,
  ]);

  console.log(`[Captions] Burned: ${outputPath}`);
  return outputPath;
}
