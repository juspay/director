// Origin: merged from v7 styles/theme.ts + v8 theme.ts — extracted to library 2026-03-23
//
// v7 provides the core palette (canvas, amber, role colors, font stacks, spacing, video config).
// v8 adds Slack-specific UI tokens and extended text/accent tiers.
// Where both define the same value, v7 is the source of truth for canvas/amber
// and v8 is the source of truth for Slack UI fidelity.

// ── Colors ──────────────────────────────────────────────────────────────

export const colors = {
  // Canvas
  canvas: "#0f172a",            // Dark navy (Slate 900) — v7 + v8 agree
  bgLight: "#1e293b",           // Lighter navy for cards (Slate 800) — v8
  bgCard: "#1a2332",            // Card/panel background — v8

  // Amber — Tara's signature
  amber: "#d97706",             // Primary warm accent — v7 + v8 agree
  amberLight: "#f59e0b",        // Lighter amber for glows — v8
  amberGlow: "rgba(217, 119, 6, 0.4)",   // Glow effects — v7
  amberSoft: "rgba(217, 119, 6, 0.15)",  // Subtle bg tint — v7
  amberDim: "#92400e",          // Dimmed amber — v8
  amberBright: "#fbbf24",       // Bright amber for emphasis — v5

  // Text hierarchy
  textPrimary: "#f1f5f9",       // Slate 100 — v8
  textSecondary: "#94a3b8",     // Slate 400 — v7 (as gray) + v8 agree
  textMuted: "#64748b",         // Slate 500 — v8
  white: "#ffffff",             // Pure white — v7 + v8 agree
  whiteSoft: "rgba(255, 255, 255, 0.9)",  // Near-white — v7
  whiteSubtle: "rgba(255, 255, 255, 0.5)", // Dimmed white — v7

  // Role colors
  pm: "#a855f7",                // Purple — PM — v7 + v8 agree
  engineer: "#3b82f6",          // Blue — Engineer — v7 + v8 agree
  designer: "#ec4899",          // Pink — Designer — v7 + v8 agree

  // Utility
  gray: "#94a3b8",              // Muted gray — v7 + v8 agree
  grayDark: "#475569",          // Dark gray / pre-highlight — v7 + v8 agree
  preHighlight: "#475569",      // Alias for code pre-highlight — v7
  success: "#22c55e",           // Success green — v8

  // Slack UI tokens — authentic Slack dark mode values from v8
  slack: {
    bg: "#1a1d21",              // Real Slack dark mode bg
    sidebar: "#19171d",         // Slack sidebar
    message: "#222529",         // Message hover bg
    border: "#383a3e",          // Borders
    green: "#2bac76",           // Online indicator
    link: "#1d9bd1",            // Links
  },

  // Tool brand colors (from v5)
  tools: {
    slack: "#4A154B",
    jira: "#0052CC",
    bitbucket: "#0052CC",
    github: "#f8fafc",
    figma: "#F24E1E",
  },
} as const;

// ── Fonts ───────────────────────────────────────────────────────────────
// Merged stacks: v7 uses body/code/display, v8 uses sans/mono/serif.
// The library exposes both naming conventions pointing to the same stacks.

export const fonts = {
  // Sans-serif — primary body and UI text
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',

  // Monospace — code, terminal, technical text
  code: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
  mono: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace',

  // Serif/Display — title cards, dramatic moments
  display: '"Playfair Display", Georgia, "Times New Roman", serif',
  serif: '"Playfair Display", Georgia, "Times New Roman", serif',
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────

export const spacing = {
  screenPadding: 120,
  elementGap: 40,
  messageGap: 12,
} as const;

// ── Video config ────────────────────────────────────────────────────────

export const videoConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 5100,
} as const;
