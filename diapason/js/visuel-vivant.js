// Le portrait d'une chanson, fait par L'oreille : la pièce entière en crêtes empilées, de gauche à droite,
// avec ses parties, son moment fort et sa boucle, tous trouvés à l'écoute. Un trait d'or suit la musique qui joue.
import { ecouter } from './oreille.js';
import { tamponPiste, positionPiste } from './visite-sons.js';

const FOND = '#141210'; const ENCRE = '#efe6d2'; const OR = '#c9a45c';
let analyse = null; // une seule écoute par visite
export const preparerPortrait = () => (analyse ||= Promise.resolve(tamponPiste('projet1')).then((b) => (b ? ecouter(b) : null)).catch(() => null));
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function visuelVivant(cv) {
  const ctx = cv.getContext('2d');
  let res = null; let raf = 0; let env = null; const t0 = performance.now();
  preparerPortrait().then((r) => {
    if (!r) return;
    res = r;
    // L'énergie lissée, ramenée entre 0 et 1, en 240 points.
    const n = 110; const lo = Math.max(...r.db) - 36; env = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = Math.floor((i / n) * r.db.length); const b = Math.floor(((i + 1) / n) * r.db.length); let s = 0; for (let j = a; j < b; j++) s += r.db[j]; env[i] = Math.max(0, Math.min(1, (s / Math.max(1, b - a) - lo) / 36)); }
  });
  const draw = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth; const H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = FOND; ctx.fillRect(0, 0, W, H);
    const S = Math.min(W, H); const ox = (W - S) / 2; const oy = (H - S) / 2; const M = S * 0.09;
    const f = (s) => Math.max(10, Math.round(S * s));
    const x0 = ox + M; const x1 = ox + S - M; const X = (t) => x0 + (t / res.duree) * (x1 - x0);
    ctx.textBaseline = 'alphabetic';
    if (!env) {
      ctx.fillStyle = ENCRE; ctx.globalAlpha = 0.6 + 0.3 * Math.sin((performance.now() - t0) / 300); ctx.textAlign = 'center';
      ctx.font = `italic 500 ${f(0.045)}px "Literata", Georgia, serif`; ctx.fillText('L’oreille écoute la chanson…', W / 2, H / 2);
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw); return;
    }
    // La chanson entière, de gauche à droite : une bande de traits fins, symétrique, comme une onde gravée.
    // Les parties sont séparées par un petit vide ; le moment fort est en or.
    const cy = oy + S * 0.43; const amp = S * 0.17; const fort = res.momentFort;
    const pos = positionPiste(); const ici = pos && pos.id === 'projet1' ? pos.s : null;
    const jouees = res.parties.filter((p) => !p.silence);
    const n = env.length; const pas = (x1 - x0) / n;
    ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, pas * 0.55);
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * res.duree; const x = x0 + (i + 0.5) * pas;
      if (jouees.some((p) => Math.abs(t - p.a) < res.duree / n * 0.9 && p.a > 0.5)) continue; // la couture entre deux parties
      const h = 2 + env[i] ** 1.4 * amp; const dansFort = t >= fort[0] && t <= fort[1]; const passe = ici != null && t <= ici;
      ctx.strokeStyle = dansFort ? OR : ENCRE; ctx.globalAlpha = dansFort ? 1 : passe ? 0.95 : 0.55;
      ctx.beginPath(); ctx.moveTo(x, cy - h); ctx.lineTo(x, cy + h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Le trait d'or : où en est la musique en ce moment.
    if (ici != null && ici < res.duree) { const x = X(ici); ctx.strokeStyle = OR; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, cy - amp - 10); ctx.lineTo(x, cy + amp + 10); ctx.stroke(); }
    // Sous la bande : les parties (lettres), la boucle (crochet). Au-dessus : le moment fort.
    const yP = cy + amp + f(0.06);
    ctx.font = `600 ${f(0.028)}px "Atkinson Hyperlegible", sans-serif`; ctx.textAlign = 'center';
    jouees.forEach((p, i) => {
      const actif = ici != null && ici >= p.a && ici < p.b;
      ctx.fillStyle = actif ? OR : ENCRE; ctx.globalAlpha = actif ? 1 : 0.65;
      ctx.fillRect(X(p.a) + 3, yP - f(0.03), X(p.b) - X(p.a) - 6, 1.2);
      ctx.fillText(String.fromCharCode(65 + i), (X(p.a) + X(p.b)) / 2, yP);
    });
    ctx.globalAlpha = 1; ctx.fillStyle = OR; ctx.font = `italic 500 ${f(0.027)}px "Literata", Georgia, serif`;
    ctx.fillText('moment fort', (X(fort[0]) + X(fort[1])) / 2, cy - amp - f(0.03));
    if (res.boucle) {
      const ya = yP + f(0.035); const a = X(res.boucle.a); const b = X(res.boucle.b);
      ctx.strokeStyle = OR; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a, ya - 5); ctx.lineTo(a, ya); ctx.lineTo(b, ya); ctx.lineTo(b, ya - 5); ctx.stroke();
      ctx.fillText(`la boucle`, (a + b) / 2, ya + f(0.032));
    }
    const bpm = res.bpm < 80 ? res.bpm * 2 : res.bpm; // l'autocorrélation entend parfois la moitié du tempo
    // Le cadre d'un vrai tirage, avec ce que L'oreille a entendu.
    ctx.fillStyle = ENCRE; ctx.font = `500 ${f(0.026)}px "Atkinson Hyperlegible", sans-serif`; ctx.globalAlpha = 0.8;
    ctx.textAlign = 'left'; ctx.fillText('FLIP · L’oreille', x0, oy + M + f(0.03));
    ctx.textAlign = 'right'; ctx.fillText(`${res.ton.split(' ou ')[0]} · ${bpm} BPM · ${jouees.length} parties`, x1, oy + M + f(0.03));
    ctx.globalAlpha = 1; ctx.fillRect(x0, oy + M + f(0.05), x1 - x0, 1);
    ctx.textAlign = 'left'; ctx.font = `800 ${f(0.08)}px "Literata", Georgia, serif`;
    ctx.fillText('Après le silence', x0, oy + S - M - f(0.055));
    ctx.font = `italic 500 ${f(0.038)}px "Literata", Georgia, serif`; ctx.fillStyle = OR;
    ctx.fillText('Zaza & Frog', x0, oy + S - M);
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}
