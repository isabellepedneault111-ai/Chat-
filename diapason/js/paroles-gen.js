// Des paroles brouillon, assemblées sur une grille d'accords : un thème, des mots-clés, une longueur de ligne.
// Pas d'intelligence artificielle ici : des tournures de phrases françaises, des banques de mots par thème,
// le lexique (syllabes, rimes, nature des mots) et le dictionnaire de synonymes de l'app. FLIP essaie des
// centaines de phrases par ligne et garde celles qui tombent le mieux sur les temps (le même calcul que « Placer »)
// et qui riment selon le schéma choisi. Ce sont des brouillons à retravailler, pas des paroles finies.
import { info, rimeOf, rimesClassees, synonymesParSens, ecarte } from './lexique.js';
export { ecarte };
import { syllabes, placer } from './views/placer.js';

// Banques par thème. Noms : « mot genre » (m ou f). Adjectifs : au masculin (le féminin est calculé, ou « m/f »).
// Verbes transitifs : à la 1re personne (« cherche », « rêve de »). Verbes intransitifs : à la 3e personne.
const B = (n, a, vt, vi) => ({ n: n.split(', ').map((x) => { const [w, g] = x.split(' '); return { w, g }; }), a: a.split(', '), vt: vt.split(', '), vi: vi.split(', ') });
export const THEMES = {
  amour: { nom: 'L’amour', ...B('peau f, bouche f, main f, cœur m, regard m, souffle m, nom m, épaule f, promesse f, tendresse f, fenêtre f, sourire m, voix f', 'doux/douce, tendre, chaud, fragile, léger/légère, lent, vrai', 'cherche, garde, tiens, embrasse, appelle, attends, veux, porte, devine, respire', 'tremble, brûle, revient, respire, s’ouvre, s’allume, chavire, frissonne') },
  nuit: { nom: 'La nuit', ...B('nuit f, lune f, rue f, néon m, silence m, ombre f, étoile f, fenêtre f, sommeil m, minuit m, lampe f, insomnie f, ciel m, noir m', 'noir, sombre, bleu, immense, froid, lent, muet, éveillé', 'traverse, écoute, allume, attends, compte, cherche, garde, éteins', 'tombe, brille, s’éteint, veille, se tait, dort, respire, s’efface') },
  route: { nom: 'La route', ...B('route f, horizon m, voiture f, poussière f, carte f, frontière f, ville f, valise f, vent m, phare m, départ m, chemin m, autoroute f, station f', 'lointain, vide, ouvert, perdu, immense, fatigué, libre, droit', 'prends, quitte, suis, traverse, laisse, oublie, cherche, retrouve, roule vers', 'défile, s’en va, file, recommence, passe, avance, se perd, s’étire') },
  mer: { nom: 'La mer', ...B('mer f, vague f, sel m, sable m, rivage m, marée f, bateau m, phare m, écume f, large m, océan m, plage f, tempête f, quai m', 'salé, bleu, profond, calme, immense, gris, sauvage, mouillé', 'regarde, attends, traverse, écoute, garde, rejoins, laisse, perds', 'monte, revient, se brise, chante, gronde, s’efface, respire, dérive') },
  ville: { nom: 'La ville', ...B('ville f, béton m, trottoir m, métro m, foule f, vitrine f, sirène f, toit m, ruelle f, pont m, bruit m, terrasse f, carrefour m, néon m', 'gris, pressé, bruyant, électrique, perdu, nocturne, pâle, vivant', 'traverse, quitte, cherche, habite, regarde, fuis, aime, entends', 'vibre, s’allume, s’endort, crie, court, bourdonne, s’arrête, déborde') },
  souvenir: { nom: 'Les souvenirs', ...B('souvenir m, photo f, enfance f, cour f, cabane f, maison f, été m, vélo m, cahier m, odeur f, parfum m, jardin m, grenier m, chanson f', 'jauni, ancien, perdu, tendre, doux/douce, lointain, oublié, fragile', 'garde, retrouve, oublie, cherche, revois, efface, raconte, rêve de', 'revient, s’efface, s’envole, jaunit, résonne, dort, attend, sourit') },
  absence: { nom: 'L’absence', ...B('absence f, vide m, chaise f, silence m, téléphone m, lettre f, adieu m, place f, trace f, manque m, porte f, écho m, cendre f, fantôme m', 'vide, froid, lourd, muet, seul, fermé, lent, gris', 'attends, appelle, garde, cherche, efface, relis, ferme, laisse', 'pèse, reste, s’éteint, résonne, s’efface, se tait, tombe, s’en va') },
  hiver: { nom: 'L’hiver', ...B('hiver m, neige f, tempête f, glace f, froid m, poudrerie f, tuque f, fenêtre f, foyer m, flocon m, mitaine f, lumière f, matin m, souffle m', 'blanc/blanche, gelé, froid, glacé, immense, muet, bleu, pâle', 'réchauffe, attends, traverse, regarde, garde, allume, souffle, pellette', 'tombe, craque, fond, gèle, s’installe, siffle, dort, brille') },
  feu: { nom: 'Le feu', ...B('feu m, flamme f, braise f, colère f, cendre f, fièvre f, orage m, étincelle f, sang m, cri m, tonnerre m, poing m, rage f, incendie m', 'rouge, brûlant, sauvage, vivant, fou/folle, ardent, fort', 'allume, porte, crie, garde, avale, nourris, lance, réveille', 'brûle, gronde, éclate, monte, crépite, explose, danse, rugit') },
  liberte: { nom: 'La liberté', ...B('liberté f, ciel m, aile f, oiseau m, vent m, fenêtre f, porte f, horizon m, envol m, chemin m, espace m, souffle m, lumière f, saut m', 'libre, léger/légère, ouvert, immense, neuf/neuve, sauvage, vivant, haut', 'ouvre, prends, quitte, cherche, respire, lance, invente, choisis', 's’envole, s’ouvre, danse, respire, éclate, recommence, avance, chante') },
};
const COMMUN = B('temps m, monde m, jour m, voix f, cœur m, main f, chanson f, silence m', 'seul, vrai, lent, doux/douce', 'cherche, garde, attends, chante', 'passe, revient, s’en va, reste');

