import { audio, mic, onPitch, startMic, tone, click } from '../audio.js';
import { autoCanvas, animate, getProfile, store, css, toast } from '../ui.js';
import { nameFR, mtof, pitchClassDiff, lerp } from '../music.js';
import { EXERCISES } from '../data.js';

const PPS = 150; // pixels par seconde

export default {
  id: 'gym',
  mount(el) {
    const profile = getProfile();
    let ex = EXERCISES[0];
    let base = profile ? profile.low + 3 : 55;
    let reps = 3;
    let octaveFree = store.get('octaveFree', true);
    let guide = store.get('guide', true);
    let run = null;

    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">03 · Gym vocal</p>
          <h1>Échauffements sur mesure</h1>
          <p class="muted">${profile
            ? `Calibré sur ton empreinte <b>${profile.type}</b> (${nameFR(profile.low)} → ${nameFR(profile.high)}).`
            : 'Registre moyen par défaut. <a href="#/tessiture">Fais ton Empreinte</a> pour des exercices 100 % adaptés.'}</p>
        </div>
      </div>
      <div class="ex-list" role="list">
        ${EXERCISES.map((e) => `
          <button class="ex-card" role="listitem" data-ex="${e.id}">
            <span class="ex-level">${e.level}</span>
            <b>${e.name}</b>
            <span class="ex-shape" aria-hidden="true">${shape(e.pattern)}</span>
            <span class="ex-best mono">${bestText(e.id)}</span>
          </button>`).join('')}
      </div>

      <div class="panel gym-stage">
        <div class="gym-bar">
          <div class="stepper">
            <span class="muted">Départ</span>
            <button class="icon-btn" data-act="down" aria-label="Plus grave">−</button>
            <b class="base-note mono"></b>
            <button class="icon-btn" data-act="up" aria-label="Plus aigu">+</button>
          </div>
          <div class="stepper">
            <span class="muted">Répétitions ↗</span>
            <button class="icon-btn" data-act="rminus" aria-label="Moins de répétitions">−</button>
            <b class="reps mono"></b>
            <button class="icon-btn" data-act="rplus" aria-label="Plus de répétitions">+</button>
          </div>
          <label class="switch"><input type="checkbox" data-opt="guide" ${guide ? 'checked' : ''}><span></span> Le piano chante avec moi</label>
          <label class="switch"><input type="checkbox" data-opt="oct" ${octaveFree ? 'checked' : ''}><span></span> Toutes les octaves comptent</label>
          <div class="spacer"></div>
          <button class="btn" data-act="listen">Écouter</button>
          <button class="btn primary" data-act="sing">● Chanter</button>
        </div>
        <div class="gym-canvas-wrap">
          <canvas class="gym-canvas" aria-label="Notes cibles qui défilent et tracé de ta voix"></canvas>
          <div class="gym-overlay" hidden></div>
          <div class="gym-count" hidden></div>
        </div>
        <div class="tip-box gym-tip"></div>
      </div>`;

    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.gym-canvas'));

    function bestText(id) {
      const b = store.get('best', {})[id];
      return b != null ? `Record ${b} %` : 'Nouveau';
    }
    function shape(pattern) {
      const max = Math.max(...pattern.map((p) => p[0])) || 1;
      let x = 0;
      const total = pattern.reduce((s, p) => s + p[1], 0);
      const rects = pattern.map(([o, d]) => {
        const r = `<rect x="${(x / total) * 100}" y="${28 - (o / max) * 24}" width="${Math.max(2, (d / total) * 100 - 1.5)}" height="4" rx="2"/>`;
        x += d;
        return r;
      });
      return `<svg viewBox="0 0 100 34" preserveAspectRatio="none">${rects.join('')}</svg>`;
    }

    function refresh() {
      q('.base-note').textContent = nameFR(base);
      q('.reps').textContent = reps;
      q('.gym-tip').innerHTML = `<b>${ex.name}</b><p>${ex.tip}</p>`;
      el.querySelectorAll('.ex-card').forEach((c) => c.classList.toggle('active', c.dataset.ex === ex.id));
    }

    function build() {
      const beat = 60 / ex.bpm;
      const notes = [];
      let t = 4 * beat;
      for (let r = 0; r < reps; r++) {
        for (const [off, beats] of ex.pattern) {
          notes.push({ midi: base + off + r, start: t, dur: beats * beat, frames: 0, hits: 0 });
          t += beats * beat;
        }
        t += beat;
      }
      return { notes, beat, total: t };
    }

    async function start(mode) {
      if (mode === 'sing' && !(await startMic())) return;
      stopRun();
      const c = audio();
      const tl = build();
      const t0 = c.currentTime + 0.25;
      for (let i = 0; i < 4; i++) click(t0 + i * tl.beat, i === 0);
      if (guide || mode === 'listen') {
        tl.notes.forEach((n) => tone(mtof(n.midi), { when: t0 + n.start, dur: n.dur * 0.95, gain: mode === 'listen' ? 0.2 : 0.11 }));
      }
      run = { ...tl, t0, mode, trail: [], done: false };
      q('.gym-overlay').hidden = true;
      el.querySelectorAll('[data-act=listen],[data-act=sing]').forEach((b) => { b.disabled = true; });
    }
    function stopRun() {
      run = null;
      el.querySelectorAll('[data-act=listen],[data-act=sing]').forEach((b) => { b.disabled = false; });
    }

    function finish() {
      const r = run;
      stopRun();
      q('.gym-count').hidden = true;
      if (r.mode !== 'sing') return;
      const frames = r.notes.reduce((s, n) => s + n.frames, 0);
      const hits = r.notes.reduce((s, n) => s + n.hits, 0);
      const pct = frames ? Math.round((hits / frames) * 100) : 0;
      const stars = pct >= 85 ? 3 : pct >= 65 ? 2 : pct >= 40 ? 1 : 0;
      const worst = [...r.notes].filter((n) => n.frames).sort((a, b) => a.hits / a.frames - b.hits / b.frames)[0];
      const best = store.get('best', {});
      const record = best[ex.id] == null || pct > best[ex.id];
      if (record) { best[ex.id] = pct; store.set('best', best); }
      const msg = pct >= 85 ? 'Précision chirurgicale.'
        : pct >= 65 ? 'Très solide! Ta voix sait où elle va.'
          : pct >= 40 ? 'Bonne base. Écoute une fois, puis rechante.'
            : 'Échauffement fait! Essaie « Écouter » d’abord, ou baisse la note de départ.';
      const ov = q('.gym-overlay');
      ov.hidden = false;
      ov.innerHTML = `
        <div class="score-card">
          <div class="stars" aria-label="${stars} étoiles sur 3">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
          <div class="score mono">${pct}<small>%</small></div>
          <p>${msg}</p>
          ${record && pct > 0 ? '<p class="badge-new">Nouveau record!</p>' : ''}
          ${worst && worst.hits / worst.frames < 0.6 ? `<p class="muted">La note la plus coriace : <b>${nameFR(worst.midi)}</b>.</p>` : ''}
          <div class="row center">
            <button class="btn" data-act="listen">Réécouter</button>
            <button class="btn primary" data-act="sing">↻ Rechanter</button>
            <button class="btn" data-act="harder">Monter d’un cran ↗</button>
          </div>
        </div>`;
      el.querySelector('.ex-card.active .ex-best').textContent = bestText(ex.id);
    }

    el.addEventListener('click', (e) => {
      const card = e.target.closest('[data-ex]');
      if (card) {
        ex = EXERCISES.find((x) => x.id === card.dataset.ex);
        stopRun(); q('.gym-overlay').hidden = true; refresh();
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'down') base--;
      if (act === 'up') base++;
      if (act === 'rminus') reps = Math.max(1, reps - 1);
      if (act === 'rplus') reps = Math.min(6, reps + 1);
      if (act === 'harder') { base++; toast(`Départ sur ${nameFR(base)}`); start('sing'); }
      if (act === 'listen') start('listen');
      if (act === 'sing') start('sing');
      refresh();
    });
    el.addEventListener('change', (e) => {
      if (e.target.dataset.opt === 'guide') { guide = e.target.checked; store.set('guide', guide); }
      if (e.target.dataset.opt === 'oct') { octaveFree = e.target.checked; store.set('octaveFree', octaveFree); }
    });

    const off = onPitch((p) => {
      if (!run || run.mode !== 'sing') return;
      const t = audio().currentTime - run.t0;
      const cur = run.notes.find((n) => t >= n.start && t < n.start + n.dur);
      const ref = cur || run.notes.find((n) => n.start > t) || run.notes[run.notes.length - 1];
      let m = p ? p.midi : null;
      if (m != null && octaveFree) m -= 12 * Math.round((m - ref.midi) / 12);
      run.trail.push({ t, m });
      if (cur && t > cur.start + Math.min(0.12, cur.dur * 0.2)) {
        cur.frames++;
        const d = p ? (octaveFree ? pitchClassDiff(p.midi, cur.midi) : p.midi - cur.midi) : 99;
        if (Math.abs(d) < 0.5) cur.hits++;
      }
    });

    const lime = css('--lime');
    const amber = css('--amber');
    const pink = css('--pink');
    const cyan = css('--cyan');
    let vLo = base - 2;
    let vHi = base + 16;

    const stop = animate(() => {
      const { ctx, w, h } = cv;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const tl = run || { ...build(), t0: null, trail: [] };
      const t = run ? audio().currentTime - run.t0 : 0;
      const ms = tl.notes.map((n) => n.midi);
      vLo = lerp(vLo, Math.min(...ms) - 3, 0.1);
      vHi = lerp(vHi, Math.max(...ms) + 3, 0.1);
      const y = (m) => h - 18 - ((m - vLo) / (vHi - vLo)) * (h - 36);
      const ph = Math.min(w * 0.28, 260);
      const x = (s) => ph + (s - t) * PPS;
      const laneH = (h - 36) / (vHi - vLo);

      for (let m = Math.ceil(vLo); m <= vHi; m++) {
        ctx.fillStyle = m % 12 === 0 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.035)';
        ctx.fillRect(0, y(m), w, 1);
      }
      // Notes cibles
      tl.notes.forEach((n) => {
        const x0 = x(n.start);
        const x1 = x(n.start + n.dur) - 3;
        if (x1 < -20 || x0 > w + 20) return;
        const yy = y(n.midi);
        const active = run && t >= n.start && t < n.start + n.dur;
        const past = run && t >= n.start + n.dur;
        const ratio = n.frames ? n.hits / n.frames : 0;
        let col = 'rgba(255,255,255,.16)';
        if (active) col = ratio > 0.5 ? lime : amber;
        else if (past && run.mode === 'sing') col = ratio >= 0.7 ? lime : ratio >= 0.4 ? amber : pink;
        else if (past) col = cyan;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = active ? 24 : 0;
        roundRect(ctx, x0, yy - laneH * 0.42, Math.max(6, x1 - x0), laneH * 0.84, Math.min(10, laneH * 0.4));
        ctx.fill();
        ctx.shadowBlur = 0;
        if (x1 - x0 > 26 && laneH > 10) {
          ctx.fillStyle = active || past ? '#0b0a14' : 'rgba(255,255,255,.75)';
          ctx.font = `600 ${Math.min(12, laneH * 0.6)}px "Atkinson Hyperlegible", sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(nameFR(n.midi), x0 + 8, yy);
        }
      });
      // Tracé de la voix
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      let pen = false;
      for (const p of tl.trail) {
        if (p.m == null || x(p.t) < 0) { pen = false; continue; }
        if (pen) ctx.lineTo(x(p.t), y(p.m)); else { ctx.moveTo(x(p.t), y(p.m)); pen = true; }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Ligne de lecture
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillRect(ph, 0, 2, h);
      if (run && mic.current && run.mode === 'sing') {
        let m = mic.current.midi;
        const near = tl.notes.find((n) => t < n.start + n.dur) || tl.notes[tl.notes.length - 1];
        if (octaveFree) m -= 12 * Math.round((m - near.midi) / 12);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ph, y(m), 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Décompte
      const cnt = q('.gym-count');
      if (run && t < 4 * tl.beat) {
        cnt.hidden = false;
        cnt.textContent = t < 0 ? '4' : String(4 - Math.floor(t / tl.beat));
      } else cnt.hidden = true;
      if (run && t > tl.total + 0.3) finish();
    });

    refresh();
    return () => { stop(); off(); cv.dispose(); };
  },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
