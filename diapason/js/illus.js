// Les dessins de la visite : des traits fins qui bougent, pour montrer en une seconde ce qu'une phrase met dix secondes à dire.
// Rose : Zaza (la voix). Bleu : Frog (le clavier). Or : ce qui naît entre les deux.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Des barres d'onde, toujours les mêmes pour une même graine : un son dessiné, pas du bruit.
function bars(x0, y, n, w, gap, amp, seed) {
  let h = seed; const out = [];
  for (let k = 0; k < n; k++) {
    h = (h * 9301 + 49297) % 233280;
    const env = Math.sin(Math.PI * (k + 0.5) / n);
    const a = Math.max(2, amp * env * (0.35 + 0.65 * (h / 233280)));
    out.push(`M${(x0 + k * (w + gap)).toFixed(1)} ${(y - a).toFixed(1)}v${(2 * a).toFixed(1)}`);
  }
  return out.join('');
}

function piece(z, f) {
  const X = 42; const W = 34; const Y = 250; const H = 96;
  const white = Array.from({ length: 14 }, (_, k) => `<rect x="${X + k * W}" y="${Y}" width="${W}" height="${H}" rx="3" class="il-key"/>`).join('');
  const blackAt = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
  const black = blackAt.map((k) => `<rect x="${X + (k + 1) * W - 10}" y="${Y}" width="20" height="58" rx="2" class="il-bkey"/>`).join('');
  // Quatre accords (do, fa, sol, la mineur), et la note que la voix choisit dans chacun.
  const chords = [[0, 2, 4], [3, 5, 7], [4, 6, 8], [5, 7, 9]];
  const voix = [4, 5, 6, 7];
  const lit = chords.map((c, g) => c.map((k) => `<rect x="${X + k * W + 2}" y="${Y + 62}" width="${W - 4}" height="${H - 64}" rx="2" class="il-lit" style="--g:${g}"/>`).join('')).join('');
  const notes = voix.map((k, g) => {
    const cx = X + k * W + W / 2; const cy = 150 - g * 14;
    return `<g class="il-note" style="--g:${g}"><line x1="${cx}" y1="${cy + 10}" x2="${cx}" y2="${Y - 6}" class="il-guide"/><circle cx="${cx}" cy="${cy}" r="9" class="il-voice"/><circle cx="${cx}" cy="${cy}" r="9" class="il-ring"/><text x="${cx + 16}" y="${cy + 4}" class="il-juste">juste</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 560 390" class="il il-piece">
    <path d="M30 128 C 110 70, 170 190, 250 120 S 400 60, 530 110" class="il-wave z" pathLength="1"/>
    ${notes}
    ${white}${lit}${black}
    <text x="30" y="62" class="il-name z">${esc(z)} · la voix</text>
    <text x="42" y="378" class="il-name f">${esc(f)} · le clavier</text>
  </svg>`;
}

function distance(z, f) {
  const screen = (x, who, cls) => `
    <g transform="translate(${x} 96)">
      <rect width="196" height="132" rx="12" class="il-screen"/>
      <line x1="16" y1="26" x2="96" y2="26" class="il-bar"/>
      ${[0, 1, 2, 3].map((k) => `<rect x="${16 + k * 42}" y="62" width="36" height="8" rx="4" class="il-step"/>`).join('')}
      <rect x="16" y="62" width="162" height="8" rx="4" class="il-fill ${cls}"/>
      <circle cx="16" cy="66" r="7" class="il-dot ${cls}"/>
      <text x="16" y="108" class="il-small">Étape 2 · le refrain</text>
      <line x1="98" y1="132" x2="98" y2="150" class="il-stand"/><line x1="62" y1="150" x2="134" y2="150" class="il-stand"/>
      <text x="98" y="182" text-anchor="middle" class="il-name ${cls}">${esc(who)}</text>
    </g>`;
  return `<svg viewBox="0 0 560 390" class="il il-distance">
    ${screen(18, z, 'z')}${screen(346, f, 'f')}
    <path d="M214 150 C 250 40, 310 40, 346 150" class="il-arc"/>
    <path d="M214 150 C 250 40, 310 40, 346 150" class="il-pulse" pathLength="1"/>
    <path d="M346 150 C 310 40, 250 40, 214 150" class="il-pulse back" pathLength="1"/>
    <text x="280" y="330" text-anchor="middle" class="il-gold">même séance · même seconde</text>
    <path d="M40 300 H250 M310 300 H520" class="il-ground"/><text x="280" y="304" text-anchor="middle" class="il-small">≈</text>
  </svg>`;
}

function relais(z, f) {
  const arc = 'M96 300 C 200 110, 360 110, 464 300';
  const back = 'M464 300 C 360 110, 200 110, 96 300';
  return `<svg viewBox="0 0 560 390" class="il il-relais">
    <path d="${arc}" class="il-arc"/>
    <path d="${arc}" class="il-pulse z t1" pathLength="1"/>
    <path d="${back}" class="il-pulse f t2" pathLength="1"/>
    <path d="${arc}" class="il-pulse z t3" pathLength="1"/>
    <circle cx="70" cy="312" r="24" class="il-node z"/><text x="70" y="318" text-anchor="middle" class="il-ini z">${esc(z[0])}</text>
    <circle cx="490" cy="312" r="24" class="il-node f"/><text x="490" y="318" text-anchor="middle" class="il-ini f">${esc(f[0])}</text>
    <g class="il-layer l1"><path d="${bars(184, 236, 32, 3, 3.2, 26, 7)}" class="il-bars z"/><text x="392" y="210" class="il-small">${esc(z)} lance un son</text></g>
    <g class="il-layer l2"><path d="${bars(186, 252, 32, 3, 3.2, 20, 31)}" class="il-bars f"/><text x="392" y="252" class="il-small">${esc(f)} répond par-dessus</text></g>
    <g class="il-layer l3"><text x="280" y="300" text-anchor="middle" class="il-mots">« le fleuve dort sous nos pas »</text><text x="392" y="300" class="il-small"></text></g>
    <text x="280" y="370" text-anchor="middle" class="il-gold">couche après couche</text>
  </svg>`;
}

function ciel() {
  const cx = 280; const cy = 196;
  const R = [36, 82, 128, 174, 220];
  const rings = R.map((r, k) => `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.18}" ry="${r * 0.7}" class="il-ring-sky${k === 0 ? ' core' : ''}"/>`).join('');
  // Des idées qui naissent au bord et s'approchent du centre, chacune à son rythme.
  const pts = [[-0.9, 'z'], [-0.3, 'f'], [0.4, 'z'], [1.1, 'f'], [1.8, 'z'], [2.5, 'f'], [3.1, 'z'], [3.9, 'f'], [4.6, 'z'], [5.3, 'f']];
  const dots = pts.map(([a, c], k) => {
    const r0 = R[4] - (k % 3) * 18; const r1 = R[1 + (k % 3)];
    const x0 = cx + Math.cos(a) * r0 * 1.18; const y0 = cy + Math.sin(a) * r0 * 0.7;
    const x1 = cx + Math.cos(a) * r1 * 1.18; const y1 = cy + Math.sin(a) * r1 * 0.7;
    return `<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="${5 + (k % 3)}" class="il-star ${c}" style="--tx:${(x1 - x0).toFixed(1)}px;--ty:${(y1 - y0).toFixed(1)}px;--k:${k}"/>`;
  }).join('');
  return `<svg viewBox="0 0 560 390" class="il il-ciel">
    <defs><radialGradient id="ilCore"><stop offset="0" stop-color="#f3c77a" stop-opacity=".7"/><stop offset="1" stop-color="#f3c77a" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="110" ry="66" fill="url(#ilCore)" class="il-glow"/>
    ${rings}
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" class="il-gold">l’album</text>
    <text x="${cx}" y="${cy - R[4] * 0.7 - 8}" text-anchor="middle" class="il-small">idées brutes</text>
    ${dots}
    <path d="M152 128 Q 300 70 418 150" class="il-meet" pathLength="1"/>
    <text x="300" y="80" text-anchor="middle" class="il-small il-meet-t">une rencontre</text>
  </svg>`;
}

// Derrière le mot d'accueil : deux fils, rose et bleu, qui partent de loin et se rejoignent au centre.
const fils = `<svg class="il-fils" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <path d="M-20 360 C 180 160, 380 460, 600 250 S 1000 120, 1220 230" class="il-fil z" pathLength="1"/>
  <path d="M-20 130 C 220 340, 400 90, 600 250 S 980 380, 1220 230" class="il-fil f" pathLength="1"/>
  <circle cx="600" cy="250" r="5" class="il-knot"/>
</svg>`;

export const ILLU = { piece, distance, relais, ciel, fils };
