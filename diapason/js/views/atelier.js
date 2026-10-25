// La séance d'atelier d'écriture : quatre temps guidés, comme une séance de musique.
// Délier la main, écrire par les sens, une contrainte, garder ce qui brille. Le tout va au journal.
import { espace, saveEntry, uid } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate } from './carnet.js';
import { ecrire } from '../ecrire.js';
import { CARTES } from './jeux.js';
import { logPractice } from '../traces.js';

const MOTS = ['lune', 'marée', 'braise', 'fenêtre', 'hiver', 'route', 'nos mains', 'lumière basse', 'rivière', 'silence'];

export default {
  id: 'atelier',
  mount(el) {
    if (!espace.connected || !espace.me) { espaceGate(el, { onReady: () => location.reload() }); return undefined; }
    const champ = espace.entries.find((e) => e.id === 'jeu-champ')?.data?.words?.map((w) => w.w) || [];
    const mots = champ.length ? champ : MOTS;
    const pick = (l) => l[Math.floor(Math.random() * l.length)];
    const carte = pick(CARTES.filter((c) => !c.brise));
    const STEPS = [
      { nom: 'Délier la main', min: 3, how: 'Trois minutes sans t’arrêter ni te relire. Si tu bloques, réécris le mot jusqu’à ce que ça reparte.', senses: false, src: 'Écriture automatique · Breton et Soupault' },
      { nom: 'Par les sens', min: 10, how: null, senses: true, src: 'Écriture-objet · Pattison 2009' },
      { nom: carte.nom, min: 7, how: carte.consigne, senses: false, check: carte.check, src: carte.src || 'Contrainte d’atelier' },
      { nom: 'Garder ce qui brille', min: 5, how: 'Relis tout. Recopie ici les trois lignes ou images les plus fortes, et une seule phrase qui pourrait ouvrir un refrain.', senses: false, src: 'Trier après, jamais pendant' },
    ];
    const word = pick(mots);
    const texts = [];
    let i = 0; let pad = null; const t0 = Date.now();
    function step() {
      pad?.dispose();
      const s = STEPS[i];
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Séance d’atelier · ${i + 1} / ${STEPS.length}</p>
          <h1>${esc(s.nom)}</h1>
          <p class="muted">Le mot de la séance : <b>${esc(word)}</b>. ${s.min} minutes.</p>
        </div></div>
        <ol class="at-steps">${STEPS.map((x, k) => `<li class="${k < i ? 'done' : k === i ? 'now' : ''}">${esc(x.nom)}<small>${x.min} min</small></li>`).join('')}</ol>
        ${i === 3 ? `<details class="at-prev" open><summary>Ce que tu as écrit</summary>${texts.map((t, k) => `<div class="ec-step"><small>${esc(STEPS[k].nom)}</small><p>${esc(t).replace(/\n/g, '<br>')}</p></div>`).join('')}</details>` : ''}
        <section class="panel at-pad"></section>
        <p class="at-src">${esc(s.src)}</p>
        <div class="at-nav">${i < STEPS.length - 1 ? '<button class="btn primary big" data-a="next">Temps suivant →</button>' : '<button class="btn primary big" data-a="end">Garder la séance dans le journal</button>'}</div>`;
      pad = ecrire(el.querySelector('.at-pad'), { mots: [word], minutes: s.min, senses: s.senses, how: s.how, check: s.check || null, initial: texts[i] || '' });
    }
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a) return;
      texts[i] = pad.text().trim();
      if (a === 'next') { i++; step(); window.scrollTo({ top: 0 }); return; }
      if (a === 'end') {
        const steps = STEPS.map((s, k) => ({ nom: s.nom, text: texts[k] || '' })).filter((s) => s.text);
        if (!steps.length) { toast('Quelques mots d’abord.'); return; }
        await saveEntry({ id: uid(), type: 'texte', title: `Séance d’atelier · ${word}`, body: steps.map((s) => `[${s.nom}]\n${s.text}`).join('\n\n'), data: { atelier: true, mot: word, steps, stage: 0 } });
        logPractice('atelier', (Date.now() - t0) / 60000, { mot: word, carte: carte.nom });
        toast('Dans le journal. Ce qui brille peut maintenant aller au mur.');
        location.hash = '#/ecrire';
      }
    });
    step();
    return () => pad?.dispose();
  },
};
