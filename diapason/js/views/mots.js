// Mots sur la grille (Ma voix) : un thème, des mots-clés, une grille d'accords (celle de L'oreille, celle de Jouer,
// ou tapée à la main). FLIP assemble des lignes brouillon qui tombent sur les temps et riment, puis les chante
// sur les accords : la voix-guide prend les notes de l'accord sur les temps forts.
import { audio, out, drums } from '../audio.js';
import { joue, prechargerSons, accord as accordSon, notePiano } from '../sampler.js';
import { espace, profileOf, saveEntry } from '../espace.js';
import { loadLexique, rimeOf } from '../lexique.js';
import { store, toast } from '../ui.js';
import { esc } from './carnet.js';
import { nomNote } from '../oreille.js';
import { PLACEMENTS, syllabes, placer } from './placer.js';
import { THEMES, SCHEMAS, banque, ligne, partenaire, hasard } from '../paroles-gen.js';
import { PROGRESSIONS } from '../data.js';
import { diagramme } from '../guitare.js';
import { chordIntervals } from '../music.js';

const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14] };
const SUF = { M: '', m: 'm', 7: '7', maj7: 'maj7', m7: 'm7', sus2: 'sus2', sus4: 'sus4', dim: 'dim', add9: 'add9' };
export const nomAcc = (c) => `${NOMS[c.r]}${SUF[c.q] ?? ''}`;

// « Lam », « Sib7 », « Fa♯m », « Am », « C#maj7 » → { r, q }.
export function lireAccord(t) {
  const s = t.trim().replace('#', '♯');
  let m = s.match(/^(Do|Ré|Re|Mi|Fa|Sol|La|Si)(♯|♭|b)?(maj7|m7|m|7|sus2|sus4|dim|add9)?$/i);
  const base = { do: 0, ré: 2, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
  if (m) { const r = base[m[1].toLowerCase()] + (m[2] === '♯' ? 1 : m[2] ? -1 : 0); return { r: (r + 12) % 12, q: m[3] || 'M' }; }
  m = s.match(/^([A-G])(♯|♭|b)?(maj7|m7|m|7|sus2|sus4|dim|add9)?$/);
  if (m) { const r = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '♯' ? 1 : m[2] ? -1 : 0); return { r: (r + 12) % 12, q: m[3] || 'M' }; }
  return null;
}

// Les trois sources de grille : chacune donne des mesures de 4 temps ; un temps = un accord, ou null (on tient).
function grilleOreille() {
  const g = store.get('oreilleGrille', null); if (!g?.mesures?.length) return null;
  return { nom: g.nom ? `L’oreille · ${g.nom}` : 'La dernière grille de L’oreille', bpm: g.bpm || 90, mesures: g.mesures.map((m) => m.map((x) => (x && x !== '—' ? lireAccord(x) : null))) };
}
function grilleJouer() {
  const key = store.get('key', 0); const bpm = store.get('bpm', 92); const id = store.get('prog', 'pop');
  const p = (id === 'perso' && store.get('customProg', null)) || (id === 'seance' && store.get('seanceProg', null)) || PROGRESSIONS.find((x) => x.id === id) || PROGRESSIONS[0];
  const ch = p.hasard || !p.chords ? PROGRESSIONS[0].chords : p.chords;
  const temps = []; ch.forEach(([rel, q, b]) => { const n = b || 4; for (let k = 0; k < n; k++) temps.push(k ? null : { r: (((key + rel) % 12) + 12) % 12, q: IV[q] ? q : 'M' }); });
  while (temps.length % 4) temps.push(null);
  const mesures = []; for (let i = 0; i < temps.length; i += 4) mesures.push(temps.slice(i, i + 4));
  return { nom: `Jouer · ${p.name || 'la grille'}`, bpm, mesures };
}
function grilleMain(texte, bpm) {
  const mesures = texte.split(/[\s|,]+/).filter(Boolean).map((t) => { const c = lireAccord(t); return [c, null, null, null]; }).filter((m) => m[0]);
  return mesures.length ? { nom: 'Mes accords', bpm, mesures } : null;
}
// L'accord qui sonne à un temps (on remonte jusqu'au dernier changement, en bouclant la grille).
function accordA(g, mesure, temps) {
  const M = g.mesures.length; let i = mesure * 4 + temps;
  for (let k = 0; k < M * 4; k++) { const j = ((i - k) % (M * 4) + M * 4) % (M * 4); const c = g.mesures[Math.floor(j / 4)][j % 4]; if (c) return c; }
  return { r: 0, q: 'M' };
}
// La gamme majeure qui contient le mieux tous les accords (pondérés par leur durée).
function gammeDe(g) {
  const poids = Array(12).fill(0); const M = g.mesures.length;
  for (let m = 0; m < M; m++) for (let t = 0; t < 4; t++) { const c = accordA(g, m, t); (IV[c.q] || IV.M).forEach((x) => { poids[(c.r + x) % 12] += 1; }); }
  let best = 0; let bs = -1;
  for (let k = 0; k < 12; k++) { const s = [0, 2, 4, 5, 7, 9, 11].reduce((a, x) => a + poids[(k + x) % 12], 0); if (s > bs) { bs = s; best = k; } }
  return [0, 2, 4, 5, 7, 9, 11].map((x) => (best + x) % 12);
}

