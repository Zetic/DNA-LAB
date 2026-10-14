import { SPECIES, REGIONS, TRAITS, FOUNDERS } from './species.js';

const NS = SPECIES.length;
const TOP_K = 4; // like skin weights: keep the four strongest influences

export const speciesIndex = id => SPECIES.findIndex(s => s.id === id);
const oneHot = i => SPECIES.map((_, j) => (j === i ? 1 : 0));
const clone = o => JSON.parse(JSON.stringify(o));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- genomes ----------
// genome = {
//   shape: { body: [allele, allele], dorsal: [...], ... }   allele = { w: [weights per species], m: mutated? }
//   size:  [ { v, m }, { v, m } ]
//   traits: { color: [ { v: 'orange', m }, { v: 'silver', m } ], ... }
// }
export function founderGenome(f) {
  const si = speciesIndex(f.species);
  const shape = {};
  REGIONS.forEach(r => { shape[r.id] = [{ w: oneHot(si), m: false }, { w: oneHot(si), m: false }]; });
  const sz = SPECIES[si].size;
  const traits = {};
  TRAITS.forEach(t => { traits[t.id] = f.traits[t.id].map(v => ({ v, m: false })); });
  return { shape, size: [{ v: sz, m: false }, { v: sz, m: false }], traits };
}

export function founders() {
  return FOUNDERS.map((f, i) => ({ id: i + 1, name: f.name, gen: 1, parents: null, genome: founderGenome(f) }));
}

// ---------- expression ----------
export function normalizeTopK(w) {
  const idx = w.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const keep = new Set(idx.slice(0, TOP_K).map(p => p[1]));
  const out = w.map((v, i) => (keep.has(i) ? Math.max(0, v) : 0));
  const sum = out.reduce((a, b) => a + b, 0) || 1;
  return out.map(v => v / sum);
}

export function expressShape(pair) {
  // what you see is the average of the two copies
  return normalizeTopK(pair[0].w.map((v, i) => (v + pair[1].w[i]) / 2));
}

export function expressTrait(geneId, pair) {
  const gene = TRAITS.find(t => t.id === geneId);
  const [a, b] = pair.map(p => p.v);
  return gene.alleles[a].rank >= gene.alleles[b].rank ? a : b;
}

// A trait that is carried but not shown, if any. "Absence" alleles (quiet) don't count.
export function hiddenAllele(geneId, pair) {
  const gene = TRAITS.find(t => t.id === geneId);
  const shown = expressTrait(geneId, pair);
  const other = pair.find(p => p.v !== shown);
  return other && !gene.alleles[other.v].quiet ? other.v : null;
}

export function phenotype(genome) {
  const shape = {};
  REGIONS.forEach(r => { shape[r.id] = expressShape(genome.shape[r.id]); });
  const traits = {};
  TRAITS.forEach(t => { traits[t.id] = expressTrait(t.id, genome.traits[t.id]); });
  const size = (genome.size[0].v + genome.size[1].v) / 2;
  return { shape, traits, size };
}

// Overall ancestry: average of the expressed region mixes.
export function ancestry(genome) {
  const tot = new Array(NS).fill(0);
  REGIONS.forEach(r => { expressShape(genome.shape[r.id]).forEach((v, i) => { tot[i] += v / REGIONS.length; }); });
  return tot;
}

// ---------- inheritance ----------
// Each parent passes on ONE of its two copies of every gene, chosen at random.
// That is what keeps variety alive across generations: siblings differ,
// and hidden (recessive) copies can resurface in grandchildren.
function mutateShape(allele, rate) {
  if (Math.random() >= rate) return allele;
  const target = Math.floor(Math.random() * NS);
  const m = 0.1 + Math.random() * 0.15;
  const w = allele.w.map((v, i) => v * (1 - m) + (i === target ? m : 0));
  return { w, m: true };
}

function mutateSize(allele, rate) {
  let v = allele.v + (Math.random() - 0.5) * 0.04;
  let m = allele.m;
  if (Math.random() < rate) { v += (Math.random() - 0.5) * 0.18; m = true; }
  return { v: Math.min(1.3, Math.max(0.65, v)), m };
}

function mutateTrait(geneId, allele, rate) {
  if (Math.random() >= rate / 2) return allele;
  const gene = TRAITS.find(t => t.id === geneId);
  const options = Object.keys(gene.alleles).filter(k => k !== allele.v);
  return { v: pick(options), m: true };
}

export function breed(parentA, parentB, rate) {
  const ga = parentA.genome, gb = parentB.genome;
  const fresh = a => ({ ...clone(a), m: false });
  const shape = {};
  REGIONS.forEach(r => {
    shape[r.id] = [mutateShape(fresh(pick(ga.shape[r.id])), rate), mutateShape(fresh(pick(gb.shape[r.id])), rate)];
  });
  const size = [mutateSize(fresh(pick(ga.size)), rate), mutateSize(fresh(pick(gb.size)), rate)];
  const traits = {};
  TRAITS.forEach(t => {
    traits[t.id] = [mutateTrait(t.id, fresh(pick(ga.traits[t.id])), rate), mutateTrait(t.id, fresh(pick(gb.traits[t.id])), rate)];
  });
  return { shape, size, traits };
}
