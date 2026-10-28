// La bulle : l'explication d'un élément apparaît quand on le survole (ou qu'on le touche, sur tablette), au lieu d'une
// légende permanente. N'importe quel élément (HTML ou SVG) qui porte data-bulle="…" en a une, partout dans l'app.
let el = null; let cible = null; let minuterie = 0;
const montrer = (t, x, y) => {
  if (!el) { el = document.createElement('div'); el.className = 'bulle'; el.setAttribute('role', 'tooltip'); document.body.append(el); }
  el.innerHTML = t; el.hidden = false;
  const w = el.offsetWidth; const h = el.offsetHeight;
  el.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, x - w / 2))}px`;
  el.style.top = `${y - h - 14 < 8 ? y + 22 : y - h - 14}px`;
};
const cacher = () => { if (el) el.hidden = true; cible = null; };
export function installerBulles() {
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('[data-bulle]'); if (!t || t === cible) return; cible = t; clearTimeout(minuterie);
    const r = t.getBoundingClientRect(); montrer(t.dataset.bulle, r.left + r.width / 2, r.top);
    if (e.pointerType === 'touch') minuterie = setTimeout(cacher, 3200); // au doigt : elle reste le temps de lire
  });
  document.addEventListener('pointerout', (e) => { const t = e.target.closest?.('[data-bulle]'); if (t && e.pointerType !== 'touch' && !t.contains(e.relatedTarget)) cacher(); });
  document.addEventListener('focusin', (e) => { const t = e.target.closest?.('[data-bulle]'); if (t) { const r = t.getBoundingClientRect(); montrer(t.dataset.bulle, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', cacher);
  addEventListener('scroll', cacher, { passive: true }); addEventListener('hashchange', cacher);
}
