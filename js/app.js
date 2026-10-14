import { SPECIES, REGIONS, TRAITS, NAMES } from './species.js';
import { founders, phenotype, breed, expressShape, hiddenAllele, ancestry } from './genetics.js';
import { fishSVG, fishMarkup, fishGeometry, bounds } from './render.js';

const STORE_KEY = 'dnalab.v1';
const TANK_MAX = 12;
const CLUTCH_SIZE = 4;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- state ----------
let state = load() || fresh();
let clutch = [];
let selectedId = state.fish[0] ? state.fish[0].id : null;
let renderSeq = 0;
const phCache = new Map();
const ph = f => { if (!phCache.has(f.id)) phCache.set(f.id, phenotype(f.genome)); return phCache.get(f.id); };
const uid = () => 'f' + (++renderSeq);

function fresh() {
  const fish = founders();
  return { v: 1, fish, nextId: fish.length + 1, parentA: null, parentB: null, mutation: 0.04 };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.v === 1 && Array.isArray(s.fish) ? s : null;
  } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep going in memory */ }
}

const findFish = id => state.fish.find(f => f.id === id) || clutch.find(f => f.id === id) || null;
const inTank = id => state.fish.some(f => f.id === id);

function pickName() {
  const used = new Set(state.fish.concat(clutch).map(f => f.name));
  const free = NAMES.filter(n => !used.has(n));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  let i = 2;
  while (used.has(NAMES[0] + ' ' + i)) i++;
  return NAMES[0] + ' ' + i;
}

function ancestryText(f, max = 3) {
  const a = ancestry(f.genome).map((v, i) => [v, i]).filter(p => p[0] >= 0.05).sort((x, y) => y[0] - x[0]);
  if (a.length === 1) return 'pure ' + SPECIES[a[0][1]].name.toLowerCase();
  return a.slice(0, max).map(([v, i]) => Math.round(v * 100) + '% ' + SPECIES[i].name.toLowerCase()).join(', ');
}

// ---------- roster ----------
function tagHTML(f, { badges = true } = {}) {
  const b = [];
  if (badges && state.parentA === f.id) b.push('<span class="badge" title="Parent A">A</span>');
  if (badges && state.parentB === f.id) b.push('<span class="badge" title="Parent B">B</span>');
  return `<button class="tag" type="button" data-id="${f.id}" aria-pressed="${selectedId === f.id}">
    ${b.length ? `<span class="badges">${b.join('')}</span>` : ''}
    ${fishSVG(ph(f), uid(), { seed: f.id, label: esc(f.name) })}
    <span class="tag-name">${esc(f.name)}</span>
    <span class="tag-meta">Generation ${f.gen}</span>
  </button>`;
}

function renderRoster() {
  $('roster').innerHTML = state.fish.map(f => `<li>${tagHTML(f)}</li>`).join('');
  $('tankCount').textContent = `${state.fish.length} of ${TANK_MAX} spaces used`;
}

// ---------- bench ----------
function slotHTML(id, letter) {
  const f = id ? findFish(id) : null;
  if (!f) return `<span class="slot-label">Parent ${letter}</span><span class="slot-empty">Select a fish, then choose Use as parent ${letter}.</span>`;
  return `<span class="slot-label">Parent ${letter}</span>${fishSVG(ph(f), uid(), { seed: f.id, label: esc(f.name) })}<span class="slot-name">${esc(f.name)}</span>`;
}

function renderBench() {
  $('slotA').innerHTML = slotHTML(state.parentA, 'A');
  $('slotB').innerHTML = slotHTML(state.parentB, 'B');
  $('slotA').classList.toggle('filled', !!state.parentA);
  $('slotB').classList.toggle('filled', !!state.parentB);
  $('breedBtn').disabled = !(state.parentA && state.parentB);
  $('mut').value = Math.round(state.mutation * 100);
  $('mutOut').textContent = Math.round(state.mutation * 100) + '%';
  if (!clutch.length) {
    $('clutch').innerHTML = '<li class="clutch-empty">Breed two fish to see their babies here.</li>';
  } else {
    const full = state.fish.length >= TANK_MAX;
    $('clutch').innerHTML = clutch.map(f => `<li>${tagHTML(f, { badges: false })}
      <button class="btn small keep" type="button" data-keep="${f.id}" ${full ? 'disabled' : ''}>Keep ${esc(f.name)}</button></li>`).join('');
  }
}

