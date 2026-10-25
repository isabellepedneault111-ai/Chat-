// Ambiances : partir ailleurs avant d'écrire ou de chanter. Chaque lieu sonne (nappe, texture, notes
// éparses, générées en direct) et se voit. Le SV-1 de Frog peut prendre les commandes : les accords qu'il
// tient deviennent la nappe. On écrit dedans, on chante dedans, puis on le lance à l'autre (relais).
import { audio, out } from '../audio.js';
import { autoCanvas, animate, toast } from '../ui.js';
import { mtof, FR, mod12 } from '../music.js';
import { startConsole, consoleState, onConsole, heldNotes } from '../console.js';
import { matchChord, chordLabel } from '../instrument.js';
import { espace, saveEntry } from '../espace.js';
import { esc } from './carnet.js';
import { ecrire } from '../ecrire.js';
import { sendSound, intentions } from './relais.js';
import { logPractice } from '../traces.js';

const AMB = [
  { id: 'fleuve', name: 'Fleuve gelé', bpm: 56, wave: 'triangle', texture: 'vent', part: 'neige', col: ['#a9d3ea', '#0f1d2a'],
    chords: [[50, 57, 62, 64, 69], [46, 53, 58, 62, 65], [48, 55, 60, 64, 67], [45, 52, 57, 60, 64]],
    mots: ['glace', 'souffle', 'la rive', 'un craquement', 'bottes', 'vapeur', 'le courant dessous', 'lumière basse', 'mitaines', 'la traverse'] },
  { id: 'nuit', name: 'Cuisine à 2 h', bpm: 70, wave: 'sine', texture: 'vinyle', part: 'poussiere', col: ['#f0b46a', '#1e1510'],
    chords: [[41, 53, 57, 60, 64], [40, 52, 55, 59, 62], [38, 53, 57, 60, 64], [43, 53, 57, 59, 64]],
    mots: ['la bouilloire', 'néon du four', 'pieds nus', 'tasse ébréchée', 'la radio basse', 'ton chandail', 'miettes', 'le frigo qui ronronne', 'fenêtre noire', 'chuchoter'] },
  { id: 'route', name: 'Route de nuit', bpm: 88, wave: 'sawtooth', texture: 'route', part: 'phares', col: ['#ff5d4a', '#0d0d14'], pulse: true,
    chords: [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]],
    mots: ['phares', 'ligne blanche', 'station-service', 'radio AM', 'le pare-brise', 'sortie 87', 'café tiède', 'pas dormir', 'les poteaux', 'quelque part au nord'] },
  { id: 'feu', name: 'Feu de camp', bpm: 76, wave: 'triangle', texture: 'feu', part: 'braises', col: ['#ffa53d', '#1a0d06'],
    chords: [[43, 55, 59, 62, 67], [38, 54, 57, 62, 66], [40, 55, 59, 64, 67], [36, 55, 60, 64, 67]],
    mots: ['étincelles', 'fumée dans les cheveux', 'guimauves', 'les épinettes', 'le lac noir', 'couverte de laine', 'ta voix rauque', 'les huards', 'tisons', 'été qui finit'] },
  { id: 'pluie', name: 'Ville sous la pluie', bpm: 64, wave: 'sine', texture: 'pluie', part: 'pluie', col: ['#8da0ff', '#0c0f1c'],
    chords: [[48, 55, 58, 62, 63], [44, 56, 60, 63, 67], [51, 55, 58, 62], [46, 53, 58, 62, 67]],
    mots: ['flaques', 'parapluie retourné', 'autobus 24', 'reflets rouges', 'vitrine', 'cheveux mouillés', 'les gouttières', 'un taxi', 'l’asphalte', 'se mettre à l’abri'] },
  { id: 'aube', name: 'Lumière d’hiver', bpm: 60, wave: 'triangle', texture: 'air', part: 'lueur', col: ['#ffe9a8', '#1b1a24'],
    chords: [[40, 56, 59, 63, 66], [49, 56, 59, 64], [45, 56, 61, 64, 68], [47, 54, 59, 64, 68]],
    mots: ['givre', 'soleil bas', 'les draps', 'café chaud', 'buée', 'premier pas dehors', 'la ville se tait', 'rose pâle', 'respirer', 'recommencer'] },
];

