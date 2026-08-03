import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Slab } from './Slab';

type Props = {
  position: [number, number, number];
  size: [number, number, number]; // [width x, thickness y, length z]
  color: string;
  face?: THREE.Texture | null;
  /** Explicit face-plane size in world units, matched to the texture's aspect. */
  faceSize?: [number, number];
  faceScale?: number;
  /** Recessed brushed-metal tray the hero keys sit inside. */
  tray?: boolean;
  radius?: number;
  roughness?: number;
  clearcoat?: number;
  opacity?: number;
  lift?: number;
  rotation?: [number, number, number];
  metalMap?: THREE.Texture | null;
};

export const Keycap: React.FC<Props> = ({
  position,
  size,
  color,
  face = null,
  faceSize,
  faceScale = 0.88,
  tray = false,
  radius,
  roughness = 0.34,
  clearcoat = 0.55,
  opacity = 1,
  lift = 0,
  rotation = [0, 0, 0],
  metalMap = null,
}) => {
  const [w, t, l] = size;
  const r = radius ?? Math.min(w, l) * 0.22;
  const transparent = opacity < 1;
  const [fw, fl] = faceSize ?? [w * faceScale, l * faceScale];
  const trayT = t * 0.30;
  const wellT = t * 0.55;
  /**
   * DOMED face (pass 10). The reference's caps are pillowy — their top faces
   * curve, and that curvature is what carries the broad specular sweep across
   * the gold and the soft falloff on the whites (verified: 'flat slab with
   * edge bevels' survived eyewitness in five seconds). A gentle paraboloid on
   * the lit face supplies it; texture distortion at the edges is slight and
   * matches the reference's curved logos.
   */
  const domeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(fw, fl, 24, 24);
    const posAttr = g.attributes.position;
    const domeH = Math.min(fw, fl) * 0.055;
    for (let i = 0; i < posAttr.count; i++) {
      const nx = posAttr.getX(i) / (fw / 2);
      const ny = posAttr.getY(i) / (fl / 2);
      posAttr.setZ(i, domeH * (1 - nx * nx) * (1 - ny * ny));
    }
    g.computeVertexNormals();
    return g;
  }, [fw, fl]);
  React.useEffect(() => () => domeGeo.dispose(), [domeGeo]);
  if (opacity <= 0.002) return null;
  return (
    <group position={position} rotation={rotation}>
      {tray && (
        <>
          {/* bright brushed-metal rim, sitting proud of the floor */}
          <Slab
            size={[w * 1.26, trayT, l * 1.36]}
            radius={Math.min(w, l) * 0.1}
            position={[0, -t * 0.5 - trayT * 0.2, 0]}
            castShadow
            receiveShadow
          >
            {/* Near-full metalness renders almost black without a rich
                environment to reflect; this reads as machined aluminium. */}
            <meshPhysicalMaterial
              map={metalMap ?? undefined}
              color="#e3e7ed"
              roughness={0.33}
              metalness={0.45}
              clearcoat={0.55}
              transparent={transparent}
              opacity={opacity}
            />
          </Slab>
          {/* Shadow gap between cap and rim. Kept tight and mid-grey — a wide
              charcoal recess reads as a heavy plinth, not a machined socket. */}
          <Slab
            size={[w * 1.05, wellT, l * 1.09]}
            radius={Math.min(w, l) * 0.17}
            position={[0, -t * 0.34, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              color="#6b7280"
              roughness={0.86}
              metalness={0.2}
              transparent={transparent}
              opacity={opacity}
            />
          </Slab>
        </>
      )}
      <Slab size={[w, t, l]} radius={r} position={[0, lift, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={roughness}
          metalness={0.0}
          clearcoat={clearcoat}
          clearcoatRoughness={0.3}
          reflectivity={0.6}
          transparent={transparent}
          opacity={opacity}
        />
      </Slab>
      {face && (
        <mesh position={[0, t / 2 + 0.004 + lift, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20} geometry={domeGeo}>
          {/* LIT faces (pass 8). The unlit toneMapped=false basic material
              could not carry the reference's specular gradients — the
              eyewitness pass confirmed A's gold face has a bright-to-dark
              lighting sweep while ours rendered uniform, a root cause of the
              persistent "flat" verdicts. fog stays off so the lockup
              wordmarks keep their measured darkness at 16 units out. */}
          <meshStandardMaterial
            map={face}
            transparent
            alphaTest={0.004}
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.5}
            metalness={0}
            fog={false}
          />
        </mesh>
      )}
    </group>
  );
};
