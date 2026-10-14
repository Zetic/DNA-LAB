import { SPECIES, PARTS } from './species.js';

// Fish are drawn in "fish units": nose at x=0, tail base at x=1, centre line y=0.
//  - Base body: every species is sampled at the same x positions, so any species mix
//    is a weighted sum of matching points (the shared-template trick).
//  - Fin parts: picked from the library, blended between the type's two variants,
//    then attached to sockets that ride the blended body and scale with it.

const N_BODY = 28;
const REF_DEPTH = 0.36; // body depth the part library was authored for

function bulge(x, pk, ex) {
  const u = Math.pow(Math.max(x, 0), Math.log(0.5) / Math.log(pk));
  return Math.pow(Math.max(0, Math.sin(Math.PI * u)), ex);
}
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
const upperEdge = (b, x) => -(b.ht * bulge(x, b.pk, b.ex) + b.st * smooth(0.55, 1, x));
const lowerEdge = (b, x) => b.hb * bulge(x, b.pk, b.ex) + b.st * smooth(0.55, 1, x);

const XS = [...Array(N_BODY + 1)].map((_, i) => i / N_BODY);
const PRE = SPECIES.map(s => ({ up: XS.map(x => upperEdge(s.body, x)), lo: XS.map(x => lowerEdge(s.body, x)) }));

const mixArr = (w, key) => XS.map((_, i) => w.reduce((acc, wi, s) => acc + (wi ? wi * PRE[s][key][i] : 0), 0));
const lerpPts = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

// ---------- geometry from phenotype ----------
export function fishGeometry(ph) {
  const up = mixArr(ph.body, 'up'), lo = mixArr(ph.body, 'lo');
  const edge = (arr, x) => {
    const f = Math.min(Math.max(x, 0), 1) * N_BODY, i = Math.min(Math.floor(f), N_BODY - 1), u = f - i;
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
  const T = x => edge(up, x), L = x => edge(lo, x);
  const body = XS.map((x, i) => [x, up[i]]).concat(XS.map((x, i) => [x, lo[i]]).reverse());

  // Parts scale with the body they sit on: deep bodies get taller fins.
  const depth = Math.max(...XS.map((_, i) => lo[i] - up[i]));
  const kD = Math.pow(Math.min(1.8, Math.max(0.6, depth / REF_DEPTH)), 0.6);
  const kP = Math.sqrt(kD);

  const part = slot => {
    const p = ph.parts[slot], def = PARTS[slot][p.type];
    return { pts: lerpPts(def.a, def.b, p.shape), size: p.size, sharp: !!def.sharp };
  };
  // Sockets that ride the blended body surface.
  const dorsalP = part('dorsal');
  const dorsal = dorsalP.pts.map(([x, dy]) => [x, T(x) + dy * dorsalP.size * kD]);
  const analP = part('anal');
  const anal = analP.pts.map(([x, dy]) => [x, L(x) + dy * analP.size * kD]);
  const tailP = part('tail');
  const tail = tailP.pts.map(([x, y]) => [1 + (x - 1) * tailP.size, y * tailP.size * kP]);
  tail[0][1] = T(1); tail[tail.length - 1][1] = L(1);
  const pecP = part('pectoral');
  const sx = 0.30, sy = T(sx) + (L(sx) - T(sx)) * 0.58;
  const pectoral = pecP.pts.map(([dx, dy]) => [sx + dx * pecP.size * kP, sy + dy * pecP.size * kP]);
  const pelP = part('pelvic');
  const px = 0.36, py = L(px) - 0.01; // root sunk slightly into the body to hide the seam
  const pelvic = pelP.pts.map(([dx, dy]) => [px + dx * pelP.size * kP, py + dy * pelP.size * kP]);

  return { T, L, kD, body, dorsal, anal, tail, pectoral, pelvic,
    sharp: { dorsal: dorsalP.sharp, anal: analP.sharp, tail: tailP.sharp, pectoral: pecP.sharp, pelvic: ph.parts.pelvic.type === 'threads' } };
}

// Extras live in the template for every fish and are only drawn when their gene says so.
function extrasGeometry(g, t) {
  const ex = {};
  if (t.spine === 'S') { const sy = (g.T(0.93) + g.L(0.93)) / 2; ex.spine = [[0.875, sy], [0.955, sy - 0.022], [0.965, sy], [0.955, sy + 0.022]]; }
  if (t.barbels === 'W') {
    const my = g.L(0.04) * 0.25;
    ex.barbels = [
      [[0.015, my], [-0.06, my + 0.07], [-0.07, my + 0.22]],
      [[0.025, my + 0.005], [0.0, my + 0.12], [0.07, my + 0.26]],
      [[0.01, my - 0.01], [-0.07, my - 0.04], [-0.12, my + 0.02]]
    ];
  }
  if (t.hump === 'H') {
    const r = 0.05 * Math.sqrt(g.kD);
    ex.hump = [0.06, 0.11, 0.16, 0.21, 0.26].map((x, i) => [x, g.T(x) - r * (0.2 + 0.25 * Math.sin(i * 1.7)), r * (0.8 + 0.25 * ((i * 7) % 3) / 2)]);
  }
  if (t.lure === 'L') {
    const by = g.T(0.14);
    ex.lure = { base: [0.14, by], ctrl: [0.24, by - 0.30], tip: [-0.03, by - 0.27] };
  }
  return ex;
}

export function bounds(geo, ex = {}) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const add = ([x, y], r = 0) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
  [geo.body, geo.dorsal, geo.anal, geo.tail, geo.pectoral, geo.pelvic].forEach(a => a.forEach(p => add(p)));
  if (ex.barbels) ex.barbels.forEach(c => c.forEach(p => add(p)));
  if (ex.hump) ex.hump.forEach(([x, y, r]) => add([x, y], r));
  if (ex.lure) { add(ex.lure.tip, 0.06); add(ex.lure.ctrl); }
  return { x0, x1, y0, y1 };
}
export function fishBounds(ph) {
  const g = fishGeometry(ph);
  return bounds(g, extrasGeometry(g, ph.traits));
}

