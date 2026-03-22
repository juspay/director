import React, { useState } from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from 'remotion';
import { TypingCursor } from '../components/TypingCursor';
import { TaraAvatar } from '../components/TaraAvatar';
import { theme, springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

interface ScreenshotSceneProps {
  sceneId: string;
  screenshot: string;
}

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  sceneId,
  screenshot,
}) => {
  const frame = useCurrentFrame();
  const [error, setError] = useState(false);

  if (error) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: 'magenta',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 32,
          color: 'white',
        }}
      >
        MISSING: {screenshot}
      </AbsoluteFill>
    );
  }

  const anim = getAnimations(sceneId, frame);

  return (
    <AbsoluteFill>
      {/* Screenshot background with optional zoom/pan */}
      <div
        style={{
          position: 'absolute',
          width: WIDTH,
          height: HEIGHT,
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(`screenshots/${screenshot}`)}
          style={{
            width: WIDTH,
            height: HEIGHT,
            objectFit: 'cover',
            transform: `scale(${anim.bgScale}) translateY(${anim.bgTranslateY}%)`,
          }}
          onError={() => setError(true)}
        />
      </div>

      {/* Subtle dark vignette for polish */}
      <div
        style={{
          position: 'absolute',
          width: WIDTH,
          height: HEIGHT,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Animated overlays */}
      {anim.overlays.map((overlay, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...overlay.style,
          }}
        />
      ))}

      {/* Typing cursor if scene uses it */}
      {anim.cursor && (
        <TypingCursor
          x={anim.cursor.x}
          y={anim.cursor.y}
          path={anim.cursor.path}
        />
      )}

      {/* Avatar on select scenes */}
      {anim.showAvatar && <TaraAvatar delay={10} />}
    </AbsoluteFill>
  );
};

interface OverlayDef {
  style: React.CSSProperties;
}

interface AnimResult {
  bgScale: number;
  bgTranslateY: number;
  overlays: OverlayDef[];
  cursor?: { x: number; y: number; path?: [number, number, number][] };
  showAvatar: boolean;
}

function getAnimations(sceneId: string, frame: number): AnimResult {
  switch (sceneId) {
    case '04_history':
      return history(frame);
    case '07_slack_thread':
      return slackThread(frame);
    case '08_investigation':
      return investigation(frame);
    case '10_team_collab':
      return teamCollab(frame);
    case '11a_plan_forms':
      return planForms(frame);
    case '12a_execution':
      return execution(frame);
    case '12b_prs':
      return prs(frame);
    case '13_ecosystem':
      return ecosystem(frame);
    default:
      return { bgScale: 1, bgTranslateY: 0, overlays: [], showAvatar: false };
  }
}

// --- Per-scene animation functions ---
// Each returns overlay divs positioned over specific regions.
// Bounding box coordinates are approximate — refine by visual inspection in Remotion Studio.

