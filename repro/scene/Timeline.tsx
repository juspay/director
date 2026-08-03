import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Keycap } from './Keycap';
import { SetDressing, Peripherals, Well, TILE_TOP, WELL_FLOOR } from './SetDressing';
import { C, FPS, T } from './theme';
import {
  pillFaceH,
  capabilityFaceV,
  recurlyFace,
  hyperswitchFace,
  liveNowFace,
  revenueFace,
  successRateFace,
  pspFace,
  metalTexture,
  cloudTexture,
} from './faces';

/**
 * Dappled light pooling on the floor. Must stay BELOW the card faces — a
 * full-scene haze sheet drawn over the top washes every logo and label out.
 * Atmospheric depth comes from scene fog instead.
 */
export const CloudOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useMemo(() => cloudTexture(), []);
  a.repeat.set(1.15, 1.15);
  a.offset.set(frame * 0.0007, frame * 0.0004);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial map={a} transparent opacity={0.8} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/**
 * SHOTS ARRIVE RESOLVED.
 *
 * There is deliberately no entrance animation here. The per-second analysis
 * found, in seconds 0, 4, 5, 6, 8 and 10, that this scene "starts with an empty
 * layout and slides the cards in late or sequentially after the cut" while the
 * reference cuts to shots that are already staged. At the f147 cut the old
 * build showed a BLANK card and the Recurly logo arrived 0.229s later.
 *
 * The earlier `rise()` helper drove every cap up out of the floor from the
 * start of its shot. Its symptom was logged in AUDIT.md as "20 soft frames at
 * shot entrances" and treated as a sharpness problem; it is a staging problem.
 * Motion within a shot now comes from the camera alone, which is what the
 * reference does.
 */

/**
 * FIVE SHOTS, HARD CUT.
 *
 * The original reconstruction spec claimed a single continuous camera with zero
 * hard cuts. That was wrong, and it was the premise this whole scene was built
 * on. Frame-delta analysis of the reference shows four spikes at f66/147/200/243
 * measuring 9-20x the mean — and inspecting those pairs shows a complete change
 * of camera, layout and subject across a single frame boundary. ffmpeg's scene
 * detection missed them because every shot shares the same white/blue/yellow
 * palette, so the default threshold never tripped.
 *
 * Each shot therefore gets its own camera path, interpolated with Catmull-Rom
 * *within the shot only* — never across a cut. Travel inside each shot is sized
 * against the reference's ~0.0148 mean frame delta; the earlier continuous path
 * managed a fifth of that.
 */
export const CUTS = [66, 147, 200, 243];

type Key = { f: number; pos: [number, number, number]; tgt: [number, number, number]; roll: number; fov: number };
type Shot = { start: number; end: number; keys: Key[] };

/**
 * MACRO ELEVATION, second calibration (pass 11): the pass-8 raise to 58-66deg
 * overshot — 'B more directly overhead' was frame-confirmed three times over
 * two verification passes. Walked back ~10deg (55/54/48/48), same
 * azimuth-and-distance-preserving recompute.
 *
 * MACRO ELEVATION RAISED (pass 8). Eight verified pass-7 camera findings said
 * "A closer"; the eyewitness frames showed the real variable is ELEVATION —
 * the reference shoots its macro beats from ~60-70deg down into dense frames,
 * while these orbits sat at ~38-42deg, which rotated type diagonal and
 * emptied the surroundings. Keys recomputed holding azimuth and camera-to-
 * target distance constant, so subject size and the sweep behaviour survive.
 */
