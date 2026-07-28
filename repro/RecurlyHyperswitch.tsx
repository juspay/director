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
} from '@react-three/postprocessing';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C, RES } from './scene/theme';
import { goboTexture } from './scene/faces';
import { Timeline, CameraRig, CloudOverlay } from './scene/Timeline';

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
const BRIGHT_MACRO = -0.10;
const SAT_LOCKUP = 0.16;
// The lockup rendered 137..227 against the target's 174..211 — a 90-wide range
// where the target holds 37. Compress it and lift the centre so the far, flat
// lockup reads as calm rather than crushed-and-clipped.
const CONTRAST_LOCKUP = -0.30;
const BRIGHT_LOCKUP = 0.04;

/**
 * Macro depth of field. focalLength here is the *focus range*, not a lens focal
 * length; at 0.055 the in-focus slab was thin enough that even the nearest card
 * was heavily blurred, turning every glyph and label into mush. The subjects
 * must stay sharp and only the surrounding set should fall away — which is what
 * the reference actually does. bokehScale is a pixel quantity so it scales with
 * RES; bloom is kept minimal because it over-saturates the badge blue and eats
 * thin glyph strokes.
 */
const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // Wide, far, long-lens framing needs a deeper focus range or the whole
  // lockup goes soft; the macro beats keep the shallow bokeh.
  const focalLength = interpolate(frame, [255, 300], [0.30, 0.45], ease);
  const bokehScale = interpolate(frame, [255, 300], [1.25, 0.9], ease) * RES;
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
      <DepthOfField target={[0, 0.2, 0.05]} focalLength={focalLength} bokehScale={bokehScale} height={Math.round(720 * RES)} />
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

/** Base plate so the seams between mosaic slabs never show background through. */
const Underplate: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#dcdbd7" roughness={0.9} metalness={0} />
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
      <CloudOverlay />
      <Timeline />
      <Effects />
    </ThreeCanvas>
  );
};
