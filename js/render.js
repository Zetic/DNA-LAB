import { SPECIES } from './species.js';

// Fish are drawn in "fish units": nose at x=0, tail base at x=1, centre line y=0.
// Every species is resampled onto the same points, so any mix of species is just
// a weighted sum of matching points (the shared-template trick).

const N_BODY = 28;
const FIN_SECTIONS = { dorsal: [8, 8], anal: [6, 6], tail: [4, 4, 4, 4] };

function bulge(x, pk, ex) {
  const u = Math.pow(Math.max(x, 0), Math.log(0.5) / Math.log(pk));
  return Math.pow(Math.max(0, Math.sin(Math.PI * u)), ex);
}
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
const upperEdge = (b, x) => -(b.ht * bulge(x, b.pk, b.ex) + b.st * smooth(0.55, 1, x));
const lowerEdge = (b, x) => b.hb * bulge(x, b.pk, b.ex) + b.st * smooth(0.55, 1, x);

function resampleChain(chain, count) {
  const cum = [0];
  for (let i = 1; i < chain.length; i++) cum.push(cum[i - 1] + Math.hypot(chain[i][0] - chain[i - 1][0], chain[i][1] - chain[i - 1][1]));
  const total = cum[cum.length - 1], out = [];
  for (let k = 0; k < count; k++) {
    const d = total * k / count;
    let seg = 1;
    while (seg < cum.length - 1 && cum[seg] < d) seg++;
    const a = chain[seg - 1], b = chain[seg], len = cum[seg] - cum[seg - 1], u = len > 0 ? (d - cum[seg - 1]) / len : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
// Round off the corners of an authored outline section, keeping its two landmark ends fixed.
function chaikin(chain, iterations = 2) {
  let c = chain;
  for (let k = 0; k < iterations && c.length > 2; k++) {
    const next = [c[0]];
    for (let i = 0; i < c.length - 1; i++) {
      const a = c[i], b = c[i + 1];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    next.push(c[c.length - 1]);
    c = next;
  }
  return c;
}
// Resample a fin between its landmarks so every species has identical point counts.
function resampleFin(fin, counts) {
  if (fin.lm.length - 1 !== counts.length) throw new Error('landmark count mismatch');
  let out = [];
  for (let s = 0; s < fin.lm.length - 1; s++) out = out.concat(resampleChain(chaikin(fin.p.slice(fin.lm[s], fin.lm[s + 1] + 1)), counts[s]));
  out.push(fin.p[fin.lm[fin.lm.length - 1]]);
  return out;
}

const PRE = SPECIES.map(s => {
  const xs = [...Array(N_BODY + 1)].map((_, i) => i / N_BODY);
  return {
    up: xs.map(x => upperEdge(s.body, x)),
    lo: xs.map(x => lowerEdge(s.body, x)),
    dorsal: resampleFin(s.dorsal, FIN_SECTIONS.dorsal),
    anal: resampleFin(s.anal, FIN_SECTIONS.anal),
    tail: resampleFin(s.tail, FIN_SECTIONS.tail),
    pectoral: s.pectoral
  };
});

const mixArr = (w, get) => {
  const first = get(0);
  return first.map((_, i) => w.reduce((acc, wi, s) => acc + (wi ? wi * get(s)[i] : 0), 0));
};
const mixPts = (w, get) => {
  const first = get(0);
  return first.map((_, i) => [0, 1].map(k => w.reduce((acc, wi, s) => acc + (wi ? wi * get(s)[i][k] : 0), 0)));
};

// ---------- geometry from phenotype ----------
export function fishGeometry(ph) {
  const up = mixArr(ph.shape.body, s => PRE[s].up);
  const lo = mixArr(ph.shape.body, s => PRE[s].lo);
  const edge = (arr, x) => {
    const f = Math.min(Math.max(x, 0), 1) * N_BODY, i = Math.min(Math.floor(f), N_BODY - 1), u = f - i;
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
  const T = x => edge(up, x), L = x => edge(lo, x);
  const body = [];
  for (let i = 0; i <= N_BODY; i++) body.push([i / N_BODY, up[i]]);
  for (let i = N_BODY; i >= 0; i--) body.push([i / N_BODY, lo[i]]);
  const dorsal = mixPts(ph.shape.dorsal, s => PRE[s].dorsal).map(([x, dy]) => [x, T(x) + dy]);
  const anal = mixPts(ph.shape.anal, s => PRE[s].anal).map(([x, dy]) => [x, L(x) + dy]);
  const tail = mixPts(ph.shape.tail, s => PRE[s].tail);
  tail[0][1] = T(1); tail[tail.length - 1][1] = L(1);
  const pectoral = mixPts(ph.shape.pectoral, s => PRE[s].pectoral);
  return { T, L, body, dorsal, anal, tail, pectoral };
}

export function bounds(geo) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  [geo.body, geo.dorsal, geo.anal, geo.tail].forEach(a => a.forEach(([x, y]) => {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }));
  return { x0, x1, y0, y1 };
}

// ---------- colour ----------
const BASE = { orange: '#EE7A2B', blue: '#2E6BD8', red: '#C42A3F', teal: '#1EA7B0', silver: '#B9C2C8' };
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(c) { return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
const tint = (h, t) => rgbHex(hexRgb(h).map(v => v + (255 - v) * t));
const shade = (h, t) => rgbHex(hexRgb(h).map(v => v * (1 - t)));

export function palette(ph) {
  const albino = ph.traits.albino === 'a';
  const base = albino ? '#F3E3DD' : BASE[ph.traits.color];
  return {
    albino,
    body: base,
    fin: albino ? '#F8EDE8' : tint(base, 0.35),
    line: albino ? '#C9A9A1' : shade(base, 0.45),
    dark: albino ? '#E7CFC8' : '#20262B',
    white: '#FBFAF5',
    stripe: albino ? '#F1BDB4' : '#E2453C',
    yellow: albino ? '#F6E7B8' : '#F2C230',
    eye: albino ? '#E07A92' : '#1B1F23',
    spots: albino ? '#E9D2CB' : shade(base, 0.35)
  };
}

// ---------- SVG ----------
const f4 = v => (Math.round(v * 10000) / 10000).toString();
const pathOf = pts => 'M' + pts.map(([x, y]) => f4(x) + ' ' + f4(y)).join('L') + 'Z';
const pt = p => f4(p[0]) + ' ' + f4(p[1]);

// Catmull-Rom curves through the points, so fins read as curves instead of polygons.
// Fins: smooth the outer edge, then close with a straight line along the root (hidden behind the body).
function finPath(pts) {
  const n = pts.length - 1;
  let d = 'M' + pt(pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
  }
  return d + 'Z';
}
function loopPath(pts) {
  const n = pts.length, at = i => pts[(i + n) % n];
  let d = 'M' + pt(pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
  }
  return d + 'Z';
}

function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Returns markup for a fish in fish units. `uid` must be unique per rendered copy (clip ids).
export function fishMarkup(ph, uid, seed = 1) {
  const g = fishGeometry(ph);
  const c = palette(ph);
  const t = ph.traits;
  const NS = 'vector-effect="non-scaling-stroke"';
  const finStroke = t.finEdge === 'E' && !c.albino ? `stroke="${c.dark}" stroke-width="2.2"` : `stroke="${c.line}" stroke-width="0.8"`;
  const tailFill = t.yellowTail === 't' ? c.yellow : c.fin;
  let s = `<defs><clipPath id="clip-${uid}"><path d="${pathOf(g.body)}"/></clipPath></defs>`;
  s += `<g class="tail"><path d="${finPath(g.tail)}" fill="${tailFill}" ${finStroke} ${NS} stroke-linejoin="round"/></g>`;
  s += `<path d="${finPath(g.dorsal)}" fill="${c.fin}" ${finStroke} ${NS} stroke-linejoin="round"/>`;
  s += `<path d="${finPath(g.anal)}" fill="${c.fin}" ${finStroke} ${NS} stroke-linejoin="round"/>`;
  s += `<path d="${pathOf(g.body)}" fill="${c.body}"/>`;

  // Pattern layers: masks on the shared layout, chosen by genes (not averaged).
  let pat = '';
  if (t.neon === 'n') {
    const band = [];
    for (let i = 0; i <= 20; i++) { const x = 0.1 + 0.9 * i / 20; band.push([x, g.L(x) * 0.05]); }
    for (let i = 20; i >= 0; i--) { const x = 0.1 + 0.9 * i / 20; band.push([x, g.L(x) * 0.55]); }
    pat += `<path d="${pathOf(band)}" fill="${c.stripe}"/>`;
  }
  if (t.saddle === 'K') {
    const band = [];
    for (let i = 0; i <= 20; i++) { const x = 0.2 + 0.8 * i / 20; band.push([x, g.T(x) * 0.3]); }
    for (let i = 20; i >= 0; i--) { const x = 0.2 + 0.8 * i / 20; band.push([x, g.T(x) * 0.92]); }
    pat += `<path d="${pathOf(band)}" fill="${c.dark}" opacity=".9"/>`;
  }
  if (t.darkBars === 'D') {
    [[0.13, 0.045], [0.38, 0.055], [0.66, 0.05]].forEach(([x, w]) => {
      pat += `<rect x="${f4(x - w / 2)}" y="-1" width="${f4(w)}" height="2" fill="${c.dark}" opacity=".78"/>`;
    });
  }
  if (t.whiteBars === 'B') {
    [[0.2, 0.06], [0.47, 0.075], [0.75, 0.055]].forEach(([x, w]) => {
      pat += `<rect x="${f4(x - w / 2)}" y="-1" width="${f4(w)}" height="2" fill="${c.white}" stroke="${c.dark}" stroke-width="1.3" ${NS}/>`;
    });
  }
  if (t.spots === 'p') {
    const rnd = seeded(seed);
    for (let i = 0; i < 14; i++) {
      const x = 0.15 + rnd() * 0.8, k = rnd();
      const y = g.T(x) * 0.8 + (g.L(x) * 0.8 - g.T(x) * 0.8) * k;
      pat += `<circle cx="${f4(x)}" cy="${f4(y)}" r="${f4(0.014 + rnd() * 0.012)}" fill="${c.spots}"/>`;
    }
  }
  if (pat) s += `<g clip-path="url(#clip-${uid})">${pat}</g>`;
  s += `<path d="${pathOf(g.body)}" fill="none" stroke="${c.line}" stroke-width="1" ${NS} stroke-linejoin="round"/>`;
  s += `<path d="${loopPath(g.pectoral)}" fill="${c.fin}" opacity=".92" ${finStroke} ${NS} stroke-linejoin="round"/>`;
  if (t.spine === 'S') {
    // A feature that lives in the superset template: collapsed (not drawn) unless the gene says so.
    const sy = (g.T(0.93) + g.L(0.93)) * 0.5;
    s += `<path d="M0.875 ${f4(sy)}L0.955 ${f4(sy - 0.022)}L0.965 ${f4(sy)}L0.955 ${f4(sy + 0.022)}Z" fill="${c.albino ? '#F7EFE0' : '#F4E3B0'}" stroke="${c.line}" stroke-width="0.8" ${NS}/>`;
  }
  const ex = 0.115, ey = g.T(ex) * 0.38;
  s += `<circle cx="${ex}" cy="${f4(ey)}" r="0.03" fill="#FBFAF5"/><circle cx="${ex}" cy="${f4(ey)}" r="0.019" fill="${c.eye}"/>`;
  return s;
}

// A standalone <svg> fitted around the fish, for cards and the genome sheet.
export function fishSVG(ph, uid, { seed = 1, pad = 0.06, label = '' } = {}) {
  const b = bounds(fishGeometry(ph));
  const w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2;
  return `<svg viewBox="${f4(b.x0 - pad)} ${f4(b.y0 - pad)} ${f4(w)} ${f4(h)}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${fishMarkup(ph, uid, seed)}</svg>`;
}
