// Les sons qui arrivent sur l'ordi s'ouvrent tout seuls dans L'oreille.
// Trois chemins : (1) glisser un fichier n'importe où dans l'app ; (2) FLIP installé comme app (Chrome ou Edge) :
// double-clic sur un mémo → « Ouvrir avec FLIP » ; (3) surveiller un dossier (Téléchargements, où arrive l'AirDrop) :
// chaque nouveau son s'ouvre dans L'oreille, peu importe la page où on est. Les fichiers ne quittent pas l'ordi.
const SONS = /\.(m4a|qta|mov|mp4|caf|aac|mp3|wav|aif|aiff|flac|ogg|opus|webm)$/i;
let annonce = () => {};
export const surEtat = (f) => { annonce = f; f(etat); };
let etat = { actif: false, dossier: '', reprendre: false };
const dire = (e) => { etat = { ...etat, ...e }; annonce(etat); };

// Ouvre un fichier dans L'oreille (ou le passe à L'oreille si on y est déjà).
export function ouvrirDansOreille(blob, nom) {
  window.__flipOreille = { blob, nom: nom.replace(/\.[^.]+$/, '') };
  if (location.hash.startsWith('#/oreille')) dispatchEvent(new CustomEvent('flip:oreille'));
  else location.hash = '#/oreille';
}

// La poignée du dossier, gardée dans le navigateur (IndexedDB) pour la retrouver au prochain chargement.
const bd = () => new Promise((ok, ko) => { const r = indexedDB.open('flip-arrivee', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
const lire = async () => { try { const d = await bd(); return await new Promise((ok) => { const r = d.transaction('h').objectStore('h').get('dossier'); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch { return null; } };
const ecrire = async (h) => { try { const d = await bd(); d.transaction('h', 'readwrite').objectStore('h').put(h, 'dossier'); } catch { /* rien */ } };

export const dossierPossible = () => 'showDirectoryPicker' in window;
let poignee = null; let minuterie = 0; const vus = new Map(); // nom → taille

async function releve() {
  const l = [];
  for await (const [nom, h] of poignee.entries()) if (h.kind === 'file' && SONS.test(nom) && !nom.startsWith('.')) l.push([nom, h]);
  return l;
}
async function demarrer() {
  clearInterval(minuterie); vus.clear();
  for (const [nom, h] of await releve()) { try { vus.set(nom, (await h.getFile()).size); } catch { /* illisible */ } }
  dire({ actif: true, dossier: poignee.name, reprendre: false });
  const enAttente = new Map(); // un fichier qui grossit encore (copie en cours) attend un tour
  minuterie = setInterval(async () => {
    try {
      for (const [nom, h] of await releve()) {
        if (vus.has(nom)) continue;
        const f = await h.getFile(); if (!f.size) continue;
        if (enAttente.get(nom) !== f.size) { enAttente.set(nom, f.size); continue; }
        vus.set(nom, f.size); enAttente.delete(nom);
        import('./ui.js').then((u) => u.toast(`« ${nom} » vient d’arriver : je l’ouvre dans L’oreille.`));
        ouvrirDansOreille(f, nom);
      }
    } catch { clearInterval(minuterie); dire({ actif: false, reprendre: true }); }
  }, 2000);
}
// Choisir le dossier (un geste est nécessaire), puis le surveiller.
export async function surveiller() {
  try { poignee = await window.showDirectoryPicker({ id: 'flip-arrivee', mode: 'read', startIn: 'downloads' }); }
  catch (e) { if (e?.name !== 'AbortError') import('./ui.js').then((u) => u.toast('Ce dossier est protégé par le navigateur : choisis plutôt un dossier à l’intérieur (ex. Téléchargements).')); return; }
  await ecrire(poignee); await demarrer();
}
// Au rechargement : on reprend tout seul si le navigateur a gardé la permission, sinon un bouton « Reprendre ».
export async function reprendre(geste = false) {
  poignee = poignee || await lire(); if (!poignee) return;
  let p = await poignee.queryPermission?.({ mode: 'read' });
  if (p !== 'granted' && geste) p = await poignee.requestPermission?.({ mode: 'read' });
  if (p === 'granted') await demarrer(); else dire({ actif: false, dossier: poignee.name, reprendre: true });
}
export function arreter() { clearInterval(minuterie); dire({ actif: false, reprendre: !!poignee }); }

export function initArrivee() {
  // (1) Un fichier son glissé n'importe où dans l'app (sauf sur une zone qui s'en occupe déjà).
  addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
  addEventListener('drop', (e) => {
    if (e.defaultPrevented) return; const f = e.dataTransfer?.files?.[0]; if (!f) return;
    e.preventDefault();
    if (!SONS.test(f.name) && !/^(audio|video)\//.test(f.type)) { import('./ui.js').then((u) => u.toast('Ce n’est pas un son : L’oreille prend les mémos, mp3, m4a, wav…')); return; }
    ouvrirDansOreille(f, f.name);
  });
  // (2) FLIP installé : un mémo ouvert « avec FLIP » arrive ici.
  if ('launchQueue' in window) window.launchQueue.setConsumer(async (p) => { const h = p.files?.[0]; if (!h) return; const f = await h.getFile(); ouvrirDansOreille(f, f.name); });
  // (3) Le dossier surveillé, s'il y en avait un.
  if (dossierPossible()) reprendre(false);
}
