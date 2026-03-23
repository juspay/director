# Music Direction — Tara Announcement Video

**Date:** 2026-03-09
**Purpose:** Music generation prompt and timing spec for the background score
**Tools:** ElevenLabs Music or Beatoven.ai
**Video runtime:** ~3:40

---

## Overall Musical Identity

| Property | Value |
|----------|-------|
| Genre | Modern cinematic / warm electronic |
| Tempo | 100-120 BPM (varies by section) |
| Key | C major or G major (warm, open tonality) |
| Duration | 3 minutes 40 seconds |
| Dynamics | Wide range: near-silence at 2:45, full build at 3:05 |
| Reference tracks | Hans Zimmer "Time" (warmth), Jon Hopkins "Open Eye Signal" (texture), Apple keynote music (energy) |

### Key Instruments

- **Soft piano:** Warm, slightly reverbed, carries the melodic theme in Acts 1-2 and 8
- **Ambient synth pads:** Wide stereo, evolving textures, present throughout as emotional glue
- **Light percussion:** Soft kicks, rimshots, shakers — enters in Act 5 stories, builds through Act 6
- **Subtle strings:** Legato violins/cellos for emotional swells, used sparingly
- **Electronic bass:** Warm sub-bass, gentle pulse, enters during Act 5
- **Atmospheric textures:** Reversed piano hits, granular synthesis, tape hiss — for transitions

---

## Energy Map with Timing Markers

```
Energy Level (1-10)

10 |                                          *****
 9 |                                         *     *
 8 |                                        *       *
 7 |                    ****               *         *
 6 |                   *    ****          *           *
 5 |        *****     *         *        *             *
 4 |       *     *   *           *      *               ****
 3 |      *       * *             *    *
 2 |     *         *               *  *
 1 | ***                            **
 0 |__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|
   0:00  0:20  0:40  1:00  1:20  1:45  2:15  2:35  3:05 3:20 3:40
   Hook  Vision Problem Meet   Stories...          Numbers  Roadmap CTA
```

### Section-by-Section Breakdown

#### 0:00 - 0:20 | Act 1: The Hook
- **Energy:** 1-3 (rising)
- **Mood:** Anticipation, intrigue
- **Instruments:** Single sustained synth pad note, barely audible. A Slack notification "bloop" sound is the first beat. Music enters slowly with a single piano note after "That happened." Gentle build.
- **Note:** The Slack notification sound at 0:00 is a sound effect, not part of the music. Music proper starts at ~0:12.

#### 0:20 - 0:40 | Act 2: The Vision
- **Energy:** 4-5 (warm plateau)
- **Mood:** Hopeful, nostalgic, collaborative
- **Instruments:** Soft piano melody (simple, 4-5 notes repeating), wide ambient synth pad, very subtle shaker percussion. Strings enter lightly at 0:30.
- **Tempo:** ~100 BPM, relaxed feel
- **Key moment (0:35):** Brief pause/breath as "Coder. Engineer. Builder." text appears, then music resumes with slightly more confidence.

#### 0:40 - 1:00 | Act 3: The Problem
- **Energy:** 5-7 (building tension)
- **Mood:** Anxious, urgent, slightly oppressive
- **Instruments:** Piano drops out. Synth pads shift to minor key / dissonant. Pulsing electronic bass (eighth notes). Faster hi-hat pattern. Distorted, filtered texture layers. Ticking clock element.
- **Tempo:** ~115 BPM, pace increase feels automatic
- **Key moment (0:58-1:00):** Everything cuts to SILENCE. A full 1-second gap of complete quiet. This is the frozen frame / desaturated moment. The silence IS the musical statement.

#### 1:00 - 1:20 | Act 4: Meet Tara
- **Energy:** 3-5 (warm re-entry)
- **Mood:** Relief, warmth, charm
- **Instruments:** A warm chime or music box note breaks the silence at 1:00. Piano returns with a new, slightly more uplifting melody. Synth pads back to major key. Very light percussion (finger snaps or soft kick). The mood should feel like sunlight after rain.
- **Tempo:** ~105 BPM, gentle and welcoming
- **Key moment (1:00):** The chime at the start of this section is critical — it is the emotional pivot of the entire video. It should feel like a door opening.

#### 1:20 - 2:35 | Act 5: The Stories
- **Energy:** 5-7 (building steadily)
- **Mood:** Confident, energized, proving the point
- **Instruments:** Full ensemble enters gradually. Piano melody, synth pads, electronic bass, light drums (kick, snare, hi-hat), subtle strings. Each story section adds a layer:
  - Story A (1:20): Piano + pads + bass
  - Story B (1:45): Add light drums
  - Story C (2:15): Add strings, fuller drum pattern
- **Tempo:** ~110 BPM, steady and driving
- **Key moment (2:05):** When "Make it real" appears on screen — drums briefly drop out for 2 beats, then come back stronger. A momentary breath that gives weight to the words.

