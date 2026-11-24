// Le cercle : un jam de percussion corporelle pour une classe, sans instrument et sans rien savoir de la musique.
// L'app tient le tempo, joue le modèle, compte, et change de partie toute seule ; on la projette, et les élèves
// voient en GROS quoi faire (le geste, le mot, le moment où c'est à eux). Six activités autoportantes :
// le cœur (la pulsation), l'écho, le moteur des mots (4 groupes qui s'empilent), le chef (l'app dirige),
// l'orage (la pluie qui monte et redescend), le trou (un solo à tour de rôle). Et un ✋ FREEZE toujours à portée.
import { audio, out, drums, click } from '../audio.js';
import { joue, prechargerSons } from '../sampler.js';
import { store } from '../ui.js';
import { esc } from './carnet.js';
import { demarrerPrise, enWav, fermerMicroPrise } from '../prise.js';

// Les six sons du corps : un geste, un mot à dire, une couleur, et le son que l'app joue comme modèle.
const SONS = {
  boum: { ico: '🖐', mot: 'BOUM', geste: 'la main à plat sur le bureau', c: '#e5452c' },
  tic: { ico: '☝️', mot: 'TIC', geste: 'le bout des doigts sur le bureau', c: '#f1cf4e' },
  tac: { ico: '👏', mot: 'TAC', geste: 'taper des mains', c: '#3d6bff' },
  tsk: { ico: '🫰', mot: 'TSK', geste: 'claquer des doigts (ou « tsk » avec la bouche)', c: '#b25cff' },
  chhh: { ico: '🤲', mot: 'CHHH', geste: 'frotter les mains', c: '#3fbf7f' },
  pieds: { ico: '🦶', mot: 'BOUM', geste: 'les pieds au sol', c: '#ff8a3d' },
};
// Le moteur des mots : 4 groupes, 4 rythmes qui s'emboîtent ; les mots se changent, le rythme reste.
const GROUPES = [
  { id: 'rouge', nom: 'ROUGE', c: '#e5452c', son: 'boum', pos: [0, 2, 4, 6], mot: 'PIZ ZA PIZ ZA' },
  { id: 'bleu', nom: 'BLEU', c: '#3d6bff', son: 'tac', pos: [2, 6], mot: 'HOP HOP' },
  { id: 'jaune', nom: 'JAUNE', c: '#f1cf4e', son: 'tic', pos: [0, 1, 2, 3, 4, 5, 6, 7], mot: 'MA CA RO NI MA CA RO NI' },
  { id: 'violet', nom: 'VIOLET', c: '#b25cff', son: 'tsk', pos: [3, 4], mot: 'POU TINE' },
];
const ACTIVITES = [
  { id: 'coeur', ico: '❤️', nom: 'Le cœur', but: 'Tout le monde ensemble, sur le même battement.' },
  { id: 'echo', ico: '🔁', nom: 'L’écho', but: 'L’app joue un rythme ; la classe le répète.' },
  { id: 'mots', ico: '🍕', nom: 'Le moteur des mots', but: '4 groupes, 4 mots, un seul groove.' },
  { id: 'chef', ico: '🎬', nom: 'Le chef', but: 'L’app dirige : qui joue, fort, doux, FREEZE.' },
  { id: 'orage', ico: '⛈️', nom: 'L’orage', but: 'La pluie monte… puis redescend.' },
  { id: 'choeur', ico: '🎶', nom: 'Le chœur', but: 'AAA, OOO : des notes tenues, justes, sur les percussions.' },
  { id: 'trou', ico: '🎤', nom: 'Le trou', but: 'Un solo à tour de rôle, dans le silence.' },
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
const TEMPOS = [['lent', '🐢 Lent', 72], ['moyen', '🚶 Moyen', 90], ['vite', '🐇 Vite', 108]];

export default {
  id: 'cercle',
  mount(el) {
    const c = audio();
    let act = store.get('cercleActivite', 'coeur'); let tempo = store.get('cercleTempo', 'lent');
    prechargerSons(['choeur', 'piano']);
    const reglages = { tonique: store.get('cercleTonique', 60), nVoix: store.get('cercleNVoix', 2), modele: store.get('cercleModele', true), mots: GROUPES.map((g) => store.get(`cercleMot-${g.id}`, g.mot)), noms: store.get('cercleNoms', ''), niveau: store.get('cercleNiveau', 'facile') };
    let moteur = null; let file = []; let raf = 0; let gel = false;
    let prise = null; let enreg = null; let ecoute = null; // 🎙 la classe, enregistrée puis réécoutée
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
      if (gel) return;
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
      raf = requestAnimationFrame(boucle);
    }
    function planifier() { if (!moteur) return; const d = 60 / bpm() / 2; while (moteur.prochain < c.currentTime + 0.3) { moteur.fn(moteur.pas, moteur.prochain, d); moteur.prochain += d; moteur.pas++; } }
    function demarrer(fn) { arreter(); try { c.resume(); } catch { /* iOS */ } gel = false; moteur = { prochain: c.currentTime + 0.3, pas: 0, fn, timer: setInterval(planifier, 25) }; planifier(); cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle); majJouer(); }
    function arreter() { if (moteur) clearInterval(moteur.timer); moteur = null; file = []; majJouer(); }
    function majBas() {
      const r = el.querySelector('[data-c=rec]'); if (!r) return; r.classList.toggle('rec', !!prise); r.textContent = prise ? '■ Fin de l’enregistrement' : '🎙 Enregistrer la classe';
      el.querySelectorAll('.ce-ecoute').forEach((x) => x.remove());
      if (enreg) r.insertAdjacentHTML('afterend', `<button class="ce-ecoute" data-c="ecoute">${ecoute ? '■ Stop' : '▶ Réécouter'}</button><button class="ce-ecoute" data-c="dl" aria-label="Télécharger l’enregistrement">⬇</button>`);
    }
    const majJouer = () => { const b = el.querySelector('[data-c=jouer]'); if (b) { b.textContent = moteur ? '■ Arrêter' : '▶ C’est parti'; b.classList.toggle('stop', !!moteur); } };
    const scene = () => el.querySelector('.ce-scene');
    const carte = (k, grand = false) => `<div class="ce-son ${grand ? 'grand' : ''}" style="--c:${SONS[k].c}"><span class="ce-ico">${SONS[k].ico}</span><b>${SONS[k].mot}</b>${grand ? `<small>${esc(SONS[k].geste)}</small>` : ''}</div>`;

    // ---------- Les activités ----------
    const A = {
      coeur: {
        rendre: () => `<div class="ce-centre"><div class="ce-rond" style="--c:${SONS.boum.c}"><span>🖐</span><b>BOUM</b></div><p class="ce-compte"><span>1</span><span>2</span><span>3</span><span>4</span></p><p class="ce-dis">Main à plat sur le bureau, <b>avec le rond</b>.</p></div>`,
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
        rendre: () => `<p class="ce-phase">👂 ÉCOUTE</p><div class="ce-ligne">${[...Array(8)].map((_, i) => `<div class="ce-case ${i % 2 ? 'et' : ''}" data-i="${i}"></div>`).join('')}</div><p class="ce-dis">Écoute 4 temps… puis <b>répétez ensemble</b>.</p>
          <div class="ce-niveaux">${[['facile', 'Facile'], ['moyen', 'Moyen'], ['defi', 'Défi']].map(([k, l]) => `<button class="${reglages.niveau === k ? 'on' : ''}" data-niveau="${k}">${l}</button>`).join('')}</div>`,
        fn(pas, t) {
          const i = pas % 16; const phase = i < 8 ? 'ecoute' : 'vous'; const k = i % 8;
          if (i === 0) { this.motif = this.nouveau(); const m = this.motif; quand(t, () => { const cs = scene()?.querySelectorAll('.ce-case'); cs?.forEach((x, n) => { x.innerHTML = m[n] ? `<span style="--c:${SONS[m[n]].c}">${SONS[m[n]].ico}</span><b>${SONS[m[n]].mot}</b>` : ''; }); }); }
          const s = this.motif?.[k];
          if (phase === 'ecoute' && s) sonne(s, t); if (phase === 'vous' && k % 2 === 0) sonne('tic', t, 0.35); // pendant « À vous », juste le tempo, tout doux
          quand(t, () => { const sc = scene(); if (!sc) return; const ph = sc.querySelector('.ce-phase'); if (k === 0) { ph.textContent = phase === 'ecoute' ? '👂 ÉCOUTE' : '🙌 À VOUS!'; ph.classList.toggle('vous', phase === 'vous'); } sc.querySelectorAll('.ce-case').forEach((x, n) => x.classList.toggle('on', n === k)); });
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
            const e = sc.querySelector('.ce-entre'); if (p === 0) e.innerHTML = avant ? `Groupe <b style="color:${GROUPES[n].c}">${GROUPES[n].nom}</b> : à vous dans 4 temps!` : n < GROUPES.length ? `${GROUPES.slice(0, n).map((g) => `<b style="color:${g.c}">${g.nom}</b>`).join(' + ')}` : '🔥 TOUT LE MONDE! Tenez le groove.'; });
        },
      },
      chef: {
        ordres: [
          { t: 'TOUT LE MONDE!', g: [0, 1, 2, 3], v: 1 }, { t: 'ROUGE seulement', g: [0], v: 1 }, { t: 'BLEU + JAUNE', g: [1, 2], v: 1 },
          { t: '🔉 tout doux…', g: [0, 1, 2, 3], v: 0.35 }, { t: '🔊 FORT!', g: [0, 1, 2, 3], v: 1.2 }, { t: '✋ FREEZE', g: [], v: 0 },
          { t: 'VIOLET seulement', g: [3], v: 1 }, { t: 'ROUGE + VIOLET', g: [0, 3], v: 1 },
        ],
        o: null,
        rendre: () => `<div class="ce-ordre"><p class="ce-o-t">Prêts?</p><div class="ce-o-g"></div><div class="ce-barre"><i></i></div></div><p class="ce-dis">L’app dirige : regardez l’écran. Les groupes jouent leur rythme du <b>moteur des mots</b>.</p>`,
        fn(pas, t, d) {
          const mes = Math.floor(pas / 8); const p = pas % 8;
          if (p === 0 && mes % 2 === 0) { const L = this.ordres; this.o = mes === 0 ? L[0] : L[1 + Math.floor(Math.random() * (L.length - 1))]; const o = this.o; quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelector('.ce-o-t').textContent = o.t; sc.querySelector('.ce-ordre').classList.toggle('gel', !o.g.length); sc.querySelector('.ce-o-g').innerHTML = o.g.map((gi) => `<span style="--c:${GROUPES[gi].c}">${GROUPES[gi].nom}</span>`).join(''); }); }
          const o = this.o; if (o) o.g.forEach((gi) => { const g = GROUPES[gi]; if (g.pos.includes(p)) sonne(g.son, t, 0.8 * o.v); });
          quand(t, () => { const b = scene()?.querySelector('.ce-barre i'); if (b) b.style.width = `${(((pas % 16) + 1) / 16) * 100}%`; });
        },
      },
      orage: {
        etapes: [['chhh', 'La pluie arrive…'], ['tic', 'Les gouttes'], ['tac', 'L’averse!'], ['boum', 'L’orage!'], ['pieds', '⚡ LE TONNERRE ⚡'], ['boum', 'L’orage s’éloigne'], ['tac', 'L’averse'], ['tic', 'Les gouttes'], ['chhh', 'La pluie s’en va…'], [null, '… silence.']],
        rendre() { return `<div class="ce-centre"><div class="ce-orage"></div><p class="ce-o-sous"></p><p class="ce-points">${this.etapes.map((_, i) => `<i data-e="${i}"></i>`).join('')}</p><p class="ce-dis">Fais comme l’écran, et <b>change en même temps que tout le monde</b>. Les yeux fermés, c’est encore mieux.</p></div>`; },
        fn(pas, t, d) {
          const parEtape = 16; const e = Math.floor(pas / parEtape); const et = this.etapes[e];
          if (!et) { quand(t, () => arreter()); return; }
          const [k, txt] = et; const pr = (pas % parEtape) / parEtape; const fort = e <= 4 ? (e + pr) / 5 : (9 - e - pr) / 5;
          if (k && Math.random() < (k === 'chhh' ? 0.9 : k === 'pieds' ? 0.45 : 0.75)) sonne(k, t + Math.random() * d * 0.6, 0.35 + 0.65 * Math.max(0, Math.min(1, fort)));
          if (pas % parEtape === 0) quand(t, () => { const sc = scene(); if (!sc) return; sc.querySelector('.ce-orage').innerHTML = k ? carte(k, true) : '<div class="ce-son grand" style="--c:#555"><span class="ce-ico">🤫</span><b>CHUT</b></div>'; sc.querySelector('.ce-o-sous').textContent = txt; sc.querySelectorAll('.ce-points i').forEach((x, i) => x.classList.toggle('on', i <= e)); });
        },
      },
      choeur: {
        rendre: () => `<div class="ce-compte ce-c-compte">${[1, 2, 3, 4].map((n) => `<span>${n}</span>`).join('')}</div>
          <div class="ce-tous v${reglages.nVoix}" style="--n:${2 + reglages.nVoix}">
            ${[GROUPES[0], GROUPES[1]].map((g) => `<div class="ce-col ce-perc actif" data-pg="${g.id}" style="--c:${g.c}"><small class="ce-col-g">${g.nom}</small><span class="ce-col-ico">${SONS[g.son].ico}</span><b class="ce-col-mot">${SONS[g.son].mot}</b><span class="ce-col-quoi">${g.pos.length === 4 ? 'sur 1 2 3 4' : 'sur 2 et 4'}</span><span class="ce-col-pts">${[0, 1, 2, 3].map((n) => `<i class="${g.pos.includes(n * 2) ? 'oui' : ''}"></i>`).join('')}</span></div>`).join('')}
            ${VOIX_C.slice(0, reglages.nVoix).map((v) => `<div class="ce-col ce-v" data-v="${v.id}" style="--c:${v.c}"><small class="ce-col-g">Groupe</small><b class="ce-voy">${v.voy}</b><span class="ce-v-n">écoutez…</span><span class="ce-v-fl"></span><div class="ce-v-b"><i></i></div></div>`).join('')}
          </div>
          <p class="ce-dis ce-c-dis">Les percussions d’abord… puis le groupe <b style="color:${VOIX_C[0].c}">AAA</b> chante. Respirez à chaque changement.</p>
          <div class="ce-niveaux"><span class="ce-l">Tonalité</span>${TONS.map(([n, m]) => `<button class="${reglages.tonique === m ? 'on' : ''}" data-ton="${m}">${n}</button>`).join('')}<button class="${reglages.nVoix === 2 ? 'on' : ''}" data-nvoix="2">AAA + OOO</button><button class="${reglages.nVoix === 3 ? 'on' : ''}" data-nvoix="3">+ MMM</button><button class="${reglages.modele ? 'on' : ''}" data-modele="1">${reglages.modele ? '🎶 L’app chante le modèle' : '🔇 Sans modèle'}</button></div>`,
        fn(pas, t, d) {
          const mes = Math.floor(pas / 8); const p = pas % 8; const T = reglages.tonique;
          // Les percussions : ROUGE (BOUM) et BLEU (TAC), tout le long.
          [GROUPES[0], GROUPES[1]].forEach((g) => { if (g.pos.includes(p)) { sonne(g.son, t, g.son === 'boum' && p === 0 ? 0.9 : 0.7); quand(t, () => { const col = scene()?.querySelector(`[data-pg="${g.id}"]`); if (col) { col.classList.remove('bat'); void col.offsetWidth; col.classList.add('bat'); } }); } });
          if (p % 2 === 0) quand(t, () => scene()?.querySelectorAll('.ce-c-compte span').forEach((x, i) => x.classList.toggle('on', i === p / 2)));
          if (mes < 2) { if (p === 0) quand(t, () => { const e = scene()?.querySelector('.ce-c-dis'); if (e) e.innerHTML = `Les percussions… le groupe <b style="color:${VOIX_C[0].c}">AAA</b> entre dans ${mes === 0 ? '8' : '4'} temps. Écoutez la note!`; }); if (mes === 1 && p === 0 && reglages.modele) joue('choeur', T + VOIX_C[0].notes[0], { when: t, dur: 4 * 2 * d * 0.9, vel: 0.35 }); return; }
          const m2 = mes - 2; if (p !== 0 || m2 % 2) return;
          const k = Math.floor(m2 / 2) % 4; const tour = Math.floor(m2 / 8); const n = Math.min(reglages.nVoix, 1 + tour); const dur = 2 * 8 * d;
          ACC_C[k].forEach((iv) => joue('piano', T - 12 + iv, { when: t, dur: dur * 0.95, vel: 0.28 })); // l'accord, tout doux, pour le repère
          VOIX_C.slice(0, n).forEach((v) => { if (reglages.modele) joue('choeur', T + v.notes[k], { when: t, dur: dur * 0.92, vel: 0.42 }); });
          quand(t, () => {
            const sc = scene(); if (!sc) return;
            VOIX_C.slice(0, reglages.nVoix).forEach((v, i) => {
              const ln = sc.querySelector(`.ce-v[data-v="${v.id}"]`); if (!ln) return; const actif = i < n; ln.classList.toggle('actif', actif);
              const note = T + v.notes[k]; const suiv = v.notes[(k + 1) % 4] - v.notes[k];
              ln.querySelector('.ce-v-n').textContent = actif ? NOTE_FR[((note % 12) + 12) % 12] : 'écoutez…';
              ln.querySelector('.ce-v-fl').textContent = actif ? (suiv > 0 ? '↗ ensuite : plus haut' : suiv < 0 ? '↘ ensuite : plus bas' : '= ensuite : la même') : '';
              const bar = ln.querySelector('.ce-v-b i'); bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; if (actif) { bar.style.transition = `width ${dur}s linear`; bar.style.width = '100%'; }
            });
            const e = sc.querySelector('.ce-c-dis'); const proch = n < reglages.nVoix && k === 3 ? VOIX_C[n] : null;
            e.innerHTML = proch ? `Groupe <b style="color:${proch.c}">${proch.voy}</b> : à vous au prochain accord!` : `Accord <b>${NOMS_C[k]}</b> · tenez la note… respirez au changement.`;
          });
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
            quand(t, () => { const sc = scene(); if (!sc) return; const s = sc.querySelector('.ce-solo'); s.classList.toggle('a-toi', mes === 3); sc.querySelector('.ce-solo-t').textContent = mes === 3 ? '🎤 SOLO!' : mes === 2 ? 'Prépare-toi…' : 'Le groove…'; if (mes === 2) sc.querySelector('.ce-solo-n').textContent = qui; if (mes === 0) sc.querySelector('.ce-solo-n').textContent = ''; });
          }
          if (mes === 3 && p % 2 === 0) quand(t, () => { const n = scene()?.querySelector('.ce-solo-t'); if (n) n.textContent = `🎤 SOLO! ${4 - p / 2}`; });
        },
      },
    };

    function rendre() {
      arreter();
      el.innerHTML = `
        <div class="mod-head"><div><p class="eyebrow">Jouer · Le cercle</p><h1>Un jam pour toute la classe.</h1>
          <p class="muted">Aucun instrument, aucune connaissance : les mains, les doigts, les pieds. Projette cette page, lance une activité : l’app tient le tempo et montre quoi faire.</p></div></div>
        <div class="ce-sons">${Object.keys(SONS).map((k) => carte(k, true)).join('')}</div>
        <div class="ce-acts" role="tablist">${ACTIVITES.map((a) => `<button role="tab" aria-selected="${a.id === act}" data-act="${a.id}"><span>${a.ico}</span><b>${a.nom}</b><small>${a.but}</small></button>`).join('')}</div>
        <section class="ce-scene" aria-live="off">
          <div class="ce-haut"><b class="ce-titre">${ACTIVITES.find((a) => a.id === act).ico} ${ACTIVITES.find((a) => a.id === act).nom}</b>
            <span class="ce-tempos">${TEMPOS.map(([k, l]) => `<button class="${k === tempo ? 'on' : ''}" data-tempo="${k}">${l}</button>`).join('')}</span>
            <button class="ce-plein" data-c="plein" aria-label="Plein écran">⛶</button></div>
          <div class="ce-corps">${A[act].rendre.call(A[act])}</div>
          <div class="ce-bas"><button class="ce-go" data-c="jouer">▶ C’est parti</button><button class="ce-freeze" data-c="freeze">✋ FREEZE</button>
            <button class="ce-rec ${prise ? 'rec' : ''}" data-c="rec">${prise ? '■ Fin de l’enregistrement' : '🎙 Enregistrer la classe'}</button>${enreg ? `<button class="ce-ecoute" data-c="ecoute">${ecoute ? '■ Stop' : '▶ Réécouter'}</button><button class="ce-ecoute" data-c="dl" aria-label="Télécharger l’enregistrement">⬇</button>` : ''}</div>
        </section>
        ${act === 'mots' ? `<details class="panel ce-mots-edit"><summary>✏️ Changer les mots des groupes</summary>${GROUPES.map((g, gi) => `<label style="--c:${g.c}"><b>${g.nom}</b> <input class="input" data-mot="${gi}" value="${esc(reglages.mots[gi])}"> <small>${g.pos.length} syllabes</small></label>`).join('')}<p class="muted small">Un mot par battement allumé : le nom de l’école, un plat, une équipe. Le rythme ne change pas.</p></details>` : ''}
        <div class="ce-gel" hidden><b>✋</b><span>FREEZE</span><small>Touche pour reprendre</small></div>`;
      majJouer();
    }
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (a) { act = a.dataset.act; store.set('cercleActivite', act); rendre(); return; }
      const tp = e.target.closest('[data-tempo]'); if (tp) { tempo = tp.dataset.tempo; store.set('cercleTempo', tempo); el.querySelectorAll('[data-tempo]').forEach((b) => b.classList.toggle('on', b.dataset.tempo === tempo)); return; }
      const tn = e.target.closest('[data-ton]'); if (tn) { reglages.tonique = +tn.dataset.ton; store.set('cercleTonique', reglages.tonique); el.querySelectorAll('[data-ton]').forEach((b) => b.classList.toggle('on', +b.dataset.ton === reglages.tonique)); return; }
      const nvx = e.target.closest('[data-nvoix]'); if (nvx) { reglages.nVoix = +nvx.dataset.nvoix; store.set('cercleNVoix', reglages.nVoix); rendre(); return; }
      const md = e.target.closest('[data-modele]'); if (md) { reglages.modele = !reglages.modele; store.set('cercleModele', reglages.modele); md.classList.toggle('on', reglages.modele); md.textContent = reglages.modele ? '🎶 L’app chante le modèle' : '🔇 Sans modèle'; return; }
      const nv = e.target.closest('[data-niveau]'); if (nv) { reglages.niveau = nv.dataset.niveau; store.set('cercleNiveau', reglages.niveau); el.querySelectorAll('[data-niveau]').forEach((b) => b.classList.toggle('on', b.dataset.niveau === reglages.niveau)); return; }
      if (e.target.closest('.ce-gel')) { el.querySelector('.ce-gel').hidden = true; return; }
      const c2 = e.target.closest('[data-c]')?.dataset.c; if (!c2) return;
      if (c2 === 'jouer') { if (moteur) arreter(); else { const ac = A[act]; demarrer((p, t, d) => ac.fn.call(ac, p, t, d)); } }
      if (c2 === 'freeze') { arreter(); el.querySelector('.ce-gel').hidden = false; }
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
    const clavier = (e) => { if (e.target.closest?.('input, textarea')) return; if (e.key === ' ') { e.preventDefault(); el.querySelector('[data-c=jouer]')?.click(); } if (e.key === 'f' || e.key === 'F') el.querySelector('[data-c=freeze]')?.click(); };
    addEventListener('keydown', clavier);
    rendre(); document.body.classList.add('ce-ouvert');
    return () => { document.body.classList.remove('ce-ouvert'); if (prise) { try { prise.stop(); } catch { /* déjà */ } } try { ecoute?.stop(); } catch { /* déjà */ } fermerMicroPrise(); arreter(); cancelAnimationFrame(raf); removeEventListener('diapason:stop', onStop); removeEventListener('keydown', clavier); };
  },
};
