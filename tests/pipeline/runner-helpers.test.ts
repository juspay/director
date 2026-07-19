import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDims, mapWithConcurrency, scriptToSrt, parseIntOr, parseFloatOr, resolveNarrationMode, pickCaptionText, completedPhaseCount, isCompletedResult, resolveVideoTier, resolveReplicateRoute, clampSegLen, targetShotCount, parseShotList, parseVariants, pruneForRegen, pruneForBrandChange, parseFormats, formatToDims, formatSuffix, brollCoverageOk } from '../../src/pipeline/runner-helpers.ts';

const PHASE_NAMES = ['voiceover', 'avatar', 'broll', 'music', 'render', 'assembly', 'captions'];

test('completedPhaseCount', async (t) => {
  await t.test('counts only real phases, ignoring post-pipeline keys', () => {
    const results = { voiceover: {}, broll: {}, scoring: {}, cost: {}, 'quality-gates': {} };
    assert.equal(completedPhaseCount(results, PHASE_NAMES), 2);
  });
  await t.test('is 0 for a fresh run (drives the resume check)', () => {
    assert.equal(completedPhaseCount({}, PHASE_NAMES), 0);
    assert.equal(completedPhaseCount({ scoring: {}, cost: {} }, PHASE_NAMES), 0);
  });
  await t.test('counts every phase when all are done', () => {
    const all = Object.fromEntries(PHASE_NAMES.map((n) => [n, {}]));
    assert.equal(completedPhaseCount(all, PHASE_NAMES), PHASE_NAMES.length);
  });
  await t.test('accepts a Set of names as well as an array', () => {
    assert.equal(completedPhaseCount({ voiceover: {}, music: {} }, new Set(PHASE_NAMES)), 2);
  });
});

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

test('resolveVideoTier', async (t) => {
  await t.test('hero tier keeps the configured generator, no model override', () => {
    assert.deepEqual(resolveVideoTier('hero', {}, 'vertex'), { gen: 'vertex' });
    assert.deepEqual(resolveVideoTier('HERO', { BROLL_DRAFT_GENERATOR: 'kling' }, 'runway'), { gen: 'runway' });
  });

  await t.test('draft tier routes to BROLL_DRAFT_GENERATOR (lowercased)', () => {
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'Wan-Alpha' }, 'vertex'),
      { gen: 'wan-alpha', model: undefined },
    );
  });

  await t.test('draft tier carries an explicit model override', () => {
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'replicate', BROLL_DRAFT_MODEL: 'lightricks/ltx-video' }, 'vertex'),
      { gen: 'replicate', model: 'lightricks/ltx-video' },
    );
  });

  await t.test('draft tier without a configured generator throws (spend decisions are explicit)', () => {
    assert.throws(() => resolveVideoTier('draft', {}, 'vertex'), /BROLL_DRAFT_GENERATOR/);
    assert.throws(() => resolveVideoTier('draft', { BROLL_DRAFT_MODEL: 'x/y' }, 'vertex'), /BROLL_DRAFT_GENERATOR/);
  });

  await t.test('unknown tier values throw instead of silently running hero', () => {
    assert.throws(() => resolveVideoTier('cheap', {}, 'vertex'), /unknown tier 'cheap'/);
  });

  await t.test('empty BROLL_DRAFT_MODEL normalizes to undefined', () => {
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'kling', BROLL_DRAFT_MODEL: '' }, 'vertex'),
      { gen: 'kling', model: undefined },
    );
  });
});

test('resolveVideoTier validates the draft generator against known aliases', async (t) => {
  const KNOWN = ['vertex', 'veo', 'kling', 'runway', 'replicate', 'wan-2.1', 'hailuo-fast', 'wan-2.7', 'kling-replicate'];
  await t.test('known draft generators pass', () => {
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'wan-2.1' }, 'vertex', KNOWN),
      { gen: 'wan-2.1', model: undefined },
    );
  });
  await t.test('the W-P4-TIER2 pilot aliases resolve as draft generators', () => {
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'hailuo-fast' }, 'vertex', KNOWN),
      { gen: 'hailuo-fast', model: undefined },
    );
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'Wan-2.7' }, 'vertex', KNOWN),
      { gen: 'wan-2.7', model: undefined },
    );
    assert.deepEqual(
      resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'kling-replicate' }, 'vertex', KNOWN),
      { gen: 'kling-replicate', model: undefined },
    );
  });
  await t.test('unknown draft generators throw instead of silently routing to vertex', () => {
    assert.throws(
      () => resolveVideoTier('draft', { BROLL_DRAFT_GENERATOR: 'ltx' }, 'vertex', KNOWN),
      /'ltx' is not a known generator/,
    );
  });
  await t.test('hero tier never validates (fallback gen is the caller-configured one)', () => {
    assert.deepEqual(resolveVideoTier('hero', {}, 'vertex', KNOWN), { gen: 'vertex' });
  });
});

