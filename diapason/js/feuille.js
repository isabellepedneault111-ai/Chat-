// Le texte seul : les paroles d'une chanson, sans la grille ni les outils.
// On les lit en écoutant la vraie chanson ; on marque à quel moment chaque ligne arrive (un toucher, au bon moment) ;
// puis on apprend : la ligne qui joue s'allume, on répète une ligne en boucle, on cache les mots pour les retrouver.
// Et on les sort : le texte (.txt), le texte avec ses temps (.lrc, le format des paroles karaoké), l'impression.
import { audio, out } from './audio.js';
import { esc } from './views/carnet.js';
import { toast } from './ui.js';

const mmss = (t) => (t == null ? '–:––' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
const lrc = (t) => { const m = Math.floor(t / 60); const s = t - m * 60; return `[${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`; };
// « j’écoute la nuit » → « j’é····· l· n··· » : la première lettre de chaque mot, de quoi se souvenir.
const LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ]/;
const indice = (txt) => txt.split(/(\s+)/).map((m) => { let vu = false; return [...m].map((ch) => { if (!LETTRE.test(ch)) return ch; if (!vu) { vu = true; return ch; } return '·'; }).join(''); }).join('');
const vide = (txt) => txt.replace(/[^\s’'-]/g, '_');

const AIDES = {
  lire: 'Touche un temps pour écouter à partir de là. La ligne qui joue s’allume.',
  marquer: 'Lance la chanson, puis touche « Maintenant! » (ou la barre d’espace) au moment où chaque ligne commence. Touche une ligne pour reprendre à partir d’elle ; − et + ajustent d’un dixième de seconde.',
  apprendre: 'Cache les mots, écoute, et chante par-dessus. Touche une ligne cachée pour la voir. 🔁 répète la ligne qui joue.',
};

// depart : { lignes: [{ txt, t (marqué), ta (estimé par la grille) }] } ; chanson : { buf } ou null ;
// enregistrer(feuille) : à chaque changement ; reprendre() : les lignes de la grille, pour repartir de là.
export function ouvrirFeuille({ titre, depart, chanson, enregistrer, reprendre }) {
  let F = (depart?.lignes || []).map((l) => ({ txt: l.txt || '', t: l.t ?? null, ta: l.ta ?? null }));
  let mode = 'lire'; let cache = 1; const vues = new Set(); let pointeur = -1; const annuler = []; let boucle = null;
  const c = audio(); const D = chanson?.buf?.duration || 0;
  let src = null; let t0c = 0; let off = 0; let raf = 0; let courant = -1;
  const tps = (i) => F[i]?.t ?? F[i]?.ta ?? null;
  const pos = () => (src ? off + (c.currentTime - t0c) : off);
  const prochaine = (de) => { for (let i = Math.max(0, de); i < F.length; i++) if (F[i].txt.trim()) return i; return -1; };
  pointeur = (() => { const i = F.findIndex((l) => l.txt.trim() && l.t == null); return i >= 0 ? i : prochaine(0); })();

  const v = document.createElement('div'); v.className = 'fe'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', `Le texte de « ${titre} »`);
  v.innerHTML = `
    <div class="fe-feuille">
      <header class="fe-tete"><div><p class="fe-sur">📄 Le texte seul</p><h2>« ${esc(titre)} »</h2></div><button class="fe-x" data-f="fermer" aria-label="Fermer le texte">✕</button></header>
      <div class="fe-modes" role="tablist" aria-label="Ce que je fais avec le texte">
        <button role="tab" data-mode="lire">👀 Lire et écouter</button><button role="tab" data-mode="marquer">⏱ Marquer les temps</button><button role="tab" data-mode="apprendre">🧠 Apprendre</button>
      </div>
      <p class="fe-aide"></p>
      <div class="fe-cache" role="group" aria-label="Cacher les mots"><span>Les mots :</span><button data-cache="0">tous</button><button data-cache="1">la 1re lettre</button><button data-cache="2">rien</button></div>
      <ol class="fe-lignes"></ol>
      <div class="fe-edit" hidden><label for="fe-ta">Une ligne par ligne ; une ligne vide sépare les couplets.</label><textarea id="fe-ta" rows="12"></textarea>
        <div class="fe-row"><button class="btn primary" data-f="garder">Garder ce texte</button><button class="btn" data-f="annuler-edit">Annuler</button>${reprendre ? '<button class="btn" data-f="reprendre">↺ Reprendre les lignes de la grille</button>' : ''}</div></div>
      <footer class="fe-pied"><button class="btn small" data-f="modifier">✏️ Modifier le texte</button><button class="btn small" data-f="copier">⧉ Copier</button><button class="btn small" data-f="txt">⬇ Le texte (.txt)</button><button class="btn small" data-f="lrc" title="Le format des paroles synchronisées : beaucoup de lecteurs de musique l’affichent en karaoké">⬇ Avec les temps (.lrc)</button><button class="btn small" data-f="imprimer">🖨 Imprimer</button></footer>
    </div>
    <div class="fe-lecteur">${D ? `
      <button class="fe-play" data-f="play" aria-label="Écouter la chanson">▶</button>
      <span class="fe-pos">0:00</span><input type="range" class="fe-barre" min="0" max="${D.toFixed(2)}" step="0.05" value="0" aria-label="Où on est dans la chanson"><span class="fe-dur">${mmss(D)}</span>
      <button class="fe-boucle" data-f="boucle" aria-pressed="false" title="Répéter la ligne qui joue">🔁</button>
      <button class="fe-marque" data-f="marque">⏎ Maintenant!</button><button class="fe-ann" data-f="ann" aria-label="Annuler le dernier temps marqué">↶</button>`
    : '<p class="fe-sans">Pas de vraie chanson ici : choisis 🎧 ou ⭐ dans « La chanson » pour l’écouter et marquer les temps.</p>'}</div>`;
  document.body.append(v); document.body.classList.add('fe-ouverte');
  const q = (s) => v.querySelector(s);

  function sauver() { enregistrer?.({ lignes: F.map((l) => ({ txt: l.txt, t: l.t == null ? null : Math.round(l.t * 100) / 100, ta: l.ta == null ? null : Math.round(l.ta * 100) / 100 })), at: Date.now() }); }
  function rendre() {
    v.dataset.vue = mode;
    v.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    v.querySelectorAll('[data-cache]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.cache === cache)));
    q('.fe-aide').textContent = AIDES[mode];
    q('.fe-lignes').innerHTML = F.map((l, i) => {
      if (!l.txt.trim()) return '<li class="fe-strophe" aria-hidden="true"></li>';
      const t = tps(i); const montre = mode !== 'apprendre' || cache === 0 || vues.has(i);
      const txt = montre ? esc(l.txt) : esc(cache === 1 ? indice(l.txt) : vide(l.txt));
      return `<li class="fe-l${i === courant ? ' joue' : ''}${mode === 'marquer' && i === pointeur ? ' vise' : ''}${montre ? '' : ' cachee'}" data-i="${i}">
        <button class="fe-t${l.t == null ? ' estime' : ''}" data-ti="${i}" ${t == null || !D ? 'disabled' : ''} aria-label="${t == null ? 'Pas encore de temps' : `Écouter à partir de ${mmss(t)}`}">${mmss(t)}</button>
        <span class="fe-txt" data-li="${i}">${txt}</span>
        ${mode === 'marquer' && l.t != null ? `<span class="fe-nudge"><button data-n="-0.1" data-ni="${i}" aria-label="Un dixième de seconde plus tôt">−</button><button data-n="0.1" data-ni="${i}" aria-label="Un dixième de seconde plus tard">+</button></span>` : ''}</li>`;
    }).join('') || '<li class="fe-rien">Pas encore de paroles pour cette chanson : ✏️ Modifier le texte pour coller les tiennes.</li>';
    const m = q('.fe-marque'); if (m) { const L = F[pointeur]; m.innerHTML = L ? `⏎ Maintenant! <small>${esc(L.txt.slice(0, 32))}${L.txt.length > 32 ? '…' : ''}</small>` : '✓ Toutes marquées'; m.disabled = !L; }
  }
  function majBouton() { const b = q('.fe-play'); if (b) { b.textContent = src ? '■' : '▶'; b.setAttribute('aria-label', src ? 'Arrêter' : 'Écouter la chanson'); } }
  function arret(garder = true) { if (src) { const p = pos(); try { src.onended = null; src.stop(); } catch { /* déjà arrêtée */ } src = null; if (garder) off = Math.min(D, p); } cancelAnimationFrame(raf); majBouton(); }
  function jouer(de) {
    arret(false); if (!chanson?.buf) return; try { c.resume(); } catch { /* iOS */ }
    off = Math.max(0, Math.min(D - 0.05, de)); src = c.createBufferSource(); src.buffer = chanson.buf; src.connect(out());
    t0c = c.currentTime + 0.03; src.start(t0c, off); src.onended = () => { if (src) { src = null; off = 0; majBouton(); } };
    majBouton(); raf = requestAnimationFrame(tick);
  }
  function tick() {
    if (!src) return; const p = pos();
    if (boucle && p >= boucle.b) { jouer(boucle.a); return; }
    let k = -1; F.forEach((l, i) => { const t = tps(i); if (l.txt.trim() && t != null && t <= p + 0.05) k = i; });
    if (k !== courant) { courant = k; v.querySelectorAll('.fe-l').forEach((li) => li.classList.toggle('joue', +li.dataset.i === courant)); const li = v.querySelector(`.fe-l[data-i="${courant}"]`); if (li && mode !== 'marquer') li.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    const r = q('.fe-barre'); if (r && document.activeElement !== r) r.value = p.toFixed(2); const ps = q('.fe-pos'); if (ps) ps.textContent = mmss(p);
    raf = requestAnimationFrame(tick);
  }
  function marquer() {
    if (pointeur < 0 || !F[pointeur]) return; if (!src) { toast('Lance d’abord la chanson (▶), puis touche « Maintenant! » quand la ligne commence.'); return; }
    annuler.push([pointeur, F[pointeur].t]); F[pointeur].t = Math.max(0, pos() - 0.15); // ~ le temps de réaction
    pointeur = prochaine(pointeur + 1); sauver(); rendre();
  }
  function boucleLigne() {
    const i = courant >= 0 ? courant : prochaine(0); const a = tps(i); if (a == null) { toast('Cette ligne n’a pas encore de temps : marque-la d’abord.'); return; }
    let b = null; for (let j = i + 1; j < F.length; j++) if (F[j].txt.trim() && tps(j) != null) { b = tps(j); break; }
    boucle = { a: Math.max(0, a - 0.3), b: b ?? Math.min(D, a + 6) }; q('.fe-boucle').setAttribute('aria-pressed', 'true'); jouer(boucle.a);
  }
  function telecharger(texte, ext) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texte], { type: 'text/plain;charset=utf-8' })); a.download = `${titre}.${ext}`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(a); a.click(); a.remove(); }
  const texte = () => F.map((l) => l.txt).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  function fermer() { arret(); removeEventListener('keydown', clavier, true); v.remove(); document.body.classList.remove('fe-ouverte'); }
  function clavier(e) {
    if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
    if (e.target.closest?.('textarea, input')) return;
    if (mode === 'marquer' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); marquer(); }
  }
  addEventListener('keydown', clavier, true);

  v.addEventListener('click', (e) => {
    const md = e.target.closest('[data-mode]'); if (md) { mode = md.dataset.mode; if (mode !== 'apprendre') vues.clear(); rendre(); return; }
    const ch = e.target.closest('[data-cache]'); if (ch) { cache = +ch.dataset.cache; vues.clear(); rendre(); return; }
    const ti = e.target.closest('[data-ti]'); if (ti) { const t = tps(+ti.dataset.ti); if (t != null) { boucle = null; q('.fe-boucle')?.setAttribute('aria-pressed', 'false'); jouer(Math.max(0, t - 0.5)); } return; }
    const n = e.target.closest('[data-n]'); if (n) { const i = +n.dataset.ni; F[i].t = Math.max(0, F[i].t + +n.dataset.n); sauver(); rendre(); if (D) jouer(Math.max(0, F[i].t - 0.3)); return; }
    const li = e.target.closest('[data-li]');
    if (li) { const i = +li.dataset.li; if (mode === 'marquer') { pointeur = i; rendre(); const t = tps(i - 1 >= 0 ? prochainePrec(i) : i); if (D && t != null && !src) off = t; return; } if (mode === 'apprendre' && cache) { vues.has(i) ? vues.delete(i) : vues.add(i); rendre(); return; } const t = tps(i); if (t != null && D) jouer(Math.max(0, t - 0.5)); return; }
    const f = e.target.closest('[data-f]')?.dataset.f; if (!f) return;
    if (f === 'fermer') fermer();
    if (f === 'play') { if (src) arret(); else jouer(off >= D - 0.1 ? 0 : off); }
    if (f === 'marque') marquer();
    if (f === 'ann') { const u = annuler.pop(); if (u) { F[u[0]].t = u[1]; pointeur = u[0]; sauver(); rendre(); } }
    if (f === 'boucle') { if (boucle) { boucle = null; q('.fe-boucle').setAttribute('aria-pressed', 'false'); } else boucleLigne(); }
    if (f === 'modifier') { q('.fe-edit').hidden = false; q('.fe-lignes').hidden = true; q('#fe-ta').value = texte(); q('#fe-ta').focus(); }
    if (f === 'annuler-edit') { q('.fe-edit').hidden = true; q('.fe-lignes').hidden = false; }
    if (f === 'reprendre') { q('#fe-ta').value = (reprendre() || []).map((l) => l.txt).join('\n'); }
    if (f === 'garder') {
      // Les temps suivent leurs lignes : une ligne qu'on retrouve, mot pour mot, garde son temps.
      const anciens = new Map(); F.forEach((l) => { if (l.txt.trim()) { const k = l.txt.trim(); if (!anciens.has(k)) anciens.set(k, []); anciens.get(k).push(l); } });
      const neuves = q('#fe-ta').value.replace(/\r/g, '').split('\n').map((t) => t.trim());
      const grille = reprendre ? reprendre() : [];
      F = neuves.map((txt) => { const a = anciens.get(txt)?.shift(); if (a) return { ...a }; const g = grille.find((x) => x.txt.trim() === txt); return { txt, t: null, ta: g?.ta ?? null }; });
      q('.fe-edit').hidden = true; q('.fe-lignes').hidden = false; pointeur = (() => { const i = F.findIndex((l) => l.txt.trim() && l.t == null); return i >= 0 ? i : prochaine(0); })(); sauver(); rendre(); toast('Texte gardé.');
    }
    if (f === 'copier') navigator.clipboard?.writeText(texte()).then(() => toast('Le texte est copié.'), () => toast('Copie refusée par le navigateur : utilise ⬇ .txt.'));
    if (f === 'txt') telecharger(`${texte()}\n`, 'txt');
    if (f === 'lrc') {
      const avec = F.filter((l) => l.txt.trim() && (l.t ?? l.ta) != null); if (!avec.length) { toast('Aucune ligne n’a de temps : marque-les d’abord (⏱).'); return; }
      const sans = F.filter((l) => l.txt.trim()).length - avec.length;
      telecharger(`[ti:${titre}]\n${avec.map((l) => `${lrc(l.t ?? l.ta)}${l.txt}`).join('\n')}\n`, 'lrc');
      if (sans) toast(`${sans} ligne${sans > 1 ? 's' : ''} sans temps : laissée${sans > 1 ? 's' : ''} de côté dans le .lrc.`);
    }
    if (f === 'imprimer') { const m = mode; mode = 'lire'; rendre(); document.body.classList.add('fe-imprime'); setTimeout(() => { window.print(); document.body.classList.remove('fe-imprime'); mode = m; rendre(); }, 50); }
  });
  // En marquant : toucher une ligne y ramène la chanson (juste avant la ligne d'avant, pour l'entendre venir).
  function prochainePrec(i) { for (let j = i - 1; j >= 0; j--) if (F[j].txt.trim() && tps(j) != null) return j; return i; }
  v.addEventListener('input', (e) => { if (e.target.matches('.fe-barre')) { const t = +e.target.value; q('.fe-pos').textContent = mmss(t); if (src) jouer(t); else off = t; } });
  rendre();
  return fermer;
}
