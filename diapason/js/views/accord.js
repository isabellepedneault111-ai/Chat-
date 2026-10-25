// Voix + piano : Frog joue (SV-1 en MIDI, ou le clavier à l'écran), Zaza chante.
// L'app allume les notes de l'accord dans la tessiture de Zaza, mesure si sa voix tombe dedans
// et nomme l'intervalle qu'elle chante. Le piano de Frog devient le coach de la voix de Zaza.
import { startMic, onPitch, mic } from '../audio.js';
import { autoCanvas, animate, keyboard, getProfile, toast, css } from '../ui.js';
import { nameFR, FR, mod12, clamp } from '../music.js';
import { startConsole, consoleState, onConsole, heldNotes } from '../console.js';
import { matchChord, chordLabel } from '../instrument.js';
import { espace, profileOf } from '../espace.js';

const WINDOW = 7; // secondes visibles
const ROLE = ['fondamentale', 'seconde mineure', 'seconde', 'tierce mineure', 'tierce', 'quarte', 'triton', 'quinte', 'sixte mineure', 'sixte', 'septième', 'septième majeure'];
const MODES = [
  ['libre', 'Dans l’accord', 'Chante n’importe quelle note de l’accord de Frog.'],
  ['note', 'Frog donne la note', 'Frog joue UNE note : Zaza la reprend, à l’octave qui lui va.'],
  ['harmonie', 'Harmonie', 'Chante une note de l’accord… mais pas celle du dessus que joue Frog : vous voilà à deux voix.'],
];

