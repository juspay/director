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
.badge.stall{color:var(--fail);border-color:var(--fail)}
.badge.idle{opacity:.55}
@keyframes blip{50%{opacity:.25}}
.pill.running .dot{background:var(--amber);animation:blip 1.4s ease-in-out infinite}
.pill.running .st{color:var(--amber);opacity:1}
@media (prefers-reduced-motion: reduce){.pill.running .dot{animation:none}}
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
.shotgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.shot{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.shot img,.shot .ph{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#000}
.shot .ph{display:flex;align-items:center;justify-content:center;color:var(--pend);font-size:26px}
.shot .meta{padding:8px 10px}
.shot .sid{font:600 11px ui-monospace,monospace;color:var(--head)}
.shot .beat{font-size:12px;color:#8a8a9a;margin:3px 0 7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.chips{display:flex;flex-wrap:wrap;gap:4px}
.chip{font:600 10px ui-monospace,monospace;padding:2px 7px;border-radius:9px;border:1px solid var(--line);color:#8a8a9a}
.chip.ok{color:var(--ok);border-color:var(--ok)}
.chip.run{color:var(--amber);border-color:var(--amber)}
.chip.warn{color:var(--fail);border-color:var(--fail)}
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
  <section id="shotsec" hidden><h2>B-roll shots</h2><div id="shots" class="shotgrid"></div></section>
  <section class="cost"><h2>Estimated API spend</h2><div id="cost"></div></section>
  <footer id="foot"></footer>
</div>
<script>
var SNAP = ${data};
function el(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function money(n){return '$'+(Number(n)||0).toFixed(4);}
function render(s){
  var lv = s.liveness || (s.complete ? 'complete' : 'running');
  var badge = { complete: ['COMPLETE', 'ok'], running: [s.currentStep + '/' + s.totalSteps + ' · RUNNING', 'run'],
                stalled: [s.currentStep + '/' + s.totalSteps + ' · STALLED', 'stall'], idle: ['IDLE', 'idle'] }[lv];
  el('status').textContent = badge[0];
  el('status').className = 'badge ' + badge[1];
  el('fill').style.width = ((s.currentStep / s.totalSteps) * 100).toFixed(1) + '%';
  el('phases').innerHTML = s.phases.map(function(p){
    var right = p.error ? '<span class="err">' + esc(p.error) + '</span>' : '<span class="st">' + p.status + '</span>';
    return '<div class="pill ' + p.status + '"><span class="dot"></span><span class="nm">' + esc(p.label) + '</span>' + right + '</div>';
  }).join('');
  var prov = Object.keys(s.cost.byProvider || {});
  var sub = s.cost.events + ' events' + (prov.length ? ' · ' + prov.map(function(k){ return esc(k) + ' ' + money(s.cost.byProvider[k]); }).join(' · ') : '');
  el('cost').innerHTML = '<div class="total">' + money(s.cost.total) + '</div><div class="sub">' + sub + '</div>';
  renderShots(s);
  var act = s.lastActivityAt || s.updatedAt;
  el('foot').textContent = act ? ('last activity ' + act) : 'no run recorded yet';
}
function renderShots(s){
  var sec = el('shotsec');
  if (!s.shots || !s.shots.length) { sec.hidden = true; return; }
  sec.hidden = false;
  var bust = encodeURIComponent(s.lastActivityAt || '');
  el('shots').innerHTML = s.shots.map(function(sh){
    var thumb = sh.keyframe
      ? '<img src="/api/shot-key/' + sh.index + '?t=' + bust + '" alt="keyframe ' + sh.index + '" loading="lazy">'
      : '<div class="ph">·</div>';
    var st = sh.animated ? ['animated','ok'] : sh.keyframe ? ['keyframe','run'] : ['pending',''];
    var chips = '<span class="chip ' + st[1] + '">' + st[0] + '</span>';
    if (sh.showsProduct) chips += '<span class="chip">product</span>';
    if (sh.critic) {
      chips += '<span class="chip ' + (sh.critic.regenerate ? 'warn' : 'ok') + '">critic ' +
        (sh.critic.score == null ? '—' : sh.critic.score + '/10') +
        (sh.critic.attempts > 1 ? ' ×' + sh.critic.attempts : '') + '</span>';
    }
    return '<div class="shot">' + thumb + '<div class="meta"><div class="sid">' + esc(sh.sceneId) + '</div>' +
      '<div class="beat">' + esc(sh.beat) + '</div><div class="chips">' + chips + '</div></div></div>';
  }).join('');
}
render(SNAP);
function poll(){
  fetch('/api/snapshot', { cache: 'no-store' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if (j) { SNAP = j; render(j); } })
    .catch(function(){ /* transient — retry next tick */ });
}
var pollTimer = null;
function startPolling(){ if (!pollTimer) pollTimer = setInterval(poll, 1500); }
// SSE first (server pushes only on change); EventSource reconnects transient
// drops itself — fall back to polling only once the stream is fully CLOSED.
if (window.EventSource) {
  var es = new EventSource('/api/events');
  es.onmessage = function(ev){ try { SNAP = JSON.parse(ev.data); render(SNAP); } catch (e) { /* skip torn frame */ } };
  es.onerror = function(){ if (es.readyState === 2) startPolling(); };
} else {
  startPolling();
}
</script>
</body></html>`;
}
