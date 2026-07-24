import * as THREE from 'three';
import { C } from './theme';

type Ctx = CanvasRenderingContext2D;
const FONT = 'Helvetica, Arial, sans-serif';

function tex(w: number, h: number, draw: (ctx: Ctx) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  draw(ctx);
  const t = new THREE.CanvasTexture(cv);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
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

// ---- capability icons (drawn white inside an indigo badge) ----
type IconFn = (ctx: Ctx, s: number) => void; // draw white glyph centered in s×s, origin at glyph box top-left

const strokeGlyph = (ctx: Ctx, lw: number) => {
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const icons: Record<string, IconFn> = {
  shield: (ctx, s) => {
    strokeGlyph(ctx, s * 0.09);
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.86, s * 0.24);
    ctx.lineTo(s * 0.86, s * 0.52);
    ctx.quadraticCurveTo(s * 0.86, s * 0.8, s * 0.5, s * 0.92);
    ctx.quadraticCurveTo(s * 0.14, s * 0.8, s * 0.14, s * 0.52);
    ctx.lineTo(s * 0.14, s * 0.24);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.34, s * 0.5);
    ctx.lineTo(s * 0.46, s * 0.62);
    ctx.lineTo(s * 0.68, s * 0.38);
    ctx.stroke();
  },
  ring: (ctx, s) => {
    strokeGlyph(ctx, s * 0.1);
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.34, -Math.PI * 0.5, Math.PI * 1.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.34, s * 0.5);
    ctx.lineTo(s * 0.46, s * 0.62);
    ctx.lineTo(s * 0.68, s * 0.4);
    ctx.stroke();
  },
  card: (ctx, s) => {
    strokeGlyph(ctx, s * 0.075);
    roundRect(ctx, s * 0.16, s * 0.3, s * 0.68, s * 0.4, s * 0.07);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.16, s * 0.42);
    ctx.lineTo(s * 0.84, s * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.3, -Math.PI * 0.9, Math.PI * 0.2);
    ctx.stroke();
  },
  refresh: (ctx, s) => {
    strokeGlyph(ctx, s * 0.1);
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.3, -Math.PI * 0.4, Math.PI * 1.25);
    ctx.stroke();
    // arrow head
    ctx.beginPath();
    ctx.moveTo(s * 0.68, s * 0.28);
    ctx.lineTo(s * 0.78, s * 0.36);
    ctx.lineTo(s * 0.64, s * 0.44);
    ctx.closePath();
    ctx.fill();
  },
  globe: (ctx, s) => {
    strokeGlyph(ctx, s * 0.06);
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.5, s * 0.15, s * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.16, s * 0.5);
    ctx.lineTo(s * 0.84, s * 0.5);
    ctx.moveTo(s * 0.22, s * 0.34);
    ctx.lineTo(s * 0.78, s * 0.34);
    ctx.moveTo(s * 0.22, s * 0.66);
    ctx.lineTo(s * 0.78, s * 0.66);
    ctx.stroke();
  },
};

// Capability face: indigo rounded-square badge with white glyph, label below in indigo.
export function capabilityFace(label: string, icon: keyof typeof icons, gradient = false): THREE.CanvasTexture {
  return tex(512, 512, (ctx) => {
    const badge = 190;
    const bx = (512 - badge) / 2;
    const by = 96;
    if (gradient) {
      const g = ctx.createLinearGradient(bx, by, bx + badge, by + badge);
      g.addColorStop(0, '#5a74ff');
      g.addColorStop(1, C.indigo);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = C.indigo;
    }
    roundRect(ctx, bx, by, badge, badge, 46);
    ctx.fill();
    ctx.save();
    ctx.translate(bx + badge * 0.16, by + badge * 0.16);
    icons[icon](ctx, badge * 0.68);
    ctx.restore();
    // label
    ctx.fillStyle = C.indigo;
    ctx.font = `600 62px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 380);
  });
}

// Recurly: black looped mark + wordmark.
export function recurlyFace(): THREE.CanvasTexture {
  return tex(1024, 512, (ctx) => {
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = C.ink;
    // Recurly mark: a single continuous looped stroke (stylised "r" swirl).
    const cx = 200;
    const cy = 256;
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // lower hook
    ctx.arc(cx - 26, cy + 26, 48, Math.PI * 0.5, Math.PI * 1.9, false);
    // sweep up into the upper loop
    ctx.arc(cx + 30, cy - 24, 48, Math.PI * 1.1, Math.PI * 2.7, false);
    ctx.stroke();
    // wordmark (slightly lighter weight)
    ctx.font = `600 150px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Recurly', 322, 262);
  });
}

