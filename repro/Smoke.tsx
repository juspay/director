import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const Smoke: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 1.5, 5], fov: 45 }}
      style={{ backgroundColor: '#f3f6f9' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 6, 4]} intensity={2} />
      <mesh rotation={[0.4, frame * 0.12, 0]} position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 2.4, 0.5]} />
        <meshStandardMaterial color="#2e52d6" roughness={0.6} />
      </mesh>
    </ThreeCanvas>
  );
};
