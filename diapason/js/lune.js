// La lune comme rythme de création, sans prendre toute la place.
// Nouvelle lune : semer (l'intention du cycle). Croissante : faire grandir. Pleine : faire entendre. Décroissante : laisser aller.
const SYN = 29.530588853;
const REF = Date.UTC(2000, 0, 6, 18, 14);

export function lune(date = new Date()) {
  const age = ((((date - REF) / 864e5) % SYN) + SYN) % SYN;
  const frac = age / SYN;
  const lit = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const noms = [[1.85, 'Nouvelle lune'], [5.54, 'Premier croissant'], [9.23, 'Premier quartier'], [12.92, 'Lune gibbeuse croissante'], [16.61, 'Pleine lune'], [20.3, 'Lune gibbeuse décroissante'], [23.99, 'Dernier quartier'], [27.68, 'Dernier croissant'], [SYN, 'Nouvelle lune']];
  const nom = noms.find(([a]) => age < a)[1];
  // Semer commence au moment de la nouvelle lune (pas avant) : les derniers jours du cycle restent ceux du passage.
  const temps = age < 1.85 ? 'semer' : nom === 'Pleine lune' ? 'entendre' : frac < 0.5 ? 'grandir' : 'laisser';
  const cycle = new Date(date - age * 864e5).toISOString().slice(0, 10); // date de la dernière nouvelle lune
  return { age, frac, lit, nom, temps, cycle, waxing: frac < 0.5 };
}

// Le filon : la lune est l'horloge de notre processus. Ses quatre temps sont les quatre gestes de la création
// (semer = créer, faire grandir = façonner, faire entendre = produire, laisser aller = trier et relire).
// Six lunes ≈ nos six mois : chaque cycle est un tour complet du processus.
export const CYCLE = [
  { temps: 'semer', phase: 'Créer', quand: 'nouvelle lune', periode: 'les jours de la nouvelle lune', geste: 'Générer sans juger : impro, mumble, idées brutes. Et poser chacun son intention du cycle.', outils: [['relais', 'Le relais'], ['ecrire', 'Le mumble'], ['labo', 'Le labo'], ['jeux', 'Le grimoire']] },
  { temps: 'grandir', phase: 'Façonner', quand: 'lune croissante', periode: 'les deux semaines où la lune grossit', geste: 'Développer : accords, structure, paroles posées sur la musique.', outils: [['studio?tab=chanson', 'Nos chansons'], ['placer', 'Placer mes paroles'], ['oreille', 'L’oreille'], ['session', 'Une séance']] },
  { temps: 'entendre', phase: 'Produire', quand: 'pleine lune', periode: 'les jours de la pleine lune', geste: 'Fixer et faire entendre : une prise complète, d’un bout à l’autre, à faire écouter à quelqu’un.', outils: [['studio?tab=voix', 'Les prises'], ['session?cible=La%20fin%20d%E2%80%99un%20morceau', 'Séance de prise'], ['cathedrale', 'La cathédrale']] },
  { temps: 'laisser', phase: 'Trier et relire', quand: 'lune décroissante', periode: 'la dernière semaine, quand la lune décroît', geste: 'Trier le mur, garder les perles, et relire son intention du cycle : tenue, transformée ou lâchée.', outils: [['carnet', 'Le mur'], ['coffre', 'Le coffre'], ['elan', 'Notre élan'], ['bilan', 'Le bilan']] },
];
// Quand change le prochain temps (pour dire « jusqu'au 5 novembre »).
export function prochainTemps(date = new Date()) {
  const ici = lune(date).temps;
  for (let h = 6; h < 24 * 31; h += 6) { const d = new Date(+date + h * 3600e3); const l = lune(d); if (l.temps !== ici) return { temps: l.temps, date: d }; }
  return null;
}
// Le numéro de la lune dans nos six mois.
export const numeroLune = (debutPlan, date = new Date()) => (debutPlan ? Math.max(1, Math.floor((date - debutPlan) / (SYN * 864e5)) + 1) : null);

