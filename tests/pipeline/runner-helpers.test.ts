import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDims, mapWithConcurrency, scriptToSrt, parseIntOr, parseFloatOr, resolveNarrationMode, pickCaptionText } from '../../src/pipeline/runner-helpers.ts';

test('parseIntOr / parseFloatOr', async (t) => {
  await t.test('parses a valid numeric string', () => {
    assert.equal(parseIntOr('42', 5), 42);
    assert.equal(parseFloatOr('9.5', 1), 9.5);
  });
  await t.test('falls back when missing or non-numeric (no NaN leaks)', () => {
    assert.equal(parseIntOr(undefined, 5), 5);
    assert.equal(parseIntOr('foo', 5), 5);
    assert.equal(parseFloatOr('', 9), 9);
    assert.equal(parseFloatOr('abc', 9), 9);
  });
  await t.test('honors an explicit zero override (not the fallback)', () => {
    assert.equal(parseIntOr('0', 5), 0);
    assert.equal(parseFloatOr('0', 9), 0);
  });
});

test('resolveNarrationMode', async (t) => {
  await t.test("only explicit 'narrator' switches; everything else stays 'script'", () => {
    assert.equal(resolveNarrationMode('narrator'), 'narrator');
    assert.equal(resolveNarrationMode('NARRATOR'), 'narrator');
    assert.equal(resolveNarrationMode('  narrator '), 'narrator');
    assert.equal(resolveNarrationMode('script'), 'script');
    assert.equal(resolveNarrationMode(undefined), 'script');
    assert.equal(resolveNarrationMode('typo'), 'script');
  });
});

test('pickCaptionText', async (t) => {
  await t.test('prefers generated narration when present', () => {
    assert.equal(pickCaptionText('Spoken narration.', 'The brief.'), 'Spoken narration.');
  });
  await t.test('falls back to the script when narration is empty/whitespace/undefined', () => {
    assert.equal(pickCaptionText('', 'The brief.'), 'The brief.');
    assert.equal(pickCaptionText('   ', 'The brief.'), 'The brief.');
    assert.equal(pickCaptionText(undefined, 'The brief.'), 'The brief.');
  });
});

test('resolveDims', async (t) => {
  await t.test('720p → 1280×720', () => {
    assert.deepEqual(resolveDims('720p'), { veo: '720p', width: 1280, height: 720 });
  });
  await t.test('1080p → 1920×1080', () => {
    assert.deepEqual(resolveDims('1080p'), { veo: '1080p', width: 1920, height: 1080 });
  });
  await t.test('undefined / unknown defaults to 1080p', () => {
    assert.deepEqual(resolveDims(undefined), { veo: '1080p', width: 1920, height: 1080 });
    assert.deepEqual(resolveDims('4k'), { veo: '1080p', width: 1920, height: 1080 });
  });
});

test('mapWithConcurrency', async (t) => {
  await t.test('preserves input order regardless of completion order', async () => {
    const out = await mapWithConcurrency([10, 1, 5, 2], 2, async (n) => {
      await new Promise((r) => setTimeout(r, n));
      return n * 2;
    });
    assert.deepEqual(out, [20, 2, 10, 4]);
  });

  await t.test('runs exactly `limit` in parallel — never more, and genuinely concurrent (not serial)', async () => {
    let inFlight = 0, peak = 0;
    // Gate every task on a shared barrier so serial execution would deadlock the
    // assertion (peak could never reach 3 if tasks ran one-at-a-time). Releasing
    // only after a tick lets the pool fill to the limit first.
    await mapWithConcurrency(Array.from({ length: 12 }, (_, i) => i), 3, async (i) => {
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--; return i;
    });
    // Upper bound: never exceeds the limit. Lower bound: actually reaches it
    // (a serial implementation would peak at 1 and fail this).
    assert.equal(peak, 3, `peak in-flight should be exactly 3, got ${peak}`);
  });

  await t.test('limit larger than item count fans out to item count, not more', async () => {
    let inFlight = 0, peak = 0;
    await mapWithConcurrency([0, 1, 2], 10, async (i) => {
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--; return i;
    });
    assert.equal(peak, 3, `peak should equal item count (3), got ${peak}`);
  });

  await t.test('runs every item exactly once', async () => {
    const seen: number[] = [];
    const out = await mapWithConcurrency([0, 1, 2, 3, 4], 10, async (n) => { seen.push(n); return n; });
    assert.deepEqual(out, [0, 1, 2, 3, 4]);
    assert.deepEqual([...seen].sort((a, b) => a - b), [0, 1, 2, 3, 4]);
  });

  await t.test('empty input → empty output', async () => {
    assert.deepEqual(await mapWithConcurrency([], 3, async (x) => x), []);
  });
});

