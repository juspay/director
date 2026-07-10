/**
 * Caption burner — STT transcription via NeuroLink's `STTProcessor`,
 * then SRT burn-in via FFmpeg.
 *
 * Provider order: Deepgram → OpenAI Whisper → local WhisperX/faster-whisper.
 * First configured provider wins. Word-level timestamps are requested so each
 * subtitle line is timed; falls back to a single-line whole-clip caption if the
 * provider returns text only.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { STTProcessor, DeepgramSTT, OpenAISTT, GoogleSTT, AzureSTT } from '@juspay/neurolink';

// Explicit STT handler registration — NeuroLink lazy-registers through
// `nl.generate()` paths but not on direct STTProcessor.transcribe() calls.
let _registered = false;
function ensureSttRegistered(): void {
  if (_registered) return;
  _registered = true;
  try { if (process.env.DEEPGRAM_API_KEY)   STTProcessor.registerHandler('deepgram',   new DeepgramSTT()); } catch {}
  try { if (process.env.OPENAI_API_KEY)     STTProcessor.registerHandler('openai-stt', new OpenAISTT());   } catch {}
  try { if (process.env.OPENAI_API_KEY)     STTProcessor.registerHandler('whisper',    new OpenAISTT());   } catch {}
  try { if (process.env.GOOGLE_APPLICATION_CREDENTIALS) STTProcessor.registerHandler('google-stt', new GoogleSTT()); } catch {}
  try { if (process.env.AZURE_SPEECH_KEY)   STTProcessor.registerHandler('azure-stt',  new AzureSTT());    } catch {}
}

type WordTiming = { text: string; start: number; end: number };

function formatSrtTime(t: number): string {
  const ms = Math.floor((t % 1) * 1000);
  const s = Math.floor(t) % 60;
  const m = Math.floor(t / 60) % 60;
  const h = Math.floor(t / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function wordsToSrt(words: WordTiming[], maxCharsPerLine = 42): string {
  if (!words.length) return '';
  const lines: Array<{ start: number; end: number; text: string }> = [];
  let cur = { start: words[0].start, end: words[0].end, text: words[0].text };
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const candidate = (cur.text + ' ' + w.text).trim();
    if (candidate.length > maxCharsPerLine) {
      lines.push(cur);
      cur = { start: w.start, end: w.end, text: w.text };
    } else {
      cur = { start: cur.start, end: w.end, text: candidate };
    }
  }
  lines.push(cur);
  return lines.map((l, i) =>
    `${i + 1}\n${formatSrtTime(l.start)} --> ${formatSrtTime(l.end)}\n${l.text}\n`,
  ).join('\n');
}

async function durationSec(audioPath: string): Promise<number> {
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', audioPath,
  ]);
  return parseFloat(stdout.trim()) || 0;
}

export async function generateSrt(
  audioPath: string,
  outputPath: string,
  options: { language?: string; provider?: 'deepgram' | 'openai-stt' | 'whisper' | 'local' } = {},
): Promise<string> {
  ensureSttRegistered();
  const language = options.language ?? 'en';
  const requestedProvider = options.provider;

  // Pick configured providers; try each until one works (STTProcessor lazy-registration
  // can miss some on cold start, so we tolerate "not registered" and try the next).
  const candidates: Array<{ name: string; env: string }> = [
    { name: 'deepgram',   env: 'DEEPGRAM_API_KEY' },
    { name: 'openai-stt', env: 'OPENAI_API_KEY' },
  ];
  const order = requestedProvider && requestedProvider !== 'local'
    ? candidates.filter(c => c.name === requestedProvider)
    : candidates.filter(c => !!process.env[c.env]);

  const audio = await fs.readFile(audioPath);
  const ext = path.extname(audioPath).slice(1).toLowerCase();
  const format = (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'opus'].includes(ext) ? ext : 'mp3') as 'mp3';

  let r: Awaited<ReturnType<typeof STTProcessor.transcribe>> | null = null;
  let lastErr: unknown = null;
  let chosen = '';
  for (const c of order) {
    try {
      console.log(`[Captions] Transcribing ${path.basename(audioPath)} via NeuroLink STT (${c.name})...`);
      r = await STTProcessor.transcribe(audio, c.name, { format, language, wordTimestamps: true, punctuation: true });
      chosen = c.name;
      break;
    } catch (e) {
      lastErr = e;
      console.log(`  [Captions] ${c.name} failed: ${e instanceof Error ? e.message.slice(0, 100) : String(e).slice(0, 100)} — trying next…`);
    }
  }

  if (r) {
    void chosen;

    let srt: string;
    if (r.words && r.words.length) {
      const cues = r.words
        .map(w => {
          const wAny = w as { text?: string; word?: string; start?: number; startTime?: number; end?: number; endTime?: number };
          return {
            text:  wAny.text     ?? wAny.word      ?? '',
            start: wAny.start    ?? wAny.startTime ?? 0,
            end:   wAny.end      ?? wAny.endTime   ?? 0,
          };
        })
        .filter(w => w.end > w.start && w.text);
      srt = wordsToSrt(cues);
    } else {
      const dur = r.duration ?? await durationSec(audioPath);
      srt = `1\n${formatSrtTime(0)} --> ${formatSrtTime(dur)}\n${r.text}\n`;
    }
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, srt);
    console.log(`[Captions] SRT: ${outputPath} (${srt.split('\n\n').length - 1} cues)`);
    return outputPath;
  }

  // Local fallback (whisperx / faster-whisper)
  const model = 'large-v3-turbo';
  console.log(`[Captions] All NeuroLink STT providers failed — falling back to local ${model}...`);
  if (lastErr) console.log(`  last error: ${lastErr instanceof Error ? lastErr.message.slice(0, 120) : String(lastErr).slice(0, 120)}`);
  try {
    await execa('whisperx', [
      audioPath, '--model', model, '--language', language,
      '--output_format', 'srt', '--output_dir', path.dirname(outputPath),
    ]);
  } catch {
    await execa('python3', ['-m', 'faster_whisper', audioPath,
      '--model_size', model, '--language', language,
      '--output_format', 'srt', '--output_dir', path.dirname(outputPath),
    ]);
  }
  console.log(`[Captions] SRT: ${outputPath}`);
  return outputPath;
}

/**
 * Transcribe audio to plain text via NeuroLink STT (Deepgram → OpenAI Whisper).
 * Returns '' if no provider is configured or all fail. Used for post-pipeline
 * quality gating (script vs. what was actually narrated).
 */
