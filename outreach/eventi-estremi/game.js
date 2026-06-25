/* =========================================================
   Fare i conti con gli eventi estremi — SOE 2026
   IUSS Pavia · CARISMA.

   App di supporto al facilitatore: tiene le schede delle
   squadre, lancia il dado della precipitazione e aggiorna i
   fagioli e le crisi. Plancia e fagioli sono fisici in aula.

   Modello: ogni anno la squadra distribuisce i fagioli che ha
   su 3 scommesse (Alluvione / Raccolto / Siccità). Un unico
   lancio decide la precipitazione dell'anno:
     - scommessa azzeccata           -> il fagiolo si riprende
     - scommessa su un estremo, media -> fagiolo perso
     - raccolto + evento estremo      -> fagiolo perso + crisi 🆘
     - estremo sbagliato (esce l'altro) -> fagiolo perso + crisi 🆘
   I fagioli calano di anno in anno. Vince chi ha meno crisi.
   ========================================================= */

'use strict';

/* ----------------------- CONFIG ----------------------- */
const CONFIG = {
  START_BEANS: 10,           // fagioli iniziali (anno 1)
  YEARLY_BONUS: 2,           // fagioli extra dati a ogni squadra a inizio di ogni nuovo anno
  REGIONS: 10,               // regioni = numero di lanci per anno
  YEARS: 3,                  // numero di anni
  NEW_DIE_YEAR: 2,           // anno in cui entra in gioco il secondo dado
  COOP_DEFAULT: true,        // Fondo di solidarietà attivo di default

  // Mappa delle facce -> precipitazione. 'd' = siccità, 'm' = media, 'f' = alluvione.
  DICE: {
    d6: { sides: 6, map: { 1:'d', 2:'m', 3:'m', 4:'m', 5:'m', 6:'f' } },
    d8: { sides: 8, map: { 1:'d', 2:'d', 3:'m', 4:'m', 5:'m', 6:'m', 7:'f', 8:'f' } },
  },

  DIE_ROLL_MS: 700,          // durata animazione di lancio del dado
  RESULT_HOLD_MS: 700,       // pausa prima di mostrare il pulsante esiti
  NEW_DIE_ANIM_MS: 3200,     // durata animazione comparsa del nuovo dado

  CRISIS: '🆘',              // emoji della crisi umanitaria (cartellino rosso)
  BEAN: '🪙',

  DEFAULT_NAMES: [
    'Cooperativa Terre d\'Acqua', 'Cooperativa Cascina Verde', 'Cooperativa San Martino',
    'Cooperativa La Roggia', 'Cooperativa Campolungo', 'Cooperativa Riviera',
  ],
  TEAM_COLORS: ['#5a93b0', '#e0a23a', '#6aa84f', '#c0626a', '#9b7bd0', '#3fb8b0'],

  MIN_TEAMS: 2,
  MAX_TEAMS: 6,
};

const WEATHER = {
  d: { key:'drought', label:'Siccità',     icon:'☀️', bet:'drought' },
  m: { key:'medium',  label:'Nella media', icon:'🌤️', bet:'harvest' },
  f: { key:'flood',   label:'Alluvione',   icon:'🌊', bet:'flood' },
};

// Tipi di scommessa che si mettono nei distretti, in ordine.
const BET = {
  flood:   { icon:'🌊', label:'Alluvione', cls:'band-flood' },
  harvest: { icon:'👍', label:'Raccolto',  cls:'band-center' },
  drought: { icon:'☀️', label:'Siccità',   cls:'band-drought' },
};
function betMatches(bet, wKey) { return bet && WEATHER[wKey] && WEATHER[wKey].bet === bet; }

const STORAGE_KEY = 'eventi-estremi-soe2026';

/* ----------------------- STATO ----------------------- */
let state = null;
let setup = {
  teams: 6,
  coop: CONFIG.COOP_DEFAULT,
  names: CONFIG.DEFAULT_NAMES.slice(0, 6),
};
let animating = false;

