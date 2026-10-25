// Le sommaire de chaque page : « Sur cette page », une rangée de liens vers chaque section, construite à partir
// des titres présents. On voit d'un coup d'œil tout ce qu'on peut faire, sans devoir descendre pour le découvrir.
export function installerSommaire(vue) {
  let t = 0; let sig = '';
  const construire = () => {
    const titres = [...vue.querySelectorAll('h2')].filter((h) => h.offsetParent && !h.closest('.tour, .coach, .sommaire, .maj, .bulle-aide, .ar-scene') && h.textContent.trim());
    const s = titres.map((h) => h.textContent.trim()).join('|');
    if (s === sig) return;
    sig = s;
    vue.querySelector('.sommaire')?.remove();
    if (titres.length < 2) return;
    const nav = document.createElement('nav'); nav.className = 'sommaire no-aide'; nav.setAttribute('aria-label', 'Sur cette page');
    nav.innerHTML = `<span>Sur cette page</span>${titres.map((h, i) => `<button type="button" data-som="${i}">${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}</button>`).join('')}`;
    nav._titres = titres;
    const tete = vue.querySelector('.mod-head, .masthead');
    if (tete) tete.after(nav); else vue.prepend(nav);
  };
  const passe = () => { clearTimeout(t); t = setTimeout(construire, 400); };
  new MutationObserver((ms) => { if (ms.some((m) => !m.target.closest?.('.sommaire'))) passe(); }).observe(vue, { childList: true, subtree: true });
  vue.addEventListener('click', (e) => {
    const b = e.target.closest('.sommaire [data-som]'); if (!b) return;
    const h = b.closest('.sommaire')._titres[+b.dataset.som];
    const d = h.closest('details'); if (d && !d.open) d.open = true;
    h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  addEventListener('hashchange', () => { sig = ''; });
  passe();
}
