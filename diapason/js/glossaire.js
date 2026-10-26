// Le glossaire au survol : chaque mot de musique un peu technique est souligné en pointillé ; on passe dessus
// (ou on le touche) et une bulle l'explique en mots simples, avec un exemple. Les onglets du menu ont aussi leur aperçu.
// Pour nous, qui jouons à l'oreille sans cours : comprendre sans quitter ce qu'on fait.

const T = [
  [/temps forts?/i, 'Temps fort', 'Le temps qui pèse dans la mesure, souvent le 1 et le 3. Les syllabes appuyées s’y posent bien.'],
  [/accents? toniques?/i, 'Accent tonique', 'La syllabe qu’on appuie naturellement. En français, c’est la dernière qu’on prononce : « si-LENCE ».'],
  [/\be muets?\b/i, 'E muet', 'Le « e » qui ne se prononce pas toujours. En chanson, il compte devant une consonne et disparaît devant une voyelle ou en fin de ligne.'],
  [/syncop(é|ée|és|ées|e|ation)s?/i, 'Syncopé', 'L’accent tombe à côté du temps, entre deux temps. Ça balance, ça surprend. On dit « ta-TA-ta » au lieu de « TA-ta-TA ».'],
  [/contretemps/i, 'Contretemps', 'Jouer ou chanter juste après le temps, sur le « et » quand on compte « 1 et 2 et ». Ça flotte, ça balance.'],
  [/grooves?/i, 'Groove', 'Un rythme qui donne envie de bouger la tête et qui tient tout seul, même sans paroles.'],
  [/vamps?/i, 'Vamp', 'Un ou deux accords qui tournent en boucle, sans fin, pour improviser ou chanter dessus librement.'],
  [/cadences?/i, 'Cadence', 'Des accords qui partent de la « maison », se tendent, puis reviennent. Comme une phrase qui finit par un point.'],
  [/tonalités?/i, 'Tonalité', 'La « maison » d’une chanson : la note et la gamme autour desquelles tout tourne. Ex. : ré mineur.'],
  [/toniques?/i, 'Tonique', 'La note « maison » de la tonalité, celle où la musique se repose.'],
  [/pentatoniques?/i, 'Pentatonique', 'Une gamme de 5 notes qui ne frottent jamais entre elles : presque impossible de sonner faux avec.'],
  [/gammes?/i, 'Gamme', 'Les notes qui vont ensemble dans une tonalité (7 en général). Do majeur : les touches blanches.'],
  [/tessitures?/i, 'Tessiture', 'De la note la plus grave à la plus aiguë que ta voix chante confortablement, sans forcer.'],
  [/\bBPM\b/, 'BPM', 'Battements par minute : la vitesse du morceau. 60 = un temps par seconde ; 120 = deux par seconde.'],
  [/doubles?-croches?/i, 'Double-croche', 'Un quart de temps : quatre par temps, « 1-e-et-a ». Très rapide.'],
  [/\bcroches?\b/i, 'Croche', 'La moitié d’un temps : deux par temps, « 1 et 2 et ».'],
  [/\bmesures?\b/i, 'Mesure', 'Un groupe de temps, souvent 4 : « 1, 2, 3, 4 ». Les chansons se comptent en mesures.'],
  [/\btierces?\b/i, 'Tierce', 'La note deux crans au-dessus de la base de l’accord. C’est elle qui le rend joyeux (majeur) ou triste (mineur).'],
  [/\bquintes?\b/i, 'Quinte', 'La note quatre crans au-dessus de la base de l’accord. Solide : elle donne la puissance.'],
  [/septièmes?/i, 'Septième', 'Une note ajoutée à l’accord, qui le colore : plus jazz, plus soul, plus rêveur.'],
  [/\bmaj7\b/i, 'maj7', 'Un accord majeur avec une septième en plus : rêveur, doux, un peu flottant.'],
  [/\bsus[24]\b/i, 'sus2 / sus4', 'Un accord « suspendu », sans tierce : ni joyeux ni triste, comme en attente.'],
  [/\bmajeurs?\b/i, 'Majeur', 'Une couleur lumineuse, ouverte, souvent joyeuse.'],
  [/\bmineurs?\b/i, 'Mineur', 'Une couleur plus sombre, plus intime, souvent mélancolique.'],
  [/\briffs?\b/i, 'Riff', 'Une courte phrase musicale qui revient en boucle et qu’on reconnaît tout de suite.'],
  [/\bmumble\b/i, 'Mumble', 'Chanter des sons sans vrais mots sur la musique, pour trouver la mélodie et le rythme. Les mots viennent après.'],
  [/prosodie/i, 'Prosodie', 'L’accord entre les mots et la musique : les syllabes appuyées sur les temps forts. Sinon, le texte « boite ».'],
  [/polyrythm(ie|e)s?/i, 'Polyrythmie', 'Deux rythmes différents en même temps (3 contre 2, par exemple). Ça crée un tissu qui tourne.'],
  [/\bMIDI\b/, 'MIDI', 'Le câble ou l’USB qui envoie les touches jouées au clavier vers l’ordinateur. L’app sait alors exactement quelles notes, sans micro.'],
  [/\bnappes?\b/i, 'Nappe', 'Un son long et doux tenu en fond, qui enveloppe la chanson.'],
  [/pédales?/i, 'Pédale', 'Une note de basse qui ne bouge pas pendant que les accords changent par-dessus.'],
  [/justesse/i, 'Justesse', 'Chanter exactement la bonne note, ni un peu trop haut, ni un peu trop bas.'],
  [/\bharmoni(e|es|que)\b/i, 'Harmonie', 'Les notes jouées ensemble, les accords, qui accompagnent la mélodie.'],
  [/\btimbres?\b/i, 'Timbre', 'La couleur d’un son : pourquoi un piano et une voix sur la même note ne sonnent pas pareil.'],
  [/\boctaves?\b/i, 'Octave', 'La même note, plus aiguë ou plus grave. Do3 et Do4 sont à une octave.'],
  [/demi-tons?/i, 'Demi-ton', 'Le plus petit écart du piano : d’une touche à sa voisine.'],
  [/\bcents\b|¢/i, 'Cent', 'Un centième de demi-ton. Sous 10 cents d’écart, l’oreille ne l’entend presque pas ; à 30, ça frotte.'],
  [/improvis(er|ation|e|ons|ez)/i, 'Improviser', 'Inventer en jouant, sur le moment, sans partition. Il n’y a pas de faute, seulement des essais.'],
  [/\bponts?\b(?! de)/i, 'Pont', 'Une partie différente qui casse la routine, souvent avant le dernier refrain.'],
  [/\bbreaks?\b/i, 'Break', 'Une coupure où presque tout s’arrête, pour relancer avec plus de force.'],
  [/\bfilet\b/i, 'Le filet', 'Il écoute en continu ce qui est actif (le son de l’app, tes entrées audio, tes notes MIDI) et garde toujours la dernière minute. Un beau moment de jam n’est jamais perdu : touche le filet, choisis le bout, garde-le.'],
  [/\bdebrief\b/i, 'Debrief', 'Le petit retour à la fin : ce qu’on visait, ce qu’on a entendu, ce qu’on garde pour la prochaine fois.'],
];
const ONGLETS = {
  home: 'Le plan : où on en est, la prochaine chose à faire, et ce que l’autre a fait depuis ta dernière visite.',
  carnet: 'Le mur : toutes nos idées. Plus une idée avance (brute → en chantier → presque prête → prête), plus elle s’approche du centre.',
  session: 'Une séance guidée, à deux ou seul : étape par étape, avec la musique, et toujours une prise à la fin.',
  relais: 'Le relais : tu envoies un son, l’autre répond par-dessus quand il veut. Couche après couche.',
  ecrire: 'Écrire : notre journal, les paroles, le grimoire, placer ses mots sur une musique, nos idées pour le labo.',
  studio: 'Le studio : un beat, nos propres accords, où improviser sur le clavier, les prises et la scène.',
  elan: 'Notre élan : la tresse de nos deux fils dans le temps.',
  voix: 'La voix : ton clavier coache ma voix, la tessiture, les exercices de justesse.',
};

