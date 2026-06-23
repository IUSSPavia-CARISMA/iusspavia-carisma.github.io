/* ============================================================================
 * Storm Chasers — game logic (vanilla JS, no dependencies)
 * IUSS Pavia / CARISMA orientation-day game.
 *
 * A storm needs four ingredients at once: Wind Shear, Moisture, Instability,
 * Lift. Teams answer quiz questions to draw cards, then attack / protect / hold.
 * Protection is temporary, so the landmark's health only ever trends downward.
 * ========================================================================== */

'use strict';

/* ===========================================================================
 * CONFIG — tune the whole game from here.
 * ======================================================================== */
const CONFIG = {
  START_HEALTH: 20,        // landmark health at the start
  TOTAL_ROUNDS: 6,         // after this many rounds, the timer wins it
  START_CARDS: 4,          // random cards each team is dealt at the start
  MILD_DAMAGE: 5,          // 1 of each ingredient (4 cards)
  SEVERE_DAMAGE: 10,       // 2 of each ingredient (8 cards)
  MILD_REQ: 1,             // ingredients of each type needed for a mild storm
  SEVERE_REQ: 2,           // ingredients of each type needed for a severe storm

  // Protection is REACTIVE: when a team attacks, any other team holding a
  // protection card may intercept — cutting the damage and stealing an
  // ingredient the attacker used. Only one team can intercept each storm.
  PROTECT_REDUCTION: 3,    // damage an interception removes from the storm
  MIN_DAMAGE: 1,           // a storm always deals at least this much

  // Weighted draw pool (draw WITH REPLACEMENT — the deck never runs dry).
  // Each of the 4 ingredients is drawn ~21.25% of the time (85% total). The even
  // split is critical so no single ingredient becomes a bottleneck.
  // Each of the 4 protection types is drawn ~3.75% of the time (15% total).
  INGREDIENT_SHARE: 0.85,   // → 0.2125 per ingredient
  PROTECTION_SHARE: 0.15,   // → 0.0375 per protection type
};

/* The four storm ingredients. `tip` explains the real meteorological role. */
const INGREDIENTS = [
  { type: 'windshear',   name: 'Wind Shear',   icon: '🌀',
    tip: 'Wind that changes speed or direction with height. It tilts the storm so the rising and sinking air don\'t cancel out — letting the storm organise and rotate.' },
  { type: 'moisture',    name: 'Moisture',     icon: '💧',
    tip: 'Warm, humid air is the storm\'s fuel. As it rises and the water vapour condenses, it releases heat that powers the updraft.' },
  { type: 'instability', name: 'Instability',  icon: '🔥',
    tip: 'Warm air below, cooler air above. Buoyant air accelerates upward, building the towering cloud of a thunderstorm.' },
  { type: 'lift',        name: 'Lift',         icon: '⛰️',
    tip: 'The trigger: a front, a mountain or a sea breeze that gives the air its first nudge upward to start convection.' },
];

/* The four protection types. Used reactively to intercept an attacker's storm. */
const PROTECTIONS = [
  { type: 'doppler',   name: 'Doppler Radar',      icon: '📡', note: 'Tracks the storm in real time so warnings go out early.' },
  { type: 'shelter',   name: 'Tornado Shelter',    icon: '🏚️', note: 'Keeps people safe while the storm passes over.' },
  { type: 'transport', name: 'Transport Links',    icon: '🚆', note: 'Strong road & rail links for evacuation and resupply.' },
  { type: 'response',  name: 'Emergency Response',  icon: '🚑', note: 'Rapid-response teams limit the damage when it hits.' },
];

/* Selectable landmarks. Each carries a small inline SVG so there are no
 * external image assets to host. */
