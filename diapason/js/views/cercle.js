// Le cercle : un jam de percussion corporelle pour une classe, sans instrument et sans rien savoir de la musique.
// L'app tient le tempo, joue le modèle, compte, et change de partie toute seule ; on la projette, et les élèves
// voient en GROS quoi faire (le geste, le mot, le moment où c'est à eux). Six activités autoportantes :
// le cœur (la pulsation), l'écho, le moteur des mots (4 groupes qui s'empilent), le chef (l'app dirige),
// l'orage (la pluie qui monte et redescend), le chœur, le trou (un solo à tour de rôle).
import { audio, out, drums, click, bass, pluck } from '../audio.js';
import { joue, prechargerSons } from '../sampler.js';
import { store } from '../ui.js';
import { esc } from './carnet.js';
import { geste, gesteImage, garderPhoto, retirerPhoto, photoDe } from '../gestes.js';
import { demarrerPrise, enWav, fermerMicroPrise } from '../prise.js';

// Les six sons du corps : un geste, un mot à dire, une couleur, et le son que l'app joue comme modèle.
const SONS = {
  boum: { mot: 'BOUM', geste: 'la main à plat sur le bureau', c: '#e5452c' },
  tic: { mot: 'TIC', geste: 'le bout des doigts sur le bureau', c: '#f1cf4e' },
  tac: { mot: 'TAC', geste: 'taper des mains', c: '#3d6bff' },
  tsk: { mot: 'TSK', geste: 'claquer des doigts (ou « tsk » avec la bouche)', c: '#b25cff' },
  chhh: { mot: 'CHHH', geste: 'frotter les mains', c: '#3fbf7f' },
  pieds: { mot: 'BOUM', geste: 'les pieds au sol', c: '#ff8a3d' },
};
// Le moteur des mots : 4 groupes, 4 rythmes qui s'emboîtent ; les mots se changent, le rythme reste.
const GROUPES = [
  { id: 'rouge', nom: 'ROUGE', c: '#e5452c', son: 'boum', pos: [0, 2, 4, 6], mot: 'PIZ ZA PIZ ZA' },
  { id: 'bleu', nom: 'BLEU', c: '#3d6bff', son: 'tac', pos: [2, 6], mot: 'HOP HOP' },
  { id: 'jaune', nom: 'JAUNE', c: '#f1cf4e', son: 'tic', pos: [0, 1, 2, 3, 4, 5, 6, 7], mot: 'MA CA RO NI MA CA RO NI' },
  { id: 'violet', nom: 'VIOLET', c: '#b25cff', son: 'tsk', pos: [3, 4], mot: 'POU TINE' },
];
// Les beats : les 4 groupes (mêmes couleurs) changent de son, de rythme et de mots selon le beat choisi.
const GROOVES = {
  pizza: { nom: 'Pizza', g: [{ son: 'boum', pos: [0, 2, 4, 6], mot: 'PIZ ZA PIZ ZA' }, { son: 'tac', pos: [2, 6], mot: 'HOP HOP' }, { son: 'tic', pos: [0, 1, 2, 3, 4, 5, 6, 7], mot: 'MA CA RO NI MA CA RO NI' }, { son: 'tsk', pos: [3, 4], mot: 'POU TINE' }] },
  hiphop: { nom: 'Hip-hop', g: [{ son: 'boum', pos: [0, 3, 5], mot: 'BOUM BA DA' }, { son: 'tac', pos: [2, 6], mot: 'CLAP CLAP' }, { son: 'tic', pos: [0, 1, 2, 3, 4, 5, 6, 7], mot: 'TI KI TI KI TI KI TI KI' }, { son: 'tsk', pos: [7], mot: 'YO' }] },
  carnaval: { nom: 'Carnaval', g: [{ son: 'pieds', pos: [0, 4], mot: 'SAM BA' }, { son: 'tac', pos: [1, 3, 5, 7], mot: 'PA PA PA PA' }, { son: 'chhh', pos: [0, 2, 4, 6], mot: 'CHA CHA CHA CHA' }, { son: 'boum', pos: [3, 6], mot: 'O LÉ' }] },
  rock: { nom: 'Rock patate', g: [{ son: 'boum', pos: [0, 4, 5], mot: 'PA TA TE' }, { son: 'tac', pos: [2, 6], mot: 'FRITE FRITE' }, { son: 'tic', pos: [0, 2, 4, 6], mot: 'KET CHUP KET CHUP' }, { son: 'pieds', pos: [7], mot: 'MIAM' }] },
  reggae: { nom: 'Reggae', g: [{ son: 'boum', pos: [4], mot: 'PLOUF' }, { son: 'tsk', pos: [1, 3, 5, 7], mot: 'TCHI TCHI TCHI TCHI' }, { son: 'tic', pos: [0, 2, 4, 6], mot: 'SO LEIL SO LEIL' }, { son: 'tac', pos: [4, 6], mot: 'HO HÉ' }] },
};
// Les pads du chef, en plus des 4 groupes : les voix tenues, la pluie, le tonnerre.
const PADS = [['aaa', 'AAA', '#ff8a3d'], ['ooo', 'OOO', '#3fbf7f'], ['mmm', 'MMM', '#b25cff'], ['pluie', 'La pluie', '#5aa9e6'], ['tonnerre', 'Le tonnerre', '#f1cf4e']];
// Le cœur, pour pratiquer : un son, un rythme ; ou la partie d'un groupe d'un beat, toute seule.
const RYTHMES_C = { temps: ['Chaque temps', [0, 2, 4, 6]], deux: ['Sur 2 et 4', [2, 6]], croches: ['Deux par temps', [0, 1, 2, 3, 4, 5, 6, 7]], entre: ['Entre les temps', [1, 3, 5, 7]], galop: ['Le galop', [0, 3, 6]] };
// La table de mixage de La chanson : chaque couche, allumée ou non, et son volume (0 à 1).
const COUCHES = [['batterie', 'Batterie de l’app', '#a39b87'], ['basse', 'Basse', '#c08a4a'], ['accords', 'Accords', '#5aa9e6'], ['boum', 'BOUM', '#e5452c'], ['tac', 'TAC', '#3d6bff'], ['tic', 'TIC', '#f1cf4e'], ['aaa', 'AAA', '#ff8a3d'], ['ooo', 'OOO', '#3fbf7f'], ['mmm', 'MMM', '#b25cff']];
const MIX_DEF = Object.fromEntries(COUCHES.map(([k]) => [k, { on: !['aaa', 'ooo', 'mmm'].includes(k), vol: 1 }]));
const PRESETS = {
  tout: ['Tout', (k) => ({ on: k !== 'mmm', vol: 1 })],
  chant: ['Juste le chant', (k) => ({ on: ['aaa', 'ooo', 'mmm'].includes(k), vol: 1 })],
  beat: ['Juste le beat', (k) => ({ on: !['aaa', 'ooo', 'mmm'].includes(k), vol: 1 })],
  classe: ['La classe seule (l’app se tait)', (k, m) => ({ on: m[k].on, vol: 0 })],
};
// Les activités, dans l'ordre d'une première séance : d'abord la pulsation commune, puis l'écho (on apprend sans
// explication : on imite), les mots qui deviennent des rythmes, les couches qu'on empile, le chef qui sculpte, et
// enfin la chanson. Les voix ont leur propre cercle. Les autres sont des variantes.
const ACTIVITES = [
  { id: 'coeur', n: 1, nom: 'Le cœur', but: 'Tout le monde sur le même battement. Toujours commencer par là.' },
  { id: 'echo', n: 2, nom: 'L’écho', but: 'L’app joue un rythme ; la classe le répète. On apprend en imitant.' },
  { id: 'mots', n: 3, nom: 'Le moteur des mots', but: 'Des mots deviennent des rythmes ; 4 groupes s’empilent.' },
  { id: 'chef', n: 4, nom: 'Le chef', but: 'Un élève dirige : qui joue, doux, fort, on fige.' },
  { id: 'jam', n: 5, nom: 'La chanson', but: 'On assemble : intro, couplet, refrain, liberté, fin.' },
  { id: 'voix', n: 6, nom: 'Le cercle des voix', but: 'Juste des voix : 3 boucles chantées avec des mots, puis un solo libre.' },
  { id: 'choeur', nom: 'Le chœur', but: 'AAA, OOO : des notes tenues, justes, sur les percussions.' },
  { id: 'orage', nom: 'L’orage', but: 'La pluie monte… puis redescend.' },
  { id: 'trou', nom: 'Le trou', but: 'Un solo à tour de rôle, dans le silence.' },
];
// Le cercle des voix : la gamme pentatonique (do ré mi sol la) : toutes les notes vont ensemble, aucune n'est fausse.
const PENTA = [0, 2, 4, 7, 9];
const degre = (d) => { const o = Math.floor(d / 5); return 12 * o + PENTA[((d % 5) + 5) % 5]; };
// Trois boucles de deux mesures (16 croches) : t = début, l = durée (en croches), d = degré dans la gamme.
const PARTIES_V = [
  { id: 'aigus', nom: 'Les aigus', im: 'aaa', c: '#ff8a3d', timbre: 0, mots: 'Tout le mon-de chan-te, tout le mon-de!', notes: [{ t: 0, l: 1, d: 4 }, { t: 1, l: 1, d: 4 }, { t: 2, l: 2, d: 3 }, { t: 4, l: 2, d: 2 }, { t: 6, l: 2, d: 3 }, { t: 8, l: 1, d: 4 }, { t: 9, l: 1, d: 4 }, { t: 10, l: 2, d: 5 }, { t: 12, l: 2, d: 4 }, { t: 14, l: 2, d: 3 }] },
  { id: 'milieu', nom: 'Le milieu', im: 'ooo', c: '#3fbf7f', timbre: 1, mots: 'On est là, on est là', notes: [{ t: 2, l: 2, d: 2 }, { t: 4, l: 2, d: 2 }, { t: 6, l: 2, d: 1 }, { t: 10, l: 2, d: 1 }, { t: 12, l: 2, d: 1 }, { t: 14, l: 2, d: 0 }] },
  { id: 'graves', nom: 'Les graves', im: 'mmm', c: '#b25cff', timbre: 2, mots: 'Doum, doum da doum, doum, doum da doum', notes: [{ t: 0, l: 3, d: 0 }, { t: 4, l: 2, d: -2 }, { t: 6, l: 1, d: -2 }, { t: 7, l: 1, d: -1 }, { t: 8, l: 3, d: -1 }, { t: 12, l: 2, d: -2 }, { t: 14, l: 1, d: -2 }, { t: 15, l: 1, d: -1 }] },
];
const ETAPES_V = [
  ['ecoute', '1. Écouter', 'L’app chante chaque boucle, une à la fois. On écoute, on suit les mots.'],
  ['echo', '2. En écho', 'L’app chante une boucle… puis c’est à vous : la même chose, tout de suite après.'],
  ['ensemble', '3. Ensemble', 'Les boucles entrent une à une et s’empilent. Chaque groupe garde la sienne.'],
  ['solo', '4. Solo libre', 'Tout le monde tient sa boucle ; un élève improvise par-dessus avec les 5 notes. Aucune n’est fausse.'],
];

