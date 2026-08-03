import React, { useMemo, useRef, useEffect } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { SoftShadows, Environment, Lightformer } from '@react-three/drei';
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  N8AO,
} from '@react-three/postprocessing';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C, RES } from './scene/theme';
import { rng } from './scene/faces';
import { Timeline, CameraRig, shotIndex } from './scene/Timeline';

/**
 * KEY LIGHT — deliberately shadowless, physical units.
 *
 * The two-year mystery of "the gobo never reads" resolved into three stacked
 * faults, each proven by measurement in this stack (three r169 + @remotion/
 * three headless):
 *   1. spotLight.map is never sampled — an 8x8 black/white checker cookie
 *      changed frame luma std by 0.2. Every projected-texture attempt since
 *      pass 3 was dead on arrival.
 *   2. decay={0} zeroes the light in physical lighting mode — the "key at
 *      1.55" contributed nothing. The failed relight (key 7.0, fills halved)
 *      blew the wall out with FILL light, which is why no dapple appeared.
 *   3. With castShadow enabled the spot's own shadow map reads as all-shadow
 *      and erases its contribution entirely (with or without PCSS, at any
 *      shadow-camera config tried). So the key runs shadowless at physical
 *      intensity (candela; ~d^2 x desired contribution) and shadow duty stays
 *      with the directional, whose maps are proven to work here.
 * The dapple itself lives in the post chain (Dapple, below).
 */
const GoboKey: React.FC = () => {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight
        position={[-2.2, 15.5, 5.0]}
        target={target}
        angle={0.62}
        penumbra={1}
        intensity={260}
        color="#f7f9ff"
      />
    </>
  );
};



/**
 * High-key studio rig: a big soft overhead key, a warm bounce from camera-left
 * and a cool bounce from camera-right. The target's whites are never neutral —
 * they drift warm on one side of every cap and cool on the other.
 */
const Lights: React.FC = () => (
  <>
    <SoftShadows size={62} samples={20} focus={0.55} />
    <GoboKey />
    {/* Fill levels, restored after a failed rebalance.
        All fifteen seconds still report "flat, static, uniform lighting with no
        shadow movement", and several ask outright for a dappled gobo — one that
        has been in this scene since pass 3 and does not visibly read. The
        theory was that fill was drowning it, so the key went to 7.0 and every
        fill source was halved. That blew the tile wall to flat white, erased
        the seams and the Live Now pill, measured +37 luma against the
        reference at f30 — and produced no more dapple than before. So the
        premise was wrong, and the projected pattern is failing for some other
        reason. Reverted rather than shipped; the cause is still open. */}
    <Environment resolution={1024} background={false}>
      <Lightformer intensity={0.5} position={[0, 9, 2]} scale={[44, 44, 1]} color="#ffffff" />
      {/* Warm bounce halved in warmth, cool bounce strengthened: the verified
          colour findings put the reference's whites on the blue side of neutral
          in every measured second, macro and lockup alike. */}
      <Lightformer intensity={0.4} position={[-9, 5, 6]} scale={[22, 22, 1]} color="#f9f3ea" />
      <Lightformer intensity={0.36} position={[9, 4, -4]} scale={[22, 22, 1]} color="#e7effc" />
      <Lightformer intensity={0.2} position={[0, 1.5, 11]} scale={[26, 12, 1]} color="#ffffff" />
    </Environment>
    {/* Fill pulled DOWN and the shadow-casting key pushed UP. Measured at f30:
        the reference's 5th-percentile luma is 96.5 against our 164.8 — it has
        genuinely dark contact shadows under its cards and we had none, the
        frame floating on an even fill. There is real headroom here: the earlier
        crushed-blacks finding was about p1 falling to 17, and the reference's
        own floor at this instant is 96. */}
    <ambientLight intensity={0.07} />
    <hemisphereLight args={['#f2f6fe', '#d3d7de', 0.11]} />
    <directionalLight
      position={[-3.0, 6.5, 3.2]}
      intensity={0.85}
      color="#f2f6fe"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-near={0.5}
      shadow-camera-far={30}
      shadow-bias={-0.0004}
    />
    <directionalLight position={[5.5, 4.0, 6.0]} intensity={0.24} color="#f4f6fb" />
  </>
);