const LANDMARKS = {
  pisa: {
    name: 'Torre di Pisa',
    svg: `<svg viewBox="0 0 120 120"><g transform="rotate(-8 60 110)">
      <rect x="44" y="14" width="32" height="92" rx="4" fill="#e7e2d4" stroke="#b9b09a" stroke-width="1.5"/>
      <rect x="44" y="14" width="32" height="10" rx="3" fill="#f2eee2"/>
      ${[26,38,50,62,74,86].map(y=>`<line x1="44" y1="${y}" x2="76" y2="${y}" stroke="#b9b09a" stroke-width="1.5"/>`).join('')}
      ${[0,1,2,3].map(i=>`<line x1="${50+i*6}" y1="24" x2="${50+i*6}" y2="100" stroke="#cfc7b2" stroke-width="1"/>`).join('')}
      <rect x="40" y="104" width="40" height="8" rx="2" fill="#cfc7b2"/>
      </g><rect x="20" y="110" width="80" height="6" rx="3" fill="#3a5a3a"/></svg>`,
  },
  milan: {
    name: 'Duomo di Milano',
    svg: `<svg viewBox="0 0 120 120">
      <polygon points="60,8 64,30 56,30" fill="#f2eee2"/>
      ${[24,36,48,72,84,96].map(x=>`<polygon points="${x},34 ${x+3},52 ${x-3},52" fill="#e7e2d4"/>`).join('')}
      <path d="M20 100 L20 58 Q20 50 28 50 L92 50 Q100 50 100 58 L100 100 Z" fill="#e7e2d4" stroke="#b9b09a" stroke-width="1.5"/>
      <path d="M52 100 L52 70 Q60 60 68 70 L68 100 Z" fill="#cdbfa0"/>
      ${[30,40,80,90].map(x=>`<rect x="${x-3}" y="64" width="6" height="20" rx="3" fill="#b9b09a"/>`).join('')}
      <rect x="16" y="100" width="88" height="8" rx="2" fill="#cfc7b2"/></svg>`,
  },
  genoa: {
    name: 'Porto di Genova',
    svg: `<svg viewBox="0 0 120 120">
      <rect x="0" y="86" width="120" height="34" fill="#2f6f8f" opacity="0.5"/>
      <rect x="22" y="86" width="76" height="20" rx="3" fill="#c0392b"/>
      <rect x="30" y="74" width="20" height="14" fill="#e7e2d4"/><rect x="54" y="70" width="16" height="18" fill="#d7cfbb"/>
      <line x1="86" y1="86" x2="86" y2="30" stroke="#7f8c9b" stroke-width="4"/>
      <line x1="86" y1="34" x2="104" y2="34" stroke="#7f8c9b" stroke-width="4"/>
      <line x1="104" y1="34" x2="104" y2="50" stroke="#f1c40f" stroke-width="3"/>
      <rect x="34" y="40" width="10" height="8" fill="#e67e22"/><rect x="46" y="44" width="10" height="6" fill="#2980b9"/>
      <rect x="0" y="106" width="120" height="14" fill="#2f6f8f"/></svg>`,
  },
  venice: {
    name: 'Aeroporto di Venezia',
    svg: `<svg viewBox="0 0 120 120">
      <rect x="10" y="92" width="100" height="20" rx="2" fill="#5a6072"/>
      <line x1="20" y1="102" x2="100" y2="102" stroke="#f1c40f" stroke-width="2" stroke-dasharray="8 6"/>
      <rect x="74" y="58" width="10" height="40" fill="#d7cfbb"/><rect x="70" y="50" width="18" height="12" rx="2" fill="#3498db"/>
      <g fill="#eef2ff" stroke="#b9c0d8" stroke-width="1">
        <path d="M30 70 L70 66 L74 70 L70 74 L30 74 Z"/>
        <path d="M44 68 L34 54 L40 54 L54 67 Z"/><path d="M44 74 L34 86 L40 86 L54 75 Z"/>
        <path d="M64 68 L60 60 L64 60 L70 68 Z"/>
      </g><circle cx="32" cy="70" r="3" fill="#2c3550"/></svg>`,
  },
};

/* ===========================================================================
 * STATE
 * ======================================================================== */
const STORAGE_KEY = 'stormChasers.v1';
const TEAM_COLORS = ['#ffd24d', '#5ad1ff', '#ff7eb6', '#9be86a', '#c79bff'];

let state = null;          // the live game state (see newGame)
let setup = { teamCount: 4, landmark: 'pisa', names: [] };
let questionQueue = [];     // shuffled queue of question indices
let muted = false;

