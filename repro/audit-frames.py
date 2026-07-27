"""Per-frame audit of the reproduction against the reference.

Reports objective, checkable defects rather than impressions:
  - exposure    : blown / crushed pixel fractions vs the reference
  - sharpness   : Laplacian energy (mush detection), global and centre-weighted
  - clipping    : saturated brand colour touching a frame border
  - temporal    : frame-to-frame delta spikes (pops) and dead frames
"""
import sys, pathlib
import numpy as np
from PIL import Image

MINE = pathlib.Path(sys.argv[1])
TGT = pathlib.Path(sys.argv[2])
N = 435


def load(p, size=(720, 900)):
    im = Image.open(p).convert('RGB').resize(size, Image.LANCZOS)
    return np.asarray(im, dtype=np.float32) / 255.0


def luma(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def lap_energy(y):
    """Variance of a 4-neighbour Laplacian — low means mushy/out of focus."""
    k = (-4 * y[1:-1, 1:-1] + y[:-2, 1:-1] + y[2:, 1:-1] + y[1:-1, :-2] + y[1:-1, 2:])
    return float(k.var())


def brand_mask(a):
    """Saturated Recurly-yellow or Hyperswitch-blue pixels."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1)
    sat = mx - mn
    yellow = (sat > 0.28) & (r > 0.55) & (g > 0.42) & (b < 0.42)
    blue = (sat > 0.22) & (b > 0.42) & (b > r + 0.12) & (b > g + 0.08)
    return yellow | blue


def border_touch(m, w=6):
    """Fraction of each border band occupied by brand-coloured pixels."""
    return max(
        m[:w, :].mean(), m[-w:, :].mean(), m[:, :w].mean(), m[:, -w:].mean()
    )


rows = []
prev_m = prev_t = None
for i in range(1, N + 1):
    am = load(MINE / f'{i:03d}.png')
    at = load(TGT / f'{i:03d}.png')
    ym, yt = luma(am), luma(at)
    mm, mt = brand_mask(am), brand_mask(at)
    r = dict(
        f=i - 1,
        m_mean=ym.mean(), t_mean=yt.mean(),
        m_blown=float((ym > 0.99).mean()), t_blown=float((yt > 0.99).mean()),
        m_crush=float((ym < 0.03).mean()), t_crush=float((yt < 0.03).mean()),
        m_sharp=lap_energy(ym), t_sharp=lap_energy(yt),
        m_sharpc=lap_energy(ym[250:650, 180:540]), t_sharpc=lap_energy(yt[250:650, 180:540]),
        m_edge=float(border_touch(mm)), t_edge=float(border_touch(mt)),
        m_brand=float(mm.mean()), t_brand=float(mt.mean()),
        m_d=float(np.abs(ym - prev_m).mean()) if prev_m is not None else 0.0,
        t_d=float(np.abs(yt - prev_t).mean()) if prev_t is not None else 0.0,
    )
    rows.append(r)
    prev_m, prev_t = ym, yt

import json
pathlib.Path(sys.argv[3]).write_text(json.dumps([{k: float(v) for k, v in r.items()} for r in rows]))

def col(k):
    return np.array([r[k] for r in rows])

print(f"{'metric':<14}{'MINE':>22}{'TARGET':>22}")
for k in ['mean', 'blown', 'crush', 'sharp', 'sharpc', 'brand']:
    m, t = col('m_' + k), col('t_' + k)
    print(f"{k:<14}{m.mean():>10.5f} (min {m.min():.4f}){t.mean():>10.5f} (min {t.min():.4f})")

print("\n--- DEFECTS ---")
# 1. brand colour touching a border much more than the reference does
edge = [(r['f'], r['m_edge'], r['t_edge']) for r in rows if r['m_edge'] > 0.06 and r['m_edge'] > r['t_edge'] * 2 + 0.03]
print(f"[clipping] {len(edge)} frames where a brand-coloured element runs off the frame edge")
if edge:
    fr = [e[0] for e in edge]
    print(f"           frames {fr[0]}-{fr[-1]}, worst {max(edge, key=lambda e: e[1])}")

# 2. centre sharpness far below the reference => mush
ms, ts = col('m_sharpc'), col('t_sharpc')
soft = [rows[i]['f'] for i in range(N) if ms[i] < ts[i] * 0.45]
print(f"[soft]     {len(soft)} frames whose centre detail is <45% of the reference's")
if soft:
    print(f"           e.g. {soft[:12]}{' ...' if len(soft) > 12 else ''}")

# 3. temporal pops
md = col('m_d')
thr = md.mean() + 5 * md.std()
pops = [rows[i]['f'] for i in range(1, N) if md[i] > thr]
print(f"[pop]      {len(pops)} frames with a temporal jump >5 sigma: {pops}")

# 4. dead/static stretches that the reference does not have
dead = [rows[i]['f'] for i in range(1, N) if md[i] < 0.0006 and col('t_d')[i] > 0.002]
print(f"[static]   {len(dead)} frames static while the reference still moves: {dead[:20]}")

# 5. exposure divergence
dm = col('m_mean') - col('t_mean')
print(f"[exposure] mean offset {dm.mean():+.4f}  worst {dm.max():+.4f} @f{int(np.argmax(dm))}  {dm.min():+.4f} @f{int(np.argmin(dm))}")
