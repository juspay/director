/**
 * Production verdict — one ship/no-ship signal composed from the content quality
 * gates, the deterministic regression gate, the product-fidelity gate, and the
 * (visual) videoScore.
 *
 * The videoScore is ADVISORY, not a hard gate. A single-sample gemini videoScore
 * is noise-dominated: re-scoring one unchanged file 5× returned 6.6–9.0 (σ ≈ 1.0),
 * so a lone draw crossing the 7.0 line would flip SHIP-READY↔NEEDS WORK on a
 * gate-clean cut purely on scorer noise. The ship decision therefore rests on the
 * deterministic + content gates; the videoScore only *blocks* when it is a
 * *confident* low — i.e. averaged over ≥2 samples (set VIDEO_SCORE_SAMPLES). A
 * single low sample is surfaced as an advisory note, never a downgrade.
 */

export type VerdictInputs = {
  videoScore?: number | null;
  /** Number of scorer samples behind `videoScore` (1 = single draw). */
  videoScoreSamples?: number;
  /** max−min across samples, when averaged. */
  videoScoreSpread?: number | null;
  gatesPassed: boolean | null;
  regressionPassed: boolean | null;
  fidelityPassed: boolean | null;
  /** Visual-score line below which the score is flagged/considered low. Default 7. */
  advisoryFloor?: number;
};

export type ProductionVerdict = {
  verdict: string;
  shipReady: boolean;
  videoScore: number | null;
  gatesPassed: boolean | null;
  regressionPassed: boolean | null;
  fidelityPassed: boolean | null;
  /** Non-blocking notes (e.g. a low but single-sample visual score). */
  advisory: string[];
};

export function composeProductionVerdict(i: VerdictInputs): ProductionVerdict {
  const floor = i.advisoryFloor ?? 7;
  const vs = typeof i.videoScore === 'number' && Number.isFinite(i.videoScore) ? i.videoScore : null;
  const samples = i.videoScoreSamples ?? 1;

  // A low videoScore only counts against ship when it's a *confident* low —
  // averaged over ≥2 samples. A single noisy draw is advisory-only.
  const confidentLowVideo = vs !== null && vs < floor && samples >= 2;

  // null = a gate never ran → non-blocking. false = a definitive failure → block.
  const shipReady =
    !confidentLowVideo &&
    i.gatesPassed !== false &&
    i.regressionPassed !== false &&
    i.fidelityPassed !== false;

  const advisory: string[] = [];
  if (vs !== null && vs < floor && !confidentLowVideo) {
    advisory.push(`low visual score ${vs.toFixed(1)}/10 (single noisy sample — advisory; set VIDEO_SCORE_SAMPLES≥2 to gate on it)`);
  }
  if (samples >= 2 && i.videoScoreSpread != null && Number.isFinite(i.videoScoreSpread)) {
    advisory.push(`visual score = mean of ${samples} (spread ±${(i.videoScoreSpread / 2).toFixed(1)})`);
  }

  const base = shipReady
    ? (i.gatesPassed === null ? 'SHIP-READY (no content gates)' : 'SHIP-READY')
    : 'NEEDS WORK';
  const verdict = advisory.length ? `${base} · ${advisory.join('; ')}` : base;

  return {
    verdict,
    shipReady,
    videoScore: vs,
    gatesPassed: i.gatesPassed,
    regressionPassed: i.regressionPassed,
    fidelityPassed: i.fidelityPassed,
    advisory,
  };
}
