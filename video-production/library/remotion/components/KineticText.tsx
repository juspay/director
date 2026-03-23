/** @component KineticText @origin v7 — extracted to library 2026-03-23 @description Kinetic text with dissolve-in/out transitions, spring scale, and character-by-character reveal variant (CharReveal) */
import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles/theme";
import { dissolveEase, dramaticEase } from "../utils/easing";

interface KineticTextProps {
  text: string;
  delay: number;
  holdDuration?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  y?: number;
  dissolveOut?: boolean;
  dissolveInDuration?: number;
  dissolveOutDuration?: number;
  letterSpacing?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  delay,
  holdDuration = 60,
  fontSize = 72,
  fontFamily = fonts.body,
  fontWeight = 700,
  color = colors.white,
  y = 0,
  dissolveOut = true,
  dissolveInDuration = 20,
  dissolveOutDuration = 15,
  letterSpacing = -1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  if (localFrame < 0) return null;

  // Dissolve in
  const inProgress = interpolate(localFrame, [0, dissolveInDuration], [0, 1], {
    extrapolateRight: "clamp",
    easing: dramaticEase,
  });

  // Hold
  const totalBeforeOut = dissolveInDuration + holdDuration;

  // Dissolve out
  let outProgress = 0;
  if (dissolveOut && localFrame > totalBeforeOut) {
    outProgress = interpolate(
      localFrame - totalBeforeOut,
      [0, dissolveOutDuration],
      [0, 1],
      { extrapolateRight: "clamp", easing: dissolveEase }
    );
  }

  const opacity = inProgress * (1 - outProgress);
  const scale = interpolate(inProgress, [0, 1], [0.92, 1]);
  const yOffset = interpolate(inProgress, [0, 1], [15, 0]);

  if (opacity <= 0.01) return null;

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        top: `calc(50% + ${y}px)`,
        transform: `translateY(-50%) translateY(${yOffset}px) scale(${scale})`,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          color,
          letterSpacing,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Character-by-character reveal variant
interface CharRevealProps {
  text: string;
  delay: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  staggerFrames?: number;
  y?: number;
}

export const CharReveal: React.FC<CharRevealProps> = ({
  text,
  delay,
  fontSize = 48,
  fontFamily = fonts.body,
  color = colors.white,
  staggerFrames = 2,
  y = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        top: `calc(50% + ${y}px)`,
        transform: "translateY(-50%)",
      }}
    >
      {text.split("").map((char, i) => {
        const charFrame = localFrame - i * staggerFrames;
        const charOpacity = interpolate(charFrame, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const charY = interpolate(charFrame, [0, 8], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontSize,
              fontWeight: 700,
              color,
              opacity: charOpacity,
              transform: `translateY(${charY}px)`,
              display: "inline-block",
              minWidth: char === " " ? "0.3em" : undefined,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};
