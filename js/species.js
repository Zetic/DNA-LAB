// DNA Lab data: species bodies, the fin part library, and genes.
//
// Three layers, like the design discussed:
//   1. Base body   - one shared template, blended between species (Fish Farm style).
//   2. Fin parts   - swapped from a library per slot (Peridot style), then blended
//                    within the chosen type between its two authored variants.
//   3. Extras      - on/off features: tail spine, whiskers, head hump, lure.
// Colors and patterns sit on top as gene-chosen layers.

// ---------- species ----------
// body: ht/hb = upper/lower half depth, pk = where the body is deepest (0..1),
//       st = tail-stalk half depth, ex = roundness (lower = blunter).
// parts: [type, shape 0..1 (variant A -> B), size] per slot.
// traits: gene copies for color, patterns and extras (anything not listed uses the default).
export const SPECIES = [
  { id: 'clown', name: 'Clownfish', color: '#E8702A', size: 0.9,
    body: { ht: 0.19, hb: 0.17, pk: 0.38, st: 0.07, ex: 0.5 },
    parts: { dorsal: ['notched', 0, 1], tail: ['fan', 0, 1], anal: ['rounded', 0, 1], pectoral: ['paddle', 0, 1], pelvic: ['small', 0, 1] },
    traits: { color: ['orange', 'orange'], whiteBars: ['B', 'B'], finEdge: ['E', 'E'] } },
  { id: 'tang', name: 'Blue tang', color: '#2F6FD1', size: 1.15,
    body: { ht: 0.30, hb: 0.27, pk: 0.45, st: 0.06, ex: 0.85 },
    parts: { dorsal: ['longLow', 0, 1], tail: ['truncate', 0, 1], anal: ['longLow', 0, 1], pectoral: ['pointed', 0, 1], pelvic: ['small', 0, 1] },
    traits: { color: ['blue', 'blue'], saddle: ['K', 'K'], yellowTail: ['t', 't'], spine: ['S', 'S'] } },
  { id: 'angel', name: 'Angelfish', color: '#8A99A6', size: 1.1,
    body: { ht: 0.33, hb: 0.31, pk: 0.45, st: 0.05, ex: 0.7 },
    parts: { dorsal: ['sail', 0, 1], tail: ['lyre', 0, 1], anal: ['tall', 0, 1], pectoral: ['small', 0.5, 1], pelvic: ['threads', 0.4, 1] },
    traits: { color: ['silver', 'silver'], albino: ['N', 'a'], darkBars: ['D', 'D'] } },
  { id: 'tetra', name: 'Neon tetra', color: '#17A3A8', size: 0.75,
    body: { ht: 0.15, hb: 0.13, pk: 0.38, st: 0.045, ex: 0.7 },
    parts: { dorsal: ['small', 0, 1], tail: ['forked', 0, 1], anal: ['small', 0, 1], pectoral: ['small', 0, 1], pelvic: ['small', 0, 0.8] },
    traits: { color: ['teal', 'teal'], neon: ['n', 'n'] } },
  { id: 'betta', name: 'Betta', color: '#B3243B', size: 0.9,
    body: { ht: 0.17, hb: 0.16, pk: 0.40, st: 0.08, ex: 0.65 },
    parts: { dorsal: ['flowing', 0, 1], tail: ['flowing', 0, 1], anal: ['flowing', 0, 1], pectoral: ['small', 1, 1], pelvic: ['threads', 0, 1] },
    traits: { color: ['red', 'red'], spots: ['P', 'p'] } },
  { id: 'oranda', name: 'Oranda', color: '#E0A21B', size: 1.0,
    body: { ht: 0.25, hb: 0.29, pk: 0.42, st: 0.05, ex: 0.5 },
    parts: { dorsal: ['sail', 0, 0.55], tail: ['flowing', 0.3, 0.9], anal: ['rounded', 1, 1], pectoral: ['paddle', 0.5, 1], pelvic: ['small', 1, 1] },
    traits: { color: ['gold', 'gold'], hump: ['H', 'H'] } },
  { id: 'koi', name: 'Koi', color: '#F2A7B5', size: 1.25,
    body: { ht: 0.17, hb: 0.16, pk: 0.36, st: 0.06, ex: 0.6 },
    parts: { dorsal: ['longLow', 0.4, 1], tail: ['forked', 0.3, 1.1], anal: ['small', 0.5, 1], pectoral: ['paddle', 0.3, 1], pelvic: ['small', 0.5, 1] },
    // koi carry a hidden copy of long flowing fins, like real "butterfly" koi
    hiddenParts: { tail: 'flowing' },
    traits: { color: ['white', 'white'], patches: ['c', 'c'], barbels: ['W', 'W'] } },
  { id: 'pictus', name: 'Pictus catfish', color: '#5E6B73', size: 0.95,
    body: { ht: 0.13, hb: 0.12, pk: 0.30, st: 0.04, ex: 0.45 },
    parts: { dorsal: ['small', 1, 1], tail: ['forked', 1, 1], anal: ['longLow', 0, 0.9], pectoral: ['pointed', 0.4, 1], pelvic: ['small', 0, 1] },
    traits: { color: ['silver', 'silver'], spots: ['p', 'p'], barbels: ['W', 'W'] } },
  { id: 'lion', name: 'Lionfish', color: '#8E3B2E', size: 1.15,
    body: { ht: 0.20, hb: 0.18, pk: 0.35, st: 0.06, ex: 0.6 },
    parts: { dorsal: ['spiky', 0.5, 1], tail: ['fan', 0.5, 1], anal: ['rounded', 0.5, 1], pectoral: ['wing', 0.5, 1], pelvic: ['small', 1, 1] },
    traits: { color: ['red', 'red'], whiteBars: ['B', 'B'] } },
  { id: 'sword', name: 'Swordtail', color: '#6C4AB6', size: 0.85,
    body: { ht: 0.15, hb: 0.14, pk: 0.40, st: 0.06, ex: 0.65 },
    parts: { dorsal: ['small', 0.6, 1], tail: ['sword', 0.5, 1], anal: ['small', 0, 1], pectoral: ['small', 0.5, 1], pelvic: ['small', 0, 1] },
    traits: { color: ['red', 'red'], finEdge: ['E', 'E'] } },
  { id: 'guppy', name: 'Guppy', color: '#2BA36B', size: 0.7,
    body: { ht: 0.12, hb: 0.12, pk: 0.35, st: 0.05, ex: 0.6 },
    parts: { dorsal: ['flowing', 0, 0.6], tail: ['delta', 0.5, 1], anal: ['small', 0, 0.9], pectoral: ['small', 0, 1], pelvic: ['small', 0, 0.8] },
    traits: { color: ['blue', 'blue'], spots: ['p', 'p'] } },
  { id: 'puffer', name: 'Pufferfish', color: '#E8C547', size: 0.9,
    body: { ht: 0.31, hb: 0.31, pk: 0.45, st: 0.05, ex: 0.45 },
    parts: { dorsal: ['small', 0, 0.9], tail: ['fan', 0, 0.8], anal: ['small', 0, 0.9], pectoral: ['small', 1, 1.1], pelvic: ['small', 0, 0] },
    traits: { color: ['yellow', 'yellow'], spots: ['p', 'p'] } },
  { id: 'angler', name: 'Anglerfish', color: '#3A3548', size: 1.0,
    body: { ht: 0.28, hb: 0.30, pk: 0.26, st: 0.05, ex: 0.4 },
    parts: { dorsal: ['small', 0.3, 0.8], tail: ['fan', 0.2, 0.9], anal: ['small', 0.3, 0.9], pectoral: ['paddle', 0, 1], pelvic: ['small', 0, 0.8] },
    traits: { color: ['black', 'black'], lure: ['L', 'L'] } }
];

