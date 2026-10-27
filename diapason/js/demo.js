// Exemples fictifs pour le tour de l'app : à l'écran seulement, jamais enregistrés, retirés à la fin.
import { espace, emitEntries } from './espace.js';
import { MEMBERS } from './duo.js';

// Fabrique des entrées d’exemple (fausses, jamais sauvées) pour montrer à quoi ressemble un espace vivant.
function exemples() {
  const [z, f] = espace.meta?.members || MEMBERS;
  const now = Date.now(); const day = 864e5;
  const e = (id, type, author, title, data = {}, body = '', ago = 0) => ({ id: `demo-${id}`, type, author, title, body, data: { ...data, demo: true }, createdAt: now - ago, updatedAt: now - ago, demo: true });
  const s = [];
  for (let w = 0; w < 4; w++) s.push(e(`s${w}`, 'session', z, 'Séance', { format: 'duo60', lieu: w % 2 ? 'distance' : 'piece', cible: 'Un refrain', song: 'Forever more', startedAt: now - w * 5 * day - 3600e3, doneAt: now - w * 5 * day, done: true, takes: [1], traces: { [z]: { feu: [5, 3, 4, 4][w], mot: ['frissons', 'laborieux', 'enfin', 'lumineux'][w] }, [f]: { feu: 4, mot: 'groove' } }, debrief: { intention: 'Poser le refrain', entendu: 'La voix décolle au 2e passage', ecart: 'Entrée du clavier trop tôt', prochaine: 'Signal d’entrée au refrain' } }, '', w * 5 * day));
  return [
    ...s,
    e('r1', 'audio', f, 'Riff en Ré sus2, nappe Rhodes', { relais: true, asks: ['chante', 'ecris'], intent: 'imagine-le au petit matin', stage: 1 }, '', 2 * day),
    e('r2', 'audio', z, 'Ma voix sur ton riff', { relais: true, thread: 'demo-r1', over: 'demo-r1', asks: ['habille', 'refrain'], intent: 'mets-y de la glace, du vent', stage: 0 }, '', 1.5 * day),
    e('r3', 'note', f, 'Le fleuve dort sous nos pas', { relais: true, thread: 'demo-r1', over: 'demo-r2', asks: ['titre'], stage: 0 }, 'Le fleuve dort sous nos pas\nla glace chante tout bas', day),
    e('i1', 'note', z, 'Pont en Si mineur', { stage: 2, moves: [{ from: 0, to: 1, at: now - 12 * day, by: z }, { from: 1, to: 2, at: now - 4 * day, by: f }] }, '', 15 * day),
    e('i2', 'note', f, 'Intro au piano seul, très lente', { stage: 3 }, '', 20 * day),
    e('i3', 'note', z, 'Refrain « forever more »', { stage: 1 }, '', 8 * day),
    e('i4', 'lien', f, 'Half Moon Run · Full Circle', { stage: 0, url: 'https://open.spotify.com' }, '', 6 * day),
    { ...e('j0', 'texte', z, 'Après le silence', { journal: true, flux: true, invite: 'Écrit sur Projet 1 (Frog)' }, 'Vingt secondes de silence\net ton piano revient me chercher.\nJe n’avais pas de mots, juste un souffle :\nle mumble a trouvé le reste.', 0.2 * day) },
    e('j1', 'texte', z, 'La rivière', { journal: true, invite: 'Le son de ma rue, ce soir.' }, 'Ce soir la rivière parlait plus fort que moi.\nJ’ai fredonné en rentrant.', 1 * day),
    e('j2', 'texte', f, 'Le clavier', { journal: true, invite: 'Le son de ma rue, ce soir.' }, 'Le clavier a sonné comme une cathédrale vide. J’ai gardé la pédale enfoncée longtemps.', 0.5 * day),
    e('t1', 'trace', z, 'Voix + piano · 14 min', { outil: 'accord', minutes: 14, mode: 'libre', chords: [{ label: 'Do', j: 0.84 }, { label: 'Fa', j: 0.42 }], magiques: [64, 69] }, '', 0.8 * day),
    e('b1', 'bravo', z, `Bravo ${f}!`, { to: f }, 'Ta nappe au début du refrain : frissons.', 3 * day),
    e('e1', 'note', f, 'Que l’app joue mon clavier en écho', { etincelle: true, pour: 'app' }, 'Que l’app joue mon clavier en écho', 2 * day),
    e('e2', 'note', z, 'Une chanson sur la marée basse', { etincelle: true, pour: 'musique' }, 'Une chanson sur la marée basse', 1 * day),
    { ...e('carte', 'carte', z, 'Carte', { chords: { Do: { s: 120, j: 100 }, Lam: { s: 80, j: 62 }, Fa: { s: 50, j: 21 }, Sol: { s: 40, j: 31 } }, notes: { 64: { s: 20, j: 17 }, 69: { s: 14, j: 11 } } }), id: 'carte-accords' },
  ];
}

let saved = null;
// Affiche les exemples dans l’espace, sans toucher aux vraies entrées.
export function montrerExemples() {
  if (espace.demoEntries) return;
  espace.demoEntries = exemples().filter((d) => !espace.entries.some((x) => x.id === d.id));
  saved = espace.meta?.plan ? null : true;
  if (saved) espace.demoMeta = { plan: { start: new Date(Date.now() - 38 * 864e5).toISOString().slice(0, 10) } };
  espace.entries = [...espace.entries, ...espace.demoEntries];
  if (espace.demoMeta) espace.meta = { ...espace.meta, ...espace.demoMeta };
  emitEntries();
}
// Retire les exemples et remet l’espace comme il était.
export function retirerExemples() {
  if (!espace.demoEntries) return;
  const ids = new Set(espace.demoEntries.map((d) => d.id));
  espace.entries = espace.entries.filter((x) => !ids.has(x.id));
  if (espace.demoMeta) { const m = { ...espace.meta }; delete m.plan; espace.meta = m; }
  espace.demoEntries = null; espace.demoMeta = null;
  emitEntries();
}
