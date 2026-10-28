// Nos prochains pas : ce qui attend chacun (la pastille d'Accueil compte les miens). Calculés par l'app, ou ajoutés à la main
// et cochés (Notre calendrier sacré).
// Chacune dit pourquoi elle est là et mène droit au bon endroit ; elle disparaît d'elle-même quand c'est fait.
import { espace, profileOf } from './espace.js';
import { MEMBERS } from './duo.js';
import { lune, luneCourante } from './lune.js';
import { attendMoi, gestes } from './elan.js';
import { photosDuStudio } from './piece.js';
import { deLautre, fait, decrire } from './suivi.js';
import { asksOf } from './views/relais.js';
import { lundi, semaines, objectifSemaine } from './objectifs.js';

// Un pas écrit à la main mène là où ses mots le disent (« recréer mon studio » → mon studio) ; sinon, au calendrier.
const LIEUX_PAS = [[/studio|mat[ée]riel|branch/i, '#/materiel'], [/labo|disque/i, '#/labo'], [/cath[ée]drale/i, '#/cathedrale'], [/parole|texte|[ée]cri/i, '#/ecrire'], [/chanson|accord|beat/i, '#/studio?tab=chanson'], [/voix|chant/i, '#/accord'], [/plage|calendrier/i, '#/calendrier?proposer'], [/session|s[ée]ance/i, '#/session'], [/mur|id[ée]e/i, '#/carnet']];
export const lienDuPas = (t = '') => (LIEUX_PAS.find(([re]) => re.test(t)) || [, '#/calendrier'])[1];

// Notre rythme de la semaine. Chacun en propose sa moitié (même pas encore approuvée) : son pas « proposer » est alors fait.
export const RYTHME = { presence: 2, distance: 1, pro: 1, jeu: 1 };
const autreDe = (me) => (espace.meta?.members || MEMBERS).find((m) => m !== me);
const inspirationsDites = (m) => { const l = (profileOf(m)?.artistes || []).filter((a) => a?.nom); return l.length > 0 && l.every((a) => a.aime?.length || a.pourquoi); };

