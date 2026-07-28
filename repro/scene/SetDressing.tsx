import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Slab } from './Slab';
import {
  panelPlain,
  panelDots,
  panelMetal,
  panelDoc,
  panelChart,
  panelSolid,
  rng,
} from './faces';
import { C } from './theme';

/**
 * The target's world is not a textured ground plane — it's a mosaic of many
 * separate slabs (plain, dot-grid, ribbed metal, document, chart, and flat
 * brand-colour panels) butted together with visible seams at slightly
 * different heights. Everything else sits on top of that mosaic, and the
 * out-of-focus edges of it are what fill the frame at every depth.
 */

type Kind = 'plain' | 'dots' | 'metal' | 'doc' | 'chart' | 'blue' | 'gold' | 'lightblue';

type Slab = {
  pos: [number, number, number];
  size: [number, number, number];
  rotY: number;
  kind: Kind;
};

// An irregular grid: cells jittered in position, size and height so the seams
// never line up into an obvious lattice.
function buildSlabs(): Slab[] {
  const r = rng(20260725);
  const slabs: Slab[] = [];
  const kinds: Kind[] = [
    'plain', 'doc', 'dots', 'gold', 'metal', 'plain',
    'doc', 'blue', 'chart', 'plain', 'lightblue', 'blue',
    'doc', 'plain', 'metal', 'gold', 'doc', 'dots',
    'chart', 'gold', 'plain', 'chart', 'lightblue', 'dots',
  ];
  let i = 0;
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -3; gz <= 3; gz++) {
      // leave the centre clear — the hero keys live there
      if (Math.abs(gx) <= 0 && Math.abs(gz) <= 0) continue;
      const jitter = 0.22;
      // Panels are broad and shallow and butt right up against each other —
      // tall slabs read as a city of boxes instead of a panelled surface.
      const kind = kinds[i % kinds.length];
      const brandish = kind === 'blue' || kind === 'gold' || kind === 'lightblue';
      // brand accents stay small; structural panels stay broad
      const w = brandish ? 1.05 + r() * 0.5 : 2.15 + r() * 1.2;
      const l = brandish ? 1.05 + r() * 0.5 : 2.15 + r() * 1.2;
      const x = gx * 2.32 + (r() - 0.5) * jitter;
      const z = gz * 2.32 + (r() - 0.5) * jitter;
      const h = 0.05 + r() * 0.055;
      slabs.push({
        pos: [x, h / 2, z],
        size: [w, h, l],
        rotY: (r() - 0.5) * 0.06,
        kind,
      });
      i++;
    }
  }
  // A few large under-slabs directly beneath the hero area so the centre still
  // reads as panelled floor rather than a hole.
  slabs.push({ pos: [-0.15, 0.035, 0.1], size: [3.3, 0.07, 3.2], rotY: 0.02, kind: 'plain' });
  slabs.push({ pos: [1.95, 0.04, -1.7], size: [2.4, 0.08, 2.2], rotY: -0.03, kind: 'plain' });
  slabs.push({ pos: [-2.55, 0.05, 0.75], size: [0.95, 0.09, 1.25], rotY: 0.04, kind: 'lightblue' });
  slabs.push({ pos: [2.35, 0.05, -0.55], size: [0.80, 0.09, 1.05], rotY: -0.06, kind: 'blue' });
  slabs.push({ pos: [-0.95, 0.05, 3.05], size: [1.05, 0.09, 0.80], rotY: 0.05, kind: 'gold' });
  slabs.push({ pos: [3.05, 0.05, 2.85], size: [0.90, 0.09, 0.95], rotY: -0.03, kind: 'lightblue' });
  slabs.push({ pos: [1.15, 0.05, 2.45], size: [1.15, 0.09, 0.85], rotY: -0.02, kind: 'gold' });
  slabs.push({ pos: [-1.85, 0.05, -2.35], size: [0.95, 0.08, 0.85], rotY: 0.03, kind: 'blue' });
  slabs.push({ pos: [2.75, 0.05, 1.15], size: [1.5, 0.08, 1.9], rotY: -0.05, kind: 'chart' });
  return slabs;
}