/* ----------------------- AUDIO ----------------------- */
const Audio = (() => {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function setMuted(m) { muted = m; }
  function isMuted() { return muted; }
  function noiseBuffer(seconds) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
  function thunder() {
    if (muted) return;
    const c = ensure();
    const src = c.createBufferSource(); src.buffer = noiseBuffer(1.6);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.9, c.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);
    src.connect(lp).connect(g).connect(c.destination); src.start();
  }
  function rainBurst() {
    if (muted) return;
    const c = ensure();
    const src = c.createBufferSource(); src.buffer = noiseBuffer(1.4);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.35, c.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.3);
    src.connect(hp).connect(g).connect(c.destination); src.start();
    thunder();
  }
  function droughtWind() {
    if (muted) return;
    const c = ensure();
    const src = c.createBufferSource(); src.buffer = noiseBuffer(1.6);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.6;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.22, c.currentTime + 0.3);
    g.gain.linearRampToValueAtTime(0.001, c.currentTime + 1.5);
    src.connect(bp).connect(g).connect(c.destination); src.start();
  }
  function chime(freq, dur, type) {
    if (muted) return;
    const c = ensure();
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.05);
  }
  function medium() { chime(520, 0.4, 'sine'); }
  function crisis() {
    if (muted) return;
    const c = ensure();
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.5);
    g.gain.setValueAtTime(0.3, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.6);
  }
  function fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f, 0.5, 'triangle'), i * 160));
  }
  return { ensure, setMuted, isMuted, rainBurst, droughtWind, medium, crisis, thunder, fanfare };
})();

/* ----------------------- HELPERS ----------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('is-active'));
  $('#' + id).classList.add('is-active');
}
function save() { if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function dieTypeForYear(year) { return year >= CONFIG.NEW_DIE_YEAR ? 'd8' : 'd6'; }
function teamBudget(t) { return t.available - (t.fundContribution || 0); }
function teamAllocated(t) { return t.districts.filter(Boolean).length; }
function teamRemaining(t) { return teamBudget(t) - teamAllocated(t); }

/* ----------------------- SETUP UI ----------------------- */
function renderSetupNames() {
  const wrap = $('#teamNames');
  wrap.innerHTML = '';
  for (let i = 0; i < setup.teams; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = setup.names[i] || CONFIG.DEFAULT_NAMES[i] || ('Cooperativa ' + (i + 1));
    input.addEventListener('input', () => { setup.names[i] = input.value; });
    wrap.appendChild(input);
  }
}
function initSetup() {
  $('#teamsCount').textContent = setup.teams;
  $('#coopToggle').checked = setup.coop;
  renderSetupNames();
  $('#teamsMinus').addEventListener('click', () => {
    if (setup.teams > CONFIG.MIN_TEAMS) { setup.teams--; $('#teamsCount').textContent = setup.teams; renderSetupNames(); }
  });
  $('#teamsPlus').addEventListener('click', () => {
    if (setup.teams < CONFIG.MAX_TEAMS) {
      setup.teams++;
      if (!setup.names[setup.teams - 1]) setup.names[setup.teams - 1] = CONFIG.DEFAULT_NAMES[setup.teams - 1] || ('Cooperativa ' + setup.teams);
      $('#teamsCount').textContent = setup.teams; renderSetupNames();
    }
  });
  $('#coopToggle').addEventListener('change', e => { setup.coop = e.target.checked; });
  $('#startBtn').addEventListener('click', startGame);
}

/* ----------------------- AVVIO PARTITA ----------------------- */
function startGame() {
  Audio.ensure();
  CONFIG.START_BEANS = clampInt($('#cfgBeans').value, 4, 20, 10);
  CONFIG.YEARS       = clampInt($('#cfgYears').value, 2, 6, 3);

  const teams = [];
  for (let i = 0; i < setup.teams; i++) {
    teams.push({
      id: i,
      name: (setup.names[i] || ('Cooperativa ' + (i + 1))).trim() || ('Cooperativa ' + (i + 1)),
      color: CONFIG.TEAM_COLORS[i % CONFIG.TEAM_COLORS.length],
      available: CONFIG.START_BEANS,
      districts: new Array(CONFIG.REGIONS).fill(null),  // scommessa per distretto: 'flood'|'harvest'|'drought'|null
      fundContribution: 0,
      crises: 0,
      lastResult: null,
    });
  }
  state = {
    phase: 'invest',
    year: 1,
    dieType: 'd6',
    d8Revealed: false,
    coopEnabled: setup.coop,
    fondo: 0,
    rolls: [],
    rollIndex: 0,
    outcomeFace: null,
    teams,
  };
  save();
  showScreen('screen-board');
  enterInvest();
}
function clampInt(v, min, max, def) {
  let n = parseInt(v, 10);
  if (isNaN(n)) n = def;
  return Math.max(min, Math.min(max, n));
}

