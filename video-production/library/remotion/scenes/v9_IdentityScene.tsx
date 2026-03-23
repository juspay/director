/**
 * @reference-scene IdentityScene
 * @origin v9 — extracted to library 2026-03-23
 * @demonstrates Alternative glitch with GLSL pseudoRandom
 * @dependencies React, remotion (useCurrentFrame, interpolate, spring, AbsoluteFill, Img, staticFile), ../theme (COLORS, FONTS, SPRINGS), ../timing (FPS, TRANSITION_FRAMES)
 */
import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  AbsoluteFill,
  Img,
  staticFile,
} from 'remotion';
import { COLORS, FONTS, SPRINGS } from '../theme';
import { FPS, TRANSITION_FRAMES } from '../timing';

/**
 * Scene 7: IdentityScene — Glitch/Data-Corruption Transformation
 *
 * "Coder becomes engineer. Engineer becomes builder."
 *
 * Visual: Each word transformation uses a digital glitch effect —
 * RGB channel separation, scan-line slice displacement, character
 * flickering between source/target, and interference overlay.
 * The text is literally being rewritten at the data level.
 *
 * Then: subtext → logo with real avatar → tagline hold.
 * This is the final scene — no fade out.
 */

// ── Constants ─────────────────────────────────────────────────────────

const CHAR_WIDTH = 36; // Approximate monospace character width at fontSize 60
const FONT_SIZE = 60;

/** Deterministic hash for character flicker — reproducible across frames */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Transition config ─────────────────────────────────────────────────

interface GlitchTransition {
  sourceWord: string;
  targetWord: string;
  sourceColor: string;
  targetColor: string;
  /** Frame (local to scene) when this word first appears clean */
  appearFrame: number;
  /** Frame when glitch begins (destabilize) */
  glitchStartFrame: number;
  /** Frame when target word is fully resolved */
  resolveFrame: number;
}

const TRANSITIONS: GlitchTransition[] = [
  {
    sourceWord: 'Coder',
    targetWord: 'Engineer',
    sourceColor: COLORS.textMuted,
    targetColor: COLORS.white,
    appearFrame: TRANSITION_FRAMES,
    glitchStartFrame: TRANSITION_FRAMES + 40,
    resolveFrame: TRANSITION_FRAMES + 75,
  },
  {
    sourceWord: 'Engineer',
    targetWord: 'Builder',
    targetColor: COLORS.amber,
    sourceColor: COLORS.white,
    appearFrame: TRANSITION_FRAMES + 75,
    glitchStartFrame: TRANSITION_FRAMES + 120,
    resolveFrame: TRANSITION_FRAMES + 155,
  },
];

// "Builder" stays visible from its resolve frame until logo dissolve
const BUILDER_APPEAR = TRANSITIONS[1].resolveFrame;

const SUBTEXT_START = 170;
const LOGO_START = 260;

// ── Scan-line slice config ────────────────────────────────────────────

const SLICE_COUNT = 5;
const SLICES = Array.from({ length: SLICE_COUNT }, (_, i) => ({
  top: (i / SLICE_COUNT) * 100,
  bottom: ((SLICE_COUNT - 1 - i) / SLICE_COUNT) * 100,
  /** Each slice gets a different jitter frequency for organic feel */
  freq: 3.5 + i * 1.7,
  /** Phase offset so slices don't move in sync */
  phase: i * 2.1,
  /** Direction alternates */
  dir: i % 2 === 0 ? 1 : -1,
}));

// ── Sub-components ────────────────────────────────────────────────────

/**
 * CharacterFlicker — renders text char-by-char, randomly swapping
 * between source and target characters during the glitch phase.
 */
