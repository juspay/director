import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Keycap } from './Keycap';
import { C, FPS } from './theme';
import {
  capabilityFace,
  recurlyFace,
  hyperswitchFace,
  liveNowFace,
  revenueFace,
  successRateFace,
  pspFace,
  metalTexture,
  cloudTexture,
} from './faces';

// Drifting cloudy/dappled light overlay just above the floor.
export const CloudOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useMemo(() => cloudTexture(), []);
  tex.repeat.set(1.3, 1.3);
  tex.offset.set(frame * 0.0006, frame * 0.0004);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <planeGeometry args={[22, 22]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// opacity that ramps in over [inA,inB] and out over [outA,outB]
function fade(frame: number, inA: number, inB: number, outA: number, outB: number): number {
  return (
    interpolate(frame, [inA, inB], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    interpolate(frame, [outA, outB], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );
}

// rise from below to 0 with an ease-out over [start, start+dur]
function rise(frame: number, start: number, dur = 10, from = -0.32): number {
  const s = spring({ frame: frame - start, fps: FPS, config: { damping: 200, mass: 0.7 } });
  return interpolate(s, [0, 1], [from, 0]);
}

const CAM = [
  { f: 0, pos: [0.7, 5.6, 4.2], tgt: [0.2, 0, 0.3] },
  { f: 64, pos: [-0.3, 5.4, 4.0], tgt: [0, 0, 0.2] },
  { f: 110, pos: [0.2, 5.2, 3.95], tgt: [0, 0, 0.2] },
  { f: 172, pos: [0.15, 5.0, 3.8], tgt: [0, 0, 0.15] },
  { f: 222, pos: [-0.1, 5.15, 3.9], tgt: [0, 0, 0.3] },
  { f: 262, pos: [0, 8.6, 3.0], tgt: [0, 0, 0.4] },
  { f: 300, pos: [0, 12.5, 1.7], tgt: [0, 0, 0.35] },
  { f: 435, pos: [0, 12.6, 1.72], tgt: [0, 0, 0.35] },
];

export const CameraRig: React.FC = () => {
  const camera = useThree((s) => s.camera);
  const frame = useCurrentFrame();
  const frames = CAM.map((k) => k.f);
  const ax = (i: 0 | 1 | 2, key: 'pos' | 'tgt') =>
    interpolate(frame, frames, CAM.map((k) => k[key][i]), {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  // subtle continuous drift for life
  const wob = Math.sin(frame / 40) * 0.03;
  camera.position.set(ax(0, 'pos') + wob, ax(1, 'pos'), ax(2, 'pos'));
  camera.lookAt(new THREE.Vector3(ax(0, 'tgt'), ax(1, 'tgt'), ax(2, 'tgt')));
  camera.updateProjectionMatrix();
  return null;
};

const CAP: [number, number, number] = [1.32, 0.13, 0.86];
const BRAND: [number, number, number] = [1.55, 0.13, 0.95];

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const f = useMemo(
    () => ({
      secure: capabilityFace('Secure Payments', 'shield'),
      renewal: capabilityFace('Renewal Success', 'ring'),
      subs: capabilityFace('Subscriptions', 'card'),
      retries: capabilityFace('Retries', 'refresh'),
      apms: capabilityFace('APMs', 'globe', true),
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

  // ---- scene opacities ----
  const oS1 = fade(frame, 0, 1, 58, 70);
  const oS2 = fade(frame, 60, 72, 140, 152);
  const oS3 = fade(frame, 142, 152, 192, 203);
  const oS4 = fade(frame, 196, 205, 236, 250);
  const oFinal = fade(frame, 240, 258, 9999, 10000);
  const liveSpin = interpolate(
    spring({ frame: frame - 256, fps: FPS, config: { damping: 200, mass: 0.8 } }),
    [0, 1],
    [-0.55, 0],
  );

  return (
    <>
      {/* S1 — Open: Secure Payments + Renewal Success + peripheral */}
      {oS1 > 0.01 && (
        <group>
          <Keycap position={[0, 0.09, 0.1]} size={CAP} color={C.tile} face={f.secure} opacity={oS1} />
          <Keycap position={[1.05, 0.09, -0.95]} size={CAP} color={C.tile} face={f.renewal} opacity={oS1} />
          <Keycap position={[-1.55, 0.06, 0.5]} size={[1.0, 0.1, 1.0]} color={C.blue} opacity={oS1} />
          <Keycap position={[0.35, 0.06, 1.6]} size={[1.1, 0.1, 0.7]} color={C.gold} opacity={oS1} />
        </group>
      )}

      {/* S2 — Column: Subscriptions / Retries / APMs */}
      {oS2 > 0.01 && (
        <group>
          <Keycap position={[0, 0.09, -1.02]} size={CAP} color={C.tile} face={f.subs} opacity={oS2} lift={rise(frame, 66, 8)} />
          <Keycap position={[0, 0.09, 0]} size={CAP} color={C.tile} face={f.retries} opacity={oS2} lift={rise(frame, 70, 8)} />
          <Keycap position={[0, 0.09, 1.02]} size={CAP} color={C.tile} face={f.apms} opacity={oS2} lift={rise(frame, 74, 8)} />
        </group>
      )}

      {/* S3 — Recurly hero + Success rate */}
      {oS3 > 0.01 && (
        <group>
          <Keycap position={[0, 0.1, 0]} size={BRAND} color={C.gold} face={f.recurly} socket metalMap={f.metal} opacity={oS3} lift={rise(frame, 147, 10)} />
          <Keycap position={[1.25, 0.09, -1.0]} size={CAP} color={C.tile} face={f.success} opacity={oS3} />
        </group>
      )}

      {/* S4 — Hyperswitch hero + Revenue Analytics + PSP */}
      {oS4 > 0.01 && (
        <group>
          <Keycap position={[0, 0.1, 0]} size={BRAND} color={C.blue} face={f.hyper} socket metalMap={f.metal} opacity={oS4} lift={rise(frame, 200, 10)} />
          <Keycap position={[1.25, 0.09, -1.0]} size={CAP} color={C.tile} face={f.revenue} opacity={oS4} />
          <Keycap position={[-1.1, 0.08, 1.05]} size={[0.55, 0.1, 0.55]} radius={0.1} color={C.blue} face={f.psp} opacity={oS4} />
        </group>
      )}

      {/* Final lockup — Recurly / Live Now / Hyperswitch */}
      {oFinal > 0.01 && (
        <group>
          <Keycap position={[-1.15, 0.09, -1.3]} size={BRAND} color={C.gold} face={f.recurly} socket metalMap={f.metal} opacity={oFinal} />
          <Keycap
            position={[0, 0.06, 0.12]}
            size={[1.5, 0.1, 0.6]}
            radius={0.28}
            color={C.white}
            face={f.live}
            faceScale={1.0}
            opacity={oFinal}
            lift={rise(frame, 256, 10, -0.18)}
            rotation={[0, liveSpin, 0]}
          />
          <Keycap position={[1.15, 0.09, 1.5]} size={BRAND} color={C.blue} face={f.hyper} socket metalMap={f.metal} opacity={oFinal} />
        </group>
      )}
    </>
  );
};
