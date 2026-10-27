// Mon matériel et le filet. Tout ce que Frog branche (claviers, table de mixage, interface, micros) est détecté par le
// navigateur ou ajouté à la main, avec une case pour l'activer. Le filet écoute en continu ce qui est actif (le son de
// l'app, les entrées audio, les notes MIDI) et garde toujours la dernière minute : un bon bout de jam n'est jamais perdu.
// Tout reste dans l'appareil, en mémoire vive, tant qu'on ne choisit pas de le garder.
import { audio, finalOut } from './audio.js';
import { store } from './ui.js';
import { notePiano } from './sampler.js';

// Les sortes d’appareils qu’on peut avoir dans son studio.
export const SORTES = {
  clavier: 'Clavier', table: 'Table de mixage', interface: 'Interface audio', synthe: 'Synthé ou boîte à rythmes',
  platine: 'Platine vinyle ou CDJ', guitare: 'Guitare ou basse', micro: 'Micro', enceinte: 'Enceinte, moniteur', ecoute: 'Casque', ordi: 'Ordinateur', autre: 'Autre',
};
// D'après le nom que l'appareil donne de lui-même : une bonne première idée, que Frog corrige d'un clic.
export function deviner(nom) {
  const n = nom.toLowerCase();
  if (/xone|djm|mixer|mixeur|table|rane|pioneer dj|allen/.test(n)) return 'table';
  if (/scarlett|focusrite|motu|audient|umc|ssl|apollo|presonus|steinberg|interface|babyface|id14|id4/.test(n)) return 'interface';
  if (/sv-?1|piano|keys?\b|keyboard|keystation|launchkey|mpk|nord|kronos|fp-|rd-|clavier|keylab|oxygen/.test(n)) return 'clavier';
  if (/synth|minilogue|moog|op-1|tr-|td-|drum|volca|digitakt|microkorg|juno|prophet/.test(n)) return 'synthe';
  if (/technics|sl-?1200|turntable|platine|cdj|xdj|plx|reloop/.test(n)) return 'platine';
  if (/guitar|guitare|bass|basse|strat|tele|les paul|fender|gibson|ibanez/.test(n)) return 'guitare';
  if (/monitor|moniteur|enceinte|krk|rokit|genelec|yamaha hs|adam|jbl|speaker/.test(n)) return 'enceinte';
  if (/casque|headphone|dt ?770|dt ?990|ath-|hd ?\d{3}/.test(n)) return 'ecoute';
  if (/micro|mic\b|microphone|built-in|intégr|internal|webcam|airpods|headset/.test(n)) return 'micro';
  return 'autre';
}
// « Default - Scarlett 2i2 USB (1235:8210) » → « Scarlett 2i2 USB » : le même appareil, qu'il soit vu en audio ou en MIDI.
const propre = (l) => String(l || '').replace(/^(default|par défaut|communications)\s*[-:]\s*/i, '').replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').replace(/\s+(midi\s*)?(in|out|port\s*\d+)$/i, '').trim();
const cle = (nom) => propre(nom).toLowerCase();

