// Mots sur la grille (Ma voix) : un thème, des mots-clés, une grille d'accords (celle de L'oreille, celle de Jouer,
// ou tapée à la main). FLIP assemble des lignes brouillon qui tombent sur les temps et riment, puis les chante
// sur les accords : la voix-guide prend les notes de l'accord sur les temps forts.
import { audio, out, drums, startMic, stopMic, onPitch } from '../audio.js';
import { joue, prechargerSons, accord as accordSon, notePiano } from '../sampler.js';
import { espace, profileOf, saveEntry, audioURL, onEspace } from '../espace.js';
import { loadLexique, rimeOf } from '../lexique.js';
import { store, toast } from '../ui.js';
import { esc } from './carnet.js';
import { nomNote } from '../oreille.js';
import { PLACEMENTS, syllabes, placer } from './placer.js';
import { lireDerniere } from '../memoire-son.js';
import { ouvrirFeuille } from '../feuille.js';
import { THEMES, SCHEMAS, banque, ligne, partenaire, hasard, ecarte } from '../paroles-gen.js';
import { PROGRESSIONS } from '../data.js';
import { diagramme } from '../guitare.js';
import { chordIntervals } from '../music.js';

const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14] };
const SUF = { M: '', m: 'm', 7: '7', maj7: 'maj7', m7: 'm7', sus2: 'sus2', sus4: 'sus4', dim: 'dim', add9: 'add9' };
export const nomAcc = (c) => `${NOMS[c.r]}${SUF[c.q] ?? ''}`;

// « Lam », « Sib7 », « Fa♯m », « Am », « C#maj7 » → { r, q }.
export function lireAccord(t) {
  const s = t.trim().replace('#', '♯');
  let m = s.match(/^(Do|Ré|Re|Mi|Fa|Sol|La|Si)(♯|♭|b)?(maj7|m7|m|7|sus2|sus4|dim|add9)?$/i);
  const base = { do: 0, ré: 2, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
  if (m) { const r = base[m[1].toLowerCase()] + (m[2] === '♯' ? 1 : m[2] ? -1 : 0); return { r: (r + 12) % 12, q: m[3] || 'M' }; }
  m = s.match(/^([A-G])(♯|♭|b)?(maj7|m7|m|7|sus2|sus4|dim|add9)?$/);
  if (m) { const r = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '♯' ? 1 : m[2] ? -1 : 0); return { r: (r + 12) % 12, q: m[3] || 'M' }; }
  return null;
}

// Les trois sources de grille : chacune donne des mesures de 4 temps ; un temps = un accord, ou null (on tient).
// Les accords entendus hésitent souvent entre Ré7, Rém7 et Rémaj7 (une seule note change). Dans la tonalité de la
// chanson, on garde la couleur qui y appartient : en ré mineur, Ré7 et Rémaj7 redeviennent Rém (ou Rém7 si sa 7e est
// dans la gamme). Seul le V en mineur peut rester majeur (La en ré mineur). Les accords hors gamme restent tels quels.
export function dansLaTonalite(c, ton) {
  if (!c || !ton || !IV[c.q] || /sus|add/.test(c.q)) return c;
  const g = (ton.mineur ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]); const rel = (c.r - ton.r + 12) % 12;
  if (!g.includes(rel)) return c;
  const dans = (x) => g.includes((rel + x) % 12);
  const majeur = ton.mineur && rel === 7 && !['m', 'm7'].includes(c.q) ? true : dans(4);
  const tri = majeur ? 'M' : dans(7) ? 'm' : 'dim'; if (tri === 'dim') return { r: c.r, q: 'dim' };
  const sept = /7/.test(c.q); const q = !sept ? tri : tri === 'm' ? (dans(10) ? 'm7' : 'm') : dans(11) ? 'maj7' : dans(10) ? '7' : 'M';
  return { r: c.r, q };
}
// La tonalité écrite « Ré mineur » → { r: 2, mineur: true }.
export function lireTon(t) { const m = String(t || '').match(/^(\S+)\s+(majeur|mineur)/i); const c = m && lireAccord(m[1]); return c ? { r: c.r, mineur: /mineur/i.test(m[2]) } : null; }
// Les mesures nettoyées : les accords dans la tonalité, et un accord qui se répète n'est pas réécrit.
function nettoyer(mesures, ton) {
  let avant = null;
  return mesures.map((m) => m.map((x) => { const c = dansLaTonalite(x && x !== '—' ? (typeof x === 'string' ? lireAccord(x) : x) : null, ton); if (!c) return null; if (avant && avant.r === c.r && avant.q === c.q) return null; avant = c; return c; }));
}
function grilleOreille() {
  const g = store.get('oreilleGrille', null); if (!g?.mesures?.length) return null;
  const ton = lireTon(g.ton);
  return { nom: g.nom ? `L’oreille · ${g.nom}` : 'La dernière grille de L’oreille', bpm: g.bpm || 90, ton, mesures: nettoyer(g.mesures, ton) };
}
function grilleJouer() {
  const key = store.get('key', 0); const bpm = store.get('bpm', 92); const id = store.get('prog', 'pop');
  const p = (id === 'perso' && store.get('customProg', null)) || (id === 'seance' && store.get('seanceProg', null)) || PROGRESSIONS.find((x) => x.id === id) || PROGRESSIONS[0];
  const ch = p.hasard || !p.chords ? PROGRESSIONS[0].chords : p.chords;
  const temps = []; ch.forEach(([rel, q, b]) => { const n = b || 4; for (let k = 0; k < n; k++) temps.push(k ? null : { r: (((key + rel) % 12) + 12) % 12, q: IV[q] ? q : 'M' }); });
  while (temps.length % 4) temps.push(null);
  const mesures = []; for (let i = 0; i < temps.length; i += 4) mesures.push(temps.slice(i, i + 4));
  return { nom: `Jouer · ${p.name || 'la grille'}`, bpm, mesures };
}
function grilleMain(texte, bpm) {
  // Un accord par mesure ; « Fa/Do » : deux accords dans la mesure (deux temps chacun).
  const mesures = texte.split(/[\s|,]+/).filter(Boolean).map((t) => { const l = t.split('/').map(lireAccord).filter(Boolean); return l.length === 2 ? [l[0], null, l[1], null] : [l[0] || null, null, null, null]; }).filter((m) => m[0]);
  return mesures.length ? { nom: 'Mes accords', bpm, mesures } : null;
}
// L'accord qui sonne à un temps (on remonte jusqu'au dernier changement, en bouclant la grille).
function accordA(g, mesure, temps) {
  const M = g.mesures.length; let i = mesure * 4 + temps;
  for (let k = 0; k < M * 4; k++) { const j = ((i - k) % (M * 4) + M * 4) % (M * 4); const c = g.mesures[Math.floor(j / 4)][j % 4]; if (c) return c; }
  return { r: 0, q: 'M' };
}
// La gamme majeure qui contient le mieux tous les accords (pondérés par leur durée).
function gammeDe(g) {
  const poids = Array(12).fill(0); const M = g.mesures.length;
  for (let m = 0; m < M; m++) for (let t = 0; t < 4; t++) { const c = accordA(g, m, t); (IV[c.q] || IV.M).forEach((x) => { poids[(c.r + x) % 12] += 1; }); }
  let best = 0; let bs = -1;
  for (let k = 0; k < 12; k++) { const s = [0, 2, 4, 5, 7, 9, 11].reduce((a, x) => a + poids[(k + x) % 12], 0); if (s > bs) { bs = s; best = k; } }
  return [0, 2, 4, 5, 7, 9, 11].map((x) => (best + x) % 12);
}

// La chanson venue de L'oreille reste en mémoire tant que la page n'est pas rechargée.
let chansonGardee = null;
const chansonsPieces = new Map(); // id → promesse du son décodé
const piecesEsp = () => (espace.connected ? espace.entries.filter((e) => e.audio && e.data?.piece?.grille?.length) : []);

// L'accord principal (la « maison ») : la gamme qui contient le mieux la grille, puis, entre son accord majeur (I)
// et son mineur relatif (vi), celui qui sonne le plus longtemps, avec un bonus pour le premier et le dernier accord.
function accordPrincipal(g) {
  if (g.ton) return { r: g.ton.r, q: g.ton.mineur ? 'm' : 'M' }; // L'oreille a entendu la tonalité : c'est la maison
  const k = gammeDe(g)[0]; const M = { r: k, q: 'M' }; const m = { r: (k + 9) % 12, q: 'm' };
  let sM = 0; let sm = 0; const L = g.mesures.length;
  for (let i = 0; i < L; i++) for (let t = 0; t < 4; t++) { const c = accordA(g, i, t); const mi = c.q === 'm' || c.q === 'm7'; if (c.r === M.r && !mi) sM++; if (c.r === m.r && mi) sm++; }
  const bout = (c) => { const mi = c.q === 'm' || c.q === 'm7'; return c.r === m.r && mi ? 'm' : c.r === M.r && !mi ? 'M' : ''; };
  const a = bout(accordA(g, 0, 0)); const z = bout(accordA(g, L - 1, 3)); if (a === 'm') sm += 3; if (a === 'M') sM += 3; if (z === 'm') sm += 2; if (z === 'M') sM += 2;
  return sm > sM ? m : M;
}
const memeAccord = (a, b) => a && b && a.r === b.r && ((a.q === 'm' || a.q === 'm7') === (b.q === 'm' || b.q === 'm7'));

