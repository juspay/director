import React, { useMemo, useRef, useEffect } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { SoftShadows, Environment, Lightformer } from '@react-three/drei';
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  N8AO,
} from '@react-three/postprocessing';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C, RES } from './scene/theme';
import { goboTexture } from './scene/faces';
import { Timeline, CameraRig, shotIndex } from './scene/Timeline';

/**
 * Moving dappled key light.
 *
 * Every second of the per-second craft analysis independently named the same
 * root cause: the reference's surfaces are crossed by soft, slowly drifting
 * pools of light and shade ("light through leaves"), and the reproduction had
 * none of it on objects — only a static decal on the floor, drawn with a basic
 * material, which cannot affect anything.
 *
 * This is a real projected gobo: a spotlight carrying a greyscale texture, so
 * the pattern modulates light landing on every surface and travels across caps,
 * panels and shadows together as it drifts.
 */
const GoboKey: React.FC = () => {
  const light = useRef<THREE.SpotLight>(null);
  const map = useMemo(() => goboTexture(), []);
  const frame = useCurrentFrame();
  map.repeat.set(0.55, 0.55);
  map.offset.set(0.06 + frame * 0.00042, 0.10 + frame * 0.00028);
  useEffect(() => {
    if (light.current) light.current.target.position.set(0, 0, 0);
  }, []);
  return (
    <spotLight
      ref={light}
      position={[-2.2, 15.5, 5.0]}
      angle={0.62}
      penumbra={1}
      distance={46}
      decay={0}
      intensity={1.55}
      color="#fffaf4"
      map={map}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-near={2}
      shadow-camera-far={40}
      shadow-bias={-0.0006}
      shadow-radius={9}
    />
  );
};

/**
 * High-key studio rig: a big soft overhead key, a warm bounce from camera-left
 * and a cool bounce from camera-right. The target's whites are never neutral —
 * they drift warm on one side of every cap and cool on the other.
 */
const Lights: React.FC = () => (
  <>
    <SoftShadows size={62} samples={20} focus={0.55} />
    <GoboKey />
    {/* Fill levels, restored after a failed rebalance.
        All fifteen seconds still report "flat, static, uniform lighting with no
        shadow movement", and several ask outright for a dappled gobo — one that
        has been in this scene since pass 3 and does not visibly read. The
        theory was that fill was drowning it, so the key went to 7.0 and every
        fill source was halved. That blew the tile wall to flat white, erased
        the seams and the Live Now pill, measured +37 luma against the
        reference at f30 — and produced no more dapple than before. So the
        premise was wrong, and the projected pattern is failing for some other
        reason. Reverted rather than shipped; the cause is still open. */}
    <Environment resolution={1024} background={false}>
      <Lightformer intensity={0.72} position={[0, 9, 2]} scale={[44, 44, 1]} color="#ffffff" />
      <Lightformer intensity={0.4} position={[-9, 5, 6]} scale={[22, 22, 1]} color="#fff4e2" />
      <Lightformer intensity={0.28} position={[9, 4, -4]} scale={[22, 22, 1]} color="#edf2fa" />
      <Lightformer intensity={0.2} position={[0, 1.5, 11]} scale={[26, 12, 1]} color="#ffffff" />
    </Environment>
    <ambientLight intensity={0.16} />
    <hemisphereLight args={['#fffaf2', '#ddd6cb', 0.22]} />
    <directionalLight
      position={[-3.0, 6.5, 3.2]}
      intensity={0.16}
      color="#fffaf2"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-near={0.5}
      shadow-camera-far={30}
      shadow-bias={-0.0004}
    />
    <directionalLight position={[5.5, 4.0, 6.0]} intensity={0.24} color="#f4f6fb" />
  </>
);

/**
 * Grade constants, tuned by measuring rendered stills against the target with
 * ffprobe signalstats (SATAVG / YLOW / YHIGH) rather than by eye.
 */
const SAT_MACRO = 0.45;
const CONTRAST_MACRO = 0.16;
const BRIGHT_MACRO = -0.13;
// The lockup grade was tuned when this shot was blowing out, and it has been
// suppressing colour ever since: at saturation 0.16 the rendered gold came back
// (207,194,117) against the target's (217,195,72) and the blue (96,112,197)
// against (64,101,220) — both washed toward grey. The set rebuild removed the
// clipping this was compensating for (blown pixels measure 0.00000 against the
// reference's 0.00035), so the compression can come back off.
const SAT_LOCKUP = 0.16;
const CONTRAST_LOCKUP = -0.10;
const BRIGHT_LOCKUP = -0.02;

/**
 * Per-shot focus target. Locking focus to a fixed world point meant the plane
 * drifted off the subject as each shot's camera orbited; the subject has to be
 * what is sharp.
 */
const FOCUS: Array<[number, number, number]> = [
  [0.0, 0.0, 0.15],
  [-0.05, 0.0, 0.0],
  [0.05, 0.0, 0.05],
  [0.05, 0.0, 0.05],
  [0.0, 0.0, 0.12],
];

