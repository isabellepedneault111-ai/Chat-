// Nos étincelles : les idées embryonnaires, pour notre musique et pour l'app. On les fait monter au mur quand elles prennent forme.
import { espace, onEspace, saveEntry, audioURL } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor } from '../duo.js';
import { jeter } from '../corbeille.js';

// La feuille de route de Diapason Labo : les dix priorités de la revue du panel d'experts, cochées à deux.
const FEUILLE = 'jeu-feuille';
const PRIORITES = [
  ['Enregistrer nos premiers exemples vivants (voix, guitare, claviers)', 'Remplacer tout son synthétique par le nôtre.'],
  ['Exporter les couches du relais en un seul fichier audio', 'Une démo à faire écouter sans quitter l’app.'],
  ['Tester Voix + piano avec le vrai clavier de Frog, noter la latence', 'Valider le cœur inédit de l’app.'],
  ['Changer « bell » pour un mot plus long une fois Frog entré', 'Protéger nos textes et nos peurs.'],
  ['Raccourcir l’accueil au cellulaire', 'Savoir quoi faire sans défiler.'],
  ['Relire à voix haute dans l’atelier', 'Le texte chanté se juge à l’oreille.'],
  ['Mesurer la mise en place rythmique à deux', 'Une progression instrumentale visible, comme la voix.'],
  ['Un rituel d’appréciation mensuel', 'Chacun nomme ce que l’autre a apporté.'],
  ['Une IA invitée au relais, sur demande seulement', 'Une contrainte ou une rime proposée, jamais une œuvre signée.'],
  ['Retirer le bandeau de l’hébergeur (formule payante ou autre hébergeur)', 'Un écran 100 % Diapason Labo.'],
];

export default {
  id: 'etincelles',
  mount(el) {
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const all = espace.entries.filter((e) => e.data?.etincelle).sort((a, b) => b.createdAt - a.createdAt);
      const col = (pour, titre, sous) => {
        const l = all.filter((e) => (e.data.pour || 'musique') === pour);
        return `<section class="et-col"><h2>${titre}</h2><p class="muted small">${sous}</p>
          ${l.length ? l.map((e) => `<article class="et-item" style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}">
            <p class="et-t">${esc(e.body || e.title)}</p>
            ${e.audio ? `<div data-audio><button class="btn small" data-x="play">▶ Écouter</button></div>` : ''}
            <p class="et-meta"><b>${esc(e.author)}</b> · ${ago(e.createdAt)}
              ${pour === 'musique' ? `<button class="linklike" data-x="mur">${e.data.aumur ? 'Au mur ✓' : 'Au mur'}</button>` : `<button class="linklike" data-x="fait">${e.data.fait ? 'Fait ✓' : 'Marquer comme fait'}</button>`}
              <button class="linklike" data-x="jeter">Corbeille</button></p>
          </article>`).join('') : '<p class="muted et-empty">Rien encore. La petite flamme en bas de l’écran attend.</p>'}
        </section>`;
      };
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Nos étincelles</p>
          <h1>Les idées avant les idées</h1>
          <p class="muted">Tout ce qui passe par la tête, même à moitié. Touche la petite flamme en bas de l’écran, n’importe quand, sur n’importe quelle page.</p>
        </div></div>
        <div class="et-cols">
          ${col('musique', 'Pour notre musique', 'Quand une étincelle prend forme, envoie-la au mur : elle y monte d’étape comme les autres idées.')}
          <div>
            <section class="feuille"><h2>La feuille de route de Diapason Labo</h2><p class="muted small">Les dix priorités de la revue du panel d’experts. On les coche à deux.</p>
              <ol>${PRIORITES.map(([t, why], i) => { const f = espace.entries.find((e) => e.id === FEUILLE)?.data?.fait?.[i]; return `<li class="${f ? 'fait' : ''}"><label><input type="checkbox" data-fe="${i}" ${f ? 'checked' : ''}><span><b>${esc(t)}</b><small>${esc(why)}${f ? ` · fait par ${esc(f.by)}` : ''}</small></span></label></li>`; }).join('')}</ol>
            </section>
            ${col('app', 'Nos idées pour l’app', 'Ce que vous voudriez qu’elle fasse. On la construit ensemble.')}
          </div>
        </div>`;
    }
    el.addEventListener('change', async (e) => {
      const i = e.target.dataset.fe;
      if (i == null) return;
      const apply = (d) => ({ fait: { ...(d?.fait || {}), [i]: e.target.checked ? { by: espace.me, at: Date.now() } : null } });
      const cur = espace.entries.find((x) => x.id === FEUILLE);
      const r = await saveEntry({ id: FEUILLE, type: 'jeu', title: 'Feuille de route de Diapason Labo', data: apply(cur?.data) }, { baseUpdatedAt: cur?.updatedAt });
      if (r.conflict) await saveEntry({ ...r.current, data: apply(r.current.data) }, { baseUpdatedAt: r.current.updatedAt });
    });
    el.addEventListener('click', async (e) => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (!x) return;
      const en = espace.entries.find((i) => i.id === e.target.closest('[data-id]').dataset.id);
      if (!en) return;
      if (x === 'play') { const box = e.target.closest('[data-audio]'); box.innerHTML = `<audio controls src="${await audioURL(en.audio)}"></audio>`; box.querySelector('audio').play().catch(() => {}); return; }
      if (x === 'jeter') { await jeter(en); return; }
      const key = x === 'mur' ? 'aumur' : 'fait';
      const r = await saveEntry({ ...en, data: { ...en.data, [key]: !en.data[key] } }, { baseUpdatedAt: en.updatedAt });
      if (!r.conflict && x === 'mur') toast(en.data.aumur ? 'Retirée du mur.' : 'Au mur, en idée brute.');
    });
    const off = onEspace((w) => { if (w === 'entries') render(); });
    render();
    return () => off();
  },
};
