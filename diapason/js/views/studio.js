// Le studio : un beat, nos propres accords (durées libres, accord cliquable), le clavier en couleurs pour improviser, nos chansons, les prises et la scène.
import { audio, drums, pad, bass, mic, startMic, finalOut, pluck } from '../audio.js';
import { store, keyboard, toast, animate, autoCanvas, getProfile } from '../ui.js';
import { FR, mtof, chordIntervals, chordName, hash, rng, mod12, clamp, nameFR } from '../music.js';
import { createListener, connectMIDI, chordLabel, estimateKey, suggestNext, diatonic, majorTonic } from '../instrument.js';
import { DRUM_PRESETS, PROGRESSIONS, DEFIS_IMPRO } from '../data.js';
import { clockStart, clockStep, clockStop } from '../console.js';
import { espace, audioURL, saveEntry, uploadImage, uploadAudio } from '../espace.js';
import { accord as accordPiano, prechargerSons } from '../sampler.js';
import { chansonTab } from '../chanson.js';
import { sonsPersoHTML, brancherSonsPerso } from '../sonsperso.js';
import { EXERCICES } from '../duo.js';
import { PIANO } from '../exercice.js';

const ROWS = [['k', 'Grosse caisse'], ['s', 'Caisse claire'], ['h', 'Charleston'], ['c', 'Claps']];
const parse = (p) => Object.fromEntries(ROWS.map(([r]) => [r, p[r].split('').map(Number)]));

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
  // Scène : mélodie de la boucle (32 croches sur 4 mesures), mode solo/duo, clips filmés.
  melody: store.get('melody', []),
  mode: store.get('sceneMode', 'solo'),
  clips: [],
  custom: store.get('customProg', null), // la grille de Frog (ou de Zaza), faite à la main
  seance: store.get('seanceProg', null), // la grille d'une séance guidée, à part pour ne jamais écraser la nôtre
  cur: null,
  filming: false,
  loop: 0, // tours de boucle : le hasard et les défis d'impro avancent avec eux
  restart: false, // un autre style prend le relais au prochain temps
  padG: null,
  defis: store.get('defisImpro', false),
  onLoop: null,
};
// Ce qu'on choisit de voir sur le clavier (toutes les couleurs par défaut).
const voir = () => new Set(store.get('kbVoir', ['safe', 'scale', 'gamme', 'jazz', 'blue']));
const save = () => { store.set('grid', S.grid); store.set('bpm', S.bpm); store.set('key', S.key); store.set('prog', S.prog); };
const saveMelody = () => store.set('melody', S.melody.map(({ slot, deg, who }) => ({ slot, deg, who })));
// 8 pastilles : la pentatonique de la tonalité, dans un registre confortable pour la voix.
const padMidis = () => {
  const base = 60 + S.key - (S.key >= 7 ? 12 : 0);
  return [0, 2, 4, 7, 9, 12, 14, 16].map((x) => base + x);
};
// Une petite mélodie-modèle (croche, pastille), pour voir et entendre avant de créer.
const DEMO_MELODY = [[0, 2], [2, 3], [3, 4], [4, 3], [6, 2], [8, 3], [10, 4], [11, 5], [12, 4], [14, 3], [16, 4], [18, 5], [19, 6], [20, 5], [22, 4], [24, 3], [26, 2], [27, 1], [28, 0]];
let onScene = null;
const progression = () => (S.prog === 'perso' && S.custom) || (S.prog === 'seance' && S.seance) || PROGRESSIONS.find((p) => p.id === S.prog) || PROGRESSIONS[0];
// « Le hasard » : quatre accords de la tonalité, retirés à chaque tour (toujours les mêmes pour un même tour).
const POOL = [[0, 'M'], [2, 'm7'], [4, 'm'], [5, 'maj7'], [7, 'M'], [9, 'm'], [0, 'add9'], [7, 'sus4'], [5, 'M'], [2, 'm']];
const hasardChords = (loop) => { const r = rng(hash(`hasard${loop}`)); return [[0, 'M'], ...[1, 2, 3].map(() => POOL[Math.floor(r() * POOL.length)])]; };
// Chaque accord dure un nombre de temps (4 par défaut = une mesure) : une grille peut avoir 2 à 8 accords de durées libres.
const accords = () => { const p = progression(); return p.hasard ? hasardChords(S.loop) : p.chords; };
const tempsDe = (c) => c[2] || 4;
const pasBoucle = () => Math.max(16, accords().reduce((a, c) => a + tempsDe(c), 0) * 4);
function chordAtStep(step) {
  const l = accords(); const st = step % pasBoucle(); let deb = 0;
  for (let i = 0; i < l.length; i++) { const n = tempsDe(l[i]) * 4; if (st < deb + n) return { root: mod12(S.key + l[i][0]), qual: l[i][1], i, start: deb, len: n }; deb += n; }
  return { root: mod12(S.key + l[0][0]), qual: l[0][1], i: 0, start: 0, len: tempsDe(l[0]) * 4 };
}
const chordAt = (bar) => chordAtStep(bar * 16);

function scheduleStep(step, t) {
  const st = step % 16;
  const sixteenth = 60 / S.bpm / 4;
  clockStep(t, sixteenth); // horloge MIDI vers le matériel de Frog, si choisie
  ROWS.forEach(([r]) => { if (S.grid[r][st]) drums[{ k: 'kick', s: 'snare', h: 'hat', c: 'clap' }[r]](t, st % 4 === 0 ? 1 : 0.8); });
  const ch = chordAtStep(step); const dans = (step % pasBoucle()) - ch.start;
  if (dans === 0) S.padG = pad(chordIntervals(ch.qual).map((iv) => mtof(48 + ch.root + iv)), t, sixteenth * ch.len, 0.045);
  if (dans === 0 || (dans % 16 === 8 && ch.len - dans >= 4) || (dans % 16 === 11 && ch.len - dans >= 2)) bass(mtof(36 + ch.root), t, sixteenth * (dans % 16 === 11 ? 2 : 3));
  if (st % 2 === 0) {
    const slot = (step % 64) >> 1;
    const ms = padMidis();
    S.melody.forEach((n) => {
      if (n.slot !== slot) return;
      if (n.skip) { n.skip = false; return; }
      pluck(mtof(ms[n.deg]), { when: t, gain: 0.3, dur: sixteenth * 6 });
    });
  }
}
function scheduler() {
  const c = audio();
  while (S.nextTime < c.currentTime + 0.12) {
    // Relais : sur le prochain temps, l'accord qui sonnait s'efface et le nouveau style repart du début.
    if (S.restart && S.step % 4 === 0) {
      S.restart = false;
      S.step = 0;
      S.padG?.gain.cancelScheduledValues(S.nextTime);
      S.padG?.gain.setTargetAtTime(0.0001, S.nextTime, 0.04);
      S.onLoop?.();
    }
    scheduleStep(S.step, S.nextTime);
    S.queue.push({ step: S.step, time: S.nextTime });
    S.nextTime += 60 / S.bpm / 4;
    S.step = (S.step + 1) % (pasBoucle() * 4); // un multiple de la grille, pour que la mélodie (64 pas) retombe aussi
    if (S.step % pasBoucle() === 0) { S.loop++; S.onLoop?.(); }
  }
}
function play() {
  if (S.playing) return;
  const c = audio();
  S.playing = true;
  S.step = 0;
  S.nextTime = c.currentTime + 0.08;
  clockStart(S.nextTime);
  S.timer = setInterval(scheduler, 25);
  scheduler();
}
function stopPlay() {
  if (S.playing) clockStop(S.nextTime); // après la dernière impulsion déjà programmée
  S.playing = false;
  clearInterval(S.timer);
  S.queue = [];
  S.cur = null;
}

