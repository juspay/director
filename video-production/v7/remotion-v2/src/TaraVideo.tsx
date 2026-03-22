import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
} from 'remotion';
import { theme, FPS } from './theme';
import { SCENES, SceneEntry } from './timing';
import { AbstractScene } from './scenes/AbstractScene';
import { ScreenshotScene } from './scenes/ScreenshotScene';
import { ThesisScene } from './scenes/ThesisScene';
import { MetricsScene } from './scenes/MetricsScene';
import { BuildersScene } from './scenes/BuildersScene';
import { TaglineScene } from './scenes/TaglineScene';
import { ThreadTransition } from './transitions/ThreadTransition';
import { FadeBlackTransition } from './transitions/FadeBlackTransition';
import { MorphTransition } from './transitions/MorphTransition';

const musicVolume = (frame: number): number => {
  const t = frame / FPS;
  if (t < 2) return interpolate(t, [0, 2], [0, 0.12]);
  if (t < 15) return 0.12;
  if (t < 34) return 0.15;
  if (t < 36) return 0.08;
  if (t < 55) return 0.18;
  if (t < 58) return 0.10;
  if (t < 78) return 0.15;
  if (t < 96) return 0.12;
  if (t < 123) return 0.18;
  if (t < 130) return 0.08;
  if (t < 136) return 0.22;
  if (t < 140) return 0.20;
  return interpolate(t, [140, 146], [0.15, 0], { extrapolateRight: 'clamp' });
};

const SceneRouter: React.FC<{ scene: SceneEntry }> = ({ scene }) => {
  switch (scene.category) {
    case 'abstract':
      return <AbstractScene clip={scene.asset} textOverlay={scene.textOverlay} />;
    case 'screenshot':
      return <ScreenshotScene sceneId={scene.id} screenshot={scene.asset} />;
    case 'special':
      if (scene.id === '06c_thesis_closer') return <ThesisScene />;
      if (scene.id === '15_metrics') return <MetricsScene />;
      if (scene.id === '18_builders') return <BuildersScene />;
      return <AbstractScene clip={scene.asset} />;
    case 'closing':
      return <TaglineScene />;
  }
};

const TransitionRouter: React.FC<{ to: SceneEntry }> = ({ to }) => {
  switch (to.transition) {
    case 'fadeBlack':
      return <FadeBlackTransition />;
    case 'morph':
      return <MorphTransition />;
    case 'thread':
    default:
      return <ThreadTransition />;
  }
};

export const TaraVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.canvas.dark }}>
      {/* Audio layers */}
      <Audio src={staticFile('voiceover/tara-v7-newvoice_v1.mp3')} />
      <Audio src={staticFile('music/tara_v74_music.wav')} volume={musicVolume} />

      {/* Scene sequences */}
      {SCENES.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneRouter scene={scene} />
        </Sequence>
      ))}

      {/* Transition overlays */}
      {SCENES.slice(1).map((scene, i) => {
        const prev = SCENES[i];
        const overlapStart = prev.startFrame + prev.durationFrames - 12;
        return (
          <Sequence
            key={`transition-${scene.id}`}
            from={overlapStart}
            durationInFrames={24}
          >
            <TransitionRouter to={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
