import { audio, drums, pad, bass, mic, startMic, finalOut, click } from '../audio.js';
import { store, keyboard, toast, animate } from '../ui.js';
import { FR, mtof, chordIntervals, chordName, hash, rng, mod12 } from '../music.js';
import { DRUM_PRESETS, PROGRESSIONS } from '../data.js';

const ROWS = [['k', 'Grosse caisse'], ['s', 'Caisse claire'], ['h', 'Charleston'], ['c', 'Claps']];
const parse = (p) => Object.fromEntries(ROWS.map(([r]) => [r, p[r].split('').map(Number)]));
const MOODS = {
  'Aurore boréale': ['#0b0620', '#3ee6ff', '#9b6bff', '#ff4fb3'],
  'Néon': ['#05010d', '#ff2d95', '#00f0ff', '#f9f871'],
  'Forêt boréale': ['#03140e', '#1fd18b', '#b6ff3e', '#e8ffe0'],
  'Fleuve': ['#020b1c', '#1e6bff', '#3ee6ff', '#c7f4ff'],
  'Volcan': ['#140303', '#ff3d00', '#ffb43e', '#ffe9a8'],
  'Cosmos': ['#000000', '#6b5bff', '#ff6bd6', '#ffffff'],
  'Tempête de neige': ['#0d1b2a', '#8ecae6', '#e0f2ff', '#ffffff'],
};

// L'état du studio survit au changement de module (le beat continue de jouer).
const S = {
  grid: store.get('grid', parse(DRUM_PRESETS.Pop)),
  bpm: store.get('bpm', 92),
  key: store.get('key', 0),
  prog: store.get('prog', 'pop'),
  playing: false,
  step: 0,
  nextTime: 0,
  timer: 0,
  queue: [],
  takes: [],
  recorder: null,
  variant: 0,
};
const save = () => { store.set('grid', S.grid); store.set('bpm', S.bpm); store.set('key', S.key); store.set('prog', S.prog); };
const progression = () => PROGRESSIONS.find((p) => p.id === S.prog) || PROGRESSIONS[0];
const chordAt = (bar) => {
  const [deg, qual] = progression().chords[bar % 4];
  return { root: mod12(S.key + deg), qual };
};

function scheduleStep(step, t) {
  const st = step % 16;
  const bar = Math.floor(step / 16);
  const sixteenth = 60 / S.bpm / 4;
  ROWS.forEach(([r]) => { if (S.grid[r][st]) drums[{ k: 'kick', s: 'snare', h: 'hat', c: 'clap' }[r]](t, st % 4 === 0 ? 1 : 0.8); });
  const ch = chordAt(bar);
  if (st === 0) pad(chordIntervals(ch.qual).map((iv) => mtof(48 + ch.root + iv)), t, sixteenth * 16, 0.045);
  if (st === 0 || st === 8 || st === 11) bass(mtof(36 + ch.root), t, sixteenth * (st === 11 ? 2 : 3));
}
function scheduler() {
  const c = audio();
  while (S.nextTime < c.currentTime + 0.12) {
    scheduleStep(S.step, S.nextTime);
    S.queue.push({ step: S.step, time: S.nextTime });
    S.nextTime += 60 / S.bpm / 4;
    S.step = (S.step + 1) % 64;
  }
}
function play() {
  if (S.playing) return;
  const c = audio();
  S.playing = true;
  S.step = 0;
  S.nextTime = c.currentTime + 0.08;
  S.timer = setInterval(scheduler, 25);
  scheduler();
}
function stopPlay() {
  S.playing = false;
  clearInterval(S.timer);
  S.queue = [];
}

