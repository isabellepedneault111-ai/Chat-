// Espace partagé du duo, côté navigateur : connexion par lien, synchro quasi instantanée, audios.
import { store } from './ui.js';

const API = '/api/espace';
const CHUNK = 3 * 1024 * 1024;
const listeners = new Set();
const audioCache = new Map();

// L’état de notre espace partagé dans cet appareil : son identifiant, ses réglages (meta), toutes nos entrées (idées, séances, profils…), la corbeille, et qui je suis.
export const espace = {
  id: store.get('espaceId', null),
  meta: null,
  rev: '',
  entries: [],
  trash: [], // la corbeille commune : hors de vue, restaurable, effacée seulement d'un commun accord
  online: true,
  get me() { return store.get('me', ''); },
  set me(v) { store.set('me', String(v).slice(0, 40)); },
  get connected() { return !!this.id && !!this.meta; },
  get link() { return this.id ? `${location.origin}${location.pathname}#/rejoindre/${this.id}` : ''; },
};

// S’abonner aux changements de l’espace (nouvelles entrées, réglages) : chaque page se redessine quand l’autre ajoute quelque chose. Renvoie de quoi se désabonner.
export const onEspace = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (what, extra) => listeners.forEach((fn) => fn(what, extra));
// Prévient toutes les pages abonnées que les entrées et les réglages ont changé (après un import, par exemple).
export const emitEntries = () => { emit('meta'); emit('entries', { fresh: [] }); };

// Parle au serveur de l’espace (Netlify Functions) : envoie la requête, lit la réponse JSON, et lève une erreur claire si ça échoue (sauf 409, le conflit, géré à part).
async function api(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  if (!r.ok && r.status !== 409) throw Object.assign(new Error(data?.error || `Erreur ${r.status}`), { status: r.status });
  return { status: r.status, data };
}

// Un identifiant unique et aléatoire (12 octets, en base64 lisible dans une adresse) pour nommer une nouvelle entrée sans risque de doublon.
export const uid = () => {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Crée un nouvel espace pour le duo sur le serveur, puis s’y connecte.
export async function createEspace(name, createdBy) {
  const { data } = await api('', { method: 'POST', body: JSON.stringify({ name, createdBy, members: ['Zaza', 'Frog'] }) });
  return joinEspace(data.meta.id);
}

// Se connecte à un espace existant : charge ses réglages et toutes ses entrées, le retient dans l’appareil, et commence à écouter les nouveautés.
export async function joinEspace(id) {
  const { data } = await api(`/${id}`);
  espace.id = id;
  espace.meta = data.meta;
  store.set('espaceId', id);
  await refresh(true);
  emit('meta');
  startPolling();
  return espace;
}

// Entrer depuis l'adresse normale, avec le mot secret que l'autre a choisi.
export async function findEspace(secret) {
  const r = await fetch(`${API}/trouver`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret }) });
  if (!r.ok) throw Object.assign(new Error('Mot secret inconnu : vérifie avec l’autre (les accents et les majuscules ne comptent pas).'), { status: r.status });
  return joinEspace((await r.json()).id);
}

// Quitte l’espace dans cet appareil (rien n’est effacé sur le serveur).
export function leaveEspace() {
  espace.id = null;
  espace.meta = null;
  espace.entries = [];
  espace.rev = '';
  store.set('espaceId', null);
  stopPolling();
  emit('meta');
  emit('entries');
}

