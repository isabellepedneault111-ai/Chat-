// Pendant ce temps : ce que l'un pratique seul laisse une trace, sans rien envoyer.
// L'autre la voit sur son accueil, avec des pistes concrètes tirées de ce travail.
import { espace, saveEntry } from './espace.js';
import { MEMBERS } from './duo.js';
import { nameFR } from './music.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const OUTILS = { exercice: 'Exercice', accord: 'Voix + piano', ambiance: 'Ambiances', grimoire: 'Le grimoire', gym: 'Gym vocal', atelier: 'Séance d’atelier' };

// Une pratique d'au moins une minute devient une trace.
export function logPractice(outil, minutes, data = {}) {
  if (!espace.connected || !espace.me || minutes < 1) return;
  saveEntry({ type: 'trace', title: `${OUTILS[outil] || outil} · ${Math.round(minutes)} min`, data: { outil, minutes: Math.round(minutes * 10) / 10, ...data } }).catch(() => {});
}

const other = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'Frog';
// Des pistes pour moi, à partir de ce que l'autre a pratiqué cette semaine.
function pistes(t) {
  const d = t.data || {};
  const who = t.author;
  const out = [];
  if (d.outil === 'accord') {
    const weak = (d.chords || []).filter((c) => c.j < 0.55).map((c) => c.label);
    const strong = (d.chords || []).filter((c) => c.j >= 0.75).map((c) => c.label);
    if (d.mode === 'duel') out.push([`${who} a cherché des accords sous une voix : chante une mélodie neuve au relais, la suite viendra.`, '#/relais']);
    if (weak.length) out.push([`La voix de ${who} cherche encore sur ${weak.join(', ')} : joue-lui ces accords en son tenu (orgue, nappe), ça stabilise.`, '#/accord']);
    if (strong.length) out.push([`${who} brille sur ${strong.join(', ')} : envoie un riff au relais bâti sur ces accords.`, '#/relais']);
    if (d.magiques?.length) out.push([`Les notes magiques de ${who} : ${d.magiques.map(nameFR).join(', ')}. Écris une ligne de refrain qui s’y pose.`, '#/paroles']);
    if (d.mode === 'ailleurs') out.push([`${who} explore les 9e et les 13e : propose des accords add9 ou maj7.`, '#/accord']);
  }
  if (d.outil === 'ambiance' && d.lieu) out.push([`${who} était dans « ${d.lieu} » : prolonge cette ambiance avec tes textures, et lance-la au relais.`, '#/ambiances']);
  if (d.outil === 'atelier') out.push([`${who} a fait une séance d’atelier sur « ${d.mot || ''} » : lis-la dans le journal, et réponds avec un son qui la porte.`, '#/ecrire']);
  if (d.outil === 'grimoire' && d.carte) out.push([`${who} a tiré « ${d.carte} »${d.mot ? ` sur le mot « ${d.mot} »` : ''} : réponds avec un son qui porte ce mot.`, '#/relais']);
  return out.map(([txt, href]) => ({ txt, href }));
}

