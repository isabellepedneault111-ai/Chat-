// La relance douce, jusqu'au téléphone : une notification quand le fil de quelqu'un est calme depuis cinq jours.
// Aucun numéro de téléphone : le navigateur donne une adresse d'abonnement anonyme, gardée dans un coffre à part
// (diapason-push), que l'API de l'espace ne renvoie jamais. Les clés d'envoi (VAPID) naissent ici, au premier usage,
// et restent dans ce coffre : rien de secret dans le dépôt public.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export const config = { path: ['/api/push', '/api/push/*'] };

const J = 864e5;
const CALME = 5 * J; // un fil calme depuis cinq jours
const ID = /^[A-Za-z0-9_-]{8,40}$/;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (status, message) => json({ error: message }, status);

// Les clés d'envoi : créées une seule fois, gardées dans le coffre.
async function cles(coffre) {
  let v = await coffre.get('vapid', { type: 'json' });
  if (!v) { v = webpush.generateVAPIDKeys(); await coffre.setJSON('vapid', v); }
  webpush.setVapidDetails('https://diapason-labo.netlify.app', v.publicKey, v.privateKey);
  return v;
}

// Le dernier geste d'une personne : ce qu'elle a créé, ses mots sur les idées, les idées qu'elle a fait monter, ce
// qu'elle a fait à la demande de l'autre, ses séances. (La même lecture que la tresse, côté serveur.)
export function dernierGeste(entries, qui) {
  let t = 0; const max = (x) => { if (x > t) t = x; };
  for (const e of entries) {
    const d = e.data || {};
    if (e.author === qui && !['profil', 'trace', 'evaluation', 'parcours', 'plage', 'pas', 'semaine'].includes(e.type) && !e.demo && !d.demo) max(e.type === 'session' ? d.doneAt || 0 : e.createdAt);
    (d.replies || []).forEach((r) => r.by === qui && max(r.at));
    (d.moves || []).forEach((m) => m.by === qui && max(m.at));
    if (e.type === 'profil' && e.author === qui) Object.values(d.faits || {}).forEach(max);
  }
  return t;
}

// Ce que l'autre a lancé à cette personne au relais et qui attend encore sa réponse (le plus récent).
export function cequiAttend(entries, qui) {
  const repondu = new Set(entries.filter((e) => e.author === qui).flatMap((e) => [e.data?.over, e.data?.thread]).filter(Boolean));
  const faits = entries.find((e) => e.type === 'profil' && e.author === qui)?.data?.faits || {};
  return entries.filter((e) => e.author && e.author !== qui && e.data?.relais && !e.data?.thread && !repondu.has(e.id) && !faits[e.id] && Date.now() - e.createdAt < 21 * J)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
}

// Le message : une invitation, jamais un reproche ; il nomme ce qui attend, s'il y a quelque chose.
export function message(entries, qui, autre) {
  const a = cequiAttend(entries, qui);
  if (a) return { titre: `${autre} t’a lancé « ${String(a.title || 'quelque chose').slice(0, 60)} »`, texte: 'Un son de 10 secondes ou un mot suffit pour répondre. Quand tu veux.', url: './#/relais' };
  return { titre: 'Diapason Labo', texte: `Ton fil est calme ces jours-ci. Une idée, un son, un mot pour ${autre} : quand tu veux.`, url: './#/relais' };
}

async function envoyer(coffre, cle, abo, msg) {
  try { await webpush.sendNotification(abo, JSON.stringify(msg), { TTL: 24 * 3600 }); return true; } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) await coffre.delete(cle); // l'abonnement n'existe plus
    console.error('push', e.statusCode || e.message); return false;
  }
}

// La tournée quotidienne : pour chaque téléphone abonné, si le fil est calme depuis cinq jours (et qu'on ne l'a pas
// déjà relancé dans les cinq derniers jours), une notification.
export async function tournee(coffre, espaces, maintenant = Date.now()) {
  await cles(coffre);
  const { blobs } = await coffre.list({ prefix: 'abo/' }); const faits = [];
  for (const b of blobs) {
    const [, sid, qui] = b.key.split('/');
    const meta = await espaces.get(`${sid}/meta`, { type: 'json' }); if (!meta) continue;
    const autre = (meta.members || []).find((m) => m !== qui) || 'l’autre';
    const env = await coffre.get(`envoi/${sid}/${qui}`, { type: 'json' });
    if (env && maintenant - env.at < CALME) continue;
    const { blobs: eb } = await espaces.list({ prefix: `${sid}/e/` });
    const entries = (await Promise.all(eb.map((x) => espaces.get(x.key, { type: 'json' })))).filter(Boolean);
    const dernier = dernierGeste(entries, qui);
    if (!dernier || maintenant - dernier < CALME) continue;
    const abo = await coffre.get(b.key, { type: 'json' });
    if (await envoyer(coffre, b.key, abo.abonnement, message(entries, qui, autre))) { await coffre.setJSON(`envoi/${sid}/${qui}`, { at: maintenant }); faits.push(`${sid}/${qui}`); }
  }
  return faits;
}

// L'API : la clé publique, s'abonner, se désabonner, une notification d'essai.
export async function handle(req, coffre, espaces) {
  const parts = new URL(req.url).pathname.replace(/^\/api\/push\/?/, '').split('/').filter(Boolean); const m = req.method;
  if (parts[0] === 'cle' && m === 'GET') return json({ cle: (await cles(coffre)).publicKey });
  const [sid, qui, essai] = parts;
  if (!ID.test(sid || '') || !qui) return fail(404, 'Route inconnue');
  const meta = await espaces.get(`${sid}/meta`, { type: 'json' }); if (!meta) return fail(404, 'Espace introuvable');
  if (!(meta.members || []).includes(qui)) return fail(400, 'Membre inconnu');
  const cle = `abo/${sid}/${qui}`;
  if (!essai && m === 'PUT') {
    const { abonnement } = await req.json().catch(() => ({}));
    if (!abonnement?.endpoint || !/^https:\/\//.test(abonnement.endpoint) || !abonnement.keys?.p256dh) return fail(400, 'Abonnement invalide');
    await coffre.setJSON(cle, { abonnement, at: Date.now() }); return json({ ok: true });
  }
  if (!essai && m === 'DELETE') { await coffre.delete(cle); return json({ ok: true }); }
  if (essai === 'essai' && m === 'POST') {
    const abo = await coffre.get(cle, { type: 'json' }); if (!abo) return fail(404, 'Pas d’abonnement');
    await cles(coffre);
    const ok = await envoyer(coffre, cle, abo.abonnement, { titre: 'La relance douce est branchée', texte: 'Quand ton fil sera calme depuis cinq jours, une invitation arrivera ici. Pas plus d’une fois par cinq jours.', url: './#/elan' });
    return ok ? json({ ok: true }) : fail(502, 'Envoi impossible');
  }
  return fail(405, 'Méthode non permise');
}

export default async (req) => {
  try { return await handle(req, getStore({ name: 'diapason-push', consistency: 'strong' }), getStore({ name: 'diapason-espaces', consistency: 'strong' })); } catch (e) { console.error(e); return fail(500, 'Erreur du serveur'); }
};
