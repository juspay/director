/**
 * eyewitness-apply.mjs — merge channel-A (Claude) verdicts and finalize claims.
 *
 * Channel A is the decorrelated eyewitness from VERIFICATION-DESIGN.md: the
 * driving Claude session Reads the full-res cited frames listed in
 * eyewitness/sec-NN-tasks.json and writes eyewitness/verdicts-claude.json:
 *
 *   { "07:2": { "verdict": "supported" | "refuted" | "cannot_tell", "note": "..." }, ... }
 *
 * keyed "SS:IDX" (second : claim index). This script applies the tie-break —
 * a semantic claim needs AT LEAST ONE supporter and NO refuter across the two
 * channels — and rewrites each affected sec-NN.md/json in place.
 */
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2];
if (!outDir) {
  console.error('usage: node eyewitness-apply.mjs <outDir>');
  process.exit(1);
}
const verdictsPath = path.join(outDir, 'eyewitness', 'verdicts-claude.json');
const verdicts = JSON.parse(fs.readFileSync(verdictsPath, 'utf8'));

const CHIP = {
  accepted_measured: 'MEASURED ✓',
  vetoed_measured: 'MEASUREMENT VETO ✗',
  accepted_eyewitness: 'EYEWITNESS ✓ (%SUP%)',
  rejected_eyewitness: 'EYEWITNESS REFUTED ✗ (%REF%)',
  rejected_no_support: 'NO SUPPORTER ✗',
  pending_eyewitness: 'eyewitness pending',
};

function chip(x) {
  const sup = [x.channelB?.verdict === 'supported' ? 'B' : null, x.channelA?.verdict === 'supported' ? 'A' : null].filter(Boolean).join('+') || 'none';
  const ref = x.channelA?.verdict === 'refuted' ? 'A' : x.channelB?.verdict === 'refuted' ? 'B' : '?';
  return (CHIP[x.status] ?? x.status).replace('%SUP%', sup).replace('%REF%', ref);
}

function line(x, verified) {
  return `### [sev ${x.severity}] ${x.category} @ t=${Number(x.t).toFixed(2)}s — ${x.supported_by}/${verified} runs — **${chip(x)}**
- **A:** ${x.a_observable}
- **B:** ${x.b_observable}
- **Fix (advisory):** ${x.fix}${x.measurement ? `\n- **Measurement:** ${JSON.stringify(x.measurement.A)} vs ${JSON.stringify(x.measurement.B)}` : ''}${x.channelB?.note ? `\n- **Channel B (Gemini):** ${x.channelB.verdict} — ${x.channelB.note}` : ''}${x.channelA?.note ? `\n- **Channel A (Claude):** ${x.channelA.verdict} — ${x.channelA.note}` : ''}`;
}

let applied = 0;
let stillPending = 0;
for (const f of fs.readdirSync(outDir).filter((n) => /^sec-\d\d\.json$/.test(n))) {
  const p = path.join(outDir, f);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const sec = doc.sec;
  const claims = doc.consolidated.agreed_differences ?? [];
  let touched = false;

  claims.forEach((c, k) => {
    if (c.status !== 'pending_eyewitness') return;
    const v = verdicts[`${String(sec).padStart(2, '0')}:${k}`];
    if (!v) { stillPending++; return; }
    c.channelA = v;
    // Tie-break: >=1 supporter and 0 refuters. Channel B refutes were already
    // terminal in the pipeline, so only A's refute and the no-supporter case
    // are decided here. cannot_tell abstains — it neither supports nor kills.
    if (v.verdict === 'refuted') c.status = 'rejected_eyewitness';
    else if (v.verdict === 'supported' || c.channelB?.verdict === 'supported') c.status = 'accepted_eyewitness';
    else c.status = 'rejected_no_support';
    touched = true;
    applied++;
  });

  if (!touched) continue;
  fs.writeFileSync(p, JSON.stringify(doc, null, 2));

  const live = claims.filter((x) => ['accepted_measured', 'accepted_eyewitness', 'pending_eyewitness'].includes(x.status));
  const dead = claims.filter((x) => !live.includes(x));
  const md = `# Second ${sec} — original frames ${sec * 30}-${sec * 30 + 29}

_${doc.meta.verified}/${doc.meta.attempted} runs passed the ground-truth timing check; ${doc.consolidated.dropped_unsupported ?? '?'} single-run claims dropped by the vote; ${doc.meta.layer1Rejected} rejected by the citation firewall._

## Highest-impact fix (advisory)
${doc.consolidated.highest_impact_fix ?? '—'}

## Verified / surviving claims
${live.length === 0 ? '_None._' : live.map((x) => line(x, doc.meta.verified)).join('\n\n')}

## Killed in verification
${dead.length === 0 ? '_None._' : dead.map((x) => line(x, doc.meta.verified)).join('\n\n')}

## Present in A, absent in B (corroborated, unverified inventory)
${(doc.consolidated.agreed_absent_in_b ?? []).length === 0 ? '_Nothing corroborated._' : doc.consolidated.agreed_absent_in_b.map((x) => `- ${x}`).join('\n')}
`;
  fs.writeFileSync(path.join(outDir, `sec-${String(sec).padStart(2, '0')}.md`), md);
}

console.log(`applied ${applied} channel-A verdicts; ${stillPending} claims still awaiting verdicts`);
