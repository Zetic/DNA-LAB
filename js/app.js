import { SPECIES, SLOTS, PARTS, TRAITS, NAMES, STARTING_STOCK } from './species.js';
import { speciesGenome, phenotype, breed, expressBody, expressPart, hiddenPart, hiddenAllele, speciesById } from './genetics.js';
import { fishSVG, fishMarkup, fishBounds } from './render.js';

const STORE_KEY = 'dnalab.v2';
const TANK_MAX = 16;
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

function speciesFish(speciesId, id, existing) {
  const base = speciesById(speciesId).name;
  const taken = new Set(existing.map(f => f.name));
  let name = base, n = 2;
  if (taken.has(name)) { while (taken.has(base + ' ' + n)) n++; name = base + ' ' + n; }
  return { id, name, gen: 1, parents: null, species: speciesId, genome: speciesGenome(speciesId) };
}
function fresh() {
  const fish = [];
  STARTING_STOCK.forEach((sp, i) => fish.push(speciesFish(sp, i + 1, fish)));
  return { v: 2, fish, nextId: fish.length + 1, parentA: null, parentB: null, mutation: 0.04 };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.v === 2 && Array.isArray(s.fish) ? s : null;
  } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep going in memory */ }
}

const findFish = id => state.fish.find(f => f.id === id) || clutch.find(f => f.id === id) || null;
const inTank = id => state.fish.some(f => f.id === id);
const tankFull = () => state.fish.length >= TANK_MAX;

function pickName() {
  const used = new Set(state.fish.concat(clutch).map(f => f.name));
  const free = NAMES.filter(n => !used.has(n));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  let i = 2;
  while (used.has(NAMES[0] + ' ' + i)) i++;
  return NAMES[0] + ' ' + i;
}

const pct = v => Math.round(v * 100) + '%';
function mixText(w) {
  const parts = w.map((v, i) => [v, i]).filter(p => p[0] >= 0.05).sort((a, b) => b[0] - a[0]);
  if (parts.length === 1) return SPECIES[parts[0][1]].name;
  return parts.map(([v, i]) => pct(v) + ' ' + SPECIES[i].name.toLowerCase()).join(', ');
}

// ---------- roster and catalog ----------
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
  $('roster').innerHTML = state.fish.length
    ? state.fish.map(f => `<li>${tagHTML(f)}</li>`).join('')
    : '<li class="clutch-empty">Your tank is empty. Add fish from the catalog below.</li>';
  $('tankCount').textContent = `${state.fish.length} of ${TANK_MAX} spaces used`;
}

const catalogPh = new Map(SPECIES.map(s => [s.id, phenotype(speciesGenome(s.id))]));
function renderCatalog() {
  const full = tankFull();
  $('catalogNote').textContent = full ? 'The tank is full. Release a fish to make room.' : 'Each one arrives as a pure-bred fish of its species. Some carry hidden traits.';
  $('catalogList').innerHTML = SPECIES.map(s => `<li><button class="tag add-tag" type="button" data-add="${s.id}" ${full ? 'disabled' : ''} aria-label="Add ${esc(s.name)}">
    ${fishSVG(catalogPh.get(s.id), uid(), { seed: 7, label: '' })}
    <span class="tag-name">${esc(s.name)}</span>
    <span class="tag-meta">Add to tank</span>
  </button></li>`).join('');
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
  $('clutch').innerHTML = clutch.length
    ? clutch.map(f => `<li>${tagHTML(f, { badges: false })}
        <button class="btn small keep" type="button" data-keep="${f.id}" ${tankFull() ? 'disabled' : ''}>Keep ${esc(f.name)}</button></li>`).join('')
    : '<li class="clutch-empty">Breed two fish to see their babies here.</li>';
}

