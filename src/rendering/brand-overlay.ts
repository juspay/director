/**
 * Deterministic brand compositing — logo bug + end-card, applied at assembly.
 * The generative path intentionally excludes branding (image-gen's negative
 * prompt bans "logo, brand name, watermark" because generated logos are
 * unreliable), so brand presence is guaranteed HERE, as a compositing step
 * independent of which model produced the b-roll.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { getDuration } from './assembler.ts';

export type LogoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type BrandKit = {
  logoPath?: string;
  logoCorner: LogoCorner;
  /** Logo width as a fraction of the video width. */
  logoWidthFrac: number;
  endCardPath?: string;
  /** How long the end-card holds at the tail. */
  endCardSeconds: number;
};

const CORNERS: readonly LogoCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

/**
 * Read the brand kit from env. Null when neither BRAND_LOGO nor BRAND_END_CARD
 * is set — brand compositing is opt-in and the pipeline is unchanged without it.
 */
export function resolveBrandKit(env: NodeJS.ProcessEnv = process.env): BrandKit | null {
  const logoPath = env.BRAND_LOGO?.trim() || undefined;
  const endCardPath = env.BRAND_END_CARD?.trim() || undefined;
  if (!logoPath && !endCardPath) return null;
  const corner = (env.BRAND_LOGO_CORNER ?? '').trim() as LogoCorner;
  const widthFrac = Number(env.BRAND_LOGO_WIDTH ?? NaN);
  const endSec = Number(env.BRAND_END_CARD_SECONDS ?? NaN);
  return {
    logoPath,
    logoCorner: CORNERS.includes(corner) ? corner : 'top-right',
    logoWidthFrac: widthFrac > 0 && widthFrac <= 0.5 ? widthFrac : 0.12,
    endCardPath,
    endCardSeconds: endSec > 0 ? endSec : 2,
  };
}

/**
 * A stable fingerprint of the brand kit's identity — the layout params plus,
 * for each asset, its path, byte size and mtime. Editing a logo/end-card file
 * in place (same path) changes size/mtime, so the fingerprint tracks content,
 * not just the path. `'none'` when no kit is configured. The resume machinery
 * compares this across invocations: a changed fingerprint means the overlay
 * baked into final.mp4 is stale and assembly must re-run.
 */
export async function brandKitFingerprint(kit: BrandKit | null): Promise<string> {
  if (!kit) return 'none';
  const parts = [`corner=${kit.logoCorner}`, `w=${kit.logoWidthFrac}`, `sec=${kit.endCardSeconds}`];
  for (const [label, p] of [['logo', kit.logoPath], ['card', kit.endCardPath]] as const) {
    if (!p) { parts.push(`${label}=none`); continue; }
    try {
      const st = await fs.stat(p);
      parts.push(`${label}=${p}:${st.size}:${Math.round(st.mtimeMs)}`);
    } catch { parts.push(`${label}=${p}:missing`); }
  }
  return parts.join('|');
}

/**
 * Overlay x/y expressions for a corner logo at a 3%-of-width margin.
 * Pure — exported for tests.
 */
export function logoOverlayXY(corner: LogoCorner): { x: string; y: string } {
  const m = 'W*0.03';
  const x = corner === 'top-left' || corner === 'bottom-left' ? m : `W-w-${m}`;
  const y = corner === 'top-left' || corner === 'top-right' ? m : `H-h-${m}`;
  return { x, y };
}

/**
 * Build the ffmpeg filter_complex + extra input args for a brand kit. The logo
 * is overlaid for the full runtime; the end-card covers the frame for the final
 * `endCardSeconds`, fading in so the closing shot hands off instead of popping.
 * The end-card PNG is `-loop`ed into a real stream — fade computes alpha across
 * frame timestamps, so on a single-frame input the one frame lands at t=0 with
 * alpha 0 and the card never renders. Pure — exported for tests.
 */
export function buildBrandFilter(
  kit: BrandKit,
  video: { width: number; height: number; duration: number },
): { filter: string; inputArgs: string[] } {
  const inputArgs: string[] = [];
  const chain: string[] = [];
  let src = '[0:v]';
  let inputIdx = 0;
  if (kit.logoPath) {
    inputArgs.push('-i', kit.logoPath);
    inputIdx += 1;
    const logoW = Math.max(1, Math.round(video.width * kit.logoWidthFrac));
    const { x, y } = logoOverlayXY(kit.logoCorner);
    chain.push(`[${inputIdx}:v]scale=${logoW}:-1[logo]`);
    chain.push(`${src}[logo]overlay=x=${x}:y=${y}[vlogo]`);
    src = '[vlogo]';
  }
  if (kit.endCardPath) {
    inputArgs.push('-loop', '1', '-framerate', '30', '-t', kit.endCardSeconds.toFixed(3), '-i', kit.endCardPath);
    inputIdx += 1;
    const start = Math.max(0, video.duration - kit.endCardSeconds);
    chain.push(
      `[${inputIdx}:v]scale=${video.width}:${video.height}:force_original_aspect_ratio=increase,` +
      `crop=${video.width}:${video.height},setsar=1,format=rgba,` +
      `fade=t=in:st=0:d=0.4:alpha=1,setpts=PTS-STARTPTS+${start.toFixed(3)}/TB[card]`,
    );
    chain.push(`${src}[card]overlay=enable='gte(t,${start.toFixed(3)})'[vcard]`);
    src = '[vcard]';
  }
  chain.push(`${src}null[outv]`);
  return { filter: chain.join(';'), inputArgs };
}

/**
 * Composite the brand kit onto a finished video (audio copied untouched).
 */
export async function applyBrandOverlay(
  videoPath: string,
  outputPath: string,
  kit: BrandKit,
): Promise<string> {
  for (const p of [kit.logoPath, kit.endCardPath]) {
    if (p) await fs.access(p);
  }
  const duration = await getDuration(videoPath);
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', videoPath,
  ]);
  const [width, height] = stdout.trim().split('x').map(Number);
  if (!width || !height) throw new Error(`applyBrandOverlay: could not probe dimensions of ${videoPath}`);

  const { filter, inputArgs } = buildBrandFilter(kit, { width, height, duration });
  const args = [
    '-y', '-i', videoPath,
    ...inputArgs,
    '-filter_complex', filter,
    '-map', '[outv]', '-map', '0:a?',
    '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', outputPath,
  ];
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await execa('ffmpeg', args);
  const parts = [kit.logoPath && `logo @ ${kit.logoCorner}`, kit.endCardPath && `end-card ${kit.endCardSeconds}s`].filter(Boolean);
  console.log(`[Brand] Composited ${parts.join(' + ')} → ${outputPath}`);
  return outputPath;
}