export default {
  id: 'studio',
  mount(el) {
    let tab = (location.hash.match(/[?&]tab=(\w+)/) || [])[1] || store.get('studioTab', 'beat');
    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">Studio</p>
          <h1>Construire, jouer, improviser</h1>
          <p class="muted">Un beat, des accords qui changent sans couper, des défis d’impro, et une pochette faite de notre art.</p>
          <p><a class="btn small" href="#/oreille">L’oreille : analyser une pièce →</a></p>
        </div>
      </div>
      <div class="panel transport">
        <button class="play-btn" data-act="play" aria-label="Lecture">▶</button>
        <label class="field"><span>Tempo</span><input type="range" min="50" max="200" data-in="bpm" aria-label="Tempo"><b class="mono bpm-out"></b></label>
        <button class="btn small tap" data-act="tap" title="Tape ce bouton au rythme de ta musique : le labo en déduit le tempo">Taper le tempo</button>
        <label class="field"><span>Tonalité</span><select data-in="key" aria-label="Tonalité">${FR.map((n, i) => `<option value="${i}">${n} majeur / ${FR[(i + 9) % 12]} mineur</option>`).join('')}</select></label>
        <label class="field"><span>Accords</span><select data-in="prog" aria-label="Progression d’accords"></select></label>
        <button class="rec-btn" data-act="rec" aria-label="Enregistrer une prise">● REC</button>
      </div>
      <div class="chord-row"></div>
      <div class="panel grille-editeur" hidden></div>
      <div class="tabs" role="tablist">
        <button role="tab" data-tab="beat">Beat</button>
        <button role="tab" data-tab="chanson">Nos chansons</button>
        <button role="tab" data-tab="voix">Prises de voix</button>
        <button role="tab" data-tab="cover">Pochette</button>
        <button role="tab" data-tab="duo">Scène</button>
        <button role="tab" data-tab="instrument">Mon instrument</button>
      </div>
      <div class="tab-body"></div>`;

    const q = (s) => el.querySelector(s);
    let kb = null;
    let disposeTab = () => {};

    q('[data-in=bpm]').value = S.bpm;
    q('[data-in=key]').value = S.key;
    function refreshProgSelect() {
      const all = [...(S.custom ? [S.custom] : []), ...(S.seance ? [S.seance] : []), ...PROGRESSIONS];
      q('[data-in=prog]').innerHTML = all.map((p) => `<option value="${p.id}">${p.name} · ${p.roman}</option>`).join('');
      q('[data-in=prog]').value = S.prog;
      q('[data-in=key]').value = S.key;
    }
    refreshProgSelect();
    const syncTop = () => {
      q('.bpm-out').textContent = S.bpm;
      q('[data-act=play]').textContent = S.playing ? '■' : '▶';
      q('[data-act=play]').classList.toggle('on', S.playing);
      q('[data-act=rec]').classList.toggle('on', !!S.recorder);
      const marques = progression().marques || []; const popOuvert = q('.ch-pop');
      q('.chord-row').innerHTML = accords().map((c, i) => `<div class="chord ${marques[i] ? 'ch-debut' : ''}" data-i="${i}" style="flex-grow:${tempsDe(c)}"><small>${marques[i] ? `<b class="ch-marque">${esc(marques[i])}</b> · ` : ''}${tempsDe(c) === 4 ? '1 mesure' : tempsDe(c) === 8 ? '2 mesures' : `${tempsDe(c)} temps`}</small><b>${chordName(mod12(S.key + c[0]), c[1])}</b></div>`).join('')
        + `<button class="btn small chord-edit" data-act="editer">✎ Mes propres accords</button><p class="chord-note muted">Touche un accord pour le changer. ${progression().note || ''}</p>
        <div class="defi-row"><button class="chip ${S.defis ? 'active' : ''}" data-act="defis">${S.defis ? 'Défis d’impro ✓' : 'Défis d’impro'}</button>${S.defis ? `<p class="defi">${DEFIS_IMPRO[Math.floor(S.loop / 2) % DEFIS_IMPRO.length]}<small>un nouveau défi tous les deux tours</small></p>` : ''}</div>`;
      if (popOuvert) q('.chord-row').appendChild(popOuvert);
    };

    el.addEventListener('input', (e) => {
      const k = e.target.dataset.in;
      if (k === 'bpm') { S.bpm = +e.target.value; save(); syncTop(); }
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.in;
      if (k === 'key') {
        S.key = +e.target.value; save(); relay(); syncTop(); renderTab();
        // La maison s'allume : la tonique et son accord, deux secondes, et on les entend.
        requestAnimationFrame(() => { if (!kb) return; const tri = [0, 4, 7].map((x) => mod12(S.key + x)); kb.keys.forEach((kk, m) => { kk.classList.toggle('k-flash', tri.includes(mod12(m))); kk.classList.toggle('k-flash-t', mod12(m) === mod12(S.key)); }); setTimeout(() => kb?.keys.forEach((kk) => kk.classList.remove('k-flash', 'k-flash-t')), 2200); prechargerSons(['piano']); accordPiano('piano', [0, 4, 7].map((x) => 60 + ((S.key + x) % 12) - (S.key > 6 ? 12 : 0)), { dur: 1.2, vel: 0.5 }); toast(`${FR[S.key]} majeur : la maison est ${FR[S.key]}, l’accord maison ${[0, 4, 7].map((x) => FR[mod12(S.key + x)]).join('-')}.`); });
      }
      if (k === 'prog') { S.prog = e.target.value; save(); relay(); syncTop(); renderTab(); }
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
        S.takes.unshift({ blob, url: URL.createObjectURL(blob), ext, at: new Date(), bpm: S.bpm, chords: [0, 1, 2, 3].map((b) => { const ch = chordAt(b); return chordName(ch.root, ch.qual); }).join(' – ') });
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
      if (act === 'play') { S.playing ? stopPlay() : play(); syncTop(); onScene?.(); }
      if (act === 'rec') toggleRec();
      if (act === 'defis') { S.defis = !S.defis; store.set('defisImpro', S.defis); syncTop(); }
      if (act === 'tap') taper();
      const cb = e.target.closest('.chord-row .chord[data-i]'); if (cb) { ouvrirAccord(+cb.dataset.i, cb); return; }
      if (!e.target.closest('.ch-pop')) q('.ch-pop')?.remove();
      if (act === 'editer') { const box = q('.grille-editeur'); if (!box.hidden) { box.hidden = true; return; } ed = depuisGrille(); rendreEditeur(); box.hidden = false; box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    });
    // Changer de style pendant que ça joue : pas de silence, pas de superposition. Le nouveau prend le relais sur le temps.
    function relay() { if (S.playing) S.restart = true; }
    S.onLoop = () => requestAnimationFrame(() => el.isConnected && syncTop());

    // ---------- Mes propres accords ----------
    // Chaque accord : sa note, sa couleur, sa durée en temps. Tout change en direct, même pendant que ça joue.
    const TYPES = [['M', 'majeur'], ['m', 'mineur'], ['7', '7 (tension qui veut avancer)'], ['maj7', 'maj7 (rêveur)'], ['m7', 'm7 (doux)'], ['sus2', 'sus2 (ouvert)'], ['sus4', 'sus4 (suspendu)'], ['add9', 'add9 (lumineux)'], ['m9', 'm9 (feutré)'], ['dim', 'dim (tendu, sombre)'], ['5', '5 (puissant, sans tierce)']];
    const DUREES = [[1, '1 temps'], [2, '2 temps'], [3, '3 temps'], [4, '1 mesure'], [6, '1 mesure ½'], [8, '2 mesures']];
    let ed = null;
    const depuisGrille = () => accords().map((c) => ({ r: mod12(S.key + c[0]), q: c[1], b: tempsDe(c) }));
    function appliquer() {
      S.custom = { id: 'perso', name: 'Mes accords', roman: ed.map((c) => chordName(c.r, c.q)).join(' – '), chords: ed.map((c) => [mod12(c.r - S.key), c.q, c.b]), note: 'Ta grille à toi : change une note, une couleur ou une durée, ça s’entend au prochain accord.' };
      store.set('customProg', S.custom); S.prog = 'perso'; save(); refreshProgSelect(); relay(); syncTop(); safeBar = -1;
    }
    function rendreEditeur() {
      const box = q('.grille-editeur');
      box.innerHTML = `
        <div class="panel-head"><h2>Mes propres accords</h2><span class="muted small">Choisis chaque accord et combien de temps il dure. ▶ pour l’entendre seul. Tout s’applique en direct.</span></div>
        <ol class="ge-liste">${ed.map((c, i) => `<li data-i="${i}">
          <select data-ge="r" aria-label="Note de l’accord ${i + 1}">${FR.map((n, k) => `<option value="${k}" ${k === c.r ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select data-ge="q" aria-label="Couleur de l’accord ${i + 1}">${TYPES.map(([v, l]) => `<option value="${v}" ${v === c.q ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <select data-ge="b" aria-label="Durée de l’accord ${i + 1}">${DUREES.map(([v, l]) => `<option value="${v}" ${v === c.b ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <b class="ge-nom">${chordName(c.r, c.q)}</b>
          <button class="icon-btn tiny" data-ge="ecoute" aria-label="Écouter">▶</button>
          ${ed.length > 1 ? '<button class="icon-btn tiny" data-ge="moins" aria-label="Retirer">✕</button>' : ''}
        </li>`).join('')}</ol>
        <div class="ec-row">${ed.length < 8 ? '<button class="btn small" data-ge="plus">+ Ajouter un accord</button>' : ''}<button class="btn small" data-ge="fermer">C’est bon</button>
        <span class="muted small">La grille fait ${ed.reduce((a, c) => a + c.b, 0)} temps. Elle reste dans « Accords » sous le nom « Mes accords », et dans les séances.</span></div>`;
    }
    q('.grille-editeur').addEventListener('change', (e) => {
      const li = e.target.closest('[data-i]'); const k = e.target.dataset.ge; if (!li || !k) return;
      const c = ed[+li.dataset.i]; c[k] = k === 'q' ? e.target.value : +e.target.value;
      appliquer(); rendreEditeur();
    });
    q('.grille-editeur').addEventListener('click', (e) => {
      const k = e.target.closest('[data-ge]')?.dataset.ge; if (!k || e.target.tagName === 'SELECT') return;
      const li = e.target.closest('[data-i]');
      if (k === 'ecoute') { const c = ed[+li.dataset.i]; prechargerSons(['piano']); accordPiano('piano', chordIntervals(c.q).map((iv) => 52 + ((c.r + 8) % 12) + iv), { dur: 1.4, vel: 0.6 }); return; }
      if (k === 'moins') { ed.splice(+li.dataset.i, 1); appliquer(); rendreEditeur(); }
      if (k === 'plus') { const d = ed[ed.length - 1]; ed.push({ r: mod12(d.r + 5), q: 'M', b: 4 }); appliquer(); rendreEditeur(); }
      if (k === 'fermer') q('.grille-editeur').hidden = true;
    });
    // Cliquer sur un accord de la rangée : on le change sur place (note, couleur, durée), sans ouvrir l'éditeur complet.
    function ouvrirAccord(i, ancre) {
      q('.ch-pop')?.remove();
      ed = depuisGrille(); const c = ed[i]; if (!c) return;
      const pop = document.createElement('div'); pop.className = 'ch-pop panel';
      const rendre = () => { const x = ed[i]; pop.innerHTML = `<p class="ch-pop-t">Accord ${i + 1} : <b>${chordName(x.r, x.q)}</b></p>
        <div class="ch-pop-row"><select data-cp="r" aria-label="Note">${FR.map((n, k) => `<option value="${k}" ${k === x.r ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select data-cp="q" aria-label="Couleur">${TYPES.map(([v, l]) => `<option value="${v}" ${v === x.q ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-cp="b" aria-label="Durée">${DUREES.map(([v, l]) => `<option value="${v}" ${v === x.b ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="ch-pop-row"><button class="btn small" data-cp="ecoute">▶ Écouter</button><button class="btn small" data-cp="apres">+ Un accord après</button>${ed.length > 1 ? '<button class="btn small" data-cp="retirer">Retirer</button>' : ''}<button class="btn small primary" data-cp="ok">OK</button></div>`; };
      rendre();
      const r = ancre.getBoundingClientRect(); const rr = q('.chord-row').getBoundingClientRect();
      pop.style.left = `${Math.max(0, Math.min(r.left - rr.left, rr.width - 300))}px`; pop.style.top = `${r.bottom - rr.top + 6}px`;
      q('.chord-row').appendChild(pop); pop.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      pop.addEventListener('change', (e) => { const k = e.target.dataset.cp; ed[i][k] = k === 'q' ? e.target.value : +e.target.value; appliquer(); rendre(); q('.chord-row').appendChild(pop); });
      pop.addEventListener('click', (e) => {
        e.stopPropagation(); const k = e.target.closest('[data-cp]')?.dataset.cp; if (!k || e.target.tagName === 'SELECT') return;
        if (k === 'ecoute') { const x = ed[i]; prechargerSons(['piano']); accordPiano('piano', chordIntervals(x.q).map((iv) => 52 + ((x.r + 8) % 12) + iv), { dur: 1.3, vel: 0.6 }); return; }
        if (k === 'apres') { ed.splice(i + 1, 0, { r: mod12(ed[i].r + 5), q: 'M', b: 4 }); appliquer(); }
        if (k === 'retirer') { ed.splice(i, 1); appliquer(); }
        pop.remove();
      });
    }
    // Taper le tempo : la moyenne des derniers intervalles entre les touches.
    const taps = [];
    function taper() {
      const t = performance.now(); if (taps.length && t - taps[taps.length - 1] > 2000) taps.length = 0;
      taps.push(t); if (taps.length > 6) taps.shift();
      if (taps.length >= 3) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); S.bpm = Math.max(50, Math.min(200, Math.round(60000 / iv))); q('[data-in=bpm]').value = S.bpm; save(); syncTop(); }
      q('[data-act=tap]').textContent = taps.length < 3 ? `Encore ${3 - taps.length}…` : `${S.bpm} BPM ✓`;
    }

    // ---------- Onglets ----------
    function renderTab() {
      disposeTab();
      disposeTab = () => {};
      kb?.dispose();
      kb = null;
      el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
      const body = q('.tab-body');
      if (tab === 'beat') beatTab(body);
      if (tab === 'chanson') chansonTab(body, {
        // Une partie ou toute la chanson devient la grille du studio, et ça part avec le beat.
        jouer(acc, nom, marques) {
          S.custom = { id: 'perso', name: nom, roman: acc.map(([r, q]) => chordName(r, q)).join(' – '), chords: acc.map(([r, q, b]) => [mod12(r - S.key), q, b]), marques, note: `${nom} : la chanson tourne en boucle avec le beat.` };
          store.set('customProg', S.custom); S.prog = 'perso'; save(); refreshProgSelect(); relay(); safeBar = -1;
          if (!S.playing) play(); syncTop();
          q('.chord-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        actuels: () => accords().map((c) => [mod12(S.key + c[0]), c[1], tempsDe(c)]),
      });
      if (tab === 'voix') voixTab(body);
      if (tab === 'cover') coverTab(body);
      if (tab === 'duo') duoTab(body);
      if (tab === 'instrument') instrumentTab(body);
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
        <details class="panel sp-studio"><summary><h2>Nos sons de batterie</h2><span class="muted small">Remplace un son par le tien : enregistré au micro ou un fichier.</span></summary><div class="sp-host">${sonsPersoHTML()}</div></details>
        <div class="panel">
          <div class="panel-head"><h2>Où improviser sur le clavier</h2><span class="muted">Les couleurs suivent l’accord qui joue.</span></div>
          <div class="kb-host"></div>
          <p class="muted small kb-aide">Coche ce que tu veux voir. Chaque couleur a sa teinte claire (touches blanches) et sa teinte foncée (touches noires). Le point doré marque la <b>tonique</b>, la note « maison » de la tonalité.</p>
          <ul class="kb-legende">${[['safe', 'L’accord qui joue', 'ça sonne à 100 %, toujours. Idéal pour finir une phrase.'], ['scale', 'La pentatonique', 'sûr aussi, impossible de « fausser ». Parfait pour improviser.'], ['gamme', 'Le reste de la gamme', 'bien en passant, moins pour s’y arrêter.'], ['jazz', 'Couleurs jazz', 'la 9e, la 6te, la 7e de l’accord : une note rêveuse, à poser exprès.'], ['blue', 'Notes blues (hors sentier)', 'un frottement voulu, qui « pleure ». Glisse vers une note voisine juste après.']].map(([k, t, d]) => `<li><label><input type="checkbox" data-voir="${k}" ${voir().has(k) ? 'checked' : ''}><i class="lg-${k}"></i><i class="lg-${k} lg-noire"></i><b>${t}</b> : ${d}</label></li>`).join('')}</ul>
        </div>`;
      kb = keyboard(body.querySelector('.kb-host'), { from: 48, to: 76 });
      paintSafe(0);
      body.addEventListener('change', (e) => { const v = e.target.dataset.voir; if (!v) return; const set = voir(); if (e.target.checked) set.add(v); else set.delete(v); store.set('kbVoir', [...set]); safeBar = -1; paintSafe(S.cur ? chordAtStep(S.cur.step).i : 0); });
      const hote = body.querySelector('.sp-host'); brancherSonsPerso(hote, () => { hote.innerHTML = sonsPersoHTML(); });
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
        if (d) { S.grid = parse(DRUM_PRESETS[d.dataset.drum]); save(); relay(); renderTab(); }
      });
    }

    let safeBar = -1;
    // Les couleurs du clavier, de la plus sûre à la plus audacieuse : l'accord qui joue, la pentatonique,
    // le reste de la gamme (notes de passage), les couleurs jazz de l'accord (9e, 6te, 7e) et les notes blues du ton.
    function paintSafe(i) {
      if (!kb || i === safeBar) return;
      safeBar = i;
      const l = accords(); const c = l[i % l.length]; const ch = { root: mod12(S.key + c[0]), qual: c[1] };
      const tones = new Set(chordIntervals(ch.qual).map((iv) => mod12(ch.root + iv)));
      const pent = new Set([0, 2, 4, 7, 9].map((x) => mod12(S.key + x)));
      const gamme = new Set([0, 2, 4, 5, 7, 9, 11].map((x) => mod12(S.key + x)));
      const jazz = new Set([2, 9, ch.qual.startsWith('m') ? 10 : 11].map((x) => mod12(ch.root + x)));
      const blues = new Set([3, 6, 10].map((x) => mod12(S.key + x)));
      kb.keys.forEach((k, m) => {
        const n = mod12(m); const vu = voir();
        const classe = tones.has(n) && vu.has('safe') ? 'k-safe' : pent.has(n) && vu.has('scale') ? 'k-scale' : jazz.has(n) && vu.has('jazz') ? 'k-jazz' : gamme.has(n) && vu.has('gamme') ? 'k-gamme' : blues.has(n) && vu.has('blue') ? 'k-blue' : '';
        ['k-safe', 'k-scale', 'k-jazz', 'k-gamme', 'k-blue'].forEach((x) => k.classList.toggle(x, x === classe));
        k.classList.toggle('k-maison', n === mod12(S.key));
      });
    }

    function voixTab(body) {
      body.innerHTML = `
        <div class="panel">
          <div class="panel-head"><h2>Prises de voix</h2><span class="muted">Clique ● REC : le beat démarre, ta voix est mixée par-dessus.</span></div>
          ${S.takes.length ? `<ul class="takes">${S.takes.map((t, i) => `
            <li><div><b>Prise ${S.takes.length - i}</b><span class="muted mono">${t.at.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} · ${t.bpm} BPM · ${t.chords}</span></div>
              <audio controls src="${t.url}"></audio>
              ${espace.connected ? (t.gardee ? '<span class="muted small">Au mur ✓</span>' : `<button class="btn small primary" data-garder="${i}">Garder au mur</button>`) : ''}
              <a class="btn small" href="${t.url}" download="diapason-prise-${S.takes.length - i}.${t.ext}">↓ Télécharger</a></li>`).join('')}</ul>`
            : '<p class="muted empty">Aucune prise pour l’instant. Clique ● REC en haut : le beat démarre, ta voix ou ton instrument passe par-dessus.</p>'}
          <p class="muted small">Une prise gardée part au mur comme idée brute : l’autre l’entend, elle peut monter jusqu’au set, et elle compte dans votre plan. Les autres disparaissent en fermant la page.</p>
          <div class="tip-box"><b>Le réflexe de studio</b><p>Après chaque prise : réécoute, nomme <em>une seule</em> chose à améliorer, et refais-la. C’est exactement comme ça que travaillent les pros.</p></div>
        </div>`;
    }

    // Garder une prise : elle devient une idée du mur, partagée, avec ses accords et son tempo.
    document.addEventListener('click', async function garderPrise(e) {
      if (!el.isConnected) { document.removeEventListener('click', garderPrise); return; }
      const b = e.target.closest('[data-garder]'); if (!b || !el.contains(b)) return;
      const t = S.takes[+b.dataset.garder]; if (!t || t.gardee) return;
      b.disabled = true; b.textContent = 'J’envoie…';
      try {
        const a = await uploadAudio(t.blob);
        await saveEntry({ type: 'audio', title: `Prise du studio · ${t.chords}`, audio: a, data: { stage: 0, prise: true, bpm: t.bpm, accords: t.chords } });
        t.gardee = true; toast('La prise est au mur, comme idée brute.'); if (tab === 'voix') renderTab();
      } catch (err) { b.disabled = false; b.textContent = 'Garder au mur'; toast(err.message); }
    });
    function coverTab(body) {
      const c = store.get('cover', { title: '', artist: '', mood: 'Encre et or' });
      // Venue du mur : une image (et peut-être un son ou des mots) à transformer en pochette.
      const hp = new URLSearchParams(location.hash.split('?')[1] || '');
      const byId = (id) => espace.entries?.find((e) => e.id === id);
      if (hp.get('img')) {
        c.img = hp.get('img');
        const avec = byId(hp.get('avec'));
        c.son = avec?.audio ? avec.id : '';
        if (avec?.title) c.title = avec.title.slice(0, 40);
        c.mix = c.mix ?? 0.5;
      }
      const images = espace.connected ? espace.entries.filter((e) => e.image && !e.data?.corbeille) : [];
      const sons = espace.connected ? espace.entries.filter((e) => e.audio && !e.audio.type?.startsWith('video')) : [];
      body.innerHTML = `
        <div class="cover-grid">
          <div class="panel">
            <h2>Pochette</h2>
            <p class="muted">Votre art en fond, votre son gravé par-dessus, ou une image calculée à partir de vos accords. Rien n’est envoyé ailleurs.</p>
            <label class="field col"><span>Titre</span><input class="input" data-c="title" maxlength="40" placeholder="Ex. : Forever more" value="${esc(c.title || '')}"></label>
            <label class="field col"><span>Artiste</span><input class="input" data-c="artist" maxlength="40" placeholder="FLIP" value="${esc(c.artist || '')}"></label>
            ${espace.connected ? `
            <div class="cov-art">
              <span class="cov-lbl">Notre art en fond</span>
              <div class="cov-thumbs">
                <button class="cov-none ${c.img ? '' : 'on'}" data-pick="">Aucune</button>
                ${images.map((e) => `<button class="cov-thumb ${c.img === e.id ? 'on' : ''}" data-pick="${esc(e.id)}" title="${esc(e.title)}"><span data-img="${esc(e.id)}"></span></button>`).join('')}
              </div>
              ${images.length ? '' : '<p class="muted small">Ajoute une photo, un dessin ou une toile au mur : elle apparaîtra ici.</p>'}
              <label class="field col"><span>Gravé par-dessus</span><select data-c="son"><option value="">Nos accords (dessin calculé)</option>${sons.map((e) => `<option value="${esc(e.id)}" ${c.son === e.id ? 'selected' : ''}>Le son : ${esc(e.title || 'sans titre')} (${esc(e.author)})</option>`).join('')}</select></label>
              <label class="field col"><span>Le son par-dessus l’image</span><input type="range" min="0" max="1" step="0.01" data-c="mix" value="${c.mix ?? 0.5}"></label>
            </div>` : ''}
            <label class="field col"><span>Couleurs</span><select data-c="mood">${Object.keys(PALETTES).map((m) => `<option ${m === c.mood ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
            <div class="row">
              <button class="btn" data-cv="remix">Autre style</button>
              <button class="btn primary" data-cv="dl">↓ Télécharger (PNG)</button>
              ${espace.connected ? '<button class="btn" data-cv="mur">Au mur</button>' : ''}
            </div>
            <div class="tip-box"><b>Question</b><p>Que dit ta pochette de ta musique avant même qu’on l’écoute? Montre-la à quelqu’un sans lui faire écouter : quel style imagine-t-il?</p></div>
          </div>
          <div class="panel cover-wrap"><canvas class="cover" width="1080" height="1080" aria-label="Pochette"></canvas></div>
        </div>`;
      body.querySelectorAll('[data-img]').forEach(async (sp) => { const e = byId(sp.dataset.img); if (e) sp.style.backgroundImage = `url("${await audioURL(e.image)}")`; });
      const cv = body.querySelector('.cover');
      const art = { img: null, imgId: '', peaks: null, sonId: '' };
      // Charge l'image et le son choisis une seule fois ; le son devient 720 crêtes (son vrai visage).
      async function loadArt(v) {
        if (v.img !== art.imgId) {
          art.imgId = v.img; art.img = null;
          const e = byId(v.img);
          if (e?.image) { const im = new Image(); im.src = await audioURL(e.image); await im.decode().catch(() => {}); if (art.imgId === v.img) art.img = im; }
        }
        if (v.son !== art.sonId) {
          art.sonId = v.son; art.peaks = null;
          const e = byId(v.son);
          if (e?.audio) {
            try {
              const buf = await audio().decodeAudioData(await (await fetch(await audioURL(e.audio))).arrayBuffer());
              const ch = buf.getChannelData(0); const n = 720; const step = Math.floor(ch.length / n); const pk = new Float32Array(n);
              for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 16) m = Math.max(m, Math.abs(ch[j])); pk[i] = m; }
              const top = Math.max(...pk) || 1; pk.forEach((x, i) => { pk[i] = x / top; });
              if (art.sonId === v.son) art.peaks = pk;
            } catch { toast('Ce son ne se laisse pas dessiner.'); }
          }
        }
      }
      const val = () => ({
        title: body.querySelector('[data-c=title]').value,
        artist: body.querySelector('[data-c=artist]').value,
        mood: body.querySelector('[data-c=mood]').value,
        img: body.querySelector('.cov-thumbs .on')?.dataset.pick || '',
        son: body.querySelector('[data-c=son]')?.value || '',
        mix: +(body.querySelector('[data-c=mix]')?.value ?? 0.5),
      });
      const credit = (v) => { const a = byId(v.img); const b = byId(v.son); return [a && `image : ${a.author}`, b && `son : ${b.author}`].filter(Boolean).join(' · '); };
      const draw = async () => {
        const v = val();
        store.set('cover', v);
        await loadArt(v);
        drawCover(cv, v, { img: art.img, peaks: art.peaks, mix: v.mix, credit: credit(v) });
      };
      let t = 0;
      body.addEventListener('input', () => { clearTimeout(t); t = setTimeout(draw, 120); });
      body.addEventListener('change', (e) => { if (e.target.dataset.c === 'son') draw(); });
      body.addEventListener('click', async (e) => {
        const pk = e.target.closest('[data-pick]');
        if (pk) { body.querySelectorAll('[data-pick]').forEach((x) => x.classList.toggle('on', x === pk)); draw(); return; }
        const a = e.target.closest('[data-cv]')?.dataset.cv;
        if (a === 'remix') { S.variant++; draw(); }
        if (a === 'dl') {
          cv.toBlob((b) => {
            const a2 = document.createElement('a');
            a2.href = URL.createObjectURL(b);
            a2.download = `pochette-${(body.querySelector('[data-c=title]').value || 'flip').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
            a2.click();
          });
        }
        if (a === 'mur') {
          const btn = e.target.closest('[data-cv]'); btn.disabled = true;
          try {
            const v = val();
            const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9));
            const image = await uploadImage(blob);
            await saveEntry({ type: 'image', title: `Pochette · ${v.title || 'sans titre'}`, image, data: { stage: 1, pochette: true, rencontre: [v.img, v.son].filter(Boolean).length === 2 ? [v.img, v.son] : undefined } });
            toast('La pochette est sur le mur.');
          } catch (err) { toast(err.message); }
          btn.disabled = false;
        }
      });
      document.fonts.load('900 80px "Literata"').finally(draw);
    }

    // ---------- Mon instrument : Diapason écoute, reconnaît, propose ----------
    function instrumentTab(body) {
      body.innerHTML = `
        <div class="inst-grid">
          <div class="panel inst-screen screen">
            <div class="inst-now"><small class="mono">accord entendu</small><b class="inst-chord">—</b><span class="inst-key mono">tonalité : à l’écoute…</span></div>
            <div class="chroma" aria-hidden="true">${FR.map((n) => `<div><i></i><span>${n}</span></div>`).join('')}</div>
            <ol class="inst-timeline" aria-label="Accords joués"></ol>
          </div>
          <div class="inst-side">
            <div class="panel">
              <p class="tape">Brancher</p>
              <label class="field col"><span>Entrée audio (micro, interface, guitare)</span><select data-i="device"><option value="">Micro par défaut</option></select></label>
              <div class="row">
                <button class="btn primary" data-i="listen">● Écouter mon instrument</button>
                <button class="btn" data-i="midi">Clavier MIDI</button>
              </div>
              <p class="muted small inst-status">Joue des accords tenus, un à la fois. Guitare, piano, ukulélé : tout ce qui fait des accords.</p>
            </div>
            <div class="panel inst-ideas">
              <p class="tape">Pistes</p>
              <div class="ideas-body"><p class="muted small">Les suggestions apparaissent dès que le labo reconnaît quelques accords.</p></div>
            </div>
          </div>
        </div>
        <section class="panel coin-piano">
          <div class="panel-head"><h2>Le coin piano</h2><span class="muted small">Apprendre et créer, toujours au service de la voix</span></div>
          <div class="cp-grid">${PIANO.map((id) => `<button class="cp-card" data-exo="${id}"><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].duree} min · ${EXERCICES[id].src}</small><span>▶ Le faire</span></button>`).join('')}</div>
        </section>`;
      body.querySelector('.coin-piano').addEventListener('click', (e) => { const b = e.target.closest('[data-exo]'); if (b) import('../exercice.js').then((m) => m.faireExercice(b.dataset.exo)); });
      let listener = null;
      let midi = null;
      const timeline = [];
      const sel = body.querySelector('[data-i=device]');
      navigator.mediaDevices?.enumerateDevices?.().then((ds) => {
        ds.filter((d) => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default').forEach((d, i) => {
          sel.insertAdjacentHTML('beforeend', `<option value="${d.deviceId}">${esc(d.label || `Entrée ${i + 1}`)}</option>`);
        });
      });
      const bars = [...body.querySelectorAll('.chroma i')];
      const showChroma = (c) => { const mx = Math.max(...c) || 1; bars.forEach((b, i) => { b.style.transform = `scaleY(${(c[i] / mx).toFixed(3)})`; }); };

      function onChord(ch) {
        body.querySelector('.inst-chord').textContent = chordLabel(ch);
        if (!timeline.length || chordLabel(timeline.at(-1)) !== chordLabel(ch)) timeline.push(ch);
        if (timeline.length > 16) timeline.shift();
        body.querySelector('.inst-timeline').innerHTML = timeline.map((c, i) => `<li class="${i === timeline.length - 1 ? 'now' : ''}">${chordLabel(c)}</li>`).join('');
        renderIdeas();
      }
      function sessionKey() {
        const ses = listener?.state.session || timeline.reduce((acc, c) => { chordIntervals(c.qual).forEach((iv) => { acc[mod12(c.root + iv)] += 1; }); acc[c.root] += 0.5; return acc; }, new Array(12).fill(0));
        return estimateKey(ses);
      }
      function renderIdeas() {
        if (timeline.length < 2) return;
        const key = sessionKey();
        body.querySelector('.inst-key').textContent = `tonalité : ${FR[key.tonic]} ${key.mode}`;
        const last = timeline.at(-1);
        const next = suggestNext(key, last).filter(Boolean);
        const dia = diatonic(key);
        const prof = getProfile();
        const tones = chordIntervals(last.qual).map((iv) => mod12(last.root + iv));
        const loop = [];
        for (let i = timeline.length - 1; i >= 0 && loop.length < 4; i--) if (!loop.some((c) => chordLabel(c) === chordLabel(timeline[i]))) loop.unshift(timeline[i]);
        body.querySelector('.ideas-body').innerHTML = `
          <h4>Après ${chordLabel(last)}, essaie…</h4>
          <div class="chips-w">${next.map((c) => `<button class="word-chip" data-chord="${c.root}:${c.qual}">${chordLabel(c)} <small>${c.roman}</small></button>`).join('')}</div>
          <h4>Les accords de ta tonalité</h4>
          <div class="chips-w">${dia.map((c) => `<button class="word-chip" data-chord="${c.root}:${c.qual}">${chordLabel(c)} <small>${c.roman}</small></button>`).join('')}</div>
          <h4>Pour chanter dessus</h4>
          <p class="small">Notes sûres sur ${chordLabel(last)} : <b>${tones.map((t) => FR[t]).join(', ')}</b>. ${prof ? `Dans ta zone (${nameFR(prof.low)}–${nameFR(prof.high)}), vise ${FR[tones[1] ?? tones[0]]} : ton duo peut prendre ${FR[tones[2] ?? tones[0]]}, une tierce au-dessus.` : 'En duo : l’un chante la 1<sup>re</sup> note, l’autre la 2<sup>e</sup>. Vous voilà en harmonie.'}</p>
          <p class="small">Ligne de basse : ${timeline.slice(-4).map((c) => FR[c.root]).join(' → ')}</p>
          ${loop.length >= 2 ? `<button class="btn primary" data-i="send">Envoyer ${loop.map(chordLabel).join(' – ')} au Studio</button>` : ''}`;
        body._loop = loop;
        body._key = key;
      }

      body.addEventListener('click', async (e) => {
        const ch = e.target.closest('[data-chord]');
        if (ch) {
          const [root, qual] = ch.dataset.chord.split(':');
          pad(chordIntervals(qual).map((iv) => mtof(48 + +root + iv)), audio().currentTime, 1.2, 0.06);
          return;
        }
        const a = e.target.closest('[data-i]')?.dataset.i;
        if (a === 'listen') {
          if (listener) { listener.stop(); listener = null; e.target.textContent = '● Écouter mon instrument'; return; }
          listener = createListener({ deviceId: sel.value, onFrame: (c) => showChroma(c), onChord });
          try {
            await listener.start();
            e.target.textContent = '■ Arrêter l’écoute';
            body.querySelector('.inst-status').textContent = 'À l’écoute. Laisse sonner chaque accord une seconde.';
          } catch { listener = null; toast('Accès au micro refusé.'); }
        }
        if (a === 'midi') {
          try {
            midi = await connectMIDI({
              onNote: (n, v, on) => { if (on) pluck(mtof(n), { gain: 0.15 + v / 400 }); },
              onChord: (m, chroma) => { showChroma(chroma); onChord(m); },
            });
            body.querySelector('.inst-status').textContent = midi.names.length ? `MIDI branché : ${midi.names.join(', ')}. Joue des accords!` : 'Aucun clavier MIDI détecté. Branche-le, puis réessaie.';
          } catch (err) { toast(err.message); }
        }
        if (a === 'send' && body._loop) {
          const key = body._key;
          const t = majorTonic(key);
          const chords = body._loop.map((c) => [mod12(c.root - t), c.qual]);
          while (chords.length < 4) chords.push(chords[chords.length % body._loop.length]);
          S.custom = { id: 'perso', name: 'Tes accords', roman: body._loop.map(chordLabel).join(' – '), chords: chords.slice(0, 4), note: 'Les accords que tu as joués, maintenant en boucle avec le beat.' };
          store.set('customProg', S.custom);
          S.key = t;
          S.prog = 'perso';
          save();
          refreshProgSelect();
          syncTop();
          tab = 'beat';
          store.set('studioTab', tab);
          renderTab();
          if (!S.playing) { play(); syncTop(); }
          toast('Tes accords tournent maintenant avec le beat. Ajoute ta voix!');
        }
      });
      disposeTab = () => { listener?.stop(); midi?.stop(); };
    }

    // ---------- Scène : concevoir, entendre, voir (solo ou duo) ----------
    function duoTab(body) {
      const names = store.get('duoNames', ['', '']);
      body.innerHTML = `
        <div class="scene-grid">
          <div class="panel scene-panel">
            <canvas class="scene" aria-label="Ta boucle de 4 mesures : chaque point est une note de ta mélodie"></canvas>
            <div class="scene-rec mono" hidden>● REC CLIP</div>
          </div>
          <div class="scene-side">
            <div class="panel">
              <div class="seg mode-seg" role="group" aria-label="Mode">
                <button class="chip" data-mode="solo">Solo</button>
                <button class="chip" data-mode="duo">Duo · question / réponse</button>
              </div>
              <div class="duo-names" hidden>
                <input class="input" data-p="0" placeholder="Zaza (question)" maxlength="16" aria-label="Qui pose la question" value="${esc(names[0])}">
                <input class="input" data-p="1" placeholder="Frog (réponse)" maxlength="16" aria-label="Qui répond" value="${esc(names[1])}">
                <button class="icon-btn" data-sc="swap" title="Échanger les rôles" aria-label="Échanger les rôles">⇄</button>
              </div>
              <p class="scene-how small"></p>
              <div class="pads" role="group" aria-label="Notes de ta mélodie (gamme pentatonique)"></div>
              <div class="row">
                <button class="btn primary" data-sc="play">▶ Lancer la boucle</button>
                <button class="btn" data-sc="undo" title="Annuler la dernière note">↶</button>
                <button class="btn" data-sc="clear" title="Tout effacer">Effacer</button>
                <button class="btn" data-sc="demo">Exemple</button>
              </div>
            </div>
            <div class="panel clip-panel">
              <div class="panel-head"><h2>Ton clip</h2><span class="muted small">2 tours de boucle, image + son</span></div>
              <button class="btn primary big clip-btn" data-sc="clip">● Tourner le clip</button>
              <ul class="clips"></ul>
              <p class="muted small">Le titre vient de l’onglet Pochette. Allume le micro et chante pendant le tournage : ta voix est dans le clip.</p>
            </div>
          </div>
        </div>
        <details class="panel scene-tips">
          <summary>Pistes pour la scène</summary>
          <div class="duo-roles">
            <div><b>Solo · le looping autonome</b><p>Tu tiens toute la structure : la boucle donne l’harmonie, tes pastilles la mélodie, ta voix le texte (une phrase par mesure = un couplet).</p></div>
            <div><b>Duo · l’écoute avant tout</b><p>Mesures 1 et 3 : Zaza pose une question musicale. Mesures 2 et 4 : Frog répond en reprenant <em>une</em> idée de la question (même rythme, ou même note de départ).</p></div>
            <div><b>Corps</b><p>Mâchoire molle, épaules basses. Si la gorge serre, descends la tonalité en haut de la page.</p></div>
          </div>
        </details>`;

      const scv = autoCanvas(body.querySelector('.scene'));
      const padColors = ['#3ee6ff', '#5fb8ff', '#9b6bff', '#d36bff', '#ff4fb3', '#ff8a3d', '#ffb43e', '#b6ff3e'];
      const who = (slot) => (S.mode === 'duo' ? Math.floor(slot / 8) % 2 : 0);
      const playerName = (i) => body.querySelector(`[data-p="${i}"]`)?.value.trim() || ['Zaza', 'Frog'][i];
      const noteColor = (n) => (S.mode === 'duo' ? (who(n.slot) ? '#ff4fb3' : '#3ee6ff') : padColors[n.deg]);
      const bursts = [];

      function renderPads() {
        body.querySelector('.pads').innerHTML = padMidis().map((m, i) => `
          <button class="pad" data-pad="${i}" style="--c:${padColors[i]}" aria-label="${FR[mod12(m)]}"><b>${FR[mod12(m)]}</b><kbd>${i + 1}</kbd></button>`).join('');
      }
      function sync() {
        el.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === S.mode));
        body.querySelector('.duo-names').hidden = S.mode !== 'duo';
        body.querySelector('[data-sc=play]').textContent = S.playing ? '■ Arrêter' : '▶ Lancer la boucle';
        body.querySelector('.scene-how').innerHTML = S.mode === 'duo'
          ? '<b>Mesures 1 et 3</b> : question (cyan) · <b>2 et 4</b> : réponse (rose). Lance la boucle et tapez chacun votre tour : vos notes restent dans la boucle.'
          : '<b>1.</b> Lance la boucle <b>2.</b> Tape les pastilles en rythme : chaque note reste dans la boucle <b>3.</b> Allume le micro et chante par-dessus.';
        body.querySelector('.clips').innerHTML = S.clips.map((c, i) => `
          <li><video src="${c.url}" controls playsinline></video><a class="btn small" href="${c.url}" download="diapason-clip-${S.clips.length - i}.${c.ext}">↓ Télécharger</a></li>`).join('');
      }

      // Une tape pendant la boucle = une note déposée sur la croche la plus proche.
      function hitPad(i) {
        const midi = padMidis()[i];
        pluck(mtof(midi), { gain: 0.32 });
        const pad = body.querySelector(`[data-pad="${i}"]`);
        pad?.classList.add('down');
        setTimeout(() => pad?.classList.remove('down'), 160);
        if (!S.playing || !S.cur) return;
        const sixteenth = 60 / S.bpm / 4;
        const pos = (S.cur.step + (audio().currentTime - S.cur.time) / sixteenth) / 2;
        const slot = ((Math.round(pos) % 32) + 32) % 32;
        // Déjà jouée maintenant : on évite qu'elle sonne une 2e fois si la croche arrondie est juste devant.
        const skip = Math.round(pos) > pos;
        S.melody = S.melody.filter((n) => !(n.slot === slot && n.deg === i));
        S.melody.push({ slot, deg: i, who: who(slot), skip });
        saveMelody();
        bursts.push({ slot, deg: i, t: performance.now() });
      }

      body.addEventListener('click', (e) => {
        const pd = e.target.closest('[data-pad]');
        if (pd) return;
        const md = e.target.closest('[data-mode]');
        if (md) { S.mode = md.dataset.mode; store.set('sceneMode', S.mode); sync(); return; }
        const a = e.target.closest('[data-sc]')?.dataset.sc;
        if (a === 'play') { S.playing ? stopPlay() : play(); syncTop(); sync(); }
        if (a === 'undo') { S.melody.pop(); saveMelody(); }
        if (a === 'clear') { S.melody = []; saveMelody(); }
        if (a === 'demo') {
          S.melody = DEMO_MELODY.map(([slot, deg]) => ({ slot, deg, who: who(slot) }));
          saveMelody();
          if (!S.playing) { play(); syncTop(); sync(); }
          toast('Écoute et regarde la mélodie tourner… puis efface-la et fais la tienne!');
        }
        if (a === 'swap') {
          const [x, y] = [body.querySelector('[data-p="0"]'), body.querySelector('[data-p="1"]')];
          [x.value, y.value] = [y.value, x.value];
          store.set('duoNames', [x.value, y.value]);
        }
        if (a === 'clip') recordClip();
      });
      // pointerdown : réaction immédiate au doigt, essentiel pour taper en rythme.
      body.addEventListener('pointerdown', (e) => {
        const pd = e.target.closest('[data-pad]');
        if (pd) { e.preventDefault(); hitPad(+pd.dataset.pad); }
      });
      body.addEventListener('input', (e) => {
        if (e.target.dataset.p != null) store.set('duoNames', [0, 1].map((i) => body.querySelector(`[data-p="${i}"]`).value));
      });
      const onKey = (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.target.closest('input,textarea,select')) return;
        const i = '12345678'.indexOf(e.key);
        if (i >= 0) hitPad(i);
      };
      window.addEventListener('keydown', onKey);

      // Le clip : la scène filmée (canvas) + le mixage final, pendant 2 tours de boucle.
      let rec = null;
      async function recordClip() {
        if (rec) return;
        const canvas = body.querySelector('.scene');
        const types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
        const type = window.MediaRecorder && types.find((t) => MediaRecorder.isTypeSupported(t));
        if (!canvas.captureStream || !type) { toast('Ce navigateur ne sait pas filmer la scène. Essaie Chrome, Edge ou Safari récent.'); return; }
        const c = audio();
        const dest = c.createMediaStreamDestination();
        finalOut().connect(dest);
        let mg = null;
        if (mic.active) { mg = c.createGain(); mic.source.connect(mg).connect(dest); }
        const stream = canvas.captureStream(30);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        const chunks = [];
        rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4e6 });
        rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        rec.onstop = () => {
          try { finalOut().disconnect(dest); } catch { /* déjà déconnecté */ }
          mg?.disconnect();
          stream.getVideoTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: type.split(';')[0] });
          S.clips.unshift({ url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm' });
          rec = null;
          S.filming = false;
          body.querySelector('.scene-rec').hidden = true;
          body.querySelector('.clip-btn').disabled = false;
          sync();
          toast('Clip prêt! Regarde-le, puis télécharge-le.');
        };
        if (!S.playing) { play(); syncTop(); }
        S.filming = true;
        body.querySelector('.scene-rec').hidden = false;
        body.querySelector('.clip-btn').disabled = true;
        rec.start();
        setTimeout(() => rec?.state === 'recording' && rec.stop(), 2 * 16 * (60 / S.bpm) * 1000 + 300);
        sync();
      }

      // Dessin de la scène
      const stopScene = animate((now) => {
        const { ctx, w, h } = scv;
        if (!w) return;
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) * 0.4;
        ctx.fillStyle = 'rgba(7,6,15,0.4)';
        ctx.fillRect(0, 0, w, h);
        const sixteenth = 60 / S.bpm / 4;
        const pos = S.playing && S.cur ? ((S.cur.step + Math.max(0, audio().currentTime - S.cur.time) / sixteenth) / 2) % 32 : -1;
        const ang = (slot) => (slot / 32) * Math.PI * 2 - Math.PI / 2;
        const rad = (deg) => R * (0.42 + (deg / 7) * 0.5);
        const curBar = pos < 0 ? -1 : Math.floor(pos / 8);

        // Les 4 mesures : arcs + nom de l'accord
        for (let b = 0; b < 4; b++) {
          const col = S.mode === 'duo' ? (b % 2 ? '#ff4fb3' : '#3ee6ff') : '#ffffff';
          const on = b === curBar;
          ctx.strokeStyle = col;
          ctx.globalAlpha = on ? 0.9 : 0.25;
          ctx.lineWidth = on ? 6 : 3;
          ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, ang(b * 8) + 0.04, ang(b * 8 + 8) - 0.04); ctx.stroke();
          const ch = chordAt(b);
          const mid = ang(b * 8 + 4);
          ctx.globalAlpha = on ? 1 : 0.55;
          ctx.fillStyle = col;
          ctx.font = `800 ${Math.round(R * (on ? 0.13 : 0.1))}px "Literata", serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(chordName(ch.root, ch.qual), cx + Math.cos(mid) * R * 1.17, cy + Math.sin(mid) * R * 1.17);
        }
        ctx.globalAlpha = 1;
        // Croches et temps
        for (let s = 0; s < 32; s++) {
          const a = ang(s);
          const big = s % 2 === 0;
          ctx.strokeStyle = 'rgba(255,255,255,' + (big ? 0.28 : 0.1) + ')';
          ctx.lineWidth = big ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R * 0.36, cy + Math.sin(a) * R * 0.36);
          ctx.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95);
          ctx.stroke();
        }
        // La mélodie : une constellation (contour mélodique) qui tourne avec la boucle
        const notes = [...S.melody].sort((x, y) => x.slot - y.slot || x.deg - y.deg);
        if (notes.length > 1) {
          ctx.strokeStyle = 'rgba(255,255,255,.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          notes.forEach((n, i) => {
            const x = cx + Math.cos(ang(n.slot)) * rad(n.deg);
            const y = cy + Math.sin(ang(n.slot)) * rad(n.deg);
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
        }
        notes.forEach((n) => {
          const x = cx + Math.cos(ang(n.slot)) * rad(n.deg);
          const y = cy + Math.sin(ang(n.slot)) * rad(n.deg);
          let d = pos < 0 ? 9 : (pos - n.slot + 32) % 32;
          const lit = d < 1.2 ? 1 - d / 1.2 : 0;
          const col = noteColor(n);
          ctx.fillStyle = col;
          ctx.shadowColor = col;
          ctx.shadowBlur = 8 + lit * 40;
          ctx.beginPath(); ctx.arc(x, y, R * (0.035 + lit * 0.04), 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
        // Éclats quand on dépose une note
        for (let i = bursts.length - 1; i >= 0; i--) {
          const bu = bursts[i];
          const k = (now - bu.t) / 600;
          if (k > 1) { bursts.splice(i, 1); continue; }
          ctx.strokeStyle = padColors[bu.deg];
          ctx.globalAlpha = 1 - k;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx + Math.cos(ang(bu.slot)) * rad(bu.deg), cy + Math.sin(ang(bu.slot)) * rad(bu.deg), R * (0.04 + k * 0.25), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Tête de lecture + ta voix (si le micro est allumé)
        if (pos >= 0) {
          const a = ang(pos);
          const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(1, 'rgba(255,255,255,.9)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
          const v = mic.current;
          if (v) {
            const ms = padMidis();
            const deg = clamp(((v.midi - ms[0]) / (ms[7] - ms[0])) * 7, -0.5, 7.5);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#b6ff3e';
            ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad(deg), cy + Math.sin(a) * rad(deg), R * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        // Centre : l'accord en cours, et à qui le tour
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        const bar = curBar < 0 ? 0 : curBar;
        const ch = chordAt(bar);
        ctx.font = `900 ${Math.round(R * 0.2)}px "Literata", serif`;
        ctx.fillText(chordName(ch.root, ch.qual), cx, cy - R * 0.05);
        ctx.font = `600 ${Math.round(R * 0.075)}px "Atkinson Hyperlegible", sans-serif`;
        ctx.fillStyle = S.mode === 'duo' ? (bar % 2 ? '#ff4fb3' : '#3ee6ff') : 'rgba(255,255,255,.7)';
        const line = S.mode === 'duo'
          ? `${bar % 2 ? 'Réponse' : 'Question'} : ${playerName(bar % 2)}`
          : (S.playing ? `Mesure ${bar + 1} / 4` : 'Lance la boucle');
        ctx.fillText(line, cx, cy + R * 0.15);
        // Titre incrusté dans le clip
        if (S.filming) {
          const cov = store.get('cover', {});
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#fff';
          ctx.font = `800 ${Math.round(w * 0.04)}px "Literata", serif`;
          ctx.fillText((cov.title || 'Sans titre').toUpperCase(), w * 0.04, h - w * 0.07);
          ctx.font = `500 ${Math.round(w * 0.028)}px "Atkinson Hyperlegible", sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.fillText(`${cov.artist || 'FLIP'} · ${S.bpm} BPM · Diapason`, w * 0.04, h - w * 0.035);
        }
      });

      renderPads();
      sync();
      onScene = sync;
      disposeTab = () => { stopScene(); scv.dispose(); window.removeEventListener('keydown', onKey); onScene = null; if (rec?.state === 'recording') rec.stop(); };
    }

    // Suivi visuel du pas courant.
    const stop = animate(() => {
      if (!S.playing) return;
      const now = audio().currentTime;
      let cur = null;
      while (S.queue.length && S.queue[0].time <= now) cur = S.queue.shift();
      if (!cur) return;
      S.cur = cur;
      const st = cur.step % 16;
      const bar = chordAtStep(cur.step).i;
      el.querySelectorAll('.cell.now').forEach((c) => c.classList.remove('now'));
      el.querySelectorAll(`[data-cell$=":${st}"]`).forEach((c) => c.classList.add('now'));
      el.querySelectorAll('.chord').forEach((c) => c.classList.toggle('now', +c.dataset.i === bar));
      paintSafe(bar);
    });

    syncTop();
    renderTab();
    return () => { stop(); disposeTab(); kb?.dispose(); S.onLoop = null; };
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Pochette générative ----------
// Les pochettes : trois partis pris graphiques, sobres, comme chez un vrai label.
// « Crêtes » : le son en lignes empilées. « Soleil » : un aplat et une ligne d'horizon. « Typo » : le titre fait l'image.
// Avec notre art : l'image en bichromie, du grain, un cadre typographique ; le vrai son en fines lignes.
// Couleurs : fond, encre, accent.
const PALETTES = {
  'Encre et or': ['#141210', '#efe6d2', '#c9a45c'],
  'Nuit bleue': ['#0e1726', '#e9e4d8', '#6f9fe0'],
  'Brique': ['#2a1511', '#f2e3cf', '#d4583c'],
  'Sauge': ['#1c2420', '#e9e7d9', '#93b08e'],
  'Rose poudre': ['#231a1d', '#f4e7e4', '#da8aa6'],
  'Papier': ['#ece5d6', '#1b1915', '#d93a24'],
};
function drawCover(canvas, { title, artist, mood }, art = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const [bg, ink, acc] = PALETTES[mood] || PALETTES['Encre et or'];
  const prog = progression();
  const seed = hash(`${title}|${artist}|${mood}|${S.key}|${prog.id}|${S.variant}`);
  const r = rng(seed);
  const style = art.img ? 'art' : ['cretes', 'soleil', 'typo'][S.variant % 3];
  const M = 72; // marge
  ctx.save();
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
  // Le motif sonore : les crêtes viennent du vrai son si on l'a, sinon des accords.
  const harm = prog.chords.map(([deg]) => 2 + (mod12(S.key + deg) % 7));
  const amp = (k, x) => {
    if (art.peaks) { const i = Math.floor((x / W) * art.peaks.length); return art.peaks[(i + k * 7) % art.peaks.length]; }
    return harm.reduce((a, hh, j) => a + Math.abs(Math.sin(x * 0.006 * hh + k * 0.5 + j + seed % 5)) / (j + 1), 0) / 2;
  };
  if (style === 'art' && art.img?.naturalWidth) {
    // Bichromie : la luminance de l'image passe du fond à l'encre.
    const iw = art.img.naturalWidth; const ih = art.img.naturalHeight; const k = Math.max(W / iw, W / ih);
    ctx.drawImage(art.img, (W - iw * k) / 2, (W - ih * k) / 2, iw * k, ih * k);
    const img = ctx.getImageData(0, 0, W, W); const d = img.data;
    const c0 = hex(bg); const c1 = hex(ink);
    for (let i = 0; i < d.length; i += 4) {
      const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      const t = Math.min(1, Math.max(0, (l - 0.12) / 0.8));
      d[i] = c0[0] + (c1[0] - c0[0]) * t; d[i + 1] = c0[1] + (c1[1] - c0[1]) * t; d[i + 2] = c0[2] + (c1[2] - c0[2]) * t;
    }
    ctx.putImageData(img, 0, 0);
    if (art.peaks && (art.mix ?? 0.5) > 0.05) {
      // Le son, gravé en fines lignes horizontales dans la partie basse.
      ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.globalAlpha = 0.35 + 0.6 * (art.mix ?? 0.5);
      for (let k = 0; k < 9; k++) {
        const y0 = W * 0.62 + k * 14; ctx.beginPath();
        for (let x = M; x <= W - M; x += 4) { const y = y0 - amp(k, x) * 46; x === M ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  } else if (style === 'cretes') {
    // Des lignes de crêtes empilées : chaque ligne cache celle de derrière (comme une gravure).
    const rows = 38; const top = W * 0.16; const h = W * 0.5;
    ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    for (let k = 0; k < rows; k++) {
      const y0 = top + (k / rows) * h; ctx.beginPath();
      for (let x = M; x <= W - M; x += 5) {
        const c = Math.exp(-(((x - W / 2) / (W * 0.16)) ** 2));
        const y = y0 - c * (10 + amp(k, x) * 90) * (0.6 + r() * 0.08);
        x === M ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W - M, y0 + 4); ctx.lineTo(M, y0 + 4); ctx.closePath();
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = k === Math.floor(rows * 0.62) ? acc : ink; ctx.stroke();
    }
  } else if (style === 'soleil') {
    // Un disque plein, une ligne d'horizon, des rayures fines qui le coupent.
    const cx = W * (0.38 + r() * 0.24); const cy = W * 0.4; const R = W * 0.24;
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bg;
    for (let k = 0; k < 7; k++) { const y = cy + R * 0.15 + k * (R * 0.12) + k * k * 2; ctx.fillRect(cx - R - 2, y, R * 2 + 4, 4 + k * 2.2); }
    ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, cy + R * 0.92); ctx.lineTo(W - M, cy + R * 0.92); ctx.stroke();
  } else {
    // Le titre fait l'image : énorme, rogné, en contour, avec une seule ligne pleine.
    const t = (title || 'Sans titre').toUpperCase();
    ctx.font = `900 ${W * 0.36}px "Literata", serif`;
    ctx.textBaseline = 'alphabetic';
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = 2; ctx.strokeStyle = k === 1 ? acc : ink; ctx.globalAlpha = k === 1 ? 1 : 0.55;
      ctx.strokeText(t, M - W * 0.04, W * 0.34 + k * W * 0.2);
    }
    ctx.globalAlpha = 1;
  }
  // Grain fin, partout : c'est ce qui donne la matière d'un vrai tirage.
  const g = ctx.getImageData(0, 0, W, W); const gd = g.data;
  for (let i = 0; i < gd.length; i += 4) { const n = (r() - 0.5) * 14; gd[i] += n; gd[i + 1] += n; gd[i + 2] += n; }
  ctx.putImageData(g, 0, 0);
  // Cadre typographique : métadonnées en haut, titre et artiste en bas, une règle fine.
  const txt = style === 'art' ? '#fff' : ink;
  ctx.fillStyle = txt; ctx.globalAlpha = 0.8;
  ctx.font = '500 22px "Atkinson Hyperlegible", sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('FLIP', M, M);
  ctx.textAlign = 'right'; ctx.fillText(`${FR[S.key]} · ${S.bpm} BPM`, W - M, M);
  ctx.globalAlpha = 1;
  ctx.fillRect(M, M + 16, W - 2 * M, 1.5);
  if (style !== 'typo') {
    const t = (title || 'Sans titre');
    let size = 96; ctx.font = `800 ${size}px "Literata", serif`;
    while (ctx.measureText(t).width > W - 2 * M && size > 40) { size -= 4; ctx.font = `800 ${size}px "Literata", serif`; }
    if (style === 'art') { const gr = ctx.createLinearGradient(0, W * 0.7, 0, W); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = gr; ctx.fillRect(0, W * 0.7, W, W * 0.3); }
    ctx.fillStyle = txt; ctx.textAlign = 'left';
    ctx.fillText(t, M, W - M - 44);
  } else { ctx.font = '800 44px "Literata", serif'; ctx.fillStyle = txt; ctx.textAlign = 'left'; ctx.fillText(title || 'Sans titre', M, W - M - 44); }
  ctx.font = 'italic 500 30px "Literata", serif';
  ctx.fillStyle = style === 'art' ? '#fff' : acc; ctx.textAlign = 'left';
  ctx.fillText(artist || 'Zaza & Frog', M, W - M);
  if (art.credit) { ctx.font = '500 20px "Atkinson Hyperlegible", sans-serif'; ctx.fillStyle = txt; ctx.globalAlpha = 0.75; ctx.textAlign = 'right'; ctx.fillText(art.credit, W - M, W - M); ctx.globalAlpha = 1; }
  ctx.restore();
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// ---------- Pour la session guidée : la grille du jour en boucle ----------
export function setLoop(key, grille) {
  S.seance = { id: 'seance', name: `Séance : ${grille.nom}`, roman: grille.roman, chords: grille.chords, note: grille.usage };
  store.set('seanceProg', S.seance);
  S.key = key;
  S.prog = 'seance';
  save();
}
// Venu du labo : les disques deviennent la grille de batterie.
export function setGrid(g) { S.grid = g; save(); }
export function toggleLoop() {
  if (S.playing) stopPlay(); else play();
  return S.playing;
}
export const loopPlaying = () => S.playing;
// La boucle suit l'horloge MIDI du matériel de Frog.
export function setTempo(bpm) {
  S.bpm = clamp(Math.round(bpm), 60, 160);
  save();
  return S.bpm;
}
// Venue de L'oreille : les accords trouvés dans un enregistrement deviennent « Mes accords » du studio.
// chords : [[note absolue 0-11, qualité, temps]] ; key : la tonique majeure de la pièce.
export function chargerGrille(key, chords, nom = 'Mes accords') {
  S.key = key;
  S.custom = { id: 'perso', name: nom, roman: chords.map(([r, q]) => chordName(r, q)).join(' – '), chords: chords.map(([r, q, b]) => [mod12(r - key), q, b]), note: 'Les accords trouvés par L’oreille dans ton enregistrement : change-les à ta guise dans « Mes propres accords ».' };
  store.set('customProg', S.custom); S.prog = 'perso'; save();
}
