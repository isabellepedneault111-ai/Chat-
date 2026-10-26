// Le relais : quand on n'est pas ensemble, on se lance des sons. Un riff du SV-1, une mélodie fredonnée,
// un mémo du téléphone. L'autre répond PAR-DESSUS (une voix, une guitare, une nappe), écrit dessus,
// ou renvoie un son. La chanson grandit par couches, sans attendre la prochaine session.
import { espace, onEspace, saveEntry, uploadAudio, audioURL } from '../espace.js';
import { audio, out } from '../audio.js';
import { toast, store } from '../ui.js';
import { esc, ago, espaceGate } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { ecrire } from '../ecrire.js';
import { togglePerle } from './coffre.js';
import { vu, fait, marquer } from '../suivi.js';

// Les intentions : ce qu'on aimerait que l'autre en fasse. On peut en choisir plusieurs, et l'écrire.
export const GROUPES = [
  ['La voix', [['chante', 'Chante dessus', 'chante dessus'], ['harmonise', 'Harmonise-moi', 'pose une 2e voix'], ['melodie', 'Trouve la mélodie', 'trouve une mélodie là-dessus']]],
  ['Les mots', [['ecris', 'Écris dessus', 'écris des mots dessus'], ['titre', 'Trouve-lui un titre', 'donne-lui un nom'], ['evoque', 'Dis-moi ce que ça t’évoque', 'dis-moi ce que ça t’évoque']]],
  ['La musique', [['accords', 'Trouve les accords', 'trouve les accords en dessous'], ['rythme', 'Donne-lui un rythme', 'donne-lui un rythme'], ['habille', 'Habille-le de sons', 'habille-le de textures et d’effets'], ['continue', 'Continue-le', 'continue-le, emmène-le ailleurs']]],
  ['La forme', [['refrain', 'Fais-en un refrain', 'vois si c’est un refrain'], ['coupe', 'Garde l’essentiel', 'coupe ce qui est de trop'], ['plus-tard', 'Pour plus tard', 'garde-le pour un autre morceau']]],
  ['Le cœur', [['ecoute', 'Juste écoute', 'écoute, c’est un cadeau'], ['bien', 'Pour te faire du bien', 'c’est pour te faire du bien']]],
];
export const ASKS = GROUPES.flatMap(([, l]) => l);
const askOf = (id) => ASKS.find((a) => a[0] === id);
export const asksOf = (e) => (e.data?.asks?.length ? e.data.asks : e.data?.ask ? [e.data.ask] : []).map(askOf).filter(Boolean);

// Le sélecteur d'intentions, réutilisé partout (relais, ambiances, grimoire).
export function intentions(host, { to = 'l’autre', dark = false } = {}) {
  const chosen = new Set();
  host.innerHTML = `<div class="intents ${dark ? 'dark' : ''}">
      <p class="intents-q">Ton intention pour ${esc(to)} <small>(une ou plusieurs)</small></p>
      ${GROUPES.map(([g, l]) => `<div class="intents-g"><span>${esc(g)}</span><div class="chips small">${l.map(([id, lab]) => `<button type="button" class="chip" data-int="${id}" aria-pressed="false">${esc(lab)}</button>`).join('')}</div></div>`).join('')}
      <label class="field col intents-free"><span>Ou dis-le avec tes mots</span><input class="input" data-int-free maxlength="160" placeholder="Ex. : imagine-le joué très lentement, au petit matin"></label>
    </div>`;
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-int]');
    if (!b) return;
    const id = b.dataset.int;
    if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
    b.classList.toggle('active', chosen.has(id));
    b.setAttribute('aria-pressed', chosen.has(id));
  });
  return { value: () => ({ asks: [...chosen], intent: host.querySelector('[data-int-free]').value.trim() }) };
}
export function intentsHTML(e) {
  const a = asksOf(e);
  return `${a.map((x) => `<span class="rl-ask">${esc(x[1])}</span>`).join('')}${e.data?.intent ? `<span class="rl-intent">« ${esc(e.data.intent)} »</span>` : ''}`;
}
const other = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'Frog';
const items = () => espace.entries.filter((e) => e.data?.relais);
const threadOf = (e) => e.data?.thread || e.id;