// Le chœur : des voyelles tenues, deux mesures chacune, sur 4 accords (I – IV – V – I). Chaque groupe bouge le moins
// possible d'un accord à l'autre (une note qui reste, ou qui monte ou descend d'un cran) : facile à chanter juste.
const VOIX_C = [
  { id: 'aaa', voy: 'AAA', c: '#ff8a3d', notes: [0, 0, -1, 0] }, // la tonique, puis la sensible au V
  { id: 'ooo', voy: 'OOO', c: '#3fbf7f', notes: [4, 5, 2, 4] }, // la tierce, la fondamentale du IV, la quinte du V
  { id: 'mmm', voy: 'MMM', c: '#b25cff', notes: [7, 9, 7, 7] }, // la quinte, la tierce du IV, la fondamentale du V
];
const ACC_C = [[0, 4, 7], [5, 9, 0], [7, 11, 2], [0, 4, 7]]; const NOMS_C = ['I', 'IV', 'V', 'I'];
const TONS = [['Sol', 55], ['La', 57], ['Si♭', 58], ['Do', 60], ['Ré', 62], ['Mi', 64]];
const NOTE_FR = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
// La chanson : une forme de vraie chanson. L'app joue le groupe (batterie, basse, accords) et le beat change à chaque
// partie ; la classe joue par-dessus avec son corps. Au couplet : le beat inventé par la classe. Au refrain : un
// rythme commun, plus fort. À « Liberté » : chacun fait ce qu'il veut, mais le 1 se frappe tous ensemble.
const PLAN_JAM = [
  { id: 'intro', nom: 'Intro', mes: 4, dit: 'Écoutez le groove. On hoche la tête sur le 1.' },
  { id: 'couplet', nom: 'Couplet', mes: 8, dit: 'Le beat de la classe. Bien serré, tous ensemble.' },
  { id: 'refrain', nom: 'Refrain', mes: 8, dit: 'TOUT LE MONDE, plus fort!' },
  { id: 'libre', nom: 'Liberté', mes: 8, dit: 'Faites ce que vous voulez avec votre corps… mais le 1, on le frappe TOUS ensemble.' },
  { id: 'refrain', nom: 'Refrain', mes: 8, dit: 'Le refrain revient : TOUT LE MONDE!' },
  { id: 'fin', nom: 'Fin', mes: 2, dit: 'On finit ensemble : sur le dernier 1… HÉ!' },
];
const DEBUTS_JAM = PLAN_JAM.map((_, i) => PLAN_JAM.slice(0, i).reduce((a, x) => a + x.mes, 0));
const TOTAL_JAM = PLAN_JAM.reduce((a, x) => a + x.mes, 0);
const REFRAIN = ['boum', null, 'tac', 'boum', null, 'boum', 'tac', null];
// Le beat que l'app joue, partie par partie (k grosse caisse, s caisse claire, c claps, h charleston ; les croches 0 à 7).
const BEATS = {
  intro: { k: [0, 4], h: [0, 2, 4, 6] },
  couplet: { k: [0, 3, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] },
  refrain: { k: [0, 2, 4, 6], c: [2, 6], h: [1, 3, 5, 7], s: [6] },
  libre: { k: [0], h: [0, 2, 4, 6] },
  fin: { k: [0, 2, 4, 6], c: [2, 6], h: [1, 3, 5, 7] },
};
const AMBIANCES = {
  chill: { nom: 'Chill', acc: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], basse: [45, 41, 48, 43] }, // Lam Fa Do Sol
  soleil: { nom: 'Soleil', acc: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], basse: [48, 43, 45, 41] }, // Do Sol Lam Fa
  nuit: { nom: 'Nuit', acc: [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]], basse: [40, 36, 43, 38] }, // Mim Do Sol Ré
};
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const TEMPOS = [['lent', 'Lent', 72], ['moyen', 'Moyen', 90], ['vite', 'Vite', 108]];

