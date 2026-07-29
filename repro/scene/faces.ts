import * as THREE from 'three';
import { C, RES } from './theme';
import { RECURLY_ALPHA_RLE, RECURLY_W, RECURLY_H } from './recurlyLogo';

type Ctx = CanvasRenderingContext2D;
const FONT = 'Helvetica, Arial, sans-serif';

/** GPUs handle 8192+, but there is no point exceeding the on-screen footprint. */
const MAX_TEX = 4096;

/**
 * Build a canvas texture at the MASTER resolution.
 *
 * Every face here is authored in 720-era coordinates (a card face is 1024px
 * wide). At the 2160x2700 master a capability card spans ~1435px on screen, so
 * a 1024px texture gets magnified ~1.4x — which is what made icons and labels
 * look pixelated and mushy after the resolution bump. The backing store is
 * scaled by RES and the context pre-scaled to match, so all existing drawing
 * coordinates keep working while the texture actually resolves the master.
 */
function tex(w: number, h: number, draw: (ctx: Ctx) => void): THREE.CanvasTexture {
  const scale = Math.min(RES, MAX_TEX / w, MAX_TEX / h);
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * scale);
  cv.height = Math.round(h * scale);
  const ctx = cv.getContext('2d')!;
  ctx.scale(scale, scale);
  draw(ctx);
  const t = new THREE.CanvasTexture(cv);
  t.anisotropy = 16;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * Pick the largest font size at or below `size` that fits `max` px wide.
 * `track` applies letter-spacing — the reference's labels are noticeably more
 * open than default Helvetica metrics.
 */