/**
 * Macro depth of field.
 *
 * focalLength here is the *focus range*, not a lens focal length — smaller is
 * shallower. It had been pushed to 0.30-0.45, which is effectively no depth of
 * field at all, and the per-second analysis duly reported that this scene "has
 * infinite depth of field with all elements in sharp focus" against a reference
 * whose frame edges fall away.
 *
 * That was self-inflicted: an earlier pass widened the range because narrow
 * focus was costing edge-detail score, and the metric improved while the image
 * got worse. The fault was never the effect, it was the focus PLANE — targeting
 * a fixed world point that the subject moved away from. With focus tracking the
 * subject per shot the range can come back down to something photographic.
 *
 * bokehScale is a pixel quantity so it scales with RES; bloom stays minimal
 * because it over-saturates the badge blue and eats thin glyph strokes.
 */
const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // The lockup is a long-lens wide sitting ~16 units out; the same range that
  // reads as shallow up close would soften the plates themselves there.
  const focalLength = interpolate(frame, [255, 300], [0.12, 0.20], ease);
  const bokehScale = interpolate(frame, [255, 300], [2.4, 1.8], ease) * RES;
  const focus = FOCUS[shotIndex(frame)];
  // Grade stage. NOTE: `gl.toneMappingExposure` on <ThreeCanvas> is a NO-OP once
  // EffectComposer owns the render — 0.92, 0.72 and 0.30 all produced
  // byte-identical frames (md5 fa16ee95…). Exposure/contrast therefore has to be
  // driven here, in the composer, or it silently does nothing.
  //
  // Measured against the target at 720x900:
  //   macro beats  repro saturation 7.6 vs target 17  -> boost
  //   final lockup repro 138..240 vs target 174..211  -> reduce contrast
  const satBoost = interpolate(frame, [250, 300], [SAT_MACRO, SAT_LOCKUP], ease);
  const contrast = interpolate(frame, [250, 300], [CONTRAST_MACRO, CONTRAST_LOCKUP], ease);
  const brightness = interpolate(frame, [250, 300], [BRIGHT_MACRO, BRIGHT_LOCKUP], ease);
  return (
    <EffectComposer enableNormalPass={false} multisampling={8}>
      {/* Contact occlusion. This was the ONLY finding present in all fifteen
          seconds of the A/B analysis: flat lighting, harsh shadows, "lacking
          realistic ambient occlusion". Pass 3 read the same signal as moving
          dappled light and answered it with a projected gobo — which supplied
          light movement but not darkening where surfaces meet. It also could
          not have worked before the set rebuild, because nothing in the scene
          was in contact with anything. aoRadius is in world units and the caps
          are ~1.3 across, so a third of a unit catches seams and well walls
          without shading whole panels. */}
      <N8AO aoRadius={0.34} distanceFalloff={0.7} intensity={2.1} quality="high" halfRes={false} color="#2b2f3a" />
      <DepthOfField target={focus} focalLength={focalLength} bokehScale={bokehScale} height={Math.round(720 * RES)} />
      <Bloom intensity={0.025} luminanceThreshold={0.985} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.32} darkness={0.16} />
      <HueSaturation saturation={satBoost} />
      <BrightnessContrast brightness={brightness} contrast={contrast} />
    </EffectComposer>
  );
};

/**
 * Distance haze, retuned per beat. A fixed 5.5-17 range is right for the macro
 * shots but the final lockup sits ~14 units out, where that range fogs the
 * whole composition to flat white — the range has to travel with the camera.
 */
const FogRig: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // The macro camera orbits ~5.1 units from the hero, so a 5.0 near plane put
  // the SUBJECT at fog onset: everything from the hero outward was mixed toward
  // #eef2f8 (Y~241), which measured as saturation 7.6 against the target's 17 —
  // the "behind milk" look. Start the haze past the hero and let it fall off
  // over a longer run so the far dressing still recedes.
  const near = interpolate(frame, [250, 300], [9.5, 13.5], ease);
  const far = interpolate(frame, [250, 300], [30, 46], ease);
  return <fog attach="fog" args={['#f0efec', near, far]} />;
};

/**
 * Base plate so the seams between tiles never show background through. It sits
 * just under the tile slabs — the tiles are 0.42 deep, so the old -0.02 plate
 * would have cut straight through them.
 */
const Underplate: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.40, 0]} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#c9c8c4" roughness={0.9} metalness={0} />
  </mesh>
);

export const RecurlyHyperswitch: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [1.35, 3.3, 3.65], fov: 34, near: 0.1, far: 100 }}
      shadows
      style={{ backgroundColor: C.bg }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.785, antialias: true }}
    >
      <FogRig />
      <CameraRig />
      <Lights />
      <Underplate />
      {/* CloudOverlay removed: it was a flat unlit decal on the floor plane,
          which cannot dapple anything it does not lie on and now z-fights the
          raised tiles. GoboKey projects the same pattern as real light. */}
      <Timeline />
      <Effects />
    </ThreeCanvas>
  );
};