/* ----------------------- FASE INVESTIMENTI ----------------------- */
function enterInvest() {
  state.phase = 'invest';
  animating = false;
  state.outcomeFace = null;
  state.teams.forEach(t => { t.districts = new Array(CONFIG.REGIONS).fill(null); t.fundContribution = 0; t.lastResult = null; });
  state.dieType = state.d8Revealed ? dieTypeForYear(state.year) : 'd6';
  save();
  renderBoard();
}
function removeLastBet(t) {
  for (let j = t.districts.length - 1; j >= 0; j--) { if (t.districts[j]) { t.districts[j] = null; return; } }
}
// Clic su un distretto: cicla la scommessa  vuoto → 🌊 → 🌾 → ☀️ → vuoto.
function cycleDistrict(teamId, i) {
  const t = state.teams[teamId];
  const cur = t.districts[i];
  if (cur === null) {
    if (teamRemaining(t) <= 0) { flashMessage('Nessun fagiolo libero da mettere.'); return; }
    t.districts[i] = 'flood';
  } else if (cur === 'flood') t.districts[i] = 'harvest';
  else if (cur === 'harvest') t.districts[i] = 'drought';
  else t.districts[i] = null;   // ☀️ → vuoto (libera il fagiolo)
  save(); renderBoard();
}
function toggleFund(teamId, on) {
  const t = state.teams[teamId];
  if (on) {
    t.fundContribution = 1;
    while (teamRemaining(t) < 0) removeLastBet(t); // se sfora il budget, libera un fagiolo per il Fondo
  } else t.fundContribution = 0;
  save(); renderBoard();
}

function confirmInvest() {
  // si può avanzare anche con fagioli non investiti: restano per l'anno dopo
  const needReveal = state.year >= CONFIG.NEW_DIE_YEAR && !state.d8Revealed;
  if (needReveal) {
    animating = true;
    playNewDie(() => { animating = false; state.dieType = 'd8'; state.phase = 'recap'; save(); renderBoard(); });
    return;
  }
  state.phase = 'recap'; save(); renderBoard();
}
function backToInvest() { state.phase = 'invest'; save(); renderBoard(); }

/* ----------------------- PRECIPITAZIONE (10 regioni / 10 lanci) ----------------------- */
function startRoll() {
  state.teams.forEach(t => { if (t.fundContribution) { state.fondo += 1; t.available -= 1; t.fundContribution = 0; } });
  const dieType = dieTypeForYear(state.year);
  state.dieType = dieType;
  const die = CONFIG.DICE[dieType];
  state.rolls = [];
  for (let i = 0; i < CONFIG.REGIONS; i++) {
    const face = 1 + Math.floor(Math.random() * die.sides);
    state.rolls.push({ face, weather: die.map[face] });
  }
  state.rollIndex = 0;
  state.outcomeFace = null;
  state.phase = 'rain';
  save();
  renderBoard();
  openRollOverlay();
}

function openRollOverlay() {
  $('#rollOverlay').classList.add('show');
  renderRollStrip();
  $('#rollSummary').innerHTML = '';
  $('#rollResult').className = 'roll-result'; $('#rollResult').innerHTML = '';
  $('#rollDistrict').textContent = 'Distretto 1 / ' + CONFIG.REGIONS;
  $('#rollContinueBtn').classList.add('hidden');
  $('#nextRollBtn').classList.remove('hidden');
  $('#rollAllBtn').classList.remove('hidden');
  restCube(state.dieType);
}

