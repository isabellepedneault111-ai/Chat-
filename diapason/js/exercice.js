// Faire l'exercice : il se joue au lieu de se lire. Un minuteur, la consigne du moment en grand,
// et ce dont l'exercice a besoin : un métronome, une boucle d'accords, le tour de parole, un souffle à suivre.
import { audio, drums, pluck } from './audio.js';
import { EXERCICES, MEMBERS, consignesDe } from './duo.js';
import { espace } from './espace.js';
import { FR, mod12, mtof } from './music.js';
import { logPractice } from './traces.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VAMP = [[0, 'M'], [5, 'M'], [0, 'M'], [5, 'M']];
// Ce que chaque exercice met en jeu. tours : mesures par tour de parole ; tete : alterner entendre / jouer.
const MODES = {
  'e-penta': { bpm: 80, boucle: [[0, '5'], [0, '5'], [0, '5'], [0, '5']], aide: 'Un bourdon sur la tonique : toutes les notes de la pentatonique sonnent juste.', notes: [0, 2, 4, 7, 9] },
  'e-echo': { bpm: 84, metro: true, tours: 1, aide: 'Une mesure chacun : on lance, l’autre répète.' },
  'e-gamme': { bpm: 72, metro: true, aide: 'Les attaques tombent-elles sur le clic?', notes: [0, 2, 4, 5, 7, 9, 11] },
  'e-regard': { bpm: 88, boucle: [[0, 'M'], [5, 'M'], [0, 'M'], [7, 'M']], aide: 'Même boucle tout du long : seul le regard change.' },
  'e-corps': { bpm: 60, souffle: true, aide: 'Inspirez quand le cercle grandit, expirez quand il se vide.' },
  'i-appel': { bpm: 90, boucle: VAMP, tours: 2, aide: 'Deux mesures chacun. Le nom allumé, c’est son tour.' },
  'i-nonrep': { bpm: 90, boucle: VAMP, aide: 'À chaque passage, change UN paramètre.' },
  'i-eco': { bpm: 76, boucle: [[0, '5'], [0, '5'], [5, '5'], [0, '5']], aide: 'Peu de notes : tout passe par le rythme et le timbre.' },
  'i-degres': { bpm: 84, boucle: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], degres: true, aide: 'La voix se limite aux degrés 1, 2, 3 et 5.' },
  'i-preentendre': { bpm: 72, metro: true, tete: true, aide: 'Une mesure dans ta tête, une mesure jouée.' },
  'i-image': { bpm: 70, boucle: [[0, 'sus2'], [5, 'sus2'], [9, 'm'], [7, 'sus4']], aide: 'Une nappe qui flotte : cherchez la couleur, pas les notes.' },
  'i-theme': { aide: 'Jouez-le sans en parler. Comparez ensuite.' },
  'i-libre': { aide: 'Sans plan. Laissez de l’espace à l’autre.' },
  'a-fragment': { aide: 'Trois variations du même fragment : nuances, accents, densité.' },
  'p-renv': { bpm: 76, boucle: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], renv: true, aide: 'Touche un accord pour l’entendre. Le chemin le plus court entre les accords, c’est celui où les doigts bougent le moins.' },
  'p-harmo': { yaourt: true, aide: 'La mélodie de Zaza d’abord, tes accords ensuite.' },
  'p-comping': { bpm: 84, boucle: VAMP, comping: true, aide: 'La bande montre où frapper : elle change à chaque consigne.' },
  'p-couleurs': { bpm: 72, boucle: [[0, 'sus2'], [2, 'sus2'], [5, 'sus2'], [7, 'sus2']], notes: [0, 7, 2], aide: 'Quinte et neuvième, sans tierce : ni joyeux ni triste, ouvert.' },
  'p-basse': { bpm: 80, metro: true, notes: [0, 11, 9, 7], aide: 'La basse descend d’un pas par mesure : la main droite fait ce qu’elle veut.' },
  'p-reharmo': { reharmo: true, aide: 'La même note, quatre couleurs. Touche chaque accord, chante Mi par-dessus.' },
};
// Les quatre façons d'accompagner, en doubles-croches : où frapper dans la mesure.
const COMPING = [[0, 4, 8, 12], [0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 6, 8, 11, 14], [0]];
// Do, Fa, Sol, Do : le chemin le plus court (conduite des voix) en notes MIDI.
const CHEMIN = [['Do', [60, 64, 67]], ['Fa', [60, 65, 69]], ['Sol', [59, 62, 67]], ['Do', [60, 64, 67]]];
const MI = [['Do', [60, 64, 67], 'Mi = la tierce'], ['Lam', [57, 60, 64], 'Mi = la quinte'], ['Mim', [52, 55, 64], 'Mi = la fondamentale'], ['Famaj7', [53, 57, 60, 64], 'Mi = la septième']];
const nomNote = (m) => FR[mod12(m)];
const joueAccord = (ns) => { const t = audio().currentTime + 0.02; import('./sampler.js').then((sp) => ns.forEach((n, i) => sp.notePiano(n, { when: t + i * 0.02, dur: 1.8, vel: 0.6 }))); };

