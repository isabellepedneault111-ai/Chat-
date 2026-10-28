// Écrire : notre journal commun au centre, et autour, les chemins de l'écriture
// (séance d’atelier, grimoire, paroles). Une entrée peut aller au mur ou au coffre d'un geste.
import { espace, onEspace, saveEntry } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { togglePerle } from './coffre.js';
import { grooveHTML, bindGroove } from '../groove.js';
import { uploadAudio, audioURL } from '../espace.js';
import { rituel } from '../rituel.js';
import { SOURCES, tirer, carteDeLaSemaine } from '../sources.js';
import { CARTES } from './jeux.js';
import { logPractice } from '../traces.js';

// Une invitation par jour, la même pour les deux : on écrit sur la même porte d'entrée.
const INVITES = [
  'Ce que j’ai entendu aujourd’hui et que personne n’a remarqué.',
  'Une couleur pour ma semaine, et pourquoi.',
  'Le moment où j’ai eu envie de chanter.',
  'Une phrase entendue, volée, gardée.',
  'Ce qui me manque quand on n’est pas ensemble.',
  'Un lieu où je voudrais qu’on joue.',
  'Ce que mon corps savait avant moi aujourd’hui.',
  'Une chose que je n’ose pas encore te faire écouter.',
  'Le son de ma rue, ce soir.',
  'Ce que la musique a réparé cette semaine.',
  'Une image pour notre prochain refrain.',
  'Ce que je garderais si je ne pouvais garder qu’une seconde de la journée.',
];
// Des mots qui tombent pendant le flux : de quoi rebondir sans réfléchir.
const MOTS_FLUX = ['marée', 'néon', 'genoux', 'braise', 'fenêtre', 'sel', 'autoroute', 'ta voix', 'minuit', 'givre', 'cassé', 'velours', 'le fleuve', 'quai', 'promesse', 'poussière', 'ciel bas', 'mains', 'chaleur', 'radio', 'silence', 'lumière', 'été', 'rouille', 'battement'];
const today = () => new Date().toISOString().slice(0, 10);
// Écrire sur la musique de Frog : ses pièces, prêtes à recevoir des mots.
// La boucle trouvée par l'oreille s'ajoute aux choix, le temps de la séance.
const piecesAvecOreille = () => [...PIECES, ...(window.__flipFond ? [['oreille', window.__flipFond.nom, window.__flipFond.url]] : [])];
const PIECES = [['beat', 'Un beat du labo', ''], ['projet1', 'Projet 1 de Frog, après la pause', 'data/sons/frog-visite.mp3'], ['joywalk', 'Joy Walk de Frog', 'data/sons/frog-joywalk-complet.mp3']];
const inviteDu = (d = new Date()) => INVITES[Math.floor(d.getTime() / 864e5) % INVITES.length];
const CHEMINS = [
  ['atelier', 'Une séance d’atelier', '25 min guidées : délier, écrire par les sens, une contrainte, garder ce qui brille.'],
  ['jeux', 'Le grimoire', 'Notre champ de mots, une carte tirée, le cadavre exquis.'],
  ['placer', 'Placer mes paroles', 'Sur une pièce de Frog : où mettre les accents, combien de syllabes, quelle note chanter.'],
  ['paroles', 'Nos paroles', 'Sculpter les textes pour qu’ils se chantent : syllabes, rimes.'],
];