export default {
  id: 'accord',
  mount(el) {
    let mode = 'libre';
    let screenNotes = new Set(); // notes tenues au clavier à l'écran (si pas de MIDI)
    const trail = [];
    let inTime = 0; let voicedTime = 0; let streak = 0; let landedChord = ''; let curChord = '';
    let lastT = performance.now();

    // La tessiture de la voix qui chante (Zaza d'abord), sinon une plage médiane.
    const voice = () => {
      const mem = espace.meta?.members || ['Zaza', 'Frog'];
      const v = (espace.connected && (profileOf(mem[0])?.voix || profileOf(espace.me)?.voix)) || getProfile();
      return v ? { low: v.low - 2, high: v.high + 2, name: espace.connected ? mem[0] : '' } : { low: 52, high: 79, name: '' };
    };

    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">Voix + piano</p>
          <h1>Le piano de Frog, coach de ta voix</h1>
          <p class="muted">Frog joue un accord : les notes que tu peux chanter s’allument, dans TA tessiture. Tu chantes : l’app te dit si tu es dedans, et quelle note de l’accord tu tiens.</p>
        </div>
        <div class="actions">
          <button class="btn" data-a="midi">Brancher le piano (MIDI)</button>
          <button class="btn primary" data-a="mic">● Allumer ma voix</button>
        </div>
      </div>
      <div class="seg-tabs acc-modes" role="tablist">${MODES.map(([id, l]) => `<button role="tab" data-mode="${id}" aria-selected="${id === mode}">${l}</button>`).join('')}</div>
      <p class="muted small acc-hint"></p>
      <div class="acc-grid">
        <div class="panel acc-stage screen">
          <canvas class="acc-canvas" aria-label="Les notes de l’accord dans la tessiture, et la voix en direct"></canvas>
          <div class="acc-chord"><small class="mono">Frog joue</small><b>—</b></div>
          <div class="acc-now"></div>
        </div>
        <div class="panel acc-side">
          <div class="acc-score"><b class="mono">—</b><span>du temps chanté dans l’accord (30 dernières secondes)</span></div>
          <div class="acc-streak"><b class="mono">0</b><span>accords trouvés d’affilée</span></div>
          <p class="muted small acc-src"></p>
          <details class="acc-why"><summary>Pourquoi c’est puissant</summary>
            <p>Chanter juste, c’est surtout <b>entendre où l’on est par rapport à l’harmonie</b>. Ici, l’harmonie vient du vrai piano de Frog, avec ses vrais sons (piano, Rhodes, orgue…) : Zaza apprend à placer sa voix dans les accords qu’ils joueront sur scène, pas sur un exercice abstrait.</p>
            <p>Un son tenu (orgue, nappe) aide à travailler la stabilité ; un piano qui s’éteint oblige à garder la note de mémoire. Frog choisit le son : il choisit l’exercice.</p>
          </details>
        </div>
      </div>
      <div class="panel kb-panel acc-kb">
        <p class="muted small">Pas de MIDI branché? Frog peut toucher les notes ici (ou au clavier de l’ordinateur).</p>
        <div class="kb-host"></div>
      </div>`;

    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.acc-canvas'));
    const kb = keyboard(q('.kb-host'), { from: 48, to: 72, pcKeys: true, onPlay: (m) => {
      if (screenNotes.has(m)) screenNotes.delete(m); else screenNotes.add(m);
      kb.only([...screenNotes], 'k-live');
    } });

    const notes = () => (consoleState.on && heldNotes().length ? heldNotes() : [...screenNotes].sort((a, b) => a - b));
    function chordInfo() {
      const ns = notes();
      if (!ns.length) return null;
      const pcs = [...new Set(ns.map(mod12))];
      let root = mod12(ns[0]);
      let label = FR[root];
      if (pcs.length >= 3) { const m = matchChord(pcs.reduce((c, p) => { c[p] += 1; return c; }, new Array(12).fill(0))); root = m.root; label = chordLabel(m); }
      else if (pcs.length === 2) label = `${FR[mod12(ns[0])]} + ${FR[mod12(ns[1])]}`;
      return { ns, pcs, root, label, top: ns[ns.length - 1] };
    }
    // Les cibles selon le mode : les classes de hauteur à chanter.
    function targets(ci) {
      if (!ci) return [];
      if (mode === 'note') return [mod12(ci.top)];
      if (mode === 'harmonie') return ci.pcs.filter((p) => p !== mod12(ci.top));
      return ci.pcs;
    }

    function refreshTexts() {
      el.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === mode));
      q('.acc-hint').textContent = MODES.find((m) => m[0] === mode)[2];
      const v = voice();
      q('.acc-src').textContent = `Tessiture utilisée : ${nameFR(v.low + 2)} → ${nameFR(v.high - 2)}${v.name ? ` (empreinte de ${v.name})` : ''}. ${consoleState.on ? `Piano : ${consoleState.devices.join(', ') || 'en attente d’un appareil'}.` : 'Piano : clavier à l’écran.'}`;
    }

    const offPitch = onPitch(() => {});
    const offCon = onConsole((ev) => { if (ev.kind === 'status') refreshTexts(); });

    const stop = animate((now) => {
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      const ci = chordInfo();
      const tg = targets(ci);
      q('.acc-chord b').textContent = ci ? ci.label : '—';
      const v = voice();
      const p = mic.current;
      const t = now / 1000;
      // Où est la voix par rapport aux cibles?
      let hit = null;
      if (p && tg.length) {
        const pc = mod12(p.midi);
        const cents = (p.midi - Math.round(p.midi)) * 100;
        if (tg.includes(pc) && Math.abs(cents) <= 35) hit = { pc, role: ROLE[mod12(pc - ci.root)] };
      }
      if (p) {
        voicedTime += dt;
        if (hit) inTime += dt;
        trail.push({ t, m: p.midi, hit: !!hit });
      }
      // fenêtre glissante de 30 s pour le score
      const decay = Math.exp(-dt / 30);
      inTime *= decay; voicedTime *= decay;
      while (trail.length && trail[0].t < t - WINDOW) trail.shift();
      // Série : un accord « trouvé » compte une fois ; un accord passé sans être trouvé remet à zéro.
      if (ci && ci.label !== curChord) { if (curChord && landedChord !== curChord) streak = 0; curChord = ci.label; }
      if (hit && ci && landedChord !== ci.label) { landedChord = ci.label; streak++; }
      q('.acc-score b').textContent = voicedTime > 1 ? `${Math.round((inTime / voicedTime) * 100)} %` : '—';
      q('.acc-streak b').textContent = streak;
      q('.acc-now').innerHTML = hit ? `<b>Dans l’accord</b> tu tiens la <em>${hit.role}</em> de ${FR[ci.root]}` : p ? `<span>${nameFR(p.midi)}</span>` : (ci ? '<span>Chante!</span>' : '<span>En attente d’un accord de Frog…</span>');
      q('.acc-stage').classList.toggle('lit', !!hit);

      // Dessin : échelle des notes de la tessiture, cibles allumées, traînée de la voix.
      const { ctx, w, h } = cv;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const y = (m) => h - ((m - v.low) / (v.high - v.low)) * h;
      for (let m = Math.ceil(v.low); m <= v.high; m++) {
        const target = tg.includes(mod12(m));
        const inChord = ci && ci.pcs.includes(mod12(m));
        ctx.fillStyle = target ? 'rgba(241,207,78,.22)' : inChord ? 'rgba(255,255,255,.06)' : 'transparent';
        const band = h / (v.high - v.low);
        ctx.fillRect(0, y(m) - band / 2, w, band);
        if (target || m % 12 === 0) {
          ctx.fillStyle = target ? '#f1cf4e' : 'rgba(255,255,255,.35)';
          ctx.font = `${target ? 600 : 500} 11px "IBM Plex Mono", monospace`;
          ctx.fillText(`${nameFR(m)}${target && ci ? ` · ${ROLE[mod12(m - ci.root)]}` : ''}`, 8, y(m) + 4);
        }
      }
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1]; const b = trail[i];
        if (b.t - a.t > 0.2) continue;
        ctx.strokeStyle = b.hit ? '#f1cf4e' : css('--zaza') || '#b8336a';
        ctx.beginPath();
        ctx.moveTo(w - ((t - a.t) / WINDOW) * w, y(a.m));
        ctx.lineTo(w - ((t - b.t) / WINDOW) * w, y(b.m));
        ctx.stroke();
      }
      if (p) {
        ctx.fillStyle = hit ? '#f1cf4e' : '#fff';
        ctx.beginPath(); ctx.arc(w - 4, y(clamp(p.midi, v.low, v.high)), 9, 0, Math.PI * 2); ctx.fill();
      }
    });

    el.addEventListener('click', async (e) => {
      const md = e.target.closest('[data-mode]');
      if (md) { mode = md.dataset.mode; refreshTexts(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'midi') {
        try { await startConsole(); refreshTexts(); toast(consoleState.devices.length ? `Piano branché : ${consoleState.devices.join(', ')}. Joue un accord!` : 'MIDI autorisé : branche le piano, il apparaîtra tout seul.'); } catch (err) { toast(err.message); }
      }
      if (a === 'mic') {
        if (await startMic()) { e.target.closest('[data-a]').textContent = '● Voix allumée'; } else toast('Micro refusé. Autorise-le dans la barre d’adresse.');
      }
    });
    refreshTexts();
    return () => { stop(); cv.dispose(); kb.dispose(); offPitch(); offCon(); };
  },
};
