// La rosace : le grand vitrail rond d'une cathédrale gothique, calculé à partir de la clé de voûte. Un anneau de
// vitraux par nombre de la clé (du centre vers le bord), autant de vitraux que le nombre en demande, aux couleurs de
// la lumière choisie pour chaque partie. Le plomb noir dessine la dentelle ; la pierre l'entoure. Pendant l'écoute,
// la lumière tourne et l'anneau de la partie qui joue s'embrase. Chaque clé donne une rosace unique.

// Un petit hasard stable (toujours le même pour la même clé) : les vitraux n'ont jamais tous la même teinte.
const hasard = (graine) => { let x = graine >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; };
const teinte = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k)))); return `rgb(${c.join(',')})`; };

// Dessine la rosace d’une clé : un anneau de vitraux par nombre, aux couleurs de sa partie ; l’anneau actif s’allume.
export function dessinerRosace(ctx, taille, { cle, couleurs, lumiere = -1, actif = -1 }) {
  const R = taille / 2; const cx = R; const cy = R; const n = cle.length; const alea = hasard(cle.reduce((a, x) => a * 31 + x, 7));
  ctx.clearRect(0, 0, taille, taille);
  // La pierre : un disque sombre, un peu de grain, une bordure moulurée.
  const pierre = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
  pierre.addColorStop(0, '#2b2621'); pierre.addColorStop(1, '#14110e');
  ctx.fillStyle = pierre; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  const rMax = R * 0.9; const rMin = R * 0.16; const pas = (rMax - rMin) / n;
  // Du centre vers le bord : un anneau par nombre de la clé.
  for (let j = 0; j < n; j++) {
    const r0 = rMin + j * pas; const r1 = r0 + pas; const nb = cle[j] * Math.max(1, Math.ceil((6 + j * 4) / cle[j]));
    const base = couleurs[j] || '#e8c27a'; const allume = j === actif;
    const ogive = j === n - 1 || j % 2 === 0; // le bord, et un anneau sur deux : des vitraux en ogive, pointus
    for (let k = 0; k < nb; k++) {
      const a0 = (k / nb) * Math.PI * 2 - Math.PI / 2; const a1 = ((k + 1) / nb) * Math.PI * 2 - Math.PI / 2; const am = (a0 + a1) / 2;
      // La lumière qui passe : un faisceau qui tourne, les vitraux qu'il touche brillent.
      const d = lumiere < 0 ? 1 : Math.abs(((((am + Math.PI / 2) / (Math.PI * 2) - lumiere) % 1) + 1.5) % 1 - 0.5);
      const eclat = lumiere < 0 ? 0 : Math.max(0, 1 - d * 5);
      // Pendant l'écoute, les vitraux au repos s'assombrissent : le faisceau et l'anneau qui joue se voient vraiment.
      const k0 = (lumiere < 0 ? 0.62 + alea() * 0.35 : 0.34 + alea() * 0.18) + (allume ? 0.45 : 0) + eclat * 1.15;
      const P = (x, y) => [cx + Math.cos(x) * y, cy + Math.sin(x) * y];
      const forme = () => {
        ctx.beginPath(); ctx.arc(cx, cy, r0 + 2, a0 + 0.01, a1 - 0.01);
        if (ogive) {
          const [ax, ay] = P(a1 - 0.01, r0 + (r1 - r0) * 0.55); const [px, py] = P(am, r1 - 2); const [bx, by] = P(a0 + 0.01, r0 + (r1 - r0) * 0.55);
          const [c1x, c1y] = P(a1 - 0.01, r1 - 2); const [c2x, c2y] = P(a0 + 0.01, r1 - 2);
          ctx.lineTo(ax, ay); ctx.quadraticCurveTo(c1x, c1y, px, py); ctx.quadraticCurveTo(c2x, c2y, bx, by);
        } else ctx.arc(cx, cy, r1 - 2, a1 - 0.01, a0 + 0.01, true);
        ctx.closePath();
      };
      forme(); const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
      g.addColorStop(0, teinte(base, k0 * 1.12)); g.addColorStop(1, teinte(base, k0 * 0.72)); ctx.fillStyle = g; ctx.fill();
      // Le verre soufflé : un quadrillage de plomb fin, chaque morceau d'une teinte un peu différente.
      ctx.save(); forme(); ctx.clip();
      const cr = 3; const ca = Math.max(2, Math.round(((a1 - a0) * r1) / (pas / 2.2)));
      for (let u = 0; u < cr; u++) for (let v = 0; v < ca; v++) {
        const q0 = r0 + ((r1 - r0) * u) / cr; const q1 = r0 + ((r1 - r0) * (u + 1)) / cr; const b0 = a0 + ((a1 - a0) * v) / ca; const b1 = a0 + ((a1 - a0) * (v + 1)) / ca;
        ctx.beginPath(); ctx.arc(cx, cy, q1, b0, b1); ctx.arc(cx, cy, q0, b1, b0, true); ctx.closePath();
        ctx.fillStyle = teinte(base, k0 * (0.8 + alea() * 0.45)); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
        ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(13,11,9,.75)'; ctx.stroke();
      }
      ctx.restore();
      // Dans chaque vitrail, un médaillon : un rond de verre clair (ou une goutte, un anneau sur deux).
      const rm = (r0 + r1) / 2 - (ogive ? (r1 - r0) * 0.06 : 0); const taillem = Math.min(pas * 0.22, ((a1 - a0) * rm) * 0.26);
      const [mx, my] = P(am, rm); ctx.beginPath();
      if (j % 2) ctx.ellipse(mx, my, taillem * 0.6, taillem, am, 0, Math.PI * 2); else ctx.arc(mx, my, taillem, 0, Math.PI * 2);
      ctx.fillStyle = teinte(base, k0 * 1.6); ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
      // Le plomb autour du vitrail.
      forme(); ctx.lineWidth = 2.6; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
    }
    // Le plomb entre deux anneaux.
    ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.lineWidth = 3.2; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
    if (allume) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(cx, cy, (r0 + r1) / 2, 0, Math.PI * 2); ctx.lineWidth = pas * 0.9; ctx.strokeStyle = 'rgba(255,220,160,.10)'; ctx.stroke(); ctx.restore(); }
  }
  // Les meneaux : des rayons de pierre qui partent du cœur jusqu'au bord, la charpente de la rosace.
  const nbM = cle[0] * Math.max(1, Math.ceil(6 / cle[0]));
  for (let k = 0; k < nbM; k++) {
    const a = (k / nbM) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rMin, cy + Math.sin(a) * rMin); ctx.lineTo(cx + Math.cos(a) * rMax, cy + Math.sin(a) * rMax);
    ctx.lineWidth = R * 0.022; ctx.strokeStyle = '#0d0b09'; ctx.stroke(); ctx.lineWidth = R * 0.013; ctx.strokeStyle = '#4a4238'; ctx.stroke();
  }
  // Les quadrilobes de pierre tout autour : un par vitrail de l'anneau extérieur, comme sur les vraies rosaces.
  const nbBord = cle[n - 1] * Math.max(1, Math.ceil((6 + (n - 1) * 4) / cle[n - 1]));
  for (let k = 0; k < nbBord; k++) {
    const a = ((k + 0.5) / nbBord) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(a) * (rMax + R * 0.05); const y = cy + Math.sin(a) * (rMax + R * 0.05);
    ctx.beginPath(); ctx.arc(x, y, R * 0.035, 0, Math.PI * 2); ctx.fillStyle = teinte(couleurs[n - 1] || '#e8c27a', 0.9); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rMax + R * 0.09, 0, Math.PI * 2); ctx.lineWidth = R * 0.025; ctx.strokeStyle = '#3a332b'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, rMax, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
  // Le cœur : la clé de voûte elle-même, gravée.
  ctx.beginPath(); ctx.arc(cx, cy, rMin, 0, Math.PI * 2); ctx.fillStyle = '#1b1814'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#0d0b09'; ctx.stroke();
  ctx.fillStyle = '#efe6d2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const t = cle.join(':'); ctx.font = `800 ${Math.max(10, Math.min(rMin * 0.62, (rMin * 2.6) / t.length))}px "Literata", serif`; ctx.fillText(t, cx, cy);
  // Un voile de lumière, pour la profondeur du verre.
  const voile = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R);
  voile.addColorStop(0, 'rgba(255,240,210,.16)'); voile.addColorStop(0.6, 'rgba(255,240,210,0)');
  ctx.fillStyle = voile; ctx.beginPath(); ctx.arc(cx, cy, rMax, 0, Math.PI * 2); ctx.fill();
}
