import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scriptToQueries,
  pickClipFile,
  FALLBACK_QUERIES,
  type StockClip,
} from '../../src/generators/stock-video.ts';

test('scriptToQueries', async (t) => {
  await t.test('returns exactly count queries in story order', () => {
    const script = 'Tara ships production code from Slack. Reviews land instantly. Deploys happen overnight while the team sleeps soundly.';
    const queries = scriptToQueries(script, 3);
    assert.equal(queries.length, 3);
    assert.match(queries[0], /tara/);
    assert.match(queries[2], /team|sleeps|soundly/);
  });

  await t.test('drops stopwords and short words, keeps at most 3 keywords', () => {
    const queries = scriptToQueries('The and of a is to in it we our new best amazing payment platform', 1);
    assert.equal(queries.length, 1);
    const words = queries[0].split(' ');
    assert.ok(words.length <= 3);
    assert.ok(!words.includes('the') && !words.includes('new'));
  });

  await t.test('never repeats a keyword within one query', () => {
    const [q] = scriptToQueries('rocket rocket rocket launch launch orbit', 1);
    assert.deepEqual(q.split(' '), ['rocket', 'launch', 'orbit']);
  });

  await t.test('empty script falls back to the generic rotation, still count entries', () => {
    const queries = scriptToQueries('', 4);
    assert.deepEqual(queries, FALLBACK_QUERIES.slice(0, 4));
  });

  await t.test('count is clamped to at least 1', () => {
    assert.equal(scriptToQueries('hello world', 0).length, 1);
  });
});

const clip = (id: number, duration: number, files: Array<[number, number, string?]>): StockClip => ({
  id,
  duration,
  video_files: files.map(([width, height, type], i) => ({
    link: `https://cdn.example/${id}-${i}.mp4`,
    width,
    height,
    file_type: type ?? 'video/mp4',
  })),
});

test('pickClipFile', async (t) => {
  await t.test('picks the smallest mp4 that still covers the target width', () => {
    const clips = [clip(1, 10, [[3840, 2160], [1280, 720], [1920, 1080]])];
    const file = pickClipFile(clips, 1920, 4);
    assert.equal(file?.width, 1920);
  });

  await t.test('skips clips shorter than the segment length', () => {
    const clips = [clip(1, 2, [[1920, 1080]]), clip(2, 10, [[1280, 720]])];
    const file = pickClipFile(clips, 1920, 4);
    assert.equal(file?.link, 'https://cdn.example/2-0.mp4');
  });

  await t.test('falls back to the widest file of a long-enough clip when none covers', () => {
    const clips = [clip(1, 10, [[640, 360], [1280, 720]])];
    assert.equal(pickClipFile(clips, 1920, 4)?.width, 1280);
  });

  await t.test('ignores non-mp4 files', () => {
    const clips = [clip(1, 10, [[1920, 1080, 'video/hls'], [1280, 720, 'video/mp4']])];
    assert.equal(pickClipFile(clips, 1280, 4)?.width, 1280);
  });

  await t.test('when every clip is too short, falls back to the widest mp4 anywhere', () => {
    const clips = [clip(1, 2, [[1280, 720]]), clip(2, 3, [[1920, 1080]])];
    assert.equal(pickClipFile(clips, 1280, 4)?.width, 1920);
  });

  await t.test('returns null when nothing is usable', () => {
    assert.equal(pickClipFile([], 1920, 4), null);
    assert.equal(pickClipFile([clip(1, 10, [[1920, 1080, 'video/hls']])], 1920, 4), null);
  });
});
