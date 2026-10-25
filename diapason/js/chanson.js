// Nos chansons dans le studio : une chanson a un nom, des parties (intro, couplet, refrain, pont…) avec chacune
// sa suite d'accords, et un ordre (Couplet 1, Refrain, Couplet 2 = le même couplet…). On joue une partie ou
// toute la chanson d'un bout à l'autre, avec le beat. Les chansons sont partagées dans l'espace : l'autre les voit.
import { espace, saveEntry, uid } from './espace.js';
import { store, toast } from './ui.js';
import { FR, chordName, chordIntervals } from './music.js';
import { accord, prechargerSons } from './sampler.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PARTIES = ['Intro', 'Couplet', 'Pré-refrain', 'Refrain', 'Pont', 'Solo', 'Outro'];
const TYPES = [['M', 'majeur'], ['m', 'mineur'], ['7', '7'], ['maj7', 'maj7'], ['m7', 'm7'], ['sus2', 'sus2'], ['sus4', 'sus4'], ['add9', 'add9'], ['m9', 'm9'], ['dim', 'dim'], ['5', '5']];
const DUREES = [[1, '1 t.'], [2, '2 t.'], [3, '3 t.'], [4, '1 mes.'], [6, '1½ mes.'], [8, '2 mes.']];

const lesChansons = () => (espace.connected ? espace.entries.filter((e) => e.type === 'chanson').map((e) => ({ ...e.data, id: e.id })) : store.get('chansonsLocal', []));
async function garder(ch) {
  if (!espace.connected) { const l = store.get('chansonsLocal', []).filter((x) => x.id !== ch.id); store.set('chansonsLocal', [ch, ...l]); return; }
  const { id, ...data } = ch;
  await saveEntry({ id, type: 'chanson', title: ch.nom, data });
}
const neuve = (nom) => { const c = { id: uid(), nom: 'Couplet', chords: [[0, 'M', 4], [9, 'm', 4], [5, 'M', 4], [7, 'M', 4]] }; const r = { id: uid(), nom: 'Refrain', chords: [[5, 'M', 4], [7, 'M', 4], [0, 'M', 4], [0, 'M', 4]] }; return { id: uid(), nom, sections: [c, r], ordre: [c.id, r.id, c.id, r.id] }; };