// ---------- fin part library ----------
// Each type has two authored variants with identical point counts; a fish's shape gene
// blends between them. Higher rank = dominant. `sharp` types keep straight edges.
// Coordinates: dorsal/anal are [x, offset from body edge]; tail is absolute (tail base at x=1);
// pectoral/pelvic are offsets from their socket on the body.
export const SLOTS = [
  { id: 'dorsal', name: 'Dorsal fin' },
  { id: 'tail', name: 'Tail fin' },
  { id: 'anal', name: 'Anal fin' },
  { id: 'pectoral', name: 'Side fins' },
  { id: 'pelvic', name: 'Belly fins' }
];

export const PARTS = {
  dorsal: {
    small: { label: 'Small', rank: 5, range: ['small', 'larger'],
      a: [[.46, 0], [.49, -.09], [.53, -.11], [.57, -.05], [.59, 0]],
      b: [[.44, 0], [.48, -.13], [.53, -.16], [.59, -.07], [.62, 0]] },
    notched: { label: 'Notched', rank: 4, range: ['low', 'tall'],
      a: [[.26, 0], [.30, -.07], [.38, -.10], [.46, -.06], [.50, -.02], [.56, -.10], [.66, -.14], [.76, -.09], [.80, 0]],
      b: [[.26, 0], [.30, -.10], [.38, -.15], [.46, -.09], [.50, -.03], [.56, -.14], [.66, -.20], [.76, -.12], [.80, 0]] },
    longLow: { label: 'Long and low', rank: 3, range: ['even', 'rising'],
      a: [[.22, 0], [.30, -.06], [.40, -.07], [.50, -.07], [.62, -.07], [.74, -.07], [.84, -.06], [.88, 0]],
      b: [[.22, 0], [.30, -.08], [.40, -.10], [.50, -.11], [.62, -.12], [.74, -.13], [.84, -.11], [.88, 0]] },
    spiky: { label: 'Spiky', rank: 2, sharp: true, range: ['short spines', 'long spines'],
      a: [[.25, 0], [.27, -.17], [.30, -.05], [.33, -.20], [.36, -.06], [.39, -.21], [.42, -.07], [.45, -.19], [.48, -.07], [.51, -.16], [.54, -.06], [.60, -.11], [.68, -.12], [.75, -.07], [.78, 0]],
      b: [[.25, 0], [.27, -.27], [.30, -.06], [.33, -.32], [.36, -.07], [.39, -.34], [.42, -.08], [.45, -.30], [.48, -.08], [.51, -.25], [.54, -.07], [.60, -.13], [.68, -.14], [.75, -.08], [.78, 0]] },
    sail: { label: 'Sail', rank: 1, range: ['tall', 'towering'],
      a: [[.30, 0], [.42, -.18], [.58, -.34], [.74, -.42], [.84, -.16], [.86, 0]],
      b: [[.28, 0], [.42, -.24], [.58, -.46], [.76, -.58], [.86, -.20], [.88, 0]] },
    flowing: { label: 'Flowing', rank: 0, range: ['long', 'trailing'],
      a: [[.45, 0], [.55, -.15], [.68, -.22], [.85, -.25], [.95, -.10], [.93, 0]],
      b: [[.42, 0], [.55, -.20], [.70, -.30], [.90, -.36], [1.02, -.16], [.94, 0]] }
  },
  tail: {
    forked: { label: 'Forked', rank: 6, range: ['shallow fork', 'deep fork'],
      a: [[1, -.04], [1.14, -.14], [1.26, -.20], [1.16, -.07], [1.12, 0], [1.16, .07], [1.26, .20], [1.14, .14], [1, .04]],
      b: [[1, -.04], [1.16, -.17], [1.33, -.27], [1.18, -.08], [1.10, 0], [1.18, .08], [1.33, .27], [1.16, .17], [1, .04]] },
    fan: { label: 'Fan', rank: 5, range: ['small fan', 'big fan'],
      a: [[1, -.07], [1.12, -.18], [1.24, -.17], [1.31, -.08], [1.33, 0], [1.31, .08], [1.24, .17], [1.12, .18], [1, .07]],
      b: [[1, -.07], [1.14, -.24], [1.30, -.24], [1.40, -.11], [1.43, 0], [1.40, .11], [1.30, .24], [1.14, .24], [1, .07]] },
    truncate: { label: 'Square', rank: 4, range: ['square', 'crescent'],
      a: [[1, -.06], [1.15, -.18], [1.30, -.26], [1.27, -.12], [1.25, 0], [1.27, .12], [1.30, .26], [1.15, .18], [1, .06]],
      b: [[1, -.06], [1.17, -.20], [1.36, -.32], [1.28, -.14], [1.24, 0], [1.28, .14], [1.36, .32], [1.17, .20], [1, .06]] },
    lyre: { label: 'Lyre', rank: 3, range: ['short tips', 'long streamers'],
      a: [[1, -.05], [1.12, -.20], [1.32, -.32], [1.24, -.10], [1.22, 0], [1.24, .10], [1.32, .32], [1.12, .20], [1, .05]],
      b: [[1, -.05], [1.14, -.22], [1.48, -.40], [1.26, -.10], [1.22, 0], [1.26, .10], [1.48, .40], [1.14, .22], [1, .05]] },
    sword: { label: 'Sword', rank: 2, range: ['short sword', 'long sword'],
      a: [[1, -.06], [1.12, -.15], [1.24, -.14], [1.28, -.04], [1.26, .04], [1.32, .08], [1.58, .12], [1.30, .16], [1, .06]],
      b: [[1, -.06], [1.12, -.15], [1.24, -.14], [1.28, -.04], [1.26, .04], [1.36, .08], [1.86, .13], [1.34, .17], [1, .06]] },
    delta: { label: 'Delta', rank: 1, range: ['small delta', 'huge delta'],
      a: [[1, -.05], [1.15, -.18], [1.38, -.30], [1.42, -.10], [1.44, 0], [1.42, .10], [1.38, .30], [1.15, .18], [1, .05]],
      b: [[1, -.05], [1.18, -.24], [1.50, -.42], [1.56, -.14], [1.58, 0], [1.56, .14], [1.50, .42], [1.18, .24], [1, .05]] },
    flowing: { label: 'Flowing', rank: 0, range: ['veil', 'grand veil'],
      a: [[1, -.08], [1.15, -.32], [1.35, -.38], [1.50, -.20], [1.55, 0], [1.50, .20], [1.35, .38], [1.15, .32], [1, .08]],
      b: [[1, -.08], [1.18, -.38], [1.42, -.46], [1.62, -.24], [1.68, 0], [1.62, .24], [1.42, .46], [1.18, .38], [1, .08]] }
  },
  anal: {
    small: { label: 'Small', rank: 4, range: ['small', 'larger'],
      a: [[.60, 0], [.63, .06], [.70, .08], [.77, .05], [.80, 0]],
      b: [[.58, 0], [.62, .09], [.70, .12], [.79, .07], [.82, 0]] },
    rounded: { label: 'Rounded', rank: 3, range: ['small', 'broad'],
      a: [[.58, 0], [.62, .08], [.70, .11], [.78, .06], [.80, 0]],
      b: [[.56, 0], [.61, .11], [.70, .15], [.79, .09], [.82, 0]] },
    longLow: { label: 'Long and low', rank: 2, range: ['low', 'deeper'],
      a: [[.42, 0], [.50, .07], [.65, .075], [.80, .06], [.86, 0]],
      b: [[.40, 0], [.50, .10], [.65, .12], [.80, .10], [.87, 0]] },
    tall: { label: 'Tall', rank: 1, range: ['tall', 'towering'],
      a: [[.40, 0], [.52, .20], [.66, .36], [.80, .42], [.88, .14], [.88, 0]],
      b: [[.40, 0], [.52, .26], [.66, .48], [.82, .56], [.90, .18], [.89, 0]] },
    flowing: { label: 'Flowing', rank: 0, range: ['long', 'trailing'],
      a: [[.35, 0], [.50, .25], [.70, .35], [.90, .38], [1.0, .20], [.98, 0]],
      b: [[.33, 0], [.50, .32], [.72, .46], [.94, .50], [1.06, .26], [.98, 0]] }
  },
  pectoral: {
    small: { label: 'Small', rank: 3, range: ['small', 'larger'],
      a: [[0, 0], [.04, -.02], [.09, .01], [.07, .03], [.03, .04], [0, .02]],
      b: [[0, 0], [.05, -.03], [.12, .01], [.09, .04], [.04, .05], [0, .02]] },
    paddle: { label: 'Paddle', rank: 2, range: ['small paddle', 'big paddle'],
      a: [[0, -.02], [.08, -.06], [.15, -.03], [.16, .03], [.10, .08], [.01, .06]],
      b: [[0, -.03], [.10, -.08], [.19, -.04], [.20, .04], [.13, .10], [.01, .07]] },
    pointed: { label: 'Pointed', rank: 1, range: ['short', 'long'],
      a: [[.01, 0], [.10, -.03], [.20, .04], [.12, .06], [.04, .08], [0, .05]],
      b: [[.01, 0], [.12, -.04], [.26, .05], [.15, .07], [.05, .09], [0, .05]] },
    wing: { label: 'Wing', rank: 0, range: ['wide', 'huge'],
      a: [[0, -.02], [.08, -.10], [.20, -.09], [.30, .01], [.25, .13], [.12, .17], [.02, .07]],
      b: [[0, -.02], [.10, -.14], [.26, -.13], [.40, .02], [.33, .19], [.15, .24], [.02, .08]] }
  },
  pelvic: {
    small: { label: 'Small', rank: 1, range: ['small', 'larger'],
      a: [[0, 0], [.02, .06], [.06, .07], [.06, 0]],
      b: [[0, 0], [.03, .09], [.08, .10], [.07, 0]] },
    threads: { label: 'Threads', rank: 0, range: ['long', 'very long'],
      a: [[0, 0], [.03, .30], [.05, .44], [.045, .02]],
      b: [[0, 0], [.04, .42], [.07, .62], [.055, .02]] }
  }
};

