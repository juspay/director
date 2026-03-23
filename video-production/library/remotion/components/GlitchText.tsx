/**
 * @component GlitchText @origin v8 (IdentityScene.tsx) — extracted to library 2026-03-23
 * @description Digital glitch text transformation with a 5-layer compositing system:
 *
 *   1. **CharacterFlicker** — Per-character random swap between source and target words,
 *      with a left-to-right cascade bias and random glyph substitution during peak corruption.
 *   2. **RGBSplit** — Three offset copies of the text in red, green, and blue channels
 *      using mixBlendMode: screen, with jittered per-frame displacement.
 *   3. **ScanLineSlices** — Horizontal clip-path bands with independent sinusoidal jitter
 *      and micro high-frequency displacement for a digital artifact feel.
 *   4. **InterferenceOverlay** — Scrolling repeating-linear-gradient scan lines plus
 *      random bright horizontal bar flashes keyed to intensity.
 *   5. **Aftershock** — Post-resolve micro-glitch flickers (2 bursts) that sell the
 *      "data settling" moment after the transformation completes.
 *
 * The component accepts a GlitchTransition config describing source/target words,
 * colors, and frame timing. It is fully self-contained with no scene-level dependencies.
 */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ── Utility ──────────────────────────────────────────────────────────

/** Deterministic hash for character flicker — reproducible across frames */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Constants ────────────────────────────────────────────────────────

const CHAR_WIDTH = 36; // Approximate monospace character width at fontSize 60
const FONT_SIZE = 60;
const DEFAULT_FPS = 30;

// ── Scan-line slice config ───────────────────────────────────────────

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

// ── Types ────────────────────────────────────────────────────────────

export interface GlitchTransition {
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

// ── Sub-components ───────────────────────────────────────────────────

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
  fontFamily?: string;
}> = ({ text, offset, frame, fontFamily = 'monospace' }) => {
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
            fontFamily,
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
  fontFamily?: string;
}> = ({ text, amplitude, frame, color, fontFamily = 'monospace' }) => {
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
              fontFamily,
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

// ── Main component ───────────────────────────────────────────────────

interface GlitchTextProps {
  transition: GlitchTransition;
  frame: number;
  fps?: number;
  fontFamily?: string;
  /** Spring config for entrance animation */
  entranceSpringConfig?: { damping: number; stiffness: number; mass: number };
  /** Spring config for resolve snap-back */
  resolveSpringConfig?: { damping: number; stiffness: number; mass: number };
}

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
const GlitchText: React.FC<GlitchTextProps> = ({
  transition,
  frame,
  fps = DEFAULT_FPS,
  fontFamily = 'monospace',
  entranceSpringConfig = { damping: 12, stiffness: 200, mass: 0.5 },
  resolveSpringConfig = { damping: 12, stiffness: 300, mass: 0.5 },
}) => {
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
    fps,
    config: entranceSpringConfig,
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
        fps,
        config: resolveSpringConfig,
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

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: entranceOpacity,
        transform: `scale(${entranceScale})`,
      }}
    >
      {/* Layer 1: Character flicker (base text) */}
      <div
        style={{
          position: 'relative',
          fontFamily,
          fontSize: FONT_SIZE,
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
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
        fontFamily={fontFamily}
      />

      {/* Layer 3: Scan-line slice displacement */}
      <ScanLineSlices
        text={isResolved ? targetWord : sourceWord}
        amplitude={scanAmplitude}
        frame={frame}
        color={displayColor}
        fontFamily={fontFamily}
      />

      {/* Layer 4: Interference overlay */}
      <InterferenceOverlay intensity={totalIntensity * 0.8} frame={frame} />
    </div>
  );
};

export default GlitchText;
export { pseudoRandom, CharacterFlicker, RGBSplit, ScanLineSlices, InterferenceOverlay };
