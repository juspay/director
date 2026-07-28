import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { interpolate, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Keycap } from './Keycap';
import { Slab } from './Slab';
import { SetDressing, Peripherals } from './SetDressing';
import { C, T } from './theme';
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
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** How far below the floor a retired cap sits. Deep enough to be fully hidden. */
const SINK = 0.55;

/**
 * A keycap slot: the cap rises out of the floor aperture at `inAt` and presses
 * back down into it at `outAt`.
 *
 * This replaces the previous cross-dissolve between duplicated groups, which
 * put two Hyperswitch caps on screen simultaneously at f243 and ghosted ~14% of
 * the runtime. The reference never dissolves — a cap physically presses down and
 * another rises through the same hole — so the swap is modelled as motion, and
 * every cap stays fully opaque for its whole life.
 */
function slot(
  frame: number,
  inAt: number,
  outAt: number,
  riseDur = 9,
  sinkDur = 7,
): { y: number; visible: boolean } {
  let y: number;
  if (frame < inAt) y = -SINK;
  else if (frame < inAt + riseDur) y = -SINK + SINK * easeOutCubic((frame - inAt) / riseDur);
  else if (outAt === Infinity || frame < outAt) y = 0;
  else if (frame < outAt + sinkDur) y = -SINK * easeInCubic((frame - outAt) / sinkDur);
  else y = -SINK;
  return { y, visible: y > -SINK + 0.004 };
}

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

