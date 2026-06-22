import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHeyGenPayload, parseVideoStatus } from '../../src/avatar/heygen-direct.ts';

type Payload = {
  video_inputs: Array<{
    character: { type: string; avatar_id: string; avatar_style: string };
    voice: { type: string; voice_id: string; input_text: string };
  }>;
  dimension: { width: number; height: number };
};

test('buildHeyGenPayload', async (t) => {
  await t.test('builds an avatar+text payload with the given ids', () => {
    const p = buildHeyGenPayload({ avatarId: 'av1', voiceId: 'v1', text: 'Hi' }) as Payload;
    const input = p.video_inputs[0];
    assert.equal(input.character.type, 'avatar');
    assert.equal(input.character.avatar_id, 'av1');
    assert.equal(input.character.avatar_style, 'normal');
    assert.equal(input.voice.type, 'text');
    assert.equal(input.voice.voice_id, 'v1');
    assert.equal(input.voice.input_text, 'Hi');
    assert.deepEqual(p.dimension, { width: 1280, height: 720 });
  });

  await t.test('honors custom dimensions and avatar style', () => {
    const p = buildHeyGenPayload({ avatarId: 'a', voiceId: 'v', text: 't', width: 1920, height: 1080, avatarStyle: 'closeUp' }) as Payload;
    assert.deepEqual(p.dimension, { width: 1920, height: 1080 });
    assert.equal(p.video_inputs[0].character.avatar_style, 'closeUp');
  });
});

test('parseVideoStatus', async (t) => {
  await t.test('extracts a completed url', () => {
    const s = parseVideoStatus({ data: { status: 'completed', video_url: 'https://x/v.mp4' } });
    assert.equal(s.status, 'completed');
    assert.equal(s.url, 'https://x/v.mp4');
    assert.equal(s.error, null);
  });

  await t.test('reports processing with no url', () => {
    const s = parseVideoStatus({ data: { status: 'processing' } });
    assert.equal(s.status, 'processing');
    assert.equal(s.url, null);
  });

  await t.test('stringifies a structured error on failure', () => {
    const s = parseVideoStatus({ data: { status: 'failed', error: { code: 400, message: 'bad' } } });
    assert.equal(s.status, 'failed');
    assert.match(s.error ?? '', /bad/);
  });

  await t.test('defaults to unknown for an empty/garbage body', () => {
    assert.equal(parseVideoStatus(null).status, 'unknown');
    assert.equal(parseVideoStatus({}).status, 'unknown');
  });
});