// ---------- genome sheet ----------
const pct = v => Math.round(v * 100) + '%';
function barHTML(w) {
  return `<span class="bar" aria-hidden="true">${w.map((v, i) => v > 0.001 ? `<i style="width:${(v * 100).toFixed(1)}%;background:${SPECIES[i].color}"></i>` : '').join('')}</span>`;
}
function mixText(w) {
  const parts = w.map((v, i) => [v, i]).filter(p => p[0] >= 0.05).sort((a, b) => b[0] - a[0]);
  if (parts.length === 1) return SPECIES[parts[0][1]].name;
  return parts.map(([v, i]) => pct(v) + ' ' + SPECIES[i].name.toLowerCase()).join(', ');
}
const mutTag = a => (a.m ? '<span class="mut" title="Changed by mutation">new</span>' : '');

function renderSheet() {
  const f = selectedId ? findFish(selectedId) : null;
  const el = $('sheet');
  if (!f) { el.innerHTML = '<h2>Genome sheet</h2><p class="sheet-empty">Select a fish to read its genes.</p>'; return; }
  const p = ph(f);
  const parentNames = f.parents ? f.parents.map(x => esc(x.name)).join(' and ') : null;
  const meta = f.parents
    ? `Generation ${f.gen}. Parents: ${parentNames}. Ancestry: ${ancestryText(f)}.`
    : `Generation 1. Starting stock: ${ancestryText(f)}.`;
  const tank = inTank(f.id);
  const full = state.fish.length >= TANK_MAX;
  const actions = tank
    ? `<button class="btn" type="button" data-act="A">Use as parent A</button>
       <button class="btn" type="button" data-act="B">Use as parent B</button>
       <button class="btn" type="button" data-act="release">Release</button>`
    : `<button class="btn primary" type="button" data-keep="${f.id}" ${full ? 'disabled' : ''}>Keep</button>
       <span class="hint">${full ? 'The tank is full. Release a fish to make room.' : 'In the clutch. Keep this fish to breed it later.'}</span>`;

  const shapeRows = REGIONS.map(r => {
    const [a, b] = f.genome.shape[r.id];
    const shown = expressShape(f.genome.shape[r.id]);
    return `<div class="gene-row">
      <span class="gene-name">${r.name}</span>
      <span class="cell" data-label="Copy 1">${barHTML(a.w)}<span class="mix-text">${mixText(a.w)}${mutTag(a)}</span></span>
      <span class="cell" data-label="Copy 2">${barHTML(b.w)}<span class="mix-text">${mixText(b.w)}${mutTag(b)}</span></span>
      <span class="cell shows" data-label="Shows">${barHTML(shown)}<span class="mix-text">${mixText(shown)}</span></span>
    </div>`;
  }).join('');

  const traitRows = TRAITS.map(t => {
    const pair = f.genome.traits[t.id];
    const shown = p.traits[t.id];
    const hid = hiddenAllele(t.id, pair);
    const label = k => t.alleles[k].label;
    return `<div class="gene-row">
      <span class="gene-name">${t.name}</span>
      <span class="cell allele" data-label="Copy 1">${label(pair[0].v)}${mutTag(pair[0])}</span>
      <span class="cell allele" data-label="Copy 2">${label(pair[1].v)}${mutTag(pair[1])}</span>
      <span class="cell shows" data-label="Shows">${label(shown)}${hid ? `<span class="hidden-note">Carries hidden ${label(hid).toLowerCase()}</span>` : ''}</span>
    </div>`;
  }).join('');

  const [s1, s2] = f.genome.size;
  el.innerHTML = `
    <h2>${esc(f.name)}</h2>
    <p class="sheet-meta">${meta}</p>
    <div class="sheet-fish">${fishSVG(p, uid(), { seed: f.id, label: esc(f.name), pad: 0.08 })}</div>
    <div class="sheet-actions">${actions}</div>
    <h3>Shape genes</h3>
    <p class="hint">Each copy is a recipe of species. The fish shows the average of its two copies.</p>
    <div class="legend">${SPECIES.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>
    <div class="genes">
      <div class="gene-row head"><span>Gene</span><span>Copy 1</span><span>Copy 2</span><span>Shows</span></div>
      ${shapeRows}
      <div class="gene-row">
        <span class="gene-name">Size</span>
        <span class="cell allele" data-label="Copy 1">${pct(s1.v)}${mutTag(s1)}</span>
        <span class="cell allele" data-label="Copy 2">${pct(s2.v)}${mutTag(s2)}</span>
        <span class="cell shows" data-label="Shows">${pct(p.size)}</span>
      </div>
    </div>
    <h3>Trait genes</h3>
    <p class="hint">A dominant copy hides a recessive one. Hidden copies can come back in later generations.</p>
    <div class="genes">
      <div class="gene-row head"><span>Gene</span><span>Copy 1</span><span>Copy 2</span><span>Shows</span></div>
      ${traitRows}
    </div>`;
}

