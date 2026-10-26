// Mon matériel : le studio physique de Frog, redessiné. Chaque appareil (détecté ou ajouté à la main) a sa carte, son
// câble jusqu'à l'ordinateur, et une case pour l'activer. Ce qui est actif, le filet l'écoute ; les témoins s'allument
// quand le son ou les notes passent. On place les appareils comme dans la vraie pièce, en les glissant.
import { toast } from '../ui.js';
import { appareils, regler, ajouter, retirer, detecter, onMateriel, onActivite, SORTES, filet, tendre, relacher, niveau, DUREES, duree, choisirDuree, dureeTexte } from '../materiel.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Une silhouette par sorte d'appareil, dessinée au trait.
const DESSIN = {
  clavier: `<rect x="2" y="14" width="116" height="34" rx="3" class="m-corps"/><rect x="6" y="18" width="30" height="6" rx="1" class="m-ecran"/>${[...Array(14)].map((_, i) => `<rect x="${6 + i * 7.7}" y="28" width="7" height="17" class="m-blanche"/>`).join('')}${[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => `<rect x="${11 + i * 7.7}" y="28" width="4.4" height="10" class="m-noire"/>`).join('')}`,
  table: `<rect x="14" y="4" width="92" height="52" rx="4" class="m-corps"/>${[0, 1, 2, 3].map((c) => `${[0, 1, 2].map((r) => `<circle cx="${30 + c * 20}" cy="${12 + r * 8}" r="3" class="m-bouton"/>`).join('')}<rect x="${29 + c * 20}" y="38" width="2" height="14" class="m-rail"/><rect x="${26 + c * 20}" y="${42 - c * 2}" width="8" height="4" rx="1" class="m-fader"/>`).join('')}<rect x="20" y="40" width="3" height="12" class="m-led"/>`,
  interface: `<rect x="10" y="14" width="100" height="32" rx="5" class="m-corps"/><circle cx="30" cy="30" r="8" class="m-bouton"/><circle cx="52" cy="30" r="8" class="m-bouton"/><circle cx="76" cy="30" r="5" class="m-jack"/><circle cx="94" cy="30" r="5" class="m-jack"/><rect x="24" y="18" width="12" height="2" class="m-led"/>`,
  synthe: `<rect x="10" y="8" width="100" height="44" rx="4" class="m-corps"/>${[...Array(8)].map((_, i) => `<rect x="${18 + (i % 4) * 14}" y="${16 + Math.floor(i / 4) * 14}" width="11" height="11" rx="2" class="m-pad"/>`).join('')}<circle cx="88" cy="22" r="6" class="m-bouton"/><circle cx="88" cy="40" r="6" class="m-bouton"/>`,
  micro: `<rect x="50" y="4" width="20" height="30" rx="10" class="m-corps"/><path d="M54 14h12M54 20h12M54 26h12" class="m-grille"/><path d="M44 26a16 16 0 0 0 32 0M60 42v12M48 56h24" class="m-pied"/>`,
  ordi: `<rect x="22" y="6" width="76" height="40" rx="3" class="m-corps"/><rect x="27" y="11" width="66" height="30" class="m-ecran"/><path d="M12 50h96l-6 6H18z" class="m-corps"/><text x="60" y="30" text-anchor="middle" class="m-txt">FLIP</text>`,
  ecoute: `<path d="M30 40V30a30 30 0 0 1 60 0v10" class="m-pied"/><rect x="22" y="36" width="14" height="20" rx="5" class="m-corps"/><rect x="84" y="36" width="14" height="20" rx="5" class="m-corps"/>`,
  autre: `<rect x="20" y="12" width="80" height="36" rx="5" class="m-corps"/><circle cx="40" cy="30" r="6" class="m-bouton"/><rect x="56" y="26" width="34" height="8" rx="2" class="m-ecran"/>`,
};
const dessin = (s) => `<svg viewBox="0 0 120 60" class="m-svg" aria-hidden="true">${DESSIN[s] || DESSIN.autre}</svg>`;

