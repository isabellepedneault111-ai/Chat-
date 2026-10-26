// Le filet, côté écran : un bouton dans la barre du haut. Tendu, il garde toujours la dernière minute de tout ce qui
// est actif. Touché, il fige cette minute : on voit chaque source, on glisse pour choisir le beau bout, on l'écoute,
// puis on le garde au mur, on l'envoie à L'oreille ou on le télécharge (WAV pour le son, MIDI pour les notes).
import { audio } from './audio.js';
import { toast, store } from './ui.js';
import { filet, tendre, relacher, instantane, fichierMidi, onMateriel, duree, dureeTexte, garde } from './materiel.js';
import { wav } from './oreille.js';
import { espace, saveEntry, uploadAudio } from './espace.js';
import { notePiano, prechargerSons } from './sampler.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c3 2 13 2 16 0M4 5c1 6 3 11 8 15 5-4 7-9 8-15M7 8.5 12 20M17 8.5 12 20M5.5 11h13M8 15.5h8"/></svg>';
const sec = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

let bouton = null;
function etat() {
  if (!bouton) return;
  bouton.classList.toggle('on', filet.arme);
  bouton.setAttribute('aria-pressed', filet.arme ? 'true' : 'false');
  const n = filet.pistes.size;
  bouton.title = filet.arme ? `Le filet est tendu (${n} source${n > 1 ? 's' : ''}) : gardé depuis ${sec(garde())} sur ${sec(duree())}. Touche pour prendre ${dureeTexte()}.` : `Tendre le filet : ${dureeTexte()} jouée${duree() > 60 ? 's' : ''}, toujours gardée${duree() > 60 ? 's' : ''}`;
}
// L'anneau d'or se remplit pendant que le filet se remplit : plein, il a toute sa durée.
let anneau = 0;
function remplir() {
  cancelAnimationFrame(anneau);
  const tour = () => {
    if (!bouton) return; const f = filet.arme ? garde() / duree() : 0; etat();
    bouton.style.setProperty('--plein', `${(f * 360).toFixed(1)}deg`); bouton.classList.toggle('plein', filet.arme && f >= 1);
    const t = bouton.querySelector('.filet-t'); if (t) t.textContent = filet.arme && f < 1 ? sec(garde()) : '';
    if (filet.arme) anneau = setTimeout(() => requestAnimationFrame(tour), 500);
  };
  tour();
}

export function installerFilet() {
  const ref = document.getElementById('pistesBtn'); if (!ref || bouton) return;
  bouton = document.createElement('button'); bouton.type = 'button'; bouton.className = 'icon-btn filet-btn'; bouton.id = 'filetBtn';
  bouton.setAttribute('aria-label', 'Le filet : la dernière minute'); bouton.innerHTML = `${ICONE}<i class="filet-pt"></i><small class="filet-t"></small>`;
  ref.before(bouton); etat(); remplir(); onMateriel(() => { etat(); remplir(); });
  bouton.addEventListener('click', async () => {
    if (!filet.arme) {
      try { await tendre(); toast(`Le filet est tendu : ${dureeTexte()}, toujours gardée${duree() > 60 ? 's' : ''}. L’anneau d’or se remplit ; joue, puis touche-le.`); } catch (e) { toast(e.message); }
      return;
    }
    ouvrir();
  });
  // Il était tendu la dernière fois : on le retend au premier geste (le navigateur exige un geste pour le son).
  if (store.get('filetArme', false)) {
    const une = () => { removeEventListener('pointerdown', une, true); if (!filet.arme) tendre().catch(() => {}); };
    addEventListener('pointerdown', une, true);
  }
}

