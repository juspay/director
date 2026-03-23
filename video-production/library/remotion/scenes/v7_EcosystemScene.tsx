/**
 * @reference-scene EcosystemScene
 * @origin v7 — extracted to library 2026-03-23
 * @demonstrates Seeded deterministic organic root-path growth
 * @dependencies colors, fonts from styles/theme; organicEase, smoothEase, pulse from utils/easing; s from utils/timing
 */
import React, { useMemo } from "react";
import {
  useCurrentFrame,
  interpolate,
  AbsoluteFill,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles/theme";
import { organicEase, smoothEase, pulse } from "../utils/easing";
import { s } from "../utils/timing";

/**
 * S16: Ecosystem — frames 2850-3210 (95s-107s), 12s duration
 *
 * "Tara reads whatever your team works with — code, documents, designs, configs.
 *  She connects to everything you already use. Everything through Slack."
 *
 * Visual: Ecosystem connections extend organically from unified structure,
 * triggered on "connects." Icons: JIRA, Bitbucket, GitHub, Figma, file types.
 * ON-SCREEN: "enablePartialPaymentSurchargeDisplay" flashes on document icon.
 * Organic growth animation — connections spreading like roots.
 *
 * Music: Full arrangement rebuilds. 84 BPM.
 */

// Deterministic seeded random for stable renders
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface EcosystemNode {
  label: string;
  icon: string; // Emoji or symbol shorthand
  x: number;
  y: number;
  color: string;
  delay: number; // frame offset for staggered organic entry
}

// Hub at center, ecosystem nodes radiate outward
const HUB_X = 960;
const HUB_Y = 540;

const ECOSYSTEM_NODES: EcosystemNode[] = [
  // Dev tools — upper arc
  { label: "JIRA", icon: "J", x: 560, y: 280, color: "#2684FF", delay: 0 },
  { label: "Bitbucket", icon: "B", x: 760, y: 200, color: "#2684FF", delay: 8 },
  { label: "GitHub", icon: "G", x: 1160, y: 200, color: colors.white, delay: 16 },
  { label: "Figma", icon: "F", x: 1360, y: 280, color: "#A259FF", delay: 24 },

  // File types — lower arc
  { label: ".ts", icon: "TS", x: 480, y: 600, color: "#3178C6", delay: 32 },
  { label: ".pdf", icon: "P", x: 640, y: 720, color: "#FF4444", delay: 40 },
  { label: ".yaml", icon: "Y", x: 840, y: 780, color: colors.amber, delay: 48 },
  { label: ".xlsx", icon: "X", x: 1080, y: 780, color: "#217346", delay: 56 },
  { label: ".docx", icon: "D", x: 1280, y: 720, color: "#2B579A", delay: 64 },
  { label: ".svg", icon: "S", x: 1440, y: 600, color: "#FFB13B", delay: 72 },

  // Slack — right side, prominent
  { label: "Slack", icon: "S", x: 1500, y: 440, color: "#E01E5A", delay: 12 },
];

// Organic root-like path segments from hub to each node
function generateRootPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  seed: number
): string {
  const rng = seededRandom(seed);
  const midX = (fromX + toX) / 2 + (rng() - 0.5) * 120;
  const midY = (fromY + toY) / 2 + (rng() - 0.5) * 80;
  const cp1x = fromX + (midX - fromX) * 0.5 + (rng() - 0.5) * 60;
  const cp1y = fromY + (midY - fromY) * 0.3 + (rng() - 0.5) * 40;
  const cp2x = midX + (toX - midX) * 0.5 + (rng() - 0.5) * 60;
  const cp2y = midY + (toY - midY) * 0.7 + (rng() - 0.5) * 40;

  return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${midX} ${midY}, ${midX} ${midY} C ${midX} ${midY}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
}

const EcosystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "connects" trigger — approximately 4s into the scene (frame 120 local)
  const connectsTrigger = s(4);

  // Hub entry — unified structure from previous scene
  const hubEntry = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Hub pulse
  const hubPulse = pulse(frame, 50, 0);
  const hubScale = 1 + hubPulse * 0.03;

  // Generate paths deterministically
  const rootPaths = useMemo(
    () =>
      ECOSYSTEM_NODES.map((node, i) =>
        generateRootPath(HUB_X, HUB_Y, node.x, node.y, 100 + i * 37)
      ),
    []
  );

  // "enablePartialPaymentSurchargeDisplay" flash on document icon
  // Appears on the .docx node area at ~6s, flashes for 1.5s
  const configFlashStart = s(6);
  const configFlashOpacity = interpolate(
    frame,
    [configFlashStart, configFlashStart + 10, configFlashStart + 35, configFlashStart + 45],
    [0, 0.85, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scene exit fade
  const exitFade = interpolate(frame, [s(10.5), s(12)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      {/* Hub — central unified structure */}
      <div
        style={{
          position: "absolute",
          left: HUB_X - 50,
          top: HUB_Y - 50,
          width: 100,
          height: 100,
          opacity: hubEntry * exitFade,
          transform: `scale(${hubScale})`,
        }}
      >
        {/* Hub glow */}
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            left: -50,
            top: -50,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.amberGlow} 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />
        {/* Hub core — amber star */}
        <svg width={100} height={100} viewBox="0 0 100 100">
          <polygon
            points="50,10 61,38 92,38 67,56 76,85 50,68 24,85 33,56 8,38 39,38"
            fill={colors.amber}
            opacity={0.9}
          />
        </svg>
      </div>

      {/* Root connections — organic growth paths */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          opacity: exitFade,
        }}
      >
        <defs>
          {ECOSYSTEM_NODES.map((node, i) => {
            const pathId = `rootPath-${i}`;
            return (
              <path key={`def-${i}`} id={pathId} d={rootPaths[i]} fill="none" />
            );
          })}
        </defs>

        {ECOSYSTEM_NODES.map((node, i) => {
          const growStart = connectsTrigger + node.delay;
          const growDuration = 30; // ~1s organic growth

          const pathProgress = interpolate(
            frame - growStart,
            [0, growDuration],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: organicEase }
          );

          if (pathProgress <= 0) return null;

          // Approximate path length for dashoffset animation
          const approxLen = Math.sqrt(
            Math.pow(node.x - HUB_X, 2) + Math.pow(node.y - HUB_Y, 2)
          ) * 1.4;
          const dashOffset = approxLen * (1 - pathProgress);

          return (
            <path
              key={`root-${i}`}
              d={rootPaths[i]}
              fill="none"
              stroke={colors.amber}
              strokeWidth={1.5}
              opacity={0.4 * hubEntry}
              strokeDasharray={approxLen}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>

      {/* Ecosystem nodes */}
      {ECOSYSTEM_NODES.map((node, i) => {
        const nodeAppearStart = connectsTrigger + node.delay + 20;
        const nodeOpacity = interpolate(frame - nodeAppearStart, [0, 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: smoothEase,
        });
        const nodeScale = interpolate(frame - nodeAppearStart, [0, 20], [0.6, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: organicEase,
        });

        // Gentle floating
        const floatY = Math.sin(frame * 0.03 + i * 1.2) * 4;
        const nodePulse = pulse(frame, 70, i * 10);

        if (nodeOpacity <= 0) return null;

        return (
          <div
            key={`node-${i}`}
            style={{
              position: "absolute",
              left: node.x - 30,
              top: node.y - 30 + floatY,
              width: 60,
              height: 60,
              opacity: nodeOpacity * exitFade,
              transform: `scale(${nodeScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Node glow */}
            <div
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                left: -10,
                top: -10,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${node.color}40 0%, transparent 70%)`,
                opacity: 0.4 + nodePulse * 0.2,
              }}
            />

            {/* Icon circle */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: `1.5px solid ${node.color}80`,
                backgroundColor: `${node.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.code,
                fontSize: 16,
                fontWeight: 700,
                color: node.color,
              }}
            >
              {node.icon}
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.whiteSubtle,
                marginTop: 6,
                letterSpacing: 0.5,
              }}
            >
              {node.label}
            </span>
          </div>
        );
      })}

      {/* ON-SCREEN: enablePartialPaymentSurchargeDisplay flashing on document icon */}
      {configFlashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: 1120,
            top: 680,
            opacity: configFlashOpacity * exitFade,
            transform: `scale(${interpolate(
              configFlashOpacity,
              [0, 0.85],
              [0.95, 1],
              { extrapolateRight: "clamp" }
            )})`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.code,
              fontSize: 11,
              color: colors.amber,
              backgroundColor: `${colors.amber}15`,
              border: `1px solid ${colors.amber}30`,
              borderRadius: 4,
              padding: "4px 8px",
              whiteSpace: "nowrap",
            }}
          >
            enablePartialPaymentSurchargeDisplay
          </div>
        </div>
      )}

      {/* "Everything through Slack" — ambient Slack glow at end */}
      {frame > s(9) && (
        <div
          style={{
            position: "absolute",
            left: 1440,
            top: 380,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(224, 30, 90, 0.15) 0%, transparent 70%)`,
            opacity: interpolate(frame, [s(9), s(10.5)], [0, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * exitFade,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export default EcosystemScene;
