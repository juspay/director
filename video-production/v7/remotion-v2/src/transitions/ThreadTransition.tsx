import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AmberThread } from '../components/AmberThread';

export const ThreadTransition: React.FC = () => {
  return (
    <AbsoluteFill>
      <AmberThread direction="left-to-right" drawDuration={20} />
    </AbsoluteFill>
  );
};
