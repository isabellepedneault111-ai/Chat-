"""Cahier du participant, format livret : 24 pages 8,5 x 11 (photocopiées en livret sur 11 x 17).
Produit cahier.html ; le PDF est imprimé par Playwright (print_cahier.js)."""
import os
B = os.path.dirname(os.path.abspath(__file__))
QR = open(B + '/img/qr_site.svg', encoding='utf8').read().split('?>', 1)[-1]

VERBES = [('Rêver', 'var(--v1)', 'var(--ink)'), ('Cibler', 'var(--v2)', '#fff'), ('Choisir', 'var(--v3)', 'var(--ink)'), ('S’engager', 'var(--v4)', '#fff')]

# --- petits morceaux ---------------------------------------------------------
ICO_EXP = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M20 12V3M15 6l5-4 5 4"/><path d="M20 28v9M15 34l5 4 5-4"/><path d="M12 20H3M6 15l-4 5 4 5"/><path d="M28 20h9M34 15l4 5-4 5"/></g></svg>'
ICO_RES = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 5h34L24 21v12l-8 4V21z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><circle cx="20" cy="13" r="2.4" fill="currentColor"/></svg>'
ICO_OUTIL = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="14" width="34" height="21" rx="2" fill="none" stroke="currentColor" stroke-width="3.4"/><path d="M14 14V8h12v6M3 23h34" fill="none" stroke="currentColor" stroke-width="3.4"/></svg>'


def tags(mode=None, *besoins):
    out = []
    if mode == 'E':
        out.append(f'<div class="tag exp">{ICO_EXP}<b>Expansion</b> on ouvre</div>')
    if mode == 'R':
        out.append(f'<div class="tag res">{ICO_RES}<b>Restriction</b> on resserre</div>')
    if besoins:
        out.append('<div class="tag nour"><b>Nourrit :</b> ' + ', '.join(besoins) + '</div>')
    return '<div class="tags">' + ''.join(out) + '</div>'


def h(num, titre, mode=None, *besoins):
    n = f'<span class="num">{num}</span>' if num else ''
    return f'<header class="sec">{tags(mode, *besoins)}<h2>{n}{titre}</h2></header>'


def coche(items, cls=''):
    return f'<ul class="coche {cls}">' + ''.join(f'<li>{t}</li>' for t in items) + '</ul>'


def zone(lab, hgt, cls='', ex=''):
    e = f'<p class="ex">{ex}</p>' if ex else ''
    return f'<div class="zone {cls}" style="height:{hgt}"><span class="zl">{lab}</span>{e}</div>'


def renvoi(t):
    return f'<p class="renvoi">{ICO_OUTIL}<span>{t}</span></p>'


def verbe_ban(i):
    v, bg, fg = VERBES[i]
    return f'<div class="vban" style="background:{bg};color:{fg}"><i>{i + 1}</i>{v}</div>'


pages = []


def page(body, verbe=None, cls=''):
    pages.append((body, verbe, cls))


# --- 1 · couverture ---------------------------------------------------------
page(f'''
<p class="kick">Colloque régional FGA · 13 novembre 2026 · CFGA De Jonquière</p>
<h1 class="cv-t1">Cahier du participant</h1>
<h1 class="cv-t2">Rêver le monde<br><span>de demain</span></h1>
<p class="cv-sub">De l’idéation à l’action</p>
<figure class="cv-img"><img src="img/nb_mur.jpg" alt=""><figcaption>Du « ça me dérange » au « on l’a fait ! »</figcaption></figure>
<div class="cv-row">
  <div class="cv-who">
    <p class="cv-lead">Ce cahier vous suit pendant tout l’atelier.</p>
    <p class="hand cv-hand">Écrivez, raturez, collez des post-it.</p>
    <div class="cv-moi"><span>Ce cahier appartient à</span></div>
  </div>
  <div class="cv-qr">{QR}<p>rever-le-monde.netlify.app</p></div>
</div>
<div class="cv-foot">
  <div class="cv-names"><p><b>Isabelle Pedneault</b><br>Conseillère pédagogique, CFGA De Jonquière</p><p><b>Francis Laroche</b><br>Chargé de projet en éducation citoyenne mondiale<br>Centre de solidarité internationale du Saguenay–Lac-Saint-Jean</p></div>
  <div class="cv-logos"><img src="img/logo_cfga.png" alt="CFGA"><img src="img/logo_csi.png" alt="CSI"></div>
</div>
<p class="cv-note">Atelier conçu par Isabelle Pedneault et Francis Laroche.</p>
<p class="cv-note">Présentation amplifiée avec l’aide de Nano Banana (images) et de Claude (textes et outils interactifs).</p>
''', cls='cover')