const SHOTS: Shot[] = [
  {
    start: 0, end: 65,
    keys: [
      { f: 0, pos: [1.90, 3.42, 1.43], tgt: [0.00, 0.15, 0.15], roll: -0.25, fov: 34 },
      { f: 32, pos: [0.16, 3.43, 2.44], tgt: [0.00, 0.15, 0.15], roll: -0.18, fov: 34 },
      { f: 65, pos: [-1.81, 3.42, 1.56], tgt: [0.00, 0.15, 0.15], roll: -0.1, fov: 34 },
    ],
  },
  {
    start: 66, end: 146,
    keys: [
      { f: 66, pos: [-1.50, 4.16, 2.49], tgt: [0.00, 0.16, 0.00], roll: -0.07, fov: 33 },
      { f: 106, pos: [-0.31, 4.17, 2.89], tgt: [0.00, 0.16, 0.00], roll: -0.12, fov: 33 },
      { f: 146, pos: [0.84, 4.17, 2.79], tgt: [0.00, 0.16, 0.00], roll: -0.17, fov: 33 },
    ],
  },
  {
    start: 147, end: 199,
    keys: [
      { f: 147, pos: [1.99, 3.38, 2.13], tgt: [0.03, 0.18, 0.02], roll: -0.27, fov: 34 },
      { f: 173, pos: [0.62, 3.38, 2.84], tgt: [0.03, 0.18, 0.02], roll: -0.22, fov: 34 },
      { f: 199, pos: [-0.87, 3.38, 2.76], tgt: [0.03, 0.18, 0.02], roll: -0.15, fov: 34 },
    ],
  },
  {
    start: 200, end: 242,
    keys: [
      { f: 200, pos: [-1.83, 3.38, 2.23], tgt: [0.02, 0.18, 0.02], roll: -0.08, fov: 34 },
      { f: 221, pos: [-0.38, 3.37, 2.86], tgt: [0.02, 0.18, 0.02], roll: -0.13, fov: 34 },
      { f: 242, pos: [1.19, 3.37, 2.64], tgt: [0.02, 0.18, 0.02], roll: -0.19, fov: 34 },
    ],
  },
  {
    start: 243, end: 434,
    keys: [
      { f: 243, pos: [-0.20, 14.26, 3.91], tgt: [0.0, 0.05, 0.10], roll: -0.10, fov: 24 },
      { f: 275, pos: [-0.09, 15.55, 3.56], tgt: [0.0, 0.02, 0.10], roll: -0.07, fov: 21 },
      { f: 300, pos: [-0.03, 16.44, 3.29], tgt: [0.0, 0.0, 0.10], roll: -0.05, fov: 20 },
      { f: 360, pos: [0.15, 16.59, 3.33], tgt: [0.02, 0.0, 0.10], roll: -0.045, fov: 20 },
      { f: 434, pos: [-0.18, 16.76, 3.39], tgt: [-0.02, 0.0, 0.10], roll: -0.038, fov: 20 },
    ],
  },
];

