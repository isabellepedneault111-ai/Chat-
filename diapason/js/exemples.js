// Les exemples vivants : chaque exercice peut avoir son exemple, enregistré par l'un de vous deux,
// avec sa vraie voix ou son clavier. Pas de son de robot : votre son.
import { espace, saveEntry, uploadAudio, audioURL } from './espace.js';
import { toast } from './ui.js';
import { memberColor } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const exempleDe = (id) => espace.entries.filter((e) => e.type === 'audio' && e.data?.exemple === id).sort((a, b) => b.createdAt - a.createdAt)[0];

// Le bloc « Notre exemple » d’un exercice : la prise qu’on garde comme modèle, ou l’invitation à en choisir une.
export function exempleHTML(id, nom) {
  if (!espace.connected) return '';
  const ex = exempleDe(id);
  return `<div class="exemple" data-exid="${esc(id)}" data-exnom="${esc(nom)}">
    ${ex ? `<button class="btn small" data-ex="play">▶ L’exemple de <b style="color:${memberColor(ex.author)}">${esc(ex.author)}</b></button><button class="linklike" data-ex="rec">réenregistrer</button>`
      : '<button class="btn small" data-ex="rec">● Enregistrer l’exemple</button><small>Ta vraie voix ou ton clavier, 30 secondes : l’autre l’entendra ici.</small>'}
  </div>`;
}

let rec = null;
// Branche les boutons des exemples : écouter, choisir, remplacer.
export function bindExemples(root) {
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ex]');
    if (!b) return;
    const box = b.closest('.exemple');
    const id = box.dataset.exid;
    if (b.dataset.ex === 'play') {
      const ex = exempleDe(id);
      try { const a = new Audio(await audioURL(ex.audio)); a.play(); b.classList.add('on'); a.onended = () => b.classList.remove('on'); } catch { toast('Exemple introuvable.'); }
      return;
    }
    if (rec) { rec.r.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const r = new MediaRecorder(stream); const chunks = [];
      rec = { r, t: setTimeout(() => r.state === 'recording' && r.stop(), 45000) };
      r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      r.onstop = async () => {
        clearTimeout(rec.t); rec = null; stream.getTracks().forEach((t) => t.stop());
        b.textContent = 'Envoi…';
        try {
          const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
          const audio = await uploadAudio(blob);
          await saveEntry({ type: 'audio', title: `Exemple · ${box.dataset.exnom}`, audio, data: { exemple: id } });
          toast('Exemple gardé. L’autre l’entendra sous cet exercice.');
        } catch (err) { toast(err.message); }
      };
      r.start();
      b.textContent = '■ Arrêter l’exemple'; b.classList.add('on');
    } catch { toast('Micro refusé. Autorise-le dans la barre d’adresse.'); }
  });
}