const reg = () => store.get('materiel', { app: { nom: 'Le son de l’app', sorte: 'ordi', actif: true } });
const ecrire = (r) => store.set('materiel', r);
const detecte = { audio: new Map(), midi: new Map() }; // clé → deviceId / MIDIInput
const ecoutes = new Set(); const activite = new Set(); const notesEcoute = new Set();
// Les notes jouées sur tous les claviers actifs (pour La cathédrale, et tout ce qui veut écouter le jeu de Frog).
export const onNotes = (fn) => { notesEcoute.add(fn); return () => notesEcoute.delete(fn); };
// Les contrôleurs (molette de modulation, potentiomètres, pédales) : numéro et valeur, de tous les claviers actifs.
const ccEcoute = new Set();
// S’abonner aux contrôleurs MIDI (molette de modulation, potentiomètres, pédales) de tous les claviers actifs.
export const onCC = (fn) => { ccEcoute.add(fn); return () => ccEcoute.delete(fn); };
// Les sorties MIDI branchées (synthés, claviers, logiciels) : on peut y renvoyer des notes.
export async function sortiesMidi() {
  if (!navigator.requestMIDIAccess) return [];
  try { midiAcces ||= await navigator.requestMIDIAccess(); return [...midiAcces.outputs.values()]; } catch { return []; }
}
// S’abonner aux changements de matériel (un appareil branché, débranché, coché).
export const onMateriel = (fn) => { ecoutes.add(fn); return () => ecoutes.delete(fn); };
// S’abonner à l’activité des appareils (une touche jouée) : les appareils s’allument dans la pièce quand on joue.
export const onActivite = (fn) => { activite.add(fn); return () => activite.delete(fn); };
const signaler = () => ecoutes.forEach((f) => { try { f(); } catch { /* une vue fermée */ } });

// Les entrées audio que l'ordinateur invente (visio, logiciels, mélangeurs virtuels) : jamais du vrai matériel.
export const VIRTUEL = /teams|zoom|webex|discord|skype|virtual|virtuel|steam|stereo mix|mixage st[ée]r[ée]o|vb-?audio|voicemeeter|\bcable\b|blackhole|loopback|soundflower|nvidia broadcast|krisp|obs\b|aggregate|agrégé|multi-?output/i;
// Le micro intégré de l'ordinateur fait partie de l'ordi : il reste dans le studio, branché à lui.
export const INTEGRE = /macbook|built-?in|intégr|internal|interne/i;
// Dans le studio : tout ce qui est détecté arrive seul (et se retire d'un geste, sans revenir), sauf les entrées
// virtuelles (Teams, Zoom…) : elles sont seulement proposées, on les garde ou on les ignore.
const dansStudio = (k, r) => {
  if (k === 'app') return true; if (r[k]) return !r[k].masque;
  return detecte.midi.has(k) || !VIRTUEL.test(detecte.audio.get(k)?.label || '');
};
// Les micros virtuels détectés (Teams, Zoom…) qui ne sont pas dans le studio : on les propose, on ne les ajoute pas d’office.
export function proposes() {
  const r = reg();
  return [...detecte.audio.entries()].filter(([k]) => !dansStudio(k, r) && !r[k]).map(([k, d]) => ({ k, nom: propre(d.label), virtuel: VIRTUEL.test(d.label) })).sort((a, b) => a.virtuel - b.virtuel || a.nom.localeCompare(b.nom));
}
// Fait entrer dans le studio un micro proposé.
export function garder(k) { const d = detecte.audio.get(k); const r = reg(); const nom = propre(d?.label || k); r[k] = { nom, sorte: deviner(nom), actif: false }; ecrire(r); signaler(); }
// Ignore un appareil : il disparaît du studio et ne revient pas à la prochaine détection.
export function ignorer(k) { const r = reg(); r[k] = { ...(r[k] || {}), nom: r[k]?.nom || propre(detecte.audio.get(k)?.label || detecte.midi.get(k)?.name || k), masque: true }; ecrire(r); signaler(); }
// La liste des appareils ignorés (pour pouvoir les remettre).
export const ignores = () => Object.entries(reg()).filter(([, x]) => x.masque).map(([k, x]) => ({ k, nom: x.nom || k }));
// Remet un appareil ignoré dans le studio.
export function retablir(k) { const r = reg(); if (r[k]) { delete r[k].masque; r[k].actif = false; } ecrire(r); signaler(); }