export function shotIndex(frame: number): number {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (frame >= SHOTS[i].start) return i;
  return 0;
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/**
 * Per-shot dolly-back, applied about the look-at point.
 *
 * Subjects were rendering markedly larger than the reference's, to the point of
 * leaving the frame: at f30 the "Renewal Success" cap was clipped mid-word by
 * the right edge, and through all of shot 2 the APMs cap sat entirely outside
 * the frame with only two of three ever visible. The audit scored edge-clipping
 * as zero throughout, because it counted brand-coloured pixels touching the
 * border and neither of those is brand-coloured.
 *
 * Scaling about the target rather than editing positions keeps each shot's
 * angle and roll exactly as tuned and only changes how much set is in frame.
 *
 * Kept deliberately small. A previous revision paired a 1.54 dolly with a
 * 27-degree lens to flatten perspective convergence, and the analysis rejected
 * it in fourteen of fifteen seconds — "flat, orthographic-like appearance",
 * "zoomed too far back", "excessive empty space". The reference genuinely does
 * shoot these macro beats close with a dramatic perspective; what actually
 * needed fixing was the AZIMUTH rotating the type off-horizontal, which SWEEP
 * handles. This now backs off only far enough to keep subjects inside frame.
 */
// Shot 1 pulled back in (1.14 -> 1.06): the verified eyewitness finding has
// the reference closer with heavier edge falloff, and 1.14 was an
// overcorrection — the clipping it fixed is re-checked by still at f30.
// Shot 5 pushed in (1.0 -> 0.88): the lockup's brand cards measured ~12-15%
// smaller in frame than the reference's.
// 1.06 re-clipped "Renewal Success" mid-word at the right edge (checked by
// still at f30) — 1.11 is the closest the verified "reference is closer"
// finding can get without reintroducing that regression.
const DOLLY = [1.11, 1.16, 1.12, 1.12, 0.88];

/**
 * Per-shot azimuth sweep, applied about the shot's own mean bearing.
 *
 * Removing the entrance animations cost 40% of measured motion (median frame
 * delta 1.04x -> 0.60x), which is worth stating plainly: the motion metric had
 * been substantially satisfied by the pop-in staging that the analysis
 * identified as a defect. Chasing that number is what kept the defect alive.
 *
 * The replacement has to be camera movement, and it has to be ANGULAR. An
 * earlier pass tried scaling positional travel, hit the metric, and looked
 * worse — scaling position changes camera distance, so subjects ballooned and
 * shrank at the path extremes. Widening the azimuth instead holds radius and
 * elevation exactly, so parallax increases while subject size does not move.
 *
 * Shot 2 is deliberately left at 1.0. Its subjects are three axis-aligned
 * label cards, and azimuth is exactly what rotates their type in frame: at 1.5
 * the sweep reached +-36 degrees off-axis and set the labels running at ~40
 * degrees, against roughly 10 in the reference. Legible type wins over the
 * motion metric here — that metric has already been shown to reward the wrong
 * thing once in this scene.
 */
// Shot 2 compressed to 0.45: even at elevation ~64deg its keyframe azimuths
// spanned -31..+17deg and set the column labels running ~30deg off-horizontal
// against the reference's ~10.
const SWEEP = [1.35, 0.45, 1.3, 1.3, 1.0];

/** Widen a keyframe's bearing about the shot's mean, at constant radius. */
function sweepPos(
  pos: [number, number, number],
  tgt: [number, number, number],
  meanAz: number,
  k: number,
): [number, number, number] {
  const dx = pos[0] - tgt[0];
  const dz = pos[2] - tgt[2];
  const r = Math.hypot(dx, dz);
  let d = Math.atan2(dx, dz) - meanAz;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const az = meanAz + d * k;
  return [tgt[0] + Math.sin(az) * r, pos[1], tgt[2] + Math.cos(az) * r];
}

/** Mean bearing of a shot's keyframes, the axis its sweep widens about. */
function meanAzimuth(s: Shot): number {
  let sx = 0;
  let sz = 0;
  for (const k of s.keys) {
    const a = Math.atan2(k.pos[0] - k.tgt[0], k.pos[2] - k.tgt[2]);
    sx += Math.sin(a);
    sz += Math.cos(a);
  }
  return Math.atan2(sx, sz);
}

export const CameraRig: React.FC = () => {
  const camera = useThree((s) => s.camera);
  const frame = useCurrentFrame();
  const si = shotIndex(frame);
  const shot = SHOTS[si];
  const dolly = DOLLY[si];
  const az = useMemo(() => meanAzimuth(shot), [shot]);
  const ks = useMemo(
    () => shot.keys.map((k) => ({ ...k, pos: sweepPos(k.pos, k.tgt, az, SWEEP[si]) })),
    [shot, az, si],
  );
  let i = 0;
  while (i < ks.length - 2 && frame >= ks[i + 1].f) i++;
  const a = ks[i];
  const b = ks[i + 1];
  const p0 = ks[Math.max(0, i - 1)];
  const p3 = ks[Math.min(ks.length - 1, i + 2)];
  const t = clamp01((frame - a.f) / (b.f - a.f));
  const cr = (k: 'pos' | 'tgt', n: number) => catmull(p0[k][n], a[k][n], b[k][n], p3[k][n], t);
  const lin = (k: 'roll' | 'fov') => a[k] + (b[k] - a[k]) * t;
  const wob = Math.sin(frame / 23) * 0.055;
  const bob = Math.cos(frame / 37) * 0.045;
  // Kinetic settle into each shot: the camera lands from a cut still carrying
  // momentum along its incoming path and springs to rest — energy at the cut
  // without any entrance staging.
  const settle = si > 0 ? 1 - spring({ frame: frame - shot.start, fps: FPS, config: { damping: 13, stiffness: 125, mass: 0.9 } }) : 0;
  const sdx = ks[1].pos[0] - ks[0].pos[0];
  const sdz = ks[1].pos[2] - ks[0].pos[2];
  const sdl = Math.hypot(sdx, sdz) || 1;
  const tx = cr('tgt', 0);
  const ty = cr('tgt', 1);
  const tz = cr('tgt', 2);
  camera.position.set(
    tx + (cr('pos', 0) - tx) * dolly + wob - (sdx / sdl) * 0.09 * settle,
    ty + (cr('pos', 1) - ty) * dolly + bob,
    tz + (cr('pos', 2) - tz) * dolly - (sdz / sdl) * 0.09 * settle,
  );
  camera.lookAt(new THREE.Vector3(tx, ty, tz));
  camera.rotateZ(lin('roll'));
  (camera as THREE.PerspectiveCamera).fov = lin('fov');
  camera.updateProjectionMatrix();
  return null;
};

const CAP: [number, number, number] = [1.34, 0.125, 0.88];
const BRAND: [number, number, number] = [1.60, 0.145, 0.98];

const F_PILL: [number, number] = [1.20, 1.20 / 1.65];
const F_COL: [number, number] = [1.20, 1.20 / 1.55];
const F_RECURLY: [number, number] = [1.32, 1.32 / 4.0];
const F_HYPER: [number, number] = [1.34, 1.34 / 3.0];
const F_LIVE: [number, number] = [1.36, 1.36 / 2.67];
const F_SUCCESS: [number, number] = [1.18, 1.18 / 1.5];
const F_REVENUE: [number, number] = [1.18, 1.18 / 1.8];

/**
 * Each shot sits over a different patch of the wall, so a cut changes the
 * backdrop as well as the subject.
 *
 * There is no longer a per-shot Y spin. Rotating the whole set was what made
 * the tiles read as a scattered pile rather than a wall — the reference's
 * surface is strictly axis-aligned in every shot, and the analysis flagged the
 * skew as far as "plates rotated off-axis" in the lockup. Translation alone
 * changes the backdrop without destroying the grid.
 */
const SET_OFFSET: Array<[number, number, number]> = [
  [0, 0, 0],
  // Shot 2's patch chosen so a dotted tile lands LEFT of the capability
  // column — verified layout finding: dots left in the reference, right here.
  [-2.2, 0, -1.1],
  [-2.60, 0, 3.35],
  [4.20, 0, 2.10],
  [-1.45, 0, -3.60],
];

/**
 * Seat heights, measured against the tiled surface at TILE_TOP.
 *
 * A plain cap sinks a few millimetres into the wall so it has something to cast
 * a contact shadow onto; a brand plate sits down inside a WELL_DEPTH recess so
 * its bezel surrounds it, proud by a few millimetres exactly as the reference's
 * plates sit in their metal frames.
 */
const CAP_Y = TILE_TOP + 0.125 / 2 - 0.008;
/**
 * Plain cards FLOAT (pass 11, frame-confirmed): the reference's pill and
 * capability cards hover off the wall with pronounced soft drop shadows
 * beneath — 'very faint or absent drop shadows, cards flat against the
 * keyboard' survived eyewitness while ours sat seated. Heroes stay in their
 * wells; everything else lifts onto its shadow, which the directional light
 * (the working shadow-caster) draws onto the wall below.
 */
const FLOAT_Y = TILE_TOP + 0.125 / 2 + 0.085;
const BRAND_Y = WELL_FLOOR + 0.145 / 2;

/** Hero slot — both brand plates occupy this one well, one per shot. */
const HERO: [number, number, number] = [0.05, BRAND_Y, 0.05];
const HERO_WELL: [number, number, number] = [0.05, TILE_TOP, 0.05];
const LOCK_RECURLY: [number, number, number] = [-0.74, BRAND_Y, -0.98];
const LOCK_HYPER: [number, number, number] = [0.74, BRAND_Y, 1.12];

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = shotIndex(frame);
  /**
   * Living faces. The early per-second analysis listed "icon micro-animations"
   * among what moves in the reference every second it examined: the Retries
   * spinner turns, the Renewal progress ring sweeps. These two textures are
   * therefore frame-dependent; each new CanvasTexture disposes its
   * predecessor or 435 frames of 2.5MB uploads pile up on the GPU.
   */
  const renewal = useMemo(
    () => pillFaceH('Renewal', 'Success', 'ring', interpolate(frame, [0, 60], [0.45, 0.97], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
    [frame],
  );
  const retries = useMemo(() => capabilityFaceV('Retries', 'refresh', false, frame * 0.05), [frame]);
  React.useEffect(() => () => { renewal.dispose(); }, [renewal]);
  React.useEffect(() => () => { retries.dispose(); }, [retries]);
  const gridAssemble = shot === 4
    ? spring({ frame: frame - T.assemble, fps: FPS, config: { damping: 15, stiffness: 70, mass: 1.15 } })
    : 1;
  const f = useMemo(
    () => ({
      secure: pillFaceH('Secure', 'Payments', 'shield'),
      subs: capabilityFaceV('Subscriptions', 'card'),
      apms: capabilityFaceV('APMs', 'globe', true),
      recurly: recurlyFace(),
      hyper: hyperswitchFace(),
      live: liveNowFace(),
      revenue: revenueFace(),
      success: successRateFace(),
      psp: pspFace(),
      metal: metalTexture(),
    }),
    [],
  );

  // Timed to the spec's bgFade event (f266-277) and strengthened: the
  // reference's background fade is a visible motion event, not a whisper.
  const whiten = interpolate(frame, [266, 277], [0, 0.22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <SetDressing
        whiten={whiten}
        offset={SET_OFFSET[shot]}
        brandRadius={shot === 4 ? 2.6 : 3.5}
        plainOnly={shot === 4}
        heroAccent={shot === 2 ? 'blue' : shot === 3 ? 'gold' : 'both'}
        assemble={gridAssemble}
      />
      <Peripherals whiten={whiten} />

      {/* Shot 1 — Secure Payments / Renewal Success */}
      {shot === 0 && (
        <>
          <Keycap position={[-0.06, FLOAT_Y, 0.30]} size={CAP} color={C.card} face={f.secure} faceSize={F_PILL} />
          <Keycap position={[0.86, FLOAT_Y, -0.92]} size={CAP} color={C.card} face={renewal} faceSize={F_PILL} />
        </>
      )}

      {/* Shot 2 — Subscriptions / Retries / APMs column.
          Spacing tightened from 1.12 to 0.94: at the old pitch the APMs cap sat
          entirely outside the frame for the whole shot and only two of the
          three were ever visible. */}
      {shot === 1 && (
        <>
          <Keycap position={[-0.05, FLOAT_Y, -0.94]} size={CAP} color={C.card} face={f.subs} faceSize={F_COL} />
          <Keycap position={[-0.05, FLOAT_Y, 0.00]} size={CAP} color={C.card} face={retries} faceSize={F_COL} />
          <Keycap position={[-0.05, FLOAT_Y, 0.94]} size={CAP} color={C.card} face={f.apms} faceSize={F_COL} />
        </>
      )}

      {/* Shot 3 — Recurly hero */}
      {shot === 2 && (
        <>
          <Well position={HERO_WELL} size={[BRAND[0], BRAND[2]]} metalMap={f.metal} whiten={whiten} tone="dark" />
          <Keycap
            position={[HERO[0], Math.max(HERO[1] + 0.003, HERO[1] + 0.004 + 0.045 * (1 - spring({ frame: frame - 149, fps: FPS, config: { damping: 12, stiffness: 160, mass: 0.85 } }))), HERO[2]]}
            size={BRAND}
            color={C.gold}
            face={f.recurly}
            faceSize={F_RECURLY}
          />
          <Keycap position={[-1.32, FLOAT_Y, -1.30]} size={[1.15, 0.115, 0.72]} color={C.card} face={f.secure} faceSize={[1.02, 1.02 / 1.65]} />
          <Keycap position={[1.44, FLOAT_Y, -1.45]} size={CAP} color={C.card} face={f.success} faceSize={F_SUCCESS} />
        </>
      )}

      {/* Shot 4 — Hyperswitch hero. The cap arrives raised and PRESSES into
          its socket at T.hyPressStart — an in-shot action the reference
          performs with a spring settle (reconstruction spec §3). This is
          Remotion's spring(), not an entrance animation: the shot still cuts
          in fully staged. */}
      {shot === 3 && (
        <>
          <Well position={HERO_WELL} size={[BRAND[0], BRAND[2]]} metalMap={f.metal} whiten={whiten} tone="dark" />
          <Keycap
            position={[HERO[0], Math.max(HERO[1] + 0.005, HERO[1] + 0.035 + 0.125 * (1 - spring({ frame: frame - T.hyPressStart, fps: FPS, config: { damping: 11, stiffness: 170, mass: 0.8 } }))), HERO[2]]}
            size={BRAND}
            color={C.blue}
            face={f.hyper}
            faceSize={F_HYPER}
          />
          <Keycap position={[1.48, FLOAT_Y, -1.40]} size={CAP} color={C.card} face={f.revenue} faceSize={F_REVENUE} />
          {/* PSP per the verified staging finding: a WHITE keycap carrying a
              small recessed indigo square, not a solid blue mini-cap. */}
          <Keycap
            position={[-1.28, TILE_TOP + 0.05 - 0.008 + 0.04 * (1 - spring({ frame: frame - (T.hyPressStart + 8), fps: FPS, config: { damping: 10, stiffness: 150 } })), 0.62]}
            size={[0.5, 0.10, 0.5]}
            radius={0.09}
            color={C.card}
            face={f.psp}
            faceSize={[0.4, 0.4]}
          />
        </>
      )}

      {/* Shot 5 — wide lockup. The spec's T.assemble event (f240): the cut
          lands while the three elements are still TRAVELLING into the lockup
          arrangement, settling by ~f258 — in-shot action straight from the
          reference's event table, and the source of its big t=8.0-8.5 motion. */}
      {shot === 4 && (() => {
        const asm = spring({ frame: frame - (T.assemble + 3), fps: FPS, config: { damping: 14, stiffness: 90, mass: 1.1 } });
        const slide = 0.5 * (1 - asm);
        return (
        <>
          <Well position={[LOCK_RECURLY[0] - slide, TILE_TOP, LOCK_RECURLY[2] - slide * 0.7]} size={[BRAND[0], BRAND[2]]} metalMap={f.metal} whiten={whiten} />
          <Keycap position={[LOCK_RECURLY[0] - slide, LOCK_RECURLY[1], LOCK_RECURLY[2] - slide * 0.7]} size={BRAND} color={C.gold} face={f.recurly} faceSize={F_RECURLY} />
          <Well position={[LOCK_HYPER[0] + slide, TILE_TOP, LOCK_HYPER[2] + slide * 0.7]} size={[BRAND[0], BRAND[2]]} metalMap={f.metal} whiten={whiten} />
          <Keycap position={[LOCK_HYPER[0] + slide, LOCK_HYPER[1], LOCK_HYPER[2] + slide * 0.7]} size={BRAND} color={C.blue} face={f.hyper} faceSize={F_HYPER} />
          {/* The pill RISES at T.liveRiseStart with a spring overshoot —
              the reference's one true entrance, timed by the spec. Before
              that it is simply absent, exactly as in the reference. */}
          {frame >= T.liveRiseStart && (
            <Keycap
              position={[0, TILE_TOP + 0.12 / 2 - 0.008 - 0.22 * (1 - spring({ frame: frame - T.liveRiseStart, fps: FPS, config: { damping: 9, stiffness: 150, mass: 0.9 } })), 0.12]}
              size={[1.52, 0.12, 0.62]}
              radius={0.29}
              color={C.white}
              face={f.live}
              faceSize={F_LIVE}
            />
          )}
        </>
        );
      })()}
    </>
  );
};
