// Species are authored as shapes on one shared fish template.
// Body: upper/lower edge curves sampled at the same x positions for every species.
// Fins: outlines from root to root, with landmarks (indices into the outline)
// that mean the same thing on every species: fin start, middle, fin end, tail tips...
// Every species must use the same number of landmarks for each fin type.

export const SPECIES = [
  {
    id: 'clown', name: 'Clownfish', color: '#E8702A', size: 0.9,
    body: { ht: 0.19, hb: 0.17, pk: 0.38, st: 0.07, ex: 0.5 },
    dorsal: { p: [[.26, 0], [.30, -.07], [.38, -.10], [.46, -.06], [.50, -.02], [.56, -.10], [.66, -.14], [.76, -.09], [.80, 0]], lm: [0, 4, 8] },
    anal: { p: [[.58, 0], [.62, .08], [.70, .11], [.78, .06], [.80, 0]], lm: [0, 2, 4] },
    tail: { p: [[1, -.07], [1.12, -.18], [1.24, -.17], [1.31, -.08], [1.33, 0], [1.31, .08], [1.24, .17], [1.12, .18], [1, .07]], lm: [0, 2, 4, 6, 8] },
    pectoral: [[.32, -.02], [.40, -.06], [.47, -.03], [.48, .03], [.42, .08], [.33, .06]]
  },
  {
    id: 'tang', name: 'Blue tang', color: '#2F6FD1', size: 1.15,
    body: { ht: 0.30, hb: 0.27, pk: 0.45, st: 0.06, ex: 0.85 },
    dorsal: { p: [[.22, 0], [.30, -.06], [.40, -.07], [.50, -.07], [.62, -.07], [.74, -.07], [.84, -.06], [.88, 0]], lm: [0, 3, 7] },
    anal: { p: [[.42, 0], [.50, .07], [.65, .075], [.80, .06], [.86, 0]], lm: [0, 2, 4] },
    tail: { p: [[1, -.06], [1.15, -.18], [1.30, -.26], [1.27, -.12], [1.25, 0], [1.27, .12], [1.30, .26], [1.15, .18], [1, .06]], lm: [0, 2, 4, 6, 8] },
    pectoral: [[.33, 0], [.42, -.03], [.52, .04], [.44, .06], [.36, .08], [.32, .05]]
  },
  {
    id: 'angel', name: 'Angelfish', color: '#7C8C99', size: 1.1,
    body: { ht: 0.33, hb: 0.31, pk: 0.45, st: 0.05, ex: 0.7 },
    dorsal: { p: [[.30, 0], [.42, -.18], [.58, -.34], [.74, -.42], [.84, -.16], [.86, 0]], lm: [0, 2, 5] },
    anal: { p: [[.40, 0], [.52, .20], [.66, .36], [.80, .42], [.88, .14], [.88, 0]], lm: [0, 2, 5] },
    tail: { p: [[1, -.05], [1.12, -.20], [1.32, -.32], [1.24, -.10], [1.22, 0], [1.24, .10], [1.32, .32], [1.12, .20], [1, .05]], lm: [0, 2, 4, 6, 8] },
    pectoral: [[.30, .02], [.36, -.01], [.42, .02], [.40, .05], [.35, .07], [.30, .05]]
  },
  {
    id: 'tetra', name: 'Neon tetra', color: '#17A3A8', size: 0.75,
    body: { ht: 0.15, hb: 0.13, pk: 0.38, st: 0.045, ex: 0.7 },
    dorsal: { p: [[.46, 0], [.49, -.09], [.53, -.11], [.57, -.05], [.59, 0]], lm: [0, 2, 4] },
    anal: { p: [[.58, 0], [.62, .07], [.70, .08], [.78, .05], [.82, 0]], lm: [0, 2, 4] },
    tail: { p: [[1, -.04], [1.14, -.14], [1.26, -.20], [1.16, -.07], [1.12, 0], [1.16, .07], [1.26, .20], [1.14, .14], [1, .04]], lm: [0, 2, 4, 6, 8] },
    pectoral: [[.24, .02], [.29, 0], [.34, .03], [.31, .05], [.27, .06], [.24, .04]]
  },
  {
    id: 'betta', name: 'Betta', color: '#B3243B', size: 0.9,
    body: { ht: 0.17, hb: 0.16, pk: 0.40, st: 0.08, ex: 0.65 },
    dorsal: { p: [[.45, 0], [.55, -.15], [.68, -.22], [.85, -.25], [.95, -.10], [.93, 0]], lm: [0, 2, 5] },
    anal: { p: [[.35, 0], [.50, .25], [.70, .35], [.90, .38], [1.0, .20], [.98, 0]], lm: [0, 2, 5] },
    tail: { p: [[1, -.08], [1.15, -.32], [1.35, -.38], [1.50, -.20], [1.55, 0], [1.50, .20], [1.35, .38], [1.15, .32], [1, .08]], lm: [0, 2, 4, 6, 8] },
    pectoral: [[.26, .02], [.33, -.02], [.40, .03], [.36, .07], [.30, .08], [.26, .05]]
  }
];

