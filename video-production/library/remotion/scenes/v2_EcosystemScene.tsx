/**
 * @reference-scene EcosystemScene
 * @origin v2 — extracted to library 2026-03-23
 * @demonstrates Per-tool micro-animation sub-components (5 unique)
 * @dependencies COLORS, FONT, SPRING_CONFIG from theme
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface SpokeData {
  name: string;
  angleDeg: number;
  color: string;
  icon: string;
  label: string;
  /** Frame at which this spoke starts drawing */
  startFrame: number;
}

// Iteration 11: Much wider stagger (30 frames apart instead of ~24) for clearly visible sequential entrance
const SPOKES: SpokeData[] = [
  { name: 'JIRA', angleDeg: -72, color: COLORS.tools.jira, icon: '📋', label: 'Tickets & tracking', startFrame: 20 },
  { name: 'Bitbucket', angleDeg: 0, color: COLORS.tools.bitbucket, icon: '🔀', label: 'PRs & code search', startFrame: 50 },
  { name: 'GitHub', angleDeg: 72, color: COLORS.tools.github, icon: '🐙', label: 'Repos & issues', startFrame: 80 },
  { name: 'Figma', angleDeg: 144, color: COLORS.tools.figma, icon: '🎨', label: 'Designs', startFrame: 110 },
  { name: 'Codebase', angleDeg: 216, color: COLORS.accent.amber, icon: '💻', label: '50+ languages', startFrame: 140 },
];

// Iteration 11: Wider stagger for file pills (20 frames apart) and later start (after spokes done)
const FILE_ICONS = [
  { text: 'PDF', startAngle: 0, speed: 0.012, enterFrame: 170 },
  { text: 'XLS', startAngle: Math.PI * 0.33, speed: 0.010, enterFrame: 190 },
  { text: 'IMG', startAngle: Math.PI * 0.66, speed: 0.014, enterFrame: 210 },
  { text: 'CSV', startAngle: Math.PI, speed: 0.011, enterFrame: 230 },
  { text: 'DOC', startAngle: Math.PI * 1.33, speed: 0.013, enterFrame: 250 },
  { text: '.py', startAngle: Math.PI * 1.66, speed: 0.009, enterFrame: 270 },
];

