// L'oreille : on dépose une pièce, FLIP l'écoute et la découpe pour nous. On gagne des heures :
// on sait où sont les silences, les parties, le moment fort, et on a une boucle prête à recevoir des mots.
import { audio, out } from '../audio.js';
import { clavierDe } from '../doigte.js';
import { espace, audioURL, saveEntry, uploadAudio, saveProfile, members } from '../espace.js';
import { toast, autoCanvas } from '../ui.js';
import { esc } from './carnet.js';
import { ecouter, boucler, rendreBoucle, corrigerNotes, changerAccordSon, plan, wav, copier, couper, coller, remplir, diagnostic, notesVoix, nomNote, trouverAccords, grilleMesures, grilleTexte, nomAccord, SORTES_ACCORD, NOTES_FR } from '../oreille.js';
import { chargerGrille, poserFond } from './studio.js';

const PIECES = [['data/sons/frog-joywalk-complet.mp3', 'Joy Walk (Frog)'], ['data/sons/frog-visite.mp3', 'Projet 1, après la pause (Frog)']];
const mmss = (t) => { t = Math.max(0, t); return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; };

export default {
  id: 'oreille',
  mount(el) {
    let buf = null; let res = null; let nom = ''; let diag = null; let voix = null; let accs = null; let rec = null; let stopBoucle = null; let lecture = null;
    const sons = () => (espace.connected ? espace.entries.filter((e) => e.audio && !e.audio.type?.startsWith('video')) : []);
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">L’oreille</p>
        <h1>Dépose une pièce. Le labo l’écoute pour toi.</h1>
        <p class="muted">Les silences, les parties, le tempo, la tonalité, le moment fort, et une boucle qui ne s’entend pas : en quelques secondes, ce qui prend une heure à l’oreille.</p>
      </div></div>
      <section class="panel or-src">
        <label class="btn primary">Choisir un fichier audio<input type="file" accept="audio/*" data-o="file" hidden></label>
        <button class="btn" data-o="micro">● Enregistrer mon clavier</button>
        <span class="muted">ou</span>
        <select data-o="choix"><option value="">Une pièce ou un son de l’espace…</option>
          ${PIECES.map(([u, n]) => `<option value="url:${u}">${esc(n)}</option>`).join('')}
          ${sons().map((e) => `<option value="id:${esc(e.id)}">${esc(e.title || 'Son')} (${esc(e.author)})</option>`).join('')}
        </select>
        <p class="or-etat muted small"></p>
        <p class="muted small or-astuce">Pour trouver les accords d’un bout joué au clavier : enregistre-le ici (micro) ou dépose le fichier. Un son clair, sans batterie, donne le meilleur résultat. Branché en MIDI, le studio les lit encore plus juste, en direct : <a href="#/studio?tab=instrument">Studio → Mon instrument</a>.</p>
      </section>
      <section class="or-res" hidden>
        <h2 class="or-titre"></h2>
        <div class="or-faits"></div>
        <div class="or-transport"><button class="btn primary" data-o="lire">▶ Écouter</button><span class="or-pos mono">0:00</span><span class="muted">Touche l’onde : l’écoute part de ce moment.</span>
          <label class="or-just" data-bulle="Accorder plus haut ou plus bas, en cents (100 cents = un demi-ton) : toute la prise, ou une seule partie. L’écoute et les fichiers WAV suivent ; l’original ne change pas.">Justesse de <select data-cible aria-label="Ce qu’on accorde"><option value="-1">toute la prise</option></select> <input type="range" min="-50" max="50" step="1" value="0" data-cents> <b class="or-cents">0 ¢</b></label></div>
        <div class="or-carte"><i class="or-tete" hidden></i><canvas class="or-canvas" aria-label="La pièce, ses parties, ses silences et sa boucle"></canvas></div>
        <div class="or-monter"></div>
        <div class="or-parties"></div>
        <div class="or-voix"></div>
        <div class="or-diag"></div>
        <div class="or-accords"></div>
        <div class="or-actions">
          <button class="btn primary" data-o="boucle">▶ Écouter la boucle</button>
          <button class="btn" data-o="fort">▶ Le moment fort</button>
          <button class="btn primary" data-o="fond" data-bulle="La boucle tourne dans Jouer, sous le beat, au même tempo : tu joues, tu chantes, tu improvises par-dessus.">→ Jouer sur la boucle</button>
          <button class="btn" data-o="boucle-wav">⬇ La boucle (WAV)</button>
          <button class="btn" data-o="ecrire">Écrire des paroles sur la boucle</button>
          ${espace.connected ? '<button class="btn" data-o="relais">Lancer la boucle au relais</button>' : ''}
        </div>
        <p class="or-src-note muted small">Comment : énergie mesurée 20 fois par seconde, tempo par l’autocorrélation des attaques, tonalité par les profils de Krumhansl et Kessler (1982), boucle par la ressemblance de deux passages. Rien ne quitte ton appareil.</p>
      </section>`;
    const q = (s) => el.querySelector(s);
    const cv = autoCanvas(q('.or-canvas'));
    // Redessiner quand la carte prend sa taille (elle apparaît seulement après l'écoute).
    const roC = new ResizeObserver(() => requestAnimationFrame(dessiner)); roC.observe(q('.or-canvas'));
    const etat = (t) => { q('.or-etat').textContent = t; };
    // Un bout pris dans le filet arrive ici tout seul.
    if (window.__flipOreille) { const f = window.__flipOreille; window.__flipOreille = null; setTimeout(async () => analyser(await f.blob.arrayBuffer(), f.nom), 0); }
    // La lecture et sa tête : où on en est, sur l'onde, pendant qu'on écoute (une boucle tourne entre a et b).
    let tete = null; let cents = 0; let cp = []; let cible = -1; const voulus = new Set(); let occK = {}; let voixForcee = false; let orig = null; let plage = null; let presse = null; let bout = null; let pile = []; let entendus = {}; let apercu = null; let aligner = true; let choisie = null; let corr = {}; let corrige = true;
    // La justesse : toute la prise (cents) plus, au besoin, une partie à part (cp[i]). rate(t) : la vitesse à ce moment.
    const partDe = (t) => (res ? res.parties.findIndex((p) => t >= p.a - 0.01 && t < p.b) : -1);
    const rate = (t = 0) => 2 ** ((cents + (cp[partDe(t)] || 0)) / 1200);
    // Où en est l'écoute dans la pièce (les segments suivent chacun leur justesse).
    const posDe = (tt) => { const e = audio().currentTime - tt.t0;
      if (tt.boucle) { const L = tt.b - tt.a; const eb = e * tt.segs[0].r; return tt.a + (((eb % L) + L) % L); }
      let reste = Math.max(0, e); for (const g of tt.segs) { const d = (g.b - g.a) / g.r; if (reste < d) return g.a + reste * g.r; reste -= d; } return tt.b; };
    const arrete = () => { stopBoucle?.(); stopBoucle = null; try { lecture?.stop?.(); } catch { /* déjà arrêtée */ } lecture = null; tete = null; q('[data-o=boucle]').textContent = '▶ Écouter la boucle'; const l = q('[data-o=lire]'); if (l) l.textContent = '▶ Écouter'; const t = q('.or-tete'); if (t) t.hidden = true; };
    function animerTete() {
      if (!tete || !res) return;
      let pos = posDe(tete);
      if (!tete.boucle && pos >= tete.b) { arrete(); return; }
      pos = Math.max(tete.a, pos); const t = q('.or-tete'); if (t) { t.hidden = false; t.style.left = `${(pos / res.duree) * 100}%`; }
      const p = q('.or-pos'); if (p) p.textContent = `${mmss(pos)} / ${mmss(res.duree)}`;
      { const g = q('.or-accords')?._grille; if (g) { const D = 240 / g.tempo; q('.or-mes.joue')?.classList.remove('joue'); [...el.querySelectorAll('.or-mes[data-t]')].find((b) => pos >= +b.dataset.t && pos < +b.dataset.t + D)?.classList.add('joue'); } }
      requestAnimationFrame(animerTete);
    }
    // « ■ Arrêter le son » (en bas de l'écran) : la lecture s'arrête, l'analyse reste là.
    const surStop = (ev) => { ev.preventDefault(); arrete(); };
    addEventListener('diapason:stop', surStop);

    // Décode la pièce déposée et la fait écouter par l’oreille, en affichant chaque étape.
    async function analyser(arrayBuffer, n) {
      etat('Je décode la pièce…'); pile = []; bout = null;
      try { await analyserBuf(await audio().decodeAudioData(arrayBuffer), n); } catch { etat('Je n’arrive pas à lire ce fichier. Essaie un mp3, un m4a ou un wav.'); }
    }
    async function analyserBuf(b0, n) {
      arrete(); nom = n; plage = null; entendus = {}; apercu = null; cp = []; cible = -1; cents = 0; voixForcee = false; voulus.clear(); occK = {}; { const r = q('[data-cents]'); if (r) r.value = 0; const lab = q('.or-cents'); if (lab) lab.textContent = '0 ¢'; }
      {
        buf = b0; orig = buf; corr = {}; choisie = null; corrige = true;
        res = await ecouter(buf, etat); diag = diagnostic(res); voix = null;
        etat('');
        montrer();
        accs = await trouverAccords(buf, res.bpm, etat); etat('');
        montrerAccords();
        voix = await notesVoix(buf, etat); etat('');
        montrerVoix();
      }
    }
    // Affiche ce que l’oreille a trouvé : tempo, tonalité, parties, conseils.
    function montrer() {
      q('.or-res').hidden = false;
      q('.or-titre').textContent = nom;
      const jouees = res.parties.filter((p) => !p.silence);
      q('.or-faits').innerHTML = [
        ['Durée', mmss(res.duree)], ['Tempo', `${res.bpm} BPM`], ['Tonalité estimée', res.ton],
        ['Parties', `${jouees.length}`], ['Silences', `${res.silences.length}`], ['Moment fort', `<button class="or-t" data-a="${res.momentFort[0]}" data-b="${res.momentFort[1]}">▶ ${mmss(res.momentFort[0])}</button>`],
      ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')
        + (res.boucle ? `<p class="or-boucle">Boucle trouvée : <button class="or-t" data-a="${res.boucle.a}" data-b="${res.boucle.b}" data-boucle="1" data-bulle="Écouter la boucle, en boucle">▶ de ${mmss(res.boucle.a)} à ${mmss(res.boucle.b)}</button> (${Math.round(res.boucle.b - res.boucle.a)} s), ressemblance ${Math.round(res.boucle.qualite * 100)} %. <button class="or-t" data-wav-a="${res.boucle.a}" data-wav-b="${res.boucle.b}">⬇ WAV</button></p>` : '<p class="or-boucle">Pas de passage assez long pour une boucle.</p>');
      q('[data-o=boucle]').disabled = !res.boucle; q('[data-o=ecrire]').disabled = !res.boucle; q('[data-o=fond]').disabled = !res.boucle;
      const rel = q('[data-o=relais]'); if (rel) rel.disabled = !res.boucle;
      // Ce que FLIP entend : ce qui brille déjà, ce qui est à retravailler. Chaque repère se touche pour l'écouter.
      const item = (o, cl) => `<li class="${cl}" ${o.a != null ? `data-a="${o.a}" data-b="${o.b}" role="button" tabindex="0"` : ''}><b>${esc(o.titre)}</b><span>${esc(o.quoi)}</span>${o.a != null ? `<small>▶ ${mmss(o.a)} à ${mmss(o.b)} <span class="or-t" data-wav-a="${o.a}" data-wav-b="${o.b}" role="button">⬇ WAV</span></small>` : ''}</li>`;
      q('.or-diag').innerHTML = `
        <div class="or-col or-bien"><h3>Ce qui brille déjà</h3><ul>${diag.brille.map((o) => item(o, 'ok')).join('')}</ul></div>
        <div class="or-col or-trav"><h3>À retravailler</h3><ul>${diag.travail.map((o) => item(o, 'tr')).join('') || '<li class="vide"><span>Rien de flagrant dans l’énergie ni la forme. Fiez-vous à vos oreilles pour le reste.</span></li>'}</ul></div>`;
      q('.or-voix').innerHTML = '';
      montrerParties(); montrerMonter(); dessiner();
    }
    // L'énergie de chaque partie, en trois teintes d'un même bleu : plus c'est foncé, plus ça pousse.
    const FORCE = { douce: '#9cc0e8', moyenne: '#4a86cf', forte: '#1d4f8f', silence: '#d9d2c4' };
    function forceDe(p) {
      if (p.silence) return 'silence';
      const nv = res.parties.filter((x) => !x.silence).map((x) => x.niveau).sort((u, v) => u - v); if (nv.length < 3) return 'moyenne';
      const t1 = nv[Math.floor(nv.length / 3)]; const t2 = nv[Math.floor((2 * nv.length) / 3)];
      return p.niveau < t1 ? 'douce' : p.niveau < t2 ? 'moyenne' : 'forte';
    }
    function montrerParties() {
      const box = q('.or-parties'); if (!res || !box) return; let k = 0;
      const nums = res.parties.map((p) => (p.silence ? 0 : ++k));
      box.innerHTML = `<h3>Les parties <small class="muted">la couleur dit l’énergie : plus c’est foncé, plus ça pousse · touche une partie pour l’écouter et l’accorder à part</small></h3>
        <div class="or-pt-liste">${res.parties.map((p, i) => { const f = forceDe(p); return `<button class="or-pt f-${f} ${cible === i ? 'vise' : ''}" data-pt="${i}" style="flex-grow:${Math.round(p.b - p.a)}">
          <b>${p.silence ? 'silence' : `Partie ${nums[i]}`}</b><small>${mmss(p.a)} – ${mmss(p.b)}</small><em>${p.silence ? '' : f}${cp[i] ? ` · ${cp[i] > 0 ? '+' : ''}${cp[i]} ¢` : ''}</em></button>`; }).join('')}</div>
        <p class="or-leg2"><span><i style="background:${FORCE.douce}"></i>douce</span><span><i style="background:${FORCE.moyenne}"></i>moyenne</span><span><i style="background:${FORCE.forte}"></i>forte</span><span><i style="background:${FORCE.silence}"></i>silence</span><span><i style="background:#c9a45c"></i>la boucle</span><span><i style="background:#e07b2c"></i>le moment fort</span><span><i class="lg-hach"></i>à retravailler</span></p>`;
      const sel = q('[data-cible]');
      if (sel) { sel.innerHTML = `<option value="-1">toute la prise</option>${res.parties.map((p, i) => (p.silence ? '' : `<option value="${i}">la partie ${nums[i]} (${mmss(p.a)})</option>`)).join('')}`; sel.value = cible; }
    }
    // Les notes retouchées : on fabrique une copie corrigée et c'est elle qu'on entend (et qu'on exporte) ; l'original reste là.
    function appliquer() {
      const on = Object.values(corr).some(Boolean); const pos = tete ? posDe(tete) : null; const t = tete;
      buf = on && corrige && voix?.notes ? corrigerNotes(orig, corr, voix.notes, voix.piste) : orig;
      if (t) { if (t.boucle) joueDe(t.a, t.b, { boucle: true }); else if (pos < t.b) joueDe(pos, t.b); }
      montrerVoix();
    }
    // Les temps de la pièce (la grille des mesures si l'oreille l'a trouvée) : on y cale les coupes pour que le groove tienne.
    function temps() {
      const g = q('.or-accords')?._grille; const T = 60 / (g?.tempo || res.bpm); const l = [];
      if (g) g.mesures.forEach((m) => { for (let k = 0; k < 4; k++) l.push(m.t + k * T); }); else for (let t = 0; t < res.duree; t += T) l.push(t);
      return l;
    }
    const proche = (t) => temps().reduce((x, y) => (Math.abs(y - t) < Math.abs(x - t) ? y : x), t);
    function caler() { if (!plage || !aligner) return; const a = proche(plage.a); let b = proche(plage.b); if (b <= a) b = plage.b; plage = { a: Math.max(0, a), b: Math.min(res.duree, b) }; }
    const nomBase = () => (pile.length ? pile[0].nom : nom);
    function montrerMonter() {
      const box = q('.or-monter'); if (!res || !box) return;
      const hist = pile.length ? `<div class="or-m-hist"><b>Version montée</b> · ${pile.length} changement${pile.length > 1 ? 's' : ''} · l’original reste intact
        <button class="btn small" data-m="annuler">↶ Annuler le dernier</button><button class="btn small" data-m="origine">Revenir à l’original</button>
        <button class="btn small primary" data-m="wav">⬇ La version montée (WAV)</button>${espace.connected ? '<button class="btn small" data-m="mur">Garder au mur</button>' : ''}</div>` : '';
      if (!plage) { box.innerHTML = `<p class="muted or-m-astuce">✂ Glisse sur l’onde pour choisir un passage : l’écouter, le couper, le copier, le coller ailleurs ou remplir un silence.</p>${hist}`; return; }
      const L = plage.b - plage.a;
      box.innerHTML = `<div class="or-m-bar"><b>Passage ${mmss(plage.a)} – ${mmss(plage.b)}</b><span class="muted">${L.toFixed(1).replace('.', ',')} s</span>
        <button class="btn small" data-m="ecouter">▶ Écouter</button>
        <button class="btn small" data-m="couper">✂ Couper</button>
        <button class="btn small" data-m="copier">⧉ Copier</button>
        ${bout ? `<button class="btn small" data-m="coller" data-bulle="Insère le bout copié (${bout.duree.toFixed(1).replace('.', ',')} s) au début du passage choisi.">Coller ici</button><button class="btn small" data-m="remplir" data-bulle="Remplace le passage par le bout copié, répété au besoin. La durée ne change pas.">Remplir avec le bout copié</button>` : ''}
        <button class="btn small" data-m="avant" data-bulle="Remplace le passage (un silence, un raté) par ce qui joue juste avant, de la même longueur. La durée ne change pas.">Remplir avec ce qui précède</button>
        <label class="check"><input type="checkbox" data-aligner ${aligner ? 'checked' : ''}> calé sur les temps</label>
        <button class="btn small" data-m="fermer" aria-label="Oublier ce passage">✕</button></div>${hist}`;
    }
    async function monterAvec(nouveau, quoi) {
      pile.push({ buf, nom }); const n = `${nomBase()} · montée`; await analyserBuf(nouveau, n); toast(`${quoi} Écoute la jonction ; ↶ annule.`); montrerMonter();
    }
    // Sur une voix seule : les meilleures notes, celles à travailler, et l'exercice qui va avec.
    function montrerVoix() {
      const box = q('.or-voix');
      if (!voix?.notes?.length) {
        box.innerHTML = '<p class="muted">Les notes : pour les mesurer une à une, dépose un enregistrement où une seule note sonne à la fois (une voix seule, une mélodie jouée). Dans un mélange d’instruments, la mesure ne serait pas fiable.</p>';
        return;
      }
      // Voix ou instrument : on montre les notes pareil ; seuls les mots changent (chantée / jouée, la voix / l'instrument).
      const inst = voix.instrument && !voixForcee; const fait = inst ? 'jouée' : 'chantée';
      // En or : juste et stable. En rouge : à travailler (sauf si c'est voulu : une note glissée, une couleur exprès).
      const forte = new Set(voix.fortes.map((b) => b.m)); const trav = voix.aTravailler.filter((b) => !voulus.has(b.m));
      const etatDe = (b) => (voulus.has(b.m) ? 'voulu' : forte.has(b.m) ? 'bien' : trav.some((x) => x.m === b.m) ? 'trav' : '');
      const sg = (c) => `${c > 0 ? '+' : ''}${Math.round(c)}`;
      const puce = (b) => `<button class="or-note ${etatDe(b)} ${corr[b.m] ? 'retouche' : ''} ${choisie === b.m ? 'choisie' : ''}" data-note="${b.m}" data-bulle="${esc(`${nomNote(b.m)} : ${fait} ${b.n} fois, ${sg(b.cents)} cents en moyenne${corr[b.m] ? `, retouchée de ${sg(corr[b.m])} cents` : ''}. Touche pour l’entendre.`)}">${nomNote(b.m)}<small>${sg(b.cents)} ¢${corr[b.m] ? ` → ${sg(b.cents + corr[b.m])}` : ''}</small></button>`;
      // Retoucher une note : ± 5 cents, ou d'un coup « → juste ». Seule cette note bouge, partout où elle est chantée.
      const retouche = (b) => `<span class="or-corr" data-bulle="Retoucher ${nomNote(b.m)} : seulement cette note, partout où elle est ${fait}. L’original ne change pas : tu entends une copie retouchée."><button data-corr="${b.m}" data-d="-5" aria-label="5 cents plus bas">−</button><b>${corr[b.m] ? sg(corr[b.m]) : '0'} ¢</b><button data-corr="${b.m}" data-d="5" aria-label="5 cents plus haut">+</button><button class="or-t" data-corr-juste="${b.m}" data-v="${-Math.round(b.cents)}">→ juste</button></span>`;
      const ligne = (b, k) => `<li class="${k}"><button class="or-t" data-note="${b.m}">▶ ${nomNote(b.m)}</button><span>${k === 'bien' ? `juste (${sg(b.cents)} ¢), ${fait} ${b.n} fois` : `${b.cents > 0 ? 'haute' : 'basse'} de ${Math.round(Math.abs(b.cents))} ¢`}</span>${k === 'bien' ? '' : `${k === 'voulu' ? '' : retouche(b)}<label class="check"><input type="checkbox" data-voulu="${b.m}" ${voulus.has(b.m) ? 'checked' : ''}> c’est voulu</label>`}</li>`;
      const moy = Math.round(voix.notes.reduce((s2, b) => s2 + b.cents * b.n, 0) / Math.max(1, voix.notes.reduce((s2, b) => s2 + b.n, 0)));
      const qui = espace.connected ? members() : [];
      box.innerHTML = `
        <h3>${inst ? 'Les notes de l’instrument' : 'Les notes de la voix'} <small class="muted">${voix.nNotes} notes tenues · de la plus grave à la plus aiguë · touche une note pour l’entendre</small></h3>
        ${inst ? `<p class="or-v-inst">On dirait un instrument (${esc(voix.pourquoi)}) : une note à côté, ici, c’est plutôt un accordage à vérifier. Quand plusieurs notes sonnent ensemble, la mesure est approximative. <button class="btn small" data-o="voix-quand-meme">C’est une voix</button></p>` : ''}
        <div class="or-notes">${voix.notes.map(puce).join('')}</div>
        ${(() => { const b = voix.notes.find((x) => x.m === choisie); if (!b) return '<p class="muted or-v-astuce">Touche une note : tu l’entends, et tu peux l’ajuster, au cent près.</p>';
          return `<div class="or-v-choix"><b>${nomNote(b.m)}</b><span>${fait} ${b.n} fois · ${sg(b.cents)} ¢ en moyenne${corr[b.m] ? ` → ${sg(b.cents + corr[b.m])} ¢` : ''}</span>${retouche(b)}<button class="or-t" data-note="${b.m}">▶ Réentendre</button></div>`; })()}
        <div class="or-v-cols">
          <section class="or-v-col bien"><h4>${inst ? 'En or : justes' : 'En or : chez elle'}</h4>${voix.fortes.length ? `<ul class="or-v-l">${voix.fortes.map((b) => ligne(b, 'bien')).join('')}</ul><p class="muted">Justes et stables : une mélodie qui s’y pose sonnera.</p>` : '<p class="muted">Pas encore assez de notes répétées pour le dire.</p>'}</section>
          <section class="or-v-col trav"><h4>En rouge : à travailler</h4>${voix.aTravailler.length ? `<ul class="or-v-l">${voix.aTravailler.map((b) => ligne(b, voulus.has(b.m) ? 'voulu' : 'trav')).join('')}</ul>` : '<p class="muted">Aucune note nettement à côté.</p>'}</section>
        </div>
        ${Object.values(corr).some(Boolean) ? `<div class="or-corr-bar">
          <p><b>Notes retouchées :</b> ${voix.notes.filter((b) => corr[b.m]).map((b) => `${nomNote(b.m)} ${sg(corr[b.m])} ¢`).join(' · ')}. <span class="muted">L’enregistrement d’origine reste intact : la version retouchée est une copie.</span></p>
          <div class="or-ab" role="group" aria-label="Ce qu’on entend"><button class="${corrige ? '' : 'on'}" data-ab="0">L’original</button><button class="${corrige ? 'on' : ''}" data-ab="1">La retouchée</button></div>
          <button class="btn small primary" data-o="retouche-wav">⬇ La prise retouchée (WAV)</button>
          ${espace.connected ? '<button class="btn small" data-o="retouche-mur">Garder la retouchée au mur</button>' : ''}
          <button class="btn small" data-o="retouche-annuler">Tout annuler</button></div>` : ''}
        <div class="or-v-actions">
          ${Math.abs(moy) >= 6 ? `<button class="btn small" data-cents-auto="${-moy}" data-bulle="Toute la voix est en moyenne ${sg(moy)} cents ${moy > 0 ? '(un peu haute)' : '(un peu basse)'} : ce réglage la recale pour l’écoute et les WAV. L’original ne change pas.">Accorder la prise : ${sg(-moy)} ¢</button>` : ''}
          ${trav.length && !inst ? '<a class="btn small" href="#/accord">Voix + piano : les retravailler →</a>' : ''}
          ${qui.length && !inst ? `<span class="or-garder">C’est la voix de ${qui.map((m) => `<button class="btn small" data-o="garder" data-qui="${esc(m)}">${esc(m)}</button>`).join(' ')}</span>` : ''}
        </div>
        <p class="or-src-note muted small">Comment : hauteur mesurée 45 fois par seconde (comme un accordeur) ; une note compte si elle tient 0,14 s. Juste : moins de 12 cents d’écart. Welch, Howard et Rush 1989.</p>`;
    }
    // Les accords trouvés, temps par temps : on les écoute, et on les envoie au studio pour jouer et improviser dessus.
    function montrerAccords() {
      const box = q('.or-accords');
      if (!accs?.length) { box.innerHTML = '<p class="muted small">Accords : rien de clair à reconnaître ici (trop de batterie ou d’effets, ou pas d’accords tenus).</p>'; return; }
      const ton = res.ton.split(' ou ')[0]; const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
      box.innerHTML = `<h3>Les accords <small class="muted">${accs.length} changements trouvés · touche un accord pour l’écouter</small></h3>
        <div class="or-acc-liste">${accs.slice(0, 48).map((a, i) => `<button class="or-acc" data-acc="${i}" title="${mmss(a.a)} · ${a.temps} temps"><b>${esc(a.nom)}</b>${clavierDe(a.r, a.q, { compact: true })}<small>${mmss(a.a)}</small></button>`).join('')}</div>
        ${(() => { const g = grilleMesures(accs, res.bpm); if (!g) return ''; box._grille = g; const l = g.boucle || g.mesures.slice(0, 32);
          return `<div class="or-grille"><p class="or-grille-t"><b>La grille</b> · ${g.tempo} BPM · 4 temps par mesure${g.periode ? ` · <span class="or-rep">‖: une boucle de ${g.periode} mesure${g.periode > 1 ? 's' : ''}, jouée ${g.tours} fois :‖</span>` : ''}</p>
            <div class="or-mesures">${l.map((x, i) => `<button class="or-mes ${g.periode && i === 0 ? 'rep-a' : ''} ${g.periode && i === l.length - 1 ? 'rep-b' : ''} ${corrigee(i, x, g) ? 'corrigee' : ''} ${x.cases.filter((c) => c && c !== '—').length > 2 || x.cases.some((c, k) => k && c && c !== '—' && x.cases[k - 1] && x.cases[k - 1] !== '—') ? 'dense' : ''}" data-mes="${i}" data-t="${x.t}" title="Mesure ${g.boucle ? i + 1 : x.m} · ${mmss(x.t)}"><small>${g.boucle ? i + 1 : x.m}</small>${i && x.cle === l[i - 1].cle ? '<b class="or-pct" aria-label="comme la mesure d’avant">%</b>' : x.cases.map((c) => `<span class="or-b">${c && c !== '—' ? joli(c) : ''}</span>`).join('')}</button>`).join('')}</div>
            <div class="or-edit" hidden></div>
            <div class="ec-row"><button class="btn small" data-o="grille-copier">Copier la grille</button><button class="btn small" data-o="grille-txt">⬇ La grille (texte)</button></div></div>`; })()}
        <div class="ec-row"><button class="btn primary" data-o="studio">Jouer avec ces accords →</button><span class="muted small">Les 8 premiers changements, avec leur durée, deviennent « Mes accords ». La tonalité estimée (${esc(ton)}) colore le clavier.</span></div>`;
      box._noms = NOMS;
    }
    // Une mesure dont on a changé l'accord (dans la grille écrite) : elle se voit.
    const corrigee = (i, x, g) => { const e2 = entendus[i]; if (!e2) return false; const c = accs.find((a) => a.b > x.t + 0.05 && a.a < x.t + 240 / g.tempo - 0.05); return !!c && (c.r !== e2.r || c.q !== e2.q); };
    // Un nom d'accord lisible : la note en gros, sa sorte en petit, comme sur une partition (Si + maj7).
    const joli = (nm) => { const r = [...NOTES_FR].sort((u, v) => v.length - u.length).find((n) => nm.startsWith(n)) || ''; return `<b>${esc(r)}</b>${nm.slice(r.length) ? `<sup>${esc(nm.slice(r.length))}</sup>` : ''}`; };
    // Corriger un accord de la grille : on entend la mesure (le vrai son), on choisit la bonne note et la bonne sorte ;
    // la grille, l'onde et « Jouer avec ces accords » suivent tout de suite.
    function editer(i) {
      const g = q('.or-accords')._grille; const box = q('.or-edit'); if (!g || !box) return; const x = (g.boucle || g.mesures)[i]; const fin = x.t + 240 / g.tempo;
      const dedans = accs.filter((a) => a.b > x.t + 0.05 && a.a < fin - 0.05); const cur = dedans[0] || { r: 0, q: 'M' };
      // L'accord entendu au départ (avant toute correction) : c'est lui qu'on déplace dans le son.
      if (!entendus[i]) entendus[i] = { r: cur.r, q: cur.q, nom: dedans.map((a) => a.nom).join(' → ') || 'rien de clair' };
      box.hidden = false; box.dataset.i = i; const anc = entendus[i];
      const pl = plan(anc, cur); const change = anc.r !== cur.r || anc.q !== cur.q;
      const N2 = (pc) => NOTES_FR[pc];
      const dit = Object.entries(pl.dep).map(([pc, d]) => `${N2(+pc)} → ${N2((+pc + d + 12) % 12)}`).join(', ');
      box.innerHTML = `<div class="or-ed-tete"><b>Mesure ${g.boucle ? i + 1 : x.m}</b><span class="muted">${mmss(x.t)}</span><span>L’oreille a cru entendre <b>${esc(anc.nom)}</b></span></div>
        <div class="or-ed-choix"><label>Pour toi, c’est <select data-ed="r">${NOTES_FR.map((n, k) => `<option value="${k}" ${k === cur.r ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <select data-ed="q" aria-label="La sorte d’accord">${SORTES_ACCORD.map((k) => `<option value="${k}" ${k === cur.q ? 'selected' : ''}>${k === 'M' ? 'majeur' : k === 'm' ? 'mineur' : k}</option>`).join('')}</select>
        <button class="btn small" data-ed-ecoute>♪ L’accord seul, au piano</button></div>
        ${change ? `<div class="or-ed-son">
          <p>${dit ? `Dans le son, je déplacerais : <b>${esc(dit)}</b>, pendant cette mesure seulement.` : 'Ces deux accords ont les mêmes notes : rien à déplacer dans le son.'}${pl.manque.length ? ` <span class="muted">(${pl.manque.map(N2).join(', ')} n’est pas joué dans l’enregistrement : je ne peux pas l’inventer.)</span>` : ''}</p>
          <div class="or-ab-row"><button class="btn small" data-a="${x.t}" data-b="${fin}">▶ Avant : le son enregistré</button>${dit ? `<button class="btn small" data-ed-apres>▶ Après : corrigé dans le son</button><button class="btn small primary" data-ed-ok>✓ J’approuve : c’est mon nouvel enregistrement</button>` : ''}</div>
          <p class="muted small">Approuver fait une nouvelle version, réanalysée ; ↶ Annuler et l’original restent là.</p></div>`
        : `<div class="or-ab-row"><button class="btn small" data-a="${x.t}" data-b="${fin}">▶ Réentendre la mesure</button></div><p class="muted small">Choisis l’accord juste : la grille suit tout de suite, et tu pourras aussi le corriger dans le son.</p>`}`;
    }
    // La justesse : toute la prise un peu plus haut ou plus bas. Ce qui joue repart au même endroit, recalé.
    function regler(c) {
      c = Math.max(-50, Math.min(50, Math.round(c))); if (cible < 0) cents = c; else cp[cible] = c;
      const r = q('[data-cents]'); if (r) r.value = c;
      const lab = q('.or-cents'); if (lab) lab.textContent = `${c > 0 ? '+' : ''}${c} ¢`;
      montrerParties();
      if (tete && res) { const pos = posDe(tete); const { a, b, boucle } = tete; if (boucle) joueDe(a, b, { boucle: true }); else if (pos < b) joueDe(pos, b); }
    }
    el.addEventListener('input', (e) => { if (e.target.matches('[data-cents]')) regler(+e.target.value); });
    // Choisir ce qu'on accorde : toute la prise, ou une partie (une partie plus basse que les autres, par exemple).
    function viser(i) { cible = i; const v = i < 0 ? cents : (cp[i] || 0); const r = q('[data-cents]'); if (r) r.value = v; const lab = q('.or-cents'); if (lab) lab.textContent = `${v > 0 ? '+' : ''}${v} ¢`; const sl = q('[data-cible]'); if (sl) sl.value = i; montrerParties(); }
    el.addEventListener('change', (e) => {
      if (e.target.matches('[data-aligner]')) { aligner = e.target.checked; if (aligner) { caler(); montrerMonter(); dessiner(); } return; }
      if (e.target.matches('[data-cible]')) { viser(+e.target.value); return; }
      const vl = e.target.dataset.voulu; if (vl != null) { if (e.target.checked) voulus.add(+vl); else voulus.delete(+vl); montrerVoix(); return; }
      const k = e.target.dataset.ed; if (!k) return; const box = q('.or-edit'); const i = +box.dataset.i; const g = q('.or-accords')._grille; const x = (g.boucle || g.mesures)[i]; const fin = x.t + 240 / g.tempo;
      const rr = +box.querySelector('[data-ed=r]').value; const qq = box.querySelector('[data-ed=q]').value; const nm = nomAccord(rr, qq);
      // Les accords de cette mesure deviennent le bon ; s'il n'y en avait pas, on en pose un.
      const dedans = accs.filter((a) => a.b > x.t + 0.05 && a.a < fin - 0.05);
      if (dedans.length) dedans.forEach((a) => { a.r = rr; a.q = qq; a.nom = nm; }); else { accs.push({ r: rr, q: qq, nom: nm, a: x.t, b: fin, temps: 4 }); accs.sort((u, v) => u.a - v.a); }
      montrerAccords(); dessiner(); editer(i); toast(`Mesure corrigée : ${nm}.`);
    });
    // Dessine l’énergie de la pièce et ses parties dans le temps.
    function dessiner() {
      if (!res) return;
      const { ctx, w, h } = cv;
      const X = (t) => (t / res.duree) * w;
      ctx.clearRect(0, 0, w, h);
      res.parties.forEach((p) => { ctx.fillStyle = p.silence ? 'rgba(27,25,21,.05)' : `${FORCE[forceDe(p)]}22`; ctx.fillRect(X(p.a), 0, X(p.b) - X(p.a), h); ctx.fillStyle = 'rgba(27,25,21,.35)'; ctx.fillRect(X(p.a), 0, 1, h); });
      if (res.boucle) { ctx.fillStyle = 'rgba(201,164,92,.28)'; ctx.fillRect(X(res.boucle.a), 0, X(res.boucle.b) - X(res.boucle.a), h); }
      // À retravailler : hachuré, pour qu'on le voie sans le confondre avec les parties.
      (diag?.travail || []).filter((o) => o.a != null && o.b - o.a < res.duree * 0.6).forEach((o) => {
        ctx.save(); ctx.beginPath(); ctx.rect(X(o.a), 0, X(o.b) - X(o.a), h); ctx.clip();
        ctx.strokeStyle = 'rgba(217,58,36,.45)'; ctx.lineWidth = 1.5;
        for (let x = X(o.a) - h; x < X(o.b); x += 8) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
        ctx.restore();
      });
      // L'énergie, colorée par ce que l'oreille a trouvé : chaque partie selon son énergie (bleu pâle à foncé), la boucle en or, le moment fort en
      // orange, ce qui est à retravailler en rouge, les silences pâles.
      const lo = Math.max(...res.db) - 50; const onde = new Path2D(); onde.moveTo(0, h - 18);
      for (let i = 0; i < res.db.length; i += 2) onde.lineTo((i / res.db.length) * w, h - 18 - Math.max(0, (res.db[i] - lo) / 50) * (h - 34));
      onde.lineTo(w, h - 18); onde.closePath();
      const zone = (a, b, coul) => { ctx.save(); ctx.beginPath(); ctx.rect(X(a), 0, X(b) - X(a), h); ctx.clip(); ctx.fillStyle = coul; ctx.fill(onde); ctx.restore(); };
      res.parties.forEach((p) => zone(p.a, p.b, FORCE[forceDe(p)]));
      if (res.boucle) zone(res.boucle.a, res.boucle.b, '#c9a45c');
      zone(res.momentFort[0], res.momentFort[1], '#e07b2c');
      (diag?.travail || []).filter((o) => o.a != null && o.b - o.a < res.duree * 0.6).forEach((o) => zone(o.a, o.b, '#d93a24'));
      // Les accords de la grille, sous l'onde (ils changent tout de suite quand on les corrige).
      const g = q('.or-accords')?._grille;
      if (g) { ctx.font = '600 12px "Atkinson Hyperlegible", sans-serif'; ctx.fillStyle = '#1d1a15'; let dernier = -99; g.mesures.forEach((m) => { const nm = m.cases.find((x) => x && x !== '—'); const x = X(m.t); if (nm && x > dernier + 6) { ctx.fillText(nm, x + 2, h - 4); dernier = x + 2 + ctx.measureText(nm).width; } }); }
      if (plage) { ctx.fillStyle = 'rgba(29,26,21,.22)'; ctx.fillRect(X(plage.a), 0, X(plage.b) - X(plage.a), h); ctx.fillStyle = '#1d1a15'; ctx.fillRect(X(plage.a) - 1, 0, 3, h); ctx.fillRect(X(plage.b) - 1, 0, 3, h); }
      ctx.fillStyle = '#d93a24'; const mx = X(res.momentFort[0] + 5); ctx.beginPath(); ctx.arc(mx, 10, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6d655a'; ctx.font = '12px "Atkinson Hyperlegible", sans-serif';
      for (let t = 0; t < res.duree; t += 30) ctx.fillText(mmss(t), X(t) + 3, 13);
    }
    const joueDe = (a, b, { boucle = false } = {}) => {
      arrete(); const c = audio(); a = Math.max(0, a); b = Math.min(buf.duration, Math.max(a + 0.05, b)); // jamais avant le début ni après la fin
      const t0 = c.currentTime + 0.05; let segs;
      if (boucle) { segs = [{ a, b, r: rate(a) }]; stopBoucle = boucler(c, buf, { a, b }, out(), 0.12, segs[0].r); }
      else {
        // Un segment par partie traversée : chacune garde sa justesse, la vitesse change pile à la frontière.
        const bornes = [a, ...res.parties.map((p) => p.b).filter((x) => x > a + 0.01 && x < b - 0.01), b];
        segs = bornes.slice(0, -1).map((x, k) => ({ a: x, b: bornes[k + 1], r: rate(x + 0.02) }));
        const src = c.createBufferSource(); src.buffer = buf; let w = t0; segs.forEach((g) => { src.playbackRate.setValueAtTime(g.r, w); w += (g.b - g.a) / g.r; });
        src.connect(out()); src.start(t0, a, b - a); lecture = src;
      }
      tete = { t0, a, b, boucle, segs }; const l = q('[data-o=lire]'); if (l) l.textContent = '■ Arrêter'; requestAnimationFrame(animerTete);
    };
    // Enregistrer son clavier au micro, jusqu'à une minute, puis l'analyser comme un fichier.
    async function micro(b) {
      if (rec) { rec.stop(); return; }
      try {
        const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const morceaux = []; rec = new MediaRecorder(flux);
        rec.ondataavailable = (ev) => ev.data.size && morceaux.push(ev.data);
        rec.onstop = async () => { flux.getTracks().forEach((t) => t.stop()); rec = null; b.textContent = '● Enregistrer mon clavier'; b.classList.remove('on'); await analyser(await new Blob(morceaux).arrayBuffer(), 'Mon enregistrement'); };
        rec.start(); b.textContent = '■ Arrêter et analyser'; b.classList.add('on'); etat('J’écoute… joue ton bout (une minute au plus).');
        setTimeout(() => rec?.state === 'recording' && rec.stop(), 60000);
      } catch { toast('Micro refusé : autorise-le dans la barre d’adresse.'); }
    }
    el.addEventListener('change', async (e) => {
      const o = e.target.dataset.o;
      if (o === 'file' && e.target.files[0]) { const f = e.target.files[0]; await analyser(await f.arrayBuffer(), f.name.replace(/\.[^.]+$/, '')); }
      if (o === 'choix' && e.target.value) {
        const v = e.target.value; const label = e.target.selectedOptions[0].textContent;
        etat('Je charge la pièce…');
        try {
          const url = v.startsWith('url:') ? v.slice(4) : await audioURL(espace.entries.find((x) => x.id === v.slice(3)).audio);
          await analyser(await (await fetch(url)).arrayBuffer(), label);
        } catch { etat('Impossible de charger ce son.'); }
      }
    });
    // Arrivée depuis une chanson ou le mur (#/oreille?son=<id>) : ce son-là est chargé et écouté tout de suite.
    const voulu = (location.hash.match(/[?&]son=([\w-]+)/) || [])[1];
    const sel = q('[data-o=choix]');
    if (voulu && sel.querySelector(`option[value="id:${voulu}"]`)) { sel.value = `id:${voulu}`; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    // Choisir un passage en glissant sur l'onde (un simple toucher, lui, fait écouter à partir de là).
    let glisse = false;
    const tDe = (e) => { const r = q('.or-canvas').getBoundingClientRect(); return Math.max(0, Math.min(res.duree, ((e.clientX - r.left) / r.width) * res.duree)); };
    q('.or-canvas').addEventListener('pointerdown', (e) => { if (!res) return; presse = { x: e.clientX, t: tDe(e) }; });
    q('.or-canvas').addEventListener('pointermove', (e) => { if (!presse || Math.abs(e.clientX - presse.x) < 6) return; const t = tDe(e); plage = { a: Math.min(presse.t, t), b: Math.max(presse.t, t) }; dessiner(); });
    addEventListener('pointerup', function lacher() { if (!el.isConnected) { removeEventListener('pointerup', lacher); return; }
      if (!presse) return; const fini = plage && Math.abs(plage.b - plage.a) > 0.05 && presse; presse = null;
      if (fini) { glisse = true; caler(); montrerMonter(); dessiner(); } });
    q('.or-canvas').addEventListener('click', (e) => {
      if (!res) return; if (glisse) { glisse = false; return; }
      const r = e.currentTarget.getBoundingClientRect(); const t = ((e.clientX - r.left) / r.width) * res.duree;
      joueDe(Math.max(0, t), res.duree);
    });
    el.addEventListener('click', async (e) => {
      const o = e.target.closest('[data-o]')?.dataset.o;
      if (o === 'micro') { micro(e.target.closest('[data-o]')); return; }
      const wv = e.target.closest('[data-wav-a]');
      if (wv && res) { const blob = await rendreBoucle(buf, { a: +wv.dataset.wavA, b: +wv.dataset.wavB }, 1, 0.12, rate(+wv.dataset.wavA)); const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob); a2.download = `${nom} · ${mmss(+wv.dataset.wavA)}-${mmss(+wv.dataset.wavB)}.wav`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(a2); a2.click(); a2.remove(); return; }
      const rep = e.target.closest('[data-a]');
      if (rep && res && !rep.closest('.or-carte')) { joueDe(+rep.dataset.a, +rep.dataset.b, { boucle: !!rep.dataset.boucle }); return; }
      if (o === 'lire' && res) { if (tete) arrete(); else joueDe(0, res.duree); return; }
      if (!res) return; // (les accords et les mesures de la grille n'ont pas de data-o : ils doivent passer)
      // Une note de la voix : on l'entend telle que chantée, une occurrence après l'autre à chaque toucher.
      const nt = e.target.closest('[data-note]');
      if (nt && voix?.notes) { const m = +nt.dataset.note; if (nt.classList.contains('or-note') && choisie !== m) { choisie = m; montrerVoix(); } const b = voix.notes.find((x) => x.m === m); if (b?.occ?.length) { const k = (occK[m] || 0) % b.occ.length; occK[m] = k + 1; joueDe(b.occ[k] - 0.05, b.occ[k] + 0.9); } return; }
      const mo = e.target.closest('[data-m]')?.dataset.m;
      if (mo) {
        const { a, b } = plage || {}; const L = (b || 0) - (a || 0);
        if (mo === 'ecouter') joueDe(a, b);
        if (mo === 'fermer') { plage = null; montrerMonter(); dessiner(); }
        if (mo === 'copier') { bout = copier(buf, a, b); montrerMonter(); toast(`Copié : ${L.toFixed(1).replace('.', ',')} s. Choisis un autre passage : « Coller ici » ou « Remplir avec le bout copié ».`); }
        if (mo === 'couper') await monterAvec(couper(buf, a, b), `Coupé : ${mmss(a)} à ${mmss(b)}.`);
        if (mo === 'coller' && bout) await monterAvec(coller(buf, a, bout), `Collé à ${mmss(a)}.`);
        if (mo === 'remplir' && bout) await monterAvec(remplir(buf, a, b, bout), `Passage rempli avec le bout copié.`);
        if (mo === 'avant') { const src = a - L >= 0 ? copier(buf, a - L, a) : copier(buf, b, Math.min(res.duree, b + L)); await monterAvec(remplir(buf, a, b, src), 'Passage rempli avec ce qui précède.'); }
        if (mo === 'annuler' && pile.length) { const p0 = pile.pop(); await analyserBuf(p0.buf, p0.nom); montrerMonter(); }
        if (mo === 'origine' && pile.length) { const p0 = pile[0]; pile = []; await analyserBuf(p0.buf, p0.nom); montrerMonter(); }
        if (mo === 'wav') { const a2 = document.createElement('a'); a2.href = URL.createObjectURL(wav(buf)); a2.download = `${nom}.wav`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(a2); a2.click(); a2.remove(); }
        if (mo === 'mur') { const b2 = e.target.closest('[data-m]'); b2.disabled = true; try { const au = await uploadAudio(wav(buf)); await saveEntry({ type: 'audio', title: nom, audio: au, data: { monte: pile.length } }); toast('La version montée est au mur, à côté de l’originale.'); b2.textContent = 'Au mur ✓'; } catch (err) { toast(err.message); b2.disabled = false; } }
        return;
      }
      const cr = e.target.closest('[data-corr]');
      if (cr) { const m = +cr.dataset.corr; corr[m] = Math.max(-100, Math.min(100, (corr[m] || 0) + +cr.dataset.d)); corrige = true; appliquer(); return; }
      const cj = e.target.closest('[data-corr-juste]');
      if (cj) { corr[+cj.dataset.corrJuste] = +cj.dataset.v; corrige = true; appliquer(); const b = voix.notes.find((x) => x.m === +cj.dataset.corrJuste); if (b?.occ?.length) joueDe(b.occ[0] - 0.05, b.occ[0] + 0.9); return; }
      const ab = e.target.closest('[data-ab]');
      if (ab) { corrige = ab.dataset.ab === '1'; appliquer(); return; }
      if (o === 'retouche-annuler') { corr = {}; appliquer(); return; }
      if (o === 'retouche-wav' || o === 'retouche-mur') {
        const copie = corrigerNotes(orig, corr, voix.notes, voix.piste); const blob = wav(copie);
        if (o === 'retouche-wav') { const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob); a2.download = `${nom} · retouchée.wav`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(a2); a2.click(); a2.remove(); return; }
        const b2 = e.target.closest('[data-o]'); b2.disabled = true;
        try { const a = await uploadAudio(blob); await saveEntry({ type: 'audio', title: `${nom} · retouchée`, audio: a, data: { retouche: Object.fromEntries(Object.entries(corr).filter(([, v]) => v)) } }); toast('La prise retouchée est au mur, à côté de l’originale.'); b2.textContent = 'Au mur ✓'; } catch (err) { toast(err.message); b2.disabled = false; }
        return;
      }
      const pt = e.target.closest('[data-pt]');
      if (pt) { const i = +pt.dataset.pt; const p = res.parties[i]; plage = { a: p.a, b: p.b }; montrerMonter(); if (!p.silence) viser(i); else dessiner(); joueDe(p.a, p.b); return; }
      const ca = e.target.closest('[data-cents-auto]');
      if (ca) { viser(-1); regler(+ca.dataset.centsAuto); toast(`Prise accordée de ${cents > 0 ? '+' : ''}${cents} cents pour l’écoute et les WAV.`); return; }
      if (e.target.closest('[data-ed-apres]') || e.target.closest('[data-ed-ok]')) {
        const box = q('.or-edit'); const g = q('.or-accords')._grille; const i = +box.dataset.i; const x = (g.boucle || g.mesures)[i]; const fin = x.t + 240 / g.tempo;
        const vers = { r: +box.querySelector('[data-ed=r]').value, q: box.querySelector('[data-ed=q]').value }; const cle = `${i}:${vers.r}${vers.q}`;
        if (apercu?.cle !== cle) { etat('Je déplace les notes dans le son…'); await new Promise((ok) => setTimeout(ok, 30)); apercu = { cle, ...changerAccordSon(buf, x.t, fin, entendus[i], vers) }; etat(''); }
        const nouv = apercu.buffer; if (!nouv) return;
        if (e.target.closest('[data-ed-apres]')) { const garde = buf; buf = nouv; joueDe(x.t, fin); buf = garde; return; }
        const quoi = `Mesure ${g.boucle ? i + 1 : x.m} : ${entendus[i].nom} → ${nomAccord(vers.r, vers.q)}, dans le son.`; apercu = null;
        await monterAvec(nouv, quoi); return;
      }
      if (e.target.closest('[data-ed-ecoute]')) { const box = q('.or-edit'); const rr = +box.querySelector('[data-ed=r]').value; const qq = box.querySelector('[data-ed=q]').value; import('../sampler.js').then(({ accord, prechargerSons }) => { prechargerSons(['piano']); const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6] }[qq] || [0, 4, 7]; accord('piano', IV.map((iv) => 52 + ((rr + 8) % 12) + iv), { dur: 1.4, vel: 0.6 }); }); return; }
      const ac = e.target.closest('[data-acc]');
      if (ac && accs) { const a = accs[+ac.dataset.acc]; joueDe(a.a, a.b); return; }
      const ms = e.target.closest('[data-mes]'); const g = q('.or-accords')._grille;
      if (ms && g) { q('.or-mes.choisie')?.classList.remove('choisie'); ms.classList.add('choisie'); const i = +ms.dataset.mes; const x = (g.boucle || g.mesures)[i]; joueDe(x.t, x.t + (240 / g.tempo)); editer(i); return; }
      if ((o === 'grille-copier' || o === 'grille-txt') && g) {
        const txt = grilleTexte(g, `${nom} · ${res.ton.split(' ou ')[0]}`);
        if (o === 'grille-copier') { navigator.clipboard?.writeText(txt).then(() => toast('Grille copiée : colle-la dans un message, un document, ton logiciel.')).catch(() => toast('Copie refusée par le navigateur.')); return; }
        const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a2.download = `Grille · ${nom.replace(/[\\/:*?"<>|]+/g, ' ')}.txt`; document.body.append(a2); a2.click(); a2.remove(); return;
      }
      if (o === 'studio' && accs?.length) {
        const [n, mode] = res.ton.split(' ou ')[0].split(' '); const NOMS = q('.or-accords')._noms; let tonique = NOMS.indexOf(n); if (mode === 'mineur') tonique = (tonique + 3) % 12;
        const DUR = [1, 2, 3, 4, 6, 8]; const proche = (t) => DUR.reduce((x, y) => (Math.abs(y - t) < Math.abs(x - t) ? y : x));
        // Si la suite se répète, on n'en garde qu'un tour : la boucle du studio la fera revenir.
        let tour = accs.length; for (let k = 1; k <= Math.min(8, accs.length / 2); k++) { if (accs.every((x, i) => i + k >= accs.length || x.nom === accs[i + k].nom)) { tour = k; break; } }
        chargerGrille(tonique, accs.slice(0, Math.min(8, tour)).map((a) => [a.r, a.q, proche(a.temps)]), `Accords de « ${nom.slice(0, 30)} »`);
        location.hash = '#/studio?tab=beat'; return;
      }
      if (o === 'voix-quand-meme') { voixForcee = true; montrerVoix(); return; }
      if (o === 'garder' && (voix?.voix || voixForcee)) {
        const qui = e.target.dataset.qui;
        // On cumule, prise après prise : chaque note garde son nombre de fois et son écart moyen.
        try {
          await saveProfile((d) => {
            const acc = { ...(d.notesVoix || {}) };
            voix.notes.forEach((b) => { const o2 = acc[b.m] || { n: 0, cents: 0 }; acc[b.m] = { n: o2.n + b.n, cents: (o2.cents * o2.n + b.cents * b.n) / (o2.n + b.n) }; });
            return { ...d, notesVoix: acc, notesVoixMaj: Date.now() };
          }, qui);
          toast(`Gardé dans le profil de ${qui}.`); e.target.closest('.or-garder').innerHTML = `<span class="muted small">Gardé dans le profil de ${esc(qui)} ✓</span>`;
        } catch (err) { toast(err.message); }
        return;
      }
      if (o === 'boucle') {
        if (stopBoucle) { arrete(); return; }
        joueDe(res.boucle.a, res.boucle.b, { boucle: true }); e.target.textContent = '■ Arrêter la boucle';
      }
      if (o === 'fond' && res.boucle) {
        arrete(); const { a, b } = res.boucle; const f = poserFond({ nom: `la boucle de « ${nom.slice(0, 30)} »`, buf, a, b, bpm: res.bpm, rate: rate(a) });
        // Les accords de la boucle deviennent ceux du studio, s'ils remplissent exactement ses mesures (sinon le pad jouerait à côté).
        const DUR = [1, 2, 3, 4, 6, 8]; const proche = (t) => DUR.reduce((x, y) => (Math.abs(y - t) < Math.abs(x - t) ? y : x));
        const dans = (accs || []).filter((x) => x.a >= a - 0.15 && x.a < b - 0.15).slice(0, 8).map((x) => [x.r, x.q, proche(x.temps)]);
        if (dans.length && dans.reduce((t, x) => t + x[2], 0) === f.mes * 4) {
          const [n, mode] = res.ton.split(' ou ')[0].split(' '); const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si']; let tonique = NOMS.indexOf(n); if (mode === 'mineur') tonique = (tonique + 3) % 12;
          chargerGrille(Math.max(0, tonique), dans, `Accords de la boucle`); toast('La boucle et ses accords sont dans Jouer. ▶ pour lancer.');
        } else toast('La boucle est dans Jouer, sous le beat. Ses accords n’ont pas pu être calés : baisse le pad si ça frotte.');
        location.hash = '#/studio?tab=beat'; return;
      }
      if (o === 'fort') joueDe(res.momentFort[0], res.momentFort[1]);
      if (o === 'boucle-wav' && res.boucle) { const blob = await rendreBoucle(buf, res.boucle, 4, 0.12, rate(res.boucle.a)); const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob); a2.download = `Boucle de ${nom}.wav`.replace(/[\\/:*?"<>|]+/g, ' '); document.body.append(a2); a2.click(); a2.remove(); return; }
      if (o === 'ecrire' || o === 'relais') {
        const b = e.target.closest('[data-o]'); b.disabled = true; const label = b.textContent; b.textContent = 'Je prépare la boucle…';
        try {
          const blob = await rendreBoucle(buf, res.boucle, o === 'ecrire' ? 8 : 3, 0.12, rate(res.boucle.a));
          if (o === 'ecrire') {
            // Écrire la reprend comme fond, au choix « Écrire sur ».
            window.__flipFond = { nom: `La boucle de « ${nom} »`, url: URL.createObjectURL(blob) };
            location.hash = '#/ecrire';
          } else {
            const a = await uploadAudio(blob);
            await saveEntry({ type: 'audio', title: `Boucle de « ${nom} » · ${res.bpm} BPM · ${res.ton}`, audio: a, data: { relais: true, asks: ['chante'], intent: 'écris dessus, chante dessus', stage: 0 } });
            toast('La boucle est au relais.');
          }
        } catch (err) { toast(err.message || 'La boucle n’a pas pu être préparée.'); }
        b.disabled = false; b.textContent = label;
      }
    });
    addEventListener('resize', dessiner);
    return () => { arrete(); removeEventListener('diapason:stop', surStop); removeEventListener('resize', dessiner); roC.disconnect(); cv.dispose?.(); };
  },
};