# --- 2 · avertissement + légende -------------------------------------------
page(f'''
<div class="warn">
  <div class="warn-h"><svg viewBox="0 0 60 52" aria-hidden="true"><path d="M30 3 57 49H3z" fill="var(--v1)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/><path d="M30 18v15" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="41" r="3.2" fill="var(--ink)"/></svg><span>Avertissement</span></div>
  <p class="w1">Faites-nous confiance.</p>
  <p>Par moments, le sens pourrait vous échapper.</p>
  <p>On fait le pari qu’il apparaîtra à la fin.</p>
  <hr>
  <p class="w2">Une erreur, c’est la preuve qu’on est en action.</p>
  <p class="w2">Une case vide, c’est une réponse valide.</p>
</div>
<h3 class="leg-t">Les repères du cahier</h3>
<div class="leg">
  <div class="leg-r"><div class="tag exp">{ICO_EXP}<b>Expansion</b></div><p>On ouvre.<br>On cherche des idées : seul, avec les autres, avec l’IA.</p></div>
  <div class="leg-r"><div class="tag res">{ICO_RES}<b>Restriction</b></div><p>On resserre.<br>On choisit, on précise.</p></div>
  <div class="leg-r"><div class="tag nour"><b>Nourrit :</b> Sens</div><p>Le besoin que l’activité nourrit.<br>Chez vous… et chez vos élèves.</p></div>
  <div class="leg-r"><div class="leg-tabs">{''.join(f'<span style="background:{bg};color:{fg}">{v}</span>' for v, bg, fg in VERBES)}</div><p>Les 4 verbes de l’atelier.<br>Ils sont aussi sur le bord des pages.</p></div>
  <div class="leg-r"><p class="renvoi solo">{ICO_OUTIL}<span>Boîte à outils</span></p><p>Un coup de pouce, si vous en avez envie.<br>Les outils sont à la fin du cahier.</p></div>
</div>
''', verbe=0)

# --- 3 · 01 post-it + 02 pari ---------------------------------------------
page(f'''
{verbe_ban(0)}
{h('01', 'Ce qui me préoccupe dans mon milieu', 'E', 'Sens')}
<div class="p01">
  <div class="postit">
    <svg class="mini3" viewBox="0 0 130 112" aria-hidden="true"><g fill="none" stroke="var(--ink)" stroke-width="2.6"><circle cx="44" cy="40" r="36"/><circle cx="86" cy="40" r="36"/><circle cx="65" cy="72" r="36"/></g><g font-family="Inter" font-weight="800" font-size="9.5" text-anchor="middle" fill="var(--ink)"><text x="30" y="30">ÉCOLE</text><text x="100" y="30">COMMUNAUTÉ</text><text x="65" y="98">NATURE</text></g></svg>
    <p class="hand pi">ex. Nos élèves ne se connaissent pas d’un groupe à l’autre.</p>
    <p class="hand pi">ex. Il n’y a aucun arbre dans la cour.</p>
  </div>
  <div class="p01-c">
    <p class="big">Sur un post-it :</p>
    <p>ce qui vous <mark>préoccupe</mark>,</p>
    <p>vous dérange</p>
    <p>ou vous manque</p>
    <p>dans votre milieu.</p>
    <p class="big" style="margin-top:.14in">Puis allez le porter au mur.</p>
  </div>
</div>
{h('02', 'Notre pari', None, 'Sens')}
<p class="pari-q">Et si le but ultime, c’était l’engagement ?</p>
<div class="pari2">
  <div class="pari"><p>On fait le pari que si l’engagement est là, tout le reste en découle :</p><ul><li>la présence,</li><li>la persévérance,</li><li>les apprentissages.</li></ul></div>
  <div class="pas-ca"><p>S’engager,</p><p>ce n’est pas avoir hâte de.</p><p>Ce n’est pas avoir envie de.</p><p class="hand">C’est décider d’y prendre part.</p></div>
</div>
<div class="feu">
  <figure><svg viewBox="40 10 220 220" aria-hidden="true"><path d="M150 40 C120 80 128 110 150 122 C172 110 180 80 150 40Z" fill="#F2C230" stroke="#1E1A22" stroke-width="4"/><path d="M150 72 C138 92 142 108 150 114 C158 108 162 92 150 72Z" fill="#D9541E"/><rect x="143" y="122" width="14" height="100" rx="3" fill="#E8C99A" stroke="#1E1A22" stroke-width="4"/><ellipse cx="150" cy="128" rx="13" ry="15" fill="#B3261E" stroke="#1E1A22" stroke-width="4"/></svg>
    <figcaption><b>Motivation</b>L’allumette.<br>Ça s’allume vite.<br>Ça s’éteint vite.</figcaption></figure>
  <figure><svg viewBox="30 10 240 210" aria-hidden="true"><path d="M150 18 C96 80 104 140 150 160 C196 140 204 80 150 18Z" fill="#F2C230" stroke="#1E1A22" stroke-width="4"/><path d="M150 70 C126 106 130 138 150 150 C170 138 174 106 150 70Z" fill="#D9541E"/><g stroke="#1E1A22" stroke-width="4"><rect x="40" y="160" width="150" height="22" rx="11" fill="#1F4E8C" transform="rotate(16 115 171)"/><rect x="110" y="160" width="150" height="22" rx="11" fill="#0F766E" transform="rotate(-16 185 171)"/><rect x="40" y="186" width="150" height="22" rx="11" fill="#A33A32" transform="rotate(-7 115 197)"/><rect x="110" y="186" width="150" height="22" rx="11" fill="#C27F2B" transform="rotate(7 185 197)"/></g></svg>
    <figcaption><b>Engagement</b>Le feu qu’on décide de nourrir.<br>Ses 4 bûches : les 4 besoins.</figcaption></figure>
</div>
{renvoi('Motivation ≠ engagement : l’outil <b>L’engagement</b>, page 20.')}
''', verbe=0)

