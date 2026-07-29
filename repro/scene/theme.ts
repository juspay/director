// Palette (albedo — the high-key lighting desaturates on screen), dimensions, timeline.
export const FPS = 30;
/**
 * Master resolution. The reference clip is 720x900 because that is what
 * LinkedIn served after compression — not what it was mastered at. Rendering
 * natively at 720x900 leaves no supersampling headroom, which is what made
 * earlier cuts look soft and aliased. Master at 2160x2700 and downsample.
 */
export const W = 2160;
export const H = 2700;
/** Scale factor vs the 720x900 reference, for resolution-dependent effects. */
export const RES = W / 720;
export const DUR = 435;

export const C = {
  bg: '#f1f0ed',
  floor: '#eceae6',
  tile: '#f0efec',
  indigo: '#3646e6', // capability icon + label
  // Brand albedos, solved by rendering frame 300 and measuring the masked
  // plate pixels against the reference's. Both were tuned holding the composer
  // grade fixed: the first attempt moved albedo AND lockup saturation together
  // and overshot to gold (226,200,7) / blue (11,35,220), because neither
  // change's effect could be read on its own.
  // Renders (213,192,77) against the reference's (217,195,72).
  gold: '#ddc849',
  goldBar: '#ffc700',
  // Renders (66,101,220) against the reference's (64,101,220). At the previous
  // #1743c9 it rendered (96,112,197) — too much red, too little blue, reading
  // as periwinkle rather than the reference's vivid blue.
  blue: '#0a50de',
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
