# Locked Roadmap Frame — Visual Design Specification (Act 7)

**Date:** 2026-03-09
**Purpose:** Exact visual spec for the "locked roadmap" static frame shown in Act 7 (3:05-3:20)
**Design intent:** The audience sees 7 upcoming items but cannot read most of them. Creates intrigue, not information. No one should be able to screenshot this and extract the full roadmap.

---

## Layout Specification

### Canvas

| Property | Value |
|----------|-------|
| Dimensions | 1920 x 1080 px (16:9) |
| Background | Radial gradient: center `#0A0E1A` (near-black navy), edges `#050810` (true dark) |
| Ambient glow | Soft radial gradient overlay centered at 50% 45%: `rgba(37, 99, 235, 0.06)` blended with `rgba(217, 119, 6, 0.04)` — creates a barely visible blue-gold warmth in the center |

### Grid Layout

The 7 items are arranged in a **2-row grid** with slight stagger:

```
Row 1 (y: 260px):  [Item 1]    [Item 2]    [Item 3]    [Item 4]
Row 2 (y: 560px):       [Item 5]    [Item 6]    [Item 7]
```

| Property | Value |
|----------|-------|
| Item card size | 320 x 240 px |
| Column gap | 60 px |
| Row gap | 60 px |
| Row 1 left offset | 140 px (4 items centered) |
| Row 2 left offset | 330 px (3 items centered, staggered) |
| Card border radius | 16 px |
| Card background | `rgba(255, 255, 255, 0.03)` with `1px solid rgba(255, 255, 255, 0.05)` |

### Item Card Internal Layout

Each card contains, top to bottom:

1. **Icon area** (top center): 80 x 80 px, centered horizontally, 24px from top
2. **Label text** (below icon): Centered, 16px below icon area
3. **Progress bar** (bottom): 240 px wide, 4 px tall, centered, 20px from bottom

---

## Item Details

### Item 1: Self-Debugging (20% visible)

| Property | Value |
|----------|-------|
| Position | Row 1, Column 1 |
| Icon | Brain silhouette with a small magnifying glass overlay |
| Icon color | `rgba(96, 165, 250, 0.25)` (faint blue, 25% opacity) |
| Icon treatment | 80% covered by gradient mask (top-to-bottom fade to black starting at 20% height) |
| Label text | "Self-Deb..." (first 8 characters visible, rest masked) |
| Label color | `rgba(255, 255, 255, 0.18)` |
| Progress bar fill | 20% filled with `rgba(96, 165, 250, 0.3)` |
| Progress bar track | `rgba(255, 255, 255, 0.05)` |
| Card glow | Very faint blue glow: `box-shadow: 0 0 30px rgba(96, 165, 250, 0.08)` |

### Item 2: Self-Healing (0% visible)

| Property | Value |
|----------|-------|
| Position | Row 1, Column 2 |
| Icon | Circular arrows / heartbeat line (fully obscured) |
| Icon color | `rgba(255, 255, 255, 0.04)` (barely visible dark shape) |
| Icon treatment | 100% covered by dark mask — only the vaguest rectangular shape visible |
| Label text | Fully hidden — show only a dark rectangle placeholder (160 x 14 px, `rgba(255, 255, 255, 0.04)`) |
| Progress bar fill | 0% — empty track only |
| Progress bar track | `rgba(255, 255, 255, 0.03)` |
| Card glow | None |

### Item 3: Lightweight Execution Pods (0% visible)

| Property | Value |
|----------|-------|
| Position | Row 1, Column 3 |
| Icon | Container/pod shape (fully obscured) |
| Icon color | `rgba(255, 255, 255, 0.04)` |
| Icon treatment | 100% covered by dark mask |
| Label text | Fully hidden — dark rectangle placeholder (200 x 14 px) |
| Progress bar fill | 0% |
| Progress bar track | `rgba(255, 255, 255, 0.03)` |
| Card glow | None |

### Item 4: YAMA (20% visible)

