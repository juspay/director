import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { SoftShadows, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C, RES } from './scene/theme';
import { Timeline, CameraRig, CloudOverlay } from './scene/Timeline';

/**
 * High-key studio rig: a big soft overhead key, a warm bounce from camera-left
 * and a cool bounce from camera-right. The target's whites are never neutral —
 * they drift warm on one side of every cap and cool on the other.
 */
const Lights: React.FC = () => (
  <>
    <SoftShadows size={38} samples={18} focus={0.7} />
    <Environment resolution={1024} background={false}>
      <Lightformer intensity={0.72} position={[0, 9, 2]} scale={[44, 44, 1]} color="#ffffff" />
      <Lightformer intensity={0.4} position={[-9, 5, 6]} scale={[22, 22, 1]} color="#fff4e2" />
      <Lightformer intensity={0.32} position={[9, 4, -4]} scale={[22, 22, 1]} color="#dfeaff" />
      <Lightformer intensity={0.2} position={[0, 1.5, 11]} scale={[26, 12, 1]} color="#ffffff" />
    </Environment>
    <ambientLight intensity={0.16} />
    <hemisphereLight args={['#ffffff', '#c3d2e8', 0.22]} />
    <directionalLight
      position={[-3.0, 6.5, 3.2]}
      intensity={0.55}
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
    <directionalLight position={[5.5, 4.0, 6.0]} intensity={0.26} color="#eaf1ff" />
  </>
);

/**
 * Macro depth of field. focalLength here is the *focus range*, not a lens focal
 * length. Widening it to sharpen the hero cap face also flattens the background
 * separation, and measured markedly worse — the shallow-DOF mood matters more
 * than absolute hero sharpness. bokehScale and height are pixel quantities, so
 * both scale with RES to keep the look identical at the master resolution.
 */
const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // Wide, far, long-lens framing needs a deeper focus range or the whole
  // lockup goes soft; the macro beats keep the shallow bokeh.
  const focalLength = interpolate(frame, [255, 300], [0.055, 0.20], ease);
  const bokehScale = interpolate(frame, [255, 300], [3.4, 2.0], ease) * RES;
  return (
    <EffectComposer enableNormalPass={false} multisampling={8}>
      <DepthOfField target={[0, 0.2, 0.05]} focalLength={focalLength} bokehScale={bokehScale} height={Math.round(720 * RES)} />
      <Bloom intensity={0.09} luminanceThreshold={0.95} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.32} darkness={0.16} />
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
  const near = interpolate(frame, [250, 300], [5.0, 13.5], ease);
  const far = interpolate(frame, [250, 300], [16, 46], ease);
  return <fog attach="fog" args={['#eef2f8', near, far]} />;
};

/** Base plate so the seams between mosaic slabs never show background through. */
const Underplate: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#d3dae4" roughness={0.9} metalness={0} />
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
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.92, antialias: true }}
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
