// Le coffre : les petits endroits précieux. La vidéo et la visite de la première fois, le mot d'accueil,
// et les perles qu'on y dépose d'un geste (un son, des mots) pour les retrouver quand on en a besoin.
import { espace, onEspace, audioURL, saveEntry } from '../espace.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor } from '../duo.js';
import { intentsHTML } from './relais.js';
import { toast } from '../ui.js';

export async function togglePerle(e) {
  const r = await saveEntry({ ...e, data: { ...(e.data || {}), perle: !e.data?.perle } }, { baseUpdatedAt: e.updatedAt });
  if (r.conflict) await saveEntry({ ...r.current, data: { ...(r.current.data || {}), perle: !e.data?.perle } }, { baseUpdatedAt: r.current.updatedAt });
  toast(e.data?.perle ? 'Sortie du coffre.' : 'Dans le coffre. ✦');
}

export default {
  id: 'coffre',
  mount(el) {
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const w = espace.meta.welcome || {};
      const perles = espace.entries.filter((e) => e.data?.perle).sort((a, b) => b.updatedAt - a.updatedAt);
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Le coffre</p>
          <h1>Nos petites perles</h1>
          <p class="muted">Ce qui est précieux et qu’on veut garder à portée de main. On ne sait pas toujours ce qu’on en fera : c’est le but.</p>
        </div></div>
        <div class="cf-grid">
          <article class="cf-perle cf-video">
            <p class="cf-k">La première fois</p>
            <video src="data/demo-frog.mp4" poster="data/demo-frog.jpg" controls playsinline preload="none"></video>
            <button class="btn small" data-c="tour">Revoir la visite guidée</button>
          </article>
          <article class="cf-perle cf-mot">
            <p class="cf-k">Le mot d’accueil</p>
            <p class="cf-welcome">${esc(w.text || 'Forever more…').replace(/\n/g, '<br>')}</p>
            <p class="cf-sign">— ${esc(w.by || espace.meta.createdBy || 'Zaza')}</p>
            ${w.audio ? '<button class="btn small" data-c="welcome">▶ L’écouter</button>' : ''}
          </article>
          ${perles.map((e) => `
            <article class="cf-perle" style="--c:${memberColor(e.author)}">
              <p class="cf-k">${esc(e.author)} · ${ago(e.createdAt)}</p>
              <h3>${esc(e.title)}</h3>
              <div class="cf-tags">${intentsHTML(e)}</div>
              ${e.body ? `<p class="cf-body">${esc(e.body).replace(/\n/g, '<br>')}</p>` : ''}
              ${e.audio ? `<div data-audio="${esc(e.id)}"><button class="btn small" data-play="${esc(e.id)}">▶ Écouter</button></div>` : ''}
              <button class="btn small ghost" data-out="${esc(e.id)}">Sortir du coffre</button>
            </article>`).join('')}
        </div>
        <p class="cf-cb"><a href="#/corbeille">La corbeille commune${espace.trash.length ? ` (${espace.trash.length})` : ''}</a> : ce qu’on a jeté attend là, et ne s’efface qu’à deux.</p>
        ${perles.length ? '' : '<p class="muted cf-hint">Dans le relais, chaque son et chaque texte a un bouton <b>✦ Au coffre</b>. Ce que vous y déposez apparaît ici.</p>'}`;
    }
    el.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-c]')?.dataset.c;
      if (c === 'tour') { const { startTour } = await import('./tour.js'); startTour(espace.me === espace.meta.createdBy); }
      if (c === 'welcome') { new Audio(await audioURL(espace.meta.welcome.audio)).play(); }
      const pl = e.target.closest('[data-play]');
      if (pl) { const en = espace.entries.find((x) => x.id === pl.dataset.play); const box = pl.closest('[data-audio]'); box.innerHTML = `<audio controls src="${await audioURL(en.audio)}"></audio>`; box.querySelector('audio').play().catch(() => {}); }
      const out = e.target.closest('[data-out]');
      if (out) await togglePerle(espace.entries.find((x) => x.id === out.dataset.out));
    });
    const off = onEspace((w) => { if (w === 'entries' || w === 'meta') render(); });
    render();
    return () => off();
  },
};
