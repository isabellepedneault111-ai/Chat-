// L'atelier de la rencontre : deux idées qui ne se sont jamais croisées, et l'exercice qui les fait se rencontrer, ici
// même. Un son et des mots : le son tourne, les mots s'affichent, on chante par-dessus. Deux sons : on écoute le passage
// de l'un à l'autre. Deux textes : leurs lignes, déjà tressées. Une image : on écrit ou on chante ce qu'elle fait voir.
// Ce qui naît va au mur, avec la mémoire de ses deux parents ; rien n'y va tant que rien n'est fait.
import { saveEntry, uploadAudio, audioURL, espace } from './espace.js';
import { toast, store } from './ui.js';
import { matiere } from './constellation.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const texteDe = (e) => (e.body || e.title || '').trim();
const titre = (e) => `« ${e.title || 'sans titre'} »`;

// Les paires écartées (« Pas pour nous ») : on ne les repropose plus, sur cet appareil.
export const nonMerci = () => new Set(store.get('rencontresNon', []));
export function refuser(a, b) { const s = nonMerci(); s.add(`${a.id}|${b.id}`); s.add(`${b.id}|${a.id}`); store.set('rencontresNon', [...s]); }

// Tresse deux textes, une ligne de chacun en alternance (les phrases servent de lignes si le texte n'en a pas).
const lignes = (t) => { const l = t.split(/\n+/).map((x) => x.trim()).filter(Boolean); return l.length > 1 ? l : t.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter(Boolean); };
function tresser(a, b) { const A = lignes(texteDe(a)); const B = lignes(texteDe(b)); const out = []; for (let i = 0; i < Math.max(A.length, B.length); i++) { if (A[i]) out.push(A[i]); if (B[i]) out.push(B[i]); } return out.join('\n'); }

