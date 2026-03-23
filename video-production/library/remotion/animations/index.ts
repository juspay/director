// Origin: v7 animations library — extracted to library on 2026-03-23
// Master animation exports for TARA v7.4 motion design system
// Each module corresponds to a visual system in the production script.

// Layer accumulation — opening sequence
export {
  staggeredLayers,
  layerSettle,
  fadeToBackground,
  type LayerState,
  type LayerAccumulationResult,
  type SettleResult,
} from "./layers";

// Connection lines, tendrils, and constellation
export {
  amberLine,
  tendrilExtend,
  tendrilRetract,
  organicGrow,
  constellationForm,
  type Point2D,
  type LineState,
  type TendrilState,
  type ConstellationPoint,
  type ConstellationEdge,
  type ConstellationState,
} from "./connections";

// All 7 scene transitions
export {
  t1_emptyToBuried,
  t2_buriedToGap,
  t3_gapToIntent,
  t4_intentToThread,
  t5_threadToExecution,
  t6_prsToEcosystem,
  t7_ecosystemToLogo,
  type TransitionState,
} from "./transitions";

// Pulse, glow, and flare effects
export {
  amberPulse,
  amberFlare,
  pointIntensify,
  planLock,
  type PulseState,
  type FlareState,
  type IntensifyState,
  type PlanLockState,
} from "./pulses";

// Typography animations
export {
  fadeReveal,
  dissolveReveal,
  hardCut,
  particleDissolve,
  type TextRevealState,
  type DissolveRevealState,
  type HardCutState,
  type ParticleDissolveState,
} from "./typography";

// Camera and viewport
export {
  slowPullBack,
  focusShift,
  viewportExpand,
  type CameraState,
  type FocusShiftState,
  type ViewportExpandState,
} from "./camera";
