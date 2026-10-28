// Calculs du plan de six mois à partir du mur : mois en cours, mesures automatiques, rythme de la semaine.
import { espace } from './espace.js';
import { parLesDeux } from './ecoute.js';

const DAY = 86400000;
const CREATIVE = new Set(['note', 'texte', 'audio', 'essai', 'paroles']);
const etape = (e) => (e.data && Number.isInteger(e.data.stage) ? e.data.stage : e.type === 'paroles' ? 2 : 0);
// « À creuser » ne compte qu'une fois réécoutée par les deux ; sinon, l'idée est encore brute pour le plan.
const stageOf = (e) => { const s = etape(e); return s === 1 && !parLesDeux(e) ? 0 : s; };
const songOf = (e) => (e.type === 'paroles' ? (e.title || 'Sans titre') : e.data?.song || '');

// Le jour où notre plan de six mois a commencé.
export const planStart = () => (espace.meta?.plan?.start ? new Date(`${espace.meta.plan.start}T12:00`).getTime() : null);

// Le mois du plan où on est (de 1 à 6), ou 0 s’il n’y a pas de plan.
export function currentMonth() {
  const s = planStart();
  if (!s) return 0;
  return Math.max(1, Math.min(6, Math.floor((Date.now() - s) / (30.44 * DAY)) + 1));
}

// Un « morceau » avance au rythme de sa meilleure carte ; une carte sans morceau compte seule.
export function planContext() {
  const cards = espace.entries.filter((e) => CREATIVE.has(e.type));
  const best = new Map();
  let loose = [];
  cards.forEach((e) => {
    const s = songOf(e);
    if (s) best.set(s, Math.max(best.get(s) ?? 0, stageOf(e)));
    else loose.push(stageOf(e));
  });
  const levels = [...best.values(), ...loose];
  const paroles = espace.entries.filter((e) => e.type === 'paroles' && (e.data?.sections || []).filter((x) => x.text.trim()).length >= 2
    && !(e.data.sections || []).some((x) => /_{2,}|\[\?/.test(x.text))).length;
  return {
    idees: cards.filter((e) => e.type !== 'paroles').length,
    stage: (n) => levels.filter((l) => l >= n).length,
    paroles,
    demos: cards.filter((e) => e.type === 'audio' && stageOf(e) >= 4).length,
  };
}

// Sessions terminées cette semaine (lundi → dimanche) et écoutes des 14 derniers jours.
export function weekRhythm() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const sessions = espace.entries.filter((e) => e.type === 'session' && e.data?.done);
  const week = sessions.filter((e) => e.data.doneAt >= monday);
  const solo = {};
  week.filter((e) => e.data.format === 'solo').forEach((e) => { solo[e.author] = (solo[e.author] || 0) + 1; });
  return {
    duo: week.filter((e) => e.data.format?.startsWith('duo')).length,
    solo,
    ecoute: sessions.filter((e) => e.data.format === 'ecoute' && e.data.doneAt >= Date.now() - 14 * DAY).length,
    total: sessions.length,
  };
}

