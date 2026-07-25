import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * A thin plate with a LARGE plan-view corner radius and a small edge bevel.
 *
 * drei's <RoundedBox> cannot express this: it rounds every edge by one radius,
 * so the radius is hard-capped at half the smallest dimension. For a 0.17-thick
 * keycap that caps corners at 0.085 — far tighter than the target's squircles —
 * and passing anything larger silently produces degenerate, self-intersecting
 * geometry (which is what made the trays and face planes disappear entirely).
 *
 * Extruding a rounded-rect Shape decouples the two: the corner radius lives in
 * the profile, the bevel handles the edge highlight.
 */
function roundedRectShape(w: number, l: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -l / 2;
  const rr = Math.min(r, Math.min(w, l) / 2 - 0.001);
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + l - rr);
  s.quadraticCurveTo(x + w, y + l, x + w - rr, y + l);
  s.lineTo(x + rr, y + l);
  s.quadraticCurveTo(x, y + l, x, y + l - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

export function useSlabGeometry(w: number, t: number, l: number, r: number): THREE.BufferGeometry {
  return useMemo(() => {
    const bevel = Math.min(0.016, t * 0.24);
    const depth = Math.max(0.001, t - bevel * 2);
    const g = new THREE.ExtrudeGeometry(roundedRectShape(w, l, r), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 20,
    });
    // Extrusion runs along +Z; stand it up so it runs along +Y, then centre it.
    g.rotateX(-Math.PI / 2);
    g.translate(0, -depth / 2, 0);
    // NB: do NOT computeVertexNormals() here. ExtrudeGeometry already emits
    // correct flat-top / beveled-edge normals; recomputing averages them across
    // the bevel-to-face boundary, which both kills the bevel highlight (caps
    // read as flat planes) and leaves a visible shading seam along the top
    // face's triangulation.
    // Planar UVs across the top face so panel artwork maps predictably.
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + w / 2) / w;
      uv[i * 2 + 1] = 1 - (pos.getZ(i) + l / 2) / l;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }, [w, t, l, r]);
}

type SlabProps = {
  size: [number, number, number];
  radius: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  renderOrder?: number;
  children?: React.ReactNode;
};

export const Slab: React.FC<SlabProps> = ({
  size,
  radius,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  castShadow = false,
  receiveShadow = false,
  renderOrder,
  children,
}) => {
  const geo = useSlabGeometry(size[0], size[1], size[2], radius);
  return (
    <mesh
      geometry={geo}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      renderOrder={renderOrder}
    >
      {children}
    </mesh>
  );
};
