# Reconstruction Spec — Recurly × JUSPAY Hyperswitch "Live Now" announcement

> **Purpose.** A forensic, frame-accurate breakdown of the target LinkedIn video, exhaustive enough to reproduce it 1:1. Built from a downloaded copy analyzed with Gemini 2.5 Pro (whole-video passes + dense per-window frame-by-frame passes + adversarial re-verification) and cross-checked by direct frame inspection.

---

## 0. Provenance

| | |
|---|---|
| **Source** | `https://www.linkedin.com/feed/update/urn:li:activity:7485945590804062208/` |
| **Publisher** | JUSPAY (post hashtags: #recurly #juspayhyperswitch #juspay #paymentorchestration #paymentsinfrastructure #subscriptionpayments #recurringrevenue #fintech) |
| **Downloaded via** | `yt-dlp "https://www.linkedin.com/feed/update/urn:li:activity:7485945590804062208/"` → CDN `dms.licdn.com/.../mp4-720p-30fp-crf28/...` |
| **Local copy** | `reference/hyperswitch-recurly-7485945590804062208/target.mp4` |

### Technical fingerprint
| Property | Value |
|---|---|
| Container | MP4 (isom / avc1) |
| Duration | **14.506 s** |
| Video | H.264, **720 × 900** (portrait **4:5**), **30 fps**, 435 frames, yuv420p, ~637 kb/s |
| Audio | AAC-LC, stereo, 44.1 kHz, ~130 kb/s |
| Scene cuts (ffmpeg scenedetect ≥0.03) | **0 hard cuts** — one continuous render; section changes are 1-frame in-scene "keycap swaps" (see §3) |

---

## 1. One-paragraph summary

A 14.5-second, portrait (4:5) **3D motion-graphics announcement**. A glossy, high-key world of floating rounded "keycap" tiles — each a payments/subscriptions capability (Renewal Success, Secure Payments, Subscriptions, Retries, APMs, Revenue Analytics, Automated Billing, "99.999% success rate", PSP) — is toured by a slow drifting camera. The tour resolves into the hero moment: a **gold Recurly keycap** and a **royal-blue JUSPAY hyperswitch keycap** seated in brushed-metal sockets, bridged by a white **"Live Now"** pill. **No voiceover**; a single uplifting corporate future-bass track carries it. The message: **Recurly's subscription-billing platform is now live/integrated with Juspay Hyperswitch payment orchestration.**

---

## 2. Canonical facts (do-not-drift list)

- **Format:** 720×900, 4:5 portrait, 30 fps, 14.51 s, 435 frames.
- **Voiceover:** none. **On-screen text carries all messaging.**
- **Brands:** Recurly (gold/yellow, black wordmark) and JUSPAY Hyperswitch (royal blue, white wordmark).
- **CTA / payoff text:** **"Live Now"** (white pill, indigo outline + indigo text).
- **Verbatim on-screen labels (complete set):** `Renewal Success`, `Secure Payments`, `Subscriptions`, `Retries`, `APMs`, `Automated Billing`, `Revenue Analytics`, `Success rate`, `99.999%`, `PSP`, `Recurly`, `JUSPAY hyperswitch`, `Live Now`.
- **Style:** deterministic 3D render (PBR), soft-touch matte plastic keycaps in brushed-metal sockets, high-key soft lighting, very shallow depth of field, subtle bloom, drifting dappled/caustic light. **Not** an AI-generated look.

---

## 3. Frame-accurate timeline (the spine)

Times in seconds @30 fps (frame N ⇒ t=(N−1)/30). "Swap" = a 1-frame mechanical keycap change integrated into the moving camera (no cut).

| # | t (s) | frames | On-screen (focal in **bold**) | Motion / event |
|---|---|---|---|---|
| **S1 Open** | 0.00–2.13 | 1–64 | **Secure Payments** (blue shield+check) centered; **Renewal Success** (blue progress ring+check) upper-right; faint `Automated Billing` bar + 5×4 dot-grid; peripheral solid blue & gold tiles | Camera slow **truck-right + crane-up**, slight pan; shallow DOF locked on Secure Payments. **Renewal-ring icon animates fill 75%→100%** by t≈0.17 |
| **⇄ Swap 1** | 2.13→2.17 | 65→66 | grid flips/wipes | in-scene reveal of the column |
| **S2 Column** | 2.17–4.83 | 66–146 | vertical stack: **Subscriptions** (card+refresh icon), **Retries** (circular-arrow icon), **APMs** (globe-grid icon); `Automated Billing` progress bar + dot-grid upper-left | Camera **trucks right across the column + slight dolly-in**. Icon micro-anims: Subscriptions morphs card+refresh ↔ card+**plus** (t≈2.53–2.73); Retries **spins 360°/wobbles** (t≈4.0) |
| **⇄ Swap 2** | 4.83→4.90 | 146→147 | whip-pan / keycap swap | reveal Recurly |
| **S3 Recurly** | 4.90–6.60 | 147–199 | **Recurly** — gold keycap in brushed-metal socket (black looped mark + `Recurly`); `Secure Payments` upper-left; **`Success rate` / `99.999%`** line-graph tile upper-right; `Automated Billing` lower-left | Camera slow **arc: truck-left + boom-up**, faint dolly-in; **dappled light sweeps** across |
| **⇄ Swap 3** | 6.60→6.63 | 199→200 | **mechanical keycap swap**: Recurly **depresses into socket** as Hyperswitch **rises up** | + dolly-out during swap |
| **S4 Hyperswitch** | 6.63–7.97 | 200–240 | **JUSPAY hyperswitch** — royal-blue keycap (white Juspay roundel + `JUSPAY` small-caps over larger lowercase `hyperswitch`); **`Revenue Analytics`** (gold bars) upper-right; **`PSP`** chip in a socket below | Camera **dolly-in + slight tilt**; at t≈7.5–7.97 the keycap **presses down into its socket** with a shadow sweep dimming the frame |
| **S5 Assemble** | 7.97–8.50 | 241–255 | wide flat view forming; **Recurly** keycap **slides in from top** into its slot | Camera **dolly-out + ~10–15° counter-clockwise roll** to reveal the layout |
| **S6 Live Now** | 8.50–8.83 | 256–265 | recessed white pill **rises from its socket**; **`Live Now`** becomes legible (~t8.73), settles ease-out (rise ≈ **0.333 s**) | Camera **static** |
| **S7 Fade** | 8.83–9.23 | 265–277 | all background capability tiles **fade to near-transparent**, isolating the 3 heroes | Camera static |
| **S8 Hold/Payoff** | 9.23–14.47 | 277–435 | **Final lockup:** `Recurly` (top-left) · `Live Now` pill (center) · `JUSPAY hyperswitch` (bottom-right) on a bright tiled-panel surface | Camera **static**; **drifting dappled caustic light** across the surface; scene **gradually brightens** to the end |

**Final composition positions** (fraction of frame, x,y from top-left):
`Recurly` ≈ (0.41, 0.25) · `Live Now` ≈ (0.50, 0.51) · `JUSPAY hyperswitch` ≈ (0.68, 0.75) — a top-left→bottom-right diagonal bridged by the pill.

**Music sync beats:** reveals land on musical accents — column ≈2.1 s, Recurly ≈4.9 s, Hyperswitch ≈6.6 s, Live-Now + resolve ≈8.5 s (beat/arp drop out ~12 s into a sustained pad tail; see §8).

---

## 4. Element inventory

| Label (verbatim) | Kind | Icon | On-screen (s) | Fill | Text/mark color |
|---|---|---|---|---|---|
| `Renewal Success` | capability tile | blue circular **progress ring** + center check (animates) | 0–~2 | white | indigo |
| `Secure Payments` | capability tile | blue **shield** + check | 0–~6.5 | white | indigo |
| `Automated Billing` | background UI | horizontal **progress bar** (yellow fill) + 5×4 **dot-grid** | ~0–8.8 | white/greys | grey |
| `Subscriptions` | capability tile | blue rounded-sq: **card + circular-refresh** (↔ card+plus) | ~2.2–8.8 | white | indigo |
| `Retries` | capability tile | blue rounded-sq: **circular refresh arrow** (spins) | ~2.2–8.8 | white | indigo |
| `APMs` | capability tile | blue (gradient) rounded-sq: **globe w/ grid** | ~2.2–4.9 | white | indigo |
| `Success rate` + `99.999%` | metric tile | **line graph** trending up | ~4.5–8.8 | white | label grey `#A0A0A0`, value dark `#333` |
| `Recurly` | brand keycap | black **looped mark** + wordmark | 4.9–14.5 | **gold** | black `#1C1C1C` |
| `Revenue Analytics` | capability tile | **gold ascending bars** (3–4) | ~6.5–9 | white | grey |
| `JUSPAY hyperswitch` | brand keycap | white **Juspay roundel** (circle enclosing two-tone swirl — **not** an arrow) | 6.6–14.5 | **royal blue** | white |
| `PSP` | UI chip | small chip in a socket (CPU-chip look) | ~6.6–8.8 | blue | white |
| `Live Now` | CTA pill | none | 8.5–14.5 | white pill, indigo outline | indigo, ~bold |

---

## 5. Brand assets (must be pixel-exact — use official kits, do not AI-generate)

- **Recurly lockup:** black **looped/curved mark** (a stylised continuous-loop "r") to the left of the wordmark **`Recurly`** (title-case, geometric sans, ~Bold), all **black** on a **gold** keycap. → Use the official Recurly logo SVG + brand yellow.
- **JUSPAY Hyperswitch lockup:** white **Juspay roundel** mark (a circle enclosing the two-tone Juspay swirl) at left; to its right **`JUSPAY`** in small all-caps stacked **above** a larger lowercase **`hyperswitch`**; all **white** on a **royal-blue** keycap. → Use the official Hyperswitch/Juspay logo SVG + brand blue.
- **Live Now pill:** fully-rounded white pill, thin indigo (slight gradient `#AECBFF`→`#5C6CFF`) border, centered **`Live Now`** in indigo (~Medium/Bold), soft drop shadow.
- **Keycap/socket system:** every hero brand sits as a thick, soft-bevel matte-plastic **keycap** recessed in a **brushed-metal (aluminium) socket** — this "mechanical keyboard key" motif drives the swap/press transitions.

---

## 6. Color palette (best-pick — confirm heroes against official brand kits)

| Name | Hex (best) | Observed range | Where |
|---|---|---|---|
| Background off-white | `#F3F6F9` | `#F0F4F8`–`#F3F6F9` | base surface |
| Panel grey (base grid) | `#E9EAEF` | — | large floor tiles |
| Tile white | `#FFFFFF` | — | capability keycaps |
| **Recurly gold** | `#FFD11E` | `#FDB813`–`#FFD60A` | Recurly keycap, bar chart |
| Recurly wordmark black | `#1C1C1C` | `#000`–`#1C1C1C` | Recurly text/mark |
| **Hyperswitch blue** | `#2E52D6` | `#254CFF`–`#3D52D5` | Hyperswitch keycap |
| Juspay indigo (icons/labels) | `#3646E6` | `#2A40E8`–`#3B5BFF` | tile icons + labels, Live-Now text |
| Socket brushed-metal | `#C0C4CC` | `#A8A9AD`–`#C5C8CF` | keycap sockets |
| Metric value dark / label grey | `#333333` / `#A0A0A0` | — | 99.999% / Success rate |

> **Lighting caveat (verified by pixel sampling).** The scene is strongly high-key with bloom, so **on-screen pixels are lighter/less-saturated than the true brand color** — the Hyperswitch keycap samples only `#4B58A3` when well-lit and washes to `~#8AADE8` in the bright final frames; Recurly gold samples `#CFB93C`→`#93822D` depending on light. **Do not treat screen pixels as the brand hex.** For reproduction, set each keycap's **material albedo to the official Recurly yellow / Hyperswitch-Juspay blue** and let the high-key lighting desaturate it (as the original does). Pull exact albedo from the official brand kits.

---

## 7. Typography

- **UI / capability labels, metric, PSP, Live Now:** geometric sans — closest **Circular Std / Plus Jakarta Sans** (single-story a, circular o). Weights ~Book–Medium (400–500); title-case labels, PSP all-caps, slightly open tracking (+10–25). Icon stacked above (or left of) the centered label; generous padding; high corner radius (~25–30% of height); soft drop shadow.
- **`99.999%`:** same family, Medium/Bold, ~1.5–2× the "Success rate" label size; value dark, label grey; left-aligned pair on the graph tile.
- **Recurly wordmark:** brand-custom geometric sans (Bold), title-case, black.
- **Hyperswitch wordmark:** clean geometric sans (Gilroy/Montserrat-like); `JUSPAY` Bold all-caps, `hyperswitch` Regular/Medium lowercase; white; stacked right of the mark.

---

## 8. Audio / music brief (no voiceover)

- **Style:** modern corporate **future-bass / chillstep**, uplifting, professional, faintly dramatic; **minor key** with an uplifting resolve.
- **Tempo:** ~**65 BPM half-time feel** (16th-note synths imply ~130 base).
- **Instrumentation:** deep sub-kick, wide reverberant snare/clap, pulsing sub-bass, **chopped/pitched female vocal "ooh/aah"** hook (heavy delay/reverb), driving arpeggiated synth, wide atmospheric pads.
- **Structure:** 0–2 s pads + vocal-chop intro & low riser → 2–12 s full half-time beat + arp (carries all reveals) → 12–14.5 s beat/arp drop out, resolve on a sustained pad chord, vocal reverb tail fades.
- **Mix:** loud, compressed, wide stereo, centered low end. No ducking (no VO).
- **Reproduction tags:** `corporate` `electronic` `uplifting` `future-bass` `chillstep` `vocal-chops` `ambient-pads` `tech-partnership` `~65bpm-halftime` `minor-key-resolve`.

---

## 9. Production technique verdict

Deterministic **3D render** (Blender/Cinema 4D/Houdini + PBR engine such as Cycles/Redshift/Octane). Evidence: true beveled geometry with view-consistent specular on edges, physically-correct **contact shadows + ambient occlusion**, a **traveling focal plane** (rack focus) only a real 3D camera produces, correct 3D parallax across depth layers, brushed-metal socket material. It is **one cohesive scene with a single animated camera**; the "section changes" are in-scene **keycap press/rise swaps**, not edits. This is **not** achievable at fidelity by current AI video generators — brand wordmarks, crisp UI text, exact icons, and the choreographed reveal all require deterministic authoring.

---

## 10. Reproduction plan (how to match it exactly)

**Recommended: deterministic 3D, not AI-gen.** Two viable routes:

1. **Remotion + `@remotion/three` (React/TSX) — preferred for this repo.** Programmatic scene, camera spline, and easing timed to audio; crisp text/logos via three-mesh-ui or textured planes from official SVGs; render to 720×900@30. Fits Director's rendering stack and makes the piece templatable.
2. **Blender/C4D** — model keycaps + sockets, PBR materials, soft area light, animated camera on a spline with keyframed focus distance, per-tile float noise; import brand logos as vector/geometry; render 435 frames.

**Build task list (either route):**
- Assets: keycap + socket meshes; capability tiles; **official Recurly & Hyperswitch logos (SVG)**; capability icons (shield, progress-ring, card+refresh/+plus, refresh, globe-grid, ascending bars, line graph); "Live Now" pill; dot-grid + progress-bar UI bits.
- Layout: scatter the capability-tile "world"; place hero sockets for Recurly (top-left) & Hyperswitch (bottom-right) + central Live-Now slot.
- Materials/light: matte soft-touch plastic, brushed-metal sockets, high-key soft key from top-left, strong AO, subtle bloom, **very shallow DOF**, drifting **caustic/gobo** light on the floor.
- Animation to the §3 timeline: camera drift + 3 keycap swaps (press/rise), icon micro-anims (ring fill, card morph, retry spin), keycap press at ~7.5 s, Recurly slide-in, Live-Now rise (0.333 s ease-out) at 8.5 s, background fade at ~8.9 s, static bright hold + light drift to 14.5 s.
- Audio: source/compose a ~14.5 s future-bass bed per §8; align accents to reveal times.
- Output: H.264, 720×900, 30 fps, ~14.51 s, stereo AAC.

**Director-pipeline (AI-gen) feasibility:** the current wan/kling/seedance route will **not** reproduce the crisp wordmarks/UI text or the choreographed keycap mechanics. Best AI-hybrid would be: AI-gen only an ambient soft-focus "floating tiles" background plate, then **composite crisp vector brand keycaps + text + Live-Now in Remotion** — still requires deterministic overlay for every branded/legible element. For an *exact* match, go fully deterministic (route 1).

---

## 11. Fidelity checklist (what proves an exact match)

- [ ] 720×900, 30 fps, 14.51 s, no hard cuts.
- [ ] Verbatim text set (§2) correct, correctly cased, crisp/stable (no warble).
- [ ] Recurly (gold, black looped mark) top-left; Hyperswitch (blue, Juspay roundel) bottom-right; Live-Now pill center — final diagonal lockup.
- [ ] The **3 keycap swaps** at ≈2.13 / 4.83 / 6.60 s and the **press/rise mechanics** (Recurly depress ↔ Hyperswitch rise).
- [ ] Icon micro-anims: renewal ring fill, subscriptions card↔plus morph, retries 360° spin, hyperswitch keycap press ~7.5 s.
- [ ] Live-Now pill **rises 0.333 s** ease-out at ~8.5 s; background fades ~8.9 s.
- [ ] Shallow DOF with a **traveling** focal plane; high-key soft light; brushed-metal sockets; drifting dappled caustics; end brighten.
- [ ] Future-bass bed, ~65 BPM half-time, vocal chops, resolve on pad ~12 s. No voiceover.

---

## 12. Verification & confidence

**Method.** Downloaded copy → 435 frames + audio extracted → **Gemini 2.5 Pro** run in three layers: 8 whole-video/audio passes (structure, text, audio, camera, color, type, brand, technique), **29 dense per-window frame-by-frame passes** (15 native frames each), then **29 adversarial verification passes** (Gemini re-checks each window against the frames). Cross-checked by direct human/agent frame inspection and ImageMagick pixel sampling.

**High confidence** (multi-pass agreement + direct inspection): the 4:5/30fps/14.51s fingerprint; no voiceover; the verbatim text set; the two brands + Live-Now payoff; the 5-scene arc and the **3 keycap-swap reveal points** (~2.13 / 4.83 / 6.60 s); the Live-Now rise (~8.5 s, 0.333 s) and background fade (~8.9 s); the static bright final hold; the deterministic-3D technique verdict; the audio brief.

**Lower confidence — treat as approximate:**
- **Per-window camera *direction*** is noisy: the model repeatedly inverted truck-left vs -right (elements-move vs camera-move confusion). Trust the **reveal timeline + overall slow continuous drift**, not any single window's L/R vector.
- **Exact hex** of the keycaps — lighting desaturates them (see §6 caveat); use official brand albedo.
- **Sub-frame timings** are ±1–2 frames; **positions** are ±0.05 of frame.

**Verify-derived refinements folded in:** keycap swaps are **mechanical press/rise** (out-going depresses, in-coming rises), not instant cuts; the Renewal-Success ring fills ~**180°** with **two blue shades** (dark outer ring, lighter arc); the Subscriptions icon is a **3D two-face flip** (card ⇄ blue tile + white plus), not a card flipping to its back; final layout is **Recurly left-of-center / Hyperswitch right-of-center** (not centered); a faint **shimmer** on the Live-Now outline persists through the hold.

---

## 13. Appendix — analysis artifacts & how to reproduce the analysis

```
reference/hyperswitch-recurly-7485945590804062208/
├─ target.mp4                     # the downloaded source
├─ audio.mp3                      # extracted audio
├─ gemini-lib.mjs / gemini-analyze.mjs / run-analysis.mjs   # Gemini analysis harness
├─ analysis/
│  ├─ global/  A1_structure.md  A2_text_timeline.json  A3_audio.md
│  │           A4_camera_motion.md  A5_color_lighting.md  A6_typography.md
│  │           A7_brand_assets.json  A8_technique.md
│  ├─ windows/ w01..w29.md        # dense per-window frame-by-frame (15 frames/window)
│  └─ verify/  w01..w29.md        # adversarial re-check of each window
└─ evidence/
   ├─ storyboard_keyframes.jpg    # labeled 14-beat storyboard
   ├─ contact_2fps_6x5.jpg        # full 2-fps contact sheet
   ├─ keyframes/                  # the beat keyframes
   └─ windows/                    # per-second contact sheets
```

**Re-run:** `export GEMINI_API_KEY=…` then
`node run-analysis.mjs --stage global|windows|verify|all`
(frames were extracted with `ffmpeg -i target.mp4 -vsync 0 -q:v 2 frames_all/f_%03d.jpg`).
Analysis model: **gemini-2.5-pro**, `MEDIA_RESOLUTION_HIGH`, video passes at 4–10 fps sampling, window passes at native 30 fps.
