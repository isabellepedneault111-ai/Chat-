// « Concrètement » : chaque exercice de séance dit en une phrase ce qu'on fait pour vrai, avec un exemple.
// Quand l'oreille comprend plus vite que les mots, FLIP le joue (piano, batterie), en Do pour qu'on le reproduise.
import { audio, drums } from './audio.js';
import { joue, accord, prechargerSons } from './sampler.js';

const P = (seq, t0, n = 0.5, vel = 0.7) => { let t = t0; seq.forEach((m) => { if (Array.isArray(m)) accord('piano', m, { when: t, dur: n * 1.6, vel: vel * 0.8 }); else if (m) joue('piano', m, { when: t, dur: n * 0.95, vel }); t += n; }); return t; };
const C = { do: [48, 52, 55, 60], fa: [53, 57, 60, 65], sol: [55, 59, 62, 67], lam: [57, 60, 64, 69] };

export const CONCRET = {
  'p-renv': ['Joue Do, puis Fa en gardant le Do du haut : tes doigts bougent à peine. C’est ça, un renversement.', (t) => { accord('piano', [60, 64, 67], { when: t, dur: 1 }); accord('piano', [60, 65, 69], { when: t + 1.1, dur: 1 }); accord('piano', [59, 62, 67], { when: t + 2.2, dur: 1 }); }],
  'p-harmo': ['Elle chante surtout un Mi? Joue des accords qui contiennent Mi : Do, La mineur, Mi mineur.', null],
  'p-comping': ['Le même accord de Do joué quatre façons : en blocs, en croches, en 3-3-2, puis une seule fois par mesure.', (t) => { [[0, 0.5, 1, 1.5], [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75], [0, 0.375, 0.75, 1.25, 1.625], [0]].forEach((pat, k) => pat.forEach((x) => accord('piano', C.do, { when: t + k * 2.2 + x, dur: 0.22, vel: 0.5 }))); }],
  'p-couleurs': ['Au lieu de Do-Mi-Sol, joue Do-Sol-Ré : pas de Mi, donc ni joyeux ni triste. Ouvert, moderne.', (t) => { accord('piano', [48, 52, 55], { when: t, dur: 1.2 }); accord('piano', [48, 55, 62], { when: t + 1.4, dur: 1.6 }); }],
  'p-basse': ['La main gauche descend Do, Si, La, Sol pendant que la droite garde le même accord.', (t) => { [36, 35, 33, 31].forEach((m, i) => { joue('piano', m, { when: t + i, dur: 0.95 }); accord('piano', [64, 67, 72], { when: t + i, dur: 0.9, vel: 0.45 }); }); }],
  'p-reharmo': ['La même note Mi, sous quatre accords différents : écoute l’émotion changer.', (t) => { [C.do, C.lam, [52, 55, 59, 64], [53, 57, 60, 64]].forEach((a, i) => { accord('piano', a, { when: t + i * 1.2, dur: 1.1, vel: 0.5 }); joue('piano', 76, { when: t + i * 1.2, dur: 1.1, vel: 0.7 }); }); }],
  'e-penta': ['Seulement Do, Ré, Mi, Sol, La : peu importe l’ordre, ça sonne toujours bien.', (t) => P([60, 62, 64, 67, 69, 67, 64, 62, 60, 69, 67, 64], t, 0.3)],
  'e-echo': ['L’un frappe un petit rythme d’une mesure, l’autre le refait pareil. Écoute : appel, puis écho.', (t) => { [0, 0.5, 0.75, 1.5].forEach((x) => drums.clap(t + x, 0.7)); [0, 0.5, 0.75, 1.5].forEach((x) => drums.kick(t + 2.2 + x, 0.8)); }],
  'e-gamme': ['Do Ré Mi Fa Sol La Si Do, ensemble, chaque note pile sur le clic du métronome.', (t) => { for (let i = 0; i < 8; i++) drums.hat(t + i * 0.5, 0.4); P([60, 62, 64, 65, 67, 69, 71, 72], t, 0.5); }],
  'e-regard': ['Jouez la même boucle en vous regardant, puis dos à dos : qui suit qui, sans les yeux?', null],
  'e-corps': ['Debout, balance-toi sur le tempo, trois respirations lentes ensemble, épaules relâchées.', null],
  'i-appel': ['Zaza chante une petite phrase de deux mesures, Frog répond au piano. Comme une conversation.', (t) => { P([64, 67, 69, 67, 0, 0, 0, 0], t, 0.25); P([72, 69, 67, 64, 0, 0, 0, 0], t + 2.1, 0.25, 0.55); }],
  'i-nonrep': ['Chaque fois, change UNE chose : plus aigu, plus lent, plus doux… jamais deux fois pareil.', null],
  'i-eco': ['Trois notes seulement, mais variées : rythme, ordre, durée. Moins de notes, plus d’idées.', (t) => P([60, 64, 67, 0, 67, 64, 60, 60, 0, 64, 0, 67], t, 0.25)],
  'i-theme': ['Partez d’un mot, d’une photo ou d’une chanson connue, et improvisez autour.', null],
  'i-image': ['« Une rue mouillée à 3 h du matin » : jouez-la. Les sons suivent l’image, pas la technique.', null],
  'i-degres': ['Sur Do–Fa–Sol–Do, la voix ne prend que Do, Ré, Mi, Sol : impossible de se perdre.', (t) => { [C.do, C.fa, C.sol, C.do].forEach((a, i) => accord('piano', a, { when: t + i * 1.4, dur: 1.3, vel: 0.4 })); P([60, 62, 64, 67, 64, 62, 60, 62], t, 0.7, 0.75); }],
  'i-libre': ['Aucune règle : on joue, on écoute, on suit ce qui vient. Juste enregistrer.', null],
  'i-preentendre': ['Avant de jouer, chante ou entends la phrase dans ta tête, puis joue-la.', null],
  'a-fragment': ['Une petite idée de 4 notes, puis trois versions : plus aiguë, à l’envers, plus rythmée.', (t) => { let u = P([60, 64, 62, 67], t, 0.3); u = P([67, 71, 69, 74], u + 0.3, 0.3); u = P([67, 62, 64, 60], u + 0.3, 0.3); P([60, 60, 64, 62, 67, 67], u + 0.3, 0.2); }],
  'a-syncope': ['Le clavier joue juste avant ou après les temps : « ta-TA-ta ». Ça balance.', (t) => { for (let i = 0; i < 8; i++) drums.hat(t + i * 0.5, 0.3); [0, 0.75, 1.5, 2.5, 3.25].forEach((x) => accord('piano', C.do, { when: t + x, dur: 0.3, vel: 0.5 })); }],
  'a-abab': ['Deux parties qui alternent : A (le couplet) puis B (le refrain), deux fois.', null],
  'a-pont': ['Couplet, refrain, couplet, refrain, puis une partie différente (le pont) avant le dernier refrain.', null],
  'a-zones': ['Certaines mesures sont écrites (on les joue pareil), d’autres sont libres (on improvise).', null],
  'a-chunks': ['De petits morceaux de 2 mesures, qu’on joue dans un ordre différent à chaque fois.', null],
  'c-entree': ['Un signe convenu pour partir ensemble : un regard, un « 1, 2, 3, 4 », une respiration.', (t) => { [0, 0.5, 1, 1.5].forEach((x) => drums.hat(t + x, 0.7)); accord('piano', C.do, { when: t + 2, dur: 1.2 }); }],
  'c-reperes': ['Mettez-vous d’accord sur des signes : la main levée = on finit, un hochement = refrain.', null],
  'f-passage': ['On joue le passage une fois, du début à la fin, comme devant du monde : pas d’arrêt, même si ça accroche.', null],
  'f-verbal': ['Dites à voix haute : ce qu’on voulait, ce qu’on a entendu, ce qu’on change la prochaine fois.', null],
  'f-reecoute': ['Réécoutez la prise une fois sans parler, puis chacun nomme UNE chose à garder.', null],
};

export const concretHTML = (id) => { const c = CONCRET[id]; return c ? `<p class="concret"><b>Concrètement :</b> ${c[0]}${c[1] ? ` <button class="btn small" data-demo="${id}">▶ Entendre un exemple</button>` : ''}</p>` : ''; };
export function jouerDemo(id) {
  const c = CONCRET[id]; if (!c?.[1]) return;
  prechargerSons(['piano']).then(() => { const a = audio(); a.resume(); c[1](a.currentTime + 0.1); });
}
