/** @component CodeBlock @origin v8 — extracted to library 2026-03-23 @description Inline code span with monospace font, dark background, and optional line number suffix */
import React from 'react';
import { COLORS, FONTS } from '../theme';

interface CodeBlockProps {
  code: string;
  line?: number;
  style?: React.CSSProperties;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  line,
  style,
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        backgroundColor: '#0d1117',
        borderRadius: 4,
        border: `1px solid ${COLORS.slackBorder}`,
        padding: '2px 6px',
        fontFamily: FONTS.mono,
        fontSize: 13,
        lineHeight: 1.4,
        verticalAlign: 'baseline',
        ...style,
      }}
    >
      <span
        style={{
          color: COLORS.textPrimary,
          fontWeight: 400,
        }}
      >
        {code}
      </span>

      {line !== undefined && (
        <span
          style={{
            color: COLORS.textMuted,
            fontWeight: 400,
            marginLeft: 2,
          }}
        >
          :{line}
        </span>
      )}
    </span>
  );
};
