// Outils de langue pour l'écriture de chansons : syllabes chantées, rimes, synonymes.
// Rimes et syllabes : Lexique 3.83 (New & Pallier, lexique.org, CC BY-SA 4.0), chargé à la demande.
// Synonymes : myThes 2.3 (Frédéric Labbé, Dicollecte, LGPL), le dictionnaire de LibreOffice, dans l'app et hors ligne ;
// le Wiktionnaire (CC BY-SA) en renfort pour les mots qu'il ne connaît pas.

const VOWELS = 'aeiouyEO29@§51°';
let words = null; // mot → { phon, nb, parts, freq }
let byRime = null; // clé de rime → [mots], du plus fréquent au moins fréquent
let loading = null;

export function loadLexique() {
  if (!loading) {
    loading = fetch('data/lexique-fr.tsv').then((r) => r.text()).then((txt) => {
      words = new Map();
      byRime = new Map();
      let rank = 0;
      for (const line of txt.split('\n')) {
        if (!line || line[0] === '#') continue;
        const [w, phon, nb, osyl] = line.split('\t');
        const info = { phon, nb: +nb, parts: osyl ? osyl.split('-') : [w], rank: rank++ };
        words.set(w, info);
        const k = rimeKey(phon);
        if (k) {
          if (!byRime.has(k)) byRime.set(k, []);
          byRime.get(k).push(w);
        }
      }
      return words;
    });
  }
  return loading;
}
export const lexiqueReady = () => !!words;

// La rime « suffisante » : la dernière voyelle prononcée et ce qui suit.
function lastVowel(phon) {
  const p = phon.replace(/°+$/, '');
  for (let i = p.length - 1; i >= 0; i--) if (VOWELS.includes(p[i])) return [p, i];
  return [p, -1];
}
export function rimeKey(phon) {
  const [p, i] = lastVowel(phon || '');
  return i < 0 ? '' : p.slice(i);
}