# --- 5 · 03 Mon monde idéal (paysage) --------------------------------------
LAND = f'''
    <div class="land-h">{h('03', 'Mon monde idéal', 'E', 'Autonomie')}
      <div class="land-c"><p><b>Sans limite</b> de budget ni de ressources :</p><p>à quoi ressemble votre monde idéal ?</p><p>Des mots-clés dans les cercles.</p><p class="q">Qu’est-ce qui relie deux cercles ?</p><p>Écrivez-le dans l’intersection.</p>
      <p class="ex lex">Par exemple<br>École : créativité.<br>Communauté : collaboration.<br>Entre les deux : « Le quartier vient créer avec nous. »</p></div></div>
    <svg class="venn" viewBox="30 10 940 850" aria-hidden="true">
      <g stroke="var(--ink)" stroke-width="5"><circle cx="335" cy="315" r="295" fill="#F2C230" fill-opacity=".20"/><circle cx="665" cy="315" r="295" fill="#5B2A86" fill-opacity=".12"/><circle cx="500" cy="555" r="295" fill="#0F766E" fill-opacity=".10"/></g>
      <g fill="none" stroke="var(--ink)" stroke-width="5"><circle cx="335" cy="315" r="295"/><circle cx="665" cy="315" r="295"/><circle cx="500" cy="555" r="295"/></g>
      <g font-family="Anton" font-size="44" text-anchor="middle"><g transform="translate(225 92)"><rect x="-190" y="-42" width="380" height="58" fill="#F2C230" stroke="var(--ink)" stroke-width="4"/><text y="5" fill="var(--ink)">ÉCOLE · MON CENTRE</text></g><g transform="translate(790 92)"><rect x="-130" y="-42" width="260" height="58" fill="#5B2A86" stroke="var(--ink)" stroke-width="4"/><text y="5" fill="#fff">COMMUNAUTÉ</text></g><g transform="translate(500 822)"><rect x="-96" y="-42" width="192" height="58" fill="#fff" stroke="var(--ink)" stroke-width="4"/><text y="5" fill="var(--ink)">NATURE</text></g></g>
    </svg>
  '''
page('<img class="full land-img" src="img/venn_land.png" alt="Mon monde idéal : les trois cercles">', verbe=0, cls='outil')

