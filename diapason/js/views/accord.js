// Voix + piano : Frog joue (SV-1 en MIDI, ou le clavier à l'écran), Zaza chante.
// L'app allume les notes de l'accord dans la tessiture de Zaza, mesure si sa voix tombe dedans
// et nomme l'intervalle qu'elle chante. Le piano de Frog devient le coach de la voix de Zaza.
import { startMic, onPitch, mic } from '../audio.js';
import { autoCanvas, animate, keyboard, getProfile, toast, css } from '../ui.js';
import { nameFR, FR, mod12, clamp } from '../music.js';
import { startConsole, consoleState, onConsole, heldNotes } from '../console.js';
import { matchChord, chordLabel } from '../instrument.js';
import { espace, profileOf, saveEntry, onEspace } from '../espace.js';
import { esc } from './carnet.js';

const WINDOW = 7; // secondes visibles
const ROLE = ['fondamentale', 'seconde mineure', 'seconde', 'tierce mineure', 'tierce', 'quarte', 'triton', 'quinte', 'sixte mineure', 'sixte', 'septième', 'septième majeure'];
const MODES = [
  ['libre', 'Dans l’accord', 'Chante n’importe quelle note de l’accord de Frog.'],
  ['note', 'Frog donne la note', 'Frog joue UNE note : Zaza la reprend, à l’octave qui lui va.'],
  ['harmonie', 'Harmonie', 'Chante une note de l’accord… mais pas celle du dessus que joue Frog : vous voilà à deux voix.'],
  ['duel', 'Duel inversé', 'Zaza chante une mélodie, Frog cherche les accords qui la portent. Cette fois, le score est pour lui.'],
];
const QUAL = { M: '', m: 'm' };
// Les accords (majeurs et mineurs) qui contiennent une note : elle y est fondamentale, tierce ou quinte.
function chordsWith(pc) {
  return [[pc, 'M'], [mod12(pc - 4), 'M'], [mod12(pc - 7), 'M'], [pc, 'm'], [mod12(pc - 3), 'm'], [mod12(pc - 7), 'm']].map(([r, q]) => FR[r] + QUAL[q]);
}

// ---------- La carte de nos accords : où la voix de Zaza est chez elle ----------
const CARTE = 'carte-accords';
export function carte() {
  const c = espace.entries.find((e) => e.id === CARTE)?.data?.chords || {};
  return Object.entries(c).map(([label, v]) => ({ label, s: v.s, j: v.s ? v.j / v.s : 0, t: v.t })).filter((x) => x.s >= 4).sort((a, b) => b.s - a.s);
}
export function carteHTML(list = carte()) {
  if (!list.length) return '<p class="muted small">La carte se dessine toute seule pendant que vous jouez : chaque accord où Zaza chante y prend sa place.</p>';
  const max = list[0].s;
  const zone = (j) => (j >= 0.75 ? 'chez-elle' : j >= 0.5 ? 'en-route' : 'a-apprivoiser');
  const home = list.filter((x) => x.j >= 0.75).slice(0, 3).map((x) => x.label);
  const wild = list.filter((x) => x.j < 0.5).slice(0, 3).map((x) => x.label);
  return `<div class="carte">${list.slice(0, 18).map((x) => `<span class="carte-tile ${zone(x.j)}" style="--w:${(0.55 + 0.45 * (x.s / max)).toFixed(2)}" title="${Math.round(x.s / 60 * 10) / 10} min chantées, ${Math.round(x.j * 100)} % juste"><b>${esc(x.label)}</b><small>${Math.round(x.j * 100)} %</small></span>`).join('')}</div>
    <p class="carte-read">${home.length ? `Ta voix est chez elle sur <b>${home.join(', ')}</b> : bâtissez-y vos refrains.` : ''} ${wild.length ? `À apprivoiser : <b>${wild.join(', ')}</b>, en mode « Frog donne la note ».` : ''}</p>`;
}
async function saveCarte(delta) {
  if (!espace.connected || !Object.keys(delta).length) return;
  const apply = (data) => {
    const c = { ...(data?.chords || {}) };
    for (const [k, v] of Object.entries(delta)) { const o = c[k] || { s: 0, j: 0 }; c[k] = { s: Math.round((o.s + v.s) * 10) / 10, j: Math.round((o.j + v.j) * 10) / 10, t: Date.now() }; }
    return { chords: c };
  };
  const cur = espace.entries.find((e) => e.id === CARTE);
  const r = await saveEntry({ id: CARTE, type: 'carte', title: 'Carte de nos accords', data: apply(cur?.data) }, { baseUpdatedAt: cur?.updatedAt });
  if (r.conflict) await saveEntry({ ...r.current, data: apply(r.current.data) }, { baseUpdatedAt: r.current.updatedAt });
}

export default {
  id: 'accord',
  mount(el) {
    let mode = 'libre';
    let screenNotes = new Set(); // notes tenues au clavier à l'écran (si pas de MIDI)
    const trail = [];
    let inTime = 0; let voicedTime = 0; let streak = 0; let landedChord = ''; let curChord = '';
    let lastT = performance.now();
    let pend = {}; let lastFlush = performance.now();
    const flush = () => { const d = pend; pend = {}; lastFlush = performance.now(); saveCarte(d).catch(() => {}); };
    const showCarte = () => { const b = el.querySelector('.acc-carte-body'); if (b) b.innerHTML = carteHTML(); };

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
          <div class="acc-carte"><h4>La carte de nos accords</h4><div class="acc-carte-body"></div></div>
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
      if (mode === 'duel') return ci.pcs;
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
    const offEsp = onEspace((w) => { if (w === 'entries') showCarte(); });
    showCarte();

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
      // Carte : temps chanté et temps juste, accord par accord (pas en duel : là, c'est Frog qu'on évalue).
      if (p && ci && mode !== 'duel') { const k = ci.label; pend[k] = pend[k] || { s: 0, j: 0 }; pend[k].s += dt; if (hit) pend[k].j += dt; }
      if (now - lastFlush > 20000 && Object.keys(pend).length) flush();
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
      q('.acc-score span').textContent = mode === 'duel' ? 'du temps où l’accord de Frog porte la note de Zaza' : 'du temps chanté dans l’accord (30 dernières secondes)';
      q('.acc-score b').textContent = voicedTime > 1 ? `${Math.round((inTime / voicedTime) * 100)} %` : '—';
      q('.acc-streak b').textContent = streak;
      if (mode === 'duel') {
        const sung = p && Math.abs((p.midi - Math.round(p.midi)) * 100) <= 35 ? mod12(p.midi) : null;
        q('.acc-now').innerHTML = sung == null ? '<span>Zaza, chante ta mélodie…</span>'
          : hit ? `<b>Ton accord porte sa note</b> : son ${FR[sung]} est la <em>${hit.role}</em> de ${FR[ci.root]}`
            : `<span>Sa note : <b>${FR[sung]}</b>. Essaie ${chordsWith(sung).slice(0, 4).join(', ')}</span>`;
      } else q('.acc-now').innerHTML = hit ? `<b>Dans l’accord</b> tu tiens la <em>${hit.role}</em> de ${FR[ci.root]}` : p ? `<span>${nameFR(p.midi)}</span>` : (ci ? '<span>Chante!</span>' : '<span>En attente d’un accord de Frog…</span>');
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
          ctx.font = `${target ? 600 : 500} 11px "Atkinson Hyperlegible", sans-serif`;
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
    return () => { stop(); cv.dispose(); kb.dispose(); offPitch(); offCon(); offEsp(); flush(); };
  },
};