export const SetDressing: React.FC<{
  whiten?: number;
  offset?: [number, number, number];
  spin?: number;
  /**
   * Radius beyond which brand-coloured accents are suppressed. The wide lockup
   * shot frames a much larger area, so outlying accents land on the frame
   * border — the reference keeps its borders neutral through that shot.
   */
  brandRadius?: number;
}> = ({ whiten = 0, offset = [0, 0, 0], spin = 0, brandRadius = Infinity }) => {
  const slabs = useMemo(buildSlabs, []);
  const maps = useMemo(
    () => ({
      plain: panelPlain(3),
      plain2: panelPlain(11),
      dots: panelDots(),
      metal: panelMetal(),
      doc: panelDoc('Billing', 'gold'),
      doc2: panelDoc('Invoices', 'blue'),
      chart: panelChart(),
      blue: panelSolid('#6d8fdd'),
      gold: panelSolid('#f2c93a'),
      lightblue: panelSolid('#a8c1f0'),
    }),
    [],
  );

  const pick = (kind: Kind, i: number): THREE.Texture => {
    switch (kind) {
      case 'dots': return maps.dots;
      case 'metal': return maps.metal;
      case 'doc': return i % 2 ? maps.doc2 : maps.doc;
      case 'chart': return maps.chart;
      case 'blue': return maps.blue;
      case 'gold': return maps.gold;
      case 'lightblue': return maps.lightblue;
      default: return i % 3 === 0 ? maps.plain2 : maps.plain;
    }
  };

  return (
    <group position={offset} rotation={[0, spin, 0]}>
      {slabs.map((s, i) => {
        const metalish = s.kind === 'metal';
        const brand = s.kind === 'blue' || s.kind === 'gold' || s.kind === 'lightblue';
        if (brand && Math.hypot(s.pos[0] + offset[0], s.pos[2] + offset[2]) > brandRadius) return null;
        return (
          <Slab
            key={i}
            size={s.size}
            radius={Math.min(s.size[0], s.size[2]) * (brand ? 0.13 : 0.05)}
            position={s.pos}
            rotation={[0, s.rotY, 0]}
            receiveShadow
            castShadow
          >
            <meshPhysicalMaterial
              map={pick(s.kind, i)}
              roughness={metalish ? 0.34 : brand ? 0.42 : 0.62}
              metalness={metalish ? 0.35 : 0.0}
              clearcoat={brand ? 0.7 : 0.28}
              clearcoatRoughness={0.42}
              emissive="#ffffff"
              emissiveIntensity={whiten}
            />
          </Slab>
        );
      })}
    </group>
  );
};

/**
 * Small out-of-focus cards scattered above the mosaic at the frame edges.
 * They exist purely to give the bokeh something to chew on — in the target
 * there is never empty space, only progressively blurrier furniture.
 */
export const Peripherals: React.FC<{ whiten?: number; offset?: [number, number, number]; spin?: number }> = ({ whiten = 0, offset = [0, 0, 0], spin = 0 }) => {
  const items = useMemo(() => {
    const r = rng(778812);
    const out: Array<{ pos: [number, number, number]; size: [number, number, number]; rotY: number; color: string }> = [];
    // Pushed well outside the acting area — the subjects occupy roughly
    // |x| < 1.9, |z| < 1.9 across every shot.
    const ring = [
      [-4.3, 2.6], [-4.9, -1.5], [-3.4, -4.0], [1.2, -4.8], [4.4, -3.1],
      [5.0, 0.9], [3.8, 3.9], [-0.8, 4.9], [-5.4, 4.2], [2.6, 5.6],
      [-6.2, 0.5], [6.0, 3.2], [-2.4, -6.0], [5.6, -5.1],
    ];
    for (const [x, z] of ring) {
      const w = 0.85 + r() * 0.7;
      out.push({
        pos: [x + (r() - 0.5) * 0.4, 0.14 + r() * 0.06, z + (r() - 0.5) * 0.4],
        size: [w, 0.085, w * (0.55 + r() * 0.25)],
        rotY: (r() - 0.5) * 0.35,
        color: r() > 0.82 ? '#dbe6fb' : '#ffffff',
      });
    }
    return out;
  }, []);
  return (
    <group position={offset} rotation={[0, spin, 0]}>
      {items.map((it, i) => (
        <Slab
          key={i}
          size={it.size}
          radius={Math.min(it.size[0], it.size[2]) * 0.2}
          position={it.pos}
          rotation={[0, it.rotY, 0]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={it.color}
            roughness={0.5}
            metalness={0}
            clearcoat={0.5}
            clearcoatRoughness={0.35}
            emissive="#ffffff"
            emissiveIntensity={whiten}
          />
        </Slab>
      ))}
    </group>
  );
};
