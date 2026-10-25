// Le rituel du grimoire : une flamme, une respiration, trois cartes face cachée.
// On en choisit une (c'est là qu'est la magie), elle s'élève, se retourne dans les braises.
// Cartes en 3D CSS, braises et fumée sur canvas, nappe et cloche en Web Audio.
import { audio, out } from './audio.js';
import { FLAME } from './marque.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII'];
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Son : une nappe grave qui monte, une cloche au retournement ----------
function drone() {
  const c = audio();
  const t = c.currentTime;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 3);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
  g.connect(f).connect(out());
  const oscs = [36, 43, 48, 55].map((m, i) => {
    const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine';
    o.frequency.value = 440 * 2 ** ((m - 69) / 12); o.detune.value = (i - 1.5) * 4;
    o.connect(g); o.start(t); return o;
  });
  return () => { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + 1.8); oscs.forEach((o) => o.stop(n + 2)); };
}
function bell() {
  const c = audio();
  const t = c.currentTime;
  [[76, 1], [83, 0.5], [88, 0.3], [64, 0.6]].forEach(([m, a], i) => {
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.value = 440 * 2 ** ((m - 69) / 12) * (i === 2 ? 1.003 : 1);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 - i * 0.6);
    o.connect(g).connect(out()); o.start(t); o.stop(t + 4.6);
  });
}

