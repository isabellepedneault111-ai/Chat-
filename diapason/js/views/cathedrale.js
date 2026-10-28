// La cathédrale : quelques nombres (la clé de voûte) deviennent tout un orchestre. Elle se lit comme une nef, d'un
// coup d'œil : une rangée par voix (un nombre de la clé : son instrument, sa note, ses frappes par tour), une arche par
// partie (aussi large que sa durée : la famille qui y chante, son accord), les liens en flèches et les pupitres en
// accolades, comme au labo. On touche une voix ou une arche : sa fiche s'ouvre à côté. Pendant l'écoute, la lumière
// avance dans la nef et chaque voix pulse quand elle frappe.
import { toast, store, animate } from '../ui.js';
import { lampeHTML, brancherLampe } from '../lampe.js';
import { dessinerRosace } from '../rosace.js';
import { FR } from '../music.js';
import { espace, saveEntry, uploadAudio } from '../espace.js';
import { composer, jouer, rendre, charger, evenementsMidi, FAMILLES, RYTHME_DEFAUT, cleDepuisNotes, segmentsMidi, accordsDesSegments, cathedraleDuJeu, ranger, SOURCES_VIVES } from '../cathedrale.js';
import { audio, mic } from '../audio.js';
import { onCC, onNotes, detecter, appareils, sortiesMidi, filet, instantane, fichierMidi } from '../materiel.js';
import { createListener } from '../instrument.js';
import { chordIntervals } from '../music.js';
import { wav, trouverAccords } from '../oreille.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Les clés toutes prêtes : [id, nombres affichés, nom, ce qu'on entend, nombres].
const CLES = [
  ['naturel', '4 : 5 : 6 : 7', 'L’accord naturel', 'Doux, ouvert : la septième des harmoniques.', [4, 5, 6, 7]],
  ['majeur', '4 : 5 : 6', 'Majeur pur', 'Lumineux, stable.', [4, 5, 6]],
  ['mineur', '10 : 12 : 15', 'Mineur', 'Plus sombre, plus long.', [10, 12, 15]],
  ['quinte', '2 : 3', 'La quinte', 'Deux voix, un 3 contre 2.', [2, 3]],
  ['sentier', '5 : 7 : 9 : 11', 'Hors sentier', 'Étrange et beau : hors du piano.', [5, 7, 9, 11]],
  ['etoile', '8 : 9 : 10 : 12 : 15', 'L’étoile', 'Cinq voix, une pentatonique juste.', [8, 9, 10, 12, 15]],
];
const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const COUL = { cordes: '#e8c27a', bois: '#93b08e', cuivres: '#f0875a', choeur: '#b89be6', harpe: '#9fe0c3', celesta: '#7fb1f0', silence: '#6d655a' };
// Les instruments d'une voix, leur famille (pour la couleur) et leur geste.
const INSTR = [['timbales', 'Timbales', '#c98a5a', 'frappé'], ['pizz', 'Pizzicati', '#e8c27a', 'pincé'], ['harpe', 'Harpe', '#9fe0c3', 'pincé'], ['celesta', 'Célesta', '#7fb1f0', 'cloche'],
  ['cor', 'Cor', '#f0875a', 'soufflé'], ['cuivres', 'Cuivres', '#f0875a', 'soufflé'], ['flute', 'Flûte', '#93b08e', 'soufflé'], ['clarinette', 'Clarinette', '#93b08e', 'soufflé'], ['choeur', 'Chœur', '#b89be6', 'chanté']];
const instr = (k) => INSTR.find((x) => x[0] === k) || INSTR[0];
const ORCH = { kick: 'timbales', snare: 'pizz', hat: 'celesta', clap: 'harpe', clic: 'pizz' };
const GROUPES = { A: '#e8c27a', B: '#9fe0c3', C: '#f0875a' };
const SOURCES = { souffle: 'la respiration lente', vibrato: 'une oscillation rapide', hasard: 'le hasard', chaos: 'le chaos', voix: 'ta voix au micro', clavier: 'le clavier MIDI', molette: 'la molette du clavier' };
const PARAMS = { volume: ['le volume', 'plus doux', 'plus fort'], hauteur: ['la hauteur', 'plus grave', 'plus aigu'], brillance: ['le timbre', 'plus sourd', 'plus brillant'], pan: ['l’espace', 'vers la gauche', 'vers la droite'] };
const SENS = { monte: '#e8c27a', baisse: '#7fb1f0' };
// Les réglages fins d'une voix : [nom, min, max, pas, affichage, valeur de départ, à quoi ça sert].
const REGLAGES = {
  pan: ['gauche ↔ droite', -1, 1, 0.1, (x) => (Math.abs(x) < 0.05 ? 'au centre' : x < 0 ? `gauche ${Math.round(-x * 100)} %` : `droite ${Math.round(x * 100)} %`), 0, 'Sa place dans l’espace.'],
  dec: ['contretemps', 0, 0.95, 0.05, (x) => `${Math.round(x * 100)} %`, 0, 'Frapper en retard, entre les coups.'],
  aer: ['silences', 0, 0.8, 0.05, (x) => `${Math.round(x * 100)} %`, 0, 'Retirer des frappes : le rythme respire.'],
  dur: ['durée des notes', 0.1, 2.5, 0.1, (x) => `${x.toFixed(1).replace('.', ',')} s`, 0.3, 'Sec ou tenu.'],
  acc: ['accent', 0, 1, 0.05, (x) => `${Math.round(x * 100)} %`, 0.15, 'Appuyer le premier coup de chaque tour.'],
};
// Les accords qu'une partie peut prendre, autour de la note de départ : [nom de degré, demi-tons, qualité].
const DEGRES = [['I', 0, 'M'], ['ii', 2, 'm'], ['iii', 4, 'm'], ['IV', 5, 'M'], ['V', 7, 'M'], ['vi', 9, 'm']];
// Traduit l’état du labo pour la cathédrale : les disques deviennent des voix, les sons de batterie leurs équivalents d’orchestre, les groupes des pupitres, et les liens suivent.
function depuisLabo(L) {
  if (!L?.tracks?.length) return null;
  const voix = L.tracks.map((t) => ({ banque: ORCH[t.inst] || undefined, vol: t.vol ?? 1, muet: t.muted || undefined, g: t.g || undefined, respire: t.respire || undefined }));
  return ranger(L.tracks.map((t) => t.n), voix, (L.liens || []).map((l) => ({ src: String(l.src), cible: String(l.cible), param: l.param || 'volume', sens: l.sens || 'monte', force: l.force ?? 0.6 })));
}
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const plier = (x) => ((x % 12) + 12) % 12;
const nomNote = (m) => { const r = Math.round(m); const c = Math.round((m - r) * 100); return `${FR[plier(r)]}${Math.abs(c) >= 5 ? `<small>${c > 0 ? '+' : ''}${c}¢</small>` : ''}`; };
const H = 62; // hauteur d'une rangée de la nef

