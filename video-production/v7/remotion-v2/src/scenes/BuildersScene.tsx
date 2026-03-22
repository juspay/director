import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, fonts, FPS } from '../theme';

const WORDS: { text: string; delay: number; color: string; inline?: boolean }[] = [
  { text: 'Engineers', delay: 0, color: theme.text.primary },
  { text: 'are', delay: 12, color: theme.text.primary },
  { text: 'builders', delay: 24, color: theme.amber.primary },
  { text: 'now.', delay: 40, color: theme.text.primary, inline: true },
];

export const BuildersScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.canvas.dark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {WORDS.map((word, i) => {
        const adjusted = Math.max(0, frame - word.delay);
        const progress = spring({
          frame: adjusted,
          fps: FPS,
          config: springs.snappy,
        });
        const blur = interpolate(progress, [0, 1], [8, 0]);

        // "now." appears inline after "builders"
        if (word.inline) {
          return null; // Rendered inline below
        }

        return (
          <div
            key={i}
            style={{
              fontFamily: fonts.serif,
              fontSize: 72,
              color: word.color,
              opacity: progress,
              filter: `blur(${blur}px)`,
              lineHeight: 1.3,
            }}
          >
            {word.text}
            {/* Render "now." inline after "builders" */}
            {word.text === 'builders' && (() => {
              const nowAdj = Math.max(0, frame - 40);
              const nowProg = spring({
                frame: nowAdj,
                fps: FPS,
                config: springs.gentle,
              });
              return (
                <span
                  style={{
                    color: theme.text.primary,
                    opacity: nowProg,
                    marginLeft: 16,
                  }}
                >
                  now.
                </span>
              );
            })()}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