// ---------- colour ----------
const BASE = { black: '#2E2B38', blue: '#2E6BD8', red: '#C42A3F', orange: '#EE7A2B', gold: '#E9A23B',
  teal: '#1EA7B0', yellow: '#EBC63A', silver: '#B9C2C8', white: '#F2F0EB' };
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(c) { return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
const tint = (h, t) => rgbHex(hexRgb(h).map(v => v + (255 - v) * t));
const shade = (h, t) => rgbHex(hexRgb(h).map(v => v * (1 - t)));
const lum = h => { const [r, g, b] = hexRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export function palette(ph) {
  const albino = ph.traits.albino === 'a';
  const base = albino ? '#F3E3DD' : BASE[ph.traits.color];
  const dark = lum(base) < 0.3, light = lum(base) > 0.72;
  return {
    albino,
    body: base,
    // light bodies get slightly darker fins so the fins still read against the body
    fin: albino ? '#EAD7D0' : light ? shade(base, 0.12) : tint(base, dark ? 0.2 : 0.35),
    line: albino ? '#C9A9A1' : (dark ? '#14121A' : shade(base, 0.45)),
    dark: albino ? '#E7CFC8' : (dark ? '#4A465C' : '#20262B'),
    white: '#FBFAF5',
    stripe: albino ? '#F1BDB4' : '#E2453C',
    patch: albino ? '#F2C9BF' : '#E8572A',
    yellow: albino ? '#F6E7B8' : '#F2C230',
    eye: albino ? '#E07A92' : '#1B1F23',
    spots: albino ? '#E9D2CB' : (dark ? tint(base, 0.45) : shade(base, 0.38)),
    hump: albino ? '#F6E2DA' : tint(base, 0.18)
  };
}

// ---------- SVG ----------
const f4 = v => (Math.round(v * 10000) / 10000).toString();
const pt = p => f4(p[0]) + ' ' + f4(p[1]);
const polyPath = pts => 'M' + pts.map(pt).join('L') + 'Z';

// Catmull-Rom curve along a fin's outer edge, closed with a straight line along the root
// (which sits hidden behind the body).
function finPath(pts, sharp) {
  if (sharp) return polyPath(pts);
  const n = pts.length - 1;
  let d = 'M' + pt(pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n)];
    d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' '
      + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
  }
  return d + 'Z';
}
function loopPath(pts, sharp) {
  if (sharp) return polyPath(pts);
  const n = pts.length, at = i => pts[(i + n) % n];
  let d = 'M' + pt(pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' '
      + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
  }
  return d + 'Z';
}