export function pendantHTML() {
  if (!espace.connected || !espace.me) return '';
  const o = other();
  const recent = espace.entries.filter((e) => e.type === 'trace' && e.author === o && Date.now() - e.createdAt < 7 * 864e5).sort((a, b) => b.createdAt - a.createdAt);
  const solos = espace.entries.filter((e) => e.type === 'session' && e.author === o && e.data?.done && e.data.format === 'solo' && Date.now() - e.data.doneAt < 7 * 864e5);
  const pages = espace.entries.filter((e) => e.type === 'texte' && e.data?.journal && e.author === o && Date.now() - e.createdAt < 7 * 864e5).length;
  if (!recent.length && !solos.length && !pages) return '';
  const mins = Math.round(recent.reduce((s, e) => s + (e.data?.minutes || 0), 0) + solos.reduce((s, e) => s + Math.max(0, (e.data.doneAt - e.data.startedAt) / 60000), 0));
  const ps = []; const seen = new Set();
  recent.forEach((t) => pistes(t).forEach((p) => { if (!seen.has(p.txt) && ps.length < 3) { seen.add(p.txt); ps.push(p); } }));
  return `<section class="pendant">
    <p class="pendant-k">Pendant ce temps</p>
    ${mins ? `<p class="pendant-what"><b>${esc(o)}</b> a pratiqué en solo <b>${mins} min</b> cette semaine : ${[...new Set(recent.map((e) => OUTILS[e.data?.outil] || e.data?.outil))].concat(solos.length ? ['micro-sessions'] : []).map(esc).join(', ')}.</p>` : `<p class="pendant-what"><b>${esc(o)}</b> a écrit cette semaine.</p>`}
    ${pages ? `<p class="pendant-what"><a href="#/ecrire" class="pendant-j">${pages} page${pages > 1 ? 's' : ''} au journal →</a></p>` : ''}
    ${ps.length ? `<ul class="pendant-pistes">${ps.map((p) => `<li><a href="${p.href}">${esc(p.txt)} →</a></li>`).join('')}</ul>` : ''}
    <p class="pendant-note">Visible pour vous deux. Rien à envoyer : la pratique laisse sa trace toute seule.</p>
  </section>`;
}

// Depuis la dernière fois : ce qui s'est passé entre deux séances nourrit la suivante.
export function depuisHTML() {
  if (!espace.connected) return '';
  const last = espace.entries.filter((e) => e.type === 'session' && e.data?.done && e.data.format?.startsWith('duo')).sort((a, b) => b.data.doneAt - a.data.doneAt)[0];
  const since = last ? last.data.doneAt : Date.now() - 14 * 864e5;
  const relais = espace.entries.filter((e) => e.data?.relais && e.createdAt > since).sort((a, b) => a.createdAt - b.createdAt);
  const traces = espace.entries.filter((e) => (e.type === 'trace' || (e.type === 'session' && e.data?.format === 'solo' && e.data?.done)) && e.createdAt > since);
  const perles = espace.entries.filter((e) => e.data?.perle && e.updatedAt > since);
  const mins = {};
  traces.forEach((t) => { mins[t.author] = (mins[t.author] || 0) + (t.data?.minutes || Math.max(0, ((t.data?.doneAt || 0) - (t.data?.startedAt || 0)) / 60000)); });
  if (!relais.length && !traces.length && !perles.length && !last?.data?.debrief?.prochaine) return '';
  return `<div class="depuis">
    <p class="depuis-k">Depuis la dernière fois${last ? ` · ${new Date(since).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}` : ''}</p>
    ${last?.data?.debrief?.prochaine ? `<p class="depuis-cible">Vous vous étiez dit : <b>« ${esc(last.data.debrief.prochaine)} »</b></p>` : ''}
    ${relais.length ? `<ul class="depuis-list">${relais.slice(-5).map((e) => `<li><b>${esc(e.author)}</b> ${e.audio ? 'a lancé' : 'a écrit'} « ${esc(e.title)} »${(e.data?.asks || []).length ? ` <span class="muted">(${esc(e.data.asks.join(', '))})</span>` : ''}${e.data?.intent ? ` <i>« ${esc(e.data.intent)} »</i>` : ''}</li>`).join('')}</ul>` : ''}
    ${Object.keys(mins).length ? `<p class="depuis-solo">${Object.entries(mins).map(([w, m]) => `<b>${esc(w)}</b> a pratiqué ${Math.round(m)} min en solo`).join(' · ')}.</p>` : ''}
    ${perles.length ? `<p class="depuis-solo">✦ ${perles.length} perle${perles.length > 1 ? 's' : ''} au coffre : ${perles.slice(0, 3).map((p) => `« ${esc(p.title)} »`).join(', ')}.</p>` : ''}
    <p class="depuis-hint">Choisissez-en une comme point de départ : c’est votre matière, pas une page blanche.</p>
  </div>`;
}