export async function transcribe(
  audioPath: string,
  options: { language?: string } = {},
): Promise<string> {
  ensureSttRegistered();
  const language = options.language ?? 'en';
  const order = [
    { name: 'deepgram', env: 'DEEPGRAM_API_KEY' },
    { name: 'openai-stt', env: 'OPENAI_API_KEY' },
  ].filter(c => !!process.env[c.env]);
  const audio = await fs.readFile(audioPath);
  const ext = path.extname(audioPath).slice(1).toLowerCase();
  const format = (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'opus'].includes(ext) ? ext : 'mp3') as 'mp3';
  for (const c of order) {
    try {
      const r = await STTProcessor.transcribe(audio, c.name, { format, language, punctuation: true });
      if (r?.text) return r.text.trim();
    } catch { /* try next provider */ }
  }
  return '';
}

type SrtCue = { idx: number; start: number; end: number; text: string };

function parseSrt(raw: string): SrtCue[] {
  const blocks = raw.replace(/\r/g, '').split(/\n\n+/).filter(b => b.trim());
  return blocks.flatMap(b => {
    const lines = b.split('\n');
    const idx = Number(lines[0]);
    const tc = lines[1]?.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!Number.isFinite(idx) || !tc) return [];
    const toSec = (h: string, m: string, s: string, ms: string) =>
      Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
    return [{
      idx,
      start: toSec(tc[1], tc[2], tc[3], tc[4]),
      end:   toSec(tc[5], tc[6], tc[7], tc[8]),
      text:  lines.slice(2).join('\n').trim(),
    }];
  });
}

async function hasLibass(): Promise<boolean> {
  try {
    const { stdout } = await execa('ffmpeg', ['-hide_banner', '-filters'], { stdio: 'pipe' });
    return /\bsubtitles\b/.test(stdout) && /\bdrawtext\b/.test(stdout);
  } catch { return false; }
}

async function hasImagemagick(): Promise<boolean> {
  try { await execa('magick', ['-version'], { stdio: 'pipe' }); return true; } catch { /* try legacy */ }
  try { await execa('convert', ['-version'], { stdio: 'pipe' }); return true; } catch { return false; }
}