// Met à jour les réglages de l'espace : { name, members, goal, vision, plan, welcome }.
export async function updateEspace(body) {
  const { status, data } = await api(`/${espace.id}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (status === 409) throw new Error(data?.error || 'Conflit');
  espace.meta = data.meta;
  espace.rev = data.rev;
  emit('meta');
}
// Les noms des deux membres (Zaza et Frog par défaut).
export const members = () => espace.meta?.members || ['Zaza', 'Frog'];

// Renomme l’espace ou change son objectif d’album.
export async function renameEspace(name, goal) {
  const body = {};
  if (name != null) body.name = name;
  if (goal != null) body.goal = goal;
  const { data } = await api(`/${espace.id}`, { method: 'PATCH', body: JSON.stringify(body) });
  espace.meta = data.meta;
  espace.rev = data.rev;
  emit('meta');
}

// Efface tout l’espace sur le serveur, puis le quitte.
export async function deleteEspace() {
  await api(`/${espace.id}`, { method: 'DELETE' });
  leaveEspace();
}

// Recharge les entrées depuis le serveur et repère ce qui est nouveau (ajouté ou modifié par l’autre) pour l’annoncer.
async function refresh(force) {
  if (!espace.id) return;
  const { data } = await api(`/${espace.id}/entries`);
  const before = new Set(espace.entries.map((e) => `${e.id}:${e.updatedAt}`));
  // Ce qui vient de l'autre et compte pour une personne : pas les profils, les traces, ni ce qui part à la corbeille.
  const fresh = data.entries.filter((e) => !before.has(`${e.id}:${e.updatedAt}`) && e.editedBy !== espace.me && !['profil', 'trace', 'parcours'].includes(e.type) && !e.data?.corbeille)
    .map((e) => ({ ...e, _nouveau: !espace.entries.some((x) => x.id === e.id) }));
  espace.entries = [...data.entries.filter((e) => !e.data?.corbeille), ...(espace.demoEntries || [])];
  espace.trash = data.entries.filter((e) => e.data?.corbeille);
  espace.rev = data.rev;
  // Les réglages (nom, objectif d'album) voyagent avec les entrées.
  const merged = data.meta && espace.demoMeta ? { ...data.meta, ...espace.demoMeta } : data.meta;
  if (merged && JSON.stringify(merged) !== JSON.stringify(espace.meta)) {
    espace.meta = merged;
    if (!force) emit('meta');
  }
  emit('entries', { fresh: force ? [] : fresh });
}

// Sondage adaptatif : 2,5 s quand ça bouge, 10 s au repos, rien quand l'onglet est caché.
let timer = 0;
let lastChange = Date.now();
// Vérifie régulièrement s’il y a du nouveau (souvent quand ça bouge, plus rarement quand c’est calme) : c’est ce qui synchronise les deux appareils.
function startPolling() {
  stopPolling();
  const tick = async () => {
    if (!espace.id) return;
    if (!document.hidden) {
      try {
        const { data } = await api(`/${espace.id}/rev`);
        if (!espace.online) { espace.online = true; emit('online'); }
        if (data.rev !== espace.rev) { lastChange = Date.now(); await refresh(); }
      } catch {
        if (espace.online) { espace.online = false; emit('online'); }
      }
    }
    timer = setTimeout(tick, Date.now() - lastChange < 120000 ? 2500 : 10000);
  };
  timer = setTimeout(tick, 2500);
}
// Arrête la vérification régulière.
function stopPolling() { clearTimeout(timer); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && espace.id) { lastChange = Date.now(); startPolling(); } });

// Enregistre une entrée. baseUpdatedAt : version connue, pour détecter un conflit.
const PROJET_TYPES = new Set(['note', 'texte', 'audio', 'lien', 'essai', 'paroles']);
// Enregistre une entrée (idée, séance, profil, plage…) dans l’espace partagé ; signale un conflit si l’autre l’a modifiée entre-temps.
export async function saveEntry(entry, { baseUpdatedAt, force } = {}) {
  if (entry.demo || entry.data?.demo) return { entry }; // un exemple fictif ne s'enregistre jamais
  const id = entry.id || uid();
  // Une nouvelle création se range dans le projet choisi (s'il y en a un).
  const proj = store.get('projet', '');
  if (proj && PROJET_TYPES.has(entry.type) && !espace.entries.some((e) => e.id === id) && !(entry.data && 'projet' in entry.data) && (espace.meta?.projets || []).some((p) => p.id === proj)) {
    entry = { ...entry, data: { ...(entry.data || {}), projet: proj } };
  }
  const { status, data } = await api(`/${espace.id}/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ entry: { ...entry, author: entry.author || espace.me, editedBy: espace.me }, baseUpdatedAt, force }),
  });
  if (status === 409) return { conflict: true, current: data.current };
  espace.entries = espace.entries.filter((e) => e.id !== id);
  espace.trash = espace.trash.filter((e) => e.id !== id);
  if (data.entry.data?.corbeille) espace.trash.unshift(data.entry); else espace.entries.unshift(data.entry);
  espace.rev = data.rev;
  lastChange = Date.now();
  emit('entries', { fresh: [] });
  return { entry: data.entry };
}