test('resolveReplicateRoute', async (t) => {
  const TABLE = {
    'wan-2.1': { model: 'wavespeedai/wan-2.1-i2v-480p' },
    'hailuo-fast': { model: 'minimax/hailuo-2.3-fast', imageInputKey: 'first_frame_image' },
  };
  await t.test('BROLL_DRAFT_MODEL alias resolves to the slug, carrying its image key', () => {
    assert.deepEqual(resolveReplicateRoute('hailuo-fast', 'replicate', TABLE, undefined), {
      model: 'minimax/hailuo-2.3-fast',
      imageInputKey: 'first_frame_image',
    });
    // The live 404 regression: 'wan-2.1' typed as the draft model must never
    // reach the Replicate API verbatim.
    assert.deepEqual(resolveReplicateRoute('wan-2.1', 'replicate', TABLE, undefined), {
      model: 'wavespeedai/wan-2.1-i2v-480p',
      imageInputKey: undefined,
    });
  });
  await t.test('raw owner/name slug passes through verbatim', () => {
    assert.deepEqual(resolveReplicateRoute('lightricks/ltx-video', 'replicate', TABLE, undefined), {
      model: 'lightricks/ltx-video',
      imageInputKey: undefined,
    });
  });
  await t.test('BROLL_DRAFT_IMAGE_INPUT_KEY overrides the table image key', () => {
    assert.deepEqual(resolveReplicateRoute('hailuo-fast', 'replicate', TABLE, 'start_image'), {
      model: 'minimax/hailuo-2.3-fast',
      imageInputKey: 'start_image',
    });
    assert.deepEqual(resolveReplicateRoute('lightricks/ltx-video', 'replicate', TABLE, 'first_frame'), {
      model: 'lightricks/ltx-video',
      imageInputKey: 'first_frame',
    });
  });
  await t.test('no draft model: the generator alias picks the route from the table', () => {
    assert.deepEqual(resolveReplicateRoute(undefined, 'wan-2.1', TABLE, undefined), {
      model: 'wavespeedai/wan-2.1-i2v-480p',
    });
    assert.equal(resolveReplicateRoute(undefined, 'veo', TABLE, undefined), undefined);
  });
});

test('isCompletedResult', async (t) => {
  await t.test('real results count, dry-run placeholders and empties do not', () => {
    assert.equal(isCompletedResult({ status: 'complete' }), true);
    assert.equal(isCompletedResult({ path: 'output/broll.mp4' }), true);
    assert.equal(isCompletedResult({ status: 'dry-run' }), false);
    assert.equal(isCompletedResult(undefined), false);
    assert.equal(isCompletedResult(null), false);
  });
  await t.test('completedPhaseCount ignores dry-run placeholders', () => {
    const results = {
      voiceover: { status: 'dry-run' },
      broll: { status: 'complete' },
      scoring: { weighted_overall: 0.9 },
    };
    // The live regression: a --dry-run left {status:'dry-run'} for every phase
    // and the next real run resumed straight past all of them.
    assert.equal(completedPhaseCount(results, ['voiceover', 'broll', 'music']), 1);
    assert.equal(completedPhaseCount({ voiceover: { status: 'dry-run' } }, ['voiceover']), 0);
  });
});