export const TEMPS = {
  semer: ['le temps de semer', 'Posez chacun une intention pour ce cycle de 29 jours.', ''],
  grandir: ['le temps de faire grandir', 'Prenez une idée du mur et donnez-lui trois variations.', '#/carnet'],
  entendre: ['le temps de faire entendre', 'Une prise complète, d’un bout à l’autre, à faire écouter à quelqu’un.', '#/session'],
  laisser: ['le temps de laisser aller', 'Triez le mur : ce qui ne sert plus va à la corbeille, le reste monte d’une étape.', '#/carnet'],
};

// Petite lune tracée à l'encre, dans sa vraie phase.
export function luneSVG(l = lune(), size = 18) {
  const r = 9; const c = 10;
  const k = Math.cos(2 * Math.PI * l.frac); // 1 nouvelle, -1 pleine
  const rx = Math.abs(k) * r;
  const lit = l.frac < 0.5 ? 1 : 0; // côté éclairé : droite en croissance
  const outer = lit ? `M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r}` : `M${c} ${c - r} A${r} ${r} 0 0 0 ${c} ${c + r}`;
  const sweep = (k > 0) === !!lit ? 0 : 1;
  const term = `A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${c} ${c - r}`;
  return `<svg class="lune-ico" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.2"/>${l.lit > 0.02 ? `<path d="${outer} ${term} Z" fill="currentColor"/>` : ''}</svg>`;
}

// ---------- Le passage d'un cycle à l'autre ----------
// meta.lune : le cycle en cours ; meta.lunes : les cycles fermés (les 12 derniers) ; meta.luneProchaine : les intentions
// semées pendant le passage, pour la lune qui vient.
const vide = (cycle) => ({ cycle, intentions: {}, relue: {}, garde: {} });
export function luneCourante(meta, date = new Date()) {
  const c = lune(date).cycle;
  if (meta?.lune?.cycle === c) return meta.lune;
  if (meta?.luneProchaine?.cycle === c) return { ...vide(c), ...meta.luneProchaine };
  return vide(c);
}
// La prochaine nouvelle lune : sa date, et l'identifiant du cycle qu'elle ouvre.
export function prochaineLune(date = new Date()) {
  const ici = lune(date).cycle;
  for (let h = 6; h < 24 * 31; h += 6) { const d = new Date(+date + h * 3600e3); const l = lune(d); if (l.cycle !== ici) return { date: d, cycle: l.cycle }; }
  return null;
}
// Ce que le passage ferme et ce qu'il ouvre. La dernière semaine du cycle : on ferme le cycle en cours, on sème le suivant.
// Dans les 4 premiers jours d'un cycle : on ferme le précédent (s'il n'a pas été fermé), on sème celui-ci.
export function passage(meta, date = new Date()) {
  const l = lune(date);
  if (l.temps === 'laisser' && l.age > 18) { const p = prochaineLune(date); return { ferme: luneCourante(meta, date), ouvre: meta?.luneProchaine?.cycle === p?.cycle ? { ...vide(p.cycle), ...meta.luneProchaine } : vide(p?.cycle), ouvreDate: p?.date, enAvance: true }; }
  const prec = meta?.lune && meta.lune.cycle !== l.cycle ? meta.lune : (meta?.lunes || []).at(-1) || null;
  return { ferme: prec, ouvre: luneCourante(meta, date), ouvreDate: new Date(`${l.cycle}T12:00`), enAvance: false };
}
// Écrire dans le cycle en cours (et ranger l'ancien dans les archives s'il ne l'était pas).
export function patchLune(meta, change, date = new Date()) {
  const c = lune(date).cycle; const base = luneCourante(meta, date);
  const lunes = meta?.lune && meta.lune.cycle !== c && !(meta.lunes || []).some((x) => x.cycle === meta.lune.cycle) ? [...(meta.lunes || []), meta.lune].slice(-12) : meta?.lunes;
  return { lune: { ...base, ...change(base) }, ...(lunes ? { lunes } : {}) };
}