// ---------- Le plan s'ajuste ----------
// Les six mois gardent leur cap ; le chemin s'adapte à ce que vous faites vraiment.
// Chaque ajustement dit le fait qui le déclenche, et mène à une action prête à lancer.
export function planAjuste(PLAN) {
  const m = currentMonth();
  if (!m) return [];
  const now = Date.now();
  const e = espace.entries.filter((x) => !x.demo && !x.data?.demo);
  const ctx = planContext();
  const goal = PLAN[m - 1];
  const got = goal.mesure(ctx);
  const s = planStart();
  const finMois = s + m * 30.44 * DAY;
  const joursRestants = Math.round((finMois - now) / DAY);
  const recent = (x, j) => now - x.createdAt < j * DAY;
  const out = [];
  // 1. Le rythme du plan lui-même : en avance, on avance ; en retard, on prend le temps.
  if (m < 6 && got >= goal.cible && joursRestants > 5) out.push({ id: 'avance', fait: `Sortie du mois ${m} atteinte (${got} / ${goal.cible}), ${joursRestants} jours avant la fin.`, titre: `Passer au mois ${m + 1} maintenant`, action: 'Avancer le plan', plan: 'avance' });
  if (joursRestants <= 5 && joursRestants >= 0 && got < goal.cible / 2) out.push({ id: 'prolonge', fait: `${got} / ${goal.cible} à ${joursRestants} jours de la fin du mois ${m}.`, titre: 'Prendre deux semaines de plus', action: 'Prolonger le mois', plan: 'prolonge' });
  // 2. La matière : ce qui déborde, ce qui manque.
  const brutes = e.filter((x) => CREATIVE.has(x.type) && stageOf(x) === 0 && !x.data?.journal).length;
  if (brutes >= 8 && ctx.stage(2) < 2) out.push({ id: 'trier', fait: `${brutes} idées brutes, ${ctx.stage(2)} en chantier.`, titre: 'Trier avant de créer encore', action: 'Une écoute commune', href: '#/session?format=ecoute', src: 'Biasutti 2017' });
  const pages = e.filter((x) => x.data?.journal && recent(x, 14)).length;
  const sons = e.filter((x) => x.audio && recent(x, 14)).length;
  if (pages >= 3 && sons <= 1) out.push({ id: 'mots', fait: `${pages} pages écrites en deux semaines, ${sons} son.`, titre: 'Vos mots attendent leur musique', action: 'Une séance « texte d’un couplet »', href: `#/session?cible=${encodeURIComponent('Le texte d’un couplet')}&grille=vamp`, src: 'Pattison 2009' });
  if (sons >= 4 && pages === 0) out.push({ id: 'sons', fait: `${sons} sons en deux semaines, aucune page écrite.`, titre: 'Mettre des mots sur vos sons', action: 'Écrire sur le beat', href: '#/ecrire', src: 'Elbow 1973' });
  const carte = e.find((x) => x.type === 'carte');
  const ch = Object.values(carte?.data?.chords || {});
  const s1 = ch.reduce((a, c) => a + c.s, 0); const j1 = ch.reduce((a, c) => a + c.j, 0);
  if (s1 > 120 && j1 / s1 < 0.6) out.push({ id: 'voix', fait: `${Math.round((j1 / s1) * 100)} % du temps chanté dans l’accord.`, titre: 'La justesse d’abord, cette semaine', action: 'Voix + piano', href: '#/accord', src: 'Welch, Howard et Rush 1989' });
  const dorment = e.filter((x) => CREATIVE.has(x.type) && stageOf(x) < 3 && now - Math.max(x.updatedAt || 0, ...(x.data?.moves || []).map((mv) => mv.at || 0)) > 21 * DAY).length;
  if (dorment >= 3) out.push({ id: 'dorment', fait: `${dorment} idées pas touchées depuis trois semaines.`, titre: 'Réveiller les idées qui dorment', action: 'Les rencontres du mur', href: '#/carnet' });
  // 3. L'équilibre entre seul et ensemble.
  const r = weekRhythm();
  // Une pratique solo : une séance solo, ou un moment d'au moins 3 minutes hors séance (un coup d'œil d'une minute ne
  // compte pas, et un exercice fait pendant une séance solo est déjà dans la séance).
  const seancesSolo = e.filter((x) => x.type === 'session' && x.data?.done && x.data.format === 'solo' && recent(x, 7));
  const dansSeance = (t) => seancesSolo.some((x) => x.author === t.author && Math.abs((t.createdAt || 0) - (x.data.doneAt || x.createdAt)) < 2 * 3600e3);
  const pratiques = [...seancesSolo, ...e.filter((x) => x.type === 'trace' && recent(x, 7) && (x.data?.minutes || 0) >= 3 && !dansSeance(x))];
  const solos = pratiques.length; const parQui = [...new Set(pratiques.map((x) => x.author))];
  if (solos >= 3 && r.duo === 0) out.push({ id: 'commun', fait: `${solos} pratiques en solo cette semaine (${parQui.join(' et ')}), aucune séance à deux.`, titre: 'Mettre en commun ce que chacun a trouvé', action: 'Une séance duo', href: `#/session?cible=${encodeURIComponent('Un groove')}`, src: 'Cepeda et al. 2006' });
  // 4. Ce que vous vous êtes dit : la prochaine cible devient la prochaine séance.
  const last = e.filter((x) => x.type === 'session' && x.data?.debrief?.prochaine).sort((a, b) => b.data.doneAt - a.data.doneAt)[0];
  if (last) out.push({ id: 'cible', fait: `À la dernière séance, vous vous êtes dit : « ${last.data.debrief.prochaine} ».`, titre: 'Votre prochaine cible, prête à jouer', action: 'La lancer', href: `#/session?cible=${encodeURIComponent(last.data.debrief.prochaine)}` });
  return out.slice(0, 3);
}