| Property | Value |
|----------|-------|
| Position | Row 1, Column 4 |
| Icon | Scales of justice silhouette |
| Icon color | `rgba(251, 191, 36, 0.2)` (faint gold/amber, 20% opacity) |
| Icon treatment | 80% covered by gradient mask (similar to Item 1) |
| Label text | "YA..." (first 2 characters visible, rest masked) |
| Label color | `rgba(255, 255, 255, 0.15)` |
| Progress bar fill | 20% filled with `rgba(251, 191, 36, 0.25)` |
| Progress bar track | `rgba(255, 255, 255, 0.05)` |
| Card glow | Very faint gold glow: `box-shadow: 0 0 30px rgba(251, 191, 36, 0.06)` |

### Item 5: Automatic Integration (0% visible)

| Property | Value |
|----------|-------|
| Position | Row 2, Column 1 |
| Icon | Puzzle pieces / chain links (fully obscured) |
| Icon color | `rgba(255, 255, 255, 0.04)` |
| Icon treatment | 100% covered |
| Label text | Fully hidden placeholder (180 x 14 px) |
| Progress bar fill | 0% |
| Card glow | None |

### Item 6: Xyne Integration (0% visible)

| Property | Value |
|----------|-------|
| Position | Row 2, Column 2 |
| Icon | Messaging/chat platform icon (fully obscured) |
| Icon color | `rgba(255, 255, 255, 0.04)` |
| Icon treatment | 100% covered |
| Label text | Fully hidden placeholder (160 x 14 px) |
| Progress bar fill | 0% |
| Card glow | None |

### Item 7: Phase 1.5 (0% visible)

| Property | Value |
|----------|-------|
| Position | Row 2, Column 3 |
| Icon | Star / mystery shape — only the faintest outline visible |
| Icon color | `rgba(255, 255, 255, 0.03)` |
| Icon treatment | 100% covered, outline only at 3% opacity |
| Label text | Fully hidden placeholder (120 x 14 px) |
| Progress bar fill | 0% |
| Card glow | None |

---

## Easter Egg: "Tara Built Tara" Tease

| Property | Value |
|----------|-------|
| Position | Bottom-right corner, 60px from right edge, 40px from bottom |
| Icon | Tiny star icon, 16 x 16 px |
| Icon color | `rgba(251, 191, 36, 0.06)` |
| Text | "Ta..." (only these 3 characters visible) |
| Text size | 11px |
| Text color | `rgba(255, 255, 255, 0.05)` |
| Masking | 95% gradient mask from right, leaving only the first ~3 characters barely legible |
| Intent | Someone who pauses and squints might see "Ta..." next to a star — hinting at "Tara built Tara" — but it should be nearly invisible in normal viewing |

---

## Footer Text

| Property | Value |
|----------|-------|
| Text | "Phase 1.5 starts after this." |
| Position | Bottom center, 80px from bottom edge |
| Font size | 14px |
| Font weight | 400 (regular) |
| Color | `rgba(255, 255, 255, 0.25)` |
| Letter spacing | 2px |
| Text transform | None |

---

## Color Reference

| Name | Hex / RGBA | Usage |
|------|-----------|-------|
| Background center | `#0A0E1A` | Canvas center |
| Background edge | `#050810` | Canvas edges |
| Blue glow | `rgba(37, 99, 235, 0.06)` | Ambient center glow |
| Gold glow | `rgba(217, 119, 6, 0.04)` | Ambient center glow |
| Faint blue (20% items) | `rgba(96, 165, 250, 0.25)` | Self-Debugging icon/bar |
| Faint gold (20% items) | `rgba(251, 191, 36, 0.2)` | YAMA icon/bar |
| Dark shape (0% items) | `rgba(255, 255, 255, 0.04)` | Fully obscured icons and labels |
| Card border | `rgba(255, 255, 255, 0.05)` | Card outline |
| Card background | `rgba(255, 255, 255, 0.03)` | Card fill |
| Progress track | `rgba(255, 255, 255, 0.03-0.05)` | Empty progress bars |
| Footer text | `rgba(255, 255, 255, 0.25)` | "Phase 1.5 starts after this." |

