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
export function embers(cv, { soft = false } = {}) {
  // La nuit et l'eau, avec le feu : étoiles, croissant de lune, eau qui ondule, braises qui montent.
  const ctx = cv.getContext('2d');
  let w = 0; let h = 0; let raf = 0; let burst = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const P = [];
  const spawn = (n, x, y, spread, speed) => { for (let i = 0; i < n; i++) P.push({ x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 0.5, vy: -(0.35 + Math.random() * speed), life: 1, decay: 0.005 + Math.random() * 0.008, s: 0.6 + Math.random() * 1.6, hue: 18 + Math.random() * 28 }); };
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const t = now / 1000;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    // deux halos qui dérivent lentement : le feu (ambre) et l'eau (bleu profond), comme des lumières de scène dans la brume
    const glows = [[0.32 + 0.12 * Math.sin(t * 0.05), 0.62 + 0.06 * Math.cos(t * 0.04), 0.75, '255,120,40', 0.16], [0.72 + 0.1 * Math.cos(t * 0.045), 0.38 + 0.08 * Math.sin(t * 0.035), 0.8, '60,90,180', 0.18]];
    for (const [gx, gy, gr, col, al] of glows) {
      const R = gr * Math.max(w, h);
      const g = ctx.createRadialGradient(gx * w, gy * h, 0, gx * w, gy * h, R);
      g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // braises
    if (Math.random() < (soft ? 0.15 : 0.45)) spawn(1, w / 2, h + 10, w * 0.8, soft ? 1 : 1.4);
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

// ---------- Les autres univers : gravure (arcanes), encre (ce qui touche), ombre (peurs), mots flottants ----------
function loop(cv, draw) {
  const ctx = cv.getContext('2d');
  let w = 0; let h = 0; let raf = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  let burst = 0;
  const tick = (now) => { raf = requestAnimationFrame(tick); draw(ctx, w, h, now / 1000, burst); if (burst > 0) burst -= 0.02; };
  raf = requestAnimationFrame(tick);
  addEventListener('resize', size);
  return { burst() { burst = 1; }, stop() { cancelAnimationFrame(raf); removeEventListener('resize', size); } };
}
// Gravure : cercles et rayons dorés, très fins, qui tournent lentement, comme un dos de carte gravé.
function gravure(cv) {
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 6.3 }));
  return loop(cv, (c, w, h, t, b) => {
    c.clearRect(0, 0, w, h);
    const cx = w / 2; const cy = h * 0.52; const R = Math.min(w, h) * 0.46;
    c.save(); c.translate(cx, cy);
    for (let k = 0; k < 4; k++) {
      c.rotate(t * 0.02 * (k % 2 ? -1 : 1));
      c.strokeStyle = `rgba(214,176,92,${0.10 + b * 0.25})`; c.lineWidth = 1;
      c.beginPath(); c.arc(0, 0, R * (0.35 + k * 0.2), 0, 6.29); c.stroke();
      const n = 12 + k * 6;
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.29; c.beginPath(); c.moveTo(Math.cos(a) * R * (0.33 + k * 0.2), Math.sin(a) * R * (0.33 + k * 0.2)); c.lineTo(Math.cos(a) * R * (0.4 + k * 0.2), Math.sin(a) * R * (0.4 + k * 0.2)); c.stroke(); }
    }
    c.restore();
    for (const d of dust) { c.globalAlpha = 0.2 + 0.5 * Math.abs(Math.sin(t * 0.6 + d.s)); c.fillStyle = '#e8c77a'; c.fillRect(d.x * w, d.y * h, 1.4, 1.4); }
    c.globalAlpha = 1;
  });
}
// Encre : des nappes d'encre qui se diffusent dans l'eau, puis s'effacent.
function encre(cv) {
  const blots = [];
  return loop(cv, (c, w, h, t, b) => {
    c.clearRect(0, 0, w, h);
    if (blots.length < 7 && Math.random() < 0.02 + b * 0.2) blots.push({ x: 0.15 + Math.random() * 0.7, y: 0.2 + Math.random() * 0.7, r: 0, max: 0.18 + Math.random() * 0.25, hue: Math.random() < 0.7 ? '70,100,190' : '150,90,170', life: 1 });
    for (let i = blots.length - 1; i >= 0; i--) {
      const o = blots[i]; o.r += (o.max - o.r) * 0.006; o.life -= 0.0016; if (o.life <= 0) { blots.splice(i, 1); continue; }
      const R = o.r * Math.max(w, h);
      for (let k = 0; k < 3; k++) {
        const ox = Math.sin(t * 0.3 + k + i) * R * 0.15; const oy = Math.cos(t * 0.25 + k * 2 + i) * R * 0.15;
        const g = c.createRadialGradient(o.x * w + ox, o.y * h + oy, 0, o.x * w + ox, o.y * h + oy, R * (0.7 + k * 0.2));
        g.addColorStop(0, `rgba(${o.hue},${0.16 * o.life})`); g.addColorStop(1, `rgba(${o.hue},0)`);
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }
    }
  });
}
// Ombre : presque noir, un faisceau de lumière lent qui balaie, de la poussière dans la lumière.
function ombre(cv) {
  const dust = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), v: 0.0002 + Math.random() * 0.0005, s: Math.random() * 6.3 }));
  return loop(cv, (c, w, h, t, b) => {
    c.clearRect(0, 0, w, h);
    const a = -0.5 + Math.sin(t * 0.12) * 0.35; const x0 = w * 0.5; const y0 = -h * 0.1;
    c.save(); c.translate(x0, y0); c.rotate(a);
    const g = c.createLinearGradient(-w * 0.18, 0, w * 0.18, 0);
    g.addColorStop(0, 'rgba(220,225,235,0)'); g.addColorStop(0.5, `rgba(220,225,235,${0.10 + b * 0.15})`); g.addColorStop(1, 'rgba(220,225,235,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-w * 0.04, 0); c.lineTo(w * 0.04, 0); c.lineTo(w * 0.3, h * 1.5); c.lineTo(-w * 0.3, h * 1.5); c.closePath(); c.fill();
    c.restore();
    for (const d of dust) { d.y -= d.v; if (d.y < 0) d.y = 1; c.globalAlpha = 0.15 + 0.35 * Math.abs(Math.sin(t + d.s)); c.fillStyle = '#dfe3ea'; c.fillRect(d.x * w + Math.sin(t * 0.4 + d.s) * 6, d.y * h, 1.2, 1.2); }
    c.globalAlpha = 1;
  });
}
// Nos mots : les mots du champ qui flottent, très doucement.
function flottants(cv, words) {
  const W = (words.length ? words : ['lune', 'marée', 'braise', 'souffle']).slice(0, 24).map((w) => ({ w, x: Math.random(), y: Math.random(), v: 0.0003 + Math.random() * 0.0006, s: 14 + Math.random() * 26, p: Math.random() * 6.3 }));
  return loop(cv, (c, w, h, t) => {
    c.clearRect(0, 0, w, h);
    for (const o of W) {
      o.y -= o.v; if (o.y < -0.05) { o.y = 1.05; o.x = Math.random(); }
      c.globalAlpha = 0.08 + 0.12 * Math.abs(Math.sin(t * 0.3 + o.p));
      c.fillStyle = '#f3ead6'; c.font = `600 ${o.s}px Literata, Georgia, serif`;
      c.fillText(o.w, o.x * w, o.y * h);
    }
    c.globalAlpha = 1;
  });
}
const FONDS = { arcanes: gravure, touche: encre, peurs: ombre };

