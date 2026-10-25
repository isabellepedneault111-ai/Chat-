// Écrire : notre journal commun au centre, et autour, les chemins de l'écriture
// (séance d'atelier, grimoire, paroles, ambiances). Une entrée peut aller au mur ou au coffre d'un geste.
import { espace, onEspace, saveEntry } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { togglePerle } from './coffre.js';

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
        <div class="ec-list"></div>`;
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
              ${e.data?.atelier ? (e.data.steps || []).map((st) => `<div class="ec-step"><small>${esc(st.nom)}</small><p>${esc(st.text).replace(/\n/g, '<br>')}</p></div>`).join('') : `<p class="ec-body">${esc(e.body).replace(/\n/g, '<br>')}</p>`}
              <div class="ec-acts">
                <button class="linklike" data-e="mur">${e.data?.aumur ? 'Au mur ✓' : 'Au mur'}</button>
                <button class="linklike" data-e="perle">${e.data?.perle ? 'Dans le coffre ✦' : 'Au coffre'}</button>
              </div>
            </article>`).join('')}
        </section>`).join('');
    }
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-e]')?.dataset.e;
      if (!a) return;
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
    return () => off();
  },
};