// Les mots écartés (sexe, vulgarité, insultes, drogue, violence crue) : la liste vit dans lexique.js.

// ---------- Le petit français : élisions, accords, pluriels ----------
const H_MUET = /^h(abit|ésit|iver|orizon|istoire|eure|umeur|ôtel|erbe|omme|onneur|orreur|uile|umain|umanit|umour|ôpital|ôte|irondelle|orloge|ymne|armonie|éroïne|ommage|abitude|ivers|aleine|ospice|ostie|uître|ypoth|orizons)/i;
const voyelle = (w) => /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(w) || (H_MUET.test(w) && !/^hasard/i.test(w));
// Genre d'un mot hors des banques : quelques mots courants, puis les terminaisons.
const FEM = new Set('lettre fenêtre baraque musique banque nuit main fin peau eau faim soif voix croix fois mort part dent forêt clé clef faim chair cour tour fleur peur sœur douleur chaleur couleur odeur vapeur lueur saveur fureur pluie vie joie mort neige page plage image cage rage nage'.split(' '));
const MASC = new Set('musée lycée trophée cœur silence visage rêve monde ciel ange fleuve arbre livre verre nombre sable vide rire ventre rythme groupe piano soleil feu jeu lieu temps espace orage nuage voyage passage message paysage village courage bonheur malheur moteur regard'.split(' '));
// Le vrai genre des noms, leurs pluriels irréguliers et les féminins irréguliers des adjectifs (Lexique 3.83).
const GENRES = new Map(); const FEMININS = new Map(); let genresP = null;
export const chargerGenres = () => (genresP ||= fetch('data/genres-fr.tsv').then((r) => r.text()).then((t) => {
  for (const l of t.split('\n')) { if (!l || l[0] === '#') continue; const [w, g, x] = l.split('\t'); if (g === 'a') FEMININS.set(w, x); else GENRES.set(w, { g, pl: x || '' }); }
}).catch(() => {}));
export const genreConnu = (w) => GENRES.get(String(w).toLowerCase())?.g || null;
export function genre(w) {
  const x = w.toLowerCase();
  const connu = GENRES.get(x); if (connu) return connu.g;
  if (FEM.has(x)) return 'f'; if (MASC.has(x)) return 'm';
  if (/(tion|sion|té|tié|ure|ette|ence|ance|ade|ie|ée|ise|elle|esse|ude|ine|ière|ance|eille|ouille)$/.test(x)) return 'f';
  if (/e$/.test(x) && !/(age|isme|ème|ège|ste|tre|bre|ice|ome|aire|oire|phe|que)$/.test(x)) return 'f';
  return 'm';
}
const pluriel = (w) => (GENRES.get(w)?.pl) || (/[sxz]$/.test(w) ? w : /(eau|eu|au)$/.test(w) ? `${w}x` : /al$/.test(w) && !/(bal|festival|carnaval|chacal)$/.test(w) ? w.replace(/al$/, 'aux') : `${w}s`);
function adjForme(a, g, pl) {
  let [m, f] = a.split('/');
  if (!f && FEMININS.has(m)) f = FEMININS.get(m);
  if (!f) {
    f = /e$/.test(m) ? m : /eux$/.test(m) ? m.replace(/eux$/, 'euse') : /if$/.test(m) ? m.replace(/if$/, 'ive') : /(el|en|on)$/.test(m) ? `${m}${m.slice(-1)}e` : /er$/.test(m) ? m.replace(/er$/, 'ère') : /et$/.test(m) ? `${m}te` : `${m}e`;
  }
  const s = g === 'f' ? f : m;
  return pl ? (/[sx]$/.test(s) ? s : /eau$/.test(s) ? `${s}x` : `${s}s`) : s;
}
// Verbes : « rêve de » → { v: 'rêve', p: 'de' }. La 2e personne : « cherche » → « cherches », « prends » reste.
const verbe = (x) => { const [v, ...p] = x.split(' '); return { v, p: p.join(' ') }; };
const tuDe = (v) => (/[sx]$/.test(v) ? v : `${v}s`);
const sujet = (pers, v) => (pers === 'tu' ? `tu ${tuDe(v)}` : voyelle(v) ? `j’${v}` : `je ${v}`);
const neg = (pers, v) => { const f = pers === 'tu' ? tuDe(v) : v; return `${pers === 'tu' ? 'tu' : 'je'} ${voyelle(f) ? 'n’' : 'ne '}${f} plus`; };

