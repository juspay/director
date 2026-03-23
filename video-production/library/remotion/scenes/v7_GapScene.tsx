/**
 * @reference-scene GapScene
 * @origin v7 — extracted to library 2026-03-23
 * @demonstrates Decision/Done points with gossamer gap line
 * @dependencies React, remotion (useCurrentFrame, interpolate, AbsoluteFill, useVideoConfig, Sequence, spring), ../styles/theme (colors, fonts), ../utils/easing (smoothEase, gentleFade), ../utils/timing (s)
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
import { smoothEase, gentleFade } from "../utils/easing";
import { s } from "../utils/timing";

/**
 * S2: Gap — frames 240-450 (0:08-0:15), local frames 0-210
 *
 * "Half of them still open from yesterday. Context scattered across five tools.
 *  Nothing connected."
 *
 * Visual: Gray layers settle. Amber glow faint.
 * Two points of light fade in with 1.5s (45 frame) opacity ramp:
 *   Left: warm amber labeled "Decision"
 *   Right: cool blue labeled "Done"
 * Wide dark space between them. Text labels fade in after points.
 */
const GapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Residual gray clutter from opening, settling downward and fading ---
  const grayResidual = interpolate(frame, [0, 60], [0.3, 0.04], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });
  const grayDrift = interpolate(frame, [0, 60], [0, 35], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // --- Faint amber center glow — the buried idea barely visible ---
  const amberFaint = interpolate(frame, [0, 40], [0.15, 0.06], {
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  // --- Two points of light: 1.5s (45 frame) opacity ramp ---
  // Left point (Decision) starts slightly before right
  const leftPointDelay = 30;
  const rightPointDelay = 45;

  const leftPointOpacity = interpolate(
    frame - leftPointDelay,
    [0, 45],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: gentleFade,
    }
  );

  const rightPointOpacity = interpolate(
    frame - rightPointDelay,
    [0, 45],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: gentleFade,
    }
  );

  // Labels fade in after points are established
  const labelDelay = 20; // frames after point starts
  const leftLabelOpacity = interpolate(
    frame - leftPointDelay - labelDelay,
    [0, 25],
    [0, 0.7],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: gentleFade,
    }
  );
  const rightLabelOpacity = interpolate(
    frame - rightPointDelay - labelDelay,
    [0, 25],
    [0, 0.7],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: gentleFade,
    }
  );

  // Subtle breathing on established points
  const breathe = Math.sin(frame * 0.04) * 0.08;

  // The faint hint of connection — a gossamer line in the gap
  const gapLineOpacity = interpolate(frame, [120, 180], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      {/* Residual gray clutter settling and fading */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 780 + i * 100,
            top: 490 + i * 15 + grayDrift,
            width: 250 - i * 30,
            height: 40,
            backgroundColor: colors.gray,
            opacity: grayResidual * (1 - i * 0.2),
            borderRadius: 4,
          }}
        />
      ))}

      {/* Faint amber center — buried idea ghost */}
      <div
        style={{
          position: "absolute",
          left: 910,
          top: 490,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.amber} 0%, transparent 70%)`,
          opacity: amberFaint,
        }}
      />

      {/* LEFT POINT: Decision (warm amber) */}
      <div
        style={{
          position: "absolute",
          left: 280,
          top: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: leftPointOpacity,
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.amberGlow} 0%, transparent 70%)`,
            opacity: 0.5 + breathe,
            position: "absolute",
            top: -40,
            left: -40,
          }}
        />
        {/* Core point */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: colors.amber,
            opacity: 0.9 + breathe,
            boxShadow: `0 0 20px ${colors.amber}, 0 0 60px ${colors.amberGlow}`,
          }}
        />
        {/* Label — fades in after point */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.amber,
            opacity: leftLabelOpacity,
            marginTop: 16,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Decision
        </span>
      </div>

      {/* RIGHT POINT: Done (cool blue) */}
      <div
        style={{
          position: "absolute",
          left: 1600,
          top: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: rightPointOpacity,
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)`,
            opacity: 0.5 - breathe,
            position: "absolute",
            top: -40,
            left: -40,
          }}
        />
        {/* Core point */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: colors.engineer,
            opacity: 0.9 - breathe,
            boxShadow: `0 0 20px ${colors.engineer}, 0 0 60px rgba(59, 130, 246, 0.4)`,
          }}
        />
        {/* Label — fades in after point */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.engineer,
            opacity: rightLabelOpacity,
            marginTop: 16,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Done
        </span>
      </div>

      {/* The gap — gossamer gradient line hinting at the void between */}
      <div
        style={{
          position: "absolute",
          left: 380,
          top: 518,
          width: 1160,
          height: 2,
          background: `linear-gradient(90deg, ${colors.amber}30 0%, transparent 15%, transparent 85%, ${colors.engineer}30 100%)`,
          opacity: gapLineOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export default GapScene;