const BACK = `<div class="rc-back"><div class="rc-frame"></div><div class="rc-emblem">${FLAME('rc-flame')}</div><p class="rc-mark">FLIP</p></div>`;
function faceHTML(t) {
  return `<div class="rc-face"><div class="rc-frame"></div>
    ${t.num != null ? `<p class="rc-num">${typeof t.num === 'string' ? t.num : ROMAN[t.num % ROMAN.length]}</p>` : ''}
    ${t.emblem ? `<div class="rc-emb">${t.emblem}</div>` : ''}
    <p class="rc-name">${esc(t.card.nom)}</p>
    <p class="rc-word">${t.mots.map(esc).join('<br>')}</p>
    <p class="rc-rule">${esc(t.card.consigne)}</p>
    ${t.card.perso ? `<p class="rc-by">rituel de ${esc(t.card.by || 'Zaza')}</p>` : t.card.src ? `<p class="rc-by">${esc(t.card.src)}</p>` : ''}
  </div>`;
}

// tirages : trois { card, mots, num } ; onAccept(tirage) ; resolve à la fermeture.
export function rituel(tirages, { onAccept, theme = '', kind = 'mots', words = [], note = '' } = {}) {
  const box = document.createElement('div');
  box.className = `rituel k-${kind}`;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Tirer une carte du grimoire');
  box.innerHTML = `
    <canvas class="rt-embers" aria-hidden="true"></canvas>
    <button class="rt-close" data-r="close" aria-label="Fermer">×</button>
    <div class="rt-breath"><div class="rt-flame">${FLAME('rt-flame-svg')}</div><p class="rt-say">Inspire…</p></div>
    <div class="rt-stage" hidden>
      <p class="rt-ask">${theme ? `<span>${esc(theme)}</span>` : ''}Choisis une carte.${note ? `<small>${esc(note)}</small>` : ''}</p>
      <div class="rt-fan">${tirages.map((t, i) => `<button class="rcard" data-i="${i}" style="--i:${i - 1};--a:${Math.abs(i - 1)}" aria-label="Carte ${i + 1}"><div class="rc-inner">${BACK}${faceHTML(t)}</div></button>`).join('')}</div>
      <div class="rt-choice" hidden><button class="btn big rt-accept" data-r="accept">Accepter la carte</button><button class="btn ghost rt-again" data-r="again">En choisir une autre</button></div>
    </div>`;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const cvs = box.querySelector('.rt-embers');
  const fx = kind === 'contrainte' ? embers(cvs) : kind === 'mots' ? flottants(cvs, words) : FONDS[kind](cvs);
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