function renderRollStrip() {
  const strip = $('#regionStrip');
  strip.innerHTML = '';
  for (let i = 0; i < CONFIG.REGIONS; i++) {
    const cell = document.createElement('div');
    cell.className = 'region-cell';
    cell.dataset.i = i;
    const r = state.rolls[i];
    if (i < state.rollIndex && r) { const w = WEATHER[r.weather]; cell.classList.add('filled', w.key); cell.textContent = w.icon; }
    else cell.textContent = (i + 1);
    strip.appendChild(cell);
  }
}

function advanceRoll(auto) {
  if (state.phase !== 'rain' || animating) return;
  if (state.rollIndex >= state.rolls.length) { finishRolls(); return; }
  const i = state.rollIndex;
  const r = state.rolls[i];
  const w = WEATHER[r.weather];
  animating = true;
  $('#rollDistrict').textContent = 'Distretto ' + (i + 1) + ' / ' + state.rolls.length;
  $('#rollResult').className = 'roll-result'; $('#rollResult').innerHTML = '';
  $$('#regionStrip .region-cell').forEach(c => c.classList.remove('current'));
  const cell = document.querySelector('#regionStrip .region-cell[data-i="' + i + '"]');
  if (cell) cell.classList.add('current');
  // 1) il dado rotola
  rollBigDie(state.dieType, r.face);
  // 2) quando si ferma, si rivela la precipitazione
  setTimeout(() => {
    const result = $('#rollResult');
    result.className = 'roll-result show ' + w.key;
    result.innerHTML = `<div class="roll-icon">${w.icon}</div><div class="roll-label">${w.label}</div>`;
    if (r.weather === 'f') Audio.rainBurst(); else if (r.weather === 'd') Audio.droughtWind(); else Audio.medium();
    if (cell) { cell.className = 'region-cell filled current ' + w.key; cell.textContent = w.icon; }
    state.rollIndex = i + 1;
    state.outcomeFace = r.face;
    animating = false;
    save();
    if (state.rollIndex >= state.rolls.length) setTimeout(finishRolls, CONFIG.RESULT_HOLD_MS);
    else if (auto) setTimeout(() => advanceRoll(true), CONFIG.RESULT_HOLD_MS);
  }, CONFIG.DIE_ROLL_MS);
}

function rollAllRolls() { advanceRoll(true); }

function finishRolls() {
  $('#nextRollBtn').classList.add('hidden');
  $('#rollAllBtn').classList.add('hidden');
  const c = { d: 0, m: 0, f: 0 };
  state.rolls.forEach(r => c[r.weather]++);
  $('#rollSummary').innerHTML =
    `<span class="sum f">🌊 ${c.f}</span><span class="sum m">🌤️ ${c.m}</span><span class="sum d">☀️ ${c.d}</span>`;
  $('#rollContinueBtn').classList.remove('hidden');
}

// Esiti: ogni distretto i confronta la scommessa i col meteo del distretto i.
function resolveYear() {
  let anyCrisis = false;
  state.teams.forEach(t => {
    let kept = 0, lost = 0, crisis = 0;
    const outcomes = [];
    for (let i = 0; i < CONFIG.REGIONS; i++) {
      const w = state.rolls[i] ? state.rolls[i].weather : 'm';
      const bet = t.districts[i] || null;
      const extreme = (w === 'f' || w === 'd');
      if (!bet) {
        // distretto scoperto: crisi se capita un evento estremo (nessun fagiolo perso)
        if (extreme) { crisis++; outcomes.push('uncovered'); } else outcomes.push('calm');
      } else if (betMatches(bet, w)) { kept++; outcomes.push('ok'); }
      else { lost++; if (extreme) { crisis++; outcomes.push('crisis'); } else outcomes.push('miss'); }
    }
    // Fondo di solidarietà: annulla le crisi finché ha fagioli
    if (state.coopEnabled) { while (crisis > 0 && state.fondo > 0) { crisis--; state.fondo--; } }
    const unallocated = Math.max(0, t.available - teamAllocated(t)); // fagioli non investiti: restano
    t.crises += crisis;
    t.available = kept + unallocated;
    t.lastResult = { kept, lost, crisis, unallocated, outcomes };
    if (crisis > 0) anyCrisis = true;
  });
  state.phase = 'yearEnd';
  save();
  renderBoard();
  state.teams.forEach(t => {
    if (t.lastResult && t.lastResult.crisis > 0) {
      const card = document.querySelector('.team-card[data-id="' + t.id + '"]');
      if (card) { card.classList.add('crisis-flash'); setTimeout(() => card.classList.remove('crisis-flash'), 1800); }
    }
  });
  if (anyCrisis) Audio.crisis();
}