export const REGIONS = [
  { id: 'body', name: 'Body shape' },
  { id: 'dorsal', name: 'Dorsal fin' },
  { id: 'anal', name: 'Anal fin' },
  { id: 'tail', name: 'Tail fin' },
  { id: 'pectoral', name: 'Side fins' }
];

// Discrete (Mendelian) genes. Higher rank = dominant.
// `shows` names the allele whose presence in the phenotype counts as "trait visible",
// used to describe hidden carriers.
export const TRAITS = [
  { id: 'color', name: 'Body color', alleles: {
      orange: { label: 'Orange', rank: 4 }, blue: { label: 'Blue', rank: 3 }, red: { label: 'Red', rank: 2 },
      teal: { label: 'Teal', rank: 1 }, silver: { label: 'Silver', rank: 0 } } },
  { id: 'albino', name: 'Pigment', alleles: { N: { label: 'Normal', rank: 1, quiet: true }, a: { label: 'Albino', rank: 0 } } },
  { id: 'whiteBars', name: 'White bars', alleles: { B: { label: 'Bars', rank: 1 }, b: { label: 'None', rank: 0, quiet: true } } },
  { id: 'darkBars', name: 'Dark bars', alleles: { D: { label: 'Bars', rank: 1 }, d: { label: 'None', rank: 0, quiet: true } } },
  { id: 'neon', name: 'Neon stripe', alleles: { N: { label: 'None', rank: 1, quiet: true }, n: { label: 'Stripe', rank: 0 } } },
  { id: 'saddle', name: 'Back marking', alleles: { K: { label: 'Marking', rank: 1 }, k: { label: 'None', rank: 0, quiet: true } } },
  { id: 'yellowTail', name: 'Yellow tail', alleles: { T: { label: 'Plain', rank: 1, quiet: true }, t: { label: 'Yellow', rank: 0 } } },
  { id: 'finEdge', name: 'Fin edges', alleles: { E: { label: 'Dark', rank: 1 }, e: { label: 'Plain', rank: 0, quiet: true } } },
  { id: 'spine', name: 'Tail spine', alleles: { S: { label: 'Spine', rank: 1 }, s: { label: 'None', rank: 0, quiet: true } } },
  { id: 'spots', name: 'Spots', alleles: { P: { label: 'None', rank: 1, quiet: true }, p: { label: 'Spots', rank: 0 } } }
];

const BASE_TRAITS = {
  color: ['orange', 'orange'], albino: ['N', 'N'], whiteBars: ['b', 'b'], darkBars: ['d', 'd'], neon: ['N', 'N'],
  saddle: ['k', 'k'], yellowTail: ['T', 'T'], finEdge: ['e', 'e'], spine: ['s', 's'], spots: ['P', 'P']
};

// Starting stock. Angelfish carry one hidden albino copy; the betta carries one hidden spots copy.
export const FOUNDERS = [
  { name: 'Clownfish', species: 'clown', traits: { color: ['orange', 'orange'], whiteBars: ['B', 'B'], finEdge: ['E', 'E'] } },
  { name: 'Blue tang', species: 'tang', traits: { color: ['blue', 'blue'], saddle: ['K', 'K'], yellowTail: ['t', 't'], spine: ['S', 'S'] } },
  { name: 'Angelfish 1', species: 'angel', traits: { color: ['silver', 'silver'], albino: ['N', 'a'], darkBars: ['D', 'D'] } },
  { name: 'Angelfish 2', species: 'angel', traits: { color: ['silver', 'silver'], albino: ['a', 'N'], darkBars: ['D', 'D'] } },
  { name: 'Neon tetra', species: 'tetra', traits: { color: ['teal', 'teal'], neon: ['n', 'n'] } },
  { name: 'Betta', species: 'betta', traits: { color: ['red', 'red'], spots: ['P', 'p'] } }
].map(f => ({ ...f, traits: { ...BASE_TRAITS, ...f.traits } }));

export const NAMES = ['Pip', 'Moss', 'Juno', 'Kelp', 'Wren', 'Fig', 'Nori', 'Bram', 'Opal', 'Tansy', 'Skip', 'Coral',
  'Dune', 'Miso', 'Olive', 'Rune', 'Sable', 'Tiko', 'Umi', 'Vale', 'Basil', 'Cleo', 'Echo', 'Fern', 'Gus', 'Hazel',
  'Iris', 'Jett', 'Kip', 'Lumi', 'Mako', 'Nell', 'Oz', 'Perch', 'Quill', 'Reed'];
