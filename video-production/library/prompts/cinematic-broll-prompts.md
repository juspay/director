# Cinematic B-Roll Prompts — Runway Gen-4 Turbo

**Date:** 2026-03-09
**Purpose:** Generate cinematic establishing shots and transitions for the Tara announcement video
**Tool:** Runway Gen-4 Turbo (text-to-video, 5-10 second clips)

---

## Prompt Structure

Every prompt follows the 7-element structure for cinematic consistency:

1. **Camera type / shot size** (e.g., "35mm lens, medium wide shot")
2. **Subject** (what we see)
3. **Action** (what is happening)
4. **Camera movement** (dolly, pan, static, etc.)
5. **Lighting** (color temperature, direction, quality)
6. **Visual style** (film stock look, color grading)
7. **Mood** (emotional tone)

---

## Act 2 — The Vision (Warm, Collaborative)

**Continuity tag (append to every Act 2 prompt):**
```
cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel, 24fps film grain
```

**Scene intent:** Hopeful, collaborative, golden hour energy. Engineers working together on meaningful problems. The feeling of "we asked a question and now we're building the answer."

### Variation A — Whiteboard Session

```
35mm anamorphic lens, medium wide shot. A small team of engineers gathered around a glass whiteboard in a modern open office. One person is drawing a system architecture diagram while others watch and point. Slow dolly push-in toward the whiteboard. Warm amber sunlight streams through floor-to-ceiling windows from the left, casting long golden shadows. Soft teal fill light from overhead. Shallow depth of field with anamorphic bokeh on background lights. Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel, 24fps film grain. Hopeful, collaborative, golden hour atmosphere.
```

### Variation B — Screen Collaboration

```
35mm anamorphic lens, close-up rack focus. Two developers sitting side by side, one pointing at lines of code on a widescreen monitor while the other nods and types. Focus racks from the code on screen to the warm expressions on their faces. Warm amber backlighting from a sunset-lit window behind them, creating a golden rim around their silhouettes. Ambient teal glow from the monitors. Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel, 24fps film grain. Warm, collaborative, purposeful.
```

### Variation C — Walking and Talking

```
35mm anamorphic lens, medium tracking shot. Two engineers walking through a sunlit office corridor, one holding a laptop and gesturing while explaining something, the other listening intently. Slow tracking dolly following them from slightly ahead and to the side. Golden hour light pours through windows on the right, painting warm amber stripes across the hallway. Shallow depth of field. Cinematic, warm amber color grading with soft teal shadows, anamorphic bokeh, 35mm lens feel, 24fps film grain. Optimistic, forward-moving, purposeful energy.
```

---

## Act 3 — The Problem (Cold, Overwhelming)

**Continuity tag (append to every Act 3 prompt):**
```
cinematic, cool blue-grey desaturated tones, shallow depth of field, motion blur, 35mm lens, slightly handheld feel
```

**Scene intent:** Anxious, fast-paced, slightly claustrophobic. The feeling of drowning in tabs, notifications, and context-switching. The audience should viscerally feel "yes, I know this feeling."

### Variation A — Tab Overload

```
35mm lens, extreme close-up. A developer's face illuminated only by the cold blue-white glow of a monitor, eyes darting back and forth rapidly across the screen. Reflected in their glasses: dozens of overlapping browser tabs. Subtle handheld camera shake. Cool blue-grey light from the screen is the only light source, casting harsh shadows. Background is dark and out of focus. Cinematic, cool blue-grey desaturated tones, shallow depth of field, motion blur, 35mm lens, slightly handheld feel. Anxious, overwhelmed, isolated.
```

### Variation B — Notification Storm

```
35mm lens, medium shot, slight Dutch angle. A developer sitting at a desk surrounded by multiple monitors. Slack notifications, email popups, and calendar alerts appear on screen one after another in rapid succession. The developer rubs their temples with both hands. Cold fluorescent overhead lighting with no warmth. Monitor glow creates blue-grey shadows on their face. Slow zoom-in. Cinematic, cool blue-grey desaturated tones, shallow depth of field, motion blur, 35mm lens, slightly handheld feel. Overwhelming, stressful, claustrophobic.
```

### Variation C — Context Switch Montage

```
35mm lens, rapid intercut close-ups with motion blur transitions. Quick cuts between: fingers typing on a keyboard, a cursor clicking between browser tabs, a Slack unread badge counter incrementing, a code review with dozens of comments, a clock showing time passing. Each shot is 0.5-1 second with whip-pan motion blur between them. Cold blue-grey lighting throughout, slightly underexposed. Cinematic, cool blue-grey desaturated tones, shallow depth of field, motion blur, 35mm lens, slightly handheld feel. Frantic, relentless, disorienting pace.
```

---

## Transition Shots

These are 3-5 second clips used between acts or as visual bridges.

### Transition 1 — Warm Light Particles

```
Macro lens, extreme close-up. Abstract floating particles of warm golden light drifting slowly through dark space, like illuminated dust motes in a sunbeam. Particles flow gently from left to right with subtle depth — some particles close and out of focus, others sharp in the midground. Slow gentle camera drift forward. Deep black background with warm amber and soft gold particles. No recognizable objects, purely abstract. Cinematic, warm amber tones, shallow depth of field, dreamy bokeh. Ethereal, hopeful, transitional.
```

### Transition 2 — Code with Warm Backlighting

```
35mm lens, medium close-up. Lines of code scrolling slowly upward on a dark-themed code editor, reflected on a glass surface in the foreground. Behind the monitor, warm amber light glows softly, creating a golden halo around the edges of the screen. The code is slightly out of focus — the warm light behind it is the subject. Slow dolly forward. Cinematic, warm amber backlighting against cool blue code, anamorphic lens flare. Contemplative, elegant, the beauty in building.
```

### Transition 3 — Messaging Interface

```
35mm lens, close-up over-the-shoulder shot. A Slack-like messaging interface on a laptop screen, with a new message appearing with a subtle slide-in animation. A typing indicator pulses gently. The message contains a friendly response. Warm ambient lighting from the side. Shallow depth of field — the person's shoulder is a soft blur in the foreground. Slow subtle push-in. Cinematic, warm tones with soft blue monitor glow, gentle. Connected, responsive, alive.
```

---

## Production Notes

### Runway Gen-4 Turbo Settings

| Setting | Recommended Value |
|---------|------------------|
| Duration | 5 seconds (extend to 10 in post if needed) |
| Aspect ratio | 16:9 |
| Resolution | 1080p |
| Motion | Medium (Acts 2 transitions), High (Act 3 montage) |
| Camera motion | Use built-in controls for dolly/pan where available |

### Color Grading Continuity

To maintain visual consistency across all generated clips:

- **Act 2 LUT:** Warm amber highlights (lift: +10 amber), teal shadows (gamma: +5 teal), slightly lifted blacks, soft contrast
- **Act 3 LUT:** Desaturated blues (saturation: -30%), cool white balance (shift: -15 toward blue), crushed blacks, higher contrast
- **Transitions:** Match the act they transition INTO (e.g., transition before Act 3 should already start cooling down)

### Iteration Strategy

1. Generate 3 variations of each prompt
2. Select the best for motion quality and mood
3. Apply the corresponding LUT in DaVinci Resolve or FFmpeg
4. Trim to exact timing needed (most clips will be 3-5 seconds in the final edit)
5. If Runway produces unwanted artifacts (extra fingers, morphing faces), try:
   - Adding "photorealistic" to the prompt
   - Reducing motion intensity
   - Using a still image as the first frame reference
