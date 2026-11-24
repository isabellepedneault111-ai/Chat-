// Le chantier : une chanson qu'on travaille, avant de se voir pour l'enregistrer comme il faut.
// Sur la vraie chanson (la dernière passée dans L'oreille, ou une de nos pièces) :
//  💬 des commentaires écrits ou vocaux, posés à un moment précis (Frog les voit, à la seconde près) ;
//  🥁 une autre batterie, essayée par-dessus pendant que ça joue (un motif d'une ou deux mesures, sur un passage) ;
//  🎹 une ligne de piano dessinée note par note sur une grille, dans la tonalité, avec les accords de la chanson.
// Rien ne touche à l'enregistrement : les idées jouent par-dessus, et on baisse la chanson pour mieux les entendre.
import { audio, out, drums } from '../audio.js';
import { joue, prechargerSons, notePiano } from '../sampler.js';
import { espace, saveEntry, deleteEntry, uploadAudio, audioURL, onEspace } from '../espace.js';
import { store, toast } from '../ui.js';
import { esc } from './carnet.js';
import { lireDerniere } from '../memoire-son.js';
import { lireAccord, dansLaTonalite, lireTon } from './mots.js';
import { fichierMidi } from '../materiel.js';

const NOTES = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14] };
const FUTS = [['kick', 'Grosse caisse', 'Grosse c.'], ['snare', 'Caisse claire', 'Caisse cl.'], ['hat', 'Charleston', 'Charleston'], ['clap', 'Clap', 'Clap']];
const mmss = (t) => `${Math.floor(Math.max(0, t) / 60)}:${String(Math.floor(Math.max(0, t) % 60)).padStart(2, '0')}`;
const nomPropre = (n) => String(n || '').replace(/( \(sans bruit\)| · montée)+$/, '').trim();
const vide16 = (n) => Array(16 * n).fill(0);
const MOTIFS = {
  vide: { nom: 'Vide', f: () => ({}) },
  simple: { nom: 'Simple', f: () => ({ kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] }) },
  demi: { nom: 'Demi-temps', f: () => ({ kick: [0, 10], snare: [8], hat: [0, 4, 8, 12] }) },
  pousse: { nom: 'Ça pousse', f: () => ({ kick: [0, 3, 6, 8, 11], snare: [4, 12], hat: [...Array(16).keys()], clap: [12] }) },
  charley: { nom: 'Juste le charleston', f: () => ({ hat: [0, 2, 4, 6, 8, 10, 12, 14] }) },
};

