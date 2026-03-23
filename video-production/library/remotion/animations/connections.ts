// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring, Easing } from "remotion";
import { videoConfig, colors } from "../styles/theme";
import {
  smoothEase,
  gentleFade,
  organicEase,
  snapEase,
  staggerDelay,
} from "../utils/easing";
import { s } from "../utils/timing";

const { fps } = videoConfig;

// ---- Types ----

export interface Point2D {
  x: number;
  y: number;
}

export interface LineState {
  /** SVG path data string for the connection */
  pathData: string;
  /** How far along the path to draw (0 = hidden, 1 = fully drawn) */
  progress: number;
  /** Line opacity */
  opacity: number;
  /** Stroke width */
  strokeWidth: number;
  /** Glow radius for filter */
  glowRadius: number;
}

export interface TendrilState {
  pathData: string;
  progress: number;
  opacity: number;
  strokeWidth: number;
  /** The node this tendril reaches toward */
  targetLabel: string;
  /** Whether this tendril is in retract phase */
  retracting: boolean;
}

export interface ConstellationPoint {
  x: number;
  y: number;
  opacity: number;
  radius: number;
}

export interface ConstellationEdge {
  from: number;
  to: number;
  opacity: number;
  progress: number;
}

export interface ConstellationState {
  points: ConstellationPoint[];
  edges: ConstellationEdge[];
}

// ---- Helpers ----

