// Le mot ouvert : partout où l'on écrit dans l'app (journal, paroles, placer, relais, mur…), un double-clic sur un mot
// l'ouvre. Ses syllabes, ses rimes classées de la plus riche à la plus pauvre (avec leur nombre de syllabes, pour garder
// la longueur du vers), et ses synonymes par sens. Toucher un synonyme le met à la place du mot ; toucher une rime la copie.
// Rimes et syllabes : Lexique 3.83 (New et Pallier, CC BY-SA 4.0). Synonymes : myThes 2.3 (Labbé, Dicollecte, LGPL), hors ligne.
import { loadLexique, wordSyll, rimesClassees, synonymesParSens } from './lexique.js';
import { toast } from './ui.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿœŒæÆ-]/;
const syll = (w) => { const s = wordSyll(w); return s.parts.length - (s.mute ? 1 : 0); };
const casse = (modele, w) => (modele[0] && modele[0] === modele[0].toUpperCase() && modele[0] !== modele[0].toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w);
let boite = null; let cible = null;

function fermer() { boite?.remove(); boite = null; cible = null; }

// Le mot sous la sélection d'un champ : on élargit jusqu'aux lettres (le double-clic prend parfois l'espace ou l'apostrophe).
function motDuChamp(f) {
  const v = f.value; let a = f.selectionStart; let b = f.selectionEnd;
  if (a == null) return null;
  while (a < v.length && !LETTRE.test(v[a])) a++; while (b > a && !LETTRE.test(v[b - 1])) b--;
  while (a > 0 && LETTRE.test(v[a - 1])) a--; while (b < v.length && LETTRE.test(v[b])) b++;
  let w = v.slice(a, b); const ap = w.search(/['’]/); if (ap >= 0) { a += ap + 1; w = v.slice(a, b); } // l'amour → amour
  w = w.replace(/^-+|-+$/g, '');
  return w.length > 1 ? { w, a, b } : null;
}

async function ouvrir(f, mot, x, y) {
  fermer(); cible = { f, ...mot };
  boite = document.createElement('div'); boite.className = 'mo-boite no-aide'; boite.setAttribute('role', 'dialog'); boite.setAttribute('aria-label', `Le mot ${mot.w}`);
  boite.innerHTML = `<div class="mo-tete"><b>${esc(mot.w)}</b><span class="mo-syl muted"></span><button class="mo-x" aria-label="Fermer">✕</button></div><div class="mo-corps"><p class="muted small">J’ouvre le mot…</p></div>`;
  document.body.appendChild(boite);
  const w = Math.min(380, innerWidth - 24); boite.style.width = `${w}px`;
  boite.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, x - w / 2))}px`;
  const placer = () => { if (!boite) return; const h = boite.offsetHeight; boite.style.top = `${y + 18 + h < innerHeight ? y + 18 : Math.max(10, y - h - 14)}px`; };
  placer();
  await loadLexique();
  const s = wordSyll(mot.w); const nb = syll(mot.w);
  boite.querySelector('.mo-syl').innerHTML = `${s.parts.map((p, i) => `<span class="${s.mute && i === s.parts.length - 1 ? 'mo-muet' : ''}">${esc(p)}</span>`).join('·')} · ${nb} syll.${s.mute ? ' (+ e muet)' : ''}`;
  const r = rimesClassees(mot.w, 90); const syn = await synonymesParSens(mot.w);
  if (!boite || cible?.w !== mot.w) return;
  let meme = false; let tout = false;
  const puce = (x, k) => `<button class="mo-puce" data-${k}="${esc(x)}">${esc(x)}<small>${syll(x)}</small></button>`;
  const rendre = () => {
    const groupe = (t, aide, l) => (l.length ? `<p class="mo-k">${t} <span class="muted">${aide}</span></p><div class="mo-puces">${l.slice(0, tout ? 40 : 12).map((x) => puce(x.w, 'rime')).join('')}${!tout && l.length > 12 ? `<button class="mo-puce mo-plus" data-mo="plus">+ ${Math.min(40, l.length) - 12}</button>` : ''}</div>` : '');
    const rl = r ? r.rimes.filter((x) => !meme || x.nb === r.nb) : [];
    boite.querySelector('.mo-corps').innerHTML = `
      <div class="mo-onglet">
        <p class="mo-titre">Rimes <label class="mo-meme"><input type="checkbox" data-mo="meme" ${meme ? 'checked' : ''}> même nombre de syllabes</label></p>
        ${r ? (groupe('Très riches', '3 sons communs ou plus', rl.filter((x) => x.sons >= 3)) + groupe('Riches', '2 sons communs', rl.filter((x) => x.sons === 2)) + groupe('Suffisantes', 'la dernière voyelle', rl.filter((x) => x.sons <= 1)) || '<p class="muted small">Pas de rime avec ce filtre.</p>')
          + (r.homophones.length ? `<p class="mo-k">Même son <span class="muted">à éviter, ou à jouer comme un écho</span></p><div class="mo-puces">${r.homophones.map((x) => puce(x, 'rime')).join('')}</div>` : '')
          : '<p class="muted small">Ce mot n’est pas dans le lexique : pas de rimes sûres. Essaie sa forme simple (au singulier, à l’infinitif).</p>'}
      </div>
      <div class="mo-onglet">
        <p class="mo-titre">Synonymes <span class="muted small">touche pour remplacer</span></p>
        ${syn == null ? '<p class="muted small">Dictionnaire indisponible pour l’instant.</p>' : syn.sens.length ? syn.sens.map((x) => `${x.nature ? `<p class="mo-k">${x.nature}</p>` : ''}<div class="mo-puces">${x.mots.map((m) => puce(m, 'syn')).join('')}</div>`).join('') : '<p class="muted small">Aucun synonyme connu.</p>'}
      </div>
      <p class="mo-src muted">Le petit chiffre : les syllabes chantées. Rimes : Lexique 3.83 · Synonymes : ${syn?.source === 'wiktionnaire' ? 'Wiktionnaire' : 'myThes 2.3 (LibreOffice)'}</p>`;
    placer();
  };
  rendre(); boite._plus = () => { tout = true; rendre(); };
  boite.addEventListener('change', (e) => { if (e.target.dataset.mo === 'meme') { meme = e.target.checked; rendre(); } });
}

function remplacer(nouveau) {
  const { f, a, b, w } = cible; const v = f.value; const mis = casse(w, nouveau);
  f.focus(); f.setSelectionRange(a, b);
  // execCommand garde l'annulation (Ctrl+Z) quand il marche ; sinon, on remplace à la main.
  if (!document.execCommand?.('insertText', false, mis)) { f.value = v.slice(0, a) + mis + v.slice(b); f.dispatchEvent(new Event('input', { bubbles: true })); }
  f.setSelectionRange(a + mis.length, a + mis.length);
  toast(`« ${w} » → « ${mis} »`); fermer();
}

export function installerMotOuvert() {
  document.addEventListener('dblclick', (e) => {
    const f = e.target.closest?.('textarea, input[type=text], input:not([type])');
    if (!f || f.closest('.mo-boite, .filet-voile, .m-scene') || f.dataset.motOff != null) return;
    setTimeout(() => { const m = motDuChamp(f); if (m) ouvrir(f, m, e.clientX, e.clientY); }, 0);
  });
  document.addEventListener('click', (e) => {
    if (!boite) return;
    if (e.target.closest('.mo-x')) { fermer(); return; }
    if (e.target.closest('[data-mo=plus]')) { boite._plus?.(); return; }
    const s = e.target.closest('[data-syn]'); if (s) { remplacer(s.dataset.syn); return; }
    const r = e.target.closest('[data-rime]'); if (r) { navigator.clipboard?.writeText(r.dataset.rime).catch(() => {}); toast(`« ${r.dataset.rime} » copié : colle-le au bout d’une ligne.`); return; }
    if (!e.target.closest('.mo-boite')) fermer();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && boite) fermer(); });
  addEventListener('hashchange', fermer);
}
