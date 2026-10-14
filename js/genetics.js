import { SPECIES, SLOTS, PARTS, TRAITS, DEFAULT_TRAITS } from './species.js';

const NS = SPECIES.length;
const TOP_K = 4; // like skin weights: keep the four strongest influences on the body

export const speciesById = id => SPECIES.find(s => s.id === id);
const speciesIndex = id => SPECIES.findIndex(s => s.id === id);
const oneHot = i => SPECIES.map((_, j) => (j === i ? 1 : 0));
const clone = o => JSON.parse(JSON.stringify(o));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- genome ----------
// {
//   body:   [ {w: [weight per species], m}, {…} ]       base-body species mix, two copies
//   size:   [ {v, m}, {v, m} ]                           overall size
//   parts:  { slot: [ {type, shape, size, m}, {…} ] }    fin part per slot, two copies
//   traits: { gene: [ {v, m}, {v, m} ] }                 color, patterns and extras
// }  m = changed by mutation
export function speciesGenome(speciesId) {
  const sp = speciesById(speciesId);
  const si = speciesIndex(speciesId);
  const parts = {};
  SLOTS.forEach(s => {
    const [type, shape, size] = sp.parts[s.id];
    const copy = () => ({ type, shape, size, m: false });
    const hidden = sp.hiddenParts && sp.hiddenParts[s.id];
    parts[s.id] = [copy(), hidden ? { type: hidden, shape, size, m: false } : copy()];
  });
  const traits = {};
  TRAITS.forEach(t => {
    const pair = (sp.traits && sp.traits[t.id]) || DEFAULT_TRAITS[t.id];
    traits[t.id] = pair.map(v => ({ v, m: false }));
  });
  return {
    body: [{ w: oneHot(si), m: false }, { w: oneHot(si), m: false }],
    size: [{ v: sp.size, m: false }, { v: sp.size, m: false }],
    parts, traits
  };
}

// ---------- expression ----------
export function normalizeTopK(w) {
  const order = w.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const keep = new Set(order.slice(0, TOP_K).map(p => p[1]));
  const out = w.map((v, i) => (keep.has(i) ? Math.max(0, v) : 0));
  const sum = out.reduce((a, b) => a + b, 0) || 1;
  return out.map(v => v / sum);
}

export const expressBody = pair => normalizeTopK(pair[0].w.map((v, i) => (v + pair[1].w[i]) / 2));

// Part: the dominant type is shown; shape and size are the average of both copies.
export function expressPart(slot, pair) {
  const lib = PARTS[slot];
  const [a, b] = pair;
  const type = lib[a.type].rank >= lib[b.type].rank ? a.type : b.type;
  return { type, shape: (a.shape + b.shape) / 2, size: (a.size + b.size) / 2 };
}
export function hiddenPart(slot, pair) {
  const shown = expressPart(slot, pair).type;
  const other = pair.find(p => p.type !== shown);
  return other ? other.type : null;
}

export function expressTrait(geneId, pair) {
  const gene = TRAITS.find(t => t.id === geneId);
  const [a, b] = pair.map(p => p.v);
  return gene.alleles[a].rank >= gene.alleles[b].rank ? a : b;
}
// A trait that is carried but not shown. "Absence" alleles (quiet) don't count.
export function hiddenAllele(geneId, pair) {
  const gene = TRAITS.find(t => t.id === geneId);
  const shown = expressTrait(geneId, pair);
  const other = pair.find(p => p.v !== shown);
  return other && !gene.alleles[other.v].quiet ? other.v : null;
}

export function phenotype(g) {
  const parts = {};
  SLOTS.forEach(s => { parts[s.id] = expressPart(s.id, g.parts[s.id]); });
  const traits = {};
  TRAITS.forEach(t => { traits[t.id] = expressTrait(t.id, g.traits[t.id]); });
  return { body: expressBody(g.body), size: (g.size[0].v + g.size[1].v) / 2, parts, traits };
}

// ---------- inheritance ----------
// Every gene: each parent passes on ONE of its two copies at random.
// Siblings differ, hidden (recessive) copies resurface, and hybrids breed with hybrids.
function mutateBody(c, rate) {
  if (Math.random() >= rate) return c;
  const target = Math.floor(Math.random() * NS);
  const m = 0.1 + Math.random() * 0.15;
  return { w: c.w.map((v, i) => v * (1 - m) + (i === target ? m : 0)), m: true };
}
function mutateSize(c, rate) {
  let v = c.v + (Math.random() - 0.5) * 0.04, m = c.m;
  if (Math.random() < rate) { v += (Math.random() - 0.5) * 0.18; m = true; }
  return { v: clamp(v, 0.6, 1.4), m };
}
function mutatePart(slot, c, rate) {
  if (Math.random() >= rate) return c;
  const r = Math.random();
  if (r < 0.34) {
    const types = Object.keys(PARTS[slot]).filter(t => t !== c.type);
    return { ...c, type: pick(types), m: true };
  }
  if (r < 0.67) return { ...c, shape: clamp(c.shape + (Math.random() - 0.5) * 0.6, 0, 1), m: true };
  return { ...c, size: clamp(c.size + (Math.random() - 0.5) * 0.4, 0, 1.5), m: true };
}
function mutateTrait(geneId, c, rate) {
  if (Math.random() >= rate / 2) return c;
  const gene = TRAITS.find(t => t.id === geneId);
  return { v: pick(Object.keys(gene.alleles).filter(k => k !== c.v)), m: true };
}

export function breed(pa, pb, rate) {
  const A = pa.genome, B = pb.genome;
  const take = pair => ({ ...clone(pick(pair)), m: false });
  const parts = {};
  SLOTS.forEach(s => {
    parts[s.id] = [mutatePart(s.id, take(A.parts[s.id]), rate), mutatePart(s.id, take(B.parts[s.id]), rate)];
  });
  const traits = {};
  TRAITS.forEach(t => {
    traits[t.id] = [mutateTrait(t.id, take(A.traits[t.id]), rate), mutateTrait(t.id, take(B.traits[t.id]), rate)];
  });
  return {
    body: [mutateBody(take(A.body), rate), mutateBody(take(B.body), rate)],
    size: [mutateSize(take(A.size), rate), mutateSize(take(B.size), rate)],
    parts, traits
  };
}

// Overall ancestry, from the body mix.
export const ancestry = g => expressBody(g.body);
