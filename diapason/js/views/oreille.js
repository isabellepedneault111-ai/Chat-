// L'oreille : on dépose une pièce, FLIP l'écoute et la découpe pour nous. On gagne des heures :
// on sait où sont les silences, les parties, le moment fort, et on a une boucle prête à recevoir des mots.
import { audio, out } from '../audio.js';
import { espace, audioURL, saveEntry, uploadAudio, saveProfile, members } from '../espace.js';
import { toast, autoCanvas } from '../ui.js';
import { esc } from './carnet.js';
import { ecouter, boucler, rendreBoucle, diagnostic, notesVoix, nomNote } from '../oreille.js';

const PIECES = [['data/sons/frog-joywalk-complet.mp3', 'Joy Walk (Frog)'], ['data/sons/frog-visite.mp3', 'Projet 1, après la pause (Frog)']];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export default {
  id: 'oreille',
  mount(el) {
    let buf = null; let res = null; let nom = ''; let diag = null; let voix = null; let stopBoucle = null; let lecture = null;
    const sons = () => (espace.connected ? espace.entries.filter((e) => e.audio && !e.audio.type?.startsWith('video')) : []);
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">L’oreille</p>
        <h1>Dépose une pièce. FLIP l’écoute pour toi.</h1>
        <p class="muted">Les silences, les parties, le tempo, la tonalité, le moment fort, et une boucle qui ne s’entend pas : en quelques secondes, ce qui prend une heure à l’oreille.</p>
      </div></div>
      <section class="panel or-src">
        <label class="btn primary">Choisir un fichier audio<input type="file" accept="audio/*" data-o="file" hidden></label>
        <span class="muted">ou</span>
        <select data-o="choix"><option value="">Une pièce ou un son de l’espace…</option>
          ${PIECES.map(([u, n]) => `<option value="url:${u}">${esc(n)}</option>`).join('')}
          ${sons().map((e) => `<option value="id:${esc(e.id)}">${esc(e.title || 'Son')} (${esc(e.author)})</option>`).join('')}
        </select>
        <p class="or-etat muted small"></p>
      </section>
      <section class="or-res" hidden>
        <h2 class="or-titre"></h2>
        <div class="or-faits"></div>
        <div class="or-carte"><canvas class="or-canvas" aria-label="La pièce, ses parties, ses silences et sa boucle"></canvas></div>
        <div class="or-diag"></div>
        <div class="or-legende"><span><i class="lg-p"></i>une partie (touche pour l’écouter)</span><span><i class="lg-s"></i>silence</span><span><i class="lg-b"></i>la boucle</span><span><i class="lg-m"></i>le moment fort</span><span><i class="lg-t"></i>à retravailler</span></div>
        <div class="or-voix"></div>
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
    const arrete = () => { stopBoucle?.(); stopBoucle = null; lecture?.stop?.(); lecture = null; q('[data-o=boucle]').textContent = '▶ Écouter la boucle'; };

    async function analyser(arrayBuffer, n) {
      arrete(); nom = n;
      try {
        etat('Je décode la pièce…');
        buf = await audio().decodeAudioData(arrayBuffer);
        res = await ecouter(buf, etat); diag = diagnostic(res); voix = null;
        etat('');
        montrer();
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
        ${qui.length ? `<p class="or-garder">C’est la voix de : ${qui.map((m) => `<button class="btn small" data-o="garder" data-qui="${esc(m)}">${esc(m)}</button>`).join(' ')} <span class="muted small">FLIP garde ces notes dans son profil et apprend, prise après prise.</span></p>` : ''}
        <p class="or-src-note muted small">Comment : hauteur mesurée 45 fois par seconde par autocorrélation (comme un accordeur) ; une note compte si elle tient au moins 0,14 s. Juste : moins de 12 cents d’écart. Retour visuel et justesse : Welch, Howard et Rush 1989.</p>`;
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
      const rep = e.target.closest('.or-diag [data-a]');
      if (rep && res) { joueDe(+rep.dataset.a, +rep.dataset.b); return; }
      if (!o || !res) return;
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
