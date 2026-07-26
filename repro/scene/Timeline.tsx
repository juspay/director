import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Keycap } from './Keycap';
import { SetDressing, Peripherals } from './SetDressing';
import { C, FPS } from './theme';
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
 * Dappled light pooling on the floor. This has to stay BELOW the card faces —
 * a full-scene haze sheet drawn over the top washes every logo and label out.
 * The actual atmospheric depth comes from scene fog instead, which falls off
 * with distance and so leaves the in-focus hero alone.
 */
export const CloudOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useMemo(() => cloudTexture(), []);
  a.repeat.set(1.15, 1.15);
  a.offset.set(frame * 0.0007, frame * 0.0004);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[30, 30]} />
      {/* toneMapped={false} means this veil bypasses ACES entirely, so at 0.8 it
          painted a near-white sheet over the floor (measured floor spread 12 vs
          the target's 69). 0.34 keeps the dapple without flattening the plate. */}
      <meshBasicMaterial map={a} transparent opacity={0.34} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function fade(frame: number, inA: number, inB: number, outA: number, outB: number): number {
  return (
    interpolate(frame, [inA, inB], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    interpolate(frame, [outA, outB], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );
}

/**
 * Keycap rise out of its socket. `damping: 200` is so overdamped the spring
 * needs ~2s to settle, which left hero caps sunk inside their trays for most
 * of their scene; durationInFrames pins the settle to `dur` and the lighter
 * damping gives the crisp mechanical snap the target has.
 */
function rise(frame: number, start: number, dur = 10, from = -0.32): number {
  const s = spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 16, stiffness: 150, mass: 0.5 },
    durationInFrames: dur,
  });
  return interpolate(s, [0, 1], [from, 0]);
}

/**
 * Camera path. Much closer and much lower than a survey shot: the target is a
 * macro lens roughly 5 units out at ~38° elevation, and the whole world is
 * rolled ~9-13° so nothing is square to the frame.
 */
const CAM: Array<{ f: number; pos: [number, number, number]; tgt: [number, number, number]; roll: number; fov: number }> = [
  { f: 0, pos: [1.74, 4.42, 4.92], tgt: [0.12, 0.14, 0.05], roll: -0.20, fov: 34 },
  { f: 64, pos: [-0.80, 4.27, 5.21], tgt: [-0.04, 0.14, 0.0], roll: -0.13, fov: 34 },
  { f: 110, pos: [0.43, 3.99, 4.87], tgt: [0.0, 0.15, 0.0], roll: -0.17, fov: 34 },
  { f: 172, pos: [1.29, 3.71, 4.61], tgt: [0.04, 0.15, 0.0], roll: -0.23, fov: 34 },
  { f: 222, pos: [-1.00, 3.89, 4.77], tgt: [-0.02, 0.15, 0.05], roll: -0.11, fov: 34 },
  { f: 262, pos: [-0.20, 9.20, 3.90], tgt: [0.0, 0.06, 0.15], roll: -0.07, fov: 27 },
  { f: 300, pos: [0.0, 13.80, 2.60], tgt: [0.0, 0.0, 0.10], roll: -0.012, fov: 20 },
  { f: 435, pos: [0.0, 13.95, 2.63], tgt: [0.0, 0.0, 0.10], roll: 0.0, fov: 20 },
];

export const CameraRig: React.FC = () => {
  const camera = useThree((s) => s.camera);
  const frame = useCurrentFrame();
  let seg = 0;
  while (seg < CAM.length - 2 && frame >= CAM[seg + 1].f) seg++;
  const a = CAM[seg];
  const b = CAM[seg + 1];
  const raw = Math.max(0, Math.min(1, (frame - a.f) / (b.f - a.f)));
  const t = easeInOut(raw);
  const mix = (u: number, v: number) => u + (v - u) * t;
  const wob = Math.sin(frame / 37) * 0.035;
  const bob = Math.cos(frame / 51) * 0.025;
  camera.position.set(
    mix(a.pos[0], b.pos[0]) + wob,
    mix(a.pos[1], b.pos[1]) + bob,
    mix(a.pos[2], b.pos[2]),
  );
  camera.lookAt(new THREE.Vector3(mix(a.tgt[0], b.tgt[0]), mix(a.tgt[1], b.tgt[1]), mix(a.tgt[2], b.tgt[2])));
  camera.rotateZ(mix(a.roll, b.roll));
  (camera as THREE.PerspectiveCamera).fov = mix(a.fov, b.fov);
  camera.updateProjectionMatrix();
  return null;
};

const CAP: [number, number, number] = [1.34, 0.125, 0.88];
const BRAND: [number, number, number] = [1.60, 0.145, 0.98];

