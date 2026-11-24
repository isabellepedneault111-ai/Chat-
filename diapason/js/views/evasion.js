// L'évasion : une escape room dans l'app, pour la découvrir en jouant plutôt qu'en lisant un guide.
// Sept cadenas sur Projet 1 (la pièce de Frog). Chacun s'ouvre avec ce que l'app fait trouver ou faire :
// une réponse à taper (le tempo, la tonalité…) ou un geste que l'app voit toute seule (une ligne gardée,
// un commentaire laissé, le MIDI téléchargé, une ligne jouée au clavier). Un chrono, des indices, et à la fin
// un mot sur le mur pour l'autre.
import { store, toast } from '../ui.js';
import { espace, saveEntry } from '../espace.js';
import { esc } from './carnet.js';

const sansAccent = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9#♭♯ ]/g, ' ').replace(/\s+/g, ' ').trim();
const p1 = (k) => /projet 1/i.test(k);

const CADENAS = [
  { id: 'tempo', ico: '🎧', titre: 'Le pouls', mission: 'Quel est le tempo de « Projet 1 »? Fais-le écouter par L’oreille.', va: '#/oreille', vaNom: 'Jouer › L’oreille',
    indice: 'Dans L’oreille, ouvre le menu « Une pièce ou un son de l’espace… » et choisis « Projet 1 ». Le tempo s’affiche en BPM.',
    reponse: (x) => { const n = parseFloat(String(x).replace(',', '.')); return n >= 118 && n <= 122; } },
  { id: 'ton', ico: '🎼', titre: 'La maison', mission: 'Dans quelle tonalité est « Projet 1 »?', va: '#/oreille', vaNom: 'Jouer › L’oreille',
    indice: 'Même page : regarde « Tonalité estimée ». Deux mots : une note, puis majeur ou mineur.',
    reponse: (x) => /^(re|d) ?(mineur|min|m|minor)$/.test(sansAccent(x)) || ['rem', 'dm'].includes(sansAccent(x)) },
  { id: 'paroles', ico: '✍️', titre: 'Les mots', mission: 'Fais écrire des paroles sur « Projet 1 », puis coche « Garder » sur ta ligne préférée.', va: '#/oreille', vaNom: 'L’oreille › ✍️ Des paroles sur cette chanson',
    indice: 'Dans L’oreille (avec Projet 1), touche « ✍️ Des paroles sur cette chanson ». Les lignes s’écrivent seules ; coche « Garder » sur une.',
    auto: () => Object.entries(store.get('motsParChanson', {})).some(([k, f]) => p1(k) && (f.lignes || []).some((L) => L.garde && L.txt)) },
  { id: 'juste', ico: '🎤', titre: 'La justesse', mission: 'Chante (ou fredonne) une ligne avec le micro : la porte s’ouvre quand l’app t’entend juste.', va: '#/mots', vaNom: 'Mots sur la grille › ▶ Chanter › 🎤',
    indice: 'Sur la page des paroles, ▶ Chanter, puis 🎤 dans la barre du bas. Suis les barres jaunes : les points verts = juste. Avec des écouteurs, c’est plus facile.',
    auto: () => !!store.get('evasionJuste', false) },
  { id: 'com', ico: '💬', titre: 'Le message', mission: 'Laisse un commentaire (écrit ou vocal) sur un moment de « Projet 1 ».', va: '#/chantier', vaNom: 'Jouer › ⚒ Le chantier',
    indice: 'Dans Le chantier, touche une mesure (ça part), puis « 💬 Commenter ici ». Écris ou dis-le au micro, puis « Garder ».',
    auto: () => store.get('chantierComs', []).some((c) => p1(c.cle)) || (espace.connected && espace.entries.some((e) => e.type === 'chantier' && e.data?.kind === 'com' && e.author === espace.me && p1(e.data.cle))) },
  { id: 'ligne', ico: '🎹', titre: 'La ligne', mission: 'Joue une ligne de piano par-dessus la chanson : elle doit se poser sur la grille.', va: '#/chantier', vaNom: 'Le chantier › 🎹 Piano › ⏺ Jouer ma ligne',
    indice: 'Onglet 🎹 Piano, « ⏺ Jouer ma ligne ». La chanson part ; joue au clavier MIDI ou sur les touches à l’écran, puis « ■ Arrêter et placer mes notes ».',
    auto: () => !!store.get('evasionLigne', false) },
  { id: 'midi', ico: '🎛', titre: 'La sortie', mission: 'Refais la chanson en numérique et repars avec le fichier MIDI.', va: '#/chantier', vaNom: 'Le chantier › 🎛 Numérique',
    indice: 'Onglet 🎛 Numérique : « Refaire la chanson en numérique », puis « ⬇ En MIDI ». Le fichier s’ouvre dans ton logiciel de musique.',
    auto: () => !!store.get('evasionMidi', false) },
];