// ---------- genes for color, pattern and extras ----------
// Higher rank = dominant. `quiet` alleles mean "absent", so they never count as a hidden trait.
export const TRAITS = [
  { id: 'color', group: 'look', name: 'Body color', alleles: {
      black: { label: 'Black', rank: 9 }, blue: { label: 'Blue', rank: 8 }, red: { label: 'Red', rank: 7 },
      orange: { label: 'Orange', rank: 6 }, gold: { label: 'Gold', rank: 5 }, teal: { label: 'Teal', rank: 4 },
      yellow: { label: 'Yellow', rank: 3 }, silver: { label: 'Silver', rank: 2 }, white: { label: 'White', rank: 1 } } },
  { id: 'albino', group: 'look', name: 'Pigment', alleles: { N: { label: 'Normal', rank: 1, quiet: true }, a: { label: 'Albino', rank: 0 } } },
  { id: 'whiteBars', group: 'look', name: 'White bars', alleles: { B: { label: 'Bars', rank: 1 }, b: { label: 'None', rank: 0, quiet: true } } },
  { id: 'darkBars', group: 'look', name: 'Dark bars', alleles: { D: { label: 'Bars', rank: 1 }, d: { label: 'None', rank: 0, quiet: true } } },
  { id: 'neon', group: 'look', name: 'Neon stripe', alleles: { N: { label: 'None', rank: 1, quiet: true }, n: { label: 'Stripe', rank: 0 } } },
  { id: 'saddle', group: 'look', name: 'Back marking', alleles: { K: { label: 'Marking', rank: 1 }, k: { label: 'None', rank: 0, quiet: true } } },
  { id: 'patches', group: 'look', name: 'Patches', alleles: { C: { label: 'None', rank: 1, quiet: true }, c: { label: 'Patches', rank: 0 } } },
  { id: 'spots', group: 'look', name: 'Spots', alleles: { P: { label: 'None', rank: 1, quiet: true }, p: { label: 'Spots', rank: 0 } } },
  { id: 'yellowTail', group: 'look', name: 'Yellow tail', alleles: { T: { label: 'Plain', rank: 1, quiet: true }, t: { label: 'Yellow', rank: 0 } } },
  { id: 'finEdge', group: 'look', name: 'Fin edges', alleles: { E: { label: 'Dark', rank: 1 }, e: { label: 'Plain', rank: 0, quiet: true } } },
  { id: 'spine', group: 'extra', name: 'Tail spine', alleles: { S: { label: 'Spine', rank: 1 }, s: { label: 'None', rank: 0, quiet: true } } },
  { id: 'barbels', group: 'extra', name: 'Whiskers', alleles: { W: { label: 'Whiskers', rank: 1 }, w: { label: 'None', rank: 0, quiet: true } } },
  { id: 'hump', group: 'extra', name: 'Head hump', alleles: { H: { label: 'Hump', rank: 1 }, h: { label: 'None', rank: 0, quiet: true } } },
  { id: 'lure', group: 'extra', name: 'Lure', alleles: { L: { label: 'Lure', rank: 1 }, l: { label: 'None', rank: 0, quiet: true } } }
];