const CharacterFlicker: React.FC<{
  source: string;
  target: string;
  /** 0 = all source, 1 = all target */
  progress: number;
  frame: number;
  color: string;
  targetColor: string;
}> = ({ source, target, progress, frame, color, targetColor }) => {
  // Pad shorter word with spaces so both have same length
  const maxLen = Math.max(source.length, target.length);
  const paddedSource = source.padEnd(maxLen);
  const paddedTarget = target.padEnd(maxLen);

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      {Array.from({ length: maxLen }, (_, i) => {
        // Deterministic per-char per-frame randomness
        const rand = pseudoRandom(frame * 73 + i * 137);

        // Each character has its own threshold for flipping
        // Earlier characters tend to flip first (left-to-right cascade)
        const charBias = i / maxLen;
        const threshold = 1 - progress + charBias * 0.2;

        const showTarget = rand > threshold;
        const char = showTarget ? paddedTarget[i] : paddedSource[i];
        const charColor = showTarget ? targetColor : color;

        // Random glitch characters during peak corruption (progress 0.3-0.7)
        let displayChar = char;
        if (progress > 0.3 && progress < 0.7) {
          const glitchRand = pseudoRandom(frame * 31 + i * 97);
          if (glitchRand < progress * 0.3) {
            // Show a random symbol instead
            const glitchChars = '!@#$%^&*<>{}[]|/\\~`_+=';
            const idx = Math.floor(pseudoRandom(frame * 53 + i * 211) * glitchChars.length);
            displayChar = glitchChars[idx];
          }
        }

        // Opacity: space chars are invisible
        const isSpace = char === ' ' && !showTarget;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: CHAR_WIDTH,
              textAlign: 'center',
              color: charColor,
              opacity: isSpace ? 0 : 1,
              // Micro-jitter per character during corruption
              transform:
                progress > 0.2 && progress < 0.8
                  ? `translateY(${Math.sin(frame * 5 + i * 3) * progress * 3}px)`
                  : 'none',
            }}
          >
            {displayChar}
          </span>
        );
      })}
    </span>
  );
};

/**
 * RGBSplit — three copies of the text offset horizontally in R, G, B.
 * Uses mixBlendMode: screen over a black background.
 */
const RGBSplit: React.FC<{
  text: string;
  offset: number;
  baseColor: string;
  frame: number;
}> = ({ text, offset, frame }) => {
  if (offset < 0.5) return null;

  // Jittered offsets for more organic feel
  const jitterX = Math.sin(frame * 7.3) * offset * 0.3;
  const jitterY = Math.cos(frame * 5.1) * offset * 0.15;

  const channels: Array<{ color: string; x: number; y: number; opacity: number }> = [
    { color: '#ff4444', x: -offset + jitterX, y: -jitterY, opacity: 0.85 },
    { color: '#44ff44', x: jitterX * 0.5, y: jitterY, opacity: 0.6 },
    { color: '#4444ff', x: offset + jitterX, y: jitterY * 0.7, opacity: 0.85 },
  ];

  return (
    <>
      {channels.map((ch, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.mono,
            fontSize: FONT_SIZE,
            fontWeight: 700,
            color: ch.color,
            letterSpacing: '0.02em',
            lineHeight: 1,
            transform: `translate(${ch.x}px, ${ch.y}px)`,
            mixBlendMode: 'screen',
            opacity: ch.opacity,
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      ))}
    </>
  );
};

/**
 * ScanLineSlices — the text split into horizontal bands,
 * each with independent horizontal jitter displacement.
 */
const ScanLineSlices: React.FC<{
  text: string;
  amplitude: number;
  frame: number;
  color: string;
}> = ({ text, amplitude, frame, color }) => {
  if (amplitude < 0.5) return null;

  return (
    <>
      {SLICES.map((slice, i) => {
        const jitter =
          Math.sin(frame * slice.freq + slice.phase) *
          amplitude *
          slice.dir;

        // Additional high-frequency jitter for digital feel
        const microJitter =
          Math.sin(frame * 11.3 + i * 7.9) * amplitude * 0.3;

        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZE,
              fontWeight: 700,
              color,
              letterSpacing: '0.02em',
              lineHeight: 1,
              clipPath: `inset(${slice.top}% 0 ${slice.bottom}% 0)`,
              transform: `translateX(${jitter + microJitter}px)`,
              pointerEvents: 'none',
            }}
          >
            {text}
          </span>
        );
      })}
    </>
  );
};

/**
 * InterferenceOverlay — horizontal scan lines + noise that scroll
 * vertically during the glitch phase.
 */