function nextYear() {
  if (state.year >= CONFIG.YEARS) { showPodium(); return; }
  state.year += 1;
  // a inizio di ogni nuovo anno ogni squadra riceve fagioli extra
  state.teams.forEach(t => { t.available += CONFIG.YEARLY_BONUS; });
  enterInvest();
  if (CONFIG.YEARLY_BONUS > 0) flashMessage('Nuovo anno · +' + CONFIG.YEARLY_BONUS + ' ' + CONFIG.BEAN + ' a ogni squadra', CONFIG.BEAN);
}

/* ----------------------- RENDER ----------------------- */
function renderBoard() {
  $('#yearBadge').textContent = 'Anno ' + state.year + ' / ' + CONFIG.YEARS;
  const phaseNames = { invest: 'Investimenti', recap: 'Riepilogo — pronti al lancio', rain: 'Precipitazione', yearEnd: 'Esiti dell\'anno' };
  $('#phaseLabel').textContent = phaseNames[state.phase] || '';
  if (state.phase !== 'rain') hideBigRoll();
  updateDieDisplay();
  updateRulesTable();
  renderTeams();
  renderFund();
  renderControls();
}

function updateDieDisplay() {
  const die = $('#die');
  const dt = state.dieType;
  die.className = 'die ' + (dt === 'd8' ? 'die-d8' : 'die-d6');
  die.textContent = state.outcomeFace || (dt === 'd8' ? '8' : '6');
  $('#dieType').textContent = dt === 'd8' ? 'dado a 8 facce' : 'dado a 6 facce';
}
function updateRulesTable() {
  const r6 = $('#ruleD6'), r8 = $('#ruleD8');
  r6.className = ''; r8.className = '';
  r8.style.display = state.d8Revealed ? '' : 'none';
  if (state.dieType === 'd8') { r8.classList.add('active-rule'); r6.classList.add('dim-rule'); }
  else r6.classList.add('active-rule');
}