export const DEFAULT_TRAITS = {
  color: ['silver', 'silver'], albino: ['N', 'N'], whiteBars: ['b', 'b'], darkBars: ['d', 'd'], neon: ['N', 'N'],
  saddle: ['k', 'k'], patches: ['C', 'C'], spots: ['P', 'P'], yellowTail: ['T', 'T'], finEdge: ['e', 'e'],
  spine: ['s', 's'], barbels: ['w', 'w'], hump: ['h', 'h'], lure: ['l', 'l']
};

// The tank you start with. Everything else can be added from the catalog.
export const STARTING_STOCK = ['clown', 'tang', 'angel', 'angel', 'tetra', 'betta', 'oranda', 'lion'];

export const NAMES = ['Pip', 'Moss', 'Juno', 'Kelp', 'Wren', 'Fig', 'Nori', 'Bram', 'Opal', 'Tansy', 'Skip', 'Coral',
  'Dune', 'Miso', 'Olive', 'Rune', 'Sable', 'Tiko', 'Umi', 'Vale', 'Basil', 'Cleo', 'Echo', 'Fern', 'Gus', 'Hazel',
  'Iris', 'Jett', 'Kip', 'Lumi', 'Mako', 'Nell', 'Oz', 'Perch', 'Quill', 'Reed', 'Saffi', 'Taro', 'Ula', 'Vim',
  'Wade', 'Yuzu', 'Zinnia', 'Ash', 'Bix', 'Cove', 'Eddy', 'Flint'];
