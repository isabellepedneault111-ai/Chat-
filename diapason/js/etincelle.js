// L'étincelle : une petite flamme qui veille dans un coin, sur toutes les pages.
// On la touche, on dépose une idée embryonnaire en trois secondes : pour notre musique, ou pour l'app.
import { espace, saveEntry, uploadAudio } from './espace.js';
import { toast } from './ui.js';
import { FLAME } from './marque.js';

let rec = null;
export function initEtincelle() {
  const btn = document.createElement('button');
  btn.className = 'etincelle';
  btn.type = 'button';
  btn.title = 'Une étincelle : déposer une idée, même toute petite';
  btn.setAttribute('aria-label', 'Déposer une idée');
  btn.innerHTML = FLAME('et-flame');
  document.body.appendChild(btn);
  btn.addEventListener('click', ouvrir);
}

function ouvrir() {
  if (!espace.connected || !espace.me) { toast('Entre d’abord dans votre espace.'); return; }
  if (document.querySelector('.et-sheet')) return;
  let pour = 'musique';
  const box = document.createElement('div');
  box.className = 'et-sheet';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Une étincelle');
  box.innerHTML = `
    <div class="et-card">
      <p class="et-k">Une étincelle</p>
      <textarea class="input et-text" rows="3" placeholder="Un mot, une image, un accord, une idée pour l’app… même à moitié."></textarea>
      <div class="et-pour" role="radiogroup">
        <button type="button" class="chip active" data-pour="musique" aria-checked="true">Pour notre musique</button>
        <button type="button" class="chip" data-pour="app" aria-checked="false">Pour l’app FLIP</button>
      </div>
      <div class="et-row">
        <button type="button" class="btn primary" data-et="save">Garder</button>
        <button type="button" class="btn ghost" data-et="rec">● Mémo vocal</button>
        <a class="et-link" href="#/etincelles">Nos étincelles →</a>
        <button type="button" class="et-close" data-et="close" aria-label="Fermer">×</button>
      </div>
    </div>`;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const ta = box.querySelector('.et-text');
  ta.focus();
  const close = () => { if (rec) { rec.r.onstop = null; rec.r.stop(); rec.s.getTracks().forEach((t) => t.stop()); rec = null; } box.classList.remove('in'); setTimeout(() => box.remove(), 250); };
  const save = async (audio) => {
    const text = ta.value.trim();
    if (!text && !audio) { ta.focus(); return; }
    try {
      await saveEntry({ type: audio ? 'audio' : 'note', title: (text.split('\n')[0] || `Étincelle de ${espace.me}`).slice(0, 80), body: text, audio, data: { etincelle: true, pour, stage: 0 } });
      toast(pour === 'app' ? 'Idée pour FLIP gardée. On la construira.' : 'Étincelle gardée.');
      close();
    } catch (err) { toast(err.message); }
  };
  box.addEventListener('click', async (e) => {
    if (e.target === box) { close(); return; }
    const p = e.target.closest('[data-pour]');
    if (p) { pour = p.dataset.pour; box.querySelectorAll('[data-pour]').forEach((b) => { b.classList.toggle('active', b === p); b.setAttribute('aria-checked', b === p); }); return; }
    const a = e.target.closest('[data-et]')?.dataset.et;
    if (a === 'close') close();
    if (a === 'save') save();
    if (a === 'rec') {
      const b = e.target.closest('[data-et]');
      if (rec) { rec.r.stop(); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        const r = new MediaRecorder(s); const chunks = [];
        rec = { r, s };
        r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        r.onstop = async () => { s.getTracks().forEach((t) => t.stop()); rec = null; b.textContent = 'Envoi…'; try { await save(await uploadAudio(new Blob(chunks, { type: r.mimeType || 'audio/webm' }))); } catch (err) { toast(err.message); } };
        r.start(); b.textContent = '■ Arrêter'; b.classList.add('on');
      } catch { toast('Micro refusé. Autorise-le dans la barre d’adresse.'); }
    }
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); });
}
