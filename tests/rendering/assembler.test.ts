import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, tailPadSeconds } from '../../src/rendering/assembler.ts';

test('parseDuration', async (t) => {
  await t.test('parses a normal ffprobe duration line', () => {
    assert.equal(parseDuration('12.480000\n'), 12.48);
    assert.equal(parseDuration('  3.5  '), 3.5);
  });

  // Regression: ffprobe prints "N/A" for streams without a container duration.
  // A bare parseFloat would return NaN and flow into ffmpeg's `-t NaN`.
  await t.test('throws on a non-numeric (N/A) probe result', () => {
    assert.throws(() => parseDuration('N/A'), /no usable duration/);
    assert.throws(() => parseDuration(''), /no usable duration/);
  });

  await t.test('throws on a non-finite value', () => {
    assert.throws(() => parseDuration('Infinity'), /no usable duration/);
  });
});

test('tailPadSeconds', async (t) => {
  await t.test('pads the exact VO/b-roll deficit (live regression: draft run)', () => {
    assert.ok(Math.abs(tailPadSeconds(32.256, 30.2) - 2.056) < 1e-9);
  });
  await t.test('no padding when b-roll covers the VO', () => {
    assert.equal(tailPadSeconds(32.0, 36.0), 0);
    assert.equal(tailPadSeconds(32.0, 32.0), 0);
  });
  await t.test('throws on unusable durations instead of feeding ffmpeg garbage', () => {
    assert.throws(() => tailPadSeconds(NaN, 30), /bad VO duration/);
    assert.throws(() => tailPadSeconds(32, 0), /bad b-roll duration/);
    assert.throws(() => tailPadSeconds(-1, 30), /bad VO duration/);
  });
});
