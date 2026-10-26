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
  const temps = nom === 'Nouvelle lune' ? 'semer' : nom === 'Pleine lune' ? 'entendre' : frac < 0.5 ? 'grandir' : 'laisser';
  const cycle = new Date(date - age * 864e5).toISOString().slice(0, 10); // date de la dernière nouvelle lune
  return { age, frac, lit, nom, temps, cycle, waxing: frac < 0.5 };
}

// Le filon : la lune est l'horloge de notre processus. Ses quatre temps sont les quatre gestes de la création
// (semer = créer, faire grandir = façonner, faire entendre = produire, laisser aller = trier et relire).
// Six lunes ≈ nos six mois : chaque cycle est un tour complet du processus.
export const CYCLE = [
  { temps: 'semer', phase: 'Créer', quand: 'nouvelle lune', geste: 'Générer sans juger : impro, mumble, idées brutes. Et poser chacun son intention du cycle.', outils: [['relais', 'Le relais'], ['ecrire', 'Le mumble'], ['labo', 'Le labo'], ['jeux', 'Le grimoire']] },
  { temps: 'grandir', phase: 'Façonner', quand: 'lune croissante', geste: 'Développer : accords, structure, paroles posées sur la musique.', outils: [['studio?tab=chanson', 'Nos chansons'], ['placer', 'Placer mes paroles'], ['oreille', 'L’oreille'], ['session', 'Une séance']] },
  { temps: 'entendre', phase: 'Produire', quand: 'pleine lune', geste: 'Fixer et faire entendre : une prise complète, d’un bout à l’autre, à faire écouter à quelqu’un.', outils: [['studio?tab=voix', 'Les prises'], ['session?cible=La%20fin%20d%E2%80%99un%20morceau', 'Séance de prise'], ['cathedrale', 'La cathédrale']] },
  { temps: 'laisser', phase: 'Trier et relire', quand: 'lune décroissante', geste: 'Trier le mur, garder les perles, relire son intention : tenue, transformée ou lâchée.', outils: [['carnet', 'Le mur'], ['coffre', 'Le coffre'], ['elan', 'Notre élan'], ['bilan', 'Le bilan']] },
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
