import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveBrandKit, brandKitFingerprint, logoOverlayXY, buildBrandFilter, type BrandKit } from '../../src/rendering/brand-overlay.ts';

test('resolveBrandKit', async (t) => {
  await t.test('null when nothing configured — compositing is opt-in', () => {
    assert.equal(resolveBrandKit({}), null);
    assert.equal(resolveBrandKit({ BRAND_LOGO: '  ' }), null);
  });

  await t.test('defaults: top-right corner, 12% width, 2s end-card', () => {
    const kit = resolveBrandKit({ BRAND_LOGO: '/tmp/logo.png' });
    assert.deepEqual(kit, {
      logoPath: '/tmp/logo.png', logoCorner: 'top-right', logoWidthFrac: 0.12,
      endCardPath: undefined, endCardSeconds: 2,
    });
  });

  await t.test('end-card alone is a valid kit', () => {
    const kit = resolveBrandKit({ BRAND_END_CARD: '/tmp/card.png', BRAND_END_CARD_SECONDS: '3.5' });
    assert.equal(kit?.logoPath, undefined);
    assert.equal(kit?.endCardPath, '/tmp/card.png');
    assert.equal(kit?.endCardSeconds, 3.5);
  });

  await t.test('bad corner / width / seconds fall back to defaults', () => {
    const kit = resolveBrandKit({
      BRAND_LOGO: '/tmp/logo.png', BRAND_LOGO_CORNER: 'middle', BRAND_LOGO_WIDTH: '0.9', BRAND_END_CARD_SECONDS: '-1',
    });
    assert.equal(kit?.logoCorner, 'top-right');
    assert.equal(kit?.logoWidthFrac, 0.12);
    assert.equal(kit?.endCardSeconds, 2);
  });
});

test('brandKitFingerprint', async (t) => {
  await t.test('null kit is "none"', async () => {
    assert.equal(await brandKitFingerprint(null), 'none');
  });

  await t.test('captures layout params and tracks file content, not just path', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'brandfp-'));
    const logo = path.join(dir, 'logo.png');
    await fs.writeFile(logo, 'AAAA');
    const kit: BrandKit = { logoPath: logo, logoCorner: 'top-right', logoWidthFrac: 0.12, endCardPath: undefined, endCardSeconds: 2 };

    const a = await brandKitFingerprint(kit);
    assert.match(a, /corner=top-right\|w=0\.12\|sec=2/);
    assert.match(a, /logo=.*:4:/);      // size 4 bytes
    assert.match(a, /card=none/);

    // same bytes → same fingerprint (stable across calls)
    assert.equal(await brandKitFingerprint(kit), a);

    // editing the file in place (same path) changes the fingerprint
    await fs.writeFile(logo, 'BBBBBBBB');
    assert.notEqual(await brandKitFingerprint(kit), a);

    // a layout-only change also moves the fingerprint
    assert.notEqual(await brandKitFingerprint({ ...kit, logoCorner: 'bottom-left' }), await brandKitFingerprint(kit));
    await fs.rm(dir, { recursive: true, force: true });
  });

  await t.test('missing asset is marked, not thrown', async () => {
    const kit: BrandKit = { logoPath: '/no/such/logo.png', logoCorner: 'top-right', logoWidthFrac: 0.12, endCardPath: undefined, endCardSeconds: 2 };
    assert.match(await brandKitFingerprint(kit), /logo=\/no\/such\/logo\.png:missing/);
  });
});

test('logoOverlayXY places each corner inside the 3% margin', () => {
  assert.deepEqual(logoOverlayXY('top-left'), { x: 'W*0.03', y: 'W*0.03' });
  assert.deepEqual(logoOverlayXY('top-right'), { x: 'W-w-W*0.03', y: 'W*0.03' });
  assert.deepEqual(logoOverlayXY('bottom-left'), { x: 'W*0.03', y: 'H-h-W*0.03' });
  assert.deepEqual(logoOverlayXY('bottom-right'), { x: 'W-w-W*0.03', y: 'H-h-W*0.03' });
});

test('buildBrandFilter', async (t) => {
  const video = { width: 1920, height: 1080, duration: 32.266 };

  await t.test('logo only: scaled to the width fraction, overlaid full-runtime', () => {
    const kit: BrandKit = { logoPath: '/tmp/logo.png', logoCorner: 'top-right', logoWidthFrac: 0.12, endCardSeconds: 2 };
    const { filter, inputArgs } = buildBrandFilter(kit, video);
    assert.deepEqual(inputArgs, ['-i', '/tmp/logo.png']);
    assert.match(filter, /\[1:v\]scale=230:-1\[logo\]/);
    assert.match(filter, /\[0:v\]\[logo\]overlay=x=W-w-W\*0\.03:y=W\*0\.03\[vlogo\]/);
    assert.match(filter, /\[vlogo\]null\[outv\]$/);
  });

  await t.test('end-card only: covers the last endCardSeconds with a fade-in', () => {
    const kit: BrandKit = { logoCorner: 'top-right', logoWidthFrac: 0.12, endCardPath: '/tmp/card.png', endCardSeconds: 2 };
    const { filter, inputArgs } = buildBrandFilter(kit, video);
    assert.deepEqual(inputArgs, ['-loop', '1', '-framerate', '30', '-t', '2.000', '-i', '/tmp/card.png']);
    assert.match(filter, /scale=1920:1080:force_original_aspect_ratio=increase/);
    assert.match(filter, /overlay=enable='gte\(t,30\.266\)'/);
    assert.match(filter, /fade=t=in/);
  });

  await t.test('logo + end-card chain in order, single [outv]', () => {
    const kit: BrandKit = {
      logoPath: '/tmp/logo.png', logoCorner: 'bottom-left', logoWidthFrac: 0.1,
      endCardPath: '/tmp/card.png', endCardSeconds: 3,
    };
    const { filter, inputArgs } = buildBrandFilter(kit, video);
    assert.deepEqual(inputArgs, ['-i', '/tmp/logo.png', '-loop', '1', '-framerate', '30', '-t', '3.000', '-i', '/tmp/card.png']);
    assert.match(filter, /\[1:v\]scale=192:-1\[logo\]/);
    assert.match(filter, /\[2:v\]scale=1920:1080/);
    assert.match(filter, /\[vlogo\]\[card\]overlay=enable='gte\(t,29\.266\)'\[vcard\]/);
    assert.equal((filter.match(/\[outv\]/g) ?? []).length, 1);
  });

  await t.test('end-card start clamps at 0 for very short videos', () => {
    const kit: BrandKit = { logoCorner: 'top-right', logoWidthFrac: 0.12, endCardPath: '/tmp/card.png', endCardSeconds: 10 };
    const { filter } = buildBrandFilter(kit, { width: 640, height: 360, duration: 4 });
    assert.match(filter, /gte\(t,0\.000\)/);
  });
});
