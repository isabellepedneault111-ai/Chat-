// Mon studio : la pièce de Frog, redessinée pour lui ressembler. Le plancher, les murs, les meubles ; chaque appareil
// (détecté ou ajouté à la main) à sa place, à sa couleur, à sa taille, avec son câble jusqu'à l'ordinateur et une case
// pour l'activer. Ce qui est actif, le filet l'écoute ; les témoins s'allument quand le son ou les notes passent.
// Une photo de la vraie pièce peut servir de calque. Et l'autre peut voir le studio, s'il est partagé.
import { toast } from '../ui.js';
import { appareils, proposes, garder, ignorer, ignores, retablir, regler, ajouter, retirer, detecter, onMateriel, onActivite, SORTES, filet, tendre, relacher, niveau, DUREES, duree, choisirDuree, dureeTexte } from '../materiel.js';
import { pieceSVG, dessin, COULEURS, TEINTES, teinteG, MEUBLES, SOLS, MURS, piece, reglerPiece, ajouterMeuble, reglerMeuble, retirerMeuble, studioActuel, pos, ficheDe, reglerFiche, couleurDePhoto, restaurerDepuisProfil, photosDuStudio } from '../piece.js';
import { espace, profileOf, saveProfile, uploadImage, audioURL } from '../espace.js';
import { MEMBERS } from '../duo.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  id: 'materiel',
  mount(el) {
    const autre = (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';
    if (espace.connected && restaurerDepuisProfil()) setTimeout(() => toast('Ton studio est revenu tel que tu l’avais placé sur ton autre appareil.'), 400);
    // Une photo du serveur, posée dans une balise <img> dès qu'elle arrive.
    const poser = (root) => root.querySelectorAll('img[data-ph]').forEach(async (i) => { try { i.src = await audioURL(JSON.parse(i.dataset.ph)); } catch { i.remove(); } });
    // Chez l'autre : son studio en grand, tel qu'il l'a placé (lecture seule).
    const chez = decodeURIComponent((location.hash.match(/[?&]chez=([^&]+)/) || [])[1] || '');
    const st = chez && profileOf(chez)?.studio;
    // La bascule : mon studio, ou celui de l'autre. Toujours en haut, au même endroit.
    const qui = (c) => `<nav class="m-qui" aria-label="Quel studio"><a href="#/materiel" class="${c ? '' : 'on'}">Le mien</a><a href="#/materiel?chez=${encodeURIComponent(autre)}" class="${c ? 'on' : ''}">Celui de ${esc(autre)}</a></nav>`;
    if (chez && !st) {
      el.innerHTML = `${qui(true)}<div class="mod-head"><div><p class="eyebrow">Le studio de ${esc(chez)}</p><h1>Pas encore partagé.</h1>
        <p class="muted">Quand ${esc(chez)} aura recréé sa pièce et coché « Montrer mon studio », elle apparaîtra ici, telle qu’il l’a placée : les meubles, les appareils, les câbles, et les photos s’il le veut.</p></div></div>`;
      return () => {};
    }
    if (st) {
      const ap = st.appareils.filter((a) => !a.hub);
      el.innerHTML = `${qui(true)}<div class="mod-head"><div><p class="eyebrow">Le studio de ${esc(chez)}</p><h1>Là où naît la musique.</h1>
        <p class="muted">Tel que ${esc(chez)} l’a placé : la pièce, les meubles, les appareils, et les câbles jusqu’à l’ordinateur. En doré, ce qui est actif.</p></div></div>
        <section class="m-chez">${pieceSVG(st, { titre: `Le studio de ${chez}` })}${profileOf(chez)?.studioPhoto && profileOf(chez)?.studioPhotoPartagee !== false ? `<figure><img data-ph='${esc(JSON.stringify(profileOf(chez).studioPhoto))}' alt="La pièce, en photo"><figcaption>La vraie pièce, en photo</figcaption></figure>` : ''}</section>
        <section class="panel"><h2>Ce qu’il y a dans la pièce</h2><p class="m-liste">${ap.map((a) => { const f = ficheDe(chez, a.nom); return `<span class="${a.actif ? 'on' : ''}">${f.photo ? `<img data-ph='${esc(JSON.stringify(f.photo))}' alt="${esc(a.nom)}">` : dessin(a.sorte, a.couleur)}<b>${esc(a.nom)}</b>${f.marque || f.modele ? `<small>${esc([f.marque, f.modele].filter(Boolean).join(' · '))}</small>` : ''}${a.lie ? `<small>par ${esc(a.lie)}</small>` : ''}</span>`; }).join('')}</p>
        </section>`;
      poser(el); return () => {};
    }
    el.innerHTML = `${espace.connected ? qui(false) : ''}
      <div class="mod-head"><div>
        <p class="eyebrow">Mon studio</p>
        <h1>Ton studio, tel qu’il est vraiment.</h1>
        <p class="muted">Ta pièce, tes meubles, tes appareils à leur place, à leur couleur, à leur taille. Ce que l’ordinateur voit (claviers, table de mixage, interface, micros) arrive tout seul, et se retire d’un geste ; les micros virtuels (Teams, Zoom…) sont seulement proposés. le reste (enceintes, guitares, platines, ce qui passe par la table) s’ajoute à la main. Coche ce qui joue aujourd’hui : le filet l’écoute.</p>
      </div></div>
      <section class="panel m-barre">
        <button class="btn primary" data-m="detecter">Détecter mon matériel</button>
        <button class="btn" data-m="ajout">+ Un appareil</button>
        <label class="m-sel"><span>+ Un meuble</span><select data-m="meuble" aria-label="Ajouter un meuble ou un élément de décor"><option value="">choisir…</option>${Object.entries(MEUBLES).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <button class="btn" data-m="piece">Ma pièce</button>
        <span class="m-filet"></span>
        <div class="m-proposes"></div>
        <form class="m-ajout" hidden>
          <input name="nom" placeholder="Ex. : Technics SL-1200, KRK Rokit 5, Fender Jazz Bass…" required aria-label="Nom de l’appareil">
          <select name="sorte" aria-label="Sorte">${Object.entries(SORTES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
          <select name="lie" aria-label="Branché à"><option value="">branché à l’ordinateur</option></select>
          <button class="btn primary">Ajouter</button>
        </form>
        <div class="m-piece" hidden>
          <label class="m-sel"><span>Le plancher</span><select data-p="sol">${Object.entries(SOLS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
          <span class="m-sel"><span>Les murs</span><span class="m-murs">${Object.entries(MURS).map(([k, c]) => `<button type="button" class="m-mur" data-mur="${k}" style="--c:${c}" aria-label="Murs ${k}" title="${k}"></button>`).join('')}</span></span>
          <label class="btn small m-photo-b">Une photo de ma pièce, en calque<input type="file" accept="image/*" data-p="photo" hidden></label>
          <label class="m-sel m-opa"><span>calque</span><input type="range" min="0" max="90" data-p="opacite"></label>
          <button class="btn small" data-p="sansphoto">Retirer la photo</button>
          <span class="muted small">Cette photo sert de calque : glisse tes appareils et tes meubles par-dessus, à leur vraie place.</span>
        </div>
      </section>
      <div class="m-meubles-l" aria-label="Mes meubles : touche-en un pour le choisir, même s’il est caché sous un appareil"></div>
      <div class="m-wrap">
        <section class="m-scene" aria-label="Le studio, vu d’en haut"><img class="m-photo" alt=""><div class="m-meubles"></div><svg class="m-cables" aria-hidden="true"></svg><div class="m-cartes"></div></section>
        <aside class="m-fiche panel" hidden></aside>
      </div>
      <section class="panel m-partage"></section>
      <section class="panel m-aide">
        <h2>Comment ça marche</h2>
        <ul>
          <li><b>Placer</b> : glisse un appareil ou un meuble. Touche-le pour sa fiche : sa couleur, sa taille, son orientation, ce à quoi il est branché.</li>
          <li><b>Détecter</b> : le navigateur demande une fois l’accès au micro (sinon il cache le nom des appareils) et au MIDI. Chrome ou Edge sur l’ordinateur lisent le MIDI.</li>
          <li><b>Actif</b> : le filet garde la dernière minute de chaque entrée audio active, des notes MIDI des claviers actifs, et du son de l’app.</li>
          <li>Une table de mixage branchée en audio (la Xone:4D l’est par USB) apparaît comme une entrée ; un appareil qui passe par elle s’ajoute à la main, « branché à » la table : son câble va jusqu’à elle.</li>
        </ul>
      </section>`;
    const q = (s) => el.querySelector(s);
    const scene = q('.m-scene'); const cartes = q('.m-cartes'); const cables = q('.m-cables'); const meublesEl = q('.m-meubles'); const fiche = q('.m-fiche');
    let liste = []; let choix = null; // { t: 'a' | 'm', k }

    // ---------- Le partage : l'autre voit le studio ----------
    let dernier = ''; let minuterie = 0;
    // Partage mon studio avec l’autre, un instant après le dernier changement.
    function partager() {
      clearTimeout(minuterie);
      minuterie = setTimeout(async () => {
        if (!espace.connected || !espace.me || !piece().partage) return;
        const st = studioActuel(); const sig = JSON.stringify({ ...st, at: 0 }); if (sig === dernier) return; dernier = sig;
        try { await saveProfile(() => ({ studio: st })); } catch { /* hors ligne : ce sera pour la prochaine fois */ }
      }, 1500);
    }
    // La case « partager mon studio » et l’accès au studio de l’autre.
    function rendrePartage() {
      const p = piece(); const chez = profileOf(autre)?.studio;
      q('.m-partage').innerHTML = espace.connected ? `<label class="check"><input type="checkbox" data-p="partage" ${p.partage ? 'checked' : ''}> <b>Montrer mon studio à ${esc(autre)}</b> : il apparaît dans « Notre projet », à côté du sien (la pièce, les meubles, les appareils et leurs photos). Chacun garde son propre studio.</label>${profileOf(espace.me)?.studioPhoto ? `<label class="check"><input type="checkbox" data-p="partagephoto" ${profileOf(espace.me)?.studioPhotoPartagee !== false ? 'checked' : ''}> et la photo de la pièce</label>` : ''}${chez ? ` <a class="btn small" href="#/materiel?chez=${encodeURIComponent(autre)}">Voir le studio de ${esc(autre)} →</a>` : ''}` : '<p class="muted small">Connecte-toi à votre espace pour montrer ton studio à l’autre.</p>';
    }

    // ---------- La pièce ----------
    function rendrePiece() {
      // Mes meubles, en rangée : on les choisit d'ici même quand un appareil les couvre (le bureau sous l'ordi).
      { const ms = piece().meubles; const n = {}; q('.m-meubles-l').innerHTML = ms.length ? `<span>Mes meubles :</span>${ms.map((m) => { const nom = MEUBLES[m.sorte]?.[0] || m.sorte; n[nom] = (n[nom] || 0) + 1; return `<button class="m-ml ${choix?.t === 'm' && choix.k === m.id ? 'on' : ''}" data-choisir-m="${esc(m.id)}">${esc(nom)}${ms.filter((x) => x.sorte === m.sorte).length > 1 ? ` ${n[nom]}` : ''}</button>`; }).join('')}` : ''; }
      const p = piece();
      scene.className = `m-scene sol-${p.sol}`; scene.style.setProperty('--mur', MURS[p.mur] || MURS.braise);
      const ph = q('.m-photo'); const enLigne = espace.connected && profileOf(espace.me)?.studioPhoto;
      if (p.photo) { ph.src = p.photo; ph.hidden = false; ph.style.opacity = p.photoOpacite; }
      else if (enLigne) { ph.hidden = false; ph.style.opacity = p.photoOpacite; audioURL(enLigne).then((u) => { ph.src = u; }).catch(() => { ph.hidden = true; }); }
      else { ph.removeAttribute('src'); ph.hidden = true; }
      q('[data-p=sol]').value = p.sol; q('[data-p=opacite]').value = Math.round(p.photoOpacite * 100);
      el.querySelectorAll('[data-mur]').forEach((b) => b.classList.toggle('on', b.dataset.mur === p.mur));
      meublesEl.innerHTML = p.meubles.map((m) => `<div class="m-meuble ${choix?.t === 'm' && choix.k === m.id ? 'choisi' : ''}" data-mid="${esc(m.id)}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%;--r:${m.r || 0}deg" title="${esc(MEUBLES[m.sorte]?.[0] || '')}">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${teinteG(m)}</svg>${choix?.t === 'm' && choix.k === m.id ? '<i class="m-poignee-t" data-taille></i>' : ''}</div>`).join('');
    }

    // ---------- Les appareils ----------
    function rendre() {
      liste = appareils(); const autres = liste.filter((a) => a.k !== 'app');
      // Ce que l'ordinateur voit mais qui n'est pas (encore) dans le studio : on le garde, ou on l'ignore.
      const pr = proposes(); const ig = ignores();
      q('.m-proposes').innerHTML = (pr.length ? `<p class="m-pr-t">Micros virtuels détectés (visio, logiciels), pas dans ton studio :${pr.filter((a) => a.virtuel).length > 1 ? ' <button class="linklike small" data-pr="virtuels">ignorer tous les virtuels</button>' : ''}</p>${pr.map((a) => `<span class="m-pr ${a.virtuel ? 'virtuel' : ''}"><b>${esc(a.nom)}</b>${a.virtuel ? '<small>virtuel (visio, logiciel)</small>' : ''}<button class="btn small" data-pr="garder" data-k="${esc(a.k)}">+ Dans mon studio</button><button class="btn small ghost" data-pr="ignorer" data-k="${esc(a.k)}">Ignorer</button></span>`).join('')}` : '')
        + (ig.length ? `<details class="m-ig"><summary>Ignorés (${ig.length})</summary>${ig.map((a) => `<span>${esc(a.nom)} <button class="linklike small" data-pr="retablir" data-k="${esc(a.k)}">remettre</button></span>`).join('')}</details>` : '');
      cartes.innerHTML = liste.map((a) => {
        const [x, y] = pos(a, autres.indexOf(a), autres.length);
        return `<div class="m-app ${a.actif ? 'actif' : ''} ${a.branche ? '' : 'absent'} ${choix?.t === 'a' && choix.k === a.k ? 'choisi' : ''}" data-k="${esc(a.k)}" style="left:${x}%;top:${y}%;--t:${a.taille || 1};--r:${a.rot || 0}deg" tabindex="0" role="button" aria-label="${esc(a.nom)}${a.actif ? ', actif' : ''}">
          <div class="m-dessin">${(() => { const f = espace.connected ? ficheDe(espace.me, a.nom) : {}; return f.photo && f.surPlan ? `<img class="m-vraie" data-ph='${esc(JSON.stringify(f.photo))}' alt="">` : dessin(a.sorte, a.couleur); })()}</div><i class="m-temoin"></i>
          <span class="m-nom">${esc(a.nom)}</span>${a.audio || a.k === 'app' ? '<span class="m-niveau"><i></i></span>' : ''}</div>`;
      }).join('');
      q('.m-ajout [name=lie]').innerHTML = `<option value="">branché à l’ordinateur</option>${liste.map((b) => `<option value="${esc(b.k)}">branché à : ${esc(b.nom)}</option>`).join('')}`;
      q('.m-filet').innerHTML = filet.arme ? `<b class="m-tendu">● Le filet est tendu</b> : ${filet.pistes.size} source${filet.pistes.size > 1 ? 's' : ''} audio + MIDI. <button class="btn small" data-m="relacher">⏻ Arrêter le filet</button>` : '<button class="btn small" data-m="tendre">Tendre le filet</button>';
      q('.m-filet').insertAdjacentHTML('beforeend', ` <label class="m-duree">garder <select data-m="duree" aria-label="Durée gardée par le filet">${DUREES.map((d) => `<option value="${d}" ${d === duree() ? 'selected' : ''}>${d / 60} min</option>`).join('')}</select></label>`);
      poser(cartes); rendrePiece(); rendreFiche(); rendrePartage();
      requestAnimationFrame(cabler); partager();
    }

    // La fiche : tout ce qu'on règle sur l'appareil ou le meuble touché.
    function rendreFiche() {
      if (!choix) { fiche.hidden = true; return; }
      if (choix.t === 'm') {
        const m = piece().meubles.find((x) => x.id === choix.k); if (!m) { choix = null; fiche.hidden = true; return; }
        fiche.hidden = false;
        fiche.innerHTML = `<div class="m-fiche-t"><b>${esc(MEUBLES[m.sorte]?.[0])}</b><button class="icon-btn tiny" data-f="fermer" aria-label="Fermer">✕</button></div>
          <div class="field"><span>Couleur</span><div class="m-coul">${Object.entries(TEINTES).map(([k, [l, v]]) => `<button type="button" class="m-c m-t ${k === (m.teinte || '') ? 'on' : ''}" data-teinte="${k}" style="--t:${v || 'transparent'}" title="${l}" aria-label="${l}"></button>`).join('')}<label class="m-c m-libre" title="Une autre couleur" aria-label="Une autre couleur"><input type="color" data-teinte-libre value="${/^#/.test(m.teinte || '') ? m.teinte : '#8a5a32'}"></label></div></div>
          <div class="m-fiche-row"><button class="btn small" data-f="tourner">↻ Tourner</button><button class="btn small" data-f="dupliquer">Doubler</button><button class="btn small" data-f="retirerm">Retirer</button></div>
          <p class="muted small">Glisse-le pour le placer ; tire le coin pour l’agrandir.</p>`;
        return;
      }
      const a = liste.find((x) => x.k === choix.k); if (!a) { choix = null; fiche.hidden = true; return; }
      fiche.hidden = false; const fi = espace.connected ? ficheDe(espace.me, a.nom) : {};
      fiche.innerHTML = `<div class="m-fiche-t"><b>${esc(a.nom)}</b><button class="icon-btn tiny" data-f="fermer" aria-label="Fermer">✕</button></div>
        <p class="m-tags">${a.k === 'app' ? '<span>ce que l’app joue</span>' : ''}${a.audio ? '<span>audio</span>' : ''}${a.midi ? '<span>MIDI</span>' : ''}${a.perso && !a.branche ? `<span>${a.lie ? 'par ' + esc(liste.find((b) => b.k === a.lie)?.nom || 'un autre') : 'ajouté à la main'}</span>` : ''}${!a.perso && !a.branche ? '<span class="m-off">pas branché</span>' : ''}</p>
        <label class="check"><input type="checkbox" data-mk="actif" ${a.actif ? 'checked' : ''}> Actif aujourd’hui (le filet l’écoute)</label>
        ${a.midi ? `<label class="check"><input type="checkbox" data-mk="son" ${a.son ? 'checked' : ''}> Faire sonner au piano (clavier muet, casque)</label>` : ''}
        <div class="m-fphoto">${fi.photo ? `<img data-ph='${esc(JSON.stringify(fi.photo))}' alt="${esc(a.nom)}">` : `<span class="m-fphoto-vide">${dessin(a.sorte, a.couleur)}</span>`}
          <label class="btn small">${fi.photo ? 'Changer la photo' : '📷 Sa photo'}<input type="file" accept="image/*" capture="environment" data-fi="photo" hidden></label>
          ${fi.photo ? `<label class="check small"><input type="checkbox" data-fi="surPlan" ${fi.surPlan ? 'checked' : ''}> sa photo sur le plan</label>` : ''}</div>
        <div class="m-fiche-row"><label class="field"><span>Marque</span><input data-fi="marque" value="${esc(fi.marque || '')}" placeholder="Roland, Technics…"></label><label class="field"><span>Modèle</span><input data-fi="modele" value="${esc(fi.modele || '')}" placeholder="SV-1, SL-1200…"></label></div>
        <label class="field"><span>Nom</span><input data-mk="nom" value="${esc(a.nom)}"></label>
        <label class="field"><span>Sorte</span><select data-mk="sorte">${Object.entries(SORTES).map(([k, l]) => `<option value="${k}" ${k === a.sorte ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="field"><span>Couleur</span><div class="m-coul">${Object.entries(COULEURS).map(([k, [l, v]]) => `<button type="button" class="m-c ${k === (a.couleur || 'noir') ? 'on' : ''}" data-coul="${k}" style="${v}" title="${l}" aria-label="${l}"></button>`).join('')}</div></div>
        <label class="field"><span>Taille</span><input type="range" min="50" max="200" step="5" data-mk="taille" value="${Math.round((a.taille || 1) * 100)}"></label>
        <div class="m-fiche-row"><button class="btn small" data-f="tourner">↻ Tourner</button>${a.k !== 'app' ? `<select data-mk="lie" aria-label="Branché à"><option value="">branché à l’ordinateur</option>${liste.filter((b) => b.k !== a.k && b.k !== 'app').map((b) => `<option value="${esc(b.k)}" ${b.k === a.lie ? 'selected' : ''}>branché à : ${esc(b.nom)}</option>`).join('')}</select>` : ''}</div>
        ${a.k !== 'app' ? `<button class="btn small" data-mk="retirer">${a.perso ? 'Retirer l’appareil' : 'Retirer de mon studio'}</button>${a.perso ? '' : '<span class="muted small"> (il ne reviendra pas tout seul ; « Ignorés » le remet)</span>'}` : ''}`;
      if (!espace.connected) fiche.querySelector('.m-fphoto').innerHTML = '<p class="muted small">Connecte-toi à votre espace pour donner une photo à tes appareils.</p>';
      poser(fiche);
    }

    // Les câbles : de chaque appareil vers l'ordinateur (ou vers l'appareil où il est branché).
    function cabler() {
      const r = scene.getBoundingClientRect(); cables.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      const centre = (k) => { const c = cartes.querySelector(`[data-k="${CSS.escape(k)}"] .m-dessin`); if (!c) return null; const b = c.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2]; };
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
    const niveaux = () => { cartes.querySelectorAll('.m-app').forEach((c) => { const i = c.querySelector('.m-niveau i'); if (!i) return; const n = niveau(c.dataset.k); i.style.width = n <= 0 ? '0' : `${Math.max(0, Math.min(100, ((20 * Math.log10(n) + 60) / 60) * 100)).toFixed(0)}%`; }); raf = requestAnimationFrame(niveaux); };
    raf = requestAnimationFrame(niveaux);
    const ro = new ResizeObserver(cabler); ro.observe(scene);
    detecter();

    // Glisser : un appareil ou un meuble se déplace ; le coin d'un meuble l'agrandit ; un simple toucher ouvre sa fiche.
    let tire = null;
    scene.addEventListener('pointerdown', (e) => {
      const app = e.target.closest('.m-app'); const mb = e.target.closest('.m-meuble'); const t = e.target.closest('[data-taille]');
      if (!app && !mb) { if (choix) { choix = null; rendre(); } return; }
      const n = app || mb; const r = scene.getBoundingClientRect();
      tire = { n, t: app ? 'a' : 'm', k: app ? app.dataset.k : mb.dataset.mid, x0: e.clientX, y0: e.clientY, bouge: false, taille: !!t, l0: parseFloat(n.style.left), t0: parseFloat(n.style.top), w0: parseFloat(n.style.width), h0: parseFloat(n.style.height), r };
      n.setPointerCapture(e.pointerId); e.preventDefault();
    });
    scene.addEventListener('pointermove', (e) => {
      if (!tire) return; const { r } = tire; const dx = ((e.clientX - tire.x0) / r.width) * 100; const dy = ((e.clientY - tire.y0) / r.height) * 100;
      if (!tire.bouge && Math.hypot(e.clientX - tire.x0, e.clientY - tire.y0) < 5) return; tire.bouge = true; tire.n.classList.add('tire');
      if (tire.taille) { tire.w = Math.max(3, Math.min(95, tire.w0 + dx * 2)); tire.h = Math.max(2, Math.min(95, tire.h0 + dy * 2)); tire.n.style.width = `${tire.w}%`; tire.n.style.height = `${tire.h}%`; return; }
      tire.x = Math.max(3, Math.min(97, tire.l0 + dx)); tire.y = Math.max(4, Math.min(96, tire.t0 + dy));
      tire.n.style.left = `${tire.x}%`; tire.n.style.top = `${tire.y}%`; if (tire.t === 'a') cabler();
    });
    scene.addEventListener('pointerup', () => {
      if (!tire) return; const t = tire; tire = null; t.n.classList.remove('tire');
      if (!t.bouge) { choix = { t: t.t, k: t.k }; rendre(); return; }
      if (t.t === 'a' && t.x != null) regler(t.k, { x: +t.x.toFixed(1), y: +t.y.toFixed(1) });
      if (t.t === 'm') { reglerMeuble(t.k, t.taille ? { w: +t.w.toFixed(1), h: +t.h.toFixed(1) } : { x: +t.x.toFixed(1), y: +t.y.toFixed(1) }); rendre(); }
    });
    cartes.addEventListener('keydown', (e) => { const a = e.target.closest('.m-app'); if (a && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choix = { t: 'a', k: a.dataset.k }; rendre(); } });

    // Applique un changement fait dans la fiche d’un appareil (nom, photo, branchement…).
    async function ficheChange(champ, input) {
      const a = liste.find((x) => x.k === choix.k); if (!a) return;
      try {
        if (champ === 'photo') {
          const f = input.files[0]; if (!f) return; toast('J’envoie la photo…');
          const [image, couleur] = await Promise.all([uploadImage(f), couleurDePhoto(f).catch(() => null)]);
          await reglerFiche(a.nom, { photo: image }); if (couleur) regler(a.k, { couleur });
          toast(couleur ? `Photo gardée. La couleur sur le plan suit la photo : ${COULEURS[couleur][0].toLowerCase()}.` : 'Photo gardée.');
        } else await reglerFiche(a.nom, { [champ]: input.type === 'checkbox' ? input.checked : input.value.trim() });
        rendre();
      } catch (err) { toast(err.message || 'La photo n’a pas pu partir.'); }
    }
    // Une photo de la pièce, réduite (elle reste légère dans l'appareil).
    async function photo(f) {
      const img = await createImageBitmap(f); const k = Math.min(1, 1100 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      try { reglerPiece({ photo: c.toDataURL('image/jpeg', 0.7) }); } catch { toast('Cette photo est trop lourde pour être gardée ici.'); return; }
      rendrePiece(); toast('La photo est en calque : glisse tes appareils et tes meubles par-dessus.');
      if (espace.connected) { try { const image = await uploadImage(f); await saveProfile(() => ({ studioPhoto: image })); rendrePartage(); } catch { /* elle reste en calque ici */ } }
    }

    el.addEventListener('change', (e) => {
      const d = e.target.dataset;
      if (d.m === 'duree') { choisirDuree(e.target.value); toast(`Le filet garde maintenant ${dureeTexte()}.`); return; }
      if (d.m === 'meuble' && e.target.value) { const m = ajouterMeuble(e.target.value); e.target.value = ''; choix = { t: 'm', k: m.id }; rendre(); return; }
      if (d.p === 'sol') { reglerPiece({ sol: e.target.value }); rendrePiece(); partager(); return; }
      if (d.p === 'photo' && e.target.files[0]) { photo(e.target.files[0]); e.target.value = ''; return; }
      if (d.p === 'partage') { reglerPiece({ partage: e.target.checked }); if (e.target.checked) { dernier = ''; partager(); toast(`${autre} verra ton studio sur son accueil.`); } else saveProfile(() => ({ studio: null })).catch(() => {}); return; }
      if (d.fi && choix?.t === 'a') { ficheChange(d.fi, e.target); return; }
      if (d.p === 'partagephoto') { saveProfile(() => ({ studioPhotoPartagee: e.target.checked })).catch(() => {}); return; }
      const m = d.mk; if (!choix || choix.t !== 'a' || !m) return;
      const v = e.target.type === 'checkbox' ? e.target.checked : m === 'taille' ? +e.target.value / 100 : e.target.value;
      regler(choix.k, { [m]: v });
    });
    el.addEventListener('input', (e) => {
      if (e.target.dataset.teinteLibre != null && choix?.t === 'm') { reglerMeuble(choix.k, { teinte: e.target.value }); rendrePiece(); clearTimeout(e.target._t); e.target._t = setTimeout(partager, 600); return; }
      if (e.target.dataset.p === 'opacite') { const o = +e.target.value / 100; q('.m-photo').style.opacity = o; clearTimeout(e.target._t); e.target._t = setTimeout(() => reglerPiece({ photoOpacite: o }), 200); }
      if (e.target.dataset.mk === 'taille' && choix?.t === 'a') cartes.querySelector(`[data-k="${CSS.escape(choix.k)}"]`)?.style.setProperty('--t', +e.target.value / 100);
    });
    el.addEventListener('click', async (e) => {
      const mur = e.target.closest('[data-mur]'); if (mur) { reglerPiece({ mur: mur.dataset.mur }); rendrePiece(); partager(); return; }
      const coul = e.target.closest('[data-coul]'); if (coul && choix?.t === 'a') { regler(choix.k, { couleur: coul.dataset.coul }); return; }
      const cm = e.target.closest('[data-choisir-m]'); if (cm) { choix = { t: 'm', k: cm.dataset.choisirM }; rendrePiece(); rendre(); fiche.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
      const tei = e.target.closest('[data-teinte]'); if (tei && choix?.t === 'm') { reglerMeuble(choix.k, { teinte: tei.dataset.teinte || undefined }); rendrePiece(); rendre(); partager(); return; }
      const pr = e.target.closest('[data-pr]'); if (pr) { if (pr.dataset.pr === 'virtuels') proposes().filter((a) => a.virtuel).forEach((a) => ignorer(a.k)); else ({ garder, ignorer, retablir })[pr.dataset.pr](pr.dataset.k); return; }
      if (e.target.closest('[data-mk=retirer]') && choix) { retirer(choix.k); choix = null; return; }
      const f = e.target.closest('[data-f]')?.dataset.f;
      if (f === 'fermer') { choix = null; rendre(); return; }
      if (f === 'tourner' && choix) {
        if (choix.t === 'a') { const a = liste.find((x) => x.k === choix.k); regler(choix.k, { rot: ((a?.rot || 0) + 45) % 360 }); }
        else { const m = piece().meubles.find((x) => x.id === choix.k); reglerMeuble(choix.k, { r: ((m?.r || 0) + 90) % 360 }); rendre(); }
        return;
      }
      if (f === 'retirerm' && choix) { retirerMeuble(choix.k); choix = null; rendre(); return; }
      if (f === 'dupliquer' && choix) { const m = piece().meubles.find((x) => x.id === choix.k); const n = ajouterMeuble(m.sorte); reglerMeuble(n.id, { w: m.w, h: m.h, r: m.r, x: Math.min(95, m.x + 4), y: Math.min(95, m.y + 4) }); choix = { t: 'm', k: n.id }; rendre(); return; }
      if (e.target.closest('[data-p=sansphoto]')) { reglerPiece({ photo: null }); if (espace.connected) saveProfile(() => ({ studioPhoto: null })).then(rendrePiece).catch(() => {}); rendrePiece(); return; }
      const a = e.target.closest('[data-m]')?.dataset.m; if (!a || e.target.tagName === 'SELECT') return;
      if (a === 'detecter') { const l = await detecter({ demander: true }); toast(`${l.filter((x) => x.branche && x.k !== 'app').length} appareil(s) trouvé(s).`); }
      if (a === 'ajout') { const fo = q('.m-ajout'); fo.hidden = !fo.hidden; if (!fo.hidden) fo.nom.focus(); }
      if (a === 'piece') { const p = q('.m-piece'); p.hidden = !p.hidden; e.target.classList.toggle('on', !p.hidden); }
      if (a === 'tendre') { try { await tendre(); } catch (err) { toast(err.message); } }
      if (a === 'relacher') relacher();
    });
    q('.m-ajout').addEventListener('submit', (e) => { e.preventDefault(); const fo = e.target; const k = ajouter(fo.nom.value, fo.sorte.value, fo.lie.value); fo.reset(); fo.hidden = true; choix = { t: 'a', k }; rendre(); });
    q('.m-ajout [name=nom]').addEventListener('input', (e) => { const s = e.target.form.sorte; import('../materiel.js').then((m) => { s.value = m.deviner(e.target.value); }); });
    return () => { off1(); off2(); cancelAnimationFrame(raf); ro.disconnect(); clearTimeout(minuterie); };
  },
};