// Un groupe nominal : déterminant (avec élisions), nom, adjectif accordé.
function gn(r, nom, { adj = null, det = null } = {}) {
  const k0 = det || r.pick(['def', 'def', 'pos1', 'pos2', 'pos2', 'dem', 'pl', 'plpos', 'un']);
  // Un mot venu des rimes du lexique : son genre est deviné, alors on le met au pluriel (« les », « mes ») pour ne pas se tromper.
  const k = nom.devine && k0 !== 'pl' && k0 !== 'plpos' ? r.pick(['pl', 'plpos']) : k0;
  const pl = k === 'pl' || k === 'plpos';
  const n = pl ? pluriel(nom.w) : nom.w; const v = voyelle(n); const f = nom.g === 'f';
  const d = { def: v ? 'l’' : f ? 'la ' : 'le ', pos1: v || !f ? 'mon ' : 'ma ', pos2: v || !f ? 'ton ' : 'ta ', dem: f ? 'cette ' : v ? 'cet ' : 'ce ', pl: 'les ', plpos: r.pick(['mes ', 'tes ', 'nos ']), un: f ? 'une ' : 'un ' }[k];
  return { d, n, a: adj ? adjForme(adj, nom.g, pl) : '', mot: nom.w };
}
const txt = (g) => `${g.d}${g.n}${g.a ? ` ${g.a}` : ''}`;
// Préposition + groupe : de + le → du, à + les → aux.
function avec(p, g) {
  if (!p) return txt(g);
  if (p === 'de' || p === 'à') {
    const t = txt(g);
    if (g.d === 'le ') return `${p === 'de' ? 'du' : 'au'} ${t.slice(3)}`;
    if (g.d === 'les ') return `${p === 'de' ? 'des' : 'aux'} ${t.slice(4)}`;
    return p === 'de' && /^une? /.test(t) ? `d’${t}` : `${p} ${t}`;
  }
  return `${p} ${txt(g)}`;
}

