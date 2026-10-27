// La corbeille commune : on restaure quand on veut ; on efface pour de bon seulement à deux.
import { espace, onEspace } from '../espace.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { restaurer, effacer } from '../corbeille.js';

export default {
  id: 'corbeille',
  mount(el) {
    // Redessine la corbeille : ce que j’ai jeté, et ce que l’autre a jeté (à confirmer).
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const o = (espace.meta.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';
      const list = [...espace.trash].sort((a, b) => b.data.corbeille.at - a.data.corbeille.at);
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">La corbeille commune</p>
          <h1>Rien ne disparaît sur un coup de tête</h1>
          <p class="muted">Ce qu’on jette attend ici. On le restaure quand on veut. Pour l’effacer pour de bon, il faut l’accord de l’autre.</p>
        </div></div>
        ${list.length ? `<div class="cb-list">${list.map((e) => { const mine = e.data.corbeille.by === espace.me; return `
          <article class="cb-item" style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}">
            <div><b>${esc(e.title || 'Sans titre')}</b><small>${esc(e.author)} · jeté par ${esc(e.data.corbeille.by)} ${ago(e.data.corbeille.at)}</small></div>
            <div class="cb-acts">
              <button class="btn small" data-cb="restaurer">Restaurer</button>
              ${mine ? `<span class="muted small">En attente de l’accord de ${esc(o)}</span>` : `<button class="btn small danger" data-cb="effacer">D’accord, effacer pour de bon</button>`}
            </div>
          </article>`; }).join('')}</div>` : '<p class="muted">La corbeille est vide.</p>'}`;
    }
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cb]');
      if (!b) return;
      const en = espace.trash.find((x) => x.id === b.closest('[data-id]').dataset.id);
      if (!en) return;
      if (b.dataset.cb === 'restaurer') await restaurer(en);
      if (b.dataset.cb === 'effacer' && confirm('Effacer pour de bon, pour vous deux?')) await effacer(en);
    });
    const off = onEspace((w) => { if (w === 'entries') render(); });
    render();
    return () => off();
  },
};