// ---------- La minute figée ----------
function ouvrir() {
  const s = instantane();
  if (s.duree < 1) { toast('Le filet vient d’être tendu : joue un peu, puis reviens.'); return; }
  const actives = new Set(s.pistes.map((p) => p.k)); let midiOn = s.midi.length > 0;
  // Le début et la fin du jeu : on coupe le silence avant et après (fenêtres de 100 ms).
  const W = Math.floor(s.sr / 10); const nW = Math.ceil(s.pistes[0]?.d.length / W) || 0;
  const env = (d) => { const e = new Float32Array(nW); for (let w = 0; w < nW; w++) { let m = 0; for (let i = w * W; i < Math.min(d.length, (w + 1) * W); i++) m = Math.max(m, Math.abs(d[i])); e[w] = m; } return e; };
  const envs = s.pistes.map((p) => env(p.d));
  const mixEnv = new Float32Array(nW); envs.forEach((e) => e.forEach((v, i) => { mixEnv[i] = Math.max(mixEnv[i], v); }));
  s.midi.forEach((m) => { const w = Math.min(nW - 1, Math.floor(m.t * 10)); if (w >= 0) mixEnv[w] = Math.max(mixEnv[w], 0.05); });
  const seuil = Math.max(0.004, Math.max(...mixEnv) * 0.02);
  let a0 = mixEnv.findIndex((v) => v > seuil); let b0 = nW - 1 - [...mixEnv].reverse().findIndex((v) => v > seuil);
  if (a0 < 0) { a0 = 0; b0 = nW - 1; }
  let sel = { a: Math.max(0, a0 / 10 - 0.3), b: Math.min(s.duree, (b0 + 1) / 10 + 0.3) };

  const v = document.createElement('div'); v.className = 'filet-voile'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Le filet : la dernière minute');
  v.innerHTML = `<div class="filet-carte">
    <div class="filet-tete"><div><p class="eyebrow">Le filet</p><h2>${dureeTexte()[0].toUpperCase() + dureeTexte().slice(1)}, figée${duree() > 60 ? 's' : ''}.</h2></div><div class="filet-tete-b"><button class="btn small" data-fl="relacher" title="Le filet arrête d’écouter et oublie la minute gardée">⏻ Arrêter le filet</button><button class="icon-btn" data-fl="fermer" aria-label="Fermer">✕</button></div></div>
    <p class="muted small">Glisse sur la minute pour choisir le bout à garder (le silence avant et après est déjà coupé). Coche les sources à mélanger.</p>
    <canvas class="filet-cv" aria-label="Les sources de la dernière minute, et le bout choisi"></canvas>
    <div class="filet-src">${s.pistes.map((p) => `<label><input type="checkbox" data-src="${esc(p.k)}" checked> ${esc(p.nom)}</label>`).join('')}${s.midi.length ? `<label><input type="checkbox" data-src="midi" checked> Notes MIDI (${s.midi.filter((m) => (m.d[0] & 0xf0) === 0x90 && m.d[2]).length}), jouées au piano à l’écoute</label>` : ''}${!s.pistes.length && !s.midi.length ? '<span class="muted">Aucune source active : coche-en dans Mon matériel.</span>' : ''}</div>
    <p class="filet-duree mono"></p>
    <div class="filet-actions">
      <button class="btn primary" data-fl="ecoute">▶ Écouter le bout</button>
      <input class="filet-nom" value="Un bout de jam · ${new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}" aria-label="Nom du bout">
      ${espace.connected ? '<button class="btn" data-fl="mur">Garder au mur</button>' : ''}
      <button class="btn" data-fl="oreille">L’oreille : trouver les accords</button>
      <button class="btn" data-fl="wav">⬇ Son (WAV)</button>
      ${s.midi.length ? '<button class="btn" data-fl="mid">⬇ Notes (MIDI)</button>' : ''}
    </div>
    <p class="muted small">Le filet continue d’écouter pendant que tu choisis. Rien ne quitte ton appareil tant que tu ne gardes pas le bout. <a href="#/materiel" data-fl="materiel">Mon matériel</a></p>
  </div>`;
  document.body.appendChild(v);
  const q = (x) => v.querySelector(x); const cv = q('.filet-cv'); const g = cv.getContext('2d');
  const rangs = s.pistes.length + (s.midi.length ? 1 : 0) || 1;
  let lecture = null; let tete = null;
  const dessiner = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); const L = cv.clientWidth; const H = cv.clientHeight;
    if (cv.width !== Math.round(L * dpr)) { cv.width = Math.round(L * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#141210'; g.fillRect(0, 0, L, H);
    const X = (t) => 8 + (t / s.duree) * (L - 16); const hR = (H - 22) / rangs;
    g.fillStyle = 'rgba(232,194,122,.16)'; g.fillRect(X(sel.a), 0, X(sel.b) - X(sel.a), H - 18);
    s.pistes.forEach((p, r) => {
      const y = r * hR + hR / 2; const on = actives.has(p.k); const e = envs[r];
      g.strokeStyle = on ? (p.k === 'app' ? '#ff6fae' : '#93b08e') : '#4a4338'; g.lineWidth = Math.max(1, (L - 16) / nW * 0.7);
      for (let w = 0; w < nW; w++) { const h = Math.max(0.5, Math.min(1, e[w] * 1.6) * hR * 0.42); const x = X(w / 10); g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y + h); g.stroke(); }
      g.fillStyle = on ? '#efe6d2' : '#6d655a'; g.font = '600 11px "Atkinson Hyperlegible", sans-serif'; g.textAlign = 'left'; g.fillText(p.nom, 12, r * hR + 13);
    });
    if (s.midi.length) {
      const r = s.pistes.length; const y0 = r * hR; const notes = s.midi.filter((m) => (m.d[0] & 0xf0) === 0x90 && m.d[2]);
      const hs = notes.map((m) => m.d[1]); const lo = Math.min(...hs) - 1; const hi = Math.max(...hs) + 1;
      g.fillStyle = midiOn ? '#b58cf0' : '#4a4338';
      notes.forEach((m) => { const fin = s.midi.find((o) => o.t > m.t && o.d[1] === m.d[1] && ((o.d[0] & 0xf0) === 0x80 || ((o.d[0] & 0xf0) === 0x90 && !o.d[2]))); g.fillRect(X(m.t), y0 + 16 + (1 - (m.d[1] - lo) / (hi - lo)) * (hR - 22), Math.max(2, X(fin ? fin.t : m.t + 0.3) - X(m.t)), 3); });
      g.fillStyle = midiOn ? '#efe6d2' : '#6d655a'; g.font = '600 11px "Atkinson Hyperlegible", sans-serif'; g.fillText('Notes MIDI', 12, y0 + 13);
    }
    g.strokeStyle = '#e8c27a'; g.lineWidth = 2; [sel.a, sel.b].forEach((t) => { g.beginPath(); g.moveTo(X(t), 0); g.lineTo(X(t), H - 18); g.stroke(); });
    if (tete != null) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(tete), 0); g.lineTo(X(tete), H - 18); g.stroke(); }
    g.fillStyle = '#b8ad98'; g.font = '11px "Atkinson Hyperlegible", sans-serif'; g.textAlign = 'center';
    const pas = s.duree > 120 ? 30 : 10; for (let t = s.duree % pas; t <= s.duree; t += pas) g.fillText(s.duree - t < 0.5 ? 'maintenant' : `−${sec(s.duree - t)}`, X(t), H - 5);
    q('.filet-duree').textContent = `Le bout choisi : ${sec(sel.a)} → ${sec(sel.b)} (${(sel.b - sel.a).toFixed(1).replace('.', ',')} s) · le filet avait ${sec(s.duree)}${s.duree < duree() - 1 ? ` sur ${sec(duree())} (il venait d’être tendu)` : ''}`;
  };
  new ResizeObserver(dessiner).observe(cv); dessiner();
  // Glisser : un nouveau bout ; près d'un bord : on déplace ce bord.
  let tire = null;
  const tAt = (e) => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(s.duree, ((e.clientX - r.left - 8) / (r.width - 16)) * s.duree)); };
  cv.addEventListener('pointerdown', (e) => {
    const t = tAt(e); const px = s.duree / cv.clientWidth * 10; cv.setPointerCapture(e.pointerId);
    tire = Math.abs(t - sel.a) < px ? 'a' : Math.abs(t - sel.b) < px ? 'b' : 'n';
    if (tire === 'n') { sel = { a: t, b: t }; tire = { o: t }; } dessiner();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!tire) return; const t = tAt(e);
    if (tire === 'a') sel.a = Math.min(t, sel.b - 0.2); else if (tire === 'b') sel.b = Math.max(t, sel.a + 0.2); else sel = { a: Math.min(t, tire.o), b: Math.max(t, tire.o) };
    dessiner();
  });
  cv.addEventListener('pointerup', () => { if (sel.b - sel.a < 0.3) sel = { a: Math.max(0, sel.a - 2), b: Math.min(s.duree, sel.a + 2) }; tire = null; dessiner(); });

  // Le mélange des sources cochées, sur le bout choisi, ramené à un niveau confortable.
  const melange = () => {
    const i0 = Math.floor(sel.a * s.sr); const i1 = Math.floor(sel.b * s.sr); const n = Math.max(1, i1 - i0);
    const buf = audio().createBuffer(1, n, s.sr); const d = buf.getChannelData(0);
    s.pistes.filter((p) => actives.has(p.k)).forEach((p) => { for (let i = 0; i < n; i++) d[i] += p.d[i0 + i] || 0; });
    let pic = 0; for (let i = 0; i < n; i++) pic = Math.max(pic, Math.abs(d[i]));
    const k = pic > 0.0005 ? Math.min(6, 0.89 / pic) : 1; for (let i = 0; i < n; i++) d[i] *= k;
    // Fondus de 10 ms : pas de clic aux bords.
    const f = Math.min(n / 2, Math.floor(s.sr / 100)); for (let i = 0; i < f; i++) { d[i] *= i / f; d[n - 1 - i] *= i / f; }
    return buf;
  };
  const notesDuBout = () => s.midi.filter((m) => m.t >= sel.a && m.t <= sel.b).map((m) => ({ ...m, t: m.t - sel.a }));
  const nom = () => q('.filet-nom').value.trim() || 'Un bout de jam';
  const telecharger = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${nom().replace(/[^\p{L}\p{N} _-]+/gu, ' ').replace(/\s+/g, ' ').trim() || 'filet'}.${ext}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const arreter = () => { lecture?.stop(); lecture = null; tete = null; q('[data-fl=ecoute]').textContent = '▶ Écouter le bout'; dessiner(); };
  const fermerTout = () => { arreter(); v.remove(); };

  v.addEventListener('change', (e) => { const k = e.target.dataset.src; if (!k) return; if (k === 'midi') midiOn = e.target.checked; else if (e.target.checked) actives.add(k); else actives.delete(k); dessiner(); });
  v.addEventListener('click', async (e) => {
    if (e.target === v) { fermerTout(); return; }
    const a = e.target.closest('[data-fl]')?.dataset.fl; if (!a) return;
    if (a === 'fermer') fermerTout();
    if (a === 'materiel') fermerTout();
    if (a === 'relacher') { relacher(); fermerTout(); toast('Filet arrêté : plus rien n’est écouté, la minute gardée est oubliée. Touche-le pour le retendre.'); }
    if (a === 'ecoute') {
      if (lecture) { arreter(); return; }
      const c = audio(); const src = c.createBufferSource(); src.buffer = melange(); src.connect(c.destination); // direct : le filet ne se capture pas lui-même
      const t0 = c.currentTime + 0.05; src.start(t0);
      if (midiOn) { prechargerSons(['piano']); const fins = notesDuBout(); fins.filter((m) => (m.d[0] & 0xf0) === 0x90 && m.d[2]).forEach((m) => { const off = fins.find((o) => o.t > m.t && o.d[1] === m.d[1] && ((o.d[0] & 0xf0) === 0x80 || !o.d[2])); notePiano(m.d[1], { when: t0 + m.t, dur: Math.max(0.15, (off ? off.t : m.t + 0.5) - m.t), vel: 0.25 + m.d[2] / 200 }); }); }
      lecture = { stop: () => { try { src.stop(); } catch { /* fini */ } } }; e.target.textContent = '■ Arrêter';
      const tic = () => { if (!lecture) return; tete = sel.a + (c.currentTime - t0); if (tete >= sel.b) { arreter(); return; } dessiner(); requestAnimationFrame(tic); }; tic();
      src.onended = () => { if (lecture) arreter(); };
    }
    if (a === 'wav') telecharger(wav(melange()), 'wav');
    if (a === 'mid') telecharger(fichierMidi(notesDuBout()), 'mid');
    if (a === 'oreille') { window.__flipOreille = { nom: nom(), blob: wav(melange()) }; fermerTout(); location.hash = '#/oreille'; }
    if (a === 'mur') {
      const b = e.target; b.disabled = true; b.textContent = 'J’envoie…';
      try {
        const blob = wav(melange()); const au = await uploadAudio(blob);
        const notes = notesDuBout().slice(0, 3000).map((m) => [+m.t.toFixed(3), ...m.d]);
        await saveEntry({ type: 'audio', title: nom(), audio: { ...au, duration: +(sel.b - sel.a).toFixed(2) }, data: { stage: 0, filet: true, sources: s.pistes.filter((p) => actives.has(p.k)).map((p) => p.nom), midi: notes.length ? notes : undefined } });
        b.textContent = 'Au mur ✓'; toast('Le bout est au mur, comme idée brute.');
      } catch (err) { b.disabled = false; b.textContent = 'Garder au mur'; toast(err.message); }
    }
  });
  addEventListener('keydown', function esc(e) { if (!v.isConnected) { removeEventListener('keydown', esc); return; } if (e.key === 'Escape') fermerTout(); });
}
