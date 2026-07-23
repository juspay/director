import React from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type Props = {
  position: [number, number, number];
  size: [number, number, number]; // [width x, thickness y, length z]
  color: string;
  face?: THREE.Texture | null;
  faceScale?: number;
  socket?: boolean;
  radius?: number;
  roughness?: number;
};

export const Keycap: React.FC<Props> = ({
  position,
  size,
  color,
  face = null,
  faceScale = 0.9,
  socket = false,
  radius,
  roughness = 0.62,
}) => {
  const [w, t, l] = size;
  const r = radius ?? Math.min(w, l) * 0.14;
  return (
    <group position={position}>
      {socket && (
        <RoundedBox
          args={[w * 1.16, t * 0.7, l * 1.18]}
          radius={r * 0.5}
          smoothness={3}
          position={[0, -t * 0.28, 0]}
        >
          <meshStandardMaterial color="#b7bcc6" roughness={0.42} metalness={0.55} />
        </RoundedBox>
      )}
      <RoundedBox args={[w, t, l]} radius={r} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={roughness} metalness={0.0} />
      </RoundedBox>
      {face && (
        <mesh position={[0, t / 2 + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
          <planeGeometry args={[w * faceScale, l * faceScale]} />
          <meshBasicMaterial
            map={face}
            transparent
            alphaTest={0.01}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
};
