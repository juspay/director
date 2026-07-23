// Palette (albedo — the high-key lighting desaturates on screen), dimensions, timeline.
export const FPS = 30;
export const W = 720;
export const H = 900;
export const DUR = 435;

export const C = {
  bg: '#eef2f7',
  floor: '#e9edf2',
  tile: '#ffffff',
  indigo: '#3646e6', // capability icon + label
  gold: '#ffd11e', // Recurly keycap
  goldBar: '#ffc700',
  blue: '#2e52d6', // Hyperswitch keycap
  metalTop: '#cfd3db',
  metalMid: '#b6bcc7',
  metalDark: '#9aa0ad',
  ink: '#161a22',
  grey: '#9098a6',
  white: '#ffffff',
};

// Event frames (t * 30), from RECONSTRUCTION-SPEC §3.
export const T = {
  swap1: 64, // grid → column
  swap2: 145, // column → Recurly
  swap3: 198, // Recurly → Hyperswitch
  hyPressStart: 225, // hyperswitch keycap presses into socket (t7.5)
  assemble: 240, // wide flat view forms (t8.0)
  liveRiseStart: 256, // Live Now pill rises (t8.53)
  liveRiseEnd: 266,
  bgFadeStart: 266, // background tiles fade (t8.9)
  bgFadeEnd: 277,
  hold: 277, // static lockup hold → end
};