// ---------- tank ----------
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const swimmers = new Map(); // id -> sim state
let tankW = 800, tankH = 320;
const SAND = 26;

function tankScale(size) { return Math.max(38, Math.min(78, tankH / 4.4)) * size; }

function placeSwimmer(f, i, n) {
  const p = ph(f);
  const b = bounds(fishGeometry(p));
  const sc = tankScale(p.size);
  const halfLen = (b.x1 - b.x0) * sc / 2;
  const top = -b.y0 * sc + 8, bottom = tankH - SAND - b.y1 * sc - 6;
  const yMin = Math.min(top, bottom), yMax = Math.max(top, bottom);
  const x = reduceMotion ? ((i + 0.5) / n) * tankW : halfLen + Math.random() * Math.max(1, tankW - 2 * halfLen);
  const y = reduceMotion ? yMin + ((i * 37) % 100) / 100 * (yMax - yMin) : yMin + Math.random() * (yMax - yMin);
  return {
    x, y, ty: y, dir: Math.random() < 0.5 ? -1 : 1,
    speed: (26 + Math.random() * 18) / Math.sqrt(p.size),
    phase: Math.random() * 6.28, sc, halfLen, yMin, yMax, cx: (b.x0 + b.x1) / 2,
    nextTurn: 4 + Math.random() * 6, nextDepth: 2 + Math.random() * 4
  };
}

function buildTank() {
  const svg = $('tank');
  svg.setAttribute('viewBox', `0 0 ${tankW} ${tankH}`);
  const ids = new Set(state.fish.map(f => f.id));
  [...swimmers.keys()].forEach(id => { if (!ids.has(id)) swimmers.delete(id); });
  state.fish.forEach((f, i) => { if (!swimmers.has(f.id)) swimmers.set(f.id, placeSwimmer(f, i, state.fish.length)); });
  svg.innerHTML = state.fish.map(f => `<g class="swimmer" data-id="${f.id}"><g class="body-g">${fishMarkup(ph(f), uid(), f.id)}</g></g>`).join('')
    + '<path class="marker" id="marker" d="M-7 -12L7 -12L0 -2Z" opacity="0"/>';
  positionAll(0);
}

function positionAll(dt) {
  const svg = $('tank');
  let selPos = null;
  svg.querySelectorAll('.swimmer').forEach(node => {
    const id = +node.dataset.id;
    const s = swimmers.get(id);
    if (!s) return;
    if (dt > 0) {
      s.nextTurn -= dt; s.nextDepth -= dt;
      s.x += s.dir * s.speed * dt;
      if (s.x < s.halfLen + 4 && s.dir < 0) { s.dir = 1; s.nextTurn = 4 + Math.random() * 6; }
      if (s.x > tankW - s.halfLen - 4 && s.dir > 0) { s.dir = -1; s.nextTurn = 4 + Math.random() * 6; }
      if (s.nextTurn <= 0) { s.dir *= -1; s.nextTurn = 4 + Math.random() * 7; }
      if (s.nextDepth <= 0) { s.ty = s.yMin + Math.random() * (s.yMax - s.yMin); s.nextDepth = 3 + Math.random() * 5; }
      s.y += (s.ty - s.y) * Math.min(1, dt * 0.6);
      s.phase += dt * (6 + s.speed * 0.08);
    }
    const flip = s.dir > 0 ? -1 : 1; // drawn nose-left; flip to face right
    const bob = reduceMotion ? 0 : Math.sin(s.phase * 0.35) * 2;
    node.setAttribute('transform', `translate(${s.x.toFixed(1)} ${(s.y + bob).toFixed(1)}) scale(${(flip * s.sc).toFixed(3)} ${s.sc.toFixed(3)}) translate(${(-s.cx).toFixed(3)} 0)`);
    const tail = node.querySelector('.tail');
    if (tail) {
      const k = reduceMotion ? 1 : 0.78 + 0.22 * Math.sin(s.phase);
      tail.setAttribute('transform', `translate(1 0) scale(${k.toFixed(3)} 1) translate(-1 0)`);
    }
    if (id === selectedId) selPos = s;
  });
  const m = $('marker');
  if (m) {
    if (selPos) {
      const p = ph(findFish(selectedId));
      const b = bounds(fishGeometry(p));
      m.setAttribute('transform', `translate(${selPos.x.toFixed(1)} ${(selPos.y + b.y0 * selPos.sc - 4).toFixed(1)})`);
      m.setAttribute('opacity', '1');
    } else m.setAttribute('opacity', '0');
  }
}