#### 2:35 - 3:05 | Act 6: The Numbers
- **Energy:** 7 rising to 10, then DROP to 1
- **Mood:** Triumphant building to stunned silence
- **Instruments:** Full cinematic build. Each number gets a subtle impact/hit (low tom or orchestral stab). Music builds continuously through the stats.
- **Tempo:** ~120 BPM at peak
- **Key moment (2:45-2:47):** "Built by 2 engineers. In their spare time." — ALL music cuts to absolute silence 1 second before this text appears. Zero sound. The silence should last the full 3-second hold on this text. This is the most powerful moment in the video.
- **Key moment (2:50):** "Now imagine what a whole team could do." — A single, very quiet piano note fades in under this text. Just one note. Barely audible. Hold for 2 seconds.

#### 3:05 - 3:20 | Act 7: Roadmap / What's Coming
- **Energy:** 2-4 (mysterious, building)
- **Mood:** Anticipation, mystery, something powering up
- **Instruments:** Low synth drone that slowly rises in pitch. Granular texture (like electricity building). Reversed piano notes. Very subtle sub-bass pulse. A "powering up" or "loading" sound design element that crescendos through the section.
- **Tempo:** No clear beat — ambient and textural
- **Key moment:** Energy should feel like something is being charged up but not yet released.

#### 3:20 - 3:40 | Act 8: CTA / Close
- **Energy:** 4-5 (warm resolution)
- **Mood:** Warm, inviting, complete
- **Instruments:** Piano melody returns (the same theme from Act 2 but with more warmth and confidence). Synth pads. Soft strings. No drums — just warmth. Gentle fade out over the final 5 seconds.
- **Tempo:** ~100 BPM, returning to the opening feel
- **Key moment (3:35-3:40):** Music gently fades to silence as the logo holds. The last audible element should be a single piano note ringing out.

---

## Generation Prompts

### ElevenLabs Music API Prompt

```
A 3-minute-40-second cinematic background score for a product announcement video. The mood progresses from quiet anticipation through warm hopefulness, into anxious tension, then relief and confidence, building to a triumphant climax before dropping to complete silence, then closing with warm resolution.

Style: modern cinematic with warm electronic elements. Instruments: soft piano carrying the main melody, wide ambient synth pads, light electronic percussion entering midway, subtle orchestral strings for emotional moments, warm sub-bass.

The piece starts nearly silent with a single sustained note, builds to warm piano and pads by 20 seconds, shifts to tense pulsing electronic textures at 40 seconds, goes completely silent at 58 seconds for 2 full seconds, then re-enters with a warm chime and gentle piano at 1 minute. Energy builds steadily through a confident middle section with full drums and bass from 1:20 to 2:35. Peak energy at 2:40 with cinematic impact hits, then drops to TOTAL SILENCE at 2:45 for 5 seconds — this silence is the emotional climax. A single quiet piano note at 2:50. Low mysterious ambient drone from 3:05 to 3:20. Warm piano melody resolution from 3:20, fading gently to silence by 3:40.

Tempo: 100-120 BPM, varying by section. Key: C major or G major. No vocals. No aggressive elements. The overall feel should be like an Apple product keynote score — polished, emotional, building, with powerful use of silence.
```

### Beatoven.ai Settings

| Parameter | Value |
|-----------|-------|
| Mood | Inspiring > Hopeful (primary), Tense (Act 3 only) |
| Genre | Cinematic / Electronic |
| Tempo | Medium (100-120 BPM) |
| Energy | Custom timeline (see energy map above) |
| Instruments | Piano, Synth Pads, Light Drums, Strings |
| Duration | 3:40 |

**Beatoven scene markers (if the tool supports them):**

| Timestamp | Scene | Mood Setting |
|-----------|-------|-------------|
| 0:00 | Hook | Calm, Mysterious |
| 0:20 | Vision | Hopeful, Warm |
| 0:40 | Problem | Tense, Urgent |
| 1:00 | Meet Tara | Relief, Warm |
| 1:20 | Stories | Confident, Building |
| 2:35 | Numbers | Triumphant, Peak |
| 2:45 | Silence | Drop to zero |
| 3:05 | Roadmap | Mysterious, Building |
| 3:20 | CTA | Warm, Resolved |

---

## Post-Production Audio Notes

1. **The two silence moments are non-negotiable.** At 0:58 (1 second) and 2:45 (5 seconds), there must be true silence — not just quiet music. These are the emotional anchors of the video.

2. **Voiceover sits on top.** The music should always leave room for Tara's narration. Duck the music 3-6 dB under narrated sections. Non-narrated sections (Acts 6, 7) are where the music can be fullest.

3. **The warm chime at 1:00** can be a separate sound effect layered on top of the generated music if the music generator cannot produce it precisely. Use a music box or celesta sample.

4. **Impact hits for numbers (Act 6)** may need to be added as sound effects in post — a subtle low-frequency thud or orchestral stab timed to each number appearing on screen.

5. **Master loudness:** Target -14 LUFS integrated for the final mix (music + voiceover + SFX), which is standard for online video.
