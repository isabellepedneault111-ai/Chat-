import { audio, out, impulseOsc } from '../audio.js';
import { autoCanvas, animate, css } from '../ui.js';
import { nameFR, ftom, clamp } from '../music.js';
import { RATIO_PRESETS } from '../data.js';

const FMIN = 0.5;
const FMAX = 880;
const toF = (v) => FMIN * (FMAX / FMIN) ** (v / 1000);
const toV = (f) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * 1000;
const COLORS = ['--cyan', '--violet', '--pink', '--amber', '--lime'];

export default {
  id: 'labo',
  mount(el) {
    let preset = RATIO_PRESETS[2];
    let f = 1.5;
    let playing = false;
    let nodes = null;
    let sweep = null;
    const taps = [];

    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">04 · Rythme ↔ Note</p>
          <h1>Accélère un rythme… jusqu’à ce qu’il chante</h1>
          <p class="muted">Chaque disque frappe un clic à chaque tour. Au-delà d’environ 20 clics par seconde, ton cerveau ne compte plus : il entend une <em>note</em>.</p>
        </div>
      </div>
      <div class="chips" role="group" aria-label="Rapports">
        ${RATIO_PRESETS.map((p) => `<button class="chip" data-preset="${p.id}"><b>${p.label}</b> ${p.name}</button>`).join('')}
      </div>
      <div class="labo-grid">
        <div class="panel radar-panel">
          <canvas class="radar" aria-label="Disques qui tournent selon les rapports choisis"></canvas>
          <div class="zone-tag"></div>
          <button class="play-orb" data-act="play" aria-label="Démarrer">▶</button>
        </div>
        <div class="labo-side">
          <div class="panel readouts">
            <div><span class="muted">Vitesse</span><input class="num mono" data-in="hz" inputmode="decimal" aria-label="Fréquence en hertz"><span class="unit">Hz</span></div>
            <div><span class="muted">Tempo</span><input class="num mono" data-in="bpm" inputmode="numeric" aria-label="Tempo en battements par minute"><span class="unit">BPM</span></div>
            <div class="notes-out"></div>
          </div>
          <div class="panel explain"></div>
        </div>
      </div>
      <div class="panel">
        <input type="range" class="big-range" min="0" max="1000" step="1" aria-label="Vitesse, du rythme à la note">
        <div class="range-scale mono"><span>0,5 Hz · rythme lent</span><span class="threshold">≈ 20 Hz · le seuil</span><span>880 Hz · note aiguë</span></div>
        <div class="row">
          <button class="btn primary" data-act="play2">▶ Démarrer</button>
          <button class="btn" data-act="sweep">🚀 La grande glissade (20 s)</button>
          <button class="btn" data-act="tap">👆 Tape le tempo</button>
        </div>
        <canvas class="strip" aria-label="Ligne du temps des clics de chaque disque"></canvas>
      </div>`;

    const q = (s) => el.querySelector(s);
    const radar = autoCanvas(q('.radar'));
    const strip = autoCanvas(q('.strip'));
    const range = q('.big-range');
    const colors = COLORS.map(css);
    const voices = () => preset.ratios.map((r) => (r / preset.ratios[0]));
    let phases = [];
    let flashes = [];
    let hits = [];

    function resetVoices() {
      phases = preset.ratios.map(() => 0);
      flashes = preset.ratios.map(() => 0);
      hits = preset.ratios.map(() => []);
    }

    function setF(nf, fromInput) {
      f = clamp(nf, FMIN, FMAX);
      if (fromInput !== 'range') range.value = toV(f);
      if (fromInput !== 'hz') q('[data-in=hz]').value = f < 10 ? f.toFixed(2).replace('.', ',') : f.toFixed(1).replace('.', ',');
      if (fromInput !== 'bpm') q('[data-in=bpm]').value = Math.round(f * 60);
      if (nodes) {
        const c = audio();
        voices().forEach((r, i) => nodes.oscs[i].frequency.setTargetAtTime(f * r, c.currentTime, 0.03));
        nodes.gain.gain.setTargetAtTime(gainFor(f), c.currentTime, 0.05);
      }
      updateText();
    }
    const gainFor = (fr) => clamp(0.4 / Math.sqrt(Math.max(1, fr / 2)), 0.035, 0.4);

    function updateText() {
      const zone = f < 8 ? 'rythme' : f < 20 ? 'flou' : 'note';
      const tag = q('.zone-tag');
      tag.dataset.zone = zone;
      tag.textContent = zone === 'rythme' ? 'Tu entends un RYTHME' : zone === 'flou' ? 'Zone floue : ni rythme, ni note…' : 'Tu entends une NOTE';
      q('.notes-out').innerHTML = zone === 'note'
        ? voices().map((r, i) => {
          const m = ftom(f * r);
          const cents = Math.round((m - Math.round(m)) * 100);
          return `<span class="note-chip" style="--c:${colors[i]}">${nameFR(m)}<small>${cents >= 0 ? '+' : ''}${cents}¢</small></span>`;
        }).join('')
        : `<span class="muted">Les noms de notes apparaissent au-delà de 20 Hz.</span>`;
      q('.explain').innerHTML = `
        <p class="eyebrow">${preset.label} · ${preset.name}</p>
        <div class="ex-two">
          <div class="${zone === 'rythme' ? 'on' : ''}"><b>Lent → en rythme</b><p>${preset.rhythm}</p></div>
          <div class="${zone === 'note' ? 'on' : ''}"><b>Rapide → en harmonie</b><p>${preset.pitch}</p></div>
        </div>
        <p class="muted small">Même rapport, deux sensations. C’est la même fraction qui se cache dans le rythme et dans l’accord.</p>`;
      el.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b.dataset.preset === preset.id));
    }

    function startAudio() {
      const c = audio();
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(gainFor(f), c.currentTime, 0.05);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5000;
      gain.connect(lp).connect(out());
      const oscs = voices().map((r) => {
        const o = impulseOsc(f * r);
        o.connect(gain);
        o.start();
        return o;
      });
      nodes = { gain, oscs, lp };
    }
    function stopAudio() {
      if (!nodes) return;
      const c = audio();
      const n = nodes;
      n.gain.gain.setTargetAtTime(0, c.currentTime, 0.03);
      setTimeout(() => { n.oscs.forEach((o) => o.stop()); n.lp.disconnect(); }, 200);
      nodes = null;
    }
    function setPlaying(on) {
      playing = on;
      if (on) { resetVoices(); startAudio(); } else { stopAudio(); sweep = null; }
      q('.play-orb').hidden = on;
      q('[data-act=play2]').textContent = on ? '■ Arrêter' : '▶ Démarrer';
    }

    el.addEventListener('click', (e) => {
      const pb = e.target.closest('[data-preset]');
      if (pb) {
        preset = RATIO_PRESETS.find((p) => p.id === pb.dataset.preset);
        if (playing) { stopAudio(); startAudio(); }
        resetVoices();
        updateText();
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'play' || act === 'play2') setPlaying(!playing);
      if (act === 'sweep') {
        if (!playing) setPlaying(true);
        sweep = { t0: performance.now(), from: 1, to: 220, dur: 20000 };
      }
      if (act === 'tap') {
        const t = performance.now();
        if (taps.length && t - taps[taps.length - 1] > 2000) taps.length = 0;
        taps.push(t);
        if (taps.length > 6) taps.shift();
        if (taps.length >= 2) {
          const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
          setF(1000 / avg);
        }
      }
    });
    range.addEventListener('input', () => { sweep = null; setF(toF(+range.value), 'range'); });
    q('[data-in=hz]').addEventListener('change', (e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (v > 0) setF(v, 'hz'); });
    q('[data-in=bpm]').addEventListener('change', (e) => { const v = parseFloat(e.target.value); if (v > 0) setF(v / 60, 'bpm'); });

    let last = performance.now();
    let clock = 0;
    const stop = animate((now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (sweep) {
        const k = Math.min(1, (now - sweep.t0) / sweep.dur);
        setF(sweep.from * (sweep.to / sweep.from) ** k);
        if (k >= 1) sweep = null;
      }
      const vs = voices();
      if (playing) {
        clock += dt;
        vs.forEach((r, i) => {
          const before = phases[i];
          phases[i] += f * r * dt;
          const wraps = Math.floor(phases[i]) - Math.floor(before);
          if (wraps > 0) {
            flashes[i] = 1;
            for (let k = 0; k < Math.min(wraps, 40); k++) hits[i].push(clock);
          }
          flashes[i] *= 0.86;
          while (hits[i].length && hits[i][0] < clock - 3) hits[i].shift();
          if (hits[i].length > 1200) hits[i].splice(0, hits[i].length - 1200);
        });
      }

      // Radar, avec persistance rétinienne simulée (on efface partiellement).
      const { ctx, w, h } = radar;
      if (w) {
        ctx.fillStyle = 'rgba(8,7,16,0.24)';
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) * 0.44;
        vs.forEach((r, i) => {
          const rad = R * (1 - i * (0.62 / Math.max(1, vs.length)));
          const col = colors[i];
          const fr = f * r;
          ctx.strokeStyle = 'rgba(255,255,255,.1)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
          if (!playing) return;
          const sweepFrac = fr * dt;
          const a1 = phases[i] * Math.PI * 2 - Math.PI / 2;
          ctx.fillStyle = col;
          if (sweepFrac >= 1) {
            ctx.globalAlpha = 0.18;
            ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
          } else {
            const a0 = a1 - sweepFrac * Math.PI * 2;
            ctx.globalAlpha = clamp(0.06 / Math.max(0.01, sweepFrac), 0.12, 0.9);
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rad, a0, a1); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad); ctx.stroke();
          }
          ctx.globalAlpha = 1;
          // Point de frappe en haut du disque
          const fl = sweepFrac > 0.3 ? 0.6 : flashes[i];
          ctx.shadowColor = col;
          ctx.shadowBlur = 10 + fl * 30;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(cx, cy - rad, 5 + fl * 7, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        });
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      }

      // Bande de temps : chaque clic, chaque disque.
      const s = strip;
      if (s.w) {
        const c2 = s.ctx;
        c2.clearRect(0, 0, s.w, s.h);
        const rowH = s.h / Math.max(1, vs.length);
        vs.forEach((r, i) => {
          c2.fillStyle = 'rgba(255,255,255,.04)';
          c2.fillRect(0, i * rowH + 2, s.w, rowH - 4);
          c2.fillStyle = colors[i];
          for (const t of hits[i]) {
            const x = s.w - ((clock - t) / 3) * s.w;
            c2.fillRect(x, i * rowH + 4, 2, rowH - 8);
          }
        });
      }
    });

    resetVoices();
    setF(f);
    return () => { stop(); stopAudio(); radar.dispose(); strip.dispose(); };
  },
};