// ---------- genome sheet ----------
function barHTML(w) {
  return `<span class="bar" aria-hidden="true">${w.map((v, i) => v > 0.001 ? `<i style="width:${(v * 100).toFixed(1)}%;background:${SPECIES[i].color}"></i>` : '').join('')}</span>`;
}
const mutTag = a => (a.m ? '<span class="mut" title="Changed by mutation">new</span>' : '');
function partDetail(slot, p) {
  const r = PARTS[slot][p.type].range;
  const shape = p.shape <= 0.2 ? r[0] : p.shape >= 0.8 ? r[1] : `between ${r[0]} and ${r[1]}`;
  return `${shape}, size ${pct(p.size)}`;
}
const row = (name, c1, c2, shows) => `<div class="gene-row">
  <span class="gene-name">${name}</span>
  <span class="cell" data-label="Copy 1">${c1}</span>
  <span class="cell" data-label="Copy 2">${c2}</span>
  <span class="cell shows" data-label="Shows">${shows}</span></div>`;
const head = '<div class="gene-row head"><span>Gene</span><span>Copy 1</span><span>Copy 2</span><span>Shows</span></div>';
const hiddenNote = label => `<span class="hidden-note">Carries hidden ${esc(label.toLowerCase())}</span>`;

function renderSheet() {
  const f = selectedId ? findFish(selectedId) : null;
  const el = $('sheet');
  if (!f) { el.innerHTML = '<h2>Genome sheet</h2><p class="sheet-empty">Select a fish to read its genes.</p>'; return; }
  const p = ph(f);
  const g = f.genome;
  const meta = f.parents
    ? `Generation ${f.gen}. Parents: ${f.parents.map(x => esc(x.name)).join(' and ')}. Body: ${mixText(p.body).toLowerCase()}.`
    : `Generation 1. A pure-bred ${speciesById(f.species).name.toLowerCase()}.`;
  const full = tankFull();
  const actions = inTank(f.id)
    ? `<button class="btn" type="button" data-act="A">Use as parent A</button>
       <button class="btn" type="button" data-act="B">Use as parent B</button>
       <button class="btn" type="button" data-act="release">Release</button>`
    : `<button class="btn primary" type="button" data-keep="${f.id}" ${full ? 'disabled' : ''}>Keep ${esc(f.name)}</button>
       <span class="hint">${full ? 'The tank is full. Release a fish to make room.' : 'In the clutch. Keep this fish to breed it later.'}</span>`;

  // Base body
  const present = new Set();
  g.body.forEach(c => c.w.forEach((v, i) => { if (v > 0.001) present.add(i); }));
  const legend = [...present].map(i => `<span><i style="background:${SPECIES[i].color}"></i>${SPECIES[i].name}</span>`).join('');
  const bodyRows = row('Body mix',
      `${barHTML(g.body[0].w)}<span class="mix-text">${mixText(g.body[0].w)}${mutTag(g.body[0])}</span>`,
      `${barHTML(g.body[1].w)}<span class="mix-text">${mixText(g.body[1].w)}${mutTag(g.body[1])}</span>`,
      `${barHTML(p.body)}<span class="mix-text">${mixText(p.body)}</span>`)
    + row('Size', `<span class="allele">${pct(g.size[0].v)}</span>${mutTag(g.size[0])}`, `<span class="allele">${pct(g.size[1].v)}</span>${mutTag(g.size[1])}`, pct(p.size));

  // Fin parts
  const finRows = SLOTS.map(s => {
    const [a, b] = g.parts[s.id];
    const shown = expressPart(s.id, g.parts[s.id]);
    const hid = hiddenPart(s.id, g.parts[s.id]);
    const cell = c => `<span class="allele">${PARTS[s.id][c.type].label}</span>${mutTag(c)}<span class="mix-text">${partDetail(s.id, c)}</span>`;
    return row(s.name, cell(a), cell(b),
      `${PARTS[s.id][shown.type].label}<span class="mix-text">${partDetail(s.id, shown)}</span>${hid ? hiddenNote(PARTS[s.id][hid].label) : ''}`);
  }).join('');

  const traitRows = group => TRAITS.filter(t => t.group === group).map(t => {
    const pair = g.traits[t.id];
    const hid = hiddenAllele(t.id, pair);
    const label = k => t.alleles[k].label;
    return row(t.name,
      `<span class="allele">${label(pair[0].v)}</span>${mutTag(pair[0])}`,
      `<span class="allele">${label(pair[1].v)}</span>${mutTag(pair[1])}`,
      `${label(p.traits[t.id])}${hid ? hiddenNote(label(hid)) : ''}`);
  }).join('');

  el.innerHTML = `
    <h2>${esc(f.name)}</h2>
    <p class="sheet-meta">${meta}</p>
    <div class="sheet-fish">${fishSVG(p, uid(), { seed: f.id, label: esc(f.name), pad: 0.08 })}</div>
    <div class="sheet-actions">${actions}</div>
    <h3>Body</h3>
    <p class="hint">One shared body, blended between species. The fish shows the average of its two copies.</p>
    <div class="legend">${legend}</div>
    <div class="genes">${head}${bodyRows}</div>
    <h3>Fins</h3>
    <p class="hint">Each fin is a part swapped from a library. The dominant type shows, and its shape and size are the average of both copies.</p>
    <div class="genes">${head}${finRows}</div>
    <h3>Extras</h3>
    <p class="hint">Features built into every fish’s template that only appear when the gene calls for them.</p>
    <div class="genes">${head}${traitRows('extra')}</div>
    <h3>Color and pattern</h3>
    <p class="hint">A dominant copy hides a recessive one. Hidden copies can come back in later generations.</p>
    <div class="genes">${head}${traitRows('look')}</div>`;
}