const InterferenceOverlay: React.FC<{
  intensity: number;
  frame: number;
}> = ({ intensity, frame }) => {
  if (intensity < 0.01) return null;

  const scrollY = frame * 4;

  // Horizontal glitch bars — random bright flashes across the screen
  const barY = (pseudoRandom(frame * 17) * 100);
  const barHeight = 2 + pseudoRandom(frame * 31) * 4;
  const barOpacity = intensity * 0.4;

  return (
    <>
      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(255,255,255,0.06) 3px,
            rgba(255,255,255,0.06) 4px
          )`,
          transform: `translateY(${scrollY % 4}px)`,
          opacity: intensity,
          pointerEvents: 'none',
        }}
      />
      {/* Random bright horizontal bar flash */}
      {intensity > 0.3 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${barY}%`,
            height: barHeight,
            background: `rgba(255,255,255,${barOpacity})`,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

/**
 * GlitchText — the main glitch transformation component.
 *
 * Orchestrates all 5 layers:
 * 1. Base text (character flicker between source/target)
 * 2. RGB channel split (3 color-separated copies)
 * 3. Scan-line slices (horizontal bands with jitter)
 * 4. Interference overlay (scrolling scanlines)
 * 5. Aftershock micro-glitches after resolve
 */
const GlitchText: React.FC<{
  transition: GlitchTransition;
  frame: number;
}> = ({ transition, frame }) => {
  const {
    sourceWord,
    targetWord,
    sourceColor,
    targetColor,
    appearFrame,
    glitchStartFrame,
    resolveFrame,
  } = transition;

  // Not visible yet
  if (frame < appearFrame) return null;

  const glitchDuration = resolveFrame - glitchStartFrame;
  const peakFrame = glitchStartFrame + glitchDuration * 0.6;

  // ── Phase calculations ────────────────────────────────────────────

  // Clean entrance (appear → glitchStart)
  const entranceSpring = spring({
    frame: Math.max(0, frame - appearFrame),
    fps: FPS,
    config: SPRINGS.snappy,
  });
  const entranceOpacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  const entranceScale = interpolate(entranceSpring, [0, 1], [0.9, 1]);

  // Glitch intensity envelope: 0 → peak → 0
  let glitchIntensity = 0;
  if (frame >= glitchStartFrame && frame < resolveFrame) {
    const glitchProgress = (frame - glitchStartFrame) / glitchDuration;
    // Asymmetric envelope: builds slower, resolves faster
    if (glitchProgress < 0.6) {
      // Build phase — ease in
      glitchIntensity = interpolate(
        glitchProgress,
        [0, 0.3, 0.6],
        [0, 0.4, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    } else {
      // Resolve phase — snap back quickly
      const resolveSpring = spring({
        frame: frame - Math.round(peakFrame),
        fps: FPS,
        config: { damping: 12, stiffness: 300, mass: 0.5 },
      });
      glitchIntensity = interpolate(resolveSpring, [0, 1], [1, 0]);
    }
  }

  // Character flicker progress (0 = all source, 1 = all target)
  const flickerProgress = interpolate(
    frame,
    [glitchStartFrame, peakFrame, resolveFrame],
    [0, 0.5, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // After resolve — show target word clean, but with aftershock glitches
  const isResolved = frame >= resolveFrame;

  // Aftershock: 2-3 tiny glitch flickers after resolution
  let aftershockIntensity = 0;
  if (isResolved) {
    const afterFrame = frame - resolveFrame;
    // Aftershock 1: frames 5-7
    if (afterFrame >= 5 && afterFrame <= 7) {
      aftershockIntensity = interpolate(afterFrame, [5, 6, 7], [0, 0.25, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    // Aftershock 2: frames 12-13
    if (afterFrame >= 12 && afterFrame <= 13) {
      aftershockIntensity = interpolate(afterFrame, [12, 13], [0.15, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  const totalIntensity = Math.max(glitchIntensity, aftershockIntensity);

  // Which word to display as the base text
  const displayWord = isResolved ? targetWord : sourceWord;
  const displayColor = isResolved ? targetColor : sourceColor;

  // RGB split offset (pixels) — aggressive for visibility on dark bg
  const rgbOffset = totalIntensity * 12;

  // Scan-line amplitude (pixels) — bigger displacement for drama
  const scanAmplitude = totalIntensity * 35;

  // Builder glow (only after second transition resolves)
  const isBuilder = targetWord === 'Builder' && isResolved;
  let builderGlow = 0;
  if (isBuilder) {
    const glowFrame = frame - resolveFrame;
    builderGlow = interpolate(
      glowFrame,
      [0, 20, 50],
      [0, 1, 0.75],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  // Opacity for next transition exit
  const nextTransition = TRANSITIONS.find((t) => t.sourceWord === targetWord);
  let exitOpacity = 1;
  if (nextTransition && frame >= nextTransition.glitchStartFrame) {
    // This word is being glitched away — the next GlitchText takes over
    exitOpacity = 0;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: entranceOpacity * exitOpacity,
        transform: `scale(${entranceScale})`,
      }}
    >
      {/* Layer 1: Character flicker (base text) */}
      <div
        style={{
          position: 'relative',
          fontFamily: FONTS.mono,
          fontSize: FONT_SIZE,
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
          textShadow: isBuilder && builderGlow > 0
            ? `0 0 ${14 + builderGlow * 20}px ${COLORS.amberLight}88, 0 0 ${35 + builderGlow * 30}px ${COLORS.amber}44`
            : 'none',
        }}
      >
        {/* During glitch: character-level flicker */}
        {!isResolved && frame >= glitchStartFrame ? (
          <CharacterFlicker
            source={sourceWord}
            target={targetWord}
            progress={flickerProgress}
            frame={frame}
            color={sourceColor}
            targetColor={targetColor}
          />
        ) : (
          <span style={{ color: displayColor }}>{displayWord}</span>
        )}
      </div>

      {/* Layer 2: RGB channel split */}
      <RGBSplit
        text={displayWord}
        offset={rgbOffset}
        baseColor={displayColor}
        frame={frame}
      />

      {/* Layer 3: Scan-line slice displacement */}
      <ScanLineSlices
        text={isResolved ? targetWord : sourceWord}
        amplitude={scanAmplitude}
        frame={frame}
        color={displayColor}
      />

      {/* Layer 4: Interference overlay */}
      <InterferenceOverlay intensity={totalIntensity * 0.8} frame={frame} />
    </div>
  );
};

// ── TaraLogo (preserved from previous version) ───────────────────────

const TaraLogo: React.FC<{
  opacity: number;
  scale: number;
  glowIntensity: number;
}> = ({ opacity, scale, glowIntensity }) => {
  const avatarSrc = staticFile('avatar/tara.png');
  const avatarSize = 80;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Avatar with amber glow */}
      <div
        style={{
          position: 'relative',
          width: avatarSize,
          height: avatarSize,
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: -24,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.amberLight}${Math.round(glowIntensity * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Subtle border glow */}
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.amberLight}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}, ${COLORS.amber}${Math.round(glowIntensity * 40).toString(16).padStart(2, '0')})`,
            pointerEvents: 'none',
          }}
        />
        {/* Actual avatar image */}
        <Img
          src={avatarSrc}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>

      {/* "TARA" text */}
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 36,
          fontWeight: 300,
          color: COLORS.white,
          letterSpacing: '0.28em',
          lineHeight: 1,
        }}
      >
        TARA
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 400,
          color: COLORS.textSecondary,
          letterSpacing: '0.04em',
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        Build what matters.
      </div>
    </div>
  );
};

// ── Main scene ────────────────────────────────────────────────────────

export const IdentityScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Entrance opacity (NO exit — this is the final scene) ─────────

  const entranceOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Logo phase ───────────────────────────────────────────────────

  const isLogoPhase = frame >= LOGO_START;

  // ── Subtext: "Less time typing. More time thinking." ─────────────

  const subtextOpacity = interpolate(
    frame,
    [SUBTEXT_START, SUBTEXT_START + 30, LOGO_START - 30, LOGO_START],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const subtextY = interpolate(
    frame,
    [SUBTEXT_START, SUBTEXT_START + 30],
    [10, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Logo / tagline ───────────────────────────────────────────────

  const logoSpring = spring({
    frame: Math.max(0, frame - LOGO_START),
    fps: FPS,
    config: SPRINGS.slow,
  });

  const logoOpacity = interpolate(
    frame,
    [LOGO_START, LOGO_START + 40],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const logoScale = interpolate(logoSpring, [0, 1], [0.9, 1]);

  const logoGlow = interpolate(
    frame,
    [LOGO_START, LOGO_START + 90],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Word visibility: dissolve to logo ────────────────────────────

  const wordsDissolve = interpolate(
    frame,
    [LOGO_START - 40, LOGO_START],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        opacity: entranceOpacity,
      }}
    >
      {/* Glitch word transformation layer */}
      <AbsoluteFill style={{ opacity: wordsDissolve }}>
        {/* Center container for words — upper area */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '55%',
          }}
        >
          {TRANSITIONS.map((t) => (
            <GlitchText key={t.sourceWord} transition={t} frame={frame} />
          ))}

          {/* "Builder" clean hold after both transitions complete */}
          {frame >= BUILDER_APPEAR && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.mono,
                fontSize: FONT_SIZE,
                fontWeight: 700,
                color: COLORS.amber,
                letterSpacing: '0.02em',
                lineHeight: 1,
                textShadow: `0 0 20px ${COLORS.amberLight}66, 0 0 40px ${COLORS.amber}33`,
              }}
            >
              Builder
            </div>
          )}
        </div>

        {/* Subtext below word area */}
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
            fontFamily: FONTS.sans,
            fontSize: 26,
            fontWeight: 400,
            color: COLORS.textSecondary,
            letterSpacing: '0.02em',
            lineHeight: 1.6,
          }}
        >
          Less time typing. More time thinking.
        </div>
      </AbsoluteFill>

      {/* Logo / tagline layer */}
      {isLogoPhase && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TaraLogo
            opacity={logoOpacity}
            scale={logoScale}
            glowIntensity={logoGlow}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