const HUB_X = 960;
const HUB_Y = 540;
const SPOKE_RADIUS = 300;
const ORBIT_RADIUS = 160;
const HUB_SIZE = 100;
const NODE_SIZE = 60;
const LINE_DRAW_FRAMES = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function spokeEndpoint(angleDeg: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: HUB_X + Math.cos(rad) * SPOKE_RADIUS,
    y: HUB_Y + Math.sin(rad) * SPOKE_RADIUS,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** The central hub with glow pulse */
const Hub: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const hubSpring = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
  const glowPulse = Math.sin(frame * 0.08) * 0.25 + 0.75; // oscillates 0.50 – 1.0

  // Iteration 51: Further reduced hub breathing and float — nearly still
  const breathing = frame > 20 ? 1.0 + Math.sin(frame * 0.04) * 0.02 : 1.0;
  const hubScale = hubSpring * breathing;
  const hubFloatY = frame > 20 ? Math.sin(frame * 0.01) * 1 : 0;
  const hubFloatX = 0; // Removed horizontal — grounded presence

  return (
    <div
      style={{
        position: 'absolute',
        left: HUB_X - HUB_SIZE / 2,
        top: HUB_Y - HUB_SIZE / 2,
        width: HUB_SIZE,
        height: HUB_SIZE,
        borderRadius: '50%',
        background: COLORS.accent.amber,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${hubScale}) translate(${hubFloatX}px, ${hubFloatY}px)`,
        boxShadow: `0 0 ${40 * glowPulse}px ${20 * glowPulse}px ${COLORS.accent.amberGlow}, 0 0 ${80 * glowPulse}px ${40 * glowPulse}px ${COLORS.accent.amberGlow}`,
        zIndex: 10,
      }}
    >
      <span style={{ fontSize: 44, lineHeight: 1 }}>💬</span>
    </div>
  );
};

/** SVG line that draws from hub center → spoke endpoint */
const SpokeLine: React.FC<{
  angleDeg: number;
  color: string;
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ angleDeg, color, startFrame, frame, fps }) => {
  const { x: ex, y: ey } = spokeEndpoint(angleDeg);
  const length = SPOKE_RADIUS;

  const drawProgress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
  });

  if (drawProgress <= 0) return null;

  // Glow line fades in after the spoke finishes drawing
  const glowOpacity = drawProgress >= 1
    ? interpolate(frame, [startFrame + LINE_DRAW_FRAMES, startFrame + LINE_DRAW_FRAMES + 10], [0, 0.15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <>
      {/* Glow line — wider, fades in after draw completes */}
      {glowOpacity > 0 && (
        <line
          x1={HUB_X}
          y1={HUB_Y}
          x2={ex}
          y2={ey}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={glowOpacity}
        />
      )}
      {/* Main spoke line */}
      <line
        x1={HUB_X}
        y1={HUB_Y}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - drawProgress)}
        strokeLinecap="round"
        opacity={0.6}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Micro-animation sub-components — subtle activity at each spoke endpoint
// "Small animated examples pulse at each node" per original script
// ---------------------------------------------------------------------------

/** JIRA: Status badge cycling To Do → In Progress → Done */
const JiraMicroAnimation: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const cycleFrame = localFrame % 180; // full cycle every 180 frames (3 states × 60)
  const stateIndex = Math.floor(cycleFrame / 60);
  const states = [
    { text: 'To Do', color: '#6b7280' },      // gray
    { text: 'In Progress', color: '#3b82f6' }, // blue
    { text: 'Done', color: '#22c55e' },         // green
  ];
  const current = states[stateIndex];
  // Quick crossfade at transitions
  const stateLocalFrame = cycleFrame % 60;
  const fadeIn = interpolate(stateLocalFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(stateLocalFrame, [50, 58], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const statusOpacity = Math.min(fadeIn, fadeOut);

  return (
    <span style={{
      fontFamily: FONT.mono,
      fontSize: 9,
      fontWeight: 600,
      color: current.color,
      opacity: statusOpacity * 0.55,
      background: `${current.color}18`,
      padding: '1px 5px',
      borderRadius: 3,
      letterSpacing: 0.3,
    }}>
      {current.text}
    </span>
  );
};

/** Bitbucket: PR pill with spring pop + checkmark after 40 frames */
const BitbucketMicroAnimation: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const pillSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 8, stiffness: 180, mass: 0.6 },
  });
  const showCheck = localFrame >= 40;
  const checkOpacity = showCheck
    ? interpolate(localFrame, [40, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  return (
    <span style={{
      fontFamily: FONT.mono,
      fontSize: 9,
      fontWeight: 600,
      color: '#94a3b8',
      opacity: 0.5,
      transform: `scale(${pillSpring})`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      background: 'rgba(59, 130, 246, 0.12)',
      padding: '1px 5px',
      borderRadius: 3,
    }}>
      PR #142
      {showCheck && (
        <span style={{ color: '#22c55e', opacity: checkOpacity, fontSize: 10 }}>✓</span>
      )}
    </span>
  );
};

/** GitHub: Commit hash typing in character by character */
const GitHubMicroAnimation: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const fullHash = 'a3f2b1c';
  const charsVisible = Math.min(fullHash.length, Math.floor(localFrame / 5));
  const displayText = fullHash.slice(0, charsVisible);
  // Blinking cursor while typing
  const cursorVisible = charsVisible < fullHash.length && Math.floor(localFrame / 8) % 2 === 0;

  return (
    <span style={{
      fontFamily: FONT.mono,
      fontSize: 9,
      fontWeight: 500,
      color: '#94a3b8',
      opacity: 0.5,
      letterSpacing: 0.5,
    }}>
      {displayText}{cursorVisible ? '▎' : ''}
    </span>
  );
};

/** Figma: 3 color dots pulsing gently */
const FigmaMicroAnimation: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const dotColors = ['#F24E1E', '#A259FF', '#0ACF83']; // Figma brand-ish colors
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {dotColors.map((color, i) => {
        const pulse = 0.7 + Math.sin(localFrame * 0.08 + i * 2.1) * 0.3;
        return (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: color,
              opacity: 0.5 * pulse,
              transform: `scale(${pulse})`,
              display: 'inline-block',
            }}
          />
        );
      })}
    </span>
  );
};

/** Codebase: </> icon with syntax-highlight color shift */
const CodebaseMicroAnimation: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  // Cycle through syntax highlight colors
  const colors = ['#d97706', '#3b82f6', '#22c55e', '#a855f7'];
  const t = (localFrame * 0.03) % 1;
  const idx = Math.floor(t * colors.length);
  const nextIdx = (idx + 1) % colors.length;
  const blend = (t * colors.length) % 1;
  // Simple crossfade between two colors
  const currentColor = colors[idx];
  const colorOpacity = 1 - blend * 0.5;

  return (
    <span style={{
      fontFamily: FONT.mono,
      fontSize: 10,
      fontWeight: 700,
      color: currentColor,
      opacity: 0.45 * colorOpacity,
      letterSpacing: 0.5,
    }}>
      {'</>'}
    </span>
  );
};

/** Micro-animation delay — appears 30 frames after spoke spring completes */
const MICRO_ANIM_DELAY = 30;

/** Node circle + icon + label at the spoke endpoint */
const SpokeNode: React.FC<{
  spoke: SpokeData;
  frame: number;
  fps: number;
}> = ({ spoke, frame, fps }) => {
  const nodeAppearFrame = spoke.startFrame + LINE_DRAW_FRAMES;
  const nodeSpring = spring({
    frame: frame - nodeAppearFrame,
    fps,
    config: { damping: 11, stiffness: 200, mass: 0.7 },
  });
  const nodeScale = interpolate(nodeSpring, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
  });

  if (frame < nodeAppearFrame) return null;

  const { x, y } = spokeEndpoint(spoke.angleDeg);

  // Iteration 33: Further reduced floating — almost subliminal
  const settledFrame = Math.max(0, frame - nodeAppearFrame - 20);
  const floatY = settledFrame > 0 ? Math.sin(settledFrame * 0.025 + spoke.angleDeg * 0.1) * 2 : 0;
  const floatX = 0; // Removed horizontal float for cleaner composition

  // Micro-animation: visible after node spring completes + delay
  const microAnimStart = nodeAppearFrame + MICRO_ANIM_DELAY;
  const showMicroAnim = frame >= microAnimStart;
  const microLocalFrame = Math.max(0, frame - microAnimStart);
  // Fade in the micro-animation
  const microFadeIn = showMicroAnim
    ? interpolate(frame, [microAnimStart, microAnimStart + 15], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - NODE_SIZE / 2,
        width: NODE_SIZE,
        height: NODE_SIZE,
        transform: `scale(${nodeScale}) translate(${floatX}px, ${floatY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 5,
      }}
    >
      {/* Circle — with connection flash when spoke line arrives */}
      {(() => {
        // Iteration 30: Flash + scale pulse when spoke line connects
        const connectionAge = Math.max(0, frame - nodeAppearFrame);
        // Iteration 46: Brighter connection flash (0.9→1.2 peak, faster 2-frame rise)
        const connectionFlash = interpolate(connectionAge, [0, 2, 12], [0, 1.2, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const connectionPulse = interpolate(connectionAge, [0, 4, 15], [1.0, 1.30, 1.0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        // Iteration 35: Icon bounce/jiggle after spoke connects — adds personality
        const bounceSpring = connectionAge > 18
          ? spring({
              frame: connectionAge - 18,
              fps,
              config: { damping: 5, stiffness: 200, mass: 0.6 },
            })
          : 0;
        const iconBounce = connectionAge > 18
          ? interpolate(bounceSpring, [0, 0.3, 0.6, 1], [1.0, 1.12, 0.95, 1.0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            })
          : 1.0;
        return (
          <div
            style={{
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderRadius: '50%',
              background: COLORS.bg.secondary,
              border: `3px solid ${spoke.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 ${12 + connectionFlash * 30}px ${4 + connectionFlash * 15}px ${spoke.color}${connectionFlash > 0.01 ? 'aa' : '33'}`,
              transform: `scale(${connectionPulse * iconBounce})`,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{spoke.icon}</span>
          </div>
        );
      })()}

      {/* Name */}
      <span
        style={{
          marginTop: 8,
          fontFamily: FONT.heading,
          fontWeight: 700,
          fontSize: 16,
          color: COLORS.text.primary,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {spoke.name}
      </span>

      {/* Label — iter 48: 13→11px for stronger hierarchy */}
      <span
        style={{
          marginTop: 2,
          fontFamily: FONT.heading,
          fontWeight: 400,
          fontSize: 11,
          color: COLORS.text.secondary,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {spoke.label}
      </span>

      {/* Micro-animation — subtle activity indicator below label.
          Per script: "Small animated examples pulse at each node —
          a JIRA ticket transitioning status, a PR getting created,
          a Figma design being referenced." */}
      {showMicroAnim && (
        <div
          style={{
            marginTop: 4,
            opacity: microFadeIn,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {spoke.name === 'JIRA' && <JiraMicroAnimation localFrame={microLocalFrame} />}
          {spoke.name === 'Bitbucket' && <BitbucketMicroAnimation localFrame={microLocalFrame} fps={fps} />}
          {spoke.name === 'GitHub' && <GitHubMicroAnimation localFrame={microLocalFrame} />}
          {spoke.name === 'Figma' && <FigmaMicroAnimation localFrame={microLocalFrame} />}
          {spoke.name === 'Codebase' && <CodebaseMicroAnimation localFrame={microLocalFrame} />}
        </div>
      )}
    </div>
  );
};

/** Small orbiting file-type pill */
const OrbitingPill: React.FC<{
  text: string;
  startAngle: number;
  speed: number;
  frame: number;
  fps: number;
  /** Frame at which this pill appears */
  enterFrame: number;
}> = ({ text, startAngle, speed, frame, fps, enterFrame }) => {
  // Each pill enters individually via spring scale
  const pillSpring = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: { damping: 5, stiffness: 120, mass: 1 },
  });

  if (frame < enterFrame) return null;

  const angle = startAngle + frame * speed;
  const x = HUB_X + Math.cos(angle) * ORBIT_RADIUS;
  const y = HUB_Y + Math.sin(angle) * ORBIT_RADIUS;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 26,
        top: y - 16,
        width: 52,
        height: 32,
        borderRadius: 6,
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(217, 119, 6, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: interpolate(pillSpring, [0, 0.3], [0, 0.9], { extrapolateRight: 'clamp' }),
        transform: `scale(${pillSpring * (1.0 + Math.sin(frame * 0.1 + startAngle) * 0.05)})`,
        zIndex: 3,
      }}
    >
      <span
        style={{
          fontFamily: FONT.heading,
          fontSize: 15,
          fontWeight: 600,
          color: COLORS.text.label,
          letterSpacing: 0.3,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

// Iteration 48: Removed background particles — dot grid provides sufficient ambient life

export const EcosystemScene: React.FC = () => {
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

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg.primary,
        fontFamily: FONT.heading,
        opacity: sceneFadeOut,
        transform: `scale(${exitScale}) translateY(${exitDriftY}px)`,
        filter: `blur(${exitBlur}px)`,
      }}
    >
      {/* Iteration 27: Larger, more prominent depth gradient behind hub for focal point */}
      <div
        style={{
          position: 'absolute',
          left: HUB_X - 500,
          top: HUB_Y - 500,
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.04) 40%, transparent 70%)`,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Iteration 40: Dark vignette overlay — reduces edge clutter, focuses eye on hub */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(15, 23, 42, 0.5) 100%)',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      />

      {/* SVG layer for spoke lines + data-flow particles */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, transform: `rotate(${frame * 0.01}deg)`, transformOrigin: `${HUB_X}px ${HUB_Y}px` }}
      >
        {SPOKES.map((spoke) => (
          <SpokeLine
            key={spoke.name}
            angleDeg={spoke.angleDeg}
            color={spoke.color}
            startFrame={spoke.startFrame}
            frame={frame}
            fps={fps}
          />
        ))}

        {/* Iteration 44: 3x faster data-flow particles — streaking comets (cycleLen 60→20) */}
        {SPOKES.map((spoke) => {
          const lineComplete = frame > spoke.startFrame + LINE_DRAW_FRAMES + 10;
          if (!lineComplete) return null;
          const { x: ex, y: ey } = spokeEndpoint(spoke.angleDeg);
          return [0, 1].map((pIdx) => {
            const particleFrame = frame - spoke.startFrame - LINE_DRAW_FRAMES - 10;
            const cycleLen = 20;
            const offset = pIdx * 8;
            const t = ((particleFrame + offset) % cycleLen) / cycleLen;
            const px = HUB_X + (ex - HUB_X) * t;
            const py = HUB_Y + (ey - HUB_Y) * t;
            // Iteration 45: Brighter particles (0.5 peak) — more visible data streaks
            const particleOpacity = interpolate(t, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0]);
            return (
              <circle
                key={`particle-${spoke.name}-${pIdx}`}
                cx={px}
                cy={py}
                r={3}
                fill={spoke.color}
                opacity={particleOpacity}
              />
            );
          });
        })}
      </svg>

      {/* Iteration 21: Removed orbiting file pills — too distracting and cluttered */}

      {/* Spoke endpoint nodes */}
      {SPOKES.map((spoke) => (
        <SpokeNode key={spoke.name} spoke={spoke} frame={frame} fps={fps} />
      ))}

      {/* Central hub — rendered last so it sits on top */}
      <Hub frame={frame} fps={fps} />

      {/* Iteration 49: Hub briefly flashes with spoke color on connection.
          "Have the central hub briefly pulse with the color of the connected tool" — Gemini iter 48 */}
      {SPOKES.map((spoke) => {
        const connectionFrame = spoke.startFrame + LINE_DRAW_FRAMES;
        const flashAge = Math.max(0, frame - connectionFrame);
        if (flashAge <= 0 || flashAge > 15) return null;
        const flashOp = interpolate(flashAge, [0, 3, 15], [0, 0.35, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div
            key={`hub-color-flash-${spoke.name}`}
            style={{
              position: 'absolute',
              left: HUB_X - HUB_SIZE / 2,
              top: HUB_Y - HUB_SIZE / 2,
              width: HUB_SIZE,
              height: HUB_SIZE,
              borderRadius: '50%',
              background: spoke.color,
              opacity: flashOp,
              pointerEvents: 'none',
              zIndex: 11,
            }}
          />
        );
      })}

      {/* Iteration 48: Removed background particles — dot grid provides sufficient ambient life */}

      {/* Iteration 48: Hub ripple — low-opacity ring emanates from hub when each spoke connects.
          Reinforces Tara as central power source. */}
      {SPOKES.map((spoke) => {
        const connectionFrame = spoke.startFrame + LINE_DRAW_FRAMES;
        const rippleAge = Math.max(0, frame - connectionFrame);
        if (rippleAge <= 0 || rippleAge > 40) return null;
        const rippleRadius = interpolate(rippleAge, [0, 40], [50, 300], { extrapolateRight: 'clamp' });
        const rippleOp = interpolate(rippleAge, [0, 5, 40], [0, 0.2, 0], { extrapolateRight: 'clamp' });
        return (
          <div
            key={`hub-ripple-${spoke.name}`}
            style={{
              position: 'absolute',
              left: HUB_X - rippleRadius,
              top: HUB_Y - rippleRadius,
              width: rippleRadius * 2,
              height: rippleRadius * 2,
              borderRadius: '50%',
              border: `1.5px solid ${COLORS.accent.amber}`,
              opacity: rippleOp,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default EcosystemScene;