const norm = (w) => w.toLowerCase().replace(/[’']/g, "'");
export const info = (w) => words?.get(norm(w)) || null;

// Découpage orthographique de secours pour les mots absents du lexique.
const V = 'aeiouyàâäéèêëîïôöùûüœæ';
function guessParts(w) {
  const re = new RegExp(`[^${V}]*[${V}]+(?:[^${V}]*$)?`, 'gi');
  // « qu » et « gu » (devant e, i) : le u ne se prononce pas.
  const flat = w.replace(/qu/gi, 'k').replace(/gu(?=[eiéèêy])/gi, 'g');
  return flat.match(re) || [w];
}
function guessMute(w) { return /[^aeiouyéè]e(s|nt)?$/i.test(w) && w.length > 2; }

// Syllabes d'un mot : { parts, mute } — mute = la dernière syllabe est un e muet.
export function wordSyll(w) {
  const i = info(w);
  if (i) return { parts: i.parts, mute: i.parts.length > i.nb, known: true };
  const parts = guessParts(w);
  return { parts, mute: guessMute(w) && parts.length > 1, known: false };
}

const startsVowel = (w) => /^[aeiouyàâäéèêëîïôöùûüœæh]/i.test(w);
const TOKEN = /[A-Za-zÀ-ÖØ-öø-ÿœŒæÆ]+(?:['’](?=[A-Za-zÀ-ÖØ-öø-ÿ]))?/g;

// Compte les syllabes chantées d'une ligne, avec la règle du e muet :
// il compte devant une consonne, s'élide devant une voyelle (ou un h), se tait en fin de ligne.
export function lineSyll(line) {
  const clean = line.replace(/\[\?|\?\]/g, ' ').replace(/_{2,}|\[\.\.\.\]|…/g, ' ');
  const toks = clean.match(TOKEN) || [];
  const out = [];
  let count = 0;
  toks.forEach((t, k) => {
    // l', j', d' : aucune syllabe. jusqu', lorsqu', aujourd' : les syllabes avant l'élision.
    if (/['’]$/.test(t)) {
      const core = t.slice(0, -1);
      const n = core.length > 1 ? guessParts(core.replace(/e$/i, '')).length : 0;
      count += n;
      out.push({ word: t, parts: [t], silent: n ? [] : [0] });
      return;
    }
    const { parts, mute, known } = wordSyll(t);
    const next = toks[k + 1];
    let silentLast = false;
    if (mute) silentLast = !next || startsVowel(next);
    const n = parts.length - (silentLast ? 1 : 0);
    count += n;
    out.push({ word: t, parts, silent: silentLast ? [parts.length - 1] : [], known });
  });
  return { count, words: out, last: toks[toks.length - 1] || '' };
}

// Rimes pour un mot : riches (2 sons communs ou plus), suffisantes, assonances.
export function rhymes(w, limit = 80) {
  const i = info(w);
  if (!i) return null;
  const key = rimeKey(i.phon);
  const [p, idx] = lastVowel(i.phon);
  const rich = idx > 0 ? p.slice(idx - 1) : null;
  const self = norm(w);
  const same = (byRime.get(key) || []).filter((x) => x !== self);
  const riches = rich ? same.filter((x) => words.get(x).phon.replace(/°+$/, '').endsWith(rich)) : [];
  const richSet = new Set(riches);
  const suff = same.filter((x) => !richSet.has(x));
  const vowel = key[0];
  const asson = [];
  for (const [k, list] of byRime) {
    if (k !== key && k[0] === vowel) for (const x of list.slice(0, 6)) if (x.length > 2) asson.push(x);
    if (asson.length > 300) break;
  }
  asson.sort((a, b) => words.get(a).rank - words.get(b).rank);
  return { phon: i.phon, riches: riches.slice(0, limit), suffisantes: suff.slice(0, limit), assonances: asson.slice(0, 40) };
}

export function rimeOf(line) {
  const last = lineSyll(line).last;
  const i = last && info(last);
  return i ? rimeKey(i.phon) : (last ? last.slice(-3).toLowerCase() : '');
}

// Rimes classées pour la chanson : combien de sons on partage avec le mot (plus il y en a, plus la rime sonne),
// et combien de syllabes a chaque rime (pour garder la même longueur de vers).
export function rimesClassees(w, limit = 60) {
  const i = info(w); if (!i) return null;
  const a = i.phon.replace(/°+$/, ''); const self = norm(w);
  const commun = (b) => { let n = 0; while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++; return n; };
  const liste = (byRime.get(rimeKey(i.phon)) || [])
    .filter((x) => x !== self && words.get(x).phon.replace(/°+$/, '') !== a) // pas les homophones (ver, vert, verre)
    .map((x) => ({ w: x, sons: commun(words.get(x).phon.replace(/°+$/, '')), nb: words.get(x).nb, rank: words.get(x).rank }));
  liste.sort((x, y) => y.sons - x.sons || x.rank - y.rank);
  // Une seule forme par son : « balance » suffit, pas aussi « balances » et « balancent ».
  const vus = new Set(); const uniques = liste.filter((x) => { const ph = words.get(x.w).phon.replace(/°+$/, ''); if (vus.has(ph)) return false; vus.add(ph); return true; });
  const homophones = (byRime.get(rimeKey(i.phon)) || []).filter((x) => x !== self && words.get(x).phon.replace(/°+$/, '') === a);
  return { phon: i.phon, nb: i.nb, rimes: uniques.slice(0, limit), homophones: homophones.slice(0, 8) };
}

// Synonymes, par sens : d'abord le dictionnaire de l'app (hors ligne), sinon le Wiktionnaire.
const NATURE = { n: 'nom', v: 'verbe', a: 'adjectif', adv: 'adverbe', '': '' };
let thes = null;
const chargerThes = () => (thes ||= fetch('data/synonymes-fr.tsv').then((r) => r.text()).then((t) => {
  const m = new Map(); for (const l of t.split('\n')) { if (!l || l[0] === '#') continue; const [w, s] = l.split('\t'); m.set(w, s); } return m;
}).catch(() => new Map()));
export async function synonymesParSens(w) {
  const m = await chargerThes(); const k = norm(w);
  let brut = m.get(k) || m.get(k.replace(/s$/, '')) || m.get(k.replace(/es$/, 'e')) || m.get(k.replace(/x$/, ''));
  if (brut) return { source: 'dico', sens: brut.split(';').map((x) => { const [n, l] = x.split(':'); const rang = (m) => words?.get(norm(m))?.rank ?? 1e6; return { nature: NATURE[n] ?? '', mots: l.split('|').sort((x, y) => rang(x) - rang(y)) }; }) };
  const wik = await synonyms(w);
  return wik == null ? null : { source: 'wiktionnaire', sens: wik.length ? [{ nature: '', mots: wik }] : [] };
}

// Synonymes : section « Synonymes » du Wiktionnaire (et quasi-synonymes).
const synCache = new Map();
export async function synonyms(w) {
  const key = norm(w);
  if (synCache.has(key)) return synCache.get(key);
  const url = `https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(key)}&prop=wikitext&format=json&origin=*&redirects=1`;
  const p = fetch(url).then((r) => r.json()).then((d) => {
    const txt = d?.parse?.wikitext?.['*'] || '';
    const fr = `\n${txt}`.split(/\n== *\{\{langue\|/).find((s) => s.startsWith('fr}}')) || '';
    const out = new Set();
    const re = /\{\{S\|(synonymes|quasi-synonymes)[^}]*\}\}([\s\S]*?)(?=\n=|\n\{\{S\||$)/g;
    let m;
    while ((m = re.exec(fr))) {
      for (const l of m[2].matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
        const s = l[1].trim();
        if (s && s.toLowerCase() !== key && !s.includes(':')) out.add(s);
      }
    }
    return [...out].slice(0, 40);
  }).catch(() => null);
  synCache.set(key, p);
  return p;
}