function renderTeams() {
  const board = $('#teamsBoard');
  board.innerHTML = '';
  const invest = state.phase === 'invest';
  const showResult = state.phase === 'yearEnd';

  state.teams.forEach(t => {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.dataset.id = t.id;
    card.style.setProperty('--team-color', t.color);

    const remaining = teamRemaining(t);
    const full = remaining === 0;

    // riga dei distretti: scommessa per distretto (cliccabile in fase investimenti), con esito se disponibile
    const res = t.lastResult;
    let slots = '<div class="dist-slots">';
    for (let i = 0; i < CONFIG.REGIONS; i++) {
      const bet = t.districts[i];
      let cls = 'dist-slot', content = (i + 1);
      if (bet) { cls += ' set ' + BET[bet].cls; content = BET[bet].icon; }
      else cls += ' empty';
      if (invest) cls += ' clickable';
      if (showResult && res && res.outcomes && i < res.outcomes.length) {
        cls += ' ' + res.outcomes[i];
        if (res.outcomes[i] === 'uncovered' && state.rolls[i]) content = WEATHER[state.rolls[i].weather].icon;
      }
      const attrs = invest ? ` data-act="dist" data-team="${t.id}" data-i="${i}" role="button"` : '';
      slots += `<span class="${cls}"${attrs} title="Distretto ${i + 1}">${content}</span>`;
    }
    slots += '</div>';
    const legend = invest ? `<div class="dist-legend">Clicca un distretto: ⬚ → 🌊 → 👍 → ☀️ → ⬚</div>` : '';

    let fund = '';
    if (state.coopEnabled && state.year >= CONFIG.NEW_DIE_YEAR) {
      if (invest) fund = `<label class="fund-toggle"><input type="checkbox" data-act="fund" data-team="${t.id}" ${t.fundContribution ? 'checked' : ''}/>versa 1 ${CONFIG.BEAN} nel Fondo</label>`;
      else if (state.phase === 'recap' && t.fundContribution) fund = `<span class="fund-mark">↑ 1 ${CONFIG.BEAN} al Fondo</span>`;
    }

    let foot = '';
    if (invest) {
      const pill = remaining > 0
        ? `<span class="remaining-pill">${remaining} ${CONFIG.BEAN} liberi · restano</span>`
        : `<span class="remaining-pill full">✓ tutti investiti</span>`;
      foot = `<div class="card-foot">${pill}${fund}</div>`;
    } else if (showResult && res) {
      foot = `<div class="result-line">
          <span class="res-kept">✅ ${res.kept} tenuti</span>
          ${res.unallocated ? `<span class="res-save">💤 ${res.unallocated} non inv.</span>` : ''}
          <span class="res-lost">❌ ${res.lost} persi</span>
          ${res.crisis > 0 ? `<span class="res-crisis">${CONFIG.CRISIS} ${res.crisis}</span>` : ''}
        </div>`;
    } else if (fund) {
      foot = `<div class="card-foot">${fund}</div>`;
    }

    card.innerHTML = `
      <div class="team-name">
        <span class="team-dot"></span><span class="tn-text">${escapeHTML(t.name)}</span>
        <span class="beans-left">${CONFIG.BEAN} ${t.available}</span>
      </div>
      <div class="card-stats"><span class="st-crisis">${CONFIG.CRISIS} ${t.crises} crisi</span></div>
      ${legend}
      ${slots}
      ${foot}`;
    board.appendChild(card);
  });

  board.querySelectorAll('[data-act="dist"]').forEach(el => {
    el.addEventListener('click', () => cycleDistrict(+el.dataset.team, +el.dataset.i));
  });
  board.querySelectorAll('input[data-act="fund"]').forEach(chk => {
    chk.addEventListener('change', () => toggleFund(+chk.dataset.team, chk.checked));
  });
}

function rankedTeams() {
  return state.teams.slice().sort((a, b) => {
    if (a.crises !== b.crises) return a.crises - b.crises;   // meno crisi
    return b.available - a.available;                        // a parità, più fagioli
  });
}
function renderFund() {
  const box = $('#fundBox');
  if (!state.coopEnabled) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.classList.toggle('disabled', state.year < CONFIG.NEW_DIE_YEAR);
  $('#fundBeans').textContent = state.fondo;
}
function renderControls() {
  const ids = ['investDoneBtn', 'backInvestBtn', 'rollDiceBtn', 'nextYearBtn'];
  ids.forEach(id => $('#' + id).classList.add('hidden'));
  if (state.phase === 'invest') {
    const b = $('#investDoneBtn'); b.classList.remove('hidden'); b.disabled = false;
  } else if (state.phase === 'recap') {
    $('#backInvestBtn').classList.remove('hidden');
    $('#rollDiceBtn').classList.remove('hidden');
  } else if (state.phase === 'yearEnd') {
    const b = $('#nextYearBtn'); b.classList.remove('hidden');
    b.textContent = state.year >= CONFIG.YEARS ? 'Vai al podio' : 'Anno successivo';
  }
}

/* ----------------------- DADO 3D ----------------------- */
// Rotazione del cubo per portare la faccia <valore> davanti (d6).
const FACE_ROT = { 1:{x:0,y:0}, 2:{x:0,y:-90}, 3:{x:-90,y:0}, 4:{x:90,y:0}, 5:{x:0,y:90}, 6:{x:0,y:180} };
// Posizione dei pallini su una griglia 3x3 (indici 0..8) per ogni valore.
const PIP_MAP = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
const CUBE_FACES = [['cf-front',1],['cf-back',6],['cf-right',2],['cf-left',5],['cf-top',3],['cf-bottom',4]];