test('clampSegLen', async (t) => {
  await t.test('clamps up to the nearest allowed duration', () => {
    // The live 422s: kling accepts 5|10, hailuo 6|10, pipeline default is 4.
    assert.equal(clampSegLen(4, [5, 10]), 5);
    assert.equal(clampSegLen(4, [6, 10]), 6);
    assert.equal(clampSegLen(8, [5, 10]), 10);
    assert.equal(clampSegLen(6, [6, 10]), 6);
  });
  await t.test('requests above the enum fall back to the largest allowed', () => {
    assert.equal(clampSegLen(12, [5, 10]), 10);
  });
  await t.test('models without an enum pass through untouched', () => {
    assert.equal(clampSegLen(4, undefined), 4);
    assert.equal(clampSegLen(4, []), 4);
  });
});

test('resolveReplicateRoute carries allowedLengths', async (t) => {
  const TABLE = {
    'kling-replicate': { model: 'kwaivgi/kling-v2.1', imageInputKey: 'start_image', allowedLengths: [5, 10] },
  };
  await t.test('through the draft-model alias path', () => {
    assert.deepEqual(resolveReplicateRoute('kling-replicate', 'replicate', TABLE, undefined), {
      model: 'kwaivgi/kling-v2.1',
      imageInputKey: 'start_image',
      allowedLengths: [5, 10],
    });
  });
  await t.test('through the generator-alias path', () => {
    assert.deepEqual(resolveReplicateRoute(undefined, 'kling-replicate', TABLE, undefined)?.allowedLengths, [5, 10]);
  });
  await t.test('raw slugs have no enum', () => {
    assert.equal(resolveReplicateRoute('x/y', 'replicate', TABLE, undefined)?.allowedLengths, undefined);
  });
});

test('parseFormats', async (t) => {
  await t.test('undefined/blank defaults to 16:9 only', () => {
    assert.deepEqual(parseFormats(undefined), ['16:9']);
    assert.deepEqual(parseFormats(''), ['16:9']);
    assert.deepEqual(parseFormats('   '), ['16:9']);
  });
  await t.test('parses a valid comma-separated list', () => {
    assert.deepEqual(parseFormats('16:9,9:16,1:1'), ['16:9', '9:16', '1:1']);
    assert.deepEqual(parseFormats('9:16'), ['9:16']);
  });
  await t.test('trims whitespace around tokens', () => {
    assert.deepEqual(parseFormats(' 16:9 , 9:16 '), ['16:9', '9:16']);
  });
  await t.test('dedupes repeated formats, preserving first-seen order', () => {
    assert.deepEqual(parseFormats('9:16,16:9,9:16'), ['9:16', '16:9']);
  });
  await t.test('an unrecognized format throws a clear error', () => {
    assert.throws(() => parseFormats('16:9,vertical'), /unknown format 'vertical'/);
    assert.throws(() => parseFormats('4:3'), /unknown format '4:3'/);
  });
});

test('formatToDims', async (t) => {
  await t.test('16:9', () => {
    assert.deepEqual(formatToDims('16:9', '1080p'), { width: 1920, height: 1080 });
    assert.deepEqual(formatToDims('16:9', '720p'), { width: 1280, height: 720 });
  });
  await t.test('9:16', () => {
    assert.deepEqual(formatToDims('9:16', '1080p'), { width: 1080, height: 1920 });
    assert.deepEqual(formatToDims('9:16', '720p'), { width: 720, height: 1280 });
  });
  await t.test('1:1', () => {
    assert.deepEqual(formatToDims('1:1', '1080p'), { width: 1080, height: 1080 });
    assert.deepEqual(formatToDims('1:1', '720p'), { width: 720, height: 720 });
  });
});

test('formatSuffix', async (t) => {
  await t.test('replaces the colon for a filename-safe suffix', () => {
    assert.equal(formatSuffix('9:16'), '9x16');
    assert.equal(formatSuffix('1:1'), '1x1');
    assert.equal(formatSuffix('16:9'), '16x9');
  });
});