const SHOTS: Shot[] = [
  {
    start: 0, end: 65,
    keys: [
      { f: 0, pos: [2.46, 2.83, 1.81], tgt: [0.00, 0.15, 0.15], roll: -0.25, fov: 34 },
      { f: 32, pos: [0.21, 2.72, 3.21], tgt: [0.00, 0.15, 0.15], roll: -0.18, fov: 34 },
      { f: 65, pos: [-2.48, 2.61, 2.09], tgt: [0.00, 0.15, 0.15], roll: -0.1, fov: 34 },
    ],
  },
  {
    start: 66, end: 146,
    keys: [
      { f: 66, pos: [-1.89, 3.47, 3.15], tgt: [0.00, 0.16, 0.00], roll: -0.07, fov: 33 },
      { f: 106, pos: [-0.39, 3.41, 3.72], tgt: [0.00, 0.16, 0.00], roll: -0.12, fov: 33 },
      { f: 146, pos: [1.11, 3.34, 3.63], tgt: [0.00, 0.16, 0.00], roll: -0.17, fov: 33 },
    ],
  },
  {
    start: 147, end: 199,
    keys: [
      { f: 147, pos: [2.28, 2.94, 2.43], tgt: [0.03, 0.18, 0.02], roll: -0.27, fov: 34 },
      { f: 173, pos: [0.72, 2.89, 3.29], tgt: [0.03, 0.18, 0.02], roll: -0.22, fov: 34 },
      { f: 199, pos: [-1.02, 2.83, 3.24], tgt: [0.03, 0.18, 0.02], roll: -0.15, fov: 34 },
    ],
  },
  {
    start: 200, end: 242,
    keys: [
      { f: 200, pos: [-2.13, 2.89, 2.58], tgt: [0.02, 0.18, 0.02], roll: -0.08, fov: 34 },
      { f: 221, pos: [-0.44, 2.94, 3.28], tgt: [0.02, 0.18, 0.02], roll: -0.13, fov: 34 },
      { f: 242, pos: [1.34, 3.00, 2.98], tgt: [0.02, 0.18, 0.02], roll: -0.19, fov: 34 },
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

export const CameraRig: React.FC = () => {
  const camera = useThree((s) => s.camera);
  const frame = useCurrentFrame();
  const shot = SHOTS[shotIndex(frame)];
  const ks = shot.keys;
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
  camera.position.set(cr('pos', 0) + wob, cr('pos', 1) + bob, cr('pos', 2));
  camera.lookAt(new THREE.Vector3(cr('tgt', 0), cr('tgt', 1), cr('tgt', 2)));
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

/** Each shot sits over a different patch of the mosaic. */
const SET_OFFSET: Array<[number, number, number]> = [
  [0, 0, 0],
  [3.15, 0, -2.40],
  [-2.60, 0, 3.35],
  [4.20, 0, 2.10],
  [-1.45, 0, -3.60],
];
const SET_SPIN = [0, 0.22, -0.35, 0.48, -0.18];

/** Hero slot — both brand caps rise and sink through this one tray. */
const HERO: [number, number, number] = [0.05, 0.225, 0.05];
const LOCK_RECURLY: [number, number, number] = [-0.74, 0.20, -0.98];
const LOCK_HYPER: [number, number, number] = [0.74, 0.20, 1.12];

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = shotIndex(frame);
  const f = useMemo(
    () => ({
      secure: pillFaceH('Secure', 'Payments', 'shield'),
      renewal: pillFaceH('Renewal', 'Success', 'ring'),
      subs: capabilityFaceV('Subscriptions', 'card'),
      retries: capabilityFaceV('Retries', 'refresh'),
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

  const whiten = interpolate(frame, [272, 306], [0, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /** Entrance rise, measured from the start of the current shot. */
  const rise = (delay: number, dur = 10) => {
    const s0 = SHOTS[shot].start;
    return -SINK * (1 - easeOutCubic(clamp01((frame - s0 - delay) / dur)));
  };

  const heroTray = (pos: [number, number, number]) => (
    <group position={pos}>
      <Slab
        size={[BRAND[0] * 1.26, BRAND[1] * 0.30, BRAND[2] * 1.36]}
        radius={Math.min(BRAND[0], BRAND[2]) * 0.1}
        position={[0, -BRAND[1] * 0.56, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial map={f.metal} color="#e3e7ed" roughness={0.33} metalness={0.45} clearcoat={0.55} />
      </Slab>
      <Slab
        size={[BRAND[0] * 1.05, BRAND[1] * 0.55, BRAND[2] * 1.09]}
        radius={Math.min(BRAND[0], BRAND[2]) * 0.17}
        position={[0, -BRAND[1] * 0.34, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#6b7280" roughness={0.86} metalness={0.2} />
      </Slab>
    </group>
  );

  return (
    <>
      <SetDressing whiten={whiten} offset={SET_OFFSET[shot]} spin={SET_SPIN[shot]} brandRadius={shot === 4 ? 2.6 : 3.5} />
      <Peripherals whiten={whiten} />

      {/* Shot 1 — Secure Payments / Renewal Success */}
      {shot === 0 && (
        <>
          <Keycap position={[-0.06, 0.145, 0.30]} size={CAP} color={C.tile} face={f.secure} faceSize={F_PILL} lift={rise(0)} />
          <Keycap position={[1.00, 0.155, -0.92]} size={CAP} color={C.tile} face={f.renewal} faceSize={F_PILL} lift={rise(4)} rotation={[0, -0.06, 0]} />
        </>
      )}

      {/* Shot 2 — Subscriptions / Retries / APMs column */}
      {shot === 1 && (
        <>
          <Keycap position={[-0.05, 0.165, -1.10]} size={CAP} color={C.tile} face={f.subs} faceSize={F_COL} lift={rise(0)} />
          <Keycap position={[-0.05, 0.165, 0.02]} size={CAP} color={C.tile} face={f.retries} faceSize={F_COL} lift={rise(4)} />
          <Keycap position={[-0.05, 0.165, 1.14]} size={CAP} color={C.tile} face={f.apms} faceSize={F_COL} lift={rise(8)} />
        </>
      )}

      {/* Shot 3 — Recurly hero */}
      {shot === 2 && (
        <>
          {heroTray(HERO)}
          <Keycap position={HERO} size={BRAND} color={C.gold} face={f.recurly} faceSize={F_RECURLY} lift={rise(2)} rotation={[0, -0.05, 0]} />
          <Keycap position={[-1.32, 0.15, -1.30]} size={[1.15, 0.115, 0.72]} color={C.tile} face={f.secure} faceSize={[1.02, 1.02 / 1.65]} lift={rise(6)} />
          <Keycap position={[1.55, 0.165, -1.45]} size={CAP} color={C.tile} face={f.success} faceSize={F_SUCCESS} lift={rise(8)} rotation={[0, -0.1, 0]} />
        </>
      )}

      {/* Shot 4 — Hyperswitch hero */}
      {shot === 3 && (
        <>
          {heroTray(HERO)}
          <Keycap position={HERO} size={BRAND} color={C.blue} face={f.hyper} faceSize={F_HYPER} lift={rise(2)} rotation={[0, -0.04, 0]} />
          <Keycap position={[1.60, 0.165, -1.40]} size={CAP} color={C.tile} face={f.revenue} faceSize={F_REVENUE} lift={rise(6)} rotation={[0, -0.09, 0]} />
          <Keycap position={[-1.28, 0.14, 0.62]} size={[0.34, 0.10, 0.34]} radius={0.07} color={C.blue} face={f.psp} faceSize={[0.27, 0.27]} lift={rise(9)} />
        </>
      )}

      {/* Shot 5 — wide lockup */}
      {shot === 4 && (
        <>
          <Keycap position={LOCK_RECURLY} size={BRAND} color={C.gold} face={f.recurly} faceSize={F_RECURLY} tray metalMap={f.metal} lift={rise(0, 12)} />
          <Keycap position={LOCK_HYPER} size={BRAND} color={C.blue} face={f.hyper} faceSize={F_HYPER} tray metalMap={f.metal} lift={rise(3, 12)} />
          <Keycap
            position={[0, 0.16, 0.12]}
            size={[1.52, 0.12, 0.62]}
            radius={0.29}
            color={C.white}
            face={f.live}
            faceSize={F_LIVE}
            lift={rise(T.liveRiseStart - 243, 12)}
          />
        </>
      )}
    </>
  );
};