---

## CSS/HTML Implementation

This can be rendered as a static HTML page and screenshot at 1920x1080 using Puppeteer or a browser.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1920, height=1080">
<title>Tara Roadmap — Act 7</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    background: radial-gradient(ellipse at 50% 45%, #0A0E1A 0%, #050810 100%);
    position: relative;
  }

  /* Ambient blue-gold center glow */
  body::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    width: 900px;
    height: 600px;
    background: radial-gradient(
      ellipse,
      rgba(37, 99, 235, 0.06) 0%,
      rgba(217, 119, 6, 0.04) 40%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
  }

  .grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .card {
    position: absolute;
    width: 320px;
    height: 240px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }

  .card.glow-blue {
    box-shadow: 0 0 30px rgba(96, 165, 250, 0.08);
  }

  .card.glow-gold {
    box-shadow: 0 0 30px rgba(251, 191, 36, 0.06);
  }

  .icon-area {
    width: 80px;
    height: 80px;
    margin-top: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .icon-area svg {
    width: 60px;
    height: 60px;
  }

  /* Gradient mask for 20% visible items — covers top 80% */
  .mask-80 {
    position: relative;
  }
  .mask-80::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 18%,
      rgba(10, 14, 26, 0.7) 25%,
      rgba(10, 14, 26, 0.95) 40%,
      #0A0E1A 60%
    );
    pointer-events: none;
    border-radius: 16px;
  }

  /* Full dark mask for 0% items */
  .mask-100::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10, 14, 26, 0.97);
    pointer-events: none;
    border-radius: 16px;
  }

  .label {
    margin-top: 16px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-align: center;
    white-space: nowrap;
  }

  .label-visible {
    color: rgba(255, 255, 255, 0.18);
  }

  .label-hidden {
    width: 160px;
    height: 14px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 4px;
  }

  .progress-bar {
    position: absolute;
    bottom: 20px;
    width: 240px;
    height: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
  }

  .progress-fill.blue {
    background: rgba(96, 165, 250, 0.3);
  }

  .progress-fill.gold {
    background: rgba(251, 191, 36, 0.25);
  }

  /* Row 1 positions */
  .card-1 { left: 140px; top: 260px; }
  .card-2 { left: 520px; top: 260px; }
  .card-3 { left: 900px; top: 260px; }
  .card-4 { left: 1280px; top: 260px; }

  /* Row 2 positions (staggered) */
  .card-5 { left: 330px; top: 560px; }
  .card-6 { left: 710px; top: 560px; }
  .card-7 { left: 1090px; top: 560px; }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 2px;
    z-index: 2;
  }

  /* Easter egg */
  .easter-egg {
    position: absolute;
    bottom: 40px;
    right: 60px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 2;
  }

  .easter-egg .star {
    width: 16px;
    height: 16px;
    opacity: 0.06;
  }

  .easter-egg .hint-text {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.05);
    letter-spacing: 0.5px;
    /* Gradient mask: visible on left, fades to invisible */
    -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0) 50%);
    mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0) 50%);
  }
</style>
</head>
<body>

