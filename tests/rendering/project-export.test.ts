import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFcpXml, toFcpTime, type ProjectSpec } from '../../src/rendering/project-export.ts';

const clip = (name: string, durationSec: number, hasAudio = false) => ({
  name, path: `/runs/demo/${name}`, durationSec, hasAudio,
});

const spec = (over: Partial<ProjectSpec> = {}): ProjectSpec => ({
  name: 'demo-run',
  width: 1920, height: 1080, fps: 30,
  video: [clip('seg-0.mp4', 4), clip('seg-1.mp4', 4)],
  voiceover: clip('voiceover.mp3', 27.4, true),
  music: clip('music.mp3', 30, true),
  ...over,
});

test('toFcpTime', async (t) => {
  await t.test('snaps to whole frames over an fps timescale', () => {
    assert.equal(toFcpTime(3, 30), '90/30s');
    assert.equal(toFcpTime(27.4, 30), '822/30s');
    assert.equal(toFcpTime(4.017, 30), '121/30s');
  });
  await t.test('clamps negatives to zero frames', () => {
    assert.equal(toFcpTime(-2, 30), '0/30s');
  });
});

test('buildFcpXml', async (t) => {
  await t.test('declares the format and one asset per clip', () => {
    const xml = buildFcpXml(spec());
    assert.match(xml, /<format id="r1" name="FFVideoFormat1080p30" frameDuration="1\/30s" width="1920" height="1080"\/>/);
    assert.equal([...xml.matchAll(/<asset id=/g)].length, 4);
    assert.match(xml, /<media-rep kind="original-media" src="file:\/\/\/runs\/demo\/seg-0\.mp4"\/>/);
  });

  await t.test('video clips are sequential on the spine, audio connected on lanes -1/-2', () => {
    const xml = buildFcpXml(spec());
    assert.match(xml, /<asset-clip ref="v1" offset="0\/30s" duration="120\/30s"/);
    assert.match(xml, /<asset-clip ref="v2" offset="120\/30s" duration="120\/30s"/);
    assert.match(xml, /<asset-clip ref="vo" lane="-1" offset="0s"/);
    assert.match(xml, /<asset-clip ref="mus" lane="-2" offset="0s"/);
    // connected audio nests inside the FIRST spine clip only
    const firstClip = xml.slice(xml.indexOf('ref="v1"'), xml.indexOf('ref="v2"'));
    assert.ok(firstClip.includes('lane="-1"'), 'voiceover rides the first clip');
  });

  await t.test('sequence duration sums the frame-snapped clip durations', () => {
    const xml = buildFcpXml(spec({ video: [clip('a.mp4', 4.017), clip('b.mp4', 3.99)] }));
    // 121 + 120 frames
    assert.match(xml, /<sequence format="r1" duration="241\/30s"/);
  });

  await t.test('omits audio lanes when the run has no voiceover/music', () => {
    const xml = buildFcpXml(spec({ voiceover: undefined, music: undefined }));
    assert.ok(!xml.includes('lane='));
    assert.equal([...xml.matchAll(/<asset id=/g)].length, 2);
  });

  await t.test('escapes XML-unsafe names and paths', () => {
    const xml = buildFcpXml(spec({
      name: 'A&B <promo>',
      video: [{ name: 'cut & trim.mp4', path: '/runs/a b/cut & trim.mp4', durationSec: 2, hasAudio: false }],
      voiceover: undefined, music: undefined,
    }));
    assert.match(xml, /<event name="A&amp;B &lt;promo&gt;">/);
    assert.match(xml, /name="cut &amp; trim\.mp4"/);
    assert.match(xml, /src="file:\/\/\/runs\/a%20b\/cut%20&amp;%20trim\.mp4"/);
    assert.ok(!/<[^>]*&(?!amp;|lt;|gt;|quot;|#)/.test(xml), 'no raw ampersands inside tags');
  });
});
