import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateJudgeScores } from '../../src/scoring/multi-judge-scorer.ts';
import type { VideoScore } from '../../src/schemas/video-score.ts';

const mkScore = (
  overall: number,
  dims: Partial<Record<string, number>> = {},
  improvements: string[] = [],
  dealBreakers: string[] = [],
): VideoScore => ({
  content_authenticity: dims.content_authenticity ?? overall,
  content_authenticity_justification: 'x',
  visual_polish: dims.visual_polish ?? overall,
  visual_polish_justification: 'x',
  motion_design: dims.motion_design ?? overall,
  motion_design_justification: 'x',
  storytelling_arc: dims.storytelling_arc ?? overall,
  storytelling_arc_justification: 'x',
  scene_transitions: dims.scene_transitions ?? overall,
  scene_transitions_justification: 'x',
  music_audio: dims.music_audio ?? overall,
  music_audio_justification: 'x',
  production_value: dims.production_value ?? overall,
  production_value_justification: 'x',
  weighted_overall: overall,
  top_improvements: improvements,
  deal_breakers: dealBreakers,
});

test('aggregateJudgeScores', async (t) => {
  await t.test('consensus is the median (robust to one outlier judge)', () => {
    const c = aggregateJudgeScores([
      { model: 'a', score: mkScore(8) },
      { model: 'b', score: mkScore(7.5) },
      { model: 'c', score: mkScore(3) }, // outlier — would drag the mean to ~6.17
    ]);
    assert.equal(c.consensusOverall, 7.5, 'median ignores the outlier');
    assert.equal(c.meanOverall, 6.17);
    assert.equal(c.judges.length, 3);
  });

  await t.test('even judge count averages the two middle values', () => {
    const c = aggregateJudgeScores([
      { model: 'a', score: mkScore(8) },
      { model: 'b', score: mkScore(7) },
    ]);
    assert.equal(c.consensusOverall, 7.5);
    assert.equal(c.meanOverall, 7.5);
  });

  await t.test('agreement label is driven by variance', () => {
    assert.equal(aggregateJudgeScores([{ model: 'a', score: mkScore(8) }, { model: 'b', score: mkScore(8.3) }]).agreement, 'strong');   // var 0.3
    assert.equal(aggregateJudgeScores([{ model: 'a', score: mkScore(8) }, { model: 'b', score: mkScore(9) }]).agreement, 'moderate');  // var 1.0
    assert.equal(aggregateJudgeScores([{ model: 'a', score: mkScore(6) }, { model: 'b', score: mkScore(8.5) }]).agreement, 'weak');    // var 2.5
  });

  await t.test('per-dimension consensus is a median', () => {
    const c = aggregateJudgeScores([
      { model: 'a', score: mkScore(8, { motion_design: 4 }) },
      { model: 'b', score: mkScore(8, { motion_design: 6 }) },
      { model: 'c', score: mkScore(8, { motion_design: 8 }) },
    ]);
    assert.equal(c.dimensions.motion_design, 6);
  });

  await t.test('dedups improvements (case-insensitive); unions deal-breakers', () => {
    const c = aggregateJudgeScores([
      { model: 'a', score: mkScore(7, {}, ['Add motion', 'Fix audio'], ['Logo wrong']) },
      { model: 'b', score: mkScore(7, {}, ['add motion', 'Brighten'], []) },
    ]);
    assert.deepEqual(c.topImprovements, ['Add motion', 'Fix audio', 'Brighten']);
    assert.deepEqual(c.dealBreakers, ['Logo wrong']);
  });

  await t.test('single judge → consensus equals that judge, zero variance, strong', () => {
    const c = aggregateJudgeScores([{ model: 'solo', score: mkScore(7.8) }]);
    assert.equal(c.consensusOverall, 7.8);
    assert.equal(c.variance, 0);
    assert.equal(c.agreement, 'strong');
    assert.equal(c.judges[0].model, 'solo');
  });

  // Regression: an empty panel must throw, not return {0, 'strong'} — that would
  // let a total judge failure masquerade as a unanimous zero to a quality gate.
  await t.test('empty panel throws instead of returning a misleading zero', () => {
    assert.throws(() => aggregateJudgeScores([]), /empty judge panel/);
  });
});