// Un tirage au hasard qu'on peut rejouer (la même graine donne les mêmes lignes).
export function hasard(graine) {
  let a = graine >>> 0;
  const f = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.pick = (l) => l[Math.floor(f() * l.length)];
  return f;
}

// Les tournures. Chacune reçoit un tirage, la banque, la personne, et un nom imposé pour la fin (pour rimer).
const TOURNURES = [
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} ${avec(v.p, gn(r, fin || b.nom(r)))}`; },
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} ${avec(v.p, gn(r, fin || b.nom(r), { adj: r.pick(b.a) }))}`; },
  (r, b) => `${txt(gn(r, b.nom(r), { det: r.pick(['def', 'pos2', 'pos1', 'dem']) }))} ${r.pick(b.vi)}`,
  (r, b) => `${txt(gn(r, b.nom(r), { det: r.pick(['def', 'pos2', 'dem']) }))} ${r.pick(b.vi)} encore`,
  (r, b, p, fin) => `et ${txt(gn(r, b.nom(r), { det: r.pick(['def', 'pos2']) }))} ${r.pick(b.vi)} dans ${txt(gn(r, fin || b.nom(r)))}`,
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} ${avec(v.p, gn(r, b.nom(r)))} dans ${txt(gn(r, fin || b.nom(r)))}`; },
  (r, b, p, fin) => `${p === 'tu' ? 'tu as' : 'j’ai'} ${txt(gn(r, b.nom(r), { det: 'def' }))} dans ${txt(gn(r, fin || b.nom(r), { det: r.pick(['pos1', 'pos2', 'plpos', 'def']) }))}`,
  (r, b, p, fin) => `${txt(gn(r, b.nom(r), { adj: r.pick(b.a) }))}, ${txt(gn(r, fin || b.nom(r), { adj: fin ? null : r.pick(b.a) }))}`,
  (r, b) => `quand ${txt(gn(r, b.nom(r), { det: r.pick(['def', 'pos2', 'pos1']) }))} ${r.pick(b.vi)}`,
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} encore ${avec(v.p, gn(r, fin || b.nom(r)))}`; },
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${neg(p, v.v)} ${avec(v.p, gn(r, fin || b.nom(r)))}`; },
  (r, b, p, fin) => `sous ${txt(gn(r, fin || b.nom(r), { adj: fin ? null : r.pick(b.a) }))}`,
  (r, b, p, fin) => `entre ${txt(gn(r, b.nom(r)))} et ${txt(gn(r, fin || b.nom(r)))}`,
  (r, b, p, fin) => `il reste ${txt(gn(r, fin || b.nom(r), { det: r.pick(['def', 'pos2', 'pos1', 'un']) }))}`,
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} ${avec(v.p, gn(r, b.nom(r)))} comme ${txt(gn(r, fin || b.nom(r), { det: r.pick(['def', 'un']) }))}`; },
  (r, b, p, fin) => `${txt(gn(r, b.nom(r)))}, ${txt(gn(r, b.nom(r)))} et ${txt(gn(r, fin || b.nom(r)))}`,
  (r, b, p, fin) => `oh, ${txt(gn(r, fin || b.nom(r), { det: r.pick(['pos1', 'pos2', 'def']) }))}`,
  (r, b, p, fin) => `on ${r.pick(b.vi)} sous ${txt(gn(r, fin || b.nom(r)))}`,
  (r, b, p, fin) => `tout ${r.pick(b.vi)}, même ${txt(gn(r, fin || b.nom(r)))}`,
  (r, b, p, fin) => { const v = verbe(r.pick(b.vt)); return `${sujet(p, v.v)} ${avec(v.p, gn(r, b.nom(r)))} ${avec('de', gn(r, fin || b.nom(r), { det: r.pick(['def', 'pos2', 'pos1']) }))}`; },
];
// Le naturel de chaque tournure : une phrase avec un verbe sonne mieux qu'une énumération de noms.
const NATUREL = [10, 8, 9, 6, 6, 7, 9, -6, 5, 8, 9, 0, 0, 5, 7, -14, -8, 6, 5, 0];
const PHRASES = [(k) => k, (k) => `oh, ${k}`, (k) => `${k}, encore`, (k) => `et ${k}`, (k) => `tout ça pour ${k}`, (k) => `j’ai dit : ${k}`, (k) => `${k}, ${k}`];
const propre = (s) => s.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();

