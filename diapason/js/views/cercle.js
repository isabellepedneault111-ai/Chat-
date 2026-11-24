// Le cercle : un jam de percussion corporelle pour une classe, sans instrument et sans rien savoir de la musique.
// L'app tient le tempo, joue le modèle, compte, et change de partie toute seule ; on la projette, et les élèves
// voient en GROS quoi faire (le geste, le mot, le moment où c'est à eux). Six activités autoportantes :
// le cœur (la pulsation), l'écho, le moteur des mots (4 groupes qui s'empilent), le chef (l'app dirige),
// l'orage (la pluie qui monte et redescend), le chœur, le trou (un solo à tour de rôle).
import { audio, out, drums, click, bass, pluck } from '../audio.js';
import { joue, prechargerSons } from '../sampler.js';
import { store } from '../ui.js';
import { esc } from './carnet.js';
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
const ACTIVITES = [
  { id: 'jam', nom: 'La chanson', but: 'Une vraie chanson : intro, couplet, refrain, liberté, fin. Le beat change à chaque partie.' },
  { id: 'coeur', nom: 'Le cœur', but: 'Tout le monde ensemble, sur le même battement.' },
  { id: 'echo', nom: 'L’écho', but: 'L’app joue un rythme ; la classe le répète.' },
  { id: 'mots', nom: 'Le moteur des mots', but: '4 groupes, 4 mots, un seul groove.' },
  { id: 'chef', nom: 'Le chef', but: 'Une personne dirige : elle fait entrer et sortir les groupes, doux, fort, on fige.' },
  { id: 'orage', nom: 'L’orage', but: 'La pluie monte… puis redescend.' },
  { id: 'choeur', nom: 'Le chœur', but: 'AAA, OOO : des notes tenues, justes, sur les percussions.' },
  { id: 'trou', nom: 'Le trou', but: 'Un solo à tour de rôle, dans le silence.' },
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
    const reglages = { chGr: { rouge: true, bleu: true, aaa: true, ooo: true, mmm: false, ...store.get('cercleChoeurGr', {}) }, grille: store.get('cercleGrille', { boum: [0, 3, 4], tac: [2, 6], tic: [] }), ambiance: store.get('cercleAmbiance', 'chill'), tonique: store.get('cercleTonique', 60), nVoix: store.get('cercleNVoix', 2), modele: store.get('cercleModele', true), mots: GROUPES.map((g) => store.get(`cercleMot-${g.id}`, g.mot)), noms: store.get('cercleNoms', ''), niveau: store.get('cercleNiveau', 'facile') };
    let moteur = null; let file = []; let raf = 0;
    let prise = null; let enreg = null; let ecoute = null; // la classe, enregistrée puis réécoutée
    const bpm = () => TEMPOS.find((x) => x[0] === tempo)[2];

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
        if (k === 'boum') kick(t, v); else if (k === 'tic') hat(t, 0.55 * v); else if (k === 'tac') clap(t, v);
        else if (k === 'tsk') click(t, true); else if (k === 'chhh') chhh(t, v); else if (k === 'pieds') { kick(t, v); kick(t + 0.02, 0.6 * v); }
      } catch { /* son absent */ }
    }

    // ---------- L'horloge : des croches, planifiées un peu à l'avance ; l'affichage suit au bon moment ----------
    const quand = (t, f) => file.push([t, f]);
    function boucle() {
      const now = c.currentTime; file = file.filter(([t, f]) => { if (t <= now) { try { f(); } catch { /* vue fermée */ } return false; } return true; });
      if (act === 'choeur') A.choeur.dessiner();
      raf = requestAnimationFrame(boucle);
    }
    function planifier() { if (!moteur) return; const d = 60 / bpm() / 2; while (moteur.prochain < c.currentTime + 0.3) { moteur.fn(moteur.pas, moteur.prochain, d); moteur.prochain += d; moteur.pas++; } }
    function demarrer(fn) { arreter(); try { c.resume(); } catch { /* iOS */ } moteur = { prochain: c.currentTime + 0.3, pas: 0, fn, timer: setInterval(planifier, 25) }; planifier(); cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); majJouer(); }
    function arreter() { if (moteur) clearInterval(moteur.timer); moteur = null; file = []; majJouer(); }
    function majBas() {
      const r = el.querySelector('[data-c=rec]'); if (!r) return; r.classList.toggle('rec', !!prise); r.textContent = prise ? 'Fin de l’enregistrement' : 'Enregistrer la classe';
      el.querySelectorAll('.ce-ecoute').forEach((x) => x.remove());
      if (enreg) r.insertAdjacentHTML('afterend', `<button class="ce-ecoute" data-c="ecoute">${ecoute ? 'Arrêter l’écoute' : 'Réécouter'}</button><button class="ce-ecoute" data-c="dl" >Télécharger</button>`);
    }
    const majJouer = () => { const b = el.querySelector('[data-c=jouer]'); if (b) { b.textContent = moteur ? 'Arrêter' : 'Démarrer'; b.classList.toggle('stop', !!moteur); } };
    const scene = () => el.querySelector('.ce-scene');
    const carte = (k, grand = false) => `<div class="ce-son ${grand ? 'grand' : ''}" style="--c:${SONS[k].c}"><b>${SONS[k].mot}</b>${grand ? `<small>${esc(SONS[k].geste)}</small>` : ''}</div>`;

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
    }
    function arrondi(x, a, b, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

    // ---------- Les activités ----------
    const A = {
      jam: {
        rendre() {
          const g = reglages.grille;
          return `<div class="ce-jam-plan">${PLAN_JAM.map((x, i) => `<span data-sec="${i}" style="flex:${x.mes}"><b>${x.nom}</b><i></i></span>`).join('')}</div>
          <div class="ce-compte ce-jam-compte">${[1, 2, 3, 4].map((n) => `<span>${n}</span>`).join('')}</div>
          <p class="ce-phase ce-jam-titre">Prêts?</p>
          <div class="ce-ligne ce-jam-ligne">${[...Array(8)].map((_, i) => `<div class="ce-case ${i % 2 ? 'et' : ''}" data-i="${i}"></div>`).join('')}</div>
          <p class="ce-dis ce-jam-dit">L’app joue le groupe. Vous, vous êtes la batterie.</p>
          <details class="ce-jam-ed" open><summary>Le beat de la classe (le couplet) : touchez les cases pour l’inventer</summary>
            ${['boum', 'tac', 'tic'].map((k) => `<div class="ce-jam-r" style="--c:${SONS[k].c}"><b>${SONS[k].mot}</b>${[...Array(8)].map((_, i) => `<button class="${g[k].includes(i) ? 'on' : ''} ${i % 2 ? 'et' : ''}" data-gr="${k}" data-gi="${i}" aria-label="${SONS[k].mot} sur ${i % 2 ? 'le et' : `le ${i / 2 + 1}`}">${i % 2 ? '·' : i / 2 + 1}</button>`).join('')}</div>`).join('')}
          </details>
          <div class="ce-niveaux"><span class="ce-l">Ambiance</span>${Object.entries(AMBIANCES).map(([k, a]) => `<button class="${reglages.ambiance === k ? 'on' : ''}" data-amb="${k}">${a.nom}</button>`).join('')}</div>`;
        },
        // Ce que la classe joue maintenant, case par case.
        partition(sec, m) {
          const id = PLAN_JAM[sec].id; const g = reglages.grille;
          if (id === 'intro') return Array(8).fill(null).map((_, i) => (i === 0 ? [['ÉCOUTEZ', '#6b6455']] : []));
          if (id === 'couplet') return [...Array(8)].map((_, i) => ['boum', 'tac', 'tic'].filter((k) => g[k].includes(i)).map((k) => [SONS[k].mot, SONS[k].c]));
          if (id === 'refrain') return REFRAIN.map((k) => (k ? [[SONS[k].mot, SONS[k].c]] : []));
          if (id === 'libre') return [...Array(8)].map((_, i) => (i === 0 ? [['1 !', '#f1cf4e']] : []));
          if (id === 'fin') return m === 0 ? REFRAIN.map((k) => (k ? [[SONS[k].mot, SONS[k].c]] : [])) : [...Array(8)].map((_, i) => (i === 0 ? [['HÉ!', '#e5452c']] : []));
          return [];
        },
        fn(pas, t, d) {
          const mes = Math.floor(pas / 8); const p = pas % 8;
          if (mes >= TOTAL_JAM) { if (p === 0) quand(t, () => { arreter(); const sc = scene(); if (sc) { sc.querySelector('.ce-jam-titre').textContent = 'Bravo!'; sc.querySelector('.ce-jam-dit').textContent = 'Encore? Changez le beat de la classe ou l’ambiance, et Démarrer.'; } }); return; }
          let sec = 0; DEBUTS_JAM.forEach((x, i) => { if (mes >= x) sec = i; }); const S = PLAN_JAM[sec]; const m = mes - DEBUTS_JAM[sec];
          const amb = AMBIANCES[reglages.ambiance] || AMBIANCES.chill; const k4 = mes % 4; const M = 8 * d;
          const kick = drums.kickOrigine || drums.kick; const snare = drums.snareOrigine || drums.snare; const hat = drums.hatOrigine || drums.hat; const clap = drums.clapOrigine || drums.clap;
          // La batterie de l'app : elle change à chaque partie, avec un roulement avant chaque nouvelle phrase.
          const fin = S.id === 'fin' && m === 1;
          if (fin) { if (p === 0) { kick(t, 1); clap(t, 1); snare(t, 0.8); bass(hz(amb.basse[0]), t, M * 0.9); amb.acc[0].forEach((n) => { if (!joue('rhodes', n, { when: t, dur: M, vel: 0.5 })) pluck(hz(n), { when: t, dur: M }); }); } }
          else {
            const B = BEATS[S.id]; const roule = (S.id === 'couplet' || S.id === 'refrain' || S.id === 'fin') && (m % 4 === 3 || (S.id === 'fin' && m === 0)) && p >= 4;
            if (B.k?.includes(p)) kick(t, S.id === 'libre' ? 0.55 : 0.7);
            if (roule) { snare(t, 0.35 + 0.12 * (p - 4)); if (p >= 6) snare(t + d / 2, 0.45 + 0.1 * (p - 6)); }
            else { if (B.s?.includes(p)) snare(t, 0.5); if (B.c?.includes(p)) clap(t, 0.45); if (B.h?.includes(p)) hat(t, S.id === 'couplet' ? (p % 2 ? 0.18 : 0.28) : 0.3); }
            // La basse et les accords : une progression de 4 accords, une mesure chacun.
            const bn = amb.basse[k4];
            if (S.id === 'couplet' && B.k.includes(p)) bass(hz(bn), t, d * 1.6);
            if ((S.id === 'refrain' || S.id === 'fin') && p % 2 === 0) bass(hz(bn + (p === 2 || p === 6 ? 12 : 0)), t, d * 1.5);
            if (S.id === 'libre' && p === 0) bass(hz(bn), t, M * 0.9);
            const acc = amb.acc[k4];
            const jouerAcc = (dur, vel) => acc.forEach((n, j) => { if (!joue('rhodes', n, { when: t + j * 0.008, dur, vel })) pluck(hz(n), { when: t, dur, gain: 0.12 }); });
            if ((S.id === 'intro' || S.id === 'couplet' || S.id === 'libre') && p === 0) jouerAcc(M * 0.95, S.id === 'libre' ? 0.3 : 0.4);
            if ((S.id === 'refrain' || S.id === 'fin') && (p === 0 || p === 3 || p === 6)) jouerAcc(d * 1.4, 0.45);
          }
          // L'écran
          quand(t, () => {
            const sc = scene(); if (!sc) return;
            if (p === 0) {
              const part = this.partition(sec, m);
              sc.querySelectorAll('.ce-jam-ligne .ce-case').forEach((x, i) => { x.innerHTML = part[i].map(([mot, c]) => `<b style="--c:${c}">${mot}</b>`).join(''); });
              sc.querySelectorAll('.ce-jam-plan span').forEach((x, i) => { x.classList.toggle('on', i === sec); x.classList.toggle('fait', i < sec); x.querySelector('i').style.width = i < sec ? '100%' : i === sec ? `${((m + 1) / S.mes) * 100}%` : '0%'; });
              const avant = m === S.mes - 1 && PLAN_JAM[sec + 1];
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
        rendre: () => `<div class="ce-centre"><div class="ce-rond" style="--c:${SONS.boum.c}"><b>BOUM</b></div><p class="ce-compte"><span>1</span><span>2</span><span>3</span><span>4</span></p><p class="ce-dis">Main à plat sur le bureau, <b>avec le rond</b>.</p></div>`,
        fn: (pas, t) => { if (pas % 2) return; const temps = (pas / 2) % 4; sonne('boum', t, temps === 0 ? 1 : 0.75); quand(t, () => { const r = scene()?.querySelector('.ce-rond'); if (r) { r.classList.remove('bat'); void r.offsetWidth; r.classList.add('bat'); } scene()?.querySelectorAll('.ce-compte span').forEach((s, i) => s.classList.toggle('on', i === temps)); }); },
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
          if (i === 0) { this.motif = this.nouveau(); const m = this.motif; quand(t, () => { const cs = scene()?.querySelectorAll('.ce-case'); cs?.forEach((x, n) => { x.innerHTML = m[n] ? `<b style="--c:${SONS[m[n]].c}">${SONS[m[n]].mot}</b>` : ''; }); }); }
          const s = this.motif?.[k];
          if (phase === 'ecoute' && s) sonne(s, t); if (phase === 'vous' && k % 2 === 0) sonne('tic', t, 0.35); // pendant « À vous », juste le tempo, tout doux
          quand(t, () => { const sc = scene(); if (!sc) return; const ph = sc.querySelector('.ce-phase'); if (k === 0) { ph.textContent = phase === 'ecoute' ? 'ÉCOUTEZ' : 'À VOUS!'; ph.classList.toggle('vous', phase === 'vous'); } sc.querySelectorAll('.ce-case').forEach((x, n) => x.classList.toggle('on', n === k)); });
        },
      },
      mots: {
        rendre: () => `<div class="ce-groupes">${GROUPES.map((g, gi) => { const syl = reglages.mots[gi].split(/[\s-]+/).filter(Boolean); return `<div class="ce-g" data-g="${gi}" style="--c:${g.c}"><div class="ce-g-t"><b>${g.nom}</b>${carte(g.son)}</div><div class="ce-g-l">${[...Array(8)].map((_, p) => { const n = g.pos.indexOf(p); return `<span class="${n >= 0 ? 'joue' : ''}" data-p="${p}">${n >= 0 ? esc(syl[n % Math.max(1, syl.length)] || '•') : ''}</span>`; }).join('')}</div></div>`; }).join('')}</div>
          <p class="ce-dis ce-entre">Le groupe <b>ROUGE</b> commence. Un nouveau groupe entre toutes les 4 mesures.</p>`,
        actifs: 1,
        fn(pas, t) {
          const mes = Math.floor(pas / 8); const p = pas % 8; if (pas === 0) this.actifs = 1;
          if (p === 0 && mes > 0 && mes % 4 === 0 && this.actifs < GROUPES.length) this.actifs += 1;
          const n = this.actifs; const avant = p === 0 && mes % 4 === 3 && n < GROUPES.length; // la mesure d'avant : on annonce
          GROUPES.slice(0, n).forEach((g) => { if (g.pos.includes(p)) sonne(g.son, t, g.son === 'boum' && p === 0 ? 1 : 0.8); });
          quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelectorAll('.ce-g').forEach((x, gi) => { x.classList.toggle('actif', gi < n); x.querySelectorAll('span[data-p]').forEach((s) => s.classList.toggle('on', +s.dataset.p === p && gi < n)); });
            const e = sc.querySelector('.ce-entre'); if (p === 0) e.innerHTML = avant ? `Groupe <b style="color:${GROUPES[n].c}">${GROUPES[n].nom}</b> : à vous dans 4 temps!` : n < GROUPES.length ? `${GROUPES.slice(0, n).map((g) => `<b style="color:${g.c}">${g.nom}</b>`).join(' + ')}` : 'TOUT LE MONDE! Tenez le groove.'; });
        },
      },
      // Le chef : une personne dirige (le prof, puis un élève). Elle touche un groupe pour le faire entrer ou sortir,
      // choisit doux ou fort, ou fige tout le monde. Rien au hasard : chaque changement arrive au prochain temps,
      // annoncé à l'écran, et l'app joue le rythme des groupes allumés comme modèle.
      chef: {
        voulu: new Set([0]), actuel: new Set([0]), nuance: 'normal', nuanceActu: 'normal', fige: false, figeActu: false,
        rendre() {
          return `<div class="ce-compte ce-chef-compte">${[1, 2, 3, 4].map((n) => `<span>${n}</span>`).join('')}</div>
          <div class="ce-groupes ce-chef">${GROUPES.map((g, gi) => { const syl = reglages.mots[gi].split(/[\s-]+/).filter(Boolean); return `<button class="ce-g ce-chef-g" data-chef-g="${gi}" style="--c:${g.c}"><span class="ce-g-t"><b>${g.nom}</b><span class="ce-chef-etat"></span></span><span class="ce-g-l">${[...Array(8)].map((_, p) => { const n = g.pos.indexOf(p); return `<span class="${n >= 0 ? 'joue' : ''}" data-p="${p}">${n >= 0 ? esc(syl[n % Math.max(1, syl.length)] || '•') : ''}</span>`; }).join('')}</span></button>`; }).join('')}</div>
          <div class="ce-fige-msg" hidden><b>ON FIGE</b><span>Personne ne bouge. Les yeux sur le chef.</span></div>
          <div class="ce-chef-ctrl"><button data-chef="tous">Tout le monde</button><button data-chef="personne">Personne</button><button data-chef="doux">Doux</button><button data-chef="normal">Normal</button><button data-chef="fort">Fort</button><button class="ce-chef-fige" data-chef="fige">On fige</button></div>
          <p class="ce-dis ce-chef-dis">Le chef touche un groupe pour le faire <b>entrer</b> ou <b>sortir</b>. Touche encore pour défaire.</p>`;
        },
        toucher(quoi, gi) {
          if (quoi === 'g') { if (this.fige) this.fige = false; if (this.voulu.has(gi)) this.voulu.delete(gi); else this.voulu.add(gi); }
          if (quoi === 'tous') { this.fige = false; this.voulu = new Set([0, 1, 2, 3]); }
          if (quoi === 'personne') { this.fige = false; this.voulu = new Set(); }
          if (quoi === 'doux' || quoi === 'normal' || quoi === 'fort') this.nuance = quoi;
          if (quoi === 'fige') this.fige = !this.fige;
          if (!moteur) this.appliquer(); // à l'arrêt : tout de suite
          this.maj(-1);
        },
        appliquer() { this.actuel = new Set(this.voulu); this.nuanceActu = this.nuance; this.figeActu = this.fige; },
        maj(p) {
          const sc = scene(); if (!sc) return;
          sc.querySelectorAll('.ce-chef-g').forEach((b) => {
            const gi = +b.dataset.chefG; const on = this.actuel.has(gi) && !this.figeActu; const veut = this.voulu.has(gi) && !this.fige;
            b.classList.toggle('actif', on); b.classList.toggle('entre', !on && veut); b.classList.toggle('sort', on && !veut);
            b.querySelector('.ce-chef-etat').textContent = on && !veut ? 'sort…' : !on && veut ? 'entre…' : '';
            b.querySelectorAll('.ce-g-l span').forEach((x) => x.classList.toggle('on', on && +x.dataset.p === p));
          });
          sc.querySelectorAll('[data-chef]').forEach((b) => { const k = b.dataset.chef; b.classList.toggle('on', k === this.nuance || (k === 'fige' && this.fige) || (k === 'tous' && this.voulu.size === 4 && !this.fige) || (k === 'personne' && this.voulu.size === 0 && !this.fige)); });
          sc.querySelector('.ce-chef-fige').textContent = this.fige ? 'On repart' : 'On fige';
          sc.querySelector('.ce-fige-msg').hidden = !this.figeActu;
          sc.querySelector('.ce-chef').classList.toggle('doux', this.nuanceActu === 'doux'); sc.querySelector('.ce-chef').classList.toggle('fort', this.nuanceActu === 'fort');
          const changement = !this.figeActu !== !this.fige || this.nuance !== this.nuanceActu || [...this.voulu].sort().join() !== [...this.actuel].sort().join();
          sc.querySelector('.ce-chef-dis').innerHTML = changement && moteur ? 'Ça change au prochain temps…' : this.figeActu ? 'Le chef touche <b>On repart</b> : tout le monde reprend.' : 'Le chef touche un groupe pour le faire <b>entrer</b> ou <b>sortir</b>. Touche encore pour défaire.';
        },
        fn(pas, t) {
          const p = pas % 8; if (p % 2 === 0) this.appliquer(); // au prochain temps : la classe voit l'effet tout de suite
          const v = { doux: 0.35, normal: 0.8, fort: 1.15 }[this.nuanceActu];
          if (!this.figeActu) this.actuel.forEach((gi) => { const g = GROUPES[gi]; if (g.pos.includes(p)) sonne(g.son, t, v); });
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
          if (g.rouge) L.push({ id: 'rouge', nom: 'ROUGE', mot: 'BOUM', geste: 'main à plat', c: GROUPES[0].c });
          if (g.bleu) L.push({ id: 'bleu', nom: 'BLEU', mot: 'TAC', geste: 'taper des mains', c: GROUPES[1].c });
          VOIX_C.forEach((v) => { if (g[v.id]) L.push({ id: v.id, nom: 'Groupe', mot: v.voy, c: v.c, voix: v }); });
          return L;
        },
        // Les voix entrent une à une : la 1re après 2 mesures d'intro, puis une de plus toutes les 8 mesures.
        entree(v) { const i = VOIX_C.filter((x) => reglages.chGr[x.id]).indexOf(v); return i < 0 ? Infinity : (2 + 8 * i) * 8; },
        evts(pas) {
          const r = []; if (pas < 0) return r; const p = pas % 8; const mes = Math.floor(pas / 8); const g = reglages.chGr; const T = reglages.tonique;
          if (g.rouge && p % 2 === 0) r.push({ id: 'rouge', len: 1, debut: pas });
          if (g.bleu && (p === 2 || p === 6)) r.push({ id: 'bleu', len: 1, debut: pas });
          const v0 = VOIX_C.find((x) => g[x.id]);
          if (mes === 1 && p === 0 && v0) r.push({ id: v0.id, len: 8, debut: pas, note: T + v0.notes[0], ecoute: true, voix: v0 });
          if (mes >= 2 && p === 0 && (mes - 2) % 2 === 0) { const k = Math.floor((mes - 2) / 2) % 4; VOIX_C.forEach((v) => { if (g[v.id] && pas >= this.entree(v)) r.push({ id: v.id, len: 16, debut: pas, note: T + v.notes[k], k, voix: v }); }); }
          return r;
        },
        rendre: () => `<canvas class="ce-pistes" aria-label="Les pistes des groupes : les sons arrivent vers la ligne"></canvas>
          <p class="ce-dis ce-c-dis">Quand un bloc touche la ligne : <b>à vous!</b> Les voix tiennent la note tant que la barre passe.</p>
          <div class="ce-niveaux"><span class="ce-l">Groupes</span>${[['rouge', 'ROUGE · BOUM', GROUPES[0].c], ['bleu', 'BLEU · TAC', GROUPES[1].c], ...VOIX_C.map((v) => [v.id, v.voy, v.c])].map(([k, l, c]) => `<button class="ce-chg ${reglages.chGr[k] ? 'on' : ''}" style="--c:${c}" data-chg="${k}" aria-pressed="${reglages.chGr[k]}">${l}</button>`).join('')}</div>
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
        pos() {
          if (!moteur || !this.marques.length) return -6;
          const now = c.currentTime; let m = this.marques[0]; this.marques.forEach((x) => { if (x[1] <= now) m = x; });
          return m[0] + (now - m[1]) / m[2];
        },
        dessiner() {
          const cv = scene()?.querySelector('.ce-pistes'); if (!cv) return;
          const L = this.pistes(); const dpr = window.devicePixelRatio || 1; const W = cv.clientWidth; const hP = W < 640 ? 64 : Math.min(110, Math.max(70, (innerHeight * 0.55) / Math.max(1, L.length)));
          const H = Math.max(1, L.length) * hP + 26; if (cv.height !== Math.round(H * dpr) || cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`; }
          const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
          const police = getComputedStyle(document.documentElement).getPropertyValue('--display') || 'sans-serif';
          const pos = this.pos(); const gauche = W < 640 ? 92 : Math.min(260, W * 0.2); const ligne = gauche + 18; const ppc = (W - ligne - 6) / 18; const X = (pas) => ligne + (pas - pos) * ppc;
          // Les temps : une ligne par temps, plus forte sur le 1 ; le compte en haut.
          for (let b = Math.ceil(pos / 2) * 2; X(b) < W; b += 2) { const xx = X(b); const un = b % 8 === 0; x.fillStyle = un ? '#5a5346' : '#2e2a23'; x.fillRect(xx, 22, un ? 2 : 1, H - 22); x.fillStyle = un ? '#f1cf4e' : '#a39b87'; x.font = `800 ${un ? 15 : 12}px ${police}`; x.textAlign = 'center'; x.fillText(String((((b / 2) % 4) + 4) % 4 + 1), xx, 16); }
          const evs = []; for (let q = Math.floor(pos) - 16; q < pos + 19; q++) evs.push(...this.evts(q));
          L.forEach((pl, i) => {
            const y0 = 22 + i * hP; x.fillStyle = i % 2 ? '#1b1915' : '#201d18'; x.fillRect(0, y0, W, hP - 4);
            const mes = evs.filter((e) => e.id === pl.id); const ici = mes.find((e) => e.debut <= pos && pos < e.debut + e.len);
            // Les blocs et les barres
            const lo = pl.voix ? Math.min(...pl.voix.notes) : 0; const hi = pl.voix ? Math.max(...pl.voix.notes) : 1;
            mes.forEach((e) => {
              const xa = Math.max(ligne, X(e.debut)); const xb = X(e.debut + e.len) - 3; if (xb <= ligne || xa > W) return;
              const actif = e === ici; x.globalAlpha = e.ecoute ? 0.45 : 1;
              if (!pl.voix) {
                const bh = hP * 0.62; const yy = y0 + (hP - 4 - bh) / 2; x.fillStyle = actif ? '#fff7dc' : pl.c; arrondi(x, xa, yy, Math.max(6, xb - xa), bh, 8); x.fill();
                if (xb - xa > 34) { x.fillStyle = '#14120f'; x.font = `900 ${Math.round(Math.min(bh * 0.42, (xb - xa - 8) / 3.4))}px ${police}`; x.textAlign = 'left'; x.fillText(pl.mot, xa + 4, yy + bh * 0.64); }
              } else {
                const bh = hP * 0.42; const haut = hi === lo ? 0.5 : (e.voix.notes[e.k ?? 0] - lo) / (hi - lo); const yy = y0 + 4 + (hP - 12 - bh) * (1 - haut);
                x.fillStyle = actif ? pl.c : `${pl.c}99`; arrondi(x, xa, yy, Math.max(6, xb - xa), bh, 10); x.fill();
                if (actif) { x.fillStyle = 'rgba(255,247,220,.35)'; arrondi(x, xa, yy, Math.max(6, Math.min(xb - xa, (pos - e.debut) / e.len * (e.len * ppc))), bh, 10); x.fill(); }
                if (xb - xa > 60) { x.fillStyle = '#14120f'; x.font = `900 ${Math.round(bh * 0.6)}px ${police}`; x.textAlign = 'left'; x.fillText(`${e.ecoute ? 'écoutez ' : ''}${NOTE_FR[((e.note % 12) + 12) % 12]}`, xa + 8, yy + bh * 0.72); }
              }
              x.globalAlpha = 1;
            });
            // L'étiquette : le groupe, quoi faire, et le décompte
            const flash = ici && !ici.ecoute && (pl.voix ? pos - ici.debut < 1 : true); // le moment de jouer : l'étiquette s'allume
            x.fillStyle = flash ? pl.c : '#14120f'; x.fillRect(0, y0, gauche, hP - 4); x.fillStyle = pl.c; x.fillRect(0, y0, 6, hP - 4);
            x.textAlign = 'left'; x.fillStyle = flash ? '#14120f' : pl.c; x.font = `900 ${Math.round(hP * (W < 640 ? 0.3 : 0.34))}px ${police}`; x.fillText(pl.mot, 14, y0 + hP * 0.42);
            let etat = pl.geste || ''; let fort = false;
            if (pl.voix) {
              const proch = mes.filter((e) => e.debut > pos && !e.ecoute).sort((a, b) => a.debut - b.debut)[0];
              if (ici && !ici.ecoute) { etat = `chantez : ${NOTE_FR[((ici.note % 12) + 12) % 12]}`; fort = true; }
              else if (proch && proch.debut - pos <= 8) { etat = `à vous dans ${Math.max(1, Math.ceil((proch.debut - pos) / 2))}`; fort = true; }
              else if (ici?.ecoute) etat = 'écoutez la note';
              else etat = this.entree(pl.voix) === Infinity ? '' : 'attendez…';
            }
            x.fillStyle = flash ? '#14120f' : fort ? '#fff7dc' : '#a39b87'; x.font = `800 ${Math.round(hP * (W < 640 ? 0.17 : 0.19))}px ${police}`; x.fillText(etat, 14, y0 + hP * 0.75);
          });
          // La ligne : c'est maintenant.
          x.fillStyle = '#fff7dc'; x.fillRect(ligne - 2, 18, 4, H - 18);
        },
      },
      trou: {
        rendre: () => `<div class="ce-centre"><div class="ce-solo"><p class="ce-solo-t">Le groove…</p><p class="ce-solo-n"></p></div><p class="ce-dis">3 mesures de groove (le moteur des mots), puis <b>1 mesure de silence</b> : un·e volontaire la remplit comme il veut!</p>
          <label class="ce-noms"><span>Les noms (un par ligne, facultatif) :</span><textarea data-c="noms" rows="3" placeholder="Léa&#10;Samuel&#10;…">${esc(reglages.noms)}</textarea></label></div>`,
        fn(pas, t) {
          const mes = Math.floor(pas / 8) % 4; const p = pas % 8;
          if (mes < 3) GROUPES.forEach((g, gi) => { if (gi < 3 && g.pos.includes(p)) sonne(g.son, t, 0.8); });
          if (p === 0) {
            const noms = reglages.noms.split('\n').map((x) => x.trim()).filter(Boolean); const qui = noms.length ? noms[Math.floor(Math.random() * noms.length)] : 'Un·e volontaire!';
            quand(t, () => { const sc = scene(); if (!sc) return; const s = sc.querySelector('.ce-solo'); s.classList.toggle('a-toi', mes === 3); sc.querySelector('.ce-solo-t').textContent = mes === 3 ? 'SOLO!' : mes === 2 ? 'Prépare-toi…' : 'Le groove…'; if (mes === 2) sc.querySelector('.ce-solo-n').textContent = qui; if (mes === 0) sc.querySelector('.ce-solo-n').textContent = ''; });
          }
          if (mes === 3 && p % 2 === 0) quand(t, () => { const n = scene()?.querySelector('.ce-solo-t'); if (n) n.textContent = `SOLO! ${4 - p / 2}`; });
        },
      },
    };

    function rendre() {
      arreter();
      el.innerHTML = `
        <div class="mod-head"><div><p class="eyebrow">Jouer · Le cercle</p><h1>Un jam pour toute la classe.</h1>
          <p class="muted">Aucun instrument, aucune connaissance : les mains, les doigts, les pieds. Projette cette page, lance une activité : l’app tient le tempo et montre quoi faire.</p></div></div>
        <div class="ce-sons">${Object.keys(SONS).map((k) => carte(k, true)).join('')}</div>
        <div class="ce-acts" role="tablist">${ACTIVITES.map((a) => `<button role="tab" aria-selected="${a.id === act}" data-act="${a.id}"><b>${a.nom}</b><small>${a.but}</small></button>`).join('')}</div>
        <section class="ce-scene" aria-live="off">
          <div class="ce-haut"><b class="ce-titre">${ACTIVITES.find((a) => a.id === act).nom}</b>
            <span class="ce-tempos">${TEMPOS.map(([k, l]) => `<button class="${k === tempo ? 'on' : ''}" data-tempo="${k}">${l}</button>`).join('')}</span>
            <button class="ce-plein" data-c="plein">Plein écran</button></div>
          <div class="ce-corps">${A[act].rendre.call(A[act])}</div>
          <div class="ce-bas"><button class="ce-go" data-c="jouer">Démarrer</button>
            <button class="ce-rec ${prise ? 'rec' : ''}" data-c="rec">${prise ? 'Fin de l’enregistrement' : 'Enregistrer la classe'}</button>${enreg ? `<button class="ce-ecoute" data-c="ecoute">${ecoute ? 'Arrêter l’écoute' : 'Réécouter'}</button><button class="ce-ecoute" data-c="dl" >Télécharger</button>` : ''}</div>
        </section>
        ${act === 'mots' ? `<details class="panel ce-mots-edit"><summary>Changer les mots des groupes</summary>${GROUPES.map((g, gi) => `<label style="--c:${g.c}"><b>${g.nom}</b> <input class="input" data-mot="${gi}" value="${esc(reglages.mots[gi])}"> <small>${g.pos.length} syllabes</small></label>`).join('')}<p class="muted small">Un mot par battement allumé : le nom de l’école, un plat, une équipe. Le rythme ne change pas.</p></details>` : ''}`;
      majJouer(); if (act === 'chef') A.chef.maj(-1); if (act === 'choeur') { A.choeur.marques = []; cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); }
    }
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (a) { act = a.dataset.act; store.set('cercleActivite', act); rendre(); return; }
      const tp = e.target.closest('[data-tempo]'); if (tp) { tempo = tp.dataset.tempo; store.set('cercleTempo', tempo); el.querySelectorAll('[data-tempo]').forEach((b) => b.classList.toggle('on', b.dataset.tempo === tempo)); return; }
      const tn = e.target.closest('[data-ton]'); if (tn) { reglages.tonique = +tn.dataset.ton; store.set('cercleTonique', reglages.tonique); el.querySelectorAll('[data-ton]').forEach((b) => b.classList.toggle('on', +b.dataset.ton === reglages.tonique)); return; }
      const nvx = e.target.closest('[data-nvoix]'); if (nvx) { reglages.nVoix = +nvx.dataset.nvoix; store.set('cercleNVoix', reglages.nVoix); rendre(); return; }
      const md = e.target.closest('[data-modele]'); if (md) { reglages.modele = !reglages.modele; store.set('cercleModele', reglages.modele); md.classList.toggle('on', reglages.modele); md.textContent = reglages.modele ? 'Modèle chanté : oui' : 'Modèle chanté : non'; return; }
      const nv = e.target.closest('[data-niveau]'); if (nv) { reglages.niveau = nv.dataset.niveau; store.set('cercleNiveau', reglages.niveau); el.querySelectorAll('[data-niveau]').forEach((b) => b.classList.toggle('on', b.dataset.niveau === reglages.niveau)); return; }
      const chg = e.target.closest('[data-chg]'); if (chg) { const k = chg.dataset.chg; reglages.chGr[k] = !reglages.chGr[k]; store.set('cercleChoeurGr', reglages.chGr); chg.classList.toggle('on', reglages.chGr[k]); chg.setAttribute('aria-pressed', reglages.chGr[k]); return; }
      const gr = e.target.closest('[data-gr]'); if (gr) { const k = gr.dataset.gr; const i = +gr.dataset.gi; const l = reglages.grille[k]; reglages.grille[k] = l.includes(i) ? l.filter((x) => x !== i) : [...l, i].sort(); store.set('cercleGrille', reglages.grille); gr.classList.toggle('on'); if (!moteur) sonne(k, c.currentTime + 0.02); return; }
      const am = e.target.closest('[data-amb]'); if (am) { reglages.ambiance = am.dataset.amb; store.set('cercleAmbiance', reglages.ambiance); el.querySelectorAll('[data-amb]').forEach((b) => b.classList.toggle('on', b.dataset.amb === reglages.ambiance)); return; }
      const cg = e.target.closest('[data-chef-g]'); if (cg) { A.chef.toucher('g', +cg.dataset.chefG); return; }
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
    el.addEventListener('input', (e) => {
      if (e.target.dataset.mot != null) { const gi = +e.target.dataset.mot; reglages.mots[gi] = e.target.value; store.set(`cercleMot-${GROUPES[gi].id}`, e.target.value); }
      if (e.target.dataset.c === 'noms') { reglages.noms = e.target.value; store.set('cercleNoms', e.target.value); }
    });
    const onStop = () => arreter(); addEventListener('diapason:stop', onStop);
    const clavier = (e) => { if (e.target.closest?.('input, textarea')) return; if (e.key === ' ') { e.preventDefault(); el.querySelector('[data-c=jouer]')?.click(); } };
    addEventListener('keydown', clavier);
    rendre(); document.body.classList.add('ce-ouvert');
    return () => { document.body.classList.remove('ce-ouvert'); if (prise) { try { prise.stop(); } catch { /* déjà */ } } try { ecoute?.stop(); } catch { /* déjà */ } fermerMicroPrise(); arreter(); cancelAnimationFrame(raf); removeEventListener('diapason:stop', onStop); removeEventListener('keydown', clavier); };
  },
};