/** Generate a smooth cubic Bezier path between two points with curvature */
function cubicBezierPath(
  from: Point2D,
  to: Point2D,
  curvature: number = 0.3,
  direction: "horizontal" | "vertical" = "horizontal"
): string {
  if (direction === "horizontal") {
    const dx = (to.x - from.x) * curvature;
    return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
  }
  const dy = (to.y - from.y) * curvature;
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`;
}

/** Generate an organic curved path with slight waviness for tendril effect */
function organicPath(from: Point2D, to: Point2D, seed: number = 0): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  // Add organic wobble based on seed
  const wobbleX = Math.sin(seed * 2.7) * 40;
  const wobbleY = Math.cos(seed * 3.1) * 30;
  const cp1x = from.x + (midX - from.x) * 0.5 + wobbleX * 0.7;
  const cp1y = from.y + (midY - from.y) * 0.3 + wobbleY;
  const cp2x = midX + (to.x - midX) * 0.5 - wobbleX * 0.5;
  const cp2y = midY + (to.y - midY) * 0.7 - wobbleY * 0.6;
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

// ---- Animation Functions ----

/**
 * Clean left-to-right amber connection line.
 * Used in T4: "Tara closes that gap" — the thesis moment.
 * The line draws from the Decision point (left) to the Done point (right).
 */
export function amberLine(
  frame: number,
  config: {
    from?: Point2D;
    to?: Point2D;
    drawDuration?: number;
    delay?: number;
  } = {}
): LineState {
  const from = config.from ?? { x: 350, y: 540 };
  const to = config.to ?? { x: 1570, y: 540 };
  const duration = config.drawDuration ?? s(1.2);
  const delay = config.delay ?? 0;
  const localFrame = frame - delay;

  if (localFrame < 0) {
    return {
      pathData: cubicBezierPath(from, to, 0.15),
      progress: 0,
      opacity: 0,
      strokeWidth: 3,
      glowRadius: 0,
    };
  }

  // Spring-based draw for satisfying snap at completion
  const springProgress = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 28,
      stiffness: 120,
      mass: 0.8,
    },
  });

  // Opacity ramps quickly then holds
  const opacity = interpolate(localFrame, [0, s(0.2)], [0, 1], {
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  // Glow flares at completion then settles
  const glowRadius = interpolate(
    localFrame,
    [duration * 0.8, duration, duration + s(0.5)],
    [4, 20, 8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smoothEase }
  );

  // Stroke thickens slightly at completion
  const strokeWidth = interpolate(
    localFrame,
    [0, duration * 0.9, duration],
    [2, 2.5, 3],
    { extrapolateRight: "clamp" }
  );

  return {
    pathData: cubicBezierPath(from, to, 0.15),
    progress: springProgress,
    opacity,
    strokeWidth,
    glowRadius,
  };
}

/**
 * Tendrils extending from the Slack thread to repository nodes.
 * Staggered 0.3s apart, each reaching toward a named repo.
 * Used during the investigation sequence.
 */
export function tendrilExtend(
  frame: number,
  config: {
    origin?: Point2D;
    targets?: Array<{ point: Point2D; label: string }>;
    staggerFrames?: number;
    extendDuration?: number;
    delay?: number;
  } = {}
): TendrilState[] {
  const origin = config.origin ?? { x: 500, y: 540 };
  const targets = config.targets ?? [
    { point: { x: 1200, y: 280 }, label: "Nimble" },
    { point: { x: 1400, y: 540 }, label: "Vayu" },
    { point: { x: 1200, y: 800 }, label: "juspay-portal" },
  ];
  const stagger = config.staggerFrames ?? s(0.3);
  const extendDur = config.extendDuration ?? s(0.8);
  const delay = config.delay ?? 0;

  return targets.map((target, i) => {
    const localFrame = frame - delay - staggerDelay(i, stagger);
    const path = organicPath(origin, target.point, i);

    if (localFrame < 0) {
      return {
        pathData: path,
        progress: 0,
        opacity: 0,
        strokeWidth: 2,
        targetLabel: target.label,
        retracting: false,
      };
    }

    // Organic spring — slightly different per tendril for natural feel
    const progress = spring({
      frame: localFrame,
      fps,
      config: {
        damping: 18 + i * 2,
        stiffness: 90 + i * 10,
        mass: 1.0,
      },
    });

    const opacity = interpolate(localFrame, [0, s(0.15)], [0, 0.85], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    const strokeWidth = interpolate(localFrame, [0, extendDur], [1.5, 2.5], {
      extrapolateRight: "clamp",
    });

    return {
      pathData: path,
      progress,
      opacity,
      strokeWidth,
      targetLabel: target.label,
      retracting: false,
    };
  });
}

/**
 * Tendrils retracting — pulling data back to origin.
 * Clean simultaneous retraction with slight organic lag.
 */
export function tendrilRetract(
  frame: number,
  config: {
    origin?: Point2D;
    targets?: Array<{ point: Point2D; label: string }>;
    retractDuration?: number;
    delay?: number;
  } = {}
): TendrilState[] {
  const origin = config.origin ?? { x: 500, y: 540 };
  const targets = config.targets ?? [
    { point: { x: 1200, y: 280 }, label: "Nimble" },
    { point: { x: 1400, y: 540 }, label: "Vayu" },
    { point: { x: 1200, y: 800 }, label: "juspay-portal" },
  ];
  const retractDur = config.retractDuration ?? s(0.6);
  const delay = config.delay ?? 0;

  return targets.map((target, i) => {
    const localFrame = frame - delay;
    const path = organicPath(origin, target.point, i);

    if (localFrame < 0) {
      return {
        pathData: path,
        progress: 1,
        opacity: 0.85,
        strokeWidth: 2.5,
        targetLabel: target.label,
        retracting: true,
      };
    }

    // Retraction is faster than extension — snap back
    // Slight per-tendril delay for organic feel (not mechanical)
    const microDelay = i * 2; // 2 frames between each
    const adjustedFrame = Math.max(0, localFrame - microDelay);

    const progress = interpolate(adjustedFrame, [0, retractDur], [1, 0], {
      extrapolateRight: "clamp",
      easing: snapEase,
    });

    const opacity = interpolate(adjustedFrame, [retractDur * 0.6, retractDur], [0.85, 0], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    return {
      pathData: path,
      progress: Math.max(0, progress),
      opacity: Math.max(0, opacity),
      strokeWidth: 2.5 * progress,
      targetLabel: target.label,
      retracting: true,
    };
  });
}

/**
 * Organic ecosystem connections extending from a central structure.
 * Used in T6: PRs → ecosystem. Lines grow outward naturally,
 * triggered on the word "connects."
 */
export function organicGrow(
  frame: number,
  config: {
    center?: Point2D;
    nodes?: Array<{ point: Point2D; label: string }>;
    growDuration?: number;
    delay?: number;
  } = {}
): Array<{
  pathData: string;
  progress: number;
  opacity: number;
  nodeOpacity: number;
  label: string;
}> {
  const center = config.center ?? { x: 960, y: 540 };
  const nodes = config.nodes ?? [
    { point: { x: 400, y: 300 }, label: "JIRA" },
    { point: { x: 1520, y: 300 }, label: "Bitbucket" },
    { point: { x: 400, y: 780 }, label: "GitHub" },
    { point: { x: 1520, y: 780 }, label: "Figma" },
    { point: { x: 200, y: 540 }, label: "Code" },
    { point: { x: 1720, y: 540 }, label: "Docs" },
  ];
  const growDur = config.growDuration ?? s(2.0);
  const delay = config.delay ?? 0;

  return nodes.map((node, i) => {
    // Each node grows with a natural stagger based on distance from center
    const dx = node.point.x - center.x;
    const dy = node.point.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const distanceDelay = (distance / 800) * s(0.5); // farther = later

    const localFrame = frame - delay - distanceDelay;
    const path = organicPath(center, node.point, i * 1.7);

    if (localFrame < 0) {
      return { pathData: path, progress: 0, opacity: 0, nodeOpacity: 0, label: node.label };
    }

    const progress = spring({
      frame: localFrame,
      fps,
      config: {
        damping: 22,
        stiffness: 60,
        mass: 1.5,
      },
    });

    const opacity = interpolate(localFrame, [0, s(0.3)], [0, 0.7], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    // Node fades in after line arrives
    const nodeOpacity = interpolate(
      localFrame,
      [growDur * 0.6, growDur * 0.9],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: gentleFade }
    );

    return { pathData: path, progress, opacity, nodeOpacity, label: node.label };
  });
}

/**
 * Points connecting into a constellation pattern.
 * Used in the final sequence: amber dots link into a geometric pattern
 * that will eventually morph into the TARA logo.
 */
export function constellationForm(
  frame: number,
  config: {
    points?: Point2D[];
    edges?: Array<[number, number]>;
    formDuration?: number;
    delay?: number;
  } = {}
): ConstellationState {
  // Default constellation: abstract star-like pattern
  const points = config.points ?? [
    { x: 960, y: 350 },   // top center
    { x: 760, y: 480 },   // upper left
    { x: 1160, y: 480 },  // upper right
    { x: 680, y: 640 },   // mid left
    { x: 1240, y: 640 },  // mid right
    { x: 820, y: 760 },   // lower left
    { x: 1100, y: 760 },  // lower right
    { x: 960, y: 540 },   // center
  ];

  const edges = config.edges ?? [
    [0, 1], [0, 2], [1, 3], [2, 4],
    [3, 5], [4, 6], [5, 6], [7, 0],
    [7, 1], [7, 2], [7, 5], [7, 6],
  ];

  const formDur = config.formDuration ?? s(4);
  const delay = config.delay ?? 0;
  const localFrame = frame - delay;

  // Points appear first with stagger
  const constellationPoints: ConstellationPoint[] = points.map((p, i) => {
    const pointDelay = (i / points.length) * s(1.5);
    const pointFrame = localFrame - pointDelay;

    if (pointFrame < 0) {
      return { x: p.x, y: p.y, opacity: 0, radius: 0 };
    }

    const opacity = interpolate(pointFrame, [0, s(0.5)], [0, 1], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    const radius = spring({
      frame: pointFrame,
      fps,
      config: { damping: 15, stiffness: 150, mass: 0.5 },
    }) * 5;

    return { x: p.x, y: p.y, opacity, radius };
  });

  // Edges draw after points are visible
  const constellationEdges: ConstellationEdge[] = edges.map(([from, to], i) => {
    const edgeDelay = s(1.5) + (i / edges.length) * s(2);
    const edgeFrame = localFrame - edgeDelay;

    if (edgeFrame < 0) {
      return { from, to, opacity: 0, progress: 0 };
    }

    const progress = interpolate(edgeFrame, [0, s(0.6)], [0, 1], {
      extrapolateRight: "clamp",
      easing: smoothEase,
    });

    const opacity = interpolate(edgeFrame, [0, s(0.3)], [0, 0.6], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    return { from, to, opacity, progress };
  });

  return { points: constellationPoints, edges: constellationEdges };
}
