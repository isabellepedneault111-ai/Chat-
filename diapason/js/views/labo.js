import { audio, out, impulseOsc } from '../audio.js';
import { autoCanvas, animate, css, keyboard } from '../ui.js';
import { nameFR, ftom, mtof, clamp } from '../music.js';
import { RATIO_PRESETS } from '../data.js';

const FMIN = 0.5;
const FMAX = 880;
const toF = (v) => FMIN * (FMAX / FMIN) ** (v / 1000);
const toV = (f) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * 1000;
const COLORS = ['--cyan', '--violet', '--pink', '--amber', '--lime', '--orange'];
const MAX_TRACKS = 6;
const MAX_N = 16;
const KB_FROM = 24; // Do1
const KB_TO = 96; // Do7
const SPIN_MAX = 1.2; // tours de disque visibles par seconde, au maximum (au-delà : ralenti)

// Nombre de « ×2 » pour amener une fréquence sur le clavier (une octave = doubler).
const octavesUp = (fr) => Math.max(0, Math.ceil(Math.log2(mtof(KB_FROM - 0.5) / fr)));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const INTERVALS = ['Unisson', 'Seconde mineure', 'Seconde majeure', 'Tierce mineure', 'Tierce majeure', 'Quarte', 'Triton', 'Quinte', 'Sixte mineure', 'Sixte majeure', 'Septième mineure', 'Septième majeure', 'Octave'];
function intervalName(ratio) {
  const semis = 12 * Math.log2(ratio);
  const s = Math.round(semis);
  const rem = ((s % 12) + 12) % 12;
  const oct = Math.floor(s / 12) - (rem === 0 && s > 0 ? 1 : 0);
  const name = rem === 0 && s > 0 ? INTERVALS[12] : INTERVALS[rem];
  const cents = Math.round((semis - s) * 100);
  return `${name}${oct > 0 ? ` + ${oct} oct.` : ''} <small class="mono">${cents >= 0 ? '+' : ''}${cents}¢</small>`;
}
const fmtHz = (x) => (x < 10 ? x.toFixed(2) : x.toFixed(x < 100 ? 1 : 0)).replace('.', ',');

