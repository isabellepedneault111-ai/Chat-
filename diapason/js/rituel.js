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
function embers(cv) {
  const ctx = cv.getContext('2d');
  let w = 0; let h = 0; let raf = 0; let burst = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const P = [];
  const smoke = Array.from({ length: 7 }, () => ({ x: Math.random(), y: 0.6 + Math.random() * 0.5, r: 0.25 + Math.random() * 0.3, v: 0.00015 + Math.random() * 0.0002, p: Math.random() * 6 }));
  const spawn = (n, x, y, spread, speed) => { for (let i = 0; i < n; i++) P.push({ x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 0.6, vy: -(0.4 + Math.random() * speed), life: 1, decay: 0.004 + Math.random() * 0.008, s: 0.6 + Math.random() * 1.8, hue: 18 + Math.random() * 28 }); };
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(10,8,7,0.28)';
    ctx.fillRect(0, 0, w, h);
    // fumée : grandes nappes très douces
    for (const s of smoke) {
      s.y -= s.v * 16; if (s.y < -0.4) { s.y = 1.2; s.x = Math.random(); }
      const x = (s.x + Math.sin(now / 4000 + s.p) * 0.05) * w; const y = s.y * h; const r = s.r * Math.max(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(120,96,80,0.035)'); g.addColorStop(1, 'rgba(120,96,80,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (Math.random() < 0.7) spawn(1, w / 2, h + 10, w * 0.9, 1.6);
    if (burst > 0) { spawn(14, w / 2, h * 0.5, 160, 4); burst--; }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += p.vx + Math.sin(now / 600 + i) * 0.25; p.y += p.vy; p.vy *= 0.997; p.life -= p.decay;
      if (p.life <= 0 || p.y < -20) { P.splice(i, 1); continue; }
      const r = p.s * (1 + (1 - p.life) * 0.6);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
      g.addColorStop(0, `hsla(${p.hue},100%,70%,${0.9 * p.life})`);
      g.addColorStop(0.25, `hsla(${p.hue},100%,50%,${0.35 * p.life})`);
      g.addColorStop(1, 'hsla(20,100%,40%,0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - r * 6, p.y - r * 6, r * 12, r * 12);
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