// Ouvre l'atelier. existant : une rencontre déjà notée au mur, encore vide, qu'on vient enfin remplir.
export function ouvrirRencontre({ a, b, consigne, existant = null, onFait }) {
  const ka = matiere(a); const kb = matiere(b);
  const [son, mots] = ka === 'son' && kb !== 'son' ? [a, b] : kb === 'son' && ka !== 'son' ? [b, a] : [null, null];
  const sons = [a, b].filter((x) => matiere(x) === 'son'); const image = [a, b].find((x) => matiere(x) === 'image');
  const genre = image ? 'image' : sons.length === 2 ? 'sons' : son ? 'chanter' : 'tresser';
  const box = document.createElement('div'); box.className = 'rc-voile'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  // L'atelier s'ouvre tout de suite ; les sons et l'image arrivent ensuite.
  const lecteur = (x) => `<audio controls ${genre === 'chanter' ? 'loop' : ''} preload="auto" data-rc-son="${esc(x.id)}"></audio>`;
  const scene = {
    chanter: () => `<div class="rc-chanter"><p class="rc-k">1. Le son de ${esc(son?.author || '')} tourne en boucle</p>${son ? lecteur(son) : ''}<p class="rc-k">2. Chante ces mots dessus</p><blockquote class="rc-paroles">${esc(texteDe(mots || {})).replace(/\n/g, '<br>')}</blockquote><p class="muted small">Ce qui ne rentre pas, coupe-le. Mets des écouteurs : seule ta voix est enregistrée.</p></div>`,
    sons: () => `<div class="rc-sons"><p class="rc-k">Le passage de l’un à l’autre</p><button class="btn" data-rc="passage">▶ Les dix dernières secondes de ${esc(titre(sons[0]))}, puis ${esc(titre(sons[1]))}</button><div class="rc-deux">${sons.map((x) => `<div><small>${esc(titre(x))}</small>${lecteur(x)}</div>`).join('')}</div><p class="muted small">Le passage entre les deux, c’est peut-être le morceau. Joue-le à ton tour et enregistre-toi, ou écris ce qu’on garde.</p></div>`,
    tresser: () => `<div class="rc-tresser"><p class="rc-k">Une ligne de chacun, en alternance : retravaille, lis à voix haute</p></div>`,
    image: () => `<div class="rc-image">${image ? '<img data-rc-img alt="">' : ''}<div>${[a, b].filter((x) => x !== image).map((x) => (matiere(x) === 'son' ? lecteur(x) : `<blockquote class="rc-paroles">${esc(texteDe(x))}</blockquote>`)).join('')}<p class="muted small">Écris ce que l’image fait voir (la légende, le titre de la chanson qui vit entre les deux), ou chante ce qu’elle ferait entendre.</p></div></div>`,
  }[genre]();
  box.innerHTML = `<div class="rc-boite"><header><p class="rc-k">La rencontre</p><h2>${esc(titre(a))} × ${esc(titre(b))}</h2><p class="rc-consigne">${esc(consigne || '')}</p><button class="icon-btn" data-rc="fermer" aria-label="Fermer">✕</button></header>
    ${scene}
    <div class="rc-faire">
      <div class="rc-rec"><button class="btn primary" data-rc="rec">● M’enregistrer</button><span class="rc-prise"></span></div>
      <label class="rc-ecrit"><span>${genre === 'tresser' ? 'Le texte tressé' : 'Ou écris ce qui en naît'}</span><textarea class="input" rows="${genre === 'tresser' ? 8 : 3}" data-rc-texte>${genre === 'tresser' ? esc(tresser(a, b)) : ''}</textarea></label>
    </div>
    <footer><button class="btn primary big" data-rc="garder">Garder ce qui est né</button>${existant ? '' : '<button class="btn ghost" data-rc="non">Pas pour nous</button>'}<p class="muted small">Ce qui naît va au mur, avec ses deux parents. Rien n’y va tant que rien n’est fait.</p></footer></div>`;
  document.body.append(box);
  const q = (s) => box.querySelector(s);
  box.querySelectorAll('audio[data-rc-son]').forEach(async (el) => { const x = [a, b].find((y) => y.id === el.dataset.rcSon); try { el.src = await audioURL(x.audio); } catch { el.replaceWith(Object.assign(document.createElement('p'), { className: 'muted small', textContent: 'Le son n’a pas pu se charger.' })); } });
  if (image?.image) audioURL(image.image).then((u) => { const im = q('[data-rc-img]'); if (im) im.src = u; }).catch(() => q('[data-rc-img]')?.remove());
  let rec = null; let prise = null; let flux = null;
  const fermer = () => { try { rec?.state === 'recording' && rec.stop(); } catch { /* déjà arrêté */ } flux?.getTracks().forEach((t) => t.stop()); box.querySelectorAll('audio').forEach((x) => x.pause()); box.remove(); };
  box.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-rc]')?.dataset.rc; if (!g && e.target === box) { fermer(); return; }
    if (g === 'fermer') fermer();
    if (g === 'non') { refuser(a, b); fermer(); toast('Compris : cette rencontre ne reviendra plus.'); onFait?.(); }
    if (g === 'passage') { const [x, y] = box.querySelectorAll('.rc-deux audio'); if (!x || !y) return; y.pause(); y.currentTime = 0; x.currentTime = Math.max(0, (x.duration || 10) - 10); x.onended = () => { x.onended = null; y.play(); }; x.play(); }
    if (g === 'rec') {
      const b2 = e.target.closest('button');
      if (rec?.state === 'recording') { rec.stop(); return; }
      try {
        flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const bouts = []; rec = new MediaRecorder(flux);
        rec.ondataavailable = (ev) => ev.data.size && bouts.push(ev.data);
        rec.onstop = () => { flux.getTracks().forEach((t) => t.stop()); box.querySelectorAll('audio[data-rc-son]').forEach((x) => x.pause()); prise = new Blob(bouts, { type: rec.mimeType || 'audio/webm' }); b2.textContent = '● Une autre prise'; b2.classList.remove('on'); q('.rc-prise').innerHTML = `<audio controls src="${URL.createObjectURL(prise)}"></audio>`; };
        // Le son tourne pendant qu'on chante (dans les écouteurs) : on le relance depuis le début.
        if (genre === 'chanter') { const s = box.querySelector('audio[data-rc-son]'); if (s) { s.currentTime = 0; s.play().catch(() => {}); } }
        rec.start(); b2.textContent = '■ Arrêter'; b2.classList.add('on');
      } catch { toast('Le micro n’est pas accessible : autorise-le dans le navigateur, puis réessaie.'); }
    }
    if (g === 'garder') {
      const texte = q('[data-rc-texte]').value.trim();
      if (!prise && !texte) { toast('Rien encore à garder : une prise, ou quelques mots.'); return; }
      const bt = e.target.closest('button'); bt.disabled = true; bt.textContent = 'J’envoie…';
      try {
        const base = existant || { type: 'note', title: `${a.title || 'Sans titre'} × ${b.title || 'Sans titre'}`.slice(0, 200) };
        const data = { ...(existant?.data || {}), stage: existant?.data?.stage ?? 0, rencontre: [a.id, b.id], song: existant?.data?.song || a.data?.song || b.data?.song || '', consigne };
        const entree = { ...base, body: texte || consigne || '', data };
        if (prise) { entree.audio = await uploadAudio(prise); entree.type = 'audio'; if (son) data.over = son.id; } else if (genre === 'tresser' || texte) entree.type = existant?.type === 'audio' ? 'audio' : 'texte';
        const r = await saveEntry(entree, existant ? { baseUpdatedAt: existant.updatedAt } : undefined);
        fermer(); toast(`Une nouvelle idée est née. ${(espace.meta?.members || []).find((m) => m !== espace.me) || 'L’autre'} la voit déjà.`); onFait?.(r.entry || r.current);
      } catch (err) { toast(err.message); bt.disabled = false; bt.textContent = 'Garder ce qui est né'; }
    }
  });
  addEventListener('keydown', function esc2(ev) { if (ev.key === 'Escape') { fermer(); removeEventListener('keydown', esc2); } });
}
