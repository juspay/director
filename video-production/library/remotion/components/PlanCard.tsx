/**
 * @component PlanCard
 * @origin v2 — extracted to library on 2026-03-23
 * @description Animated plan/checklist card with per-item staggered entrance, spring-based
 *   checkbox pop with SVG draw-on checkmark, amber highlight glow on new items, and a
 *   breathing border glow. Richest interaction detail of all versions.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';

interface PlanItem {
  text: string;
  checked: boolean;
  addedAt: number; // frame when this item appears
  checkedAt?: number; // frame when checkmark appears (if checked)
}

interface PlanCardProps {
  title: string;
  items: PlanItem[];
  delay?: number; // overall card delay
}

export const PlanCard: React.FC<PlanCardProps> = ({
  title,
  items,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Iteration 14: Professional snappy spring — controlled overshoot
  const cardEnter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.7 },
  });

  if (frame < delay) return null;

  const cardOpacity = interpolate(cardEnter, [0, 0.2, 1], [0, 1, 1], { extrapolateRight: 'clamp' });
  const cardY = interpolate(cardEnter, [0, 1], [20, 0]); // 20px travel — tighter
  const cardScale = interpolate(cardEnter, [0, 1], [0.95, 1]); // 5% scale range — subtle

  // Breathing glow on card border
  const breatheGlow = interpolate(
    Math.sin((frame - delay) * 0.05),
    [-1, 1],
    [0.15, 0.45]
  );

  return (
    <div
      style={{
        opacity: cardOpacity,
        transform: `translateY(${cardY}px) scale(${cardScale})`,
        backgroundColor: COLORS.bg.secondary,
        borderRadius: 12,
        border: `1px solid ${COLORS.bg.surface}`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.35), 0 0 ${16 * breatheGlow}px rgba(217, 119, 6, ${breatheGlow * 0.4}), inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
        padding: '20px 24px',
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Title */}
      <span
        style={{
          color: COLORS.accent.amber,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: FONT.body,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          opacity: 0.85,
        }}
      >
        {title}
      </span>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: COLORS.bg.surface,
          width: '100%',
        }}
      />

      {/* Items */}
      {items.map((item, i) => {
        if (frame < item.addedAt) return null;

        // Iteration 14: Professional snappy item entrance — controlled
        const itemEnter = spring({
          frame: Math.max(0, frame - item.addedAt),
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.7 },
        });

        const itemOpacity = interpolate(itemEnter, [0, 0.3, 1], [0, 1, 1], { extrapolateRight: 'clamp' });
        const itemX = interpolate(itemEnter, [0, 1], [-20, 0]); // 20px travel — controlled

        const isChecked = item.checked && item.checkedAt != null && frame >= item.checkedAt;
        const checkSpring = isChecked
          ? spring({
              frame: Math.max(0, frame - (item.checkedAt ?? 0)),
              fps,
              config: { damping: 6, stiffness: 140, mass: 0.6 },
            })
          : 0;

        // Scale pop on checkbox when checked: spring overshoots to ~1.15 then settles to 1.0
        const checkboxScale = isChecked
          ? interpolate(checkSpring, [0, 1], [0.5, 1]) // NO clamp — overshoot gives the pop
          : 1;

        // Highlight new items with amber glow briefly
        const isNew = frame - item.addedAt < 30;
        const highlightOpacity = isNew
          ? interpolate(frame, [item.addedAt, item.addedAt + 30], [0.3, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 0;

        return (
          <div
            key={i}
            style={{
              opacity: itemOpacity,
              transform: `translateX(${itemX}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 8px',
              borderRadius: 6,
              backgroundColor: `rgba(217, 119, 6, ${highlightOpacity})`,
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: isChecked
                  ? `2px solid ${COLORS.accent.amber}`
                  : `2px solid ${COLORS.bg.surface}`,
                backgroundColor: isChecked ? COLORS.accent.amber : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${checkboxScale})`,
                flexShrink: 0,
              }}
            >
              {/* Iteration 44: Animated checkmark draw-on — SVG path draws itself over 15 frames */}
              {isChecked && (() => {
                const checkAge = Math.max(0, frame - (item.checkedAt ?? 0));
                const pathLength = 16; // approximate total path length for "M2 6l3 3 5-5"
                const drawProgress = interpolate(checkAge, [0, 15], [0, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                });
                const dashOffset = pathLength * (1 - drawProgress);
                return (
                  <svg width="10" height="10" viewBox="0 0 12 12">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#ffffff"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={pathLength}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                );
              })()}
            </div>

            {/* Text */}
            <span
              style={{
                color: isChecked ? COLORS.text.secondary : COLORS.text.primary,
                fontSize: 14,
                fontFamily: FONT.body,
                textDecoration: isChecked ? 'line-through' : 'none',
              }}
            >
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};
