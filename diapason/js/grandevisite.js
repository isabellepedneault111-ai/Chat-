// La grande visite : tous les onglets, sous-onglets et icônes, un projecteur à la fois. Elle accueille Frog à sa
// prochaine ouverture quand l'app a beaucoup changé depuis sa dernière visite (à la place, exceptionnellement, de la liste
// des nouveautés), et elle reste dans le coffre pour qui veut la refaire.
import { espace, profileOf, saveProfile } from './espace.js';
import { MEMBERS } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const EDITION = 1; // à augmenter quand une nouvelle grande visite s'impose

// [route, sélecteurs (le premier visible gagne), chapitre, titre, texte]
const ETAPES = (autre) => [
  ['#/', '#nav', 'La barre', 'Les grands lieux', 'Accueil, Mur, Session, Relais, Écrire, Jouer, Voix, Labo. Certains ont leurs sous-onglets, juste sous la barre.'],
  ['#/', '#nav [data-id=home]', 'Accueil', 'L’accueil et sa pastille', `La pastille compte ce qui t’attend : les nouvelles de ${autre}, et tes prochains pas.`],
  ['#/', '.subnav', 'Accueil', 'Cinq sous-onglets', 'Aujourd’hui, Calendrier, Notre projet, Notre bilan, Nos lunes. Chaque page a sa place fixe.'],
  ['#/', '.nv-bandeau, .commencer', 'Accueil', 'Aujourd’hui', `Ce que ${autre} a ajouté, et par où commencer.`],
  ['#/', '.month-now, .plan-hero', 'Accueil', 'Le mois, la semaine, la séance', 'Le mois en cours du plan, l’objectif de la semaine (on le fixe à deux, chacun l’évalue en fin de semaine) et la prochaine séance.'],
  ['#/', '.cycle, [class*=cycle]', 'Accueil', 'Notre cycle : la lune', 'Semer, faire grandir, faire entendre, laisser aller. On y sème chacun son intention.'],
  ['#/calendrier', '.cl-cal', 'Calendrier', 'Notre calendrier sacré', 'L’un propose une plage (en présence, à distance, projet pro, jeux), l’autre l’approuve : elle prend nos deux couleurs. Les rituels lunaires y sont, à l’heure exacte.'],
  ['#/calendrier', '.cl-rythme', 'Calendrier', 'Notre rythme', 'Au moins deux séances en présence et une à distance par semaine.'],
  ['#/calendrier', '.cl-pas', 'Calendrier', 'Nos prochains pas', 'Ceux que l’app voit, et ceux qu’on se donne, à cocher. Pour soi ou pour nous deux.'],
  ['#/projet', '.pj-obj', 'Notre projet', 'Nos objectifs', 'Du plus près au plus loin : la séance, la semaine, le mois, le cap des six mois.'],
  ['#/projet', '.vision-in', 'Notre projet', 'Notre vision', 'Nos tonalités, nos instruments, notre genre, nos références, et ce qui nous inspire.'],
  ['#/bilan', '.b-tabs, .mod-head h1', 'Notre bilan', 'Où on est rendus', 'Séance, semaine, mois, et nos courbes.'],
  ['#/passage', '.mod-head h1', 'Nos lunes', 'Le passage', 'À chaque nouvelle lune : fermer un cycle à deux, garder ce qui brille, semer le suivant.'],
  ['#/carnet', '#nav [data-id=carnet]', 'Le mur', 'Toutes nos idées', 'Plus une idée avance (brute, en chantier, presque prête, prête), plus elle s’approche du centre.'],
  ['#/session', '#nav [data-id=session]', 'Session', 'La séance guidée', 'Où, combien de temps, une cible, des accords. Elle finit par une prise. Seul, elle te parle à toi, et le clavier de l’app peut jouer l’exemple en boucle.'],
  ['#/relais', '#nav [data-id=relais]', 'Relais', 'Chacun son tour', `Un son ou un texte lancé à ${autre}, qui répond par-dessus. Couche après couche.`],
  ['#/ecrire', '#nav [data-id=ecrire]', 'Écrire', 'Les mots', 'Le journal, les paroles, le grimoire, placer des paroles sur une musique.'],
  ['#/studio', '.subnav', 'Jouer', 'Trois sous-onglets', 'Jouer (beats, accords, chansons), Mon studio, L’oreille.'],
  ['#/materiel', '.m-scene', 'Jouer', 'Mon studio', 'Ta pièce, tes meubles (et leur couleur), tes appareils à leur place. Les micros virtuels se proposent ; on les ignore d’un geste, et tout appareil se retire.'],
  ['#/materiel', '.m-qui', 'Jouer', 'Le mien, celui de l’autre', `Une bascule : ton studio, ou celui de ${autre}.`],
  ['#/oreille', '.mod-head h1', 'Jouer', 'L’oreille', 'Dépose une pièce : l’app trouve le tempo, la tonalité, les parties et les accords.'],
  ['#/accord', '.subnav', 'Voix', 'La voix', 'Le clavier qui coache la voix, l’empreinte (la tessiture), la gym vocale, le miroir.'],
  ['#/labo', '.subnav', 'Labo', 'Le labo', 'Les disques, et La cathédrale.'],
  ['#/labo', '.tracks-panel, .groupes', 'Labo', 'Les disques', 'Des disques qui tournent selon des nombres ; on les regroupe en pupitres et on les relie.'],
  ['#/cathedrale', '.ca-rosace', 'Labo', 'La cathédrale', 'Quelques nombres, tout un orchestre. Le labo entier y passe : pupitres et liens, gardés dans le WAV et le MIDI.'],
  ['#/', '#micBtn', 'Les icônes', 'Le micro', 'Un point gris : fermé. Rouge qui bat : ouvert, l’app entend ta voix. Rien n’est enregistré.'],
  ['#/', '.filet-btn', 'Les icônes', 'Le filet', 'Il garde toujours la dernière minute de ce qui joue : un beau moment de jam n’est jamais perdu.'],
  ['#/', '#plusBtn', 'Les icônes', 'Le menu ⋯', 'L’arbre de l’app, le coffre, pourquoi ça marche, la contrainte surprise, le grand texte.'],
  ['#/', '.etincelle', 'Les icônes', 'L’étincelle', 'Une idée te vient? Touche la flamme, de n’importe où.'],
  ['#/', '.mandat', 'Partout', 'En haut de chaque page', 'À quoi elle sert, ce que tu peux y faire, ce qu’elle nourrit. Les mots mènent au bon endroit.'],
];

