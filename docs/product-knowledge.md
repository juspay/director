# Director (Tara's Video Production Pipeline)

Director is a 7-phase TypeScript pipeline:
1. Voiceover — multi-provider TTS (ElevenLabs, OpenAI, Edge-TTS, Google TTS, Fish)
2. Avatar — D-ID lip-sync from a portrait
3. B-roll — Veo 3.1, Runway, Kling, or NeuroLink Director Mode
4. Music — NumPy DSP, Beatoven, ElevenLabs Music, or Lyria
5. Render — Remotion (local or Lambda)
6. Assembly — FFmpeg with NeuroLink mergeVideoBuffers
7. Captions — Whisper transcription + soft mux subtitles

Quality gates run after every pipeline:
- 7 LLM scorers in parallel (faithfulness, hallucination, bias, toxicity, etc.)
- Optional multi-judge consensus via 3 models + 2 judges
