/**
 * @reference-scene BuildScene
 * @origin v2 — extracted to library 2026-03-23
 * @demonstrates Camera chapter system (spring-driven focus panning between tracks)
 * @dependencies COLORS, FONT, SPRING_CONFIG from theme; ProgressTrack, ConnectionLine from components
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';
import { ProgressTrack } from '../components/ProgressTrack';
import { ConnectionLine } from '../components/ConnectionLine';

// ---------------------------------------------------------------------------
// Track configuration
// ---------------------------------------------------------------------------

const STEPS = ['Context', 'Clone', 'Branch', 'Analyze', 'Implement', 'Test', 'Commit', 'PR'];

interface TrackConfig {
  branchName: string;
  color: string;
  delay: number;
  completionFrame: number;
  prNumber: number;
}

// Iteration 52: Rescaled for shorter VO (14.08s → ~437 frames). Tighter, punchier.
// Old: 200/270/350 in 685-frame scene. New: 130/180/230 in 437-frame scene.
const TRACKS: TrackConfig[] = [
  {
    branchName: 'feature/auth-flow',
    color: '#3b82f6',
    delay: 0,
    completionFrame: 130,    // finishes first — fastest track
    prNumber: 142,
  },
  {
    branchName: 'feature/mobile-viewport',
    color: '#22c55e',
    delay: 20,
    completionFrame: 180,    // finishes second
    prNumber: 144,
  },
  {
    branchName: 'feature/rate-limiting',
    color: '#a855f7',
    delay: 40,
    completionFrame: 230,    // finishes last
    prNumber: 143,
  },
];

// Thread icon position (connection target)
const THREAD_ICON = { x: 100, y: 80 };

// Vertical layout helpers — Iteration 27: Increased spacing by 30% for breathing room
const TRACK_TOP_START = 140;
const TRACK_SPACING = 170;
const TRACK_LEFT = 140;
const TRACK_WIDTH = 900;

// ---------------------------------------------------------------------------
// Inline PR Badge component
// ---------------------------------------------------------------------------

interface PRBadgeProps {
  number: number;
  color: string;
  delay: number;
  x: number;
  y: number;
}

const PRBadge: React.FC<PRBadgeProps> = ({ number, color, delay, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < delay) return null;

  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 5, stiffness: 100, mass: 1.3 },
  });

  const scale = interpolate(pop, [0, 1], [0, 1.15], { extrapolateRight: 'clamp' });
  const settleScale = interpolate(pop, [0.85, 1], [1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const finalScale = pop < 0.85 ? scale : settleScale;
  const opacity = interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Iteration 41: Slower breathing pulse — 30% slower frequency for calm, confident feel
  const settled = pop >= 1;
  const age = Math.max(0, frame - delay);
  const breathe = settled ? 1 + Math.sin(age * 0.042) * 0.03 : 1;
  const glowBreath = settled ? 0.6 + Math.sin(age * 0.056) * 0.3 : 0.6;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${finalScale * breathe})`,
        opacity,
        transformOrigin: 'left center',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          backgroundColor: color,
          color: '#fff',
          fontFamily: FONT.mono,
          fontSize: 14,
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: 20,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 ${16 + (settled ? Math.sin(age * 0.08) * 8 : 0)}px ${color}${settled ? Math.round(60 + glowBreath * 40).toString(16) : '60'}, 0 4px 12px rgba(0, 0, 0, 0.4)`,
        }}
      >
        PR #{number}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BuildScene
// ---------------------------------------------------------------------------

export const BuildScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene exit — 45 frames (iter 39: tightened from 55 per Gemini feedback)
  const EXIT_FRAMES = 45;
  const exitStart = durationInFrames - EXIT_FRAMES;
  const sceneFadeOut = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const exitScale = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0.7],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  // Iteration 30: Reduced from -60 to -30 for graceful recede
  const exitDriftY = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, -30],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const exitBlur = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Iteration 52: Closing text at 260 (scaled for shorter 437-frame scene, was 380 in 685-frame scene)
  const closingOpacity = interpolate(frame, [260, 290], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const closingTranslateY = interpolate(frame, [260, 290], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Closing text scale entrance with spring overshoot
  const closingScaleSpring = spring({
    frame: Math.max(0, frame - 260),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.7 },
  });
  const closingScale = interpolate(closingScaleSpring, [0, 1], [0.7, 1]);

  // Ambient glow behind closing text — gentle pulse
  const closingGlowPulse = interpolate(
    Math.sin(frame * 0.06),
    [-1, 1],
    [0.25, 0.55]
  );

  // Progress tick flash helpers — track which step each track is at
  const getStepFlash = (trackDelay: number, completionFrame: number, stepIndex: number, totalSteps: number) => {
    const progressDuration = completionFrame - trackDelay;
    const stepThreshold = (stepIndex + 1) / totalSteps;
    const stepFrame = trackDelay + progressDuration * stepThreshold;
    // Flash is visible for ~8 frames after the step is reached
    const flashProgress = interpolate(frame, [stepFrame, stepFrame + 8], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return flashProgress;
  };

  // Iteration 52: Updated for shorter scene — completions at 130/180/230
  const completedCount =
    (frame >= 130 ? 1 : 0) + (frame >= 180 ? 1 : 0) + (frame >= 230 ? 1 : 0);
  const bgGlowOpacity = interpolate(completedCount, [0, 3], [0, 0.08], {
    extrapolateRight: 'clamp',
  });

  // Iteration 52: Camera chapters rescaled — PR completions at 130/180/230, pullback at 260
  const cameraFocusY = (() => {
    if (frame < 120) return 0; // all tracks visible, no offset
    if (frame < 170) {
      // Snap to track 0 (first PR at 130)
      const t = spring({ frame: Math.max(0, frame - 120), fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
      return interpolate(t, [0, 1], [0, 40]);
    }
    if (frame < 220) {
      // Snap to track 1 (second PR at 180)
      const t = spring({ frame: Math.max(0, frame - 170), fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
      return interpolate(t, [0, 1], [40, -30]);
    }
    if (frame < 260) {
      // Snap to track 2 (third PR at 230)
      const t = spring({ frame: Math.max(0, frame - 220), fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
      return interpolate(t, [0, 1], [-30, -80]);
    }
    // Pull back to show all
    const t = spring({ frame: Math.max(0, frame - 260), fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
    return interpolate(t, [0, 1], [-80, 0]);
  })();

  // Iteration 52: Camera zoom rescaled for shorter scene (120/170/220/260)
  const cameraZoom = (() => {
    if (frame < 120) return 1.0;
    if (frame < 170) {
      const t = spring({ frame: Math.max(0, frame - 120), fps, config: { damping: 14, stiffness: 120, mass: 0.7 } });
      return interpolate(t, [0, 1], [1.0, 1.15]);
    }
    if (frame < 220) {
      const t = spring({ frame: Math.max(0, frame - 170), fps, config: { damping: 14, stiffness: 120, mass: 0.7 } });
      return interpolate(t, [0, 1], [1.15, 1.18]);
    }
    if (frame < 260) {
      const t = spring({ frame: Math.max(0, frame - 220), fps, config: { damping: 14, stiffness: 120, mass: 0.7 } });
      return interpolate(t, [0, 1], [1.18, 1.15]);
    }
    return interpolate(
      spring({ frame: Math.max(0, frame - 260), fps, config: { damping: 14, stiffness: 120, mass: 0.8 } }),
      [0, 1], [1.15, 1.0]
    );
  })();

  // Iteration 52: Track dimming rescaled — 120/260 (was 190/380)
  const getTrackDim = (trackIndex: number): number => {
    if (frame < 120 || frame >= 260) return 1.0;
    if (frame < 170) return trackIndex === 0 ? 1.0 : 0.4;
    if (frame < 220) return trackIndex === 1 ? 1.0 : 0.4;
    return trackIndex === 2 ? 1.0 : 0.4;
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        fontFamily: FONT.body,
        overflow: 'hidden',
        opacity: sceneFadeOut,
        transform: `scale(${exitScale * cameraZoom}) translateY(${exitDriftY + cameraFocusY}px)`,
        filter: `blur(${exitBlur}px)`,
        transformOrigin: '50% 40%',
      }}
    >
      {/* Iteration 48: Removed background grid — reduces one visual layer, dot grid provides sufficient structure */}

      {/* Subtle radial glow behind tracks */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: 900,
          height: 500,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse at center, ${COLORS.accent.amber} 0%, transparent 70%)`,
          opacity: bgGlowOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Iteration 52: Heartbeat compressed for shorter scene (80/150/220 was 120/240/360) */}
      {[80, 150, 220].map((pulseFrame, i) => {
        const pulseAge = Math.max(0, frame - pulseFrame);
        const pulseOpacity = pulseAge >= 0 && pulseAge < 30
          ? interpolate(pulseAge, [0, 4, 30], [0, 0.25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : 0;
        return (
          <React.Fragment key={`heartbeat-${i}`}>
            {pulseOpacity > 0.001 && (
              <div
                style={{
                  position: 'absolute',
                  top: 78,
                  left: 88,
                  width: 60,
                  height: 60,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${COLORS.accent.amberGlow} 0%, transparent 70%)`,
                  opacity: pulseOpacity,
                  pointerEvents: 'none',
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Thread icon — top-left chat bubble with breathing pulse */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 60,
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: COLORS.accent.amber,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${Math.sin(frame * 0.08) * 0.04 + 1.0})`,
          boxShadow: `0 0 ${20 + Math.sin(frame * 0.08) * 6}px ${COLORS.accent.amberGlow}`,
          transition: 'box-shadow 0.1s',
        }}
      >
        <span style={{ color: '#fff', fontSize: 20, lineHeight: 1 }}>💬</span>
      </div>

      {/* Progress tracks — Iteration 45: per-track dimming for camera chapters */}
      {TRACKS.map((track, i) => {
        const trackY = TRACK_TOP_START + i * TRACK_SPACING;
        const trackDim = getTrackDim(i);

        return (
          <div
            key={track.branchName}
            style={{
              position: 'absolute',
              left: TRACK_LEFT,
              top: trackY,
              width: TRACK_WIDTH,
              opacity: trackDim,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            <ProgressTrack
              branchName={track.branchName}
              steps={STEPS}
              progress={1}
              color={track.color}
              delay={track.delay}
              completionFrame={track.completionFrame}
            />
          </div>
        );
      })}

      {/* Progress tick flash marks — flash when each step completes */}
      {TRACKS.map((track, i) => {
        const trackY = TRACK_TOP_START + i * TRACK_SPACING;
        return STEPS.map((stepLabel, stepIdx) => {
          const flash = getStepFlash(track.delay, track.completionFrame, stepIdx, STEPS.length);
          const stepX = TRACK_LEFT + ((stepIdx + 1) / STEPS.length) * TRACK_WIDTH;

          // Determine if this step has been reached (progress bar passed it)
          const progressDuration = track.completionFrame - track.delay;
          const stepThreshold = (stepIdx + 1) / STEPS.length;
          const stepFrame = track.delay + progressDuration * stepThreshold;
          const stepReached = frame >= stepFrame;

          // Amber glow behind step label when reached
          const labelGlowOpacity = stepReached
            ? interpolate(frame, [stepFrame, stepFrame + 15], [0, 0.7], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0;

          // Ripple ring expanding outward from dot
          const rippleAge = Math.max(0, frame - stepFrame);
          const rippleScale = interpolate(rippleAge, [0, 20], [1, 4], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const rippleOpacity = interpolate(rippleAge, [0, 3, 20], [0, 0.6, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <React.Fragment key={`tick-${i}-${stepIdx}`}>
              {/* Amber glow behind step label when reached */}
              {labelGlowOpacity > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: stepX - 24,
                    top: trackY + 50,
                    width: 48,
                    height: 20,
                    borderRadius: 10,
                    background: `radial-gradient(ellipse at center, ${COLORS.accent.amberGlow} 0%, transparent 70%)`,
                    opacity: labelGlowOpacity,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Ripple ring expanding outward from dot */}
              {rippleOpacity > 0.01 && (
                <div
                  style={{
                    position: 'absolute',
                    left: stepX - 6,
                    top: trackY + 34 - 6 + 6,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: `2px solid ${track.color}`,
                    opacity: rippleOpacity,
                    transform: `scale(${rippleScale})`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Flash dot — bigger (12px) */}
              {flash > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: stepX - 6,
                    top: trackY + 34,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: track.color,
                    opacity: flash * 0.8,
                    boxShadow: `0 0 12px ${track.color}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </React.Fragment>
          );
        });
      })}

      {/* Iteration 27: Removed code flow particles — they added clutter per Gemini feedback */}

      {/* Progress bar shimmers — wider, brighter moving highlight for ambient motion */}
      {TRACKS.map((track, i) => {
        if (frame < track.delay) return null;
        const trackY = TRACK_TOP_START + i * TRACK_SPACING;
        const shimmerX = ((frame * (1.5 + i * 0.4)) % 120) - 10;
        const progress = interpolate(frame, [track.delay, track.completionFrame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div
            key={`shimmer-${i}`}
            style={{
              position: 'absolute',
              left: TRACK_LEFT,
              top: trackY + 25,
              width: TRACK_WIDTH * progress,
              height: 6,
              borderRadius: 3,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              // Iteration 47: Reduced shimmer brightness for less visual noise
              background: `linear-gradient(90deg, transparent 0%, transparent ${shimmerX - 12}%, rgba(255,255,255,0.03) ${shimmerX - 6}%, rgba(255,255,255,0.12) ${shimmerX}%, rgba(255,255,255,0.03) ${shimmerX + 6}%, transparent ${shimmerX + 12}%, transparent 100%)`,
            }} />
          </div>
        );
      })}

      {/* PR Badges — appear at the right edge of each track when complete */}
      {TRACKS.map((track, i) => {
        const trackY = TRACK_TOP_START + i * TRACK_SPACING;
        const badgeX = TRACK_LEFT + TRACK_WIDTH + 16;
        // Vertically align with the branch label row
        const badgeY = trackY + 2;

        return (
          <PRBadge
            key={track.prNumber}
            number={track.prNumber}
            color={track.color}
            delay={track.completionFrame}
            x={badgeX}
            y={badgeY}
          />
        );
      })}

      {/* Iteration 52: Triumphant PR badge flash — rescaled for shorter scene (230, was 350) */}
      {frame >= 230 && frame < 290 && (() => {
        const allDoneAge = frame - 230;
        // Three sequential flashes — each badge flashes 8 frames apart
        return TRACKS.map((track, i) => {
          const flashStart = i * 8;
          const flashAge = allDoneAge - flashStart;
          if (flashAge < 0 || flashAge > 15) return null;
          const trackY = TRACK_TOP_START + i * TRACK_SPACING;
          const badgeX = TRACK_LEFT + TRACK_WIDTH + 16;
          const flashOpacity = interpolate(flashAge, [0, 3, 15], [0, 0.8, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const flashScale = interpolate(flashAge, [0, 3, 15], [1.0, 1.4, 1.0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <div
              key={`flash-${i}`}
              style={{
                position: 'absolute',
                left: badgeX + 30,
                top: trackY + 10,
                width: 60,
                height: 30,
                borderRadius: 20,
                background: `radial-gradient(ellipse, ${track.color} 0%, transparent 70%)`,
                opacity: flashOpacity,
                transform: `scale(${flashScale})`,
                pointerEvents: 'none',
              }}
            />
          );
        });
      })()}

      {/* Iteration 21: Removed dashed connection lines — they were cluttering the scene */}

      {/* Iteration 52: Mid-scene text rescaled — 110-220 (was 180-340) */}
      {frame >= 110 && frame < 220 && (() => {
        const textOpacity = interpolate(frame, [110, 130, 190, 220], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const textY = interpolate(frame, [110, 135], [15, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const textScale = interpolate(
          spring({
            frame: Math.max(0, frame - 110),
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.7 },
          }),
          [0, 1],
          [0.85, 1]
        );
        return (
          <div
            style={{
              position: 'absolute',
              top: 62,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity: textOpacity,
              transform: `translateY(${textY}px) scale(${textScale})`,
            }}
          >
            <span
              style={{
                color: COLORS.text.secondary,
                fontSize: 19,
                fontWeight: 500,
                fontFamily: FONT.heading,
                letterSpacing: 0.5,
                textShadow: `0 0 20px rgba(217, 119, 6, 0.2)`,
              }}
            >
              Three engineers, three branches — zero context-switching tax
            </span>
          </div>
        );
      })()}

      {/* Iteration 49: Code flash overlays during burst phases — brief flashes of stylized code
          fragments during the "fast" phases of progress, creating a sense of frantic parallel work.
          Aligned with ProgressTrack burst timing: bursts at 10%, 32%, 55%, 70% of each track's duration */}
      {TRACKS.map((track, i) => {
        const trackY = TRACK_TOP_START + i * TRACK_SPACING;
        const progressDuration = track.completionFrame - track.delay;
        const t = interpolate(frame, [track.delay, track.delay + progressDuration], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        // Show code flash during burst phases (not plateaus)
        const isBursting = (t > 0 && t <= 0.10) || (t > 0.22 && t <= 0.32) || (t > 0.45 && t <= 0.55) || (t > 0.70 && t <= 1.0);
        if (!isBursting || frame < track.delay || frame > track.completionFrame) return null;
        // Flickering opacity for code fragments
        const flickerPhase = Math.sin(frame * 0.8 + i * 2.1) * 0.5 + 0.5;
        const codeSnippets = ['const fix =', 'async fn()', 'return ok', 'test.pass'];
        const snippet = codeSnippets[Math.floor(((frame + i * 13) * 0.3) % codeSnippets.length)];
        return (
          <div
            key={`code-flash-${i}`}
            style={{
              position: 'absolute',
              left: TRACK_LEFT + 20 + (frame % 200) * 3,
              top: trackY + 12,
              opacity: flickerPhase * 0.15,
              pointerEvents: 'none',
              zIndex: 25,
            }}
          >
            <span style={{
              color: track.color,
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 400,
              letterSpacing: 0.5,
            }}>
              {snippet}
            </span>
          </div>
        );
      })}

      {/* Iteration 52: Closing glow rescaled — 260 (was 380) */}
      {frame >= 260 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            width: 600,
            height: 140,
            transform: 'translateX(-50%)',
            background: `radial-gradient(ellipse at center, ${COLORS.accent.amberGlow} 0%, transparent 70%)`,
            opacity: closingOpacity * closingGlowPulse,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Closing text — "3 PRs. 1 conversation." */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: closingOpacity,
          transform: `translateY(${closingTranslateY}px) scale(${closingScale})`,
        }}
      >
        <span
          style={{
            color: COLORS.accent.amber,
            fontSize: 48,
            fontWeight: 700,
            fontFamily: FONT.heading,
            letterSpacing: -0.5,
            textShadow: `0 0 30px ${COLORS.accent.amberGlow}`,
          }}
        >
          3 PRs. 1&nbsp;conversation.
        </span>
      </div>
    </AbsoluteFill>
  );
};