let last = null;
function tick(t) {
  const dt = last === null ? 0 : Math.min(0.05, (t - last) / 1000);
  last = t;
  positionAll(dt);
  requestAnimationFrame(tick);
}

function resizeTank() {
  const box = $('tankBox');
  const w = Math.round(box.clientWidth), h = Math.round(box.clientHeight);
  if (!w || !h || (w === tankW && h === tankH)) return;
  tankW = w; tankH = h;
  swimmers.clear();
  buildTank();
}

// ---------- actions ----------
function select(id) { selectedId = id; renderRoster(); renderBench(); renderSheet(); positionAll(0); }

function setParent(letter, id) {
  if (letter === 'A') { if (state.parentB === id) state.parentB = null; state.parentA = id; }
  else { if (state.parentA === id) state.parentA = null; state.parentB = id; }
  $('benchMsg').textContent = '';
  save(); renderRoster(); renderBench();
}

function doBreed() {
  const a = findFish(state.parentA), b = findFish(state.parentB);
  if (!a || !b) return;
  clutch = [];
  const gen = Math.max(a.gen, b.gen) + 1;
  for (let i = 0; i < CLUTCH_SIZE; i++) {
    const baby = {
      id: state.nextId++, name: '', gen,
      parents: [{ id: a.id, name: a.name }, { id: b.id, name: b.name }],
      genome: breed(a, b, state.mutation)
    };
    baby.name = pickName();
    clutch.push(baby);
  }
  save();
  $('benchMsg').textContent = `${CLUTCH_SIZE} babies hatched. Keep the ones you want before you breed again.`;
  selectedId = clutch[0].id;
  renderRoster(); renderBench(); renderSheet(); positionAll(0);
}

function keep(id) {
  const f = clutch.find(x => x.id === id);
  if (!f) return;
  if (state.fish.length >= TANK_MAX) { $('benchMsg').textContent = 'The tank is full. Release a fish to make room.'; return; }
  clutch = clutch.filter(x => x.id !== id);
  state.fish.push(f);
  save();
  $('benchMsg').textContent = `Kept ${f.name}.`;
  buildTank(); renderRoster(); renderBench(); renderSheet();
}

function release(id) {
  const f = findFish(id);
  if (!f) return;
  state.fish = state.fish.filter(x => x.id !== id);
  if (state.parentA === id) state.parentA = null;
  if (state.parentB === id) state.parentB = null;
  phCache.delete(id);
  selectedId = state.fish[0] ? state.fish[0].id : null;
  save();
  $('benchMsg').textContent = `Released ${f.name}.`;
  buildTank(); renderRoster(); renderBench(); renderSheet();
}

function reset() {
  if (!window.confirm('Start over with the original six fish? Your current tank will be replaced.')) return;
  state = fresh(); clutch = []; phCache.clear(); swimmers.clear();
  selectedId = state.fish[0].id;
  save();
  $('benchMsg').textContent = '';
  buildTank(); renderRoster(); renderBench(); renderSheet();
}

// ---------- wiring ----------
document.addEventListener('click', e => {
  const keepBtn = e.target.closest('[data-keep]');
  if (keepBtn) { keep(+keepBtn.dataset.keep); return; }
  const tag = e.target.closest('.tag');
  if (tag) { select(+tag.dataset.id); return; }
  const swim = e.target.closest('.swimmer');
  if (swim) { select(+swim.dataset.id); return; }
  const act = e.target.closest('[data-act]');
  if (act && selectedId) {
    const a = act.dataset.act;
    if (a === 'A' || a === 'B') setParent(a, selectedId);
    else if (a === 'release') release(selectedId);
  }
});
$('breedBtn').addEventListener('click', doBreed);
$('resetBtn').addEventListener('click', reset);
$('mut').addEventListener('input', e => {
  state.mutation = (+e.target.value) / 100;
  $('mutOut').textContent = e.target.value + '%';
  save();
});

// initial render
renderRoster(); renderBench(); renderSheet();
tankW = $('tankBox').clientWidth || 800; tankH = $('tankBox').clientHeight || 320;
buildTank();
if (window.ResizeObserver) new ResizeObserver(resizeTank).observe($('tankBox'));
if (!reduceMotion) requestAnimationFrame(tick);
