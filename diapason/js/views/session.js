// La session guidée : une séance qui alterne exploration, sélection et stabilisation,
// et qui finit toujours par une prise. Le minuteur est partagé entre les deux appareils.
import { avantPrise, arreterMetronome, metroHTML } from '../metronome.js';
import { FLAME } from '../marque.js';
import { depuisHTML } from '../traces.js';
import { exempleHTML, bindExemples } from '../exemples.js';
import { concretHTML, jouerDemo } from '../concret.js';
import { espace, onEspace, saveEntry, uploadAudio, uid, profileOf } from '../espace.js';
import { animate, toast, store } from '../ui.js';
import { audio, click } from '../audio.js';
import { FR, mod12, chordName } from '../music.js';
import { FORMATS, PHASES, EXERCICES, GRILLES, CIBLES, PLAN, memberColor, SOLO_POOLS, consignesDe } from '../duo.js';
import { currentMonth, weekRhythm } from '../plan.js';
import { VERDICTS, objectifSemaine } from '../objectifs.js';
import { setLoop, toggleLoop, loopPlaying, setTempo } from './studio.js';
import { startConsole, consoleState, onConsole, listOutputs, setClockOutput, clockState, setClockOffset } from '../console.js';
import { esc, espaceGate, allSongs } from './carnet.js';
import { keysFor } from './depart.js';
import { pad } from '../audio.js';
import { mtof, chordIntervals } from '../music.js';