// La liste complète : ce que le navigateur voit + ce que Frog a ajouté à la main.
export function appareils() {
  const r = reg(); const cles = new Set([...Object.keys(r), ...detecte.audio.keys(), ...detecte.midi.keys()].filter((k) => dansStudio(k, r)));
  return [...cles].map((k) => {
    const x = r[k] || {}; const nom = x.nom || propre(detecte.audio.get(k)?.label || detecte.midi.get(k)?.name || k);
    const integre = !x.perso && INTEGRE.test(detecte.audio.get(k)?.label || nom);
    return { k, nom, integre, sorte: x.sorte || (integre ? 'micro' : deviner(nom)), actif: x.actif ?? (k !== 'app' ? !!detecte.midi.get(k) : true), audio: detecte.audio.get(k)?.deviceId || null, midi: detecte.midi.has(k), perso: !!x.perso, son: !!x.son, lie: x.lie || '', x: x.x, y: x.y, couleur: x.couleur || '', taille: x.taille || 1, rot: x.rot || 0, branche: k === 'app' || detecte.audio.has(k) || detecte.midi.has(k) };
  }).sort((a, b) => (a.k === 'app' ? -1 : b.k === 'app' ? 1 : (b.branche - a.branche) || a.nom.localeCompare(b.nom)));
}
// Change un réglage d’un appareil (nom, sorte, actif, place, couleur…) et le garde dans l’appareil.
export function regler(k, change) {
  const r = reg(); const avant = appareils().find((a) => a.k === k) || {};
  r[k] = { nom: avant.nom, sorte: avant.sorte, actif: avant.actif, ...r[k], ...change }; ecrire(r);
  if ('actif' in change && filet.arme) majPistes();
  signaler();
}
// Ajoute à la main un appareil que l’ordinateur ne voit pas (une enceinte, une guitare, une platine).
export function ajouter(nom, sorte, lie = '') {
  const k = `perso-${cle(nom).replace(/[^a-z0-9]+/g, '-')}`; const r = reg();
  r[k] = { nom: nom.trim(), sorte: sorte || deviner(nom), actif: true, perso: true, lie }; ecrire(r); signaler(); return k;
}
// Retirer : un appareil ajouté à la main s'efface ; un appareil détecté est ignoré (sinon il reviendrait à la prochaine détection).
export function retirer(k) { const r = reg(); if (r[k]?.perso) { delete r[k]; ecrire(r); signaler(); } else ignorer(k); }

// Détecter : un court accès au micro (sinon le navigateur cache le nom des entrées), puis le MIDI.
let midiAcces = null;
// Détecte le matériel branché : les entrées audio (après un court accès au micro, sinon le navigateur cache leurs noms) et les claviers MIDI.
export async function detecter({ demander = false } = {}) {
  if (demander && navigator.mediaDevices?.getUserMedia) {
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); } catch { /* refusé : on garde ce qu'on voit */ }
  }
  detecte.audio.clear();
  try {
    (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput' && d.label && !/^(default|communications)$/i.test(d.deviceId))
      .forEach((d) => { if (!detecte.audio.has(cle(d.label))) detecte.audio.set(cle(d.label), d); });
  } catch { /* pas d'accès aux appareils */ }
  if (navigator.requestMIDIAccess && (demander || midiAcces)) {
    try {
      midiAcces ||= await navigator.requestMIDIAccess();
      const lire = () => { detecte.midi.clear(); [...midiAcces.inputs.values()].forEach((i) => { detecte.midi.set(cle(i.name), i); i.removeEventListener('midimessage', surMidi); i.addEventListener('midimessage', surMidi); }); signaler(); };
      midiAcces.onstatechange = lire; lire();
    } catch { /* MIDI refusé */ }
  }
  signaler();
  return appareils();
}
navigator.mediaDevices?.addEventListener?.('devicechange', () => detecter());

