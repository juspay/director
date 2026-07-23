# Recurly × Hyperswitch — deterministic 3D reproduction

A **Remotion + three.js** rebuild of the target LinkedIn announcement video
(Recurly × JUSPAY Hyperswitch "Live Now", 720×900 / 30fps / 14.5s). This is the
**deterministic overlay** half of the hybrid reproduction plan from
`reference/hyperswitch-recurly-7485945590804062208/RECONSTRUCTION-SPEC.md`
(the AI background plate is added later).

## Why a nested sub-project

The root repo pins **TypeScript 7** (the native/Go preview), whose module lacks
the classic JS API (`typescript.sys`) that Remotion's webpack esbuild-loader
requires. So `repro/` is a **self-contained package** with its own
`node_modules` and **classic TypeScript 5**, leaving the root repo untouched.

## Install & render

```bash
cd repro
npm install                                   # nested deps (remotion, three, R3F, drei)
npx remotion still index.ts RecurlyHyperswitch out/frame.png --frame=300   # a still
npx remotion render index.ts RecurlyHyperswitch out/repro.mp4              # full video
npx remotion studio index.ts                  # interactive studio
```

## Layout

```
repro/
├─ index.ts                 registerRoot
├─ Root.tsx                 Composition (RecurlyHyperswitch, 720×900, 30fps, 435f)
├─ RecurlyHyperswitch.tsx   ThreeCanvas: camera, lights, floor, scene
├─ remotion.config.ts       jpeg frames, angle GL
├─ scene/
│  ├─ theme.ts              palette + frame-accurate timeline constants
│  ├─ faces.ts              canvas → CanvasTexture (icons, brand marks, floor)
│  └─ Keycap.tsx            rounded keycap + socket + face plane
└─ evidence/                milestone stills + target comparisons
```

## Status

- ✅ Toolchain (Remotion 4 + three 0.169 + R3F 9 + React 19 + Node 24) renders 3D.
- ✅ **Final lockup** (t≈10s) — Recurly (gold, socket) top-left, "Live Now" pill
  center, JUSPAY hyperswitch (blue, socket) bottom-right, on a soft tiled floor
  with dappled light. See `evidence/compare_lockup_v1.png`.

## Remaining (to full 14.5s match)

- Full animated timeline: the 5 scenes + 3 keycap swaps (press/rise) + icon
  micro-anims + Live-Now rise + background fade + static hold, driven by
  `scene/theme.ts` `T` constants and `useCurrentFrame()`.
- All capability tiles (Secure Payments, Renewal Success, Subscriptions,
  Retries, APMs, Revenue Analytics, 99.999%, Automated Billing, PSP).
- Camera path + rack-focus, depth-of-field + bloom (postprocessing).
- Exact brand marks from official SVGs (current marks are canvas approximations).
- Audio bed + AI background plate composite.
