/**
 * CreativePromptSchema — AI-generated optimized prompts for each pipeline phase.
 * The Creative Director agent analyzes the script and generates targeted prompts
 * for TTS delivery, B-roll generation, music mood, and SFX placement.
 */
import { z } from 'zod';

const ScenePromptSchema = z.object({
  scene_id: z.string().describe('Scene identifier (e.g., act1_hook)'),
  tts_delivery: z.string().describe('Natural language delivery instruction for OpenAI TTS (e.g., "Quiet, intimate, let the number land")'),
  tts_emphasis_words: z.array(z.string()).describe('Words to emphasize in this scene'),
  broll_prompt: z.string().describe('Cinematic B-roll generation prompt (for Kling/Runway/Veo)'),
  broll_camera: z.string().describe('Camera direction: dolly in, pan left, static wide, etc.'),
  music_mood: z.string().describe('Music mood for this section (contemplative, energetic, etc.)'),
  music_energy: z.number().describe('Energy level 0.0-1.0 for this section'),
  sfx_suggestions: z.array(z.string()).describe('Sound effects to place in this scene'),
  transition_notes: z.string().describe('How to transition into the next scene'),
});

export const CreativePromptSchema = z.object({
  project_title: z.string().describe('Video project title'),
  overall_tone: z.string().describe('Overall tonal direction for the video'),
  color_palette: z.string().describe('Recommended color palette description'),
  music_key: z.string().describe('Recommended musical key (e.g., Ab major)'),
  music_bpm_start: z.number().describe('Starting BPM'),
  music_bpm_peak: z.number().describe('Peak BPM'),
  music_bpm_end: z.number().describe('Ending BPM'),
  scenes: z.array(ScenePromptSchema).describe('Per-scene creative direction'),
  silence_moments: z.array(z.string()).describe('Timestamps for strategic silence (e.g., "0:58 for 1s")'),
});

export type CreativePrompt = z.infer<typeof CreativePromptSchema>;
