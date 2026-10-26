// L'élan du duo, lu dans nos traces : qui lance, qui répond, en combien de temps, ce qui circule entre nous,
// les idées qui montent, les séances ensemble. Pas de score : des liens, et des phrases pour les dire.
import { espace, profileOf } from './espace.js';
import { MEMBERS } from './duo.js';
import { nouvelle } from './suivi.js';

const J = 864e5;
const parId = () => new Map(espace.entries.map((e) => [e.id, e]));

// Un échange : quelqu'un répond à ce que l'autre a fait. { de, vers, t0, t1, quoi, a (l'original), b (la réponse) }
export function echanges() {
  const ids = parId(); const out = [];
  const lien = (a, b, t1, quoi) => { if (a && a.author && b && a.author !== b && t1 > a.createdAt) out.push({ de: a.author, vers: b, t0: a.createdAt, t1, quoi, a }); };
  espace.entries.forEach((e) => {
    const d = e.data || {};
    if (d.over) lien(ids.get(d.over), e.author, e.createdAt, e.audio ? 'une couche par-dessus' : 'des mots sur un son');
    else if (typeof d.pour === 'string' && ids.has(d.pour)) lien(ids.get(d.pour), e.author, e.createdAt, 'de la musique sur des mots');
    else if (d.relais && d.thread && ids.has(d.thread)) lien(ids.get(d.thread), e.author, e.createdAt, 'une réponse au relais');
    (d.replies || []).forEach((r) => lien(e, r.by, r.at, 'un mot sur une idée'));
    (d.moves || []).forEach((m) => { if (m.to > m.from) lien(e, m.by, m.at, 'une idée de l’autre qu’on fait monter'); });
    if (d.rencontre?.length === 2) d.rencontre.map((x) => ids.get(x)).forEach((a) => lien(a, e.author, e.createdAt, 'une rencontre entre deux idées'));
  });
  // « J'ai fait ça » : ce que l'autre demandait, fait.
  (espace.meta?.members || MEMBERS).forEach((m) => Object.entries(profileOf(m)?.faits || {}).forEach(([id, t]) => lien(ids.get(id), m, t, 'ce que l’autre demandait, fait')));
  return out.sort((x, y) => x.t1 - y.t1);
}

export const creations = () => espace.entries.filter((e) => nouvelle(e) && e.type !== 'session').sort((a, b) => a.createdAt - b.createdAt);
export const seances = () => espace.entries.filter((e) => e.type === 'session' && e.data?.doneAt).map((e) => ({ e, a: e.data.startedAt, b: e.data.doneAt, ensemble: e.data.lieu !== 'solo' }));
export const montees = () => espace.entries.flatMap((e) => (e.data?.moves || []).filter((m) => m.to > m.from).map((m) => ({ e, ...m })));

const duree = (ms) => (ms < 3600e3 ? 'dans l’heure' : ms < J ? 'le jour même' : ms < 2 * J ? 'le lendemain' : ms < 7 * J ? `en ${Math.round(ms / J)} jours` : ms < 14 * J ? 'en une semaine environ' : 'après quelques semaines');
const mediane = (l) => { if (!l.length) return null; const s = [...l].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// Ce que la tresse raconte, en phrases. depuis : début de la période regardée.
export function lecture(depuis = 0) {
  const [z, f] = espace.meta?.members || MEMBERS;
  const cr = creations().filter((e) => e.createdAt >= depuis); const ech = echanges().filter((x) => x.t1 >= depuis);
  const out = [];
  const lance = { [z]: cr.filter((e) => e.author === z).length, [f]: cr.filter((e) => e.author === f).length };
  if (cr.length) {
    const [a, b] = lance[z] >= lance[f] ? [z, f] : [f, z];
    out.push(['Qui lance', lance[b] === 0 ? `Pour l’instant, c’est ${a} qui lance. La tresse attend le premier fil de ${b}.` : lance[a] > lance[b] * 1.6 ? `${a} lance plus souvent ; ${b} lance aussi, à son rythme.` : 'Vous lancez à peu près autant l’un que l’autre : la tresse est équilibrée.']);
  }
  if (ech.length) {
    const rep = { [z]: ech.filter((x) => x.vers === z).length, [f]: ech.filter((x) => x.vers === f).length };
    const t = mediane(ech.map((x) => x.t1 - x.t0));
    out.push(['Qui répond', `${rep[f] && rep[z] ? 'Vous vous répondez tous les deux' : `C’est surtout ${rep[f] ? f : z} qui répond`}, et une réponse arrive en général ${duree(t)}.`]);
    const k = {}; ech.forEach((x) => { k[x.quoi] = (k[x.quoi] || 0) + 1; }); const top = Object.entries(k).sort((a, b) => b[1] - a[1])[0];
    out.push(['Ce qui circule le plus', `${top[0][0].toUpperCase()}${top[0].slice(1)}.`]);
  } else if (cr.length) out.push(['Qui répond', 'Pas encore de réponse d’un fil à l’autre : la première fera le premier nœud.']);
  const mt = montees().filter((m) => m.at >= depuis);
  if (mt.length) out.push(['Le mouvement', `${mt.length > 1 ? `${mt.length} fois` : 'Une fois'}, une idée a monté d’une étape${mt.some((m) => m.to >= 3) ? ', et l’une d’elles est maintenant fixée' : ''}.`]);
  const ss = seances().filter((s) => s.b >= depuis && s.ensemble);
  if (ss.length) out.push(['Ensemble', `${ss.length > 1 ? `${ss.length} séances` : 'Une séance'} à deux : à chacune, les deux fils se croisent.`]);
  // Ce qui attend : des envois au relais sans réponse, sans hâte.
  const repondus = new Set(echanges().map((x) => x.a.id));
  const attend = espace.entries.filter((e) => e.data?.relais && !e.data?.over && !e.data?.thread && !repondus.has(e.id) && Date.now() - e.createdAt < 30 * J).slice(-3);
  if (attend.length) out.push(['Ce qui attend', `${attend.map((e) => `« ${e.title} » (${e.author})`).join(', ')} : une réponse viendra quand elle viendra.`]);
  return out;
}

// Ce que l'autre m'a lancé et qui attend ma réponse : la tresse nourrit le plan (« la prochaine chose à faire »).
export function attendMoi() {
  if (!espace.connected || !espace.me) return [];
  const repondus = new Set(echanges().filter((x) => x.vers === espace.me).map((x) => x.a.id));
  const faits = profileOf(espace.me)?.faits || {};
  return espace.entries.filter((e) => e.author && e.author !== espace.me && e.data?.relais && !e.demo && !e.data?.demo && !repondus.has(e.id) && !faits[e.id] && Date.now() - e.createdAt < 21 * J)
    .sort((a, b) => a.createdAt - b.createdAt);
}
// Ce qui circule le plus entre nous, pour Nos deux âmes.
export function circulation() {
  const k = {}; echanges().forEach((x) => { k[x.quoi] = (k[x.quoi] || 0) + 1; });
  return Object.entries(k).sort((a, b) => b[1] - a[1]);
}