test('targetShotCount', async (t) => {
  await t.test('rounds UP so total b-roll covers the VO (live regression: 32.256s VO @ 5s segments)', () => {
    // Math.round gave 6 shots = 30s < 32.256s VO -> 2.07s -stream_loop wrap
    // that replayed the opening hook under the closing CTA.
    assert.equal(targetShotCount(32.256, 5), 7);
  });
  await t.test('exact multiples are unchanged', () => {
    assert.equal(targetShotCount(32, 4), 8);
    assert.equal(targetShotCount(30, 5), 6);
  });
  await t.test('floor of 3 shots', () => {
    assert.equal(targetShotCount(4.2, 5), 3);
  });
  await t.test('fallback when VO duration is unknown', () => {
    assert.equal(targetShotCount(0, 5), 8);
    assert.equal(targetShotCount(NaN, 5), 8);
    assert.equal(targetShotCount(30, 0), 8);
  });
});

test('parseShotList', async (t) => {
  await t.test('parses, dedupes, sorts', () => {
    assert.deepEqual(parseShotList('5, 2,2,0'), [0, 2, 5]);
    assert.deepEqual(parseShotList('3'), [3]);
  });
  await t.test('throws on junk instead of silently regenerating nothing', () => {
    assert.throws(() => parseShotList('two'), /not a non-negative shot index/);
    assert.throws(() => parseShotList('-1'), /not a non-negative shot index/);
    assert.throws(() => parseShotList('1.5'), /not a non-negative shot index/);
  });
});

test('parseVariants', async (t) => {
  await t.test('parses and dedupes tiers', () => {
    assert.deepEqual(parseVariants('hero, draft'), ['hero', 'draft']);
    assert.deepEqual(parseVariants('hero,draft,hero'), ['hero', 'draft']);
  });
  await t.test('requires at least two distinct tiers', () => {
    assert.throws(() => parseVariants('hero'), /at least two distinct tiers/);
    assert.throws(() => parseVariants('hero,hero'), /at least two distinct tiers/);
  });
});

test('pruneForRegen', async (t) => {
  const results = {
    voiceover: { ok: true }, avatar: { ok: true }, music: { ok: true },
    broll: { ok: true }, assembly: 'final.mp4', captions: 'final_captioned.mp4',
    scoring: {}, 'quality-gates': {}, 'regression-gate': {}, 'fidelity-gate': {}, 'production-verdict': {}, cost: {},
  };
  await t.test('drops b-roll and everything downstream, keeps paid upstream phases', () => {
    const pruned = pruneForRegen(results);
    assert.deepEqual(Object.keys(pruned).sort(), ['avatar', 'cost', 'music', 'voiceover']);
  });
  await t.test('does not mutate the input', () => {
    pruneForRegen(results);
    assert.ok('broll' in results && 'assembly' in results);
  });
});

test('pruneForBrandChange', async (t) => {
  const results = {
    voiceover: { ok: true }, avatar: { ok: true }, music: { ok: true },
    broll: { ok: true }, assembly: 'final.mp4', captions: 'final_captioned.mp4',
    scoring: {}, cost: {},
  };
  await t.test('drops only assembly + captions — b-roll survives so re-branding never re-pays for video', () => {
    const pruned = pruneForBrandChange(results);
    assert.deepEqual(Object.keys(pruned).sort(), ['avatar', 'broll', 'cost', 'music', 'scoring', 'voiceover']);
    assert.ok(!('assembly' in pruned) && !('captions' in pruned));
  });
  await t.test('does not mutate the input', () => {
    pruneForBrandChange(results);
    assert.ok('assembly' in results && 'captions' in results);
  });
});

test('kling-3 routes to current-generation Kling with start_image and no duration enum', () => {
  const TABLE = {
    'kling-3': { model: 'kwaivgi/kling-v3-video', imageInputKey: 'start_image' },
  };
  assert.deepEqual(resolveReplicateRoute('kling-3', 'replicate', TABLE, undefined), {
    model: 'kwaivgi/kling-v3-video',
    imageInputKey: 'start_image',
  });
});

test('brollCoverageOk', async (t) => {
  await t.test('live B8 hero case: 24.0s b-roll under a 32.26s VO fails', () => {
    assert.equal(brollCoverageOk(24.0, 32.26), false);
  });
  await t.test('the draft leg (30.2/32.26 = 93.6%) passes', () => {
    assert.equal(brollCoverageOk(30.2, 32.26), true);
  });
  await t.test('unknown durations stay null — never-ran must not block', () => {
    assert.equal(brollCoverageOk(0, 32), null);
    assert.equal(brollCoverageOk(NaN, 32), null);
  });
});
