/**
 * @reference-scene ReachScene
 * @origin v8 — extracted to library 2026-03-23
 * @demonstrates Living ecosystem: bidirectional data packets, processing swirl, activity LEDs, micro-drift
 * @dependencies React, remotion (useCurrentFrame, interpolate, spring, AbsoluteFill, Img, staticFile), ../theme (COLORS, FONTS, SPRINGS), ../timing (FPS, TRANSITION_FRAMES)
 */
import React from 'react';
import { useCurrentFrame, interpolate, spring, AbsoluteFill, Img, staticFile } from 'remotion';
import { COLORS, FONTS, SPRINGS } from '../theme';
import { FPS, TRANSITION_FRAMES } from '../timing';

/**
 * Scene 5: ReachScene
 *
 * "She does this because she's connected to everything you already use —
 *  JIRA, Bitbucket, GitHub, Figma — fifty tools, all through Slack.
 *  No new tools. No context-switching. She reads PDFs, images, code in
 *  fifty languages — and everything she does flows back into the thread
 *  as tickets, reports, pull requests — natural outputs of the conversation."
 *
 * Visual: Central Tara avatar with expanding rings of tool icons connected
 * by amber lines, data packets flowing in and out.
 */

// ── Tool definitions ──────────────────────────────────────────────────

interface ToolNode {
  label: string;
  color: string;
  ring: 'primary' | 'secondary';
}

const PRIMARY_TOOLS: ToolNode[] = [
  { label: 'JIRA', color: '#3b82f6', ring: 'primary' },
  { label: 'Bitbucket', color: '#3b82f6', ring: 'primary' },
  { label: 'GitHub', color: COLORS.white, ring: 'primary' },
  { label: 'Figma', color: '#ec4899', ring: 'primary' },
];

const SECONDARY_TOOLS: ToolNode[] = [
  { label: 'PDF', color: COLORS.textSecondary, ring: 'secondary' },
  { label: 'Images', color: COLORS.textSecondary, ring: 'secondary' },
  { label: 'Code', color: COLORS.textSecondary, ring: 'secondary' },
  { label: 'Slack', color: '#4a154b', ring: 'secondary' },
];

const OUTPUT_LABELS = ['Ticket', 'Report', 'PR', 'Deploy'];

const PRIMARY_RADIUS = 180;
const SECONDARY_RADIUS = 290;
const STAGGER = 15;
const CENTER_X = 960;
const CENTER_Y = 460;

// ── Helpers ───────────────────────────────────────────────────────────

function getNodePosition(
  index: number,
  total: number,
  radius: number,
  offsetAngle = 0,
): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2 + offsetAngle;
  return {
    x: CENTER_X + Math.cos(angle) * radius,
    y: CENTER_Y + Math.sin(angle) * radius,
  };
}

// ── Sub-components ────────────────────────────────────────────────────

/** Center avatar — uses Tara's actual avatar image inside a glowing circle */
const CenterAvatar: React.FC<{
  opacity: number;
  scale: number;
  glowIntensity: number;
}> = ({ opacity, scale, glowIntensity }) => {
  const avatarSize = 64;
  const avatarSrc = staticFile('avatar/tara.png');

  return (
    <div
      style={{
        position: 'absolute',
        left: CENTER_X - avatarSize / 2,
        top: CENTER_Y - avatarSize / 2,
        width: avatarSize,
        height: avatarSize,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -24,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.amberLight}${Math.round(glowIntensity * 35)
            .toString(16)
            .padStart(2, '0')} 0%, ${COLORS.amber}${Math.round(glowIntensity * 10)
            .toString(16)
            .padStart(2, '0')} 50%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      {/* Amber border ring */}
      <div
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          border: `2px solid ${COLORS.amber}`,
          boxShadow: `0 0 ${9 + glowIntensity * 14}px ${COLORS.amber}${Math.round(30 + glowIntensity * 30)
            .toString(16)
            .padStart(2, '0')}`,
        }}
      />
      {/* Avatar image */}
      <Img
        src={avatarSrc}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};

