import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCardDuration, buildCardBaseArgs, renderCardBroll, CARD_STYLE, CARD_BG } from '../../src/rendering/card-broll.ts';

test('resolveCardDuration', async (t) => {
  await t.test('matches the voiceover when one exists', () => {
    assert.equal(resolveCardDuration(27.4), 27.4);
  });
  await t.test('falls back to 30s for missing/zero/NaN voiceover durations', () => {
    assert.equal(resolveCardDuration(0), 30);
    assert.equal(resolveCardDuration(-1), 30);
    assert.equal(resolveCardDuration(NaN), 30);
  });
  await t.test('honors a custom fallback', () => {
    assert.equal(resolveCardDuration(0, 12), 12);
  });
});

test('buildCardBaseArgs', async (t) => {
  await t.test('renders a lavfi color source at the requested geometry and length', () => {
    const args = buildCardBaseArgs(1920, 1080, 27.4, '/out/.cards-base.mp4');
    assert.equal(args[args.length - 1], '/out/.cards-base.mp4');
    const src = args[args.indexOf('-i') + 1];
    assert.match(src, /^color=c=0x0a0a10:s=1920x1080:d=27\.400:r=30$/);
    assert.ok(args.includes('-pix_fmt') && args.includes('yuv420p'), 'player-safe pixel format');
  });
  await t.test('fps is overridable', () => {
    const args = buildCardBaseArgs(1280, 720, 8, '/o.mp4', 24);
    assert.match(args[args.indexOf('-i') + 1], /:r=24$/);
  });
});

test('CARD_STYLE is centered typography, not a caption bar', () => {
  assert.match(CARD_STYLE, /Alignment=5/, 'numpad 5 = dead center');
  assert.match(CARD_STYLE, /Outline=0/);
  assert.match(CARD_STYLE, /Bold=1/);
  assert.doesNotMatch(CARD_STYLE, /BorderStyle=4/, 'no opaque caption box behind cards');
});

test('CARD_BG is the shared brand ground', () => {
  assert.equal(CARD_BG, '0x0a0a10');
});

// Throws before any I/O — an empty script must not leave stray files or invoke ffmpeg.
test('renderCardBroll rejects an empty script up front', async () => {
  await assert.rejects(
    renderCardBroll({ script: '   ', outDir: '/nonexistent-dir-cards', width: 1280, height: 720, durationSec: 10 }),
    /empty script/,
  );
});

test('overlayYExpr places captions above the safe margin and cards dead-center', async () => {
  const { overlayYExpr } = await import('../../src/rendering/caption-burner.ts');
  assert.equal(overlayYExpr('bottom', 1080), 'H-h-76'); // 7% safe margin
  assert.equal(overlayYExpr('center', 1080), '(H-h)/2');
});
