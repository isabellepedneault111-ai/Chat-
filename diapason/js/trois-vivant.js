// Le troisième musicien en direct : on voit notre phrase s'écrire note par note, puis sa réponse, en miroir autour du Ré.
import { troisReponse, TROIS, horloge } from './visite-sons.js';

const NOMS = { 55: 'Sol', 57: 'La', 58: 'Si♭', 60: 'Do', 62: 'Ré', 64: 'Mi', 65: 'Fa', 67: 'Sol', 69: 'La' };
const FOND = '#141210'; const ENCRE = '#efe6d2'; const OR = '#e8c27a'; const ROSE = '#ff6fae';

// Anime le dessin de « la troisième voix » au rythme de l’horloge audio.
export function troisVivant(cv) {
  const info = troisReponse();
  const t0p = performance.now() / 1000; const t0a = horloge();
  const now = () => (info.son ? horloge() : t0a + (performance.now() / 1000 - t0p));
  const ctx = cv.getContext('2d'); let raf = 0;
  const long = TROIS.ryt.reduce((a, b) => a + b, 0); const total = 2 * long + TROIS.pause;
  const notesDe = (liste, debut) => { let w = debut; return liste.map((m, i) => { const o = { m, a: w, d: TROIS.ryt[i] }; w += TROIS.ryt[i]; return o; }); };
  const A = notesDe(TROIS.a, 0); const B = notesDe(TROIS.b, long + TROIS.pause);
  const draw = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth; const H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = FOND; ctx.fillRect(0, 0, W, H);
    const beat = (now() - info.t0) / info.noire; // en temps de la musique
    const gx = Math.max(54, W * 0.1); const gw = W - gx - 24; const top = H * 0.2; const bas = H * 0.82;
    const RANG = Object.keys(NOMS).map(Number); const Y = (m) => bas - (RANG.indexOf(m) / (RANG.length - 1)) * (bas - top); const X = (b) => gx + (b / total) * gw; // une ligne par note de la gamme
    // Les lignes de la gamme (ré mineur), avec leur nom.
    ctx.font = `500 ${Math.max(11, H * 0.035)}px "Atkinson Hyperlegible", sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    Object.entries(NOMS).forEach(([m, n]) => { ctx.strokeStyle = 'rgba(239,230,210,.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, Y(+m)); ctx.lineTo(gx + gw, Y(+m)); ctx.stroke(); ctx.fillStyle = 'rgba(239,230,210,.5)'; ctx.fillText(n, gx - 8, Y(+m)); });
    // Le miroir : la ligne du Ré, autour de laquelle il renverse la phrase.
    if (beat > long) { ctx.setLineDash([5, 5]); ctx.strokeStyle = OR; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(gx, Y(62)); ctx.lineTo(gx + gw, Y(62)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const bloc = (o, coul) => {
      if (beat < o.a) return;
      const p = Math.min(1, (beat - o.a) / o.d); const h = Math.max(12, ((bas - top) / 8) * 0.62);
      ctx.fillStyle = coul; ctx.globalAlpha = beat < o.a + o.d ? 1 : 0.75;
      ctx.beginPath(); ctx.roundRect(X(o.a) + 2, Y(o.m) - h / 2, Math.max(4, (X(o.a + o.d * p) - X(o.a)) - 4), h, 4); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = FOND; ctx.textAlign = 'left'; ctx.font = `700 ${Math.max(10, h * 0.62)}px "Atkinson Hyperlegible", sans-serif`;
      if (p > 0.5) ctx.fillText(NOMS[o.m], X(o.a) + 7, Y(o.m) + 1);
    };
    A.forEach((o) => bloc(o, ROSE)); B.forEach((o) => bloc(o, OR));
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = `italic 600 ${Math.max(12, H * 0.045)}px "Literata", Georgia, serif`;
    if (beat >= 0) { ctx.fillStyle = ROSE; ctx.fillText('Notre phrase', X(0), top - H * 0.06); }
    if (beat >= long + TROIS.pause) { ctx.fillStyle = OR; ctx.fillText('Sa réponse : renversée', X(long + TROIS.pause), top - H * 0.06); }
    if (beat > total + 0.5) { ctx.fillStyle = ENCRE; ctx.textAlign = 'center'; ctx.font = `500 ${Math.max(12, H * 0.04)}px "Atkinson Hyperlegible", sans-serif`; ctx.fillText('Ce qui montait descend. À nous de lui répondre.', W / 2, H - H * 0.06); }
    if (beat < total + 4) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}