export default {
  id: 'labo',
  mount(el) {
    let presetId = 'quinte';
    let tracks = [];
    let f = 1.5; // fréquence du disque 1
    let playing = false;
    let nodes = null;
    let sweep = null;
    let waveMode = 'sin';
    let spin = 0; // tours affichés (vitesse réelle, ou ralenti)
    let realPhase = []; // phase réelle de chaque disque, pour la ligne du temps
    let hits = [];
    let flashes = [];
    let clock = 0;
    const taps = [];

    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">04 · Rythme ↔ Note</p>
          <h1>Accélère un rythme… jusqu’à ce qu’il chante</h1>
          <p class="muted">Chaque bosse d’un disque est un clic. Au-delà de ~20 clics par seconde, ton cerveau entend une <em>note</em>.</p>
        </div>
      </div>
      <div class="labo-layout">
        <div class="panel radar-panel">
          <canvas class="radar" aria-label="Disques qui tournent : chaque bosse est un clic, la ligne blanche est leur somme"></canvas>
          <div class="zone-tag"></div>
          <div class="slow-badge mono"></div>
          <div class="notes-out"></div>
          <button class="play-orb" data-act="play" aria-label="Démarrer">▶</button>
        </div>

        <div class="panel ctrl-panel">
          <div class="readouts">
            <label><span class="muted">Disque 1</span><input class="num mono" data-in="hz" inputmode="decimal" aria-label="Fréquence du disque 1 en hertz"><span class="unit">Hz</span></label>
            <label><span class="muted">Tempo</span><input class="num mono" data-in="bpm" inputmode="numeric" aria-label="Tempo en battements par minute"><span class="unit">BPM</span></label>
          </div>
          <input type="range" class="big-range" min="0" max="1000" step="1" aria-label="Vitesse, du rythme à la note">
          <div class="range-scale mono"><span>rythme</span><span class="threshold">≈ 20 Hz · le seuil</span><span>note</span></div>
          <div class="row">
            <button class="btn primary" data-act="play2">▶ Démarrer</button>
            <button class="btn" data-act="sweep">Glissade ↗</button>
            <button class="btn" data-act="tap">Tape le tempo</button>
          </div>
        </div>

        <div class="panel kb-panel">
          <p class="kb-caption small"></p>
          <div class="kb-host"></div>
        </div>

        <div class="panel tracks-panel">
          <div class="panel-head"><h2>Tes disques</h2><span class="muted small cycle-info"></span></div>
          <div class="chips scroll-x" role="group" aria-label="Mélanges prêts à essayer">
            ${RATIO_PRESETS.map((p) => `<button class="chip" data-preset="${p.id}"><b>${p.label}</b> ${p.name}</button>`).join('')}
            <button class="chip" data-preset="random">Surprise</button>
          </div>
          <ul class="tracks"></ul>
          <button class="btn add-track" data-act="add">＋ Ajouter un disque</button>
        </div>

        <div class="panel wave-panel">
          <div class="wave-head">
            <p class="eyebrow">L’onde</p>
            <div class="seg" role="group" aria-label="Forme de l’onde">
              <button class="chip" data-wave="sin">Vague pure</button>
              <button class="chip" data-wave="click">Clics réels</button>
            </div>
          </div>
          <canvas class="air" aria-label="Particules d’air poussées par l’onde"></canvas>
          <canvas class="wave" aria-label="Forme de l’onde de chaque disque et leur somme"></canvas>
          <canvas class="strip" aria-label="Ligne du temps : chaque clic de chaque disque, en vitesse réelle"></canvas>
          <p class="muted small wave-caption"></p>
        </div>

        <details class="panel explain-panel">
          <summary>Pourquoi ça marche?</summary>
          <div class="explain"></div>
        </details>
      </div>`;

    const q = (s) => el.querySelector(s);
    const radar = autoCanvas(q('.radar'));
    const strip = autoCanvas(q('.strip'));
    const air = autoCanvas(q('.air'));
    const wave = autoCanvas(q('.wave'));
    const range = q('.big-range');
    const colors = COLORS.map(css);
    const kb = keyboard(q('.kb-host'), { from: KB_FROM, to: KB_TO, onPlay: (m) => { sweep = null; setF(mtof(m)); } });

    // On ne touche au DOM que si le contenu change : pas de saccades pendant la glissade.
    const memo = new Map();
    const setHTML = (sel, html) => {
      if (memo.get(sel) === html) return;
      memo.set(sel, html);
      q(sel).innerHTML = html;
    };

    const ratio = (i) => tracks[i].n / tracks[0].n;
    const freqOf = (i) => f * ratio(i);
    const live = () => tracks.map((t, i) => i).filter((i) => !tracks[i].muted);

    function loadPreset(id) {
      presetId = id;
      if (id === 'random') {
        const k = 2 + Math.floor(Math.random() * 3);
        const set = new Set();
        while (set.size < k) set.add(1 + Math.floor(Math.random() * 9));
        tracks = [...set].sort((a, b) => a - b).map((n) => ({ n, muted: false }));
      } else {
        tracks = RATIO_PRESETS.find((p) => p.id === id).ratios.map((n) => ({ n, muted: false }));
      }
      tracksChanged();
    }

    function tracksChanged() {
      realPhase = tracks.map(() => 0);
      hits = tracks.map(() => []);
      flashes = tracks.map(() => 0);
      if (playing) { stopAudio(); startAudio(); }
      renderTracks();
      updateText(true);
    }

    function renderTracks() {
      q('.tracks').innerHTML = tracks.map((t, i) => `
        <li class="track ${t.muted ? 'muted' : ''}" style="--c:${colors[i]}">
          <span class="track-dot"></span>
          <span class="track-name">Disque ${i + 1}</span>
          <span class="stepper">
            <button class="icon-btn tiny" data-tr="minus" data-i="${i}" aria-label="Moins de bosses">−</button>
            <b class="mono" aria-label="${t.n} bosses par tour">${t.n}</b>
            <button class="icon-btn tiny" data-tr="plus" data-i="${i}" aria-label="Plus de bosses">+</button>
          </span>
          <button class="icon-btn tiny" data-tr="mute" data-i="${i}" aria-pressed="${t.muted}" aria-label="${t.muted ? 'Réactiver' : 'Couper'} le disque ${i + 1}">M</button>
          <button class="icon-btn tiny" data-tr="del" data-i="${i}" aria-label="Retirer le disque ${i + 1}" ${tracks.length < 2 ? 'disabled' : ''}>×</button>
        </li>`).join('');
      q('.add-track').disabled = tracks.length >= MAX_TRACKS;
      el.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b.dataset.preset === presetId));
    }

    function setF(nf, fromInput) {
      f = clamp(nf, FMIN, FMAX);
      if (fromInput !== 'range') range.value = toV(f);
      if (fromInput !== 'hz') q('[data-in=hz]').value = fmtHz(f);
      if (fromInput !== 'bpm') q('[data-in=bpm]').value = Math.round(f * 60);
      if (nodes) {
        const c = audio();
        tracks.forEach((t, i) => nodes.oscs[i].frequency.setTargetAtTime(freqOf(i), c.currentTime, 0.03));
        nodes.gain.gain.setTargetAtTime(gainFor(f), c.currentTime, 0.05);
      }
      updateText();
    }
    // Plus fort qu'avant : le compresseur de sortie protège des pics.
    const gainFor = (fr) => clamp(1 / Math.sqrt(Math.max(1, fr / 6)), 0.2, 1);

    let lastText = 0;
    function updateText(force) {
      const now = performance.now();
      if (!force && now - lastText < 90) return;
      lastText = now;
      const zone = f < 8 ? 'rythme' : f < 20 ? 'flou' : 'note';
      const tag = q('.zone-tag');
      if (tag.dataset.zone !== zone) {
        tag.dataset.zone = zone;
        tag.textContent = zone === 'rythme' ? 'Tu entends un RYTHME' : zone === 'flou' ? 'Zone floue…' : 'Tu entends une NOTE';
      }
      setHTML('.notes-out', zone === 'note'
        ? tracks.map((t, i) => (t.muted ? '' : `<span class="note-chip" style="--c:${colors[i]}">${nameFR(ftom(freqOf(i)))}</span>`)).join('')
        : '');
      const g = tracks.reduce((a, t) => gcd(a, t.n), 0);
      setHTML('.cycle-info', tracks.length > 1 ? `Tous ensemble ${g > 1 ? `${g} fois` : '1 fois'} par tour` : '');
      updateKeyboard(zone);
      updateExplain();
    }

    // Allume la touche de chaque disque. Sous le seuil, on « monte » le rythme
    // d'octave en octave (×2) jusqu'au clavier : sa note fantôme apparaît.
    let kbKey = '';
    function updateKeyboard(zone) {
      const ids = live();
      const n = ids.length ? octavesUp(Math.min(...ids.map(freqOf))) : 0;
      const marks = ids.map((i) => [clamp(Math.round(ftom(freqOf(i) * 2 ** n)), KB_FROM, KB_TO), i]);
      const key = `${n}|${marks.join(';')}|${zone}`;
      if (key === kbKey) return;
      kbKey = key;
      kb.keys.forEach((k) => { k.classList.remove('k-lit', 'k-ghost'); k.style.removeProperty('--lc'); });
      marks.forEach(([m, i]) => {
        const k = kb.keys.get(m);
        k.classList.add(n ? 'k-ghost' : 'k-lit');
        k.style.setProperty('--lc', colors[i]);
      });
      const names = marks.map(([m, i]) => `<b style="color:${colors[i]}">${nameFR(m)}</b>`).join(' + ');
      setHTML('.kb-caption', n === 0
        ? `Tu entends : ${names}`
        : `Trop lent pour être une note… double-le ${n} fois (×${2 ** n}) et ce rythme <em>est</em> ${names}. Touches pointillées = notes fantômes.`);
    }

    function updateExplain() {
      const p = RATIO_PRESETS.find((x) => x.id === presetId);
      const ids = live();
      const label = tracks.map((t) => t.n).join(' : ');
      const rows = ids.slice(1).map((i) => `<li><span style="color:${colors[i]}">${tracks[i].n}/${tracks[0].n}</span> → ${intervalName(ratio(i))}</li>`).join('');
      setHTML('.explain', `
        <p class="eyebrow">${label}${p ? ` · ${p.name}` : ' · Ton mélange'}</p>
        <div class="ex-two">
          <div><b>Lent → en rythme</b><p>${p ? p.rhythm : `Un polyrythme ${label} : chaque disque frappe ${tracks.map((t) => t.n).join(', ')} fois par tour.`}</p></div>
          <div><b>Rapide → en harmonie</b><p>${p ? p.pitch : 'Les mêmes fractions deviennent des intervalles :'}</p>${rows ? `<ul class="iv-list">${rows}</ul>` : ''}</div>
        </div>
        <p class="muted small">Même fraction, deux sensations. Les petites fractions (2/1, 3/2, 4/3) sonnent « simples » dans les deux mondes.</p>`);
    }

    function startAudio() {
      const c = audio();
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(gainFor(f), c.currentTime, 0.05);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6000;
      gain.connect(lp).connect(out());
      const per = 1 / Math.sqrt(Math.max(1, live().length));
      const tg = [];
      const oscs = tracks.map((t, i) => {
        const o = impulseOsc(freqOf(i));
        const g = c.createGain();
        g.gain.value = t.muted ? 0 : per;
        o.connect(g).connect(gain);
        o.start();
        tg.push(g);
        return o;
      });
      nodes = { gain, oscs, lp, tg };
    }
    function updateMutes() {
      if (!nodes) return;
      const c = audio();
      const per = 1 / Math.sqrt(Math.max(1, live().length));
      tracks.forEach((t, i) => nodes.tg[i].gain.setTargetAtTime(t.muted ? 0 : per, c.currentTime, 0.02));
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
      if (on) { realPhase = tracks.map(() => 0); spin = 0; startAudio(); } else { stopAudio(); sweep = null; }
      q('.play-orb').hidden = on;
      q('[data-act=play2]').textContent = on ? '■ Arrêter' : '▶ Démarrer';
    }

    el.addEventListener('click', (e) => {
      const wb = e.target.closest('[data-wave]');
      if (wb) { waveMode = wb.dataset.wave; syncWaveButtons(); return; }
      const pb = e.target.closest('[data-preset]');
      if (pb) { loadPreset(pb.dataset.preset); return; }
      const tb = e.target.closest('[data-tr]');
      if (tb) {
        const i = +tb.dataset.i;
        const t = tracks[i];
        const a = tb.dataset.tr;
        if (a === 'mute') { t.muted = !t.muted; renderTracks(); updateMutes(); updateText(true); return; }
        if (a === 'plus') t.n = Math.min(MAX_N, t.n + 1);
        if (a === 'minus') t.n = Math.max(1, t.n - 1);
        if (a === 'del' && tracks.length > 1) tracks.splice(i, 1);
        presetId = 'custom';
        tracksChanged();
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'play' || act === 'play2') setPlaying(!playing);
      if (act === 'add' && tracks.length < MAX_TRACKS) {
        tracks.push({ n: Math.min(MAX_N, Math.max(...tracks.map((t) => t.n)) + 1), muted: false });
        presetId = 'custom';
        tracksChanged();
      }
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
      q('.wave-caption').textContent = waveMode === 'sin'
        ? 'Chaque couleur, un disque dessiné comme une vague. En blanc, leur somme : ce que ton tympan reçoit. En bas, la ligne du temps en vitesse réelle : quand les traits se collent, c’est une note.'
        : 'La vraie forme du son ici : un pic à chaque bosse. Même fréquence, autre forme : c’est ce qui change le timbre.';
    }
    range.addEventListener('input', () => { sweep = null; setF(toF(+range.value), 'range'); });
    q('[data-in=hz]').addEventListener('change', (e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (v > 0) setF(v, 'hz'); });
    q('[data-in=bpm]').addEventListener('change', (e) => { const v = parseFloat(e.target.value); if (v > 0) setF(v / 60, 'bpm'); });

    // Forme d'un disque à la phase ph (en bosses). En mode « clics », une impulsion
    // étroite par bosse : la ligne se brise en pics.
    const shape = (ph) => {
      if (waveMode === 'sin') return Math.cos(ph * Math.PI * 2);
      const d = ph - Math.round(ph);
      return Math.exp(-((d / 0.035) ** 2)) * 1.6 - 0.6;
    };
    const sumAt = (turns) => {
      const ids = live();
      if (!ids.length) return 0;
      return ids.reduce((s, i) => s + shape(tracks[i].n * turns), 0) / ids.length;
    };

    let last = performance.now();
    const stop = animate((now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (sweep) {
        const k = Math.min(1, (now - sweep.t0) / sweep.dur);
        setF(sweep.from * (sweep.to / sweep.from) ** k);
        if (k >= 1) { sweep = null; updateText(true); }
      }
      const turnRate = f / tracks[0].n; // tours réels par seconde
      const shown = Math.min(turnRate, SPIN_MAX);
      if (playing) {
        clock += dt;
        const before = spin;
        spin += shown * dt;
        tracks.forEach((t, i) => {
          if (Math.floor(spin * t.n) > Math.floor(before * t.n)) flashes[i] = 1;
          flashes[i] *= 0.84;
          const pb = realPhase[i];
          realPhase[i] += freqOf(i) * dt;
          const wraps = Math.floor(realPhase[i]) - Math.floor(pb);
          for (let k = 0; k < Math.min(wraps, 40); k++) hits[i].push(clock);
          while (hits[i].length && hits[i][0] < clock - 3) hits[i].shift();
          if (hits[i].length > 1200) hits[i].splice(0, hits[i].length - 1200);
        });
      }
      const slow = turnRate / SPIN_MAX;
      const badge = !playing ? '' : slow > 1.05 ? `ralenti ×${Math.round(slow).toLocaleString('fr-CA')}` : 'vitesse réelle';
      const sb = q('.slow-badge');
      if (sb.textContent !== badge) sb.textContent = badge;
      drawRadar();
      drawWave();
      drawStrip();
    });

    // Les disques tournent comme des vinyles sous une tête de lecture fixe (en haut).
    // Leur contour EST l'onde : n bosses = n clics par tour.
    function drawRadar() {
      const { ctx, w, h } = radar;
      if (!w) return;
      ctx.fillStyle = 'rgba(8,7,16,0.35)';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2 + 8;
      const R = Math.min(w, h) * 0.42;
      const multi = live().length > 1;
      const rings = tracks.length + (multi ? 1 : 0);
      const gap = (R * 0.78) / Math.max(1, rings);
      const amp = Math.min(gap * 0.42, R * 0.08);
      const rot = spin * Math.PI * 2;
      const steps = 360;
      const ring = (rad, fn, color, width, alpha) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const th = (s / steps) * Math.PI * 2;
          const r = rad + fn((th - rot) / (Math.PI * 2)) * amp;
          const x = cx + Math.sin(th) * r;
          const y = cy - Math.cos(th) * r;
          s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1;
      };
      // Anneau extérieur blanc : la somme, la ligne qui se « brise » quand les disques se combinent.
      let rad = R;
      if (multi) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        ring(rad, (t) => sumAt(-t), '#fff', 3, 0.95);
        ctx.shadowBlur = 0;
        rad -= gap;
      }
      tracks.forEach((t, i) => {
        const col = colors[i];
        if (t.muted) {
          ctx.setLineDash([3, 6]);
          ring(rad, () => 0, col, 1.5, 0.35);
          ctx.setLineDash([]);
        } else {
          ctx.shadowColor = col;
          ctx.shadowBlur = 6 + flashes[i] * 22;
          ring(rad, (u) => shape(-t.n * u), col, 2.5, 0.95);
          ctx.shadowBlur = 0;
          // Éclair sur la tête de lecture à chaque bosse
          const fl = playing && f / tracks[0].n > SPIN_MAX * 1.05 ? 0.5 : flashes[i];
          ctx.fillStyle = col;
          ctx.shadowColor = col;
          ctx.shadowBlur = 10 + fl * 30;
          ctx.beginPath(); ctx.arc(cx, cy - rad - amp, 4 + fl * 8, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        rad -= gap;
      });
      // Tête de lecture
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - R - amp - 16); ctx.lineTo(cx, cy - rad + gap * 0.3); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx - 7, cy - R - amp - 22); ctx.lineTo(cx + 7, cy - R - amp - 22); ctx.lineTo(cx, cy - R - amp - 12); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    }

    function drawWave() {
      const periods = 2; // la fenêtre montre 2 tours de disque
      const { ctx, w, h } = wave;
      const ids = live();
      const val = (x, ww) => tracks.map((t) => shape(t.n * (spin - (x / ww) * periods)));
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
        const multi = ids.length > 1;
        ids.forEach((i) => {
          ctx.strokeStyle = colors[i];
          ctx.globalAlpha = multi ? 0.5 : 1;
          ctx.lineWidth = 2;
          ctx.beginPath();
          cols.forEach((v, j) => { const y = mid - v[i] * amp * (multi ? 0.5 : 1); j ? ctx.lineTo(j * step, y) : ctx.moveTo(0, y); });
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        if (multi) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          cols.forEach((v, j) => { const y = mid - (ids.reduce((a, i) => a + v[i], 0) / ids.length) * amp; j ? ctx.lineTo(j * step, y) : ctx.moveTo(0, y); });
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      // L'air : chaque particule est poussée puis tirée par l'onde.
      const a = air;
      if (a.w) {
        a.ctx.clearRect(0, 0, a.w, a.h);
        const gapPx = 14;
        const rows = Math.max(1, Math.floor(a.h / gapPx));
        a.ctx.fillStyle = '#fff';
        for (let x = gapPx / 2; x < a.w; x += gapPx) {
          const v = sumAt(spin - (x / a.w) * periods);
          const dx = (playing ? v : 0) * gapPx * 0.7;
          for (let r = 0; r < rows; r++) {
            const jitter = ((x * 7 + r * 13) % 5) - 2;
            a.ctx.globalAlpha = 0.35 + 0.5 * clamp((v + 1) / 2, 0, 1);
            a.ctx.beginPath();
            a.ctx.arc(x + dx, gapPx / 2 + r * gapPx + jitter, 2.2, 0, Math.PI * 2);
            a.ctx.fill();
          }
        }
        a.ctx.globalAlpha = 1;
      }
    }

    // Ligne du temps en vitesse réelle : chaque clic, chaque disque.
    function drawStrip() {
      const s = strip;
      if (!s.w) return;
      const c2 = s.ctx;
      c2.clearRect(0, 0, s.w, s.h);
      const rowH = s.h / Math.max(1, tracks.length);
      tracks.forEach((t, i) => {
        c2.fillStyle = 'rgba(255,255,255,.04)';
        c2.fillRect(0, i * rowH + 1, s.w, rowH - 2);
        if (t.muted) return;
        c2.fillStyle = colors[i];
        for (const ht of hits[i]) {
          const x = s.w - ((clock - ht) / 3) * s.w;
          c2.fillRect(x, i * rowH + 2, 2, rowH - 4);
        }
      });
    }

    syncWaveButtons();
    loadPreset(presetId);
    setF(f);
    return () => { stop(); stopAudio(); radar.dispose(); strip.dispose(); air.dispose(); wave.dispose(); kb.dispose(); };
  },
};
