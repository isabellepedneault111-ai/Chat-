// La console de Frog : Diapason écoute le matériel en MIDI (horloge, transport, sons, boutons, accords)
// et transforme les moments marquants en repères horodatés.
import { matchChord, chordLabel } from './instrument.js';
import { audio } from './audio.js';
import { store } from './ui.js';

// Noms des contrôleurs les plus courants (CC) : ce que Frog tourne vraiment.
const CC_NAMES = { 1: 'modulation', 7: 'volume', 10: 'panoramique', 11: 'expression', 64: 'sustain', 71: 'résonance', 72: 'relâche', 73: 'attaque', 74: 'filtre', 91: 'réverbe', 93: 'chorus', 94: 'désaccord', 5: 'portamento' };
const listeners = new Set();
let access = null;

// L’état de la console MIDI : branchée ou non, les appareils, le tempo reçu, le transport, les derniers événements.
export const consoleState = {
  on: false,
  devices: [],
  bpm: null,
  transport: 'stop',
  program: null,
  chord: null,
  notes: 0,
  events: [], // { at, kind, text }
};

// S’abonner aux événements de la console MIDI (appareil branché, tempo, accord tenu…).
export const onConsole = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
// Les notes que Frog tient en ce moment (MIDI), de la plus grave à la plus aiguë.
export const heldNotes = () => [...held].sort((x, y) => x - y);
const emit = (ev) => listeners.forEach((fn) => fn(ev, consoleState));
const MAX_EVENTS = 200;

// Ajoute un événement au journal de la console (gardé à une longueur maximale) et prévient les abonnés.
function push(kind, text) {
  const ev = { at: Date.now(), kind, text };
  consoleState.events.push(ev);
  if (consoleState.events.length > MAX_EVENTS) consoleState.events.shift();
  emit(ev);
}

// Horloge MIDI : 24 impulsions par noire.
const ticks = [];
let lastTempoAt = 0;
let lastTempoSaid = null;
// Reçoit l’horloge MIDI du matériel de Frog (24 impulsions par noire) et en déduit son tempo.
function onClock(t) {
  ticks.push(t);
  if (ticks.length > 49) ticks.shift();
  if (ticks.length < 25) return;
  const avg = (ticks[ticks.length - 1] - ticks[0]) / (ticks.length - 1);
  const bpm = Math.round((60000 / (avg * 24)) * 10) / 10;
  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 300) return;
  consoleState.bpm = bpm;
  // On annonce un nouveau tempo seulement s'il est stable et vraiment différent.
  if ((lastTempoSaid == null || Math.abs(bpm - lastTempoSaid) >= 1.5) && t - lastTempoAt > 2000) {
    lastTempoAt = t;
    lastTempoSaid = bpm;
    push('tempo', `Tempo : ${Math.round(bpm)} BPM`);
  }
}

// Boutons tournés : une annonce par geste (pas une par valeur).
const ccMoves = new Map();
// Reçoit un contrôleur MIDI (bouton, potentiomètre) et note le geste quand il s’arrête (« filtre ouvert de 30 % »).
function onCC(ch, cc, val) {
  const now = performance.now();
  const m = ccMoves.get(cc) || { start: val, last: val, t: 0, timer: 0 };
  if (now - m.t > 1200) m.start = m.last;
  m.last = val;
  m.t = now;
  clearTimeout(m.timer);
  m.timer = setTimeout(() => {
    const d = m.last - m.start;
    if (Math.abs(d) >= 32) push('cc', `${CC_NAMES[cc] ? `Le ${CC_NAMES[cc]}` : `Le bouton ${cc}`} ${d > 0 ? 'monte' : 'descend'}`);
    m.start = m.last;
  }, 700);
  ccMoves.set(cc, m);
}

// Accords tenus (3 notes ou plus), annoncés quand ils changent et tiennent un instant.
const held = new Set();
let chordTimer = 0;
// Quand trois notes ou plus sont tenues : attend un instant, puis nomme l’accord joué.
function onNotes() {
  clearTimeout(chordTimer);
  if (held.size < 3) return;
  chordTimer = setTimeout(() => {
    const chroma = new Array(12).fill(0);
    held.forEach((n) => { chroma[n % 12] += 1; });
    chroma[Math.min(...held) % 12] += 0.5;
    const m = matchChord(chroma);
    const label = chordLabel(m);
    if (label !== consoleState.chord) {
      consoleState.chord = label;
      push('chord', `Accord : ${label}`);
    }
  }, 300);
}

