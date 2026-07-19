import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeProductionVerdict } from '../../src/scoring/production-verdict.ts';

const gatesAllPass = { gatesPassed: true, regressionPassed: true, fidelityPassed: true };

test('composeProductionVerdict — videoScore is advisory', async (t) => {
  await t.test('a single low videoScore does NOT flip a gate-clean cut to NEEDS WORK', () => {
    // The kling-3 case: gates clean, but one noisy draw came back 6.6.
    const v = composeProductionVerdict({ videoScore: 6.6, videoScoreSamples: 1, ...gatesAllPass });
    assert.equal(v.shipReady, true);
    assert.match(v.verdict, /^SHIP-READY/);
    assert.equal(v.advisory.length, 1);
    assert.match(v.advisory[0], /low visual score 6\.6.*advisory/);
  });

  await t.test('a high single videoScore ships with no advisory noise', () => {
    const v = composeProductionVerdict({ videoScore: 7.7, videoScoreSamples: 1, ...gatesAllPass });
    assert.equal(v.shipReady, true);
    assert.equal(v.verdict, 'SHIP-READY');
    assert.deepEqual(v.advisory, []);
  });

  await t.test('a CONFIDENT low (averaged ≥2 samples) does gate the verdict', () => {
    const v = composeProductionVerdict({ videoScore: 6.0, videoScoreSamples: 5, videoScoreSpread: 0.8, ...gatesAllPass });
    assert.equal(v.shipReady, false);
    assert.match(v.verdict, /^NEEDS WORK/);
  });

  await t.test('an averaged high score ships and reports the spread', () => {
    const v = composeProductionVerdict({ videoScore: 8.0, videoScoreSamples: 5, videoScoreSpread: 2.4, ...gatesAllPass });
    assert.equal(v.shipReady, true);
    assert.match(v.verdict, /mean of 5 \(spread ±1\.2\)/);
  });
});

test('composeProductionVerdict — gates own the ship decision', async (t) => {
  await t.test('a failed fidelity gate is NEEDS WORK even with a great score', () => {
    const v = composeProductionVerdict({ videoScore: 9.0, videoScoreSamples: 1, gatesPassed: true, regressionPassed: true, fidelityPassed: false });
    assert.equal(v.shipReady, false);
    assert.equal(v.verdict, 'NEEDS WORK');
  });

  await t.test('a failed content gate blocks; a measured regression blocks', () => {
    assert.equal(composeProductionVerdict({ videoScore: 8, gatesPassed: false, regressionPassed: true, fidelityPassed: true }).shipReady, false);
    assert.equal(composeProductionVerdict({ videoScore: 8, gatesPassed: true, regressionPassed: false, fidelityPassed: true }).shipReady, false);
  });

  await t.test('null gates never block (a signal that did not run is non-blocking)', () => {
    const v = composeProductionVerdict({ videoScore: 8, gatesPassed: null, regressionPassed: null, fidelityPassed: null });
    assert.equal(v.shipReady, true);
    assert.equal(v.verdict, 'SHIP-READY (no content gates)');
  });

  await t.test('no videoScore at all still yields a gate-based verdict', () => {
    const v = composeProductionVerdict({ videoScore: null, ...gatesAllPass });
    assert.equal(v.shipReady, true);
    assert.equal(v.videoScore, null);
    assert.deepEqual(v.advisory, []);
  });

  await t.test('NaN videoScore is treated as absent, not as 0', () => {
    const v = composeProductionVerdict({ videoScore: NaN, ...gatesAllPass });
    assert.equal(v.videoScore, null);
    assert.equal(v.shipReady, true);
    assert.deepEqual(v.advisory, []);
  });
});