export default {
  id: 'chantier',
  mount(el) {
    const c = audio(); prechargerSons(['piano', 'rhodes', 'flute']);
    let source = store.get('chantierSource', 'oreille');
    let ch = null; // { buf, nom, debuts, t0, temps, grille, ton }
    let onglet = store.get('chantierOnglet', 'com');
    let vol = store.get('chantierVolume', 0.7);
    let curseur = 0; let lect = null; let raf = 0;
    let idees = null; let cle = ''; let composer = null; // composer : { t, rec, blob, url }
    let toutesNotes = false; let dureeNote = 2;
    let num = null; // la chanson refaite en numérique : { bat, basse, acc, mel } (des évènements, en secondes de la chanson)
    const mix = { orig: true, bat: true, basse: true, acc: true, mel: true, melInst: 'flute', ...store.get('chantierMix', {}) };
    let detail = store.get('chantierDetail', 0.5);

    const pieces = () => (espace.connected ? espace.entries.filter((e) => e.audio && e.data?.piece) : []);
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Jouer · Le chantier</p>
        <h1>Travailler une chanson, avant de se voir.</h1>
        <p class="muted ch-chapeau">💬 Commente un moment précis, 🥁 essaie une autre batterie, 🎹 dessine une ligne de piano, par-dessus la vraie chanson. L’enregistrement reste intact.</p>
      </div></div>
      <label class="field ch-src"><span>La chanson</span><select data-c="source"></select></label>
      <section class="panel ch-frise-p">
        <div class="ch-frise-t"><b class="ch-nom">…</b><span class="muted small ch-info"></span></div>
        <canvas class="ch-frise" role="img" aria-label="La chanson : son onde, ses mesures, les commentaires et les idées. Touche pour t’y rendre."></canvas>
        <div class="ch-mesures" role="group" aria-label="Aller à une mesure : elle part tout de suite"></div>
        <p class="muted small ch-legende"><i class="lg-c"></i> commentaire <i class="lg-b"></i> batterie essayée <i class="lg-p"></i> piano essayé</p>
      </section>
      <div class="ch-onglets" role="tablist" aria-label="Ce que j’ajoute">
        <button role="tab" data-onglet="com">💬 Commentaires</button><button role="tab" data-onglet="bat">🥁 Batterie</button><button role="tab" data-onglet="pia">🎹 Piano</button><button role="tab" data-onglet="num">🎛 Numérique</button>
      </div>
      <section class="panel ch-corps"></section>
      <div class="ch-lecteur">
        <button class="ch-play" data-c="play" aria-label="Écouter">▶</button>
        <span class="ch-pos mono">0:00</span>
        <span class="ch-mes small"></span>
        <label class="ch-vol"><span aria-hidden="true">🔈 chanson</span><input type="range" min="0" max="1" step="0.05" value="${vol}" data-c="vol" aria-label="Le volume de la chanson (baisse-le pour mieux entendre tes idées)"></label>
      </div>`;
    const q = (s) => el.querySelector(s);

    // ---------- La chanson ----------
    function majSources() {
      const s = q('[data-c=source]'); const og = store.get('oreilleGrille', null);
      s.innerHTML = `<option value="oreille">🎧 ${og?.nom ? `« ${esc(nomPropre(og.nom))} », la dernière passée dans L’oreille` : 'La dernière chanson passée dans L’oreille'}</option>${pieces().length ? `<optgroup label="⭐ Nos pièces">${pieces().map((e) => `<option value="piece:${esc(e.id)}">⭐ ${esc(e.title || 'Notre pièce')}</option>`).join('')}</optgroup>` : ''}`;
      if (![...s.options].some((o) => o.value === source)) source = 'oreille'; s.value = source;
    }
    async function charger() {
      arreter(); ch = null; curseur = 0; q('.ch-nom').textContent = 'Je charge la chanson…'; q('.ch-info').textContent = '';
      try {
        if (source === 'oreille') {
          const f = await lireDerniere(); if (!f?.blob) throw new Error('vide');
          const buf = await c.decodeAudioData(await f.blob.arrayBuffer()); const og = store.get('oreilleGrille', null);
          const meme = og && nomPropre(og.nom) === nomPropre(f.nom);
          ch = { buf, nom: nomPropre(f.nom), debuts: f.debuts || (meme ? og.debuts : null), t0: f.t0 || 0, temps: f.temps || 0.5, grille: meme ? og.mesures : null, ton: meme ? og.ton : null, voix: f.voix || null };
        } else {
          const e = pieces().find((x) => `piece:${x.id}` === source); if (!e) throw new Error('vide');
          const u = await audioURL(e.audio); const buf = await c.decodeAudioData(await (await fetch(u)).arrayBuffer()); const p = e.data.piece;
          ch = { buf, nom: nomPropre(e.title), debuts: p.debuts || null, t0: p.t1 || 0, temps: p.temps || 60 / (p.bpm || 90), grille: p.grille || null, voix: p.voix || null, ton: Number.isFinite(p.tonique) ? `${NOTES[((p.tonique % 12) + 12) % 12]} ${p.mineur ? 'mineur' : 'majeur'}` : null };
        }
      } catch { ch = null; }
      if (!ch) { q('.ch-nom').textContent = 'Pas encore de chanson'; q('.ch-info').innerHTML = 'Passe une chanson dans <a href="#/oreille">L’oreille</a> (ou garde-la dans Nos pièces) : elle arrivera ici.'; q('.ch-corps').innerHTML = ''; dessiner(); return; }
      cle = `chanson:${ch.nom}`; pics = null; num = null;
      q('.ch-nom').textContent = `« ${ch.nom} »`;
      q('.ch-info').textContent = `${mmss(ch.buf.duration)} · ${nbMes()} mesures${ch.ton ? ` · ${ch.ton}` : ''}`;
      chargerIdees(); rendreMesures(); rendre();
    }
    // Les mesures : suivies temps par temps par L'oreille quand le tempo bouge, sinon un tempo fixe.
    const nbMes = () => (ch?.debuts?.length > 2 ? ch.debuts.length - 1 : Math.max(1, Math.floor((ch.buf.duration - ch.t0) / (4 * ch.temps))));
    const tMes = (m) => { const d = ch?.debuts; if (d?.length > 2) { const L = d.length - 1; if (m <= L) return d[m]; return d[L] + (m - L) * (d[L] - d[L - 1]); } return ch.t0 + m * 4 * ch.temps; };
    const mesureDe = (t) => { let m = 0; const N = nbMes(); while (m < N && tMes(m + 1) <= t) m++; return m; }; // 0 = la 1re
    // L'accord qui sonne au début de chaque mesure (grille de L'oreille ou de la pièce).
    // L'accord qui sonne au temps b de la mesure m (le dernier écrit avant, en bouclant la grille si la chanson est plus longue).
    // (dans la tonalité de la chanson, comme dans Mots sur la grille : Ré7, Rém7 et Rémaj7 qui hésitent redeviennent Rém en ré mineur)
    const nomAcc = (a) => NOTES[a.r] + ({ M: '', m: 'm', 7: '7', maj7: 'maj7', m7: 'm7', sus2: 'sus2', sus4: 'sus4', dim: '°', add9: 'add9' }[a.q] ?? '');
    const lu = (x) => { if (!x || x === '—') return null; const a0 = lireAccord(x); if (!a0) return null; const a = dansLaTonalite(a0, lireTon(ch?.ton)) || a0; return { ...a, nom: nomAcc(a) }; };
    function accordA(m, b = 0) {
      const g = ch?.grille; if (!g?.length) return null; const M = g.length; const k0 = (m < M ? m : m % M) * 4 + b;
      for (let k = k0; k >= 0; k--) { const a = lu(g[Math.floor(k / 4)]?.[k % 4]); if (a) return a; }
      for (let k = k0 + 1; k < M * 4; k++) { const a = lu(g[Math.floor(k / 4)]?.[k % 4]); if (a) return a; }
      return null;
    }
    const accordDe = (m) => accordA(m, 0);
    // La gamme : la tonalité trouvée, sinon do majeur.
    function gamme() { const m = String(ch?.ton || '').match(/^(\S+)\s+(majeur|mineur)/i); const a = m && lireAccord(m[1]); const r = a ? a.r : 0; const pas = m && /mineur/i.test(m[2]) ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]; return pas.map((x) => (r + x) % 12); }

    // ---------- Les idées (les miennes), gardées dans l'espace (ou sur cet appareil) ----------
    const idIdees = () => { let h = 0; for (const x of `${espace.me}|${cle}`) h = (h * 31 + x.codePointAt(0)) >>> 0; return `chantier-${String(espace.me || 'x').replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}-${h.toString(36)}`; };
    function neuves() { return { batterie: { on: true, de: 1, a: Math.min(8, nbMes()), long: 1, pas: Object.fromEntries(FUTS.map(([k]) => [k, vide16(2)])) }, piano: { on: true, de: 1, n: 2, notes: [] } }; }
    function chargerIdees() {
      const loc = store.get('chantierIdees', {})[cle]; const dist = espace.connected ? espace.entries.find((e) => e.id === idIdees())?.data : null;
      const x = [loc, dist].filter(Boolean).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
      idees = x ? { batterie: { ...neuves().batterie, ...x.batterie }, piano: { ...neuves().piano, ...x.piano } } : neuves();
    }
    let envoi = 0;
    function garderIdees() {
      const at = Date.now(); const d = { kind: 'idees', cle, at, batterie: idees.batterie, piano: idees.piano };
      const tout = store.get('chantierIdees', {}); tout[cle] = d; store.set('chantierIdees', tout);
      if (espace.connected) { clearTimeout(envoi); envoi = setTimeout(() => saveEntry({ id: idIdees(), type: 'chantier', title: `Idées · ${ch.nom}`, data: d }, { force: true }).catch(() => {}), 900); }
      if (lect) rebaser(); dessiner();
    }

    // ---------- Les commentaires ----------
    function commentaires() {
      const loc = store.get('chantierComs', []).filter((x) => x.cle === cle).map((x) => ({ ...x, local: true }));
      const dist = espace.connected ? espace.entries.filter((e) => e.type === 'chantier' && e.data?.kind === 'com' && e.data.cle === cle).map((e) => ({ id: e.id, t: e.data.t, texte: e.data.texte || '', audio: e.audio || null, author: e.author, at: e.createdAt })) : [];
      return [...dist, ...loc].sort((a, b) => a.t - b.t);
    }

    // ---------- L'écoute : la chanson + les idées, planifiées juste avant qu'elles sonnent ----------
    const pos = () => (lect ? lect.off + (c.currentTime - lect.t0c) : curseur);
    function evenements() {
      const ev = []; if (!ch || !idees) return ev; const N = nbMes();
      const B = idees.batterie;
      if (B.on) for (let m = B.de - 1; m <= Math.min(N, B.a) - 1; m++) { const L = tMes(m + 1) - tMes(m); const k = (m - (B.de - 1)) % B.long; FUTS.forEach(([f]) => { for (let s = 0; s < 16; s++) if (B.pas[f]?.[k * 16 + s]) ev.push({ t: tMes(m) + (s * L) / 16, f, v: s % 4 === 0 ? 1 : 0.75 }); }); }
      if (num) {
        // Ton idée de batterie remplace la batterie numérique sur son passage.
        const remplace = B.on && FUTS.some(([f]) => B.pas[f]?.some(Boolean)) ? [tMes(B.de - 1), tMes(Math.min(N, B.a))] : null;
        if (mix.bat) num.bat.forEach((e) => { if (!remplace || e.t < remplace[0] - 0.01 || e.t >= remplace[1] - 0.01) ev.push(e); });
        if (mix.basse) ev.push(...num.basse); if (mix.acc) ev.push(...num.acc); if (mix.mel) ev.push(...num.mel);
      }
      const P = idees.piano;
      if (P.on) P.notes.forEach((n) => { const m = P.de - 1 + Math.floor(n.p / 8); const L = tMes(m + 1) - tMes(m); ev.push({ t: tMes(m) + ((n.p % 8) * L) / 8, f: 'piano', midi: n.m, dur: (n.d * L) / 8 }); });
      return ev.sort((a, b) => a.t - b.t);
    }
    function sonner(e, when) {
      if (e.f === 'piano') { if (!joue('piano', e.midi, { when, dur: e.dur * 0.95, vel: 0.75 })) notePiano(e.midi, { when, dur: e.dur, vel: 0.7 }); return; }
      if (e.f === 'note') { const b = e.b === 'mel' ? mix.melInst : e.b; if (!joue(b, e.midi, { when, dur: e.dur, vel: e.vel })) notePiano(e.midi, { when, dur: e.dur, vel: e.vel * 0.8 }); return; }
      try { drums[e.f]?.(when, e.v); } catch { /* son absent */ }
    }
    function rebaser() { if (!lect) return; lect.evs = evenements(); const p = pos() + 0.3; lect.k = lect.evs.findIndex((e) => e.t >= p); if (lect.k < 0) lect.k = lect.evs.length; }
    function planifier() {
      if (!lect) return; const p = pos();
      if (lect.boucle && p >= lect.boucle.b) { jouer(lect.boucle.a, lect.boucle); return; }
      while (lect.k < lect.evs.length && lect.evs[lect.k].t < p + 0.3) { const e = lect.evs[lect.k++]; const when = lect.t0c + (e.t - lect.off); if (when >= c.currentTime - 0.01) sonner(e, when); }
    }
    function jouer(de, boucle = null) {
      if (!ch) return; arreter(false); try { c.resume(); } catch { /* iOS */ }
      const g = c.createGain(); g.gain.value = mix.orig ? vol : 0; g.connect(out());
      const s = c.createBufferSource(); s.buffer = ch.buf; s.connect(g);
      const off = Math.max(0, Math.min(ch.buf.duration - 0.05, de)); const t0c = c.currentTime + 0.08; s.start(t0c, off);
      lect = { s, g, off, t0c, boucle, evs: [], k: 0 }; rebaser(); lect.k = lect.evs.findIndex((e) => e.t >= off - 0.005); if (lect.k < 0) lect.k = lect.evs.length;
      lect.timer = setInterval(planifier, 40); planifier();
      s.onended = () => { if (lect?.s === s) { curseur = 0; arreter(false); } };
      majPlay(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    }
    function arreter(garder = true) {
      if (lect) { const p = pos(); clearInterval(lect.timer); try { lect.s.onended = null; lect.s.stop(); } catch { /* déjà */ } lect = null; if (garder) curseur = p; }
      cancelAnimationFrame(raf); majPlay(); dessiner(); majPos();
    }
    const majPlay = () => { const b = q('.ch-play'); if (b) { b.textContent = lect ? '■' : '▶'; b.setAttribute('aria-label', lect ? 'Arrêter' : 'Écouter'); } };
    function majPos() { const p = pos(); q('.ch-pos').textContent = mmss(p); if (ch) q('.ch-mes').textContent = `mesure ${mesureDe(p) + 1}`; const ici = q('.ch-ici'); if (ici && ch) ici.textContent = `${mmss(p)} · mesure ${mesureDe(p) + 1}`; }
    function tick() { if (!lect) return; dessiner(); majPos(); allumerMesure(); raf = requestAnimationFrame(tick); }
    const onStop = () => arreter(); addEventListener('diapason:stop', onStop);

    // ---------- Les mesures, à portée de doigt : une touche, et ça part de là ----------
    let mesAllumee = -1;
    function rendreMesures() {
      const box = q('.ch-mesures'); if (!box) return; if (!ch) { box.innerHTML = ''; return; }
      box.innerHTML = [...Array(nbMes())].map((_, m) => { const a = accordDe(m); return `<button class="ch-m" data-mes="${m}" aria-label="Mesure ${m + 1}${a ? `, ${a.nom}` : ''} : écouter à partir d’ici"><b>${m + 1}</b>${a ? `<small>${esc(a.nom)}</small>` : ''}</button>`; }).join('');
      mesAllumee = -1; allumerMesure();
    }
    function allumerMesure() {
      if (!ch) return; const m = mesureDe(pos()); if (m === mesAllumee) return; mesAllumee = m;
      const box = q('.ch-mesures'); box?.querySelectorAll('.ch-m.ici').forEach((b) => b.classList.remove('ici'));
      const b = box?.querySelector(`[data-mes="${m}"]`); if (b) { b.classList.add('ici'); if (lect) box.scrollTo({ left: b.offsetLeft - box.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }
    }

    // ---------- La chanson refaite en numérique ----------
    // Tout part de ce que L'oreille a entendu, mesure par mesure (même quand le tempo bouge) :
    //  la batterie : les coups repérés dans l'enregistrement, en trois bandes (grave = grosse caisse, médium = caisse
    //   claire, aigu = charleston), cherchés sur chaque double croche ; « plus fidèle » en garde davantage ;
    //  la basse : la fondamentale de l'accord, sur les coups de grosse caisse (sinon sur les temps 1 et 3) ;
    //  les accords : au piano électrique, à chaque changement et à chaque mesure ;
    //  la mélodie : les notes de la voix repérées par L'oreille, jouées par un instrument.
    function bandes(buf) {
      const sr = buf.sampleRate; const n = buf.length; const x = new Float32Array(n);
      for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < n; i++) x[i] += d[i] / buf.numberOfChannels; }
      const hop = Math.round(sr / 200); const nF = Math.floor(n / hop); const coef = (fc) => Math.exp((-2 * Math.PI * fc) / sr);
      const a1 = coef(150); const a2 = coef(400); const a3 = coef(3500); const a4 = coef(6000);
      let l1 = 0; let l2 = 0; let l3 = 0; let l4 = 0; const E = [new Float32Array(nF), new Float32Array(nF), new Float32Array(nF)];
      for (let f = 0; f < nF; f++) { let e0 = 0; let e1 = 0; let e2 = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { const v = x[i]; l1 = a1 * l1 + (1 - a1) * v; l2 = a2 * l2 + (1 - a2) * v; l3 = a3 * l3 + (1 - a3) * v; l4 = a4 * l4 + (1 - a4) * v; const bas = l1; const mid = l3 - l2; const haut = v - l4; e0 += bas * bas; e1 += mid * mid; e2 += haut * haut; } E[0][f] = Math.log(1e-9 + e0); E[1][f] = Math.log(1e-9 + e1); E[2][f] = Math.log(1e-9 + e2); }
      return E.map((e) => { const o = new Float32Array(nF); for (let f = 3; f < nF; f++) o[f] = Math.max(0, e[f] - Math.max(e[f - 2], e[f - 3])); return o; });
    }
    function refaire() {
      if (!ch) return; const O = bandes(ch.buf); const N = nbMes(); const futs = ['kick', 'snare', 'hat'];
      const pas = []; for (let m = 0; m < N; m++) { const L = tMes(m + 1) - tMes(m); for (let s = 0; s < 16; s++) pas.push({ m, s, t: tMes(m) + (s * L) / 16 }); }
      const val = (o, t) => { const f = Math.round(t * 200); let v = 0; for (let k = f - 3; k <= f + 3; k++) v = Math.max(v, o[k] || 0); return v; };
      const bat = [];
      futs.forEach((f, b) => {
        const v = pas.map((p) => val(O[b], p.t)); const tri = [...v].sort((x, y) => x - y); const p90 = tri[Math.floor(tri.length * 0.9)] || 1;
        const seuil = (f === 'hat' ? 1.0 : 1.15) - 0.75 * detail; // plus fidèle = un seuil plus bas
        pas.forEach((p, i) => { const r = v[i] / p90; if (r > seuil && (f !== 'hat' || p.s % 2 === 0 || detail > 0.6)) bat.push({ t: p.t, f, v: Math.min(1, 0.45 + 0.4 * r), m: p.m, s: p.s }); });
      });
      bat.sort((x, y) => x.t - y.t);
      const basse = []; const acc = [];
      for (let m = 0; m < N; m++) {
        const L = tMes(m + 1) - tMes(m); const kicks = bat.filter((e) => e.m === m && e.f === 'kick').map((e) => e.s);
        const coups = kicks.length ? kicks : [0, 8];
        coups.forEach((s, i) => { const a = accordA(m, Math.floor(s / 4)); if (!a) return; let r = 36 + a.r; if (r > 45) r -= 12; const fin = coups[i + 1] ?? 16; basse.push({ t: tMes(m) + (s * L) / 16, f: 'note', b: 'piano', midi: r, dur: ((fin - s) * L) / 16 * 0.9, vel: 0.8 }); });
        let avant = m ? accordA(m - 1, 3) : null;
        for (let b = 0; b < 4; b++) {
          const a = accordA(m, b); if (!a) continue; const change = !avant || avant.r !== a.r || avant.q !== a.q; avant = a;
          if (!change && b) continue; let fin = b + 1; while (fin < 4) { const z = accordA(m, fin); if (!z || z.r !== a.r || z.q !== a.q) break; fin++; }
          (IV[a.q] || IV.M).map((v) => { let n = 48 + a.r + v; while (n < 55) n += 12; while (n > 70) n -= 12; return n; }).forEach((n) => acc.push({ t: tMes(m) + (b * L) / 4, f: 'note', b: 'rhodes', midi: n, dur: ((fin - b) * L) / 4 * 0.95, vel: 0.5 }));
        }
      }
      const mel = (ch.voix || []).filter((x) => Array.isArray(x) && x[2]).map(([t, d, m]) => ({ t, f: 'note', b: 'mel', midi: m < 60 && mix.melInst === 'flute' ? m + 12 : m, dur: Math.max(0.12, d), vel: 0.7 }));
      num = { bat, basse, acc, mel }; if (lect) rebaser(); dessiner();
    }
    // Le fichier MIDI : à ouvrir dans le logiciel de Frog, posé sous l'enregistrement (le temps 0 = le début du son).
    function midiNumerique() {
      if (!num) return null; const bpm = Math.round(60 / ((tMes(nbMes()) - tMes(0)) / (4 * nbMes())));
      const GM = { kick: 36, snare: 38, hat: 42, clap: 39 }; const ev = [{ t: 0, d: [0xc0, 33] }, { t: 0, d: [0xc1, 4] }, { t: 0, d: [0xc2, { flute: 73, piano: 0, clarinette: 71, cordes: 48 }[mix.melInst] ?? 73] }];
      const note = (canal, n, t, dur, vel) => { ev.push({ t, d: [0x90 | canal, n, Math.max(1, Math.round(vel * 110))] }, { t: t + dur, d: [0x80 | canal, n, 0], off: true }); };
      num.bat.forEach((e) => note(9, GM[e.f], e.t, 0.1, e.v)); num.basse.forEach((e) => note(0, e.midi, e.t, e.dur, e.vel)); num.acc.forEach((e) => note(1, e.midi, e.t, e.dur, e.vel)); num.mel.forEach((e) => note(2, e.midi, e.t, e.dur, e.vel));
      ev.sort((a, b) => a.t - b.t || (b.off ? 1 : 0) - (a.off ? 1 : 0));
      return fichierMidi(ev.map((e) => ({ t: e.t, d: e.d })), bpm); // les temps restent en secondes : le fichier les place au tempo écrit
    }

    // ---------- La frise ----------
    let pics = null;
    function dessiner() {
      const cv = q('.ch-frise'); if (!cv) return; const W = Math.max(280, cv.clientWidth || 600); const H = 96; const dpr = devicePixelRatio || 1;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = H * dpr; pics = null; }
      const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      x.fillStyle = '#1d1a15'; x.fillRect(0, 0, W, H); if (!ch) return;
      const D = ch.buf.duration; const X = (t) => (t / D) * W;
      if (!pics) { const d = ch.buf.getChannelData(0); const n = Math.floor(d.length / W); pics = new Float32Array(W); for (let i = 0; i < W; i++) { let m = 0; for (let j = i * n; j < (i + 1) * n; j += 16) m = Math.max(m, Math.abs(d[j])); pics[i] = m; } const mx = Math.max(...pics) || 1; for (let i = 0; i < W; i++) pics[i] /= mx; }
      // les idées : des bandes
      const B = idees?.batterie; const P = idees?.piano;
      if (B?.on && B.pas && FUTS.some(([f]) => B.pas[f]?.some(Boolean))) { x.fillStyle = 'rgba(217, 58, 36, .45)'; x.fillRect(X(tMes(B.de - 1)), 0, X(tMes(B.a)) - X(tMes(B.de - 1)), 10); }
      if (P?.on && P.notes.length) { x.fillStyle = 'rgba(86, 156, 230, .6)'; x.fillRect(X(tMes(P.de - 1)), 12, X(tMes(P.de - 1 + P.n)) - X(tMes(P.de - 1)), 8); }
      // l'onde
      x.fillStyle = '#c9b78f'; for (let i = 0; i < W; i++) { const h = pics[i] * (H - 40) / 2; x.fillRect(i, 58 - h, 1, Math.max(1, h * 2)); }
      // les mesures (un trait toutes les mesures, un numéro toutes les 8)
      const N = nbMes(); x.font = '10px system-ui, sans-serif'; x.textBaseline = 'bottom';
      for (let m = 0; m <= N; m++) { const px = X(tMes(m)); if (px < 0 || px > W) continue; x.fillStyle = m % 4 ? 'rgba(251, 231, 161, .12)' : 'rgba(251, 231, 161, .35)'; x.fillRect(px, 24, 1, H - 24); if (m % 8 === 0) { x.fillStyle = '#fbe7a1'; x.fillText(String(m + 1), px + 2, H - 1); } }
      // les commentaires
      commentaires().forEach((k) => { const px = X(k.t); x.fillStyle = '#f6d66b'; x.beginPath(); x.arc(px, 30, 5, 0, 2 * Math.PI); x.fill(); x.fillRect(px - 0.5, 30, 1, H - 30); });
      // la tête de lecture
      x.fillStyle = '#ff6b4a'; x.fillRect(X(pos()) - 1, 0, 2, H);
    }
    let glisse = false;
    const versT = (e) => { const r = q('.ch-frise').getBoundingClientRect(); return Math.max(0, Math.min(ch.buf.duration, ((e.clientX - r.left) / r.width) * ch.buf.duration)); };
    q('.ch-frise').addEventListener('pointerdown', (e) => { if (!ch) return; glisse = true; try { e.target.setPointerCapture?.(e.pointerId); } catch { /* pas de pointeur actif */ } curseur = tMes(mesureDe(versT(e))); jouer(curseur); });
    q('.ch-frise').addEventListener('pointerup', () => { glisse = false; });

    // ---------- Les onglets ----------
    function rendre() {
      el.querySelectorAll('[data-onglet]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.onglet === onglet)));
      const box = q('.ch-corps'); if (!ch) { box.innerHTML = ''; return; }
      if (onglet === 'com') rendreComs(); else if (onglet === 'bat') rendreBat(); else if (onglet === 'num') rendreNum(); else rendrePiano();
      dessiner(); majPos();
    }
    function rendreComs() {
      const L = commentaires();
      q('.ch-corps').innerHTML = `
        ${composer ? `<div class="ch-compose">
          <p><b>💬 À ${mmss(composer.t)} · mesure ${mesureDe(composer.t) + 1}</b> <button class="btn small" data-c="reecouter">▶ Réécouter ce moment</button></p>
          <textarea class="input" data-c="texte" rows="3" placeholder="Ex. : ici, je verrais le piano monter ; la batterie pourrait s’arrêter deux temps…">${esc(composer.texte || '')}</textarea>
          <div class="ec-row">${espace.connected ? `<button class="btn ${composer.rec ? 'primary' : ''}" data-c="vocal">${composer.rec ? '■ Arrêter le vocal' : composer.blob ? '🎙 Refaire le vocal' : '🎙 Dire mon commentaire'}</button>${composer.url ? `<audio controls src="${composer.url}"></audio>` : ''}` : '<span class="muted small">Le vocal part dans votre espace : connecte-toi pour en laisser un à Frog.</span>'}</div>
          <div class="ec-row"><button class="btn primary" data-c="garder-com">Garder le commentaire</button><button class="btn" data-c="annuler-com">Annuler</button></div>
        </div>` : `<button class="btn primary ch-commenter" data-c="commenter">💬 Commenter ici · <span class="ch-ici">${mmss(pos())} · mesure ${mesureDe(pos()) + 1}</span></button>
        <p class="muted small">Écoute (▶ en bas) ou touche la frise, puis « Commenter ici » : le commentaire se pose à ce moment-là. Écrit ou au micro.</p>`}
        <ol class="ch-coms">${L.length ? L.map((k) => `<li class="ch-com">
          <button class="ch-com-t mono" data-t="${k.t}" aria-label="Écouter à partir de ${mmss(k.t)}">${mmss(k.t)}<small>m. ${mesureDe(k.t) + 1}</small></button>
          <div class="ch-com-c"><span class="ch-qui">${esc(k.author || espace.me || 'moi')}</span>${k.texte ? `<p>${esc(k.texte)}</p>` : ''}${k.audio ? `<button class="btn small" data-vocal="${esc(k.id)}">▶ Le vocal</button>` : ''}</div>
          ${(k.local || k.author === espace.me) ? `<button class="ch-com-x" data-effacer="${esc(k.id)}" data-local="${k.local ? 1 : ''}" aria-label="Effacer ce commentaire">✕</button>` : ''}</li>`).join('') : '<li class="muted">Pas encore de commentaire sur cette chanson.</li>'}</ol>`;
    }
    function grilleBat() {
      const B = idees.batterie;
      return `<div class="ch-bat" style="--n:${16 * B.long}">${FUTS.map(([f, nom, court]) => `<div class="ch-bat-r"><span class="ch-bat-n" title="${nom}">${court}</span>${[...Array(16 * B.long)].map((_, s) => `<button class="ch-pas ${B.pas[f]?.[s] ? 'on' : ''} ${s % 4 === 0 ? 'tps' : ''} ${s % 16 === 0 && s ? 'mes' : ''}" data-pas="${f}:${s}" aria-label="${nom}, mesure ${Math.floor(s / 16) + 1}, temps ${Math.floor((s % 16) / 4) + 1}${s % 4 ? ` et ${s % 4}/4` : ''}" aria-pressed="${!!B.pas[f]?.[s]}"></button>`).join('')}</div>`).join('')}</div>`;
    }
    function rendreBat() {
      const B = idees.batterie; const N = nbMes();
      q('.ch-corps').innerHTML = `
        <label class="ch-on"><input type="checkbox" data-c="bat-on" ${B.on ? 'checked' : ''}> J’entends mon idée de batterie par-dessus</label>
        <div class="ch-passage">
          <label>De la mesure <input type="number" min="1" max="${N}" value="${B.de}" data-c="bat-de" inputmode="numeric"></label>
          <label>à la mesure <input type="number" min="1" max="${N}" value="${B.a}" data-c="bat-a" inputmode="numeric"></label>
          <button class="btn small" data-c="bat-ici">⤓ Commencer ici (mesure ${mesureDe(pos()) + 1})</button>
        </div>
        <div class="ch-row"><span>Le motif :</span><button class="btn small ${B.long === 1 ? 'primary' : ''}" data-long="1">1 mesure</button><button class="btn small ${B.long === 2 ? 'primary' : ''}" data-long="2">2 mesures</button>
          <span class="ch-sep">Partir de :</span>${Object.entries(MOTIFS).map(([k, m]) => `<button class="btn small" data-motif="${k}">${m.nom}</button>`).join('')}</div>
        <div class="ch-defile">${grilleBat()}</div>
        <p class="muted small">Touche une case pour ajouter un coup (tu l’entends tout de suite). Le motif se répète sur tout le passage. La batterie de l’enregistrement reste là : baisse « la chanson » en bas pour mieux entendre la tienne.</p>
        <div class="ec-row"><button class="btn primary" data-c="ecouter-bat">▶ Écouter le passage avec mon idée</button><button class="btn" data-c="boucle-bat">🔁 En boucle</button></div>`;
    }
    function rendrePiano() {
      const P = idees.piano; const N = nbMes(); const G = gamme();
      const lignes = []; for (let m = 72; m >= 48; m--) if (toutesNotes || G.includes(m % 12)) lignes.push(m);
      const acc = [...Array(P.n)].map((_, k) => accordDe(P.de - 1 + k));
      const tons = acc.map((a) => (a ? (IV[a.q] || IV.M).map((v) => (a.r + v) % 12) : []));
      const cases = 8 * P.n;
      const occupe = new Map(); P.notes.forEach((n, i) => { for (let s = n.p; s < n.p + n.d; s++) occupe.set(`${n.m}:${s}`, s === n.p ? i : -1); });
      q('.ch-corps').innerHTML = `
        <label class="ch-on"><input type="checkbox" data-c="pia-on" ${P.on ? 'checked' : ''}> J’entends ma ligne de piano par-dessus</label>
        <div class="ch-passage">
          <label>À partir de la mesure <input type="number" min="1" max="${N}" value="${P.de}" data-c="pia-de" inputmode="numeric"></label>
          <span>sur</span><button class="btn small ${P.n === 2 ? 'primary' : ''}" data-n="2">2 mesures</button><button class="btn small ${P.n === 4 ? 'primary' : ''}" data-n="4">4 mesures</button>
          <button class="btn small" data-c="pia-ici">⤓ Ici (mesure ${mesureDe(pos()) + 1})</button>
        </div>
        <div class="ch-row"><span>Une note dure :</span>${[[1, 'une croche'], [2, 'un temps'], [4, 'deux temps'], [8, 'une mesure']].map(([d, l]) => `<button class="btn small ${dureeNote === d ? 'primary' : ''}" data-duree="${d}">${l}</button>`).join('')}</div>
        <div class="ch-row"><span>Ou partir de :</span><button class="btn small" data-gen="monte">↗ Une ligne qui monte</button><button class="btn small" data-gen="descend">↘ Qui descend</button><button class="btn small" data-gen="vide">Effacer</button>
          <label class="ch-toutes"><input type="checkbox" data-c="toutes" ${toutesNotes ? 'checked' : ''}> toutes les notes (pas seulement la gamme${ch.ton ? ` de ${esc(ch.ton)}` : ''})</label></div>
        <div class="ch-defile"><div class="ch-roll" style="--n:${cases}">
          <div class="ch-roll-r ch-roll-acc"><span class="ch-roll-n"></span>${acc.map((a) => `<span class="ch-roll-a" style="grid-column: span 8">${a ? `★ ${esc(a.nom)}` : ''}</span>`).join('')}</div>
          ${lignes.map((m) => `<div class="ch-roll-r ${m % 12 === 0 ? 'do' : ''}"><span class="ch-roll-n">${NOTES[m % 12]}${Math.floor(m / 12) - 1}</span>${[...Array(cases)].map((_, s) => { const o = occupe.get(`${m}:${s}`); const ton = tons[Math.floor(s / 8)]?.includes(m % 12); return `<button class="ch-cel ${o != null ? (o >= 0 ? 'note' : 'suite') : ''} ${ton ? 'ton' : ''} ${s % 2 === 0 ? 'tps' : ''} ${s % 8 === 0 && s ? 'mes' : ''}" data-cel="${m}:${s}" aria-label="${NOTES[m % 12]}${Math.floor(m / 12) - 1}, mesure ${P.de + Math.floor(s / 8)}, ${s % 2 ? 'et' : `temps ${Math.floor((s % 8) / 2) + 1}`}" aria-pressed="${o != null}"></button>`; }).join('')}</div>`).join('')}
        </div></div>
        <p class="muted small">Touche une case pour poser une note (tu l’entends), retouche-la pour l’enlever. Les cases dorées sont les notes de l’accord qui joue : elles sonnent toujours bien. Les colonnes, ce sont des croches.</p>
        <div class="ec-row"><button class="btn primary" data-c="ecouter-pia">▶ Écouter le passage avec ma ligne</button><button class="btn" data-c="boucle-pia">🔁 En boucle</button></div>`;
    }
    function rendreNum() {
      const aVoix = !!ch.voix?.length; const aGrille = !!ch.grille?.length;
      const bouton = (k, ico, nom, sous) => `<button class="ch-piste ${mix[k] ? 'on' : ''}" data-mix="${k}" aria-pressed="${mix[k]}"><span>${ico}</span><b>${nom}</b><small>${sous}</small></button>`;
      q('.ch-corps').innerHTML = `
        <p>Une copie numérique de la chanson, refaite avec ce que L’oreille a entendu : ${aGrille ? 'ses accords' : '<i>pas d’accords trouvés</i>'}, sa batterie (les coups repérés dans l’enregistrement)${aVoix ? ', la mélodie de ta voix' : ''}. Elle suit les mesures de la chanson, même quand le tempo bouge.</p>
        ${num ? `<p class="ch-fait">✓ Refaite : ${num.bat.length} coups de batterie, ${num.basse.length} notes de basse, ${num.acc.length ? `${new Set(num.acc.map((e) => e.t)).size} accords` : 'pas d’accords'}${num.mel.length ? `, ${num.mel.length} notes de mélodie` : ''}.</p>` : ''}
        <div class="ec-row"><button class="btn ${num ? '' : 'primary'}" data-c="refaire">🎛 ${num ? 'Refaire' : 'Refaire la chanson en numérique'}</button></div>
        ${num ? `
        <p class="ch-lab">Ce qui joue (touche pour allumer ou éteindre) :</p>
        <div class="ch-pistes">
          ${bouton('orig', '🎧', 'L’enregistrement', 'le vrai son')}
          ${bouton('bat', '🥁', 'Batterie', 'numérique')}
          ${bouton('basse', '🎸', 'Basse', 'sur la grosse caisse')}
          ${bouton('acc', '🎹', 'Accords', 'piano électrique')}
          ${aVoix ? bouton('mel', '🎶', 'Mélodie', 'ta voix, rejouée') : ''}
        </div>
        ${aVoix ? `<label class="ch-inst"><span>La mélodie jouée par</span><select data-c="melinst">${[['flute', 'la flûte'], ['clarinette', 'la clarinette'], ['piano', 'le piano'], ['cordes', 'les cordes']].map(([k, l]) => `<option value="${k}" ${mix.melInst === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        <div class="ch-detail"><b>La batterie numérique</b><div><span>plus simple</span><input type="range" min="0" max="1" step="0.05" value="${detail}" data-c="detail" aria-label="La batterie numérique : plus simple ou plus fidèle"><span>plus fidèle</span></div></div>
        <div class="ec-row"><button class="btn primary" data-c="num-seul">▶ Seulement le numérique</button><button class="btn" data-c="num-ens">▶ Les deux ensemble</button><button class="btn" data-c="midi">⬇ En MIDI (pour Frog)</button></div>
        <p class="muted small">Un toucher sur une mesure (en haut) fait partir la chanson de là. Ton idée de batterie (🥁) remplace la batterie numérique sur son passage ; ta ligne de piano (🎹) s’ajoute. Le MIDI s’ouvre dans un logiciel de musique, posé sous l’enregistrement : 4 pistes (basse, accords, mélodie, batterie).</p>` : `<p class="muted small">Ça prend quelques secondes. Rien ne touche à l’enregistrement.</p>`}`;
    }
    // Une ligne qui monte (ou descend) : les notes de chaque accord, un temps chacune, toujours plus haut.
    function generer(sens) {
      const P = idees.piano; if (sens === 'vide') { P.notes = []; garderIdees(); rendre(); return; }
      const G = gamme(); const notes = []; let der = sens === 'monte' ? 52 : 74;
      for (let k = 0; k < P.n; k++) {
        const a = accordDe(P.de - 1 + k); const pcs = a ? (IV[a.q] || IV.M).map((v) => (a.r + v) % 12) : G;
        for (let b = 0; b < 4; b++) {
          let m = der + (sens === 'monte' ? 1 : -1); while (!pcs.includes(((m % 12) + 12) % 12) && m > 40 && m < 84) m += sens === 'monte' ? 1 : -1;
          if (m > 72) m -= 12; if (m < 48) m += 12; notes.push({ p: k * 8 + b * 2, m, d: 2 }); der = m;
        }
      }
      P.notes = notes; garderIdees(); rendre();
    }
    function passage(type) { const x = type === 'bat' ? idees.batterie : idees.piano; const de = x.de - 1; const fin = type === 'bat' ? x.a : x.de - 1 + x.n; return { a: Math.max(0, tMes(Math.max(0, de - 1))), b: tMes(fin) }; }

    // ---------- Le vocal ----------
    async function vocal() {
      if (composer.rec) { composer.rec.stop(); return; }
      try {
        arreter(); const flux = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(flux); const bouts = [];
        r.ondataavailable = (e) => { if (e.data.size) bouts.push(e.data); };
        r.onstop = () => { flux.getTracks().forEach((t) => t.stop()); composer.rec = null; composer.blob = new Blob(bouts, { type: r.mimeType || 'audio/mp4' }); composer.url = URL.createObjectURL(composer.blob); rendre(); };
        r.start(); composer.rec = r; rendre();
        setTimeout(() => { if (composer?.rec === r) r.stop(); }, 90000); // 1 min 30 au plus
      } catch { toast('Le micro est refusé : autorise-le dans les réglages du navigateur.'); }
    }

    // ---------- Les gestes ----------
    el.addEventListener('click', async (e) => {
      const og = e.target.closest('[data-onglet]'); if (og) { onglet = og.dataset.onglet; store.set('chantierOnglet', onglet); rendre(); return; }
      const t = e.target.closest('[data-t]'); if (t && ch) { jouer(Math.max(0, +t.dataset.t - 1.5)); return; }
      const pas = e.target.closest('[data-pas]');
      if (pas) { const [f, s] = pas.dataset.pas.split(':'); const B = idees.batterie; B.pas[f] = B.pas[f] || vide16(2); B.pas[f][+s] = B.pas[f][+s] ? 0 : 1; if (B.pas[f][+s]) sonner({ f, v: 1 }, c.currentTime + 0.01); pas.classList.toggle('on', !!B.pas[f][+s]); pas.setAttribute('aria-pressed', String(!!B.pas[f][+s])); garderIdees(); return; }
      const cel = e.target.closest('[data-cel]');
      if (cel) {
        const [m, s] = cel.dataset.cel.split(':').map(Number); const P = idees.piano;
        const i = P.notes.findIndex((n) => n.m === m && s >= n.p && s < n.p + n.d);
        if (i >= 0) P.notes.splice(i, 1); else { const d = Math.min(dureeNote, 8 * P.n - s); P.notes = P.notes.filter((n) => !(n.m === m && n.p < s + d && n.p + n.d > s)); P.notes.push({ p: s, m, d }); sonner({ f: 'piano', midi: m, dur: 0.5 }, c.currentTime + 0.01); }
        garderIdees(); rendre(); return;
      }
      const ms = e.target.closest('[data-mes]'); if (ms && ch) { curseur = tMes(+ms.dataset.mes); jouer(curseur); return; }
      const mx = e.target.closest('[data-mix]');
      if (mx) { const k = mx.dataset.mix; mix[k] = !mix[k]; store.set('chantierMix', mix); if (k === 'orig' && lect) lect.g.gain.setTargetAtTime(mix.orig ? vol : 0, c.currentTime, 0.03); else if (lect) rebaser(); rendre(); return; }
      const lg = e.target.closest('[data-long]'); if (lg) { idees.batterie.long = +lg.dataset.long; garderIdees(); rendre(); return; }
      const mo = e.target.closest('[data-motif]');
      if (mo) { const B = idees.batterie; const p = MOTIFS[mo.dataset.motif].f(); FUTS.forEach(([f]) => { B.pas[f] = vide16(2); (p[f] || []).forEach((s) => { B.pas[f][s] = 1; B.pas[f][s + 16] = 1; }); }); garderIdees(); rendre(); return; }
      const nn = e.target.closest('[data-n]'); if (nn) { idees.piano.n = +nn.dataset.n; idees.piano.notes = idees.piano.notes.filter((n) => n.p < 8 * idees.piano.n); garderIdees(); rendre(); return; }
      const du = e.target.closest('[data-duree]'); if (du) { dureeNote = +du.dataset.duree; rendre(); return; }
      const gen = e.target.closest('[data-gen]'); if (gen) { generer(gen.dataset.gen); return; }
      const vc = e.target.closest('[data-vocal]');
      if (vc) { const en = espace.entries.find((x) => x.id === vc.dataset.vocal); if (en?.audio) { try { const a = new Audio(await audioURL(en.audio)); arreter(); a.play(); } catch { toast('Le vocal ne se charge pas.'); } } return; }
      const ef = e.target.closest('[data-effacer]');
      if (ef) { if (!confirm('Effacer ce commentaire?')) return; if (ef.dataset.local) store.set('chantierComs', store.get('chantierComs', []).filter((x) => x.id !== ef.dataset.effacer)); else await deleteEntry(ef.dataset.effacer).catch(() => toast('Pas pu l’effacer.')); rendre(); return; }
      const a = e.target.closest('[data-c]')?.dataset.c; if (!a) return;
      if (a === 'play') { if (lect) arreter(); else jouer(curseur >= (ch?.buf.duration || 0) - 0.1 ? 0 : curseur); }
      if (a === 'commenter') { const p = pos(); arreter(); curseur = p; composer = { t: p, texte: '' }; rendre(); q('[data-c=texte]')?.focus(); }
      if (a === 'reecouter') { const t0 = composer.t; jouer(Math.max(0, t0 - 3), { a: Math.max(0, t0 - 3), b: t0 + 2 }); setTimeout(() => { if (lect?.boucle?.b === t0 + 2) arreter(false); curseur = t0; majPos(); }, 5200); }
      if (a === 'vocal') vocal();
      if (a === 'annuler-com') { composer?.rec?.stop(); composer = null; rendre(); }
      if (a === 'garder-com') {
        const texte = (q('[data-c=texte]')?.value || '').trim(); if (!texte && !composer.blob) { toast('Écris quelque chose ou dis-le au micro.'); return; }
        const b = e.target.closest('button'); b.disabled = true; b.textContent = 'J’enregistre…';
        try {
          if (espace.connected) { const audio2 = composer.blob ? await uploadAudio(composer.blob) : undefined; await saveEntry({ type: 'chantier', title: `💬 ${ch.nom} · ${mmss(composer.t)}`, ...(audio2 ? { audio: audio2 } : {}), data: { kind: 'com', cle, t: Math.round(composer.t * 100) / 100, texte } }); }
          else store.set('chantierComs', [...store.get('chantierComs', []), { id: `loc-${Date.now()}`, cle, t: composer.t, texte, at: Date.now() }]);
          composer = null; toast(espace.connected ? 'Commentaire gardé : Frog le verra à ce moment de la chanson.' : 'Commentaire gardé sur cet appareil.');
        } catch (err) { toast(err.message || 'Pas pu garder le commentaire.'); b.disabled = false; return; }
        rendre();
      }
      if (a === 'refaire') { const b = e.target.closest('button'); b.disabled = true; b.textContent = '🎛 J’écoute la batterie…'; setTimeout(() => { refaire(); rendre(); toast('La chanson est refaite en numérique. Allume ou éteins chaque partie.'); }, 30); }
      if (a === 'num-seul') { mix.orig = false; ['bat', 'basse', 'acc', 'mel'].forEach((k) => { mix[k] = true; }); store.set('chantierMix', mix); rendre(); jouer(tMes(mesureDe(pos()))); }
      if (a === 'num-ens') { mix.orig = true; store.set('chantierMix', mix); rendre(); jouer(tMes(mesureDe(pos()))); }
      if (a === 'midi') { const f = midiNumerique(); if (!f) return; const l = document.createElement('a'); l.href = URL.createObjectURL(f); l.download = `${ch.nom} (numérique).mid`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(l); l.click(); l.remove(); }
      if (a === 'bat-ici') { const m = mesureDe(pos()) + 1; const B = idees.batterie; const L = B.a - B.de; B.de = m; B.a = Math.min(nbMes(), m + Math.max(B.long, L)); garderIdees(); rendre(); }
      if (a === 'pia-ici') { idees.piano.de = mesureDe(pos()) + 1; garderIdees(); rendre(); }
      if (a === 'ecouter-bat' || a === 'ecouter-pia') { const p = passage(a === 'ecouter-bat' ? 'bat' : 'pia'); jouer(p.a); }
      if (a === 'boucle-bat' || a === 'boucle-pia') { const p = passage(a === 'boucle-bat' ? 'bat' : 'pia'); jouer(p.a, p); }
    });
    el.addEventListener('input', (e) => {
      const a = e.target.dataset.c;
      if (a === 'vol') { vol = +e.target.value; store.set('chantierVolume', vol); if (lect) lect.g.gain.setTargetAtTime(mix.orig ? vol : 0, c.currentTime, 0.03); }
      if (a === 'texte' && composer) composer.texte = e.target.value;
    });
    el.addEventListener('change', (e) => {
      const a = e.target.dataset.c; const N = nbMes(); const v = Math.max(1, Math.min(N, Math.round(+e.target.value || 1)));
      if (a === 'source') { source = e.target.value; store.set('chantierSource', source); charger(); return; }
      if (a === 'bat-on') { idees.batterie.on = e.target.checked; garderIdees(); }
      if (a === 'pia-on') { idees.piano.on = e.target.checked; garderIdees(); }
      if (a === 'bat-de') { idees.batterie.de = v; if (idees.batterie.a < v) idees.batterie.a = v; garderIdees(); rendre(); }
      if (a === 'bat-a') { idees.batterie.a = Math.max(idees.batterie.de, v); garderIdees(); rendre(); }
      if (a === 'pia-de') { idees.piano.de = v; garderIdees(); rendre(); }
      if (a === 'toutes') { toutesNotes = e.target.checked; rendre(); }
      if (a === 'melinst') { mix.melInst = e.target.value; store.set('chantierMix', mix); prechargerSons([mix.melInst]); }
      if (a === 'detail') { detail = +e.target.value; store.set('chantierDetail', detail); refaire(); rendre(); }
    });
    const offEsp = onEspace((type) => { if (type === 'entries' && ch && !composer) { if (onglet === 'com') rendreComs(); dessiner(); } if (type === 'entries' && !ch) majSources(); });
    const auResize = () => { pics = null; dessiner(); }; addEventListener('resize', auResize);
    majSources(); charger(); rendre(); document.body.classList.add('ch-ouvert'); // un seul bouton d'arrêt : celui du lecteur
    return () => { document.body.classList.remove('ch-ouvert'); arreter(false); clearTimeout(envoi); removeEventListener('diapason:stop', onStop); removeEventListener('resize', auResize); offEsp?.(); composer?.rec?.stop(); };
  },
};