<div class="grid">

  <!-- Item 1: Self-Debugging (20% visible) -->
  <div class="card card-1 glow-blue mask-80">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <!-- Brain silhouette -->
        <ellipse cx="28" cy="28" rx="18" ry="20" fill="rgba(96, 165, 250, 0.25)"/>
        <path d="M28 8c-10 0-18 8-18 20s8 20 18 20 18-8 18-20S38 8 28 8z" fill="rgba(96, 165, 250, 0.2)"/>
        <!-- Magnifying glass -->
        <circle cx="42" cy="42" r="10" stroke="rgba(96, 165, 250, 0.3)" stroke-width="2.5" fill="none"/>
        <line x1="49" y1="49" x2="57" y2="57" stroke="rgba(96, 165, 250, 0.3)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="label label-visible">Self-Deb...</div>
    <div class="progress-bar">
      <div class="progress-fill blue" style="width: 20%;"></div>
    </div>
  </div>

  <!-- Item 2: Self-Healing (0% visible) -->
  <div class="card card-2 mask-100">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <path d="M30 10 A20 20 0 1 1 30 50 A20 20 0 1 1 30 10" stroke="rgba(255,255,255,0.04)" stroke-width="3" fill="none"/>
        <polyline points="15,30 25,30 30,20 35,40 40,30 50,30" stroke="rgba(255,255,255,0.04)" stroke-width="2" fill="none"/>
      </svg>
    </div>
    <div class="label"><div class="label-hidden" style="width: 160px;"></div></div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>

  <!-- Item 3: Lightweight Execution Pods (0% visible) -->
  <div class="card card-3 mask-100">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <rect x="12" y="15" width="36" height="30" rx="4" stroke="rgba(255,255,255,0.04)" stroke-width="2.5" fill="none"/>
        <line x1="12" y1="25" x2="48" y2="25" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
        <circle cx="18" cy="20" r="2" fill="rgba(255,255,255,0.04)"/>
        <circle cx="25" cy="20" r="2" fill="rgba(255,255,255,0.04)"/>
      </svg>
    </div>
    <div class="label"><div class="label-hidden" style="width: 200px;"></div></div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>

  <!-- Item 4: YAMA (20% visible) -->
  <div class="card card-4 glow-gold mask-80">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <!-- Scales of justice -->
        <line x1="30" y1="8" x2="30" y2="50" stroke="rgba(251, 191, 36, 0.2)" stroke-width="2.5"/>
        <line x1="12" y1="20" x2="48" y2="20" stroke="rgba(251, 191, 36, 0.2)" stroke-width="2.5"/>
        <path d="M12 20 L8 35 L16 35 Z" fill="rgba(251, 191, 36, 0.15)"/>
        <path d="M48 20 L44 35 L52 35 Z" fill="rgba(251, 191, 36, 0.15)"/>
        <line x1="22" y1="50" x2="38" y2="50" stroke="rgba(251, 191, 36, 0.2)" stroke-width="2.5"/>
      </svg>
    </div>
    <div class="label label-visible" style="color: rgba(255,255,255,0.15);">YA...</div>
    <div class="progress-bar">
      <div class="progress-fill gold" style="width: 20%;"></div>
    </div>
  </div>

  <!-- Item 5: Automatic Integration (0% visible) -->
  <div class="card card-5 mask-100">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <rect x="8" y="18" width="18" height="18" rx="3" stroke="rgba(255,255,255,0.04)" stroke-width="2" fill="none"/>
        <rect x="34" y="24" width="18" height="18" rx="3" stroke="rgba(255,255,255,0.04)" stroke-width="2" fill="none"/>
        <path d="M26 27 L34 33" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
      </svg>
    </div>
    <div class="label"><div class="label-hidden" style="width: 180px;"></div></div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>

  <!-- Item 6: Xyne Integration (0% visible) -->
  <div class="card card-6 mask-100">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <rect x="10" y="12" width="40" height="36" rx="6" stroke="rgba(255,255,255,0.04)" stroke-width="2" fill="none"/>
        <line x1="18" y1="24" x2="42" y2="24" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
        <line x1="18" y1="32" x2="36" y2="32" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
        <line x1="18" y1="40" x2="30" y2="40" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
      </svg>
    </div>
    <div class="label"><div class="label-hidden" style="width: 160px;"></div></div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>

  <!-- Item 7: Phase 1.5 (0% visible) -->
  <div class="card card-7 mask-100">
    <div class="icon-area">
      <svg viewBox="0 0 60 60" fill="none">
        <!-- Star outline only -->
        <polygon points="30,8 35,22 50,22 38,32 42,46 30,37 18,46 22,32 10,22 25,22"
                 stroke="rgba(255,255,255,0.03)" stroke-width="1.5" fill="none"/>
      </svg>
    </div>
    <div class="label"><div class="label-hidden" style="width: 120px;"></div></div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>

</div>

