// Placer mes paroles : une pièce de Frog joue, j'écris mes lignes, et FLIP montre où tombent les syllabes.
// Plusieurs placements possibles (sur le temps, contretemps, syncopé, lyrique, débit serré…), chacun avec son nombre
// de syllabes idéal, les accents toniques sur les temps forts ou à côté, et un guide vocal : la note de chaque syllabe.
// Prosodie : les syllabes accentuées vont sur les temps forts, sinon le texte « boite » (Pattison 2009).
import { audio, out } from '../audio.js';
import { joue, prechargerSons } from '../sampler.js';
import { espace, profileOf, saveEntry } from '../espace.js';
import { loadLexique, lineSyll, wordSyll } from '../lexique.js';
import { store, toast } from '../ui.js';
import { esc } from './carnet.js';
import { nomNote } from '../oreille.js';

// Les pièces : tempo et premier temps mesurés dans les fichiers ; la gamme sert au guide vocal.
const PIECES = {
  projet1: { nom: 'Projet 1, après la pause (Frog)', url: 'data/sons/frog-visite.mp3', bpm: 120, t1: 34.98, ton: 'ré mineur', tonique: 62, gamme: [2, 4, 5, 7, 9, 0], accord: [2, 5, 9] },
  joywalk: { nom: 'Joy Walk (Frog)', url: 'data/sons/frog-joywalk.mp3', bpm: 116.6, t1: 16.43, ton: 'sol majeur', tonique: 67, gamme: [7, 9, 11, 0, 2, 4], accord: [7, 11, 2] },
};
// Une ligne = deux mesures = 32 doubles-croches. [pas, durée, fort]
const S = (l) => l.map(([s, d, f]) => ({ s, d, f: !!f }));
const PLACEMENTS = [
  { id: 'temps', nom: 'Sur le temps', idee: 'Une syllabe par temps : posé, clair, facile à chanter.', slots: S([[0, 4, 1], [4, 4], [8, 4, 1], [12, 4], [16, 4, 1], [20, 4], [24, 8, 1]]) },
  { id: 'croches', nom: 'En croches', idee: 'Deux syllabes par temps : le débit d’une conversation.', slots: S([[0, 2, 1], [2, 2], [4, 2], [6, 2], [8, 2, 1], [10, 2], [12, 2], [14, 2], [16, 2, 1], [18, 2], [20, 2], [22, 2], [24, 8, 1]]) },
  { id: 'contre', nom: 'Contretemps', idee: 'Chaque syllabe arrive juste après le temps : ça balance, ça flotte.', slots: S([[2, 4, 1], [6, 4], [10, 4, 1], [14, 4], [18, 4, 1], [22, 4], [26, 6, 1]]) },
  { id: 'syncope', nom: 'Syncopé 3-3-2', idee: 'Le balancement des musiques latines et de la pop actuelle.', slots: S([[0, 3, 1], [3, 3], [6, 2, 1], [8, 3], [11, 3], [14, 2], [16, 3, 1], [19, 3], [22, 10, 1]]) },
  { id: 'lyrique', nom: 'Lyrique', idee: 'Peu de mots, des notes longues : pour un refrain qui s’envole.', slots: S([[0, 6, 1], [6, 2], [8, 8, 1], [16, 6, 1], [22, 2], [24, 8, 1]]) },
  { id: 'retard', nom: 'Départ en retard', idee: 'On laisse passer le premier temps, puis on entre : plus de tension.', slots: S([[4, 2], [6, 2], [8, 2, 1], [10, 2], [12, 2], [14, 2], [16, 2, 1], [18, 2], [20, 2], [22, 2], [24, 8, 1]]) },
  { id: 'dense', nom: 'Débit serré', idee: 'Des doubles-croches : presque parlé, pour un couplet qui raconte.', slots: S([[0, 1, 1], [1, 1], [2, 1], [3, 1], [4, 1, 1], [6, 1], [7, 1], [8, 1, 1], [9, 1], [10, 1], [11, 1], [12, 1, 1], [14, 1], [15, 1], [16, 1, 1], [17, 1], [18, 1], [19, 1], [20, 1, 1], [22, 2], [24, 8, 1]]) },
];
const PETITS = new Set('le la les l un une des de du d et ou à au aux en y ne n se s ce c je j tu il elle on nous vous ils elles me m te t ma mon ta ton sa son mes tes ses que qu qui pour par sur dans avec sans mais si'.split(' '));

