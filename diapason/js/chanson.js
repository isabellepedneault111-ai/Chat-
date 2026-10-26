// Nos chansons dans le studio : une chanson a un nom, des parties (intro, couplet, refrain, pont…) avec chacune
// sa suite d'accords, et un ordre (Couplet 1, Refrain, Couplet 2 = le même couplet…). On joue une partie ou
// toute la chanson d'un bout à l'autre, avec le beat. Les chansons sont partagées dans l'espace : l'autre les voit.
import { espace, saveEntry, uid } from './espace.js';
import { clavierDe } from './doigte.js';
import { store, toast } from './ui.js';
import { FR, chordName, chordIntervals } from './music.js';
import { accord, prechargerSons } from './sampler.js';
import { fichierMidi } from './materiel.js';

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

// Créer un morceau de n'importe où (le mur, l'accueil) : il naît avec un couplet et un refrain à changer.
export async function creerChanson(nom) { const ch = neuve(nom); await garder(ch); return ch; }
export const nomsDeChansons = () => lesChansons().map((c) => c.nom).filter(Boolean);
export const chansonNommee = (nom) => lesChansons().find((c) => c.nom === nom) || null;

// ctx : { jouer(accords absolus [[note, qualité, temps]], nom, étiquettes par accord), actuels() → la grille du studio }
export function chansonTab(body, ctx) {
  const voulue = (location.hash.match(/[?&]ch=([\w-]+)/) || [])[1];
  let ch = lesChansons().find((c) => c.id === voulue) || lesChansons()[0] || null; let t = 0;
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
          <span class="ge-ka">${clavierDe(c[0], c[1], { titre: chordName(c[0], c[1]) })}</span><button class="icon-btn tiny" data-ch="ecoute" aria-label="Écouter">♪</button>${s.chords.length > 1 ? '<button class="icon-btn tiny" data-ch="moins" aria-label="Retirer">✕</button>' : ''}</li>`).join('')}</ol>
        <button class="btn small" data-ch="plus">+ Accord</button>
      </article>`).join('')}</div>
      <div class="ec-row ch-exports"><span class="muted small">Exporter :</span><button class="btn small" data-ch="mid">⬇ La partition (MIDI)</button><button class="btn small" data-ch="txt">⬇ La grille (texte)</button><button class="btn small" data-ch="copier">Copier la grille</button></div>
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
    if (k === 'mid' || k === 'txt' || k === 'copier') { exporter(k); return; }
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
  // Les exports : la partition MIDI (deux pistes en une : les accords au piano, la basse), au tempo du studio,
  // et la grille en texte, partie par partie, comme une feuille d'accords de musicien.
  function exporter(k) {
    const et = etiquettes(); const bpm = ctx.tempo?.() || 92; const temps = 60 / bpm;
    if (k === 'mid') {
      const ev = [{ t: 0, d: [0xc0, 0] }, { t: 0, d: [0xc1, 32] }]; let t = 0; // canal 1 : piano ; canal 2 : basse
      ch.ordre.forEach((id) => (sec(id)?.chords || []).forEach(([r, q, b]) => {
        const dur = b * temps; chordIntervals(q).forEach((iv) => { const m = 60 + r + iv - (r >= 7 ? 12 : 0); ev.push({ t, d: [0x90, m, 76] }, { t: t + dur * 0.98, d: [0x80, m, 0] }); });
        ev.push({ t, d: [0x91, 36 + r, 90] }, { t: t + dur * 0.95, d: [0x81, 36 + r, 0] }); t += dur;
      }));
      telecharger(fichierMidi(ev.sort((a, b2) => a.t - b2.t), bpm), 'mid'); return;
    }
    const lignes = [`${ch.nom}`, `${bpm} BPM · 4 temps par mesure`, ''];
    const vus = new Set();
    ch.ordre.forEach((id, i) => {
      const s2 = sec(id); if (!s2) return;
      if (vus.has(id)) { lignes.push(`${et[i]} : comme avant`); return; } vus.add(id);
      const mes = []; let cur = []; let n = 0;
      s2.chords.forEach(([r, q, b]) => { let reste = b; const nom = chordName(r, q); let premier = true; while (reste > 0) { const place = Math.min(reste, 4 - n); cur.push(premier ? nom : '·'); for (let j = 1; j < place; j++) cur.push('·'); premier = false; n += place; reste -= place; if (n === 4) { mes.push(cur.join(' ')); cur = []; n = 0; } } });
      if (cur.length) mes.push(cur.join(' '));
      lignes.push(`${et[i]}`); for (let j = 0; j < mes.length; j += 4) lignes.push(`| ${mes.slice(j, j + 4).join(' | ')} |`); lignes.push('');
    });
    const txt = `${lignes.join('\n')}\n`;
    if (k === 'copier') { navigator.clipboard?.writeText(txt).then(() => toast('Grille copiée.')).catch(() => toast('Copie refusée par le navigateur.')); return; }
    telecharger(new Blob([txt], { type: 'text/plain;charset=utf-8' }), 'txt');
  }
  const telecharger = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${ch.nom.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'chanson'}.${ext}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  rendre();
}