/**
 * Grade constants, tuned by measuring rendered stills against the target with
 * ffprobe signalstats (SATAVG / YLOW / YHIGH) rather than by eye.
 */
// Verified full-frame saturation: reference 0.20 vs render 0.08 in the macro
// seconds, 0.18 vs 0.10 in the lockup. Most of the deficit is tint the whites
// simply did not carry (fixed at the albedo/light level); the boosts below
// close the remainder. Watch the gold hero when touching these — at t=6.2 the
// render already measured MORE saturated than the reference (0.62 vs 0.53).
// 0.52 railed the indigo badges to pure (0,0,240) — luma 17, which is what
// the "crushed blacks" spike in the macro seconds actually was. The whites'
// remaining saturation deficit vs the reference (0.05 vs 0.20) is per-pixel
// warm/cool variation from its dappled light, which a uniform saturation
// multiplier cannot supply — it only rails the already-saturated brand blues.
const SAT_MACRO = 0.24;
const CONTRAST_MACRO = 0.16;
const BRIGHT_MACRO = -0.06;
// The lockup grade was tuned when this shot was blowing out, and it has been
// suppressing colour ever since: at saturation 0.16 the rendered gold came back
// (207,194,117) against the target's (217,195,72) and the blue (96,112,197)
// against (64,101,220) — both washed toward grey. The set rebuild removed the
// clipping this was compensating for (blown pixels measure 0.00000 against the
// reference's 0.00035), so the compression can come back off.
// Re-measured against the reference at f300: its lockup runs luma p50 208.6 /
// p95 240.0, ours 187.2 / 202.8 — the shot had no bright whites at all against
// a reference whose wall is a near-white field. The compression this grade
// still carried was the last of the blow-out correction.
const SAT_LOCKUP = 0.20;
const CONTRAST_LOCKUP = 0.0;
const BRIGHT_LOCKUP = 0.06;

/**
 * Per-shot focus target. Locking focus to a fixed world point meant the plane
 * drifted off the subject as each shot's camera orbited; the subject has to be
 * what is sharp.
 */
const FOCUS: Array<[number, number, number]> = [
  [0.0, 0.0, 0.15],
  [-0.05, 0.0, 0.0],
  [0.05, 0.0, 0.05],
  [0.05, 0.0, 0.05],
  [0.0, 0.0, 0.12],
];

/**
 * Macro depth of field.
 *
 * focalLength here is the *focus range*, not a lens focal length — smaller is
 * shallower. It had been pushed to 0.30-0.45, which is effectively no depth of
 * field at all, and the per-second analysis duly reported that this scene "has
 * infinite depth of field with all elements in sharp focus" against a reference
 * whose frame edges fall away.
 *
 * That was self-inflicted: an earlier pass widened the range because narrow
 * focus was costing edge-detail score, and the metric improved while the image
 * got worse. The fault was never the effect, it was the focus PLANE — targeting
 * a fixed world point that the subject moved away from. With focus tracking the
 * subject per shot the range can come back down to something photographic.
 *
 * bokehScale is a pixel quantity so it scales with RES; bloom stays minimal
 * because it over-saturates the badge blue and eats thin glyph strokes.
 */
/**
 * Dappled pools of light and shade — an in-scene MULTIPLY plane.
 *
 * Third architecture, and the one whose semantics cannot surprise: after the
 * projected gobo (spotLight.map never sampled), the shadow cucoloris (spot
 * shadows erase the light; plane never entered the directional's map), and a
 * post-chain TextureEffect (non-monotonic response to opacity under pass
 * merging), the pattern is now a transparent plane hovering between camera
 * and set with fixed-function MultiplyBlending. White is a no-op; cool-dark
 * and warm-dark pools darken and tint whatever is behind them along the view
 * ray, so the pools cross caps, wall and shadows together and drift with the
 * texture offset. This is what the reference's dapple measurably is at this
 * resolution: soft large-scale luminance variation carrying warm/cool tint —
 * verified as the saturation the whites carry (A 0.20 vs our 0.05), the p5
 * shadow band (A ~110 vs our ~180) and the lockup corner falloff.
 */
function dappleTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d')!;
  // The whole field is biased cool — the reference's per-second rb varies
  // (-6..-22) but NEVER goes warm; a neutral base made frame tint a lottery
  // decided by whichever pool drifted over the view (measured +24 one round,
  // -55 another).
  x.fillStyle = '#f0f3f9';
  x.fillRect(0, 0, 1024, 1024);
  const r = rng(20260802);
  const pool = (fill: [number, number, number], count: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const px = r() * 1024;
      const py = r() * 1024;
      const rad = 150 + r() * 300;
      const g = x.createRadialGradient(px, py, rad * 0.12, px, py, rad);
      g.addColorStop(0, `rgba(${fill[0]},${fill[1]},${fill[2]},${alpha})`);
      g.addColorStop(1, `rgba(${fill[0]},${fill[1]},${fill[2]},0)`);
      x.fillStyle = g;
      x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
  };
  // Cool pools softened from (178,190,228). MultiplyBlending scales channels,
  // so the wall's HUE is set here and nothing downstream can correct it — no
  // amount of exposure or emissive lift changes the ratio. Measured at f300 the
  // lockup ran rb -51.6 against the reference's -13.5; that entire error lives
  // in this constant.
  pool([188, 196, 222], 18, 0.7); // cool shade
  pool([242, 236, 222], 7, 0.3); // warm accents — weak: a warm pool drifting over a macro view must never flip the frame warm
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export const DapplePlane: React.FC = () => {
  const frame = useCurrentFrame();
  const map = useMemo(() => dappleTexture(), []);
  map.repeat.set(2.4, 2.4);
  // Drift is a per-beat quantity: the macro seconds and the lockup's arrival
  // sweep visibly (the 0.00042 constant measured 6x under the reference at
  // t=8.5), but the reference's HOLD is nearly still (0.23 mean delta vs our
  // 0.57 when the fast drift ran flat) — so the pools coast to a drift after
  // the settle.
  const rate = interpolate(frame, [280, 330], [0.0017, 0.00045], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = frame <= 280 ? frame * 0.0017 : 280 * 0.0017 + (frame - 280) * rate;
  map.offset.set(0.05 + drift, 0.08 + drift * 0.65);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.6, 0]} renderOrder={5}>
      <planeGeometry args={[44, 44]} />
      <meshBasicMaterial map={map} transparent blending={THREE.MultiplyBlending} depthWrite={false} />
    </mesh>
  );
};

