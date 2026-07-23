import React from 'react';
import { Composition } from 'remotion';
import { Smoke } from './Smoke';
import { RecurlyHyperswitch } from './RecurlyHyperswitch';
import { DUR, FPS, W, H } from './scene/theme';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="RecurlyHyperswitch"
        component={RecurlyHyperswitch}
        durationInFrames={DUR}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition id="Smoke" component={Smoke} durationInFrames={30} fps={30} width={720} height={900} />
    </>
  );
};
