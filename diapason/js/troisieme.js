// Le troisième membre : il écoute ce que Zaza chante et ce que Frog joue, puis répond à son tour.
// Pas une voix de robot ni un texte inventé : il reprend VOTRE phrase et la transforme, comme un musicien
// qui joue avec le matériau des autres. Et il dit ce qu'il a fait, pour qu'on puisse lui répondre.
import { onPitch } from './audio.js';
import { notePiano, prechargerSons } from './sampler.js';
import { onConsole, heldNotes } from './console.js';

const GAMME = [0, 2, 4, 5, 7, 9, 11];
const snap = (m, key) => { let best = m; let d = 99; for (let x = m - 2; x <= m + 2; x++) { if (GAMME.includes(((x - key) % 12 + 12) % 12) && Math.abs(x - m) < d) { d = Math.abs(x - m); best = x; } } return best; };
const range = (m) => { while (m < 60) m += 12; while (m > 81) m -= 12; return m; };
// Ses gestes : chacun est une vraie façon de développer un motif.
const GESTES = [
  ['a renversé votre phrase : ce qui montait descend', (n) => n.map((x) => 2 * n[0] - x)],
  ['a joué votre phrase à l’envers', (n) => [...n].reverse()],
  ['a repris votre phrase une quarte plus haut', (n) => n.map((x) => x + 5)],
  ['a gardé votre début et changé la fin', (n) => [...n.slice(0, Math.ceil(n.length / 2)), ...n.slice(0, Math.floor(n.length / 2)).map((x) => x + 2)]],
  ['a ornementé votre phrase de notes voisines', (n) => n.flatMap((x, i) => (i % 2 ? [x] : [x, x + 2, x]))],
  ['a resserré votre phrase sur trois notes', (n) => n.map((x) => n[0] + ((x - n[0]) % 5))],
];
const RYTHMES = [[1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 2], [0.5, 0.5, 1, 0.5, 0.5, 1, 1.5, 0.5, 2], [1.5, 0.5, 1, 1, 1.5, 0.5, 2], [0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 2]];

export function troisieme({ key = 0 } = {}) {
  prechargerSons(['piano']);
  let heard = [];
  let lastVoice = 0; let lastVoiceT = 0;
  const offP = onPitch((p) => {
    if (!p || p.clarity < 0.85) return;
    const m = Math.round(p.midi);
    const now = performance.now();
    // Une note chantée compte quand elle tient un instant (pas les glissements).
    if (m === lastVoice && now - lastVoiceT > 180 && heard[heard.length - 1] !== m) heard = [...heard, m].slice(-16);
    if (m !== lastVoice) { lastVoice = m; lastVoiceT = now; }
  });
  let prevHeld = [];
  const offC = onConsole(() => {
    const h = heldNotes();
    h.filter((x) => !prevHeld.includes(x)).forEach((x) => heard.push(x));
    heard = heard.slice(-16);
    prevHeld = h;
  });
  return {
    // Le motif entendu pendant les tours humains (ou, s'il n'a rien entendu, l'accord de la tonalité).
    repondre(when, bpm) {
      let motif = heard.slice(-8).map(range);
      const neuf = !motif.length;
      if (neuf) motif = [0, 4, 7, 9, 7].map((x) => 60 + key + x);
      const [quoi, f] = neuf ? ['propose une phrase : à vous de la transformer', (n) => n] : GESTES[Math.floor(Math.random() * GESTES.length)];
      const notes = f(motif).map((x) => snap(range(x), key));
      const ryt = RYTHMES[Math.floor(Math.random() * RYTHMES.length)];
      const beat = 60 / bpm; let t = when; let total = 0;
      for (let i = 0; i < ryt.length && total < 7.5; i++) {
        const n = notes[i % notes.length];
        notePiano(n, { when: t, dur: Math.min(1.6, ryt[i] * beat * 1.3), vel: 0.65 });
        t += ryt[i] * beat; total += ryt[i];
      }
      heard = [];
      return quoi;
    },
    dispose() { offP(); offC(); },
  };
}

