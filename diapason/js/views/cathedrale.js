// La cathédrale : on choisit une clé de voûte (quelques nombres), le labo bâtit l'œuvre à trois vitesses
// (forme, rythme, harmonie), et on décide où mettre la lumière : quelle famille de l'orchestre chante chaque partie,
// et si l'ensemble penche vers le rythme ou vers l'harmonie. Puis on écoute, on garde, on exporte.
import { toast, store, autoCanvas, animate } from '../ui.js';
import { FR } from '../music.js';
import { espace, saveEntry, uploadAudio } from '../espace.js';
import { composer, jouer, rendre, charger, evenementsMidi, FAMILLES } from '../cathedrale.js';
import { wav } from '../oreille.js';
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
        <div class="ca-lecture"><button class="btn primary big" data-ca="jouer">▶ Bâtir et écouter</button><span class="ca-temps mono"></span></div></section>
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

    function majTout() {
      oeuvre = composer({ cle: etat.cle, tonique: etat.tonique, duree: etat.duree, lumieres: etat.lumieres, axe: etat.axe });
      const r = oeuvre.r;
      q('.ca-parties').innerHTML = oeuvre.sections.map((s) => `<div class="ca-partie" style="flex:${s.ratio};--c:${COUL[s.lumiere]}"><b>${ROMAINS[s.i] || s.i + 1} · ${s.ratio}</b><small>${mmss(s.b - s.a)}</small>
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
      lecteur = jouer(oeuvre, { onFin: arreter }); b.textContent = '■ Arrêter';
      anim = animate(() => { if (!lecteur) return; const p = lecteur.position(); dessiner(p); q('.ca-temps').textContent = `${mmss(Math.max(0, p))} / ${mmss(oeuvre.duree)}`; });
    }
    const titre = () => q('[data-ca=titre]').value.trim() || `Cathédrale ${etat.cle.join(':')}`;
    const telecharger = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${titre().replace(/[^\p{L}\p{N} _:-]+/gu, ' ').replace(/[:\s]+/g, ' ').trim()}.${ext}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
    const changer = (patch) => { const avant = lecteur; if (avant) arreter(); etat = { ...etat, ...patch }; garder(); majTout(); if (q('[data-ca=titre]') && /^Cathédrale [\d:]+$/.test(q('[data-ca=titre]').value)) q('[data-ca=titre]').value = `Cathédrale ${etat.cle.join(':')}`; };

    el.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-cle]');
      if (c) { const v = c.dataset.cle === 'labo' ? du : CLES.find((x) => x[0] === c.dataset.cle)[4]; q('[data-ca=nombres]').value = v.join(' '); changer({ cle: v, lumieres: [] }); return; }
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
      const l = e.target.dataset.lum; if (l != null) { const lum = oeuvre.sections.map((s) => s.lumiere); lum[+l] = e.target.value; changer({ lumieres: lum }); return; }
      const a = e.target.dataset.ca;
      if (a === 'nombres') { const v = e.target.value.split(/[^\d]+/).map(Number).filter((x) => x > 0 && x <= 32).slice(0, 6); if (v.length) changer({ cle: v, lumieres: [] }); else toast('Des nombres entiers, de 1 à 32 (ex. : 4 5 6 7).'); }
      if (a === 'tonique') changer({ tonique: +e.target.value });
      if (a === 'duree') changer({ duree: +e.target.value });
    });
    el.addEventListener('input', (e) => { if (e.target.dataset.ca === 'axe') { etat.axe = +e.target.value / 100; garder(); clearTimeout(e.target._t); e.target._t = setTimeout(() => changer({}), 250); } });
    new ResizeObserver(() => dessiner(lecteur ? lecteur.position() : -1)).observe(q('.ca-cv'));
    majTout();
    return () => { lecteur?.arreter(); anim?.(); };
  },
};