async function renderCuePng(cue: SrtCue, width: number, dir: string): Promise<string> {
  const out = path.join(dir, `cue-${String(cue.idx).padStart(4, '0')}.png`);
  const escaped = cue.text.replace(/"/g, '\\"');
  const padX = 28, padY = 14;
  const fontSize = Math.round(width / 30);
  const captionW = Math.round(width * 0.85);
  const args = [
    '-background', 'rgba(0,0,0,0.62)',
    '-fill', 'white',
    '-font', 'Helvetica-Bold',
    '-pointsize', String(fontSize),
    '-gravity', 'center',
    '-size', `${captionW - 2 * padX}x`,
    `caption:${escaped}`,
    '-bordercolor', 'rgba(0,0,0,0.62)',
    '-border', `${padX}x${padY}`,
    out,
  ];
  try { await execa('magick', args); }
  catch { await execa('convert', args); }
  return out;
}

async function videoSize(p: string): Promise<{ width: number; height: number }> {
  const { stdout } = await execa('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0:s=x', p,
  ]);
  const [w, h] = stdout.trim().split('x').map(Number);
  return { width: w, height: h };
}

/** Vertical overlay position: captions sit above the safe margin, cards dead-center. Pure. */
export function overlayYExpr(placement: 'bottom' | 'center', height: number): string {
  return placement === 'center' ? '(H-h)/2' : `H-h-${Math.round(height * 0.07)}`;
}

async function burnViaOverlay(
  videoPath: string,
  cues: SrtCue[],
  outputPath: string,
  placement: 'bottom' | 'center' = 'bottom',
): Promise<string> {
  const { width, height } = await videoSize(videoPath);
  const tmpDir = path.join(path.dirname(outputPath), '.cue-overlays');
  await fs.mkdir(tmpDir, { recursive: true });
  const pngs = await Promise.all(cues.map(c => renderCuePng(c, width, tmpDir)));

  const args: string[] = ['-y', '-i', videoPath, ...pngs.flatMap(p => ['-i', p])];
  const chain: string[] = [];
  let prev = '[0:v]';
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    const tag = i === cues.length - 1 ? '[outv]' : `[v${i + 1}]`;
    const yPos = overlayYExpr(placement, height);
    chain.push(
      `${prev}[${i + 1}:v]overlay=x=(W-w)/2:y=${yPos}:enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})'${tag}`,
    );
    prev = tag;
  }
  args.push('-filter_complex', chain.join(';'));
  args.push('-map', '[outv]', '-map', '0:a?');
  args.push('-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p');
  args.push('-c:a', 'copy', '-movflags', '+faststart', outputPath);

  await execa('ffmpeg', args);
  console.log(`[Captions] Burned via PNG overlay (${cues.length} cues, ${width}×${height}): ${outputPath}`);
  return outputPath;
}

export async function burnCaptions(
  videoPath: string,
  srtPath: string,
  outputPath: string,
  opts: { forceStyle?: string; overlayPlacement?: 'bottom' | 'center' } = {},
): Promise<string> {
  // 1) Hard burn-in via libass when available. `forceStyle` overrides the
  // caption look for callers that use the burn pipeline as a typography
  // renderer (cards b-roll); the PNG-overlay tier honors `overlayPlacement`
  // so cards stay centered without libass, but keeps its own type treatment —
  // callers needing the exact style should treat tiers 2/3 as degraded output.
  if (await hasLibass()) {
    const style = opts.forceStyle
      ?? 'FontName=Helvetica,FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=0,MarginV=40,Alignment=2,BorderStyle=4';
    const srtEscaped = srtPath.replace(/'/g, "\\'").replace(/:/g, '\\:');
    try {
      await execa('ffmpeg', [
        '-y', '-i', videoPath,
        '-vf', `subtitles='${srtEscaped}':force_style='${style}'`,
        '-c:v', 'libx264', '-crf', '18', '-preset', 'slow',
        '-c:a', 'copy', '-movflags', '+faststart', outputPath,
      ]);
      console.log(`[Captions] Burned (libass): ${outputPath}`);
      return outputPath;
    } catch (e) {
      console.log(`[Captions] libass burn failed: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`);
    }
  }

  // 2) ImageMagick PNG overlay — burns captions without libass
  const cues = parseSrt(await fs.readFile(srtPath, 'utf-8'));
  if (cues.length && await hasImagemagick()) {
    try {
      return await burnViaOverlay(videoPath, cues, outputPath, opts.overlayPlacement ?? 'bottom');
    } catch (e) {
      console.log(`[Captions] overlay burn failed: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}`);
    }
  }

  // 3) Soft mux fallback
  await execa('ffmpeg', [
    '-y', '-i', videoPath, '-i', srtPath,
    '-map', '0:v', '-map', '0:a?', '-map', '1:0',
    '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text',
    '-metadata:s:s:0', 'language=eng',
    '-movflags', '+faststart', outputPath,
  ]);
  console.log(`[Captions] Soft-muxed (mov_text): ${outputPath}`);
  return outputPath;
}