// Lit chaque message MIDI reçu : horloge, démarrage, arrêt, notes, contrôleurs.
function handler(e) {
  const [st, a, b] = e.data;
  if (st === 0xf8) { onClock(e.timeStamp || performance.now()); return; }
  if (st === 0xfa) { consoleState.transport = 'play'; ticks.length = 0; push('transport', 'Le séquenceur de Frog démarre'); return; }
  if (st === 0xfb) { consoleState.transport = 'play'; push('transport', 'Le séquenceur repart'); return; }
  if (st === 0xfc) { consoleState.transport = 'stop'; push('transport', 'Le séquenceur s’arrête'); return; }
  if (st >= 0xf0) return; // autres messages système : ignorés
  const cmd = st & 0xf0;
  const ch = (st & 0x0f) + 1;
  if (cmd === 0xc0) { consoleState.program = { ch, num: a + 1 }; push('program', `Changement de son : programme ${a + 1}${ch !== 1 ? ` (canal ${ch})` : ''}`); return; }
  if (cmd === 0xb0) { onCC(ch, a, b); return; }
  if (cmd === 0x90 && b > 0) { held.add(a); consoleState.notes++; onNotes(); emit({ kind: 'notes' }); return; }
  if (cmd === 0x80 || (cmd === 0x90 && b === 0)) { held.delete(a); onNotes(); emit({ kind: 'notes' }); }
}

// Écoute tous les appareils MIDI branchés, et annonce ceux qui arrivent ou partent.
function attach() {
  const inputs = [...access.inputs.values()];
  const names = inputs.map((i) => i.name);
  names.filter((n) => !consoleState.devices.includes(n)).forEach((n) => push('device', `Branché : ${n}`));
  consoleState.devices.filter((n) => !names.includes(n)).forEach((n) => push('device', `Débranché : ${n}`));
  consoleState.devices = names;
  inputs.forEach((i) => { i.removeEventListener('midimessage', handler); i.addEventListener('midimessage', handler); });
}

// Branche la console MIDI : demande l’accès au navigateur et commence à écouter le matériel.
export async function startConsole() {
  if (consoleState.on) return consoleState;
  if (!navigator.requestMIDIAccess) throw new Error('Ce navigateur ne lit pas le MIDI : ouvre Diapason dans Chrome ou Edge sur l’ordinateur branché au matériel.');
  access = await navigator.requestMIDIAccess();
  consoleState.on = true;
  attach();
  access.addEventListener('statechange', attach);
  restoreClockOutput();
  emit({ kind: 'status' });
  return consoleState;
}

// Débranche la console MIDI.
export function stopConsole() {
  if (!access) return;
  access.removeEventListener('statechange', attach);
  [...access.inputs.values()].forEach((i) => i.removeEventListener('midimessage', handler));
  consoleState.on = false;
  consoleState.devices = [];
  emit({ kind: 'status' });
}

// ---------- Horloge sortante : le matériel de Frog suit la boucle de Diapason ----------
// 24 impulsions par noire (6 par double-croche), plus Départ / Arrêt, programmées à l'avance
// avec l'horodatage de Web MIDI : pas de dérive, même si l'onglet est occupé.

let clockOut = null;
// L’état de l’horloge envoyée au matériel : vers quel appareil, et le décalage qui compense la latence.
export const clockState = {
  get target() { return clockOut ? clockOut.name : null; },
  offset: store.get('clockOffset', 0), // ms : compense la latence de la carte son
};
// Les sorties MIDI disponibles (synthés, boîtes à rythmes, logiciels).
export const listOutputs = () => (access ? [...access.outputs.values()].map((o) => ({ id: o.id, name: o.name })) : []);

// Choisit l’appareil qui recevra l’horloge MIDI de l’app (pour que son séquenceur suive notre boucle).
export function setClockOutput(id) {
  clockOut = id && access ? access.outputs.get(id) || null : null;
  store.set('clockOutName', clockOut ? clockOut.name : null);
  emit({ kind: 'status' });
}
// Règle le décalage de l’horloge (en millisecondes, de -80 à 80) pour compenser la latence de la carte son.
export function setClockOffset(ms) {
  clockState.offset = Math.max(-80, Math.min(80, Math.round(ms)));
  store.set('clockOffset', clockState.offset);
}
// Au branchement, on retrouve l'appareil choisi la dernière fois.
export function restoreClockOutput() {
  const name = store.get('clockOutName', null);
  const o = name && access && [...access.outputs.values()].find((x) => x.name === name);
  if (o) clockOut = o;
}

// Temps audio → temps MIDI. L'horloge audio avance par blocs : la lire telle quelle ferait trembler
// les impulsions. On ancre donc l'écart entre les deux horloges au départ, puis on le lisse très
// lentement (1 % par double-croche) : intervalles réguliers, et aucune dérive sur la durée.
let anchor = null;
const liveAnchor = () => performance.now() - audio().currentTime * 1000;
const stamp = (t) => (anchor ?? liveAnchor()) + t * 1000 + clockState.offset;
// Envoie le signal « départ » au matériel, calé sur l’instant donné.
export function clockStart(t) { anchor = liveAnchor(); clockOut?.send([0xfa], Math.max(0, stamp(t) - 1)); }
// Envoie six impulsions d’horloge par double-croche au matériel, calées sur le son de l’app.
export function clockStep(t, sixteenth) {
  if (!clockOut) return;
  anchor = anchor == null ? liveAnchor() : anchor * 0.99 + liveAnchor() * 0.01;
  for (let i = 0; i < 6; i++) clockOut.send([0xf8], stamp(t + (i * sixteenth) / 6));
}
// Envoie le signal « arrêt » au matériel.
export function clockStop(t) { clockOut?.send([0xfc], t != null ? stamp(t) : 0); }