// Les syllabes chantées d'une ligne, et l'accent tonique : en français, sur la dernière syllabe prononcée du groupe
// (fin de ligne, avant une virgule), plus doucement sur la fin des mots pleins.
function syllabes(ligne) {
  const { words } = lineSyll(ligne);
  const out = [];
  const coupes = new Set(); // mots suivis d'une ponctuation
  let k = 0; ligne.replace(/[A-Za-zÀ-ÖØ-öø-ÿœŒæÆ'’]+|[,;:.!?—]/g, (m) => { if (/^[,;:.!?—]$/.test(m)) coupes.add(k - 1); else k++; return m; });
  words.forEach((w, i) => {
    const chant = w.parts.map((p, j) => ({ p, j })).filter(({ j }) => !w.silent.includes(j));
    const petit = PETITS.has(w.word.toLowerCase().replace(/['’]$/, ''));
    // Un e muet chanté (« secon-des ») ne porte jamais l'accent : il va sur la syllabe d'avant.
    const muet = !/['’]$/.test(w.word) && wordSyll(w.word).mute && !w.silent.includes(w.parts.length - 1) && chant.length > 1;
    const tonique = chant.length - 1 - (muet ? 1 : 0);
    chant.forEach(({ p }, j) => {
      const ici = j === tonique;
      out.push({ txt: p, mot: w.word, accent: ici && (i === words.length - 1 || coupes.has(i)) ? 2 : ici && !petit && w.word.length >= 3 ? 1 : 0, petit: petit || (muet && j === chant.length - 1) });
    });
  });
  return out;
}

// Où chaque syllabe tombe dans un placement : on essaie quelques départs et on garde celui où les accents
// tombent le mieux sur les temps forts, la fin de ligne sur la dernière place.
function placer(syl, slots) {
  const N = syl.length; const M = slots.length;
  const essais = N <= M ? [...Array(Math.min(4, M - N + 1))].map((_, i) => M - N - i) : [M - N];
  let best = null;
  essais.forEach((o) => {
    let score = 0; const pos = [];
    syl.forEach((s, i) => {
      const k = i + o; const sl = slots[k]; pos.push(sl ? k : -1);
      if (!sl) { score -= 3; return; }
      if (s.accent === 2) score += sl.f ? 4 : -4;
      else if (s.accent === 1) score += sl.f ? 1.5 : -0.5;
      else if (sl.f && s.petit) score -= 1.5;
    });
    if (!best || score > best.score) best = { score, pos, o };
  });
  const forts = syl.filter((s) => s.accent).length * 4 || 1;
  const trop = Math.max(0, N - M); const libres = Math.max(0, M - N);
  const aCote = syl.filter((s, i) => s.accent === 2 && best.pos[i] >= 0 && !slots[best.pos[i]].f).map((s) => s.mot);
  const petitsForts = syl.filter((s, i) => s.petit && !s.accent && best.pos[i] >= 0 && slots[best.pos[i]].f).map((s) => s.mot);
  const note = Math.max(0, Math.min(100, Math.round(60 + (best.score / forts) * 40 - trop * 12 - Math.max(0, libres - 3) * 4)));
  return { ...best, trop, libres, aCote, petitsForts, note };
}

// Le guide vocal : une note par syllabe, dans la gamme de la pièce et la voix de la personne.
// Les accents prennent les notes de l'accord ; la fin de ligne se pose sur la tonique ; le reste marche par degrés.
function melodie(syl, pl, slots, P, voix, variante) {
  const centre = voix ? Math.round((voix.low + voix.high) / 2) : P.tonique;
  let base = P.tonique; while (base < centre - 6) base += 12; while (base > centre + 6) base -= 12;
  const dansGamme = (m) => P.gamme.includes(((m % 12) + 12) % 12);
  const versAccord = (m) => { for (let d = 0; d < 7; d++) { if (P.accord.includes(((m + d) % 12 + 12) % 12)) return m + d; if (P.accord.includes(((m - d) % 12 + 12) % 12)) return m - d; } return m; };
  const pas = (m, dir) => { let x = m + dir; while (!dansGamme(x)) x += dir; return x; };
  const n = syl.length; const notes = [];
  const forme = [(i) => Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 5, (i) => 4 - (i / Math.max(1, n - 1)) * 6, (i) => -3 + (i / Math.max(1, n - 1)) * 7][variante % 3];
  let cur = base;
  syl.forEach((s, i) => {
    const visee = base + forme(i);
    if (i === n - 1) cur = versAccord(base);
    else if (pl.pos[i] >= 0 && slots[pl.pos[i]].f) cur = versAccord(Math.round(visee));
    else cur = pas(cur, visee > cur ? 1 : -1);
    if (voix) { while (cur > voix.high - 1) cur -= 12; while (cur < voix.low + 1) cur += 12; }
    notes.push(cur);
  });
  return notes;
}

export default {
  id: 'placer',
  mount(el) {
    let piece = store.get('placerPiece', 'projet1'); let decale = false; let guide = true; let actif = 0;
    const tampons = {}; let lecture = null; let raf = 0;
    const voix = espace.connected ? profileOf(espace.me)?.voix || null : null;
    el.innerHTML = `
      <div class="mod-head"><div>
        <a class="retour-plan" href="#/ecrire">← Écrire</a>
        <p class="eyebrow">Placer mes paroles</p>
        <h1>Tes mots, sur sa musique.</h1>
        <p class="muted">Écris une ligne : FLIP compte les syllabes chantées, trouve les accents toniques et te montre plusieurs façons de la poser sur le temps. Écoute chaque version sur la pièce, avec la note à chanter sur chaque syllabe.</p>
      </div></div>
      <section class="panel pl-top">
        <label class="field"><span>La musique</span><select data-p="piece">${Object.entries(PIECES).map(([k, p]) => `<option value="${k}" ${k === piece ? 'selected' : ''}>${esc(p.nom)}</option>`).join('')}</select></label>
        <label class="pl-opt"><input type="checkbox" data-p="guide" checked> Guide vocal (la note de chaque syllabe)</label>
        <label class="pl-opt"><input type="checkbox" data-p="decale"> Tout décaler sur le contretemps</label>
        <p class="pl-info muted small"></p>
      </section>
      <div class="pl-grid">
        <section class="panel pl-ecrire">
          <h2>Mes lignes</h2>
          <p class="muted small">Une ligne de chanson par ligne. Chaque ligne dure deux mesures. Touche une ligne pour voir ses placements.</p>
          <textarea class="pl-texte" rows="8" placeholder="Vingt secondes de silence&#10;et ton piano revient me chercher">${esc(store.get('placerTexte', ''))}</textarea>
          <ol class="pl-lignes"></ol>
          <div class="ec-row"><button class="btn" data-p="tout">▶ Toutes mes lignes, avec le meilleur placement</button>${espace.connected ? '<button class="btn" data-p="garder">Dans le journal</button>' : ''}</div>
        </section>
        <section class="pl-versions" aria-live="polite"></section>
      </div>
      <p class="or-src-note muted small">Comment : syllabes chantées selon le lexique et la règle du e muet ; accent tonique sur la dernière syllabe prononcée du groupe (fin de ligne, avant une virgule) ; les accents vont sur les temps forts (en or), les petits mots (le, de, et…) plutôt sur les temps faibles. Le guide vocal reste dans ${voix ? 'ta tessiture mesurée' : 'une zone moyenne (fais le test de tessiture pour l’ajuster à ta voix)'}.</p>`;
    const q = (s) => el.querySelector(s);
    const P = () => PIECES[piece];
    const slotsDe = (pl) => (decale ? pl.slots.map((x) => ({ ...x, s: Math.min(31, x.s + 2), d: Math.max(1, Math.min(x.d, 32 - x.s - 2)) })) : pl.slots);
    const lignes = () => q('.pl-texte').value.split('\n').map((l) => l.trim()).filter(Boolean);

    function rendre() {
      const L = lignes(); actif = Math.min(actif, Math.max(0, L.length - 1));
      q('.pl-info').textContent = `${P().ton} · ${P().bpm} BPM · une ligne = deux mesures (${(8 * 60 / P().bpm).toFixed(1).replace('.', ',')} s)`;
      q('.pl-lignes').innerHTML = L.map((l, i) => { const n = syllabes(l).length; return `<li class="${i === actif ? 'on' : ''}" data-l="${i}"><span>${esc(l)}</span><b>${n} syll.</b></li>`; }).join('');
      const box = q('.pl-versions');
      if (!L.length) { box.innerHTML = '<div class="panel muted">Écris une première ligne à gauche : les placements apparaissent ici.</div>'; return; }
      const syl = syllabes(L[actif]);
      const res = PLACEMENTS.map((pl, v) => { const sl = slotsDe(pl); const r = placer(syl, sl); return { pl, sl, r, notes: melodie(syl, r, sl, P(), voix, v) }; }).sort((a, b) => b.r.note - a.r.note);
      box.innerHTML = `<h2>« ${esc(L[actif])} » <small class="muted">${syl.length} syllabes chantées</small></h2>` + res.map(({ pl, sl, r, notes }, k) => {
        const cases = [...Array(32)].map((_, s) => `<i class="${s % 4 === 0 ? 'b' : ''} ${s % 16 === 0 ? 'm' : ''} ${sl.some((x) => x.s === s && x.f) ? 'f' : ''}"></i>`).join('');
        const blocs = syl.map((s, i) => { const k2 = r.pos[i]; if (k2 < 0) return ''; const x = sl[k2]; return `<span class="pl-syl ${s.accent === 2 ? 'a2' : s.accent ? 'a1' : ''} ${x.f ? 'sur-f' : ''}" style="left:${(x.s / 32) * 100}%;width:${(x.d / 32) * 100}%" data-i="${i}"><b>${esc(s.txt)}</b>${guide ? `<small>${nomNote(notes[i])}</small>` : ''}</span>`; }).join('');
        const conseils = [];
        if (r.trop) conseils.push(`<b class="neg">${r.trop} syllabe${r.trop > 1 ? 's' : ''} de trop</b> : enlève-en ${r.trop}, ou prends un placement plus serré.`);
        else if (r.libres > 2) conseils.push(`${r.libres} places libres : tu peux allonger la ligne, ou la laisser respirer.`);
        else conseils.push(`<b class="pos">${syl.length} syllabes pour ${sl.length} places</b> : ça rentre.`);
        if (r.aCote.length) conseils.push(`L’accent de « ${esc(r.aCote.join(' », « '))} » tombe à côté du temps : déplace le mot, ou change de placement.`);
        if (r.petitsForts.length) conseils.push(`« ${esc([...new Set(r.petitsForts)].join(' », « '))} » sur un temps fort : un petit mot y sonne appuyé.`);
        return `<article class="panel pl-v" data-k="${k}" data-id="${pl.id}">
          <header><h3>${esc(pl.nom)}</h3><span class="pl-note" style="--n:${r.note}">${r.note} %</span><button class="btn small" data-p="jouer" data-id="${pl.id}">▶ Écouter</button></header>
          <p class="muted small">${esc(pl.idee)} Idéal : ${sl.length} syllabes.</p>
          <div class="pl-piste"><div class="pl-cases">${cases}</div>${blocs}<div class="pl-tete"></div></div>
          <p class="pl-conseil small">${conseils.join(' ')}</p>
        </article>`;
      }).join('');
    }

    async function tampon(id) {
      if (!tampons[id]) tampons[id] = fetch(PIECES[id].url).then((r) => r.arrayBuffer()).then((b) => audio().decodeAudioData(b));
      return tampons[id];
    }
    function arreter() {
      cancelAnimationFrame(raf);
      if (lecture) { lecture.src.forEach((s) => { try { s.stop(); } catch { /* déjà arrêtée */ } }); lecture = null; }
      el.querySelectorAll('.pl-tete').forEach((t) => { t.style.opacity = 0; });
      el.querySelectorAll('[data-p=jouer]').forEach((b) => { b.textContent = '▶ Écouter'; });
    }
    // Joue la pièce depuis un temps fort : une mesure d'élan, puis chaque ligne sur deux mesures, avec le guide vocal.
    async function jouer(suite, bouton) {
      arreter();
      const c = audio(); await c.resume(); const p = P();
      if (guide) prechargerSons(['voix']);
      const buf = await tampon(piece);
      const noire = 60 / p.bpm; const dc = noire / 4; const mesure = 4 * noire;
      const depart = p.t1 + 4 * mesure; // un premier temps, quelques mesures après le début de la boucle
      const t0 = c.currentTime + 0.15; const t1 = t0 + mesure; // la mesure d'élan
      const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain(); g.gain.value = guide ? 0.7 : 0.9;
      src.connect(g).connect(out()); src.start(t0, depart); const fin = t1 + suite.length * 2 * mesure + 0.3; src.stop(fin + 0.6);
      g.gain.setValueAtTime(g.gain.value, fin); g.gain.linearRampToValueAtTime(0.0001, fin + 0.5);
      lecture = { src: [src] };
      suite.forEach((it, j) => {
        if (!guide) return;
        it.syl.forEach((s, i) => { const k = it.r.pos[i]; if (k < 0) return; const x = it.sl[k]; joue('voix', it.notes[i], { when: t1 + j * 2 * mesure + x.s * dc, dur: Math.max(0.12, x.d * dc * 0.9), vel: s.accent ? 0.9 : 0.7 }); });
      });
      if (bouton) bouton.textContent = '■ Arrêter';
      const tick = () => {
        const t = c.currentTime;
        if (!lecture || t > fin) { arreter(); return; }
        const j = Math.floor((t - t1) / (2 * mesure)); const it = suite[Math.max(0, Math.min(suite.length - 1, j))];
        const pos = ((t - t1) - j * 2 * mesure) / (2 * mesure);
        el.querySelectorAll('.pl-tete').forEach((h) => { h.style.opacity = 0; });
        const carte = it.carte && el.querySelector(it.carte);
        if (carte && t >= t1) { const h = carte.querySelector('.pl-tete'); h.style.opacity = 1; h.style.left = `${pos * 100}%`; }
        if (it.ligne != null && t >= t1) el.querySelectorAll('.pl-lignes li').forEach((li) => li.classList.toggle('chante', +li.dataset.l === it.ligne));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const versionDe = (texte, id, v) => { const pl = PLACEMENTS.find((x) => x.id === id); const sl = slotsDe(pl); const syl = syllabes(texte); const r = placer(syl, sl); return { syl, sl, r, notes: melodie(syl, r, sl, P(), voix, v) }; };

    el.addEventListener('input', (e) => { if (e.target.classList.contains('pl-texte')) { store.set('placerTexte', e.target.value); arreter(); rendre(); } });
    el.addEventListener('change', (e) => {
      const p = e.target.dataset.p;
      if (p === 'piece') { piece = e.target.value; store.set('placerPiece', piece); arreter(); rendre(); }
      if (p === 'guide') { guide = e.target.checked; rendre(); }
      if (p === 'decale') { decale = e.target.checked; arreter(); rendre(); }
    });
    el.addEventListener('click', async (e) => {
      const li = e.target.closest('.pl-lignes li'); if (li) { actif = +li.dataset.l; arreter(); rendre(); return; }
      const b = e.target.closest('[data-p]'); const p = b?.dataset.p;
      if (p === 'jouer') {
        if (b.textContent.startsWith('■')) { arreter(); return; }
        const L = lignes(); const v = PLACEMENTS.findIndex((x) => x.id === b.dataset.id);
        const it = versionDe(L[actif], b.dataset.id, v);
        jouer([{ ...it, carte: `.pl-v[data-id="${b.dataset.id}"]`, ligne: actif }, { ...it, carte: `.pl-v[data-id="${b.dataset.id}"]`, ligne: actif }], b);
      }
      if (p === 'tout') {
        const L = lignes(); if (!L.length) return;
        // Pour chaque ligne, son meilleur placement : la chanson entière, posée sur la pièce.
        const suite = L.map((l, i) => { const best = PLACEMENTS.map((pl, v) => ({ v, id: pl.id, ...versionDe(l, pl.id, v) })).sort((a, z) => z.r.note - a.r.note)[0]; return { ...best, ligne: i }; });
        jouer(suite, null);
      }
      if (p === 'garder') {
        const L = lignes(); if (!L.length) return;
        try { await saveEntry({ type: 'texte', title: L[0].slice(0, 80), body: L.join('\n'), data: { journal: true, date: new Date().toISOString().slice(0, 10), invite: `Placé sur ${P().nom}`, stage: 0 } }); toast('Dans le journal.'); } catch (err) { toast(err.message); }
      }
    });
    loadLexique().then(rendre); rendre();
    return () => arreter();
  },
};
