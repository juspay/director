import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFidelityPrompt, fidelityPassed } from '../../src/agents/fidelity-gate.ts';
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
