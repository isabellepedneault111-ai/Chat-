// Calculs du plan de six mois à partir du mur : mois en cours, mesures automatiques, rythme de la semaine.
import { espace } from './espace.js';

const DAY = 86400000;
const CREATIVE = new Set(['note', 'texte', 'audio', 'essai', 'paroles']);
const stageOf = (e) => (e.data && Number.isInteger(e.data.stage) ? e.data.stage : e.type === 'paroles' ? 2 : 0);
const songOf = (e) => (e.type === 'paroles' ? (e.title || 'Sans titre') : e.data?.song || '');

export const planStart = () => (espace.meta?.plan?.start ? new Date(`${espace.meta.plan.start}T12:00`).getTime() : null);

export function currentMonth() {
  const s = planStart();
  if (!s) return 0;
  return Math.max(1, Math.min(6, Math.floor((Date.now() - s) / (30.44 * DAY)) + 1));
}

// Un « morceau » avance au rythme de sa meilleure carte ; une carte sans morceau compte seule.
export function planContext() {
  const cards = espace.entries.filter((e) => CREATIVE.has(e.type));
  const best = new Map();
  let loose = [];
  cards.forEach((e) => {
    const s = songOf(e);
    if (s) best.set(s, Math.max(best.get(s) ?? 0, stageOf(e)));
    else loose.push(stageOf(e));
  });
  const levels = [...best.values(), ...loose];
  const paroles = espace.entries.filter((e) => e.type === 'paroles' && (e.data?.sections || []).filter((x) => x.text.trim()).length >= 2
    && !(e.data.sections || []).some((x) => /_{2,}|\[\?/.test(x.text))).length;
  return {
    idees: cards.filter((e) => e.type !== 'paroles').length,
    stage: (n) => levels.filter((l) => l >= n).length,
    paroles,
    demos: cards.filter((e) => e.type === 'audio' && stageOf(e) >= 4).length,
  };
}

// Sessions terminées cette semaine (lundi → dimanche) et écoutes des 14 derniers jours.
export function weekRhythm() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const sessions = espace.entries.filter((e) => e.type === 'session' && e.data?.done);
  const week = sessions.filter((e) => e.data.doneAt >= monday);
  const solo = {};
  week.filter((e) => e.data.format === 'solo').forEach((e) => { solo[e.author] = (solo[e.author] || 0) + 1; });
  return {
    duo: week.filter((e) => e.data.format?.startsWith('duo')).length,
    solo,
    ecoute: sessions.filter((e) => e.data.format === 'ecoute' && e.data.doneAt >= Date.now() - 14 * DAY).length,
    total: sessions.length,
  };
}