export default {
  id: 'studio',
  mount(el) {
    let tab = store.get('studioTab', 'beat');
    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">05 · Studio</p>
          <h1>Fais ta première chanson</h1>
          <p class="muted">Un beat, quatre accords, ta voix, une pochette. C’est tout ce qu’il faut.</p>
        </div>
      </div>
      <div class="panel transport">
        <button class="play-btn" data-act="play" aria-label="Lecture">▶</button>
        <label class="field"><span>Tempo</span><input type="range" min="60" max="160" data-in="bpm" aria-label="Tempo"><b class="mono bpm-out"></b></label>
        <label class="field"><span>Tonalité</span><select data-in="key" aria-label="Tonalité">${FR.map((n, i) => `<option value="${i}">${n} majeur / ${FR[(i + 9) % 12]} mineur</option>`).join('')}</select></label>
        <label class="field"><span>Accords</span><select data-in="prog" aria-label="Progression d’accords">${PROGRESSIONS.map((p) => `<option value="${p.id}">${p.name} · ${p.roman}</option>`).join('')}</select></label>
        <button class="rec-btn" data-act="rec" aria-label="Enregistrer une prise">● REC</button>
      </div>
      <div class="chord-row"></div>
      <div class="tabs" role="tablist">
        <button role="tab" data-tab="beat">🥁 Beat</button>
        <button role="tab" data-tab="voix">🎙️ Prises de voix</button>
        <button role="tab" data-tab="cover">💿 Pochette</button>
        <button role="tab" data-tab="duo">🤝 Solo / Duo</button>
      </div>
      <div class="tab-body"></div>`;

    const q = (s) => el.querySelector(s);
    let kb = null;
    let disposeTab = () => {};

    q('[data-in=bpm]').value = S.bpm;
    q('[data-in=key]').value = S.key;
    q('[data-in=prog]').value = S.prog;
    const syncTop = () => {
      q('.bpm-out').textContent = S.bpm;
      q('[data-act=play]').textContent = S.playing ? '■' : '▶';
      q('[data-act=play]').classList.toggle('on', S.playing);
      q('[data-act=rec]').classList.toggle('on', !!S.recorder);
      q('.chord-row').innerHTML = [0, 1, 2, 3].map((b) => {
        const ch = chordAt(b);
        return `<div class="chord" data-bar="${b}"><small>Mesure ${b + 1}</small><b>${chordName(ch.root, ch.qual)}</b></div>`;
      }).join('') + `<p class="chord-note muted">${progression().note}</p>`;
    };

    el.addEventListener('input', (e) => {
      const k = e.target.dataset.in;
      if (k === 'bpm') { S.bpm = +e.target.value; save(); syncTop(); }
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.in;
      if (k === 'key') { S.key = +e.target.value; save(); syncTop(); renderTab(); }
      if (k === 'prog') { S.prog = e.target.value; save(); syncTop(); renderTab(); }
    });

    async function toggleRec() {
      if (S.recorder) { S.recorder.stop(); return; }
      if (!(await startMic())) return;
      const c = audio();
      const dest = c.createMediaStreamDestination();
      finalOut().connect(dest);
      const mg = c.createGain();
      mic.source.connect(mg).connect(dest);
      const chunks = [];
      const r = new MediaRecorder(dest.stream);
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        const type = r.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        S.takes.unshift({ url: URL.createObjectURL(blob), ext, at: new Date(), bpm: S.bpm, chords: [0, 1, 2, 3].map((b) => { const ch = chordAt(b); return chordName(ch.root, ch.qual); }).join(' – ') });
        try { finalOut().disconnect(dest); } catch { /* déjà déconnecté */ }
        mg.disconnect();
        S.recorder = null;
        syncTop();
        toast('Prise enregistrée! Elle est dans l’onglet « Prises de voix ».');
        if (tab === 'voix') renderTab();
      };
      S.recorder = r;
      if (!S.playing) play();
      r.start();
      syncTop();
      toast('● Enregistrement… Mets des écouteurs pour éviter l’écho.');
    }

    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; store.set('studioTab', tab); renderTab(); return; }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'play') { S.playing ? stopPlay() : play(); syncTop(); }
      if (act === 'rec') toggleRec();
    });

    // ---------- Onglets ----------
    function renderTab() {
      disposeTab();
      disposeTab = () => {};
      kb?.dispose();
      kb = null;
      el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
      const body = q('.tab-body');
      if (tab === 'beat') beatTab(body);
      if (tab === 'voix') voixTab(body);
      if (tab === 'cover') coverTab(body);
      if (tab === 'duo') duoTab(body);
    }

    function beatTab(body) {
      body.innerHTML = `
        <div class="panel">
          <div class="panel-head"><h2>Séquenceur</h2>
            <div class="chips small">${Object.keys(DRUM_PRESETS).map((n) => `<button class="chip" data-drum="${n}">${n}</button>`).join('')}</div></div>
          <div class="seq">${ROWS.map(([r, label]) => `
            <div class="seq-row"><span class="seq-label">${label}</span>
              <div class="seq-cells">${S.grid[r].map((v, i) => `<button class="cell ${v ? 'on' : ''} ${i % 4 === 0 ? 'beat' : ''}" data-cell="${r}:${i}" aria-label="${label}, pas ${i + 1}" aria-pressed="${!!v}"></button>`).join('')}</div>
            </div>`).join('')}</div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Notes sûres pour improviser</h2><span class="muted">Brillantes = notes de l’accord en cours · pâles = gamme pentatonique</span></div>
          <div class="kb-host"></div>
        </div>`;
      kb = keyboard(body.querySelector('.kb-host'), { from: 48, to: 76 });
      paintSafe(0);
      body.addEventListener('click', (e) => {
        const c = e.target.closest('[data-cell]');
        if (c) {
          const [r, i] = c.dataset.cell.split(':');
          S.grid[r][+i] = S.grid[r][+i] ? 0 : 1;
          c.classList.toggle('on');
          c.setAttribute('aria-pressed', !!S.grid[r][+i]);
          if (S.grid[r][+i]) drums[{ k: 'kick', s: 'snare', h: 'hat', c: 'clap' }[r]](audio().currentTime);
          save();
        }
        const d = e.target.closest('[data-drum]');
        if (d) { S.grid = parse(DRUM_PRESETS[d.dataset.drum]); save(); renderTab(); }
      });
    }

    let safeBar = -1;
    function paintSafe(bar) {
      if (!kb || bar === safeBar) return;
      safeBar = bar;
      const ch = chordAt(bar);
      const tones = new Set(chordIntervals(ch.qual).map((iv) => mod12(ch.root + iv)));
      const pent = new Set([0, 2, 4, 7, 9].map((x) => mod12(S.key + x)));
      kb.keys.forEach((k, m) => {
        k.classList.toggle('k-safe', tones.has(mod12(m)));
        k.classList.toggle('k-scale', !tones.has(mod12(m)) && pent.has(mod12(m)));
      });
    }

    function voixTab(body) {
      body.innerHTML = `
        <div class="panel">
          <div class="panel-head"><h2>Prises de voix</h2><span class="muted">Clique ● REC : le beat démarre, ta voix est mixée par-dessus.</span></div>
          ${S.takes.length ? `<ul class="takes">${S.takes.map((t, i) => `
            <li><div><b>Prise ${S.takes.length - i}</b><span class="muted mono">${t.at.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} · ${t.bpm} BPM · ${t.chords}</span></div>
              <audio controls src="${t.url}"></audio>
              <a class="btn small" href="${t.url}" download="diapason-prise-${S.takes.length - i}.${t.ext}">⬇ Télécharger</a></li>`).join('')}</ul>`
            : '<p class="muted empty">Aucune prise pour l’instant. Les prises restent sur cet appareil jusqu’à ce que tu fermes la page : télécharge celles que tu veux garder.</p>'}
          <div class="tip-box"><b>Le réflexe de studio</b><p>Après chaque prise : réécoute, nomme <em>une seule</em> chose à améliorer, et refais-la. C’est exactement comme ça que travaillent les pros.</p></div>
        </div>`;
    }

    function coverTab(body) {
      const c = store.get('cover', { title: '', artist: '', mood: 'Aurore boréale' });
      body.innerHTML = `
        <div class="cover-grid">
          <div class="panel">
            <h2>Pochette générative</h2>
            <p class="muted">L’image est calculée à partir de tes mots, de ta tonalité et de tes accords. Mêmes ingrédients → même pochette. Aucune IA externe, aucune clé, aucune donnée envoyée.</p>
            <label class="field col"><span>Titre de l’album</span><input class="input" data-c="title" maxlength="40" placeholder="Ex. : Lumières du Saguenay" value="${esc(c.title)}"></label>
            <label class="field col"><span>Artiste ou groupe</span><input class="input" data-c="artist" maxlength="40" placeholder="Ex. : Les Ondes Courtes" value="${esc(c.artist)}"></label>
            <label class="field col"><span>Ambiance</span><select data-c="mood">${Object.keys(MOODS).map((m) => `<option ${m === c.mood ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
            <div class="row">
              <button class="btn" data-cv="remix">🔀 Variante</button>
              <button class="btn primary" data-cv="dl">⬇ Télécharger (PNG)</button>
            </div>
            <div class="tip-box"><b>Question</b><p>Que dit ta pochette de ta musique avant même qu’on l’écoute? Montre-la à un ou une camarade et demande-lui d’imaginer le style.</p></div>
          </div>
          <div class="panel cover-wrap"><canvas class="cover" width="1080" height="1080" aria-label="Pochette d’album générée"></canvas></div>
        </div>`;
      const cv = body.querySelector('.cover');
      const draw = () => {
        const v = {
          title: body.querySelector('[data-c=title]').value,
          artist: body.querySelector('[data-c=artist]').value,
          mood: body.querySelector('[data-c=mood]').value,
        };
        store.set('cover', v);
        drawCover(cv, v);
      };
      let t = 0;
      body.addEventListener('input', () => { clearTimeout(t); t = setTimeout(draw, 120); });
      body.addEventListener('click', (e) => {
        const a = e.target.closest('[data-cv]')?.dataset.cv;
        if (a === 'remix') { S.variant++; draw(); }
        if (a === 'dl') {
          cv.toBlob((b) => {
            const a2 = document.createElement('a');
            a2.href = URL.createObjectURL(b);
            a2.download = `pochette-${(body.querySelector('[data-c=title]').value || 'diapason').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
            a2.click();
          });
        }
      });
      document.fonts.load('900 80px Unbounded').finally(draw);
    }

    function duoTab(body) {
      const tonic = FR[S.key];
      const pent = [0, 2, 4, 7, 9].map((x) => FR[mod12(S.key + x)]).join(', ');
      const chords = [0, 1, 2, 3].map((b) => { const ch = chordAt(b); return chordName(ch.root, ch.qual); }).join(' – ');
      body.innerHTML = `
        <div class="duo-grid">
          <div class="panel role" style="--c:var(--cyan)">
            <p class="eyebrow">Solo · Le looping autonome</p>
            <h2>Tu tiens toute la structure</h2>
            <ol class="steps">
              <li><b>L’harmonie</b> — lance la boucle <b>${chords}</b> à ${S.bpm} BPM.</li>
              <li><b>La mélodie</b> — improvise avec seulement <b>${pent}</b> (pentatonique). Aucune fausse note possible!</li>
              <li><b>Le texte</b> — chante une phrase par mesure. 4 mesures = un couplet.</li>
            </ol>
            <div class="tip-box"><b>Corps</b><p>Mâchoire molle, épaules basses. Si la gorge serre, recule d’un ton dans la tonalité.</p></div>
          </div>
          <div class="panel role" style="--c:var(--pink)">
            <p class="eyebrow">Duo · Question / Réponse</p>
            <h2>L’écoute avant tout</h2>
            <div class="row"><input class="input" data-p="a" placeholder="Élève 1" maxlength="16" aria-label="Élève 1"><input class="input" data-p="b" placeholder="Élève 2" maxlength="16" aria-label="Élève 2"><button class="btn small" data-duo="shuffle">🎲 Rôles</button></div>
            <div class="duo-roles">
              <div><b class="r1">Musicien·ne 1 · L’ancrage</b><p>Une seule note : <b>${tonic}</b>, en rythme syncopé. Tu ne bouges pas : tu laisses de l’espace.</p></div>
              <div><b class="r2">Musicien·ne 2 · L’exploration</b><p>Tu improvises avec <b>${pent}</b> dans les « trous » laissés par l’ancrage.</p></div>
            </div>
            <div class="timer"><span class="mono t-out">5:00</span><button class="btn" data-duo="timer">▶ 5 minutes</button></div>
          </div>
        </div>`;
      let left = 300;
      let iv = 0;
      const out = body.querySelector('.t-out');
      body.addEventListener('click', (e) => {
        const a = e.target.closest('[data-duo]')?.dataset.duo;
        if (a === 'shuffle') {
          const n = [body.querySelector('[data-p=a]').value || 'Élève 1', body.querySelector('[data-p=b]').value || 'Élève 2'];
          if (Math.random() < 0.5) n.reverse();
          body.querySelector('.r1').textContent = `${n[0]} · L’ancrage`;
          body.querySelector('.r2').textContent = `${n[1]} · L’exploration`;
        }
        if (a === 'timer') {
          if (iv) { clearInterval(iv); iv = 0; e.target.textContent = '▶ Reprendre'; return; }
          e.target.textContent = '⏸ Pause';
          iv = setInterval(() => {
            left--;
            out.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
            if (left <= 0) {
              clearInterval(iv); iv = 0; left = 300;
              click(audio().currentTime, true);
              toast('⏰ Temps! Échangez les rôles.');
              e.target.textContent = '▶ 5 minutes';
            }
          }, 1000);
        }
      });
      disposeTab = () => clearInterval(iv);
    }

    // Suivi visuel du pas courant.
    const stop = animate(() => {
      if (!S.playing) return;
      const now = audio().currentTime;
      let cur = null;
      while (S.queue.length && S.queue[0].time <= now) cur = S.queue.shift();
      if (!cur) return;
      const st = cur.step % 16;
      const bar = Math.floor(cur.step / 16);
      el.querySelectorAll('.cell.now').forEach((c) => c.classList.remove('now'));
      el.querySelectorAll(`[data-cell$=":${st}"]`).forEach((c) => c.classList.add('now'));
      el.querySelectorAll('.chord').forEach((c) => c.classList.toggle('now', +c.dataset.bar === bar));
      paintSafe(bar);
    });

    syncTop();
    renderTab();
    return () => { stop(); disposeTab(); kb?.dispose(); };
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Pochette générative ----------
function drawCover(canvas, { title, artist, mood }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const pal = MOODS[mood] || MOODS['Aurore boréale'];
  const prog = progression();
  const seed = hash(`${title}|${artist}|${mood}|${S.key}|${prog.id}|${S.variant}`);
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, W, W);

  // Nébuleuses de couleur
  ctx.filter = 'blur(90px)';
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.35 + r() * 0.35;
    ctx.fillStyle = pal[1 + Math.floor(r() * 3)];
    ctx.beginPath();
    ctx.arc(r() * W, r() * W, 120 + r() * 320, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // L'ADN musical : les accords deviennent des harmoniques.
  const harm = prog.chords.map(([deg]) => 2 + (mod12(S.key + deg) % 7));
  const layout = Math.floor(r() * 3);
  ctx.globalCompositeOperation = 'lighter';
  if (layout === 0) {
    // Anneaux d'onde
    const cx = W * (0.3 + r() * 0.4);
    const cy = W * (0.28 + r() * 0.3);
    const n = 26 + Math.floor(r() * 18);
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      const base = 40 + k * (11 + r() * 3);
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
        let rr = base;
        harm.forEach((hh, j) => { rr += Math.sin(a * hh + k * 0.22 * (j + 1) + seed % 7) * (k * 0.5) / (j + 1); });
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = pal[1 + (k % 3)];
      ctx.globalAlpha = 0.85 - (k / n) * 0.7;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (layout === 1) {
    // Crêtes empilées (montagnes sonores)
    const rows = 34;
    for (let k = 0; k < rows; k++) {
      const y0 = W * 0.12 + k * (W * 0.62 / rows);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const c = Math.exp(-(((x - W / 2) / (W * 0.18)) ** 2));
        let off = 0;
        harm.forEach((hh, j) => { off += Math.sin(x * 0.004 * hh + k * 0.7 + j) * 30 / (j + 1); });
        const y = y0 - c * (40 + Math.abs(off) * (1.5 + r() * 0.2));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = pal[1 + (k % 3)];
      ctx.globalAlpha = 0.25 + (k / rows) * 0.6;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  } else {
    // Constellation de pulsations
    for (let k = 0; k < 140; k++) {
      const a = r() * Math.PI * 2;
      const d = (r() ** 0.6) * W * 0.42;
      const x = W / 2 + Math.cos(a * harm[k % 4]) * d;
      const y = W * 0.42 + Math.sin(a) * d * 0.8;
      const s = 2 + r() * 26;
      ctx.globalAlpha = 0.2 + r() * 0.7;
      ctx.strokeStyle = pal[1 + Math.floor(r() * 3)];
      ctx.lineWidth = 1.5;
      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath(); ctx.arc(x, y, s * ring, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Grain
  const img = ctx.getImageData(0, 0, W, W);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 22;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Vignette + typo
  const g = ctx.createLinearGradient(0, W * 0.55, 0, W);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.75)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);
  const t = (title || 'Sans titre').toUpperCase();
  let size = 132;
  ctx.font = `900 ${size}px Unbounded, sans-serif`;
  const words = t.split(' ');
  let lines = [];
  const wrap = () => {
    lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 140 && line) { lines.push(line); line = w; } else line = test;
    });
    lines.push(line);
  };
  wrap();
  while ((lines.length > 3 || lines.some((l) => ctx.measureText(l).width > W - 140)) && size > 40) {
    size -= 6;
    ctx.font = `900 ${size}px Unbounded, sans-serif`;
    wrap();
  }
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, 70, W - 130 - (lines.length - 1 - i) * size * 1.02));
  ctx.font = '600 38px "Space Grotesk", sans-serif';
  ctx.fillStyle = pal[3];
  ctx.fillText(artist || 'Artiste mystère', 72, W - 70);
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.textAlign = 'right';
  ctx.fillText(`${FR[S.key]} · ${S.bpm} BPM · ${prog.roman}`, W - 60, 76);
  ctx.textAlign = 'left';
  ctx.fillText('DIAPASON', 60, 76);
  ctx.restore();
}