// Face-plane sizes, derived from each texture's own aspect so nothing is squashed.
const F_PILL: [number, number] = [1.20, 1.20 / 1.65];
const F_COL: [number, number] = [1.20, 1.20 / 1.55];
const F_RECURLY: [number, number] = [1.32, 1.32 / 4.0];
const F_HYPER: [number, number] = [1.34, 1.34 / 3.0];
const F_LIVE: [number, number] = [1.36, 1.36 / 2.67];
const F_SUCCESS: [number, number] = [1.18, 1.18 / 1.5];
const F_REVENUE: [number, number] = [1.18, 1.18 / 1.8];

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
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

  const oS1 = fade(frame, 0, 1, 58, 70);
  const oS2 = fade(frame, 60, 72, 140, 152);
  const oS3 = fade(frame, 142, 152, 192, 203);
  const oS4 = fade(frame, 196, 205, 236, 250);
  const oFinal = fade(frame, 240, 258, 9999, 10000);
  // The floor blows out toward white as the camera pulls up into the final
  // lockup. Emissive wash, not opacity: fading alpha turned the whole set
  // (heroes included) translucent and pale instead of bright.
  const whiten = interpolate(frame, [262, 300], [0, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const liveSpin = interpolate(
    spring({ frame: frame - 256, fps: FPS, config: { damping: 18, stiffness: 140, mass: 0.6 }, durationInFrames: 12 }),
    [0, 1],
    [-0.55, 0],
  );

  return (
    <>
      <SetDressing whiten={whiten} />
      <Peripherals whiten={whiten} />

      {/* S1 — Secure Payments + Renewal Success */}
      {oS1 > 0.01 && (
        <group>
          <Keycap position={[-0.06, 0.145, 0.30]} size={CAP} color={C.tile} face={f.secure} faceSize={F_PILL} opacity={oS1} />
          <Keycap position={[1.00, 0.155, -0.92]} size={CAP} color={C.tile} face={f.renewal} faceSize={F_PILL} opacity={oS1} rotation={[0, -0.06, 0]} />
        </group>
      )}

      {/* S2 — Subscriptions / Retries / APMs column */}
      {oS2 > 0.01 && (
        <group rotation={[0, 0.04, 0]}>
          <Keycap position={[-0.05, 0.165, -1.10]} size={CAP} color={C.tile} face={f.subs} faceSize={F_COL} opacity={oS2} lift={rise(frame, 66, 8)} />
          <Keycap position={[-0.05, 0.165, 0.02]} size={CAP} color={C.tile} face={f.retries} faceSize={F_COL} opacity={oS2} lift={rise(frame, 70, 8)} />
          <Keycap position={[-0.05, 0.165, 1.14]} size={CAP} color={C.tile} face={f.apms} faceSize={F_COL} opacity={oS2} lift={rise(frame, 74, 8)} />
        </group>
      )}

      {/* S3 — Recurly hero */}
      {oS3 > 0.01 && (
        <group>
          <Keycap position={[0.05, 0.225, 0.05]} size={BRAND} color={C.gold} face={f.recurly} faceSize={F_RECURLY} tray metalMap={f.metal} opacity={oS3} lift={rise(frame, 147, 10)} rotation={[0, -0.05, 0]} />
          <Keycap position={[-1.30, 0.155, -1.25]} size={[1.15, 0.13, 0.72]} color={C.tile} face={f.secure} faceSize={[1.02, 1.02 / 1.65]} opacity={oS3 * 0.95} />
          <Keycap position={[1.55, 0.165, -1.45]} size={CAP} color={C.tile} face={f.success} faceSize={F_SUCCESS} opacity={oS3 * 0.9} rotation={[0, -0.1, 0]} />
        </group>
      )}

      {/* S4 — Hyperswitch hero */}
      {oS4 > 0.01 && (
        <group>
          <Keycap position={[0.05, 0.225, 0.05]} size={BRAND} color={C.blue} face={f.hyper} faceSize={F_HYPER} tray metalMap={f.metal} opacity={oS4} lift={rise(frame, 200, 10)} rotation={[0, -0.04, 0]} />
          <Keycap position={[1.60, 0.165, -1.40]} size={CAP} color={C.tile} face={f.revenue} faceSize={F_REVENUE} opacity={oS4 * 0.9} rotation={[0, -0.09, 0]} />
          <Keycap position={[-1.28, 0.14, 0.62]} size={[0.34, 0.10, 0.34]} radius={0.07} color={C.blue} face={f.psp} faceSize={[0.27, 0.27]} opacity={oS4 * 0.9} />
        </group>
      )}

      {/* Final lockup */}
      {oFinal > 0.01 && (
        <group>
          <Keycap position={[-0.74, 0.20, -0.98]} size={BRAND} color={C.gold} face={f.recurly} faceSize={F_RECURLY} tray metalMap={f.metal} opacity={oFinal} />
          <Keycap
            position={[0, 0.16, 0.12]}
            size={[1.52, 0.12, 0.62]}
            radius={0.29}
            color={C.white}
            face={f.live}
            faceSize={F_LIVE}
            opacity={oFinal}
            lift={rise(frame, 256, 10, -0.18)}
            rotation={[0, liveSpin, 0]}
          />
          <Keycap position={[0.74, 0.20, 1.12]} size={BRAND} color={C.blue} face={f.hyper} faceSize={F_HYPER} tray metalMap={f.metal} opacity={oFinal} />
        </group>
      )}
    </>
  );
};