const SAUTER = new Set(['H1', 'A', 'BUTTON', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT', 'SCRIPT', 'STYLE', 'CANVAS', 'SVG', 'CODE', 'LABEL']);
let bulle = null;
function montrer(cible, titre, texte) {
  if (!bulle) { bulle = document.createElement('div'); bulle.className = 'bulle-aide'; bulle.setAttribute('role', 'tooltip'); document.body.appendChild(bulle); }
  bulle.innerHTML = `<b>${titre}</b><span>${texte}</span>`;
  bulle.hidden = false;
  const r = cible.getBoundingClientRect(); const w = Math.min(300, innerWidth - 24);
  bulle.style.width = `${w}px`;
  bulle.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
  const h = bulle.offsetHeight; const dessous = r.bottom + 8 + h < innerHeight;
  bulle.style.top = `${dessous ? r.bottom + 8 : Math.max(8, r.top - h - 8)}px`;
}
const cacher = () => { if (bulle) bulle.hidden = true; };

// Souligne la première apparition de chaque mot dans un bloc de texte (pas tous : sinon la page pique les yeux).
function marquer(racine) {
  const vus = new Set([...racine.querySelectorAll('.mot-aide')].map((x) => x.dataset.t)); // un mot déjà expliqué sur la page ne l'est pas deux fois
  const marche = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      for (let p = n.parentElement; p && p !== racine.parentElement; p = p.parentElement) {
        if (SAUTER.has(p.tagName.toUpperCase()) || p.classList?.contains('mot-aide') || p.isContentEditable || p.closest?.('.tour, .coach, .bulle-aide, .no-aide')) return NodeFilter.FILTER_REJECT;
      }
      return n.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const noeuds = []; while (marche.nextNode()) noeuds.push(marche.currentNode);
  noeuds.forEach((n) => {
    let txt = n.nodeValue; let frag = null; let reste = n;
    for (const [re, titre, def] of T) {
      if (vus.has(titre)) continue;
      const m = txt.match(re); if (!m) continue;
      vus.add(titre);
      const i = txt.indexOf(m[0]);
      const avant = reste.splitText ? reste : null; if (!avant) break;
      const milieu = avant.splitText(i); const apres = milieu.splitText(m[0].length);
      const span = document.createElement('span'); span.className = 'mot-aide'; span.tabIndex = 0; span.dataset.t = titre; span.dataset.d = def; span.textContent = m[0];
      milieu.replaceWith(span); reste = apres; txt = apres.nodeValue; frag = true;
    }
    return frag;
  });
}

export function installerGlossaire(vue) {
  let t = 0;
  const passe = () => { if (!t) t = setTimeout(() => { t = 0; try { marquer(vue); } catch { /* le glossaire n'est jamais bloquant */ } }, 300); };
  new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes].some((x) => !(x.classList?.contains('mot-aide'))))) passe(); }).observe(vue, { childList: true, subtree: true });
  passe();
  const sur = (e) => {
    const m = e.target.closest?.('.mot-aide'); if (m) { montrer(m, m.dataset.t, m.dataset.d); return; }
    const o = e.target.closest?.('#nav a[data-id]'); if (o && ONGLETS[o.dataset.id]) { montrer(o, o.textContent.trim(), ONGLETS[o.dataset.id]); return; }
    const ic = e.target.closest?.('[data-aide]'); if (ic) montrer(ic, ic.getAttribute('aria-label') || '', ic.dataset.aide);
  };
  const hors = (e) => { if (e.target.closest?.('.mot-aide, #nav a[data-id], [data-aide]')) cacher(); };
  document.addEventListener('mouseover', sur); document.addEventListener('focusin', sur);
  document.addEventListener('mouseout', hors); document.addEventListener('focusout', hors);
  // Au toucher (téléphone) : un toucher ouvre la bulle, un toucher ailleurs la ferme.
  document.addEventListener('click', (e) => { const m = e.target.closest('.mot-aide'); if (m) { e.preventDefault(); montrer(m, m.dataset.t, m.dataset.d); } else if (!e.target.closest('.bulle-aide')) cacher(); }, true);
  addEventListener('scroll', cacher, { passive: true });
}
