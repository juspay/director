import React, { useEffect } from 'react';
import { Composition, delayRender, continueRender } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { TaraVideo } from './TaraVideo';
import { FPS, DURATION_FRAMES, WIDTH, HEIGHT } from './theme';

const { waitUntilDone: waitInter } = loadInter();
const { waitUntilDone: waitPlayfair } = loadPlayfair();

export const RemotionRoot: React.FC = () => {
  const [handle] = React.useState(() => delayRender());

  useEffect(() => {
    Promise.all([waitInter(), waitPlayfair()]).then(() => {
      continueRender(handle);
    });
  }, [handle]);

  return (
    <Composition
      id="TaraVideoV2"
      component={TaraVideo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
