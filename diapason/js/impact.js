// L'impact : quand une idée monte d'étape, on le voit. Ce que ça fait bouger dans le mois,
// et une petite flamme qui monte. Rien n'est gratuit : chaque geste compte, et on le sait.
import { PLAN, STAGES } from './duo.js';
import { planContext, currentMonth } from './plan.js';
import { FLAME } from './marque.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NEXT = ['', 'Réécoutez-la ensemble à la prochaine écoute commune.', 'Prochaine séance : prenez-la comme cible, trois variations.', 'Elle est jouable : fixez qui mène les entrées, puis une prise complète.', 'Dans le set : jouez-la devant quelqu’un, même une seule personne.'];

// Quand une trace monte d’un cran : ce que ce geste change pour l’objectif du mois.
export function impact(e, from, to, before) {
  const m = currentMonth();
  const goal = m ? PLAN[m - 1] : null;
  const after = planContext();
  const b = goal ? goal.mesure(before) : 0; const a = goal ? goal.mesure(after) : 0;
  const counts = goal && a > b;
  const reached = goal && a >= goal.cible && b < goal.cible;
  const box = document.createElement('div');
  box.className = `impact ${reached ? 'big' : ''}`;
  box.innerHTML = `
    <div class="im-flame">${FLAME()}</div>
    <div class="im-txt">
      <p class="im-k">${esc(STAGES[from].label)} → <b>${esc(STAGES[to].label)}</b></p>
      <p class="im-t">« ${esc(e.title || 'Sans titre')} »</p>
      ${reached ? `<p class="im-goal">Cible du mois ${m} atteinte : <b>${esc(goal.sortie)}</b>. La route avance.</p>`
        : counts ? `<p class="im-goal">Ça compte : <b>${Math.min(a, goal.cible)} / ${goal.cible}</b> pour le mois ${m} (${esc(goal.sortie)}).</p>` : ''}
      <p class="im-next">${esc(NEXT[to] || '')}</p>
    </div>`;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  setTimeout(() => { box.classList.remove('in'); setTimeout(() => box.remove(), 500); }, reached ? 7000 : 4800);
  box.addEventListener('click', () => box.remove());
}