const MAX_AGE = 5 * 3600 * 1000;
const pic = (inner) => `<svg viewBox="0 0 120 64" class="lieu-pic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
// Les trois façons d'être en séance, chacune avec son petit dessin.
const LIEUX = [
  ['piece', 'Ensemble, dans la même pièce', 'Un seul écran, en grand. Frog au clavier, Zaza au micro : l’app s’efface.', pic('<rect x="24" y="44" width="72" height="14" rx="2"/><path d="M33 44v8M42 44v8M60 44v8M69 44v8M78 44v8"/><circle cx="44" cy="18" r="7" class="pz"/><path d="M32 38c2-9 22-9 24 0" class="pz"/><circle cx="76" cy="18" r="7" class="pf"/><path d="M64 38c2-9 22-9 24 0" class="pf"/>')],
  ['distance', 'À distance, en même temps', 'Chacun chez soi, en appel. La séance avance pour les deux, à la seconde.', pic('<rect x="4" y="18" width="36" height="26" rx="3"/><path d="M14 50h16"/><rect x="80" y="18" width="36" height="26" rx="3"/><path d="M90 50h16"/><path d="M40 28Q60 2 80 28" stroke-dasharray="3 5" class="pg"/><circle cx="22" cy="31" r="5" class="pz"/><circle cx="98" cy="31" r="5" class="pf"/>')],
  ['solo', 'Seul, pour nous deux', 'Une micro-séance de 25 min. Ce que tu prépares nourrit la prochaine séance à deux.', pic('<circle cx="60" cy="20" r="8" class="pz"/><path d="M47 44c2-11 24-11 26 0" class="pz"/><path d="M50 20a10 10 0 0 1 20 0" /><path d="M84 18l6-4v14" class="pg"/><circle cx="87" cy="29" r="3" class="pg"/>')],
];
// Chaque cible en clair, et la grille qui lui va le mieux.
const CIBLE_INFO = {
  'Un groove': ['un rythme qui tient tout seul, sans paroles. Frog pose la boucle, Zaza cherche où placer sa voix.', 'vamp'],
  'Un refrain': ['la partie qu’on chante fort et qu’on retient : une mélodie et des mots qui reviennent.', 'IIVVI'],
  'Une ambiance': ['une couleur, une texture, un lieu. Pas de structure : on cherche un son.', 'pedale'],
  'Une transition': ['comment on quitte une partie et comment on arrive dans la suivante.', 'iiVI'],
  'Les entrées ensemble': ['commencer et finir pile ensemble : signaux, regards, décomptes.', 'cadence'],
  'Le texte d’un couplet': ['écrire et chanter les mots d’un couplet sur une boucle simple.', 'vamp'],
  'Un son d’effet signature': ['le son qui fera reconnaître FLIP : effets du clavier, couleur de la voix.', 'pedale'],
  'La fin d’un morceau': ['comment on termine : ralenti, coupure nette, dernier accord tenu.', 'cadence'],
};
// La grille faite à la main dans le studio (« Mes propres accords ») passe en tête, à côté des modèles.
const grilles = () => { const c = store.get('customProg', null); return c ? [{ id: 'perso', nom: 'Nos accords (Jouer)', roman: c.roman, chords: c.chords, usage: 'La grille que vous avez faite dans Jouer.', perso: true }, ...GRILLES] : GRILLES; };
const otherOf = () => (espace.meta?.members || ['Zaza', 'Frog']).find((m) => m !== espace.me) || 'l’autre';
const pick = (arr, not) => { const pool = arr.filter((x) => x !== not); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : arr[0]; };

// Temps écoulé « utile » d'une session : sans les pauses, avec les phases sautées.
function elapsed(d, now = Date.now()) {
  const paused = (d.pausedTotal || 0) + (d.pausedAt ? now - d.pausedAt : 0);
  return Math.max(0, (now - d.startedAt - paused) / 1000 + (d.offset || 0));
}
// Où on en est dans une séance : l’étape en cours et le temps écoulé dans cette étape.
function phaseAt(d, now) {
  const f = FORMATS.find((x) => x.id === d.format);
  const t = elapsed(d, now);
  let acc = 0;
  for (let i = 0; i < f.phases.length; i++) {
    const dur = f.phases[i][1] * 60;
    if (t < acc + dur) return { i, left: acc + dur - t, dur, t, total: f.phases.reduce((s, p) => s + p[1] * 60, 0) };
    acc += dur;
  }
  return { i: f.phases.length, left: 0, dur: 0, t, total: acc };
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// La séance en cours (pas finie, lancée il y a moins de quelques heures), s’il y en a une.
export const activeSession = () => espace.entries
  .filter((e) => e.type === 'session' && !e.data?.done && Date.now() - (e.data?.startedAt || 0) < MAX_AGE)
  .sort((a, b) => b.data.startedAt - a.data.startedAt)[0] || null;

export default {
  id: 'session',
  mount(el) {
    let setup = { format: 'duo60', cible: CIBLES[0], song: '', key: 0, grille: 'vamp', lieu: 'piece' };
    // Venue du plan : la séance arrive déjà préparée (cible, grille, format).
    const hp = new URLSearchParams(location.hash.split('?')[1] || '');
    if (hp.get('cible')) { setup.cible = hp.get('cible'); if (CIBLE_INFO[setup.cible]) setup.grille = CIBLE_INFO[setup.cible][1]; }
    if (hp.get('grille') && grilles().some((g) => g.id === hp.get('grille'))) setup.grille = hp.get('grille');
    if (hp.get('format') && FORMATS.some((f) => f.id === hp.get('format'))) setup.format = hp.get('format');
    let lastPhase = -1;
    let lastSig = '';
    let recorder = null;
    let takeStart = 0;
    let stopTick = () => {};

    // ---------- Repères : moments de la séance, horodatés ----------
    // On les envoie par paquets (toutes les 4 s) pour ne pas bombarder le serveur pendant qu'on joue.
    let pending = [];
    let flushT = 0;
    const allMarkers = () => {
      const s = activeSession();
      const seen = new Set();
      return [...(s?.data.markers || []), ...pending].filter((m) => { const k = `${m.at}|${m.text}`; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.at - b.at);
    };
    // Note un repère pendant la séance (« le refrain marche ! »), horodaté, à envoyer avec la prochaine sauvegarde.
    function addMarker(kind, text) {
      const s = activeSession();
      if (!s) return;
      pending.push({ t: Math.round(phaseAt(s.data).t), at: Date.now(), kind, text: String(text).slice(0, 160), by: espace.me });
      renderMarkers();
      clearTimeout(flushT);
      flushT = setTimeout(flush, 4000);
    }
    // Envoie les repères notés à la séance partagée.
    async function flush() {
      if (!pending.length) return;
      const batch = pending;
      try {
        await patch((d) => ({ markers: [...(d.markers || []), ...batch].slice(-400) }));
        pending = pending.filter((m) => !batch.includes(m));
      } catch { flushT = setTimeout(flush, 6000); }
    }
    // Affiche les derniers repères de la séance.
    function renderMarkers() {
      const box = el.querySelector('.markers');
      if (!box) return;
      const list = allMarkers().slice(-8).reverse();
      box.innerHTML = list.map((m) => `<li><span class="mono">${fmt(m.t)}</span> <b style="color:${memberColor(m.by)}">${esc(m.by)}</b> ${esc(m.text)}</li>`).join('') || '<li class="muted small">Les repères de la séance apparaîtront ici : changements de son, tempo, départs du séquenceur, et ceux que vous posez à la main.</li>';
    }

    // ---------- La console MIDI ----------
    function updateConsole() {
      const c = el.querySelector('.console');
      if (!c) return;
      const st = consoleState;
      c.querySelector('.console-devs').textContent = st.on ? (st.devices.join(' · ') || 'aucun appareil détecté') : '';
      c.querySelector('[data-a=midi]').hidden = st.on;
      c.querySelector('.c-bpm').textContent = st.bpm ? Math.round(st.bpm) : '—';
      c.querySelector('[data-a=sync]').hidden = !st.bpm;
      c.querySelector('.c-transport').textContent = st.on ? (st.transport === 'play' ? '▶ en marche' : '■ arrêté') : '—';
      c.querySelector('.c-prog').textContent = st.program ? `prog. ${st.program.num}` : '—';
      c.querySelector('.c-chord').textContent = st.chord || '—';
      // Horloge sortante : la liste des sorties MIDI, et celle qui est choisie.
      const co = c.querySelector('.clock-out');
      co.hidden = !st.on;
      const sel = c.querySelector('[data-clock]');
      const outs = listOutputs();
      const want = `<option value="">personne</option>${outs.map((o) => `<option value="${esc(o.id)}" ${o.name === clockState.target ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}`;
      if (sel.dataset.sig !== want) { sel.innerHTML = want; sel.dataset.sig = want; }
    }
    // Les accords et les boutons tournés deviennent des repères seulement pendant une prise (sinon : trop de bruit).
    const offConsole = onConsole((ev) => {
      updateConsole();
      if (!ev.text || !activeSession()) return;
      if (['tempo', 'transport', 'program', 'device'].includes(ev.kind) || (recorder && ['chord', 'cc'].includes(ev.kind))) addMarker(ev.kind, ev.text);
    });

    // Modifie la séance partagée (de façon sûre : si l’autre l’a changée entre-temps, on repart de sa version).
    async function patch(change) {
      const cur = activeSession();
      if (!cur) return;
      const r = await saveEntry({ ...cur, data: { ...cur.data, ...change(cur.data) } }, { baseUpdatedAt: cur.updatedAt });
      if (r.conflict) await saveEntry({ ...r.current, data: { ...r.current.data, ...change(r.current.data) } }, { baseUpdatedAt: r.current.updatedAt });
    }

    // Dessine la page : le réglage d’une nouvelle séance, ou la séance en cours.
    function render() {
      stopTick();
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const s = activeSession();
      if (s) renderRunning(s); else renderSetup();
    }

    // Le réglage d’une séance : où, combien de temps, sur quoi, sur quels accords.
    function renderSetup() {
      const m = currentMonth();
      const r = weekRhythm();
      const songs = allSongs();
      const chanteuse = (espace.meta.members || ['Zaza'])[0];
      const vx = profileOf(chanteuse)?.voix;
      const conseil = vx ? keysFor(vx.low, vx.high).slice(0, 3) : [];
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Session n° ${r.total + 1}${m ? ` · mois ${m}` : ''}</p>
            <h1>On joue.</h1>
            <p class="muted">${m ? `Ce mois-ci : <b>${esc(PLAN[m - 1].titre)}</b>. ` : ''}Cette semaine : ${r.duo} / 2 sessions duo${objectifSemaine() ? `, et vous visez « ${esc(objectifSemaine())} »` : ''}.</p>
          </div>
        </div>
        ${depuisHTML()}
        <ol class="pas-a-pas">
          <li class="pas">
            <h2><span>1</span> Où êtes-vous?</h2>
            <div class="lieux-row">${LIEUX.map(([id, t, d, pic]) => `<button class="lieu ${setup.lieu === id ? 'on' : ''}" data-lieu="${id}">${pic}<b>${t}</b><small>${d}</small></button>`).join('')}</div>
          </li>
          <li class="pas">
            <h2><span>2</span> Combien de temps?</h2>
            <div class="formats">${FORMATS.filter((f) => (setup.lieu === 'solo') === (f.id === 'solo') || f.id === 'ecoute').map((f) => `
              <button class="format ${setup.format === f.id ? 'on' : ''}" data-f="${f.id}">
                <b>${f.label}</b>
                <span class="format-bar">${f.phases.map(([p, d]) => `<i style="flex:${d}" title="${PHASES[p].titre} · ${d} min"></i>`).join('')}</span>
                <small>${f.phases.map(([p, d]) => `${PHASES[p].titre} ${d}′`).join(' → ')}</small>
              </button>`).join('')}</div>
          </li>
          <li class="pas">
            <h2><span>3</span> Sur quoi on travaille?</h2>
            <p class="pas-aide">Une seule cible par séance : c’est ce qui fait avancer (Biasutti 2017).</p>
            <div class="chips">${CIBLES.map((c) => `<button class="chip ${setup.cible === c ? 'active' : ''}" data-cible="${esc(c)}">${esc(c)}</button>`).join('')}</div>
            ${CIBLE_INFO[setup.cible] ? `<p class="cible-info"><b>${esc(setup.cible)} :</b> ${CIBLE_INFO[setup.cible][0]}</p>` : ''}
            <div class="pas-row">
              <label class="field col"><span>Ou à vos mots</span><input class="input" data-s="cible" maxlength="80" value="${CIBLES.includes(setup.cible) ? '' : esc(setup.cible)}" placeholder="Ex. : trouver l’intro de Fleuve gelé"></label>
              <label class="field col"><span>Pour quel morceau? (facultatif)</span><select data-s="song"><option value="">Idées libres</option>${songs.map((x) => `<option ${x === setup.song ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
            </div>
          </li>
          <li class="pas">
            <h2><span>4</span> Sur quels accords?</h2>
            <p class="pas-aide">La boucle qui jouera pendant la séance. Touche ▶ pour l’entendre avant de choisir.</p>
            <div class="ton">
              <label class="field"><span>Tonalité</span><select data-s="key">${FR.map((n, i) => `<option value="${i}" ${i === setup.key ? 'selected' : ''}>${n} majeur</option>`).join('')}</select></label>
              <p class="ton-aide">La tonalité, c’est la « maison » des accords. <b>Do majeur</b> : les touches blanches, le plus simple au clavier.${conseil.length ? ` D’après la tessiture de ${esc(chanteuse)}, sa voix est à l’aise en ${conseil.map((k) => `<button class="linklike" data-key="${k}">${FR[k]}</button>`).join(', ')}.` : ''}</p>
            </div>
            <div class="grilles">${grilles().map((g) => `<div class="grille ${setup.grille === g.id ? 'on' : ''}" data-g="${g.id}" role="button" tabindex="0">
              <div class="grille-top"><b>${g.nom}</b>${CIBLE_INFO[setup.cible]?.[1] === g.id ? '<em>suggérée pour cette cible</em>' : ''}<button class="icon-btn tiny" data-ecoute="${g.id}" aria-label="Écouter ${esc(g.nom)}">▶</button></div>
              <span class="grille-ch">${g.chords.map(([d, q]) => `<i>${chordName(mod12(setup.key + d), q)}</i>`).join('<span aria-hidden="true">→</span>')}</span><small>${g.usage}</small></div>`).join('')}</div>
            <p class="pas-aide">Envie de vos propres accords? <a href="#/studio">Studio → « Mes propres accords »</a> : votre grille apparaîtra ici en premier.</p>
          </li>
        </ol>
        <div class="launch launch-recap">
          <p class="recap">${esc(LIEUX.find((x) => x[0] === setup.lieu)[1])} · ${esc(FORMATS.find((f) => f.id === setup.format)?.label || '')} · <b>${esc(setup.cible)}</b> · ${FR[setup.key]} majeur · ${esc(grilles().find((g) => g.id === setup.grille)?.nom || '')}</p>
          <button class="btn primary big" data-a="start">● Lancer la session</button>
          <span class="muted small">${setup.lieu === 'solo' ? 'Ce que tu prépares nourrira votre prochaine séance.' : setup.lieu === 'distance' ? `${esc(otherOf())} verra la même séance, au même moment, sur son appareil.` : 'Un seul écran suffit : mets-le en plein écran pendant la séance.'}</span>
        </div>`;
    }

    // La séance en cours : le minuteur, l’étape, la boucle, la console, les repères.
    function renderRunning(s) {
      const d = s.data;
      const f = FORMATS.find((x) => x.id === d.format);
      const g = grilles().find((x) => x.id === d.grille) || GRILLES[0];
      el.innerHTML = `
        <div class="run">
          <header class="run-head">
            <div>
              <p class="eyebrow">${esc(f.label)} · lancée par <b style="color:${memberColor(s.author)}">${esc(s.author)}</b></p>
              <h1 class="run-cible">${esc(d.cible)}</h1>
              ${d.song ? `<p class="muted">Morceau : <b>${esc(d.song)}</b></p>` : ''}
            </div>
            <div class="run-clock screen"><small class="run-now"></small><span class="mono run-left">0:00</span><small class="mono run-total"></small><small class="run-next"></small></div>
          </header>
          <ol class="run-bar">${f.phases.map(([p, dur], i) => `<li style="flex:${dur}" data-i="${i}"><span>${PHASES[p].titre}</span><i></i></li>`).join('')}</ol>
          <div class="run-body"></div>
          <p class="keys muted small"><kbd>espace</kbd> pause · <kbd>→</kbd> phase suivante · <kbd>R</kbd> prise · <kbd>B</kbd> boucle</p>
          <div class="run-controls">
            <button class="btn" data-a="pause">⏸ Pause</button>
            <button class="btn" data-a="skip">Phase suivante ⏭</button>
            <span class="spacer"></span>
            <button class="btn" data-a="loop">▶ Boucle ${esc(g.nom)}</button>
            <button class="btn ghost" data-a="full" title="Plein écran pour l’écran partagé">⛶ Plein écran</button>
            <button class="btn danger" data-a="end">Terminer</button>
          </div>
          <section class="console screen">
            <div class="console-head">
              <b>La console de Frog</b><span class="mono console-devs"></span>
              <button class="btn small" data-a="midi">Brancher le MIDI</button>
            </div>
            <div class="console-grid">
              <div class="c-cell"><small>Tempo</small><b class="c-bpm mono">—</b><button class="btn small" data-a="sync" hidden>Caler la boucle</button></div>
              <div class="c-cell"><small>Séquenceur</small><b class="c-transport">—</b></div>
              <div class="c-cell"><small>Son</small><b class="c-prog">—</b></div>
              <div class="c-cell"><small>Accord</small><b class="c-chord">—</b></div>
            </div>
            <div class="clock-out" hidden>
              <label class="field"><span>Envoyer l’horloge de la boucle à</span><select data-clock><option value="">personne</option></select></label>
              <label class="field"><span>Décalage</span><input type="range" min="-80" max="80" step="1" data-clock-offset value="${clockState.offset}"><b class="mono clock-off">${clockState.offset} ms</b></label>
            </div>
            <form class="marker-form" autocomplete="off"><input class="input" data-m="text" maxlength="160" placeholder="Un repère : « ici la voix décroche »"><button class="btn small" type="submit">⚑ Repère</button></form>
            <ol class="markers"></ol>
          </section>
        </div>`;
      updateConsole();
      renderMarkers();
      lastPhase = -1;
      lastSig = '';
      lastTickT = 0;
      tick();
      stopTick = animate(() => tick());
    }

    let lastTickT = 0;
    let lastMarkerCount = -1;
    // À chaque instant (cinq fois par seconde) : avance le minuteur et passe à l’étape suivante quand son temps est écoulé.
    function tick() {
      const now = performance.now();
      if (now - lastTickT < 200) return;
      lastTickT = now;
      const s = activeSession();
      if (!s || !el.querySelector('.run')) return;
      const d = s.data;
      const ph = phaseAt(d);
      const f = FORMATS.find((x) => x.id === d.format);
      el.querySelector('.run-left').textContent = ph.i < f.phases.length ? fmt(ph.left) : 'fini';
      el.querySelector('.run-total').textContent = `${fmt(ph.t)} / ${fmt(ph.total)}${d.pausedAt ? ' · en pause' : ''}`;
      // Où on est, où on va : toujours lisible d'un coup d'œil.
      const nx = f.phases[ph.i + 1];
      el.querySelector('.run-now').textContent = ph.i < f.phases.length ? `Maintenant : ${PHASES[f.phases[ph.i][0]].titre}` : '';
      el.querySelector('.run-next').textContent = nx ? `Ensuite : ${PHASES[nx[0]].titre} · ${nx[1]} min` : ph.i < f.phases.length ? 'Ensuite : on range la séance' : '';
      el.querySelector('[data-a=pause]').textContent = d.pausedAt ? '▶ Reprendre' : '⏸ Pause';
      el.querySelector('[data-a=loop]').classList.toggle('on', loopPlaying());
      el.querySelectorAll('.run-bar li').forEach((li, i) => {
        li.classList.toggle('done', i < ph.i);
        li.classList.toggle('now', i === ph.i);
        if (i === ph.i) li.querySelector('i').style.width = `${(1 - ph.left / ph.dur) * 100}%`;
      });
      // Des repères posés sur l'autre appareil arrivent : on met la liste à jour.
      if ((d.markers || []).length !== lastMarkerCount) { lastMarkerCount = (d.markers || []).length; renderMarkers(); }
      // On redessine la phase seulement si elle change (sans effacer un debrief en cours de frappe).
      const sig = `${ph.i}|${JSON.stringify(d.ex || {})}|${(d.takes || []).length}`;
      if (sig !== lastSig) {
        if (ph.i !== lastPhase && lastPhase >= 0) {
          click(audio().currentTime, true);
          click(audio().currentTime + 0.18, true);
          navigator.vibrate?.(200);
        }
        lastPhase = ph.i;
        lastSig = sig;
        renderPhase(s, ph.i);
      }
    }

    // Le contenu d’une étape : son but, son exercice (dit à la personne en solo), sa prise, son debrief ; ou la fin de la séance.
    function renderPhase(s, i) {
      const d = s.data;
      const f = FORMATS.find((x) => x.id === d.format);
      const body = el.querySelector('.run-body');
      if (i >= f.phases.length) {
        const mine = d.traces?.[espace.me] || {};
        const mins = Math.round((Date.now() - d.startedAt - (d.pausedTotal || 0)) / 60000);
        body.innerHTML = `<section class="panel phase-card trace-card"><p class="tape red">Fin de la séance</p><h2>Bravo, vous deux.</h2>
          <p class="trace-auto">${mins} min · ${(d.takes || []).length} prise${(d.takes || []).length > 1 ? 's' : ''} · ${allMarkers().length} moment${allMarkers().length > 1 ? 's' : ''} notés${d.debrief?.prochaine ? ` · prochaine cible : « ${esc(d.debrief.prochaine)} »` : ''}</p>
          <div class="trace-form">
            <p class="trace-q">${esc(espace.me)}, le feu de cette séance?</p>
            <div class="feu" role="radiogroup" aria-label="Le feu de la séance">${[1, 2, 3, 4, 5].map((n) => `<button role="radio" aria-checked="${mine.feu === n}" data-feu="${n}" class="${mine.feu >= n ? 'on' : ''}" aria-label="${n} sur 5">${FLAME()}</button>`).join('')}</div>
            ${d.cible ? `<p class="trace-q">La cible « ${esc(d.cible)} », pour toi?</p>
            <div class="ob-v" role="radiogroup" aria-label="La cible de la séance">${VERDICTS.map(([k, t]) => `<button role="radio" aria-checked="${mine.cible === k}" class="${mine.cible === k ? 'on' : ''} v-${k}" data-cible-v="${k}">${t}</button>`).join('')}</div>` : ''}
            <label class="field col"><span>Un mot pour la séance</span><input class="input" data-a-trace="mot" maxlength="40" value="${esc(mine.mot || '')}" placeholder="frissons, laborieux, enfin…"></label>
            ${Object.entries(d.traces || {}).filter(([w]) => w !== espace.me).map(([w, t]) => `<p class="trace-other" style="--c:${memberColor(w)}"><b>${esc(w)}</b> ${'●'.repeat(t.feu || 0)} ${t.cible ? `cible : ${(VERDICTS.find((v) => v[0] === t.cible) || [, ''])[1].toLowerCase()} ` : ''}${t.mot ? `« ${esc(t.mot)} »` : ''}</p>`).join('')}
          </div>
          <p class="muted small">Tout est gardé : le résumé, vos flammes, vos mots, le debrief et les prises. Vous les retrouvez dans « Notre bilan ».</p>
          <button class="btn primary big" data-a="end">Ranger la séance</button></section>`;
        return;
      }
      const [pid] = f.phases[i];
      const P = PHASES[pid];
      const exId = d.ex?.[pid];
      const ex = exId && EXERCICES[exId];
      const g = grilles().find((x) => x.id === d.grille) || GRILLES[0];
      const grid = `<div class="today-grid">${g.chords.map(([dg, q]) => `<span>${chordName(mod12(d.key + dg), q)}</span>`).join('')}</div>`;
      let extra = '';
      if (pid === 'prise' || pid === 'memo') {
        extra = `<div class="take"><button class="btn rec big" data-a="rec">● Enregistrer la prise</button>${metroHTML()}<p class="muted small take-status">${(d.takes || []).length ? `${d.takes.length} prise(s) déjà sur le mur.` : 'Elle part directement sur le mur, rangée avec la session.'}</p></div>`;
      }
      if (pid === 'debrief' || pid === 'tri' || pid === 'memo') {
        const db = d.debrief || {};
        const moments = allMarkers();
        if (moments.length) extra += `<details class="moments" open><summary>Ce qui s’est passé pendant la séance (${moments.length})</summary><ol>${moments.map((m) => `<li><span class="mono">${fmt(m.t)}</span> <b style="color:${memberColor(m.by)}">${esc(m.by)}</b> ${esc(m.text)}</li>`).join('')}</ol></details>`;
        extra += `
          <form class="debrief">
            ${[['intention', 'Ce qu’on voulait'], ['entendu', 'Ce qu’on a entendu'], ['ecart', 'L’écart'], ['prochaine', 'LA prochaine cible']].map(([k, l]) => `<label class="field col"><span>${l}</span><textarea class="input" rows="2" data-db="${k}">${esc(db[k] || '')}</textarea></label>`).join('')}
            <label class="field col wide"><span>Un bravo pour ${esc(otherOf())}</span><input class="input" data-db="bravo" maxlength="300" placeholder="Ce qu’il ou elle a fait de bien aujourd’hui"></label>
            <button class="btn" type="submit">Enregistrer le debrief</button>
          </form>`;
      }
      body.innerHTML = `
        <section class="panel phase-card">
          <p class="tape">${i + 1} / ${f.phases.length} · ${P.titre}</p>
          <h2>${P.but}</h2>
          ${pid === 'checkin' || pid === 'cible' ? `<p class="big-cible">Cible : <b>${esc(d.cible)}</b></p><p class="muted">Tonalité ${FR[d.key]} majeur · ${g.nom}</p>${grid}${depuisHTML()}` : ''}
          ${ex ? `
            <div class="exercise">
              <div class="ex-head"><b>${ex.nom}</b><span class="mono">${ex.duree} min</span><button class="btn small primary" data-exo="${esc(exId)}" data-solo="${d.format === 'solo' ? 1 : ''}">▶ Le faire</button><button class="btn small ghost" data-a="reroll">Autre exercice</button></div>
              <ol>${consignesDe(exId, { solo: d.format === 'solo', moi: espace.me, membres: espace.meta.members || undefined }).map((c) => `<li>${c}</li>`).join('')}</ol>
              ${concretHTML(exId)}
              <cite>${ex.src}</cite>
              ${exempleHTML(exId, ex.nom)}
            </div>
            ${['impro', 'developper', 'echauffement', 'solo'].includes(pid) ? `<p class="muted small">Grille du jour (${FR[d.key]}) :</p>${grid}` : ''}` : ''}
          ${extra}
          <p class="phase-src mono">${P.src}</p>
        </section>`;
    }

    // Lance la séance : choisit un exercice par étape (faisable seul en solo), règle la boucle, et la partage.
    async function start() {
      const custom = el.querySelector('[data-s=cible]')?.value.trim();
      const ex = {};
      const f = FORMATS.find((x) => x.id === setup.format);
      const poolDe = (p) => (setup.format === 'solo' && SOLO_POOLS[p]) || PHASES[p].pool;
      f.phases.forEach(([p]) => { if (PHASES[p].pool.length) ex[p] = pick(poolDe(p)); });
      // Frog seul au piano : son travail ciblé vient du coin piano.
      if (setup.format === 'solo' && espace.me === (espace.meta.members || ['Zaza', 'Frog'])[1]) ex.solo = pick(Object.keys(EXERCICES).filter((k) => k.startsWith('p-')));
      const g = grilles().find((x) => x.id === setup.grille);
      setLoop(setup.key, g);
      try {
        await saveEntry({ id: uid(), type: 'session', title: custom || setup.cible, data: { format: setup.format, lieu: setup.lieu, cible: custom || setup.cible, song: setup.song, key: setup.key, grille: setup.grille, ex, startedAt: Date.now(), pausedTotal: 0, pausedAt: null, offset: 0, takes: [] } });
        render();
      } catch (err) { toast(err.message); }
    }

    // Enregistre une prise pendant la séance : elle part sur le mur, avec les repères tombés pendant qu’elle jouait.
    async function recordTake(btn) {
      if (recorder) { recorder.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop()); arreterMetronome();
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          recorder = null;
          btn.classList.remove('on');
          btn.textContent = 'Envoi…';
          const s = activeSession();
          // Les repères tombés pendant la prise voyagent avec elle, en secondes depuis son début.
          const end = Date.now();
          const markers = allMarkers().filter((m) => m.at >= takeStart && m.at <= end).map((m) => ({ t: Math.round((m.at - takeStart) / 100) / 10, text: m.text, by: m.by, kind: m.kind }));
          addMarker('take', `Prise enregistrée (${fmt((end - takeStart) / 1000)})`);
          try {
            const a = await uploadAudio(blob);
            const id = uid();
            await saveEntry({ id, type: 'audio', title: `Prise · ${s.data.cible}`, audio: a, data: { stage: 1, song: s.data.song || '', session: s.id, markers } });
            await patch((dd) => ({ takes: [...(dd.takes || []), id] }));
            toast('Prise sur le mur.');
          } catch (err) { toast(err.message); }
          btn.textContent = '● Une autre prise';
        };
        await avantPrise();
        recorder.start();
        takeStart = Date.now();
        btn.textContent = '■ Arrêter la prise';
        btn.classList.add('on');
      } catch { toast('Micro refusé. Autorise-le dans la barre d’adresse.'); }
    }

    el.addEventListener('click', async (e) => {
      const demo = e.target.closest('[data-demo]'); if (demo) { jouerDemo(demo.dataset.demo); return; }
      const fb = e.target.closest('[data-f]');
      if (fb) { setup.format = fb.dataset.f; if (fb.dataset.f === 'solo') setup.lieu = 'solo'; else if (setup.lieu === 'solo') setup.lieu = 'piece'; renderSetup(); return; }
      const lb = e.target.closest('[data-lieu]');
      if (lb) { setup.lieu = lb.dataset.lieu; if (setup.lieu === 'solo') setup.format = 'solo'; else if (setup.format === 'solo') setup.format = 'duo60'; renderSetup(); return; }
      const cb = e.target.closest('[data-cible]');
      if (cb) { setup.cible = cb.dataset.cible; if (CIBLE_INFO[setup.cible]) setup.grille = CIBLE_INFO[setup.cible][1]; renderSetup(); return; }
      // Écouter une grille avant de la choisir : les quatre accords, une seconde chacun.
      const ec = e.target.closest('[data-ecoute]');
      if (ec) {
        const g = grilles().find((x) => x.id === ec.dataset.ecoute);
        const t = audio().currentTime + 0.05;
        g.chords.forEach(([dg, q], i) => pad(chordIntervals(q).map((iv) => mtof(48 + mod12(setup.key + dg) + iv)), t + i * 1.1, 1.05, 0.05));
        setup.grille = g.id;
        renderSetup();
        return;
      }
      const kk = e.target.closest('[data-key]');
      if (kk) { setup.key = +kk.dataset.key; renderSetup(); return; }
      const gb = e.target.closest('[data-g]');
      if (gb) { setup.grille = gb.dataset.g; renderSetup(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'start') start();
      if (a === 'pause') await patch((d) => (d.pausedAt ? { pausedTotal: (d.pausedTotal || 0) + Date.now() - d.pausedAt, pausedAt: null } : { pausedAt: Date.now() }));
      if (a === 'skip') { const s = activeSession(); const ph = phaseAt(s.data); await patch((d) => ({ offset: (d.offset || 0) + ph.left + 0.5 })); }
      if (a === 'reroll') {
        const s = activeSession();
        const f = FORMATS.find((x) => x.id === s.data.format);
        const [pid] = f.phases[phaseAt(s.data).i] || [];
        const pool = (s.data.format === 'solo' && SOLO_POOLS[pid]) || PHASES[pid].pool;
        if (pid && pool.length) await patch((d) => ({ ex: { ...d.ex, [pid]: pick(pool, d.ex?.[pid]) } }));
      }
      if (a === 'loop') { toggleLoop(); }
      if (a === 'midi') {
        try { await startConsole(); updateConsole(); toast(consoleState.devices.length ? `Console branchée : ${consoleState.devices.join(', ')}` : 'MIDI autorisé, mais aucun appareil détecté. Branche-le : il apparaîtra tout seul.'); } catch (err) { toast(err.message); }
      }
      if (a === 'sync' && consoleState.bpm) { const b = setTempo(consoleState.bpm); toast(`La boucle suit maintenant ${b} BPM.`); }
      if (a === 'full') { const r = el.querySelector('.run'); if (document.fullscreenElement) document.exitFullscreen(); else r?.requestFullscreen?.(); }
      if (a === 'rec') recordTake(e.target.closest('[data-a]'));
      const xo = e.target.closest('[data-exo]');
      if (xo) import('../exercice.js').then((m) => m.faireExercice(xo.dataset.exo, { garderBoucle: true, solo: !!xo.dataset.solo }));
      const cv = e.target.closest('[data-cible-v]');
      if (cv) {
        cv.parentElement.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b === cv); b.setAttribute('aria-checked', b === cv); });
        await patch((d) => ({ traces: { ...(d.traces || {}), [espace.me]: { ...(d.traces?.[espace.me] || {}), cible: cv.dataset.cibleV } } })).catch(() => {});
        return;
      }
      const feu = e.target.closest('[data-feu]');
      if (feu) {
        const n = +feu.dataset.feu;
        el.querySelectorAll('[data-feu]').forEach((b) => { b.classList.toggle('on', +b.dataset.feu <= n); b.setAttribute('aria-checked', +b.dataset.feu === n); });
        await patch((d) => ({ traces: { ...(d.traces || {}), [espace.me]: { ...(d.traces?.[espace.me] || {}), feu: n } } })).catch(() => {});
        return;
      }
      if (a === 'end' && confirm('Terminer la session?')) {
        const mot = el.querySelector('[data-a-trace=mot]')?.value.trim();
        if (mot) await patch((d) => ({ traces: { ...(d.traces || {}), [espace.me]: { ...(d.traces?.[espace.me] || {}), mot } } })).catch(() => {});
        clearTimeout(flushT);
        await flush();
        await patch(() => ({ done: true, doneAt: Date.now() }));
        if (loopPlaying()) toggleLoop();
        toast('Séance rangée. Voici sa trace.');
        location.hash = '#/bilan/seance';
      }
    });
    el.addEventListener('change', (e) => {
      if (e.target.matches('[data-clock]')) {
        setClockOutput(e.target.value);
        toast(e.target.value ? `${clockState.target} suit maintenant la boucle de Diapason. Mets-le en « MIDI clock : externe ».` : 'Horloge sortante coupée.');
        if (e.target.value) addMarker('clock', `L’horloge de Diapason pilote ${clockState.target}`);
      }
      if (e.target.dataset.s === 'song') setup.song = e.target.value;
      if (e.target.dataset.s === 'key') { setup.key = +e.target.value; renderSetup(); }
    });
    el.addEventListener('input', (e) => {
      if (e.target.matches('[data-clock-offset]')) { setClockOffset(+e.target.value); el.querySelector('.clock-off').textContent = `${clockState.offset} ms`; }
    });
    el.addEventListener('submit', async (e) => {
      if (e.target.classList.contains('marker-form')) {
        e.preventDefault();
        const inp = e.target.querySelector('[data-m=text]');
        addMarker('manual', inp.value.trim() || '⚑ Repère');
        inp.value = '';
        return;
      }
      if (!e.target.classList.contains('debrief')) return;
      e.preventDefault();
      const db = {};
      e.target.querySelectorAll('[data-db]').forEach((t) => { db[t.dataset.db] = t.value.trim(); });
      const bravo = db.bravo;
      delete db.bravo;
      await patch(() => ({ debrief: db })).catch((err) => toast(err.message));
      if (bravo) await saveEntry({ type: 'bravo', title: `Bravo ${otherOf()}!`, body: bravo, data: { to: otherOf() } }).catch(() => {});
      e.target.querySelector('[data-db=bravo]').value = '';
      toast(bravo ? `Debrief enregistré, et bravo envoyé à ${otherOf()}.` : 'Debrief enregistré.');
    });

    // Ensemble dans la même pièce : on pilote au clavier sans viser les boutons.
    const onKey = (e) => {
      if (!el.querySelector('.run') || e.target.closest('input, textarea, select')) return;
      const press = (sel) => { e.preventDefault(); el.querySelector(sel)?.click(); };
      if (e.key === ' ') press('[data-a=pause]');
      if (e.key === 'ArrowRight') press('[data-a=skip]');
      if (e.key.toLowerCase() === 'r') press('[data-a=rec]');
      if (e.key.toLowerCase() === 'b') press('[data-a=loop]');
    };
    window.addEventListener('keydown', onKey);
    bindExemples(el);
    // Une action de l'autre (pause, phase suivante, autre exercice) arrive : on suit.
    const off = onEspace((what) => {
      if (what !== 'entries' && what !== 'meta') return;
      if (el.querySelector('.gate') && espace.connected && espace.me) { render(); return; }
      const s = activeSession();
      const running = !!el.querySelector('.run');
      if (!!s !== running) { render(); return; }
      if (s) { lastTickT = 0; tick(); }
    });
    render();
    return () => { off(); offConsole(); clearTimeout(flushT); flush(); stopTick(); recorder?.stop(); window.removeEventListener('keydown', onKey); };
  },
};