function history(frame: number): AnimResult {
  // Pan from top + gentle zoom
  const panY = interpolate(frame, [0, 30], [-2, 0], { extrapolateRight: 'clamp' });
  const zoomIn = interpolate(frame, [0, 30], [1.02, 1.0], { extrapolateRight: 'clamp' });
  const zoomLate = interpolate(frame, [240, 367], [1.0, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bgScale = frame < 240 ? zoomIn : zoomLate;

  // Message blocks fade in with spring gentle
  const msg1Progress = spring({
    frame: Math.max(0, frame - 30),
    fps: FPS,
    config: springs.gentle,
  });
  const msg1Opacity = msg1Progress;
  const msg1Y = interpolate(msg1Progress, [0, 1], [10, 0]);

  // Code highlight pulse
  const codeGlow = frame >= 90 && frame <= 150
    ? interpolate(frame, [90, 120, 150], [0, 0.4, 0], { extrapolateRight: 'clamp' })
    : 0;

  // Second message with spring gentle
  const msg2Progress = spring({
    frame: Math.max(0, frame - 150),
    fps: FPS,
    config: springs.gentle,
  });
  const msg2Opacity = msg2Progress;

  return {
    bgScale,
    bgTranslateY: panY,
    overlays: [
      {
        style: {
          left: 100, top: 300, width: 700, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${msg1Opacity * 0.08})`,
          borderLeft: `3px solid rgba(217, 119, 6, ${msg1Opacity * 0.6})`,
          borderRadius: 4,
          transform: `translateY(${msg1Y}px)`,
        },
      },
      {
        style: {
          left: 100, top: 500, width: 800, height: 100,
          boxShadow: `0 0 20px rgba(217, 119, 6, ${codeGlow})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 650, width: 700, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${msg2Opacity * 0.08})`,
          borderLeft: `3px solid rgba(217, 119, 6, ${msg2Opacity * 0.6})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 120,
      y: 320,
      path: [
        [0, 120, 320],
        [150, 120, 520],
        [240, 120, 670],
      ],
    },
    showAvatar: true,
  };
}

function slackThread(frame: number): AnimResult {
  // Search bar glow
  const searchGlow = interpolate(frame, [0, 20], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Results slide in with spring physics
  const result1Progress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.snappy,
  });
  const result1X = interpolate(result1Progress, [0, 1], [-20, 0]);
  const result1Opacity = result1Progress;

  const result2Progress = spring({
    frame: Math.max(0, frame - 35),
    fps: FPS,
    config: springs.snappy,
  });
  const result2X = interpolate(result2Progress, [0, 1], [-20, 0]);
  const result2Opacity = result2Progress;

  // Hover highlight
  const hoverOpacity = interpolate(frame, [140, 160], [0, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle zoom
  const bgScale = interpolate(frame, [180, 241], [1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 300, top: 80, width: 600, height: 50,
          boxShadow: `0 0 15px rgba(217, 119, 6, ${searchGlow})`,
          borderRadius: 8,
        },
      },
      {
        style: {
          left: 300, top: 200, width: 600, height: 80,
          opacity: result1Opacity,
          transform: `translateX(${result1X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.05)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 300, top: 300, width: 600, height: 80,
          opacity: result2Opacity,
          transform: `translateX(${result2X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.05)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 300, top: 200, width: 600, height: 80,
          backgroundColor: `rgba(255, 255, 255, ${hoverOpacity})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 500,
      y: 100,
      path: [
        [0, 500, 100],
        [100, 500, 230],
        [140, 500, 230],
      ],
    },
    showAvatar: true,
  };
}

function investigation(frame: number): AnimResult {
  // Bot header fade
  const headerOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Lines reveal via clipPath
  const linesRevealed = Math.floor(interpolate(frame, [40, 120], [0, 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  // Code highlight
  const codeHighlight = interpolate(frame, [120, 160], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Badges stagger with spring bouncy
  const badge1 = spring({ frame: Math.max(0, frame - 180), fps: FPS, config: springs.bouncy });
  const badge2 = spring({ frame: Math.max(0, frame - 195), fps: FPS, config: springs.bouncy });
  const badge3 = spring({ frame: Math.max(0, frame - 210), fps: FPS, config: springs.bouncy });

  // Slow scroll
  const scrollY = interpolate(frame, [240, 373], [0, -3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: 1,
    bgTranslateY: scrollY,
    overlays: [
      // Bot header
      {
        style: {
          left: 100, top: 100, width: 500, height: 60,
          backgroundColor: `rgba(217, 119, 6, ${headerOpacity * 0.1})`,
          borderRadius: 8,
        },
      },
      // Response lines (revealed progressively)
      ...Array.from({ length: 4 }, (_, i) => ({
        style: {
          left: 100,
          top: 180 + i * 50,
          width: 700,
          height: 40,
          backgroundColor: `rgba(217, 119, 6, ${i < linesRevealed ? 0.06 : 0})`,
          borderLeft: `2px solid rgba(217, 119, 6, ${i < linesRevealed ? 0.4 : 0})`,
          borderRadius: 4,
        },
      })),
      // Code block highlight
      {
        style: {
          left: 120, top: 400, width: 660, height: 80,
          borderLeft: `3px solid rgba(217, 119, 6, ${codeHighlight})`,
          borderRadius: 4,
        },
      },
      // Badges
      ...[badge1, badge2, badge3].map((opacity, i) => ({
        style: {
          left: 100 + i * 200,
          top: 520,
          width: 160,
          height: 36,
          backgroundColor: `rgba(74, 222, 128, ${opacity * 0.15})`,
          border: `1px solid rgba(74, 222, 128, ${opacity * 0.5})`,
          borderRadius: 18,
        },
      })),
    ],
    showAvatar: true,
  };
}

function teamCollab(frame: number): AnimResult {
  // Replies appear with spring gentle
  const reply1Progress = spring({ frame, fps: FPS, config: springs.gentle });
  const reply1X = interpolate(reply1Progress, [0, 1], [-20, 0]);
  const reply1Opacity = reply1Progress;

  // Diff highlights
  const diffHighlight = interpolate(frame, [45, 90], [0, 0.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Second reply with spring gentle
  const reply2Progress = spring({ frame: Math.max(0, frame - 90), fps: FPS, config: springs.gentle });
  const reply2Opacity = reply2Progress;

  // Green diff pulse
  const greenPulse = frame >= 150 && frame <= 210
    ? interpolate(frame, [150, 180, 210], [0, 0.8, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  // Zoom
  const bgScale = interpolate(frame, [210, 326], [1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 80, top: 200, width: 700, height: 100,
          opacity: reply1Opacity,
          transform: `translateX(${reply1X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 400, width: 650, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${diffHighlight})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 80, top: 550, width: 700, height: 100,
          opacity: reply2Opacity,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 120, top: 420, width: 600, height: 30,
          backgroundColor: `rgba(74, 222, 128, ${greenPulse * 0.15})`,
          borderLeft: `3px solid rgba(74, 222, 128, ${greenPulse})`,
          borderRadius: 2,
        },
      },
    ],
    showAvatar: true,
  };
}

function planForms(frame: number): AnimResult {
  // Header zoom
  const headerScale = interpolate(frame, [0, 60], [0.98, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerOpacity = interpolate(frame, [0, 60], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Metric highlights (3 metrics, staggered 20 frames)
  const metrics = [0, 1, 2].map(i => {
    const start = 60 + i * 20;
    const glow = frame >= start && frame <= start + 40
      ? interpolate(frame, [start, start + 20, start + 40], [0, 0.4, 0.1], { extrapolateRight: 'clamp' })
      : 0;
    return glow;
  });

  // Scroll
  const scrollY = interpolate(frame, [120, 180], [0, -4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Header glow
  const headerGlow = interpolate(frame, [180, 210], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: headerScale,
    bgTranslateY: scrollY,
    overlays: [
      {
        style: {
          left: 200, top: 100, width: 600, height: 60,
          opacity: headerOpacity,
          borderRadius: 4,
        },
      },
      ...metrics.map((glow, i) => ({
        style: {
          left: 200 + i * 250,
          top: 350,
          width: 200,
          height: 80,
          boxShadow: `0 0 20px rgba(217, 119, 6, ${glow})`,
          borderRadius: 8,
        },
      })),
      {
        style: {
          left: 200, top: 250, width: 500, height: 3,
          backgroundColor: `rgba(217, 119, 6, ${headerGlow})`,
        },
      },
    ],
    showAvatar: false,
  };
}

function execution(frame: number): AnimResult {
  // Editor chrome fade
  const chromeOpacity = interpolate(frame, [0, 30], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Code lines type in (6 lines, 15 frames each via clipPath-like width reveal)
  const linesTyped = Math.floor(interpolate(frame, [30, 120], [0, 6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  // Terminal pane
  const terminalOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const terminalY = interpolate(frame, [60, 100], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tab switch
  const tab1Active = frame < 120 ? 0.3 : 0;
  const tab2Active = frame >= 120 ? 0.3 : 0;

  return {
    bgScale: 1,
    bgTranslateY: 0,
    overlays: [
      // Chrome opacity
      {
        style: {
          left: 0, top: 0, width: WIDTH, height: 40,
          opacity: chromeOpacity,
        },
      },
      // Code lines revealed
      ...Array.from({ length: 6 }, (_, i) => ({
        style: {
          left: 250,
          top: 120 + i * 35,
          width: i < linesTyped ? 500 : 0,
          height: 24,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, ${i < linesTyped ? 0.3 : 0})`,
          borderRadius: 2,
          overflow: 'hidden' as const,
        },
      })),
      // Terminal pane
      {
        style: {
          left: 200, top: 700, width: 800, height: 200,
          opacity: terminalOpacity,
          transform: `translateY(${terminalY}px)`,
          backgroundColor: `rgba(0, 0, 0, 0.1)`,
          borderTop: '1px solid rgba(217, 119, 6, 0.2)',
          borderRadius: 4,
        },
      },
      // Tab highlights
      {
        style: {
          left: 250, top: 8, width: 120, height: 28,
          backgroundColor: `rgba(217, 119, 6, ${tab1Active})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 380, top: 8, width: 120, height: 28,
          backgroundColor: `rgba(217, 119, 6, ${tab2Active})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 260,
      y: 130,
      path: [
        [0, 260, 130],
        [60, 760, 130],
        [120, 260, 250],
        [200, 760, 250],
      ],
    },
    showAvatar: true,
  };
}

function prs(frame: number): AnimResult {
  // Progress bar 1: 0-45
  const bar1Width = interpolate(frame, [0, 45], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark 1: 45-75
  const check1Scale = frame >= 45
    ? spring({ frame: frame - 45, fps: FPS, config: springs.bouncy })
    : 0;

  // Progress bar 2: 45-90
  const bar2Width = interpolate(frame, [45, 90], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark 2: 90-120
  const check2Scale = frame >= 90
    ? spring({ frame: frame - 90, fps: FPS, config: springs.bouncy })
    : 0;

  // Status glow: 135-185
  const statusGlow = interpolate(frame, [135, 160, 185], [0, 0.4, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: 1,
    bgTranslateY: 0,
    overlays: [
      // Progress bar 1
      {
        style: {
          left: 300, top: 350, width: `${bar1Width}%`,
          maxWidth: 500,
          height: 12,
          backgroundColor: theme.accent.green,
          borderRadius: 6,
          opacity: 0.7,
        },
      },
      // Checkmark 1
      {
        style: {
          left: 820, top: 340,
          width: 30, height: 30,
          borderRadius: '50%',
          backgroundColor: `rgba(74, 222, 128, ${check1Scale * 0.3})`,
          border: `2px solid rgba(74, 222, 128, ${check1Scale})`,
          transform: `scale(${check1Scale})`,
        },
      },
      // Progress bar 2
      {
        style: {
          left: 300, top: 450, width: `${bar2Width}%`,
          maxWidth: 500,
          height: 12,
          backgroundColor: theme.accent.green,
          borderRadius: 6,
          opacity: 0.7,
        },
      },
      // Checkmark 2
      {
        style: {
          left: 820, top: 440,
          width: 30, height: 30,
          borderRadius: '50%',
          backgroundColor: `rgba(74, 222, 128, ${check2Scale * 0.3})`,
          border: `2px solid rgba(74, 222, 128, ${check2Scale})`,
          transform: `scale(${check2Scale})`,
        },
      },
      // Status glow
      {
        style: {
          left: 300, top: 550, width: 500, height: 40,
          boxShadow: `0 0 20px rgba(74, 222, 128, ${statusGlow})`,
          borderRadius: 8,
        },
      },
    ],
    showAvatar: true,
  };
}

function ecosystem(frame: number): AnimResult {
  // Config blocks highlight sequentially
  const block1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const block2 = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Zoom out
  const bgScale = interpolate(frame, [90, 129], [1.02, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 100, top: 250, width: 700, height: 100,
          borderLeft: `3px solid rgba(217, 119, 6, ${block1 * 0.6})`,
          backgroundColor: `rgba(217, 119, 6, ${block1 * 0.06})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 380, width: 700, height: 100,
          borderLeft: `3px solid rgba(217, 119, 6, ${block2 * 0.6})`,
          backgroundColor: `rgba(217, 119, 6, ${block2 * 0.06})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 130,
      y: 270,
      path: [
        [0, 130, 270],
        [30, 130, 400],
        [60, 500, 400],
        [90, 500, 270],
      ],
    },
    showAvatar: false,
  };
}