// ctx : { jouer(accords absolus [[note, qualité, temps]], nom, étiquettes par accord), actuels() → la grille du studio }
export function chansonTab(body, ctx) {
  let ch = lesChansons()[0] || null; let t = 0;
  const sauver = () => { clearTimeout(t); t = setTimeout(() => garder(ch).catch((e) => toast(e.message)), 600); };
  const sec = (id) => ch.sections.find((s) => s.id === id);
  // Le numéro de passage : « Couplet 1 », « Couplet 2 »…
  const etiquettes = () => { const n = {}; return ch.ordre.map((id) => { const s = sec(id); if (!s) return ''; n[id] = (n[id] || 0) + 1; const total = ch.ordre.filter((x) => x === id).length; return total > 1 ? `${s.nom} ${n[id]}` : s.nom; }); };
  function rendre() {
    const toutes = lesChansons();
    if (!ch) {
      body.innerHTML = `<div class="panel"><h2>Nos chansons</h2><p class="muted">Monte une chanson entière : ses parties (couplet, refrain, pont…), les accords de chacune, et l’ordre. Puis joue-la d’un bout à l’autre avec le beat.</p>
        <div class="ec-row"><input class="input" data-ch="nouveau-nom" placeholder="Nom de la chanson (ex. : Projet 1)" maxlength="60"><button class="btn primary" data-ch="creer">Créer la chanson</button></div></div>`;
      return;
    }
    const et = etiquettes();
    body.innerHTML = `<div class="panel ch-panel">
      <div class="panel-head"><h2>Nos chansons</h2>
        <select data-ch="choisir">${toutes.map((c) => `<option value="${esc(c.id)}" ${c.id === ch.id ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}<option value="+">+ Nouvelle chanson</option></select></div>
      <label class="field"><span>Nom</span><input class="input" data-ch="nom" value="${esc(ch.nom)}" maxlength="60"></label>
      <h3>L’ordre de la chanson</h3>
      <p class="muted small">Ajoute les parties dans l’ordre où on les joue. Une partie qui revient garde ses accords : « Couplet 2 » = le même couplet.</p>
      <ol class="ch-ordre">${ch.ordre.map((id, i) => `<li data-o="${i}"><b>${esc(et[i])}</b><span class="ch-mini">${(sec(id)?.chords || []).map(([r, q]) => chordName(r, q)).join(' ')}</span>
        <button class="icon-btn tiny" data-ch="gauche" aria-label="Plus tôt">◀</button><button class="icon-btn tiny" data-ch="droite" aria-label="Plus tard">▶</button><button class="icon-btn tiny" data-ch="retirer" aria-label="Retirer">✕</button></li>`).join('')}</ol>
      <div class="ch-ajout">${ch.sections.map((s) => `<button class="chip" data-ch="ajouter" data-s="${s.id}">+ ${esc(s.nom)}</button>`).join('')}</div>
      <div class="ec-row"><button class="btn primary" data-ch="tout">▶ Jouer toute la chanson</button><span class="muted small">${ch.ordre.length} parties · ${ch.ordre.reduce((a, id) => a + (sec(id)?.chords || []).reduce((x, c) => x + c[2], 0), 0) / 4} mesures</span></div>
      <h3>Les parties et leurs accords</h3>
      <div class="ch-sections">${ch.sections.map((s) => `<article class="ch-sec" data-s="${s.id}">
        <header><input class="input ch-secnom" data-ch="secnom" value="${esc(s.nom)}" list="ch-noms" maxlength="30"><button class="btn small" data-ch="jouer">▶ Jouer</button><button class="btn small" data-ch="dupliquer">Dupliquer</button>${ch.sections.length > 1 ? '<button class="icon-btn tiny" data-ch="supprimer" aria-label="Supprimer la partie">✕</button>' : ''}</header>
        <ol class="ch-acc">${s.chords.map((c, i) => `<li data-i="${i}">
          <select data-ch="r">${FR.map((n, k) => `<option value="${k}" ${k === c[0] ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select data-ch="q">${TYPES.map(([v, l]) => `<option value="${v}" ${v === c[1] ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <select data-ch="b">${DUREES.map(([v, l]) => `<option value="${v}" ${v === c[2] ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <button class="icon-btn tiny" data-ch="ecoute" aria-label="Écouter">♪</button>${s.chords.length > 1 ? '<button class="icon-btn tiny" data-ch="moins" aria-label="Retirer">✕</button>' : ''}</li>`).join('')}</ol>
        <button class="btn small" data-ch="plus">+ Accord</button>
      </article>`).join('')}</div>
      <div class="ec-row"><button class="btn" data-ch="nouvelle-partie">+ Nouvelle partie</button><button class="btn" data-ch="depuis-studio">+ Partie avec les accords du studio</button></div>
      <datalist id="ch-noms">${PARTIES.map((p) => `<option value="${p}">`).join('')}</datalist>
      <p class="muted small">${espace.connected ? 'Chaque changement est gardé et partagé : l’autre voit la chanson dans son studio.' : 'Gardé sur cet appareil.'}</p>
    </div>`;
  }
  body.addEventListener('change', (e) => {
    const k = e.target.dataset.ch; if (!k) return;
    if (k === 'choisir') { if (e.target.value === '+') { ch = null; rendre(); return; } ch = lesChansons().find((c) => c.id === e.target.value); rendre(); return; }
    if (k === 'nom') { ch.nom = e.target.value.trim() || ch.nom; sauver(); return; }
    const se = e.target.closest('[data-s]'); const s = se && sec(se.dataset.s);
    if (k === 'secnom' && s) { s.nom = e.target.value.trim() || s.nom; sauver(); rendre(); return; }
    const li = e.target.closest('[data-i]');
    if (s && li && ['r', 'q', 'b'].includes(k)) { const c = s.chords[+li.dataset.i]; c[{ r: 0, q: 1, b: 2 }[k]] = k === 'q' ? e.target.value : +e.target.value; sauver(); rendre(); }
  });
  body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ch]'); const k = b?.dataset.ch; if (!k || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    if (k === 'creer') { const nom = body.querySelector('[data-ch=nouveau-nom]').value.trim() || 'Nouvelle chanson'; ch = neuve(nom); garder(ch).catch((err) => toast(err.message)); rendre(); return; }
    const oi = b.closest('[data-o]'); const se = b.closest('[data-s]'); const s = se && sec(se.dataset.s); const li = b.closest('[data-i]');
    if (k === 'ajouter') { ch.ordre.push(b.dataset.s); }
    if (k === 'retirer' && oi) ch.ordre.splice(+oi.dataset.o, 1);
    if ((k === 'gauche' || k === 'droite') && oi) { const i = +oi.dataset.o; const j = i + (k === 'gauche' ? -1 : 1); if (j >= 0 && j < ch.ordre.length) [ch.ordre[i], ch.ordre[j]] = [ch.ordre[j], ch.ordre[i]]; }
    if (k === 'tout') { const et = etiquettes(); const acc = []; const marques = []; ch.ordre.forEach((id, i) => { (sec(id)?.chords || []).forEach((c, j) => { acc.push(c); marques.push(j === 0 ? et[i] : ''); }); }); if (acc.length) ctx.jouer(acc, ch.nom, marques); return; }
    if (k === 'jouer' && s) { ctx.jouer(s.chords, `${ch.nom} · ${s.nom}`, s.chords.map((_, j) => (j === 0 ? s.nom : ''))); return; }
    if (k === 'ecoute' && s && li) { const [r, q] = s.chords[+li.dataset.i]; prechargerSons(['piano']); accord('piano', chordIntervals(q).map((iv) => 52 + ((r + 8) % 12) + iv), { dur: 1.3, vel: 0.6 }); return; }
    if (k === 'plus' && s) { const d = s.chords[s.chords.length - 1]; s.chords.push([(d[0] + 5) % 12, 'M', 4]); }
    if (k === 'moins' && s && li) s.chords.splice(+li.dataset.i, 1);
    if (k === 'dupliquer' && s) { const n = { id: uid(), nom: `${s.nom} bis`, chords: s.chords.map((c) => [...c]) }; ch.sections.push(n); }
    if (k === 'supprimer' && s) { ch.sections = ch.sections.filter((x) => x !== s); ch.ordre = ch.ordre.filter((x) => x !== s.id); }
    if (k === 'nouvelle-partie') { const reste = PARTIES.find((p) => !ch.sections.some((x) => x.nom === p)) || 'Partie'; ch.sections.push({ id: uid(), nom: reste, chords: [[0, 'M', 4], [7, 'M', 4]] }); }
    if (k === 'depuis-studio') ch.sections.push({ id: uid(), nom: 'Partie du studio', chords: ctx.actuels() });
    sauver(); rendre();
  });
  rendre();
}
