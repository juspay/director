import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { SoftShadows, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C } from './scene/theme';
import { floorTexture } from './scene/faces';
import { Timeline, CameraRig, CloudOverlay } from './scene/Timeline';

const Lights: React.FC = () => (
  <>
    <SoftShadows size={48} samples={17} focus={0.5} />
    <Environment resolution={256} background={false}>
      <Lightformer intensity={0.95} position={[0, 6, 2]} scale={[14, 14, 1]} color="#ffffff" />
      <Lightformer intensity={0.45} position={[-5, 3, 4]} scale={[8, 8, 1]} color="#eef3fb" />
      <Lightformer intensity={0.4} position={[5, 2, -3]} scale={[8, 8, 1]} color="#f6f8fc" />
    </Environment>
    <ambientLight intensity={0.28} />
    <hemisphereLight args={['#ffffff', '#dbe4f0', 0.32]} />
    <directionalLight
      position={[-3.5, 8.5, 4]}
      intensity={0.72}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-7}
      shadow-camera-right={7}
      shadow-camera-top={7}
      shadow-camera-bottom={-7}
      shadow-camera-near={1}
      shadow-camera-far={30}
      shadow-bias={-0.0004}
    />
    <directionalLight position={[6, 5, 7]} intensity={0.4} />
  </>
);

const Effects: React.FC = () => (
  <EffectComposer enableNormalPass={false}>
    <DepthOfField target={[0, 0, 0.3]} focalLength={0.025} bokehScale={1.4} height={480} />
    <Bloom intensity={0.11} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
  </EffectComposer>
);

const Floor: React.FC = () => {
  const tex = useMemo(() => floorTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[22, 22]} />
      <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
    </mesh>
  );
};

export const RecurlyHyperswitch: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 6, 4], fov: 30 }}
      shadows
      style={{ backgroundColor: C.bg }}
      gl={{ toneMapping: THREE.NoToneMapping, antialias: true }}
    >
      <CameraRig />
      <Lights />
      <Floor />
      <CloudOverlay />
      <Timeline />
      <Effects />
    </ThreeCanvas>
  );
};
