import { audio, out, impulseOsc } from '../audio.js';
import { autoCanvas, animate, css, keyboard } from '../ui.js';
import { nameFR, ftom, mtof, clamp } from '../music.js';
import { RATIO_PRESETS } from '../data.js';

const FMIN = 0.5;
const FMAX = 880;
const toF = (v) => FMIN * (FMAX / FMIN) ** (v / 1000);
const toV = (f) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * 1000;
const COLORS = ['--cyan', '--violet', '--pink', '--amber', '--lime'];
const KB_FROM = 24; // Do1
const KB_TO = 96; // Do7
const WAVE_SPEED = 0.8; // périodes visibles par seconde, au maximum

// Nombre de « ×2 » pour amener une fréquence sur le clavier (une octave = doubler).
const octavesUp = (fr) => Math.max(0, Math.ceil(Math.log2(mtof(KB_FROM - 0.5) / fr)));

export default {
  id: 'labo',
  mount(el) {
    let preset = RATIO_PRESETS[2];
    let f = 1.5;
    let playing = false;
    let nodes = null;
    let sweep = null;
    const taps = [];
    let waveMode = 'sin';
    let wavePhase = 0;

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
      </div>
      <div class="panel wave-panel">
        <div class="wave-head">
          <div>
            <p class="eyebrow">L’onde, au ralenti</p>
            <p class="muted small wave-caption"></p>
          </div>
          <div class="seg" role="group" aria-label="Forme de l’onde">
            <button class="chip" data-wave="sin">〰 Vague pure</button>
            <button class="chip" data-wave="click">⚡ Clics réels</button>
          </div>
        </div>
        <canvas class="air" aria-label="Particules d’air poussées par l’onde"></canvas>
        <canvas class="wave" aria-label="Forme de l’onde de chaque disque et leur somme"></canvas>
        <div class="slow-tag mono"></div>
      </div>
      <div class="panel kb-panel">
        <p class="eyebrow">Sur le clavier</p>
        <p class="muted small kb-caption"></p>
        <div class="kb-host big"></div>
        <p class="muted small">Touche une note : la vitesse saute directement à sa fréquence.</p>
      </div>`;

    const q = (s) => el.querySelector(s);
    const radar = autoCanvas(q('.radar'));
    const strip = autoCanvas(q('.strip'));
    const range = q('.big-range');
    const air = autoCanvas(q('.air'));
    const wave = autoCanvas(q('.wave'));
    const kb = keyboard(q('.kb-host'), { from: KB_FROM, to: KB_TO, onPlay: (m) => { sweep = null; setF(mtof(m)); } });
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
      updateKeyboard(zone);
    }

    // Allume la touche de chaque disque. Sous le seuil, on « monte » le rythme
    // d'octave en octave (×2) jusqu'au clavier : sa note fantôme apparaît.
    function updateKeyboard(zone) {
      kb.keys.forEach((k) => { k.classList.remove('k-lit', 'k-ghost'); k.style.removeProperty('--lc'); });
      const n = octavesUp(f * Math.min(...voices()));
      const lines = [];
      voices().forEach((r, i) => {
        const m = Math.round(ftom(f * r * 2 ** n));
        const k = kb.keys.get(clamp(m, KB_FROM, KB_TO));
        if (!k) return;
        k.classList.add(n ? 'k-ghost' : 'k-lit');
        k.style.setProperty('--lc', colors[i]);
        lines.push(`<b style="color:${colors[i]}">${nameFR(m)}</b>`);
      });
      const fmt = (x) => (x < 10 ? x.toFixed(2) : x.toFixed(0)).replace('.', ',');
      q('.kb-caption').innerHTML = n === 0
        ? `Ce que tu entends : ${lines.join(' + ')}.`
        : `Trop lent pour être une note… mais double-le ${n} fois (×2${n > 1 ? `<sup>${n}</sup> = ×${2 ** n}` : ''}) : ${fmt(f)} Hz devient ${fmt(f * 2 ** n)} Hz, et ce rythme <em>est</em> ${lines.join(' + ')}, ${n} octave${n > 1 ? 's' : ''} plus bas. Les touches pointillées sont ses notes fantômes.${zone === 'flou' ? ' Accélère encore un peu…' : ''}`;
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
      const wb = e.target.closest('[data-wave]');
      if (wb) { waveMode = wb.dataset.wave; syncWaveButtons(); return; }
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
    function syncWaveButtons() {
      el.querySelectorAll('[data-wave]').forEach((b) => b.classList.toggle('active', b.dataset.wave === waveMode));
    }
    syncWaveButtons();

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
        // L'onde avance au ralenti : jamais plus de WAVE_SPEED périodes par seconde.
        wavePhase += Math.min(f, WAVE_SPEED) * dt;
      }
      drawWave(vs);

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

    // Forme d'un disque à la phase ph (en tours). En mode « clics », une impulsion
    // étroite à chaque tour : c'est la vraie forme du son qu'on entend ici.
    const shape = (ph) => {
      if (waveMode === 'sin') return Math.sin(ph * Math.PI * 2);
      const d = ph - Math.round(ph);
      return Math.exp(-((d / 0.035) ** 2)) * 1.6 - 0.6;
    };

    function drawWave(vs) {
      const slow = f / WAVE_SPEED;
      q('.slow-tag').textContent = !playing ? 'en pause' : slow > 1.05 ? `ralenti ×${Math.round(slow).toLocaleString('fr-CA')}` : 'vitesse réelle';
      q('.wave-caption').textContent = waveMode === 'sin'
        ? 'Chaque couleur, un disque dessiné comme une vague. En blanc, leur somme : ce que ton tympan reçoit. Regarde le motif se répéter.'
        : 'La vraie forme ici : un pic à chaque tour de disque. Même fréquence, autre forme : c’est ce qui change le timbre.';
      const periods = 4; // la fenêtre montre 4 tours du premier disque
      const val = (x, w) => vs.map((r) => shape((wavePhase - (x / w) * periods) * r));
      const { ctx, w, h } = wave;
      if (w) {
        ctx.clearRect(0, 0, w, h);
        const mid = h / 2;
        const amp = h * 0.36;
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
        const step = 2;
        const cols = [];
        for (let x = 0; x <= w; x += step) cols.push(val(x, w));
        vs.forEach((_, i) => {
          ctx.strokeStyle = colors[i];
          ctx.globalAlpha = vs.length > 1 ? 0.55 : 1;
          ctx.lineWidth = 2;
          ctx.beginPath();
          cols.forEach((v, j) => { const y = mid - v[i] * amp * (vs.length > 1 ? 0.5 : 1); j ? ctx.lineTo(j * step, y) : ctx.moveTo(0, y); });
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        if (vs.length > 1) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          cols.forEach((v, j) => { const y = mid - (v.reduce((a, b) => a + b, 0) / vs.length) * amp; j ? ctx.lineTo(j * step, y) : ctx.moveTo(0, y); });
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      // L'air : chaque particule est poussée puis tirée par l'onde. Les zones
      // serrées sont les compressions qui voyagent jusqu'à l'oreille.
      const a = air;
      if (a.w) {
        a.ctx.clearRect(0, 0, a.w, a.h);
        const gap = 14;
        const rows = Math.max(1, Math.floor(a.h / gap));
        a.ctx.fillStyle = '#fff';
        for (let x = gap / 2; x < a.w; x += gap) {
          const v = val(x, a.w).reduce((s2, b) => s2 + b, 0) / vs.length;
          const dx = (playing ? v : 0) * gap * 0.7;
          for (let r = 0; r < rows; r++) {
            const jitter = ((x * 7 + r * 13) % 5) - 2;
            a.ctx.globalAlpha = 0.35 + 0.5 * clamp((v + 1) / 2, 0, 1);
            a.ctx.beginPath();
            a.ctx.arc(x + dx, gap / 2 + r * gap + jitter, 2.2, 0, Math.PI * 2);
            a.ctx.fill();
          }
        }
        a.ctx.globalAlpha = 1;
      }
    }

    resetVoices();
    setF(f);
    return () => { stop(); stopAudio(); radar.dispose(); strip.dispose(); air.dispose(); wave.dispose(); kb.dispose(); };
  },
};
