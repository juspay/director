# Storyboard Timing Map Template

Copied from v7.4 production storyboard. Use this as the reference template for frame-accurate scene planning in future video versions.

**FPS:** 30 | **Total Duration:** ~170s (5100 frames)

---

## Frame-Accurate Scene Breakdown

| Scene | Start (s) | End (s) | Duration (s) | Frames | Narration |
|-------|-----------|---------|-------------|--------|-----------|
| S1: Opening | 0.0 | 8.0 | 8.0 | 0-240 | "Twelve tabs open...clear this morning." |
| S2: Yesterday | 8.0 | 15.0 | 7.0 | 240-450 | "Half of them still open...Nothing connected." |
| S3: History | 15.0 | 25.0 | 10.0 | 450-750 | "There was a time...knowing why things break." |
| S4: Weight | 25.0 | 30.0 | 5.0 | 750-900 | "And carrying the weight when they do." |
| S5: Earned | 30.0 | 32.0 | 2.0 | 900-960 | "You earned that shift." |
| S6: Builder | 32.0 | 38.0 | 6.0 | 960-1140 | "The next one is bigger...what and the why." |
| S7: Gap | 38.0 | 42.0 | 4.0 | 1140-1260 | "The friction isn't in your skill...done." |
| S8: Thesis | 42.0 | 45.0 | 3.0 | 1260-1350 | "Tara closes that gap." |
| S9: Slack | 45.0 | 53.0 | 8.0 | 1350-1590 | "She lives in Slack...Already reading." |
| S10: Investigation | 53.0 | 63.0 | 10.0 | 1590-1890 | "In under a minute...built a plan." |
| S11: Team Intro | 63.0 | 66.0 | 3.0 | 1890-1980 | "And now your team thinks together." |
| S12: Collaboration | 66.0 | 76.0 | 10.0 | 1980-2280 | "A PM scopes it tighter...sharpens the plan." |
| S13: Judgment | 76.0 | 82.0 | 6.0 | 2280-2460 | "The judgment...it moves." |
| S14: Execution | 82.0 | 92.0 | 10.0 | 2460-2760 | "Three repos cloned...where it all started." |
| S15: No Wait | 92.0 | 95.0 | 3.0 | 2760-2850 | "No one waited for anyone." |
| S16: Ecosystem | 95.0 | 107.0 | 12.0 | 2850-3210 | "Tara reads whatever...Everything through Slack." |
| S17: Metrics | 107.0 | 117.0 | 10.0 | 3210-3510 | "Four hundred threads...not days." |
| S18: Next | 117.0 | 121.0 | 4.0 | 3510-3630 | "You already know what to build next." |
| S19: Title Card | 121.0 | 126.0 | 5.0 | 3630-3780 | "Engineers are builders now." |
| S20: Resolution | 126.0 | 137.0 | 11.0 | 3780-4110 | "The implementation...conversation started." |
| S21: Tagline | 137.0 | 143.0 | 6.0 | 4110-4290 | "Tara. Build what matters." |
| S22: Hold | 143.0 | 170.0 | 27.0 | 4290-5100 | (Logo hold + fade) |

---

## BPM-to-Frame Sync Points

| Timestamp | BPM | Beat Duration (frames) | Musical Event |
|-----------|-----|----------------------|---------------|
| 0:00 | 72 | 25.0 | Pad entry |
| 0:08 | 72 | 25.0 | Second note on "Tuesday" |
| 0:33 | 72->74 | 24.3 | **SFX: Plucked string** -- Ab sus4->Ab major |
| 0:42 | 76 | 23.7 | Thread establishing |
| 0:55 | 80 | 22.5 | Bass entry |
| 0:57 | 80 | 22.5 | **SFX: Sub pulse** |
| 1:03 | 82 | 22.0 | Melody entry |
| 1:15 | 84 | 21.4 | Percussion stage 1 |
| 1:20 | 88 | 20.5 | Percussion stage 2 (peak) |
| 1:30 | 88->86 | 20.5->20.9 | **Gorge** -- hi-hat LP 2kHz->800Hz |
| 1:32 | 86 | 20.9 | Rebuild begins |
| 1:50 | 84->80 | 21.4->22.5 | Percussion thins |
| 2:00 | 76 | 23.7 | Single note -- title card |
| 2:05 | 76->72 | 23.7->25.0 | Resolution |
| 2:28 | 72 | 25.0 | **SFX: Optional shimmer** |

---

## Transition Frame Windows

| # | Transition | Frame Start | Frame End | Duration (f) | Technique |
|---|-----------|------------|----------|-------------|-----------|
| T1 | Empty -> buried idea | 0 | 240 | 240 | 0.4s staggered layers, amber flare at f180 |
| T2 | Buried -> gap | 240 | 450 | 210 | Gray settles, points fade (45f opacity ramp) |
| T3 | Gap -> history -> intent | 450 | 750 | 300 | Code -> architecture, 150f transition |
| T4 | Intent -> line -> thread | 1140 | 1350 | 210 | Amber line, plucked string at f990 |
| T5 | Thread -> roles -> plan -> delta -> PRs | 1590 | 2760 | 1170 | Continuous flow sequence |
| T6 | PRs -> ecosystem | 2760 | 2850 | 90 | Organic extension on "connects" |
| T7 | Ecosystem -> typo -> dots -> title -> constellation -> logo | 3210 | 4290 | 1080 | Sequential dissolve, hard cut at f3630 |

---

## Key Visual Sync Points (Frame-Accurate)

| Frame | Time | Visual Event | Narration Word |
|-------|------|-------------|----------------|
| 180 | 6.0s | Amber flare (0.3s = 9 frames) | "this morning" |
| 240 | 8.0s | Gray layers settle | "Half of them" |
| 330 | 11.0s | Decision point fade in (L) | "Context scattered" |
| 375 | 12.5s | Done point fade in (R) | "Nothing connected" |
| 750 | 25.0s | Architecture diagram holds | "things break" |
| 780 | 26.0s | Amber throb begins | "carrying the weight" |
| 990 | 33.0s | Plucked string SFX | "gap" (word) |
| 1260 | 42.0s | Amber line completes L->R | "closes that gap" |
| 1710 | 57.0s | Sub pulse SFX | Tendrils retract |
| 1980 | 66.0s | PM message highlights purple | "PM scopes" |
| 2010 | 67.0s | Engineer message highlights blue | "engineer challenges" |
| 2040 | 68.0s | Designer message highlights pink | "designer spots" |
| 2460 | 82.0s | Plan locks, edges extend | "it moves" |
| 3630 | 121.0s | **HARD CUT** -- Title card | "Engineers are builders" |
| 3780 | 126.0s | Title fades, constellation begins | "implementation" |
| 4110 | 137.0s | Constellation -> TARA logo | "Tara" |
| 4170 | 139.0s | "Build what matters." appears | tagline |
