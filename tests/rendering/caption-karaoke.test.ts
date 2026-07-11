import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srtToWordTimings, wordsToKaraokeAss, assTime, ffFilterPathEscape, type WordTiming } from '../../src/rendering/caption-burner.ts';

const SRT = `1
00:00:01,000 --> 00:00:03,000
Meet Tara today

2
00:00:03,500 --> 00:00:05,500
Ships production code
`;

test('srtToWordTimings', async (t) => {
  await t.test('yields one timing per word, in order, within each cue window', () => {
    const words = srtToWordTimings(SRT);
    assert.deepEqual(words.map((w) => w.text), ['Meet', 'Tara', 'today', 'Ships', 'production', 'code']);
    for (const w of words) assert.ok(w.end > w.start, `${w.text} has positive duration`);
    assert.equal(words[0].start, 1);
    assert.equal(words[2].end, 3);
    assert.equal(words[3].start, 3.5);
    assert.equal(words[5].end, 5.5);
  });

  await t.test('is monotonic and gap-free inside a cue', () => {
    const words = srtToWordTimings(SRT).slice(0, 3);
    assert.ok(Math.abs(words[0].end - words[1].start) < 1e-9);
    assert.ok(Math.abs(words[1].end - words[2].start) < 1e-9);
  });

  await t.test('longer words get proportionally more time', () => {
    const [ships, production] = srtToWordTimings(SRT).slice(3, 5);
    assert.ok(production.end - production.start > ships.end - ships.start);
  });

  await t.test('empty or malformed input yields no words', () => {
    assert.deepEqual(srtToWordTimings(''), []);
    assert.deepEqual(srtToWordTimings('not an srt at all'), []);
  });
});

test('assTime', async (t) => {
  await t.test('formats H:MM:SS.CC', () => {
    assert.equal(assTime(0), '0:00:00.00');
    assert.equal(assTime(61.239), '0:01:01.24');
    assert.equal(assTime(3661.5), '1:01:01.50');
  });
  await t.test('clamps negatives to zero', () => {
    assert.equal(assTime(-1), '0:00:00.00');
  });
});

test('wordsToKaraokeAss', async (t) => {
  const words: WordTiming[] = [
    { text: 'Meet', start: 1.0, end: 1.5 },
    { text: 'Tara', start: 1.5, end: 2.2 },
    { text: 'today', start: 2.2, end: 3.0 },
  ];

  await t.test('emits a resolution-matched header and one dialogue per line', () => {
    const ass = wordsToKaraokeAss(words, { width: 1920, height: 1080 });
    assert.match(ass, /PlayResX: 1920/);
    assert.match(ass, /PlayResY: 1080/);
    assert.match(ass, new RegExp(`Style: Karaoke,Helvetica,${Math.round(1080 * 0.055)},`));
    assert.equal(ass.split('\n').filter((l) => l.startsWith('Dialogue:')).length, 1);
    assert.match(ass, /Dialogue: 0,0:00:01\.00,0:00:03\.00,Karaoke/);
  });

  await t.test('\\k tags cover the whole line duration (gaps absorbed)', () => {
    const ass = wordsToKaraokeAss(words, { width: 1280, height: 720 });
    const ks = [...ass.matchAll(/\\k(\d+)/g)].map((m) => Number(m[1]));
    assert.equal(ks.length, 3);
    const total = ks.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 200) <= ks.length, `sum ${total} ≈ 200cs`);
  });

  await t.test('wraps into multiple dialogue lines at maxCharsPerLine', () => {
    const many: WordTiming[] = Array.from({ length: 8 }, (_, i) => ({
      text: `word${i}`, start: i, end: i + 1,
    }));
    const ass = wordsToKaraokeAss(many, { width: 1920, height: 1080, maxCharsPerLine: 12 });
    const dialogues = ass.split('\n').filter((l) => l.startsWith('Dialogue:'));
    assert.ok(dialogues.length >= 4, `expected wrapping, got ${dialogues.length} lines`);
  });

  await t.test('every karaoke duration is at least 1cs', () => {
    const tiny: WordTiming[] = [
      { text: 'a', start: 0, end: 0.001 },
      { text: 'b', start: 0.001, end: 0.002 },
    ];
    const ass = wordsToKaraokeAss(tiny, { width: 1920, height: 1080 });
    for (const m of ass.matchAll(/\\k(\d+)/g)) assert.ok(Number(m[1]) >= 1);
  });
});

test('ffFilterPathEscape', async (t) => {
  await t.test('escapes backslashes before quotes and colons', () => {
    assert.equal(ffFilterPathEscape("C:\\out\\o'brien.ass"), "C\\:\\\\out\\\\o\\'brien.ass");
  });
  await t.test('plain posix paths only get colon escaping', () => {
    assert.equal(ffFilterPathEscape('/tmp/captions.ass'), '/tmp/captions.ass');
    assert.equal(ffFilterPathEscape('/a:b/c.srt'), '/a\\:b/c.srt');
  });
});
