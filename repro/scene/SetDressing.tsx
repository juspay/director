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
    'plain', 'plain', 'dots', 'plain', 'metal', 'plain',
    'doc', 'plain', 'chart', 'plain', 'blue', 'plain',
    'gold', 'plain', 'metal', 'lightblue', 'plain', 'dots',
  ];
  let i = 0;
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -3; gz <= 3; gz++) {
      // leave the centre clear — the hero keys live there
      if (Math.abs(gx) <= 0 && Math.abs(gz) <= 0) continue;
      const jitter = 0.22;
      // Panels are broad and shallow and butt right up against each other —
      // tall slabs read as a city of boxes instead of a panelled surface.
      const w = 2.15 + r() * 1.2;
      const l = 2.15 + r() * 1.2;
      const x = gx * 2.32 + (r() - 0.5) * jitter;
      const z = gz * 2.32 + (r() - 0.5) * jitter;
      const h = 0.05 + r() * 0.055;
      slabs.push({
        pos: [x, h / 2, z],
        size: [w, h, l],
        rotY: (r() - 0.5) * 0.06,
        kind: kinds[i % kinds.length],
      });
      i++;
    }
  }
  // A few large under-slabs directly beneath the hero area so the centre still
  // reads as panelled floor rather than a hole.
  slabs.push({ pos: [-0.15, 0.035, 0.1], size: [3.3, 0.07, 3.2], rotY: 0.02, kind: 'plain' });
  slabs.push({ pos: [1.95, 0.04, -1.7], size: [2.4, 0.08, 2.2], rotY: -0.03, kind: 'plain' });
  slabs.push({ pos: [-2.55, 0.05, 0.75], size: [1.55, 0.09, 2.05], rotY: 0.04, kind: 'lightblue' });
  slabs.push({ pos: [1.15, 0.05, 2.45], size: [2.0, 0.09, 1.45], rotY: -0.02, kind: 'gold' });
  slabs.push({ pos: [-1.85, 0.05, -2.35], size: [1.7, 0.08, 1.5], rotY: 0.03, kind: 'blue' });
  slabs.push({ pos: [2.75, 0.05, 1.15], size: [1.5, 0.08, 1.9], rotY: -0.05, kind: 'chart' });
  return slabs;
}

export const SetDressing: React.FC<{ whiten?: number }> = ({ whiten = 0 }) => {
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
      gold: panelSolid(C.gold),
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
    <group>
      {slabs.map((s, i) => {
        const metalish = s.kind === 'metal';
        const brand = s.kind === 'blue' || s.kind === 'gold' || s.kind === 'lightblue';
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
              metalness={metalish ? 0.72 : 0.0}
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
export const Peripherals: React.FC<{ whiten?: number }> = ({ whiten = 0 }) => {
  const items = useMemo(() => {
    const r = rng(778812);
    const out: Array<{ pos: [number, number, number]; size: [number, number, number]; rotY: number; color: string }> = [];
    const ring = [
      [-3.3, 1.9], [-4.0, -1.1], [-2.6, -3.2], [0.9, -3.9], [3.5, -2.4],
      [4.1, 0.7], [3.0, 3.1], [-0.6, 4.0], [-4.4, 3.4], [2.0, 4.6],
      [-5.2, 0.4], [5.0, 2.6], [-1.9, -5.0], [4.6, -4.2],
    ];
    for (const [x, z] of ring) {
      const w = 1.0 + r() * 0.9;
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
    <group>
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
