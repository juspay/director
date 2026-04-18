import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as config from '../../src/pipeline/config.ts';

describe('pipeline/config', () => {
  it('exports the 7 pipeline phases in order', () => {
    assert.deepEqual(config.PIPELINE_PHASES, [
      'voiceover',
      'avatar',
      'broll',
      'music',
      'render',
      'assembly',
      'captions',
    ]);
  });

  it('exposes numeric config parsed from env or defaults', () => {
    assert.equal(typeof config.DELAY_BETWEEN_REQUESTS_MS, 'number');
    assert.equal(typeof config.MAX_RETRIES, 'number');
    assert.equal(typeof config.VIDEO_SCORE_TARGET, 'number');
    assert.ok(config.VIDEO_SCORE_TARGET > 0 && config.VIDEO_SCORE_TARGET <= 10);
  });

  it('exposes SCORING_TIERS with dev and official tiers', () => {
    assert.ok(config.SCORING_TIERS.dev);
    assert.ok(config.SCORING_TIERS.official);
    assert.ok(config.SCORING_TIERS.official.runs >= config.SCORING_TIERS.dev.runs);
  });

  it('exposes absolute directory paths', () => {
    assert.ok(config.PROJECT_DIR.startsWith('/'));
    assert.ok(config.OUTPUT_DIR.startsWith(config.PROJECT_DIR));
    assert.ok(config.STATE_DIR.startsWith(config.PROJECT_DIR));
    assert.ok(config.LIBRARY_DIR.startsWith(config.PROJECT_DIR));
  });

  it('provides product context with defaults', () => {
    assert.ok(config.PRODUCT_NAME);
    assert.ok(config.PRODUCT_DESCRIPTION);
  });

  it('CONFIG object contains all key runtime values', () => {
    for (const key of [
      'MODEL',
      'DELAY_BETWEEN_REQUESTS_MS',
      'MAX_RETRIES',
      'VIDEO_SCORE_TARGET',
    ] as const) {
      assert.ok(key in config.CONFIG, `CONFIG missing ${key}`);
    }
  });
});