export default {
  id: 'ecrire',
  mount(el) {
    let sig = '';
    let stopGroove = null;
    let flux = null; let yaourt = null; let yaourtBlob = null;
    const sur = () => el.querySelector('[data-e=sur]')?.value || 'beat';
    // Lance le fond choisi : le beat de FLIP, ou une pièce de Frog.
    const fond = () => {
      if (sur() === 'beat') { const play = el.querySelector('.groove [data-g=play]'); if (play && !el.querySelector('.groove.on')) play.click(); return; }
      const a = el.querySelector('.flux-piece audio'); a.loop = true; a.play().catch(() => {});
    };
    const coupeFond = () => { el.querySelector('.groove.on [data-g=play]')?.click(); el.querySelector('.flux-piece audio')?.pause(); };
    // Le flux : 5 minutes, un mot qui tombe toutes les 20 secondes, pas d'effacement si on le veut.
    function startFlux() {
      if (el.querySelector('[data-e=musique]')?.checked) fond(); // la musique seulement si on la veut
      const ta = el.querySelector('.flux-text'); ta.focus();
      const t0 = Date.now(); const total = 300;
      const mot = () => { const m = el.querySelector('.flux-mot'); if (m) { m.textContent = MOTS_FLUX[Math.floor(Math.random() * MOTS_FLUX.length)]; m.classList.remove('in'); void m.offsetWidth; m.classList.add('in'); } };
      mot();
      flux = setInterval(() => {
        const left = total - Math.floor((Date.now() - t0) / 1000);
        const tt = el.querySelector('.flux-time');
        if (!tt) { clearInterval(flux); flux = null; return; }
        tt.textContent = left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'fini';
        if (left % 20 === 0) mot();
        if (left <= 0) { clearInterval(flux); flux = null; coupeFond(); toast('Cinq minutes. Relis-toi : souligne une ligne vraie.'); }
      }, 1000);
    }
    // Lance ou arrête l’enregistrement du mumble (chanter des sons sans mots sur le beat).
    async function toggleYaourt(btn) {
      if (yaourt) { yaourt.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = []; const r = new MediaRecorder(stream);
        r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        r.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          yaourtBlob = new Blob(chunks, { type: r.mimeType || 'audio/webm' }); yaourt = null;
          btn.textContent = '● Refaire le mumble'; btn.classList.remove('on');
          el.querySelector('.flux-yaourt').innerHTML = `<audio controls src="${URL.createObjectURL(yaourtBlob)}"></audio><small>Réécoute : quels sons ressemblent déjà à des mots? Écris-les.</small>`;
        };
        fond();
        r.start(); yaourt = r;
        btn.textContent = '■ Arrêter le mumble'; btn.classList.add('on');
        setTimeout(() => yaourt === r && r.stop(), 90000);
      } catch { toast('Micro refusé : autorise-le dans la barre d’adresse.'); }
    }
    // L'intention d'écriture : l'invitation du jour, ou une carte pigée au grimoire (le rituel, sans son par défaut).
    // Arrivée par « Écrire dessus » (la carte de la semaine, dans Aujourd'hui) : elle est déjà posée.
    let carte = /[?&]carte=semaine/.test(location.hash) ? carteDeLaSemaine(CARTES) : null;
    const autreNom = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';
    const intentionHTML = () => (carte
      ? `<p class="ec-invite ec-carte"><small>${carte.semaine ? 'La carte de la semaine, la même pour vous deux' : 'Ta carte'} · ${esc(carte.source)}</small><b>${esc(carte.mots.join(' · '))}</b> ${esc(carte.consigne)}</p>
        <p class="ec-int-b">${carte.semaine ? '' : `<button class="btn small" data-e="lancer-carte">⇄ Lancer cette carte à ${esc(autreNom())}</button> `}<button class="linklike" data-e="piger">Piger une autre carte</button> · ${carte.semaine ? '' : '<button class="linklike" data-e="semaine">La carte de la semaine</button> · '}<button class="linklike" data-e="invite">L’invitation du jour</button></p>`
      : `<p class="ec-invite"><small>L’invitation du jour</small>${esc(inviteDu())}</p><p class="ec-int-b"><button class="btn small" data-e="piger">🂠 Piger une carte du grimoire</button> <button class="btn small ghost" data-e="semaine">La carte de la semaine</button></p>`);
    function piger() {
      // Une source au hasard (les arcanes, ce qui nous touche, nos peurs, une contrainte, ou les consignes du grimoire).
      const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const tirages = tirer(src.id, [], CARTES);
      rituel(tirages, { kind: src.id, words: tirages.flatMap((t) => t.mots), theme: src.id === 'mots' ? 'Le grimoire' : src.nom, note: src.note, onAccept: (t) => {
        carte = { source: src.id === 'mots' ? 'Le grimoire' : src.nom, nom: t.card.nom, consigne: t.card.consigne, mots: t.mots };
        logPractice('grimoire', 1, { carte: t.card.nom, mot: t.mots.join(', ') });
        el.querySelector('.ec-intention').innerHTML = intentionHTML(); el.querySelector('.ec-text')?.focus();
      } });
    }
    // Monte la page Écrire : les chemins, la page du jour, écrire sur le beat, le journal.
    function shell() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: shell }); return; }
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Écrire</p>
          <h1>Notre journal</h1>
          <p class="muted">Écrire chacun de son côté, et se lire. Ce qui a de la vie part au mur ou au coffre d’un geste.</p>
        </div></div>
        <nav class="ec-chemins" aria-label="Les chemins de l’écriture">${CHEMINS.map(([h, t, d]) => `<a href="#/${h}"><b>${t}</b><small>${d}</small></a>`).join('')}<button class="ec-chemin-flip" data-e="aller-idees"><b>Nos idées pour le labo</b><small>Ce qu’on aimerait changer ou ajouter dans l’app : on le note ici, Zaza le transmet.</small></button></nav>
        <section class="ec-new">
          <div class="ec-intention">${intentionHTML()}</div>
          <textarea class="input ec-text" rows="5" placeholder="Écris ce qui vient. Rien ne sera jugé."></textarea>
          <p class="mo-astuce">Double-clique un mot : ses rimes (de la plus riche à la plus simple) et ses synonymes.</p>
          <div class="ec-row"><button class="btn primary" data-e="save">Dans le journal</button><span class="muted small">${esc((espace.meta.members || MEMBERS).find((m) => m !== espace.me) || '')} le verra en ouvrant l’app.</span></div>
        </section>
        <section class="ec-flux">
          <div class="ec-flux-head">
            <h2>Écrire sur le beat</h2>
            <p>Pour trouver la mélodie avant les mots, comme en studio : <b>1.</b> la musique joue, tu chantes des sons sans mots (le <b>mumble</b>) ; <b>2.</b> tu réécoutes : certains sons ressemblent déjà à des mots ; <b>3.</b> tu écris de vrais mots qui gardent ce rythme. Pour poser une ligne déjà écrite sur la musique : <a href="#/placer">Placer mes paroles →</a></p>
          </div>
          <label class="flux-sur"><span>Écrire sur</span><select data-e="sur">${piecesAvecOreille().map(([id, nom]) => `<option value="${id}" ${window.__flipFond && id === 'oreille' ? 'selected' : ''}>${esc(nom)}</option>`).join('')}</select></label>
          <div class="flux-beat">${grooveHTML()}</div>
          <div class="flux-piece" hidden><audio controls preload="none"></audio><small>La pièce joue en boucle pendant le flux et le mumble.</small></div>
          <div class="flux-row">
            <button class="btn primary" data-e="flux">▶ 5 minutes de flux</button>
            <button class="btn" data-e="yaourt">● Mumble : chanter sans mots</button>
            <label class="check"><input type="checkbox" data-e="noback" checked> Sans effacer</label>
            <label class="check"><input type="checkbox" data-e="musique"> ♪ Avec la musique</label>
            <span class="flux-time mono"></span>
          </div>
          <p class="flux-mot" aria-live="polite"></p>
          <textarea class="input flux-text" rows="7" placeholder="Écris tout ce qui vient, au rythme. Pas de retour en arrière : on corrige plus tard."></textarea>
          <div class="flux-yaourt"></div>
          <div class="ec-row"><button class="btn" data-e="flux-save">Dans le journal</button><span class="muted small">Le texte et le mumble partent ensemble : ${esc((espace.meta.members || MEMBERS).find((m) => m !== espace.me) || '')} pourra chanter dessus.</span></div>
          <p class="flux-src">Pourquoi : l’écriture en flux contourne le censeur intérieur (Elbow 1973) ; chanter la mélodie et le rythme avant les mots est la méthode de nombreux auteurs-compositeurs (Pattison 2009) ; écrire ce qu’on ressent aide à le traverser (Pennebaker et Beall 1986).</p>
        </section>
        <div class="ec-list"></div>
        <section class="panel ec-idees" id="idees-flip">
          <h2>Nos idées pour le labo</h2>
          <p class="muted small">Un bouton qu’on cherche, une fonction rêvée, un mot pas clair : chaque idée est gardée ici, datée, et l’app s’améliore à partir de cette liste.</p>
          <div class="ec-row"><input class="input" data-e="idee-txt" maxlength="300" placeholder="Ex. : pouvoir choisir mes propres accords dans Jouer"><button class="btn primary" data-e="idee">Noter l’idée</button></div>
          <ul class="ec-idees-l"></ul>
        </section>`;
      stopGroove?.(); stopGroove = bindGroove(el);
      // Venue de l'oreille : la boucle est déjà choisie et prête.
      if (window.__flipFond) { el.querySelector('[data-e=sur]').dispatchEvent(new Event('change', { bubbles: true })); el.querySelector('.ec-flux').scrollIntoView({ block: 'start' }); }
      list(true); idees();
    }
    // La liste de nos idées pour améliorer l’app.
    function idees() {
      const ul = el.querySelector('.ec-idees-l'); if (!ul) return;
      const l = espace.entries.filter((e) => e.data?.etincelle && e.data?.pour === 'app' && !e.demo && !e.data?.demo).sort((a, b) => b.createdAt - a.createdAt);
      ul.innerHTML = l.map((e) => `<li style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}"><p>${esc(e.body || e.title)}</p><small><b>${esc(e.author)}</b> · ${ago(e.createdAt)}${e.data?.fait ? ' · <b class="fait">fait ✓</b>' : ''}</small></li>`).join('') || '<li class="muted">Aucune idée notée pour l’instant.</li>';
    }
    // Le journal : nos textes, groupés par jour.
    function list(force) {
      const host = el.querySelector('.ec-list');
      if (!host) return;
      const items = espace.entries.filter((e) => e.type === 'texte' && (e.data?.journal || e.data?.atelier)).sort((a, b) => b.createdAt - a.createdAt);
      const s = JSON.stringify(items.map((e) => [e.id, e.updatedAt]));
      if (!force && s === sig) return;
      sig = s;
      if (!items.length) { host.innerHTML = '<p class="muted ec-empty">Le journal est vide. La première page est la plus légère : trois lignes suffisent.</p>'; return; }
      const days = new Map();
      items.forEach((e) => { const d = new Date(e.createdAt).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }); if (!days.has(d)) days.set(d, []); days.get(d).push(e); });
      host.innerHTML = [...days].map(([d, l]) => `
        <section class="ec-day"><h2>${esc(d)}</h2>
          ${l.map((e) => `
            <article class="ec-entry" style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}">
              <header><b>${esc(e.author)}</b><span class="muted small">${ago(e.createdAt)}${e.data?.invite ? ` · « ${esc(e.data.invite)} »` : ''}${e.data?.atelier ? ' · séance d’atelier' : ''}</span></header>
              ${e.audio ? `<button class="btn small" data-pa="${esc(e.id)}">▶ Le mumble</button>` : ''}
              ${e.data?.atelier ? (e.data.steps || []).map((st) => `<div class="ec-step"><small>${esc(st.nom)}</small><p>${esc(st.text).replace(/\n/g, '<br>')}</p></div>`).join('') : `<p class="ec-body">${esc(e.body).replace(/\n/g, '<br>')}</p>`}
              <div class="ec-acts">
                <button class="linklike" data-e="mur">${e.data?.aumur ? 'Au mur ✓' : 'Au mur'}</button>
                <button class="linklike" data-e="perle">${e.data?.perle ? 'Dans le coffre ✦' : 'Au coffre'}</button>
              </div>
            </article>`).join('')}
        </section>`).join('');
    }
    el.addEventListener('change', (e) => {
      if (e.target.dataset.e !== 'sur') return;
      const p = piecesAvecOreille().find(([id]) => id === e.target.value);
      coupeFond();
      el.querySelector('.flux-beat').hidden = p[0] !== 'beat';
      const box = el.querySelector('.flux-piece'); box.hidden = p[0] === 'beat';
      if (p[2]) box.querySelector('audio').src = p[2];
    });
    el.addEventListener('keydown', (e) => {
      if (flux && e.target.classList.contains('flux-text') && el.querySelector('[data-e=noback]')?.checked && (e.key === 'Backspace' || e.key === 'Delete')) e.preventDefault();
    });
    el.addEventListener('click', async (e) => {
      const pa = e.target.closest('[data-pa]');
      if (pa) { const en = espace.entries.find((x) => x.id === pa.dataset.pa); if (en?.audio) { pa.outerHTML = `<audio controls autoplay src="${await audioURL(en.audio)}"></audio>`; } return; }
      const a = e.target.closest('[data-e]')?.dataset.e;
      if (a === 'piger') { piger(); return; }
      if (a === 'invite') { carte = null; el.querySelector('.ec-intention').innerHTML = intentionHTML(); return; }
      if (a === 'semaine') { carte = carteDeLaSemaine(CARTES); el.querySelector('.ec-intention').innerHTML = intentionHTML(); el.querySelector('.ec-text')?.focus(); return; }
      // La carte part à l'autre dans Nos échanges : même intention, chacun son texte.
      if (a === 'lancer-carte' && carte) {
        const b = e.target.closest('button'); b.disabled = true;
        try {
          await saveEntry({ type: 'note', title: `Une carte pour toi : ${carte.mots.join(' · ')}`.slice(0, 80), body: carte.consigne, data: { relais: true, ask: 'ecris', asks: ['ecris'], intent: 'Même carte, chacun son texte', carte, stage: 0, song: '' } });
          b.textContent = `Lancée à ${autreNom()} ✓`; toast(`${autreNom()} la voit dans Nos échanges. Écris la tienne pendant ce temps.`);
        } catch (err) { b.disabled = false; toast(err.message); }
        return;
      }
      if (!a) return;
      if (a === 'aller-idees') { el.querySelector('#idees-flip').scrollIntoView({ behavior: 'smooth', block: 'start' }); el.querySelector('[data-e=idee-txt]').focus({ preventScroll: true }); return; }
      if (a === 'idee') {
        const inp = el.querySelector('[data-e=idee-txt]'); const t = inp.value.trim(); if (!t) { inp.focus(); return; }
        try { await saveEntry({ type: 'note', title: t.slice(0, 80), body: t, data: { etincelle: true, pour: 'app', stage: 0 } }); inp.value = ''; toast('Idée notée. Merci!'); idees(); } catch (err) { toast(err.message); }
        return;
      }
      if (a === 'flux') { if (!flux) startFlux(); return; }
      if (a === 'yaourt') { toggleYaourt(e.target.closest('[data-e]')); return; }
      if (a === 'flux-save') {
        const ta = el.querySelector('.flux-text'); const text = ta.value.trim();
        if (!text && !yaourtBlob) { ta.focus(); return; }
        const b = e.target.closest('[data-e]'); b.disabled = true;
        try {
          const audio = yaourtBlob ? await uploadAudio(yaourtBlob) : null;
          const surQuoi = piecesAvecOreille().find(([id]) => id === sur())[1];
          await saveEntry({ type: 'texte', title: (text.split('\n')[0] || `Mumble sur ${surQuoi}`).slice(0, 80), body: text, audio, data: { journal: true, date: today(), invite: `Écrit sur ${surQuoi}`, flux: true, sur: sur(), stage: 0 } });
          ta.value = ''; yaourtBlob = null; el.querySelector('.flux-yaourt').innerHTML = '';
          toast('Dans le journal, avec le mumble.');
        } catch (err) { toast(err.message); }
        b.disabled = false;
        return;
      }
      if (a === 'save') {
        const ta = el.querySelector('.ec-text');
        const text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        try {
          await saveEntry({ type: 'texte', title: text.split('\n')[0].slice(0, 80), body: text, data: { journal: true, date: today(), ...(carte ? { carte } : { invite: inviteDu() }), stage: 0 } });
          ta.value = '';
          toast('Dans le journal.');
        } catch (err) { toast(err.message); }
        return;
      }
      const en = espace.entries.find((x) => x.id === e.target.closest('[data-id]')?.dataset.id);
      if (!en) return;
      if (a === 'perle') await togglePerle(en);
      if (a === 'mur') {
        const r = await saveEntry({ ...en, data: { ...en.data, aumur: !en.data?.aumur } }, { baseUpdatedAt: en.updatedAt });
        if (!r.conflict) toast(en.data?.aumur ? 'Retiré du mur.' : 'Au mur, en idée brute. Il peut maintenant monter d’étape.');
      }
    });
    const off = onEspace((w) => { if (w === 'entries') { list(); idees(); } if (w === 'meta' && !el.querySelector('.ec-new')) shell(); });
    shell();
    return () => { off(); stopGroove?.(); clearInterval(flux); yaourt?.stop(); el.querySelector('.flux-piece audio')?.pause(); };
  },
};