// ---------- Braises et fumée ----------
// La lune rendue en volume : éclairage selon la phase réelle (cycle synodique de 29,53 jours),
// avec quelques mers lunaires et un grain très fin. Peinte une fois, puis réutilisée.
export function moonPhase(date = new Date()) {
  const syn = 29.530588853;
  const age = ((((date - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn) + syn) % syn;
  return { age, frac: age / syn, lit: (1 - Math.cos((2 * Math.PI * age) / syn)) / 2 };
}
function paintMoon(px, r) {
  const n = Math.max(8, Math.round(px * 2));
  const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  const c = cv.getContext('2d'); const img = c.createImageData(n, n);
  const { frac, lit } = moonPhase();
  const ang = 2 * Math.PI * frac;
  const L = [Math.sin(ang), -0.08, -Math.cos(ang)];
  const maria = [[-0.25, -0.2, 0.32], [0.18, -0.3, 0.22], [0.05, 0.25, 0.28], [-0.35, 0.3, 0.18], [0.35, 0.05, 0.16]];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n * 2 - 1; const y = (j + 0.5) / n * 2 - 1; const d = x * x + y * y;
    const k = (j * n + i) * 4;
    if (d > 1) { img.data[k + 3] = 0; continue; }
    const z = Math.sqrt(1 - d);
    let b = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
    b = Math.pow(b, 0.75);
    let alb = 0.92;
    for (const [mxx, myy, rr] of maria) { const q = ((x - mxx) ** 2 + (y - myy) ** 2) / (rr * rr); alb -= 0.16 * Math.exp(-q * 2); }
    alb += (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453 % 1) * 0.03;
    const earth = 0.05; // lumière cendrée, à peine
    const v = Math.min(1, b * alb + earth * (1 - b));
    const edge = Math.min(1, (1 - Math.sqrt(d)) * n * 0.5); // bord adouci
    img.data[k] = 244 * v; img.data[k + 1] = 239 * v; img.data[k + 2] = 226 * v; img.data[k + 3] = 255 * edge * Math.min(1, 0.35 + v * 1.4);
  }
  c.putImageData(img, 0, 0);
  return { cv, r, lit };
}

export function embers(cv, { soft = false } = {}) {
  // La nuit et l'eau, avec le feu : étoiles, croissant de lune, eau qui ondule, braises qui montent.
  const ctx = cv.getContext('2d');
  let w = 0; let h = 0; let raf = 0; let burst = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const P = [];
  let moonImg = null;
  const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random() * 0.62, r: 0.4 + Math.random() * 1.1, s: 0.4 + Math.random() * 1.6, p: Math.random() * 6.3 }));
  const spawn = (n, x, y, spread, speed) => { for (let i = 0; i < n; i++) P.push({ x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 0.5, vy: -(0.35 + Math.random() * speed), life: 1, decay: 0.005 + Math.random() * 0.008, s: 0.6 + Math.random() * 1.6, hue: 18 + Math.random() * 28 }); };
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const t = now / 1000;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    // étoiles qui scintillent
    for (const st of stars) {
      ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * st.s + st.p));
      ctx.fillStyle = '#eef1ff';
      ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 6.29); ctx.fill();
    }
    // la lune de ce soir, dans sa vraie phase
    const mx = w * 0.82; const my = h * 0.15; const mr = Math.max(12, Math.min(w, h) * 0.04);
    if (!moonImg || moonImg.r !== mr) moonImg = paintMoon(mr * dpr, mr);
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 2.6);
    halo.addColorStop(0, `rgba(210,218,245,${0.10 * moonImg.lit})`); halo.addColorStop(1, 'rgba(210,218,245,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 2.6, 0, 6.29); ctx.fill();
    ctx.drawImage(moonImg.cv, mx - mr, my - mr, mr * 2, mr * 2);
    // l'eau : trois nappes qui ondulent, un reflet de lune
    for (let i = 0; i < 3; i++) {
      const y0 = h * (0.8 + i * 0.06);
      const crest = new Path2D();
      for (let x = -8; x <= w + 8; x += 8) { const yy = y0 + Math.sin(x * 0.006 + t * (0.35 + i * 0.2) + i) * (7 + i * 4) + Math.sin(x * 0.015 - t * 0.6) * 3; if (x < 0) crest.moveTo(x, yy); else crest.lineTo(x, yy); }
      const body = new Path2D(crest); body.lineTo(w + 8, h + 2); body.lineTo(-8, h + 2); body.closePath();
      ctx.fillStyle = `rgba(${28 + i * 6},${48 + i * 8},${96 + i * 10},${0.32 + i * 0.12})`; ctx.fill(body);
      ctx.strokeStyle = 'rgba(170,196,255,0.22)'; ctx.lineWidth = 1; ctx.stroke(crest);
    }
    for (let k = 0; k < 6; k++) {
      ctx.globalAlpha = (0.14 + 0.1 * Math.sin(t * 1.3 + k)) * (0.3 + 0.7 * (moonImg?.lit ?? 1));
      ctx.fillStyle = '#e8ecff';
      ctx.fillRect(mx - 30 + Math.sin(t + k) * 12, h * 0.83 + k * 9, 60 - k * 7, 1.5);
    }
    ctx.globalAlpha = 1;
    // braises
    if (Math.random() < (soft ? 0.2 : 0.5)) spawn(1, w / 2, h * 0.86, w * 0.7, soft ? 1 : 1.4);
    if (burst > 0) { spawn(14, w / 2, h * 0.5, 160, 4); burst--; }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i];
      q.x += q.vx + Math.sin(now / 600 + i) * 0.25; q.y += q.vy; q.vy *= 0.997; q.life -= q.decay;
      if (q.life <= 0 || q.y < -20) { P.splice(i, 1); continue; }
      const r = q.s * (1 + (1 - q.life) * 0.6);
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 6);
      g.addColorStop(0, `hsla(${q.hue},100%,70%,${0.85 * q.life})`);
      g.addColorStop(0.25, `hsla(${q.hue},100%,50%,${0.3 * q.life})`);
      g.addColorStop(1, 'hsla(20,100%,40%,0)');
      ctx.fillStyle = g; ctx.fillRect(q.x - r * 6, q.y - r * 6, r * 12, r * 12);
    }
  };
  raf = requestAnimationFrame(tick);
  addEventListener('resize', size);
  return { burst() { burst = 10; }, stop() { cancelAnimationFrame(raf); removeEventListener('resize', size); } };
}

