import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Slab } from './Slab';
import { capMask } from './faces';

/**
 * A subdivided plane bowed onto the cap's paraboloid.
 *
 * `pw`/`pl` are the patch's own footprint; `capW`/`capL` are the cap it belongs
 * to. Evaluating the height in CAP coordinates means a small patch (the logo)
 * and the full plate lie on the same surface, so the artwork rides the dome
 * instead of hovering flat above it.
 */
function paraboloid(pw: number, pl: number, capW: number, capL: number, h: number, seg: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(pw, pl, seg, seg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i) / (capW / 2);
    const ny = p.getY(i) / (capL / 2);
    const u = Math.max(0, 1 - nx * nx);
    const v = Math.max(0, 1 - ny * ny);
    // SQUARED falloff, so dz/dx is zero at the rim and the plate meets the slab
    // tangentially. A plain paraboloid lands on the rim at an angle, and that
    // skirt caught a grazing specular the grade hue-shifted into a salmon ring
    // around the gold plate. It also concentrates the bow toward the centre,
    // which is the shape the reference's plates actually have.
    p.setZ(i, h * u * u * v * v);
  }
  g.computeVertexNormals();
  return g;
}

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
  /** Dome multiplier — heroes bow visibly in the reference (eyewitness, pass 11). */
  domeStrength?: number;
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
  /**
   * Default lowered 1 -> 0.4. Once the frame was actually in focus, a full-
   * strength dome on the small cards showed a hard specular terminator arcing
   * right across the face — the clearcoat band edge on a 7%-of-width bump. The
   * reference's capability cards are near-flat; only its brand plates bow, and
   * those pass their own strength explicitly.
   */
  domeStrength = 0.4,
}) => {
  const [w, t, l] = size;
  const r = radius ?? Math.min(w, l) * 0.22;
  const transparent = opacity < 1;
  const [fw, fl] = faceSize ?? [w * faceScale, l * faceScale];
  const trayT = t * 0.30;
  const wellT = t * 0.55;
  /**
   * DOMED cap surface.
   *
   * The reference's caps are pillowy: the gold Recurly plate bows, and that
   * curvature is what carries the broad bright-to-dark specular sweep across it
   * (eyewitness, pass 11 — the perceptual driver behind five passes of "A reads
   * closer//more present"). Pass 12 first bowed only the LOGO plane, which is
   * ~90% transparent — the surface the camera actually sees is the slab's flat
   * top, so nothing bowed and the gold stayed uniform. The dome therefore has
   * to be its own opaque plate covering the whole cap, cut to the slab's
   * squircle by an alpha mask, with the logo riding the same paraboloid above.
   *
   * Doming the slab's own top face is not an option: ExtrudeGeometry caps are
   * ear-clipped from the contour alone, so every cap vertex sits on the rim
   * where the paraboloid is zero.
   */
  const domeH = Math.min(w, l) * 0.055 * domeStrength;
  const bev = Math.min(0.016, t * 0.24);
  // Covers most of the bevel: the sliver of flat slab top left exposed at
  // bev*2 caught a clearcoat specular that Bloom turned into a salmon halo
  // around the gold plate. The dome's own rim shading replaces the bevel
  // highlight it hides.
  const plateGeo = useMemo(
    () => paraboloid(w, l, w, l, domeH, 28),
    [w, l, domeH],
  );
  const domeGeo = useMemo(() => paraboloid(fw, fl, w, l, domeH, 28), [fw, fl, w, l, domeH]);
  const plateMask = useMemo(() => capMask(w, l, r), [w, l, r]);
  React.useEffect(() => () => { plateGeo.dispose(); plateMask.dispose(); }, [plateGeo, plateMask]);
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
      {/* The bowed surface itself, in the cap's own colour. Sits a hair above
          the slab top so the bevel highlight ring stays visible around it.
          It does NOT cast: the slab beneath already casts the cap's shadow, and
          a shallow paraboloid casting into its own shadow map drew a hard
          diagonal acne seam across every hero face once the frame was sharp
          enough to show it. */}
      <mesh
        position={[0, t / 2 + 0.0015 + lift, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={18}
        geometry={plateGeo}
        receiveShadow
      >
        <meshPhysicalMaterial
          color={color}
          alphaMap={plateMask}
          alphaTest={0.5}
          roughness={roughness}
          metalness={0.0}
          clearcoat={clearcoat}
          clearcoatRoughness={0.3}
          reflectivity={0.6}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      {face && (
        <mesh position={[0, t / 2 + 0.011 + lift, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20} geometry={domeGeo}>
          {/* LIT faces (pass 8). The unlit toneMapped=false basic material
              could not carry the reference's specular gradients — the
              eyewitness pass confirmed A's gold face has a bright-to-dark
              lighting sweep while ours rendered uniform, a root cause of the
              persistent "flat" verdicts. fog stays off so the lockup
              wordmarks keep their measured darkness at 16 units out. */}
          {/* UNLIT ink layer.
              MEASURED: the reference's label text reaches luma 49 (darkest 4%
              RGB 54,61,70) while ours bottomed out at 199 (197,203,219) — type
              barely separable from the card under it. The artwork is not the
              problem: #414a5e is luma 72. Pass 8 made this layer a LIT
              standard material to win the specular gradient the flat gold was
              missing, and it has been washing every glyph in the film ever
              since; roughness 0.94 and envMapIntensity 0.18 moved it by three
              luma, and an opaque ground made it worse (the lit face rendered
              visibly brighter than the slab it sits on, leaving a white
              rectangle inset in each card).
              The gradient no longer has to come from here — the domed plate
              below carries it — so the ink goes back to being exactly the value
              it was authored at. This is also why the centre-of-frame Laplacian
              deficit has survived six passes: Laplacian energy is contrast. */}
          <meshBasicMaterial
            map={face}
            transparent
            alphaTest={0.004}
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      )}
    </group>
  );
};
