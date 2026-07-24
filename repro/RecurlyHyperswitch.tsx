import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C } from './scene/theme';
import { floorTexture } from './scene/faces';
import { Timeline, CameraRig } from './scene/Timeline';

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.85} />
    <hemisphereLight args={['#ffffff', '#e2e8f1', 0.5]} />
    <directionalLight
      position={[-4, 9, 3]}
      intensity={1.7}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-6}
      shadow-camera-right={6}
      shadow-camera-top={6}
      shadow-camera-bottom={-6}
      shadow-camera-near={1}
      shadow-camera-far={30}
      shadow-bias={-0.0004}
    />
    <directionalLight position={[6, 5, 7]} intensity={0.45} />
  </>
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
      <Timeline />
    </ThreeCanvas>
  );
};
