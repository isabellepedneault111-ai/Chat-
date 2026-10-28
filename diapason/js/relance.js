// La relance douce sur le téléphone : abonner ce navigateur aux notifications de l'app (service worker sw.js), et
// garder l'abonnement côté serveur (/api/push), jamais dans l'espace partagé. Aucun numéro de téléphone.
import { espace, profileOf, saveProfile } from './espace.js';

// Les cas où le navigateur ne peut pas recevoir de notification : l'iPhone hors de l'écran d'accueil, ou trop ancien.
const iphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const installee = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
export const relancePossible = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const aInstaller = () => iphone() && !installee();

// La clé publique du serveur, en octets (ce que demande le navigateur).
const octets = (b64) => { const p = '='.repeat((4 - (b64.length % 4)) % 4); const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
const api = (chemin, opt) => fetch(`/api/push/${chemin}`, opt).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Le serveur ne répond pas'); return d; });

// Où on en est sur cet appareil : 'actif', 'refuse' (bloqué dans le navigateur), 'possible', 'installer' (iPhone) ou 'impossible'.
export async function etatRelance() {
  if (aInstaller()) return 'installer';
  if (!relancePossible()) return 'impossible';
  if (Notification.permission === 'denied') return 'refuse';
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ? 'actif' : 'possible';
}

// Active la relance sur ce téléphone : permission, abonnement, enregistrement au serveur, et une notification d'essai.
export async function activerRelance() {
  if (Notification.permission !== 'granted' && (await Notification.requestPermission()) !== 'granted') throw new Error('Les notifications sont refusées dans le navigateur.');
  const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
  const { cle } = await api('cle');
  const abo = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: octets(cle) }));
  await api(`${espace.id}/${encodeURIComponent(espace.me)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ abonnement: abo.toJSON() }) });
  await saveProfile(() => ({ relance: Date.now() })).catch(() => {});
  await api(`${espace.id}/${encodeURIComponent(espace.me)}/essai`, { method: 'POST' }).catch(() => {});
}

// La coupe : plus de notification sur ce téléphone.
export async function couperRelance() {
  const reg = await navigator.serviceWorker.getRegistration(); const abo = await reg?.pushManager.getSubscription();
  await abo?.unsubscribe().catch(() => {});
  await api(`${espace.id}/${encodeURIComponent(espace.me)}`, { method: 'DELETE' }).catch(() => {});
  await saveProfile(() => ({ relance: null })).catch(() => {});
}

// Le petit bloc « La relance douce » : il dit où on en est et offre le bon geste.
export const relanceActive = (qui = espace.me) => !!profileOf(qui)?.relance;
// aDecider : seulement s'il reste une décision à prendre (ni déjà activée, ni déclinée, ni impossible) ; sinon, rien.
// Le bloc complet reste dans les réglages du mur, pour changer d'idée.
export async function relanceHTML({ aDecider = false } = {}) {
  const e = await etatRelance().catch(() => 'impossible');
  if (aDecider && (e === 'actif' || e === 'impossible' || profileOf(espace.me)?.relance || profileOf(espace.me)?.relanceNon)) return '';
  const bouton = { actif: '<button class="btn small" data-relance="couper">Couper</button><button class="btn small ghost" data-relance="essai">Envoyer un essai</button>', possible: '<button class="btn small primary" data-relance="activer">Activer sur ce téléphone</button><button class="btn small ghost" data-relance="non">Pas pour moi</button>' }[e] || '';
  const texte = {
    actif: 'Activée sur cet appareil. Quand ton fil est calme depuis cinq jours, une invitation arrive ici (jamais plus d’une fois par cinq jours, vers 18 h).',
    possible: 'Quand ton fil est calme depuis cinq jours, une invitation douce arrive sur ce téléphone : ce que l’autre t’a lancé, ou juste une idée. Jamais plus d’une fois par cinq jours, vers 18 h. Aucun numéro de téléphone.',
    refuse: 'Les notifications sont bloquées pour cette app dans le navigateur. Débloque-les dans les réglages du site (le cadenas à côté de l’adresse), puis reviens ici.',
    installer: 'Sur iPhone, les notifications marchent quand l’app est sur l’écran d’accueil : dans Safari, touche Partager (le carré avec la flèche), puis « Sur l’écran d’accueil ». Ouvre ensuite FLIP depuis son icône et reviens ici.',
    impossible: 'Ce navigateur ne reçoit pas de notifications. Sur téléphone : Chrome (Android) ou Safari (iPhone, avec l’app sur l’écran d’accueil).',
  }[e];
  return `<section class="relance-bloc" data-etat="${e}"><h2>La relance douce, sur ton téléphone</h2><p>${texte}</p>${bouton ? `<div class="relance-b">${bouton}</div>` : ''}</section>`;
}

// Branche les boutons du bloc ; rendre() redessine la page après le geste.
export function brancherRelance(root, rendre, toast) {
  root.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-relance]'); if (!b) return; const g = b.dataset.relance; b.disabled = true;
    try {
      if (g === 'activer') { await activerRelance(); toast('Relance activée : une notification d’essai arrive. Pour la couper : le Mur, ⚙ Réglages.'); }
      if (g === 'couper') { await couperRelance(); toast('Relance coupée sur ce téléphone.'); }
      if (g === 'non') { await saveProfile(() => ({ relanceNon: Date.now() })); toast('Compris : pas de relance sur le téléphone. Pour changer d’idée : le Mur, ⚙ Réglages.'); }
      if (g === 'essai') { await api(`${espace.id}/${encodeURIComponent(espace.me)}/essai`, { method: 'POST' }); toast('Essai envoyé.'); }
    } catch (err) { toast(err.message); }
    b.disabled = false; rendre();
  });
}