# --- 6 · 04 parle-partage + 05 analyse de contexte --------------------------
page(f'''
{h('04', 'Parle et partage', 'R', 'Appartenance', 'Compétence')}
{coche(['Chacun partage son monde idéal.', 'On repère ce qui revient.', 'On aide ceux qui n’ont pas trouvé de lien.', 'On l’écrit sur l’affiche de l’îlot.'])}
{zone('Ce que je note', '1.05in')}
{h('05', 'L’analyse de contexte', 'E', 'Compétence', 'Sens')}
<div class="ac">
  <ul class="qs"><li>Qu’est-ce qui existe déjà ?</li><li>Qui pourrait m’aider ?<br><small>des personnes, des organismes</small></li><li>Quels lieux, quelles ressources ?</li><li>Quelles forces a mon groupe ?</li><li>Qu’est-ce qui manque ?</li></ul>
  <div class="ac-z">
    {zone('+ Mes leviers · ce qui existe déjà', '2.2in', ex='ex. un boisé derrière le centre')}
    {zone('Je remarque que…', '2.2in', ex='ex. on n’y va jamais avec les élèves')}
  </div>
</div>
''', verbe=0)

# --- 7 · 06 résultat ou action ----------------------------------------------
page(f'''
{verbe_ban(1)}
{h('06', 'Résultat ou action ?', 'R', 'Compétence')}
<p class="lead">Dans vos cercles, ce qui vous interpelle le plus devient votre <b>résultat</b>.<br>Puis, une ou des <b>actions</b> concrètes qui y mènent.</p>
<div class="ra">
  <div class="ra-c r"><b>Résultat</b><p>Ce qu’on souhaite.</p><p class="hand">Un coin de verdure où on a envie d’apprendre dehors.</p></div>
  <div class="ra-arrow">→</div>
  <div class="ra-c a"><b>Action</b><p>Ce qu’on fait : qui, quoi, quand.</p><p class="hand">D’ici le 15 décembre, mon groupe mesure le soleil dans la cour et propose trois emplacements à la direction.</p></div>
</div>
{zone('Mon résultat', '1.15in')}
{zone('Mes actions', '2.1in')}
''', verbe=1)

# --- 8 · SMART + coup de pouce ---------------------------------------------
page(f'''
<header class="sec">{tags('R', 'Compétence')}<h2>Mon action est-elle SMART ?</h2></header>
<div class="smart">
  {''.join(f'<div class="sm"><b>{l}</b><div><span>{w}</span><p>{q}</p></div></div>' for l, w, q in [('S', 'Spécifique', 'Qu’est-ce que je veux réaliser, exactement ?'), ('M', 'Mesurable', 'Comment vais-je savoir que c’est atteint ?'), ('A', 'Atteignable', 'Est-ce réaliste ? Comment vais-je m’y prendre ?'), ('R', 'Représentatif', 'Pourquoi est-ce important pour moi ?'), ('T', 'Temporel', 'Quelle est ma date ?')])}
</div>
<h3 class="h3">Coup de pouce · les 4 besoins</h3>
<p class="lead">Un manque dans vos « je remarque que » ?<br>Quel besoin touche-t-il ? Choisissez une action qui le nourrit.</p>
<div class="b4">
  <div style="--b:#1F4E8C"><b>Compétence</b>« Qu’est-ce qu’on peut réussir, à notre mesure ? »</div>
  <div style="--b:#0F766E"><b>Autonomie</b>« Qu’est-ce qu’on laisse choisir ? »</div>
  <div style="--b:#A33A32"><b>Sens</b>« À qui ça sert, vraiment ? »</div>
  <div style="--b:#C27F2B"><b>Appartenance</b>« Avec qui le fait-on ? »</div>
</div>
<div class="aide">
  <p><b>Besoin d’idées ?</b> Mon invite Copilot, sur <b>rever-le-monde.netlify.app</b>.<br>Copilot propose. Vous choisissez.</p>
</div>
{renvoi('<b>Les quatre besoins</b>, page 21 · <b>Se fixer des objectifs</b>, sur le site.')}
''', verbe=1)