export default {
  id: 'cathedrale',
  mount(el) {
    const du = store.get('laboCle', null);
    let etat = store.get('cathedrale', { cle: du || [4, 5, 6, 7], tonique: 50, duree: 120, axe: 0.5, lumieres: [], tour: 2.4 });
    if (!etat.tour) etat.tour = 2.4;
    const duLabo = () => depuisLabo(store.get('laboEtat', null));
    if (location.hash.includes('du-labo')) { const L = duLabo(); if (L) etat = { ...etat, ...L, lumieres: [], parties: [] }; else if (du) etat = { ...etat, cle: du, lumieres: [] }; }
    { const R = ranger(etat.cle, etat.voix || [], etat.liens || []); etat = { ...etat, ...R }; }
    let oeuvre = null; let lecteur = null; let anim = null; let sel = { k: 'voix', j: 0 };
    const garder = () => store.set('cathedrale', etat);

    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Le labo · La cathédrale</p>
        <h1>Quelques nombres, tout un orchestre.</h1>
        <p class="muted">Choisis une clé de voûte, quelques nombres. Chaque nombre devient <b>une voix</b> (elle frappe autant de fois par tour), <b>une partie</b> de l’œuvre (aussi longue que lui) et <b>une note</b> de l’accord. Pas besoin de passer par le studio : touche ▶, puis façonne.</p>
      </div></div>
      <section class="nf-commande">
        <canvas class="nf-ros" width="360" height="360" role="img" aria-label="La rosace de la clé de voûte"></canvas>
        <div class="nf-c-mil">
          <div class="nf-cles" role="radiogroup" aria-label="La clé de voûte">${CLES.map(([k, l, n, d]) => `<button class="nf-cle" data-cle="${k}" title="${esc(d)}"><b>${l}</b><span>${n}</span></button>`).join('')}${du ? `<button class="nf-cle" data-cle="labo" title="Les disques que tu as fait tourner au labo"><b>${du.join(' : ')}</b><span>Mes disques du labo</span></button>` : ''}</div>
          <div class="nf-regl">
            <label class="nf-r"><span>Mes nombres</span><input class="input mono" data-ca="nombres" value="${esc(etat.cle.join(' '))}" aria-label="Les nombres de la clé de voûte"></label>
            <label class="nf-r"><span>Note de départ</span><select data-ca="tonique">${[...Array(12)].map((_, i) => `<option value="${45 + i}" ${45 + i === etat.tonique ? 'selected' : ''}>${FR[(45 + i) % 12]}</option>`).join('')}</select></label>
            <label class="nf-r"><span>Durée</span><select data-ca="duree">${[[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']].map(([v, l]) => `<option value="${v}" ${v === etat.duree ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label class="nf-r nf-r-l"><span>Un tour (la mesure) <b class="nf-tour-v"></b></span><input type="range" min="12" max="48" data-ca="tour" value="${Math.round(etat.tour * 10)}" aria-label="La durée d’un tour"></label>
            <label class="nf-r nf-r-l"><span>Tout rythme ↔ tout harmonie</span><input type="range" min="0" max="100" data-ca="axe" value="${Math.round(etat.axe * 100)}" aria-label="Du rythme à l’harmonie"></label>
          </div>
        </div>
        <div class="nf-jeu"><button class="nf-play" data-ca="jouer" aria-label="Bâtir et écouter">▶</button><p class="nf-temps mono"></p>${lampeHTML()}</div>
      </section>
      <section class="nf-nef-bloc">
        <div class="nf-nef-host"><div class="nf-nef"></div></div>
        <aside class="nf-fiche" aria-live="polite"></aside>
      </section>
      <p class="nf-cles-leg"><span><i class="k-voix"></i>une voix : touche-la pour la régler</span><span><i class="k-arche"></i>une partie : touche son arche pour sa lumière et son accord</span><span><i class="k-lien"></i>un lien : une voix en fait bouger une autre</span><span><i class="k-pup"></i>un pupitre : des voix réglées ensemble</span></p>
      <details class="panel nf-plus"><summary><h2>Ce que Frog branche</h2><span class="muted small">un accord tenu au clavier, ou une minute de jeu prise dans le filet, devient la cathédrale</span></summary>
        <div class="ca-row"><button class="btn" data-ca="ecouter">● Écouter mon matériel</button><button class="btn" data-ca="filet">◎ La cathédrale de mon jeu</button><label class="check"><input type="checkbox" data-ca="suivre"> Chaque accord tenu devient la clé</label>
          <label class="field"><span>Jouer aussi sur</span><select data-ca="sortie"><option value="">Aucun appareil MIDI</option></select></label></div>
        <p class="ca-entendu muted small">Branche un clavier MIDI ou une entrée audio (Mon matériel), puis joue un accord et tiens-le. Ou tends le filet, improvise une minute, et touche « La cathédrale de mon jeu ».</p>
        <div class="ca-jeu" hidden></div></details>
      <section class="panel nf-garder"><h2>Garder l’œuvre</h2>
        <div class="ca-row"><input class="input" data-ca="titre" maxlength="80" value="Cathédrale ${esc(etat.cle.join(':'))}" aria-label="Titre">
          <button class="btn" data-ca="wav">⬇ Le son (WAV)</button><button class="btn" data-ca="mid">⬇ La partition (MIDI)</button><button class="btn" data-ca="png">⬇ La rosace</button>${espace.connected ? '<button class="btn primary" data-ca="mur">Garder au mur</button>' : ''}</div>
        <p class="muted small">Le MIDI s’ouvre dans n’importe quel logiciel, une famille par piste, pour que Frog la reprenne et la réorchestre (hauteurs arrondies au demi-ton ; le WAV garde l’intonation juste).</p></section>
      <details class="panel"><summary><h2>D’où vient l’idée</h2></summary>
        <p>Henry Cowell, <i>New Musical Resources</i> (1930) : un accord est un rythme très rapide. Un accord majeur, c’est 4 contre 5 contre 6 vibrations ; ralenti, c’est une polyrythmie. Il a fait construire avec Léon Theremin le Rhythmicon (1931), qui jouait exactement ça. Karlheinz Stockhausen, « …wie die Zeit vergeht… » (1957) : hauteur, rythme et forme sont un seul continuum de durées. Et Wendy Carlos, qui a fait sortir tout un orchestre d’un seul synthétiseur.</p>
        <p>Les sons : l’orchestre du jeu FluidR3 de Frank Wen (licence MIT), accordé à la volée.</p></details>`;
    const q = (s) => el.querySelector(s);

    // L'accord d'une partie (ses notes, en demi-tons fractionnaires), tel que le moteur le joue.
    const accordDe = (s) => { const f = s.forme?.cle; return f ? f.map((x) => s.racine + plier(12 * Math.log2(x / f[0]))) : oeuvre.r.map((x) => s.racine + plier(12 * Math.log2(x / oeuvre.r[0]))); };
    const nomAccordDe = (s) => s.forme?.nom || `la clé sur ${FR[plier(Math.round(s.racine))]}`;
    // Les points d'une voix : autant que ses frappes par tour (au plus 16 dessinés), sur un tour.
    const points = (x, c) => { const n = Math.min(x, 16); return `<svg viewBox="0 0 100 10" preserveAspectRatio="none" class="nf-pts">${[...Array(n)].map((_, k) => `<circle cx="${(4 + (k / n) * 92).toFixed(1)}" cy="5" r="2.6" fill="${c}"/>`).join('')}</svg>`; };
    // Le petit disque d'une voix : ses frappes en points sur un cercle, son nombre au centre, une aiguille qui tourne.
    const disque = (n, c) => `<svg viewBox="0 0 48 48" class="nf-disque"><circle cx="24" cy="24" r="18" class="an" style="stroke:${c}"/><g class="tourne">${[...Array(Math.min(n, 24))].map((_, i) => { const a = (i / Math.min(n, 24)) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(24 + 18 * Math.cos(a)).toFixed(1)}" cy="${(24 + 18 * Math.sin(a)).toFixed(1)}" r="2.3" fill="${c}"/>`; }).join('')}<line x1="24" y1="24" x2="24" y2="8" style="stroke:${c}"/></g><text x="24" y="29" text-anchor="middle">${n}</text></svg>`;

    // La nef : l'en-tête des arches (les parties), puis une rangée par voix, puis l'accord tenu et la lumière.
    function nefHTML() {
      const S = oeuvre.sections; const voix = etat.voix || []; const cols = `${S.map((s) => `${s.ratio}fr`).join(' ')} 0.9fr`;
      const arche = (s) => { const c = COUL[s.lumiere]; const on = sel?.k === 'partie' && sel.i === s.i;
        return `<button class="nf-arche ${on ? 'on' : ''}" data-partie="${s.i}" style="--c:${c}"><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M2 40 V18 Q2 3 50 1 Q98 3 98 18 V40" /></svg><b>${ROMAINS[s.i]} · ${s.ratio}</b><small>${mmss(s.b - s.a)}</small></button>`; };
      const rangee = (n, j) => { const v = voix[j] || {}; const I = instr(v.banque || RYTHME_DEFAUT[j % RYTHME_DEFAUT.length]); const on = sel?.k === 'voix' && sel.j === j;
        return `<button class="nf-voix ${on ? 'on' : ''} ${v.muet ? 'muet' : ''}" data-voix="${j}" style="--c:${I[2]};--g:${GROUPES[v.g] || 'transparent'}">${disque(n, I[2])}<span><b>${esc(I[1])}${v.oct ? ` <small>${v.oct > 0 ? '+' : ''}${v.oct} oct.</small>` : ''}</b><small>${n} frappes par tour${v.g ? ` · pupitre ${v.g}` : ''}${v.muet ? ' · en sourdine' : ''}</small></span></button>
          ${S.map((s) => { const m = accordDe(s)[j % accordDe(s).length]; return `<div class="nf-case ${v.muet ? 'muet' : ''}" data-case="${j}-${s.i}">${points(n, I[2])}<span>${nomNote(m)}</span></div>`; }).join('')}<div class="nf-coda-c"></div>`; };
      // Les liens, dessinés dans la marge gauche, d'une rangée à l'autre ; les pupitres en accolades.
      const nb = etat.cle.length; const yv = (j) => 72 + j * H + H / 2;
      const liens = (etat.liens || []).filter((l) => /^\d+$/.test(String(l.src))).map((l) => { const a = +l.src; const cibles = String(l.cible).startsWith('g') ? voix.map((v, k) => (v?.g === l.cible.slice(1) ? k : -1)).filter((k) => k >= 0 && k !== a) : [+l.cible];
        return cibles.map((b) => { const y1 = yv(a); const y2 = yv(b); const x = 30 - Math.min(24, 6 + Math.abs(b - a) * 6); return `<path d="M34 ${y1} C${x} ${y1}, ${x} ${y2}, 34 ${y2 + (y2 > y1 ? -6 : 6)}" stroke="${SENS[l.sens] || SENS.monte}" stroke-width="${(1.2 + 3 * (l.force ?? 0.6)).toFixed(1)}" marker-end="url(#nf-fl-${l.sens === 'baisse' ? 'b' : 'm'})"/>`; }).join(''); }).join('');
      const vives = (etat.liens || []).filter((l) => !/^\d+$/.test(String(l.src)));
      const pupitres = Object.keys(GROUPES).map((g) => { const ks = voix.map((v, k) => (v?.g === g ? k : -1)).filter((k) => k >= 0 && k < nb); if (!ks.length) return ''; const y1 = yv(Math.min(...ks)) - H / 2 + 8; const y2 = yv(Math.max(...ks)) + H / 2 - 8;
        return `<path d="M8 ${y1} H4 V${y2} H8" stroke="${GROUPES[g]}" stroke-width="3" fill="none"/><text x="2" y="${(y1 + y2) / 2}" fill="${GROUPES[g]}" class="nf-pup-l" transform="rotate(-90 2 ${(y1 + y2) / 2})">${g}</text>`; }).join('');
      return `<div class="nf-grille" style="grid-template-columns:minmax(178px, 210px) ${cols};grid-template-rows:72px repeat(${nb}, ${H}px) 44px 44px">
          <div class="nf-coin"><b>${esc(oeuvre.r.join(' : '))}</b><small>depuis ${FR[plier(etat.tonique)]} · un tour = ${String(oeuvre.tour.toFixed(1)).replace('.', ',')} s</small>${etat.cle.length < 6 ? '<button class="nf-ajout" data-ajoute-voix title="Ajouter un disque : une voix de plus, une partie de plus, une note de plus dans l’accord">＋ Un disque</button>' : ''}</div>
          ${S.map(arche).join('')}<div class="nf-coda"><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 40 V20 Q50 2 90 20 V40"/></svg><small>coda</small></div>
          ${etat.cle.map(rangee).join('')}
          <div class="nf-t">l’accord tenu</div>${S.map((s) => `<div class="nf-nappe" style="--o:${(0.15 + 0.85 * etat.axe).toFixed(2)}">${esc(nomAccordDe(s))}</div>`).join('')}<div></div>
          <div class="nf-t">la mélodie (lumière)</div>${S.map((s) => `<div class="nf-lum" style="--c:${COUL[s.lumiere]}">${s.lumiere === 'silence' ? 'presque rien' : esc(FAMILLES.find((f) => f[0] === s.lumiere)?.[1] || '')}</div>`).join('')}<div></div>
        </div>
        <svg class="nf-marge" viewBox="0 0 40 ${72 + nb * H}" width="40" height="${72 + nb * H}"><defs><marker id="nf-fl-m" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${SENS.monte}"/></marker><marker id="nf-fl-b" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${SENS.baisse}"/></marker></defs>${pupitres}${liens}</svg>
        <div class="nf-lumiere" hidden></div>
        ${vives.length ? `<p class="nf-vives">En direct : ${vives.map((l) => `<b>${esc(SOURCES[l.src] || l.src)}</b>`).join(', ')} agi${vives.length > 1 ? 'ssent' : 't'} pendant l’écoute.</p>` : ''}`;
    }

    // La fiche d'une voix : son nombre, son instrument, son octave, son pupitre, son volume, ses réglages fins, ses liens.
    function ficheVoix(j) {
      const n = etat.cle[j]; const v = (etat.voix || [])[j] || {}; const b = v.banque || RYTHME_DEFAUT[j % RYTHME_DEFAUT.length]; const I = instr(b);
      const sortants = (etat.liens || []).map((l, k) => [l, k]).filter(([l]) => String(l.src) === String(j));
      const nomC = (c) => (String(c).startsWith('g') ? `tout le pupitre ${c.slice(1)}` : `la voix ${etat.cle[+c] ?? '?'}`);
      return `<div class="nf-f-tete" style="--c:${I[2]}">${disque(n, I[2])}<div><p class="nf-f-k">La voix ${n}</p><h3>${esc(I[1])}</h3><p class="muted small">${n} frappes par tour, sur la ${j + 1}<sup>e</sup> note de l’accord. Et la partie ${ROMAINS[j]} dure ${n} unités.</p></div></div>
        <div class="nf-f-l"><span>Son nombre</span><div class="nf-pas"><button class="icon-btn" data-dm="moins" aria-label="Moins">−</button><b>${n}</b><button class="icon-btn" data-dm="plus" aria-label="Plus">+</button></div></div>
        <p class="nf-f-k">Son instrument</p><div class="nf-chips">${INSTR.map(([k, l, c]) => `<button class="${k === b ? 'on' : ''}" data-instr="${k}" style="--c:${c}">${l}</button>`).join('')}</div>
        <p class="nf-f-k">Son octave</p><div class="nf-chips nf-seg">${[-2, -1, 0, 1, 2].map((o) => `<button class="${(v.oct || 0) === o ? 'on' : ''}" data-oct="${o}">${o > 0 ? `+${o}` : o || 'telle'}</button>`).join('')}</div>
        <p class="nf-f-k">Son pupitre <small>des voix réglées ensemble : un geste change leur instrument, leur volume, leur sourdine</small></p>
        <div class="nf-chips nf-seg">${['', ...Object.keys(GROUPES)].map((g) => `<button class="${(v.g || '') === g ? 'on' : ''}" data-pup="${g}" style="--c:${GROUPES[g] || '#6d655a'}">${g ? `Pupitre ${g}` : 'Seule'}</button>`).join('')}</div>
        ${v.g ? `<div class="nf-f-pup"><span>Tout le pupitre ${v.g} :</span><button class="btn small" data-pu="muet">Sourdine</button><button class="btn small" data-pu="solo">Solo</button><button class="btn small" data-pu="instr">Même instrument que cette voix</button></div>` : ''}
        <label class="nf-f-l"><span>Volume</span><input type="range" min="0" max="150" value="${Math.round((v.vol ?? 1) * 100)}" data-dm="vol"></label>
        <div class="nf-f-b"><button class="btn small ${v.muet ? 'on' : ''}" data-dm="muet">${v.muet ? 'Réentendre' : 'Sourdine'}</button><button class="btn small ${v.respire ? 'on' : ''}" data-dm="respire" title="Le volume monte et descend sur quatre tours">∿ Respirer</button>${etat.cle.length > 2 ? '<button class="btn small ghost" data-dm="retirer">Retirer cette voix</button>' : ''}${etat.cle.length < 6 ? '<button class="btn small ghost" data-ajoute-voix>＋ Une voix</button>' : ''}</div>
        <details class="nf-f-fin"><summary>Réglages fins</summary>${Object.entries(REGLAGES).map(([k, [l, mn, mx, pas, fmt, d, aide]]) => `<label class="nf-f-l" title="${esc(aide)}"><span>${l} <output>${fmt(v[k] ?? d)}</output></span><input type="range" min="${mn}" max="${mx}" step="${pas}" value="${v[k] ?? d}" data-dr="${k}"></label>`).join('')}</details>
        <p class="nf-f-k">Ses liens <small>cette voix, à chacune de ses frappes, en fait bouger une autre</small></p>
        ${sortants.length ? `<ul class="nf-liens">${sortants.map(([l, k]) => `<li><span style="color:${SENS[l.sens]}">→</span> rend ${esc(nomC(l.cible))} ${PARAMS[l.param || 'volume'][l.sens === 'baisse' ? 1 : 2]} <button class="btn small ghost" data-li-x="${k}">✕ Retirer ce lien</button></li>`).join('')}</ul>` : ''}
        <div class="nf-lien-f"><select data-lf="cible">${etat.cle.map((m, k) => (k === j ? '' : `<option value="${k}">la voix ${m}</option>`)).join('')}${[...new Set((etat.voix || []).map((x) => x?.g).filter(Boolean))].map((g) => `<option value="g${g}">tout le pupitre ${g}</option>`).join('')}</select>
          <select data-lf="effet">${Object.entries(PARAMS).flatMap(([p, [, bas, haut]]) => [`<option value="${p}|monte">${haut}</option>`, `<option value="${p}|baisse">${bas}</option>`]).join('')}</select><button class="btn small" data-lf="ajouter">＋ Lien</button></div>
        <p class="muted small nf-f-aide">Au labo, un lien peut aussi venir de la respiration, du hasard, de ta voix ou du clavier : bâtis la cathédrale depuis le labo pour les amener.</p>`;
    }
    // La fiche d'une partie : sa durée, la famille qui y chante la mélodie, et son accord.
    function fichePartie(i) {
      const s = oeuvre.sections[i]; const ton = etat.tonique; const cur = etat.parties?.[i];
      return `<div class="nf-f-tete" style="--c:${COUL[s.lumiere]}"><svg viewBox="0 0 48 48" class="nf-disque"><path d="M8 46 V22 Q8 4 24 3 Q40 4 40 22 V46" fill="none" stroke="${COUL[s.lumiere]}" stroke-width="2.5"/><text x="24" y="32" text-anchor="middle">${ROMAINS[i]}</text></svg>
        <div><p class="nf-f-k">La partie ${ROMAINS[i]}</p><h3>${mmss(s.b - s.a)}</h3><p class="muted small">Elle dure ${s.ratio} unités sur ${oeuvre.r.reduce((a, b) => a + b, 0)} : son nombre dans la clé.</p></div></div>
        <p class="nf-f-k">Qui chante la mélodie <small>la lumière de cette partie</small></p>
        <div class="nf-chips">${FAMILLES.map(([k, l]) => `<button class="${k === s.lumiere ? 'on' : ''}" data-lum="${k}" style="--c:${COUL[k]}">${l}</button>`).join('')}</div>
        <p class="nf-f-k">Son accord <small>sur quelles notes tout l’orchestre se pose, dans cette partie</small></p>
        <div class="nf-chips"><button class="${!cur ? 'on' : ''}" data-acc="">La clé, sur sa note</button>${DEGRES.map(([deg, d, qual]) => { const nom = `${FR[plier(ton + d)]}${qual === 'm' ? 'm' : ''}`; return `<button class="${cur?.nom === nom ? 'on' : ''}" data-acc="${d}|${qual}" title="Le degré ${deg} de ${FR[plier(ton)]}">${nom}</button>`; }).join('')}</div>
        <p class="muted small nf-f-aide">Chaque accord sonne en intonation juste (des rapports simples, pas les touches du piano). Un clavier branché peut aussi donner ses accords : « Ce que Frog branche », plus bas.</p>`;
    }
    function rendreFiche() { q('.nf-fiche').innerHTML = sel?.k === 'partie' && oeuvre.sections[sel.i] ? fichePartie(sel.i) : ficheVoix(Math.min(sel?.j ?? 0, etat.cle.length - 1)); }

    // Recompose l’œuvre à partir de l’état actuel et redessine la nef, la fiche et la rosace.
    function majTout() {
      oeuvre = composer({ cle: etat.cle, tonique: etat.tonique, duree: etat.duree, lumieres: etat.lumieres, axe: etat.axe, voix: etat.voix || [], parties: etat.parties || [], liens: etat.liens || [], tour: etat.tour });
      q('.nf-nef').innerHTML = nefHTML(); rendreFiche(); rosace(-1);
      q('.nf-temps').textContent = `0:00 / ${mmss(oeuvre.duree)}`;
      q('.nf-tour-v').textContent = `${String(oeuvre.tour.toFixed(1)).replace('.', ',')} s · ${Math.round(60 / oeuvre.tour * 4)} BPM`;
      el.querySelectorAll('[data-cle]').forEach((b) => b.classList.toggle('on', (b.dataset.cle === 'labo' ? du : CLES.find((c) => c[0] === b.dataset.cle)?.[4])?.join() === etat.cle.join()));
    }
    const ros = q('.nf-ros'); const rctx = ros.getContext('2d'); let rosaceT = 0;
    // La rosace de la clé ; pendant l’écoute, la lumière tourne (huit images par seconde suffisent).
    function rosace(pos = -1) {
      if (!oeuvre?.sections?.length) return;
      if (pos >= 0) { const t = performance.now(); if (t - rosaceT < 120) return; rosaceT = t; }
      dessinerRosace(rctx, ros.width, { cle: oeuvre.r, couleurs: oeuvre.sections.map((s) => COUL[s.lumiere] || '#e8c27a'), lumiere: pos < 0 ? -1 : (pos / oeuvre.duree) % 1, actif: pos < 0 ? -1 : oeuvre.sections.findIndex((s) => pos >= s.a && pos < s.b) });
    }
    // Pendant l'écoute : la lumière avance dans la nef (au-dessus de la partie qui joue) et chaque voix pulse à ses frappes.
    function suivre(pos) {
      rosace(pos); const S = oeuvre.sections; const i = S.findIndex((s) => pos >= s.a && pos < s.b); const L = q('.nf-lumiere'); const grille = q('.nf-grille'); const nef = q('.nf-nef');
      el.querySelectorAll('.nf-arche').forEach((a, k) => a.classList.toggle('joue', k === i));
      if (i >= 0 && L && grille) { const a = el.querySelector(`.nf-arche[data-partie="${i}"]`); const u = (pos - S[i].a) / (S[i].b - S[i].a); const g = nef.getBoundingClientRect(); const r = a.getBoundingClientRect();
        L.hidden = false; L.style.left = `${r.left - g.left + u * r.width}px`; L.style.height = `${grille.offsetHeight}px`; }
      el.querySelectorAll('.nf-voix').forEach((v) => { const j = +v.dataset.voix; const x = etat.cle[j]; const ph = ((pos * x) / oeuvre.tour) % 1; v.classList.toggle('frappe', i >= 0 && ph < 0.14 && !etat.voix?.[j]?.muet);
        const t = v.querySelector('.tourne'); if (t) t.style.transform = `rotate(${((pos / oeuvre.tour) % 1) * 360}deg)`; });
    }
    const arreter = () => { lecteur?.arreter(); lecteur = null; anim?.(); anim = null; q('[data-ca=jouer]').textContent = '▶'; q('[data-ca=jouer]').classList.remove('on'); const L = q('.nf-lumiere'); if (L) L.hidden = true; el.querySelectorAll('.joue, .frappe').forEach((x) => x.classList.remove('joue', 'frappe')); rosace(-1); q('.nf-temps').textContent = `0:00 / ${mmss(oeuvre.duree)}`; };
    // « ▶ » : charge l’orchestre, puis joue l’œuvre (et les sources vivantes en direct).
    async function lancer() {
      if (lecteur) { arreter(); return; }
      const b = q('[data-ca=jouer]'); b.textContent = '…'; await charger();
      demarrer(0);
    }
    // Démarre l'écoute au moment voulu (0 au début ; ou là où on était, quand on vient de changer quelque chose).
    function demarrer(depuis) {
      const b = q('[data-ca=jouer]');
      lecteur = jouer(oeuvre, { depuis: Math.min(depuis, Math.max(0, oeuvre.duree - 1)), onFin: arreter, vivant: envVivant, sortie: sorties.find((o) => o.id === store.get('caSortie', '')) || null }); b.textContent = '■'; b.classList.add('on');
      anim = animate(() => { if (!lecteur) return; const p = Math.max(0, lecteur.position()); suivre(p); q('.nf-temps').textContent = `${mmss(p)} / ${mmss(oeuvre.duree)}`; });
    }
    const titre = () => q('[data-ca=titre]').value.trim() || `Cathédrale ${etat.cle.join(':')}`;
    const telecharger = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${titre().replace(/[^\p{L}\p{N} _:-]+/gu, ' ').replace(/[:\s]+/g, ' ').trim()}.${ext}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
    // Change l'état comme un chef d'orchestre : la musique continue, l'œuvre se recompose et reprend au même moment.
    const changer = (patch) => {
      const enCours = lecteur ? Math.max(0, lecteur.position()) : null;
      if (lecteur) arreter();
      if (patch.cle && patch.cle.length !== etat.cle.length && !('parties' in patch)) patch.parties = [];
      etat = { ...etat, ...patch };
      if (patch.cle || patch.voix) { const R = ranger(etat.cle, etat.voix || [], etat.liens || []); etat = { ...etat, ...R }; q('[data-ca=nombres]').value = etat.cle.join(' '); }
      garder(); majTout();
      if (enCours != null) demarrer(enCours);
      if (/^Cathédrale [\d:]+$/.test(q('[data-ca=titre]').value)) q('[data-ca=titre]').value = `Cathédrale ${etat.cle.join(':')}`;
    };
    const majVoix = (j, change) => { const voix = etat.cle.map((_, k) => ({ ...(etat.voix?.[k] || {}) })); voix[j] = { ...voix[j], ...change }; Object.keys(voix[j]).forEach((k) => voix[j][k] === undefined && delete voix[j][k]); return voix; };

    el.addEventListener('click', async (e) => {
      const t = e.target;
      const vx = t.closest('[data-voix]'); if (vx) { sel = { k: 'voix', j: +vx.dataset.voix }; q('.nf-nef').innerHTML = nefHTML(); rendreFiche(); return; }
      const pa = t.closest('[data-partie]'); if (pa) { sel = { k: 'partie', i: +pa.dataset.partie }; q('.nf-nef').innerHTML = nefHTML(); rendreFiche(); return; }
      const j = sel?.k === 'voix' ? Math.min(sel.j, etat.cle.length - 1) : -1;
      const ins = t.closest('[data-instr]'); if (ins && j >= 0) { changer({ voix: majVoix(j, { banque: ins.dataset.instr }) }); return; }
      const oc = t.closest('[data-oct]'); if (oc && j >= 0) { changer({ voix: majVoix(j, { oct: +oc.dataset.oct || undefined }) }); return; }
      const pu = t.closest('[data-pup]'); if (pu && j >= 0) { changer({ voix: majVoix(j, { g: pu.dataset.pup || undefined }) }); return; }
      const pg = t.closest('[data-pu]'); if (pg && j >= 0) { const g = etat.voix?.[j]?.g; const voix = etat.cle.map((_, k) => ({ ...(etat.voix?.[k] || {}) })); const dans = (k) => voix[k].g === g;
        if (pg.dataset.pu === 'muet') { const tous = voix.every((v, k) => !dans(k) || v.muet); voix.forEach((v, k) => { if (dans(k)) v.muet = !tous || undefined; }); }
        if (pg.dataset.pu === 'solo') voix.forEach((v, k) => { v.muet = dans(k) ? undefined : true; });
        if (pg.dataset.pu === 'instr') { const b = voix[j].banque || RYTHME_DEFAUT[j % RYTHME_DEFAUT.length]; voix.forEach((v, k) => { if (dans(k)) v.banque = b; }); }
        changer({ voix }); return; }
      const dm = t.closest('[data-dm]')?.dataset.dm;
      if (dm && j >= 0 && t.tagName === 'BUTTON') {
        if (dm === 'muet') { changer({ voix: majVoix(j, { muet: !etat.voix?.[j]?.muet || undefined }) }); return; }
        if (dm === 'respire') { changer({ voix: majVoix(j, { respire: !etat.voix?.[j]?.respire || undefined }) }); return; }
        if (dm === 'retirer') { const cle = [...etat.cle]; cle.splice(j, 1); const voix = [...(etat.voix || [])]; voix.splice(j, 1); const re = (x) => (/^\d+$/.test(String(x)) ? (+x === j ? null : String(+x > j ? +x - 1 : +x)) : x); const liens = (etat.liens || []).map((l) => ({ ...l, src: re(l.src), cible: re(l.cible) })).filter((l) => l.src != null && l.cible != null); sel = { k: 'voix', j: 0 }; changer({ cle, voix, liens, lumieres: [] }); return; }
        if (dm === 'plus' || dm === 'moins') {
          // On saute les nombres déjà pris ; la voix garde ses réglages et reste choisie à sa nouvelle place.
          const cle = [...etat.cle]; const pris = new Set(cle.filter((_, k) => k !== j)); const pas = dm === 'plus' ? 1 : -1; let x = cle[j] + pas;
          while (pris.has(x) && x >= 1 && x <= 32) x += pas; if (x < 1 || x > 32) { toast(pas > 0 ? 'Les nombres vont jusqu’à 32.' : 'Le plus petit nombre libre est déjà pris.'); return; }
          cle[j] = x; const ordre = [...cle].sort((a, b) => a - b); sel = { k: 'voix', j: ordre.indexOf(x) }; changer({ cle, lumieres: [] }); return;
        }
      }
      if (t.closest('[data-ajoute-voix]')) { const cle = [...etat.cle, Math.min(32, Math.max(...etat.cle) + 1)]; sel = { k: 'voix', j: cle.length - 1 }; changer({ cle, lumieres: [] }); return; }
      const lx = t.closest('[data-li-x]'); if (lx) { const liens = [...(etat.liens || [])]; liens.splice(+lx.dataset.liX, 1); changer({ liens }); return; }
      if (t.closest('[data-lf=ajouter]') && j >= 0) { const [param, sens] = q('[data-lf=effet]').value.split('|'); changer({ liens: [...(etat.liens || []), { src: String(j), cible: q('[data-lf=cible]').value, param, sens, force: 0.6 }] }); return; }
      const lu = t.closest('[data-lum]'); if (lu && sel?.k === 'partie') { const lum = oeuvre.sections.map((s) => s.lumiere); lum[sel.i] = lu.dataset.lum; changer({ lumieres: lum }); return; }
      const ac = t.closest('[data-acc]'); if (ac && sel?.k === 'partie') { const parties = [...(etat.parties || [])]; while (parties.length < oeuvre.sections.length) parties.push(null);
        if (!ac.dataset.acc) parties[sel.i] = null; else { const [d, qual] = ac.dataset.acc.split('|'); const racine = etat.tonique + +d; parties[sel.i] = { racine, cle: qual === 'm' ? [10, 12, 15] : [4, 5, 6], nom: `${FR[plier(racine)]}${qual === 'm' ? 'm' : ''}` }; }
        changer({ parties }); return; }
      if (t.closest('[data-ca=ecouter]')) { ecouterMateriel(); return; }
      if (t.closest('[data-ca=filet]')) { depuisFilet(); return; }
      if (t.closest('[data-ca=batir]')) { batirDuJeu(); return; }
      if (t.closest('[data-ca=appliquer]')) { appliquer(); return; }
      const c = t.closest('[data-cle]');
      if (c) { if (c.dataset.cle === 'labo') { const L = duLabo(); if (L) { changer({ ...L, lumieres: [], parties: [] }); toast('Les disques du labo sont là : leurs pupitres, leurs sons, leurs liens.'); return; } }
        const v = c.dataset.cle === 'labo' ? du : CLES.find((x) => x[0] === c.dataset.cle)[4]; sel = { k: 'voix', j: 0 }; changer({ cle: v, lumieres: [], parties: [], liens: [], voix: [] }); return; }
      const a = t.closest('[data-ca]')?.dataset.ca;
      if (a === 'jouer') lancer();
      if (a === 'wav' || a === 'mur') {
        const b = t.closest('button'); const avant = b.textContent; b.disabled = true; b.textContent = 'L’orchestre joue en coulisse…';
        try {
          const buf = await rendre(oeuvre); const fichier = wav(buf);
          if (a === 'wav') telecharger(fichier, 'wav');
          else { b.textContent = 'J’envoie…'; const au = await uploadAudio(fichier); await saveEntry({ type: 'audio', title: titre(), audio: { ...au, duration: +oeuvre.duree.toFixed(1) }, data: { stage: 0, cathedrale: { cle: etat.cle, tonique: etat.tonique, axe: etat.axe, tour: etat.tour, lumieres: oeuvre.sections.map((s) => s.lumiere), voix: etat.voix || [], liens: etat.liens || [], parties: etat.parties || [] } } }); toast('La cathédrale est au mur.'); }
        } catch (err) { toast(err.message || 'Le rendu n’a pas marché.'); }
        b.disabled = false; b.textContent = avant;
      }
      if (a === 'mid') telecharger(fichierMidi(evenementsMidi(oeuvre)), 'mid');
      if (a === 'png') { const c2 = document.createElement('canvas'); c2.width = c2.height = 900; dessinerRosace(c2.getContext('2d'), 900, { cle: oeuvre.r, couleurs: oeuvre.sections.map((s) => COUL[s.lumiere] || '#e8c27a'), lumiere: -1, actif: -1 }); c2.toBlob((bl) => telecharger(bl, 'png'), 'image/png'); }
    });
    el.addEventListener('change', (e) => {
      const t = e.target; const j = sel?.k === 'voix' ? sel.j : -1;
      if (t.dataset.dm === 'vol' && j >= 0) { changer({ voix: majVoix(j, { vol: +t.value / 100 }) }); return; }
      if (t.dataset.dr && j >= 0) { changer({ voix: majVoix(j, { [t.dataset.dr]: +t.value }) }); return; }
      const a = t.dataset.ca;
      if (a === 'sortie') { store.set('caSortie', t.value); toast(t.value ? 'La cathédrale jouera aussi sur cet appareil (hauteurs arrondies au demi-ton).' : 'Plus d’appareil MIDI en sortie.'); return; }
      if (a === 'suivre') { suivreJeu = t.checked; return; }
      if (a === 'nombres') { const v = t.value.split(/[^\d]+/).map(Number).filter((x) => x > 0 && x <= 32).slice(0, 6); if (v.length >= 2) changer({ cle: v, lumieres: [], parties: [] }); else toast('Au moins deux nombres entiers, de 1 à 32 (ex. : 4 5 6 7).'); }
      if (a === 'tonique') changer({ tonique: +t.value });
      if (a === 'duree') changer({ duree: +t.value });
      if (a === 'tour') changer({ tour: +t.value / 10 });
      if (a === 'axe') changer({ axe: +t.value / 100 });
    });
    el.addEventListener('input', (e) => {
      const t = e.target; if (t.dataset.dr) { const o = t.closest('label')?.querySelector('output'); if (o) o.textContent = REGLAGES[t.dataset.dr][4](+t.value); }
      if (t.dataset.ca === 'tour') { const x = +t.value / 10; q('.nf-tour-v').textContent = `${String(x.toFixed(1)).replace('.', ',')} s · ${Math.round(60 / x * 4)} BPM`; }
    });

    // ---------- Ce que Frog branche ----------
    // Les sources vivantes, pendant l'écoute : ta voix (le micro ouvert), le clavier MIDI, la molette.
    const vif = { t: -9, v: 0, cc: 0 };
    const offVif = [onNotes((k, n, v, on) => { if (on) { vif.t = audio().currentTime; vif.v = v / 127; } }), onCC((k, num, val) => { if (num === 1) vif.cc = val / 127; })];
    const envVivant = (src) => (src === 'voix' ? Math.min(1, (mic.level || 0) * 6) : src === 'clavier' ? vif.v * Math.exp(-(audio().currentTime - vif.t) * 4) : src === 'molette' ? vif.cc : null);
    let sorties = []; let suivreJeu = false; let offNotes = null; let ecouteAudio = null; const tenues = new Set(); let attente = 0; let propose = null;
    const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
    // Remplit la liste des appareils MIDI sur lesquels la cathédrale peut aussi jouer.
    async function remplirSorties() {
      sorties = await sortiesMidi(); const s = q('[data-ca=sortie]'); const cur = store.get('caSortie', '');
      s.innerHTML = `<option value="">Aucun appareil MIDI</option>${sorties.map((o) => `<option value="${esc(o.id)}" ${o.id === cur ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}`;
    }
    // Propose une clé de voûte à partir d’un accord entendu (sur un clavier ou une entrée audio).
    function proposer(notes, source) {
      const r = cleDepuisNotes(notes); const box = q('.ca-entendu'); if (!r) { box.textContent = 'Accord trop complexe pour une clé de voûte (des nombres au-delà de 32) : essaie trois ou quatre notes.'; return; }
      propose = r; const noms = [...new Set(notes.map((m) => NOMS[plier(m)]))].join(' ');
      box.innerHTML = `${esc(source)} : <b>${noms}</b> → la clé <b class="mono">${r.cle.join(' : ')}</b>, depuis ${NOMS[r.tonique % 12]}. ${suivreJeu ? '<i>Appliquée.</i>' : '<button class="btn small" data-ca="appliquer">En faire la clé de voûte</button>'}`;
      if (suivreJeu) appliquer();
    }
    // Fait de l’accord proposé la nouvelle clé de voûte.
    function appliquer() { if (!propose) return; q('[data-ca=tonique]').value = String(propose.tonique); changer({ cle: propose.cle, tonique: propose.tonique, lumieres: [], voix: [], parties: [] }); }
    // Écoute le matériel branché : chaque accord tenu au clavier, ou entendu à l’entrée audio, propose une clé.
    async function ecouterMateriel() {
      const b = q('[data-ca=ecouter]');
      if (offNotes || ecouteAudio) { offNotes?.(); offNotes = null; ecouteAudio?.stop(); ecouteAudio = null; b.textContent = '● Écouter mon matériel'; return; }
      await detecter({ demander: true }); await remplirSorties();
      const actifs = appareils().filter((a) => a.actif && a.branche && a.k !== 'app');
      offNotes = onNotes((k, note, vel, on) => {
        if (on) tenues.add(note); else tenues.delete(note);
        clearTimeout(attente); if (tenues.size >= 2) { const l = [...tenues]; const nom = appareils().find((a) => a.k === k)?.nom || 'Ton clavier'; attente = setTimeout(() => proposer(l, nom), 450); }
      });
      const audioIn = actifs.find((a) => a.audio);
      if (audioIn) { ecouteAudio = createListener({ deviceId: audioIn.audio, onChord: (m) => proposer(chordIntervals(m.qual).map((iv) => 48 + m.root + iv), audioIn.nom) }); try { await ecouteAudio.start(); } catch { ecouteAudio = null; } }
      b.textContent = '■ Arrêter l’écoute';
      q('.ca-entendu').innerHTML = `À l’écoute : ${actifs.length ? actifs.map((a) => `<b>${esc(a.nom)}</b>`).join(', ') : 'aucun appareil actif (coche-les dans <a href="#/materiel">Mon matériel</a>)'}. Joue un accord et tiens-le.`;
    }
    // ---------- La cathédrale de mon jeu ----------
    // Une minute d'improvisation prise dans le filet : les accords qui ont sonné, combien de temps, combien de fois.
    let jeu = null;
    const sec = (x) => `${x.toFixed(x < 10 ? 1 : 0).replace('.', ',')} s`;
    // Analyse une minute de jeu (notes MIDI, sinon le son) : quels accords, combien de temps, combien de fois ; puis propose la cathédrale de ce jeu.
    async function depuisJeu({ midi = [], buf = null, nom = 'le filet' }) {
      const box = q('.ca-jeu'); box.hidden = false; q('.nf-plus').open = true;
      const frappes = midi.filter((m) => (m.d[0] & 0xf0) === 0x90 && m.d[2]).length; let res = null; let via = '';
      if (frappes >= 3) { res = accordsDesSegments(segmentsMidi(midi)); via = `${frappes} notes MIDI`; }
      if (!res?.accords.length && buf) {
        box.innerHTML = '<p class="muted">J’écoute ta minute, accord par accord…</p>';
        try { const segs = await trouverAccords(buf, 90); res = accordsDesSegments(segs.map((g) => ({ notes: chordIntervals(g.q).map((iv) => 48 + g.r + iv), a: g.a, b: g.b }))); via = 'le son entendu'; } catch { res = null; }
      }
      if (!res?.accords.length) { jeu = null; box.innerHTML = `<p class="muted">Je n’ai pas trouvé d’accord tenu dans ${esc(nom)} (au moins deux notes ensemble pendant un quart de seconde). Une mélodie seule ne fait pas encore de voûte : ajoute la main gauche !</p>`; return; }
      jeu = { res, nom }; const c = cathedraleDuJeu(res); const max = res.accords[0].duree; const t = res.accords[0];
      box.innerHTML = `<p class="small"><b>Ton jeu</b>, dans ${esc(nom)} (${esc(via)}) : ${res.accords.length} accord${res.accords.length > 1 ? 's' : ''} différent${res.accords.length > 1 ? 's' : ''} sur ${sec(res.total)} d’accords tenus.</p>
        <ol class="ca-jeu-l">${res.accords.slice(0, 6).map((a) => `<li><b>${esc(a.nom)}</b><span class="ca-jeu-b"><i style="width:${Math.max(4, (a.duree / max) * 100).toFixed(0)}%"></i></span><span class="mono small">${sec(a.duree)} · ${a.fois} fois · ${a.cle.join(':')}</span></li>`).join('')}</ol>
        <p class="small">Celui qui revient le plus, <b>${esc(t.nom)}</b>, devient la clé de voûte <b class="mono">${t.cle.join(' : ')}</b>. Les parties se posent sur ${c.parties.map((p) => `<b>${esc(p.nom)}</b>`).join(', ')}, dans l’ordre où tu les as joués.</p>
        <button class="btn primary" data-ca="batir">Bâtir la cathédrale de ce jeu</button>`;
    }
    // Bâtit la cathédrale sur le jeu analysé : la clé de l’accord le plus présent, une partie par accord qui revient.
    function batirDuJeu() {
      if (!jeu) return; const c = cathedraleDuJeu(jeu.res);
      q('[data-ca=tonique]').value = String(c.tonique); q('[data-ca=titre]').value = 'La cathédrale de mon jeu';
      changer({ cle: c.cle, tonique: c.tonique, parties: c.parties, lumieres: [], voix: [] }); toast('La cathédrale est bâtie sur ton jeu. Touche ▶ pour l’entendre.');
      q('.nf-commande').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Prend la dernière minute gardée par le filet et l’analyse.
    function depuisFilet() {
      const box = q('.ca-jeu'); box.hidden = false;
      if (!filet.arme) { box.innerHTML = '<p class="muted">Le filet n’est pas tendu. Touche le filet, en haut (l’anneau d’or), improvise une minute sur ton clavier ou ton instrument branché, puis reviens toucher « La cathédrale de mon jeu ». <a href="#/materiel">Mon matériel</a></p>'; return; }
      const s = instantane(); const pistes = s.pistes.filter((p) => p.k !== 'app'); let buf = null;
      if (pistes.length && s.duree >= 2) { const n = pistes[0].d.length; buf = new AudioBuffer({ length: n, sampleRate: s.sr, numberOfChannels: 1 }); const d = buf.getChannelData(0); pistes.forEach((p) => { for (let i = 0; i < n; i++) d[i] += p.d[i] / pistes.length; }); }
      depuisJeu({ midi: s.midi, buf, nom: `${s.duree < 60 ? `les ${Math.round(s.duree)} secondes` : 'les dernières minutes'} du filet` });
    }
    if (window.__flipCathedrale) { const f = window.__flipCathedrale; window.__flipCathedrale = null; setTimeout(() => { depuisJeu(f); q('.nf-plus').scrollIntoView({ block: 'start' }); }, 0); }
    // Sans demander la permission au chargement : on remplit les sorties seulement si le MIDI est déjà autorisé.
    navigator.permissions?.query({ name: 'midi' }).then((st) => { if (st.state === 'granted') remplirSorties(); }).catch(() => {});

    majTout();
    const offLampe = brancherLampe(el);
    return () => { offVif.forEach((f) => f?.()); lecteur?.arreter(); anim?.(); offNotes?.(); ecouteAudio?.stop(); clearTimeout(attente); offLampe(); };
  },
};
