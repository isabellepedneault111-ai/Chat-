// Nos talismans. Zaza : une demi-lune dont une corde relie les pointes ; elle devient un arc, la flèche tendue, prête à partir.
// Frog : le triskel, trois spirales nées d'un même centre, qui tournent, reviennent et grandissent.

export function arcSVG(cls = '') {
  return `<svg class="tal tal-arc ${cls}" viewBox="0 0 200 200" aria-hidden="true">
    <path class="tal-lune" d="M104 18 A86 86 0 0 1 104 182 A64 64 0 0 0 104 18 Z"/>
    <path class="tal-corde tal-tendue" d="M104 20 L52 100 L104 180"/>
    <path class="tal-corde tal-droite" d="M104 20 L104 180"/>
    <g class="tal-fleche">
      <path d="M52 100 H192"/>
      <path class="tal-pointe" d="M192 100 l-14 -7 v14 Z"/>
      <path d="M52 100 l-10 -9 M60 100 l-10 -9 M52 100 l-10 9 M60 100 l-10 9"/>
    </g>
  </svg>`;
}

export function triskelSVG(cls = '') {
  const C = 100; const R = 44; let d = '';
  for (let a = 0; a < 3; a++) {
    const th = (a * 2 * Math.PI) / 3 - Math.PI / 2;
    const cx = C + R * Math.cos(th); const cy = C + R * Math.sin(th);
    // De centre commun vers le centre de sa spirale, en s'enroulant deux tours et quart.
    for (let k = 0; k <= 90; k++) {
      const s = k / 90; const rho = R * (1 - s) ** 1.15; const ang = th + Math.PI + s * Math.PI * 2 * 2.25;
      const x = cx + rho * Math.cos(ang); const y = cy + rho * Math.sin(ang);
      d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return `<svg class="tal tal-triskel ${cls}" viewBox="0 0 200 200" aria-hidden="true"><g class="tal-tourne"><path d="${d}"/></g></svg>`;
}