function pipHTML(v) {
  const on = PIP_MAP[v] || [];
  let s = '<div class="pips">';
  for (let i = 0; i < 9; i++) s += '<span class="pip' + (on.indexOf(i) >= 0 ? ' on' : '') + '"></span>';
  return s + '</div>';
}
function buildCube(dieType, face) {
  const big = $('#bigDie');
  big.className = 'dice3d ' + dieType;
  let html = '<div class="cube">';
  CUBE_FACES.forEach(([cls, v], idx) => {
    let content;
    if (dieType === 'd6') content = pipHTML(v);
    else { const n = (cls === 'cf-front') ? face : ((face + idx * 3) % 8) + 1; content = '<span class="num">' + n + '</span>'; }
    html += '<div class="cube-face ' + cls + '">' + content + '</div>';
  });
  big.innerHTML = html + '</div>';
}
// ---- d8: vero ottaedro (8 facce triangolari) ----
const OCTA_REST_X = -16, OCTA_REST_Y = 0;   // orientamento a riposo (mostra la faccia frontale-alta)
function buildOcta(face) {
  const big = $('#bigDie');
  big.className = 'dice3d d8';
  const others = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => n !== face);
  // la faccia t0 (frontale-alta) mostra il risultato; le altre numeri distinti
  const nums = [face, others[0], others[2], others[4], others[1], others[3], others[5], others[6]];
  let html = '<div class="octa">';
  for (let k = 0; k < 4; k++) html += '<div class="octa-face top t' + k + '"><span>' + nums[k] + '</span></div>';
  for (let k = 0; k < 4; k++) html += '<div class="octa-face bot b' + k + '"><span>' + nums[4 + k] + '</span></div>';
  big.innerHTML = html + '</div>';
}
function rollOcta(face) {
  buildOcta(face);
  const octa = $('#bigDie .octa');
  const sx = 2 + Math.floor(Math.random() * 3);
  const sy = 2 + Math.floor(Math.random() * 3);
  octa.style.transition = 'none';
  octa.style.transform = 'rotateX(0deg) rotateY(0deg)';
  void octa.offsetWidth;
  octa.style.transition = 'transform ' + (CONFIG.DIE_ROLL_MS / 1000) + 's cubic-bezier(.2,.72,.28,1)';
  octa.style.transform = 'rotateX(' + (OCTA_REST_X + 360 * sx) + 'deg) rotateY(' + (OCTA_REST_Y + 360 * sy) + 'deg)';
}
// Lancio: cubo (d6) o ottaedro (d8) che decelera e si ferma sulla faccia col risultato.
function rollBigDie(dieType, face) {
  if (dieType === 'd8') { rollOcta(face); return; }
  buildCube(dieType, face);
  const cube = $('#bigDie .cube');
  const sx = 2 + Math.floor(Math.random() * 3);
  const sy = 2 + Math.floor(Math.random() * 3);
  const fr = FACE_ROT[face];
  const rz = Math.floor(Math.random() * 24) - 12;   // leggera inclinazione in piano (carattere)
  cube.style.transition = 'none';
  cube.style.transform = 'rotateX(-24deg) rotateY(24deg) rotateZ(0deg)';
  void cube.offsetWidth;
  cube.style.transition = 'transform ' + (CONFIG.DIE_ROLL_MS / 1000) + 's cubic-bezier(.2,.72,.28,1)';
  cube.style.transform = 'rotateX(' + (fr.x + 360 * sx) + 'deg) rotateY(' + (fr.y + 360 * sy) + 'deg) rotateZ(' + rz + 'deg)';
}
function restCube(dieType) {
  if (dieType === 'd8') { buildOcta(8); const o = $('#bigDie .octa'); if (o) o.style.transform = 'rotateX(' + OCTA_REST_X + 'deg) rotateY(' + OCTA_REST_Y + 'deg)'; return; }
  buildCube(dieType, 6); const c = $('#bigDie .cube'); if (c) c.style.transform = 'rotateX(-24deg) rotateY(24deg)';
}

function hideBigRoll() { $('#rollOverlay').classList.remove('show'); }