function fitFont(ctx: Ctx, text: string, size: number, max: number, weight: string, track = 0): void {
  (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${track}px`;
  let px = size;
  do {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (ctx.measureText(text).width <= max) break;
    px -= 4;
  } while (px > 40);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Deterministic PRNG so every render of every frame produces the identical set.
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Icon glyphs
// ---------------------------------------------------------------------------

const strokeGlyph = (ctx: Ctx, lw: number) => {
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

type IconFn = (ctx: Ctx, s: number) => void;

const icons: Record<string, IconFn> = {
  card: (ctx, s) => {
    strokeGlyph(ctx, s * 0.075);
    roundRect(ctx, s * 0.14, s * 0.28, s * 0.72, s * 0.44, s * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.42);
    ctx.lineTo(s * 0.86, s * 0.42);
    ctx.stroke();
    // little recurring-arrow tick
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.55, s * 0.13, -Math.PI * 0.85, Math.PI * 0.5);
    ctx.stroke();
  },
  refresh: (ctx, s) => {
    strokeGlyph(ctx, s * 0.095);
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.52, s * 0.29, -Math.PI * 0.35, Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.7, s * 0.26);
    ctx.lineTo(s * 0.81, s * 0.35);
    ctx.lineTo(s * 0.66, s * 0.44);
    ctx.closePath();
    ctx.fill();
  },
  globe: (ctx, s) => {
    strokeGlyph(ctx, s * 0.062);
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.33, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.5, s * 0.145, s * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.17, s * 0.5);
    ctx.lineTo(s * 0.83, s * 0.5);
    ctx.moveTo(s * 0.235, s * 0.335);
    ctx.lineTo(s * 0.765, s * 0.335);
    ctx.moveTo(s * 0.235, s * 0.665);
    ctx.lineTo(s * 0.765, s * 0.665);
    ctx.stroke();
  },
};

// ---------------------------------------------------------------------------
// Card faces
// ---------------------------------------------------------------------------

/**
 * Scene-1 pill card: bare icon on the LEFT, two lines of dark text on the RIGHT,
 * plus the faint indigo hairline that runs along the card's lower edge.
 * (The target uses this layout for "Secure Payments" / "Renewal Success" —
 * no badge behind the icon, and the label is charcoal, not indigo.)
 */
export function pillFaceH(
  line1: string,
  line2: string,
  icon: 'shield' | 'ring',
): THREE.CanvasTexture {
  return tex(1024, 620, (ctx) => {
    const cy = 300;
    if (icon === 'shield') {
      // solid indigo shield with a white check
      const s = 210;
      const x = 120;
      const y = cy - s / 2;
      ctx.fillStyle = C.indigo;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y);
      ctx.lineTo(x + s * 0.95, y + s * 0.16);
      ctx.lineTo(x + s * 0.95, y + s * 0.55);
      ctx.quadraticCurveTo(x + s * 0.95, y + s * 0.88, x + s * 0.5, y + s);
      ctx.quadraticCurveTo(x + s * 0.05, y + s * 0.88, x + s * 0.05, y + s * 0.55);
      ctx.lineTo(x + s * 0.05, y + s * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = s * 0.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.5);
      ctx.lineTo(x + s * 0.44, y + s * 0.64);
      ctx.lineTo(x + s * 0.72, y + s * 0.36);
      ctx.stroke();
    } else {
      // gradient indigo ring (progress donut) with a dark check inside
      const r = 96;
      const x = 222;
      const g = ctx.createLinearGradient(x - r, cy - r, x + r, cy + r);
      g.addColorStop(0, '#8fa6ff');
      g.addColorStop(1, C.indigo);
      ctx.strokeStyle = g;
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, cy, r - 15, -Math.PI * 0.5, Math.PI * 1.15);
      ctx.stroke();
      ctx.strokeStyle = C.indigo;
      ctx.lineWidth = 22;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 36, cy + 2);
      ctx.lineTo(x - 8, cy + 30);
      ctx.lineTo(x + 42, cy - 28);
      ctx.stroke();
    }
    ctx.fillStyle = '#3b4250';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    fitFont(ctx, line1.length > line2.length ? line1 : line2, 116, 590, '400', 2);
    ctx.fillText(line1, 386, cy - 60);
    ctx.fillText(line2, 386, cy + 66);
    // indigo hairline along the lower edge of the card
    const hg = ctx.createLinearGradient(60, 0, 964, 0);
    hg.addColorStop(0, 'rgba(70,92,230,0.05)');
    hg.addColorStop(0.4, 'rgba(54,70,230,0.85)');
    hg.addColorStop(1, 'rgba(70,92,230,0.15)');
    ctx.strokeStyle = hg;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(70, 596);
    ctx.lineTo(954, 596);
    ctx.stroke();
  });
}

/**
 * Scene-2 column card: rounded-square indigo badge with a white glyph,
 * centred, with a single indigo label beneath it.
 */
export function capabilityFaceV(
  label: string,
  icon: keyof typeof icons,
  gradient = false,
): THREE.CanvasTexture {
  return tex(1024, 660, (ctx) => {
    const badge = 330;
    const bx = (1024 - badge) / 2;
    const by = 74;
    if (gradient) {
      const g = ctx.createLinearGradient(bx, by, bx + badge, by + badge);
      g.addColorStop(0, '#5a74ff');
      g.addColorStop(1, C.indigo);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = C.indigo;
    }
    roundRect(ctx, bx, by, badge, badge, 62);
    ctx.fill();
    ctx.save();
    ctx.translate(bx + badge * 0.16, by + badge * 0.16);
    icons[icon](ctx, badge * 0.68);
    ctx.restore();
    ctx.fillStyle = C.indigo;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, label, 132, 860, '500', 3);
    ctx.fillText(label, 512, 512);
    const hg = ctx.createLinearGradient(60, 0, 964, 0);
    hg.addColorStop(0, 'rgba(70,92,230,0.05)');
    hg.addColorStop(0.45, 'rgba(54,70,230,0.8)');
    hg.addColorStop(1, 'rgba(70,92,230,0.12)');
    ctx.strokeStyle = hg;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(70, 636);
    ctx.lineTo(954, 636);
    ctx.stroke();
  });
}

/**
 * Official Recurly lockup, painted from its run-length-encoded alpha mask.
 * Fully synchronous, so the mark is present on the very first render.
 */
export function recurlyFace(): THREE.CanvasTexture {
  return tex(RECURLY_W, RECURLY_H, (ctx) => {
    const bin = atob(RECURLY_ALPHA_RLE);
    // Decode onto an offscreen canvas at the mask's native size, then blit.
    // putImageData writes raw device pixels and IGNORES the context transform,
    // so writing it straight into the RES-scaled canvas left the mark filling
    // only the top-left corner — the logo rendered at a third of its size.
    // drawImage respects the transform, so the blit scales correctly.
    const off = document.createElement('canvas');
    off.width = RECURLY_W;
    off.height = RECURLY_H;
    const octx = off.getContext('2d')!;
    const img = octx.createImageData(RECURLY_W, RECURLY_H);
    const d = img.data;
    // Recurly's mark is near-black; the mask carries the shape.
    const [ir, ig, ib] = [22, 26, 34];
    let p = 0;
    for (let i = 0; i < bin.length; i += 2) {
      const a = bin.charCodeAt(i);
      const n = bin.charCodeAt(i + 1);
      for (let k = 0; k < n; k++) {
        const o = p * 4;
        d[o] = ir;
        d[o + 1] = ig;
        d[o + 2] = ib;
        d[o + 3] = a;
        p++;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.drawImage(off, 0, 0, RECURLY_W, RECURLY_H);
  });
}

// Juspay Hyperswitch: white roundel + stacked JUSPAY / hyperswitch, all white.
export function hyperswitchFace(): THREE.CanvasTexture {
  return tex(1536, 512, (ctx) => {
    const cx = 190;
    const cy = 256;
    const r = 118;
    // Solid white disc.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // The mark inside is a BLUE two-fold-symmetric lens with opposing barbs —
    // two arrowheads chasing each other, i.e. a "switch" glyph. The previous
    // version drew a blue disc with a WHITE droplet on top, which inverted the
    // figure/ground AND replaced the arrows with a teardrop. Reference: the
    // target's own lockup frame.
    const rr = r * 0.62;
    const tilt = -0.20; // radians; the mark leans slightly anticlockwise
    const px = Math.sin(tilt);
    const py = -Math.cos(tilt);
    const tipA = [cx + rr * px, cy + rr * py];
    const tipB = [cx - rr * px, cy - rr * py];
    const bulge = rr * 0.60;
    // Perpendicular to the tip axis, for the two opposing bellies.
    const qx = -py;
    const qy = px;
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.moveTo(tipA[0], tipA[1]);
    ctx.quadraticCurveTo(cx + qx * bulge, cy + qy * bulge, tipB[0], tipB[1]);
    ctx.quadraticCurveTo(cx - qx * bulge, cy - qy * bulge, tipA[0], tipA[1]);
    ctx.closePath();
    ctx.fill();
    // Barbs: a short flick off each tip, perpendicular to the axis and on
    // opposite sides, which is what makes the lens read as two arrowheads
    // rather than an eye.
    const barb = rr * 0.42;
    ctx.beginPath();
    ctx.moveTo(tipA[0], tipA[1]);
    ctx.lineTo(tipA[0] - qx * barb, tipA[1] - qy * barb);
    ctx.lineTo(tipA[0] - px * barb * 0.85, tipA[1] - py * barb * 0.85);
    ctx.closePath();
    ctx.moveTo(tipB[0], tipB[1]);
    ctx.lineTo(tipB[0] + qx * barb, tipB[1] + qy * barb);
    ctx.lineTo(tipB[0] + px * barb * 0.85, tipB[1] + py * barb * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 74px ${FONT}`;
    ctx.fillText('JUSPAY', 356, 214);
    ctx.font = `400 152px ${FONT}`;
    ctx.fillText('hyperswitch', 352, 360);
  });
}

