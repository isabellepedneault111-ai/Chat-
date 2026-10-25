// Nos sons de batterie : Frog (ou Zaza) frappe son propre son au micro, ou dépose un fichier, et il remplace
// celui d'origine partout dans FLIP (studio, séances, labo…), pour nous deux. Un clic ramène le son d'origine.
import { audio, drums, sonsPerso } from './audio.js';
import { espace, saveEntry, deleteEntry, uploadAudio, audioURL, onEspace } from './espace.js';
import { wav } from './oreille.js';
import { toast } from './ui.js';

export const SONS = [['kick', 'Grosse caisse'], ['snare', 'Caisse claire'], ['hat', 'Charley'], ['clap', 'Claps']];
const vus = {};
export async function chargerSonsPerso() {
  if (!espace.connected) return;
  for (const [nom] of SONS) {
    const e = espace.entries.find((x) => x.id === `son-${nom}`);
    if (!e) { delete sonsPerso[nom]; vus[nom] = 0; continue; }
    if (vus[nom] === e.updatedAt) continue;
    vus[nom] = e.updatedAt;
    try { const r = await fetch(await audioURL(e.audio)); sonsPerso[nom] = await audio().decodeAudioData(await r.arrayBuffer()); } catch { /* le son d'origine reste */ }
  }
}
export const auteurDe = (nom) => espace.entries.find((x) => x.id === `son-${nom}`)?.author || null;
onEspace((w) => { if (w === 'entries') chargerSonsPerso(); });

// Un coup propre : on coupe le silence du début, on garde 1,5 s au plus, on égalise, on adoucit la fin.
function nettoyer(buf) {
  const c = audio(); const d = buf.getChannelData(0); let pic = 0; for (let i = 0; i < d.length; i++) pic = Math.max(pic, Math.abs(d[i]));
  let deb = 0; while (deb < d.length && Math.abs(d[deb]) < pic * 0.15) deb++;
  deb = Math.max(0, deb - Math.floor(buf.sampleRate * 0.004));
  const n = Math.min(d.length - deb, Math.floor(buf.sampleRate * 1.5));
  const out = c.createBuffer(1, n, buf.sampleRate); const o = out.getChannelData(0); const fin = Math.floor(buf.sampleRate * 0.03);
  for (let i = 0; i < n; i++) { let v = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) v += buf.getChannelData(ch)[deb + i]; v /= buf.numberOfChannels; o[i] = (v / (pic || 1)) * 0.9 * (i > n - fin ? (n - i) / fin : 1); }
  return out;
}
async function garder(nom, buf) {
  const propre = nettoyer(buf); sonsPerso[nom] = propre; drums[nom](audio().currentTime + 0.05);
  if (!espace.connected) return;
  const a = await uploadAudio(wav(propre));
  await saveEntry({ id: `son-${nom}`, type: 'son', title: `Notre ${SONS.find((s) => s[0] === nom)[1].toLowerCase()}`, audio: a, data: { son: nom } }, { force: true });
}
export async function enregistrer(nom, bouton) {
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const r = new MediaRecorder(flux); const m = [];
    r.ondataavailable = (e) => e.data.size && m.push(e.data);
    r.onstop = async () => {
      flux.getTracks().forEach((t) => t.stop());
      try { const buf = await audio().decodeAudioData(await new Blob(m).arrayBuffer()); await garder(nom, buf); toast('Ton son remplace celui d’origine, partout.'); } catch (err) { toast(err.message || 'Son illisible.'); }
      bouton?.dispatchEvent(new CustomEvent('son-change', { bubbles: true }));
    };
    r.start(); if (bouton) bouton.textContent = 'Frappe ton son!';
    setTimeout(() => r.state === 'recording' && r.stop(), 2000);
  } catch { toast('Micro refusé : autorise-le dans la barre d’adresse.'); }
}
export async function importer(nom, fichier, el) {
  try { const buf = await audio().decodeAudioData(await fichier.arrayBuffer()); await garder(nom, buf); toast('Ton son remplace celui d’origine, partout.'); } catch (err) { toast(err.message || 'Son illisible : essaie un wav ou un mp3.'); }
  el?.dispatchEvent(new CustomEvent('son-change', { bubbles: true }));
}
export async function origine(nom, el) {
  delete sonsPerso[nom];
  if (espace.connected && espace.entries.some((x) => x.id === `son-${nom}`)) { try { await deleteEntry(`son-${nom}`); } catch (err) { toast(err.message); } }
  drums[nom](audio().currentTime + 0.05); toast('Le son d’origine est revenu.');
  el?.dispatchEvent(new CustomEvent('son-change', { bubbles: true }));
}

// Une rangée de boutons, à poser n'importe où (studio, arbre).
export function sonsPersoHTML() {
  return `<div class="sons-perso">${SONS.map(([nom, label]) => { const qui = sonsPerso[nom] ? auteurDe(nom) || 'toi' : null; return `<div class="sp" data-sp="${nom}">
    <b>${label}</b><small>${qui ? (qui === 'toi' ? 'ton son' : `le son de ${qui}`) : 'son d’origine'}</small>
    <span><button class="icon-btn tiny" data-spa="ecoute" aria-label="Écouter">▶</button><button class="btn small" data-spa="rec">● Mon son</button><label class="btn small">Fichier<input type="file" accept="audio/*" data-spa="fichier" hidden></label>${qui ? '<button class="linklike" data-spa="origine">son d’origine</button>' : ''}</span>
  </div>`; }).join('')}</div>`;
}
export function brancherSonsPerso(host, rerendre) {
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spa]'); const sp = e.target.closest('[data-sp]'); if (!b || !sp || b.tagName === 'INPUT') return;
    const nom = sp.dataset.sp; const a = b.dataset.spa;
    if (a === 'ecoute') { audio().resume(); drums[nom](audio().currentTime + 0.05); }
    if (a === 'rec') enregistrer(nom, b);
    if (a === 'origine') origine(nom, b);
  });
  host.addEventListener('change', (e) => { const i = e.target.closest('[data-spa=fichier]'); if (i?.files[0]) importer(e.target.closest('[data-sp]').dataset.sp, i.files[0], i); });
  host.addEventListener('son-change', () => rerendre());
}