function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Markup for a fish in fish units. `uid` must be unique per rendered copy (clip ids).
export function fishMarkup(ph, uid, seed = 1) {
  const g = fishGeometry(ph);
  const t = ph.traits;
  const ex = extrasGeometry(g, t);
  const c = palette(ph);
  const NS = 'vector-effect="non-scaling-stroke"';
  const finStroke = t.finEdge === 'E' && !c.albino ? `stroke="${c.dark}" stroke-width="2.2"` : `stroke="${c.line}" stroke-width="0.8"`;
  const fin = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" fill-opacity=".9" ${finStroke} ${NS} stroke-linejoin="round" ${extra}/>`;
  const bodyD = polyPath(g.body);

  let s = `<defs><clipPath id="clip-${uid}"><path d="${bodyD}"/></clipPath></defs>`;
  if (ex.lure) {
    const { base, ctrl, tip } = ex.lure;
    s += `<path d="M${pt(base)}Q${pt(ctrl)} ${pt(tip)}" fill="none" stroke="${c.line}" stroke-width="1.6" ${NS} stroke-linecap="round"/>`;
    s += `<circle cx="${f4(tip[0])}" cy="${f4(tip[1])}" r="0.06" fill="#D8F27A" opacity=".28"/><circle cx="${f4(tip[0])}" cy="${f4(tip[1])}" r="0.034" fill="#D8F27A" stroke="${c.line}" stroke-width="0.8" ${NS}/>`;
  }
  s += `<g class="tail">${fin(finPath(g.tail, g.sharp.tail), t.yellowTail === 't' ? c.yellow : c.fin)}</g>`;
  s += fin(finPath(g.dorsal, g.sharp.dorsal), c.fin);
  s += fin(finPath(g.anal, g.sharp.anal), c.fin);
  if (ph.parts.pelvic.size > 0.05) s += fin(finPath(g.pelvic, g.sharp.pelvic), c.fin);
  s += `<path d="${bodyD}" fill="${c.body}"/>`;

  // Pattern layers: masks on the shared body, switched on by genes (never averaged).
  let pat = '';
  if (t.patches === 'c') {
    const rnd = seeded(seed + 17);
    for (let i = 0; i < 6; i++) {
      const x = 0.12 + rnd() * 0.8, k = rnd();
      const y = g.T(x) + (g.L(x) - g.T(x)) * k * 0.8;
      pat += `<ellipse cx="${f4(x)}" cy="${f4(y)}" rx="${f4(0.06 + rnd() * 0.07)}" ry="${f4(0.04 + rnd() * 0.05)}" fill="${c.patch}" opacity=".92"/>`;
    }
  }
  if (t.neon === 'n') {
    const band = [];
    for (let i = 0; i <= 20; i++) { const x = 0.1 + 0.9 * i / 20; band.push([x, g.L(x) * 0.05]); }
    for (let i = 20; i >= 0; i--) { const x = 0.1 + 0.9 * i / 20; band.push([x, g.L(x) * 0.55]); }
    pat += `<path d="${polyPath(band)}" fill="${c.stripe}"/>`;
  }
  if (t.saddle === 'K') {
    const band = [];
    for (let i = 0; i <= 20; i++) { const x = 0.2 + 0.8 * i / 20; band.push([x, g.T(x) * 0.3]); }
    for (let i = 20; i >= 0; i--) { const x = 0.2 + 0.8 * i / 20; band.push([x, g.T(x) * 0.92]); }
    pat += `<path d="${polyPath(band)}" fill="${c.dark}" opacity=".9"/>`;
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
    for (let i = 0; i < 16; i++) {
      const x = 0.15 + rnd() * 0.8, k = rnd();
      const y = g.T(x) * 0.8 + (g.L(x) * 0.8 - g.T(x) * 0.8) * k;
      pat += `<circle cx="${f4(x)}" cy="${f4(y)}" r="${f4(0.013 + rnd() * 0.012)}" fill="${c.spots}"/>`;
    }
  }
  if (pat) s += `<g clip-path="url(#clip-${uid})">${pat}</g>`;
  s += `<path d="${bodyD}" fill="none" stroke="${c.line}" stroke-width="1" ${NS} stroke-linejoin="round"/>`;

  if (ex.hump) ex.hump.forEach(([x, y, r]) => { s += `<circle cx="${f4(x)}" cy="${f4(y)}" r="${f4(r)}" fill="${c.hump}" stroke="${c.line}" stroke-width="0.7" ${NS}/>`; });
  s += fin(loopPath(g.pectoral, g.sharp.pectoral), c.fin, 'opacity=".92"');
  if (ex.spine) s += `<path d="${polyPath(ex.spine)}" fill="${c.albino ? '#F7EFE0' : '#F4E3B0'}" stroke="${c.line}" stroke-width="0.8" ${NS}/>`;
  if (ex.barbels) ex.barbels.forEach(([a, q, b]) => { s += `<path d="M${pt(a)}Q${pt(q)} ${pt(b)}" fill="none" stroke="${c.line}" stroke-width="1.3" ${NS} stroke-linecap="round"/>`; });
  const exx = 0.115, eyy = g.T(exx) * 0.38;
  s += `<circle cx="${exx}" cy="${f4(eyy)}" r="0.03" fill="#FBFAF5"/><circle cx="${exx}" cy="${f4(eyy)}" r="0.019" fill="${c.eye}"/>`;
  return s;
}

// A standalone <svg> fitted around the fish, for cards and the genome sheet.
export function fishSVG(ph, uid, { seed = 1, pad = 0.06, label = '' } = {}) {
  const b = fishBounds(ph);
  const w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2;
  return `<svg viewBox="${f4(b.x0 - pad)} ${f4(b.y0 - pad)} ${f4(w)} ${f4(h)}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${fishMarkup(ph, uid, seed)}</svg>`;
}
