/**
 * Cards b-roll — the $0 tier (roadmap P1-1, the OpenMontage lesson): with no
 * video-generation key or budget, render the script itself as typography — a
 * solid brand ground with the narration's phrases burned as large centered
 * cards through the existing 3-tier caption pipeline. Zero new dependencies,
 * zero API spend, and deliberately never falls through to a paid path.
 */
import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import { scriptToSrt } from '../pipeline/runner-helpers.ts';
import { burnCaptions } from './caption-burner.ts';

/** libass card typography: large, bold, dead-center (numpad Alignment=5), no caption box. */
export const CARD_STYLE = 'FontName=Helvetica,FontSize=54,PrimaryColour=&H00FFFFFF,Bold=1,Outline=0,Shadow=0,Alignment=5,MarginV=0';

/** The brand dark ground shared with dashboard-generator/Backlot (#0a0a10). */
export const CARD_BG = '0x0a0a10';

export type CardBrollOpts = {
  script: string;
  outDir: string;
  width: number;
  height: number;
  durationSec: number;
};

/** Cut length: match the voiceover when one exists, else a 30s standalone default. Pure. */
export function resolveCardDuration(voDur: number, fallback = 30): number {
  return Number.isFinite(voDur) && voDur > 0 ? voDur : fallback;
}

/** ffmpeg args for the solid brand-ground base video (lavfi color source). Pure. */
export function buildCardBaseArgs(width: number, height: number, durationSec: number, outPath: string, fps = 30): string[] {
  return [
    '-y', '-f', 'lavfi',
    '-i', `color=c=${CARD_BG}:s=${width}x${height}:d=${durationSec.toFixed(3)}:r=${fps}`,
    '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    outPath,
  ];
}

export async function renderCardBroll(opts: CardBrollOpts): Promise<string> {
  // Phrase cards reuse the caption cue splitter: sentence-boundary-first,
  // word-capped, monotonic timing across the full cut.
  const srt = scriptToSrt(opts.script, opts.durationSec, 8);
  if (!srt) throw new Error('[B-roll] cards mode: empty script — nothing to render');

  const base = path.join(opts.outDir, '.cards-base.mp4');
  const srtPath = path.join(opts.outDir, '.cards.srt');
  const outputPath = path.join(opts.outDir, 'broll.mp4');
  await fs.mkdir(opts.outDir, { recursive: true });
  await fs.writeFile(srtPath, srt, 'utf-8');
  await execa('ffmpeg', buildCardBaseArgs(opts.width, opts.height, opts.durationSec, base));
  await burnCaptions(base, srtPath, outputPath, { forceStyle: CARD_STYLE, overlayPlacement: 'center' });
  console.log(`[B-roll] cards mode: ${opts.durationSec.toFixed(1)}s typography cut at $0 → ${outputPath}`);
  return outputPath;
}
