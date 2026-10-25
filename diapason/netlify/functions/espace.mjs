// Espace partagé d'un duo : carnet (écrits, bilans, évaluations, essais), paroles, parcours et audios.
// Stockage : Netlify Blobs. Pas de compte : l'identifiant de l'espace (aléatoire, 128 bits) est la clé.
// Quiconque a le lien peut lire et écrire — l'interface le dit clairement.
import { getStore } from '@netlify/blobs';

export const config = { path: ['/api/espace', '/api/espace/*'] };

const ID = /^[A-Za-z0-9_-]{8,40}$/;
const TYPES = new Set(['carte', 'jeu', 'trace', 'note', 'texte', 'paroles', 'audio', 'bilan', 'evaluation', 'essai', 'parcours', 'lien', 'session', 'profil', 'bravo', 'image', 'chanson']);
const MAX_ENTRY = 300 * 1024; // 300 Ko de JSON par entrée
const MAX_PART = 4 * 1024 * 1024; // morceaux audio de 4 Mo (limite des fonctions : 6 Mo)
const MAX_PARTS = 25; // ~100 Mo par audio

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (status, message) => json({ error: message }, status);

function newId(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const clean = (s, max) => String(s ?? '').slice(0, max);

// Mot secret du duo : on n'en garde que l'empreinte, qui mène à l'espace (entrée depuis l'adresse normale).
const normSecret = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
async function secretKey(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`diapason:${normSecret(s)}`));
  return `codes/${[...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function bump(store, sid) {
  const rev = `${Date.now().toString(36)}-${newId(4)}`;
  await store.set(`${sid}/rev`, rev);
  return rev;
}

// Cœur de l'API, séparé de getStore pour pouvoir le tester hors Netlify.
export async function handle(req, store) {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/espace\/?/, '').split('/').filter(Boolean);
  const m = req.method;

  // POST /api/espace → nouvel espace
  if (!parts.length) {
    if (m !== 'POST') return fail(405, 'Méthode non permise');
    const body = await req.json().catch(() => ({}));
    const sid = newId(16);
    const members = Array.isArray(body.members) ? body.members.slice(0, 2).map((m) => clean(m, 24)).filter(Boolean) : [];
    const meta = { id: sid, name: clean(body.name, 80) || 'FLIP', members: members.length === 2 ? members : ['Zaza', 'Frog'], createdBy: clean(body.createdBy, 24), createdAt: Date.now() };
    await store.setJSON(`${sid}/meta`, meta);
    const rev = await bump(store, sid);
    return json({ meta, rev }, 201);
  }

  // POST /api/espace/trouver { secret } → l'espace qui porte ce mot secret
  if (parts[0] === 'trouver' && parts.length === 1) {
    if (m !== 'POST') return fail(405, 'Méthode non permise');
    const body = await req.json().catch(() => ({}));
    await new Promise((r) => setTimeout(r, 400)); // freine les essais à la chaîne
    if (normSecret(body.secret).length < 4) return fail(404, 'Mot secret inconnu');
    const id = await store.get(await secretKey(body.secret));
    return id ? json({ id }) : fail(404, 'Mot secret inconnu');
  }

  const [sid, kind, key, sub] = parts;
  if (!ID.test(sid)) return fail(400, 'Espace invalide');
  const meta = await store.get(`${sid}/meta`, { type: 'json' });
  if (!meta) return fail(404, 'Espace introuvable');

  // GET /api/espace/:sid → méta + révision ; PATCH → renommer ; DELETE → tout effacer
  if (!kind) {
    if (m === 'GET') return json({ meta, rev: (await store.get(`${sid}/rev`)) || '' });
    if (m === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      if (body.name != null) meta.name = clean(body.name, 80) || meta.name;
      if (Array.isArray(body.members)) meta.members = body.members.slice(0, 2).map((m) => clean(m, 24)).filter(Boolean);
      // Réglages libres du duo (objectif, vision, plan, mot d'accueil) : petits objets JSON.
      if (body.secret != null) {
        // L'empreinte reste hors de la méta (que les clients reçoivent).
        const k = normSecret(body.secret).length >= 4 ? await secretKey(body.secret) : null;
        const taken = k && await store.get(k);
        if (taken && taken !== sid) return fail(409, 'Ce mot secret est déjà pris : choisis-en un autre.');
        const old = await store.get(`${sid}/secretkey`);
        if (old && old !== k) await store.delete(old);
        if (k) { await store.set(k, sid); await store.set(`${sid}/secretkey`, k); } else await store.delete(`${sid}/secretkey`);
        meta.hasSecret = !!k;
      }
      for (const k of ['goal', 'vision', 'plan', 'welcome', 'tour', 'seen', 'projets', 'lune']) {
        if (body[k] != null) {
          const txt = JSON.stringify(body[k]);
          if (txt.length > 20000) return fail(413, 'Réglage trop volumineux');
          meta[k] = JSON.parse(txt);
        }
      }
      await store.setJSON(`${sid}/meta`, meta);
      return json({ meta, rev: await bump(store, sid) });
    }
    if (m === 'DELETE') {
      const old = await store.get(`${sid}/secretkey`);
      if (old) await store.delete(old);
      const { blobs } = await store.list({ prefix: `${sid}/` });
      await Promise.all(blobs.map((b) => store.delete(b.key)));
      return json({ deleted: blobs.length });
    }
    return fail(405, 'Méthode non permise');
  }

  // GET /api/espace/:sid/rev → révision seule (sondage léger)
  if (kind === 'rev' && m === 'GET') return json({ rev: (await store.get(`${sid}/rev`)) || '' });

  // Entrées du carnet
  if (kind === 'entries') {
    if (!key) {
      if (m !== 'GET') return fail(405, 'Méthode non permise');
      const rev = (await store.get(`${sid}/rev`)) || '';
      const { blobs } = await store.list({ prefix: `${sid}/e/` });
      const entries = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);
      entries.sort((a, b) => b.createdAt - a.createdAt);
      return json({ rev, entries, meta });
    }
    if (!ID.test(key)) return fail(400, 'Entrée invalide');
    const k = `${sid}/e/${key}`;
    if (m === 'GET') {
      const e = await store.get(k, { type: 'json' });
      return e ? json(e) : fail(404, 'Entrée introuvable');
    }
    if (m === 'PUT') {
      const text = await req.text();
      if (text.length > MAX_ENTRY) return fail(413, 'Entrée trop volumineuse');
      let body;
      try { body = JSON.parse(text); } catch { return fail(400, 'JSON invalide'); }
      const prev = await store.get(k, { type: 'json' });
      // Conflit : quelqu'un d'autre a modifié l'entrée depuis la version que le client avait.
      if (prev && body.baseUpdatedAt && prev.updatedAt > body.baseUpdatedAt && !body.force) {
        return json({ conflict: true, current: prev }, 409);
      }
      const e = body.entry || {};
      if (!TYPES.has(e.type)) return fail(400, 'Type inconnu');
      const now = Date.now();
      const entry = {
        id: key,
        type: e.type,
        title: clean(e.title, 200),
        body: clean(e.body, 100000),
        author: clean(e.author, 40),
        tags: Array.isArray(e.tags) ? e.tags.slice(0, 12).map((t) => clean(t, 30)) : [],
        data: e.data && typeof e.data === 'object' ? e.data : null,
        audio: e.audio && ID.test(e.audio.id || '') ? { id: e.audio.id, type: clean(e.audio.type, 60), parts: Math.min(MAX_PARTS, +e.audio.parts || 1), size: +e.audio.size || 0, duration: +e.audio.duration || 0 } : null,
        // Une image (photo, dessin, toile) : même rangement en morceaux que les audios.
        image: e.image && ID.test(e.image.id || '') && /^image\//.test(e.image.type || '') ? { id: e.image.id, type: clean(e.image.type, 60), parts: Math.min(MAX_PARTS, +e.image.parts || 1), size: +e.image.size || 0, w: +e.image.w || 0, h: +e.image.h || 0 } : null,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
        editedBy: clean(e.author, 40),
      };
      await store.setJSON(k, entry);
      return json({ entry, rev: await bump(store, sid) });
    }
    if (m === 'DELETE') {
      const e = await store.get(k, { type: 'json' });
      for (const f of [e?.audio, e?.image].filter(Boolean)) {
        const { blobs } = await store.list({ prefix: `${sid}/a/${f.id}/` });
        await Promise.all(blobs.map((b) => store.delete(b.key)));
      }
      await store.delete(k);
      return json({ rev: await bump(store, sid) });
    }
    return fail(405, 'Méthode non permise');
  }

  // Audio en morceaux : PUT/GET /api/espace/:sid/audio/:aid/:n
  if (kind === 'audio') {
    if (!ID.test(key || '')) return fail(400, 'Audio invalide');
    const n = Number(sub);
    if (!Number.isInteger(n) || n < 0 || n >= MAX_PARTS) return fail(400, 'Morceau invalide');
    const k = `${sid}/a/${key}/${n}`;
    if (m === 'PUT') {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_PART) return fail(413, 'Morceau trop gros');
      await store.set(k, buf, { metadata: { type: clean(req.headers.get('content-type'), 60) } });
      return json({ ok: true, size: buf.byteLength });
    }
    if (m === 'GET') {
      const r = await store.getWithMetadata(k, { type: 'arrayBuffer' });
      if (!r) return fail(404, 'Morceau introuvable');
      return new Response(r.data, {
        headers: { 'content-type': r.metadata?.type || 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable' },
      });
    }
    return fail(405, 'Méthode non permise');
  }

  return fail(404, 'Route inconnue');
}

export default async (req) => {
  try {
    return await handle(req, getStore({ name: 'diapason-espaces', consistency: 'strong' }));
  } catch (e) {
    console.error(e);
    return fail(500, 'Erreur du serveur');
  }
};
