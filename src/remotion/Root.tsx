import React from 'react';
import { Composition, staticFile } from 'remotion';
import HippocampusVideo from '../../video-production/library/remotion/scenes/hippocampus/HippocampusComposition';
import TaraSkillsVideo from '../../video-production/library/remotion/scenes/tara-skills/TaraSkillsComposition';

const FPS = 30;
const TAIL_FRAMES = 6;
const DEFAULT_SCENE_SECONDS = 4;

const HIPPOCAMPUS_SCENES = [
  '01-title', '02-problem', '03-solution', '04-learning', '05-api', '06-storage',
  '07-models', '08-locomo', '09-moat', '10-usedby', '11-vision', '12-outro',
] as const;

const TARA_SKILLS_SCENES = [
  '01-title', '02-what', '03-commands', '04-flow', '05-scope',
  '06-example1', '07-example2', '08-example3', '09-coming-soon', '10-outro',
] as const;

const sceneFramesFor = (durations: Record<string, number>, sceneOrder: readonly string[]) =>
  sceneOrder.map((id) =>
    Math.max(1, Math.round((durations[id] ?? DEFAULT_SCENE_SECONDS) * FPS) + TAIL_FRAMES),
  );

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

const defaultDurations = (sceneOrder: readonly string[]) =>
  Object.fromEntries(sceneOrder.map((id) => [id, DEFAULT_SCENE_SECONDS]));

const defaultHippocampusFrames = sceneFramesFor(defaultDurations(HIPPOCAMPUS_SCENES), HIPPOCAMPUS_SCENES);
const defaultTaraSkillsFrames = sceneFramesFor(defaultDurations(TARA_SKILLS_SCENES), TARA_SKILLS_SCENES);

const loadDurations = async (videoName: string, sceneOrder: readonly string[]) => {
  try {
    const res = await fetch(staticFile(`voiceover/${videoName}/durations.json`));
    if (!res.ok) return null;
    const durations = (await res.json()) as Record<string, number>;
    return sceneFramesFor(durations, sceneOrder);
  } catch {
    return null;
  }
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Hippocampus"
      component={HippocampusVideo}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={sum(defaultHippocampusFrames)}
      defaultProps={{ sceneFrames: defaultHippocampusFrames }}
      calculateMetadata={async () => {
        const sceneFrames = await loadDurations('hippocampus', HIPPOCAMPUS_SCENES);
        if (!sceneFrames) return {};
        return { durationInFrames: sum(sceneFrames), props: { sceneFrames } };
      }}
    />
    <Composition
      id="TaraSkills"
      component={TaraSkillsVideo}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={sum(defaultTaraSkillsFrames)}
      defaultProps={{ sceneFrames: defaultTaraSkillsFrames }}
      calculateMetadata={async () => {
        const sceneFrames = await loadDurations('tara-skills', TARA_SKILLS_SCENES);
        if (!sceneFrames) return {};
        return { durationInFrames: sum(sceneFrames), props: { sceneFrames } };
      }}
    />
  </>
);