// L'exemple joué par le clavier de l'app, en boucle, au tempo de l'exercice : la partie que Frog jouerait.
// Chaque motif : [temps de départ, note, durée] en temps (noires), et sa longueur ; texte : ce que le motif demande.
const montee = (ns) => [...ns, ...ns.slice(0, -1).reverse()];
const GUIDES = {
  'e-gamme': () => { const g = montee([60, 62, 64, 65, 67, 69, 71, 72]); const noires = g.map((m, i) => [i, m, 0.9]); const croches = g.map((m, i) => [g.length + 1 + i / 2, m, 0.45]); return { motif: [...noires, ...croches], long: g.length + 1 + Math.ceil(g.length / 2) + 1 }; },
  'e-penta': () => { const g = montee([60, 62, 64, 67, 69, 72]); return { motif: [[0, 48, g.length - 0.1], ...g.map((m, i) => [i, m, 0.9])], long: g.length }; },
  'i-eco': () => ({ motif: [[0, 48, 7.8], [0, 60, 3.8], [4, 67, 3.8]], long: 8 }),
  'i-preentendre': () => { const P = [[60, 62, 64, 67], [67, 64, 62, 60], [64, 65, 67, 72], [72, 69, 67, 64]]; return { motif: P.flatMap((ph, k) => ph.map((m, i) => [k * 12 + i, m, 0.9])), long: 48, phases: ['Écoute', 'Dans ta tête', 'À toi'] }; },
};
const guideDe = (id, m) => (GUIDES[id] ? GUIDES[id]() : m.notes && m.bpm ? (() => { const g = montee(m.notes.map((iv) => 60 + iv)); return { motif: g.map((x, i) => [i, x, 0.9]), long: g.length }; })() : null);
// Un clavier d'une octave et demie, de Do 4 à Sol 5 : il s'allume sur ce que l'app joue, et se joue au doigt.
const BL = [0, 2, 4, 5, 7, 9, 11]; const NO = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
// Dessine en SVG le clavier de l’app (Do à Sol, une octave et demie) dont les touches s’allument quand l’exemple joue.
function clavierHTML() {
  let b = ''; let n = ''; let x = 0;
  for (let m = 60; m <= 79; m++) { const pc = m % 12;
    if (BL.includes(pc)) { b += `<rect x="${x * 20}" y="0" width="19" height="70" rx="2" class="cv-b" data-m="${m}"/><text x="${x * 20 + 9.5}" y="64" class="cv-n">${FR[pc]}</text>`; x++; }
    else n += `<rect x="${x * 20 - 6}" y="0" width="12" height="44" rx="2" class="cv-k" data-m="${m}"/>`; }
  return `<svg class="exo-clavier" viewBox="0 0 ${x * 20} 70" role="group" aria-label="Le clavier de l’app : il s’allume sur ce qu’il joue ; touche une note pour l’entendre">${b}${n}</svg>`;
}

// Le réglage d’un exercice (son tempo, sa boucle, ses consignes).
export function exoMode(id) { return MODES[id] || {}; }
// Les exercices de piano, reconnus à leur préfixe p-.
export const PIANO = Object.keys(MODES).filter((k) => k.startsWith('p-'));