// Reçoit chaque message d’un clavier MIDI actif : allume l’appareil, transmet les notes et les contrôleurs aux pages, fait sonner le piano si demandé, et le garde dans le filet.
function surMidi(e) {
  const k = cle(e.target.name); const a = appareils().find((x) => x.k === k); if (!a?.actif) return;
  const [st, note, vel] = e.data; const cmd = st & 0xf0;
  activite.forEach((f) => f(k, cmd === 0x90 && vel > 0 ? vel / 127 : 0));
  if (cmd === 0x90 || cmd === 0x80) notesEcoute.forEach((f) => f(k, note, vel, cmd === 0x90 && vel > 0));
  if (cmd === 0xb0) ccEcoute.forEach((f) => f(k, note, vel));
  if (a.son && cmd === 0x90 && vel > 0) notePiano(note, { vel: 0.3 + vel / 200 });
  if (filet.arme && cmd >= 0x80 && cmd <= 0xe0) {
    const c = audio(); filet.midi.push({ t: c.currentTime - Math.max(0, (performance.now() - e.timeStamp) / 1000), d: [...e.data], k });
    const vieux = c.currentTime - duree() - 2; while (filet.midi.length && filet.midi[0].t < vieux) filet.midi.shift();
  }
}

// ---------- Le filet ----------
// Combien le filet garde : 1, 3 ou 5 minutes, au choix. Plus long = plus de mémoire (environ 11 Mo par minute et par source).
export const DUREES = [60, 180, 300];
// Combien de temps le filet garde (60, 180 ou 300 secondes).
export const duree = () => store.get('filetDuree', 60);
// Choisit combien de temps le filet garde.
export function choisirDuree(s) { store.set('filetDuree', DUREES.includes(+s) ? +s : 60); signaler(); }
// La durée du filet, dite en mots (« la dernière minute »).
export const dureeTexte = (s = duree()) => (s === 60 ? 'la dernière minute' : `les ${s / 60} dernières minutes`);
// Depuis combien de temps le filet écoute (plafonné à sa durée) : il n'a pas encore tout tant que ce n'est pas plein.
export const garde = () => (filet.arme ? Math.min(duree(), audio().currentTime - (filet.depuis ?? audio().currentTime)) : 0);
const BLOC = 4096;
const CODE = `class Filet extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(${BLOC}); this.n = 0; }
  process(inputs) {
    const ch = inputs[0]; const L = ch && ch[0]; const R = ch && (ch[1] || ch[0]);
    for (let i = 0; i < 128; i++) this.b[this.n++] = L ? (L[i] + R[i]) / 2 : 0;
    if (this.n >= ${BLOC}) { this.port.postMessage({ fin: currentTime + 128 / sampleRate, d: this.b }, [this.b.buffer]); this.b = new Float32Array(${BLOC}); this.n = 0; }
    return true;
  }
}
registerProcessor('filet', Filet);`;
// Le filet : tendu ou non, une piste audio par source active, et les notes MIDI de la dernière minute.
export const filet = { arme: false, pistes: new Map(), midi: [] };
let module = null; let muet = null;
// Ouvre une piste du filet pour une source (le son de l’app ou une entrée audio) : un petit processeur garde en continu les dernières secondes.
async function piste(k, nom, source, flux = null) {
  const c = audio();
  const node = new AudioWorkletNode(c, 'filet', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
  const an = c.createAnalyser(); an.fftSize = 512;
  const p = { k, nom, morceaux: [], node, source, flux, an };
  node.port.onmessage = (e) => { p.morceaux.push(e.data); const vieux = c.currentTime - duree() - 1; while (p.morceaux.length && p.morceaux[0].fin < vieux) p.morceaux.shift(); };
  source.connect(node); source.connect(an); node.connect(muet);
  filet.pistes.set(k, p);
}
// Ferme une piste du filet et libère son entrée audio.
function fermer(p) { try { p.source.disconnect(p.node); p.source.disconnect(p.an); } catch { /* déjà débranché */ } p.node.disconnect(); p.node.port.onmessage = null; p.flux?.getTracks().forEach((t) => t.stop()); filet.pistes.delete(p.k); }
// Ajuste les pistes du filet aux appareils actifs : ouvre celles qui manquent, ferme celles qui ne servent plus.
async function majPistes() {
  const voulus = appareils().filter((a) => a.actif && (a.k === 'app' || a.audio));
  for (const p of [...filet.pistes.values()]) if (!voulus.some((a) => a.k === p.k)) fermer(p);
  for (const a of voulus) {
    if (filet.pistes.has(a.k)) continue;
    if (a.k === 'app') { await piste('app', a.nom, finalOut()); continue; }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: a.audio }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 } });
      await piste(a.k, a.nom, audio().createMediaStreamSource(flux), flux);
    } catch { /* entrée occupée ou refusée : on continue sans elle */ }
  }
  signaler();
}
// Tend le filet : prépare le processeur audio puis ouvre une piste par source active.
export async function tendre() {
  const c = audio();
  if (!c.audioWorklet) throw new Error('Ce navigateur ne peut pas tendre le filet (essaie Chrome, Edge ou Firefox récent).');
  module ||= c.audioWorklet.addModule(URL.createObjectURL(new Blob([CODE], { type: 'application/javascript' })));
  await module;
  if (!muet) { muet = c.createGain(); muet.gain.value = 0; muet.connect(c.destination); }
  filet.arme = true; filet.depuis = c.currentTime; store.set('filetArme', true);
  if (navigator.requestMIDIAccess && !midiAcces) detecter({ demander: true }).then(majPistes); else await majPistes();
  signaler();
}
// Relâche le filet : ferme toutes les pistes et oublie ce qu’elles gardaient.
export function relacher() { [...filet.pistes.values()].forEach(fermer); filet.midi = []; filet.arme = false; store.set('filetArme', false); signaler(); }
// Le niveau sonore actuel d’une piste du filet (pour faire bouger son petit vumètre).
export const niveau = (k) => { const p = filet.pistes.get(k); if (!p) return -1; const d = new Float32Array(p.an.fftSize); p.an.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); };