// Le son le plus récent que l'autre m'a lancé et auquel je n'ai pas encore répondu (pour l'accueil).
export function relaisPending() {
  if (!espace.connected || !espace.me) return null;
  const byThread = new Map();
  items().forEach((e) => { const t = threadOf(e); const cur = byThread.get(t); if (!cur || e.createdAt > cur.createdAt) byThread.set(t, e); });
  return [...byThread.values()].filter((e) => e.author !== espace.me && Date.now() - e.createdAt < 21 * 864e5).sort((a, b) => b.createdAt - a.createdAt)[0] || null;
}

// Envoie un son dans le relais (utilisé aussi par les Ambiances).
export async function sendSound(blob, { title, asks = [], intent = '', thread, over, pour, align = 0, mood, onProgress } = {}) {
  const meta = await uploadAudio(blob, onProgress);
  const data = { relais: true, ask: asks[0] || '', asks, intent, stage: 0, song: '' };
  if (thread) data.thread = thread;
  if (over) { data.over = over; data.align = Math.round(align * 1000) / 1000; }
  if (mood) data.mood = mood;
  if (pour) data.pour = pour; // de la musique pour des mots
  return saveEntry({ type: 'audio', title: title || `Son de ${espace.me}`, audio: meta, data });
}

// ---------- Lecture par couches ----------
const bufs = new Map();
async function bufferOf(e) {
  if (e._buf) return e._buf;
  if (!bufs.has(e.audio.id)) bufs.set(e.audio.id, audioURL(e.audio).then((u) => fetch(u)).then((r) => r.arrayBuffer()).then((b) => audio().decodeAudioData(b)));
  return bufs.get(e.audio.id);
}
// La pile de sons sous une couche : elle-même, puis ce sur quoi elle a été posée, jusqu'au premier son.
function chainOf(e) {
  const list = [e];
  let cur = e;
  while (cur.data?.over) { const base = espace.entries.find((x) => x.id === cur.data.over); if (!base || list.includes(base)) break; list.push(base); cur = base; }
  return list.reverse(); // du premier son à la dernière couche
}
async function prepare(chain) {
  const bs = await Promise.all(chain.map(bufferOf));
  const starts = [0];
  for (let i = 1; i < chain.length; i++) starts.push(starts[i - 1] + (chain[i].data?.align || 0));
  const min = Math.min(...starts);
  const parts = chain.map((e, i) => ({ buf: bs[i], at: starts[i] - min }));
  return { parts, dur: Math.max(...parts.map((p) => p.at + p.buf.duration)) };
}
// Joue une pile ; t0 en temps audio. Rend une fonction d'arrêt.
function playParts({ parts }, t0) {
  const c = audio();
  const srcs = parts.map(({ buf, at }) => {
    const s = c.createBufferSource();
    s.buffer = buf;
    s.connect(out());
    const when = t0 + at;
    if (when >= c.currentTime) s.start(when); else s.start(c.currentTime, c.currentTime - when);
    return s;
  });
  return () => srcs.forEach((s) => { try { s.stop(); } catch { /* déjà fini */ } });
}

// ---------- Entrée : micro, ou carte son où le SV-1 est branché ----------
async function openInput() {
  const raw = store.get('relaisRaw', false);
  const dev = store.get('relaisDev', '');
  const want = (d) => ({ audio: { deviceId: d ? { exact: d } : undefined, echoCancellation: !raw, noiseSuppression: !raw, autoGainControl: !raw } });
  try { return await navigator.mediaDevices.getUserMedia(want(dev)); } catch (err) { if (dev) return navigator.mediaDevices.getUserMedia(want('')); throw err; }
}

