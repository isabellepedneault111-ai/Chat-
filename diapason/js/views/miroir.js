// Miroir : la voix dessinée en direct, sa hauteur et sa justesse, pour se voir chanter.
import { mic, onPitch, startMic, tone } from '../audio.js';
import { autoCanvas, animate, getProfile, toast, css } from '../ui.js';
import { nameFR, nameEN, isBlack, mtof, clamp, lerp, spanText } from '../music.js';

const WINDOW = 8; // secondes visibles

export default {
  id: 'miroir',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">01 · Miroir</p>
          <h1>Ta voix, dessinée en direct</h1>
          <p class="muted">Chante un « ahhh », siffle, fredonne, parle. La ligne, c’est toi.</p>
        </div>
        <div class="actions">
          <button class="btn primary" data-act="mic">● Allumer le micro</button>
          <button class="btn" data-act="target">◎ Note-cible</button>
          <button class="btn" data-act="freeze" aria-pressed="false">⏸ Figer</button>
          <button class="btn" data-act="clear">↺ Effacer</button>
        </div>
      </div>
      <div class="miroir-grid">
        <div class="panel stage">
          <canvas class="trail" aria-label="Tracé de la hauteur de la voix dans le temps"></canvas>
          <div class="stage-empty">
            <div class="pulse-mic">●</div>
            <p>Allume le micro et chante.<br><span class="muted">Le tracé défile de droite à gauche.</span></p>
          </div>
          <div class="target-badge" hidden></div>
        </div>
        <div class="panel readout">
          <div class="big-note" aria-live="off">—</div>
          <div class="note-en mono">&nbsp;</div>
          <div class="hz mono">— Hz</div>
          <div class="cents">
            <div class="cents-track"><span class="cents-mid"></span><span class="needle"></span></div>
            <div class="cents-scale mono"><span>−50</span><span>juste</span><span>+50</span></div>
          </div>
          <dl class="stats">
            <div><dt>Plus grave</dt><dd class="s-low">—</dd></div>
            <div><dt>Plus aiguë</dt><dd class="s-high">—</dd></div>
            <div><dt>Étendue</dt><dd class="s-span">—</dd></div>
          </dl>
          <canvas class="spectrum" aria-hidden="true"></canvas>
        </div>
      </div>`;

    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.trail'));
    const sp = autoCanvas(q('.spectrum'));
    const profile = getProfile();
    const pts = [];
    let frozen = false;
    let lo = profile ? profile.low - 3 : 45;
    let hi = profile ? profile.high + 3 : 72;
    let sLow = Infinity;
    let sHigh = -Infinity;
    let target = null;
    let targetHold = 0;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;

    const setMicBtn = () => {
      q('[data-act=mic]').textContent = mic.active ? '● Micro actif' : '● Allumer le micro';
      q('.stage-empty').hidden = mic.active;
    };
    setMicBtn();

    let lastT = now();
    const off = onPitch((p) => {
      setMicBtn();
      if (frozen) return;
      const t = now();
      pts.push({ t, m: p ? p.midi : null, c: p ? p.clarity : 0 });
      while (pts.length && pts[0].t < t - WINDOW - 1) pts.shift();
      if (p) {
        const r = Math.round(p.midi);
        const cents = Math.round((p.midi - r) * 100);
        q('.big-note').textContent = nameFR(r);
        q('.note-en').textContent = nameEN(r);
        q('.hz').textContent = `${p.freq.toFixed(1)} Hz`;
        q('.needle').style.left = `${50 + cents}%`;
        q('.needle').dataset.ok = Math.abs(cents) < 12 ? 'yes' : Math.abs(cents) < 25 ? 'near' : 'no';
        if (p.clarity > 0.85) {
          sLow = Math.min(sLow, r);
          sHigh = Math.max(sHigh, r);
          q('.s-low').textContent = nameFR(sLow);
          q('.s-high').textContent = nameFR(sHigh);
          q('.s-span').textContent = spanText(sHigh - sLow);
        }
        if (target != null) {
          const ok = Math.abs(p.midi - target) < 0.35;
          targetHold = ok ? targetHold + (t - lastT) : Math.max(0, targetHold - (t - lastT) * 2);
          const pct = Math.min(1, targetHold / 1.2);
          q('.target-badge').style.setProperty('--p', pct);
          if (pct >= 1) {
            toast(`Dans le mille : ${nameFR(target)}!`);
            q('.stage').classList.add('flash');
            setTimeout(() => q('.stage').classList.remove('flash'), 600);
            pickTarget();
          }
        }
      } else {
        q('.big-note').textContent = '—';
        q('.note-en').innerHTML = '&nbsp;';
        q('.needle').dataset.ok = '';
      }
      lastT = t;
    });

    // Choisit une note cible au hasard, dans la zone confortable de la voix.
    function pickTarget() {
      const a = profile ? profile.low + 2 : 52;
      const b = profile ? profile.high - 2 : 67;
      let n;
      do { n = Math.round(lerp(a, b, Math.random())); } while (n === target);
      target = n;
      targetHold = 0;
      tone(mtof(n), { dur: 1.2, gain: 0.18 });
      const badge = q('.target-badge');
      badge.hidden = false;
      badge.innerHTML = `<span>Cible</span><b>${nameFR(n)}</b><small>Tiens-la 1 s</small>`;
    }

    el.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'mic') { await startMic(); setMicBtn(); }
      if (act === 'target') {
        if (!mic.active) await startMic();
        if (target != null) tone(mtof(target), { dur: 1.2, gain: 0.18 });
        else pickTarget();
      }
      if (act === 'freeze') {
        frozen = !frozen;
        e.target.setAttribute('aria-pressed', frozen);
        e.target.textContent = frozen ? '▶ Reprendre' : '⏸ Figer';
        frozenAt = now();
      }
      if (act === 'clear') {
        pts.length = 0; sLow = Infinity; sHigh = -Infinity; target = null;
        q('.target-badge').hidden = true;
        ['.s-low', '.s-high', '.s-span'].forEach((s) => { q(s).textContent = '—'; });
      }
    });
    let frozenAt = 0;

    const cyan = css('--cyan');
    const pink = css('--pink');
    const lime = css('--lime');
    const freqBuf = new Uint8Array(1024);

    const stop = animate(() => {
      const { ctx, w, h } = cv;
      if (!w) return;
      const tNow = frozen ? frozenAt : now();
      // La vue suit la voix en douceur.
      const visible = pts.filter((p) => p.m != null && p.t > tNow - WINDOW);
      if (visible.length > 4) {
        const ms = visible.map((p) => p.m);
        const wantLo = Math.min(...ms, target ?? Infinity) - 3;
        const wantHi = Math.max(...ms, target ?? -Infinity) + 3;
        const mid = (wantLo + wantHi) / 2;
        const span = Math.max(16, wantHi - wantLo);
        lo = lerp(lo, mid - span / 2, 0.04);
        hi = lerp(hi, mid + span / 2, 0.04);
      }
      const y = (m) => h - ((m - lo) / (hi - lo)) * h;
      const x = (t) => w - 70 - ((tNow - t) / WINDOW) * (w - 90);
      ctx.clearRect(0, 0, w, h);

      // Couloirs de notes
      for (let m = Math.floor(lo); m <= Math.ceil(hi); m++) {
        const yy = y(m);
        const bh = h / (hi - lo);
        ctx.fillStyle = isBlack(m) ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.045)';
        ctx.fillRect(0, yy - bh / 2, w, bh);
        if (m % 12 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(0, yy + bh / 2 - 1, w, 1);
        }
        if (!isBlack(m) && bh > 9) {
          ctx.fillStyle = m % 12 === 0 ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.35)';
          ctx.font = `${Math.min(12, bh * 0.8)}px "Atkinson Hyperlegible", sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(nameFR(m), w - 56, yy);
        }
      }

      // Cible
      if (target != null) {
        const yy = y(target);
        const bh = (h / (hi - lo)) * 0.8;
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, 'rgba(182,255,62,0)');
        g.addColorStop(1, 'rgba(182,255,62,0.35)');
        ctx.fillStyle = g;
        ctx.fillRect(0, yy - bh / 2, w - 64, bh);
      }

      // Tracé
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let prev = null;
      for (const p of pts) {
        if (p.t < tNow - WINDOW || p.t > tNow) { prev = null; continue; }
        if (p.m == null) { prev = null; continue; }
        if (prev && Math.abs(prev.m - p.m) < 4) {
          const onTarget = target != null && Math.abs(p.m - target) < 0.35;
          ctx.strokeStyle = onTarget ? lime : p.c > 0.9 ? cyan : pink;
          ctx.lineWidth = 2 + p.c * 4;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x(prev.t), y(prev.m));
          ctx.lineTo(x(p.t), y(p.m));
          ctx.stroke();
        }
        prev = p;
      }
      ctx.shadowBlur = 0;
      // Tête de lecture
      const last = pts[pts.length - 1];
      if (last && last.m != null && !frozen) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x(last.t), y(last.m), 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spectre
      if (sp.w && mic.analyser) {
        const a = mic.analyser;
        a.getByteFrequencyData(freqBuf);
        const c2 = sp.ctx;
        c2.clearRect(0, 0, sp.w, sp.h);
        const bars = 48;
        const bw = sp.w / bars;
        const nyq = a.context.sampleRate / 2;
        for (let i = 0; i < bars; i++) {
          // échelle logarithmique de 60 Hz à 5 kHz
          const f = 60 * (5000 / 60) ** (i / bars);
          const v = freqBuf[clamp(Math.round((f / nyq) * freqBuf.length), 0, freqBuf.length - 1)] / 255;
          const bh = v * sp.h;
          const g = c2.createLinearGradient(0, sp.h, 0, 0);
          g.addColorStop(0, '#9b6bff');
          g.addColorStop(1, '#3ee6ff');
          c2.fillStyle = g;
          c2.fillRect(i * bw + 1, sp.h - bh, bw - 2, bh);
        }
      }
    });

    return () => { stop(); off(); cv.dispose(); sp.dispose(); };
  },
};
