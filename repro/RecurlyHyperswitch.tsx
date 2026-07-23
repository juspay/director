import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Keycap } from './scene/Keycap';
import { C } from './scene/theme';
import { recurlyFace, hyperswitchFace, liveNowFace, floorTexture } from './scene/faces';

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

const FinalLockup: React.FC = () => {
  const recurly = useMemo(() => recurlyFace(), []);
  const hyper = useMemo(() => hyperswitchFace(), []);
  const live = useMemo(() => liveNowFace(), []);
  const brand: [number, number, number] = [1.55, 0.13, 0.95];
  return (
    <>
      <Keycap position={[-1.15, 0.09, -1.3]} size={brand} color={C.gold} face={recurly} socket />
      <Keycap
        position={[0, 0.06, 0.12]}
        size={[1.5, 0.1, 0.6]}
        radius={0.28}
        color={C.white}
        face={live}
        faceScale={1.0}
      />
      <Keycap position={[1.15, 0.09, 1.5]} size={brand} color={C.blue} face={hyper} socket />
    </>
  );
};

const CameraLook: React.FC<{ target: [number, number, number] }> = ({ target }) => {
  const camera = useThree((s) => s.camera);
  camera.lookAt(new THREE.Vector3(...target));
  camera.updateProjectionMatrix();
  return null;
};

export const RecurlyHyperswitch: React.FC = () => {
  const { width, height } = useVideoConfig();
  useCurrentFrame();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 12.5, 1.7], fov: 26 }}
      shadows
      style={{ backgroundColor: C.bg }}
      gl={{ toneMapping: THREE.NoToneMapping, antialias: true }}
    >
      <CameraLook target={[0, 0, 0.35]} />
      <Lights />
      <Floor />
      <FinalLockup />
    </ThreeCanvas>
  );
};