// ---------- Moteur ----------
function noiseBuf(c, kind) {
  const len = c.sampleRate * 3;
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (kind === 'crackle') d[i] = Math.random() < 0.0006 ? w * (0.4 + Math.random() * 0.6) : 0;
    else d[i] = w;
  }
  return b;
}
function impulse(c, sec = 3.2) {
  const len = c.sampleRate * sec;
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
  return b;
}

function engine() {
  const c = audio();
  const bus = c.createGain(); bus.gain.value = 0.9;
  const rev = c.createConvolver(); rev.buffer = impulse(c);
  const wet = c.createGain(); wet.gain.value = 0.55;
  const padF = c.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 1400; padF.Q.value = 0.4;
  const texG = c.createGain(); texG.gain.value = 0.6;
  const an = c.createAnalyser(); an.fftSize = 512;
  padF.connect(bus); padF.connect(rev);
  texG.connect(bus);
  rev.connect(wet).connect(bus);
  bus.connect(out()); bus.connect(an);
  const dest = c.createMediaStreamDestination();
  bus.connect(dest);
  let nodes = [];
  let timer = 0;
  let amb = null;
  let nextBar = 0; let barIdx = 0; let nextSpark = 0; let nextBeat = 0; let nextDrop = 0;
  const st = { light: 0.5, density: 0.5, chord: null, live: false };

  function padChord(notes, t, dur) {
    const g = c.createGain();
    const peak = 0.16 / Math.sqrt(notes.length);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.min(2.2, dur * 0.3));
    g.gain.setValueAtTime(peak, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur + 1.8);
    g.connect(padF);
    notes.forEach((m) => [-7, 6].forEach((det) => {
      const o = c.createOscillator();
      o.type = amb.wave; o.frequency.value = mtof(m); o.detune.value = det;
      const og = c.createGain(); og.gain.value = amb.wave === 'sawtooth' ? 0.35 : 1;
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + 2);
    }));
    return g;
  }
  let livePad = null;
  function spark(m, t) {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m) * 2.001;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.055, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    const g2 = c.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2).connect(g); g.connect(rev); g.connect(bus);
    [o, o2].forEach((x) => { x.start(t); x.stop(t + 2.7); });
  }
  function drop(t) {
    const o = c.createOscillator(); o.type = 'sine';
    const f = 1800 + Math.random() * 2600;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.03);
    const g = c.createGain(); g.gain.setValueAtTime(0.03 * Math.random(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g).connect(texG); o.start(t); o.stop(t + 0.05);
  }
  function thump(t) {
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = c.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(bus); o.start(t); o.stop(t + 0.32);
  }
  function texture(kind) {
    const src = (k) => { const s = c.createBufferSource(); s.buffer = noiseBuf(c, k); s.loop = true; s.start(); nodes.push(s); return s; };
    const filt = (type, f, q = 0.7) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
    const gain = (v) => { const x = c.createGain(); x.gain.value = v; return x; };
    const lfo = (rate, depth, param) => { const o = c.createOscillator(); o.frequency.value = rate; const g = gain(depth); o.connect(g).connect(param); o.start(); nodes.push(o); };
    if (kind === 'vent') { const f = filt('bandpass', 520, 0.9); const g = gain(0.55); src('brown').connect(f).connect(g).connect(texG); lfo(0.07, 320, f.frequency); lfo(0.11, 0.25, g.gain); }
    if (kind === 'pluie') { src('white').connect(filt('highpass', 1600)).connect(gain(0.05)).connect(texG); src('brown').connect(filt('lowpass', 400)).connect(gain(0.25)).connect(texG); }
    if (kind === 'vinyle') { src('white').connect(filt('lowpass', 4200)).connect(gain(0.012)).connect(texG); src('crackle').connect(filt('bandpass', 2500, 0.6)).connect(gain(0.5)).connect(texG); }
    if (kind === 'feu') { src('brown').connect(filt('lowpass', 260)).connect(gain(0.35)).connect(texG); src('crackle').connect(filt('highpass', 900)).connect(gain(1.1)).connect(texG); src('crackle').connect(filt('lowpass', 600)).connect(gain(1.6)).connect(texG); }
    if (kind === 'route') { const f = filt('lowpass', 140); const g = gain(0.7); src('brown').connect(f).connect(g).connect(texG); lfo(0.05, 0.3, g.gain); }
    if (kind === 'air') { src('white').connect(filt('bandpass', 3200, 0.5)).connect(gain(0.018)).connect(texG); src('brown').connect(filt('lowpass', 300)).connect(gain(0.12)).connect(texG); }
  }
  const barDur = () => (8 * 60) / amb.bpm;
  const curNotes = () => st.chord || amb.chords[barIdx % amb.chords.length];
  function tick() {
    const now = c.currentTime;
    const ahead = now + 0.4;
    // Le SV-1 de Frog prend les commandes : les notes tenues deviennent la nappe.
    const held = consoleState.on ? heldNotes() : [];
    if (held.length >= 2) {
      const key = held.join(',');
      if (key !== st.liveKey) {
        st.liveKey = key; st.live = true;
        st.chord = held.map((m) => (m < 40 ? m + 12 : m > 76 ? m - 12 : m));
        if (livePad) { livePad.gain.cancelScheduledValues(now); livePad.gain.setValueAtTime(livePad.gain.value, now); livePad.gain.linearRampToValueAtTime(0, now + 1.2); }
        livePad = padChord(st.chord, now + 0.02, barDur());
        nextBar = now + barDur();
      }
    } else if (st.live && !held.length) { st.live = false; st.liveKey = ''; }
    while (nextBar < ahead) {
      if (!st.live) { st.chord = null; barIdx++; livePad = padChord(curNotes(), nextBar, barDur()); } else livePad = padChord(st.chord, nextBar, barDur());
      nextBar += barDur();
    }
    const n = curNotes();
    while (nextSpark < ahead) {
      if (Math.random() < st.density) spark(n[Math.floor(Math.random() * n.length)] + (Math.random() < 0.5 ? 12 : 24), nextSpark);
      nextSpark += (60 / amb.bpm) * (Math.random() < 0.6 ? 1 : 2) * (1.6 - st.density);
    }
    if (amb.texture === 'pluie') while (nextDrop < ahead) { drop(nextDrop); nextDrop += 0.02 + Math.random() * 0.12 * (1.4 - st.density); }
    if (amb.pulse) while (nextBeat < ahead) { thump(nextBeat); nextBeat += 60 / amb.bpm; }
  }
  return {
    st, an, dest, get amb() { return amb; },
    chordLabel() { const ns = curNotes(); const ch = new Array(12).fill(0); ns.forEach((m) => { ch[mod12(m)] += 1; }); ch[mod12(Math.min(...ns))] += 0.5; return ns.length >= 3 ? chordLabel(matchChord(ch)) : FR[mod12(ns[0])]; },
    setLight(v) { st.light = v; padF.frequency.setTargetAtTime(250 + v * v * 4200, c.currentTime, 0.2); },
    setDensity(v) { st.density = v; },
    setTexture(v) { texG.gain.setTargetAtTime(v * 1.2, c.currentTime, 0.2); },
    start(a) {
      this.stop();
      amb = a; barIdx = -1;
      const t = c.currentTime + 0.05;
      nextBar = t; nextSpark = t + 1.5; nextBeat = t; nextDrop = t;
      bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(0.9, t + 1.5);
      texture(a.texture);
      tick();
      timer = setInterval(tick, 150);
    },
    stop() {
      clearInterval(timer); timer = 0;
      const t = c.currentTime;
      bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + 0.6);
      const old = nodes; nodes = [];
      setTimeout(() => old.forEach((x) => { try { x.stop(); } catch { /* déjà arrêté */ } }), 700);
      amb = null;
    },
    get on() { return !!timer; },
    dispose() { this.stop(); setTimeout(() => { try { bus.disconnect(); } catch { /* rien */ } }, 800); },
  };
}