// Efface une entrée de l’espace partagé (et de la corbeille).
export async function deleteEntry(id) {
  const { data } = await api(`/${espace.id}/entries/${id}`, { method: 'DELETE' });
  espace.entries = espace.entries.filter((e) => e.id !== id);
  espace.trash = espace.trash.filter((e) => e.id !== id);
  espace.rev = data.rev;
  emit('entries', { fresh: [] });
}

// Téléverse un audio (fichier du dictaphone ou prise directe) en morceaux de 3 Mo.
export async function uploadAudio(blob, onProgress) {
  const id = uid();
  const parts = Math.max(1, Math.ceil(blob.size / CHUNK));
  if (parts > 25) throw new Error('Fichier trop lourd (75 Mo maximum).');
  for (let n = 0; n < parts; n++) {
    const r = await fetch(`${API}/${espace.id}/audio/${id}/${n}`, {
      method: 'PUT',
      headers: { 'content-type': blob.type || 'application/octet-stream' },
      body: blob.slice(n * CHUNK, (n + 1) * CHUNK),
    });
    if (!r.ok) throw new Error(`Téléversement interrompu (${r.status})`);
    onProgress?.((n + 1) / parts);
  }
  return { id, type: blob.type, parts, size: blob.size };
}

// Une image avant l'envoi : réduite à 1800 px au plus long côté, en JPEG. Une photo de cellulaire passe de 5 Mo à ~400 Ko.
export async function uploadImage(file, onProgress) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k); const h = Math.round(bmp.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const keepPng = file.type === 'image/png' && file.size < 1.5e6; // un dessin net reste net
  const blob = keepPng ? file : await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
  const up = await uploadAudio(blob, onProgress);
  return { ...up, type: blob.type || 'image/jpeg', w, h };
}

// L’adresse d’écoute d’un son enregistré : il est téléchargé du serveur (en morceaux) une seule fois, puis gardé en mémoire.
export async function audioURL(audio) {
  if (audio.src) return audio.src; // exemples du tour : un fichier du site
  if (audioCache.has(audio.id)) return audioCache.get(audio.id);
  const p = (async () => {
    const bufs = [];
    for (let n = 0; n < audio.parts; n++) {
      const r = await fetch(`${API}/${espace.id}/audio/${audio.id}/${n}`);
      if (!r.ok) throw new Error('Audio introuvable');
      bufs.push(await r.arrayBuffer());
    }
    return URL.createObjectURL(new Blob(bufs, { type: audio.type || 'audio/mp4' }));
  })();
  audioCache.set(audio.id, p);
  return p;
}

// Reconnexion automatique au démarrage.
export async function boot() {
  if (!espace.id) return;
  try { await joinEspace(espace.id); } catch (e) { if (e.status === 404) leaveEspace(); }
}

// ---------- Profils : chacun écrit le sien (aucun conflit possible entre les deux) ----------
export const profileId = (name) => `profil-${String(name).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30) || 'x'}`;
// Le profil d’un membre (son étape 1, sa voix, son studio…), ou rien s’il ne l’a pas encore rempli.
export const profileOf = (name) => espace.entries.find((e) => e.id === profileId(name))?.data || null;
// Modifie le profil d’un membre : change(ancien) renvoie les champs à changer ; le reste est gardé. Synchronisé avec l’autre appareil.
export async function saveProfile(change, name = espace.me) {
  const id = profileId(name);
  const cur = espace.entries.find((e) => e.id === id);
  const data = { ...(cur?.data || {}), ...change(cur?.data || {}) };
  const r = await saveEntry({ id, type: 'profil', title: `Point de départ · ${name}`, data, author: name }, { baseUpdatedAt: cur?.updatedAt });
  if (r.conflict) return saveEntry({ ...r.current, data: { ...r.current.data, ...change(r.current.data || {}) } }, { baseUpdatedAt: r.current.updatedAt });
  return r;
}