const visible = (sel) => sel.split(',').map((x) => x.trim()).flatMap((x) => [...document.querySelectorAll(x)]).find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
const membres = () => espace.meta?.members || MEMBERS;

// Due pour Frog : il a déjà fait sa première visite, et pas encore cette édition de la grande visite.
export function grandeVisiteDue() {
  if (!espace.connected || !espace.me) return false;
  const frog = espace.me === membres()[1];
  return frog && !!espace.meta?.tour?.[espace.me] && (profileOf(espace.me)?.grandeVisite || 0) < EDITION;
}

export function lancerGrandeVisite({ obligatoire = false, onFin } = {}) {
  if (document.querySelector('.coach')) return;
  const autre = membres().find((m) => m !== espace.me) || 'l’autre';
  const de = membres()[0];
  const E = ETAPES(autre); let i = -1;
  const box = document.createElement('div'); box.className = 'coach gv';
  box.innerHTML = '<div class="coach-hole"></div><div class="coach-bubble" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(box);
  const hole = box.querySelector('.coach-hole'); const bulle = box.querySelector('.coach-bubble');
  const fin = async (faite) => {
    box.remove(); removeEventListener('resize', placer); removeEventListener('keydown', touche);
    if (faite) { try { await saveProfile(() => ({ grandeVisite: EDITION })); } catch { /* on réessaiera */ } onFin?.(); }
  };
  function placer() {
    const vw = innerWidth; const vh = innerHeight; const bw = Math.min(380, vw - 24);
    const el = i >= 0 && i < E.length && visible(E[i][1]);
    if (!el) { hole.style.opacity = 0; Object.assign(bulle.style, { width: `${bw}px`, left: `${(vw - bw) / 2}px`, top: `${Math.max(20, vh / 2 - 160)}px`, bottom: 'auto' }); return; }
    let r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > vh - 20) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); }
    const p = 8; Object.assign(hole.style, { left: `${r.left - p}px`, top: `${r.top - p}px`, width: `${r.width + 2 * p}px`, height: `${r.height + 2 * p}px`, opacity: 1 });
    const bh = bulle.offsetHeight || 200; const dessous = r.bottom + 16 + bh < vh; const dessus = r.top - 16 - bh > 60;
    if (!dessous && !dessus) { Object.assign(bulle.style, { width: `${bw}px`, left: `${(vw - bw) / 2}px`, top: 'auto', bottom: '12px' }); return; }
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    Object.assign(bulle.style, { width: `${bw}px`, left: `${left}px`, top: dessous ? `${r.bottom + 16}px` : 'auto', bottom: dessous ? 'auto' : `${vh - r.top + 16}px` });
  }
  function montrer() {
    if (i < 0) {
      hole.style.opacity = 0;
      bulle.innerHTML = `<p class="coach-n">La grande visite</p><h3>${obligatoire ? 'Beaucoup de changements depuis ta dernière visite.' : 'Tout Diapason Labo, en un tour.'}</h3>
        <p>${obligatoire ? `${esc(de)} a transformé l’app depuis ta dernière visite. Alors on prend un moment ensemble : une visite de chaque onglet, sous-onglet et icône. Elle remplace, exceptionnellement, la liste des nouveautés.` : 'Chaque onglet, chaque sous-onglet, chaque icône, un projecteur à la fois. Environ cinq minutes.'}</p>
        <div class="coach-row"><button class="btn primary" data-g="suivant">Commencer la visite</button>${obligatoire ? '' : '<button class="coach-skip" data-g="fermer">Fermer</button>'}</div>`;
    } else if (i >= E.length) {
      hole.style.opacity = 0; if (location.hash !== '#/') location.hash = '#/';
      bulle.innerHTML = `<p class="coach-n">La grande visite</p><h3>Voilà.</h3><p>Tu as tout vu. La liste des nouveautés reprend à la prochaine mise à jour. Cette visite reste dans le coffre (menu ⋯), si tu veux la refaire.</p>
        <div class="coach-row"><button class="btn primary" data-g="fini">Merci, on y va</button></div>`;
    } else {
      const [route, , chap, t, d] = E[i];
      if (location.hash !== route && !(route === '#/' && (location.hash === '' || location.hash === '#'))) location.hash = route;
      bulle.innerHTML = `<p class="coach-n">${i + 1} / ${E.length} · ${esc(chap)}</p><h3>${esc(t)}</h3><p>${esc(d)}</p>
        <div class="coach-row">${i ? '<button class="btn ghost small" data-g="avant" aria-label="Étape précédente">←</button>' : ''}<button class="btn primary" data-g="suivant">Suivant →</button>
        <button class="coach-skip" data-g="plustard">${obligatoire ? 'Finir plus tard' : 'Fermer'}</button></div>`;
    }
    placer(); setTimeout(placer, 380); setTimeout(placer, 900);
  }
  function touche(e) { if (e.key === 'ArrowRight' && i < E.length) { i++; montrer(); } if (e.key === 'ArrowLeft' && i > 0) { i--; montrer(); } if (e.key === 'Escape' && !obligatoire) fin(false); }
  bulle.addEventListener('click', (e) => {
    const g = e.target.closest('[data-g]')?.dataset.g;
    if (g === 'suivant') { i++; montrer(); }
    if (g === 'avant') { i = Math.max(0, i - 1); montrer(); }
    if (g === 'fermer' || g === 'plustard') fin(false);
    if (g === 'fini') fin(true);
  });
  addEventListener('resize', placer); addEventListener('keydown', touche);
  montrer();
}
