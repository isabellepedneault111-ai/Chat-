// La guitare : la version simple d'un accord (majeur ou mineur de base) et sa position, en petit diagramme.
// Positions ouvertes quand elles existent (Do, Ré, Mi, Sol, La, Lam, Rém, Mim), barrées sinon (forme de Mi ou de La).
// Cordes de la plus grave (Mi) à la plus aiguë (mi) ; -1 : on ne la joue pas, 0 : à vide.
const FR = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si']; // les mêmes noms que L'oreille

const MAJ = [[-1, 3, 2, 0, 1, 0], [-1, 4, 6, 6, 6, 4], [-1, -1, 0, 2, 3, 2], [-1, 6, 8, 8, 8, 6], [0, 2, 2, 1, 0, 0], [1, 3, 3, 2, 1, 1],
  [2, 4, 4, 3, 2, 2], [3, 2, 0, 0, 0, 3], [4, 6, 6, 5, 4, 4], [-1, 0, 2, 2, 2, 0], [-1, 1, 3, 3, 3, 1], [-1, 2, 4, 4, 4, 2]];
const MIN = [[-1, 3, 5, 5, 4, 3], [-1, 4, 6, 6, 5, 4], [-1, -1, 0, 2, 3, 1], [-1, 6, 8, 8, 7, 6], [0, 2, 2, 0, 0, 0], [1, 3, 3, 1, 1, 1],
  [2, 4, 4, 2, 2, 2], [3, 5, 5, 3, 3, 3], [4, 6, 6, 4, 4, 4], [-1, 0, 2, 2, 1, 0], [-1, 1, 3, 3, 2, 1], [-1, 2, 4, 4, 3, 2]];

// La sorte simple : tout ce qui a une tierce majeure (7, maj7, sus) devient majeur ; m7 et dim deviennent mineurs.
export const simple = (q) => (['m', 'm7', 'dim'].includes(q) ? 'm' : 'M');
export const nomSimple = (r, q) => `${FR[((r % 12) + 12) % 12]}${simple(q) === 'm' ? 'm' : ''}`;

// Le diagramme : 6 cordes, 4 cases ; un chiffre à gauche quand la position est plus haut sur le manche.
export function diagramme(r, q, { taille = 120 } = {}) {
  const f = (simple(q) === 'm' ? MIN : MAJ)[((r % 12) + 12) % 12];
  const joue = f.filter((x) => x > 0); const bas = joue.length && Math.max(...joue) > 4 ? Math.min(...joue) : 1;
  const W = 100; const H = 120; const x0 = 18; const y0 = 26; const dx = (W - 2 * x0 + 4) / 5; const dy = 22;
  let s = `<svg class="gt-diag" viewBox="0 0 ${W} ${H}" width="${taille}" height="${(taille * H) / W}" role="img" aria-label="Position de ${nomSimple(r, q)} à la guitare">`;
  s += bas === 1 ? `<rect x="${x0}" y="${y0 - 4}" width="${dx * 5}" height="4" fill="#1d1a15"/>` : `<text x="${x0 - 6}" y="${y0 + dy / 2 + 4}" text-anchor="end" class="gt-case">${bas}</text>`;
  for (let k = 0; k <= 4; k++) s += `<line x1="${x0}" x2="${x0 + dx * 5}" y1="${y0 + k * dy}" y2="${y0 + k * dy}" stroke="#8a7f6c" stroke-width="1.2"/>`;
  for (let c = 0; c < 6; c++) s += `<line x1="${x0 + c * dx}" x2="${x0 + c * dx}" y1="${y0}" y2="${y0 + 4 * dy}" stroke="#1d1a15" stroke-width="${1.6 - c * 0.12}"/>`;
  // Le barré : la plus basse case jouée, quand elle tient plusieurs cordes.
  const mini = joue.length ? Math.min(...joue) : 0; const cordesBarre = f.map((x, c) => (x === mini ? c : -1)).filter((c) => c >= 0);
  if (mini > 0 && cordesBarre.length >= 3) { const yb = y0 + (mini - bas + 0.5) * dy; s += `<rect x="${x0 + cordesBarre[0] * dx - 5}" y="${yb - 5}" width="${(cordesBarre.at(-1) - cordesBarre[0]) * dx + 10}" height="10" rx="5" fill="#1d1a15"/>`; }
  f.forEach((x, c) => {
    const cx = x0 + c * dx;
    if (x < 0) s += `<text x="${cx}" y="${y0 - 9}" text-anchor="middle" class="gt-x">×</text>`;
    else if (x === 0) s += `<circle cx="${cx}" cy="${y0 - 13}" r="4" fill="none" stroke="#1d1a15" stroke-width="1.6"/>`;
    else if (!(mini > 0 && cordesBarre.length >= 3 && x === mini)) s += `<circle cx="${cx}" cy="${y0 + (x - bas + 0.5) * dy}" r="7" fill="#d55e00"/>`;
  });
  return `${s}</svg>`;
}
