// La cathédrale : on choisit une clé de voûte (quelques nombres), le labo bâtit l'œuvre à trois vitesses
// (forme, rythme, harmonie), et on décide où mettre la lumière : quelle famille de l'orchestre chante chaque partie,
// et si l'ensemble penche vers le rythme ou vers l'harmonie. Puis on écoute, on garde, on exporte.
import { toast, store, autoCanvas, animate } from '../ui.js';
import { lampeHTML, brancherLampe } from '../lampe.js';
import { FR } from '../music.js';
import { espace, saveEntry, uploadAudio } from '../espace.js';
import { composer, jouer, rendre, charger, evenementsMidi, FAMILLES, RYTHME_DEFAUT, cleDepuisNotes, segmentsMidi, accordsDesSegments, cathedraleDuJeu } from '../cathedrale.js';
import { onNotes, detecter, appareils, sortiesMidi, filet, instantane } from '../materiel.js';
import { createListener } from '../instrument.js';
import { chordIntervals } from '../music.js';
import { wav, trouverAccords } from '../oreille.js';
import { fichierMidi } from '../materiel.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CLES = [
  ['naturel', '4 : 5 : 6 : 7', 'L’accord naturel', 'La septième « des harmoniques », plus douce que celle du piano.', [4, 5, 6, 7]],
  ['majeur', '4 : 5 : 6', 'Majeur pur', 'Lumineux, stable : trois parties qui s’ouvrent.', [4, 5, 6]],
  ['mineur', '10 : 12 : 15', 'Mineur', 'Plus sombre, des parties plus longues et tendues.', [10, 12, 15]],
  ['quinte', '2 : 3', 'La quinte', 'Deux parties, un 3 contre 2 : la plus ancienne des voûtes.', [2, 3]],
  ['sentier', '5 : 7 : 9 : 11', 'Hors sentier', 'Des rapports que le piano ne sait pas jouer : étrange et beau.', [5, 7, 9, 11]],
  ['etoile', '8 : 9 : 10 : 12 : 15', 'L’étoile', 'Cinq parties, une gamme pentatonique en intonation juste.', [8, 9, 10, 12, 15]],
];
const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const COUL = { cordes: '#e8c27a', bois: '#93b08e', cuivres: '#f0875a', choeur: '#b89be6', harpe: '#9fe0c3', celesta: '#7fb1f0', silence: '#6d655a' };
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const nomNote = (m) => { const r = Math.round(m); const c = Math.round((m - r) * 100); return `${FR[((r % 12) + 12) % 12]}${c ? ` <small>${c > 0 ? '+' : ''}${c}¢</small>` : ''}`; };

