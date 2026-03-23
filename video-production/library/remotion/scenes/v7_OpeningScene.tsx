/**
 * @reference-scene OpeningScene
 * @origin v7 — extracted to library 2026-03-23
 * @demonstrates 12 browser tabs + amber burial narrative opening
 * @dependencies colors, fonts from styles/theme; AmberShape, GrayLayer from components; s from utils/timing; smoothEase, gentleFade from utils/easing
 */
import React from "react";
import {
  useCurrentFrame,
  interpolate,
  AbsoluteFill,
  useVideoConfig,
  Sequence,
  spring,
} from "remotion";
import { colors, fonts } from "../styles/theme";
import { AmberShape } from "../components/AmberShape";
import { GrayLayer } from "../components/GrayLayer";
import { s } from "../utils/timing";
import { smoothEase, gentleFade } from "../utils/easing";

/**
 * S1: Opening — frames 0-240 (0:00-0:08)
 *
 * "Twelve tabs open. A review untouched since Tuesday.
 *  And somewhere underneath all of it — an idea that was clear this morning."
 *
 * Visual: Dark navy canvas. Warm amber shape (architecture sketch) at center.
 * Gray rectangles drift over it with 0.4s stagger. Amber shape dims progressively.
 * At frame 180 ("this morning"): amber flare 0.3s (9 frames).
 */
const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Amber shape at center ---
  // Gray layers configuration — accumulation, not chaos
  const layers = [
    { x: 860, y: 420, w: 280, h: 52, rot: -2 },
    { x: 820, y: 448, w: 320, h: 48, rot: 1.5 },
    { x: 880, y: 472, w: 260, h: 56, rot: -1 },
    { x: 840, y: 496, w: 300, h: 50, rot: 0.5 },
    { x: 800, y: 518, w: 340, h: 44, rot: -1.5 },
    { x: 870, y: 540, w: 270, h: 54, rot: 2 },
  ];

  const staggerFrames = 12; // 0.4s at 30fps

  // "this morning" flare at frame 180 (6.0s in)
  const flareFrame = 180;

  // Amber idea dims progressively as layers stack
  const layersVisible = Math.min(
    layers.length,
    Math.max(0, Math.floor((frame - 20) / staggerFrames))
  );

  const amberDimming = interpolate(
    layersVisible,
    [0, 2, 4, 6],
    [1, 0.55, 0.25, 0.12],
    { extrapolateRight: "clamp" }
  );

  // Ambient canvas glow tracks amber brightness
  const ambientGlow = interpolate(frame, [0, 30], [0, 0.3], {
    extrapolateRight: "clamp",
  });

  // After flare, dim further for scene exit
  const postFlareDim = interpolate(frame, [189, 240], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      {/* Ambient subtle radial gradient — atmosphere */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse 60% 50% at 50% 48%, ${colors.amberSoft} 0%, transparent 70%)`,
          opacity: ambientGlow * amberDimming * postFlareDim,
        }}
      />

      {/* The amber idea — architecture sketch / decision — center of frame */}
      <AmberShape
        x={960}
        y={490}
        size={100}
        opacity={amberDimming * postFlareDim}
        shape="diamond"
        pulseEnabled={false}
        glowRadius={80}
        flareAtFrame={flareFrame}
      />

      {/* Gray layers — accumulation over the amber idea */}
      {layers.map((layer, i) => (
        <GrayLayer
          key={i}
          index={i}
          x={layer.x}
          y={layer.y}
          width={layer.w}
          height={layer.h}
          delay={staggerFrames * (i + 1) + 20}
          rotation={layer.rot}
        />
      ))}

      {/* Subtle browser tab indicators at top — twelve tabs open */}
      {Array.from({ length: 12 }).map((_, i) => {
        const tabDelay = 10 + i * 4;
        const tabOpacity = interpolate(frame - tabDelay, [0, 15], [0, 0.15], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={`tab-${i}`}
            style={{
              position: "absolute",
              top: 40,
              left: 200 + i * 130,
              width: 110,
              height: 28,
              borderRadius: "6px 6px 0 0",
              backgroundColor: colors.gray,
              opacity: tabOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default OpeningScene;