export default {
  id: 'mots',
  mount(el) {
    const st = { theme: 'nuit', themes: null, cles: '', schema: 'AABB', place: 'croches', pers: 'je', n: 4, source: 'jouer', main: 'Lam Fa Do Sol', ...store.get('motsReglages', {}) };
    if (!Array.isArray(st.themes) || !st.themes.length) st.themes = [st.theme || 'nuit'];
    // Les paroles appartiennent à UNE chanson : chaque chanson garde ses lignes, son départ et ses silences.
    const nomPropre = (n) => String(n || '').replace(/( \(sans bruit\)| · montée)+$/, '').trim(); // une version nettoyée ou coupée reste la même chanson
    const nomJouer = () => nomPropre(grilleJouer().nom.replace(/^Jouer · /, '').replace(/^Accords de « (.*) »$/, '$1').replace(/^« (.*) »$/, '$1'));
    // Une chanson = son nom = un seul tiroir de paroles, qu'on l'ouvre par L'oreille, par Jouer ou par Nos pièces.
    const nomPiece = (src) => piecesEsp().find((e) => `piece:${e.id}` === src)?.title || '';
    const cleDe = (src) => (src === 'oreille' ? `chanson:${nomPropre(store.get('oreilleGrille', null)?.nom)}` : src === 'jouer' ? `chanson:${nomJouer()}` : src.startsWith('piece:') ? `chanson:${nomPropre(nomPiece(src)) || src}` : src);
    const normCle = (k) => { const m = String(k).match(/^(oreille|jouer):(.*)$/); if (m) return `chanson:${nomPropre(m[2])}`; if (String(k).startsWith('piece:')) { const n = nomPropre(nomPiece(k)); return n ? `chanson:${n}` : k; } return k; };
    const nomDeCle = (k) => (k.startsWith('chanson:') ? k.slice(8) || 'la dernière de L’oreille' : k === 'main' ? 'mes accords tapés' : k);
    let parChanson = store.get('motsParChanson', null);
    if (!parChanson) { parChanson = {}; const vieilles = store.get('motsLignes', []); if (vieilles.length) parChanson[cleDe(st.source)] = { lignes: vieilles, debut: st.debut || 1, avant: true }; }
    if (parChanson.jouer) { const k = cleDe('jouer'); if (!parChanson[k]) parChanson[k] = { ...parChanson.jouer, avant: true }; delete parChanson.jouer; }
    Object.keys(parChanson).forEach((k) => { const m = k.match(/^(oreille|jouer):(.*)$/) || (k.startsWith('piece:') ? [k, 'piece', nomPiece(k)] : null); if (!m || !m[2]) return; const k2 = `chanson:${nomPropre(m[2])}`; if (!parChanson[k2] || (parChanson[k2].at || 0) < (parChanson[k].at || 0)) parChanson[k2] = parChanson[k]; delete parChanson[k]; });
    // Les clés d'avant qui portaient « (sans bruit) » rejoignent la chanson elle-même.
    Object.keys(parChanson).forEach((k) => { const k2 = k.replace(/ \(sans bruit\)$/, ''); if (k2 !== k) { if (!parChanson[k2]) parChanson[k2] = parChanson[k]; delete parChanson[k]; } });
    // Des paroles rangées au passage à la 1.03 : peut-être pas avec la bonne chanson. On le signale.
    { const vieilles = JSON.stringify(store.get('motsLignes', [])); Object.values(parChanson).forEach((f) => { if (vieilles !== '[]' && JSON.stringify(f.lignes || []) === vieilles && f.avant !== false) f.avant = true; }); }
    // Venue de L'oreille (« Des paroles sur cette chanson ») : la vraie chanson joue sous les paroles.
    let aCaler = !!window.__flipMots; const texteDemande = !!window.__flipTexte; window.__flipTexte = false;
    let chanson = window.__flipMots || null; window.__flipMots = null;
    if (chanson) chansonGardee = chanson; else chanson = chansonGardee;
    // Une nouvelle grille dans L'oreille depuis la dernière visite : la page s'ouvre dessus.
    { const og = store.get('oreilleGrille', null); if (og?.at && og.at > (st.vuAt || 0)) { st.source = 'oreille'; st.vuAt = og.at; aCaler = true; } }
    if (chanson) st.source = 'oreille';
    // Des lignes écrites avant le filtre (0.89) peuvent traîner en mémoire : celles qui contiennent un mot écarté
    // (et que la personne n'a pas tapé elle-même en mot-clé) sont vidées, puis réécrites.
    const salie = (txt) => { const cles = (st.cles || '').toLowerCase(); return String(txt || '').split(/[\s’',.;:!?]+/).some((w) => w && ecarte(w) && !cles.includes(w.toLowerCase())); };
    let cle = ''; let lignes = []; let aRefaire = false; let avantRangement = false; let feuille = null; // feuille : le texte seul, avec ses temps
    function chargerLignes() {
      cle = cleDe(st.source); const f = parChanson[cle] || {};
      lignes = (f.lignes || []).flatMap((L) => (L.pause && L.txt ? [{ txt: '', garde: true, pause: true }, { ...L, pause: false }] : [L]));
      aRefaire = lignes.some((L) => salie(L.txt)); lignes = lignes.map((L) => (salie(L.txt) ? { txt: '', garde: false } : L));
      st.debut = f.debut || 1; st.cale = !!f.cale; avantRangement = !!f.avant && lignes.length > 0; feuille = f.feuille || null;
    }
    store.set('motsParChanson', parChanson); // le rangement à jour, tout de suite
    chargerLignes();
    if (aCaler && lignes.length) aCaler = false; // cette chanson a déjà ses paroles : on ne touche à rien
    let graine = Date.now() % 100000; let lecture = null; let raf = 0;
    // Ta voix en direct pendant le chant : la hauteur entendue au micro, dessinée sur la mélodie proposée.
    let micLive = store.get('motsMicLive', false); let micOuvert = false; let trace = []; let echelle = null;
    const offPitch = onPitch((r) => { if (micLive && lecture && r?.midi) { trace.push([r.t, r.midi]); if (trace.length > 4000) trace.splice(0, 1000); } });
    async function ouvrirMic() { if (micOuvert) return true; micOuvert = await startMic(); if (!micOuvert) { micLive = false; store.set('motsMicLive', false); toast('Le micro est refusé : autorise-le dans les réglages du navigateur.'); } return micOuvert; }
    const voix = espace.connected ? profileOf(espace.me)?.voix || null : null;
    // Les paroles de chaque chanson voyagent avec l'espace (une entrée cachée par chanson et par personne) :
    // elles se retrouvent sur l'iPhone comme sur l'ordi. La version la plus récente gagne.
    const idDe = (k) => { let h = 0; for (const ch of `${espace.me}|${k}`) h = (h * 31 + ch.codePointAt(0)) >>> 0; return `mots-${String(espace.me || 'x').replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}-${h.toString(36)}`; };
    const envois = new Map();
    const envoyer = (k) => { if (!espace.connected) return; clearTimeout(envois.get(k)); envois.set(k, setTimeout(() => { envois.delete(k); const f = parChanson[k]; if (!f) return; const la = espace.entries.find((e) => e.id === idDe(k)); if (la && (la.data?.at || 0) > (f.at || 0)) return; /* jamais par-dessus plus récent */ saveEntry({ id: idDe(k), type: 'motsgrille', title: k, data: { cle: k, ...f } }, { force: true }).catch(() => {}); }, 1500)); };
    const sauver = () => { store.set('motsReglages', st); parChanson[cle] = { lignes, debut: st.debut || 1, cale: !!st.cale, at: Date.now(), ...(avantRangement ? { avant: true } : {}), ...(feuille ? { feuille } : {}) }; store.set('motsParChanson', parChanson); envoyer(cle); };
    // Ce qui arrive de l'espace (écrit sur un autre appareil) : plus récent que ce qu'on a ici → on le prend.
    function recevoir() {
      if (!espace.connected) return; let ici = false;
      espace.entries.filter((e) => e.type === 'motsgrille' && e.author === espace.me && e.data?.cle).forEach((e) => {
        const k = normCle(e.data.cle); const loc = parChanson[k]; if (loc && (loc.at || 0) >= (e.data.at || 0)) return;
        parChanson[k] = { lignes: e.data.lignes || [], debut: e.data.debut || 1, cale: !!e.data.cale, at: e.data.at || 0 }; if (k === cle) ici = true;
      });
      store.set('motsParChanson', parChanson);
      if (ici && !el.contains(document.activeElement?.closest?.('.mo-txt') || null)) { chargerLignes(); const d = q('[data-m=debut]'); if (d) d.value = st.debut; rendre(); }
    }
    // Changer de chanson : les lignes de l'autre restent rangées avec elle ; celles de la nouvelle reviennent.
    function changerDeChanson() { sauver(); chargerLignes(); const d = q('[data-m=debut]'); if (d) d.value = st.debut; arreter(); rendre(); }
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Ma voix · mots sur la grille</p>
        <h1>Des paroles sur ta chanson.</h1>
      </div></div>
      <section class="panel mo-entete">
        <div class="mo-entete-l">
          <label class="field mo-src"><span>La chanson</span><select data-m="source">
            <option value="oreille">🎧 ${esc(store.get('oreilleGrille', null)?.nom ? `« ${nomPropre(store.get('oreilleGrille', null).nom)} », la dernière passée dans L’oreille` : 'La dernière chanson passée dans L’oreille')}</option>${piecesEsp().length ? `<optgroup label="⭐ Nos pièces">${piecesEsp().map((e) => `<option value="piece:${esc(e.id)}">⭐ ${esc(e.title || 'Notre pièce')}</option>`).join('')}</optgroup>` : ''}<option value="jouer">🎹 Ce qui joue dans Jouer (« ${esc(nomJouer())} »)</option><option value="main">✏️ Des accords que j’écris moi-même</option></select></label>
          <p class="mo-src-aide muted small"></p>
          <label class="field mo-main" ${st.source === 'main' ? '' : 'hidden'}><span>Un accord par mesure</span><input type="text" data-m="main" value="${esc(st.main)}" placeholder="Lam Fa Do Sol"></label>
          <div class="mo-princ" hidden></div>
        </div>
        <div class="ec-row mo-gestes"><button class="btn primary" data-m="chanter">▶ Chanter sur la grille</button><button class="btn" data-m="texte" title="Les paroles seules, la vraie chanson dessous : marquer quand chaque ligne arrive, apprendre, exporter">📄 Le texte seul</button><button class="btn" data-m="caler" title="Les paroles commencent là où la voix entre, les passages sans voix deviennent des silences, et les syllabes suivent les attaques de la chanson">✨ Caler sur la chanson</button><button class="btn" data-m="generer">↻ Écrire les lignes</button><span class="mo-info muted small"></span></div>
      </section>
      <details class="panel mo-reg" ${lignes.length ? '' : 'open'}>
        <summary>⚙ Thèmes, mots-clés et réglages</summary>
        <div class="mo-themes" role="group" aria-label="Thèmes (un ou plusieurs)">${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="mo-th ${st.themes.includes(k) ? 'on' : ''}" data-theme="${k}" aria-pressed="${st.themes.includes(k)}">${st.themes.includes(k) ? '✓ ' : ''}${esc(t.nom)}</button>`).join('')}<span class="muted small mo-th-aide">Coche-en un ou plusieurs : leurs mots se mélangent.</span></div>
        <label class="field mo-cles"><span>Mes mots-clés <small class="muted">(séparés par des virgules ; une expression entière marche aussi)</small></span>
          <input type="text" data-m="cles" value="${esc(st.cles)}" placeholder="lac, fanal, on se retrouve à minuit"></label>
        <div class="mo-choix">

          <label class="field"><span>Sur les temps</span><select data-m="place"><option value="chanson">Comme la chanson (ses attaques)</option>${PLACEMENTS.map((p) => `<option value="${p.id}">${esc(p.nom)} (${p.slots.length} syll.)</option>`).join('')}</select></label>
          <label class="field"><span>Les rimes</span><select data-m="schema">${Object.entries(SCHEMAS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
          <label class="field"><span>Qui parle</span><select data-m="pers"><option value="je">Je</option><option value="tu">Tu</option><option value="mix">Les deux</option></select></label>
          <label class="field mo-debut"><span>Les paroles commencent à la mesure</span><input type="number" min="1" max="64" data-m="debut" value="${+st.debut || 1}" inputmode="numeric"></label>
          <label class="field"><span>Les mots</span><select data-m="pos"><option value="milieu">Sur l’onde</option><option value="dessus">Au-dessus de l’onde</option><option value="dessous">Sous l’onde</option></select></label>
          <label class="field"><span>Lignes</span><select data-m="n"><option>4</option><option>8</option><option>12</option></select></label>
        </div>
        <div class="mo-sous" ${chanson ? '' : 'hidden'}><label class="mo-vraie"><input type="checkbox" data-m="vraie" checked> Sous les paroles : la vraie chanson${chanson ? ` (« ${esc(String(chanson.nom).slice(0, 40))} »)` : ''}</label><label class="mo-vraie"><input type="checkbox" data-m="piano" ${store.get('oreilleGrille', null)?.propose ? 'checked' : ''}> + les accords au piano</label></div>
        <label class="mo-vraie mo-guide"><input type="checkbox" data-m="miclive" ${store.get('motsMicLive', false) ? 'checked' : ''}> 🎤 Ma voix en direct pendant le chant <small class="muted">(le micro dessine ta hauteur sur la mélodie : vert quand c’est juste ; des écouteurs aident)</small></label>
        <label class="mo-vraie mo-guide"><input type="checkbox" data-m="guide"> 🎤 Chœurs sur toutes les lignes <small class="muted">(des « ouuu » synthétiques chantent la note de chaque syllabe ; éteints d’office, ou ligne par ligne avec 🎤)</small></label>

      <div class="ec-row mo-reg-fin"><button class="btn primary" data-m="generer" data-fermer="1">↻ Écrire les lignes avec ces réglages</button><button class="btn" data-m="chanter">▶ Chanter sur la grille</button></div>
      </details>
      <section class="mo-lignes" aria-live="polite"></section>
      <div class="mo-ajout"><button class="btn" data-m="ajout">＋ Ajouter une ligne</button><button class="btn primary" data-m="chanter">▶ Chanter sur la grille</button><span class="muted small">Touche une ligne pour changer ses mots. ↑ ↓ pour la déplacer (ou glisse-la par ⠿).</span></div>
      <div class="mo-lecteur" hidden role="region" aria-label="Pendant que ça chante"></div>
      <section class="panel mo-ranger" hidden></section>
      <section class="panel mo-fin">
        <div class="ec-row"><button class="btn" data-m="placer" title="Écrire → Placer mes paroles : chaque ligne essayée sur 7 rythmes (sur le temps, contretemps, syncopé…), notée, et chantée sur une pièce">→ Essayer 7 rythmes par ligne (Placer)</button><button class="btn" data-m="copier">Copier le texte</button>${espace.connected ? '<button class="btn" data-m="journal">Dans le journal</button>' : ''}</div>
        <p class="muted small">Comment c’est fait : pas d’intelligence artificielle. Des tournures de phrases, des banques de mots par thème, tes mots-clés et leurs synonymes (le dictionnaire de l’app). Pour chaque ligne, FLIP essaie quelques centaines de phrases et garde celle dont les accents tombent le mieux sur les temps forts (le calcul de « Placer ») et qui rime comme demandé. Le genre des mots-clés est deviné : relis les « le / la ».</p>
      </section>
      <nav class="mo-dock" aria-label="Toujours à portée : chanter, écrire, réglages"><button class="btn primary" data-m="chanter" data-lbl="▶ Chanter">▶ Chanter</button><button class="btn" data-m="generer" aria-label="Écrire les lignes">↻ Écrire</button><button class="btn" data-m="texte" aria-label="Le texte seul">📄 Texte</button><button class="btn" data-m="ouvrir-reg" aria-label="Thèmes, mots-clés et réglages">⚙</button></nav>`;
    const q = (s) => el.querySelector(s);
    if (!st.pos) st.pos = 'milieu';
    ['source', 'place', 'schema', 'pers', 'pos'].forEach((k) => { const x = q(`[data-m=${k}]`); if (x) x.value = st[k]; }); q('[data-m=n]').value = String(st.n);

    const grillePiece = () => { const e = piecesEsp().find((x) => `piece:${x.id}` === st.source); if (!e) return null; const p = e.data.piece; const ton = Number.isFinite(p.tonique) ? { r: ((p.tonique % 12) + 12) % 12, mineur: !!p.mineur } : null; return { nom: `Nos pièces · ${e.title}`, bpm: p.bpm || 90, ton, mesures: nettoyer(p.grille, ton) }; };
    // La vraie chanson d'une de nos pièces : téléchargée de l'espace et décodée une fois.
    async function chargerPiece() {
      if (st.source === 'oreille' && !chansonGardee) {
        // Rien en mémoire (rechargement, autre page) : la dernière chanson de L'oreille, gardée sur cet appareil.
        const f = await lireDerniere();
        if (f?.blob) { try { const buf = await audio().decodeAudioData(await f.blob.arrayBuffer()); chansonGardee = { buf, nom: f.nom, t0: f.t0 || 0, temps: f.temps || 0.6, debuts: f.debuts || null, voix: f.voix || null }; chanson = chansonGardee; } catch { /* son illisible */ } }
        majSous(); return;
      }
      if (!st.source.startsWith('piece:')) return;
      const e = piecesEsp().find((x) => `piece:${x.id}` === st.source); if (!e) return;
      if (!chansonsPieces.has(e.id)) chansonsPieces.set(e.id, audioURL(e.audio).then((u) => fetch(u)).then((r) => r.arrayBuffer()).then((b) => audio().decodeAudioData(b)));
      try { const buf = await chansonsPieces.get(e.id); chanson = { buf, nom: e.title, t0: e.data.piece.t1 || 0, temps: e.data.piece.temps || 60 / (e.data.piece.bpm || 90), debuts: e.data.piece.debuts || null, src: st.source, voix: e.data.piece.voix || null }; } catch { chanson = null; }
      majSous();
    }
    function majSous() {
      if (st.source === 'oreille' && chanson?.src) chanson = chansonGardee;
      const vraiOk = !!chanson && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source);
      const sous = q('.mo-sous'); if (sous) { sous.hidden = !vraiOk; const l = sous.querySelector('.mo-vraie'); if (l && chanson) l.lastChild.textContent = ` Sous les paroles : la vraie chanson (« ${String(chanson.nom).slice(0, 40)} »)`; }
      // La voix-guide : à toi de choisir ; sinon, elle se tait quand la vraie chanson joue.
      const cb = q('[data-m=guide]'); if (cb) cb.checked = !!store.get('motsChoeurs', false); // éteints d'office
    }
    const grille = () => (st.source.startsWith('piece:') ? grillePiece() : st.source === 'oreille' ? grilleOreille() : st.source === 'main' ? grilleMain(st.main, store.get('bpm', 92)) : grilleJouer()) || grilleJouer();
    // Les paroles peuvent commencer plus loin (une intro, des silences) : la ligne i prend les mesures debut + 2i et suivante.
    // Les rimes se comptent sur les lignes de paroles seulement : un silence ne casse pas le schéma.
    const kP = (i) => lignes.slice(0, i).filter((L) => !L.pause).length;
    const partL = (i) => { if (lignes[i]?.pause) return null; const idx = lignes.map((L, k) => (L.pause ? -1 : k)).filter((k) => k >= 0); const pk = partenaire(st.schema, idx.indexOf(i)); return pk == null ? null : idx[pk]; };
    const txtDe = (L) => (L?.pause ? '' : L?.txt || '');
    const deb = () => Math.max(0, (+st.debut || 1) - 1);
    const mDe = (i, h, M) => (deb() + 2 * i + h) % M;
    const vraiOk = () => !!chanson && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source);
    // Le passage de la vraie chanson sous une ligne (deux mesures).
    // L'instant où commence la mesure m dans la vraie chanson. Si L'oreille a suivi les temps un par un (le tempo bouge),
    // chaque mesure a son propre début ; sinon, un tempo fixe depuis t0.
    const tMes = (m) => { const d = chanson?.debuts; if (d?.length > 2) { const L = d.length - 1; if (m <= L) return d[m]; return d[L] + (m - L) * (d[L] - d[L - 1]); } return chanson.t0 + m * 4 * chanson.temps; };
    const suitTemps = () => !!(chanson?.debuts?.length > 2);
    const passage = (i) => { const g = grille(); const m = mDe(i, 0, g.mesures.length); return { a: Math.max(0, tMes(m)), b: tMes(m + 2) }; };
    // Où la chanson attaque ses notes, dans ce passage : des places pour les syllabes, calées sur les doubles-croches.
    const cacheAttaques = new Map();
    function attaques(i) {
      const { a, b } = passage(i); const k = `${chanson.src || 'o'}|${a.toFixed(2)}`; if (cacheAttaques.has(k)) return cacheAttaques.get(k);
      const buf = chanson.buf; const sr = buf.sampleRate; const d = buf.getChannelData(0); const hop = Math.round(sr * 0.01);
      const i0 = Math.floor(a * sr); const i1 = Math.min(d.length, Math.floor(b * sr)); const env = [];
      for (let p = i0; p + hop <= i1; p += hop) { let e = 0; for (let j = p; j < p + hop; j++) e += d[j] * d[j]; env.push(Math.log10(e / hop + 1e-9)); }
      const pics = []; let der = -99;
      for (let j = 3; j < env.length - 1; j++) { const mont = env[j] - Math.min(env[j - 1], env[j - 2], env[j - 3]); if (mont > 0.35 && env[j] >= env[j + 1] && env[j] > -5.5 && j - der > 11) { pics.push(j); der = j; } }
      const dc = (b - a) / 32; const pas = [...new Set(pics.map((j) => Math.min(31, Math.round((j * 0.01) / dc))))].sort((x, y) => x - y);
      const sl = pas.map((p, n) => ({ s: p, d: Math.max(1, (pas[n + 1] ?? 32) - p), f: p % 4 === 0 }));
      const res = sl.length >= 3 ? sl : null; cacheAttaques.set(k, res); return res;
    }
    const slots = (i = 0) => (st.place === 'chanson' && vraiOk() && attaques(i)) || PLACEMENTS.find((p) => p.id === (st.place === 'chanson' ? 'croches' : st.place)).slots;

    // La mélodie d'une ligne : sur les temps forts et les accents, une note de l'accord qui sonne ; ailleurs, on marche dans la gamme.
    function melodie(syl, pl, sl, g, i) {
      const gamme = gammeDe(g); const centre = voix ? Math.round((voix.low + voix.high) / 2) : 65;
      const n = syl.length; const notes = []; let cur = centre;
      const forme = [(k) => Math.sin((k / Math.max(1, n - 1)) * Math.PI) * 5, (k) => 3 - (k / Math.max(1, n - 1)) * 6, (k) => -3 + (k / Math.max(1, n - 1)) * 6, (k) => 4 - (k / Math.max(1, n - 1)) * 8][i % 4];
      syl.forEach((s, k) => {
        const kk = pl.pos[k]; const x = kk >= 0 ? sl[kk] : { s: 0, f: false };
        const c = accordA(g, mDe(i, Math.floor(x.s / 16), g.mesures.length), Math.floor((x.s % 16) / 4));
        const tons = (IV[c.q] || IV.M).map((v) => (c.r + v) % 12);
        const visee = Math.round(centre + forme(k));
        if (x.f || s.accent || k === n - 1) { let m = visee; for (let d = 0; d < 7; d++) { if (tons.includes(((visee + d) % 12 + 12) % 12)) { m = visee + d; break; } if (tons.includes(((visee - d) % 12 + 12) % 12)) { m = visee - d; break; } } cur = m; }
        else { const dir = visee >= cur ? 1 : -1; let m = cur + dir; let garde = 0; while (!gamme.includes(((m % 12) + 12) % 12) && garde++ < 3) m += dir; cur = m; }
        if (voix) { while (cur > voix.high - 1) cur -= 12; while (cur < voix.low + 1) cur += 12; }
        notes.push(cur);
      });
      return notes;
    }
    const analyse = (txt, i) => { const g = grille(); const sl = slots(i); const syl = syllabes(txt); const pl = placer(syl, sl); return { g, sl, syl, pl, notes: melodie(syl, pl, sl, g, i) }; };

    function rendre() {
      const g = grille();
      const nomsSrc = st.source === 'oreille' && !grilleOreille() ? 'Pas encore de grille dans L’oreille : je prends celle de Jouer. ' : '';
      q('.mo-info').textContent = `${nomsSrc}${g.nom} · ${g.bpm} BPM · ${g.mesures.length} mesure${g.mesures.length > 1 ? 's' : ''} · une ligne = deux mesures`;
      const aide = q('.mo-src-aide'); if (aide) aide.textContent = st.source === 'oreille' ? (store.get('oreilleGrille', null)?.ton ? 'Les accords et le tempo trouvés par L’oreille dans cette chanson ; la vraie chanson joue sous tes paroles.' : 'Cette grille vient d’une ancienne écoute (avant la 1.13) : repasse la chanson dans L’oreille, le tempo et les accords seront plus justes.') : st.source.startsWith('piece:') ? 'Une chanson gardée dans Nos pièces : ses accords, son tempo, et la vraie chanson sous tes paroles.' : st.source === 'jouer' ? 'Les accords qui tournent en ce moment dans Jouer (au piano, sans la vraie chanson).' : 'Tape un accord par mesure, par exemple « Lam Fa Do Sol » (ou « Fa/Do » pour deux dans la mesure).';
      const ap = accordPrincipal(g); const pb = q('.mo-princ');
      pb.hidden = false;
      pb.innerHTML = `<span class="mo-princ-k">★ Accord principal</span><b class="mo-princ-n">${esc(nomAcc(ap))}</b>${diagramme(ap.r, ap.q, { taille: 46 })}<button class="btn small" data-m="ecouter-princ" aria-label="Écouter l’accord principal">▶</button><details class="mo-princ-pq"><summary>c’est quoi?</summary><p>La « maison » de la chanson : c’est là qu’elle se repose. Une ligne qui finit sur ${esc(nomAcc(ap))} sonne finie ; une ligne qui finit ailleurs donne envie d’entendre la suite. Les ★ le marquent dans les lignes.</p></details>`;
      principal = ap;
      const box = q('.mo-lignes');
      const introH = deb() ? `<article class="panel mo-intro"><b>🎵 Intro</b> · mesure${deb() > 1 ? `s 1 à ${deb()}` : ' 1'} · musique seule <span class="muted small">(« Chanter sur la grille » la joue avant la première ligne)</span></article>` : '';
      if (!lignes.length) { box.innerHTML = '<div class="panel mo-vide"><p>J’écris les premières lignes de cette chanson…</p></div>'; return; }
      const schema = st.schema;
      box.innerHTML = `<p class="mo-a-qui">📄 Les paroles de <b>« ${esc(nomDeCle(cle))} »</b> <span class="mo-a-qui-acc" title="L’accord principal">★ ${esc(nomAcc(ap))}</span></p>${lignes.some((L) => L.txt) ? `<details class="mo-ranger-haut" ${avantRangement ? 'open' : ''}><summary>↪ Ces paroles ne sont pas pour « ${esc(nomDeCle(cle))} »?</summary><div class="mo-ranger-ici"></div></details>` : ''}` + introH + lignes.map((L, i) => {
        const { sl, syl, pl, notes } = analyse(txtDe(L), i);
        const p = partL(i); const rime = p != null && lignes[p] ? rimeOf(L.txt) === rimeOf(lignes[p].txt) : null;
        const cases8 = []; for (let h = 0; h < 2; h++) for (let t = 0; t < 4; t++) { const m = mDe(i, h, g.mesures.length); const c = g.mesures[m][t] || (!cases8.length ? accordA(g, m, t) : null); if (c) cases8.push({ c, de: h * 4 + t, n: 1 }); else if (cases8.length) cases8.at(-1).n++; }
        const acc = cases8.map(({ c, de, n }) => `<span class="mo-acc ${memeAccord(c, ap) ? 'princ' : ''}" style="grid-column:${de + 1} / span ${n}">${memeAccord(c, ap) ? '★ ' : ''}${esc(nomAcc(c))}</span>`).join(''); const first = '';
        const cases = [...Array(32)].map((_, s) => `<i class="${s % 4 === 0 ? 'b' : ''} ${s % 16 === 0 ? 'm' : ''} ${sl.some((x) => x.s === s && x.f) ? 'f' : ''}"></i>`).join('');
        const blocs = syl.map((s, k) => { const kk = pl.pos[k]; if (kk < 0) return ''; const x = sl[kk]; return `<span class="pl-syl ${s.accent === 2 ? 'a2' : s.accent ? 'a1' : ''} ${x.f ? 'sur-f' : ''}" data-k="${k}" style="left:${(x.s / 32) * 100}%;width:${(x.d / 32) * 100}%"><b>${esc(s.txt)}</b><small>${nomNote(notes[k])}</small></span>`; }).join('');
        const lettre = 'ABCDEFGH'[schema === 'AABB' ? Math.floor((kP(i) % 4) / 2) + 2 * Math.floor(kP(i) / 4) : schema === 'ABAB' ? (kP(i) % 2) + 2 * Math.floor(kP(i) / 4) : schema === 'ABCB' ? [0, 1, 2, 1][kP(i) % 4] + 3 * Math.floor(kP(i) / 4) : 0] || '';
        return `<article class="panel mo-l ${L.garde ? 'garde' : ''} ${L.pause ? 'pause' : ''}" data-i="${i}">
          <details class="mo-l-outils"><summary aria-label="Plus d’outils pour la ligne ${i + 1}">⋯</summary><div class="mo-l-bouge">${L.pause ? '' : `<button class="btn small mo-silence" data-m="pause" data-i="${i}" title="Ajoute deux mesures de musique seule avant cette ligne (ses mots ne bougent pas)">🎵 silence avant</button>`}<button class="btn small mo-ins" data-m="ins-avant" data-i="${i}" title="Ajouter une ligne avant celle-ci" aria-label="Ajouter une ligne avant la ligne ${i + 1}">＋ avant</button><button class="btn small mo-ins" data-m="ins-apres" data-i="${i}" title="Ajouter une ligne après celle-ci" aria-label="Ajouter une ligne après la ligne ${i + 1}">＋ après</button><span class="mo-poignee" draggable="true" data-glisse="${i}" title="Glisse pour déplacer" aria-hidden="true">⠿</span><button class="btn small" data-m="haut" data-i="${i}" ${i ? '' : 'disabled'} aria-label="Monter la ligne ${i + 1}">↑</button><button class="btn small" data-m="bas" data-i="${i}" ${i < lignes.length - 1 ? '' : 'disabled'} aria-label="Descendre la ligne ${i + 1}">↓</button><button class="btn small" data-m="enlever" data-i="${i}" aria-label="Enlever la ligne ${i + 1}">✕</button><button class="btn small mo-choeur ${L.choeur ? 'on' : ''}" data-m="choeur" data-i="${i}" aria-pressed="${!!L.choeur}" title="Les chœurs chantent cette ligne">🎤 chœurs</button></div></details>
          <div class="mo-l-tete">
            ${schema !== 'libre' ? `<span class="mo-lettre" title="Schéma de rimes">${lettre}</span>` : ''}
            ${L.pause ? '' : '<span class="mo-crayon" aria-hidden="true">✎</span>'}${L.pause ? '<p class="mo-pause-txt">🎵 Deux mesures de musique seule <small class="muted">(✕ pour enlever ce silence)</small></p>' : `<textarea class="mo-txt" data-i="${i}" rows="1" aria-label="Ligne ${i + 1}" placeholder="Écris ta ligne ici…">${esc(L.txt)}</textarea>`}
            <span class="mo-n ${pl.trop ? 'neg' : ''}">${syl.length}/${sl.length}</span>
            ${rime === true ? '<span class="mo-rime pos">rime ✓</span>' : rime === false ? '<span class="mo-rime neg">ne rime pas</span>' : ''}
            <label class="mo-garde"><input type="checkbox" data-garde="${i}" ${L.garde ? 'checked' : ''}> Garder</label>
            <button class="btn small" data-m="autre" data-i="${i}" title="Une autre ligne à cette place">↻ Une autre</button>
            <button class="btn small" data-m="boucle" data-i="${i}" title="Rejoue ces deux mesures en boucle pendant que tu écris">🔁</button>
            <button class="btn small" data-m="une" data-i="${i}" aria-label="Écouter la ligne ${i + 1}" title="Écouter cette ligne">▶</button>
          </div>
          <div class="mo-accs">${first}${acc}</div>
          <div class="mo-piste pos-${st.pos || 'milieu'} ${vraiOk() ? 'avec-onde' : ''}">${vraiOk() ? `<canvas class="mo-onde" data-i="${i}" height="72" aria-label="L’onde de la chanson sous cette ligne"></canvas>` : ''}<div class="pl-piste"><div class="pl-cases">${cases}</div>${blocs}<div class="pl-tete"></div></div></div>
        </article>`;
      }).join('');
      requestAnimationFrame(dessinerOndes);
      rendreRanger();
    }

    // Où ça chante, mesure par mesure : la voix repérée par L'oreille ; sinon, là où la chanson a du son.
    function activites() {
      const g = grille(); const M = g.mesures.length; let flags = null;
      if (st.source === 'oreille') flags = store.get('oreilleGrille', null)?.chant || null;
      else if (st.source.startsWith('piece:')) flags = piecesEsp().find((x) => `piece:${x.id}` === st.source)?.data?.piece?.chant || null;
      if (flags?.some(Boolean)) return { act: Array.from({ length: M }, (_, m) => !!flags[m]), via: 'la voix' };
      if (!vraiOk()) return null;
      const d = chanson.buf.getChannelData(0); const sr = chanson.buf.sampleRate; const rms = [];
      // Par tranches de 100 ms : une mesure « sonne » si au moins le tiers de ses tranches a du son.
      const tr = Math.floor(sr * 0.1); const parMes = []; let max = 1e-6;
      for (let m = 0; m < M; m++) { const a = Math.floor(tMes(m) * sr); const b = Math.min(d.length, Math.floor(tMes(m + 1) * sr)); const l = []; for (let p = Math.max(0, a); p + tr <= b; p += tr) { let e = 0; for (let i = p; i < p + tr; i += 8) e += d[i] * d[i]; const r = Math.sqrt(e / (tr / 8)); l.push(r); if (r > max) max = r; } parMes.push(l); }
      return { act: parMes.map((l) => l.length > 0 && l.filter((r) => r > max * 0.12).length / l.length >= 0.34), via: 'le son' };
    }
    // ✨ Les paroles calées sur la chanson : elles commencent où ça chante, les passages sans voix deviennent des
    // silences, et les syllabes suivent les attaques. Les lignes déjà écrites gardent leurs mots, dans l'ordre.
    async function caler(auto = false) {
      const A = activites(); if (!A) { if (!auto) toast('Pour caler les paroles, il faut la vraie chanson : passe-la dans L’oreille, ou choisis une de nos pièces.'); return false; }
      const { act } = A; const M = act.length; const premier = act.findIndex(Boolean); if (premier < 0) return false;
      const deja = lignes.filter((L) => !L.pause && L.txt); const nouv = [];
      for (let m = premier; m < M && nouv.length < 48; m += 2) { if (act[m] || act[m + 1]) nouv.push(deja.shift() || { txt: '', garde: false }); else nouv.push({ txt: '', garde: true, pause: true }); }
      while (nouv.length && nouv.at(-1).pause) nouv.pop(); nouv.push(...deja);
      lignes = nouv; st.debut = premier + 1; st.cale = true; if (vraiOk()) st.place = 'chanson';
      q('[data-m=debut]').value = st.debut; q('[data-m=place]').value = st.place; sauver(); arreter(); rendre();
      const nbS = lignes.filter((L) => L.pause).length;
      toast(`Calé sur ${A.via} : les paroles commencent à la mesure ${st.debut}${premier ? ` (${premier} mesure${premier > 1 ? 's' : ''} d’intro)` : ''}, ${lignes.length - nbS} lignes${nbS ? `, ${nbS} silence${nbS > 1 ? 's' : ''}` : ''}.`);
      if (lignes.some((L) => !L.pause && !L.txt)) await generer();
      return true;
    }

    // Ranger ces paroles avec une autre chanson (et repartir à neuf ici).
    function destinations() {
      const d = new Map();
      const noms = new Set([...Object.keys(parChanson).filter((k) => k.startsWith('chanson:') && k.length > 8).map((k) => k.slice(8)), ...piecesEsp().map((e) => nomPropre(e.title)), nomPropre(store.get('oreilleGrille', null)?.nom), nomJouer()].filter(Boolean));
      [...noms].sort((a, b) => a.localeCompare(b, 'fr')).forEach((n) => d.set(`chanson:${n}`, n));
      d.delete(cle); return d;
    }
    function rendreRanger() {
      q('.mo-ranger').hidden = true; const box = q('.mo-ranger-ici'); if (!box) return;
      const opts = [...destinations()].map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');
      box.innerHTML = `${avantRangement ? '<p class="mo-ranger-alerte"><b>Ces paroles viennent d’avant le rangement par chanson</b> : elles étaient peut-être pour une autre chanson. Range-les avec la bonne, ou garde-les ici.</p>' : ''}
        <div class="ec-row"><span>Les ranger avec :</span>
          <select data-m="dest" aria-label="La chanson où ranger ces paroles">${opts}<option value="__nom">Une autre chanson, par son nom…</option></select><input type="text" class="mo-dest-nom" data-m="destnom" placeholder="Interminable" aria-label="Le nom de la chanson dans L’oreille" hidden>
          <button class="btn" data-m="ranger">↪ Les ranger là-bas</button>${avantRangement ? '<button class="btn" data-m="garder-ici">Elles vont bien ici</button>' : ''}</div>`;
    }
    function rangerAilleurs() {
      let dest = q('[data-m=dest]').value;
      if (dest === '__nom') { const n = nomPropre(q('[data-m=destnom]').value || ''); if (!n) { q('[data-m=destnom]').focus(); toast('Écris le nom de la chanson, comme il s’affiche dans L’oreille.'); return; } dest = `chanson:${n}`; }
      if (!dest || dest === cle) return;
      if (parChanson[dest]?.lignes?.some((L) => L.txt) && !confirm('Cette chanson a déjà des paroles. Les remplacer par celles-ci?')) return;
      parChanson[dest] = { lignes, debut: st.debut || 1, cale: !!st.cale, at: Date.now() }; envoyer(dest);
      parChanson[cle] = { lignes: [], debut: 1, at: Date.now() }; avantRangement = false;
      store.set('motsParChanson', parChanson); envoyer(cle);
      const nomD = nomDeCle(dest);
      chargerLignes(); arreter(); rendre(); toast(`Rangées avec « ${nomD} ». Ici, on repart à neuf.`); remplirSiVide();
    }

    // Une chanson sans paroles encore : la page se remplit toute seule (calée sur la chanson si on a son son).
    async function remplirSiVide() {
      // D'abord, laisser arriver ce que l'espace a déjà (les paroles écrites sur un autre appareil).
      if (espace.connected) { for (let k = 0; k < 20 && !espace.rev; k++) await new Promise((r) => setTimeout(r, 200)); recevoir(); }
      if (lignes.length) return;
      if (!(await caler(true))) await generer();
      // Des lignes écrites d'office comptent pour « très vieilles » : celles d'un autre appareil passent toujours devant.
      if (parChanson[cle]) { parChanson[cle].at = 1; store.set('motsParChanson', parChanson); }
    }

    // L'onde de la vraie chanson sous chaque ligne : ses deux mesures, avec les temps et les mesures marqués.
    function dessinerOndes() {
      if (!vraiOk()) return; const d = chanson.buf.getChannelData(0); const sr = chanson.buf.sampleRate;
      el.querySelectorAll('canvas.mo-onde').forEach((cv) => {
        const i = +cv.dataset.i; const { a, b } = passage(i); const W = cv.clientWidth || 600; const H = 72; const r = Math.min(2, window.devicePixelRatio || 1);
        cv.width = W * r; cv.height = H * r; const x = cv.getContext('2d'); x.scale(r, r); x.clearRect(0, 0, W, H);
        const i0 = Math.floor(a * sr); const n = Math.max(1, Math.floor(((b - a) * sr) / W)); let pic = 1e-4;
        const mm = []; for (let px = 0; px < W; px++) { let lo = 0; let hi = 0; for (let j = i0 + px * n; j < i0 + (px + 1) * n && j < d.length; j += 4) { const v = d[j]; if (v < lo) lo = v; if (v > hi) hi = v; } mm.push([lo, hi]); pic = Math.max(pic, hi, -lo); }
        for (let t = 0; t <= 8; t++) { const X = (t / 8) * W; x.fillStyle = t % 4 === 0 ? 'rgba(29,26,21,.55)' : 'rgba(29,26,21,.18)'; x.fillRect(Math.min(W - 2, X), 0, t % 4 === 0 ? 2 : 1, H); }
        x.fillStyle = '#b08a2e'; mm.forEach(([lo, hi], px) => { const y0 = H / 2 - (hi / pic) * (H / 2 - 4); const y1 = H / 2 - (lo / pic) * (H / 2 - 4); x.fillRect(px, y0, 1, Math.max(1, y1 - y0)); });
      });
    }

    // Écrit (ou réécrit) les lignes non gardées. « seule » : une seule ligne à refaire.
    async function generer(seule = null) {
      q('[data-m=generer]').disabled = true; q('[data-m=generer]').textContent = 'J’écris…';
      await loadLexique();
      const cles = st.cles.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
      const b = await banque(st.themes, cles);
      const n = st.cale ? lignes.length : +st.n;
      while (lignes.length < n) lignes.push({ txt: '', garde: false });
      if (seule == null) { let fin = n; lignes.forEach((L, k) => { if (L.garde && L.txt) fin = Math.max(fin, k + 1); }); lignes = lignes.slice(0, fin); }
      graine += 7919; const r = hasard(graine);
      const dejaVus = new Map(); const fins = [];
      const compter = (t) => t.toLowerCase().split(/[\s’',]+/).forEach((w) => dejaVus.set(w, (dejaVus.get(w) || 0) + 1));
      lignes.forEach((L, i) => { if (L.txt && (L.garde || (seule != null && i !== seule))) { compter(L.txt); fins.push(L.txt.split(/[\s’']/).at(-1).toLowerCase()); } });
      for (let i = 0; i < lignes.length; i++) {
        const L = lignes[i];
        if (L.pause || (L.garde && L.txt)) continue;
        if (seule != null && i !== seule) continue;
        const p = partL(i);
        const rime = p != null && lignes[p]?.txt ? { cle: rimeOf(lignes[p].txt), mot: lignes[p].txt.split(/[\s’']/).at(-1).toLowerCase() } : null;
        const vus = lignes.map((x) => x.txt.toLowerCase());
        const manquantes = b.cles.filter((c) => !vus.some((t) => t.includes(c.k)));
        const tete = lignes.some((_, j) => partL(j) === i);
        const res = ligne({ b, r, slots: slots(i), pers: st.pers, rime, tete, finAEviter: fins, dejaVus, clesManquantes: manquantes });
        if (res) { L.txt = res.txt; compter(res.txt); fins.push(res.fin); }
        // Une ligne refaite peut casser la rime de sa partenaire suivante : on la refait aussi, si elle n'est pas gardée.
        if (seule != null) { const suiv = lignes.findIndex((_, j) => j > i && partL(j) === i); if (suiv >= 0 && !lignes[suiv].garde) seule = suiv; }
      }
      sauver(); rendre();
      q('[data-m=generer]').disabled = false; q('[data-m=generer]').textContent = 'Écrire les lignes';
    }

    function arreter() {
      cancelAnimationFrame(raf);
      if (lecture) { lecture.stop = true; try { lecture.bus.gain.value = 0; lecture.bus.disconnect(); } catch { /* déjà coupé */ } lecture.src.forEach((s) => { try { s.stop(); } catch { /* déjà arrêtée */ } }); lecture = null; }
      el.querySelectorAll('.pl-tete').forEach((t) => { t.style.opacity = 0; });
      el.querySelectorAll('.mo-l.chante').forEach((x) => x.classList.remove('chante'));
      el.querySelectorAll('[data-m=chanter]').forEach((b) => { b.textContent = b.dataset.lbl || '▶ Chanter sur la grille'; });
      el.querySelectorAll('[data-m=une]').forEach((x) => { x.textContent = '▶'; }); el.querySelectorAll('[data-m=boucle]').forEach((x) => { x.textContent = '🔁'; });
      el.querySelectorAll('.pl-syl.dit').forEach((x) => x.classList.remove('dit'));
      const lb = q('.mo-lecteur'); if (lb) { lb.hidden = true; lb.innerHTML = ''; } cleBarre = ''; document.body.classList.remove('mo-lit');
    }
    let cleBarre = ''; let principal = null;
    // La barre du bas, pendant que ça chante : l'accord qui joue (en gros, avec sa position à la guitare), le suivant,
    // la ligne en cours avec la syllabe chantée allumée, et un gros ■ Stop.
    // La ligne telle qu'écrite (avec ses « j’ », « l’ »), le mot chanté allumé : on compte les mots d'après les syllabes.
    function motsAllumes(F, ks) {
      const idx = []; let w = -1; F.syl.forEach((sy, n) => { if (!n || sy.mot !== F.syl[n - 1].mot) w++; idx.push(w); });
      const mots = lignes[F.i].txt.split(/\s+/).filter(Boolean);
      if (mots.length !== w + 1) return F.syl.map((sy) => `<span class="${sy.k === ks ? 'on' : sy.k < ks ? 'dit' : ''}">${esc(sy.txt)}</span>`).join('');
      const ici = ks >= 0 ? idx[ks] : -1;
      return mots.map((m, n) => `<span class="${n === ici ? 'on' : n < ici ? 'dit' : ''}">${esc(m)}</span>`).join(' ');
    }
    // Les sons qui viennent : chaque syllabe est une barre à la hauteur de sa note (plus haut = plus aigu), de la durée
    // où elle est chantée ; la syllabe chantée s'allume, celles à venir attendent à droite, et une tête de lecture avance.
    function roulette(F, ks) {
      const ss = F.syl.filter((x) => x.t != null); if (!ss.length) return '';
      const vv = F.vraies || []; const toutes = [...ss.map((x) => x.note), ...vv.map((x) => x.m)];
      const lo = Math.min(...toutes) - 1; const hi = Math.max(...toutes) + 1; const span = Math.max(4, hi - lo); const D = F.fin - F.debut;
      const barres = ss.map((x) => `<span class="mo-roll-b ${x.k === ks ? 'on' : x.k < ks ? 'dit' : ''} ${x.accent ? 'fort' : ''}" style="left:${((x.t - F.debut) / D) * 100}%;width:${Math.max(2, (x.d / D) * 100 - 0.6)}%;top:${((hi - x.note) / span) * 78}%"><b>${esc(x.txt)}</b><small>${esc(nomNote(x.note))}</small></span>`).join('');
      const accs = F.acc.filter((a, n) => !n || nomAcc(a.c) !== nomAcc(F.acc[n - 1].c)).map((a) => `<i class="mo-roll-acc" style="left:${((a.t - F.debut) / D) * 100}%">${esc(nomAcc(a.c))}</i>`).join('');
      const temps = [...Array(8)].map((_, n) => `<i class="mo-roll-t ${n % 4 === 0 ? 'm' : ''}" style="left:${(n / 8) * 100}%"></i>`).join('');
      const voixVraie = vv.map((x) => `<i class="mo-roll-v" style="left:${Math.max(0, ((x.t - F.debut) / D) * 100)}%;width:${Math.max(1, (x.d / D) * 100)}%;top:${((hi - x.m) / span) * 78 + 6}%"></i>`).join('');
      echelle = { lo, hi, span };
      return `<div class="mo-roll" aria-hidden="true">${temps}${accs}${voixVraie}${barres}${micLive ? '<canvas class="mo-roll-mic"></canvas>' : ''}<i class="mo-roll-tete"></i></div>${vv.length ? '<p class="mo-roll-leg"><i></i> ta voix dans la chanson · <b></b> la mélodie proposée</p>' : ''}`;
    }
    function majBarre(t, t0, t1, noire, frise, j, tIntro = t1) {
      const lb = q('.mo-lecteur'); if (!lb) return; lb.hidden = false; document.body.classList.add('mo-lit');
      const F = frise[j]; const tous = frise.flatMap((x) => x.acc);
      let ic = -1; tous.forEach((a, k) => { if (a.t <= t + 0.02) ic = k; });
      const cur = t < t1 ? null : tous[Math.max(0, ic)]; const suiv = cur ? tous.slice(Math.max(0, ic) + 1).find((a) => nomAcc(a.c) !== nomAcc(cur.c)) : tous[0];
      let ks = -1; if (t >= t1) F.syl.forEach((sy) => { if (sy.t != null && sy.t <= t + 0.03) ks = sy.k; });
      const enIntro = t >= tIntro && t < t1; const compte = enIntro ? `Intro ${Math.floor((t - tIntro) / (4 * noire)) + 1}` : t < t1 ? Math.min(4, Math.floor((t - t0) / noire) + 1) : 0;
      const tete = lb.querySelector('.mo-roll-tete'); if (tete) { const x = (t - F.debut) / (F.fin - F.debut); tete.style.left = `${Math.max(0, Math.min(1, x)) * 100}%`; tete.style.opacity = x >= 0 && x <= 1 ? 1 : 0; }
      const cle = `${j}|${ic}|${ks}|${compte}|${micLive}`; if (cle === cleBarre) { dessinerVoix(lb, F, t); return; }
      // Nouvelle ligne : on la ramène au milieu de l'écran, au-dessus de la barre.
      if (cleBarre.split('|')[0] !== String(j)) el.querySelector(`.mo-l[data-i="${F.i}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      cleBarre = cle;
      lb.innerHTML = `<div class="mo-lb-acc">${cur ? `<b>${esc(nomAcc(cur.c))}</b>${diagramme(cur.c.r, cur.c.q, { taille: 64 })}` : `<b class="mo-lb-compte">${compte || ''}</b>`}${suiv ? `<small>puis ${esc(nomAcc(suiv.c))}</small>` : ''}</div>
        <div class="mo-lb-mil"><p class="mo-lb-mots">${enIntro ? '<span class="dit">🎵 Musique seule… les paroles arrivent</span>' : lignes[F.i]?.pause ? '<span class="dit">🎵 Musique seule</span>' : motsAllumes(F, ks)}</p>${enIntro || lignes[F.i]?.pause ? '' : roulette(F, ks)}</div>
        <button class="mo-lb-mic ${micLive ? 'on' : ''}" data-m="micdirect" aria-pressed="${micLive}" aria-label="${micLive ? 'Fermer le micro' : 'Voir ma voix en direct (micro)'}">🎤</button><span class="mo-mic-etat" aria-live="off"></span>
        <button class="mo-lb-stop" data-m="stop" aria-label="Arrêter">■</button>`;
      dessinerVoix(lb, F, t);
      el.querySelectorAll('.pl-syl.dit').forEach((x) => x.classList.remove('dit'));
      const sp = el.querySelector(`.mo-l[data-i="${F.i}"] .pl-syl[data-k="${ks}"]`); if (sp) sp.classList.add('dit');
    }
    // La voix entendue : une trace sur la grille de la ligne (verte quand elle tombe sur la note proposée), et un mot.
    // On la ramène à l'octave de la mélodie : une voix grave qui chante une octave plus bas est juste quand même.
    function dessinerVoix(lb, F, t) {
      const cv = lb.querySelector('.mo-roll-mic'); const etat = lb.querySelector('.mo-mic-etat'); if (!cv || !echelle || !micLive) { if (etat) etat.textContent = ''; return; }
      const W = cv.clientWidth; const H = cv.clientHeight; const dpr = devicePixelRatio || 1; if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      const D = F.fin - F.debut; const { hi, span } = echelle; const Y = (m) => (((hi - m) / span) * 0.78 + 0.11) * H;
      const cible = (tp) => F.syl.find((s) => s.t != null && tp >= s.t && tp < s.t + Math.max(0.15, s.d))?.note;
      const plie = (m, c) => (c == null ? m : m + 12 * Math.round((c - m) / 12));
      let der = null; let derEcart = null; x.lineWidth = 3; x.lineCap = 'round';
      trace.forEach(([tp, m]) => {
        if (tp < F.debut || tp > Math.min(t, F.fin)) return; const c = cible(tp); const mm = plie(m, c); const e = c == null ? null : mm - c;
        const px = ((tp - F.debut) / D) * W; const py = Math.max(2, Math.min(H - 2, Y(mm)));
        x.fillStyle = e == null ? '#9fd4ff' : Math.abs(e) < 0.5 ? '#5ee08a' : Math.abs(e) < 1.5 ? '#ffc24a' : '#ff6b4a';
        x.beginPath(); x.arc(px, py, 2.6, 0, 2 * Math.PI); x.fill();
        der = [tp, mm, px, py]; derEcart = e;
      });
      if (der && t - der[0] < 0.25) { x.strokeStyle = '#fff'; x.beginPath(); x.arc(der[2], der[3], 6, 0, 2 * Math.PI); x.stroke(); }
      if (etat) etat.textContent = !der || t - der[0] > 0.4 ? '🎤 …' : derEcart == null ? `🎤 ${nomNote(Math.round(der[1]))}` : Math.abs(derEcart) < 0.5 ? `🎤 ${nomNote(Math.round(der[1]))} ✓ juste` : derEcart < 0 ? `🎤 ${nomNote(Math.round(der[1]))} ↑ monte un peu` : `🎤 ${nomNote(Math.round(der[1]))} ↓ descends un peu`;
    }
    // Chante les lignes demandées : une mesure de décompte, puis deux mesures par ligne, accords au piano, voix-guide.
    async function chanter(quelles, bouton, avecIntro = false) {
      arreter();
      const c = audio(); try { await c.resume(); } catch { /* iOS */ }
      trace = []; if (micLive) await ouvrirMic();
      if (bouton) bouton.textContent = '…';
      await prechargerSons(['voix', 'piano']);
      const g = grille(); const noire = 60 / g.bpm; const dc = noire / 4; const mes = 4 * noire;
      const nIntro = avecIntro ? deb() : 0; const t0 = c.currentTime + 0.25; const tIntro = t0 + mes; const src = [];
      // Avec la vraie chanson suivie temps par temps, chaque ligne prend la longueur de SES deux mesures dans la chanson.
      const suit = chanson && suitTemps() && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source);
      const t1 = tIntro + (suit && nIntro ? tMes(nIntro) - tMes(0) : nIntro * mes);
      const mesDe = (i) => { if (!suit) return mes; const m = mDe(i, 0, g.mesures.length); const L = (tMes(m + 2) - tMes(m)) / 2; return L > mes * 0.5 && L < mes * 2 ? L : mes; };
      let cur = t1;
      const bus = c.createGain(); bus.connect(out()); // tout passe par ici : « Arrêter » coupe aussi les notes déjà prévues
      for (let k = 0; k < 4; k++) try { drums.hat?.(t0 + k * noire, k ? 0.35 : 0.6); } catch { /* pas de métronome */ }
      // L'intro : la musique seule, de la mesure 1 jusqu'aux paroles.
      if (nIntro) {
        const vraieI = chanson && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source) && q('[data-m=vraie]')?.checked;
        if (vraieI) { const sN = c.createBufferSource(); sN.buffer = chanson.buf; sN.playbackRate.value = suitTemps() ? 1 : (chanson.temps * g.bpm) / 60 || 1; sN.connect(bus); sN.start(tIntro, Math.max(0, tMes(0)), (suitTemps() ? tMes(nIntro) - tMes(0) : nIntro * mes * sN.playbackRate.value) + 0.05); src.push(sN); }
        else for (let m0 = 0; m0 < nIntro; m0++) for (let t = 0; t < 4; t++) { const m = m0 % g.mesures.length; const ch = g.mesures[m][t] || (t === 0 ? accordA(g, m, 0) : null); if (!ch) continue; let dur = 1; while (t + dur < 4 && !g.mesures[m][t + dur]) dur++; const iv = (() => { try { return chordIntervals(ch.q); } catch { return IV[ch.q] || IV.M; } })(); accordSon('piano', iv.map((v) => 48 + ch.r + v), { when: tIntro + (m0 * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.45, dest: bus }); }
      }
      const frise = []; // par ligne : ses syllabes et ses accords, avec leur moment
      quelles.forEach((i, j) => {
        const { sl, syl, pl, notes } = analyse(txtDe(lignes[i]), i); const mes = mesDe(i); const noire = mes / 4; const dc = noire / 4; const debut = cur; cur += 2 * mes;
        const vraies = (() => { if (!chanson?.voix?.length || !vraiOk()) return []; const { a, b } = passage(i); const k = suit ? 1 : mes / (4 * chanson.temps); return chanson.voix.filter(([t, d]) => t + d > a && t < b).map(([t, d, m]) => ({ t: debut + (t - a) * k, d: d * k, m })); })();
        const F = { i, debut, fin: debut + 2 * mes, vraies, syl: syl.map((sy, k) => ({ txt: sy.txt, mot: sy.mot, t: pl.pos[k] >= 0 ? debut + sl[pl.pos[k]].s * dc : null, d: pl.pos[k] >= 0 ? sl[pl.pos[k]].d * dc : 0, note: notes[k], accent: sy.accent, k })), acc: [] };
        for (let h = 0; h < 2; h++) for (let t = 0; t < 4; t++) { const m = mDe(i, h, g.mesures.length); const ch = g.mesures[m][t] || (h === 0 && t === 0 ? accordA(g, m, 0) : null); if (ch) F.acc.push({ t: debut + (h * 4 + t) * noire, c: ch }); }
        frise.push(F);
        const vraie = chanson && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source) && q('[data-m=vraie]')?.checked;
        if (vraie) {
          // Le passage de la vraie chanson qui porte ces deux mesures (la grille de L'oreille commence à t0).
          const s0 = tMes(mDe(i, 0, g.mesures.length)); const sN = c.createBufferSource(); sN.buffer = chanson.buf;
          sN.playbackRate.value = suit ? 1 : (chanson.temps * g.bpm) / 60 || 1; const gv = c.createGain(); gv.gain.value = 0.85; sN.connect(gv).connect(bus);
          sN.start(debut, Math.max(0, s0), 2 * mes * sN.playbackRate.value + 0.05); src.push(sN);
        }
        const piano = !vraie || q('[data-m=piano]')?.checked;
        if (piano) for (let h = 0; h < 2; h++) for (let t = 0; t < 4; t++) {
          const m = mDe(i, h, g.mesures.length); const ch = g.mesures[m][t] || (h === 0 && t === 0 ? accordA(g, m, 0) : null); if (!ch) continue;
          let dur = 1; while (t + dur < 4 && !g.mesures[m][t + dur]) dur++;
          const iv = (() => { try { return chordIntervals(ch.q); } catch { return IV[ch.q] || IV.M; } })();
          const base = 48 + ch.r; accordSon('piano', iv.map((v) => base + v), { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.45, dest: bus });
          if (!joue('piano', 36 + ch.r, { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.5, dest: bus })) iv.forEach((v) => notePiano(base + v, { when: debut + (h * 4 + t) * noire, dur: dur * noire * 0.95, vel: 0.5 }));
        }
        if (q('[data-m=guide]')?.checked || lignes[i]?.choeur) syl.forEach((s, k) => { const kk = pl.pos[k]; if (kk < 0) return; const x = sl[kk]; if (!joue('voix', notes[k], { when: debut + x.s * dc, dur: Math.max(0.12, x.d * dc * 0.9), vel: s.accent ? 0.95 : 0.75, dest: bus })) notePiano(notes[k] + 12, { when: debut + x.s * dc, dur: Math.max(0.12, x.d * dc * 0.9), vel: 0.8 }); });
      });
      const fin = cur;
      lecture = { src, bus, stop: false };
      if (bouton) bouton.textContent = '■ Arrêter';
      const tick = () => {
        if (!lecture) return; const t = c.currentTime;
        if (t > fin + 0.3) { arreter(); return; }
        let j = frise.findIndex((F) => t < F.fin); if (j < 0) j = frise.length - 1; const i = quelles[Math.max(0, Math.min(quelles.length - 1, j))]; const Fj = frise[Math.max(0, j)];
        el.querySelectorAll('.mo-l').forEach((a) => { const on = t >= t1 && +a.dataset.i === i; a.classList.toggle('chante', on); const h = a.querySelector('.pl-tete'); h.style.opacity = on ? 1 : 0; if (on) h.style.left = `${Math.min(100, ((t - Fj.debut) / (Fj.fin - Fj.debut)) * 100)}%`; });
        majBarre(t, t0, t1, noire, frise, Math.max(0, Math.min(frise.length - 1, j)), tIntro);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    // Le texte seul (feuille.js) : les paroles de cette chanson, en grand, sur la vraie chanson.
    function ouvrirTexte() {
      arreter(); const g = grille(); const M = g.mesures.length;
      const vraie = chanson && (st.source === 'oreille' ? !chanson.src : chanson.src === st.source) ? chanson : null;
      // Les lignes de la grille, avec le moment où la grille les fait arriver dans la chanson (un silence = un saut de couplet).
      const depuisGrille = () => lignes.map((L, i) => (L.pause || !L.txt ? { txt: '' } : { txt: L.txt, t: null, ta: vraie ? Math.max(0, tMes(mDe(i, 0, M))) : null })).filter((l, i, a) => l.txt || (i > 0 && a[i - 1].txt));
      ouvrirFeuille({ titre: nomDeCle(cle), depart: feuille || { lignes: depuisGrille(), propre: false }, chanson: vraie, reprendre: depuisGrille, enregistrer: (f) => { feuille = f; sauver(); } });
    }
    el.addEventListener('click', async (e) => {
      const th = e.target.closest('[data-theme]');
      if (th) { const k = th.dataset.theme; st.themes = st.themes.includes(k) ? st.themes.filter((x) => x !== k) : [...st.themes, k]; if (!st.themes.length) st.themes = [k]; st.theme = st.themes[0]; el.querySelectorAll('[data-theme]').forEach((x) => { const on = st.themes.includes(x.dataset.theme); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); x.textContent = `${on ? '✓ ' : ''}${THEMES[x.dataset.theme].nom}`; }); sauver(); return; }
      const b = e.target.closest('[data-m]'); const m = b?.dataset.m; if (!m || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
      if (m === 'generer') { arreter(); await generer(); if (b.dataset.fermer) { const r = q('.mo-reg'); if (r) r.open = false; q('.mo-a-qui')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      if (m === 'caler') { await caler(false); return; }
      if (m === 'texte') { ouvrirTexte(); return; }
      if (m === 'ouvrir-reg') { const r = q('.mo-reg'); if (r) { r.open = true; r.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      if (m === 'ranger') { rangerAilleurs(); return; }
      if (m === 'garder-ici') { avantRangement = false; if (parChanson[cle]) delete parChanson[cle].avant; sauver(); rendreRanger(); return; }
      if (m === 'autre') { arreter(); await generer(+b.dataset.i); return; }
      if (m === 'chanter') { if (b.textContent.startsWith('■')) { arreter(); return; } if (!lignes.length) await generer(); chanter(lignes.map((_, i) => i).filter((i) => lignes[i].txt || lignes[i].pause), b, true); return; }
      if (m === 'stop') { arreter(); return; }
      if (m === 'micdirect') { micLive = !micLive; store.set('motsMicLive', micLive); if (micLive) { if (await ouvrirMic()) toast('🎤 Ta voix s’affiche sur la mélodie. Avec des écouteurs, c’est plus juste (le micro n’entend que toi).'); } else if (micOuvert) { stopMic(); micOuvert = false; } cleBarre = ''; return; }
      if (m === 'pause') { arreter(); lignes.splice(+b.dataset.i, 0, { txt: '', garde: true, pause: true }); sauver(); rendre(); toast('Deux mesures de musique seule ajoutées : la ligne et ses mots descendent d’une place.'); return; }
      if (m === 'choeur') { const L = lignes[+b.dataset.i]; L.choeur = !L.choeur; b.classList.toggle('on', L.choeur); b.setAttribute('aria-pressed', L.choeur); sauver(); toast(L.choeur ? 'Les chœurs chanteront cette ligne.' : 'Plus de chœurs sur cette ligne.'); return; }
      if (m === 'boucle') { if (b.textContent === '■') { arreter(); return; } const i = +b.dataset.i; await chanter(Array(24).fill(i), null); b.textContent = '■'; el.querySelector(`.mo-txt[data-i="${i}"]`)?.focus(); return; }
      if (m === 'haut' || m === 'bas') { const i = +b.dataset.i; const j = m === 'haut' ? i - 1 : i + 1; if (j < 0 || j >= lignes.length) return; arreter(); [lignes[i], lignes[j]] = [lignes[j], lignes[i]]; sauver(); rendre(); el.querySelector(`[data-m=${m}][data-i="${j}"]`)?.focus(); return; }
      if (m === 'ins-avant' || m === 'ins-apres') { arreter(); const j = +b.dataset.i + (m === 'ins-apres' ? 1 : 0); lignes.splice(j, 0, { txt: '', garde: true }); sauver(); rendre(); const t = el.querySelector(`.mo-txt[data-i="${j}"]`); t?.focus(); t?.scrollIntoView({ block: 'center' }); return; }
      if (m === 'enlever') { arreter(); lignes.splice(+b.dataset.i, 1); sauver(); rendre(); return; }
      if (m === 'ajout') { arreter(); lignes.push({ txt: '', garde: true }); sauver(); rendre(); const t = el.querySelector(`.mo-txt[data-i="${lignes.length - 1}"]`); t?.focus(); t?.scrollIntoView({ block: 'center' }); return; }
      if (m === 'ecouter-princ' && principal) { const c = audio(); try { await c.resume(); } catch { /* iOS */ } const iv = IV[principal.q] || IV.M; iv.forEach((v, k) => notePiano(57 + ((principal.r + v - 9 + 12) % 12) + (v >= 12 ? 12 : 0), { when: c.currentTime + 0.05 + k * 0.02, dur: 1.6, vel: 0.6 })); notePiano(36 + principal.r, { when: c.currentTime + 0.05, dur: 1.6, vel: 0.55 }); return; }
      if (m === 'une') { if (b.textContent.startsWith('■')) { arreter(); return; } await chanter([+b.dataset.i, +b.dataset.i], null); b.textContent = '■'; return; }
      const texte = lignes.filter((x) => !x.pause).map((x) => x.txt).filter(Boolean).join('\n');
      if (m === 'placer') { if (!texte) return; store.set('placerArrivee', { texte, chanson: nomDeCle(cle) }); location.hash = '#/placer'; return; }
      if (m === 'copier') { try { await navigator.clipboard.writeText(texte); toast('Copié.'); } catch { toast('Copie impossible ici : sélectionne le texte à la main.'); } return; }
      if (m === 'journal') { if (!texte) return; try { await saveEntry({ type: 'texte', title: lignes[0].txt.slice(0, 80), body: texte, data: { journal: true, date: new Date().toISOString().slice(0, 10), invite: `Mots sur la grille · ${st.themes.map((k) => THEMES[k]?.nom).filter(Boolean).join(', ')}`, stage: 0 } }); toast('Dans le journal.'); } catch (err) { toast(err.message); } }
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.m;
      if (e.target.dataset.m === 'guide') { store.set('motsChoeurs', e.target.checked); return; }
      if (e.target.dataset.m === 'miclive') { micLive = e.target.checked; store.set('motsMicLive', micLive); if (micLive) ouvrirMic(); else if (micOuvert) { stopMic(); micOuvert = false; } return; }
      if (e.target.dataset.garde != null) { lignes[+e.target.dataset.garde].garde = e.target.checked; e.target.closest('.mo-l').classList.toggle('garde', e.target.checked); sauver(); return; }
      if (k === 'dest') { const i = q('[data-m=destnom]'); if (i) { i.hidden = e.target.value !== '__nom'; if (!i.hidden) i.focus(); } return; }
      if (!k || e.target.tagName !== 'SELECT') return;
      st[k] = k === 'n' ? +e.target.value : e.target.value; if (k === 'n') st.cale = false;
      if (k === 'source') { q('.mo-main').hidden = st.source !== 'main'; changerDeChanson(); majSous(); chargerPiece().then(async () => { rendre(); await remplirSiVide(); }); }
      sauver(); arreter(); rendre();
    });
    el.addEventListener('input', (e) => {
      if (e.target.dataset.m === 'cles') { st.cles = e.target.value; sauver(); return; }
      if (e.target.dataset.m === 'debut') { st.debut = Math.max(1, Math.min(64, +e.target.value || 1)); sauver(); arreter(); rendre(); return; }
      if (e.target.dataset.m === 'main') { st.main = e.target.value; sauver(); rendre(); return; }
      if (e.target.classList.contains('mo-txt')) { const L = lignes[+e.target.dataset.i]; L.txt = e.target.value; if (!L.garde) { L.garde = true; const cb = el.querySelector(`[data-garde="${e.target.dataset.i}"]`); if (cb) cb.checked = true; e.target.closest('.mo-l')?.classList.add('garde'); } sauver(); }
    });
    // Glisser une ligne par sa poignée ⠿ pour la déplacer.
    let glisse = -1;
    el.addEventListener('dragstart', (e) => { const h = e.target.closest?.('[data-glisse]'); if (!h) return; glisse = +h.dataset.glisse; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(glisse)); h.closest('.mo-l').classList.add('glisse'); });
    el.addEventListener('dragover', (e) => { if (glisse < 0) return; const a = e.target.closest('.mo-l'); if (!a) return; e.preventDefault(); el.querySelectorAll('.mo-l.vise').forEach((x) => x.classList.remove('vise')); a.classList.add('vise'); });
    el.addEventListener('drop', (e) => { if (glisse < 0) return; const a = e.target.closest('.mo-l'); e.preventDefault(); if (a) { const j = +a.dataset.i; const [L] = lignes.splice(glisse, 1); lignes.splice(j, 0, L); sauver(); } glisse = -1; arreter(); rendre(); });
    el.addEventListener('dragend', () => { glisse = -1; el.querySelectorAll('.mo-l.vise, .mo-l.glisse').forEach((x) => x.classList.remove('vise', 'glisse')); });
    // Une ligne = une ligne : Entrée valide la retouche au lieu de couper la ligne.
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList?.contains('mo-txt')) { e.preventDefault(); e.target.blur(); } });
    // Après une retouche à la main : on recalcule la ligne quand on quitte le champ (pour ne pas perdre le curseur).
    el.addEventListener('focusout', (e) => { if (e.target.classList?.contains('mo-txt')) rendre(); });
    loadLexique().then(async () => { if (aRefaire) await generer(); else rendre(); }); rendre();
    setTimeout(() => prechargerSons(['voix', 'piano']), 400);
    recevoir(); const offEsp = onEspace((t) => { if (t === 'entries') recevoir(); });
    majSous(); chargerPiece().then(async () => { rendre(); await remplirSiVide(); if (texteDemande) ouvrirTexte(); });
    return () => { arreter(); offPitch?.(); if (micOuvert) stopMic(); offEsp?.(); for (const [k, t] of envois) { clearTimeout(t); const f = parChanson[k]; if (f && espace.connected) saveEntry({ id: idDe(k), type: 'motsgrille', title: k, data: { cle: k, ...f } }, { force: true }).catch(() => {}); } };
  },
};