<!-- Footer -->
<div class="footer">Phase 1.5 starts after this.</div>

<!-- Easter egg -->
<div class="easter-egg">
  <svg class="star" viewBox="0 0 16 16" fill="rgba(251, 191, 36, 0.06)">
    <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6"/>
  </svg>
  <span class="hint-text">Tara built Tara</span>
</div>

</body>
</html>
```

### Rendering as an Image

Use Puppeteer (which is already a project dependency) to screenshot the HTML:

```javascript
const puppeteer = require('puppeteer');

async function renderRoadmap() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('file:///path/to/roadmap.html');
  await page.screenshot({
    path: 'roadmap-act7.png',
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1920, height: 1080 }
  });
  await browser.close();
}

renderRoadmap();
```

This produces a 3840x2160 (4K) image due to `deviceScaleFactor: 2`, which can be downscaled to 1920x1080 for the video or used at full resolution for print/zoom.

---

## Figma Recreation Spec

For recreating this frame in Figma:

### Frame Setup
- Frame: 1920 x 1080, fill `#050810`
- Add a radial fill layer: center `#0A0E1A`, edge `#050810`, radius 120%

### Ambient Glow Layer
- Ellipse: 900 x 600 px, centered at (960, 486)
- Fill: radial gradient from `rgba(37, 99, 235, 0.06)` center to transparent edge
- Blend mode: Screen
- Add second ellipse (same size/position): radial gradient from `rgba(217, 119, 6, 0.04)` to transparent
- Blend mode: Screen

### Card Component
- Create a component "Roadmap Card" with variants:
  - **State:** `revealed-20` / `hidden-0`
  - **Accent:** `blue` / `gold` / `none`
- Auto layout: vertical, 24px top padding, center aligned
- Size: 320 x 240, corner radius 16
- Fill: `rgba(255, 255, 255, 0.03)`
- Stroke: 1px `rgba(255, 255, 255, 0.05)`

### Masking (for 20% visible items)
- Place a rectangle over the card: 320 x 240
- Fill: linear gradient top-to-bottom:
  - 0%: transparent
  - 18%: transparent
  - 25%: `rgba(10, 14, 26, 0.7)`
  - 40%: `rgba(10, 14, 26, 0.95)`
  - 60%: `#0A0E1A` (opaque)
- This reveals the top ~20% of the card content

### Masking (for 0% visible items)
- Place a rectangle over the card: 320 x 240
- Fill: `rgba(10, 14, 26, 0.97)`
- This hides everything but leaves the card border faintly visible

### Progress Bar Component
- Track: 240 x 4 px, corner radius 2, fill `rgba(255, 255, 255, 0.03)`
- Fill: nested rectangle, height 4, corner radius 2
  - Width: percentage of 240 (e.g., 48px for 20%)
  - Fill: accent color at 25-30% opacity

### Typography
- Font: Inter (or SF Pro Display)
- Label (visible): 15px Medium, `rgba(255, 255, 255, 0.18)`
- Footer: 14px Regular, letter-spacing 2px, `rgba(255, 255, 255, 0.25)`
- Easter egg: 11px Regular, `rgba(255, 255, 255, 0.05)`

### Layer Order (bottom to top)
1. Background frame fill
2. Ambient glow ellipses (Screen blend)
3. 7 card instances
4. 7 mask rectangles (one per card)
5. Footer text
6. Easter egg group (star + text)

---

## Animation Notes (for video)

This is designed as a static frame held for 15 seconds (3:05-3:20). However, two subtle animations can be added in post:

1. **Slow ambient glow pulse:** The blue-gold center glow very slowly breathes (opacity oscillates between 0.04 and 0.08 over 4 seconds). Barely noticeable but makes the frame feel alive.

2. **Progress bar shimmer:** A faint white highlight (2px wide, 10% opacity) slowly sweeps left-to-right across the 20%-filled progress bars once during the 15-second hold. Like a loading indicator.

These can be achieved with CSS animation on the HTML version or with keyframe animation in After Effects / DaVinci Resolve.
