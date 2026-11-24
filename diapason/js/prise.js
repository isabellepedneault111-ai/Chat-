// Une prise de voix, calée sur l'horloge audio de l'app : on sait à quel instant de la musique chaque échantillon
// a été chanté (latences d'entrée et de sortie retirées), pour la rejouer pile avec la chanson, et l'empiler.
// Les prises se gardent sur l'appareil (IndexedDB) ; le chantier les partage aussi dans l'espace.
import { audio } from './audio.js';

let flux = null;
async function micro() {
  if (flux && flux.getAudioTracks().some((t) => t.readyState === 'live')) return flux;
  flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  return flux;
}
export function fermerMicroPrise() { flux?.getTracks().forEach((t) => t.stop()); flux = null; }

// Commence à enregistrer ; stop() rend { buf, debut } : debut = l'instant (horloge audio) où le premier échantillon
// a été chanté par rapport à ce qu'on entendait.
// source : un micro déjà ouvert ailleurs (sur l'iPhone, en ouvrir un 2e couperait le 1er).
export async function demarrerPrise({ source = null } = {}) {
  const c = audio(); const src = source || c.createMediaStreamSource(await micro()); const N = 2048;
  const proc = c.createScriptProcessor(N, 1, 1); const muet = c.createGain(); muet.gain.value = 0;
  const morceaux = []; let debut = null; let niveau = 0;
  proc.onaudioprocess = (e) => {
    const d = e.inputBuffer.getChannelData(0); if (debut == null) debut = c.currentTime - N / c.sampleRate;
    morceaux.push(new Float32Array(d)); let m = 0; for (let i = 0; i < d.length; i += 8) m = Math.max(m, Math.abs(d[i])); niveau = m;
  };
  src.connect(proc); proc.connect(muet).connect(c.destination);
  const latence = (c.baseLatency || 0.01) + (c.outputLatency || 0.02); // ce qu'on entend est en retard ; ce qu'on chante arrive en retard
  return {
    niveau: () => niveau,
    stop() {
      try { if (source) source.disconnect(proc); else src.disconnect(); proc.disconnect(); muet.disconnect(); } catch { /* déjà */ }
      const L = morceaux.reduce((a, m) => a + m.length, 0); if (!L) return null;
      const buf = c.createBuffer(1, L, c.sampleRate); let o = 0; morceaux.forEach((m) => { buf.getChannelData(0).set(m, o); o += m.length; });
      return { buf, debut: (debut ?? c.currentTime) - latence };
    },
  };
}

// Le WAV d'une prise (pour la garder, la partager, la télécharger).
export function enWav(buf) {
  const n = buf.length; const sr = buf.sampleRate; const d = buf.getChannelData(0); const b = new ArrayBuffer(44 + n * 2); const v = new DataView(b);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
  return new Blob([b], { type: 'audio/wav' });
}

// Les prises, gardées sur cet appareil.
const bd = () => new Promise((ok, ko) => { const r = indexedDB.open('flip-voix', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
export async function garderPrise(id, blob) { try { const d = await bd(); d.transaction('p', 'readwrite').objectStore('p').put(blob, id); } catch { /* navigation privée */ } }
export async function lirePrise(id) { try { const d = await bd(); return await new Promise((ok) => { const r = d.transaction('p').objectStore('p').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch { return null; } }
export async function effacerPrise(id) { try { const d = await bd(); d.transaction('p', 'readwrite').objectStore('p').delete(id); } catch { /* rien */ } }