export default {
  id: 'evasion',
  mount(el) {
    const etat = { debut: 0, ouverts: [], indices: [], fin: 0, ...store.get('evasion', {}) };
    const garder = () => store.set('evasion', etat);
    let minuterie = 0;
    const mmss = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const temps = () => (etat.debut ? (etat.fin || Date.now()) - etat.debut + etat.indices.length * 60000 : 0);
    // Les cadenas « gestes » se vérifient tout seuls à chaque visite.
    function verifierAuto() {
      if (!etat.debut || etat.fin) return false; let neuf = false;
      CADENAS.forEach((c) => { if (c.auto && !etat.ouverts.includes(c.id) && c.auto()) { etat.ouverts.push(c.id); neuf = true; } });
      if (neuf) { garder(); finir(); } return neuf;
    }
    async function finir() {
      if (etat.fin || etat.ouverts.length < CADENAS.length) return; etat.fin = Date.now(); garder();
      if (espace.connected) { try { await saveEntry({ type: 'note', title: `🔓 ${espace.me} s’est évadé·e en ${mmss(temps())}`, data: { texte: `Les ${CADENAS.length} cadenas de L’évasion, ouverts sur Projet 1${etat.indices.length ? ` (${etat.indices.length} indice${etat.indices.length > 1 ? 's' : ''})` : ''}.` } }); } catch { /* hors ligne */ } }
    }
    function rendre() {
      const ouverts = new Set(etat.ouverts); const prochain = CADENAS.find((c) => !ouverts.has(c.id));
      el.innerHTML = `
        <div class="mod-head"><div><p class="eyebrow">Accueil · L’évasion</p>
          <h1>Sept cadenas. Une chanson.</h1>
          <p class="muted">« Projet 1 » est enfermée. Chaque cadenas s’ouvre avec ce que l’app te fait trouver ou faire. Le chrono tourne ; un indice coûte une minute.</p></div></div>
        ${!etat.debut ? `<section class="panel ev-depart"><p class="ev-gros">⏱ Prêt? Le chrono part.</p><p class="muted">Chaque cadenas t’envoie dans l’app. Pour revenir : Accueil › 🗝 L’évasion.</p><button class="btn primary ev-go" data-e="go">🔓 Commencer l’évasion</button></section>`
        : `<section class="panel ev-chrono"><b class="ev-t mono">${mmss(temps())}</b><span>${ouverts.size} / ${CADENAS.length} cadenas${etat.indices.length ? ` · ${etat.indices.length} indice${etat.indices.length > 1 ? 's' : ''} (+${etat.indices.length} min)` : ''}</span>
            ${etat.fin ? '' : '<button class="btn small" data-e="verifier">↻ Vérifier mes gestes</button>'}</section>
          ${etat.fin ? `<section class="panel ev-libre"><p class="ev-gros">🗝 Libre en <b>${mmss(temps())}</b>!</p><p>Tu sais maintenant écouter un mémo, écrire dessus, chanter juste, laisser un message à la seconde, jouer une ligne et sortir le MIDI.${espace.connected ? ' Un mot est parti sur le mur.' : ''}</p><button class="btn" data-e="refaire">Recommencer à zéro</button></section>` : ''}
          <ol class="ev-liste">${CADENAS.map((c, i) => {
            const ok = ouverts.has(c.id); const actif = !ok && c === prochain; const ferme = !ok && !actif;
            return `<li class="ev-c ${ok ? 'ok' : actif ? 'actif' : 'ferme'}"><div class="ev-ico">${ok ? '🔓' : ferme ? '🔒' : c.ico}</div><div class="ev-corps">
              <p class="ev-titre">${i + 1}. ${esc(c.titre)}</p>
              ${ferme ? '<p class="muted">Ouvre d’abord le cadenas d’avant.</p>' : `<p>${esc(c.mission)}</p>`}
              ${actif ? `<div class="ev-row"><a class="btn" href="${c.va}">→ ${esc(c.vaNom)}</a>${c.reponse ? `<input class="input ev-rep" data-rep="${c.id}" placeholder="Ta réponse" autocomplete="off" aria-label="Ta réponse pour ${esc(c.titre)}"><button class="btn primary" data-e="essai" data-c="${c.id}">Ouvrir</button>` : `<button class="btn primary" data-e="verifier">↻ C’est fait</button>`}</div>
                ${etat.indices.includes(c.id) ? `<p class="ev-indice">💡 ${esc(c.indice)}</p>` : `<button class="linklike small" data-e="indice" data-c="${c.id}">💡 Un indice (+1 min)</button>`}` : ''}
            </div></li>`; }).join('')}</ol>`}`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-e]'); if (!b) return; const a = b.dataset.e;
      if (a === 'go') { etat.debut = Date.now(); etat.ouverts = []; etat.indices = []; etat.fin = 0; ['evasionJuste', 'evasionLigne', 'evasionMidi'].forEach((k) => store.set(k, false)); garder(); rendre(); }
      if (a === 'refaire') { if (!confirm('Recommencer L’évasion à zéro?')) return; etat.debut = 0; etat.fin = 0; etat.ouverts = []; etat.indices = []; garder(); rendre(); }
      if (a === 'indice') { etat.indices.push(b.dataset.c); garder(); rendre(); }
      if (a === 'verifier') { if (verifierAuto()) toast('🔓 Un cadenas s’ouvre!'); else toast('Pas encore : fais le geste demandé, puis reviens ici.'); rendre(); }
      if (a === 'essai') {
        const c = CADENAS.find((x) => x.id === b.dataset.c); const v = el.querySelector(`[data-rep="${c.id}"]`)?.value || '';
        if (c.reponse(v)) { etat.ouverts.push(c.id); garder(); toast('🔓 Ouvert!'); finir(); rendre(); } else { toast('Non… essaie encore (ou prends un indice).'); el.querySelector(`[data-rep="${c.id}"]`)?.classList.add('faux'); }
      }
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.rep) el.querySelector(`[data-e=essai][data-c="${e.target.dataset.rep}"]`)?.click(); });
    verifierAuto(); rendre();
    minuterie = setInterval(() => { const t = el.querySelector('.ev-t'); if (t && etat.debut && !etat.fin) t.textContent = mmss(temps()); }, 1000);
    return () => clearInterval(minuterie);
  },
};