# --- 9 · 07 projet d'îlot ---------------------------------------------------
page(f'''
{h('07', 'Notre projet d’îlot', 'R', 'Appartenance', 'Autonomie')}
<div class="ilot">
  <svg class="plexi" viewBox="0 0 420 300" aria-hidden="true">
    <rect x="20" y="14" width="380" height="250" fill="#EEF6F8" stroke="var(--ink)" stroke-width="5"/>
    <rect x="34" y="28" width="352" height="44" fill="var(--v1)" stroke="var(--ink)" stroke-width="3"/><text x="210" y="59" text-anchor="middle" font-family="Anton" font-size="26" fill="var(--ink)">NOTRE PROJET</text>
    <g font-family="Caveat" font-size="22" fill="var(--ink)">
      <g transform="rotate(-3 90 130)"><rect x="44" y="92" width="96" height="78" fill="#FFE27A" stroke="var(--ink)" stroke-width="2.5"/><text x="56" y="124">résultat</text></g>
      <g transform="rotate(2 210 130)"><rect x="160" y="96" width="96" height="78" fill="#FFB3C7" stroke="var(--ink)" stroke-width="2.5"/><text x="172" y="128">action 1</text></g>
      <g transform="rotate(-2 330 130)"><rect x="276" y="92" width="96" height="78" fill="#BFE6C6" stroke="var(--ink)" stroke-width="2.5"/><text x="288" y="124">action 2</text></g>
    </g>
    <rect x="44" y="190" width="328" height="60" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="8 6"/><text x="208" y="228" text-anchor="middle" font-family="Inter" font-weight="800" font-size="16" fill="var(--ink)">L’ESPACE DES VOTES</text>
    <path d="M60 264 40 296M360 264 380 296" stroke="var(--ink)" stroke-width="5"/>
  </svg>
  {coche(['Je pointe ce qui m’interpelle dans un cercle.', 'On choisit ensemble un résultat.', 'On trouve des actions concrètes.', 'On donne un titre au projet.', 'On affiche tout au plexiglas, avec l’espace des votes.'], 'grand')}
</div>
{zone('Qu’est-ce que je remarque ?', '1.25in')}
{zone('Comment avons-nous fait pour choisir ?', '1.25in')}
{zone('Mes notes', '1.1in')}
''', verbe=1)

# --- 10 · 08 votes ----------------------------------------------------------
page(f'''
{verbe_ban(2)}
{h('08', 'La galerie et les votes', 'R', 'Autonomie', 'Appartenance')}
<div class="votes">
  <div class="pv" style="--c:#9ED9A8;--r:-3deg"><b>Coup de cœur</b><p class="hand">« Ce projet me touche.<br>Il a du sens. »</p></div>
  <div class="pv" style="--c:#EBDDB0;--r:2deg"><b>Oui, et…</b><p class="hand">« J’aime cette action,<br>et je changerais ceci. »</p><small>La suggestion s’écrit sur le post-it.</small></div>
  <div class="pv" style="--c:#F7B5CB;--r:-1.5deg"><b>Je suis capable</b><p class="hand">« Avec mes forces,<br>je peux y contribuer. »</p></div>
</div>
{coche(['Je circule d’un projet à l’autre.', 'Je colle mes 3 post-it : un de chaque couleur.', '1 post-it = 1 point.', 'À mi-temps, on change de rôle.'], 'grand')}
{zone('Ce que je remarque en circulant', '2.9in')}
''', verbe=2)

# --- 11 · 09 forces + 10 projet du groupe -----------------------------------
page(f'''
{h('09', 'Mes forces, mes défis', None, 'Compétence', 'Autonomie')}
<p class="lead">Voter « je suis capable », c’est connaître ses forces.<br>Les forces sont des leviers.<br>Les défis deviennent des objectifs SMART.</p>
<div class="forces">
  <img src="img/outils/forces1_t.png" alt="Liste de mes capacités et de mes forces">
  <div>{zone('Mes forces', '1.35in')}{zone('Un défi', '0.95in')}</div>
</div>
{renvoi('<b>Liste de mes capacités et de mes forces</b> (J’ai MON plan!), page 23.')}
{h('10', 'Un projet, toutes nos disciplines', 'E', 'Sens')}
<p class="lead">Le projet le plus voté devient celui du groupe.<br>Et s’il se réalisait dans votre milieu ?</p>
{zone('Si ça me tente : ce que mon sigle ou ma fonction pourrait y apporter', '1.9in')}
''', verbe=2)