export default {
  id: 'cercle',
  mount(el) {
    const c = audio();
    let act = store.get('cercleActivite', 'coeur'); let tempo = store.get('cercleTempo', 'lent');
    prechargerSons(['choeur', 'piano', 'rhodes']);
    const reglages = { vEtape: store.get('cercleVEtape', 'ecoute'), vParts: { aigus: true, milieu: true, graves: true, ...store.get('cercleVParts', {}) }, vModele: store.get('cercleVModele', 'fort'), vBourdon: store.get('cercleVBourdon', true), mixJ: Object.fromEntries(Object.entries(MIX_DEF).map(([k, v]) => [k, { ...v, ...(store.get('cercleMix', {})[k] || {}) }])), coeurSon: store.get('cercleCoeurSon', 'boum'), coeurRythme: store.get('cercleCoeurRythme', 'temps'), jamPart: null, jamVoix: null, jamModele: store.get('cercleJamModele', true), groove: store.get('cercleGroove', 'pizza'), enchainer: store.get('cercleEnchainer', false), chGr: { rouge: true, bleu: true, aaa: true, ooo: true, mmm: false, ...store.get('cercleChoeurGr', {}) }, grille: store.get('cercleGrille', { boum: [0, 3, 4], tac: [2, 6], tic: [] }), ambiance: store.get('cercleAmbiance', 'chill'), tonique: store.get('cercleTonique', 60), nVoix: store.get('cercleNVoix', 2), modele: store.get('cercleModele', true), mots: GROUPES.map((g) => store.get(`cercleMot-${g.id}`, g.mot)), noms: store.get('cercleNoms', ''), niveau: store.get('cercleNiveau', 'facile') };
    let moteur = null; let file = []; let raf = 0;
    let prise = null; let enreg = null; let ecoute = null; // la classe, enregistrée puis réécoutée
    const bpm = () => TEMPOS.find((x) => x[0] === tempo)[2];
    reglages.jamVoix = new Proxy({}, { get: (_, k) => !!reglages.mixJ[k]?.on }); // les voix allumées = celles de la table
    const vo = (k) => (reglages.mixJ[k]?.on ? reglages.mixJ[k].vol : 0); // le volume d'une couche (0 si éteinte)
    const garderMix = () => store.set('cercleMix', reglages.mixJ);
    // Les 4 groupes du beat choisi, et leurs mots (qu'on peut changer, beat par beat).
    const grp = () => (GROOVES[reglages.groove] || GROOVES.pizza).g.map((x, i) => ({ ...GROUPES[i], ...x }));
    const motDe = (gi) => { const g = grp()[gi]; const k = reglages.groove === 'pizza' ? `cercleMot-${g.id}` : `cercleMot-${reglages.groove}-${g.id}`; return store.get(k, g.mot); };
    const setMot = (gi, v) => { const g = grp()[gi]; store.set(reglages.groove === 'pizza' ? `cercleMot-${g.id}` : `cercleMot-${reglages.groove}-${g.id}`, v); };
    const lignes = (gi, g) => { const syl = motDe(gi).split(/[\s-]+/).filter(Boolean); return [...Array(8)].map((_, p) => { const n = g.pos.indexOf(p); return `<span class="${n >= 0 ? 'joue' : ''}" data-p="${p}">${n >= 0 ? esc(syl[n % Math.max(1, syl.length)] || '•') : ''}</span>`; }).join(''); };
    const boutonsBeat = () => `<div class="ce-niveaux ce-grooves"><span class="ce-l">Beat</span>${Object.entries(GROOVES).map(([k, x]) => `<button class="${reglages.groove === k ? 'on' : ''}" data-groove="${k}">${x.nom}</button>`).join('')}</div>`;
    const prochainBeat = () => { const L = Object.keys(GROOVES); return L[(L.indexOf(reglages.groove) + 1) % L.length]; };

    // ---------- Les sons ----------
    let bruitBuf = null;
    function chhh(t, v = 0.6, dur = 0.22) {
      if (!bruitBuf) { bruitBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = bruitBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = c.createBufferSource(); s.buffer = bruitBuf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 0.8;
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f).connect(g).connect(out()); s.start(t, Math.random() * 0.5, dur + 0.05);
    }
    function sonne(k, t, v = 1) {
      try {
        // Les sons d'origine, toujours : un son perso enregistré (long, avec son propre rythme dedans) brouillerait le groove.
        const kick = drums.kickOrigine || drums.kick; const hat = drums.hatOrigine || drums.hat; const clap = drums.clapOrigine || drums.clap;
        if (k === 'boum') kick(t, v); else if (k === 'tic') { hat(t, 1.1 * v); click(t, false); } else if (k === 'tac') clap(t, v);
        else if (k === 'tsk') click(t, true); else if (k === 'chhh') chhh(t, v); else if (k === 'pieds') { kick(t, v); kick(t + 0.02, 0.6 * v); }
      } catch { /* son absent */ }
    }

    // ---------- L'horloge : des croches, planifiées un peu à l'avance ; l'affichage suit au bon moment ----------
    const quand = (t, f) => file.push([t, f]);
    function boucle() {
      const now = c.currentTime; file = file.filter(([t, f]) => { if (t <= now) { try { f(); } catch { /* vue fermée */ } return false; } return true; });
      if (act === 'choeur') A.choeur.dessiner();
      if (act === 'jam' && reglages.jamPart === 'mix') A.jam.dessiner();
      if (act === 'voix') A.voix.dessiner();
      raf = requestAnimationFrame(boucle);
    }
    function planifier() { if (!moteur) return; const d = 60 / bpm() / 2; while (moteur.prochain < c.currentTime + 0.3) { moteur.fn(moteur.pas, moteur.prochain, d); moteur.prochain += d; moteur.pas++; } }
    function demarrer(fn) { arreter(); try { c.resume(); } catch { /* iOS */ } moteur = { prochain: c.currentTime + 0.3, pas: 0, fn, timer: setInterval(planifier, 25) }; planifier(); cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); majJouer(); }
    function arreter() { if (moteur) clearInterval(moteur.timer); moteur = null; file = []; Object.values(A?.chef?.sons || {}).forEach((x) => x?.stop(c.currentTime)); if (A?.chef) A.chef.sons = {}; majJouer(); }
    function majBas() {
      const r = el.querySelector('[data-c=rec]'); if (!r) return; r.classList.toggle('rec', !!prise); r.textContent = prise ? 'Fin de l’enregistrement' : 'Enregistrer la classe';
      el.querySelectorAll('.ce-ecoute').forEach((x) => x.remove());
      if (enreg) r.insertAdjacentHTML('afterend', `<button class="ce-ecoute" data-c="ecoute">${ecoute ? 'Arrêter l’écoute' : 'Réécouter'}</button><button class="ce-ecoute" data-c="dl" >Télécharger</button>`);
    }
    const majJouer = () => { const b = el.querySelector('[data-c=jouer]'); if (b) { b.textContent = moteur ? 'Arrêter' : 'Démarrer'; b.classList.toggle('stop', !!moteur); } };
    const scene = () => el.querySelector('.ce-scene');
    const carte = (k, grand = false) => `<div class="ce-son ${grand ? 'grand' : ''}" style="--c:${SONS[k].c}"><span class="ce-img">${geste(k, SONS[k].c)}</span><b>${SONS[k].mot}</b>${grand ? `<small>${esc(SONS[k].geste)}</small>` : ''}</div>`;

    // Une voix modèle synthétique, douce, différente pour chaque groupe (AAA claire à gauche, OOO ronde à droite,
    // MMM fredonnée au centre) : on entend qui chante quoi.
    function chante(midi, t, dur, i, vel = 0.13) {
      const f = hz(midi); const types = ['sawtooth', 'triangle', 'sine']; const coupe = [1300, 700, 450]; const pans = [-0.6, 0.6, 0];
      const o = c.createOscillator(); o.type = types[i] || 'sine'; o.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = types[i] || 'sine'; o2.frequency.value = f; o2.detune.value = 8;
      const lfo = c.createOscillator(); lfo.frequency.value = 5.2; const lg = c.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = coupe[i] || 600; fl.Q.value = i === 0 ? 3 : 0.8;
      const g = c.createGain(); const v = vel * (i === 0 ? 0.6 : 1);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.2); g.gain.setValueAtTime(v, t + Math.max(0.25, dur - 0.3)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); o2.connect(fl); fl.connect(g);
      if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = pans[i] || 0; g.connect(pn).connect(out()); } else g.connect(out());
      [o, o2, lfo].forEach((n) => { n.start(t); n.stop(t + dur + 0.05); });
      return { stop(t2) { try { g.gain.cancelScheduledValues(t2); g.gain.setTargetAtTime(0.0001, t2, 0.05); [o, o2, lfo].forEach((n) => n.stop(t2 + 0.3)); } catch { /* déjà fini */ } } };
    }
    function arrondi(x, a, b, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

    function voixJam(amb) {
      const r = {}; const ids = ['mmm', 'ooo', 'aaa'];
      ids.forEach((id, j) => { let n = amb.acc[0][j]; const L = [n]; for (let k = 1; k < 4; k++) { const cands = amb.acc[k].flatMap((x) => [x - 12, x, x + 12]); n = cands.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a)); L.push(n); } r[id] = L; });
      return r;
    }
    // Faire entendre la note d'un groupe, seule et claire (pour que chaque groupe trouve SA note).
    function ecouterNote(id) {
      const v = VOIX_C.find((x) => x.id === id); if (!v) return; const i = VOIX_C.indexOf(v); const T = reglages.tonique;
      let k = 0; if (moteur && act === 'choeur') { const pos = A.choeur.pos(); const mes = Math.floor(pos / 8); if (mes >= 2) k = Math.floor((mes - 2) / 2) % 4; }
      try { c.resume(); } catch { /* iOS */ }
      const t = c.currentTime + 0.05; chante(T + v.notes[k], t, 2.4, i, 0.22); joue('piano', T + v.notes[k], { when: t, dur: 2, vel: 0.5 });
    }

    // La position (en croches) maintenant, d'après l'horloge audio et les croches déjà planifiées.
    function posDe(marques) {
      if (!moteur || !marques.length) return -6;
      const now = c.currentTime; let m = marques[0]; marques.forEach((x) => { if (x[1] <= now) m = x; });
      return m[0] + (now - m[1]) / m[2];
    }
    function dessinerPistes(cv, L, evtsDe, pos, attente) {
          if (!cv) return; const dpr = window.devicePixelRatio || 1; const W = cv.clientWidth; const hP = W < 640 ? 72 : Math.min(130, Math.max(84, (innerHeight * 0.6) / Math.max(1, L.length)));
          const H = Math.max(1, L.length) * hP + 26; if (cv.height !== Math.round(H * dpr) || cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`; }
          const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
          const police = getComputedStyle(document.documentElement).getPropertyValue('--display') || 'sans-serif';
          const gauche = W < 640 ? 118 : Math.min(300, W * 0.24); const ligne = gauche + 18; const ppc = (W - ligne - 6) / 18; const X = (pas) => ligne + (pas - pos) * ppc;
          // Les temps : une ligne par temps, plus forte sur le 1 ; le compte en haut.
          for (let b = Math.ceil(pos / 2) * 2; X(b) < W; b += 2) { const xx = X(b); const un = b % 8 === 0; x.fillStyle = un ? '#5a5346' : '#2e2a23'; x.fillRect(xx, 22, un ? 2 : 1, H - 22); x.fillStyle = un ? '#f1cf4e' : '#a39b87'; x.font = `800 ${un ? 15 : 12}px ${police}`; x.textAlign = 'center'; x.fillText(String((((b / 2) % 4) + 4) % 4 + 1), xx, 16); }
          const evs = []; for (let q = Math.floor(pos) - 16; q < pos + 19; q++) evs.push(...evtsDe(q));
          L.forEach((pl, i) => {
            const y0 = 22 + i * hP; x.fillStyle = i % 2 ? '#1b1915' : '#201d18'; x.fillRect(0, y0, W, hP - 4);
            const mes = evs.filter((e) => e.id === pl.id); const ici = mes.find((e) => e.debut <= pos && pos < e.debut + e.len);
            // Les blocs et les barres
            mes.forEach((e) => {
              const xa = Math.max(ligne, X(e.debut)); const xb = X(e.debut + e.len) - 3; if (xb <= ligne || xa > W) return;
              const actif = e === ici; x.globalAlpha = e.ecoute ? 0.45 : 1;
              if (!pl.voix) {
                const bh = hP * 0.78; const yy = y0 + (hP - 4 - bh) / 2; x.fillStyle = actif ? '#fff7dc' : '#2a2620'; x.strokeStyle = pl.c; x.lineWidth = 3; arrondi(x, xa, yy, Math.max(6, xb - xa), bh, 10); x.fill(); x.stroke();
                const im = gesteImage(pl.im, pl.c); const tI = Math.min(bh - 6, xb - xa - 6); if (tI > 16 && im.complete) x.drawImage(im, xa + (xb - xa - tI) / 2, yy + (bh - tI) / 2, tI, tI);
              } else {
                const bh = hP * 0.42; const haut = e.h ?? 0.5; const yy = y0 + 4 + (hP - 12 - bh) * (1 - haut);
                x.fillStyle = actif ? pl.c : `${pl.c}99`; arrondi(x, xa, yy, Math.max(6, xb - xa), bh, 10); x.fill();
                if (actif) { x.fillStyle = 'rgba(255,247,220,.35)'; arrondi(x, xa, yy, Math.max(6, Math.min(xb - xa, (pos - e.debut) / e.len * (e.len * ppc))), bh, 10); x.fill(); }
                const im = gesteImage(pl.im, pl.c); const tI = bh + 10; let tx = xa + 6; if (!e.mot && xb - xa > tI + 10 && im.complete) { x.drawImage(im, xa + 4, yy - 5, tI, tI); tx = xa + tI + 8; }
                const lab = e.mot || `${e.ecoute ? 'écoutez ' : ''}${NOTE_FR[((e.note % 12) + 12) % 12]}`; const fs = Math.min(bh * 0.6, (xb - tx - 4) / Math.max(1.6, lab.length * 0.62)); if (fs >= 10) { x.fillStyle = '#14120f'; x.font = `900 ${Math.round(fs)}px ${police}`; x.textAlign = 'left'; x.fillText(lab, tx, yy + bh * 0.5 + fs * 0.36); }
              }
              x.globalAlpha = 1;
            });
            // L'étiquette : le groupe, quoi faire, et le décompte
            const flash = ici && !ici.ecoute && (pl.voix ? pos - ici.debut < 1 : true); // le moment de jouer : l'étiquette s'allume
            x.fillStyle = flash ? pl.c : '#14120f'; x.fillRect(0, y0, gauche, hP - 4); x.fillStyle = pl.c; x.fillRect(0, y0, 6, hP - 4);
            x.save(); x.beginPath(); x.rect(0, y0, gauche, hP - 4); x.clip(); // le texte reste dans l'étiquette
            const imL = gesteImage(pl.im, flash ? '#fff7dc' : pl.c); const tL = (hP - 4) * (flash ? 0.92 : 0.82); if (imL.complete) x.drawImage(imL, 10 + ((hP - 4) * 0.92 - tL) / 2, y0 + (hP - 4 - tL) / 2 + (flash && !pl.voix ? 4 : 0), tL, tL);
            const tx0 = 14 + (hP - 4) * 0.92;
            x.textAlign = 'left'; x.fillStyle = flash ? '#14120f' : pl.c; x.font = `900 ${Math.round(Math.min(hP * (W < 640 ? 0.24 : 0.32), (gauche - tx0 - 6) / Math.max(2, pl.mot.length * 0.66)))}px ${police}`; x.fillText(pl.mot, tx0, y0 + hP * 0.42);
            let etat = pl.geste || ''; let fort = false;
            if (pl.voix) {
              const proch = mes.filter((e) => e.debut > pos && !e.ecoute).sort((a, b) => a.debut - b.debut)[0];
              if (ici && !ici.ecoute) { etat = `chantez : ${ici.mot || NOTE_FR[((ici.note % 12) + 12) % 12]}`; fort = true; }
              else if (proch && proch.debut - pos <= 8) { etat = `à vous dans ${Math.max(1, Math.ceil((proch.debut - pos) / 2))}`; fort = true; }
              else if (ici?.ecoute) etat = ici.mot ? 'écoutez' : 'écoutez la note';
              else etat = attente ? attente(pl) : 'attendez…';
            }
            x.fillStyle = flash ? '#14120f' : fort ? '#fff7dc' : '#a39b87'; x.font = `800 ${Math.round(hP * (W < 640 ? 0.15 : 0.19))}px ${police}`; x.fillText(W < 640 ? (pl.voix ? etat.replace('à vous dans', 'dans').replace('chantez : ', '').replace('écoutez la note', 'écoutez').replace('attendez…', '…') : '') : etat, tx0, y0 + hP * 0.75); x.restore();
          });
          // La ligne : c'est maintenant.
          x.fillStyle = '#fff7dc'; x.fillRect(ligne - 2, 18, 4, H - 18);
    }

    // ---------- Les activités ----------
    const A = {
      voix: {
        marques: [],
        parts() { return PARTIES_V.filter((x) => reglages.vParts[x.id]); },
        syl(P) { const L = store.get(`cercleVMots-${P.id}`, P.mots).split(/[\s-]+/).map((x) => x.replace(/[,.;!?]/g, '')).filter(Boolean); return L.length ? L : ['la']; },
        // Les notes d'une boucle qui commencent à cette croche, et si l'app les chante (son) ou si c'est la classe (ecoute = l'app chante, la classe écoute).
        evts(pas) {
          const r = []; if (pas < 0) return r; const L = this.parts(); if (!L.length) return r; const T = reglages.tonique; const q = pas % 16; const boucle = Math.floor(pas / 16); const et = reglages.vEtape;
          L.forEach((P, j) => {
            let actif = false; let ecoute = false; let son = false;
            if (et === 'ecoute') { actif = boucle % L.length === j; ecoute = true; son = true; }
            else if (et === 'echo') { actif = Math.floor(boucle / 2) % L.length === j; ecoute = boucle % 2 === 0; son = ecoute; }
            else if (et === 'ensemble') { actif = boucle >= 2 * j; son = reglages.vModele !== 'sans'; }
            else { actif = true; son = reglages.vModele !== 'sans'; }
            if (!actif) return;
            const syl = this.syl(P); const degs = P.notes.map((n) => degre(n.d)); const lo = Math.min(...degs); const hi = Math.max(...degs);
            P.notes.forEach((n, i) => { if (n.t === q) r.push({ id: P.id, debut: pas, len: n.l, note: T + degre(n.d), mot: syl[i % syl.length], h: hi === lo ? 0.5 : (degre(n.d) - lo) / (hi - lo), ecoute, son, P }); });
          });
          return r;
        },
        rendre() {
          const et = ETAPES_V.find((x) => x[0] === reglages.vEtape) || ETAPES_V[0];
          return `<div class="ce-v-etapes">${ETAPES_V.map(([k, nom]) => `<button data-vetape="${k}" class="${k === reglages.vEtape ? 'on' : ''}">${nom}</button>`).join('')}</div>
          <p class="ce-dis ce-v-dit">${et[2]}</p>
          <canvas class="ce-pistes ce-v-pistes" aria-label="Les boucles chantées, avec leurs mots"></canvas>
          ${reglages.vEtape === 'solo' ? `<div class="ce-clavier" aria-label="Les 5 notes du solo">${[0, 1, 2, 3, 4, 5].map((d) => `<button data-vnote="${d}" style="--c:${['#e5452c', '#ff8a3d', '#f1cf4e', '#3fbf7f', '#3d6bff', '#b25cff'][d]}">${NOTE_FR[(reglages.tonique + degre(d)) % 12]}</button>`).join('')}</div><p class="ce-astuce">Touchez une note pour l’entendre. Le soliste chante ce qu’il veut avec ces notes : des mots, des sons, son nom. Il revient sur ${NOTE_FR[reglages.tonique % 12]} pour finir.</p>` : ''}
          <div class="ce-niveaux"><span class="ce-l">Les boucles</span>${PARTIES_V.map((P) => `<button class="ce-chg ${reglages.vParts[P.id] ? 'on' : ''}" style="--c:${P.c}" data-vpart="${P.id}"><span class="ce-img">${geste(P.im, '#fff7dc')}</span>${P.nom}</button>`).join('')}</div>
          <div class="ce-niveaux"><span class="ce-l">Entendre seule</span>${PARTIES_V.map((P) => `<button data-vseul="${P.id}" style="--c:${P.c}">${P.nom}</button>`).join('')}</div>
          <div class="ce-niveaux"><span class="ce-l">L’app chante</span>${[['fort', 'Fort'], ['doux', 'Doux'], ['sans', 'Pas du tout']].map(([k, l]) => `<button class="${reglages.vModele === k ? 'on' : ''}" data-vmodele="${k}">${l}</button>`).join('')}<button class="${reglages.vBourdon ? 'on' : ''}" data-vbourdon="1">${reglages.vBourdon ? 'Bourdon : oui' : 'Bourdon : non'}</button></div>
          <div class="ce-niveaux"><span class="ce-l">Tonalité</span>${TONS.map(([n, m]) => `<button class="${reglages.tonique === m ? 'on' : ''}" data-ton="${m}">${n}</button>`).join('')}</div>
          <details class="ce-jam-ed"><summary>Changer les mots des boucles (vos noms, un plat, une phrase de la classe)</summary>
            ${PARTIES_V.map((P) => `<label class="ce-v-mots" style="--c:${P.c}"><b>${P.nom}</b> <input class="input" data-vmots="${P.id}" value="${esc(store.get(`cercleVMots-${P.id}`, P.mots))}"><small>${P.notes.length} notes : un mot ou une syllabe par note (séparez avec des espaces ou des tirets)</small></label>`).join('')}
          </details>`;
        },
        fn(pas, t, d) {
          if (pas === 0) this.marques = []; this.marques.push([pas, t, d]); if (this.marques.length > 48) this.marques.shift();
          const T = reglages.tonique; const p = pas % 8; const vol = reglages.vModele === 'doux' ? 0.45 : 1;
          this.evts(pas).forEach((e) => { if (e.son) chante(e.note, t, e.len * d * 0.92, e.P.timbre, 0.16 * (e.ecoute ? 1 : vol)); });
          if (p % 2 === 0) click(t, p === 0); // la pulsation, tout doucement : on garde le tempo ensemble
          if (reglages.vBourdon && pas % 16 === 0) { chante(T - 12, t, 16 * d * 0.98, 2, 0.05); chante(T - 5, t, 16 * d * 0.98, 2, 0.035); } // le bourdon : la tonique et la quinte, tenues
          quand(t, () => { const sc = scene(); const e = sc?.querySelector('.ce-v-dit'); if (!e || p !== 0) return; const L = this.parts(); const et = reglages.vEtape; const b = Math.floor(pas / 16);
            if (et === 'echo' && L.length) { const P = L[Math.floor(b / 2) % L.length]; e.innerHTML = b % 2 === 0 ? `<b style="color:${P.c}">${P.nom}</b> : écoutez…` : `<b style="color:${P.c}">${P.nom}</b> : à vous!`; }
            if (et === 'ensemble' && L.length) { const n = Math.min(L.length, Math.floor(b / 2) + 1); const proch = L[n]; e.innerHTML = proch && b % 2 === 1 ? `<b style="color:${proch.c}">${proch.nom}</b> : à vous au prochain tour!` : `${L.slice(0, n).map((P) => `<b style="color:${P.c}">${P.nom}</b>`).join(' + ')}`; }
          });
        },
        dessiner() { dessinerPistes(scene()?.querySelector('.ce-v-pistes'), this.parts().map((P) => ({ id: P.id, mot: P.nom.toUpperCase(), c: P.c, im: P.im, voix: true })), (q) => this.evts(q), posDe(this.marques), () => 'attendez…'); },
      },
      jam: {
        rendre() {
          const g = reglages.grille;
          const vx = voixJam(AMBIANCES[reglages.ambiance] || AMBIANCES.chill);
          const mix = reglages.jamPart === 'mix';
          return `<p class="ce-jam-mode">${mix ? '<b>Tout en même temps</b> : le beat de la classe et les voix ensemble, en boucle. Chaque groupe suit sa piste.' : reglages.jamPart == null ? 'Toute la chanson. Pour pratiquer une partie seule, touchez-la :' : `On pratique : <b>${PLAN_JAM[reglages.jamPart].nom}</b>, en boucle.`}</p>
          <div class="ce-jam-plan">${PLAN_JAM.map((x, i) => `<button data-jpart="${i}" class="${reglages.jamPart === i ? 'choisi' : ''}" style="flex:${x.mes}"><b>${x.nom}</b><i></i></button>`).join('')}<button data-jpart="tout" class="ce-jam-tout ${reglages.jamPart == null ? 'choisi' : ''}"><b>Toute la chanson</b></button><button data-jpart="mix" class="ce-jam-tout ce-jam-mix ${reglages.jamPart === 'mix' ? 'choisi' : ''}"><b>Tout en même temps</b></button></div>
          ${mix ? `<canvas class="ce-pistes ce-jam-pistes" aria-label="Les pistes : le beat de la classe et les voix"></canvas>${VOIX_C.some((v) => reglages.jamVoix[v.id]) ? '' : '<p class="ce-dis">Allumez des voix (AAA, OOO, MMM) dans la table de mixage, plus bas.</p>'}` : ''}
          <div class="ce-jam-voix" ${mix ? 'hidden' : ''}>${VOIX_C.filter((v) => reglages.jamVoix[v.id]).map((v) => `<div class="ce-pad actif" data-jv="${v.id}" style="--c:${v.c}"><span class="ce-img">${geste(v.id, v.c)}</span><b>${v.voy}</b><span class="ce-pad-n">${NOTE_FR[vx[v.id][0] % 12]}</span></div>`).join('')}</div>
          ${mix ? '' : `<div class="ce-compte ce-jam-compte">${[1, 2, 3, 4].map((n) => `<span>${n}</span>`).join('')}</div>
          <p class="ce-phase ce-jam-titre">Prêts?</p>
          <div class="ce-ligne ce-jam-ligne">${[...Array(8)].map((_, i) => `<div class="ce-case ${i % 2 ? 'et' : ''}" data-i="${i}"></div>`).join('')}</div>
          <p class="ce-dis ce-jam-dit">L’app joue le groupe. Vous, vous êtes la batterie.</p>`}
          <details class="ce-jam-ed" open><summary>Le beat de la classe (le couplet) : touchez les cases pour l’inventer</summary>
            ${['boum', 'tac', 'tic'].map((k) => `<div class="ce-jam-r" style="--c:${SONS[k].c}"><b><span class="ce-img">${geste(k, SONS[k].c)}</span>${SONS[k].mot}</b>${[...Array(8)].map((_, i) => `<button class="${g[k].includes(i) ? 'on' : ''} ${i % 2 ? 'et' : ''}" data-gr="${k}" data-gi="${i}" aria-label="${SONS[k].mot} sur ${i % 2 ? 'le et' : `le ${i / 2 + 1}`}">${i % 2 ? '·' : i / 2 + 1}</button>`).join('')}</div>`).join('')}
          </details>
          <details class="ce-mixeur" open><summary>Table de mixage : choisissez ce qui joue, et à quel volume</summary>
            <div class="ce-niveaux ce-mx-presets">${Object.entries(PRESETS).map(([k, [nom]]) => `<button data-mxp="${k}">${nom}</button>`).join('')}</div>
            <div class="ce-mx-rangs">${COUCHES.map(([k, nom, c]) => `<div class="ce-mx-r ${reglages.mixJ[k].on ? 'on' : ''}" style="--c:${c}"><button data-mx="${k}" aria-pressed="${reglages.mixJ[k].on}">${['boum', 'tac', 'tic', 'aaa', 'ooo', 'mmm'].includes(k) ? `<span class="ce-img">${geste(k, c)}</span>` : ''}<b>${nom}</b><small>${reglages.mixJ[k].on ? 'allumé' : 'éteint'}</small></button><input type="range" min="0" max="100" value="${Math.round(reglages.mixJ[k].vol * 100)}" data-mxv="${k}" aria-label="Volume : ${nom}"></div>`).join('')}</div>
            <p class="ce-astuce">BOUM, TAC, TIC : le beat de la classe (l’app le joue avec vous ; volume à zéro = la classe le joue seule, la piste reste à l’écran). Éteint = disparaît de l’écran et du son.</p>
          </details>
          <div class="ce-niveaux"><span class="ce-l">Ambiance</span>${Object.entries(AMBIANCES).map(([k, a]) => `<button class="${reglages.ambiance === k ? 'on' : ''}" data-amb="${k}">${a.nom}</button>`).join('')}</div>`;
        },
        marques: [],
        pistes() {
          const g = reglages.grille; const L = [];
          ['boum', 'tac', 'tic'].forEach((k) => { if (g[k].length && reglages.mixJ[k].on) L.push({ id: k, mot: SONS[k].mot, c: SONS[k].c, im: k, geste: SONS[k].geste }); });
          VOIX_C.forEach((v) => { if (reglages.jamVoix[v.id]) L.push({ id: v.id, mot: v.voy, c: v.c, im: v.id, voix: v }); });
          return L;
        },
        evts(pas) {
          const r = []; if (pas < 0) return r; const p = pas % 8; const g = reglages.grille;
          ['boum', 'tac', 'tic'].forEach((k) => { if (g[k].includes(p)) r.push({ id: k, debut: pas, len: 1 }); });
          if (p === 0) { const vx = voixJam(AMBIANCES[reglages.ambiance] || AMBIANCES.chill); const k4 = Math.floor(pas / 8) % 4; VOIX_C.forEach((v) => { if (!reglages.jamVoix[v.id]) return; const L = vx[v.id]; const lo = Math.min(...L); const hi = Math.max(...L); r.push({ id: v.id, debut: pas, len: 8, note: L[k4], h: hi === lo ? 0.5 : (L[k4] - lo) / (hi - lo) }); }); }
          return r;
        },
        dessiner() { dessinerPistes(scene()?.querySelector('.ce-jam-pistes'), this.pistes(), (q) => this.evts(q), posDe(this.marques), () => ''); },
        // Ce que la classe joue maintenant, case par case.
        partition(sec, m) {
          const id = PLAN_JAM[sec].id; const g = reglages.grille;
          if (id === 'intro') return Array(8).fill(null).map((_, i) => (i === 0 ? [['ÉCOUTEZ', '#6b6455']] : []));
          if (id === 'couplet') return [...Array(8)].map((_, i) => ['boum', 'tac', 'tic'].filter((k) => g[k].includes(i)).map((k) => [SONS[k].mot, SONS[k].c, k]));
          if (id === 'refrain') return REFRAIN.map((k) => (k ? [[SONS[k].mot, SONS[k].c, k]] : []));
          if (id === 'libre') return [...Array(8)].map((_, i) => (i === 0 ? [['1 !', '#f1cf4e']] : []));
          if (id === 'fin') return m === 0 ? REFRAIN.map((k) => (k ? [[SONS[k].mot, SONS[k].c, k]] : [])) : [...Array(8)].map((_, i) => (i === 0 ? [['HÉ!', '#e5452c']] : []));
          return [];
        },
        fn(pas, t, d) {
          const mes = Math.floor(pas / 8); const p = pas % 8;
          if (reglages.jamPart == null && mes >= TOTAL_JAM) { if (p === 0) quand(t, () => { arreter(); const sc = scene(); if (sc) { sc.querySelector('.ce-jam-titre').textContent = 'Bravo!'; sc.querySelector('.ce-jam-dit').textContent = 'Encore? Changez le beat de la classe ou l’ambiance, et Démarrer.'; } }); return; }
          let sec = 0; DEBUTS_JAM.forEach((x, i) => { if (mes >= x) sec = i; }); let m = mes - DEBUTS_JAM[sec];
          if (pas === 0) this.marques = []; this.marques.push([pas, t, d]); if (this.marques.length > 48) this.marques.shift();
          const mix = reglages.jamPart === 'mix';
          if (mix) { sec = 1; m = mes % 4; } else if (reglages.jamPart != null) { sec = reglages.jamPart; m = mes % PLAN_JAM[sec].mes; }
          const S = PLAN_JAM[sec];
          const amb = AMBIANCES[reglages.ambiance] || AMBIANCES.chill; const k4 = mes % 4; const M = 8 * d;
          const vB = vo('batterie'); const D = (f) => (tt, v) => { if (vB) f(tt, v * vB); };
          const kick = D(drums.kickOrigine || drums.kick); const snare = D(drums.snareOrigine || drums.snare); const hat = D(drums.hatOrigine || drums.hat); const clap = D(drums.clapOrigine || drums.clap);
          const basse = (f, tt, du) => { if (vo('basse')) bass(f, tt, du, 0.5 * vo('basse')); };
          // La batterie de l'app : elle change à chaque partie, avec un roulement avant chaque nouvelle phrase.
          const fin = S.id === 'fin' && m === 1;
          if (fin) { if (p === 0) { kick(t, 1); clap(t, 1); snare(t, 0.8); basse(hz(amb.basse[0]), t, M * 0.9); if (vo('accords')) amb.acc[0].forEach((n) => { if (!joue('rhodes', n, { when: t, dur: M, vel: 0.5 * vo('accords') })) pluck(hz(n), { when: t, dur: M, gain: 0.28 * vo('accords') }); }); VOIX_C.forEach((v, i) => { if (vo(v.id)) chante(voixJam(amb)[v.id][0], t, M * 0.95, i, 0.12 * vo(v.id)); }); } }
          else {
            const B = BEATS[S.id]; const roule = (S.id === 'couplet' || S.id === 'refrain' || S.id === 'fin') && (m % 4 === 3 || (S.id === 'fin' && m === 0)) && p >= 4;
            if (B.k?.includes(p)) kick(t, S.id === 'libre' ? 0.55 : 0.7);
            if (roule) { snare(t, 0.35 + 0.12 * (p - 4)); if (p >= 6) snare(t + d / 2, 0.45 + 0.1 * (p - 6)); }
            else { if (B.s?.includes(p)) snare(t, 0.5); if (B.c?.includes(p)) clap(t, 0.45); if (B.h?.includes(p)) hat(t, S.id === 'couplet' ? (p % 2 ? 0.18 : 0.28) : 0.3); }
            // Le beat de la classe, joué par l'app (on l'entend, TIC compris) : on peut le couper quand la classe le tient.
            if (S.id === 'couplet') ['boum', 'tac', 'tic'].forEach((k) => { if (reglages.grille[k].includes(p) && vo(k)) sonne(k, t, 0.55 * vo(k)); });
            if (S.id === 'refrain' && REFRAIN[p] && vo(REFRAIN[p])) sonne(REFRAIN[p], t, 0.5 * vo(REFRAIN[p]));
            // Les voix : une note tenue par accord (une mesure), qui bouge le moins possible.
            if (p === 0 && S.id !== 'intro') { const vx = voixJam(amb); VOIX_C.forEach((v, i) => { if (vo(v.id)) chante(vx[v.id][k4], t, M * 0.95, i, 0.13 * vo(v.id)); }); }
            // La basse et les accords : une progression de 4 accords, une mesure chacun.
            const bn = amb.basse[k4];
            if (S.id === 'couplet' && B.k.includes(p)) basse(hz(bn), t, d * 1.6);
            if ((S.id === 'refrain' || S.id === 'fin') && p % 2 === 0) basse(hz(bn + (p === 2 || p === 6 ? 12 : 0)), t, d * 1.5);
            if (S.id === 'libre' && p === 0) basse(hz(bn), t, M * 0.9);
            const acc = amb.acc[k4];
            const jouerAcc = (dur, vel) => { const va = vo('accords'); if (va) acc.forEach((n, j) => { if (!joue('rhodes', n, { when: t + j * 0.008, dur, vel: vel * va })) pluck(hz(n), { when: t, dur, gain: 0.12 * va }); }); };
            if ((S.id === 'intro' || S.id === 'couplet' || S.id === 'libre') && p === 0) jouerAcc(M * 0.95, S.id === 'libre' ? 0.3 : 0.4);
            if ((S.id === 'refrain' || S.id === 'fin') && (p === 0 || p === 3 || p === 6)) jouerAcc(d * 1.4, 0.45);
          }
          // L'écran
          quand(t, () => {
            const sc = scene(); if (!sc || !sc.querySelector('.ce-jam-titre')) return; // en « tout en même temps », ce sont les pistes qui parlent
            if (p === 0) {
              const part = this.partition(sec, m);
              sc.querySelectorAll('.ce-jam-ligne .ce-case').forEach((x, i) => { x.innerHTML = part[i].map(([mot, c, k]) => `${k && part[i].length === 1 ? `<span class="ce-img">${geste(k, c)}</span>` : ''}<b style="--c:${c}">${mot}</b>`).join(''); });
              sc.querySelectorAll('.ce-jam-plan [data-jpart]:not(.ce-jam-tout)').forEach((x, i) => { x.classList.toggle('on', i === sec); x.classList.toggle('fait', reglages.jamPart == null && i < sec); x.querySelector('i').style.width = reglages.jamPart == null && i < sec ? '100%' : i === sec ? `${((m + 1) / S.mes) * 100}%` : '0%'; });
              const vx = voixJam(amb); const chante2 = S.id !== 'intro';
              sc.querySelectorAll('[data-jv]').forEach((x) => { const id = x.dataset.jv; const n = vx[id][k4]; const sv = vx[id][(k4 + 1) % 4] - n; x.classList.toggle('actif', chante2); x.querySelector('.ce-pad-n').textContent = chante2 ? `${NOTE_FR[n % 12]}${sv > 0 ? ' · ensuite plus haut' : sv < 0 ? ' · ensuite plus bas' : ' · ensuite la même'}` : `écoutez · ${NOTE_FR[n % 12]}`; });
              const avant = reglages.jamPart == null && m === S.mes - 1 && PLAN_JAM[sec + 1];
              sc.querySelector('.ce-jam-titre').textContent = S.id === 'fin' && m === 1 ? 'HÉ!' : S.nom;
              let dit = avant ? `Prochaine partie : <b>${PLAN_JAM[sec + 1].nom}</b>…` : S.dit;
              if (S.id === 'libre' && m % 2 === 0) { const noms = reglages.noms.split('\n').map((x) => x.trim()).filter(Boolean); if (noms.length) dit = `Solo : <b>${esc(noms[Math.floor(Math.random() * noms.length)])}</b>, au centre! Le 1, tous ensemble.`; }
              sc.querySelector('.ce-jam-dit').innerHTML = dit;
            }
            sc.querySelectorAll('.ce-jam-ligne .ce-case').forEach((x, i) => x.classList.toggle('on', i === p));
            if (p % 2 === 0) sc.querySelectorAll('.ce-jam-compte span').forEach((x, i) => x.classList.toggle('on', i === p / 2));
          });
        },
      },
      coeur: {
        // Ce qu'on pratique : { son, pos, syl } (un son + un rythme, ou un groupe d'un beat).
        quoi() {
          const r = reglages.coeurRythme;
          if (r.startsWith('g:')) { const [, gk, gi] = r.split(':'); const G = GROOVES[gk]; if (G) { const g = { ...GROUPES[+gi], ...G.g[+gi] }; const k = gk === 'pizza' ? `cercleMot-${g.id}` : `cercleMot-${gk}-${g.id}`; return { son: g.son, pos: g.pos, syl: store.get(k, g.mot).split(/[\s-]+/).filter(Boolean), c: g.c, nom: `${G.nom} · ${g.nom}` }; } }
          const R = RYTHMES_C[r] || RYTHMES_C.temps; const k = reglages.coeurSon; return { son: k, pos: R[1], syl: [SONS[k].mot], c: SONS[k].c, nom: R[0] };
        },
        rendre() {
          const q = this.quoi();
          return `<div class="ce-centre"><div class="ce-rond" style="--c:${q.c}"><span class="ce-img">${geste(q.son, '#fff7dc')}</span><b>${SONS[q.son].mot}</b></div>
          <p class="ce-compte"><span>1</span><span>2</span><span>3</span><span>4</span></p>
          <div class="ce-ligne ce-coeur-ligne">${[...Array(8)].map((_, i) => { const n = q.pos.indexOf(i); return `<div class="ce-case ${i % 2 ? 'et' : ''}" data-i="${i}">${n >= 0 ? `<span class="ce-img">${geste(q.son, q.c)}</span><b style="--c:${q.c}">${esc(q.syl[n % q.syl.length] || SONS[q.son].mot)}</b>` : ''}</div>`; }).join('')}</div>
          <p class="ce-dis">${esc(SONS[q.son].geste)} : <b>${esc(q.nom)}</b>. Quand la case s’allume, on joue.</p></div>
          <div class="ce-niveaux ce-coeur-sons"><span class="ce-l">Son</span>${Object.keys(SONS).map((k) => `<button class="ce-chg ${!reglages.coeurRythme.startsWith('g:') && reglages.coeurSon === k ? 'on' : ''}" style="--c:${SONS[k].c}" data-coeur-son="${k}"><span class="ce-img">${geste(k, '#fff7dc')}</span>${k === 'pieds' ? 'PIEDS' : SONS[k].mot}</button>`).join('')}</div>
          <div class="ce-niveaux"><span class="ce-l">Rythme</span>${Object.entries(RYTHMES_C).map(([k, [nom]]) => `<button class="${reglages.coeurRythme === k ? 'on' : ''}" data-coeur-r="${k}">${nom}</button>`).join('')}</div>
          <div class="ce-niveaux"><label class="ce-l" for="ce-coeur-g">Ou pratiquer un groupe d’un beat</label><select id="ce-coeur-g" class="ce-select" data-coeur-g><option value="">…</option>${Object.entries(GROOVES).map(([gk, G]) => `<optgroup label="${G.nom}">${G.g.map((x, gi) => `<option value="g:${gk}:${gi}" ${reglages.coeurRythme === `g:${gk}:${gi}` ? 'selected' : ''}>${G.nom} · ${GROUPES[gi].nom} (${esc(x.mot)})</option>`).join('')}</optgroup>`).join('')}</select></div>`;
        },
        fn(pas, t) {
          const p = pas % 8; const q = this.quoi();
          if (q.pos.includes(p)) sonne(q.son, t, p === 0 ? 1 : 0.8);
          if (p % 2 === 0 && !q.pos.includes(p)) click(t, p === 0); // le temps, tout doux, pour se repérer
          quand(t, () => {
            const sc = scene(); if (!sc) return;
            if (q.pos.includes(p)) { const r = sc.querySelector('.ce-rond'); if (r) { r.classList.remove('bat'); void r.offsetWidth; r.classList.add('bat'); } }
            sc.querySelectorAll('.ce-coeur-ligne .ce-case').forEach((x, i) => x.classList.toggle('on', i === p));
            if (p % 2 === 0) sc.querySelectorAll('.ce-compte span').forEach((x, i) => x.classList.toggle('on', i === p / 2));
          });
        },
      },
      echo: {
        motif: null,
        nouveau() {
          const lv = reglages.niveau; const palette = lv === 'facile' ? ['boum', 'tac'] : lv === 'moyen' ? ['boum', 'tac', 'tic'] : ['boum', 'tac', 'tic', 'tsk'];
          const m = Array(8).fill(null); const places = lv === 'facile' ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6, 7];
          places.forEach((p) => { const garde = p % 2 === 0 ? Math.random() < 0.85 : Math.random() < (lv === 'defi' ? 0.45 : 0.25); if (garde) m[p] = palette[Math.floor(Math.random() * palette.length)]; });
          if (!m[0]) m[0] = 'boum'; return m;
        },
        rendre: () => `<p class="ce-phase">ÉCOUTEZ</p><div class="ce-ligne">${[...Array(8)].map((_, i) => `<div class="ce-case ${i % 2 ? 'et' : ''}" data-i="${i}"></div>`).join('')}</div><p class="ce-dis">Écoute 4 temps… puis <b>répétez ensemble</b>.</p>
          <div class="ce-niveaux">${[['facile', 'Facile'], ['moyen', 'Moyen'], ['defi', 'Défi']].map(([k, l]) => `<button class="${reglages.niveau === k ? 'on' : ''}" data-niveau="${k}">${l}</button>`).join('')}</div>`,
        fn(pas, t) {
          const i = pas % 16; const phase = i < 8 ? 'ecoute' : 'vous'; const k = i % 8;
          if (i === 0) { this.motif = this.nouveau(); const m = this.motif; quand(t, () => { const cs = scene()?.querySelectorAll('.ce-case'); cs?.forEach((x, n) => { x.innerHTML = m[n] ? `<span class="ce-img">${geste(m[n], SONS[m[n]].c)}</span><b style="--c:${SONS[m[n]].c}">${SONS[m[n]].mot}</b>` : ''; }); }); }
          const s = this.motif?.[k];
          if (phase === 'ecoute' && s) sonne(s, t); if (phase === 'vous' && k % 2 === 0) sonne('tic', t, 0.35); // pendant « À vous », juste le tempo, tout doux
          quand(t, () => { const sc = scene(); if (!sc) return; const ph = sc.querySelector('.ce-phase'); if (k === 0) { ph.textContent = phase === 'ecoute' ? 'ÉCOUTEZ' : 'À VOUS!'; ph.classList.toggle('vous', phase === 'vous'); } sc.querySelectorAll('.ce-case').forEach((x, n) => x.classList.toggle('on', n === k)); });
        },
      },
      mots: {
        html: () => grp().map((g, gi) => `<div class="ce-g" data-g="${gi}" style="--c:${g.c}"><div class="ce-g-t"><b>${g.nom}</b>${carte(g.son)}</div><div class="ce-g-l">${lignes(gi, g)}</div></div>`).join(''),
        rendre() {
          return `${boutonsBeat()}<div class="ce-groupes">${this.html()}</div>
          <p class="ce-dis ce-entre">Le groupe <b>ROUGE</b> commence. Un nouveau groupe entre toutes les 4 mesures.</p>
          <div class="ce-niveaux"><button class="${reglages.enchainer ? 'on' : ''}" data-enchainer="1">${reglages.enchainer ? 'Le beat change tout seul : oui' : 'Le beat change tout seul : non'}</button></div>`;
        },
        actifs: 1,
        fn(pas, t) {
          const mes = Math.floor(pas / 8); const p = pas % 8; if (pas === 0) this.actifs = 1;
          if (p === 0 && mes > 0 && mes % 4 === 0 && this.actifs < GROUPES.length) this.actifs += 1;
          // Le beat change tout seul toutes les 8 mesures (une fois tout le monde entré), annoncé une mesure avant.
          const change = reglages.enchainer && this.actifs >= GROUPES.length && mes >= 16;
          if (change && p === 0 && mes % 8 === 0) { reglages.groove = prochainBeat(); store.set('cercleGroove', reglages.groove); quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelector('.ce-groupes').innerHTML = this.html(); sc.querySelectorAll('[data-groove]').forEach((b) => b.classList.toggle('on', b.dataset.groove === reglages.groove)); }); }
          const GR = grp(); const n = this.actifs; const avant = p === 0 && mes % 4 === 3 && n < GROUPES.length; // la mesure d'avant : on annonce
          const nouveau = change && p === 0 && mes % 8 === 7;
          GR.slice(0, n).forEach((g) => { if (g.pos.includes(p)) sonne(g.son, t, g.son === 'boum' && p === 0 ? 1 : 0.8); });
          quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelectorAll('.ce-g').forEach((x, gi) => { x.classList.toggle('actif', gi < n); x.querySelectorAll('span[data-p]').forEach((s) => s.classList.toggle('on', +s.dataset.p === p && gi < n)); });
            const e = sc.querySelector('.ce-entre'); if (p === 0) e.innerHTML = nouveau ? `Nouveau beat au prochain 1 : <b>${GROOVES[prochainBeat()].nom}</b>! Regardez vos mots.` : avant ? `Groupe <b style="color:${GR[n].c}">${GR[n].nom}</b> : à vous dans 4 temps!` : n < GROUPES.length ? `${GR.slice(0, n).map((g) => `<b style="color:${g.c}">${g.nom}</b>`).join(' + ')}` : 'TOUT LE MONDE! Tenez le groove.'; });
        },
      },
      // Le chef : une personne dirige (le prof, puis un élève). Elle touche un groupe pour le faire entrer ou sortir,
      // choisit doux ou fort, ou fige tout le monde. Rien au hasard : chaque changement arrive au prochain temps,
      // annoncé à l'écran, et l'app joue le rythme des groupes allumés comme modèle.
      chef: {
        voulu: new Set(['g0']), actuel: new Set(['g0']), nuance: 'normal', nuanceActu: 'normal', fige: false, figeActu: false, sons: {}, k: 0,
        html() {
          return grp().map((g, gi) => `<button class="ce-g ce-chef-g" data-chef-g="g${gi}" style="--c:${g.c}"><span class="ce-g-t"><span class="ce-img">${geste(g.son, g.c)}</span><b>${g.nom}</b><span class="ce-chef-etat"></span></span><span class="ce-g-l">${lignes(gi, g)}</span></button>`).join('');
        },
        rendre() {
          return `<div class="ce-compte ce-chef-compte">${[1, 2, 3, 4].map((n) => `<span>${n}</span>`).join('')}</div>
          ${boutonsBeat()}
          <div class="ce-groupes ce-chef">${this.html()}</div>
          <div class="ce-pads">${PADS.map(([k, nom, c]) => `<button class="ce-pad ce-chef-g" data-chef-g="${k}" style="--c:${c}"><span class="ce-img">${geste(k, c)}</span><b>${nom}</b><span class="ce-pad-n"></span><span class="ce-chef-etat"></span></button>`).join('')}</div>
          <div class="ce-fige-msg" hidden><b>ON FIGE</b><span>Personne ne bouge. Les yeux sur le chef.</span></div>
          <div class="ce-chef-ctrl"><button data-chef="tous">Tout le monde</button><button data-chef="personne">Personne</button><button data-chef="doux">Doux</button><button data-chef="normal">Normal</button><button data-chef="fort">Fort</button><button class="ce-chef-fige" data-chef="fige">On fige</button></div>
          <p class="ce-dis ce-chef-dis">Le chef touche un groupe pour le faire <b>entrer</b> ou <b>sortir</b>. Touche encore pour défaire.</p>`;
        },
        toucher(quoi, id) {
          if (quoi === 'g') { if (this.fige) this.fige = false; if (this.voulu.has(id)) this.voulu.delete(id); else this.voulu.add(id); }
          if (quoi === 'tous') { this.fige = false; this.voulu = new Set(['g0', 'g1', 'g2', 'g3', 'aaa', 'ooo', 'mmm']); }
          if (quoi === 'personne') { this.fige = false; this.voulu = new Set(); }
          if (quoi === 'doux' || quoi === 'normal' || quoi === 'fort') this.nuance = quoi;
          if (quoi === 'fige') this.fige = !this.fige;
          if (!moteur) this.appliquer();
          this.maj(-1);
        },
        appliquer() { this.actuel = new Set(this.voulu); this.nuanceActu = this.nuance; this.figeActu = this.fige; },
        maj(p) {
          const sc = scene(); if (!sc) return; const T = reglages.tonique;
          sc.querySelectorAll('[data-chef-g]').forEach((b) => {
            const id = b.dataset.chefG; const on = this.actuel.has(id) && !this.figeActu; const veut = this.voulu.has(id) && !this.fige;
            b.classList.toggle('actif', on); b.classList.toggle('entre', !on && veut); b.classList.toggle('sort', on && !veut);
            b.querySelector('.ce-chef-etat').textContent = on && !veut ? 'sort…' : !on && veut ? 'entre…' : on ? '' : 'touchez';
            b.querySelectorAll('.ce-g-l span').forEach((x) => x.classList.toggle('on', on && +x.dataset.p === p));
            const v = VOIX_C.find((x) => x.id === id); const n = b.querySelector('.ce-pad-n');
            if (v && n) { const note = T + v.notes[this.k]; const suiv = v.notes[(this.k + 1) % 4] - v.notes[this.k]; n.textContent = `${NOTE_FR[((note % 12) + 12) % 12]}${on ? (suiv > 0 ? ' · ensuite plus haut' : suiv < 0 ? ' · ensuite plus bas' : '') : ''}`; }
            if (on && p >= 0 && p % 2 === 0 && b.classList.contains('ce-pad')) { b.classList.remove('bat'); void b.offsetWidth; b.classList.add('bat'); }
          });
          sc.querySelectorAll('[data-chef]').forEach((b) => { const k = b.dataset.chef; b.classList.toggle('on', k === this.nuance || (k === 'fige' && this.fige) || (k === 'personne' && this.voulu.size === 0 && !this.fige)); });
          sc.querySelector('.ce-chef-fige').textContent = this.fige ? 'On repart' : 'On fige';
          sc.querySelector('.ce-fige-msg').hidden = !this.figeActu;
          const changement = !this.figeActu !== !this.fige || this.nuance !== this.nuanceActu || [...this.voulu].sort().join() !== [...this.actuel].sort().join();
          sc.querySelector('.ce-chef-dis').innerHTML = changement && moteur ? 'Ça change au prochain temps…' : this.figeActu ? 'Le chef touche <b>On repart</b> : tout le monde reprend.' : 'Le chef touche un groupe pour le faire <b>entrer</b> ou <b>sortir</b>. Touche encore pour défaire.';
        },
        fn(pas, t, d) {
          const p = pas % 8; const T = reglages.tonique; const vol = { doux: 0.4, normal: 0.8, fort: 1.15 }[this.nuanceActu];
          this.k = Math.floor(pas / 16) % 4;
          if (p % 2 === 0) {
            const avant = new Set(this.figeActu ? [] : this.actuel); this.appliquer(); const apres = new Set(this.figeActu ? [] : this.actuel);
            // Les voix : elles tiennent l'accord (deux mesures) ; une voix qui entre part tout de suite, une qui sort se tait.
            VOIX_C.forEach((v, i) => {
              const on = apres.has(v.id);
              if (this.sons[v.id] && !on) { this.sons[v.id].stop(t); this.sons[v.id] = null; }
              if (on && (pas % 16 === 0 || !avant.has(v.id))) this.sons[v.id] = chante(T + v.notes[this.k], t, (16 - (pas % 16)) * d * 0.96, i, 0.15 * vol);
            });
            if (pas % 16 === 0 && VOIX_C.some((v) => apres.has(v.id))) ACC_C[this.k].forEach((iv) => joue('piano', T - 12 + iv, { when: t, dur: 16 * d * 0.95, vel: 0.16 }));
          }
          if (!this.figeActu) {
            grp().forEach((g, gi) => { if (this.actuel.has(`g${gi}`) && g.pos.includes(p)) sonne(g.son, t, vol); });
            if (this.actuel.has('pluie')) { sonne('chhh', t, (p % 2 ? 0.35 : 0.6) * vol); if (p % 2) sonne('tic', t + d / 2, 0.3 * vol); }
            if (this.actuel.has('tonnerre')) { if (p === 0) sonne('pieds', t, 1.1 * vol); if (p === 3 || p === 5) sonne('boum', t, 0.7 * vol); }
          }
          quand(t, () => { this.maj(p); if (p % 2 === 0) scene()?.querySelectorAll('.ce-chef-compte span').forEach((x, i) => x.classList.toggle('on', i === p / 2)); });
        },
      },
      orage: {
        etapes: [['chhh', 'La pluie arrive…'], ['tic', 'Les gouttes'], ['tac', 'L’averse!'], ['boum', 'L’orage!'], ['pieds', 'LE TONNERRE!'], ['boum', 'L’orage s’éloigne'], ['tac', 'L’averse'], ['tic', 'Les gouttes'], ['chhh', 'La pluie s’en va…'], [null, '… silence.']],
        rendre() { return `<div class="ce-centre"><div class="ce-orage"></div><p class="ce-o-sous"></p><p class="ce-points">${this.etapes.map((_, i) => `<i data-e="${i}"></i>`).join('')}</p><p class="ce-dis">Fais comme l’écran, et <b>change en même temps que tout le monde</b>. Les yeux fermés, c’est encore mieux.</p></div>`; },
        fn(pas, t, d) {
          const parEtape = 16; const e = Math.floor(pas / parEtape); const et = this.etapes[e];
          if (!et) { quand(t, () => arreter()); return; }
          const [k, txt] = et; const pr = (pas % parEtape) / parEtape; const fort = e <= 4 ? (e + pr) / 5 : (9 - e - pr) / 5;
          if (k && Math.random() < (k === 'chhh' ? 0.9 : k === 'pieds' ? 0.45 : 0.75)) sonne(k, t + Math.random() * d * 0.6, 0.35 + 0.65 * Math.max(0, Math.min(1, fort)));
          if (pas % parEtape === 0) quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelector('.ce-orage').innerHTML = k ? carte(k, true) : '<div class="ce-son grand" style="--c:#555"><b>CHUT</b></div>'; sc.querySelector('.ce-o-sous').textContent = txt; sc.querySelectorAll('.ce-points i').forEach((x, i) => x.classList.toggle('on', i <= e)); });
        },
      },
      // Le chœur : chaque groupe a sa piste. Ses sons arrivent de la droite vers la ligne : quand un bloc touche la
      // ligne, on le fait (BOUM, TAC), ou on chante et on tient tant que la barre passe (AAA, OOO, MMM). Plus la
      // barre est haute dans la piste, plus la note est haute. On voit son tour venir, avec un décompte.
      choeur: {
        marques: [],
        pistes() {
          const g = reglages.chGr; const L = [];
          if (g.rouge) L.push({ id: 'rouge', nom: 'ROUGE', mot: 'BOUM', geste: 'main à plat', c: GROUPES[0].c, im: 'boum' });
          if (g.bleu) L.push({ id: 'bleu', nom: 'BLEU', mot: 'TAC', geste: 'taper des mains', c: GROUPES[1].c, im: 'tac' });
          VOIX_C.forEach((v) => { if (g[v.id]) L.push({ id: v.id, nom: 'Groupe', mot: v.voy, c: v.c, voix: v, im: v.id }); });
          return L;
        },
        // Les voix entrent une à une : la 1re après 2 mesures d'intro, puis une de plus toutes les 8 mesures.
        entree(v) { const i = VOIX_C.filter((x) => reglages.chGr[x.id]).indexOf(v); return i < 0 ? Infinity : (2 + 8 * i) * 8; },
        evts(pas) {
          const r = []; if (pas < 0) return r; const p = pas % 8; const mes = Math.floor(pas / 8); const g = reglages.chGr; const T = reglages.tonique;
          const h = (v, n) => { const lo = Math.min(...v.notes); const hi = Math.max(...v.notes); return hi === lo ? 0.5 : (n - T - lo) / (hi - lo); };
          if (g.rouge && p % 2 === 0) r.push({ id: 'rouge', len: 1, debut: pas });
          if (g.bleu && (p === 2 || p === 6)) r.push({ id: 'bleu', len: 1, debut: pas });
          const v0 = VOIX_C.find((x) => g[x.id]);
          if (mes === 1 && p === 0 && v0) r.push({ id: v0.id, len: 8, debut: pas, note: T + v0.notes[0], ecoute: true, voix: v0, h: h(v0, T + v0.notes[0]) });
          // Les voix suivantes : une mesure avant leur entrée, l'app leur chante leur note, à elles seules.
          if (p === 0) VOIX_C.forEach((v) => { const e = this.entree(v); if (v !== v0 && g[v.id] && pas === e - 8) { const ke = Math.floor((e / 8 - 2) / 2) % 4; r.push({ id: v.id, len: 8, debut: pas, note: T + v.notes[ke], ecoute: true, voix: v, h: h(v, T + v.notes[ke]) }); } });
          if (mes >= 2 && p === 0 && (mes - 2) % 2 === 0) { const k = Math.floor((mes - 2) / 2) % 4; VOIX_C.forEach((v) => { if (g[v.id] && pas >= this.entree(v)) r.push({ id: v.id, len: 16, debut: pas, note: T + v.notes[k], k, voix: v, h: h(v, T + v.notes[k]) }); }); }
          return r;
        },
        rendre: () => `<canvas class="ce-pistes" aria-label="Les pistes des groupes : les sons arrivent vers la ligne"></canvas>
          <p class="ce-dis ce-c-dis">Quand un bloc touche la ligne : <b>à vous!</b> Les voix tiennent la note tant que la barre passe.</p>
          <div class="ce-niveaux ce-ecoute-n"><span class="ce-l">Trouver sa note</span>${VOIX_C.filter((v) => reglages.chGr[v.id]).map((v) => `<button class="ce-chg on" style="--c:${v.c}" data-ecoute-v="${v.id}"><span class="ce-img">${geste(v.id, '#fff7dc')}</span>Écouter la note de ${v.voy}</button>`).join('')}</div>
          <p class="ce-astuce">Astuce : placez les AAA à gauche de la classe et les OOO à droite. La voix modèle de chaque groupe vient de son côté. Chaque groupe peut écouter sa note seule avant de commencer, et une mesure avant d’entrer, l’app la lui chante.</p>
          <div class="ce-niveaux"><span class="ce-l">Groupes</span>${[['rouge', 'ROUGE · BOUM', GROUPES[0].c, 'boum'], ['bleu', 'BLEU · TAC', GROUPES[1].c, 'tac'], ...VOIX_C.map((v) => [v.id, v.voy, v.c, v.id])].map(([k, l, c, im]) => `<button class="ce-chg ${reglages.chGr[k] ? 'on' : ''}" style="--c:${c}" data-chg="${k}" aria-pressed="${reglages.chGr[k]}"><span class="ce-img">${geste(im, '#fff7dc')}</span>${l}</button>`).join('')}</div>
          <div class="ce-niveaux"><span class="ce-l">Tonalité</span>${TONS.map(([n, m]) => `<button class="${reglages.tonique === m ? 'on' : ''}" data-ton="${m}">${n}</button>`).join('')}<button class="${reglages.modele ? 'on' : ''}" data-modele="1">${reglages.modele ? 'Modèle chanté : oui' : 'Modèle chanté : non'}</button></div>`,
        fn(pas, t, d) {
          if (pas === 0) this.marques = []; this.marques.push([pas, t, d]); if (this.marques.length > 48) this.marques.shift();
          const p = pas % 8; const mes = Math.floor(pas / 8); const T = reglages.tonique;
          this.evts(pas).forEach((e) => {
            if (e.id === 'rouge') sonne('boum', t, p === 0 ? 0.9 : 0.7);
            else if (e.id === 'bleu') sonne('tac', t, 0.7);
            else if (reglages.modele) chante(e.note, t, e.len * d * 0.94, VOIX_C.indexOf(e.voix), e.ecoute ? 0.09 : 0.13);
          });
          if (mes >= 2 && p === 0 && (mes - 2) % 2 === 0) { const k = Math.floor((mes - 2) / 2) % 4; ACC_C[k].forEach((iv) => joue('piano', T - 12 + iv, { when: t, dur: 16 * d * 0.95, vel: 0.2 })); }
        },
        // La position (en croches) maintenant, d'après l'horloge audio.
        pos() { return posDe(this.marques); },
        dessiner() { dessinerPistes(scene()?.querySelector('.ce-pistes'), this.pistes(), (q) => this.evts(q), this.pos(), (pl) => (this.entree(pl.voix) === Infinity ? '' : 'attendez…')); },
      },
      trou: {
        rendre: () => `<div class="ce-centre"><div class="ce-solo"><p class="ce-solo-t">Le groove…</p><p class="ce-solo-n"></p></div><p class="ce-dis">3 mesures de groove (le moteur des mots), puis <b>1 mesure de silence</b> : un·e volontaire la remplit comme il veut!</p>
          <label class="ce-noms"><span>Les noms (un par ligne, facultatif) :</span><textarea data-c="noms" rows="3" placeholder="Léa&#10;Samuel&#10;…">${esc(reglages.noms)}</textarea></label></div>`,
        fn(pas, t) {
          const mes = Math.floor(pas / 8) % 4; const p = pas % 8;
          if (mes < 3) grp().forEach((g, gi) => { if (gi < 3 && g.pos.includes(p)) sonne(g.son, t, 0.8); });
          if (p === 0) {
            const noms = reglages.noms.split('\n').map((x) => x.trim()).filter(Boolean); const qui = noms.length ? noms[Math.floor(Math.random() * noms.length)] : 'Un·e volontaire!';
            quand(t, () => { const sc = scene(); if (!sc) return; const s = sc.querySelector('.ce-solo'); s.classList.toggle('a-toi', mes === 3); sc.querySelector('.ce-solo-t').textContent = mes === 3 ? 'SOLO!' : mes === 2 ? 'Prépare-toi…' : 'Le groove…'; if (mes === 2) sc.querySelector('.ce-solo-n').textContent = qui; if (mes === 0) sc.querySelector('.ce-solo-n').textContent = ''; });
          }
          if (mes === 3 && p % 2 === 0) quand(t, () => { const n = scene()?.querySelector('.ce-solo-t'); if (n) n.textContent = `SOLO! ${4 - p / 2}`; });
        },
      },
    };

    // Refaire le contenu de l'activité sans couper la musique (réglages changés en jouant).
    function majCorps() { const cp = el.querySelector('.ce-corps'); if (cp) cp.innerHTML = A[act].rendre.call(A[act]); if (!raf) raf = requestAnimationFrame(boucle); }
    function rendre() {
      arreter();
      el.innerHTML = `
        <div class="mod-head"><div><p class="eyebrow">Jouer · Le cercle</p><h1>Un jam pour toute la classe.</h1>
          <p class="muted">Aucun instrument, aucune connaissance : les mains, les doigts, les pieds. Projette cette page, lance une activité : l’app tient le tempo et montre quoi faire.</p></div></div>
        <p class="ce-photo-aide"><b>Vos mains, en photo.</b> Touchez « Photo » sous un geste : un élève le fait, on le photographie, et sa photo remplace le dessin partout. Les photos restent sur cet appareil.</p>
        <div class="ce-sons">${[...Object.keys(SONS).map((k) => [k, SONS[k].mot, SONS[k].c, SONS[k].geste]), ...VOIX_C.map((v) => [v.id, v.voy, v.c, v.id === 'aaa' ? 'la bouche grande ouverte' : v.id === 'ooo' ? 'la bouche ronde' : 'la bouche fermée'])].map(([k, mot, c, g]) => `<div class="ce-son grand" style="--c:${c}"><span class="ce-img">${geste(k, c)}</span><b>${mot}</b><small>${esc(g)}</small><span class="ce-photo-b"><label class="ce-photo">Photo<input type="file" accept="image/*" data-photo="${k}" hidden></label>${photoDe(k) ? `<button data-photo-x="${k}">Dessin</button>` : ''}</span></div>`).join('')}</div>
        <p class="ce-parcours"><b>Première fois?</b> Suivez les numéros, de 1 à 5 : chaque activité prépare la suivante. Le 6 est un cercle de voix seulement.</p>
        <div class="ce-acts" role="tablist">${ACTIVITES.map((a) => `<button role="tab" aria-selected="${a.id === act}" data-act="${a.id}" class="${a.n ? '' : 'variante'}"><b>${a.n ? `<i class="ce-n">${a.n}</i>` : ''}${a.nom}</b><small>${a.but}</small></button>`).join('')}</div>
        <section class="ce-scene" aria-live="off">
          <div class="ce-haut"><b class="ce-titre">${ACTIVITES.find((a) => a.id === act).nom}</b>
            <span class="ce-tempos">${TEMPOS.map(([k, l]) => `<button class="${k === tempo ? 'on' : ''}" data-tempo="${k}">${l}</button>`).join('')}</span>
            <button class="ce-plein" data-c="plein">Plein écran</button></div>
          <div class="ce-corps">${A[act].rendre.call(A[act])}</div>
          <div class="ce-bas"><button class="ce-go" data-c="jouer">Démarrer</button>
            <button class="ce-rec ${prise ? 'rec' : ''}" data-c="rec">${prise ? 'Fin de l’enregistrement' : 'Enregistrer la classe'}</button>${enreg ? `<button class="ce-ecoute" data-c="ecoute">${ecoute ? 'Arrêter l’écoute' : 'Réécouter'}</button><button class="ce-ecoute" data-c="dl" >Télécharger</button>` : ''}</div>
        </section>
        ${act === 'mots' ? `<details class="panel ce-mots-edit"><summary>Changer les mots des groupes (beat ${GROOVES[reglages.groove].nom})</summary>${grp().map((g, gi) => `<label style="--c:${g.c}"><b>${g.nom}</b> <input class="input" data-mot="${gi}" value="${esc(motDe(gi))}"> <small>${g.pos.length} syllabes</small></label>`).join('')}<p class="muted small">Un mot par battement allumé : le nom de l’école, un plat, une équipe. Le rythme ne change pas.</p></details>` : ''}`;
      majJouer(); if (act === 'chef') A.chef.maj(-1); if (act === 'choeur' || act === 'jam' || act === 'voix') { A.choeur.marques = []; cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); }
    }
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (a) { act = a.dataset.act; store.set('cercleActivite', act); rendre(); return; }
      const tp = e.target.closest('[data-tempo]'); if (tp) { tempo = tp.dataset.tempo; store.set('cercleTempo', tempo); el.querySelectorAll('[data-tempo]').forEach((b) => b.classList.toggle('on', b.dataset.tempo === tempo)); return; }
      const tn = e.target.closest('[data-ton]'); if (tn) { reglages.tonique = +tn.dataset.ton; store.set('cercleTonique', reglages.tonique); el.querySelectorAll('[data-ton]').forEach((b) => b.classList.toggle('on', +b.dataset.ton === reglages.tonique)); return; }
      const nvx = e.target.closest('[data-nvoix]'); if (nvx) { reglages.nVoix = +nvx.dataset.nvoix; store.set('cercleNVoix', reglages.nVoix); rendre(); return; }
      const md = e.target.closest('[data-modele]'); if (md) { reglages.modele = !reglages.modele; store.set('cercleModele', reglages.modele); md.classList.toggle('on', reglages.modele); md.textContent = reglages.modele ? 'Modèle chanté : oui' : 'Modèle chanté : non'; return; }
      const nv = e.target.closest('[data-niveau]'); if (nv) { reglages.niveau = nv.dataset.niveau; store.set('cercleNiveau', reglages.niveau); el.querySelectorAll('[data-niveau]').forEach((b) => b.classList.toggle('on', b.dataset.niveau === reglages.niveau)); return; }
      const gv = e.target.closest('[data-groove]'); if (gv) { reglages.groove = gv.dataset.groove; store.set('cercleGroove', reglages.groove); el.querySelectorAll('[data-groove]').forEach((b) => b.classList.toggle('on', b.dataset.groove === reglages.groove)); if (act === 'chef') { el.querySelector('.ce-chef').innerHTML = A.chef.html(); A.chef.maj(-1); } else if (act === 'mots' && moteur) el.querySelector('.ce-groupes').innerHTML = A.mots.html(); else rendre(); return; }
      const en = e.target.closest('[data-enchainer]'); if (en) { reglages.enchainer = !reglages.enchainer; store.set('cercleEnchainer', reglages.enchainer); en.classList.toggle('on', reglages.enchainer); en.textContent = reglages.enchainer ? 'Le beat change tout seul : oui' : 'Le beat change tout seul : non'; return; }
      const px = e.target.closest('[data-photo-x]'); if (px) { retirerPhoto(px.dataset.photoX); rendre(); return; }
      const ve = e.target.closest('[data-vetape]'); if (ve) { reglages.vEtape = ve.dataset.vetape; store.set('cercleVEtape', reglages.vEtape); const enMarche = !!moteur; majCorps(); if (enMarche) { const ac = A[act]; demarrer((q, t, d) => ac.fn.call(ac, q, t, d)); } return; }
      const vp = e.target.closest('[data-vpart]'); if (vp) { const k = vp.dataset.vpart; reglages.vParts[k] = !reglages.vParts[k]; store.set('cercleVParts', reglages.vParts); majCorps(); return; }
      const vm = e.target.closest('[data-vmodele]'); if (vm) { reglages.vModele = vm.dataset.vmodele; store.set('cercleVModele', reglages.vModele); el.querySelectorAll('[data-vmodele]').forEach((b) => b.classList.toggle('on', b === vm)); return; }
      const vb = e.target.closest('[data-vbourdon]'); if (vb) { reglages.vBourdon = !reglages.vBourdon; store.set('cercleVBourdon', reglages.vBourdon); vb.classList.toggle('on', reglages.vBourdon); vb.textContent = reglages.vBourdon ? 'Bourdon : oui' : 'Bourdon : non'; return; }
      const vs = e.target.closest('[data-vseul]'); if (vs) { // une boucle, seule, une fois (à l'arrêt) : pour l'entendre avant
        const P = PARTIES_V.find((x) => x.id === vs.dataset.vseul); arreter(); try { c.resume(); } catch { /* iOS */ } const d = 60 / bpm() / 2; const t0 = c.currentTime + 0.1; const syl = A.voix.syl(P);
        P.notes.forEach((n) => chante(reglages.tonique + degre(n.d), t0 + n.t * d, n.l * d * 0.92, P.timbre, 0.18));
        const dit = el.querySelector('.ce-v-dit'); if (dit) dit.innerHTML = `<b style="color:${P.c}">${P.nom}</b> : ${syl.slice(0, P.notes.length).map(esc).join(' ')}`; return; }
      const ev = e.target.closest('[data-ecoute-v]'); if (ev) { ecouterNote(ev.dataset.ecouteV); return; }
      const cs = e.target.closest('[data-coeur-son]'); if (cs) { reglages.coeurSon = cs.dataset.coeurSon; if (reglages.coeurRythme.startsWith('g:')) reglages.coeurRythme = 'temps'; store.set('cercleCoeurSon', reglages.coeurSon); store.set('cercleCoeurRythme', reglages.coeurRythme); majCorps(); sonne(reglages.coeurSon, c.currentTime + 0.02); return; }
      const cr = e.target.closest('[data-coeur-r]'); if (cr) { reglages.coeurRythme = cr.dataset.coeurR; store.set('cercleCoeurRythme', reglages.coeurRythme); majCorps(); return; }
      const jp = e.target.closest('[data-jpart]'); if (jp) { reglages.jamPart = jp.dataset.jpart === 'tout' ? null : jp.dataset.jpart === 'mix' ? 'mix' : +jp.dataset.jpart; const enMarche = !!moteur; majCorps(); if (enMarche) { const ac = A[act]; demarrer((q, t, d) => ac.fn.call(ac, q, t, d)); } return; }
      const mx = e.target.closest('[data-mx]'); if (mx) { const k = mx.dataset.mx; reglages.mixJ[k].on = !reglages.mixJ[k].on; if (reglages.mixJ[k].on && !reglages.mixJ[k].vol) reglages.mixJ[k].vol = 1; garderMix(); majCorps(); return; }
      const mp = e.target.closest('[data-mxp]'); if (mp) { const f = PRESETS[mp.dataset.mxp][1]; const avant = JSON.parse(JSON.stringify(reglages.mixJ)); COUCHES.forEach(([k]) => { reglages.mixJ[k] = f(k, avant); }); garderMix(); majCorps(); return; }
      const chg = e.target.closest('[data-chg]'); if (chg) { const k = chg.dataset.chg; reglages.chGr[k] = !reglages.chGr[k]; store.set('cercleChoeurGr', reglages.chGr); chg.classList.toggle('on', reglages.chGr[k]); chg.setAttribute('aria-pressed', reglages.chGr[k]); return; }
      const gr = e.target.closest('[data-gr]'); if (gr) { const k = gr.dataset.gr; const i = +gr.dataset.gi; const l = reglages.grille[k]; reglages.grille[k] = l.includes(i) ? l.filter((x) => x !== i) : [...l, i].sort(); store.set('cercleGrille', reglages.grille); gr.classList.toggle('on'); if (!moteur) sonne(k, c.currentTime + 0.02); return; }
      const am = e.target.closest('[data-amb]'); if (am) { reglages.ambiance = am.dataset.amb; store.set('cercleAmbiance', reglages.ambiance); el.querySelectorAll('[data-amb]').forEach((b) => b.classList.toggle('on', b.dataset.amb === reglages.ambiance)); return; }
      const cg = e.target.closest('[data-chef-g]'); if (cg) { A.chef.toucher('g', cg.dataset.chefG); return; }
      const cc = e.target.closest('[data-chef]'); if (cc) { A.chef.toucher(cc.dataset.chef); return; }
      const c2 = e.target.closest('[data-c]')?.dataset.c; if (!c2) return;
      if (c2 === 'jouer') { if (moteur) arreter(); else { const ac = A[act]; demarrer((p, t, d) => ac.fn.call(ac, p, t, d)); } }
      if (c2 === 'rec') {
        if (prise) { const r = prise.stop(); prise = null; if (r && r.buf.duration > 1) enreg = r.buf; majBas(); return; }
        demarrerPrise().then((pr) => { prise = pr; majBas(); }).catch(() => {}); // l'aide du micro s'affiche toute seule
      }
      if (c2 === 'ecoute' && enreg) {
        if (ecoute) { try { ecoute.stop(); } catch { /* déjà */ } ecoute = null; majBas(); return; }
        arreter(); try { c.resume(); } catch { /* iOS */ } const s = c.createBufferSource(); s.buffer = enreg; const g = c.createGain(); g.gain.value = 1.6; s.connect(g).connect(out()); s.start(); ecoute = s; s.onended = () => { if (ecoute === s) { ecoute = null; majBas(); } }; majBas();
      }
      if (c2 === 'dl' && enreg) { const l = document.createElement('a'); l.href = URL.createObjectURL(enWav(enreg)); l.download = 'Notre cercle.wav'; document.body.append(l); l.click(); l.remove(); }
      if (c2 === 'plein') { const s = el.querySelector('.ce-scene'); if (document.fullscreenElement) document.exitFullscreen?.(); else (s.requestFullscreen || s.webkitRequestFullscreen)?.call(s); }
    });
    el.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-vnote]'); if (!b) return; try { c.resume(); } catch { /* iOS */ }
      chante(reglages.tonique + degre(+b.dataset.vnote), c.currentTime + 0.02, 0.7, 0, 0.24); b.classList.remove('bat'); void b.offsetWidth; b.classList.add('bat');
    });
    el.addEventListener('change', (e) => {
      if (e.target.dataset?.coeurG != null && e.target.value) { reglages.coeurRythme = e.target.value; store.set('cercleCoeurRythme', reglages.coeurRythme); majCorps(); return; }
      const k = e.target.dataset?.photo; const f = e.target.files?.[0]; if (!k || !f) return;
      garderPhoto(k, f).then(() => rendre()).catch(() => {});
    });
    el.addEventListener('input', (e) => {
      if (e.target.dataset.vmots) { store.set(`cercleVMots-${e.target.dataset.vmots}`, e.target.value); return; }
      if (e.target.dataset.mxv) { const k = e.target.dataset.mxv; reglages.mixJ[k].vol = +e.target.value / 100; garderMix(); return; }
      if (e.target.dataset.mot != null) { setMot(+e.target.dataset.mot, e.target.value); }
      if (e.target.dataset.c === 'noms') { reglages.noms = e.target.value; store.set('cercleNoms', e.target.value); }
    });
    const onStop = () => arreter(); addEventListener('diapason:stop', onStop);
    const clavier = (e) => { if (e.target.closest?.('input, textarea')) return; if (e.key === ' ') { e.preventDefault(); el.querySelector('[data-c=jouer]')?.click(); } };
    addEventListener('keydown', clavier);
    rendre(); document.body.classList.add('ce-ouvert');
    return () => { document.body.classList.remove('ce-ouvert'); if (prise) { try { prise.stop(); } catch { /* déjà */ } } try { ecoute?.stop(); } catch { /* déjà */ } fermerMicroPrise(); arreter(); cancelAnimationFrame(raf); removeEventListener('diapason:stop', onStop); removeEventListener('keydown', clavier); };
  },
};