const ToolIcon: React.FC<{
  tool: ToolNode;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  altLabel?: string;
}> = ({ tool, x, y, opacity, scale, altLabel }) => {
  const size = tool.ring === 'primary' ? 56 : 44;
  const fontSize = tool.ring === 'primary' ? 12 : 10;
  const displayLabel = altLabel ?? tool.label;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `${tool.color}18`,
        border: `1.5px solid ${tool.color}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
        fontFamily: FONTS.sans,
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 600,
          color: tool.color,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
};

const ConnectionLine: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  opacity: number;
}> = ({ fromX, fromY, toX, toY, progress, opacity }) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);

  return (
    <line
      x1={fromX}
      y1={fromY}
      x2={fromX + dx * progress}
      y2={fromY + dy * progress}
      stroke={COLORS.amber}
      strokeWidth={1.5}
      opacity={opacity * 0.6}
      strokeLinecap="round"
      strokeDasharray={`${length * progress} ${length}`}
    />
  );
};

const DataPacket: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  opacity: number;
  frame: number;
  size?: number;
  color?: 'amber' | 'blue';
}> = ({ fromX, fromY, toX, toY, progress, opacity, frame, size = 4, color = 'amber' }) => {
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;

  // Pulsing glow effect on each packet
  const pulseScale = 1 + 0.3 * Math.sin(frame * 0.15 + progress * Math.PI * 2);

  // Color palette: blue for inbound data, amber for outbound
  const glowColor = color === 'blue' ? COLORS.blue : COLORS.amber;
  const coreColor = color === 'blue' ? '#60a5fa' : COLORS.amberLight;

  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={size * 2.5 * pulseScale}
        fill={glowColor}
        opacity={opacity * 0.11}
      />
      {/* Core packet */}
      <circle
        cx={x}
        cy={y}
        r={size * pulseScale}
        fill={coreColor}
        opacity={opacity * 0.95}
      />
      {/* Bright center */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.4 * pulseScale}
        fill={COLORS.white}
        opacity={opacity * 0.7}
      />
    </g>
  );
};

// ── Main scene ────────────────────────────────────────────────────────

export const ReachScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Entrance / exit opacity ──────────────────────────────────────

  const entranceOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const ESTIMATED_DURATION = 850;
  const exitStart = ESTIMATED_DURATION - TRANSITION_FRAMES;

  const exitOpacity = interpolate(
    frame,
    [exitStart, ESTIMATED_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const sceneOpacity = Math.min(entranceOpacity, exitOpacity);

  // ── Phase timing (frames relative to component start) ────────────

  const PHASE_ICON_START = TRANSITION_FRAMES;
  const allPrimary = PRIMARY_TOOLS.length;
  const allSecondary = SECONDARY_TOOLS.length;
  const totalIcons = allPrimary + allSecondary;
  const iconsEndFrame = PHASE_ICON_START + totalIcons * STAGGER + 30;

  const PHASE_LINES_START = iconsEndFrame;
  const PHASE_LINES_DURATION = 35;

  const PHASE_PACKETS_IN_START = PHASE_LINES_START + PHASE_LINES_DURATION;
  const PHASE_PACKETS_IN_DURATION = 90;

  const PHASE_TEXT_START = PHASE_PACKETS_IN_START + 30;

  const PHASE_PACKETS_OUT_START = PHASE_PACKETS_IN_START + PHASE_PACKETS_IN_DURATION + 30;
  const PHASE_PACKETS_OUT_DURATION = 120;

  // ── Center avatar — enters from bright particle convergence ───────
  // (Continuity with ExecutionScene exit particles converging here)

  const avatarEntrance = spring({
    frame: Math.max(0, frame - TRANSITION_FRAMES / 2),
    fps: FPS,
    config: { damping: 10, mass: 0.5, stiffness: 160 },
  });

  // Initial bright flash as particles "arrive" and form the avatar
  const arrivalFlash = interpolate(
    frame,
    [0, 8, TRANSITION_FRAMES],
    [1, 0.8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const avatarGlow = interpolate(
    frame,
    [0, TRANSITION_FRAMES, PHASE_PACKETS_IN_START, PHASE_PACKETS_IN_START + 60],
    [0.9, 0.3, 0.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Processing pulse — center avatar breathes when data arrives ──

  // Scale pulse: 1.0 → 1.10 → 1.0 over 8 frames, triggered every ~40 frames
  const pulseCycle = 40;
  const pulseActive = frame >= PHASE_PACKETS_IN_START;
  const pulsePhase = pulseActive ? (frame - PHASE_PACKETS_IN_START) % pulseCycle : -1;
  let processingPulseScale = 1.0;
  if (pulsePhase >= 0 && pulsePhase <= 8) {
    processingPulseScale = interpolate(
      pulsePhase,
      [0, 4, 8],
      [1.0, 1.10, 1.0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  // ── Tool icon positions ──────────────────────────────────────────

  const allTools = [...PRIMARY_TOOLS, ...SECONDARY_TOOLS];
  const toolPositions = allTools.map((tool, i) => {
    const isPrimary = tool.ring === 'primary';
    const ringIndex = isPrimary ? i : i - allPrimary;
    const ringTotal = isPrimary ? allPrimary : allSecondary;
    const radius = isPrimary ? PRIMARY_RADIUS : SECONDARY_RADIUS;
    const offset = isPrimary ? 0 : Math.PI / allSecondary;
    return getNodePosition(ringIndex, ringTotal, radius, offset);
  });

  // ── Render ───────────────────────────────────────────────────────

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        opacity: sceneOpacity,
      }}
    >
      {/* SVG layer for lines and packets */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: 1920,
          height: 1080,
          pointerEvents: 'none',
        }}
      >
        {/* Connection lines — fast draw with aggressive spring */}
        {allTools.map((_, i) => {
          const { x, y } = toolPositions[i];
          const lineDelay = PHASE_LINES_START + i * 4;
          const lineSpring = spring({
            frame: Math.max(0, frame - lineDelay),
            fps: FPS,
            config: { damping: 14, mass: 0.4, stiffness: 220 },
          });
          const lineProgress = interpolate(lineSpring, [0, 1], [0, 1]);
          const lineOpacity = interpolate(
            frame,
            [lineDelay, lineDelay + 10],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          return (
            <ConnectionLine
              key={`line-${i}`}
              fromX={x}
              fromY={y}
              toX={CENTER_X}
              toY={CENTER_Y}
              progress={lineProgress}
              opacity={lineOpacity}
            />
          );
        })}

        {/* Data packets — inbound (tools -> center) — BLUE, 60-frame cycle */}
        {allTools.map((_, i) => {
          const { x, y } = toolPositions[i];
          const cycleLength = 60; // slower inbound cycle
          const packetFrame = frame - PHASE_PACKETS_IN_START - i * 8;
          if (packetFrame < 0 || frame < PHASE_PACKETS_IN_START) return null;

          const cycleProgress = (packetFrame % cycleLength) / cycleLength;
          const packetOpacity = interpolate(
            cycleProgress,
            [0, 0.1, 0.8, 1],
            [0, 1, 1, 0],
          );

          return (
            <DataPacket
              key={`packet-in-${i}`}
              fromX={x}
              fromY={y}
              toX={CENTER_X}
              toY={CENTER_Y}
              progress={cycleProgress}
              opacity={packetOpacity}
              frame={frame}
              size={5}
              color="blue"
            />
          );
        })}

        {/* Data packets — outbound (center -> primary tools) — AMBER, 45-frame cycle */}
        {allTools.slice(0, allPrimary).map((_, i) => {
          const { x, y } = toolPositions[i];
          const packetFrame = frame - PHASE_PACKETS_OUT_START - i * 10;
          if (packetFrame < 0) return null;

          const cycleLength = 45; // faster outbound cycle
          const cycleProgress = (packetFrame % cycleLength) / cycleLength;
          const packetOpacity = interpolate(
            cycleProgress,
            [0, 0.1, 0.8, 1],
            [0, 1, 1, 0],
          );

          return (
            <DataPacket
              key={`packet-out-${i}`}
              fromX={CENTER_X}
              fromY={CENTER_Y}
              toX={x}
              toY={y}
              progress={cycleProgress}
              opacity={packetOpacity}
              frame={frame}
              size={5}
              color="amber"
            />
          );
        })}

        {/* Ambient continuous pulses — "living ecosystem" with bi-directional color */}
        {frame >= PHASE_PACKETS_OUT_START && allTools.map((_, i) => {
          const { x, y } = toolPositions[i];
          const cyclePeriod = 55 + i * 7;
          const offset = i * 17;
          const ambientFrame = frame - PHASE_PACKETS_OUT_START + offset;
          const cycleProgress = (ambientFrame % cyclePeriod) / cyclePeriod;
          const inward = i % 2 === 0;
          const fX = inward ? x : CENTER_X;
          const fY = inward ? y : CENTER_Y;
          const tX = inward ? CENTER_X : x;
          const tY = inward ? CENTER_Y : y;
          const pOpacity = interpolate(cycleProgress, [0, 0.08, 0.85, 1], [0, 0.5, 0.5, 0]);

          return (
            <DataPacket
              key={`ambient-${i}`}
              fromX={fX}
              fromY={fY}
              toX={tX}
              toY={tY}
              progress={cycleProgress}
              opacity={pOpacity}
              frame={frame}
              size={3}
              color={inward ? 'blue' : 'amber'}
            />
          );
        })}

      </svg>

      {/* Convergence flash — bright ring that expands and fades (bridge from Execution) */}
      {arrivalFlash > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER_X - 50 * (1 + (1 - arrivalFlash) * 2),
            top: CENTER_Y - 50 * (1 + (1 - arrivalFlash) * 2),
            width: 100 * (1 + (1 - arrivalFlash) * 2),
            height: 100 * (1 + (1 - arrivalFlash) * 2),
            borderRadius: '50%',
            border: `2px solid ${COLORS.amberLight}`,
            opacity: arrivalFlash * 0.7,
            boxShadow: `0 0 ${15 + arrivalFlash * 22}px ${COLORS.amberLight}4D`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Radial ripple wave — expanding amber ring from center every ~45 frames */}
      {pulseActive && (() => {
        const rippleCycle = 45;
        const ripplePhase = ((frame - PHASE_PACKETS_IN_START) % rippleCycle) / rippleCycle;
        const avatarRadius = 32; // half of 64px avatar
        const rippleRadius = avatarRadius + ripplePhase * avatarRadius; // expands to 2x avatar
        const rippleOp = interpolate(ripplePhase, [0, 0.2, 1], [0.35, 0.2, 0]);

        return (
          <div
            style={{
              position: 'absolute',
              left: CENTER_X - rippleRadius,
              top: CENTER_Y - rippleRadius,
              width: rippleRadius * 2,
              height: rippleRadius * 2,
              borderRadius: '50%',
              border: `1.5px solid ${COLORS.amberLight}`,
              opacity: rippleOp,
              pointerEvents: 'none',
            }}
          />
        );
      })()}

      {/* Processing swirl — 4 small dots orbiting center at close range */}
      {pulseActive && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: 1920,
            height: 1080,
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const speed = 0.06 + i * 0.015;
            const angle = (frame * speed + i * Math.PI * 0.5) % (Math.PI * 2);
            const orbitRadius = 38 + i * 3;
            const sx = CENTER_X + Math.cos(angle) * orbitRadius;
            const sy = CENTER_Y + Math.sin(angle) * orbitRadius;
            const swirlOpacity = 0.32 + 0.24 * Math.sin(frame * 0.1 + i * 1.5);

            return (
              <circle
                key={`swirl-${i}`}
                cx={sx}
                cy={sy}
                r={2.5}
                fill={COLORS.amberLight}
                opacity={swirlOpacity}
              />
            );
          })}
        </svg>
      )}

      {/* Center avatar (Tara's real image) — with processing pulse */}
      <CenterAvatar
        opacity={avatarEntrance}
        scale={interpolate(avatarEntrance, [0, 1], [0.5, 1]) * processingPulseScale}
        glowIntensity={avatarGlow}
      />

      {/* Tool icons — pop entrance + continuous bob + micro-bounce on connection */}
      {allTools.map((tool, i) => {
        const { x, y } = toolPositions[i];
        const iconDelay = PHASE_ICON_START + i * STAGGER;

        // Pop entrance: scale 0.5 → 1.1 → 1.0 via spring with overshoot
        const popSpring = spring({
          frame: Math.max(0, frame - iconDelay),
          fps: FPS,
          config: { damping: 8, mass: 0.6, stiffness: 200 },
        });
        const popScale = interpolate(popSpring, [0, 0.6, 1], [0.5, 1.1, 1.0]);

        const iconOpacity = interpolate(
          frame,
          [iconDelay, iconDelay + 10],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        // Continuous orbital drift — each icon slowly circles its base position
        const orbitSpeed = 0.015 + i * 0.003; // slightly different speed per icon
        const orbitRadius = 6 + (i % 3) * 2; // 6-10px orbit radius
        const orbitAngle = frame * orbitSpeed + i * (Math.PI * 2 / allTools.length);
        const floatX = Math.cos(orbitAngle) * orbitRadius;
        const floatY = Math.sin(orbitAngle) * orbitRadius;

        // Micro-bounce when connection line reaches this icon
        const lineArrival = PHASE_LINES_START + i * 4 + PHASE_LINES_DURATION;
        const bounceElapsed = frame - lineArrival;
        let connectionBounce = 1.0;
        if (bounceElapsed >= 0 && bounceElapsed <= 10) {
          connectionBounce = interpolate(
            bounceElapsed,
            [0, 4, 10],
            [1.0, 1.08, 1.0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
        }

        // Gentle breathing — icons subtly pulse in size
        const breathe = 1 + Math.sin(frame * 0.03 + i * 0.8) * 0.04; // ±4% scale
        const finalScale = popScale * connectionBounce * breathe;

        // During output phase, primary tools show output labels
        const isOutputPhase = frame >= PHASE_PACKETS_OUT_START + 30;
        const outputLabelOpacity = isOutputPhase
          ? interpolate(
              frame,
              [PHASE_PACKETS_OUT_START + 30, PHASE_PACKETS_OUT_START + 60],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          : 0;

        const isPrimary = i < allPrimary;
        const altLabel =
          isPrimary && outputLabelOpacity > 0.5
            ? OUTPUT_LABELS[i] ?? tool.label
            : undefined;

        // Activity indicator LED — blinks at different rates per tool
        const ledSpeeds = [0.08, 0.12, 0.06, 0.1, 0.14, 0.07, 0.11, 0.09];
        const ledSpeed = ledSpeeds[i % ledSpeeds.length];
        const ledOffset = i * 1.7;
        const ledOn = frame >= PHASE_LINES_START + PHASE_LINES_DURATION;
        const ledOpacity = ledOn
          ? (Math.sin(frame * ledSpeed + ledOffset) > 0.5 ? 0.9 : 0.3)
          : 0;

        const toolSize = tool.ring === 'primary' ? 56 : 44;

        return (
          <React.Fragment key={`tool-${i}`}>
            <ToolIcon
              tool={tool}
              x={x + floatX}
              y={y + floatY}
              opacity={iconOpacity}
              scale={finalScale}
              altLabel={altLabel}
            />
            {/* Activity LED indicator below tool icon */}
            {ledOn && (
              <div
                style={{
                  position: 'absolute',
                  left: x + floatX - 3,
                  top: y + floatY + toolSize / 2 + 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: COLORS.success,
                  opacity: ledOpacity * iconOpacity,
                  boxShadow: `0 0 3px ${COLORS.success}66`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Pulsing concentric rings — 3 rings with staggered continuous pulse */}
      {[0, 1, 2].map((ringIdx) => {
        const ringStart = PHASE_ICON_START + 10 + ringIdx * 20;
        if (frame < ringStart) return null;

        // Continuous 3-second (90-frame) cycle, staggered per ring
        const cycleOffset = ringIdx * 30; // 1-second stagger between rings
        const ringPulse = ((frame - ringStart + cycleOffset) % 90) / 90;

        // Radius expands outward from center
        const ringRadius = 45 + ringPulse * 110;

        // Opacity peaks early then fades as ring expands
        const ringOp = interpolate(
          ringPulse,
          [0, 0.15, 0.6, 1],
          [0, 0.22, 0.09, 0],
        );

        return (
          <div
            key={`ring-${ringIdx}`}
            style={{
              position: 'absolute',
              left: CENTER_X - ringRadius,
              top: CENTER_Y - ringRadius,
              width: ringRadius * 2,
              height: ringRadius * 2,
              borderRadius: '50%',
              border: `1px solid ${COLORS.amber}`,
              opacity: ringOp,
              boxShadow: `0 0 ${4 + ringPulse * 3}px ${COLORS.amber}1A`,
              transform: `rotate(${ringPulse * 30}deg)`,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* "No new tools. No context-switching." text */}
      {(() => {
        const textOpacity = interpolate(
          frame,
          [PHASE_TEXT_START, PHASE_TEXT_START + 30],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        const textY = interpolate(
          frame,
          [PHASE_TEXT_START, PHASE_TEXT_START + 30],
          [10, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <div
            style={{
              position: 'absolute',
              bottom: 120,
              left: 0,
              right: 0,
              textAlign: 'center',
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 400,
              color: COLORS.textSecondary,
              letterSpacing: '0.02em',
            }}
          >
            No new tools. No context-switching.
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
