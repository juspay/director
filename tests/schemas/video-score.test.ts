import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VideoScoreSchema, VIDEO_SCORE_WEIGHTS } from '../../src/schemas/video-score.ts';

const validScore = {
  content_authenticity: 9,
  content_authenticity_justification: 'Real data and real Slack UI',
  visual_polish: 8,
  visual_polish_justification: 'Clean typography',
  motion_design: 9,
  motion_design_justification: 'Crisp springs',
  storytelling_arc: 8,
  storytelling_arc_justification: 'Clear hook and payoff',
  scene_transitions: 9,
  scene_transitions_justification: 'Smooth cuts',
  music_audio: 8,
  music_audio_justification: 'Balanced mix',
  production_value: 9,
  production_value_justification: 'Agency-level',
  // 9*.25 + 8*.20 + 9*.15 + 8*.15 + 9*.10 + 8*.10 + 9*.05 = 8.55 (was wrongly 8.6).
  weighted_overall: 8.55,
  top_improvements: ['tighten hook', 'boost bass'],
  deal_breakers: [],
};

const DIMENSIONS = [
  'content_authenticity', 'visual_polish', 'motion_design', 'storytelling_arc',
  'scene_transitions', 'music_audio', 'production_value',
] as const;

describe('VideoScoreSchema', () => {
  it('accepts a valid score object', () => {
    const result = VideoScoreSchema.parse(validScore);
    assert.equal(result.weighted_overall, 8.55);
    assert.equal(result.top_improvements.length, 2);
  });

  // The schema can't compute weighted_overall (it's a plain z.number()), so this
  // is the only place the cross-field invariant — weighted_overall equals the
  // dot product of the dimension scores and VIDEO_SCORE_WEIGHTS — is checked.
  // It caught the fixture's wrong 8.6 value.
  it('fixture weighted_overall matches the declared weighted-sum formula', () => {
    const computed = DIMENSIONS.reduce(
      (sum, d) => sum + (validScore[d] as number) * VIDEO_SCORE_WEIGHTS[d], 0,
    );
    assert.ok(
      Math.abs(computed - validScore.weighted_overall) < 1e-9,
      `weighted sum ${computed} != fixture weighted_overall ${validScore.weighted_overall}`,
    );
  });

  it('rejects missing required fields', () => {
    const { production_value: _omit, ...incomplete } = validScore;
    assert.throws(() => VideoScoreSchema.parse(incomplete));
  });

  it('rejects wrong types', () => {
    assert.throws(() =>
      VideoScoreSchema.parse({ ...validScore, content_authenticity: 'nine' }),
    );
  });

  it('accepts empty arrays for improvements and deal_breakers', () => {
    const result = VideoScoreSchema.parse({
      ...validScore,
      top_improvements: [],
      deal_breakers: [],
    });
    assert.deepEqual(result.top_improvements, []);
  });
});

describe('VIDEO_SCORE_WEIGHTS', () => {
  it('sums to 1.0 (valid weighted average)', () => {
    const sum = Object.values(VIDEO_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    // allow tiny floating-point drift
    assert.ok(Math.abs(sum - 1.0) < 1e-9, `weights sum to ${sum}, expected 1.0`);
  });

  it('covers all 7 scoring dimensions', () => {
    assert.equal(Object.keys(VIDEO_SCORE_WEIGHTS).length, 7);
  });

  it('assigns highest weight to content_authenticity', () => {
    const max = Math.max(...Object.values(VIDEO_SCORE_WEIGHTS));
    assert.equal(VIDEO_SCORE_WEIGHTS.content_authenticity, max);
  });
});
