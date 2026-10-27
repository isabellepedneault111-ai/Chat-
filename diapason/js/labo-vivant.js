// Le labo en direct dans la visite : trois disques comme dans la vraie app, synchronisés au son.
// Lents, on voit chaque bosse frapper sous la flèche ; en accélérant, ils passent en ralenti et finissent par chanter un accord.
import { laboAccord, horloge, LABO } from './visite-sons.js';

const COUL = ['#3fd7f2', '#9a6bff', '#ff6fae'];
const NOTES = ['Ré', 'Fa −33¢', 'La'];
const SPIN_MAX = 1.1; // tours visibles par seconde, au-delà : ralenti

// Fait vivre le dessin du labo au rythme de la musique : il suit l’horloge audio quand le son joue.
export function laboVivant(cv) {
  const info = laboAccord();
  const t0Perf = performance.now() / 1000; const t0Audio = horloge();
  const now = () => (info.son ? horloge() : info.t0 + (performance.now() / 1000 - t0Perf) - (info.t0 - t0Audio));
  const { mesure, w0 } = info; const fin = mesure + LABO.monte;
  const r = LABO.fin / w0;
  const omega = (tau) => (tau < mesure ? w0 : tau < fin ? w0 * r ** ((tau - mesure) / LABO.monte) : LABO.fin);
  const ctx = cv.getContext('2d');
  let angle = 0; let last = null; let raf = 0; const flash = [0, 0, 0];
  const draw = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth; const H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const tau = Math.max(0, now() - info.t0);
    const w = omega(tau);
    const dt = last == null ? 0 : Math.min(0.1, tau - last); last = tau;
    const prev = angle; angle += Math.min(w, SPIN_MAX) * dt;
    const chante = tau >= fin;
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2; const cy = (H - 60) / 2 + 12; const R = Math.min(W, H - 90) * 0.4; // place sous le cercle pour les notes
    ctx.lineWidth = 2.2; ctx.shadowBlur = 14;
    LABO.n.forEach((n, i) => {
      const rad = R * (1 - i * 0.24); const A = rad * 0.07;
      // Une bosse passe sous la flèche : le disque frappe (en lent seulement).
      if (w < 6 && Math.floor(prev * n) !== Math.floor(angle * n)) flash[i] = 1;
      flash[i] *= 0.9;
      ctx.strokeStyle = COUL[i]; ctx.shadowColor = COUL[i];
      ctx.globalAlpha = 0.55 + 0.45 * Math.max(flash[i], chante ? 1 : 0);
      ctx.beginPath();
      for (let k = 0; k <= 240; k++) {
        const th = (k / 240) * Math.PI * 2;
        const rr = rad + A * Math.cos(n * (th - angle * Math.PI * 2));
        const x = cx + rr * Math.sin(th); const y = cy - rr * Math.cos(th);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = COUL[i]; ctx.beginPath(); ctx.arc(cx, cy - rad - A, 4 + 5 * flash[i], 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 26); ctx.lineTo(cx, cy - R * 0.3); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 6, cy - R - 30); ctx.lineTo(cx + 6, cy - R - 30); ctx.lineTo(cx, cy - R - 20); ctx.fill();
    // Ce qu'on entend, comme dans le labo.
    const clics = w * LABO.n[0];
    ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif'; ctx.textBaseline = 'top';
    ctx.fillStyle = clics < 20 ? '#3fd7f2' : '#ff6fae';
    ctx.fillText(clics < 20 ? 'Tu entends un RYTHME' : 'Tu entends un ACCORD', 14, 14);
    if (w > SPIN_MAX) { ctx.fillStyle = '#f3c77a'; ctx.textAlign = 'right'; ctx.fillText(`ralenti ×${Math.round(w / SPIN_MAX)}`, W - 14, 14); ctx.textAlign = 'left'; }
    ctx.textAlign = 'center';
    if (!chante) {
      ctx.fillStyle = '#efe9dc'; ctx.font = '600 15px "Atkinson Hyperlegible", sans-serif';
      ctx.fillText(tau < mesure ? '6, 7 et 9 frappes par mesure, sur le temps de ta musique' : `${Math.round(clics)} frappes par seconde`, cx, H - 30);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = `italic 700 ${Math.round(R * 0.32)}px "Literata", Georgia, serif`; ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.min(1, (tau - fin) * 2); ctx.fillText('Ça chante.', cx, cy);
      ctx.font = '700 15px "Atkinson Hyperlegible", sans-serif'; ctx.textBaseline = 'top';
      NOTES.forEach((nm, i) => { ctx.fillStyle = COUL[i]; ctx.fillText(nm, cx + (i - 1) * 70, H - 50); });
      ctx.fillStyle = '#efe9dc'; ctx.fillText('Un ré mineur qu’aucun piano ne peut jouer', cx, H - 28);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
    if (tau < fin + LABO.tient + 1.5) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}