// ---------- tank ----------
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const swimmers = new Map(); // id -> sim state
let tankW = 800, tankH = 340;
const SAND = 26;
const boundsCache = new Map();
const fb = f => { if (!boundsCache.has(f.id)) boundsCache.set(f.id, fishBounds(ph(f))); return boundsCache.get(f.id); };

function tankScale(size) { return Math.max(34, Math.min(70, tankH / 5)) * size; }

function placeSwimmer(f, i, n) {
  const p = ph(f), b = fb(f), sc = tankScale(p.size);
  const halfLen = (b.x1 - b.x0) * sc / 2;
  const top = -b.y0 * sc + 8, bottom = tankH - SAND - b.y1 * sc - 6;
  const yMin = Math.min(top, bottom), yMax = Math.max(top, bottom);
  const x = reduceMotion ? ((i + 0.5) / n) * tankW : halfLen + Math.random() * Math.max(1, tankW - 2 * halfLen);
  const y = reduceMotion ? yMin + ((i * 37) % 100) / 100 * (yMax - yMin) : yMin + Math.random() * (yMax - yMin);
  return { x, y, ty: y, dir: Math.random() < 0.5 ? -1 : 1, speed: (24 + Math.random() * 18) / Math.sqrt(p.size),
    phase: Math.random() * 6.28, sc, halfLen, yMin, yMax, cx: (b.x0 + b.x1) / 2, top: b.y0,
    nextTurn: 4 + Math.random() * 6, nextDepth: 2 + Math.random() * 4 };
}

function buildTank() {
  const svg = $('tank');
  svg.setAttribute('viewBox', `0 0 ${tankW} ${tankH}`);
  const ids = new Set(state.fish.map(f => f.id));
  [...swimmers.keys()].forEach(id => { if (!ids.has(id)) swimmers.delete(id); });
  state.fish.forEach((f, i) => { if (!swimmers.has(f.id)) swimmers.set(f.id, placeSwimmer(f, i, state.fish.length)); });
  svg.innerHTML = state.fish.map(f => `<g class="swimmer" data-id="${f.id}">${fishMarkup(ph(f), uid(), f.id)}</g>`).join('')
    + '<path class="marker" id="marker" d="M-7 -12L7 -12L0 -2Z" opacity="0"/>';
  positionAll(0);
}