// Live Now: outlined pill, indigo gradient border + indigo text.
export function liveNowFace(): THREE.CanvasTexture {
  return tex(1024, 384, (ctx) => {
    const g = ctx.createLinearGradient(60, 0, 964, 0);
    g.addColorStop(0, '#7d97ff');
    g.addColorStop(1, C.blue);
    ctx.strokeStyle = g;
    ctx.lineWidth = 13;
    roundRect(ctx, 60, 74, 904, 236, 118);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.font = `600 136px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Live Now', 512, 196);
  });
}

// Success rate metric card.
export function successRateFace(): THREE.CanvasTexture {
  return tex(900, 600, (ctx) => {
    ctx.fillStyle = '#8d94a3';
    ctx.font = `400 58px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Success rate', 96, 118);
    ctx.fillStyle = '#2c313c';
    ctx.font = `500 104px ${FONT}`;
    ctx.fillText('99.999%', 92, 224);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const pts: Array<[number, number]> = [
      [110, 470], [200, 430], [270, 452], [350, 398],
      [430, 424], [520, 350], [620, 372], [700, 300], [800, 322],
    ];
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  });
}

// Revenue Analytics: gold bars + grey two-line label.
export function revenueFace(): THREE.CanvasTexture {
  return tex(900, 500, (ctx) => {
    ctx.fillStyle = C.goldBar;
    const bx = 96;
    const bw = 54;
    const gap = 24;
    [92, 152, 216].forEach((h, i) => {
      roundRect(ctx, bx + i * (bw + gap), 320 - h, bw, h, 12);
      ctx.fill();
    });
    ctx.fillStyle = '#8d94a3';
    ctx.font = `400 74px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Revenue', 400, 178);
    ctx.fillText('Analytics', 400, 262);
  });
}

export function pspFace(): THREE.CanvasTexture {
  return tex(512, 512, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.font = `600 150px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PSP', 256, 260);
  });
}