export default {
  id: 'relais',
  mount(el) {
    let rec = null; // enregistrement en cours
    let pending = null; // son enregistré, pas encore envoyé
    let playing = null; // { id, stop }
    let work = null; // { kind: 'write'|'over'|'reply', entry }
    let writer = null;
    let loopTimer = 0;
    let sig = '';
    let picker = null;

    function shell() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: shell }); return; }
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Le relais</p>
            <h1>Lance-lui un son</h1>
            <p class="muted">Pas besoin d’être ensemble. Un riff, une mélodie fredonnée, une nappe au clavier : ${esc(other())} répond <b>par-dessus</b>, écrit dessus, ou te le renvoie. La chanson grandit par couches, entre deux sessions.</p>
          </div>
          <div class="actions"><a class="btn" href="#/ambiances">Partir d’une ambiance →</a></div>
        </div>
        <section class="panel screen rl-launch">
          <div class="rl-work" hidden></div>
          <div class="rl-main">
            <button class="rl-rec" data-r="rec" aria-label="Enregistrer"><span></span></button>
            <div>
              <p class="rl-label"><b>Lancer un son à ${esc(other())}</b><span class="mono rl-time"></span></p>
              <p class="rl-sub">Une touche pour enregistrer, une pour arrêter.</p>
              <div class="rl-more">
                <label class="btn small">Un mémo du téléphone<input type="file" accept="audio/*,video/*" data-r="file" hidden></label>
                <details class="rl-input"><summary>Entrée : ${store.get('relaisRaw', false) ? 'instrument (son brut)' : 'micro'}</summary>
                  <label class="field"><span>Appareil</span><select data-r="dev"><option value="">Par défaut</option></select></label>
                  <label class="check"><input type="checkbox" data-r="raw" ${store.get('relaisRaw', false) ? 'checked' : ''}> Son d’instrument, brut : pour un clavier ou une guitare branchés dans une carte son (sans réduction de bruit ni égaliseur automatique)</label>
                  <p class="muted small">Pour chanter par-dessus : des écouteurs, sinon le micro reprend le son de l’autre.</p>
                </details>
              </div>
            </div>
          </div>
          <div class="rl-review" hidden></div>
        </section>
        <div class="rl-threads"></div>`;
      fillDevices();
      renderThreads(true);
      renderWork();
    }

    async function fillDevices() {
      const sel = el.querySelector('[data-r=dev]');
      if (!sel || !navigator.mediaDevices?.enumerateDevices) return;
      const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default');
      const cur = store.get('relaisDev', '');
      sel.innerHTML = `<option value="">Par défaut</option>${devs.map((d, i) => `<option value="${esc(d.deviceId)}" ${d.deviceId === cur ? 'selected' : ''}>${esc(d.label || `Entrée ${i + 1}`)}</option>`).join('')}`;
    }

    // ---------- Fils ----------
    function renderThreads(force) {
      const host = el.querySelector('.rl-threads');
      if (!host) return;
      const all = items();
      const s = JSON.stringify(all.map((e) => [e.id, e.updatedAt])) + (playing?.id || '') + espace.entries.filter((e) => e.type === 'profil').map((e) => e.updatedAt).join(); // les cases « vu » de l'autre comptent aussi
      if (!force && s === sig) return;
      sig = s;
      const threads = new Map();
      all.forEach((e) => { const t = threadOf(e); if (!threads.has(t)) threads.set(t, []); threads.get(t).push(e); });
      const list = [...threads.values()].map((l) => l.sort((a, b) => a.createdAt - b.createdAt)).sort((a, b) => b[b.length - 1].createdAt - a[a.length - 1].createdAt);
      if (!list.length) {
        host.innerHTML = `<div class="rl-empty"><p class="tape">Le premier son</p><p>Rien encore. Lance n’importe quoi : 10 secondes de clavier, un bout de mélodie sous la douche, un mot dit à voix haute. <b>Imparfait, c’est parfait</b> : c’est l’autre qui le fera grandir.</p></div>`;
        return;
      }
      const focus = location.hash.split('/')[2];
      host.innerHTML = list.map((l) => `
        <section class="rl-thread">
          <p class="rl-thread-k mono">${l.length} ${l.length > 1 ? 'échanges' : 'son'} · ${ago(l[l.length - 1].createdAt)}</p>
          ${l.map((e) => itemHTML(e, e.id === focus)).join('')}
        </section>`).join('');
      if (focus) host.querySelector('.rl-item.focus')?.scrollIntoView({ block: 'center' });
    }
    function itemHTML(e, focus) {
      const base = e.data?.over && espace.entries.find((x) => x.id === e.data.over);
      const layers = e.audio ? chainOf(e).length : 0;
      const isPlaying = playing?.id === e.id;
      const pourMots = e.data?.pour && espace.entries.find((x) => x.id === e.data.pour);
      // « Vu » et « J'ai fait ça » : coché par celui qui reçoit, lu par celui qui a envoyé.
      const o = other(); const asks = asksOf(e).length > 0;
      const suivi = e.author === espace.me
        ? `<p class="rl-suivi">${vu(o, e.id) ? `${esc(o)} l’a vu ✓` : `${esc(o)} ne l’a pas encore vu`}${asks ? (fait(o, e.id) ? ' · <b>l’a fait ✓</b>' : '') : ''}</p>`
        : `<p class="rl-suivi"><label><input type="checkbox" data-suivi="vus" ${vu(espace.me, e.id) ? 'checked' : ''}> Vu</label>${asks ? `<label><input type="checkbox" data-suivi="faits" ${fait(espace.me, e.id) ? 'checked' : ''}> J’ai fait ça</label>` : ''}</p>`;
      return `
        <article class="rl-item ${focus ? 'focus' : ''} ${e.author === espace.me ? 'mine' : ''}" style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}">
          <header><b>${esc(e.author)}</b><span class="mono muted">${ago(e.createdAt)}</span>${intentsHTML(e)}${e.data?.mood ? `<span class="rl-mood">${esc(e.data.mood)}</span>` : ''}</header>
          <h3>${esc(e.title)}</h3>
          ${base ? `<p class="muted small">${e.audio ? 'Posé sur' : 'Écrit sur'} « ${esc(base.title)} » de ${esc(base.author)}</p>` : ''}
          ${pourMots ? `<p class="muted small">En musique, pour les mots « ${esc(pourMots.title)} » de ${esc(pourMots.author)}</p>` : ''}
          ${e.type === 'note' && e.body ? `<blockquote class="rl-words">${esc(e.body).replace(/\n/g, '<br>')}</blockquote>` : ''}
          ${e.audio ? '' : `<div class="rl-acts">
            <button class="btn small" data-r="habille">● De la musique sur ces mots</button>
            <button class="btn small" data-r="write">✎ Répondre en mots</button>
            <button class="btn small ghost" data-r="placer">Placer ces mots sur une pièce</button>
            <button class="btn small ghost ${e.data?.perle ? 'on' : ''}" data-r="perle">${e.data?.perle ? '✦ Dans le coffre' : '✦ Au coffre'}</button></div>`}
          ${suivi}
          ${e.audio ? `<div class="rl-acts">
            <button class="btn small ${isPlaying ? 'on' : ''}" data-r="play">${isPlaying ? '■ Arrêter' : layers > 1 ? `▶ Les ${layers} couches ensemble` : '▶ Écouter'}</button>
            <button class="btn small" data-r="over">● Par-dessus</button>
            <button class="btn small" data-r="write">✎ Écrire dessus</button>
            <button class="btn small ghost" data-r="reply">↩ Renvoyer un son</button>
            <button class="btn small ghost ${e.data?.perle ? 'on' : ''}" data-r="perle">${e.data?.perle ? '✦ Dans le coffre' : '✦ Au coffre'}</button>
          </div>` : ''}
        </article>`;
    }

    // ---------- Atelier : écrire ou enregistrer sur un son ----------
    function stopPlay() { playing?.stop(); playing = null; clearTimeout(loopTimer); }
    async function play(e, { loop = false, onStart } = {}) {
      stopPlay();
      const prep = await prepare(chainOf(e));
      const go = () => {
        const t0 = audio().currentTime + 0.08;
        const stop = playParts(prep, t0);
        playing = { id: e.id, stop };
        onStart?.(t0);
        loopTimer = setTimeout(() => { if (loop && playing?.id === e.id) go(); else if (playing?.id === e.id) { playing = null; renderThreads(true); } }, (prep.dur + 0.1) * 1000);
      };
      go();
      renderThreads(true);
      return prep;
    }

    function renderWork() {
      const box = el.querySelector('.rl-work');
      if (!box) return;
      writer?.dispose(); writer = null;
      box.hidden = !work;
      el.querySelector('.rl-main').hidden = !!work && work.kind !== 'reply' && work.kind !== 'habille';
      if (!work) { box.innerHTML = ''; const lb = el.querySelector('.rl-label b'); if (lb) lb.textContent = `Lancer un son à ${other()}`; return; }
      const e = work.entry;
      const head = `<div class="rl-work-head"><p><small class="mono">${work.kind === 'write' ? (e.audio ? 'Écrire sur' : 'Répondre aux mots') : work.kind === 'over' ? 'Par-dessus' : work.kind === 'habille' ? 'De la musique pour' : 'Répondre à'}</small><b>« ${esc(e.title)} »</b> de ${esc(e.author)}</p><button class="icon-btn tiny" data-r="close" aria-label="Fermer">×</button></div>`;
      if (work.kind === 'write') {
        box.innerHTML = `${head}${e.audio ? '<p class="rl-sub">Le son tourne en boucle pendant que tu écris.</p>' : e.body ? `<blockquote class="rl-words">${esc(e.body).replace(/\n/g, '<br>')}</blockquote>` : ''}<div class="rl-writer"></div><div class="rl-intents"></div>`;
        const wp = intentions(box.querySelector('.rl-intents'), { to: e.author === espace.me ? other() : e.author, dark: true });
        writer = ecrire(box.querySelector('.rl-writer'), {
          saveLabel: `Envoyer à ${e.author === espace.me ? other() : e.author}`,
          title: e.title,
          onSave: async (text) => {
            const v = wp.value();
            await saveEntry({ type: 'note', title: text.split('\n')[0].slice(0, 80), body: text, data: { relais: true, thread: threadOf(e), over: e.id, ask: v.asks[0] || '', ...v, stage: 0, song: '' } });
            toast('Envoyé. Tes mots sont dans le relais.');
            close();
          },
        });
        if (e.audio) play(e, { loop: true });
      } else if (work.kind === 'habille') {
        box.innerHTML = `${head}<p class="rl-sub">Les mots restent sous tes yeux. Joue ce qu’ils t’inspirent (une nappe, des accords, un rythme), puis envoie : ${esc(e.author === espace.me ? other() : e.author)} chantera dessus.</p><blockquote class="rl-words rl-prompteur">${esc(e.body || e.title).replace(/\n/g, '<br>')}</blockquote>`;
      } else if (work.kind === 'over') {
        box.innerHTML = `${head}<p class="rl-sub">Mets des écouteurs. Le son de ${esc(e.author)} part, et tu enregistres par-dessus : ta couche sera calée sur la sienne.</p><button class="btn primary big" data-r="rec">● Enregistrer par-dessus</button>`;
      } else {
        box.innerHTML = `${head}`;
      }
    }
    function close() { stopPlay(); work = null; renderWork(); renderThreads(true); }

    // ---------- Enregistrement ----------
    async function startRec() {
      if (rec) { rec.recorder.stop(); return; }
      let stream;
      try { stream = await openInput(); } catch { toast('Entrée audio refusée. Autorise le micro dans la barre d’adresse.'); return; }
      fillDevices();
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      const base = work?.kind === 'over' ? work.entry : null;
      rec = { recorder, stream, chunks, base, playPerf: 0, recPerf: 0, t: performance.now() };
      recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      recorder.onstart = () => { rec.recPerf = performance.now(); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const c = audio();
        // Latence aller-retour estimée : sortie (casque) + entrée (micro).
        const lat = (c.outputLatency || c.baseLatency || 0.01) + 0.012;
        const align = base ? (rec.recPerf - rec.playPerf) / 1000 - lat : 0;
        const r = rec;
        rec = null;
        clearInterval(r.timer);
        if (base) stopPlay();
        pending = { blob, url: URL.createObjectURL(blob), base, align, thread: work ? threadOf(work.entry) : undefined, pour: work?.kind === 'habille' ? work.entry : undefined };
        el.querySelectorAll('[data-r=rec]').forEach((b) => b.classList.remove('on'));
        renderReview();
      };
      if (base) {
        await play(base, { onStart: (t0) => { rec.playPerf = performance.now() + (t0 - audio().currentTime) * 1000; } });
      }
      recorder.start();
      el.querySelectorAll('[data-r=rec]').forEach((b) => b.classList.add('on'));
      if (base) el.querySelector('.rl-work [data-r=rec]').textContent = '■ Arrêter';
      rec.timer = setInterval(() => {
        const s = Math.floor((performance.now() - rec.t) / 1000);
        const lab = el.querySelector('.rl-time');
        if (lab) lab.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        if (s >= 600) rec.recorder.stop();
      }, 250);
    }

    function renderReview() {
      const box = el.querySelector('.rl-review');
      box.hidden = !pending;
      el.querySelector('.rl-main').hidden = !!pending || (!!work && work.kind !== 'reply' && work.kind !== 'habille');
      el.querySelector('.rl-work').hidden = !!pending || !work;
      if (!pending) { box.innerHTML = ''; return; }
      const ref = pending.base || pending.pour; const to = ref ? (ref.author === espace.me ? other() : ref.author) : other();
      const now = new Date();
      const defTitle = pending.base ? `Ma couche sur « ${pending.base.title} »` : pending.pour ? `Musique pour « ${pending.pour.title} »` : pending.file ? pending.file.replace(/\.[^.]+$/, '') : `${espace.me} · ${now.getHours()} h ${String(now.getMinutes()).padStart(2, '0')}`;
      box.innerHTML = `
        <p class="rl-label"><b>Prêt à partir</b></p>
        <audio controls src="${pending.url}"></audio>
        ${pending.base ? `<div class="rl-align"><button class="btn small" data-r="try">▶ Écouter avec sa couche</button>
          <label><span>Décaler ma couche</span><input type="range" min="-300" max="300" step="5" value="0" data-r="nudge"><b class="mono" data-nudge-v>0 ms</b></label>
          <small>Si ta couche arrive en retard ou en avance, ajuste à l’oreille, puis réécoute.</small></div>` : ''}
        <label class="field"><span>Un titre (facultatif)</span><input class="input" data-r="title" placeholder="${esc(defTitle)}" maxlength="80"></label>
        <div class="rl-intents"></div>
        <div class="rl-send">
          <button class="btn primary big" data-r="send">Envoyer à ${esc(to)} →</button>
          <button class="btn ghost" data-r="redo">Recommencer</button>
        </div>`;
      box.dataset.def = defTitle;
      picker = intentions(box.querySelector('.rl-intents'), { to, dark: true });
    }

    async function send() {
      const box = el.querySelector('.rl-review');
      const btn = box.querySelector('[data-r=send]');
      btn.disabled = true;
      try {
        await sendSound(pending.blob, {
          title: box.querySelector('[data-r=title]').value.trim() || box.dataset.def,
          ...picker.value(), thread: pending.thread, over: pending.base?.id, pour: pending.pour?.id, align: (pending.align || 0) - (pending.nudge || 0),
          onProgress: (p) => { btn.textContent = `Envoi ${Math.round(p * 100)} %`; },
        });
        toast(`Lancé! ${other()} le verra en ouvrant l’app.`);
        URL.revokeObjectURL(pending.url);
        pending = null; work = null;
        renderReview(); renderWork(); renderThreads(true);
      } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = 'Réessayer'; }
    }

    el.addEventListener('click', async (e) => {
      const r = e.target.closest('[data-r]')?.dataset.r;
      if (!r) return;
      const item = e.target.closest('.rl-item');
      const entry = item && espace.entries.find((x) => x.id === item.dataset.id);
      if (r === 'perle' && entry) { await togglePerle(entry); return; }
      if (r === 'rec') startRec();
      if (r === 'send') send();
      if (r === 'redo') { URL.revokeObjectURL(pending.url); const base = pending.base; pending = null; renderReview(); if (base) renderWork(); }
      if (r === 'try' && pending) {
        const fake = { id: 'pending', _buf: await audio().decodeAudioData(await pending.blob.arrayBuffer()), data: { over: pending.base.id, align: pending.align - (pending.nudge || 0) } };
        stopPlay();
        const prep = await prepare(chainOf(fake));
        playing = { id: 'pending', stop: playParts(prep, audio().currentTime + 0.05) };
      }
      if (r === 'close') close();
      if (r === 'play' && entry) {
        if (playing?.id === entry.id) { stopPlay(); renderThreads(true); return; }
        e.target.textContent = 'Chargement…';
        try { await play(entry); } catch { toast('Ce son ne se charge pas.'); renderThreads(true); }
      }
      if (r === 'placer' && entry) { store.set('placerTexte', entry.body || entry.title); location.hash = '#/placer'; return; }
      if ((r === 'over' || r === 'write' || r === 'reply' || r === 'habille') && entry) {
        stopPlay();
        work = { kind: r, entry };
        renderWork();
        el.querySelector('.rl-launch').scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (r === 'reply') el.querySelector('.rl-label b').textContent = `Renvoyer un son à ${entry.author === espace.me ? other() : entry.author}`;
        if (r === 'habille') el.querySelector('.rl-label b').textContent = `Enregistrer ta musique pour ces mots`;
      }
    });
    el.addEventListener('change', async (e) => {
      const sv = e.target.dataset.suivi;
      if (sv) {
        const id = e.target.closest('.rl-item').dataset.id;
        try { await marquer([id], sv, e.target.checked); if (sv === 'faits' && e.target.checked && !vu(espace.me, id)) await marquer([id], 'vus'); toast(sv === 'faits' && e.target.checked ? `${other()} verra que c’est fait.` : 'Noté.'); } catch (err) { toast(err.message); }
        renderThreads(true); return;
      }
      const r = e.target.dataset.r;
      if (r === 'dev') store.set('relaisDev', e.target.value);
      if (r === 'raw') { store.set('relaisRaw', e.target.checked); e.target.closest('details').querySelector('summary').textContent = `Entrée : ${e.target.checked ? 'instrument (son brut)' : 'micro'}`; }
      if (r === 'nudge' && pending) { pending.nudge = +e.target.value / 1000; el.querySelector('[data-nudge-v]').textContent = `${e.target.value} ms`; }
      if (r === 'file' && e.target.files[0]) {
        const f = e.target.files[0];
        pending = { blob: f, url: URL.createObjectURL(f), file: f.name, thread: work?.kind === 'reply' || work?.kind === 'habille' ? threadOf(work.entry) : undefined, pour: work?.kind === 'habille' ? work.entry : undefined };
        renderReview();
      }
    });

    const off = onEspace((what) => { if (what === 'entries') renderThreads(); if (what === 'meta' && !el.querySelector('.rl-launch')) shell(); });
    shell();
    return () => { off(); stopPlay(); writer?.dispose(); if (rec) { rec.recorder.onstop = null; rec.recorder.stop(); rec.stream.getTracks().forEach((t) => t.stop()); clearInterval(rec.timer); } };
  },
};