// Prépare la banque : le thème, le fonds commun, les mots-clés (et leurs synonymes du dictionnaire de l'app).
export async function banque(theme, motsCles) {
  await chargerGenres();
  // Un thème ou plusieurs : leurs banques se mélangent (sans doublons).
  const ts = (Array.isArray(theme) ? theme : [theme]).map((k) => THEMES[k]).filter(Boolean); if (!ts.length) ts.push(THEMES.nuit);
  const uniq = (l, k = (x) => x) => l.filter((x, i) => l.findIndex((y) => k(y) === k(x)) === i);
  const n = uniq([...ts.flatMap((t) => t.n), ...COMMUN.n.slice(0, 4)], (x) => x.w); const a = uniq([...ts.flatMap((t) => t.a), ...COMMUN.a]); const vt = uniq([...ts.flatMap((t) => t.vt), ...COMMUN.vt.slice(0, 2)]); const vi = uniq([...ts.flatMap((t) => t.vi), ...COMMUN.vi.slice(0, 2)]);
  // Le genre des banques vérifié dans le dictionnaire (au cas où on se serait trompé en les écrivant).
  n.forEach((x, i) => { const g = genreConnu(x.w); if (g && g !== x.g) n[i] = { ...x, g }; });
  const cles = []; const phrases = [];
  for (const brut of motsCles) {
    const k = brut.trim().toLowerCase(); if (!k) continue;
    if (/\s/.test(k)) { phrases.push(k); continue; }
    const cat = info(k)?.cat || '';
    if (cat.startsWith('ADJ')) { a.push(k); cles.push({ k, sorte: 'a' }); }
    else if (cat.startsWith('VER') && /er$/.test(k)) { const v = k.replace(/er$/, 'e'); vt.push(v); cles.push({ k: v, sorte: 'vt' }); }
    else if (cat.startsWith('VER') && !genreConnu(k)) { phrases.push(k); cles.push({ k, sorte: 'p' }); } // « partir », « courir » : un verbe à l'infinitif, gardé tel quel
    else { const nom = { w: k, g: genre(k), cle: true }; n.push(nom); cles.push({ k, sorte: 'n', nom }); }
    // Quelques synonymes du même sens, pour ne pas répéter le mot-clé à chaque ligne.
    try {
      const s = await synonymesParSens(k);
      const sens = s?.sens?.find((x) => (cat.startsWith('ADJ') ? x.nature === 'adjectif' : x.nature === 'nom')) || null;
      (sens?.mots || []).filter((w) => !/\s/.test(w) && info(w)?.rank < 8000 && !ecarte(w)).filter((w) => (cat.startsWith('ADJ') ? info(w)?.cat?.startsWith('ADJ') : !!genreConnu(w))).slice(0, 3).forEach((w) => { if (cat.startsWith('ADJ')) a.push(w); else n.push({ w, g: genreConnu(w) }); });
    } catch { /* hors ligne : on garde le mot seul */ }
  }
  return { n, a, vt, vi, cles, phrases };
}

// La rime d'un nom, pour imposer la fin d'une ligne.
const rimeNom = (w) => { const i = info(w); return i ? rimeOf(w) : ''; };
function nomsQuiRiment(b, cle, eviter) {
  const sans = (w) => w.replace(/[sx]$/, '');
  const l = b.n.filter((x) => rimeNom(pluriel(x.w)) === cle || rimeNom(x.w) === cle).filter((x) => sans(x.w) !== sans(eviter));
  if (l.length >= 3) return l;
  // Sinon, les rimes du lexique : des noms courants qui partagent le son de la fin.
  const r = rimesClassees(eviter, 120);
  const plus = (r?.rimes || []).filter((x) => info(x.w)?.cat === 'NOM' && !ecarte(x.w) && x.rank < 4000 && x.w.length > 2 && !/[s-]/.test(x.w.slice(-1)) && !x.w.includes('-')).slice(0, 10).map((x) => ({ w: x.w, g: genre(x.w), devine: !genreConnu(x.w) }));
  return [...l, ...plus];
}