// Une photo de la dernière minute : chaque piste alignée sur la même horloge, et les notes MIDI.
export function instantane() {
  const c = audio(); const sr = c.sampleRate; const fin = c.currentTime; const debut = Math.max(fin - duree(), filet.depuis ?? fin - duree());
  const n = Math.max(1, Math.floor((fin - debut) * sr));
  const pistes = [...filet.pistes.values()].map((p) => {
    const d = new Float32Array(n);
    p.morceaux.forEach((m) => { const o = Math.round((m.fin - debut) * sr) - m.d.length; for (let i = Math.max(0, -o); i < m.d.length && o + i < n; i++) d[o + i] = m.d[i]; });
    return { k: p.k, nom: p.nom, d };
  });
  const midi = filet.midi.filter((m) => m.t >= debut).map((m) => ({ ...m, t: m.t - debut }));
  const noms = Object.fromEntries(appareils().map((a) => [a.k, a.nom]));
  return { sr, duree: n / sr, pistes, midi, noms };
}

// Le fichier MIDI standard (format 0, 960 tics par noire, au tempo donné), pour l'ouvrir dans n'importe quel logiciel.
export function fichierMidi(evts, bpm = 60) {
  const vlq = (v) => { const o = [v & 0x7f]; while ((v >>= 7)) o.unshift((v & 0x7f) | 0x80); return o; };
  const us = Math.round(60e6 / bpm); // le tempo écrit dans le fichier : le logiciel place les mesures au bon endroit
  const piste = [0x00, 0xff, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255]; let avant = 0;
  evts.forEach((e) => { const t = Math.round(e.t * 960 * (bpm / 60)); piste.push(...vlq(Math.max(0, t - avant)), ...e.d.slice(0, (e.d[0] & 0xf0) === 0xc0 || (e.d[0] & 0xf0) === 0xd0 ? 2 : 3)); avant = t; });
  piste.push(0x00, 0xff, 0x2f, 0x00);
  const l = piste.length;
  return new Blob([new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x03, 0xc0, 0x4d, 0x54, 0x72, 0x6b, (l >>> 24) & 255, (l >>> 16) & 255, (l >>> 8) & 255, l & 255, ...piste])], { type: 'audio/midi' });
}