export default {
  id: 'materiel',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Mon matériel</p>
        <h1>Ton studio, tel qu’il est branché.</h1>
        <p class="muted">Tout ce que l’ordinateur voit (claviers, table de mixage, interface, micros), plus ce que tu ajoutes à la main. Coche ce qui joue aujourd’hui : le filet l’écoute et en garde la dernière minute (ou 3, ou 5). Glisse les appareils pour les placer comme dans ta pièce.</p>
      </div></div>
      <section class="panel m-barre">
        <button class="btn primary" data-m="detecter">Détecter mon matériel</button>
        <button class="btn" data-m="ajout">+ Ajouter un appareil</button>
        <span class="m-filet"></span>
        <form class="m-ajout" hidden>
          <input name="nom" placeholder="Ex. : Xone:4D, Roland SV-1, Scarlett…" required aria-label="Nom de l’appareil">
          <select name="sorte" aria-label="Sorte">${Object.entries(SORTES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
          <select name="lie" aria-label="Branché à"><option value="">branché à l’ordinateur</option></select>
          <button class="btn primary">Ajouter</button>
        </form>
      </section>
      <section class="m-scene" aria-label="Le studio, vu d’en haut"><svg class="m-cables" aria-hidden="true"></svg><div class="m-cartes"></div></section>
      <section class="panel m-aide">
        <h2>Comment ça marche</h2>
        <ul>
          <li><b>Détecter</b> : le navigateur demande une fois l’accès au micro (sinon il cache le nom des appareils) et au MIDI. Chrome ou Edge sur l’ordinateur lisent le MIDI.</li>
          <li><b>Actif</b> : le filet garde la dernière minute de chaque entrée audio active, des notes MIDI des claviers actifs, et du son de l’app. Décoche ce qui ne joue pas : moins de bruit, moins de mémoire.</li>
          <li><b>Faire sonner</b> (claviers MIDI) : l’app joue ses notes au piano, pour un clavier muet ou au casque.</li>
          <li>Une table de mixage branchée en audio (la Xone:4D l’est par USB) apparaît comme une entrée ; un appareil qui passe par elle s’ajoute à la main, « branché à » la table.</li>
        </ul>
      </section>`;
    const q = (s) => el.querySelector(s);
    const scene = q('.m-scene'); const cartes = q('.m-cartes'); const cables = q('.m-cables');
    const pos = (a, i, n) => (a.x != null ? [a.x, a.y] : a.sorte === 'ordi' && a.k === 'app' ? [50, 50] : [50 + 36 * Math.cos((i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + 0.5), 50 + 31 * Math.sin((i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + 0.5)]);
    let liste = [];
    function rendre() {
      liste = appareils(); const autres = liste.filter((a) => a.k !== 'app');
      cartes.innerHTML = liste.map((a) => {
        const [x, y] = pos(a, autres.indexOf(a), autres.length);
        return `<article class="m-carte ${a.actif ? 'actif' : ''} ${a.branche ? '' : 'absent'}" data-k="${esc(a.k)}" style="left:${x}%;top:${y}%">
          <div class="m-poignee" title="Glisser pour placer">${dessin(a.sorte)}<i class="m-temoin"></i></div>
          <label class="m-actif"><input type="checkbox" data-mk="actif" ${a.actif ? 'checked' : ''}> <b>${esc(a.nom)}</b></label>
          <p class="m-tags">${a.k === 'app' ? '<span>ce que l’app joue</span>' : ''}${a.audio ? '<span>audio</span>' : ''}${a.midi ? '<span>MIDI</span>' : ''}${a.perso && !a.branche ? `<span>${a.lie ? 'par ' + esc(liste.find((b) => b.k === a.lie)?.nom || 'un autre') : 'ajouté à la main'}</span>` : ''}${!a.perso && !a.branche ? '<span class="m-off">pas branché</span>' : ''}</p>
          ${a.audio || a.k === 'app' ? '<span class="m-niveau"><i></i></span>' : ''}
          ${a.midi ? `<label class="m-petit"><input type="checkbox" data-mk="son" ${a.son ? 'checked' : ''}> faire sonner au piano</label>` : ''}
          <details class="m-regl"><summary>Régler</summary>
            <input data-mk="nom" value="${esc(a.nom)}" aria-label="Nom">
            <select data-mk="sorte" aria-label="Sorte">${Object.entries(SORTES).map(([k, l]) => `<option value="${k}" ${k === a.sorte ? 'selected' : ''}>${l}</option>`).join('')}</select>
            ${a.perso ? `<select data-mk="lie" aria-label="Branché à"><option value="">à l’ordinateur</option>${liste.filter((b) => b.k !== a.k).map((b) => `<option value="${esc(b.k)}" ${b.k === a.lie ? 'selected' : ''}>${esc(b.nom)}</option>`).join('')}</select><button class="btn small" data-mk="retirer">Retirer</button>` : ''}
          </details>
        </article>`;
      }).join('');
      q('.m-ajout [name=lie]').innerHTML = `<option value="">branché à l’ordinateur</option>${liste.map((b) => `<option value="${esc(b.k)}">branché à : ${esc(b.nom)}</option>`).join('')}`;
      q('.m-filet').innerHTML = filet.arme ? `<b class="m-tendu">● Le filet est tendu</b> : ${filet.pistes.size} source${filet.pistes.size > 1 ? 's' : ''} audio + MIDI. <button class="btn small" data-m="relacher">⏻ Arrêter le filet</button>` : '<button class="btn small" data-m="tendre">Tendre le filet</button>';
      q('.m-filet').insertAdjacentHTML('beforeend', ` <label class="m-duree">garder <select data-m="duree" aria-label="Durée gardée par le filet">${DUREES.map((d) => `<option value="${d}" ${d === duree() ? 'selected' : ''}>${d / 60} min</option>`).join('')}</select></label> <span class="muted small">${duree() > 60 ? `≈ ${Math.round(duree() / 60 * 11)} Mo de mémoire par source` : ''}</span>`);
      requestAnimationFrame(cabler);
    }
    // Les câbles : de chaque appareil vers l'ordinateur (ou vers l'appareil où il est branché).
    function cabler() {
      const r = scene.getBoundingClientRect(); cables.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      const centre = (k) => { const c = cartes.querySelector(`[data-k="${CSS.escape(k)}"] .m-poignee`); if (!c) return null; const b = c.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2]; };
      const hub = centre('app');
      cables.innerHTML = liste.filter((a) => a.k !== 'app').map((a) => {
        const p = centre(a.k); const vers = (a.lie && centre(a.lie)) || hub; if (!p || !vers) return '';
        const my = (p[1] + vers[1]) / 2 + 30;
        return `<path d="M${p[0]} ${p[1]} C${p[0]} ${my}, ${vers[0]} ${my}, ${vers[0]} ${vers[1]}" class="${a.actif ? 'on' : ''}" data-ck="${esc(a.k)}"/>`;
      }).join('');
    }
    rendre();
    const off1 = onMateriel(rendre);
    const off2 = onActivite((k, v) => {
      const t = cartes.querySelector(`[data-k="${CSS.escape(k)}"] .m-temoin`); const c = cables.querySelector(`[data-ck="${CSS.escape(k)}"]`);
      if (t && v) { t.classList.add('vif'); c?.classList.add('vif'); clearTimeout(t._t); t._t = setTimeout(() => { t.classList.remove('vif'); c?.classList.remove('vif'); }, 160); }
    });
    // Les niveaux audio, en direct, quand le filet écoute.
    let raf = 0;
    const niveaux = () => { cartes.querySelectorAll('.m-carte').forEach((c) => { const i = c.querySelector('.m-niveau i'); if (!i) return; const n = niveau(c.dataset.k); i.style.width = n <= 0 ? '0' : `${Math.max(0, Math.min(100, ((20 * Math.log10(n) + 60) / 60) * 100)).toFixed(0)}%`; }); raf = requestAnimationFrame(niveaux); };
    raf = requestAnimationFrame(niveaux);
    const ro = new ResizeObserver(cabler); ro.observe(scene);
    detecter();

    // Glisser une carte : seulement la poignée (le dessin), pour garder les cases faciles à cocher.
    let tire = null;
    cartes.addEventListener('pointerdown', (e) => { const p = e.target.closest('.m-poignee'); if (!p || matchMedia('(max-width: 640px)').matches) return; const c = p.closest('.m-carte'); tire = { c, id: e.pointerId }; p.setPointerCapture(e.pointerId); c.classList.add('tire'); e.preventDefault(); });
    cartes.addEventListener('pointermove', (e) => {
      if (!tire) return; const r = scene.getBoundingClientRect();
      tire.x = Math.max(6, Math.min(94, ((e.clientX - r.left) / r.width) * 100)); tire.y = Math.max(14, Math.min(86, ((e.clientY - r.top) / r.height) * 100));
      tire.c.style.left = `${tire.x}%`; tire.c.style.top = `${tire.y}%`; cabler();
    });
    cartes.addEventListener('pointerup', () => { if (!tire) return; tire.c.classList.remove('tire'); if (tire.x != null) regler(tire.c.dataset.k, { x: +tire.x.toFixed(1), y: +tire.y.toFixed(1) }); tire = null; });

    el.addEventListener('change', (e) => {
      if (e.target.dataset.m === 'duree') { choisirDuree(e.target.value); toast(`Le filet garde maintenant ${dureeTexte()}.`); return; }
      const k = e.target.closest('.m-carte')?.dataset.k; const m = e.target.dataset.mk; if (!k || !m) return;
      regler(k, { [m]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    });
    el.addEventListener('click', async (e) => {
      const mk = e.target.closest('[data-mk=retirer]'); if (mk) { retirer(mk.closest('.m-carte').dataset.k); return; }
      const a = e.target.closest('[data-m]')?.dataset.m; if (!a) return;
      if (a === 'detecter') { const l = await detecter({ demander: true }); toast(`${l.filter((x) => x.branche && x.k !== 'app').length} appareil(s) trouvé(s).`); }
      if (a === 'ajout') { const f = q('.m-ajout'); f.hidden = !f.hidden; if (!f.hidden) f.nom.focus(); }
      if (a === 'tendre') { try { await tendre(); } catch (err) { toast(err.message); } }
      if (a === 'relacher') relacher();
    });
    q('.m-ajout').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; ajouter(f.nom.value, f.sorte.value, f.lie.value); f.reset(); f.hidden = true; });
    q('.m-ajout [name=nom]').addEventListener('input', (e) => { const s = e.target.form.sorte; import('../materiel.js').then((m) => { s.value = m.deviner(e.target.value); }); });
    return () => { off1(); off2(); cancelAnimationFrame(raf); ro.disconnect(); };
  },
};
