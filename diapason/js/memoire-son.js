// La dernière chanson passée dans L'oreille, gardée sur cet appareil seulement (IndexedDB) : Mots sur la grille la
// fait jouer sous les paroles même après un rechargement. Rien ne part sur le serveur.
const bd = () => new Promise((ok, ko) => { const r = indexedDB.open('flip-sons', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
export async function garderDerniere(fiche) { try { const d = await bd(); d.transaction('s', 'readwrite').objectStore('s').put(fiche, 'derniere'); } catch { /* navigation privée : tant pis */ } }
export async function lireDerniere() { try { const d = await bd(); return await new Promise((ok) => { const r = d.transaction('s').objectStore('s').get('derniere'); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch { return null; } }
