// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring } from "remotion";
import { videoConfig, colors } from "../styles/theme";
import {
  smoothEase,
  gentleFade,
  dramaticEase,
  organicEase,
  snapEase,
  dissolveEase,
  weightedEase,
  throb,
} from "../utils/easing";
import { s, sceneTiming, beatFrames, bpmAt, toSeconds } from "../utils/timing";
import { staggeredLayers, fadeToBackground } from "./layers";
import { amberLine, constellationForm } from "./connections";

const { fps } = videoConfig;

// ---- Types ----

export interface TransitionState {
  /** 0 = fully in "from" state, 1 = fully in "to" state */
  progress: number;
  /** Overall opacity for crossfade */
  opacity: number;
  /** Phase-specific data for complex transitions */
  phase: string;
  /** Per-element states when the transition involves multiple components */
  elements: Record<string, number>;
}

// ---- T1: Empty → Buried Idea ----

/**
 * T1: Empty canvas → buried idea.
 * Staggered gray layers accumulate over amber shape.
 * Amber flare at "this morning" before final dimming.
 *
 * Mapped to: sceneTiming.opening (0:00 - 0:08)
 */
export function t1_emptyToBuried(frame: number): {
  layerOpacities: number[];
  layerPositions: Array<{ x: number; y: number; rotation: number; scale: number }>;
  amberOpacity: number;
  amberGlow: number;
  amberFlare: number;
  phase: "entering" | "accumulating" | "buried";
} {
  const { start, duration } = sceneTiming.opening;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      layerOpacities: [0, 0, 0, 0, 0],
      layerPositions: Array(5).fill({ x: 960, y: -100, rotation: 0, scale: 0.9 }),
      amberOpacity: 0,
      amberGlow: 0,
      amberFlare: 0,
      phase: "entering",
    };
  }

  // Amber shape fades in during first second
  const amberEntry = interpolate(localFrame, [0, s(1)], [0, 1], {
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  // Layer accumulation using the layers module
  const acc = staggeredLayers(Math.max(0, localFrame - s(1.5)), {
    layerCount: 5,
    staggerFrames: s(0.4),
  });

  // Amber fade using the layers module
  const fade = fadeToBackground(localFrame, {
    startFrame: s(1.5),
    fadeDuration: s(5.5),
    minOpacity: 0.06,
  });

  // Flare at ~7s ("this morning") — brief 0.3s brightness
  const flareCenter = s(7);
  const flareDuration = s(0.3);
  const amberFlare = interpolate(
    localFrame,
    [flareCenter, flareCenter + flareDuration * 0.3, flareCenter + flareDuration],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Phase detection
  let phase: "entering" | "accumulating" | "buried" = "entering";
  if (localFrame > s(1.5)) phase = "accumulating";
  if (localFrame > s(6)) phase = "buried";

  return {
    layerOpacities: acc.layers.map((l) => l.opacity),
    layerPositions: acc.layers.map((l) => ({
      x: l.x,
      y: l.y,
      rotation: l.rotation,
      scale: l.scale,
    })),
    amberOpacity: amberEntry * fade.opacity,
    amberGlow: amberEntry * fade.glowIntensity,
    amberFlare,
    phase,
  };
}

// ---- T2: Buried → Gap ----

/**
 * T2: Buried idea → gap visualization.
 * Gray layers settle. Two points of light fade in at edges.
 * 1.5s opacity ramp for the points.
 *
 * Mapped to: sceneTiming.gap (0:08 - 0:15)
 */
export function t2_buriedToGap(frame: number): {
  graySettleProgress: number;
  leftPointOpacity: number;
  rightPointOpacity: number;
  gapWidth: number;
  amberGlow: number;
  phase: "settling" | "points_appearing" | "gap_established";
} {
  const { start, duration } = sceneTiming.gap;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      graySettleProgress: 0,
      leftPointOpacity: 0,
      rightPointOpacity: 0,
      gapWidth: 0,
      amberGlow: 0.06,
      phase: "settling",
    };
  }

  // Gray layers settle down and fade slightly
  const settleProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 25, stiffness: 60, mass: 1.5 },
  });

  // Left point (warm amber "Decision") — 1.5s ramp starting at 0.5s
  const leftPointOpacity = interpolate(
    localFrame,
    [s(0.5), s(0.5) + s(1.5)],
    [0, 0.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: gentleFade }
  );

  // Right point (cool blue "Done") — 1.5s ramp, starts 0.3s after left
  const rightPointOpacity = interpolate(
    localFrame,
    [s(0.8), s(0.8) + s(1.5)],
    [0, 0.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: gentleFade }
  );

  // Gap width expands slightly as points appear
  const gapWidth = interpolate(localFrame, [s(0.5), duration], [600, 900], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Amber glow — residual from buried idea, very faint
  const amberGlow = interpolate(localFrame, [0, duration], [0.06, 0.03], {
    extrapolateRight: "clamp",
  });

  let phase: "settling" | "points_appearing" | "gap_established" = "settling";
  if (localFrame > s(0.5)) phase = "points_appearing";
  if (localFrame > s(4)) phase = "gap_established";

  return { graySettleProgress: settleProgress, leftPointOpacity, rightPointOpacity, gapWidth, amberGlow, phase };
}