/* ===========================================================================
 * Small helpers
 * ======================================================================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const letter = (i) => String.fromCharCode(65 + i); // 0 -> A

function ingredientDef(type) { return INGREDIENTS.find(x => x.type === type); }
function protectionDef(type) { return PROTECTIONS.find(x => x.type === type); }

function showScreen(id) {
  closeAllModals();   // never leave a modal stuck on top when switching screens
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  // Reset/mute buttons visibility
  $('#resetBtn').classList.toggle('hidden', id === 'screen-landing');
}

function openModal(id) { $('#' + id).classList.add('open'); }
function closeModal(id) { $('#' + id).classList.remove('open'); }
function closeAllModals() { $$('.modal-overlay.open').forEach(m => m.classList.remove('open')); }

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ===========================================================================
 * Weighted deck — draw with replacement
 * ======================================================================== */
function buildDeck() {
  const pool = [];
  const ingW = CONFIG.INGREDIENT_SHARE / INGREDIENTS.length;
  const protW = CONFIG.PROTECTION_SHARE / PROTECTIONS.length;
  INGREDIENTS.forEach(i => pool.push({ kind: 'ingredient', type: i.type, weight: ingW }));
  PROTECTIONS.forEach(p => pool.push({ kind: 'protection', type: p.type, weight: protW }));
  return pool;
}
const DECK = buildDeck();

function drawCard() {
  const total = DECK.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of DECK) {
    r -= c.weight;
    if (r <= 0) return { kind: c.kind, type: c.type };
  }
  return { kind: DECK[0].kind, type: DECK[0].type }; // fallback
}

/* ===========================================================================
 * Questions — loaded from questions.csv (easy to edit in Excel / a text editor),
 * with the embedded questions.js as an offline fallback.
 * ======================================================================== */
let QUESTIONS = (window.STORM_QUESTIONS || []).slice();

/* Minimal CSV parser: handles quoted fields, commas and "" escapes inside
 * quotes, and \n / \r\n line endings. Returns an array of row-arrays. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0].trim() !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(c => c.trim() !== '')) rows.push(row); }
  return rows;
}

async function loadQuestions() {
  try {
    const res = await fetch('questions.csv', { cache: 'no-store' });
    if (res.ok) {
      const rows = parseCSV(await res.text());
      // drop a header row if the first cell looks like a header
      if (rows.length && /^(question|domanda)$/i.test((rows[0][0] || '').trim())) rows.shift();
      const parsed = rows
        .filter(r => (r[0] || '').trim() !== '')
        .map(r => ({ q: (r[0] || '').trim(), a: (r[1] || '').trim() }));
      if (parsed.length) { QUESTIONS = parsed; return; }
    }
  } catch (e) { /* fetch blocked (e.g. opened via file://) — use the fallback */ }
  if (!QUESTIONS.length) QUESTIONS = (window.STORM_QUESTIONS || []).slice();
}

/* Question queue — no repeats until exhausted. */
function reshuffleQuestions() {
  questionQueue = QUESTIONS.map((_, i) => i);
  for (let i = questionQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionQueue[i], questionQueue[j]] = [questionQueue[j], questionQueue[i]];
  }
}
function nextQuestion() {
  if (questionQueue.length === 0) reshuffleQuestions();
  return QUESTIONS[questionQueue.pop()];
}

/* ===========================================================================
 * Thunder sound (WebAudio) + mute
 * ======================================================================== */
let audioCtx = null;
function thunder(intensity = 1) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const dur = 1.1 * intensity;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2); // noise that decays
    }
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, ctx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.9 * intensity, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
    src.start();
  } catch (e) { /* audio not available — ignore */ }
}

function flashSky() {
  const b = $('#skyBolt');
  b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
}

/* ===========================================================================
 * Persistence
 * ======================================================================== */
function save() {
  if (!state) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function clearSave() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && s.phase && s.phase !== 'ended' && s.teams) return s;
  } catch (e) {}
  return null;
}

/* ===========================================================================
 * Game lifecycle
 * ======================================================================== */
function newGame(teamCount, landmarkKey, names) {
  state = {
    landmark: landmarkKey,
    health: CONFIG.START_HEALTH,
    maxHealth: CONFIG.START_HEALTH,
    round: 1,
    turnIndex: 0,
    teams: [],
    phase: 'turn',        // 'turn' | 'ended'
    winnerId: null,
  };
  names = names || [];
  for (let i = 0; i < teamCount; i++) {
    const custom = (names[i] || '').trim();
    const hand = [];
    for (let c = 0; c < CONFIG.START_CARDS; c++) hand.push(drawCard()); // dealt a starting hand
    state.teams.push({ id: i, name: custom || ('Team ' + letter(i)), color: TEAM_COLORS[i], hand, damage: 0 });
  }
  reshuffleQuestions();
  save();
}