// Mes prochains pas : ce que l’app voit à faire pour moi (plages à approuver, inspirations à expliquer…) et ceux qu’on s’est donnés.
export function mesTaches(me = espace.me) {
  if (!espace.connected || !me) return [];
  const o = autreDe(me); const t = []; const moi = me === espace.me;
  if ((profileOf(me)?.artistes || []).some((a) => a?.nom) && !inspirationsDites(me)) {
    t.push({ id: 'inspi', titre: 'Dire pourquoi tes inspirations t’inspirent', pourquoi: `Pour chaque artiste ou morceau : sa rythmique, sa voix, son texte… et le moment précis. ${inspirationsDites(o) ? `${o} l’a fait ✓` : `${o} a le même pas à faire.`}`, lien: '#/depart?etape=3' });
  }
  // Une plage proposée par l'autre attend mon accord.
  espace.entries.filter((e) => e.type === 'plage' && e.data?.statut === 'propose' && e.data.par !== me && e.data.debut > Date.now() - 864e5).forEach((e) => t.push({ id: `plage-${e.id}`, titre: `Répondre à la plage proposée par ${e.data.par}`, pourquoi: `${new Date(e.data.debut).toLocaleString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${e.data.note ? ` : ${e.data.note}` : ''}. Approuve-la, ou propose autre chose.`, lien: '#/calendrier' }));
  // Les pas qu'on s'est donnés à la main, pas encore cochés.
  espace.entries.filter((e) => e.type === 'pas' && !e.data?.fait && (e.data?.pour === me || e.data?.pour === 'deux')).forEach((e) => t.push({ id: `pas-${e.id}`, titre: e.title, pourquoi: e.data.pour === 'deux' ? 'Un pas pour nous deux.' : `Ajouté par ${e.author === me ? 'toi' : e.author}.`, lien: lienDuPas(e.title), manuel: e.id }));
  if (moi) attendMoi().slice(0, 3).forEach((e) => t.push({ id: `rep-${e.id}`, titre: `Répondre à « ${e.title || 'sans titre'} »`, pourquoi: `${e.author} te l’a lancé au relais. Quand vous vous répondez, vos fils se rapprochent.`, lien: `#/relais/${e.id}` }));
  // Le studio en photos (pour Frog, qui fait le son) : chaque appareil, sa marque et son modèle, puis toute la pièce.
  if (me === 'Frog') {
    const ph = photosDuStudio(me);
    if (!ph || !ph.total) t.push({ id: 'studio', titre: 'Recréer ton studio dans l’app', pourquoi: 'Branche ton matériel (l’app le reconnaît), ajoute le reste à la main, place tout comme chez toi.', lien: '#/materiel' });
    else if (ph.faits < ph.total || !ph.piece) t.push({ id: 'photos', titre: 'Photographier ton studio', pourquoi: `Chaque instrument : une photo, sa marque, son modèle (${ph.faits} sur ${ph.total}${ph.reste.length ? ` ; il reste ${ph.reste.slice(0, 3).join(', ')}${ph.reste.length > 3 ? '…' : ''}` : ''}). Puis une photo de toute la pièce${ph.piece ? ' ✓' : ''}. Ton studio dans l’app te ressemblera, et ${o} le verra.`, lien: '#/materiel' });
  }
  if (moi) {
    // Ce que l'autre m'a demandé (chante dessus, harmonise…) et que je n'ai pas encore fait.
    deLautre().filter((e) => asksOf(e).length && !fait(me, e.id)).slice(0, 4).forEach((e) => t.push({ id: `ask-${e.id}`, titre: `${o} te demande : ${asksOf(e).map((a) => a[1].toLowerCase()).join(', ')}`, pourquoi: `Sur « ${e.title || 'sans titre'} ». Coche « J’ai fait ça » dans Nos nouvelles quand c’est fait : ${o} le verra.`, lien: decrire(e)[1] }));
    // Notre rythme de la semaine : deux séances en présence, une à distance. S'il n'est pas couvert, proposer une plage.
    const l0 = lundi(); const sem = espace.entries.filter((e) => e.type === 'plage' && e.data?.statut !== 'refuse' && e.data?.debut >= l0 && e.data.debut < l0 + 7 * 864e5);
    const total = Object.values(RYTHME).reduce((a, b) => a + b, 0); const maPart = Math.ceil(total / 2);
    const miennes = sem.filter((e) => e.data.par === me && e.data.sorte !== 'jalon').length;
    const couvert = Object.entries(RYTHME).every(([k, v]) => sem.filter((e) => e.data.sorte === k).length >= v);
    if (miennes < maPart && !couvert && Date.now() < l0 + 6 * 864e5) t.push({ id: 'plage-semaine', titre: 'Proposer une plage cette semaine', pourquoi: `Ta moitié de notre rythme : ${maPart} plages (tu en as proposé ${miennes}). Le reste, c’est ${o}.`, lien: '#/calendrier?proposer' });
    // Le ciel a besoin de sons : tant qu'il y en a moins de quatre au mur, chacun en lance deux bruts par semaine
    // (Frog au clavier, Zaza à la voix). Pas fini, pas mixé : dix secondes suffisent pour qu'une rencontre devienne possible.
    const sonsMur = espace.entries.filter((e) => e.audio && !e.audio.type?.startsWith('video') && !e.data?.corbeille && !e.data?.rencontre);
    const mesSons = sonsMur.filter((e) => e.author === me && e.createdAt >= Date.now() - 7 * 864e5).length;
    if (sonsMur.length < 4 && mesSons < 2) t.push({ id: 'bouts-bruts', titre: me === 'Frog' ? 'Lancer deux ou trois bouts de clavier bruts' : 'Lancer deux ou trois bouts de voix bruts', pourquoi: `${sonsMur.length === 0 ? 'Le mur n’a aucun son' : sonsMur.length === 1 ? 'Le mur n’a qu’un seul son' : `Le mur n’a que ${sonsMur.length} sons`} : presque rien à faire rencontrer avec vos mots. Dix secondes, pas fini, pas mixé (${mesSons} sur 2 cette semaine).`, lien: '#/relais' });
    // L'objectif de la semaine, à fixer à deux ; la semaine passée, à évaluer chacun.
    if (!objectifSemaine()) t.push({ id: 'objectif', titre: 'Fixer l’objectif de la semaine', pourquoi: `Un objectif qu’on pourra vérifier dimanche, à deux${o ? ` avec ${o}` : ''}.`, lien: '#/' });
    const avant = semaines().find((x) => x.data.debut === l0 - 7 * 864e5);
    if (avant && !avant.data.eval?.[me]?.v) t.push({ id: 'eval-semaine', titre: 'Évaluer la semaine passée', pourquoi: `Vous visiez « ${avant.data.texte} » : atteint, en partie, pas encore? Deux mots pour toi, deux pour ${o}.`, lien: '#/' });
  }
  if (moi && o) {
    // La relance douce : le fil de l'autre pâlit depuis cinq jours. Une invitation simple, pas un rappel à l'ordre ;
    // et pas deux fois de suite : si je viens de lui lancer quelque chose (moins de deux jours), on attend sa réponse.
    const go = gestes(o); const dernier = go[go.length - 1] || 0; const calme = Math.floor((Date.now() - dernier) / 864e5);
    const jeViensDeLancer = espace.entries.some((e) => e.author === me && ['audio', 'note', 'texte', 'image', 'lien', 'paroles'].includes(e.type) && !e.data?.corbeille && Date.now() - e.createdAt < 2 * 864e5);
    // La relance jusqu'au téléphone : à activer une fois, ou à décliner.
    if (!profileOf(me)?.relance && !profileOf(me)?.relanceNon) t.push({ id: 'relance-tel', titre: 'Recevoir la relance douce sur ton téléphone', pourquoi: 'Une notification quand ton fil est calme depuis cinq jours, jamais plus d’une fois par cinq jours. Aucun numéro de téléphone. Ou « Pas pour moi ».', lien: '#/nouvelles' });
    if (dernier && calme >= 5 && !jeViensDeLancer) t.push({ id: 'relance', titre: `Lancer quelque chose de simple à ${o}`, pourquoi: `Son fil est calme depuis ${calme} jours. Un son de 10 secondes, un mot, une photo : une invitation, sans attente.`, lien: '#/relais' });
  }
  const l = lune(); const lm = luneCourante(espace.meta);
  if (!lm.intentions?.[me] && l.age < 18) t.push({ id: 'semer', titre: 'Semer ton intention du cycle', pourquoi: 'Une phrase pour cette lune. On la relira la dernière semaine du cycle.', lien: '#/' });
  if (l.age > 18) {
    if (lm.intentions?.[me] && !lm.relue?.[me]) t.push({ id: 'relire', titre: 'Relire ton intention du cycle', pourquoi: 'C’est la dernière semaine du cycle : tenue, transformée ou lâchée ?', lien: '#/passage' });
    if (!espace.meta?.luneProchaine?.intentions?.[me]) t.push({ id: 'passage', titre: 'Faire le passage de la nouvelle lune', pourquoi: `Fermer ce cycle à deux et semer le suivant${espace.meta?.luneProchaine?.intentions?.[o] ? ` : ${o} a déjà semé le sien` : ''}.`, lien: '#/passage' });
  }
  return t;
}