// ---------------------------------------------------------------------------
// Set-dressing panel content — the mosaic the whole world is built from
// ---------------------------------------------------------------------------

/** Blank panel with a soft vertical sheen. */
/**
 * Fine matte grain, drawn via an offscreen canvas.
 *
 * `putImageData` ignores the context transform, so writing pixels directly into
 * a tex() context — which is pre-scaled by RES — lands the noise at a fraction
 * of the intended size. Compositing through drawImage respects the transform.
 */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, amp = 7): void {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d')!;
  const img = octx.createImageData(w, h);
  const r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 2 * amp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 128 + n;
    img.data[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(off, 0, 0, w, h);
  ctx.restore();
}

/**
 * Plain wall panel.
 *
 * This texture covers most of the set, and it used to be a flat fill plus a
 * single linear gradient — no high-frequency content at all. Measuring
 * Laplacian energy in the IN-FOCUS centre of frame showed 43% of the
 * reference's, which ruled out depth of field as the cause and pointed here:
 * the reference's surfaces carry a fine matte grain that catches the key light,
 * and a dead-flat panel cannot.
 */
export function panelPlain(seed = 1): THREE.CanvasTexture {
  const r = rng(seed);
  const base = 222 + Math.floor(r() * 16);
  return tex(512, 512, (ctx) => {
    ctx.fillStyle = `rgb(${base + 3},${base + 1},${base - 2})`;
    ctx.fillRect(0, 0, 512, 512);
    const g = ctx.createLinearGradient(0, 0, 380, 512);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(218,215,208,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    grain(ctx, 512, 512, seed * 7919 + 13);
  });
}

/** Grey dot-grid panel. */
export function panelDots(): THREE.CanvasTexture {
  return tex(1024, 1024, (ctx) => {
    ctx.fillStyle = '#eae9e4';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = 'rgba(142,152,170,0.6)';
    for (let a = 0; a < 13; a++)
      for (let b = 0; b < 13; b++) {
        ctx.beginPath();
        ctx.arc(60 + a * 76, 60 + b * 76, 11, 0, Math.PI * 2);
        ctx.fill();
      }
  });
}

/** Vertically-ribbed brushed-metal panel. */
export function panelMetal(): THREE.CanvasTexture {
  const t = tex(512, 512, (ctx) => {
    ctx.fillStyle = '#dcdad5';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 7) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(i, 0, 3, 512);
      ctx.fillStyle = 'rgba(150,157,170,0.30)';
      ctx.fillRect(i + 3, 0, 2, 512);
    }
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, 'rgba(255,255,255,0.34)');
    g.addColorStop(0.5, 'rgba(150,158,172,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });
  return t;
}

/** Document-ish panel: a caption plus ruled lines and a thin brand accent. */
export function panelDoc(label: string, accent: 'gold' | 'blue' = 'gold'): THREE.CanvasTexture {
  return tex(512, 512, (ctx) => {
    ctx.fillStyle = '#efeeea';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#6b7280';
    ctx.font = `400 30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 34, 52);
    ctx.fillStyle = accent === 'gold' ? '#ffc700' : C.blue;
    roundRect(ctx, 34, 74, 190, 6, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,159,175,0.45)';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(34, 130 + i * 40);
      ctx.lineTo(34 + (i % 2 ? 200 : 300), 130 + i * 40);
      ctx.stroke();
    }
  });
}

/** Chart panel: the "Success rate 99.999%" sheet seen behind the hero. */
export function panelChart(): THREE.CanvasTexture {
  return tex(512, 512, (ctx) => {
    ctx.fillStyle = '#efeeea';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#8d94a3';
    ctx.font = `400 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Success rate', 34, 40);
    ctx.fillStyle = '#2c313c';
    ctx.font = `500 36px ${FONT}`;
    ctx.fillText('99.999%', 32, 80);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const pts: Array<[number, number]> = [
      [48, 300], [110, 268], [160, 288], [220, 236],
      [280, 258], [340, 198], [410, 220], [470, 168],
    ];
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,159,175,0.45)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(44, 372 + i * 46);
      ctx.lineTo(i % 2 ? 300 : 452, 372 + i * 46);
      ctx.stroke();
    }
  });
}