// ---- T3: Gap → History → Intent ----

/**
 * T3: Gap → code history → architecture intent.
 * Code scrolling transforms into architecture diagrams.
 * Quick 5-second visual arc.
 *
 * Mapped to: sceneTiming.history (0:15 - 0:25)
 */
export function t3_gapToIntent(frame: number): {
  codeScrollY: number;
  codeOpacity: number;
  architectureOpacity: number;
  architectureScale: number;
  morphProgress: number;
  amberWarmth: number;
  phase: "code" | "morphing" | "architecture" | "weight" | "sustained";
} {
  const { start, duration } = sceneTiming.history;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      codeScrollY: 0,
      codeOpacity: 0,
      architectureOpacity: 0,
      architectureScale: 0.95,
      morphProgress: 0,
      amberWarmth: 0,
      phase: "code",
    };
  }

  // Code scrolling — first 2.5s
  const codeScrollY = interpolate(localFrame, [0, s(2.5)], [0, -400], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  const codeOpacity = interpolate(localFrame, [0, s(0.3), s(2), s(3)], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  // Architecture diagram — crossfade at 2.5s
  const architectureOpacity = interpolate(
    localFrame,
    [s(2), s(3), s(5), s(7)],
    [0, 1, 1, 1],
    { extrapolateRight: "clamp", easing: gentleFade }
  );

  const architectureScale = interpolate(localFrame, [s(2), s(3.5)], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Morph progress for shader/blend effects
  const morphProgress = interpolate(localFrame, [s(2), s(3.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: dissolveEase,
  });

  // "Carrying the weight" — amber warmth throb at 0:25-0:30
  // This happens in the weight scene but we prep the warmth here
  const amberWarmth = interpolate(localFrame, [s(7), duration], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  let phase: "code" | "morphing" | "architecture" | "weight" | "sustained" = "code";
  if (localFrame > s(2)) phase = "morphing";
  if (localFrame > s(3.5)) phase = "architecture";
  if (localFrame > s(7.5)) phase = "weight";
  if (localFrame > s(9)) phase = "sustained";

  return { codeScrollY, codeOpacity, architectureOpacity, architectureScale, morphProgress, amberWarmth, phase };
}

// ---- T4: Intent → Line → Thread ----

/**
 * T4: Architecture intent → amber line → Slack thread.
 * "Tara closes that gap." — the thesis moment.
 * Amber line clears clutter, plucked string SFX sync.
 *
 * Mapped to: sceneTiming.thesis (0:30 - 0:42)
 */
export function t4_intentToThread(frame: number): {
  gapPulseIntensity: number;
  lineProgress: number;
  lineGlow: number;
  clutterDissolve: number;
  ideaReEmergence: number;
  threadExpansion: number;
  phase: "gap_pulse" | "line_drawing" | "clutter_clearing" | "thread_forming";
} {
  const { start, duration } = sceneTiming.thesis;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      gapPulseIntensity: 0,
      lineProgress: 0,
      lineGlow: 0,
      clutterDissolve: 0,
      ideaReEmergence: 0,
      threadExpansion: 0,
      phase: "gap_pulse",
    };
  }

  // Gap points intensify before the line draws (first 3s)
  const gapPulseIntensity = interpolate(
    localFrame,
    [0, s(1.5), s(3)],
    [0.9, 1, 0.6],
    { extrapolateRight: "clamp", easing: weightedEase }
  );

  // "Tara closes that gap" — line draws at ~3s mark
  const lineStart = s(3);
  const lineDuration = s(1.2);
  const lineFrame = localFrame - lineStart;

  const lineProgress = lineFrame < 0
    ? 0
    : spring({
        frame: lineFrame,
        fps,
        config: { damping: 28, stiffness: 120, mass: 0.8 },
      });

  // Line glow — peaks at completion, SFX sync point
  const lineGlow = lineFrame < 0
    ? 0
    : interpolate(lineFrame, [0, lineDuration, lineDuration + s(0.5)], [0, 25, 10], {
        extrapolateRight: "clamp",
        easing: snapEase,
      });

  // Gray clutter dissolves when line completes
  const clutterDissolve = interpolate(
    localFrame,
    [lineStart + lineDuration * 0.7, lineStart + lineDuration + s(1)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smoothEase }
  );

  // Buried idea re-emerges
  const ideaReEmergence = interpolate(
    localFrame,
    [lineStart + lineDuration * 0.5, lineStart + lineDuration + s(0.8)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: dramaticEase }
  );

  // Thread expansion: line widens into abstract thread container
  const threadExpansion = interpolate(
    localFrame,
    [s(7), duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smoothEase }
  );

  let phase: "gap_pulse" | "line_drawing" | "clutter_clearing" | "thread_forming" = "gap_pulse";
  if (localFrame > lineStart) phase = "line_drawing";
  if (localFrame > lineStart + lineDuration * 0.7) phase = "clutter_clearing";
  if (localFrame > s(7)) phase = "thread_forming";

  return { gapPulseIntensity, lineProgress, lineGlow, clutterDissolve, ideaReEmergence, threadExpansion, phase };
}

// ---- T5: Thread → Roles → Plan → Delta → PRs ----

/**
 * T5: Continuous flow through the collaboration and execution scenes.
 * Thread → role highlights → plan locks → delta splits → PRs.
 * The longest transition, spanning two scenes.
 *
 * Mapped to: sceneTiming.slackThread + collaboration + execution (0:42 - 1:32)
 */
export function t5_threadToExecution(frame: number): {
  threadActive: boolean;
  investigationProgress: number;
  tendrilPhase: "idle" | "extending" | "retracting" | "done";
  roleHighlights: { pm: number; engineer: number; designer: number };
  preHighlight: number;
  planLockProgress: number;
  planGlow: number;
  deltaProgress: number;
  deltaBranches: number;
  prBadgeOpacities: number[];
  flowBackProgress: number;
  unifiedPulse: number;
  phase: "thread" | "investigation" | "collaboration" | "plan_lock" | "delta" | "prs" | "unified";
} {
  const threadStart = sceneTiming.slackThread.start;
  const collabStart = sceneTiming.collaboration.start;
  const execStart = sceneTiming.execution.start;
  const execEnd = execStart + sceneTiming.execution.duration;
  const localFrame = frame - threadStart;

  const defaults = {
    threadActive: false,
    investigationProgress: 0,
    tendrilPhase: "idle" as const,
    roleHighlights: { pm: 0, engineer: 0, designer: 0 },
    preHighlight: 0,
    planLockProgress: 0,
    planGlow: 0,
    deltaProgress: 0,
    deltaBranches: 0,
    prBadgeOpacities: [0, 0, 0],
    flowBackProgress: 0,
    unifiedPulse: 0,
    phase: "thread" as const,
  };

  if (localFrame < 0) return defaults;

  const threadActive = true;

  // --- Investigation (0:42 - 0:55) ---
  const investigationProgress = interpolate(
    localFrame,
    [0, sceneTiming.slackThread.duration],
    [0, 1],
    { extrapolateRight: "clamp", easing: smoothEase }
  );

  // Tendril phase
  let tendrilPhase: "idle" | "extending" | "retracting" | "done" = "idle";
  if (localFrame > s(3) && localFrame < s(8)) tendrilPhase = "extending";
  else if (localFrame >= s(8) && localFrame < s(10)) tendrilPhase = "retracting";
  else if (localFrame >= s(10)) tendrilPhase = "done";

  // --- Collaboration (0:55 - 1:15) ---
  const collabLocal = frame - collabStart;

  // Pre-highlight: neutral gray message outlines appear
  const preHighlight = collabLocal >= 0
    ? interpolate(collabLocal, [0, s(1)], [0, 1], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 0;

  // Role highlights — focus follows narration, one at a time
  // PM at ~1:03, Engineer at ~1:07, Designer at ~1:10
  const pmHighlight = collabLocal >= s(3)
    ? interpolate(collabLocal - s(3), [0, s(0.5), s(3.5), s(4)], [0, 1, 1, 0.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 0;

  const engHighlight = collabLocal >= s(7)
    ? interpolate(collabLocal - s(7), [0, s(0.5), s(2.5), s(3)], [0, 1, 1, 0.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 0;

  const desHighlight = collabLocal >= s(10)
    ? interpolate(collabLocal - s(10), [0, s(0.5), s(4.5), s(5)], [0, 1, 1, 0.6], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 0;

  // --- Execution (1:15 - 1:32) ---
  const execLocal = frame - execStart;

  // Plan locks — amber glow, visual snap
  const planLockProgress = execLocal >= 0
    ? spring({
        frame: execLocal,
        fps,
        config: { damping: 30, stiffness: 200, mass: 0.6 },
      })
    : 0;

  const planGlow = execLocal >= 0
    ? interpolate(execLocal, [0, s(0.5), s(1.5)], [0, 1, 0.4], {
        extrapolateRight: "clamp",
        easing: snapEase,
      })
    : 0;

  // Delta: plan splits into three streams
  const deltaProgress = execLocal >= s(2)
    ? interpolate(execLocal - s(2), [0, s(1.5)], [0, 1], {
        extrapolateRight: "clamp",
        easing: organicEase,
      })
    : 0;

  const deltaBranches = deltaProgress > 0.1 ? Math.min(3, Math.ceil(deltaProgress * 3)) : 0;

  // PR badges form sequentially
  const prBadgeOpacities = [0, 1, 2].map((i) => {
    const prDelay = s(5) + i * s(0.8);
    return execLocal >= prDelay
      ? spring({
          frame: execLocal - prDelay,
          fps,
          config: { damping: 20, stiffness: 140, mass: 0.5 },
        })
      : 0;
  });

  // Lines draw back to thread
  const flowBackProgress = execLocal >= s(8)
    ? interpolate(execLocal - s(8), [0, s(2)], [0, 1], {
        extrapolateRight: "clamp",
        easing: smoothEase,
      })
    : 0;

  // Unified pulse — "No one waited for anyone"
  const unifiedPulse = execLocal >= s(12)
    ? interpolate(execLocal - s(12), [0, s(0.5), s(1.5)], [0, 1, 0.6], {
        extrapolateRight: "clamp",
        easing: dramaticEase,
      })
    : 0;

  // Phase detection
  let phase: "thread" | "investigation" | "collaboration" | "plan_lock" | "delta" | "prs" | "unified" = "thread";
  if (localFrame > s(3)) phase = "investigation";
  if (collabLocal >= 0) phase = "collaboration";
  if (execLocal >= 0) phase = "plan_lock";
  if (execLocal >= s(2)) phase = "delta";
  if (execLocal >= s(5)) phase = "prs";
  if (execLocal >= s(12)) phase = "unified";

  return {
    threadActive,
    investigationProgress,
    tendrilPhase,
    roleHighlights: { pm: pmHighlight, engineer: engHighlight, designer: desHighlight },
    preHighlight,
    planLockProgress,
    planGlow,
    deltaProgress,
    deltaBranches,
    prBadgeOpacities,
    flowBackProgress,
    unifiedPulse,
    phase,
  };
}

// ---- T6: PRs → Ecosystem ----

/**
 * T6: PR structure → ecosystem connections.
 * Organic extension from unified shape outward to tools/integrations.
 * Triggered on the word "connects."
 *
 * Mapped to: sceneTiming.ecosystem (1:32 - 1:50)
 */
export function t6_prsToEcosystem(frame: number): {
  structurePulse: number;
  connectionProgress: number;
  nodeOpacities: Record<string, number>;
  fileTypeFlash: number;
  overallGlow: number;
  phase: "pulse" | "extending" | "connected" | "full";
} {
  const { start, duration } = sceneTiming.ecosystem;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      structurePulse: 0.6,
      connectionProgress: 0,
      nodeOpacities: {},
      fileTypeFlash: 0,
      overallGlow: 0,
      phase: "pulse",
    };
  }

  // Structure pulses once — gorge moment recovery
  const structurePulse = interpolate(localFrame, [0, s(1), s(2)], [0.6, 0.8, 0.7], {
    extrapolateRight: "clamp",
    easing: weightedEase,
  });

  // Connections extend organically — triggered at ~1.5s into scene
  const connectionStart = s(1.5);
  const connectionProgress = localFrame >= connectionStart
    ? spring({
        frame: localFrame - connectionStart,
        fps,
        config: { damping: 18, stiffness: 40, mass: 2 },
      })
    : 0;

  // Individual node opacities with stagger
  const nodeNames = ["JIRA", "Bitbucket", "GitHub", "Figma", "Code", "Docs", "Designs", "Configs"];
  const nodeOpacities: Record<string, number> = {};
  nodeNames.forEach((name, i) => {
    const nodeDelay = connectionStart + s(0.3) * i;
    nodeOpacities[name] = localFrame >= nodeDelay
      ? interpolate(localFrame - nodeDelay, [0, s(1)], [0, 1], {
          extrapolateRight: "clamp",
          easing: gentleFade,
        })
      : 0;
  });

  // "enablePartialPaymentSurchargeDisplay" flash on document icon
  const fileTypeFlash = interpolate(
    localFrame,
    [s(6), s(6.3), s(7.5), s(8)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overall glow as ecosystem completes
  const overallGlow = interpolate(localFrame, [s(8), duration], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  let phase: "pulse" | "extending" | "connected" | "full" = "pulse";
  if (localFrame > connectionStart) phase = "extending";
  if (connectionProgress > 0.8) phase = "connected";
  if (localFrame > s(12)) phase = "full";

  return { structurePulse, connectionProgress, nodeOpacities, fileTypeFlash, overallGlow, phase };
}

// ---- T7: Ecosystem → Typography → Dots → Title → Constellation → Logo ----

/**
 * T7: The closing sequence — multiple stage dissolve/reveal.
 * Metrics typography → particle dots → hard cut title card → constellation → logo.
 * Spans metrics + titleCard + constellation + tagline scenes.
 *
 * Mapped to: sceneTiming.metrics through sceneTiming.tagline (1:50 - 2:40)
 */
export function t7_ecosystemToLogo(frame: number): {
  // Metrics phase
  metric400Opacity: number;
  metric2xOpacity: number;
  metricMinutesOpacity: number;
  // Particle dots phase
  particleDissolve: number;
  dotFillLevels: number[];
  dotPulse: number;
  // Title card
  titleOpacity: number;
  titleScale: number;
  // Constellation
  constellationProgress: number;
  cameraPullBack: number;
  // Logo
  logoMorphProgress: number;
  taglineOpacity: number;
  finalFade: number;
  phase: "metrics" | "dots" | "title" | "constellation" | "logo" | "hold";
} {
  const metricsStart = sceneTiming.metrics.start;
  const titleStart = sceneTiming.titleCard.start;
  const constStart = sceneTiming.constellation.start;
  const tagStart = sceneTiming.tagline.start;
  const tagEnd = tagStart + sceneTiming.tagline.duration;

  const localFrame = frame - metricsStart;

  const defaults = {
    metric400Opacity: 0,
    metric2xOpacity: 0,
    metricMinutesOpacity: 0,
    particleDissolve: 0,
    dotFillLevels: [0, 0, 0, 0, 0],
    dotPulse: 0,
    titleOpacity: 0,
    titleScale: 1,
    constellationProgress: 0,
    cameraPullBack: 1,
    logoMorphProgress: 0,
    taglineOpacity: 0,
    finalFade: 1,
    phase: "metrics" as const,
  };

  if (localFrame < 0) return defaults;

  // --- Metrics: Sequential dissolve/reveal (1:50 - 2:00) ---
  const metric400Opacity = interpolate(
    localFrame,
    [0, s(0.5), s(2.5), s(3)],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", easing: dissolveEase }
  );

  const metric2xOpacity = interpolate(
    localFrame,
    [s(3), s(3.5), s(5.5), s(6)],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", easing: dissolveEase }
  );

  const metricMinutesOpacity = interpolate(
    localFrame,
    [s(6), s(6.5), s(8.5), s(9)],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", easing: dissolveEase }
  );

  // --- Dot formation (1:55 - 2:00) --- "You already know what to build next."
  const dotPhaseStart = s(8); // relative to metricsStart
  const particleDissolve = interpolate(
    localFrame,
    [dotPhaseStart, dotPhaseStart + s(1)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: dissolveEase }
  );

  // 5 dots with different fill levels — representing partially-built ideas
  const dotFillLevels = [0.3, 0.6, 0.45, 0.8, 0.55].map((targetFill, i) => {
    const dotDelay = dotPhaseStart + s(0.2) * i;
    return localFrame >= dotDelay
      ? interpolate(localFrame - dotDelay, [0, s(1)], [0, targetFill], {
          extrapolateRight: "clamp",
          easing: smoothEase,
        })
      : 0;
  });

  const dotPulse = localFrame >= dotPhaseStart
    ? throb(localFrame - dotPhaseStart, s(1.5))
    : 0;

  // --- Title card (2:00 - 2:05) --- "Engineers are builders now." HARD CUT
  const titleLocal = frame - titleStart;
  const titleOpacity = titleLocal >= 0
    ? interpolate(titleLocal, [0, 1, sceneTiming.titleCard.duration - s(0.3), sceneTiming.titleCard.duration], [0, 1, 1, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  // Barely perceptible scale — gives weight without motion
  const titleScale = titleLocal >= 0
    ? interpolate(titleLocal, [0, sceneTiming.titleCard.duration], [1.005, 1], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 1;

  // --- Constellation (2:05 - 2:30) ---
  const constLocal = frame - constStart;
  const constellationProgress = constLocal >= 0
    ? interpolate(constLocal, [0, sceneTiming.constellation.duration], [0, 1], {
        extrapolateRight: "clamp",
        easing: smoothEase,
      })
    : 0;

  // Camera pulls back slowly
  const cameraPullBack = constLocal >= 0
    ? interpolate(constLocal, [0, sceneTiming.constellation.duration], [1, 0.75], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 1;

  // --- Logo resolve (2:30 - 2:40) ---
  const tagLocal = frame - tagStart;
  const logoMorphProgress = tagLocal >= 0
    ? spring({
        frame: tagLocal,
        fps,
        config: { damping: 25, stiffness: 80, mass: 1.2 },
      })
    : 0;

  const taglineOpacity = tagLocal >= s(1.5)
    ? interpolate(tagLocal - s(1.5), [0, s(1.5)], [0, 1], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 0;

  // Final fade to dark navy
  const finalFade = tagLocal >= s(8)
    ? interpolate(tagLocal - s(8), [0, s(2)], [1, 0], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      })
    : 1;

  // Phase detection
  let phase: "metrics" | "dots" | "title" | "constellation" | "logo" | "hold" = "metrics";
  if (localFrame >= dotPhaseStart) phase = "dots";
  if (frame >= titleStart) phase = "title";
  if (frame >= constStart) phase = "constellation";
  if (frame >= tagStart) phase = "logo";
  if (tagLocal >= s(8)) phase = "hold";

  return {
    metric400Opacity,
    metric2xOpacity,
    metricMinutesOpacity,
    particleDissolve,
    dotFillLevels,
    dotPulse,
    titleOpacity,
    titleScale,
    constellationProgress,
    cameraPullBack,
    logoMorphProgress,
    taglineOpacity,
    finalFade,
    phase,
  };
}