function playNewDie(done) {
  const ov = $('#climateOverlay');
  ov.classList.add('show');
  Audio.thunder();
  setTimeout(() => Audio.fanfare(), 450);
  setTimeout(() => { ov.classList.remove('show'); state.d8Revealed = true; save(); if (done) done(); }, CONFIG.NEW_DIE_ANIM_MS);
}

/* ----------------------- PODIO ----------------------- */
function showPodium() {
  state.phase = 'end';
  save();
  showScreen('screen-podium');
  const ranked = rankedTeams();
  const podium = $('#podium');
  podium.innerHTML = '';
  const order = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const medal = ['🥇', '🥈', '🥉'];
  order.forEach(t => {
    const rank = ranked.indexOf(t);
    const cls = rank === 0 ? 'first' : rank === 1 ? 'second' : 'third';
    const el = document.createElement('div');
    el.className = 'podium-place ' + cls;
    el.innerHTML = `<div class="rank">${medal[rank] || (rank + 1)}</div>
      <div class="pname">${escapeHTML(t.name)}</div>
      <div class="pstats">${CONFIG.CRISIS} ${t.crises} · ${CONFIG.BEAN} ${t.available}</div>`;
    podium.appendChild(el);
  });
  let rows = ranked.map((t, i) =>
    `<tr><td>${i + 1}</td><td style="text-align:left">${escapeHTML(t.name)}</td><td>${t.crises}</td><td>${t.available}</td></tr>`
  ).join('');
  $('#finalTable').innerHTML =
    `<table><thead><tr><th>#</th><th style="text-align:left">Squadra</th><th>${CONFIG.CRISIS} Crisi</th><th>${CONFIG.BEAN} Fagioli</th></tr></thead><tbody>${rows}</tbody></table>`;
  Audio.fanfare();
}

/* ----------------------- UTIL ----------------------- */
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function flashMessage(msg, icon) {
  const ov = $('#weatherOverlay');
  ov.className = 'weather-overlay show medium';
  $('#weatherIcon').textContent = icon || '⚠️';
  $('#weatherText').textContent = msg;
  clearTimeout(flashMessage._t);
  flashMessage._t = setTimeout(() => { ov.className = 'weather-overlay'; }, 2200);
}
function resetGame() {
  if (!confirm('Reset della partita e ritorno al setup?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = null;
  hideBigRoll();
  showScreen('screen-setup');
}

/* ----------------------- CONTROLLI CONSOLE ----------------------- */
window.SOE = {
  reset: resetGame,
  state: () => state,
  config: CONFIG,
  confirmInvest, startRoll, advanceRoll, rollAllRolls, resolveYear, nextYear,
  mute: (m) => { const b = $('#muteBtn'); Audio.setMuted(m); b.classList.toggle('muted', m); b.textContent = m ? '🔇' : '🔊'; },
  podium: showPodium,
};

/* ----------------------- BOOTSTRAP ----------------------- */
function bindControls() {
  $('#investDoneBtn').addEventListener('click', confirmInvest);
  $('#backInvestBtn').addEventListener('click', backToInvest);
  $('#rollDiceBtn').addEventListener('click', startRoll);
  $('#nextRollBtn').addEventListener('click', () => advanceRoll(false));
  $('#rollAllBtn').addEventListener('click', rollAllRolls);
  $('#rollContinueBtn').addEventListener('click', () => { hideBigRoll(); resolveYear(); });
  $('#nextYearBtn').addEventListener('click', nextYear);
  $('#resetBtn').addEventListener('click', resetGame);
  $('#restartBtn').addEventListener('click', resetGame);
  $('#muteBtn').addEventListener('click', () => {
    const m = !Audio.isMuted();
    Audio.setMuted(m);
    const b = $('#muteBtn'); b.classList.toggle('muted', m); b.textContent = m ? '🔇' : '🔊';
  });
}
function boot() {
  initSetup();
  bindControls();
  const saved = load();
  if (saved && saved.teams && saved.phase !== 'end') {
    state = saved;
    if (state.phase === 'rain') state.phase = 'recap'; // un lancio interrotto: torna al riepilogo
    showScreen('screen-board');
    renderBoard();
  } else showScreen('screen-setup');
}
document.addEventListener('DOMContentLoaded', boot);