test('scriptToSrt', async (t) => {
  const script = 'Hello world. This is a short product narration with several words. Final line here.';

  await t.test('produces valid, well-formed SRT cues', () => {
    const srt = scriptToSrt(script, 10);
    const blocks = srt.trim().split(/\n\n+/);
    assert.ok(blocks.length >= 2, 'should produce multiple cues');
    // each block: index line, timecode line, text line
    blocks.forEach((b, i) => {
      const lines = b.split('\n');
      assert.equal(Number(lines[0]), i + 1, 'sequential index');
      assert.match(lines[1], /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/, 'timecode format');
      assert.ok(lines.slice(2).join(' ').length > 0, 'non-empty text');
    });
  });

  await t.test('breaks at sentence boundaries, not greedy mid-phrase chunks', () => {
    const srt = scriptToSrt('Meet Aether. No screen. No buzzing now.', 10);
    const texts = srt.trim().split(/\n\n+/).map((b) => b.split('\n').slice(2).join(' '));
    assert.equal(texts[0], 'Meet Aether.', 'first cue is the complete first sentence');
    for (const ct of texts) assert.ok(ct.split(/\s+/).length <= 7, `cue "${ct}" within word cap`);
  });

  await t.test('respects a custom word cap', () => {
    const srt = scriptToSrt('one two three four five six seven eight nine ten', 10, 4);
    const texts = srt.trim().split(/\n\n+/).map((b) => b.split('\n').slice(2).join(' '));
    for (const ct of texts) assert.ok(ct.split(/\s+/).length <= 4, `cue "${ct}" within cap 4`);
  });

  await t.test('all script words are preserved in order', () => {
    const srt = scriptToSrt(script, 10);
    const cueText = srt.trim().split(/\n\n+/).map((b) => b.split('\n').slice(2).join(' ')).join(' ');
    assert.equal(cueText.replace(/\s+/g, ' ').trim(), script.replace(/\s+/g, ' ').trim());
  });

  await t.test('timestamps are monotonic and within [0, duration]', () => {
    const dur = 8;
    const srt = scriptToSrt(script, dur);
    const tc = (s: string) => {
      const m = s.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g)!.map((p) => {
        const [, h, mi, se, ms] = p.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)!;
        return Number(h) * 3600 + Number(mi) * 60 + Number(se) + Number(ms) / 1000;
      });
      return m;
    };
    let prevEnd = 0;
    srt.trim().split(/\n\n+/).forEach((b) => {
      const [start, end] = tc(b.split('\n')[1]);
      assert.ok(start >= 0 && end <= dur + 0.01, `cue within [0,${dur}]`);
      assert.ok(end >= start, 'end ≥ start');
      assert.ok(start >= prevEnd - 0.001, 'non-overlapping / monotonic');
      prevEnd = end;
    });
  });

  await t.test('handles a single short script', () => {
    const srt = scriptToSrt('Hi there.', 3);
    assert.ok(srt.includes('Hi there.'));
    assert.match(srt, /^1\n/);
  });

  await t.test('never inverts timestamps for tiny or zero durations', () => {
    for (const dur of [0, 0.05, 0.08, 0.1]) {
      const srt = scriptToSrt('One two three. Four five six. Seven eight nine.', dur);
      srt.trim().split(/\n\n+/).filter(Boolean).forEach((b) => {
        const [a, z] = b.split('\n')[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g)!.map((p) => {
          const [, h, m, s, ms] = p.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)!;
          return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
        });
        assert.ok(z >= a, `dur=${dur}: end ${z} must be ≥ start ${a}`);
      });
    }
  });

  await t.test('empty script → empty SRT', () => {
    assert.equal(scriptToSrt('   ', 5), '');
  });

  // Regression: a non-finite duration (NaN from a failed probe, Infinity) used to
  // produce "NaN:NaN:NaN,NaN" timestamps. Fail loudly instead.
  await t.test('throws on a non-finite duration', () => {
    assert.throws(() => scriptToSrt('one two three.', NaN), /must be finite/);
    assert.throws(() => scriptToSrt('one two three.', Infinity), /must be finite/);
  });
});
