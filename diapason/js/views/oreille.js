// L'oreille : on dépose une pièce, FLIP l'écoute et la découpe pour nous. On gagne des heures :
// on sait où sont les silences, les parties, le moment fort, et on a une boucle prête à recevoir des mots.
import { audio, out } from '../audio.js';
import { clavierDe } from '../doigte.js';
import { espace, audioURL, saveEntry, uploadAudio, saveProfile, members } from '../espace.js';
import { toast, autoCanvas } from '../ui.js';
import { esc } from './carnet.js';
import { ecouter, boucler, rendreBoucle, diagnostic, notesVoix, nomNote, trouverAccords, grilleMesures, grilleTexte } from '../oreille.js';
import { chargerGrille } from './studio.js';

const PIECES = [['data/sons/frog-joywalk-complet.mp3', 'Joy Walk (Frog)'], ['data/sons/frog-visite.mp3', 'Projet 1, après la pause (Frog)']];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

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
        <div class="or-carte"><canvas class="or-canvas" aria-label="La pièce, ses parties, ses silences et sa boucle"></canvas></div>
        <div class="or-diag"></div>
        <div class="or-legende"><span><i class="lg-p"></i>une partie (touche pour l’écouter)</span><span><i class="lg-s"></i>silence</span><span><i class="lg-b"></i>la boucle</span><span><i class="lg-m"></i>le moment fort</span><span><i class="lg-t"></i>à retravailler</span></div>
        <div class="or-voix"></div>
        <div class="or-accords"></div>
        <div class="or-actions">
          <button class="btn primary" data-o="boucle">▶ Écouter la boucle</button>
          <button class="btn" data-o="fort">▶ Le moment fort</button>
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
    const arrete = () => { stopBoucle?.(); stopBoucle = null; lecture?.stop?.(); lecture = null; q('[data-o=boucle]').textContent = '▶ Écouter la boucle'; };

    async function analyser(arrayBuffer, n) {
      arrete(); nom = n;
      try {
        etat('Je décode la pièce…');
        buf = await audio().decodeAudioData(arrayBuffer);
        res = await ecouter(buf, etat); diag = diagnostic(res); voix = null;
        etat('');
        montrer();
        accs = await trouverAccords(buf, res.bpm, etat); etat('');
        montrerAccords();
        voix = await notesVoix(buf, etat); etat('');
        montrerVoix();
      } catch { etat('Je n’arrive pas à lire ce fichier. Essaie un mp3, un m4a ou un wav.'); }
    }
    function montrer() {
      q('.or-res').hidden = false;
      q('.or-titre').textContent = nom;
      const jouees = res.parties.filter((p) => !p.silence);
      q('.or-faits').innerHTML = [
        ['Durée', mmss(res.duree)], ['Tempo', `${res.bpm} BPM`], ['Tonalité estimée', res.ton],
        ['Parties', `${jouees.length}`], ['Silences', `${res.silences.length}`], ['Moment fort', mmss(res.momentFort[0])],
      ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')
        + (res.boucle ? `<p class="or-boucle">Boucle trouvée : de <b>${mmss(res.boucle.a)}</b> à <b>${mmss(res.boucle.b)}</b> (${Math.round(res.boucle.b - res.boucle.a)} s), ressemblance ${Math.round(res.boucle.qualite * 100)} %.</p>` : '<p class="or-boucle">Pas de passage assez long pour une boucle.</p>');
      q('[data-o=boucle]').disabled = !res.boucle; q('[data-o=ecrire]').disabled = !res.boucle;
      const rel = q('[data-o=relais]'); if (rel) rel.disabled = !res.boucle;
      // Ce que FLIP entend : ce qui brille déjà, ce qui est à retravailler. Chaque repère se touche pour l'écouter.
      const item = (o, cl) => `<li class="${cl}" ${o.a != null ? `data-a="${o.a}" data-b="${o.b}" role="button" tabindex="0"` : ''}><b>${esc(o.titre)}</b><span>${esc(o.quoi)}</span>${o.a != null ? '<small>▶ écouter ce passage</small>' : ''}</li>`;
      q('.or-diag').innerHTML = `
        <div class="or-col or-bien"><h3>Ce qui brille déjà</h3><ul>${diag.brille.map((o) => item(o, 'ok')).join('')}</ul></div>
        <div class="or-col or-trav"><h3>À retravailler</h3><ul>${diag.travail.map((o) => item(o, 'tr')).join('') || '<li class="vide"><span>Rien de flagrant dans l’énergie ni la forme. Fiez-vous à vos oreilles pour le reste.</span></li>'}</ul></div>`;
      q('.or-voix').innerHTML = '';
      dessiner();
    }
    // Sur une voix seule : les meilleures notes, celles à travailler, et l'exercice qui va avec.
    function montrerVoix() {
      const box = q('.or-voix');
      if (!voix?.voix) { box.innerHTML = '<p class="muted small">Notes de la voix : pour les mesurer, dépose un enregistrement de voix seule (un mumble, une prise a cappella). Dans un mélange d’instruments, la mesure ne serait pas fiable.</p>'; return; }
      const puce = (b) => { const c = Math.round(b.cents); const k = Math.abs(c) < 12 ? 'j' : Math.abs(c) < 20 ? 'p' : 'f'; return `<span class="or-note ${k}" title="${b.n} fois, ${c > 0 ? '+' : ''}${c} cents en moyenne">${nomNote(b.m)}<small>${c > 0 ? '+' : ''}${c}¢</small></span>`; };
      const qui = espace.connected ? members() : [];
      box.innerHTML = `
        <h3>Les notes de la voix <small class="muted">${voix.nNotes} notes tenues mesurées</small></h3>
        <div class="or-notes">${voix.notes.map(puce).join('')}</div>
        <div class="or-col-2">
          <div><h4>Les meilleures notes</h4><p>${voix.fortes.length ? voix.fortes.map((b) => `<b>${nomNote(b.m)}</b>`).join(', ') + ' : justes et stables. C’est là que la voix est chez elle ; une mélodie qui s’y pose sonnera.' : 'Pas encore assez de notes répétées pour le dire.'}</p></div>
          <div><h4>À travailler</h4><p>${voix.aTravailler.length ? voix.aTravailler.map((b) => `<b>${nomNote(b.m)}</b> (${b.cents > 0 ? 'un peu haut' : 'un peu bas'}, ${Math.round(Math.abs(b.cents))} cents)`).join(', ') : 'Aucune note nettement à côté. Bravo.'}</p>
          ${voix.aTravailler.length ? '<a class="btn small" href="#/accord">Voix + piano : les retravailler avec le clavier →</a>' : ''}</div>
        </div>
        ${qui.length ? `<p class="or-garder">C’est la voix de : ${qui.map((m) => `<button class="btn small" data-o="garder" data-qui="${esc(m)}">${esc(m)}</button>`).join(' ')} <span class="muted small">le labo garde ces notes dans son profil et apprend, prise après prise.</span></p>` : ''}
        <p class="or-src-note muted small">Comment : hauteur mesurée 45 fois par seconde par autocorrélation (comme un accordeur) ; une note compte si elle tient au moins 0,14 s. Juste : moins de 12 cents d’écart. Retour visuel et justesse : Welch, Howard et Rush 1989.</p>`;
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
            <div class="or-mesures">${l.map((x, i) => `<button class="or-mes ${g.periode && i === 0 ? 'rep-a' : ''} ${g.periode && i === l.length - 1 ? 'rep-b' : ''}" data-mes="${i}" title="Mesure ${g.boucle ? i + 1 : x.m} · ${mmss(x.t)}"><small>${g.boucle ? i + 1 : x.m}</small>${i && x.cle === l[i - 1].cle ? '<b class="or-pct">%</b>' : x.cases.map((c) => `<span>${c ? esc(c) : '·'}</span>`).join('')}</button>`).join('')}</div>
            <div class="ec-row"><button class="btn small" data-o="grille-copier">Copier la grille</button><button class="btn small" data-o="grille-txt">⬇ La grille (texte)</button></div></div>`; })()}
        <div class="ec-row"><button class="btn primary" data-o="studio">Jouer avec ces accords →</button><span class="muted small">Les 8 premiers changements, avec leur durée, deviennent « Mes accords ». La tonalité estimée (${esc(ton)}) colore le clavier.</span></div>`;
      box._noms = NOMS;
    }
    function dessiner() {
      if (!res) return;
      const { ctx, w, h } = cv;
      const X = (t) => (t / res.duree) * w;
      ctx.clearRect(0, 0, w, h);
      res.parties.forEach((p, i) => { ctx.fillStyle = p.silence ? 'rgba(27,25,21,.06)' : i % 2 ? 'rgba(42,111,196,.10)' : 'rgba(184,51,106,.10)'; ctx.fillRect(X(p.a), 0, X(p.b) - X(p.a), h); });
      if (res.boucle) { ctx.fillStyle = 'rgba(201,164,92,.28)'; ctx.fillRect(X(res.boucle.a), 0, X(res.boucle.b) - X(res.boucle.a), h); }
      // À retravailler : hachuré, pour qu'on le voie sans le confondre avec les parties.
      (diag?.travail || []).filter((o) => o.a != null && o.b - o.a < res.duree * 0.6).forEach((o) => {
        ctx.save(); ctx.beginPath(); ctx.rect(X(o.a), 0, X(o.b) - X(o.a), h); ctx.clip();
        ctx.strokeStyle = 'rgba(217,58,36,.45)'; ctx.lineWidth = 1.5;
        for (let x = X(o.a) - h; x < X(o.b); x += 8) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
        ctx.restore();
      });
      const lo = Math.max(...res.db) - 50;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let i = 0; i < res.db.length; i += 2) ctx.lineTo((i / res.db.length) * w, h - Math.max(0, (res.db[i] - lo) / 50) * (h - 16));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = 'rgba(27,25,21,.75)'; ctx.fill();
      ctx.fillStyle = '#d93a24'; const mx = X(res.momentFort[0] + 5); ctx.beginPath(); ctx.arc(mx, 10, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6d655a'; ctx.font = '12px "Atkinson Hyperlegible", sans-serif';
      for (let t = 0; t < res.duree; t += 30) ctx.fillText(mmss(t), X(t) + 3, h - 4);
    }
    const joueDe = (a, b) => {
      arrete();
      const c = audio(); const src = c.createBufferSource(); src.buffer = buf; src.connect(out());
      src.start(c.currentTime + 0.05, a, b - a); lecture = src;
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
    q('.or-canvas').addEventListener('click', (e) => {
      if (!res) return;
      const r = e.currentTarget.getBoundingClientRect(); const t = ((e.clientX - r.left) / r.width) * res.duree;
      const p = res.parties.find((x) => t >= x.a && t < x.b && !x.silence);
      if (p) { joueDe(p.a, p.b); toast(`Partie de ${mmss(p.a)} à ${mmss(p.b)}`); }
    });
    el.addEventListener('click', async (e) => {
      const o = e.target.closest('[data-o]')?.dataset.o;
      if (o === 'micro') { micro(e.target.closest('[data-o]')); return; }
      const rep = e.target.closest('.or-diag [data-a]');
      if (rep && res) { joueDe(+rep.dataset.a, +rep.dataset.b); return; }
      if (!o || !res) return;
      const ac = e.target.closest('[data-acc]');
      if (ac && accs) { const a = accs[+ac.dataset.acc]; joueDe(a.a, a.b); return; }
      const ms = e.target.closest('[data-mes]'); const g = q('.or-accords')._grille;
      if (ms && g) { const x = (g.boucle || g.mesures)[+ms.dataset.mes]; joueDe(x.t, x.t + (240 / g.tempo)); return; }
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
      if (o === 'garder' && voix?.voix) {
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
        arrete(); stopBoucle = boucler(audio(), buf, res.boucle, out()); e.target.textContent = '■ Arrêter la boucle';
      }
      if (o === 'fort') joueDe(res.momentFort[0], res.momentFort[1]);
      if (o === 'ecrire' || o === 'relais') {
        const b = e.target.closest('[data-o]'); b.disabled = true; const label = b.textContent; b.textContent = 'Je prépare la boucle…';
        try {
          const blob = await rendreBoucle(buf, res.boucle, o === 'ecrire' ? 8 : 3);
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
    return () => { arrete(); removeEventListener('resize', dessiner); roC.disconnect(); cv.dispose?.(); };
  },
};
