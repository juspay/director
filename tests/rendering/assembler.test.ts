import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../../src/rendering/assembler.ts';

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
