export const theme = {
  canvas: { dark: '#0f172a', mid: '#1e293b', card: '#1a2332' },
  amber: { primary: '#d97706', light: '#f59e0b', dim: '#92400e' },
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  accent: { green: '#4ade80', blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899' },
  slack: { bg: '#1a1d21', message: '#222529', border: '#383a3e' },
} as const;

export const springs = {
  gentle: { damping: 20, mass: 0.8, stiffness: 80 },
  snappy: { damping: 15, mass: 0.5, stiffness: 200 },
  bouncy: { damping: 12, mass: 0.6, stiffness: 150 },
  slow: { damping: 30, mass: 1.0, stiffness: 50 },
} as const;

export const fonts = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'SF Mono', 'Fira Code', monospace",
  serif: "'Playfair Display', Georgia, serif",
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 4385; // ceil(146.16 * 30)