function currentTeam() { return state.teams[state.turnIndex]; }

function handCounts(team) {
  const c = { windshear: 0, moisture: 0, instability: 0, lift: 0, protection: 0 };
  team.hand.forEach(card => {
    if (card.kind === 'ingredient') c[card.type]++;
    else c.protection++;
  });
  return c;
}

function canLaunch(team, req) {
  const c = handCounts(team);
  return INGREDIENTS.every(i => c[i.type] >= req);
}

/* ===========================================================================
 * RENDER — setup screen
 * ======================================================================== */
function renderSetup() {
  // team count choices 3..5
  const tc = $('#teamCountChoices');
  tc.innerHTML = '';
  for (let n = 3; n <= 5; n++) {
    const b = document.createElement('button');
    b.className = 'choice' + (setup.teamCount === n ? ' selected' : '');
    b.textContent = n;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', setup.teamCount === n);
    b.onclick = () => { setup.teamCount = n; renderSetup(); };
    tc.appendChild(b);
  }
  // team name inputs (optional; typed values persist in setup.names)
  const tn = $('#teamNames');
  tn.innerHTML = '';
  for (let i = 0; i < setup.teamCount; i++) {
    const field = document.createElement('label');
    field.className = 'team-name-field';
    const dot = document.createElement('span');
    dot.className = 'tn-dot';
    dot.style.background = TEAM_COLORS[i];
    const input = document.createElement('input');
    input.className = 'team-name-input';
    input.type = 'text';
    input.maxLength = 24;
    input.placeholder = 'Team ' + letter(i);
    input.value = setup.names[i] || '';
    input.setAttribute('aria-label', 'Name for Team ' + letter(i));
    input.oninput = () => { setup.names[i] = input.value; };
    field.appendChild(dot);
    field.appendChild(input);
    tn.appendChild(field);
  }
  // landmark choices
  const lg = $('#landmarkChoices');
  lg.innerHTML = '';
  Object.entries(LANDMARKS).forEach(([key, lm]) => {
    const b = document.createElement('button');
    b.className = 'landmark-choice' + (setup.landmark === key ? ' selected' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', setup.landmark === key);
    b.innerHTML = lm.svg + `<div class="lc-name">${lm.name}</div>`;
    b.onclick = () => { setup.landmark = key; renderSetup(); };
    lg.appendChild(b);
  });
}

/* ===========================================================================
 * RENDER — game board
 * ======================================================================== */
function renderBoard() {
  const lm = LANDMARKS[state.landmark];
  $('#landmarkArt').innerHTML = lm.svg;
  $('#landmarkName').textContent = lm.name;
  $('#roundPill').textContent = `Round ${state.round} of ${CONFIG.TOTAL_ROUNDS}`;

  // health bar
  const pct = Math.max(0, state.health / state.maxHealth) * 100;
  const fill = $('#healthFill');
  fill.style.width = pct + '%';
  fill.classList.toggle('mid', pct <= 60 && pct > 30);
  fill.classList.toggle('low', pct <= 30);
  $('#healthNum').textContent = state.health;
  $('.health-num').innerHTML = `<span id="healthNum">${state.health}</span> / ${state.maxHealth}`;

  // turn card
  const t = currentTeam();
  $('#turnNow').innerHTML = `<span style="color:${t.color}">${t.name}</span>'s turn`;

  // teams list
  const list = $('#teamsList');
  list.innerHTML = '';
  state.teams.forEach(team => {
    const counts = handCounts(team);
    const panel = document.createElement('div');
    panel.className = 'team-panel' + (team.id === state.turnIndex ? ' active' : '');
    const ingPills = INGREDIENTS.map(i =>
      `<span class="ing-pill ${counts[i.type] > 0 ? 'have' : ''}">${i.icon} ${counts[i.type]}</span>`
    ).join('');
    const handCards = team.hand.map(card => {
      if (card.kind === 'ingredient') {
        const d = ingredientDef(card.type);
        return `<span class="mini-card ing" title="${d.tip}">${d.icon} ${d.name}</span>`;
      }
      const d = protectionDef(card.type);
      return `<span class="mini-card prot" title="${d.note}">${d.icon} ${d.name}</span>`;
    }).join('');
    panel.innerHTML = `
      <div class="team-head">
        <span class="team-name"><span class="team-dot" style="background:${team.color}"></span>${team.name}</span>
        <span class="team-dmg">damage dealt: <b>${team.damage}</b></span>
      </div>
      <div class="ing-count">${ingPills}<span class="ing-pill">${counts.protection} 🛡️</span></div>
      <div class="hand">${handCards}</div>`;
    list.appendChild(panel);
  });
}

/* ===========================================================================
 * TURN FLOW
 * ======================================================================== */
function startTurn() {
  $('#turnStatus').textContent = '';
  const q = nextQuestion();
  state._activeQuestion = q;
  const t = currentTeam();
  $('#modalTeam').innerHTML = `<span style="color:${t.color}">${t.name}</span>`;
  $('#qText').textContent = q.q;
  $('#qAnswer').textContent = q.a;
  $('.answer-reveal').removeAttribute('open');
  openModal('questionModal');
}

function answerCorrect() {
  closeModal('questionModal');
  const card = drawCard();
  state._drawnCard = card;
  revealCard(card);
}

function answerWrong() {
  closeModal('questionModal');
  $('#turnStatus').textContent = 'Incorrect — no card drawn. Turn passes.';
  toast(`${currentTeam().name}: incorrect — turn passes`);
  advanceTurn();
}

function revealCard(card) {
  const front = $('#drawCardFront');
  let html;
  if (card.kind === 'ingredient') {
    const d = ingredientDef(card.type);
    html = `<div class="dc-icon">${d.icon}</div><div class="dc-name">${d.name}</div>
            <div class="dc-type">Storm ingredient</div><div class="dc-note">${d.tip}</div>`;
    front.className = 'draw-card-front dc-ing';
  } else {
    const d = protectionDef(card.type);
    html = `<div class="dc-icon">${d.icon}</div><div class="dc-name">${d.name}</div>
            <div class="dc-type">Protection · intercept an attack (−${CONFIG.PROTECT_REDUCTION} dmg + steal an ingredient)</div>
            <div class="dc-note">${d.note}</div>`;
    front.className = 'draw-card-front dc-prot';
  }
  front.innerHTML = html;
  const dc = $('#drawCard');
  dc.classList.remove('flipped');
  openModal('cardModal');
  setTimeout(() => dc.classList.add('flipped'), 200);
}

function commitDrawnCard() {
  const card = state._drawnCard;
  currentTeam().hand.push(card);
  state._drawnCard = null;
  closeModal('cardModal');
  renderBoard();
  save();
  openActionPanel();
}

function openActionPanel() {
  const t = currentTeam();
  $('#actionTeam').innerHTML = `<span style="color:${t.color}">${t.name}</span>`;

  // show current hand summary
  const counts = handCounts(t);
  const hand = $('#actionHand');
  hand.innerHTML = INGREDIENTS.map(i =>
    `<span class="mini-card ing">${i.icon} ${i.name}: ${counts[i.type]}</span>`
  ).join('') + `<span class="mini-card prot">🛡️ Protection: ${counts.protection}</span>`;

  // enable/disable (protection is reactive now — no action button for it)
  $('#launchMildBtn').disabled = !canLaunch(t, CONFIG.MILD_REQ);
  $('#launchSevereBtn').disabled = !canLaunch(t, CONFIG.SEVERE_REQ);

  openModal('actionModal');
}

/* ---- Storm launch ---- */
function launchStorm(severe) {
  const t = currentTeam();
  const req = severe ? CONFIG.SEVERE_REQ : CONFIG.MILD_REQ;
  const stormValue = severe ? CONFIG.SEVERE_DAMAGE : CONFIG.MILD_DAMAGE;

  // consume the ingredients used (kept so an interceptor can steal one)
  const consumed = [];
  INGREDIENTS.forEach(ing => {
    let removed = 0;
    state.teams[t.id].hand = t.hand.filter(card => {
      if (removed < req && card.kind === 'ingredient' && card.type === ing.type) {
        removed++; consumed.push({ kind: 'ingredient', type: card.type }); return false;
      }
      return true;
    });
  });

  closeModal('actionModal');
  state._pendingStorm = { attackerId: t.id, severe, stormValue, consumed };

  // who can intercept? any OTHER team holding at least one protection card
  const defenders = state.teams.filter(d => d.id !== t.id && handCounts(d).protection > 0);
  if (defenders.length === 0) {
    resolveStorm(null);          // nobody can defend — the storm hits in full
  } else {
    openInterceptModal(t, severe, stormValue, defenders);
  }
}

/* ---- Interception window ---- */
function openInterceptModal(attacker, severe, stormValue, defenders) {
  $('#interceptTitle').innerHTML =
    `<span style="color:${attacker.color}">${attacker.name}</span> launches a ` +
    `<b>${severe ? 'SEVERE' : 'mild'}</b> storm — <b>${stormValue}</b> damage`;

  const opts = $('#interceptOptions');
  opts.innerHTML = '';
  defenders.forEach(d => {
    const n = handCounts(d).protection;
    const b = document.createElement('button');
    b.className = 'intercept-opt';
    b.innerHTML = `<span class="io-name"><span class="team-dot" style="background:${d.color}"></span>${d.name} intercepts 🛡️</span>` +
                  `<span class="io-desc">−${CONFIG.PROTECT_REDUCTION} dmg · steal 1 ingredient · holds ${n} protection</span>`;
    b.onclick = () => resolveStorm(d.id);
    opts.appendChild(b);
  });
  openModal('interceptModal');
}

function resolveStorm(interceptorId) {
  const p = state._pendingStorm;
  const attacker = state.teams[p.attackerId];
  let damage = p.stormValue;
  let intercepted = false;
  let stolen = null, interceptor = null;

  if (interceptorId != null) {
    interceptor = state.teams[interceptorId];
    intercepted = true;
    damage = Math.max(CONFIG.MIN_DAMAGE, p.stormValue - CONFIG.PROTECT_REDUCTION);

    // discard one protection card from the interceptor
    const pIdx = interceptor.hand.findIndex(c => c.kind === 'protection');
    if (pIdx >= 0) interceptor.hand.splice(pIdx, 1);

    // steal one random ingredient the attacker used for this storm
    if (p.consumed.length) {
      const sIdx = Math.floor(Math.random() * p.consumed.length);
      stolen = p.consumed.splice(sIdx, 1)[0];
      interceptor.hand.push({ kind: 'ingredient', type: stolen.type });
    }
  }

  const healthBefore = state.health;
  const dealt = Math.min(damage, healthBefore);
  state.health = Math.max(0, healthBefore - dealt);
  attacker.damage += dealt;
  state._pendingStorm = null;

  closeModal('interceptModal');
  animateStorm(p.severe, intercepted, () => {
    renderBoard();
    save();
    if (intercepted) {
      const ing = stolen ? ingredientDef(stolen.type) : null;
      toast(`${interceptor.name} intercepted! ${dealt} damage` +
            (ing ? ` · stole ${ing.icon} ${ing.name} from ${attacker.name}` : ''));
    } else {
      toast(`${attacker.name} launched a ${p.severe ? 'SEVERE' : 'mild'} storm — ${dealt} damage dealt!`);
    }

    if (state.health <= 0) {
      endGame(attacker.id, 'finishingBlow');
    } else {
      advanceTurn();
    }
  });
}

function animateStorm(severe, intercepted, done) {
  flashSky();
  thunder(severe ? 1.4 : 1);
  const art = $('#landmarkArt');
  const impact = $('#impact');
  const aura = $('#shieldAura');

  if (intercepted) {
    aura.classList.remove('active');
    aura.classList.add('absorb');
    setTimeout(() => aura.classList.remove('absorb'), 600);
  }
  impact.textContent = severe ? '⛈️' : '🌩️';
  impact.classList.remove('boom'); void impact.offsetWidth; impact.classList.add('boom');
  art.classList.remove('shake'); void art.offsetWidth; art.classList.add('shake');

  setTimeout(done, 750);
}

function holdTurn() {
  closeModal('actionModal');
  toast(`${currentTeam().name} holds.`);
  advanceTurn();
}

/* ===========================================================================
 * Turn advance + round/timer logic
 * ======================================================================== */
function advanceTurn() {
  state.turnIndex++;
  if (state.turnIndex >= state.teams.length) {
    state.turnIndex = 0;
    state.round++;
    if (state.round > CONFIG.TOTAL_ROUNDS) {
      endByTimeout();
      return;
    }
  }
  renderBoard();
  save();
}

function endByTimeout() {
  // landmark survived — highest cumulative damage wins (tie → earliest letter)
  let best = state.teams[0];
  state.teams.forEach(t => { if (t.damage > best.damage) best = t; });
  endGame(best.id, 'timeout');
}

function endGame(winnerId, reason) {
  state.phase = 'ended';
  state.winnerId = winnerId;
  clearSave();

  const winner = state.teams[winnerId];
  thunder(1.5);
  flashSky();

  $('#endHeadline').innerHTML = `<span style="color:${winner.color}">${winner.name}</span> wins!`;
  if (reason === 'finishingBlow') {
    $('#endSub').textContent = `Landed the finishing storm on ${LANDMARKS[state.landmark].name} — health hit zero!`;
  } else {
    $('#endSub').textContent = `${LANDMARKS[state.landmark].name} survived all ${CONFIG.TOTAL_ROUNDS} rounds — won on most total damage dealt.`;
  }

  // sorted stats
  const sorted = state.teams.slice().sort((a, b) => b.damage - a.damage);
  const stats = $('#endStats');
  stats.innerHTML = sorted.map(t => `
    <div class="end-stat-row ${t.id === winnerId ? 'winner' : ''}">
      <span><span class="team-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color};margin-right:8px"></span>${t.name}${t.id === winnerId ? ' 🏆' : ''}</span>
      <span class="esr-dmg">${t.damage} dmg</span>
    </div>`).join('');

  showScreen('screen-end');
}

/* ===========================================================================
 * Wiring
 * ======================================================================== */
function bind() {
  // Landing
  $('#startBtn').onclick = () => { renderSetup(); showScreen('screen-setup'); };

  // Setup
  $('#backToLandingBtn').onclick = () => showScreen('screen-landing');
  $('#beginBtn').onclick = () => {
    newGame(setup.teamCount, setup.landmark, setup.names);
    renderBoard();
    showScreen('screen-game');
  };

  // Board
  $('#answerBtn').onclick = () => { if (state && state.phase !== 'ended') startTurn(); };

  // Question modal
  $('#markRightBtn').onclick = answerCorrect;
  $('#markWrongBtn').onclick = answerWrong;

  // Card modal
  $('#cardContinueBtn').onclick = commitDrawnCard;

  // Action modal
  $('#launchMildBtn').onclick = () => launchStorm(false);
  $('#launchSevereBtn').onclick = () => launchStorm(true);
  $('#holdBtn').onclick = holdTurn;

  // Interception modal
  $('#noInterceptBtn').onclick = () => resolveStorm(null);

  // End
  $('#playAgainBtn').onclick = () => { renderSetup(); showScreen('screen-setup'); };

  // Utility
  $('#muteBtn').onclick = () => {
    muted = !muted;
    $('#muteBtn').textContent = muted ? '🔇' : '🔊';
    if (!muted) thunder(0.5);
  };
  $('#resetBtn').onclick = () => {
    if (confirm('Reset the game and return to setup? Current progress will be lost.')) {
      clearSave();
      state = null;
      renderSetup();
      showScreen('screen-setup');
    }
  };

  // Random idle lightning for atmosphere
  setInterval(() => { if (Math.random() < 0.5) flashSky(); }, 7000);
}

/* ===========================================================================
 * Init — restore an in-progress game if one was saved
 * ======================================================================== */
async function init() {
  bind();
  await loadQuestions();
  const saved = loadSaved();
  if (saved) {
    state = saved;
    setup.teamCount = state.teams.length;
    setup.landmark = state.landmark;
    renderBoard();
    showScreen('screen-game');
    toast('Resumed your game in progress.');
  } else {
    showScreen('screen-landing');
  }
}

document.addEventListener('DOMContentLoaded', init);
