/**
 * DashboardGenerator — generates an HTML dashboard from pipeline results.
 * Similar to dopamine's DashboardAgent: embeds all data as JavaScript
 * variables in a self-contained HTML file.
 */
import fs from 'fs/promises';
import path from 'path';
import { loadState } from '../pipeline/state.ts';
import { OUTPUT_DIR } from '../pipeline/config.ts';
import type { PipelineState, ObservabilityReport } from '../types/index.ts';

export async function generateDashboard(outputPath?: string): Promise<string> {
  const state = await loadState<PipelineState>('pipeline-state.json', {
    currentStep: 0, totalSteps: 0, results: {}, errors: [], startedAt: '', updatedAt: '',
  });

  let observability: ObservabilityReport | null = null;
  try {
    observability = await loadState<ObservabilityReport>('observability-report.json', null as never);
  } catch { /* no report yet */ }

  const outPath = outputPath ?? path.join(OUTPUT_DIR, 'dashboard.html');
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const html = buildDashboardHtml(state, observability);
  await fs.writeFile(outPath, html, 'utf-8');

  console.log(`[Dashboard] Generated: ${outPath}`);
  return outPath;
}

function buildDashboardHtml(state: PipelineState, obs: ObservabilityReport | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Director Pipeline Dashboard</title>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a10; color: #c8c8d4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; }
h1 { color: #d97706; font-size: 2em; margin-bottom: 8px; }
h2 { color: #eaeaf2; font-size: 1.4em; margin: 32px 0 16px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
.stat { background: #14142a; border: 1px solid #252540; border-radius: 12px; padding: 20px; text-align: center; }
.stat-num { font-size: 2.2em; font-weight: 800; color: #d97706; }
.stat-label { font-size: 0.8em; color: #777; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
.results { margin-top: 24px; }
.result-card { background: #12121e; border: 1px solid #1e1e32; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
.result-card h3 { color: #d97706; font-size: 1em; margin-bottom: 8px; }
pre { background: #0d0d18; padding: 12px; border-radius: 6px; font-size: 0.8em; overflow-x: auto; color: #a0a0b0; }
.error { color: #ef4444; }
.success { color: #4ade80; }
.timestamp { color: #555; font-size: 0.8em; }
</style>
</head>
<body>
<h1>Director Pipeline Dashboard</h1>
<p class="timestamp">Generated: ${new Date().toISOString()} | Started: ${state.startedAt || 'N/A'}</p>

<div class="stats">
  <div class="stat"><div class="stat-num">${state.currentStep}</div><div class="stat-label">Current Step</div></div>
  <div class="stat"><div class="stat-num">${state.totalSteps}</div><div class="stat-label">Total Steps</div></div>
  <div class="stat"><div class="stat-num">${Object.keys(state.results).length}</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-num">${state.errors.length}</div><div class="stat-label">Errors</div></div>
  ${obs ? `<div class="stat"><div class="stat-num">$${obs.totalCost.toFixed(3)}</div><div class="stat-label">Total Cost</div></div>` : ''}
  ${obs ? `<div class="stat"><div class="stat-num">${obs.policyViolations.length}</div><div class="stat-label">Violations</div></div>` : ''}
</div>

<h2>Step Results</h2>
<div class="results">
${Object.entries(state.results).map(([step, result]) => `
  <div class="result-card">
    <h3 class="success">${step}</h3>
    <pre>${JSON.stringify(result, null, 2).slice(0, 2000)}</pre>
  </div>
`).join('')}
</div>

${state.errors.length > 0 ? `
<h2>Errors</h2>
<div class="results">
${state.errors.map((e) => `<div class="result-card"><p class="error">${e}</p></div>`).join('')}
</div>
` : ''}

<script>
const PIPELINE_STATE = ${JSON.stringify(state, null, 2)};
const OBSERVABILITY = ${JSON.stringify(obs, null, 2)};
</script>
</body>
</html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDashboard().catch(console.error);
}