# --- 12 · 11 Mon élan ---------------------------------------------------------
page(f'''
{verbe_ban(3)}
{h('11', 'Mon élan', 'R', 'Autonomie')}
<p class="lead">De retour dans mon milieu, lundi matin. Une idée qui me donne envie :</p>
{coche(['Demander à mon groupe : « Qu’est-ce qui vous préoccupe ? »', 'Afficher les trois cercles dans ma classe.', 'Terminer une période par un 3-2-1.', 'Laisser mes élèves voter pour un projet.', 'Faire un « Oui, et… » entre élèves.', 'Inviter quelqu’un du quartier en classe.', 'Transformer une tâche de mon sigle à partir d’un enjeu choisi par l’élève.', 'Proposer un projet-pont à une ou un collègue d’un autre programme.', 'Commencer un babillard des forces.', 'Appeler le CSI pour un premier café.', 'Direction ou services : protéger une période commune pour une équipe.'], 'idees')}
{zone('Mon idée', '1.0in')}
<div class="trio">{zone('Quand', '0.95in')}{zone('Avec qui', '0.95in')}{zone('Mon allié', '0.95in')}</div>
{renvoi('Avant de me lancer : <b>Innover au CFGA</b> et <b>les six questions</b>, pages 12 et 13.')}
''', verbe=3)

# --- 13-14 · cadre d'innovation (pleine page) --------------------------------
page('<img class="full" src="img/outils/cadre1_t.png" alt="Innover au CFGA : le cadre d’innovation">', verbe=3, cls='outil')
page('<img class="full" src="img/outils/cadre2_t.png" alt="Six questions avant de se lancer">', verbe=3, cls='outil')

# --- 15 · des idées ---------------------------------------------------------
page(f'''
{h('12', 'Des idées', 'E', 'Sens', 'Appartenance')}
<h3 class="h3">Pour décloisonner</h3>
<div class="idees">
  <div><b>Des ateliers par besoin</b>Trois classes au même moment. Les verbes ici, la syntaxe là. L’élève va où il en a besoin.</div>
  <div><b>Une heure sur trois</b>Sur trois heures de cours, une heure pour un projet d’engagement.</div>
  <div><b>Le babillard des forces</b>Chacun affiche son top 3. Les projets y recrutent leurs « experts ».</div>
  <div><b>Un projet, un partenaire</b>Chaque projet jumelé à un organisme du quartier, avec le CSI.</div>
  <div><b>Enseigner aux autres</b>Une fois par mois, un groupe présente son projet à un autre groupe.</div>
  <div><b>La question de la semaine</b>Le lundi, une question au tableau. Le vendredi, on en parle.</div>
</div>
{zone('Les incubateurs solidaires, du Saguenay au Sénégal : ce que je retiens', '1.5in')}
{zone('Mon idée à moi', '1.5in')}
''', verbe=3)

# --- 16 · 3-2-1 -------------------------------------------------------------
page(f'''
{h('13', 'Objectivation 3-2-1', 'R', 'Compétence')}
<p class="lead">On termine comme on aimerait que nos élèves terminent :<br>en regardant le chemin parcouru.</p>
<div class="o321"><b>3</b>{zone('idées que je retiens', '2.65in')}</div>
<div class="o321"><b>2</b>{zone('choses que j’essaie', '2.1in')}</div>
<div class="o321"><b>1</b>{zone('question qui me reste', '1.5in')}</div>
''', verbe=3)

# --- 17 · ce qui a été vécu --------------------------------------------------
vecu = [('Pense, parle, partage', 'le monde idéal, et un peu partout'), ('Des îlots hétérogènes, formés exprès', 'centres, programmes, fonctions'), ('La classe collabo-réflexive', 'les surfaces verticales'), ('La démarche inductive', 'vivre d’abord, nommer ensuite'), ('L’enseignement explicite', 'résultat ou action'), ('Le droit à l’erreur', 'et à la case vide'), ('Les objectifs SMART', 'du résultat aux actions'), ('Le choix et le vote', 'la galerie'), ('La rétroaction par les pairs', '« Oui, et… »'), ('Les forces comme leviers', 'je suis capable'), ('Expansion et restriction', 'ouvrir, puis resserrer'), ('L’IA au service du sens', 'l’invite Copilot'), ('L’objectivation', 'le 3-2-1')]
page(f'''
<header class="sec">{tags(None, 'Compétence', 'Sens')}<h2>Ce qui a été vécu dans cet atelier</h2></header>
<p class="lead">Cochez celles que vous aimeriez essayer avec vos élèves.</p>
<ul class="coche vecu">{''.join(f'<li><b>{a}</b><small>{b}</small></li>' for a, b in vecu)}</ul>
''', verbe=3)