// La chanson venue de L'oreille reste en mémoire tant que la page n'est pas rechargée.
let chansonGardee = null;

export default {
  id: 'mots',
  mount(el) {
    const st = { theme: 'nuit', cles: '', schema: 'AABB', place: 'croches', pers: 'je', n: 4, source: 'jouer', main: 'Lam Fa Do Sol', ...store.get('motsReglages', {}) };
    let lignes = store.get('motsLignes', []); // [{ txt, garde }]
    // Venue de L'oreille (« Des paroles sur cette chanson ») : la vraie chanson joue sous les paroles.
    let chanson = window.__flipMots || null; window.__flipMots = null;
    if (chanson) chansonGardee = chanson; else chanson = chansonGardee;
    // Une nouvelle grille dans L'oreille depuis la dernière visite : la page s'ouvre dessus.
    { const og = store.get('oreilleGrille', null); if (og?.at && og.at > (st.vuAt || 0)) { st.source = 'oreille'; st.vuAt = og.at; store.set('motsReglages', st); } }
    if (chanson) st.source = 'oreille';
    let graine = Date.now() % 100000; let lecture = null; let raf = 0;
    const voix = espace.connected ? profileOf(espace.me)?.voix || null : null;
    const sauver = () => { store.set('motsReglages', st); store.set('motsLignes', lignes); };
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Ma voix · mots sur la grille</p>
        <h1>Des paroles qui tombent sur les accords.</h1>
        <p class="muted">Choisis un thème, ajoute tes mots. FLIP assemble des lignes qui tombent sur les temps et qui riment, puis te les chante sur la grille. Ce sont des brouillons : garde une ligne, retire les autres, réécris par-dessus.</p>
      </div></div>
      <section class="panel mo-reg">
        <div class="mo-themes" role="radiogroup" aria-label="Thème">${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="mo-th ${k === st.theme ? 'on' : ''}" data-theme="${k}" role="radio" aria-checked="${k === st.theme}">${esc(t.nom)}</button>`).join('')}</div>
        <label class="field mo-cles"><span>Mes mots-clés <small class="muted">(séparés par des virgules ; une expression entière marche aussi)</small></span>
          <input type="text" data-m="cles" value="${esc(st.cles)}" placeholder="lac, fanal, on se retrouve à minuit"></label>
        <div class="mo-choix">
          <label class="field"><span>La grille</span><select data-m="source">
            <option value="jouer">Les accords de Jouer</option><option value="oreille">La dernière grille de L’oreille</option><option value="main">Je les tape</option></select></label>
          <label class="field mo-main" ${st.source === 'main' ? '' : 'hidden'}><span>Un accord par mesure</span><input type="text" data-m="main" value="${esc(st.main)}" placeholder="Lam Fa Do Sol"></label>
          <label class="field"><span>Sur les temps</span><select data-m="place">${PLACEMENTS.map((p) => `<option value="${p.id}">${esc(p.nom)} (${p.slots.length} syll.)</option>`).join('')}</select></label>
          <label class="field"><span>Les rimes</span><select data-m="schema">${Object.entries(SCHEMAS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
          <label class="field"><span>Qui parle</span><select data-m="pers"><option value="je">Je</option><option value="tu">Tu</option><option value="mix">Les deux</option></select></label>
          <label class="field"><span>Lignes</span><select data-m="n"><option>4</option><option>8</option><option>12</option></select></label>
        </div>
        <div class="mo-sous" ${chanson ? '' : 'hidden'}><label class="mo-vraie"><input type="checkbox" data-m="vraie" checked> Sous les paroles : la vraie chanson${chanson ? ` (« ${esc(String(chanson.nom).slice(0, 40))} »)` : ''}</label><label class="mo-vraie"><input type="checkbox" data-m="piano" ${store.get('oreilleGrille', null)?.propose ? 'checked' : ''}> + les accords au piano</label></div>
        <div class="ec-row"><button class="btn primary" data-m="generer">Écrire les lignes</button><button class="btn" data-m="chanter">▶ Chanter sur la grille</button><span class="mo-info muted small"></span></div>
      </section>
      <section class="mo-lignes" aria-live="polite"></section>
      <div class="mo-lecteur" hidden role="region" aria-label="Pendant que ça chante"></div>
      <section class="panel mo-fin">
        <div class="ec-row"><button class="btn" data-m="placer">Envoyer dans Placer</button><button class="btn" data-m="copier">Copier le texte</button>${espace.connected ? '<button class="btn" data-m="journal">Dans le journal</button>' : ''}</div>
        <p class="muted small">Comment c’est fait : pas d’intelligence artificielle. Des tournures de phrases, des banques de mots par thème, tes mots-clés et leurs synonymes (le dictionnaire de l’app). Pour chaque ligne, FLIP essaie quelques centaines de phrases et garde celle dont les accents tombent le mieux sur les temps forts (le calcul de « Placer ») et qui rime comme demandé. Le genre des mots-clés est deviné : relis les « le / la ».</p>
      </section>`;
    const q = (s) => el.querySelector(s);
    ['source', 'place', 'schema', 'pers'].forEach((k) => { q(`[data-m=${k}]`).value = st[k]; }); q('[data-m=n]').value = String(st.n);

    const grille = () => (st.source === 'oreille' ? grilleOreille() : st.source === 'main' ? grilleMain(st.main, store.get('bpm', 92)) : grilleJouer()) || grilleJouer();
    const slots = () => PLACEMENTS.find((p) => p.id === st.place).slots;

    // La mélodie d'une ligne : sur les temps forts et les accents, une note de l'accord qui sonne ; ailleurs, on marche dans la gamme.
    function melodie(syl, pl, sl, g, i) {
      const gamme = gammeDe(g); const centre = voix ? Math.round((voix.low + voix.high) / 2) : 65;
      const n = syl.length; const notes = []; let cur = centre;
      const forme = [(k) => Math.sin((k / Math.max(1, n - 1)) * Math.PI) * 5, (k) => 3 - (k / Math.max(1, n - 1)) * 6, (k) => -3 + (k / Math.max(1, n - 1)) * 6, (k) => 4 - (k / Math.max(1, n - 1)) * 8][i % 4];
      syl.forEach((s, k) => {
        const kk = pl.pos[k]; const x = kk >= 0 ? sl[kk] : { s: 0, f: false };
        const c = accordA(g, (2 * i + Math.floor(x.s / 16)) % g.mesures.length, Math.floor((x.s % 16) / 4));
        const tons = (IV[c.q] || IV.M).map((v) => (c.r + v) % 12);
        const visee = Math.round(centre + forme(k));
        if (x.f || s.accent || k === n - 1) { let m = visee; for (let d = 0; d < 7; d++) { if (tons.includes(((visee + d) % 12 + 12) % 12)) { m = visee + d; break; } if (tons.includes(((visee - d) % 12 + 12) % 12)) { m = visee - d; break; } } cur = m; }
        else { const dir = visee >= cur ? 1 : -1; let m = cur + dir; let garde = 0; while (!gamme.includes(((m % 12) + 12) % 12) && garde++ < 3) m += dir; cur = m; }
        if (voix) { while (cur > voix.high - 1) cur -= 12; while (cur < voix.low + 1) cur += 12; }
        notes.push(cur);
      });
      return notes;
    }
    const analyse = (txt, i) => { const g = grille(); const sl = slots(); const syl = syllabes(txt); const pl = placer(syl, sl); return { g, sl, syl, pl, notes: melodie(syl, pl, sl, g, i) }; };

    function rendre() {
      const g = grille();
      const nomsSrc = st.source === 'oreille' && !grilleOreille() ? 'Pas encore de grille dans L’oreille : je prends celle de Jouer. ' : '';
      q('.mo-info').textContent = `${nomsSrc}${g.nom} · ${g.bpm} BPM · ${g.mesures.length} mesure${g.mesures.length > 1 ? 's' : ''} · une ligne = deux mesures`;
      const box = q('.mo-lignes');
      if (!lignes.length) { box.innerHTML = '<div class="panel mo-vide"><p>Choisis un thème, ajoute un mot ou deux qui t’appartiennent, puis « Écrire les lignes ».</p></div>'; return; }
      const schema = st.schema;
      box.innerHTML = lignes.map((L, i) => {
        const { sl, syl, pl, notes } = analyse(L.txt, i);
        const p = partenaire(schema, i); const rime = p != null && lignes[p] ? rimeOf(L.txt) === rimeOf(lignes[p].txt) : null;
        const acc = [0, 1].map((h) => [0, 1, 2, 3].map((t) => { const m = (2 * i + h) % g.mesures.length; const c = g.mesures[m][t]; return c ? `<span class="mo-acc" style="left:${((h * 16 + t * 4) / 32) * 100}%">${esc(nomAcc(c))}</span>` : ''; }).join('')).join('');
        const first = !g.mesures[(2 * i) % g.mesures.length][0] ? `<span class="mo-acc tenu" style="left:0">${esc(nomAcc(accordA(g, (2 * i) % g.mesures.length, 0)))}</span>` : '';
        const cases = [...Array(32)].map((_, s) => `<i class="${s % 4 === 0 ? 'b' : ''} ${s % 16 === 0 ? 'm' : ''} ${sl.some((x) => x.s === s && x.f) ? 'f' : ''}"></i>`).join('');
        const blocs = syl.map((s, k) => { const kk = pl.pos[k]; if (kk < 0) return ''; const x = sl[kk]; return `<span class="pl-syl ${s.accent === 2 ? 'a2' : s.accent ? 'a1' : ''} ${x.f ? 'sur-f' : ''}" data-k="${k}" style="left:${(x.s / 32) * 100}%;width:${(x.d / 32) * 100}%"><b>${esc(s.txt)}</b><small>${nomNote(notes[k])}</small></span>`; }).join('');
        const lettre = 'ABCDEFGH'[schema === 'AABB' ? Math.floor((i % 4) / 2) + 2 * Math.floor(i / 4) : schema === 'ABAB' ? (i % 2) + 2 * Math.floor(i / 4) : schema === 'ABCB' ? [0, 1, 2, 1][i % 4] + 3 * Math.floor(i / 4) : 0] || '';
        return `<article class="panel mo-l ${L.garde ? 'garde' : ''}" data-i="${i}">
          <div class="mo-l-tete">
            ${schema !== 'libre' ? `<span class="mo-lettre" title="Schéma de rimes">${lettre}</span>` : ''}
            <textarea class="mo-txt" data-i="${i}" rows="1" aria-label="Ligne ${i + 1}">${esc(L.txt)}</textarea>
            <span class="mo-n ${pl.trop ? 'neg' : ''}">${syl.length}/${sl.length}</span>
            ${rime === true ? '<span class="mo-rime pos">rime ✓</span>' : rime === false ? '<span class="mo-rime neg">ne rime pas</span>' : ''}
            <label class="mo-garde"><input type="checkbox" data-garde="${i}" ${L.garde ? 'checked' : ''}> Garder</label>
            <button class="btn small" data-m="autre" data-i="${i}" title="Une autre ligne à cette place">↻ Une autre</button>
            <button class="btn small" data-m="une" data-i="${i}" aria-label="Écouter la ligne ${i + 1}" title="Écouter cette ligne">▶</button>
          </div>
          <div class="mo-accs">${first}${acc}</div>
          <div class="pl-piste"><div class="pl-cases">${cases}</div>${blocs}<div class="pl-tete"></div></div>
        </article>`;
      }).join('');
    }

    // Écrit (ou réécrit) les lignes non gardées. « seule » : une seule ligne à refaire.
    async function generer(seule = null) {
      q('[data-m=generer]').disabled = true; q('[data-m=generer]').textContent = 'J’écris…';
      await loadLexique();
      const cles = st.cles.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
      const b = await banque(st.theme, cles);
      const n = +st.n; const sl = slots();
      while (lignes.length < n) lignes.push({ txt: '', garde: false });
      if (seule == null) lignes = lignes.slice(0, n);
      graine += 7919; const r = hasard(graine);
      const dejaVus = new Map(); const fins = [];
      const compter = (t) => t.toLowerCase().split(/[\s’',]+/).forEach((w) => dejaVus.set(w, (dejaVus.get(w) || 0) + 1));
      lignes.forEach((L, i) => { if (L.txt && (L.garde || (seule != null && i !== seule))) { compter(L.txt); fins.push(L.txt.split(/[\s’']/).at(-1).toLowerCase()); } });
      for (let i = 0; i < lignes.length; i++) {
        const L = lignes[i];
        if (L.garde && L.txt) continue;
        if (seule != null && i !== seule) continue;
        const p = partenaire(st.schema, i);
        const rime = p != null && lignes[p]?.txt ? { cle: rimeOf(lignes[p].txt), mot: lignes[p].txt.split(/[\s’']/).at(-1).toLowerCase() } : null;
        const vus = lignes.map((x) => x.txt.toLowerCase());
        const manquantes = b.cles.filter((c) => !vus.some((t) => t.includes(c.k)));
        const tete = lignes.some((_, j) => partenaire(st.schema, j) === i);
        const res = ligne({ b, r, slots: sl, pers: st.pers, rime, tete, finAEviter: fins, dejaVus, clesManquantes: manquantes });
        if (res) { L.txt = res.txt; compter(res.txt); fins.push(res.fin); }
        // Une ligne refaite peut casser la rime de sa partenaire suivante : on la refait aussi, si elle n'est pas gardée.
        if (seule != null) { const suiv = lignes.findIndex((_, j) => j > i && partenaire(st.schema, j) === i); if (suiv >= 0 && !lignes[suiv].garde) seule = suiv; }
      }
      sauver(); rendre();
      q('[data-m=generer]').disabled = false; q('[data-m=generer]').textContent = 'Écrire les lignes';
    }

    function arreter() {
      cancelAnimationFrame(raf);
      if (lecture) { lecture.stop = true; try { lecture.bus.gain.value = 0; lecture.bus.disconnect(); } catch { /* déjà coupé */ } lecture.src.forEach((s) => { try { s.stop(); } catch { /* déjà arrêtée */ } }); lecture = null; }
      el.querySelectorAll('.pl-tete').forEach((t) => { t.style.opacity = 0; });
      el.querySelectorAll('.mo-l.chante').forEach((x) => x.classList.remove('chante'));
      const b = q('[data-m=chanter]'); if (b) b.textContent = '▶ Chanter sur la grille';
      el.querySelectorAll('[data-m=une]').forEach((x) => { x.textContent = '▶'; });
      el.querySelectorAll('.pl-syl.dit').forEach((x) => x.classList.remove('dit'));
      const lb = q('.mo-lecteur'); if (lb) { lb.hidden = true; lb.innerHTML = ''; } cleBarre = '';
    }
    let cleBarre = '';
    // La barre du bas, pendant que ça chante : l'accord qui joue (en gros, avec sa position à la guitare), le suivant,
    // la ligne en cours avec la syllabe chantée allumée, et un gros ■ Stop.
    // La ligne telle qu'écrite (avec ses « j’ », « l’ »), le mot chanté allumé : on compte les mots d'après les syllabes.
    function motsAllumes(F, ks) {
      const idx = []; let w = -1; F.syl.forEach((sy, n) => { if (!n || sy.mot !== F.syl[n - 1].mot) w++; idx.push(w); });
      const mots = lignes[F.i].txt.split(/\s+/).filter(Boolean);
      if (mots.length !== w + 1) return F.syl.map((sy) => `<span class="${sy.k === ks ? 'on' : sy.k < ks ? 'dit' : ''}">${esc(sy.txt)}</span>`).join('');
      const ici = ks >= 0 ? idx[ks] : -1;
      return mots.map((m, n) => `<span class="${n === ici ? 'on' : n < ici ? 'dit' : ''}">${esc(m)}</span>`).join(' ');
    }
    function majBarre(t, t0, t1, noire, frise, j) {
      const lb = q('.mo-lecteur'); if (!lb) return; lb.hidden = false;
      const F = frise[j]; const tous = frise.flatMap((x) => x.acc);
      let ic = -1; tous.forEach((a, k) => { if (a.t <= t + 0.02) ic = k; });
      const cur = t < t1 ? null : tous[Math.max(0, ic)]; const suiv = tous.slice(Math.max(0, ic) + 1).find((a) => !cur || nomAcc(a.c) !== nomAcc(cur.c));
      let ks = -1; if (t >= t1) F.syl.forEach((sy) => { if (sy.t != null && sy.t <= t + 0.03) ks = sy.k; });
      const compte = t < t1 ? Math.min(4, Math.floor((t - t0) / noire) + 1) : 0;
      const cle = `${j}|${ic}|${ks}|${compte}`; if (cle === cleBarre) return;
      // Nouvelle ligne : on la ramène au milieu de l'écran, au-dessus de la barre.
      if (cleBarre.split('|')[0] !== String(j)) el.querySelector(`.mo-l[data-i="${F.i}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      cleBarre = cle;
      lb.innerHTML = `<div class="mo-lb-acc">${cur ? `<b>${esc(nomAcc(cur.c))}</b>${diagramme(cur.c.r, cur.c.q, { taille: 64 })}` : `<b class="mo-lb-compte">${compte || ''}</b>`}${suiv ? `<small>puis ${esc(nomAcc(suiv.c))}</small>` : ''}</div>
        <p class="mo-lb-mots">${motsAllumes(F, ks)}</p>
        <button class="btn mo-lb-stop" data-m="stop" aria-label="Arrêter">■ Stop</button>`;
      el.querySelectorAll('.pl-syl.dit').forEach((x) => x.classList.remove('dit'));
      const sp = el.querySelector(`.mo-l[data-i="${F.i}"] .pl-syl[data-k="${ks}"]`); if (sp) sp.classList.add('dit');
    }
    // Chante les lignes demandées : une mesure de décompte, puis deux mesures par ligne, accords au piano, voix-guide.
    async function chanter(quelles, bouton) {
      arreter();
      const c = audio(); try { await c.resume(); } catch { /* iOS */ }
      if (bouton) bouton.textContent = '…';
      await prechargerSons(['voix', 'piano']);
      const g = grille(); const noire = 60 / g.bpm; const dc = noire / 4; const mes = 4 * noire;
      const t0 = c.currentTime + 0.25; const t1 = t0 + mes; const src = [];
      const bus = c.createGain(); bus.connect(out()); // tout passe par ici : « Arrêter » coupe aussi les notes déjà prévues
      for (let k = 0; k < 4; k++) try { drums.hat?.(t0 + k * noire, k ? 0.35 : 0.6); } catch { /* pas de métronome */ }
      const frise = []; // par ligne : ses syllabes et ses accords, avec leur moment
      quelles.forEach((i, j) => {
        const { sl, syl, pl, notes } = analyse(lignes[i].txt, i); const debut = t1 + j * 2 * mes;
        const F = { i, debut, syl: syl.map((sy, k) => ({ txt: sy.txt, mot: sy.mot, t: pl.pos[k] >= 0 ? debut + sl[pl.pos[k]].s * dc : null, k })), acc: [] };
        for (let h = 0; h < 2; h++) for (let t = 0; t < 4; t++) { const m = (2 * i + h) % g.mesures.length; const ch = g.mesures[m][t] || (h === 0 && t === 0 ? accordA(g, m, 0) : null); if (ch) F.acc.push({ t: debut + (h * 4 + t) * noire, c: ch }); }
        frise.push(F);
        const vraie = chanson && st.source === 'oreille' && q('[data-m=vraie]')?.checked;
        if (vraie) {
          // Le passage de la vraie chanson qui porte ces deux mesures (la grille de L'oreille commence à t0).
          const s0 = chanson.t0 + ((2 * i) % g.mesures.length) * 4 * chanson.temps; const sN = c.createBufferSource(); sN.buffer = chanson.buf;
          sN.playbackRate.value = (chanson.temps * g.bpm) / 60 || 1; const gv = c.createGain(); gv.gain.value = 0.85; sN.connect(gv).connect(bus);
          sN.start(debut, Math.max(0, s0), 2 * mes * sN.playbackRate.value + 0.05); src.push(sN);
        }
        const piano = !vraie || q('[data-m=piano]')?.checked;
        if (piano) for (let h = 0; h < 2; h++) for (let t = 0; t < 4; t++) {
          const m = (2 * i + h) % g.mesures.length; const ch = g.mesures[m][t] || (h === 0 && t === 0 ? accordA(g, m, 0) : null); if (!ch) continue;
          let dur = 1; while (t + dur < 4 && !g.mesures[m][t + dur]) dur++;
          const iv = (() => { try { return chordIntervals(ch.q); } catch { return IV[ch.q] || IV.M; } })();
          const base = 48 + ch.r; accordSon('piano', iv.map((v) => base + v), { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.45, dest: bus });
          if (!joue('piano', 36 + ch.r, { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.5, dest: bus })) iv.forEach((v) => notePiano(base + v, { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.5 }));
        }
        syl.forEach((s, k) => { const kk = pl.pos[k]; if (kk < 0) return; const x = sl[kk]; if (!joue('voix', notes[k], { when: debut + x.s * dc, dur: Math.max(0.12, x.d * dc * 0.9), vel: s.accent ? 0.95 : 0.75, dest: bus })) notePiano(notes[k] + 12, { when: debut + x.s * dc, dur: Math.max(0.12, x.d * dc * 0.9), vel: 0.8 }); });
      });
      const fin = t1 + quelles.length * 2 * mes;
      lecture = { src, bus, stop: false };
      if (bouton) bouton.textContent = '■ Arrêter';
      const tick = () => {
        if (!lecture) return; const t = c.currentTime;
        if (t > fin + 0.3) { arreter(); return; }
        const j = Math.floor((t - t1) / (2 * mes)); const i = quelles[Math.max(0, Math.min(quelles.length - 1, j))];
        el.querySelectorAll('.mo-l').forEach((a) => { const on = t >= t1 && +a.dataset.i === i; a.classList.toggle('chante', on); const h = a.querySelector('.pl-tete'); h.style.opacity = on ? 1 : 0; if (on) h.style.left = `${(((t - t1) - j * 2 * mes) / (2 * mes)) * 100}%`; });
        majBarre(t, t0, t1, noire, frise, Math.max(0, Math.min(frise.length - 1, j)));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    el.addEventListener('click', async (e) => {
      const th = e.target.closest('[data-theme]');
      if (th) { st.theme = th.dataset.theme; el.querySelectorAll('[data-theme]').forEach((x) => { x.classList.toggle('on', x === th); x.setAttribute('aria-checked', x === th); }); sauver(); return; }
      const b = e.target.closest('[data-m]'); const m = b?.dataset.m; if (!m || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
      if (m === 'generer') { arreter(); await generer(); return; }
      if (m === 'autre') { arreter(); await generer(+b.dataset.i); return; }
      if (m === 'chanter') { if (b.textContent.startsWith('■')) { arreter(); return; } if (!lignes.length) await generer(); chanter(lignes.map((_, i) => i).filter((i) => lignes[i].txt), b); return; }
      if (m === 'stop') { arreter(); return; }
      if (m === 'une') { if (b.textContent.startsWith('■')) { arreter(); return; } await chanter([+b.dataset.i, +b.dataset.i], null); b.textContent = '■'; return; }
      const texte = lignes.map((x) => x.txt).filter(Boolean).join('\n');
      if (m === 'placer') { if (!texte) return; store.set('placerTexte', texte); location.hash = '#/placer'; return; }
      if (m === 'copier') { try { await navigator.clipboard.writeText(texte); toast('Copié.'); } catch { toast('Copie impossible ici : sélectionne le texte à la main.'); } return; }
      if (m === 'journal') { if (!texte) return; try { await saveEntry({ type: 'texte', title: lignes[0].txt.slice(0, 80), body: texte, data: { journal: true, date: new Date().toISOString().slice(0, 10), invite: `Mots sur la grille · ${THEMES[st.theme].nom}`, stage: 0 } }); toast('Dans le journal.'); } catch (err) { toast(err.message); } }
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.m;
      if (e.target.dataset.garde != null) { lignes[+e.target.dataset.garde].garde = e.target.checked; e.target.closest('.mo-l').classList.toggle('garde', e.target.checked); sauver(); return; }
      if (!k || e.target.tagName !== 'SELECT') return;
      st[k] = k === 'n' ? +e.target.value : e.target.value;
      if (k === 'source') q('.mo-main').hidden = st.source !== 'main';
      sauver(); arreter(); rendre();
    });
    el.addEventListener('input', (e) => {
      if (e.target.dataset.m === 'cles') { st.cles = e.target.value; sauver(); return; }
      if (e.target.dataset.m === 'main') { st.main = e.target.value; sauver(); rendre(); return; }
      if (e.target.classList.contains('mo-txt')) { lignes[+e.target.dataset.i].txt = e.target.value; sauver(); }
    });
    // Une ligne = une ligne : Entrée valide la retouche au lieu de couper la ligne.
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList?.contains('mo-txt')) { e.preventDefault(); e.target.blur(); } });
    // Après une retouche à la main : on recalcule la ligne quand on quitte le champ (pour ne pas perdre le curseur).
    el.addEventListener('focusout', (e) => { if (e.target.classList?.contains('mo-txt')) rendre(); });
    loadLexique().then(rendre); rendre();
    setTimeout(() => prechargerSons(['voix', 'piano']), 400);
    return () => arreter();
  },
};