const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // The lockup is a long-lens wide sitting ~16 units out; the same range that
  // reads as shallow up close would soften the plates themselves there.
  // Tightened after verification: the macro beats measured "much wider depth
  // of field" than the reference (eyewitness, sec 1), and the lockup measured
  // SHARPER than the reference's soft wide (region_sharpness, sec 12:
  // A lap_var 0.91 vs B 3.06).
  const focalLength = interpolate(frame, [255, 300], [0.09, 0.17], ease);
  const bokehScale = interpolate(frame, [255, 300], [2.8, 2.2], ease) * RES;
  const focus = FOCUS[shotIndex(frame)];
  // Grade stage. NOTE: `gl.toneMappingExposure` on <ThreeCanvas> is a NO-OP once
  // EffectComposer owns the render — 0.92, 0.72 and 0.30 all produced
  // byte-identical frames (md5 fa16ee95…). Exposure/contrast therefore has to be
  // driven here, in the composer, or it silently does nothing.
  //
  // Measured against the target at 720x900:
  //   macro beats  repro saturation 7.6 vs target 17  -> boost
  //   final lockup repro 138..240 vs target 174..211  -> reduce contrast
  const satBoost = interpolate(frame, [250, 300], [SAT_MACRO, SAT_LOCKUP], ease);
  const contrast = interpolate(frame, [250, 300], [CONTRAST_MACRO, CONTRAST_LOCKUP], ease);
  const brightness = interpolate(frame, [250, 300], [BRIGHT_MACRO, BRIGHT_LOCKUP], ease);
  return (
    <EffectComposer enableNormalPass={false} multisampling={8}>
      {/* Contact occlusion. This was the ONLY finding present in all fifteen
          seconds of the A/B analysis: flat lighting, harsh shadows, "lacking
          realistic ambient occlusion". Pass 3 read the same signal as moving
          dappled light and answered it with a projected gobo — which supplied
          light movement but not darkening where surfaces meet. It also could
          not have worked before the set rebuild, because nothing in the scene
          was in contact with anything. aoRadius is in world units and the caps
          are ~1.3 across, so a third of a unit catches seams and well walls
          without shading whole panels. */}
      <N8AO aoRadius={0.40} distanceFalloff={0.7} intensity={3.1} quality="high" halfRes={false} color="#2b2f3a" />
      <DepthOfField target={focus} focalLength={focalLength} bokehScale={bokehScale} height={Math.round(720 * RES)} />
      <Bloom intensity={0.025} luminanceThreshold={0.985} luminanceSmoothing={0.25} mipmapBlur />
      {/* Ramped for the lockup: its corners measured 11-13% BRIGHTER than
          centre against the reference's 1-7% (fog whitening the frame edges).
          The reference's falloff there is dappled light pooling; until the gobo
          reads, a measured vignette carries that signature. */}
      <Vignette eskil={false} offset={0.28} darkness={interpolate(frame, [255, 300], [0.16, 0.30], ease)} />
      <HueSaturation saturation={satBoost} />
      <BrightnessContrast brightness={brightness} contrast={contrast} />
    </EffectComposer>
  );
};

/**
 * Distance haze, retuned per beat. A fixed 5.5-17 range is right for the macro
 * shots but the final lockup sits ~14 units out, where that range fogs the
 * whole composition to flat white — the range has to travel with the camera.
 */
const FogRig: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // The macro camera orbits ~5.1 units from the hero, so a 5.0 near plane put
  // the SUBJECT at fog onset: everything from the hero outward was mixed toward
  // #eef2f8 (Y~241), which measured as saturation 7.6 against the target's 17 —
  // the "behind milk" look. Start the haze past the hero and let it fall off
  // over a longer run so the far dressing still recedes.
  // Lockup near pushed past the subject (camera sits ~16.8 units out): at
  // near=13.5 the plates themselves took ~10% fog, which is what washed the
  // dark Recurly wordmark to p01≈96 against the reference's true darks (p01
  // 4-9) and brightened the frame corners. Far raised so the remaining haze
  // whitens the edges less.
  const near = interpolate(frame, [250, 300], [9.5, 17.5], ease);
  const far = interpolate(frame, [250, 300], [30, 58], ease);
  return <fog attach="fog" args={['#f1f2f3', near, far]} />;
};

/**
 * Base plate so the seams between tiles never show background through. It sits
 * just under the tile slabs — the tiles are 0.42 deep, so the old -0.02 plate
 * would have cut straight through them.
 */
const Underplate: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.40, 0]} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#c9c8c4" roughness={0.9} metalness={0} />
  </mesh>
);

export const RecurlyHyperswitch: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [1.35, 3.3, 3.65], fov: 34, near: 0.1, far: 100 }}
      shadows
      style={{ backgroundColor: C.bg }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.785, antialias: true }}
    >
      <FogRig />
      <CameraRig />
      <Lights />
      <Underplate />
      {/* CloudOverlay removed: it was a flat unlit decal on the floor plane,
          which cannot dapple anything it does not lie on and now z-fights the
          raised tiles. GoboKey projects the same pattern as real light. */}
      <Timeline />
      <DapplePlane />
      <Effects />
    </ThreeCanvas>
  );
};
