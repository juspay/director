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
  // Whites are COOL. The verified analysis confirmed a cool blue cast on the
  // reference's whites in seven separate seconds (full-frame rb_delta -6..-22)
  // while this scene measured warm (+3..+15). The old warm-grey whites made
  // that unreachable by lighting alone: an albedo with r>b cannot render b>r
  // under near-white light.
  bg: '#eaeef5',
  floor: '#e4e7ee',
  tile: '#e9edf5',
  // Cards are WHITER than the wall — the reference's caps read bright white
  // against a grey-beige tile field; sharing the wall albedo made them grey.
  card: '#f6f8fc',
  // Was #3646e6, which the macro grade railed to pure (0,0,240) — the verified
  // "crushed blacks" spike was actually these badges at 7% luma weight. The
  // reference's badge blue measures (74,94,193) at t=2.5 with zero pixels on
  // the rail.
  indigo: '#7688e8',
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
