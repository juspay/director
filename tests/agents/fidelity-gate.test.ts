import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFidelityPrompt, buildStoryboardContext, fidelityPassed } from '../../src/agents/fidelity-gate.ts';
import type { ShotPlan } from '../../src/schemas/shot-plan.ts';
import { FidelityReportSchema, type FidelityReport } from '../../src/schemas/fidelity.ts';
import { frameDiffScore } from '../../src/rendering/tail-check.ts';

const dim = (score: number) => ({ score, notes: 'n' });
const report = (over: Partial<FidelityReport> = {}): FidelityReport => ({
  product_identity: dim(5), brand_assets: dim(5), cta_ending: dim(5),
  motion_artifacts: dim(4), script_alignment: dim(4),
  passed: true, failures: [], ...over,
});

test('buildFidelityPrompt', async (t) => {
  await t.test('carries the three CRITICAL dimensions and the resolution guard', () => {
    const p = buildFidelityPrompt();
    assert.match(p, /product_identity \(CRITICAL\)/);
    assert.match(p, /brand_assets \(CRITICAL\)/);
    assert.match(p, /cta_ending \(CRITICAL\)/);
    assert.match(p, /Resolution.*NOT quality signals/s);
  });
  await t.test('embeds the product/script context when given', () => {
    assert.match(buildFidelityPrompt('titanium smart ring'), /titanium smart ring/);
    assert.doesNotMatch(buildFidelityPrompt(), /---/);
  });
});

test('fidelityPassed — judge half: identity + brand only', async (t) => {
  await t.test('passes when identity and brand clear the threshold', () => {
    assert.equal(fidelityPassed(report()), true);
  });
  await t.test('identity or brand below threshold fails', () => {
    // The owner's exact case: a flattering judge while identity failed.
    assert.equal(fidelityPassed(report({ product_identity: dim(2) })), false);
    assert.equal(fidelityPassed(report({ brand_assets: dim(1) })), false);
  });
  await t.test('cta and the judge boolean are excluded — the deterministic tail check owns the ending', () => {
    // Calibration: the judge mis-read the final seconds even with the exact
    // last frame attached; its cta score and passed flag must not block here.
    assert.equal(fidelityPassed(report({ cta_ending: dim(1), passed: false })), true);
  });
  await t.test('non-critical dimensions never block', () => {
    assert.equal(fidelityPassed(report({ motion_artifacts: dim(1) })), true);
  });
});

test('FidelityReportSchema rejects malformed payloads', () => {
  assert.throws(() => FidelityReportSchema.parse({ passed: true }));
  assert.ok(FidelityReportSchema.parse(report()));
});

test('frameDiffScore', async (t) => {
  await t.test('identical frames score 0', () => {
    const a = Buffer.alloc(4096, 128);
    assert.equal(frameDiffScore(a, Buffer.from(a)), 0);
  });
  await t.test('opposite frames score 1', () => {
    assert.equal(frameDiffScore(Buffer.alloc(64, 0), Buffer.alloc(64, 255)), 1);
  });
  await t.test('throws on mismatched or empty buffers instead of a silent pass', () => {
    assert.throws(() => frameDiffScore(Buffer.alloc(4), Buffer.alloc(8)), /equal-length/);
    assert.throws(() => frameDiffScore(Buffer.alloc(0), Buffer.alloc(0)), /equal-length/);
  });
});

const VILLAIN_PLAN: ShotPlan = {
  product_bible: 'A sleek titanium smart ring with no screen.',
  hero_prompt: 'Beauty shot of the titanium ring.',
  tone: 'calm',
  color_palette: 'muted slate',
  shots: [
    { scene_id: 'shot_00_problem', beat: 'Notification overload', shows_product: false,
      prompt: 'Extreme close-up on a generic smartwatch aggressively flashing notifications', camera: 'push-in' },
    { scene_id: 'shot_01_relief', beat: 'Enter the ring', shows_product: true,
      prompt: 'The ring sliding gracefully onto a finger', camera: 'macro' },
  ],
};

test('buildStoryboardContext — designed contrast is stated, not excused', async (t) => {
  const ctx = buildStoryboardContext(VILLAIN_PLAN);

  await t.test('labels every shot with its intent, in order', () => {
    assert.match(ctx, /0\. \[CONTRAST — deliberately NOT the product\] Extreme close-up on a generic smartwatch/);
    assert.match(ctx, /1\. \[PRODUCT\] The ring sliding gracefully/);
  });

  await t.test('tells the judge contrast shots are intent — and product shots still bind', () => {
    assert.match(ctx, /NOT a product-identity or script failure/);
    assert.match(ctx, /\[PRODUCT\] shot showing a different object is still a failure/);
  });

  await t.test('long prompts are truncated so the storyboard cannot flood the judge prompt', () => {
    const long: ShotPlan = { ...VILLAIN_PLAN, shots: [{ ...VILLAIN_PLAN.shots[0], prompt: 'x'.repeat(600) }] };
    const line = buildStoryboardContext(long).split('\n')[1];
    assert.ok(line.length < 230, `storyboard line too long: ${line.length}`);
  });
});

test('buildFidelityPrompt embeds the storyboard section only when given', async (t) => {
  await t.test('storyboard present', () => {
    const p = buildFidelityPrompt('a ring', buildStoryboardContext(VILLAIN_PLAN));
    assert.match(p, /Storyboard \(the art director's plan/);
    assert.match(p, /\[CONTRAST — deliberately NOT the product\]/);
  });
  await t.test('no storyboard, no section', () => {
    assert.doesNotMatch(buildFidelityPrompt('a ring'), /Storyboard/);
  });
});