# --- 18 · pour aller plus loin ---------------------------------------------
page(f'''
<header class="sec"><h2>Pour aller plus loin</h2></header>
<figure class="bull"><img src="img/nb_bulletin.jpg" alt=""><figcaption>La rencontre de suivi animée par l’élève : c’est lui qui mène.</figcaption></figure>
<ul class="loin">
  <li><b>J’ai MON plan!</b>L’adulte s’approprie son parcours : ses cours, ses échéances, ses buts.</li>
  <li><b>La rencontre animée par l’élève</b>20 minutes. L’adulte présente son plan. On passe de juge à coach.</li>
  <li><b>L’objectivation</b>La maison à trois étages et des questions avant, pendant, après (page 22).</li>
  <li><b>Le CSI</b>Il accompagne les groupes qui veulent se lancer, dans les quatre CSS de la région.</li>
</ul>
<p class="refs">Deci et Ryan (2000), <i>Psychological Inquiry</i>, 11(4) · Wehmeyer (1999), <i>Focus on Autism and Other Developmental Disabilities</i>, 14(1) · Fredricks, Blumenfeld et Paris (2004), <i>Review of Educational Research</i>, 74(1) · ONU, les 17 objectifs de développement durable.</p>
''', verbe=3)

# --- 19 · la démarche --------------------------------------------------------
page('<img class="full" src="img/infographie_demarche.png" alt="La démarche en un coup d’œil">', verbe=3, cls='outil')

# --- 20 · ce qui reste, dans un an -----------------------------------------
page(f'''
<header class="sec"><h2>Ce qui reste</h2></header>
<div class="reste">
  <img src="img/frag_ecole.jpg" alt="Écriture d’un élève : « j’ai le goût de venir à l’école »">
  <p class="cit">« Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté. »<small>Un parent</small></p>
</div>
<div class="an">
  <p class="an-k">Dans un an</p>
  <p class="an-q">Le 13 novembre 2027,<br>qu’est-ce qui sera resté de cette journée ?</p>
  <p class="hand an-h">Écrivez-vous. On relit cette page dans un an.</p>
  <div class="an-z"></div>
</div>
''', verbe=3)

# --- 21-24 · boîte à outils --------------------------------------------------
for f, alt in [('engagement-1_t', 'L’engagement'), ('engagement-2_t', 'Les quatre besoins'), ('obj1_t', 'L’objectivation'), ('forces1_t', 'Liste de mes capacités et de mes forces')]:
    page(f'<p class="bao">{ICO_OUTIL}<span>Boîte à outils</span></p><img class="full" src="img/outils/{f}.png" alt="{alt}">', cls='outil')

page(f'''<header class="sec"><h2>Mes notes</h2></header><div class="notes"></div>''')
assert len(pages) % 4 == 0, len(pages)

# --- assemblage --------------------------------------------------------------
def tabs(n, verbe):
    side = 'r' if n % 2 else 'l'
    t = ''.join(f'<span class="tb{" on" if verbe == i else ""}" style="top:{1.15 + i * 2.05}in;--bg:{bg};--fg:{fg}"><span>{v}</span></span>' for i, (v, bg, fg) in enumerate(VERBES))
    return f'<div class="tabs {side}">{t}</div>'

out = []
for i, (body, verbe, cls) in enumerate(pages, 1):
    side = 'odd' if i % 2 else 'even'
    folio = '' if i == 1 else f'<span class="folio">{i}</span>'
    tb = '' if i == 1 or verbe is None else tabs(i, verbe)
    body = body.replace(' ?', '\u00a0?').replace(' !', '\u00a0!').replace(' :', '\u00a0:').replace(' »', '\u00a0»').replace('« ', '«\u00a0')
    out.append(f'<section class="pg {side} {cls}">{tb}<div class="in">{body}</div>{folio}</section>')

CSS = open(B + '/cahier.css', encoding='utf8').read()
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cahier du participant · Rêver le monde de demain</title><style>{CSS}</style></head><body>
{''.join(out)}
</body></html>'''
open(B + '/cahier.html', 'w', encoding='utf8').write(html)
land = LAND.replace(' ?', '\u00a0?').replace(' :', '\u00a0:').replace(' »', '\u00a0»').replace('« ', '«\u00a0')
open(B + '/venn_land.html', 'w', encoding='utf8').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}</style></head><body style="margin:0"><div class="land-in flat">{land}</div></body></html>')
print(len(pages), 'pages')
