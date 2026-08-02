#!/usr/bin/env python3
"""measure.py — deterministic falsifiers for Layer 2 of VERIFICATION-DESIGN.md.

A claim in a measurable category must predict what a measurement will show;
this tool takes that prediction and settles it against pixels from the
ORIGINAL-timebase videos. The model's corroboration vote is irrelevant for
these categories — the measurement decides.

Modes:
  measure.py <metric> <video> <t> [region]            one video, raw values
  measure.py pair <metric> <videoA> <videoB> <t> [region]
  measure.py check '<prediction-json>' <videoA> <videoB>
      prediction: {"metric": "...", "t": <sec>, "region": "...", "expect": "..."}
      -> {"verdict": "confirmed"|"refuted", "values": {...}, "margin": ...}

Margins are deliberately conservative and were validated against known cases
(see analysis/falsifier-validation.json) before this tool earned veto power:
a claim asserts a VISIBLE difference, so a measured difference inside the
margin band refutes it.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image


def frame(video, t):
    """Frame-accurate still at t seconds. -ss before -i is frame-accurate on
    modern ffmpeg (decodes forward from the previous keyframe)."""
    fd, out = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    try:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", video,
             "-frames:v", "1", "-y", out],
            check=True,
        )
        if os.path.getsize(out) == 0:
            # Cited time past the video's end (model cited t=14.9 in a 14.5s
            # clip); step back rather than crash the whole second.
            subprocess.run(
                ["ffmpeg", "-v", "error", "-ss", f"{max(0.0, t - 0.3):.4f}",
                 "-i", video, "-frames:v", "1", "-y", out],
                check=True,
            )
        with Image.open(out) as im:
            return np.asarray(im.convert("RGB"), dtype=np.float64)
    finally:
        os.unlink(out)


def luma(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def crop(a, region):
    h, w = a.shape[:2]
    if region == "center":
        return a[int(h * .30):int(h * .70), int(w * .30):int(w * .70)]
    if region == "left":
        return a[:, :int(w * .25)]
    if region == "right":
        return a[:, int(w * .75):]
    if region == "top":
        return a[:int(h * .25), :]
    if region == "bottom":
        return a[int(h * .75):, :]
    if region == "corners":
        ch, cw = int(h * .18), int(w * .18)
        return np.concatenate([
            a[:ch, :cw].reshape(-1, a.shape[-1] if a.ndim == 3 else 1),
            a[:ch, w - cw:].reshape(-1, a.shape[-1] if a.ndim == 3 else 1),
            a[h - ch:, :cw].reshape(-1, a.shape[-1] if a.ndim == 3 else 1),
            a[h - ch:, w - cw:].reshape(-1, a.shape[-1] if a.ndim == 3 else 1),
        ])
    return a


# ---------------------------------------------------------------- metrics --

def m_vignette(video, t, region=None):
    y = luma(frame(video, t))
    corners = float(crop(y[..., None], "corners").mean())
    center = float(crop(y, "center").mean())
    falloff = (center - corners) / center * 100 if center > 0 else 0.0
    return {"corner_mean": round(corners, 2), "center_mean": round(center, 2),
            "falloff_pct": round(falloff, 2)}


def m_color_cast(video, t, region=None):
    a = crop(frame(video, t), region or "full")
    r, g, b = (float(a[..., i].mean()) for i in range(3))
    mx = a.max(axis=-1)
    mn = a.min(axis=-1)
    sat = float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-9), 0).mean())
    return {"r": round(r, 2), "g": round(g, 2), "b": round(b, 2),
            "rb_delta": round(r - b, 2), "saturation": round(sat, 4)}


def m_luma_curve(video, t, region=None):
    y = crop(luma(frame(video, t)), region or "full")
    p = np.percentile(y, [0.1, 1, 5, 50, 95, 99, 99.9])
    keys = ["p01", "p1", "p5", "p50", "p95", "p99", "p999"]
    out = {k: round(float(v), 2) for k, v in zip(keys, p)}
    out["span_p5_p95"] = round(out["p95"] - out["p5"], 2)
    return out


def m_motion(video, t, region=None, window=1.0):
    """Mean consecutive-frame delta over [t, t+window). A single frame pair is
    far too noisy to represent 'motion this second' — validation showed a
    known 0.53x motion deficit reading as 1.07x on one pair."""
    tmp = tempfile.mkdtemp()
    try:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", video,
             "-t", f"{window:.4f}", "-vf", "scale=360:-2,format=gray",
             "-y", os.path.join(tmp, "f_%03d.png")],
            check=True,
        )
        names = sorted(os.listdir(tmp))
        if len(names) < 3:
            raise SystemExit(f"only {len(names)} frames in window at t={t}")
        deltas = []
        prev = None
        for n in names:
            with Image.open(os.path.join(tmp, n)) as im:
                y = np.asarray(im, dtype=np.float64)
            if prev is not None:
                d = np.abs(y - prev)
                deltas.append(float(crop(d, region).mean() if region else d.mean()))
            prev = y
        return {"mean_abs_delta": round(float(np.mean(deltas)), 4),
                "frames": len(names)}
    finally:
        for n in os.listdir(tmp):
            os.unlink(os.path.join(tmp, n))
        os.rmdir(tmp)


def m_region_sharpness(video, t, region):
    """Laplacian variance, pooled AFTER the convolution — cropping first breaks
    the 2D stencil for the concatenated 'corners' region (validated: NaN)."""
    y = luma(frame(video, t))
    lap = (-4 * y[1:-1, 1:-1] + y[:-2, 1:-1] + y[2:, 1:-1]
           + y[1:-1, :-2] + y[1:-1, 2:])
    vals = crop(lap, region or "center")
    return {"lap_var": round(float(np.asarray(vals).ravel().var()), 2)}


METRICS = {
    "vignette": m_vignette,
    "color_cast": m_color_cast,
    "luma_curve": m_luma_curve,
    "motion": m_motion,
    "region_sharpness": m_region_sharpness,
}

# ------------------------------------------------------------ comparators --
# A claim asserts a VISIBLE difference. Measured difference inside the margin
# band means the asserted difference is not there -> refuted.

MARGINS = {
    "vignette_falloff_pp": 4.0,
    "rb_delta": 3.0,
    "saturation": 0.02,
    "black_p01": 10.0,
    "shadow_p5": 8.0,
    "highlight_p99": 6.0,
    "contrast_span": 10.0,
    "motion_ratio": 1.25,
    "sharpness_ratio": 1.30,
}


def check(pred, va, vb):
    metric = pred["metric"]
    t = float(pred["t"])
    region = pred.get("region")
    if metric not in METRICS:
        return {"verdict": "unmeasurable", "why": f"unknown metric {metric}"}
    A = METRICS[metric](va, t, region) if metric != "region_sharpness" else m_region_sharpness(va, t, region)
    B = METRICS[metric](vb, t, region) if metric != "region_sharpness" else m_region_sharpness(vb, t, region)
    e = pred["expect"]
    ok = None

    if metric == "vignette":
        d = A["falloff_pct"] - B["falloff_pct"]
        m = MARGINS["vignette_falloff_pp"]
        if e == "A_stronger":
            ok = d >= m
        elif e == "B_stronger":
            ok = -d >= m
    elif metric == "color_cast":
        m = MARGINS["rb_delta"]
        if e == "A_cooler":       # cooler = blue over red = lower rb_delta
            ok = (B["rb_delta"] - A["rb_delta"]) >= m
        elif e == "B_cooler":
            ok = (A["rb_delta"] - B["rb_delta"]) >= m
        elif e == "A_more_saturated":
            ok = (A["saturation"] - B["saturation"]) >= MARGINS["saturation"]
        elif e == "B_more_saturated":
            ok = (B["saturation"] - A["saturation"]) >= MARGINS["saturation"]
    elif metric == "luma_curve":
        if e == "A_deeper_blacks":
            ok = (B["p01"] - A["p01"]) >= MARGINS["black_p01"]
        elif e == "B_deeper_blacks":
            ok = (A["p01"] - B["p01"]) >= MARGINS["black_p01"]
        elif e == "A_deeper_shadows":
            ok = (B["p5"] - A["p5"]) >= MARGINS["shadow_p5"]
        elif e == "B_deeper_shadows":
            ok = (A["p5"] - B["p5"]) >= MARGINS["shadow_p5"]
        elif e == "A_brighter_highlights":
            ok = (A["p99"] - B["p99"]) >= MARGINS["highlight_p99"]
        elif e == "B_brighter_highlights":
            ok = (B["p99"] - A["p99"]) >= MARGINS["highlight_p99"]
        elif e == "A_higher_contrast":
            ok = (A["span_p5_p95"] - B["span_p5_p95"]) >= MARGINS["contrast_span"]
        elif e == "B_higher_contrast":
            ok = (B["span_p5_p95"] - A["span_p5_p95"]) >= MARGINS["contrast_span"]
    elif metric == "motion":
        ra = A["mean_abs_delta"]
        rb = B["mean_abs_delta"]
        m = MARGINS["motion_ratio"]
        if e == "A_more":
            ok = ra >= rb * m
        elif e == "B_more":
            ok = rb >= ra * m
    elif metric == "region_sharpness":
        m = MARGINS["sharpness_ratio"]
        if e == "A_sharper":
            ok = A["lap_var"] >= B["lap_var"] * m
        elif e == "B_sharper":
            ok = B["lap_var"] >= A["lap_var"] * m

    if ok is None:
        return {"verdict": "unmeasurable", "why": f"unknown expect '{e}' for {metric}", "A": A, "B": B}
    return {"verdict": "confirmed" if ok else "refuted", "expect": e, "A": A, "B": B}


def main(argv):
    if not argv:
        raise SystemExit(__doc__)
    if argv[0] == "check":
        pred = json.loads(argv[1])
        print(json.dumps(check(pred, argv[2], argv[3])))
        return
    if argv[0] == "pair":
        metric, va, vb, t = argv[1], argv[2], argv[3], float(argv[4])
        region = argv[5] if len(argv) > 5 else None
        fn = METRICS[metric]
        print(json.dumps({"A": fn(va, t, region), "B": fn(vb, t, region)}))
        return
    metric, video, t = argv[0], argv[1], float(argv[2])
    region = argv[3] if len(argv) > 3 else None
    print(json.dumps(METRICS[metric](video, t, region)))


if __name__ == "__main__":
    main(sys.argv[1:])