// ---------- Visuel : particules propres à chaque lieu ----------
function particles(kind, w, h) {
  return Array.from({ length: kind === 'pluie' ? 140 : kind === 'phares' ? 26 : 90 }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), p: Math.random() * 6.28 }));
}

export default {
  id: 'ambiances',
  mount(el) {
    const eng = engine();
    let onSince = 0; let playedMs = 0; let lieu = '';
    let cur = AMB[0];
    let pts = [];
    let writer = null;
    let rec = null; let take = null; let picker = null;

    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">Ambiances</p>
          <h1>Partir ailleurs</h1>
          <p class="muted">Choisis un lieu : l’app le fait sonner. Frog peut en prendre les commandes avec n’importe quel clavier MIDI. Écris dedans, chante dedans, puis lance-le à l’autre.</p>
          ${espace.meta?.vision?.intention ? `<p class="small amb-int">Notre intention d’album : <b>« ${esc(espace.meta.vision.intention)} »</b></p>` : ''}
        </div>
      </div>
      <div class="amb-pick" role="list">${AMB.map((a) => `<button class="amb-card" data-amb="${a.id}" style="--a:${a.col[0]};--b:${a.col[1]}" aria-pressed="${a === cur}"><b>${esc(a.name)}</b><small>${a.mots.slice(0, 3).map(esc).join(' · ')}</small></button>`).join('')}</div>
      <section class="amb-stage" style="--a:${cur.col[0]};--b:${cur.col[1]}">
        <canvas class="amb-canvas" aria-hidden="true"></canvas>
        <div class="amb-over">
          <p class="amb-name"></p>
          <p class="amb-chord mono"></p>
          <button class="btn big amb-play" data-x="play">▶ Entrer</button>
        </div>
        <div class="amb-ctrl">
          <label><span>Lumière</span><input type="range" min="0" max="1" step="0.01" value="0.5" data-x="light"></label>
          <label><span>Notes</span><input type="range" min="0" max="1" step="0.01" value="0.5" data-x="density"></label>
          <label><span>Texture</span><input type="range" min="0" max="1" step="0.01" value="0.5" data-x="texture"></label>
          <button class="btn small" data-x="midi">${consoleState.on ? 'Clavier aux commandes ✓' : 'Le clavier aux commandes'}</button>
        </div>
      </section>
      <div class="amb-grid">
        <section class="panel"><div class="panel-head"><h2>Écrire dans l’ambiance</h2><a class="btn small ghost" href="#/jeux">Le grimoire →</a></div><div class="amb-write"></div></section>
        <section class="panel amb-rec">
          <h2>Chanter, jouer dedans</h2>
          <p class="muted small">L’ambiance et ton micro (ou ta guitare) sont enregistrés ensemble. Tu peux aussi l’envoyer seule, comme un lit où l’autre viendra se poser.</p>
          <label class="check"><input type="checkbox" data-x="withmic" checked> Avec mon micro</label>
          <div class="amb-rec-row"><button class="btn primary big" data-x="rec">● Enregistrer</button><span class="mono amb-time"></span></div>
          <div class="amb-take" hidden></div>
        </section>
      </div>`;
    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.amb-canvas'));
    const lvl = new Uint8Array(eng.an.fftSize);

    function choose(a) {
      cur = a;
      el.querySelectorAll('[data-amb]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.amb === a.id));
      const st = q('.amb-stage');
      st.style.setProperty('--a', a.col[0]); st.style.setProperty('--b', a.col[1]);
      q('.amb-name').textContent = a.name;
      pts = particles(a.part, cv.w || 800, cv.h || 400);
      writer?.dispose();
      writer = ecrire(q('.amb-write'), {
        mots: a.mots,
        title: a.name,
        saveLabel: espace.connected ? 'Lancer ces mots à l’autre' : 'Copier',
        onSave: async (text) => {
          if (!espace.connected) { navigator.clipboard?.writeText(text); toast('Copié.'); return; }
          await saveEntry({ type: 'note', title: text.split('\n')[0].slice(0, 80), body: text, data: { relais: true, mood: a.name, stage: 0, song: '' } });
          toast('Dans le relais. L’autre peut répondre par-dessus.');
        },
      });
      if (eng.on) eng.start(a);
    }
    choose(cur);

    const stop = animate((now) => {
      const { ctx, w, h } = cv;
      if (!w) return;
      if (!pts.length) pts = particles(cur.part, w, h);
      eng.an.getByteTimeDomainData(lvl);
      let s = 0; for (let i = 0; i < lvl.length; i++) { const v = (lvl[i] - 128) / 128; s += v * v; }
      const L = Math.min(1, Math.sqrt(s / lvl.length) * 6);
      const t = now / 1000;
      ctx.fillStyle = cur.col[1];
      ctx.globalAlpha = cur.part === 'pluie' || cur.part === 'phares' ? 0.35 : 0.22;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      // halo central qui respire avec le son
      const g = ctx.createRadialGradient(w / 2, h * 0.62, 10, w / 2, h * 0.62, Math.max(w, h) * (0.35 + L * 0.25));
      g.addColorStop(0, `${cur.col[0]}${Math.round(18 + L * 50).toString(16).padStart(2, '0')}`);
      g.addColorStop(1, `${cur.col[0]}00`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = cur.col[0]; ctx.strokeStyle = cur.col[0];
      const sp = eng.on ? 1 : 0.25;
      for (const p of pts) {
        if (cur.part === 'neige') { p.y += (0.3 + p.z) * sp; p.x += Math.sin(t + p.p) * 0.4; ctx.globalAlpha = 0.4 + p.z * 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.z * 2.4, 0, 6.28); ctx.fill(); }
        if (cur.part === 'pluie') { p.y += (6 + p.z * 10) * sp; ctx.globalAlpha = 0.25 + p.z * 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.5, p.y - 8 - p.z * 10); ctx.stroke(); }
        if (cur.part === 'braises') { p.y -= (0.5 + p.z * 1.4) * sp; p.x += Math.sin(t * 2 + p.p) * 0.6; ctx.globalAlpha = Math.max(0, (p.y / h)) * (0.6 + L); ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.z * 2, 0, 6.28); ctx.fill(); }
        if (cur.part === 'phares') { p.y += (2 + p.z * 6) * sp * (p.y / h + 0.2); const sc = p.y / h; ctx.globalAlpha = sc; ctx.beginPath(); ctx.arc(w / 2 + (p.x - w / 2) * sc * 1.6, p.y, 1 + sc * 7, 0, 6.28); ctx.fill(); }
        if (cur.part === 'poussiere') { p.x += Math.sin(t * 0.3 + p.p) * 0.3 * sp; p.y += Math.cos(t * 0.2 + p.p) * 0.25 * sp; ctx.globalAlpha = (0.2 + 0.5 * Math.abs(Math.sin(t + p.p))) * (0.6 + L); ctx.beginPath(); ctx.arc(p.x, p.y, 0.8 + p.z * 1.8, 0, 6.28); ctx.fill(); }
        if (cur.part === 'lueur') { p.y -= 0.15 * sp; ctx.globalAlpha = (0.15 + 0.6 * Math.abs(Math.sin(t * 0.7 + p.p))) * (0.5 + L); ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.z * 3, 0, 6.28); ctx.fill(); }
        if (p.y > h + 12) { p.y = -10; p.x = Math.random() * w; }
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
      }
      ctx.globalAlpha = 1;
      if (cur.part === 'phares') { ctx.strokeStyle = '#ffffff55'; ctx.setLineDash([18, 22]); ctx.lineDashOffset = -t * 120 * sp; ctx.beginPath(); ctx.moveTo(w / 2, h * 0.35); ctx.lineTo(w / 2, h); ctx.stroke(); ctx.setLineDash([]); }
      q('.amb-chord').textContent = eng.on ? `${eng.st.live ? 'Clavier · ' : ''}${eng.chordLabel()}` : '';
    });

    async function toggleRec() {
      const btn = q('[data-x=rec]');
      if (rec) { rec.recorder.stop(); return; }
      if (!eng.on) { eng.start(cur); onSince = performance.now(); lieu = cur.name; q('[data-x=play]').textContent = '■ Sortir'; }
      const c = audio();
      let mic = null;
      if (q('[data-x=withmic]').checked) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { toast('Micro refusé : j’enregistre l’ambiance seule.'); }
      }
      let src = null;
      if (mic) { src = c.createMediaStreamSource(mic); src.connect(eng.dest); }
      const recorder = new MediaRecorder(eng.dest.stream);
      const chunks = [];
      rec = { recorder, t: performance.now() };
      recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      recorder.onstop = () => {
        mic?.getTracks().forEach((x) => x.stop()); src?.disconnect();
        clearInterval(rec.timer); rec = null;
        btn.textContent = '● Enregistrer'; btn.classList.remove('on');
        take = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        showTake();
      };
      recorder.start();
      btn.textContent = '■ Arrêter'; btn.classList.add('on');
      rec.timer = setInterval(() => { const s = Math.floor((performance.now() - rec.t) / 1000); q('.amb-time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 600) recorder.stop(); }, 250);
    }
    function showTake() {
      const box = q('.amb-take');
      box.hidden = !take;
      if (!take) { box.innerHTML = ''; return; }
      box.innerHTML = `
        <audio controls src="${URL.createObjectURL(take)}"></audio>
        ${espace.connected ? `<div class="amb-intents"></div>
        <button class="btn primary" data-x="send">Lancer dans le relais →</button>` : '<p class="muted small">Crée votre espace pour l’envoyer à l’autre.</p>'}
        <button class="btn ghost" data-x="drop">Effacer</button>`;
      if (espace.connected) picker = intentions(box.querySelector('.amb-intents'));
    }

    el.addEventListener('click', async (e) => {
      const card = e.target.closest('[data-amb]');
      if (card) { choose(AMB.find((a) => a.id === card.dataset.amb)); return; }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'play') { if (eng.on) { eng.stop(); playedMs += performance.now() - onSince; e.target.textContent = '▶ Entrer'; } else { eng.start(cur); onSince = performance.now(); lieu = cur.name; e.target.textContent = '■ Sortir'; } }
      if (x === 'midi') {
        try { await startConsole(); e.target.textContent = 'Clavier aux commandes ✓'; toast(consoleState.devices.length ? `Tiens un accord sur ${consoleState.devices[0]} : l’ambiance le suit.` : 'MIDI autorisé : branche le SV-1.'); } catch (err) { toast(err.message); }
      }
      if (x === 'rec') toggleRec();
      if (x === 'drop') { take = null; showTake(); }
      if (x === 'send' && take) {
        const b = e.target; b.disabled = true;
        try {
          await sendSound(take, { title: `Dans « ${cur.name} »`, ...(picker?.value() || {}), mood: cur.name, onProgress: (p) => { b.textContent = `Envoi ${Math.round(p * 100)} %`; } });
          toast('Lancé dans le relais!'); take = null; showTake();
        } catch (err) { toast(err.message); b.disabled = false; }
      }
    });
    el.addEventListener('input', (e) => {
      const x = e.target.dataset.x;
      if (x === 'light') eng.setLight(+e.target.value);
      if (x === 'density') eng.setDensity(+e.target.value);
      if (x === 'texture') eng.setTexture(+e.target.value);
    });
    const offCon = onConsole(() => {});
    return () => { stop(); cv.dispose(); writer?.dispose(); offCon(); if (rec) { rec.recorder.onstop = null; rec.recorder.stop(); clearInterval(rec.timer); } if (eng.on) playedMs += performance.now() - onSince; logPractice('ambiance', playedMs / 60000, { lieu: lieu || cur.name }); eng.dispose(); };
  },
};