// Une ligne : des centaines d'essais, notés sur la prosodie (le calcul de « Placer »), la rime voulue, les mots-clés,
// et la variété (pas deux fois le même mot de fin, pas toujours les mêmes noms).
export function ligne({ b, r, slots, pers, rime = null, tete = false, finAEviter = [], dejaVus = new Map(), clesManquantes = [] }) {
  // Les familles de rimes de la banque (« lumière », « fenêtre »… non ; « neige », « piège » oui) : une ligne qui
  // appellera une rime finit de préférence sur un mot qui a déjà une partenaire dans la banque.
  if (!b.familles) {
    const f = new Map(); b.n.forEach((x) => { const k = rimeNom(x.w); if (!k) return; if (!f.has(k)) f.set(k, []); if (!f.get(k).some((y) => y.w === x.w)) f.get(k).push(x); });
    b.familles = [...f.values()].filter((l) => l.length >= 2).flat();
  }
  const finsRime = rime ? nomsQuiRiment(b, rime.cle, rime.mot) : tete && b.familles.length ? b.familles : null;
  const nomAuHasard = (rr) => {
    const manque = clesManquantes.filter((c) => c.sorte === 'n');
    if (manque.length && rr() < 0.35) return rr.pick(manque).nom;
    return rr.pick(b.n);
  };
  const banqueL = { ...b, nom: nomAuHasard };
  let best = null;
  for (let i = 0; i < 420; i++) {
    const p = pers === 'mix' ? r.pick(['je', 'tu']) : pers;
    let s; let bonus = 0;
    if (b.phrases.length && r() < 0.06) s = r.pick(PHRASES)(r.pick(b.phrases));
    else {
      const fin = finsRime && finsRime.length && r() < (rime ? 0.75 : 0.5) ? r.pick(finsRime) : null;
      const t = Math.floor(r() * TOURNURES.length); bonus = NATUREL[t] || 0;
      s = TOURNURES[t](r, banqueL, p, fin);
    }
    s = propre(s);
    const syl = syllabes(s); if (!syl.length) continue;
    const pl = placer(syl, slots);
    let note = pl.note + bonus;
    // Trop court : la ligne laisse des trous sur les temps (une place libre passe, pas plus).
    note -= Math.max(0, slots.length - syl.length - 1) * 6;
    const derniers = s.split(/[\s’',.;:!?]+/).filter(Boolean); const finMot = derniers.at(-1).toLowerCase();
    if (rime) note += rimeOf(s) === rime.cle ? 30 : -45;
    if (finAEviter.includes(finMot)) note -= 60;
    for (const w of derniers) note -= (dejaVus.get(w.toLowerCase()) || 0) * (w.length > 3 ? 12 : 0);
    // Le même mot plein deux fois dans la ligne (« le fanal dans mon fanal ») : non.
    // Le filet : aucun mot écarté, sauf ceux que la personne a tapés elle-même.
    if (derniers.some((w) => ecarte(w) && !b.cles.some((c) => w.toLowerCase().includes(c.k)) && !b.phrases.some((ph) => ph.includes(w.toLowerCase())))) continue;
    const pleins = derniers.map((w) => w.toLowerCase().replace(/s$/, '')).filter((w) => w.length > 3);
    if (new Set(pleins).size < pleins.length) note -= 90;
    for (const c of clesManquantes) if (s.toLowerCase().includes(c.k)) note += 14;
    if (!best || note > best.note) best = { txt: s, note, syl: syl.length, place: pl.note, fin: finMot };
  }
  return best;
}

// Le schéma de rimes : pour chaque ligne, avec laquelle elle rime (ou rien).
export const SCHEMAS = { AABB: 'Deux par deux (AABB)', ABAB: 'Croisées (ABAB)', ABCB: 'Seulement 2 et 4 (ABCB)', libre: 'Sans rimes imposées' };
export function partenaire(schema, i) {
  const j = i % 4;
  if (schema === 'AABB') return j % 2 === 1 ? i - 1 : null;
  if (schema === 'ABAB') return j >= 2 ? i - 2 : null;
  if (schema === 'ABCB') return j === 3 ? i - 2 : null;
  return null;
}