const BACK = `<div class="rc-back"><div class="rc-frame"></div><div class="rc-emblem">${FLAME('rc-flame')}</div><p class="rc-mark">FLIP</p></div>`;
function faceHTML(t) {
  return `<div class="rc-face"><div class="rc-frame"></div>
    <p class="rc-num">${ROMAN[t.num % ROMAN.length]}</p>
    <p class="rc-name">${esc(t.card.nom)}</p>
    <p class="rc-word">${t.mots.map(esc).join('<br>')}</p>
    <p class="rc-rule">${esc(t.card.consigne)}</p>
    ${t.card.perso ? `<p class="rc-by">rituel de ${esc(t.card.by || 'Zaza')}</p>` : t.card.src ? `<p class="rc-by">${esc(t.card.src)}</p>` : ''}
  </div>`;
}

// tirages : trois { card, mots, num } ; onAccept(tirage) ; resolve à la fermeture.
export function rituel(tirages, { onAccept, theme = '' } = {}) {
  const box = document.createElement('div');
  box.className = 'rituel';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Tirer une carte du grimoire');
  box.innerHTML = `
    <canvas class="rt-embers" aria-hidden="true"></canvas>
    <button class="rt-close" data-r="close" aria-label="Fermer">×</button>
    <div class="rt-breath"><div class="rt-flame">${FLAME('rt-flame-svg')}</div><p class="rt-say">Inspire…</p></div>
    <div class="rt-stage" hidden>
      <p class="rt-ask">${theme ? `<span>${esc(theme)}</span>` : ''}Choisis une carte.</p>
      <div class="rt-fan">${tirages.map((t, i) => `<button class="rcard" data-i="${i}" style="--i:${i - 1};--a:${Math.abs(i - 1)}" aria-label="Carte ${i + 1}"><div class="rc-inner">${BACK}${faceHTML(t)}</div></button>`).join('')}</div>
      <div class="rt-choice" hidden><button class="btn big rt-accept" data-r="accept">Accepter la carte</button><button class="btn ghost rt-again" data-r="again">La rendre au feu</button></div>
    </div>`;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const fx = embers(box.querySelector('.rt-embers'));
  const stopDrone = drone();
  let chosen = null;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const showStage = () => { box.querySelector('.rt-breath').classList.add('out'); box.querySelector('.rt-stage').hidden = false; later(30, () => box.classList.add('dealt')); };
  // Une respiration : inspire (4 s), expire (4 s), puis les cartes.
  if (calm()) showStage();
  else {
    box.classList.add('breathing');
    later(4000, () => { box.querySelector('.rt-say').textContent = 'Expire…'; box.classList.add('exhale'); });
    later(7600, showStage);
  }
  const close = () => {
    timers.forEach(clearTimeout); stopDrone(); fx.stop();
    box.classList.remove('in'); box.classList.add('out');
    setTimeout(() => box.remove(), 600);
    removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  box.addEventListener('click', (e) => {
    const r = e.target.closest('[data-r]')?.dataset.r;
    if (r === 'close') { close(); return; }
    if (r === 'accept' && chosen != null) { onAccept?.(tirages[chosen]); close(); return; }
    if (r === 'again') {
      chosen = null;
      box.classList.remove('chosen');
      box.querySelectorAll('.rcard').forEach((c) => c.classList.remove('picked', 'flipped', 'gone'));
      box.querySelector('.rt-choice').hidden = true;
      return;
    }
    if (r === 'breath') { showStage(); return; }
    const card = e.target.closest('.rcard');
    if (card && chosen == null) {
      chosen = +card.dataset.i;
      box.classList.add('chosen');
      box.querySelectorAll('.rcard').forEach((c) => c.classList.toggle(c === card ? 'picked' : 'gone', true));
      later(calm() ? 0 : 750, () => { card.classList.add('flipped'); bell(); fx.burst(); });
      later(calm() ? 100 : 1700, () => { box.querySelector('.rt-choice').hidden = false; box.querySelector('.rt-accept').focus(); });
    }
  });
  // Un toucher pendant la respiration : on passe directement aux cartes.
  box.querySelector('.rt-breath').addEventListener('click', () => { if (!box.classList.contains('dealt')) { timers.forEach(clearTimeout); showStage(); } });
  return { close };
}
