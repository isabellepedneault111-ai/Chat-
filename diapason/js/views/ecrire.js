// Écrire : notre journal commun au centre, et autour, les chemins de l'écriture
// (séance d'atelier, grimoire, paroles, ambiances). Une entrée peut aller au mur ou au coffre d'un geste.
import { espace, onEspace, saveEntry } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { togglePerle } from './coffre.js';
import { grooveHTML, bindGroove } from '../groove.js';
import { uploadAudio, audioURL } from '../espace.js';

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
const inviteDu = (d = new Date()) => INVITES[Math.floor(d.getTime() / 864e5) % INVITES.length];
const CHEMINS = [
  ['atelier', 'Une séance d’atelier', '25 min guidées : délier, écrire par les sens, une contrainte, garder ce qui brille.'],
  ['jeux', 'Le grimoire', 'Notre champ de mots, une carte tirée, le cadavre exquis.'],
  ['paroles', 'Nos paroles', 'Sculpter les textes pour qu’ils se chantent : syllabes, rimes.'],
  ['ambiances', 'Une ambiance', 'Partir ailleurs avant d’écrire.'],
];

export default {
  id: 'ecrire',
  mount(el) {
    let sig = '';
    let stopGroove = null;
    let flux = null; let yaourt = null; let yaourtBlob = null;
    // Le flux : 5 minutes, un mot qui tombe toutes les 20 secondes, pas d'effacement si on le veut.
    function startFlux() {
      const play = el.querySelector('.groove [data-g=play]');
      if (play && !el.querySelector('.groove.on')) play.click();
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
        if (left <= 0) { clearInterval(flux); flux = null; el.querySelector('.groove.on [data-g=play]')?.click(); toast('Cinq minutes. Relis-toi : souligne une ligne vraie.'); }
      }, 1000);
    }
    async function toggleYaourt(btn) {
      if (yaourt) { yaourt.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = []; const r = new MediaRecorder(stream);
        r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        r.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          yaourtBlob = new Blob(chunks, { type: r.mimeType || 'audio/webm' }); yaourt = null;
          btn.textContent = '● Refaire le yaourt'; btn.classList.remove('on');
          el.querySelector('.flux-yaourt').innerHTML = `<audio controls src="${URL.createObjectURL(yaourtBlob)}"></audio><small>Réécoute : quels sons ressemblent déjà à des mots? Écris-les.</small>`;
        };
        const play = el.querySelector('.groove [data-g=play]');
        if (play && !el.querySelector('.groove.on')) play.click();
        r.start(); yaourt = r;
        btn.textContent = '■ Arrêter le yaourt'; btn.classList.add('on');
        setTimeout(() => yaourt === r && r.stop(), 90000);
      } catch { toast('Micro refusé : autorise-le dans la barre d’adresse.'); }
    }
    function shell() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: shell }); return; }
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Écrire</p>
          <h1>Notre journal</h1>
          <p class="muted">Écrire chacun de son côté, et se lire. Ce qui a de la vie part au mur ou au coffre d’un geste.</p>
        </div></div>
        <nav class="ec-chemins" aria-label="Les chemins de l’écriture">${CHEMINS.map(([h, t, d]) => `<a href="#/${h}"><b>${t}</b><small>${d}</small></a>`).join('')}</nav>
        <section class="ec-new">
          <p class="ec-invite"><small>L’invitation du jour</small>${esc(inviteDu())}</p>
          <textarea class="input ec-text" rows="5" placeholder="Écris ce qui vient. Rien ne sera jugé."></textarea>
          <div class="ec-row"><button class="btn primary" data-e="save">Dans le journal</button><span class="muted small">${esc((espace.meta.members || MEMBERS).find((m) => m !== espace.me) || '')} le verra en ouvrant l’app.</span></div>
        </section>
        <section class="ec-flux">
          <div class="ec-flux-head">
            <h2>Écrire sur le beat</h2>
            <p>Pour se découvrir : on ne réfléchit pas, on suit le rythme. D’abord le <b>yaourt</b> (chanter des sons sans mots), puis les mots viennent s’y poser.</p>
          </div>
          ${grooveHTML()}
          <div class="flux-row">
            <button class="btn primary" data-e="flux">▶ 5 minutes de flux</button>
            <button class="btn" data-e="yaourt">● Yaourt : chanter sans mots</button>
            <label class="check"><input type="checkbox" data-e="noback" checked> Sans effacer</label>
            <span class="flux-time mono"></span>
          </div>
          <p class="flux-mot" aria-live="polite"></p>
          <textarea class="input flux-text" rows="7" placeholder="Écris tout ce qui vient, au rythme. Pas de retour en arrière : on corrige plus tard."></textarea>
          <div class="flux-yaourt"></div>
          <div class="ec-row"><button class="btn" data-e="flux-save">Dans le journal</button><span class="muted small">Le texte et le yaourt partent ensemble : ${esc((espace.meta.members || MEMBERS).find((m) => m !== espace.me) || '')} pourra chanter dessus.</span></div>
          <p class="flux-src">Pourquoi : l’écriture en flux contourne le censeur intérieur (Elbow 1973) ; chanter la mélodie et le rythme avant les mots est la méthode de nombreux auteurs-compositeurs (Pattison 2009) ; écrire ce qu’on ressent aide à le traverser (Pennebaker et Beall 1986).</p>
        </section>
        <div class="ec-list"></div>`;
      stopGroove?.(); stopGroove = bindGroove(el);
      list(true);
    }
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
              ${e.audio ? `<button class="btn small" data-pa="${esc(e.id)}">▶ Le yaourt</button>` : ''}
              ${e.data?.atelier ? (e.data.steps || []).map((st) => `<div class="ec-step"><small>${esc(st.nom)}</small><p>${esc(st.text).replace(/\n/g, '<br>')}</p></div>`).join('') : `<p class="ec-body">${esc(e.body).replace(/\n/g, '<br>')}</p>`}
              <div class="ec-acts">
                <button class="linklike" data-e="mur">${e.data?.aumur ? 'Au mur ✓' : 'Au mur'}</button>
                <button class="linklike" data-e="perle">${e.data?.perle ? 'Dans le coffre ✦' : 'Au coffre'}</button>
              </div>
            </article>`).join('')}
        </section>`).join('');
    }
    el.addEventListener('keydown', (e) => {
      if (flux && e.target.classList.contains('flux-text') && el.querySelector('[data-e=noback]')?.checked && (e.key === 'Backspace' || e.key === 'Delete')) e.preventDefault();
    });
    el.addEventListener('click', async (e) => {
      const pa = e.target.closest('[data-pa]');
      if (pa) { const en = espace.entries.find((x) => x.id === pa.dataset.pa); if (en?.audio) { pa.outerHTML = `<audio controls autoplay src="${await audioURL(en.audio)}"></audio>`; } return; }
      const a = e.target.closest('[data-e]')?.dataset.e;
      if (!a) return;
      if (a === 'flux') { if (!flux) startFlux(); return; }
      if (a === 'yaourt') { toggleYaourt(e.target.closest('[data-e]')); return; }
      if (a === 'flux-save') {
        const ta = el.querySelector('.flux-text'); const text = ta.value.trim();
        if (!text && !yaourtBlob) { ta.focus(); return; }
        const b = e.target.closest('[data-e]'); b.disabled = true;
        try {
          const audio = yaourtBlob ? await uploadAudio(yaourtBlob) : null;
          await saveEntry({ type: 'texte', title: (text.split('\n')[0] || 'Yaourt sur le beat').slice(0, 80), body: text, audio, data: { journal: true, date: today(), invite: 'Écrit sur le beat', flux: true, stage: 0 } });
          ta.value = ''; yaourtBlob = null; el.querySelector('.flux-yaourt').innerHTML = '';
          toast('Dans le journal, avec le yaourt.');
        } catch (err) { toast(err.message); }
        b.disabled = false;
        return;
      }
      if (a === 'save') {
        const ta = el.querySelector('.ec-text');
        const text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        try {
          await saveEntry({ type: 'texte', title: text.split('\n')[0].slice(0, 80), body: text, data: { journal: true, date: today(), invite: inviteDu(), stage: 0 } });
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
    const off = onEspace((w) => { if (w === 'entries') list(); if (w === 'meta' && !el.querySelector('.ec-new')) shell(); });
    shell();
    return () => { off(); stopGroove?.(); clearInterval(flux); yaourt?.stop(); };
  },
};