// Juspay Hyperswitch: white roundel + JUSPAY (small caps) over hyperswitch (larger), white.
export function hyperswitchFace(): THREE.CanvasTexture {
  return tex(1024, 512, (ctx) => {
    // roundel
    const cx = 150;
    const cy = 256;
    const r = 92;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // blue droplet swirl inside
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.55);
    ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.1, cx + r * 0.1, cy + r * 0.5);
    ctx.quadraticCurveTo(cx - r * 0.15, cy, cx, cy - r * 0.55);
    ctx.fill();
    // wordmark
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 52px ${FONT}`;
    ctx.fillText('JUSPAY', 288, 224);
    ctx.font = `500 120px ${FONT}`;
    ctx.fillText('hyperswitch', 286, 336);
  });
}

// Live Now: white pill face with indigo rounded border + indigo text.
export function liveNowFace(): THREE.CanvasTexture {
  return tex(1024, 384, (ctx) => {
    const g = ctx.createLinearGradient(60, 0, 964, 0);
    g.addColorStop(0, '#7d97ff');
    g.addColorStop(1, C.blue);
    ctx.strokeStyle = g;
    ctx.lineWidth = 12;
    roundRect(ctx, 60, 70, 904, 244, 122);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.font = `700 132px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Live Now', 512, 196);
  });
}

// Brushed-metal texture for the hero-key sockets.
export function metalTexture(): THREE.CanvasTexture {
  const t = tex(512, 512, (ctx) => {
    ctx.fillStyle = '#b7bcc6';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const y = Math.floor((i * 97) % 512);
      const a = 0.04 + ((i * 31) % 10) / 120;
      const dark = i % 2 === 0;
      ctx.strokeStyle = dark ? `rgba(90,96,108,${a})` : `rgba(240,244,250,${a})`;
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

// Soft cloud/dapple layer (transparent) for the drifting atmospheric light.
export function cloudTexture(): THREE.CanvasTexture {
  const t = tex(1024, 1024, (ctx) => {
    ctx.clearRect(0, 0, 1024, 1024);
    for (let k = 0; k < 34; k++) {
      const x = (k * 173) % 1024;
      const y = (k * 311) % 1024;
      const r = 120 + ((k * 71) % 260);
      const shadow = k % 2 === 0;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (shadow) {
        g.addColorStop(0, 'rgba(120,132,154,0.20)');
        g.addColorStop(1, 'rgba(120,132,154,0)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,0.28)');
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

// Success rate metric: up-trend line graph + "Success rate" + "99.999%".
export function successRateFace(): THREE.CanvasTexture {
  return tex(768, 512, (ctx) => {
    ctx.fillStyle = C.grey;
    ctx.font = `600 52px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Success rate', 90, 120);
    ctx.fillStyle = '#333333';
    ctx.font = `700 92px ${FONT}`;
    ctx.fillText('99.999%', 88, 200);
    // line graph trending up
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const pts = [
      [110, 420],
      [230, 380],
      [340, 400],
      [470, 320],
      [600, 300],
      [690, 250],
    ];
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  });
}

// PSP chip: small blue chip with white "PSP".
export function pspFace(): THREE.CanvasTexture {
  return tex(512, 512, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.font = `700 150px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PSP', 256, 260);
  });
}

// Tiled panel floor — light panels with visible seams + soft dapple (light & shadow).
export function floorTexture(): THREE.CanvasTexture {
  const t = tex(1024, 1024, (ctx) => {
    ctx.fillStyle = '#c2cad6'; // seam color (shows between panels)
    ctx.fillRect(0, 0, 1024, 1024);
    const cols = 3;
    const cell = 1024 / cols;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < cols; j++) {
        const shade = 205 + ((i * 5 + j * 11) % 9);
        ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 11})`;
        const pad = 5;
        roundRect(ctx, i * cell + pad, j * cell + pad, cell - pad * 2, cell - pad * 2, 10);
        ctx.fill();
      }
    }
    // soft dapple — larger, stronger light & shadow pools (light through leaves)
    for (let k = 0; k < 20; k++) {
      const x = (k * 173) % 1024;
      const y = (k * 311) % 1024;
      const r = 190 + ((k * 67) % 220);
      const shadow = k % 2 === 0;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (shadow) {
        g.addColorStop(0, 'rgba(122,134,156,0.24)');
        g.addColorStop(1, 'rgba(122,134,156,0)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,0.28)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fine paper grain
    for (let n = 0; n < 9000; n++) {
      const gx = Math.random() * 1024;
      const gy = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(120,130,150,0.05)';
      ctx.fillRect(gx, gy, 1.4, 1.4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.2, 2.2);
  return t;
}

// Revenue Analytics: gold bars + grey two-line label.
export function revenueFace(): THREE.CanvasTexture {
  return tex(768, 384, (ctx) => {
    ctx.fillStyle = C.goldBar;
    const bx = 90;
    const bw = 46;
    const gap = 20;
    const heights = [70, 120, 175];
    heights.forEach((h, i) => {
      roundRect(ctx, bx + i * (bw + gap), 250 - h, bw, h, 10);
      ctx.fill();
    });
    ctx.fillStyle = C.grey;
    ctx.font = `600 62px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Revenue', 330, 150);
    ctx.fillText('Analytics', 330, 220);
  });
}
