/**
 * Backlot HTML shell. A single self-contained page (no bundler, no deps) served
 * by the sidecar — the initial snapshot is embedded for first paint, then a small
 * inline poller refreshes it from /api/snapshot. Dark theme lifted from
 * dashboard-generator.ts so the live and static dashboards read as one family.
 */
import type { BacklotSnapshot } from '../types/backlot.ts';

const CSS = `
:root{--bg:#0a0a10;--ink:#c8c8d4;--amber:#d97706;--head:#eaeaf2;--card:#14142a;--line:#252540;--ok:#34d399;--fail:#ef4444;--pend:#4a4a5e}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:28px}
.wrap{max-width:720px;margin:0 auto}
header{display:flex;align-items:center;gap:14px;margin-bottom:18px}
h1{color:var(--amber);font-size:1.7em;margin:0}
h2{color:var(--head);font-size:.9em;text-transform:uppercase;letter-spacing:.09em;margin:28px 0 12px}
.badge{font:600 12px ui-monospace,Menlo,monospace;padding:4px 11px;border-radius:20px;border:1px solid var(--line)}
.badge.ok{color:var(--ok);border-color:var(--ok)}
.badge.run{color:var(--amber);border-color:var(--amber)}
.bar{height:8px;background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden}
.fill{height:100%;width:0;background:linear-gradient(90deg,var(--amber),#f59e0b);transition:width .4s ease}
.phases{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.pill{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.pill .dot{width:10px;height:10px;border-radius:50%;background:var(--pend);flex:none}
.pill.done .dot{background:var(--ok)}
.pill.failed .dot{background:var(--fail)}
.pill .nm{font-weight:600;color:var(--head)}
.pill .st{margin-left:auto;font:600 11px ui-monospace,monospace;text-transform:uppercase;opacity:.55}
.pill.done .st{color:var(--ok);opacity:1}
.pill .err{margin-left:auto;color:var(--fail);font-size:13px;max-width:60%;text-align:right}
.cost .total{font-size:2em;font-weight:800;color:var(--amber)}
.cost .sub{color:#8a8a9a;font:12px ui-monospace,monospace;margin-top:4px}
footer{margin-top:26px;color:#66667a;font:12px ui-monospace,monospace}
`;

export function renderShell(snapshot: BacklotSnapshot): string {
  const data = JSON.stringify(snapshot).replace(/</g, '\\u003c');
  // The client renderer uses string concatenation (not template literals) so the
  // browser JS needs no escaping inside this Node template literal.
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Backlot — Director run</title>
<style>${CSS}</style>
</head><body>
<div class="wrap">
  <header><h1>🎬 Backlot</h1><span id="status" class="badge"></span></header>
  <div class="bar"><div id="fill" class="fill"></div></div>
  <div id="phases" class="phases"></div>
  <section class="cost"><h2>Estimated API spend</h2><div id="cost"></div></section>
  <footer id="foot"></footer>
</div>
<script>
var SNAP = ${data};
function el(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function money(n){return '$'+(Number(n)||0).toFixed(4);}
function render(s){
  el('status').textContent = s.complete ? 'COMPLETE' : (s.currentStep + '/' + s.totalSteps);
  el('status').className = 'badge ' + (s.complete ? 'ok' : 'run');
  el('fill').style.width = ((s.currentStep / s.totalSteps) * 100).toFixed(1) + '%';
  el('phases').innerHTML = s.phases.map(function(p){
    var right = p.error ? '<span class="err">' + esc(p.error) + '</span>' : '<span class="st">' + p.status + '</span>';
    return '<div class="pill ' + p.status + '"><span class="dot"></span><span class="nm">' + esc(p.label) + '</span>' + right + '</div>';
  }).join('');
  var prov = Object.keys(s.cost.byProvider || {});
  var sub = s.cost.events + ' events' + (prov.length ? ' · ' + prov.map(function(k){ return esc(k) + ' ' + money(s.cost.byProvider[k]); }).join(' · ') : '');
  el('cost').innerHTML = '<div class="total">' + money(s.cost.total) + '</div><div class="sub">' + sub + '</div>';
  el('foot').textContent = s.updatedAt ? ('last update ' + s.updatedAt) : 'no run recorded yet';
}
render(SNAP);
function poll(){
  fetch('/api/snapshot', { cache: 'no-store' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if (j) { SNAP = j; render(j); } })
    .catch(function(){ /* transient — retry next tick */ });
}
setInterval(poll, 1500);
</script>
</body></html>`;
}
