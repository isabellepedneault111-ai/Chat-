// Le mur vu du ciel : retrouver et provoquer.
// Le centre, c'est « Dans le set » ; chaque anneau, une étape. Plus une idée approche du centre, plus elle approche de l'album.
// Un morceau a sa part du ciel. Les fils pleins relient ce qui l'est déjà (relais, rencontres) ;
// les fils pointillés proposent des rencontres que personne n'a encore faites.
import { MEMBERS, STAGES } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const plain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };

const STOP = new Set(plain('avec dans pour sans sous plus moins tout tous toute toutes cette cela comme quand mais donc alors encore jamais toujours aussi très trop elle elles nous vous leur leurs mon ton son mes tes ses notre votre être avoir fait faire suis sont était peut veux veut quelque chose rien juste bien vraiment idée note mémo memo sans titre entre après avant ici là-bas où qui que quoi dont lui eux ceux celle celui ça cet ces une des les aux par sur mineur majeur diese bemol').split(' '));
// Une tonalité écrite en toutes lettres : « en Ré », « Si mineur ».
const KEY_RE = /\b(?:en\s+(do|re|mi|fa|sol|la|si)(?:\s*(diese|bemol|#|b))?(?:\s*(mineur|majeur|m|sus2|sus4|7))?|(do|re|mi|fa|sol|la|si)(?:\s*(diese|bemol))?\s+(mineur|majeur))\b/;

// La nature d’une trace du Mur : un son, une image, un lien ou des mots.
export const kindOf = (e) => (e.image || e.type === 'image' ? 'image' : e.audio || e.type === 'audio' ? 'son' : e.type === 'lien' ? 'lien' : 'mots');
const KIND_FR = { son: 'un son', mots: 'des mots', lien: 'une écoute', image: 'une image' };
// Ce qu'une trace offre à une rencontre : un son, une image, ou des mots qu'on peut chanter (douze lettres au moins).
// Un bilan, une séance, un essai, une chanson, une rencontre déjà faite : rien à faire rencontrer, ça reste hors du jeu.
const MOTS_OK = new Set(['texte', 'paroles', 'note', 'carte']);
export function matiere(e) {
  if (!e || e.data?.rencontre || e.data?.corbeille || e.data?.pour === 'app') return null; // une idée pour l'app n'est pas de la musique
  if (e.image || e.type === 'image') return 'image';
  if ((e.audio && !e.audio.type?.startsWith('video')) || e.type === 'audio') return 'son';
  return MOTS_OK.has(e.type) && (e.body || e.title || '').trim().length >= 12 ? 'mots' : null;
}

// Ce qu’on peut lire d’une trace : sa tonalité, ses mots importants et sa nature ; c’est ce qui permet de la relier à une autre.
export function traitsOf(e) {
  const txt = plain(`${e.title || ''} ${e.type === 'lien' ? '' : e.body || ''} ${e.data?.intent || ''}`);
  const k = txt.match(KEY_RE);
  const key = k ? [k[1] || k[4], k[2] || k[5] || '', (k[3] || k[6] || '').replace(/^m$/, 'mineur')].filter(Boolean).join(' ') : '';
  const words = new Set(txt.split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)));
  return { key, words, kind: kindOf(e) };
}

const threadOf = (e) => e.data?.thread || e.id;
const stageOf = (e) => (e.data && Number.isInteger(e.data.stage) ? e.data.stage : e.type === 'paroles' ? 2 : 0);
const songOf = (e) => (e.type === 'paroles' ? (e.title || '') : e.data?.song || '');
const lastTouch = (e) => Math.max(e.updatedAt || 0, ...(e.data?.replies || []).map((r) => r.at || 0), ...(e.data?.moves || []).map((m) => m.at || 0));
// Depuis combien de jours une trace n’a pas été touchée.
export const sleepingDays = (e, now = Date.now()) => Math.floor((now - lastTouch(e)) / DAY);
const daysFR = (d) => (d >= 14 ? `${Math.round(d / 7)} semaines` : `${d} jours`);

// Les rencontres possibles, de la plus fertile à la moins fertile. Chaque idée n'apparaît qu'une fois.
// Pas toutes : seulement les paires qui ont une vraie raison de se croiser (un mot, une tonalité, deux mains, une idée
// qui dort), jamais deux images, jamais une paire écartée (« Pas pour nous »). Mieux vaut zéro qu'une ligne pour rien.
export function rencontres(board, { now = Date.now(), seed = 0, max = 3, non = new Set() } = {}) {
  const ideas = board.filter((e) => stageOf(e) < 4 && matiere(e));
  const tr = new Map(ideas.map((e) => [e.id, { ...traitsOf(e), kind: matiere(e) }]));
  const deja = new Set();
  board.forEach((e) => { const r = e.data?.rencontre; if (r?.length === 2) { deja.add(`${r[0]}|${r[1]}`); deja.add(`${r[1]}|${r[0]}`); } });
  const pairs = [];
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i]; const b = ideas[j];
      if (threadOf(a) === threadOf(b) || non.has(`${a.id}|${b.id}`) || (matiere(a) === 'image' && matiere(b) === 'image') || deja.has(`${a.id}|${b.id}`) || a.data?.rencontre?.includes(b.id) || b.data?.rencontre?.includes(a.id)) continue;
      const ta = tr.get(a.id); const tb = tr.get(b.id);
      let score = 0; const why = [];
      const shared = [...ta.words].filter((w) => tb.words.has(w));
      if (shared.length) { score += Math.min(3, shared.length * 1.5); why.push(`le même mot : « ${shared[0]} »`); }
      if (ta.key && ta.key === tb.key) { score += 2.5; why.push(`toutes deux en ${ta.key.replace(/^re/, 'ré')}`); }
      if (a.author && b.author && a.author !== b.author) { score += ta.kind !== tb.kind ? 1.5 : 0.8; why.push(`${KIND_FR[ta.kind]} de ${a.author}, ${KIND_FR[tb.kind]} de ${b.author}`); }
      if (ta.kind !== tb.kind && ta.kind !== 'lien' && tb.kind !== 'lien') score += 1.2;
      const sa = sleepingDays(a, now); const sb = sleepingDays(b, now);
      const [old, young] = sa > sb ? [a, b] : [b, a];
      if (Math.max(sa, sb) >= 14 && Math.min(sa, sb) <= 5) { score += 1.5; why.push(`« ${old.title || 'sans titre'} » dort depuis ${daysFR(Math.max(sa, sb))}`); }
      if (songOf(a) && songOf(a) === songOf(b)) score += 0.4;
      if (score < 1.5 || !why.length) continue; // pas de vraie raison : on ne la propose pas
      score += hash(`${a.id}${b.id}${seed}`) * 0.9; // un peu de hasard pour départager : le ciel bouge d'un jour à l'autre
      pairs.push({ a, b, score, why: why.slice(0, 2), consigne: consigneFor(ta.kind, tb.kind, a, b) });
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  const used = new Set(); const out = [];
  for (const p of pairs) {
    if (used.has(p.a.id) || used.has(p.b.id)) continue;
    used.add(p.a.id); used.add(p.b.id); out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

// La consigne qui relie deux traces selon leur nature (par exemple : chanter ces mots sur ce son).
function consigneFor(ka, kb, a, b) {
  const t = (e) => `« ${e.title || 'sans titre'} »`;
  if (ka === 'son' && kb === 'mots') return `Chante ${t(b)} sur ${t(a)}. Ce qui ne rentre pas, coupe-le.`;
  if (ka === 'mots' && kb === 'son') return `Chante ${t(a)} sur ${t(b)}. Ce qui ne rentre pas, coupe-le.`;
  if (ka === 'son' && kb === 'son') return `Joue ${t(a)}, enchaîne ${t(b)} sans t’arrêter. Le passage entre les deux, c’est peut-être le morceau.`;
  if (ka === 'image' || kb === 'image') {
    const [img, o] = ka === 'image' ? [a, b] : [b, a]; const ko = ka === 'image' ? kb : ka;
    if (ko === 'image') return `Mets ${t(a)} et ${t(b)} côte à côte. Écris le titre de la chanson qui vit entre les deux.`;
    if (ko === 'mots') return `Regarde ${t(img)} une minute, puis réécris ${t(o)} comme si c’était la légende de cette image.`;
    if (ko === 'son') return `Écoute ${t(o)} en regardant ${t(img)}. Chante ce que l’image ferait entendre.`;
    return `Écoute ${t(o)} en regardant ${t(img)} : quelle couleur garder pour notre son?`;
  }
  if (ka === 'mots' && kb === 'mots') return `Une ligne de ${t(a)}, une ligne de ${t(b)}, en alternance. Lis-le à voix haute.`;
  const son = ka === 'lien' ? b : a;
  return `Écoute ${t(ka === 'lien' ? a : b)}, puis reprends ${t(son)} avec cette couleur-là.`;
}

// Ce qu'on cherche, dans tout ce qu'une idée porte : titre, texte, intention, réponses, morceau, auteur.
export function matches(e, q) {
  if (!q) return true;
  const hay = plain([e.title, e.type === 'lien' ? e.data?.kind : e.body, e.data?.intent, songOf(e), e.author, ...(e.data?.replies || []).map((r) => r.text)].join(' '));
  return plain(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

// Le dessin. Les positions dépendent seulement des idées (pas du hasard) : rien ne saute d'un affichage à l'autre.
export function skyHTML(board, { query = '', pairs = [], focus = '', narrow = false, now = Date.now() } = {}) {
  const W = narrow ? 600 : 1000; const H = narrow ? 660 : 660;
  const cx = W / 2; const cy = H / 2;
  const R = narrow ? [30, 92, 156, 218, 280] : [34, 96, 158, 220, 274];
  const sx = narrow ? 0.98 : 1.55; const sy = narrow ? 1.04 : 1;
  const ring = (st) => R[4 - st];
  const songs = [...new Set(board.map(songOf))].sort((x, y) => (!x) - (!y) || x.localeCompare(y, 'fr'));
  const n = Math.max(1, songs.length);
  const gap = n > 1 ? 0.18 : 0;
  const sector = (2 * Math.PI) / n;
  const pos = new Map();
  songs.forEach((s, si) => {
    const list = board.filter((e) => songOf(e) === s).sort((a, b) => a.createdAt - b.createdAt);
    list.forEach((e, k) => {
      const t = (k + 0.5) / list.length;
      const ang = -Math.PI / 2 + si * sector + gap / 2 + t * (sector - gap) + (hash(e.id) - 0.5) * 0.08;
      const r = ring(stageOf(e)) + (hash(`${e.id}r`) - 0.5) * 26;
      pos.set(e.id, { x: cx + Math.cos(ang) * r * sx, y: cy + Math.sin(ang) * r * sy, ang });
    });
  });
  const col = (e) => (e.author === MEMBERS[1] ? 'var(--sky-f)' : 'var(--sky-z)');
  const hit = new Set(board.filter((e) => matches(e, query)).map((e) => e.id));
  const pairIds = new Set(pairs.flatMap((p) => [p.a.id, p.b.id]));
  const rings = STAGES.map((st) => `<ellipse cx="${cx}" cy="${cy}" rx="${ring(st.id) * sx}" ry="${ring(st.id) * sy}" class="sky-ring s${st.id}"/>`).join('');
  const ringLabels = STAGES.map((st) => (st.id === 4
    ? `<text x="${cx}" y="${cy + 4}" class="sky-rl center">${esc(st.label)}</text>`
    : `<text x="${cx}" y="${cy - ring(st.id) * sy - 6}" class="sky-rl">${esc(st.label)}</text>`)).join('');
  const sectorLabels = n > 1 || songs[0] ? songs.map((s, si) => {
    const ang = -Math.PI / 2 + si * sector + sector / 2;
    const r = R[4] + 22;
    const x = cx + Math.cos(ang) * r * sx; const y = cy + Math.sin(ang) * r * sy;
    const lx = Math.max(64, Math.min(W - 64, x));
    return `<text x="${lx.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="sky-song">${esc(s || 'Sans morceau')}</text>`;
  }).join('') : '';
  const spokes = n > 1 ? songs.map((_, si) => { const a = -Math.PI / 2 + si * sector; return `<line x1="${cx + Math.cos(a) * R[0] * sx}" y1="${cy + Math.sin(a) * R[0] * sy}" x2="${cx + Math.cos(a) * (R[4] + 8) * sx}" y2="${cy + Math.sin(a) * (R[4] + 8) * sy}" class="sky-spoke"/>`; }).join('') : '';
  // Les fils déjà tissés : une réponse au relais, une rencontre.
  const links = [];
  board.forEach((e) => {
    const over = e.data?.over && pos.has(e.data.over) ? e.data.over : e.data?.thread && e.data.thread !== e.id && pos.has(e.data.thread) ? e.data.thread : '';
    if (over && pos.has(e.id)) links.push([over, e.id, 'fil']);
    (e.data?.rencontre || []).forEach((id) => { if (pos.has(id) && pos.has(e.id)) links.push([id, e.id, 'ren']); });
  });
  const curve = (p, q, bend = 0.18) => { const mx = (p.x + q.x) / 2; const my = (p.y + q.y) / 2; const dx = q.x - p.x; const dy = q.y - p.y; return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; };
  const linkSVG = links.map(([a, b, k]) => `<path d="${curve(pos.get(a), pos.get(b))}" class="sky-link ${k}"/>`).join('');
  const pairSVG = pairs.map((p, i) => (pos.has(p.a.id) && pos.has(p.b.id) ? `<path d="${curve(pos.get(p.a.id), pos.get(p.b.id), -0.22)}" class="sky-pair${focus === String(i) ? ' on' : ''}" data-pair="${i}" style="--d:${0.9 + i * 0.25}s"/>` : '')).join('');
  const nodes = board.map((e, i) => {
    const p = pos.get(e.id); if (!p) return '';
    const st = stageOf(e); const k = kindOf(e); const r = 4.2 + st * 1.5;
    const dim = query && !hit.has(e.id);
    const asleep = st < 3 && sleepingDays(e, now) >= 21;
    const label = (query && hit.has(e.id)) || st >= 2 || pairIds.has(e.id);
    // l'étiquette part vers l'extérieur, sauf au bord de la carte où elle se replie vers l'intérieur
    const right = Math.cos(p.ang) >= 0 ? p.x < W - 170 : p.x < 170;
    const lx = right ? p.x + r + 6 : p.x - r - 6;
    const shape = k === 'image' ? `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" transform="rotate(45)" class="sky-dot" style="--c:${col(e)}"/>`
      : k === 'lien' ? `<circle r="${r}" class="sky-dot hollow" style="--c:${col(e)}"/>`
      : `<circle r="${r}" class="sky-dot" style="--c:${col(e)}"/>${k === 'son' ? `<circle r="${r + 3.5}" class="sky-orbit" style="--c:${col(e)}"/>` : ''}`;
    return `<g class="sky-node${dim ? ' dim' : ''}${asleep ? ' asleep' : ''}${query && hit.has(e.id) ? ' hit' : ''}" data-card="${esc(e.id)}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" style="--d:${Math.min(1.4, i * 0.025).toFixed(3)}s" tabindex="0" role="button" aria-label="${esc(`${e.title || 'Sans titre'}, ${e.author}, ${STAGES[st].label}`)}">
      <circle r="${r + 10}" class="sky-hit"/>${shape}${e.data?.perle ? `<path d="M0 ${-r - 9}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" class="sky-perle"/>` : ''}
      <title>${esc(`${e.title || 'Sans titre'} · ${e.author} · ${STAGES[st].label}${asleep ? ` · dort depuis ${daysFR(sleepingDays(e, now))}` : ''}`)}</title>
      ${label ? `<text x="${(lx - p.x).toFixed(1)}" y="4" text-anchor="${right ? 'start' : 'end'}" class="sky-label">${esc((e.title || 'Sans titre').slice(0, 34))}${(e.title || '').length > 34 ? '…' : ''}</text>` : ''}
    </g>`;
  }).join('');
  return `<svg class="sky-svg${narrow ? ' narrow' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Nos idées en constellation : le centre, c’est le set">
    <defs><radialGradient id="skyCore"><stop offset="0" stop-color="var(--sky-core)" stop-opacity=".55"/><stop offset="1" stop-color="var(--sky-core)" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${R[1] * sx}" ry="${R[1] * sy}" fill="url(#skyCore)"/>
    ${rings}${spokes}${ringLabels}${sectorLabels}${linkSVG}${pairSVG}${nodes}
  </svg>`;
}
