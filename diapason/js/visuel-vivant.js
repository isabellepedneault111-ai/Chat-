// Le visuel d'une chanson, en direct : le spectre de la pièce de Frog, mesure après mesure, devient des crêtes empilées,
// comme une gravure. Chaque ligne est un instant de la musique ; la plus récente est devant.
import { analyseur } from './visite-sons.js';

const FOND = '#141210'; const ENCRE = '#efe6d2'; const OR = '#c9a45c';
const RANGS = 30; const BINS = 72;

export function visuelVivant(cv) {
  const ctx = cv.getContext('2d');
  const hist = []; let raf = 0; let t = 0; let last = 0;
  const data = new Uint8Array(512);
  const instant = () => {
    const an = analyseur();
    const v = new Float32Array(BINS);
    if (an) {
      an.getByteFrequencyData(data);
      // Bandes en échelle logarithmique : les graves à gauche, les aigus à droite, comme on les entend.
      for (let i = 0; i < BINS; i++) { const a = Math.floor(2 * 1.07 ** i); const b = Math.max(a + 1, Math.floor(2 * 1.07 ** (i + 1))); let s = 0; for (let j = a; j < b && j < 512; j++) s += data[j]; v[i] = s / (b - a) / 255; }
    } else {
      for (let i = 0; i < BINS; i++) v[i] = 0.25 + 0.25 * Math.sin(i * 0.3 + t * 2.1) * Math.sin(i * 0.11 - t * 1.3) + 0.15 * Math.sin(t * 4 + i);
    }
    return v;
  };
  const draw = (now) => {
    t = now / 1000;
    const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth; const H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (now - last > 90) { hist.unshift(instant()); if (hist.length > RANGS) hist.pop(); last = now; }
    ctx.fillStyle = FOND; ctx.fillRect(0, 0, W, H);
    const S = Math.min(W, H); const ox = (W - S) / 2; const oy = (H - S) / 2; const M = S * 0.09;
    const top = oy + M + S * 0.16; const haut = S * 0.5;
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    // De l'arrière vers l'avant : chaque ligne cache celle de derrière.
    for (let k = hist.length - 1; k >= 0; k--) {
      const y0 = top + ((RANGS - 1 - k) / RANGS) * haut; const v = hist[k];
      ctx.beginPath();
      for (let i = 0; i < BINS; i++) {
        const x = ox + M + (i / (BINS - 1)) * (S - 2 * M);
        const c = Math.exp(-(((i - BINS * 0.45) / (BINS * 0.3)) ** 2));
        const y = y0 - c * v[i] * S * 0.22;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.lineTo(ox + S - M, y0 + 3); ctx.lineTo(ox + M, y0 + 3); ctx.closePath();
      ctx.fillStyle = FOND; ctx.fill();
      ctx.strokeStyle = k === 0 ? OR : ENCRE; ctx.globalAlpha = k === 0 ? 1 : 0.35 + 0.65 * (1 - k / RANGS); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Le cadre d'un vrai tirage : métadonnées, règle fine, titre, signature.
    const f = (s) => Math.max(10, Math.round(S * s));
    ctx.fillStyle = ENCRE; ctx.textBaseline = 'alphabetic';
    ctx.font = `500 ${f(0.028)}px "Atkinson Hyperlegible", sans-serif`; ctx.globalAlpha = 0.8;
    ctx.textAlign = 'left'; ctx.fillText('FLIP', ox + M, oy + M + f(0.03));
    ctx.textAlign = 'right'; ctx.fillText('Ré mineur · 120 BPM', ox + S - M, oy + M + f(0.03));
    ctx.globalAlpha = 1; ctx.fillRect(ox + M, oy + M + f(0.05), S - 2 * M, 1);
    ctx.textAlign = 'left'; ctx.font = `800 ${f(0.085)}px "Literata", Georgia, serif`;
    ctx.fillText('Après le silence', ox + M, oy + S - M - f(0.06));
    ctx.font = `italic 500 ${f(0.04)}px "Literata", Georgia, serif`; ctx.fillStyle = OR;
    ctx.fillText('Zaza & Frog', ox + M, oy + S - M);
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}