export default {
  id: 'cathedrale',
  mount(el) {
    const du = store.get('laboCle', null);
    let etat = store.get('cathedrale', { cle: du || [4, 5, 6, 7], tonique: 50, duree: 120, axe: 0.5, lumieres: [] });
    if (du && location.hash.includes('du-labo')) etat = { ...etat, cle: du, lumieres: [] };
    let oeuvre = null; let lecteur = null; let anim = null;
    const garder = () => store.set('cathedrale', etat);
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Le labo · La cathédrale</p>
        <h1>Quelques nombres, tout un orchestre.</h1>
        <p class="muted">Une clé de voûte, jouée à trois vitesses en même temps. Très lente, elle donne <b>la forme</b> (les parties durent 4, 5, 6, 7) ; moyenne, <b>le rythme</b> (4 contre 5 contre 6 contre 7) ; rapide, <b>l’harmonie</b> (les mêmes rapports entre les fréquences : un accord en intonation juste). Le labo bâtit la cathédrale ; vous décidez où mettre la lumière.</p>
      </div></div>
      <section class="ca-scene"><canvas class="ca-cv" aria-label="La cathédrale : une arche par partie, la rosace de la clé de voûte, et la lumière qui avance"></canvas>
        <div class="ca-lecture"><button class="btn primary big" data-ca="jouer">▶ Bâtir et écouter</button><span class="ca-temps mono"></span>${lampeHTML()}</div></section>
      <section class="panel ca-disques-p"><div class="panel-head"><h2>Les disques</h2><span class="muted small">un disque par nombre de la clé : il frappe autant de fois par tour, et sonne dans l’accord</span></div>
        <div class="ca-disques"></div></section>
      <section class="panel ca-branche"><div class="panel-head"><h2>Ce que Frog branche</h2><span class="muted small">un accord tenu, ou toute une minute de jeu prise dans le filet, devient la cathédrale ; elle peut aussi jouer sur ses appareils</span></div>
        <div class="ca-row"><button class="btn" data-ca="ecouter">● Écouter mon matériel</button><button class="btn" data-ca="filet">◎ La cathédrale de mon jeu</button><label class="check"><input type="checkbox" data-ca="suivre"> Suivre mon jeu (chaque accord tenu devient la clé)</label>
          <label class="field"><span>Jouer aussi sur</span><select data-ca="sortie"><option value="">Aucun appareil MIDI</option></select></label></div>
        <p class="ca-entendu muted small">Branche un clavier MIDI ou une entrée audio (Mon matériel), puis joue un accord et tiens-le. Ou tends le filet, improvise une minute, et touche « La cathédrale de mon jeu ».</p>
        <div class="ca-jeu" hidden></div></section>
      <div class="ca-grille">
        <section class="panel"><h2>La clé de voûte</h2>
          <div class="ca-cles">${CLES.map(([k, l, n, d]) => `<button class="ca-cle" data-cle="${k}"><b>${l}</b><span>${n}</span><small>${d}</small></button>`).join('')}${du ? `<button class="ca-cle" data-cle="labo"><b>${du.join(' : ')}</b><span>Tes disques du labo</span><small>La clé que tu as faite tourner.</small></button>` : ''}</div>
          <label class="field"><span>Ou tes nombres</span><input class="input mono" data-ca="nombres" placeholder="4 5 6 7" value="${esc(etat.cle.join(' '))}"></label>
          <div class="ca-row">
            <label class="field"><span>La note de départ</span><select data-ca="tonique">${[...Array(12)].map((_, i) => `<option value="${45 + i}" ${45 + i === etat.tonique ? 'selected' : ''}>${FR[(45 + i) % 12]}</option>`).join('')}</select></label>
            <label class="field"><span>Durée</span><select data-ca="duree">${[[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']].map(([v, l]) => `<option value="${v}" ${v === etat.duree ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          </div>
        </section>
        <section class="panel"><h2>Où mettre la lumière</h2>
          <p class="muted small">Une partie par nombre de la clé, aussi longue que son nombre. Choisis la famille qui chante chacune.</p>
          <div class="ca-parties"></div>
          <label class="ca-axe"><span>Tout rythme</span><input type="range" min="0" max="100" data-ca="axe" value="${Math.round(etat.axe * 100)}" aria-label="Du rythme à l’harmonie"><span>Tout harmonie</span></label>
          <p class="muted small ca-axe-txt"></p>
        </section>
      </div>
      <section class="panel ca-trois"><h2>Les trois vitesses de cette clé</h2><div class="ca-tableau"></div></section>
      <section class="panel"><h2>Garder l’œuvre</h2>
        <div class="ca-row"><input class="input" data-ca="titre" maxlength="80" value="Cathédrale ${esc(etat.cle.join(':'))}" aria-label="Titre">
          <button class="btn" data-ca="wav">⬇ Le son (WAV)</button><button class="btn" data-ca="mid">⬇ La partition (MIDI)</button>${espace.connected ? '<button class="btn primary" data-ca="mur">Garder au mur</button>' : ''}</div>
        <p class="muted small">Le MIDI s’ouvre dans n’importe quel logiciel, une famille par piste (cordes, cuivres, bois, chœur…), pour que Frog la reprenne, la réorchestre, la défasse. Les hauteurs y sont arrondies au demi-ton ; le WAV garde l’intonation juste.</p>
      </section>
      <details class="panel"><summary><h2>D’où vient l’idée</h2></summary>
        <p>Henry Cowell, <i>New Musical Resources</i> (1930) : un accord est un rythme très rapide. Un accord majeur, c’est 4 contre 5 contre 6 vibrations ; ralenti, c’est une polyrythmie. Il a fait construire avec Léon Theremin le Rhythmicon (1931), qui jouait exactement ça. Karlheinz Stockhausen, « …wie die Zeit vergeht… » (1957) : hauteur, rythme et forme sont un seul continuum de durées. Et Wendy Carlos, qui a fait sortir tout un orchestre d’un seul synthétiseur.</p>
        <p>Les sons : l’orchestre du jeu FluidR3 de Frank Wen (licence MIT), accordé à la volée.</p>
      </details>`;
    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.ca-cv'));

    // Les disques : un par nombre de la clé de voûte, réglable (nombre, instrument, volume, sourdine), qui tournent à l'écoute.
    const INSTR = [['timbales', 'Timbales'], ['pizz', 'Pizzicati'], ['harpe', 'Harpe'], ['celesta', 'Célesta'], ['cor', 'Cor'], ['cuivres', 'Cuivres'], ['flute', 'Flûte'], ['clarinette', 'Clarinette'], ['choeur', 'Chœur']];
    const DCOUL = ['#e8c27a', '#93b08e', '#f0875a', '#b89be6', '#7fb1f0', '#9fe0c3'];
    function disqueSVG(n, c) { const pts = [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(30 + 22 * Math.cos(a)).toFixed(1)}" cy="${(30 + 22 * Math.sin(a)).toFixed(1)}" r="3.2"/>`; }).join(''); return `<svg viewBox="0 0 60 60" class="ca-dsvg" style="--c:${c}"><circle cx="30" cy="30" r="22" class="anneau"/><g class="tourne">${pts}<line x1="30" y1="30" x2="30" y2="8"/></g><text x="30" y="35" text-anchor="middle">${n}</text></svg>`; }
    function rendreDisques() {
      const voix = etat.voix || [];
      q('.ca-disques').innerHTML = etat.cle.map((n, j) => { const v = voix[j] || {}; const b = v.banque || RYTHME_DEFAUT[j % RYTHME_DEFAUT.length];
        return `<div class="ca-disque ${v.muet ? 'muet' : ''}" data-d="${j}">${disqueSVG(n, DCOUL[j % 6])}
          <div class="ca-dreg"><div class="ca-dnb"><button class="icon-btn tiny" data-dm="moins" aria-label="Moins">−</button><b>${n}</b><button class="icon-btn tiny" data-dm="plus" aria-label="Plus">+</button><button class="icon-btn tiny ${v.muet ? 'on' : ''}" data-dm="muet" aria-label="Sourdine" title="Sourdine">M</button>${etat.cle.length > 2 ? '<button class="icon-btn tiny" data-dm="retirer" aria-label="Retirer">×</button>' : ''}</div>
            <select data-dm="banque" aria-label="Instrument du disque">${INSTR.map(([k, l]) => `<option value="${k}" ${k === b ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <label class="ca-dvol"><span>volume</span><input type="range" min="0" max="150" value="${Math.round((v.vol ?? 1) * 100)}" data-dm="vol"></label>
            ${Object.entries(REGLAGES).filter(([k]) => v[k] != null).map(([k, [l, mn, mx, pas, fmt]]) => `<label class="ca-dvol"><span>${l}</span><input type="range" min="${mn}" max="${mx}" step="${pas}" value="${v[k]}" data-dr="${k}" aria-label="${l}"><output>${fmt(v[k])}</output><button type="button" class="ca-dx" data-dm="sansreglage" data-k="${k}" aria-label="Retirer ${l}">×</button></label>`).join('')}
            ${Object.keys(REGLAGES).some((k) => v[k] == null) ? `<select class="ca-dplus-r" data-dm="reglage" aria-label="Ajouter un réglage au disque"><option value="">＋ un réglage…</option>${Object.entries(REGLAGES).filter(([k]) => v[k] == null).map(([k, [l, , , , , d, aide]]) => `<option value="${k}" title="${aide}">${l}</option>`).join('')}</select>` : ''}</div></div>`; }).join('')
        + (etat.cle.length < 6 ? '<button class="btn small ca-dplus" data-dm="ajouter">+ Un disque</button>' : '');
    }
    // Les réglages qu'on ajoute à un disque, au choix : [nom, min, max, pas, affichage, valeur de départ, à quoi ça sert].
    const REGLAGES = {
      oct: ['hauteur', -2, 2, 1, (x) => (x > 0 ? `+${x} oct.` : x < 0 ? `${x} oct.` : 'telle quelle'), 0, 'Monter ou descendre le disque d’une ou deux octaves.'],
      pan: ['gauche ↔ droite', -1, 1, 0.1, (x) => (Math.abs(x) < 0.05 ? 'au centre' : x < 0 ? `gauche ${Math.round(-x * 100)} %` : `droite ${Math.round(x * 100)} %`), 0, 'Placer le disque dans l’espace stéréo.'],
      dec: ['décalage', 0, 0.95, 0.05, (x) => `${Math.round(x * 100)} % du pas`, 0.5, 'Frapper en retard, entre les coups : un contretemps.'],
      aer: ['aération', 0, 0.8, 0.05, (x) => `${Math.round(x * 100)} % de silences`, 0.3, 'Retirer des frappes, toujours les mêmes : le rythme respire.'],
      dur: ['durée des notes', 0.1, 2.5, 0.1, (x) => `${x.toFixed(1).replace('.', ',')} s`, 0.3, 'Des frappes sèches ou des notes tenues.'],
      acc: ['accent', 0, 1, 0.05, (x) => `${Math.round(x * 100)} %`, 0.5, 'Appuyer le premier coup de chaque tour.'],
    };
    const majDisque = (j, change) => { const voix = [...(etat.voix || [])]; voix[j] = { ...(voix[j] || {}), ...change }; return voix; };

    function majTout() {
      oeuvre = composer({ cle: etat.cle, tonique: etat.tonique, duree: etat.duree, lumieres: etat.lumieres, axe: etat.axe, voix: etat.voix || [], parties: etat.parties || [] });
      rendreDisques();
      const r = oeuvre.r;
      q('.ca-parties').innerHTML = oeuvre.sections.map((s) => `<div class="ca-partie" style="flex:${s.ratio};--c:${COUL[s.lumiere]}"><b>${ROMAINS[s.i] || s.i + 1} · ${s.ratio}</b><small>${mmss(s.b - s.a)}${s.forme ? ` · sur ${esc(s.forme.nom)}` : ''}</small>
        <select data-lum="${s.i}" aria-label="La lumière sur la partie ${s.i + 1}">${FAMILLES.map(([k, l]) => `<option value="${k}" ${k === s.lumiere ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('');
      q('.ca-axe-txt').textContent = etat.axe < 0.25 ? 'Presque tout en frappes : timbales, pizzicati, harpe, célesta, chacun à son nombre.' : etat.axe > 0.75 ? 'Presque tout en nappes : l’accord tenu par les cordes et les cors, la lumière chante par-dessus.' : 'Les deux à la fois : on entend l’accord, et le même accord qui bat.';
      const f0 = 440 * 2 ** ((etat.tonique - 69) / 12);
      q('.ca-tableau').innerHTML = `<table><thead><tr><th>Nombre</th><th>La forme <small>(très lent)</small></th><th>Le rythme <small>(moyen)</small></th><th>L’harmonie <small>(rapide)</small></th></tr></thead><tbody>
        ${r.map((x, i) => { const s = oeuvre.sections[i]; const m = etat.tonique + 12 * Math.log2(x / r[0]); return `<tr><td class="mono"><b>${x}</b></td><td>Partie ${ROMAINS[i] || i + 1} : ${mmss(s.b - s.a)}</td><td>${x} frappes par tour de 2,4 s</td><td>${(f0 * x / r[0]).toFixed(1).replace('.', ',')} Hz · ${nomNote(m)}</td></tr>`; }).join('')}
      </tbody></table><p class="muted small">Les petits nombres en cents (¢) disent l’écart avec la touche de piano la plus proche : c’est l’intonation juste, ce que le piano ne peut pas jouer.</p>`;
      q('.ca-temps').textContent = `0:00 / ${mmss(oeuvre.duree)}`;
      el.querySelectorAll('[data-cle]').forEach((b) => b.classList.toggle('on', (b.dataset.cle === 'labo' ? du : CLES.find((c) => c[0] === b.dataset.cle)?.[4])?.join() === etat.cle.join()));
      dessiner(lecteur ? lecteur.position() : -1);
    }

    function dessiner(pos) {
      const { ctx, w, h } = cv; if (!w || !oeuvre) return;
      ctx.clearRect(0, 0, w, h); const g = ctx.createRadialGradient(w / 2, h * 0.3, 10, w / 2, h * 0.5, w * 0.7); g.addColorStop(0, '#2a2520'); g.addColorStop(1, '#100e0b'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const M = 24; const base = h - 28; const haut = h * 0.34; const L = w - 2 * M; const X = (t) => M + (t / oeuvre.duree) * L;
      // La rosace : la clé de voûte, un pétale par nombre, l'angle de chacun selon son rapport.
      const cx = w / 2; const cy = Math.max(46, h * 0.17); const R = Math.min(42, h * 0.13);
      ctx.strokeStyle = 'rgba(232,194,122,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      oeuvre.r.forEach((x, i) => { const a = (Math.log2(x / oeuvre.r[0]) % 1) * Math.PI * 2 - Math.PI / 2; const s = oeuvre.sections[i]; const lit = pos >= s.a && pos < s.b;
        ctx.fillStyle = COUL[s.lumiere]; ctx.globalAlpha = lit ? 1 : 0.55; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55, R * 0.42, R * 0.16, a, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1; ctx.fillStyle = '#efe6d2'; ctx.font = '600 11px "Atkinson Hyperlegible", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(oeuvre.r.join(' : '), cx, cy + R + 14);
      // Les arches en ogive : une par partie, plus haute quand son nombre est grand ; dedans, les vitraux du rythme
      // (une colonne par nombre de la clé, autant de vitres que de frappes par tour).
      oeuvre.sections.forEach((s) => {
        const a = X(s.a) + 4; const b = X(s.b) - 4; const mid = (a + b) / 2; const top = base - (base - haut) * (0.62 + 0.38 * s.ratio / Math.max(...oeuvre.r));
        const naissance = top + Math.min((b - a) * 0.55, (base - top) * 0.55); const lit = pos >= s.a && pos < s.b; const c = COUL[s.lumiere];
        const ogive = () => { ctx.beginPath(); ctx.moveTo(a, base); ctx.lineTo(a, naissance); ctx.quadraticCurveTo(a, top + (naissance - top) * 0.2, mid, top); ctx.quadraticCurveTo(b, top + (naissance - top) * 0.2, b, naissance); ctx.lineTo(b, base); };
        ogive(); ctx.fillStyle = lit ? 'rgba(255,227,163,.10)' : 'rgba(239,230,210,.03)'; ctx.fill();
        ctx.save(); ogive(); ctx.clip();
        const n = oeuvre.r.length; const lw = (b - a) / (n + 1);
        oeuvre.r.forEach((x, j) => { const cx0 = a + lw * (j + 0.5) + lw * 0.25; const hautV = naissance - 2; const vitres = Math.min(14, x); const pas = (base - 10 - hautV) / vitres;
          for (let k = 0; k < vitres; k++) { ctx.fillStyle = c; ctx.globalAlpha = lit ? 0.5 + 0.4 * ((k + j) % 2) : 0.16 + 0.08 * ((k + j) % 2); ctx.fillRect(cx0, hautV + k * pas + 1, lw * 0.5, pas - 3); } });
        ctx.globalAlpha = lit ? 0.6 : 0.2; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(mid, (top + naissance) / 2 + 4, Math.min(18, (b - a) * 0.12), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
        ogive(); ctx.strokeStyle = lit ? c : 'rgba(239,230,210,.4)'; ctx.lineWidth = lit ? 2.2 : 1.3; ctx.stroke();
        ctx.fillStyle = lit ? '#fff' : '#b8ad98'; ctx.font = `${lit ? 700 : 500} 13px "Literata", serif`; ctx.textAlign = 'center'; ctx.fillText(`${ROMAINS[s.i] || s.i + 1} · ${s.ratio}`, mid, base + 17);
      });
      // La coda : une petite abside, où tout se pose.
      const [c0, c1] = oeuvre.coda; const ca = X(c0) + 4; const cb = X(c1) - 2; const lc = pos >= c0;
      ctx.beginPath(); ctx.moveTo(ca, base); ctx.lineTo(ca, base - (cb - ca) * 0.9); ctx.arc((ca + cb) / 2, base - (cb - ca) * 0.9, (cb - ca) / 2, Math.PI, 0); ctx.lineTo(cb, base); ctx.strokeStyle = lc ? '#e8c27a' : 'rgba(239,230,210,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#b8ad98'; ctx.font = 'italic 11px "Literata", serif'; ctx.fillText('coda', (ca + cb) / 2, base + 17);
      ctx.strokeStyle = 'rgba(239,230,210,.25)'; ctx.beginPath(); ctx.moveTo(M, base); ctx.lineTo(w - M, base); ctx.stroke();
      if (pos >= 0) { const x = X(Math.min(pos, oeuvre.duree)); const gr = ctx.createLinearGradient(x - 30, 0, x + 30, 0); gr.addColorStop(0, 'rgba(255,227,163,0)'); gr.addColorStop(0.5, 'rgba(255,227,163,.35)'); gr.addColorStop(1, 'rgba(255,227,163,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 30, 0, 60, base); ctx.fillStyle = '#ffe3a3'; ctx.fillRect(x - 1, 8, 2, base - 8); }
    }

    const arreter = () => { lecteur?.arreter(); lecteur = null; anim?.(); anim = null; q('[data-ca=jouer]').textContent = '▶ Bâtir et écouter'; dessiner(-1); q('.ca-temps').textContent = `0:00 / ${mmss(oeuvre.duree)}`; };
    async function lancer() {
      if (lecteur) { arreter(); return; }
      const b = q('[data-ca=jouer]'); b.textContent = 'L’orchestre s’installe…'; await charger();
      lecteur = jouer(oeuvre, { onFin: arreter, sortie: sorties.find((o) => o.id === store.get('caSortie', '')) || null }); b.textContent = '■ Arrêter';
      anim = animate(() => { if (!lecteur) return; const p = lecteur.position(); dessiner(p); q('.ca-temps').textContent = `${mmss(Math.max(0, p))} / ${mmss(oeuvre.duree)}`;
        el.querySelectorAll('.ca-dsvg .tourne').forEach((g) => { g.style.transform = `rotate(${((Math.max(0, p) / 2.4) % 1) * 360}deg)`; }); });
    }
    const titre = () => q('[data-ca=titre]').value.trim() || `Cathédrale ${etat.cle.join(':')}`;
    const telecharger = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${titre().replace(/[^\p{L}\p{N} _:-]+/gu, ' ').replace(/[:\s]+/g, ' ').trim()}.${ext}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
    const changer = (patch) => { const avant = lecteur; if (avant) arreter(); if (patch.cle && patch.cle.length !== etat.cle.length && !('parties' in patch)) patch.parties = []; etat = { ...etat, ...patch }; garder(); majTout(); if (q('[data-ca=titre]') && /^Cathédrale [\d:]+$/.test(q('[data-ca=titre]').value)) q('[data-ca=titre]').value = `Cathédrale ${etat.cle.join(':')}`; };

    el.addEventListener('click', async (e) => {
      const dm = e.target.closest('[data-dm]')?.dataset.dm; const dj = e.target.closest('[data-d]');
      if (dm === 'ajouter') { const cle = [...etat.cle, Math.min(32, Math.max(...etat.cle) + 1)]; q('[data-ca=nombres]').value = cle.join(' '); changer({ cle, lumieres: [] }); return; }
      if (dm === 'sansreglage' && dj) { const voix = majDisque(+dj.dataset.d, {}); delete voix[+dj.dataset.d][e.target.closest('[data-k]').dataset.k]; changer({ voix }); return; }
      if (dj && ['moins', 'plus', 'muet', 'retirer'].includes(dm)) {
        const j = +dj.dataset.d; const cle = [...etat.cle];
        // On saute par-dessus les nombres déjà pris : de 2, « + » passe à 4 si un autre disque a déjà 3.
        const pris = new Set(cle.filter((_, k) => k !== j)); const pas = dm === 'plus' ? 1 : dm === 'moins' ? -1 : 0;
        if (pas) { let x = cle[j] + pas; while (pris.has(x) && x >= 1 && x <= 32) x += pas; if (x < 1 || x > 32) { toast(pas > 0 ? 'Les nombres vont jusqu’à 32.' : 'Le plus petit nombre libre est déjà pris.'); return; } cle[j] = x; }
        if (dm === 'muet') { changer({ voix: majDisque(j, { muet: !(etat.voix?.[j]?.muet) }) }); return; }
        if (dm === 'retirer') { cle.splice(j, 1); const voix = [...(etat.voix || [])]; voix.splice(j, 1); q('[data-ca=nombres]').value = cle.join(' '); changer({ cle, voix, lumieres: [] }); return; }
        q('[data-ca=nombres]').value = cle.join(' '); changer({ cle, lumieres: [] }); return;
      }
      if (e.target.closest('[data-ca=ecouter]')) { ecouterMateriel(); return; }
      if (e.target.closest('[data-ca=filet]')) { depuisFilet(); return; }
      if (e.target.closest('[data-ca=batir]')) { batirDuJeu(); return; }
      const c = e.target.closest('[data-cle]');
      if (c) { const v = c.dataset.cle === 'labo' ? du : CLES.find((x) => x[0] === c.dataset.cle)[4]; q('[data-ca=nombres]').value = v.join(' '); changer({ cle: v, lumieres: [], parties: [] }); return; }
      const a = e.target.closest('[data-ca]')?.dataset.ca;
      if (a === 'jouer') lancer();
      if (a === 'wav' || a === 'mur') {
        const b = e.target; const avant = b.textContent; b.disabled = true; b.textContent = 'L’orchestre joue en coulisse…';
        try {
          const buf = await rendre(oeuvre); const fichier = wav(buf);
          if (a === 'wav') telecharger(fichier, 'wav');
          else { b.textContent = 'J’envoie…'; const au = await uploadAudio(fichier); await saveEntry({ type: 'audio', title: titre(), audio: { ...au, duration: +oeuvre.duree.toFixed(1) }, data: { stage: 0, cathedrale: { cle: etat.cle, tonique: etat.tonique, axe: etat.axe, lumieres: oeuvre.sections.map((s) => s.lumiere) } } }); toast('La cathédrale est au mur.'); }
        } catch (err) { toast(err.message || 'Le rendu n’a pas marché.'); }
        b.disabled = false; b.textContent = avant;
      }
      if (a === 'mid') telecharger(fichierMidi(evenementsMidi(oeuvre)), 'mid');
    });
    el.addEventListener('change', (e) => {
      const dm = e.target.dataset.dm; const dj = e.target.closest('[data-d]');
      if (dm === 'banque' && dj) { changer({ voix: majDisque(+dj.dataset.d, { banque: e.target.value }) }); return; }
      if (dm === 'vol' && dj) { changer({ voix: majDisque(+dj.dataset.d, { vol: +e.target.value / 100 }) }); return; }
      if (dm === 'reglage' && dj && e.target.value) { const k = e.target.value; changer({ voix: majDisque(+dj.dataset.d, { [k]: REGLAGES[k][5] }) }); return; }
      if (e.target.dataset.dr && dj) { changer({ voix: majDisque(+dj.dataset.d, { [e.target.dataset.dr]: +e.target.value }) }); return; }
      if (e.target.dataset.ca === 'sortie') { store.set('caSortie', e.target.value); toast(e.target.value ? 'La cathédrale jouera aussi sur cet appareil (hauteurs arrondies au demi-ton).' : 'Plus d’appareil MIDI en sortie.'); return; }
      if (e.target.dataset.ca === 'suivre') { suivre = e.target.checked; return; }
      const l = e.target.dataset.lum; if (l != null) { const lum = oeuvre.sections.map((s) => s.lumiere); lum[+l] = e.target.value; changer({ lumieres: lum }); return; }
      const a = e.target.dataset.ca;
      if (a === 'nombres') { const v = e.target.value.split(/[^\d]+/).map(Number).filter((x) => x > 0 && x <= 32).slice(0, 6); if (v.length) changer({ cle: v, lumieres: [], parties: [] }); else toast('Des nombres entiers, de 1 à 32 (ex. : 4 5 6 7).'); }
      if (a === 'tonique') changer({ tonique: +e.target.value });
      if (a === 'duree') changer({ duree: +e.target.value });
    });
    el.addEventListener('input', (e) => {
      if (e.target.dataset.dr) { const o = e.target.nextElementSibling; const k = e.target.dataset.dr; if (o) o.textContent = REGLAGES[k][4](+e.target.value); } if (e.target.dataset.ca === 'axe') { etat.axe = +e.target.value / 100; garder(); clearTimeout(e.target._t); e.target._t = setTimeout(() => changer({}), 250); } });
    // ---------- Ce que Frog branche ----------
    let sorties = []; let suivre = false; let offNotes = null; let ecouteAudio = null; const tenues = new Set(); let attente = 0; let propose = null;
    const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
    async function remplirSorties() {
      sorties = await sortiesMidi(); const sel = q('[data-ca=sortie]'); const cur = store.get('caSortie', '');
      sel.innerHTML = `<option value="">Aucun appareil MIDI</option>${sorties.map((o) => `<option value="${esc(o.id)}" ${o.id === cur ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}`;
    }
    function proposer(notes, source) {
      const r = cleDepuisNotes(notes); const box = q('.ca-entendu'); if (!r) { box.textContent = 'Accord trop complexe pour une clé de voûte (des nombres au-delà de 32) : essaie trois ou quatre notes.'; return; }
      propose = r; const noms = [...new Set(notes.map((m) => NOMS[((m % 12) + 12) % 12]))].join(' ');
      box.innerHTML = `${esc(source)} : <b>${noms}</b> → la clé <b class="mono">${r.cle.join(' : ')}</b>, depuis ${NOMS[r.tonique % 12]}. ${suivre ? '<i>Appliquée.</i>' : '<button class="btn small" data-ca="appliquer">En faire la clé de voûte</button>'}`;
      if (suivre) appliquer();
    }
    function appliquer() { if (!propose) return; q('[data-ca=nombres]').value = propose.cle.join(' '); q('[data-ca=tonique]').value = String(propose.tonique); changer({ cle: propose.cle, tonique: propose.tonique, lumieres: [], voix: [], parties: [] }); }
    el.addEventListener('click', (e) => { if (e.target.closest('[data-ca=appliquer]')) appliquer(); });
    async function ecouterMateriel() {
      const b = q('[data-ca=ecouter]');
      if (offNotes || ecouteAudio) { offNotes?.(); offNotes = null; ecouteAudio?.stop(); ecouteAudio = null; b.textContent = '● Écouter mon matériel'; return; }
      await detecter({ demander: true }); await remplirSorties();
      const actifs = appareils().filter((a) => a.actif && a.branche && a.k !== 'app');
      offNotes = onNotes((k, note, vel, on) => {
        if (on) tenues.add(note); else tenues.delete(note);
        clearTimeout(attente); if (tenues.size >= 2) { const l = [...tenues]; const nom = appareils().find((a) => a.k === k)?.nom || 'Ton clavier'; attente = setTimeout(() => proposer(l, nom), 450); }
      });
      const audioIn = actifs.find((a) => a.audio);
      if (audioIn) {
        ecouteAudio = createListener({ deviceId: audioIn.audio, onChord: (m) => proposer(chordIntervals(m.qual).map((iv) => 48 + m.root + iv), audioIn.nom) });
        try { await ecouteAudio.start(); } catch { ecouteAudio = null; }
      }
      b.textContent = '■ Arrêter l’écoute';
      q('.ca-entendu').innerHTML = `À l’écoute : ${actifs.length ? actifs.map((a) => `<b>${esc(a.nom)}</b>`).join(', ') : 'aucun appareil actif (coche-les dans <a href="#/materiel">Mon matériel</a>)'}. Joue un accord et tiens-le.`;
    }
    // ---------- La cathédrale de mon jeu ----------
    // Une minute d'improvisation prise dans le filet : les accords qui ont sonné, combien de temps, combien de fois.
    // Le plus présent donne la clé de voûte ; les parties se posent sur ceux qui reviennent, dans l'ordre du jeu.
    let jeu = null;
    const sec = (x) => `${x.toFixed(x < 10 ? 1 : 0).replace('.', ',')} s`;
    async function depuisJeu({ midi = [], buf = null, nom = 'le filet' }) {
      const box = q('.ca-jeu'); box.hidden = false;
      const frappes = midi.filter((m) => (m.d[0] & 0xf0) === 0x90 && m.d[2]).length; let res = null; let via = '';
      if (frappes >= 3) { res = accordsDesSegments(segmentsMidi(midi)); via = `${frappes} notes MIDI`; }
      if (!res?.accords.length && buf) {
        box.innerHTML = '<p class="muted">J’écoute ta minute, accord par accord…</p>';
        try { const segs = await trouverAccords(buf, 90); res = accordsDesSegments(segs.map((g) => ({ notes: chordIntervals(g.q).map((iv) => 48 + g.r + iv), a: g.a, b: g.b }))); via = 'le son entendu'; } catch { res = null; }
      }
      if (!res?.accords.length) { jeu = null; box.innerHTML = `<p class="muted">Je n’ai pas trouvé d’accord tenu dans ${esc(nom)} (il faut au moins deux notes ensemble pendant un quart de seconde). Une mélodie seule ne fait pas encore de voûte : ajoute la main gauche !</p>`; return; }
      jeu = { res, nom }; const c = cathedraleDuJeu(res); const max = res.accords[0].duree; const t = res.accords[0];
      box.innerHTML = `<p class="small"><b>Ton jeu</b>, dans ${esc(nom)} (${esc(via)}) : ${res.accords.length} accord${res.accords.length > 1 ? 's' : ''} différent${res.accords.length > 1 ? 's' : ''} sur ${sec(res.total)} d’accords tenus.</p>
        <ol class="ca-jeu-l">${res.accords.slice(0, 6).map((a) => `<li><b>${esc(a.nom)}</b><span class="ca-jeu-b"><i style="width:${Math.max(4, (a.duree / max) * 100).toFixed(0)}%"></i></span><span class="mono small">${sec(a.duree)} · ${a.fois} fois · ${a.cle.join(':')}</span></li>`).join('')}</ol>
        <p class="small">Celui qui revient le plus, <b>${esc(t.nom)}</b>, devient la clé de voûte <b class="mono">${t.cle.join(' : ')}</b>. Les parties se posent sur ${c.parties.map((p) => `<b>${esc(p.nom)}</b>`).join(', ')}, dans l’ordre où tu les as joués ; la coda revient à ${esc(t.nom)}. Chaque accord sonne en intonation juste.</p>
        <button class="btn primary" data-ca="batir">Bâtir la cathédrale de ce jeu</button>`;
    }
    function batirDuJeu() {
      if (!jeu) return; const c = cathedraleDuJeu(jeu.res);
      q('[data-ca=nombres]').value = c.cle.join(' '); q('[data-ca=tonique]').value = String(c.tonique); q('[data-ca=titre]').value = 'La cathédrale de mon jeu';
      changer({ cle: c.cle, tonique: c.tonique, parties: c.parties, lumieres: [], voix: [] }); toast('La cathédrale est bâtie sur ton jeu. Touche ▶ pour l’entendre.');
      q('.ca-scene').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function depuisFilet() {
      const box = q('.ca-jeu'); box.hidden = false;
      if (!filet.arme) { box.innerHTML = '<p class="muted">Le filet n’est pas tendu. Touche le filet, en haut (l’anneau d’or), improvise une minute sur ton clavier ou ton instrument branché, puis reviens toucher « La cathédrale de mon jeu ». <a href="#/materiel">Mon matériel</a></p>'; return; }
      const s = instantane(); const pistes = s.pistes.filter((p) => p.k !== 'app'); let buf = null;
      if (pistes.length && s.duree >= 2) { const n = pistes[0].d.length; buf = new AudioBuffer({ length: n, sampleRate: s.sr, numberOfChannels: 1 }); const d = buf.getChannelData(0); pistes.forEach((p) => { for (let i = 0; i < n; i++) d[i] += p.d[i] / pistes.length; }); }
      depuisJeu({ midi: s.midi, buf, nom: `${s.duree < 60 ? `les ${Math.round(s.duree)} secondes` : 'les dernières minutes'} du filet` });
    }
    if (window.__flipCathedrale) { const f = window.__flipCathedrale; window.__flipCathedrale = null; setTimeout(() => { depuisJeu(f); q('.ca-branche').scrollIntoView({ block: 'start' }); }, 0); }

    // Sans demander la permission au chargement : on remplit les sorties seulement si le MIDI est déjà autorisé.
    navigator.permissions?.query({ name: 'midi' }).then((st) => { if (st.state === 'granted') remplirSorties(); }).catch(() => {});

    new ResizeObserver(() => dessiner(lecteur ? lecteur.position() : -1)).observe(q('.ca-cv'));
    majTout();
    const offLampe = brancherLampe(el);
    return () => { lecteur?.arreter(); anim?.(); offNotes?.(); ecouteAudio?.stop(); clearTimeout(attente); offLampe(); };
  },
};
