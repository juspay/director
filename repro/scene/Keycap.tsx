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
  opacity?: number;
  lift?: number; // vertical offset added to the keycap body + face (for rise/press)
  rotation?: [number, number, number];
  metalMap?: THREE.Texture | null;
};

export const Keycap: React.FC<Props> = ({
  position,
  size,
  color,
  face = null,
  faceScale = 0.9,
  socket = false,
  radius,
  roughness = 0.85,
  opacity = 1,
  lift = 0,
  rotation = [0, 0, 0],
  metalMap = null,
}) => {
  const [w, t, l] = size;
  const r = radius ?? Math.min(w, l) * 0.14;
  const transparent = opacity < 1;
  if (opacity <= 0.001) return null;
  return (
    <group position={position} rotation={rotation}>
      {socket && (
        <RoundedBox
          args={[w * 1.18, t * 0.85, l * 1.2]}
          radius={r * 0.5}
          smoothness={3}
          position={[0, -t * 0.22, 0]}
          receiveShadow
        >
          <meshStandardMaterial map={metalMap ?? undefined} color="#c2c7d0" roughness={0.35} metalness={0.7} transparent={transparent} opacity={opacity} />
        </RoundedBox>
      )}
      <RoundedBox args={[w, t, l]} radius={r} smoothness={4} position={[0, lift, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={roughness} metalness={0.0} transparent={transparent} opacity={opacity} />
      </RoundedBox>
      {face && (
        <mesh position={[0, t / 2 + 0.012 + lift, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
          <planeGeometry args={[w * faceScale, l * faceScale]} />
          <meshBasicMaterial
            map={face}
            transparent
            alphaTest={0.01}
            opacity={opacity}
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
