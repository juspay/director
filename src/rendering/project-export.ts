/**
 * Editable-project export (W-P2-B) — hand a finished run to a human editor.
 *
 * Emits FCPXML 1.9, which both Final Cut Pro and DaVinci Resolve import: the
 * b-roll segments land as individual clips on the primary storyline (so shots
 * can be reordered/trimmed), with voiceover and music as connected audio
 * lanes. $0, offline, no accounts — the deliberate alternative to publishing
 * integrations, which need third-party tokens.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';

export type ProjectClip = {
  name: string;
  path: string;
  durationSec: number;
  hasAudio: boolean;
};

export type ProjectSpec = {
  name: string;
  width: number;
  height: number;
  fps: number;
  video: ProjectClip[];
  voiceover?: ProjectClip;
  music?: ProjectClip;
};

/**
 * FCPXML rational time: seconds snapped to whole frames over a fps timescale
 * ("90/30s" for 3s at 30fps). Editors reject times that don't land on frame
 * boundaries, hence the rounding.
 */
export function toFcpTime(seconds: number, fps: number): string {
  const frames = Math.max(0, Math.round(seconds * fps));
  return `${frames}/${fps}s`;
}

const escXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fileUrl = (p: string): string => `file://${encodeURI(path.resolve(p))}`;

/** Pure FCPXML document builder — no I/O, fully testable. */
export function buildFcpXml(spec: ProjectSpec): string {
  const { fps } = spec;
  const assets: string[] = [];
  const clips: string[] = [];

  const assetXml = (id: string, c: ProjectClip, video: boolean): string =>
    `    <asset id="${id}" name="${escXml(c.name)}" start="0s" duration="${toFcpTime(c.durationSec, fps)}" hasVideo="${video ? 1 : 0}" hasAudio="${c.hasAudio ? 1 : 0}">
      <media-rep kind="original-media" src="${escXml(fileUrl(c.path))}"/>
    </asset>`;

  spec.video.forEach((c, i) => assets.push(assetXml(`v${i + 1}`, c, true)));
  if (spec.voiceover) assets.push(assetXml('vo', spec.voiceover, false));
  if (spec.music) assets.push(assetXml('mus', spec.music, false));

  // Connected audio rides on the first spine clip: lane -1 voiceover, -2 music.
  const connected: string[] = [];
  if (spec.voiceover) {
    connected.push(`        <asset-clip ref="vo" lane="-1" offset="0s" duration="${toFcpTime(spec.voiceover.durationSec, fps)}" name="${escXml(spec.voiceover.name)}"/>`);
  }
  if (spec.music) {
    connected.push(`        <asset-clip ref="mus" lane="-2" offset="0s" duration="${toFcpTime(spec.music.durationSec, fps)}" name="${escXml(spec.music.name)}"/>`);
  }

  let offset = 0;
  spec.video.forEach((c, i) => {
    const inner = i === 0 && connected.length ? `\n${connected.join('\n')}\n      ` : '';
    clips.push(`      <asset-clip ref="v${i + 1}" offset="${toFcpTime(offset, fps)}" duration="${toFcpTime(c.durationSec, fps)}" name="${escXml(c.name)}">${inner}</asset-clip>`);
    offset += Math.round(c.durationSec * fps) / fps;
  });

  const totalSec = spec.video.reduce((a, c) => a + Math.round(c.durationSec * fps) / fps, 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat${spec.height}p${fps}" frameDuration="1/${fps}s" width="${spec.width}" height="${spec.height}"/>
${assets.join('\n')}
  </resources>
  <library>
    <event name="${escXml(spec.name)}">
      <project name="${escXml(spec.name)}">
        <sequence format="r1" duration="${toFcpTime(totalSec, fps)}" tcStart="0s">
          <spine>
${clips.join('\n')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}

async function probe(p: string): Promise<{ durationSec: number; hasAudio: boolean } | null> {
  try {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-show_entries', 'stream=codec_type',
      '-of', 'json', p,
    ]);
    const data = JSON.parse(stdout) as { format?: { duration?: string }; streams?: Array<{ codec_type?: string }> };
    const durationSec = Number(data.format?.duration ?? 0);
    if (!Number.isFinite(durationSec) || durationSec <= 0) return null;
    return { durationSec, hasAudio: (data.streams ?? []).some((s) => s.codec_type === 'audio') };
  } catch {
    return null;
  }
}

/**
 * Collect a run's editable assets from its output dir. Prefers individual
 * b-roll segments (reorderable in the editor) over the flattened broll.mp4;
 * falls back through avatar and the final cut so something always exports.
 */
export async function collectRunAssets(outDir: string, opts: { width: number; height: number; fps: number }): Promise<ProjectSpec> {
  const entries = await fs.readdir(outDir).catch(() => [] as string[]);
  const segNames = entries
    .filter((f) => /^\.broll(-dir)?-seg-\d+\.mp4$/.test(f))
    .sort((a, b) => Number(a.match(/(\d+)\.mp4$/)?.[1] ?? 0) - Number(b.match(/(\d+)\.mp4$/)?.[1] ?? 0));

  const video: ProjectClip[] = [];
  const candidates = segNames.length ? segNames : ['broll.mp4', 'avatar.mp4', 'final.mp4'].filter((f) => entries.includes(f)).slice(0, 1);
  for (const name of candidates) {
    const p = path.join(outDir, name);
    const info = await probe(p);
    if (info) video.push({ name: name.replace(/^\./, ''), path: p, durationSec: info.durationSec, hasAudio: info.hasAudio });
  }

  const audioClip = async (names: string[]): Promise<ProjectClip | undefined> => {
    for (const name of names) {
      if (!entries.includes(name)) continue;
      const p = path.join(outDir, name);
      const info = await probe(p);
      if (info) return { name, path: p, durationSec: info.durationSec, hasAudio: true };
    }
    return undefined;
  };

  return {
    name: path.basename(path.resolve(outDir)),
    width: opts.width, height: opts.height, fps: opts.fps,
    video,
    voiceover: await audioClip(['voiceover.mp3']),
    music: await audioClip(['music.mp3', 'music.wav']),
  };
}

export async function exportProject(outDir: string, opts: { width?: number; height?: number; fps?: number } = {}): Promise<string> {
  const spec = await collectRunAssets(outDir, { width: opts.width ?? 1920, height: opts.height ?? 1080, fps: opts.fps ?? 30 });
  if (!spec.video.length) throw new Error(`[Export] no video assets found in ${outDir} — run the pipeline first`);
  const out = path.join(outDir, 'project.fcpxml');
  await fs.writeFile(out, buildFcpXml(spec));
  console.log(`[Export] ${out} — ${spec.video.length} clip(s)${spec.voiceover ? ' + voiceover' : ''}${spec.music ? ' + music' : ''} (opens in Final Cut Pro / DaVinci Resolve)`);
  return out;
}

// CLI: npm run export:project [-- --out output/my-run]
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outDir = outIdx >= 0 ? args[outIdx + 1] : 'output';
  try {
    await exportProject(outDir);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
