// Espace partagé du duo, côté navigateur : connexion par lien, synchro quasi instantanée, audios.
import { store } from './ui.js';

const API = '/api/espace';
const CHUNK = 3 * 1024 * 1024;
const listeners = new Set();
const audioCache = new Map();

export const espace = {
  id: store.get('espaceId', null),
  meta: null,
  rev: '',
  entries: [],
  online: true,
  get me() { return store.get('me', ''); },
  set me(v) { store.set('me', String(v).slice(0, 40)); },
  get connected() { return !!this.id && !!this.meta; },
  get link() { return this.id ? `${location.origin}${location.pathname}#/rejoindre/${this.id}` : ''; },
};

export const onEspace = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (what, extra) => listeners.forEach((fn) => fn(what, extra));

async function api(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  if (!r.ok && r.status !== 409) throw Object.assign(new Error(data?.error || `Erreur ${r.status}`), { status: r.status });
  return { status: r.status, data };
}

export const uid = () => {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export async function createEspace(name, createdBy) {
  const { data } = await api('', { method: 'POST', body: JSON.stringify({ name, createdBy, members: ['Zaza', 'Frog'] }) });
  return joinEspace(data.meta.id);
}

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
export const members = () => espace.meta?.members || ['Zaza', 'Frog'];

export async function renameEspace(name, goal) {
  const body = {};
  if (name != null) body.name = name;
  if (goal != null) body.goal = goal;
  const { data } = await api(`/${espace.id}`, { method: 'PATCH', body: JSON.stringify(body) });
  espace.meta = data.meta;
  espace.rev = data.rev;
  emit('meta');
}

export async function deleteEspace() {
  await api(`/${espace.id}`, { method: 'DELETE' });
  leaveEspace();
}

async function refresh(force) {
  if (!espace.id) return;
  const { data } = await api(`/${espace.id}/entries`);
  const before = new Set(espace.entries.map((e) => `${e.id}:${e.updatedAt}`));
  const fresh = data.entries.filter((e) => !before.has(`${e.id}:${e.updatedAt}`) && e.editedBy !== espace.me);
  espace.entries = data.entries;
  espace.rev = data.rev;
  // Les réglages (nom, objectif d'album) voyagent avec les entrées.
  if (data.meta && JSON.stringify(data.meta) !== JSON.stringify(espace.meta)) {
    espace.meta = data.meta;
    if (!force) emit('meta');
  }
  emit('entries', { fresh: force ? [] : fresh });
}

// Sondage adaptatif : 2,5 s quand ça bouge, 10 s au repos, rien quand l'onglet est caché.
let timer = 0;
let lastChange = Date.now();
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
function stopPolling() { clearTimeout(timer); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && espace.id) { lastChange = Date.now(); startPolling(); } });

// Enregistre une entrée. baseUpdatedAt : version connue, pour détecter un conflit.
export async function saveEntry(entry, { baseUpdatedAt, force } = {}) {
  const id = entry.id || uid();
  const { status, data } = await api(`/${espace.id}/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ entry: { ...entry, author: entry.author || espace.me }, baseUpdatedAt, force }),
  });
  if (status === 409) return { conflict: true, current: data.current };
  const i = espace.entries.findIndex((e) => e.id === id);
  if (i >= 0) espace.entries[i] = data.entry; else espace.entries.unshift(data.entry);
  espace.rev = data.rev;
  lastChange = Date.now();
  emit('entries', { fresh: [] });
  return { entry: data.entry };
}

export async function deleteEntry(id) {
  const { data } = await api(`/${espace.id}/entries/${id}`, { method: 'DELETE' });
  espace.entries = espace.entries.filter((e) => e.id !== id);
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

export async function audioURL(audio) {
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
export const profileOf = (name) => espace.entries.find((e) => e.id === profileId(name))?.data || null;
export async function saveProfile(change, name = espace.me) {
  const id = profileId(name);
  const cur = espace.entries.find((e) => e.id === id);
  const data = { ...(cur?.data || {}), ...change(cur?.data || {}) };
  const r = await saveEntry({ id, type: 'profil', title: `Point de départ · ${name}`, data, author: name }, { baseUpdatedAt: cur?.updatedAt });
  if (r.conflict) return saveEntry({ ...r.current, data: { ...r.current.data, ...change(r.current.data || {}) } }, { baseUpdatedAt: r.current.updatedAt });
  return r;
}