/** Flat brand-colour panel with a soft sheen (the blue / yellow slabs). */
export function panelSolid(hex: string): THREE.CanvasTexture {
  return tex(256, 256, (ctx) => {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 256, 256);
    const g = ctx.createLinearGradient(0, 0, 200, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.30)');
    g.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
}

// Brushed-metal texture for the hero-key trays.
export function metalTexture(): THREE.CanvasTexture {
  const t = tex(512, 512, (ctx) => {
    ctx.fillStyle = '#c4c9d2';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1100; i++) {
      const y = Math.floor((i * 97) % 512);
      const a = 0.05 + ((i * 31) % 10) / 110;
      ctx.strokeStyle = i % 2 === 0 ? `rgba(96,102,114,${a})` : `rgba(248,251,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(512, y + 0.5);
      ctx.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Soft drifting haze layer.
export function cloudTexture(): THREE.CanvasTexture {
  const t = tex(1024, 1024, (ctx) => {
    ctx.clearRect(0, 0, 1024, 1024);
    for (let k = 0; k < 30; k++) {
      const x = (k * 173) % 1024;
      const y = (k * 311) % 1024;
      const r = 150 + ((k * 71) % 300);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (k % 3 === 0) {
        g.addColorStop(0, 'rgba(150,166,196,0.16)');
        g.addColorStop(1, 'rgba(150,166,196,0)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,0.42)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * Gobo map for the key light — soft overlapping pools of light and shade.
 *
 * Greyscale and opaque, unlike `cloudTexture()`: this is projected THROUGH a
 * spotlight (`SpotLight.map`), so it modulates light landing on every surface
 * rather than being a decal on the floor. Mid-grey is neutral.
 */
export function goboTexture(): THREE.CanvasTexture {
  const t = tex(1024, 1024, (ctx) => {
    // Higher contrast than it looks like it needs. A gobo is a MULTIPLIER on
    // the key, so a low-contrast pattern under a strong fill is invisible;
    // fifteen of fifteen seconds reported no dappled shadows at all while this
    // texture was a near-flat grey.
    ctx.fillStyle = '#7c7c7c';
    ctx.fillRect(0, 0, 1024, 1024);
    const r = rng(90210);
    for (let k = 0; k < 46; k++) {
      const x = r() * 1024;
      const y = r() * 1024;
      const rad = 120 + r() * 300;
      const light = k % 2 === 0;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      if (light) {
        g.addColorStop(0, 'rgba(255,255,255,0.85)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
      } else {
        g.addColorStop(0, 'rgba(28,32,42,0.55)');
        g.addColorStop(1, 'rgba(28,32,42,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