// Le dernier mumble de Zaza (une page du journal avec un enregistrement), s'il existe.
const dernierYaourt = (mem) => espace.entries?.filter((e) => e.author === mem[0] && e.audio && (e.data?.flux || e.data?.journal || e.data?.relais)).sort((a, b) => b.createdAt - a.createdAt)[0];
// Le bouton qui fait réentendre le dernier mumble de Zaza, s’il y en a un.
function yaourtHTML(mem) {
  const y = dernierYaourt(mem);
  return y ? `<button class="exo-add3" data-yaourt="${esc(y.id)}">▶ Le dernier mumble de ${esc(mem[0])} : « ${esc(y.title || 'sans titre')} »</button>`
    : `<p class="exo-ia">Pas encore de mumble de ${esc(mem[0])}. Demande-lui : Écrire → Écrire sur le beat → Mumble.</p>`;
}

// garderBoucle : lancé depuis une séance, on garde la grille du jour qui joue déjà.
export async function faireExercice(id, { garderBoucle = false, solo = false } = {}) {
  if (id.startsWith('p-')) import('./sampler.js').then((sp) => sp.prechargerSons(['piano']));
  const ex = EXERCICES[id];
  if (!ex || document.querySelector('.exo')) return;
  const m = MODES[id] || {};
  const mem = espace.meta?.members || MEMBERS;
  const key = 0; // en Do : la tonalité la plus simple à partager au clavier
  let bpm = m.bpm || 0;
  const total = (ex.duree || 5) * 60;
  const steps = consignesDe(id, { solo, moi: espace.me, membres: espace.meta?.members || MEMBERS }) || ex.comment || [];
  const guide = guideDe(id, m);
  const box = document.createElement('div');
  box.className = 'exo';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', ex.nom);
  const visuel = m.souffle ? '<div class="exo-souffle"><i></i><span>Inspire</span></div>'
    : m.tours || m.tete ? `<div class="exo-tours">${(m.tete ? ['Dans ta tête', 'Joue-la'] : mem).map((n, i) => `<b data-t="${i}" class="${m.tete ? '' : i ? 'f' : 'z'}">${esc(n)}</b>`).join('')}${m.tours ? '<b data-t="2" class="t3" hidden>Le troisième</b>' : ''}</div>${m.tours ? '<button class="exo-add3" data-x="trois">+ Inviter le troisième membre</button><p class="exo-ia" hidden></p>' : ''}`
      : m.degres ? `<div class="exo-notes">${[0, 2, 4, 7].map((iv, i) => `<b><small>${[1, 2, 3, 5][i]}</small>${FR[mod12(key + iv)]}</b>`).join('')}</div>`
        : m.notes ? `<div class="exo-notes">${m.notes.map((iv) => `<b>${FR[mod12(key + iv)]}</b>`).join('')}</div>`
          : m.renv ? `<div class="exo-chemin">${CHEMIN.map(([n, ns], i) => `<button class="exo-acc" data-acc="${ns.join(',')}"><small>${n}</small>${ns.map(nomNote).join(' ')}</button>${i < CHEMIN.length - 1 ? '<span>→</span>' : ''}`).join('')}</div>`
            : m.reharmo ? `<div class="exo-chemin">${MI.map(([n, ns, r]) => `<button class="exo-acc" data-acc="${ns.join(',')}"><small>${r}</small>${n}</button>`).join('')}</div><button class="exo-add3" data-acc="64">▶ Mi seul</button>`
              : m.comping ? '<div class="exo-comp groove-strip">' + Array.from({ length: 16 }, (_, i) => `<i class="${i % 4 === 0 ? 'temps' : ''}"></i>`).join('') + '</div>'
                : m.yaourt ? yaourtHTML(mem) : '';
  box.innerHTML = `
    <div class="exo-in">
      <header><p class="exo-k">${ex.duree} min · ${esc(ex.src || '')}</p><h2>${esc(ex.nom)}</h2><p class="exo-aide">${esc(m.aide || '')}</p></header>
      <div class="exo-main">
        <svg class="exo-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="exo-ring-bg"/><circle cx="60" cy="60" r="54" class="exo-ring-fg" pathLength="1"/></svg>
        <p class="exo-time">${Math.floor(total / 60)}:00</p>
        ${bpm ? `<div class="exo-beats">${[0, 1, 2, 3].map(() => '<i></i>').join('')}</div>` : ''}
      </div>
      ${visuel}
      ${guide ? `<div class="exo-guide">${clavierHTML()}<p class="exo-phase" aria-live="polite"></p></div>` : ''}
      <div class="exo-moi">${guide ? '<button class="btn" data-x="guide" aria-pressed="false">▶ L’exemple en boucle</button>' : ''}<button class="btn rec-btn" data-x="rec">● M’enregistrer</button><span class="exo-prise"></span></div>
      <ol class="exo-steps">${steps.map((s, i) => `<li data-i="${i}">${esc(s)}</li>`).join('')}</ol>
      <div class="exo-ctrl">
        <button class="btn" data-x="pause">Pause</button>
        ${bpm ? '<span class="exo-bpm"><button class="icon-btn tiny" data-x="slower" aria-label="Plus lent">−</button><b class="mono">BPM</b><button class="icon-btn tiny" data-x="faster" aria-label="Plus vite">+</button></span>' : ''}
        <button class="btn" data-x="next">Consigne suivante</button>
        <button class="btn primary" data-x="end">Terminer</button>
      </div>
    </div>`;
  document.body.appendChild(box);
  const q = (s) => box.querySelector(s);
  const upBpm = () => { const b = q('.exo-bpm b'); if (b) b.textContent = `${bpm} BPM`; };
  upBpm();

  // La boucle d'accords passe par le studio (même son, même horloge MIDI vers le clavier de Frog).
  let studio = null;
  let boucleAvant = false;
  if (m.boucle && !garderBoucle) {
    studio = await import('./views/studio.js');
    studio.setLoop(key, { nom: ex.nom, roman: '', chords: m.boucle, usage: m.aide || '' });
    studio.setTempo(bpm);
    boucleAvant = studio.loopPlaying();
    if (!boucleAvant) studio.toggleLoop();
  }
  const c = audio();
  let t0 = c.currentTime + 0.1;
  let trois = null; let troisFait = -1;
  let nextBeat = t0; let beatN = 0; let paused = false; let elapsed = 0; let last = performance.now(); let manual = -1;
  const metroOn = m.metro || m.tours || m.tete;
  // L'exemple en boucle : on programme un motif à la fois, un peu à l'avance, et on allume les touches au bon moment.
  let guideOn = false; let gStart = 0; const timers = new Set();
  const allumer = (midi, quand, dur) => { const k = box.querySelector(`.exo-clavier [data-m="${midi}"]`); if (!k) return; const a = setTimeout(() => { k.classList.add('on'); const b = setTimeout(() => { k.classList.remove('on'); timers.delete(b); }, dur * 1000); timers.add(b); timers.delete(a); }, Math.max(0, (quand - c.currentTime) * 1000)); timers.add(a); };
  const sp = import('./sampler.js').then((x) => { x.prechargerSons(['piano']); return x; });
  const sched = setInterval(() => {
    if (guideOn && !paused && guide) {
      const beat = 60 / (bpm || 80);
      if (gStart < c.currentTime - 0.25) gStart = c.currentTime + 0.05; // après une veille : reprendre au présent
      while (gStart < c.currentTime + 0.25) {
        const debut = gStart;
        sp.then((x) => guide.motif.forEach(([t, midi, d]) => { const w = debut + t * beat; x.notePiano(midi, { when: w, dur: d * beat, vel: midi < 55 ? 0.35 : 0.6 }); allumer(midi, w, d * beat * 0.9); }));
        if (guide.phases) guide.phases.forEach((txt, k) => { const a = setTimeout(() => { const ph = q('.exo-phase'); if (ph) ph.textContent = txt; timers.delete(a); }, Math.max(0, (debut + k * 4 * beat - c.currentTime) * 1000)); timers.add(a); });
        gStart += guide.long * beat;
      }
    }
    if (paused || !bpm) return;
    if (nextBeat < c.currentTime - 0.25) nextBeat = c.currentTime + 0.05;
    while (nextBeat < c.currentTime + 0.12) {
      if (metroOn && (!m.boucle || garderBoucle)) drums.hat(nextBeat, beatN % 4 === 0 ? 1 : 0.45);
      nextBeat += 60 / bpm; beatN++;
    }
  }, 25);
  let raf = 0;
  const frame = (now) => {
    if (!box.isConnected) return;
    if (!paused) elapsed += (now - last) / 1000;
    last = now;
    const left = Math.max(0, total - elapsed);
    q('.exo-time').textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
    q('.exo-ring-fg').style.strokeDashoffset = `${elapsed / total}`;
    // La consigne avance avec le temps (on peut aussi la pousser à la main).
    const si = Math.max(manual, Math.min(steps.length - 1, Math.floor(elapsed / (total / Math.max(1, steps.length)))));
    box.querySelectorAll('.exo-steps li').forEach((li, i) => { li.classList.toggle('on', i === si); li.classList.toggle('vu', i < si); });
    if (bpm) {
      const beatLen = 60 / bpm; const pos = (c.currentTime - t0) / beatLen;
      const b = Math.floor(pos);
      box.querySelectorAll('.exo-beats i').forEach((x, i) => x.classList.toggle('on', b >= 0 && b % 4 === i));
      if (m.comping) {
        const pat = COMPING[Math.min(COMPING.length - 1, Math.max(manual, Math.floor(elapsed / (total / COMPING.length))))] || COMPING[0];
        const six = Math.floor(pos * 4); const cur = six >= 0 ? six % 16 : -1;
        box.querySelectorAll('.exo-comp i').forEach((x, i) => { x.classList.toggle('sing', pat.includes(i)); x.classList.toggle('now', i === cur); });
      }
      if (m.tours || m.tete) {
        const n = trois ? 3 : 2; const per = 4 * (m.tours || 1);
        const cycle = Math.floor(Math.max(0, b) / per); const turn = cycle % n;
        box.querySelectorAll('.exo-tours b').forEach((x) => x.classList.toggle('on', +x.dataset.t === turn));
        // Le troisième joue pile au début de son tour : on le programme un temps à l'avance.
        const nextCycle = cycle + 1;
        if (trois && nextCycle % 3 === 2 && troisFait !== nextCycle && b % per === per - 1) {
          troisFait = nextCycle;
          const quoi = trois.repondre(t0 + nextCycle * per * beatLen, bpm);
          const ia = q('.exo-ia'); ia.hidden = false; ia.textContent = `Le troisième ${quoi}.`;
        }
      }
    }
    if (m.souffle) { const ph = (elapsed % 8) / 8; const sz = ph < 0.5 ? ph * 2 : 2 - ph * 2; q('.exo-souffle i').style.transform = `scale(${0.35 + sz * 0.65})`; q('.exo-souffle span').textContent = ph < 0.5 ? 'Inspire' : 'Expire'; }
    if (left <= 0) { end(true); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  // Termine l’exercice : arrête l’animation, les minuteries, l’enregistrement et la boucle, puis rend la main.
  function end(done) {
    cancelAnimationFrame(raf); clearInterval(sched); trois?.dispose(); timers.forEach(clearTimeout); if (rec?.state === 'recording') rec.stop();
    if (studio?.loopPlaying() && !boucleAvant) studio.toggleLoop();
    logPractice('exercice', elapsed / 60, { exercice: id, nom: ex.nom });
    box.classList.add('out');
    setTimeout(() => box.remove(), 300);
    if (done) import('./ui.js').then(({ toast }) => toast(`« ${ex.nom} » : fait. Ça compte dans le bilan.`));
    removeEventListener('keydown', onKey);
  }
  const onKey = (e) => { if (e.key === 'Escape') end(false); if (e.key === ' ') { e.preventDefault(); q('[data-x=pause]').click(); } };
  addEventListener('keydown', onKey);
  // M'enregistrer : la voix (ou le clavier branché), pendant que l'exemple joue ; on réécoute, et on peut le garder au mur.
  let rec = null; let prise = null;
  // « M’enregistrer » : capte le micro sans traitement, puis propose d’écouter la prise et de la garder au Mur.
  async function enregistrer(btn) {
    if (rec?.state === 'recording') { rec.stop(); return; }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const bouts = []; rec = new MediaRecorder(flux); const debut = Date.now();
      rec.ondataavailable = (ev) => ev.data.size && bouts.push(ev.data);
      rec.onstop = () => {
        flux.getTracks().forEach((t) => t.stop()); btn.textContent = '● Une autre prise'; btn.classList.remove('on');
        prise = { blob: new Blob(bouts, { type: rec.mimeType || 'audio/webm' }), duree: (Date.now() - debut) / 1000 };
        const zone = q('.exo-prise'); if (!zone) return; const url = URL.createObjectURL(prise.blob);
        zone.innerHTML = `<audio controls src="${url}"></audio>${espace.connected ? '<button class="btn small" data-x="garder">Garder au mur</button>' : ''}`;
      };
      rec.start(); btn.textContent = '■ Arrêter'; btn.classList.add('on');
    } catch { import('./ui.js').then(({ toast }) => toast('Le micro n’est pas accessible : autorise-le dans le navigateur, puis réessaie.')); }
  }
  box.addEventListener('click', (e) => {
    const x = e.target.closest('[data-x]')?.dataset.x;
    if (x === 'guide') { guideOn = !guideOn; const b = e.target.closest('[data-x]'); b.setAttribute('aria-pressed', guideOn); b.textContent = guideOn ? '■ Arrêter l’exemple' : '▶ L’exemple en boucle'; if (guideOn) gStart = c.currentTime + 0.15; else { timers.forEach(clearTimeout); timers.clear(); box.querySelectorAll('.exo-clavier .on').forEach((k) => k.classList.remove('on')); const ph = q('.exo-phase'); if (ph) ph.textContent = ''; } }
    if (x === 'rec') enregistrer(e.target.closest('[data-x]'));
    if (x === 'garder' && prise) { const b = e.target.closest('[data-x]'); b.disabled = true; b.textContent = 'Envoi…';
      import('./espace.js').then(async ({ uploadAudio, saveEntry }) => { try { const a = await uploadAudio(prise.blob); await saveEntry({ type: 'audio', title: `Exercice · ${ex.nom}`, audio: { ...a, duration: +prise.duree.toFixed(1) }, data: { stage: 0, exercice: id } }); b.textContent = 'Au mur ✓'; } catch (err) { b.disabled = false; b.textContent = 'Garder au mur'; import('./ui.js').then(({ toast }) => toast(err.message)); } }); }
    const touche = e.target.closest('.exo-clavier [data-m]'); if (touche) { const mm = +touche.dataset.m; sp.then((sx) => sx.notePiano(mm, { when: c.currentTime + 0.01, dur: 0.9, vel: 0.6 })); touche.classList.add('on'); setTimeout(() => touche.classList.remove('on'), 300); }
    if (x === 'end') end(elapsed > 30);
    const acc = e.target.closest('[data-acc]');
    if (acc) joueAccord(acc.dataset.acc.split(',').map(Number));
    const yb = e.target.closest('[data-yaourt]');
    if (yb) { const y = espace.entries.find((z) => z.id === yb.dataset.yaourt); import('./espace.js').then(async ({ audioURL }) => { const a = new Audio(await audioURL(y.audio)); a.play(); }); }
    if (x === 'trois' && !trois) {
      // Il écoute la voix (micro) et le clavier (MIDI), puis répond une fois sur trois.
      import('./audio.js').then((a) => a.startMic()).catch(() => {});
      import('./console.js').then((cn) => cn.startConsole()).catch(() => {});
      import('./troisieme.js').then((t) => {
        trois = t.troisieme({ key });
        q('.exo-tours .t3').hidden = false;
        e.target.closest('[data-x]').remove();
        const ia = q('.exo-ia'); ia.hidden = false; ia.textContent = 'Le troisième écoute. À son tour, il reprend ce qu’il a entendu et le transforme.';
        t0 = c.currentTime + 0.1; nextBeat = t0; beatN = 0;
      });
    }
    if (x === 'next') manual = Math.min(steps.length - 1, Math.max(manual, Math.floor(elapsed / (total / Math.max(1, steps.length)))) + 1);
    if (x === 'pause') {
      paused = !paused; e.target.textContent = paused ? 'Reprendre' : 'Pause';
      if (studio && paused === studio.loopPlaying()) studio.toggleLoop();
      if (!paused) { t0 = c.currentTime + 0.1; nextBeat = t0; beatN = 0; }
    }
    if (x === 'slower' || x === 'faster') {
      bpm = Math.max(50, Math.min(160, bpm + (x === 'faster' ? 4 : -4))); upBpm();
      if (studio) studio.setTempo(bpm);
      t0 = c.currentTime + 0.1; nextBeat = t0; beatN = 0;
    }
  });
}
