// Le métronome des prises : un clic sur chaque temps (le premier de la mesure plus appuyé), et un décompte d'une mesure
// avant que l'enregistrement commence. Il sonne directement vers les haut-parleurs ou le casque, sans passer par la
// sortie de l'app que certaines prises enregistrent : le clic n'est jamais dans la prise (sauf si le micro l'entend,
// d'où le conseil des écouteurs). Ses réglages (allumé, tempo, décompte) sont gardés dans ce navigateur.
import { audio } from './audio.js';
import { store } from './ui.js';

const reglages = () => ({ on: false, bpm: 90, dec: true, ...store.get('metro', {}) });
const garder = (patch) => store.set('metro', { ...reglages(), ...patch });
let marche = null; // { timer, prochain, temps, bpm }

// Un clic : une note brève et sèche, plus aiguë et plus forte au premier temps.
function clic(c, quand, fort) {
  const o = c.createOscillator(); const g = c.createGain();
  o.frequency.value = fort ? 1760 : 1175; o.type = 'square';
  g.gain.setValueAtTime(0.0001, quand); g.gain.exponentialRampToValueAtTime(fort ? 0.32 : 0.18, quand + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, quand + 0.05);
  o.connect(g).connect(c.destination); o.start(quand); o.stop(quand + 0.06);
}

// Lance les clics ; renvoie l'heure audio du premier temps après le décompte (ou du premier temps, sans décompte).
function lancer(bpm, decompte) {
  arreterMetronome(); const c = audio(); c.resume?.();
  const pas = 60 / bpm; const depart = c.currentTime + 0.12;
  marche = { prochain: depart, temps: 0, pas };
  const tic = () => {
    // Après une veille, on reprend au présent au lieu de rattraper d'un coup.
    if (marche.prochain < c.currentTime - 0.25) marche.prochain = c.currentTime + 0.05;
    while (marche.prochain < c.currentTime + 0.12) { clic(c, marche.prochain, marche.temps % 4 === 0); marche.prochain += pas; marche.temps++; }
  };
  tic(); marche.timer = setInterval(tic, 25);
  return depart + (decompte ? 4 * pas : 0);
}

// À appeler juste avant de démarrer une prise : si le métronome est allumé, il part (avec un décompte d'une mesure, si
// demandé) et la promesse se résout au moment où la prise doit commencer. bpm : le tempo imposé (sinon le réglage).
export async function avantPrise(bpm) {
  const r = reglages(); if (!r.on) return;
  const t = bpm || r.bpm; const debut = lancer(t, r.dec);
  const attente = (debut - audio().currentTime) * 1000;
  if (attente > 20) await new Promise((ok) => setTimeout(ok, attente));
}
// Arrête les clics (à la fin de la prise).
export function arreterMetronome() { if (marche) { clearInterval(marche.timer); marche = null; } }
export const metronomeAllume = () => reglages().on;

// Le petit réglage, à poser à côté d'un bouton d'enregistrement. tempoFixe : le tempo vient de la page (Jouer, un exercice).
export function metroHTML({ tempoFixe = null } = {}) {
  const r = reglages();
  return `<span class="metro" data-metro ${tempoFixe ? `data-metro-tempo="${Math.round(tempoFixe)}"` : ''}>
    <button type="button" class="metro-seul ${marche?.seul ? 'on' : ''}" data-metro-seul aria-pressed="${!!marche?.seul}" title="Le métronome seul, sans enregistrer">${marche?.seul ? '■' : '▶'}</button>
    <button type="button" class="metro-on ${r.on ? 'on' : ''}" data-metro-on aria-pressed="${r.on}" title="Un clic sur chaque temps pendant la prise, dans tes écouteurs (il n’est pas enregistré)">♩ Métronome</button>
    ${tempoFixe ? `<small class="metro-t">${Math.round(tempoFixe)} BPM</small>` : `<label class="metro-t"><input type="number" min="40" max="220" value="${r.bpm}" data-metro-bpm aria-label="Tempo du métronome"> BPM</label>`}
    <label class="metro-d" title="Quatre clics (1, 2, 3, 4) avant que la prise commence, pour entrer en mesure"><input type="checkbox" data-metro-dec ${r.dec ? 'checked' : ''}> 1-2-3-4 avant</label></span>`;
}
// Branche, une fois pour toute l'app, les réglages du métronome (où qu'ils soient dans la page).
export function installerMetronome() {
  const majSeul = () => document.querySelectorAll('[data-metro-seul]').forEach((x) => { const on = !!marche?.seul; x.textContent = on ? '■' : '▶'; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  // ▶ : le métronome seul, pour s'exercer ou caler un tempo ; ■ l'arrête.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-metro-seul]'); if (!b) return;
    if (marche?.seul) arreterMetronome();
    else { const t = +b.closest('[data-metro]')?.dataset.metroTempo || reglages().bpm; lancer(t, false); marche.seul = true; }
    majSeul();
  });
  addEventListener('diapason:stop', () => setTimeout(majSeul, 0));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-metro-on]'); if (!b) return;
    const on = !reglages().on; garder({ on });
    document.querySelectorAll('[data-metro-on]').forEach((x) => { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    if (!on) arreterMetronome();
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-metro-bpm]')) { const v = Math.max(40, Math.min(220, Math.round(+e.target.value) || 90)); e.target.value = v; garder({ bpm: v }); document.querySelectorAll('[data-metro-bpm]').forEach((x) => { x.value = v; }); if (marche?.seul) { lancer(v, false); marche.seul = true; } }
    if (e.target.matches('[data-metro-dec]')) { garder({ dec: e.target.checked }); document.querySelectorAll('[data-metro-dec]').forEach((x) => { x.checked = e.target.checked; }); }
  });
}