function positionAll(dt) {
  let sel = null;
  $('tank').querySelectorAll('.swimmer').forEach(node => {
    const id = +node.dataset.id, s = swimmers.get(id);
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
    if (tail) tail.setAttribute('transform', `translate(1 0) scale(${(reduceMotion ? 1 : 0.78 + 0.22 * Math.sin(s.phase)).toFixed(3)} 1) translate(-1 0)`);
    if (id === selectedId) sel = s;
  });
  const m = $('marker');
  if (!m) return;
  if (sel) { m.setAttribute('transform', `translate(${sel.x.toFixed(1)} ${(sel.y + sel.top * sel.sc - 4).toFixed(1)})`); m.setAttribute('opacity', '1'); }
  else m.setAttribute('opacity', '0');
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
function refresh({ tank = false } = {}) {
  if (tank) buildTank();
  renderRoster(); renderCatalog(); renderBench(); renderSheet(); positionAll(0);
}
const say = msg => { $('benchMsg').textContent = msg; };

function select(id) { selectedId = id; refresh(); }

function setParent(letter, id) {
  if (letter === 'A') { if (state.parentB === id) state.parentB = null; state.parentA = id; }
  else { if (state.parentA === id) state.parentA = null; state.parentB = id; }
  say('');
  save(); refresh();
}

function doBreed() {
  const a = findFish(state.parentA), b = findFish(state.parentB);
  if (!a || !b) return;
  clutch = [];
  const gen = Math.max(a.gen, b.gen) + 1;
  for (let i = 0; i < CLUTCH_SIZE; i++) {
    const baby = { id: state.nextId++, name: '', gen, parents: [{ id: a.id, name: a.name }, { id: b.id, name: b.name }],
      genome: breed(a, b, state.mutation) };
    baby.name = pickName();
    clutch.push(baby);
  }
  save();
  say(`${CLUTCH_SIZE} babies hatched. Keep the ones you want before you breed again.`);
  selectedId = clutch[0].id;
  refresh();
}

function keep(id) {
  const f = clutch.find(x => x.id === id);
  if (!f) return;
  if (tankFull()) { say('The tank is full. Release a fish to make room.'); return; }
  clutch = clutch.filter(x => x.id !== id);
  state.fish.push(f);
  save();
  say(`Kept ${f.name}.`);
  refresh({ tank: true });
}

function addSpecies(speciesId) {
  if (tankFull()) { say('The tank is full. Release a fish to make room.'); return; }
  const f = speciesFish(speciesId, state.nextId++, state.fish.concat(clutch));
  state.fish.push(f);
  selectedId = f.id;
  save();
  say(`Added ${f.name}.`);
  refresh({ tank: true });
}

function release(id) {
  const f = findFish(id);
  if (!f) return;
  state.fish = state.fish.filter(x => x.id !== id);
  if (state.parentA === id) state.parentA = null;
  if (state.parentB === id) state.parentB = null;
  phCache.delete(id); boundsCache.delete(id);
  selectedId = state.fish[0] ? state.fish[0].id : null;
  save();
  say(`Released ${f.name}.`);
  refresh({ tank: true });
}

function reset() {
  if (!window.confirm('Start over with the starting fish? Your current tank will be replaced.')) return;
  state = fresh(); clutch = []; phCache.clear(); boundsCache.clear(); swimmers.clear();
  selectedId = state.fish[0].id;
  save();
  say('');
  refresh({ tank: true });
}

// ---------- wiring ----------
document.addEventListener('click', e => {
  const keepBtn = e.target.closest('[data-keep]');
  if (keepBtn) { keep(+keepBtn.dataset.keep); return; }
  const add = e.target.closest('[data-add]');
  if (add) { addSpecies(add.dataset.add); return; }
  const tag = e.target.closest('.tag[data-id]');
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

tankW = $('tankBox').clientWidth || 800; tankH = $('tankBox').clientHeight || 340;
refresh({ tank: true });
if (window.ResizeObserver) new ResizeObserver(resizeTank).observe($('tankBox'));
if (!reduceMotion) requestAnimationFrame(tick);
