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
        out.append(f'<div class="tag res">{ICO_RES}<b>Restriction</b> on restreint</div>')
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
    <p class="cv-site">rever-le-monde.netlify.app</p>
    <div class="cv-moi"><span>Ce cahier appartient à</span></div>
  </div>
  <div class="cv-qr">{QR}</div>
</div>
<div class="cv-foot">
  <div class="cv-names"><p><b>Isabelle Pedneault</b><br>Conseillère pédagogique, CFGA De Jonquière</p><p><b>Francis Laroche</b><br><span class="nw">Chargé de projet en éducation citoyenne mondiale</span><br><span class="nw">Centre de solidarité internationale du Saguenay–Lac-Saint-Jean</span></p></div>
  <div class="cv-logos"><img src="img/logo_cfga.png" alt="CFGA"><img src="img/logo_csi.png" alt="CSI"></div>
</div>
<p class="cv-note">Atelier conçu par Isabelle Pedneault et Francis Laroche.</p>
<p class="cv-note cv-iag"><img src="img/iag_partagee.png" alt="IAg · Assistance partagée (pictogramme de l’UQAC)"></p>
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
  <p class="w2">Écrire « je ne sais pas » ou laisser une case vide : ce n’est pas une erreur.</p>
</div>
<h3 class="leg-t">Les repères du cahier</h3>
<div class="leg">
  <div class="leg-r"><div class="tag exp">{ICO_EXP}<b>Expansion</b></div><p>On ouvre.<br>On cherche des idées : seul, avec les autres, avec l’IA.</p></div>
  <div class="leg-r"><div class="tag res">{ICO_RES}<b>Restriction</b></div><p>On restreint.<br>On choisit, on précise.</p></div>
  <div class="leg-r"><div class="leg-n"><div class="tag nour"><b>Nourrit :</b> Sens</div><div class="tag nour"><b>Nourrit :</b> Autonomie</div><div class="tag nour"><b>Nourrit :</b> Appartenance</div><div class="tag nour"><b>Nourrit :</b> Compétence</div></div><p>Le besoin que l’activité nourrit.<br>Chez vous… et chez vos élèves.</p></div>
  <div class="leg-r"><div class="leg-tabs">{''.join(f'<span style="background:{bg};color:{fg}">{v}</span>' for v, bg, fg in VERBES)}</div><p>Les 4 verbes de l’atelier.<br>Ils sont aussi sur le bord des pages.</p></div>
  <div class="leg-r"><p class="renvoi solo">{ICO_OUTIL}<span>Boîte à outils</span></p><p>Un coup de pouce, ou pour aller plus loin.<br>La liste des outils : page 17.</p></div>
</div>
''', verbe=0)

# --- 3 · 01 post-it + 02 pari ---------------------------------------------
page(f'''
{verbe_ban(0)}
{h('01', 'Ce qui me préoccupe dans mon milieu', 'E', 'Sens')}
<div class="p01">
  <div class="postit">
    <svg class="mini3" viewBox="-6 0 146 112" aria-hidden="true"><g fill="none" stroke="var(--ink)" stroke-width="2.6"><circle cx="44" cy="40" r="36"/><circle cx="86" cy="40" r="36"/><circle cx="65" cy="72" r="36"/></g><g font-family="Inter" font-weight="800" font-size="8.6" text-anchor="middle" fill="var(--ink)"><text x="30" y="30">ÉCOLE</text><text x="98" y="31">COMMUNAUTÉ</text><text x="65" y="98">NATURE</text></g></svg>
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
{renvoi('Motivation ≠ engagement : l’outil <b>L’engagement</b>, page 18.')}
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
{renvoi('<b>L’engagement</b>, page 18 · <b>Formuler des objectifs SMART</b>, sur le site.')}
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
{renvoi('<b>Liste de mes capacités et de mes forces</b> (J’ai MON plan!) : sur le site <b>rever-le-monde.netlify.app</b>')}
{h('10', 'Un projet, toutes nos disciplines', 'E', 'Sens')}
<p class="lead">Le projet le plus voté devient celui du groupe.<br>Et s’il se réalisait dans votre milieu ?</p>
{zone('Si ça me tente : ce que mon sigle ou ma fonction pourrait y apporter', '1.9in')}
''', verbe=2)

# --- 11 · des idées (S'engager) ------------------------------------------------
page(f'''
{verbe_ban(3)}
{h('11', 'Des idées', 'E', 'Sens', 'Appartenance')}
<h3 class="h3">Pour décloisonner</h3>
<div class="idees">
  <div><b>Des ateliers par besoin</b>Trois classes au même moment. L’élève va où il en a besoin.<i>Par exemple : les verbes ici, la syntaxe là.</i></div>
  <div><b>Une heure sur trois</b>Sur trois heures de cours, une heure pour un projet d’engagement.</div>
  <div><b>Des experts dans d’autres sigles</b>Le budget du projet ? Un élève en maths.<br>Un texte à réviser ? Un élève en français.</div>
  <div><b>Le babillard des forces</b>Chacun affiche son top 3. On y trouve ses experts.</div>
  <div><b>Un projet, un partenaire</b>Chaque projet jumelé à un organisme du quartier, avec le CSI.</div>
  <div><b>Enseigner aux autres</b>Une fois par mois, un groupe présente son projet à un autre groupe.</div>
</div>
{zone('Les incubateurs solidaires, du Saguenay au Sénégal : ce que je retiens', '1.45in')}
{zone('Mon idée à moi', '1.45in')}
''', verbe=3)

# --- 12 · 3-2-1 -------------------------------------------------------------
page(f'''
{h('12', 'Objectivation 3-2-1', 'R', 'Compétence')}
<p class="lead">On termine comme on aimerait que nos élèves terminent :<br>en regardant le chemin parcouru.</p>
<div class="o321"><b>3</b>{zone('idées que je retiens', '2.65in')}</div>
<div class="o321"><b>2</b>{zone('choses que j’essaie', '2.1in')}</div>
<div class="o321"><b>1</b>{zone('question qui me reste', '1.5in')}</div>
''', verbe=3)

# --- 13 · ce qui a été vécu --------------------------------------------------
vecu = [('Pense, parle, partage', 'le monde idéal, en îlot'), ('Des îlots hétérogènes, formés exprès', 'centres, programmes, fonctions'), ('La classe collabo-réflexive', 'les surfaces verticales'), ('La démarche inductive', 'vivre d’abord, nommer ensuite'), ('L’enseignement explicite', 'résultat ou action'), ('Le droit à l’erreur', 'et à la case vide'), ('Les objectifs SMART', 'du résultat aux actions'), ('Le choix et le vote', 'la galerie'), ('La rétroaction par les pairs', '« Oui, et… »'), ('Les forces comme leviers', 'je suis capable'), ('Expansion et restriction', 'ouvrir et restreindre'), ('L’IA au service du sens', 'l’invite Copilot'), ('L’objectivation', 'le 3-2-1')]
page(f'''
<header class="sec">{tags(None, 'Compétence', 'Sens')}<h2>Ce qui a été vécu dans cet atelier</h2></header>
<p class="lead">Cochez celles que vous aimeriez essayer avec vos élèves.</p>
<ul class="coche vecu">{''.join(f'<li><b>{a}</b><small>{b}</small></li>' for a, b in vecu)}</ul>
''', verbe=3)

# --- 14 · 13 Mon élan (à la fin) -----------------------------------------------
page(f'''
{h('13', 'Mon élan', 'R', 'Autonomie')}
<p class="lead">De retour dans mon milieu, lundi matin. Une idée qui me donne envie :</p>
{coche(['Demander à mon groupe : « Qu’est-ce qui vous préoccupe ? »', 'Afficher les trois cercles dans ma classe.', 'Terminer une période par un 3-2-1.', 'Laisser mes élèves voter pour un projet.', 'Faire un « Oui, et… » entre élèves.', 'Inviter quelqu’un du quartier en classe.', 'Transformer une tâche de mon sigle à partir d’un enjeu choisi par l’élève.', 'Proposer un projet-pont à une ou un collègue d’un autre programme.', 'Commencer un babillard des forces.', 'Appeler le CSI pour un premier café.', 'Direction ou services : protéger une période commune pour une équipe.'], 'idees')}
{zone('Mon idée', '1.0in')}
<div class="trio">{zone('Quand', '0.95in')}{zone('Avec qui', '0.95in')}{zone('Mon allié', '0.95in')}</div>
{renvoi('Avant de me lancer : <b>Innover au CFGA</b> et <b>les six questions</b>, pages 23 et 24.')}
''', verbe=3)

# --- 15 · ce qui reste, dans un an -----------------------------------------
page(f'''
<header class="sec"><h2>Ce qui reste</h2></header>
<img class="carnet" src="img/mot_eleve_2017.jpg" alt="Mot d’un élève : « Chère Mme Isabelle, vous avez été pour moi un immense soutien et de même un exemple. Aussi vous m’avez redonné envie d’aller à l’école. Merci »">
<div class="an">
  <p class="an-k">Dans un an</p>
  <p class="an-q">Le 13 novembre 2027,<br>qu’est-ce qui sera resté de cette journée ?</p>
  <p class="hand an-h">Écrivez-vous. On relit cette page dans un an.</p>
  <div class="an-z"></div>
</div>
''', verbe=3)

# --- 16 · la démarche en un coup d'œil ----------------------------------------
DEM = [('Rêver', 'var(--v1)', 'var(--ink)', ['ça me dérange', 'post-it', '3 cercles', 'monde idéal', 'pense · parle · partage'], 'se fixer un but'),
       ('Cibler', 'var(--v2)', '#fff', ['analyse de contexte', 'leviers', '« je remarque que »', 'résultat → actions', 'SMART'], 'prendre des décisions'),
       ('Choisir', 'var(--v3)', 'var(--ink)', ['galerie', '3 votes', '« Oui, et… »', 'mes forces', 'projet du groupe'], 'faire des choix'),
       ('S’engager', 'var(--v4)', '#fff', ['des idées', '3-2-1', 'mon élan', 'un verbe · une date · un allié'], 'agir et s’autoévaluer')]
page(f'''
<header class="sec"><h2>La démarche en un coup d’œil</h2></header>
<div class="dem">{''.join(f'<div class="dm"><div class="dn" style="background:{bg};color:{fg}"><b>{i + 1}</b><span>{v}</span></div><div class="dk">{"".join(f"<span>{k}</span>" for k in ks)}</div><div class="da"><small>L’élève apprend à</small><b>{a}</b></div></div>' for i, (v, bg, fg, ks, a) in enumerate(DEM))}</div>
<div class="fil"><b>Tout au long</b><p>Ouvrir et restreindre : <strong>expansion et restriction</strong>.</p><p>Modelage → pratique guidée → pratique autonome.</p><p>Nourrir les 4 besoins : <strong>compétence · autonomie · sens · appartenance</strong>.</p></div>
''', verbe=3)

# --- 17 · pour aller plus loin : la liste des outils ----------------------------
DANS = [('L’engagement', 'motivation ≠ engagement, les 4 besoins, la rétroaction', '18'), ('Les neuf gestes, et leur miroir', 'ce que je fais, ce que je dis, et le geste de l’élève', '19'), ('L’objectivation', 'la maison à trois étages', '20'), ('Les questions avant, pendant, après', 'à piger, pas à poser toutes', '21-22'), ('Innover au CFGA', 'le cadre et les six questions', '23-24')]
SUR = [('Mon invite Copilot', 'étape par étape, avec l’extrait officiel de votre sigle'), ('Formuler des objectifs SMART', 'la fiche complète, et « Se fixer des objectifs »'), ('J’ai MON plan! · version FGA', 'mes forces, la banque de moyens (« je le garde en tête »), le suivi de mes moyens ; avec son tuteur'), ('L’aide-mémoire Copilot', 'la formule et 7 invites prêtes'), ('La fiche élève', 'De l’idée à l’action, à photocopier'), ('Mes interventions universelles', 'une autoévaluation, la grille EN.1.1'), ('Les extraits de programmes', 'les pages officielles, à joindre à Copilot')]
page(f'''
<header class="sec"><h2>Pour aller plus loin</h2></header>
<p class="lead">Des outils pour un coup de pouce, ou pour aller plus loin.</p>
<h3 class="h3">{ICO_OUTIL} Dans ce cahier</h3>
<ul class="outils">{''.join(f'<li><b>{a}</b><span>{b}</span><i>p. {p}</i></li>' for a, b, p in DANS)}</ul>
<h3 class="h3">Sur le site</h3>
<p class="site-big">rever-le-monde.netlify.app</p>
<ul class="outils">{''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in SUR)}</ul>
<p class="lead"><b>Le CSI</b> accompagne les groupes qui veulent se lancer, dans les quatre centres de services de la région.</p>
<p class="refs">Deci et Ryan (2000), <i>Psychological Inquiry</i>, 11(4) · Wehmeyer (1999), <i>Focus on Autism and Other Developmental Disabilities</i>, 14(1) · Fredricks, Blumenfeld et Paris (2004), <i>Review of Educational Research</i>, 74(1).</p>
''', verbe=3)

# --- 18-22 · boîte à outils, en gros caractères ---------------------------------
CR_ENG = 'D’après l’affiche manuscrite d’Isabelle Pedneault · L’engagement'
CR_OBJ = 'Document d’objectivation d’Isabelle Pedneault · L’objectivation'
CR_CADRE = 'Adapté du cadre des COP IA : Giroux, Munger et Pedneault (2026) · Cadre d’innovation CFGA'
def outil(kick, titre, sous, corps, cred):
    page(f'<p class="bao">{ICO_OUTIL}<span>Boîte à outils</span></p><div class="tool"><p class="tk">{kick}</p><h2 class="tt">{titre}</h2><p class="ts">{sous}</p>{corps}</div><p class="tcred">{cred} · CC BY-NC-SA 4.0</p>', cls='tpage')

B4 = [('Compétence', '#1F4E8C', ['Défi optimal', 'Rétroaction de qualité', 'Progression visible']), ('Autonomie', '#0F766E', ['Choix', 'Voix et participation', 'Contrôle sur la tâche']), ('Sens', '#A33A32', ['Utilité', 'But personnel', 'Transfert']), ('Appartenance', '#C27F2B', ['Relations positives', 'Climat sécurisant', 'Temps de qualité'])]
outil('Un moteur invisible qui fait grandir', 'L’engagement', 'Un écosystème vivant : construire une vie riche de sens', f'''
<p class="band" style="background:#0F766E">Motivation ≠ engagement</p>
<div class="me"><div style="background:#8FA0B8"><b>Motivation</b>La force qui pousse à l’action : valeurs, objectifs, désirs.<br>Ce n’est pas une question de « j’ai envie » ou « ça me tente ».</div><div style="background:#20375F"><b>Engagement</b>La décision de prendre part activement à une activité, un projet, une mission.<br>C’est un choix, pas une humeur.</div></div>
<p class="band" style="background:#E89A2B">Quatre besoins à nourrir</p>
<div class="b4t">{''.join(f'<div style="background:{c}"><b>{n}</b><ul>{"".join(f"<li>{x}</li>" for x in xs)}</ul></div>' for n, c, xs in B4)}</div>
<p class="band" style="background:#20375F">Une rétroaction de qualité</p>
<div class="r4"><div><b>Précise</b>on sait quoi regarder</div><div><b>Sur le processus</b>pas sur la personne</div><div><b>La prochaine étape</b>pas seulement l’erreur</div><div><b>Des critères connus</b>établis d’avance</div></div>
<p class="band" style="background:#7A9A3A">Pourquoi ça compte</p>
<ul class="two"><li>Il donne une direction à notre énergie.</li><li>Il transforme l’intention en action.</li><li>Il nourrit notre bien-être.</li><li>Il favorise le dépassement de soi.</li><li>Il permet de contribuer à plus grand que soi.</li><li>Il crée une spirale positive.</li><li>Persévérer malgré les obstacles.</li><li>Créer des liens significatifs.</li><li>Ressentir de la fierté.</li><li>Contribuer au bien commun.</li></ul>
''', CR_ENG)
GESTES = [('Questionner', 'Je pose une question avant d’expliquer.', 'Qu’est-ce que tu remarques ?', 'Je me pose une question avant de commencer.', 'Qu’est-ce qu’on me demande, au juste ?'),
    ('Écouter', 'Je laisse finir, puis je reformule.', 'Si je comprends bien, tu…', 'J’écoute la consigne jusqu’au bout.', 'Je la redis dans mes mots.'),
    ('Faire réfléchir', 'J’attends avant de donner la réponse.', 'Comment tu le sais ?', 'Je vérifie mon raisonnement.', 'Comment je sais que c’est juste ?'),
    ('Rétroagir', 'Je nomme ce qui marche, puis la prochaine étape.', 'Ça, c’est réussi. Maintenant…', 'Je regarde mon erreur comme une donnée.', 'Qu’est-ce que je change la prochaine fois ?'),
    ('Coopérer', 'Je jumelle deux élèves sur une tâche.', 'Montre-lui comment tu as fait.', 'J’aide un pair, ou je lui demande.', 'Comment tu as fait, toi ?'),
    ('Donner un défi', 'Je propose une tâche un cran plus haut.', 'Je pense que tu es capable d’essayer celle-là.', 'Je choisis le bon défi.', 'Pas trop facile, pas trop difficile.'),
    ('Raconter', 'Je relie la notion à une situation de vie.', 'Ça sert quand tu…', 'Je relie ce que j’apprends à ma vie.', 'À quoi ça me sert, à moi ?'),
    ('Différencier', 'J’offre un autre chemin, un autre support.', 'Veux-tu essayer avec un exemple ?', 'Je cherche ce qui m’aide à apprendre.', 'J’apprends mieux avec…'),
    ('Laisser choisir', 'J’offre deux ou trois options.', 'Tu commences par laquelle ?', 'Je décide de l’ordre, du moyen.', 'Je commence par…')]
outil('Qui tient la manette ?', 'Les neuf gestes, et leur miroir', 'Ce que je fais et ce que je dis, puis le même geste chez l’élève', f'''
<div class="mir"><div class="mh"><span></span><span>Le geste de l’enseignant·e</span><span>Le miroir : le geste de l’élève</span></div>
{''.join(f'<div class="mr"><b>{g}</b><div class="me1"><p>{a}</p><q>{p}</q></div><div class="me2"><p>{e}</p><q>{ep}</q></div></div>' for g, a, p, e, ep in GESTES)}</div>
<p class="tp c">Mon geste de la semaine : je le choisis, je le coche, je le partage.</p>
''', 'D’après « Qui tient la manette ? » et la Boussole d’Isabelle Pedneault')
outil('Un temps d’arrêt, pas une perte de temps', 'L’objectivation', 'Regarder l’activité à venir, celle en cours, ou celle déjà faite', '''
<p class="band" style="background:#20375F">Ce que c’est</p>
<p class="tp">Un temps d’arrêt pris avec les élèves pour observer comment ils pensent, faire le ménage dans leur tête, prendre conscience des réussites et des difficultés.</p>
<p class="tp"><b>Le temps consacré à l’objectivation n’est pas perdu : il est gagné.</b></p>
<p class="band" style="background:#E89A2B">Sur quoi objectiver</p>
<ul class="obj5"><li><b>Les attitudes</b>Une attitude positive prépare à apprendre.</li><li><b>Les apprentissages</b>Prendre conscience de ce qu’on a appris : ça reste mieux.</li><li><b>Les comportements</b>Un retour chaque jour, pas une seule fois.</li><li><b>Les stratégies</b>Y revenir aide à les comprendre et à les garder.</li><li><b>Les démarches</b>Vérifier comment on les comprend et les utilise.</li></ul>
<p class="band" style="background:#7A9A3A">La maison à trois étages · à raconter aux élèves</p>
<div class="maison"><div class="toit"></div><div class="et e3"><b>3</b><span><strong>Les apprentissages</strong>Ici, je classe ce que j’apprends, comme dans des tiroirs.</span></div><div class="et e2"><b>2</b><span><strong>Les émotions</strong>Si je me sens bien avec les autres et fier de moi, la porte s’ouvre.</span></div><div class="et e1"><b>1</b><span><strong>Les besoins primaires</strong>Si j’ai bien mangé, assez dormi, si je suis en santé, la porte s’ouvre.</span></div></div>
<p class="tp c">On n’arrive pas au troisième étage sans passer par le premier et le deuxième.</p>
''', CR_OBJ)
AV = ['Suis-je en projet de vivre l’activité de façon positive ?', 'Ai-je le goût de réaliser la tâche ?', 'Est-ce que je connais les objectifs de ce travail ?', 'Est-ce que je connais l’intention de la tâche ?', 'Est-ce que je comprends les consignes ?', 'Est-ce que je comprends bien la tâche demandée ?', 'Est-ce que je peux expliquer à quelqu’un ce que je dois faire ?', 'Ai-je tout le matériel nécessaire ?', 'Qu’est-ce qui m’empêche de me mettre au travail ?', 'Que puis-je faire pour me mettre à la tâche ?', 'Qu’est-ce que je pense apprendre en faisant cette activité ?', 'Ai-je pris conscience de ce que je connais sur le sujet ?', 'Y a-t-il des étapes que je ne comprends pas ?', 'Est-ce que je peux dire quelles informations me manquent ?', 'Ai-je les moyens de chercher les informations qui me manquent ?', 'Ai-je déjà réalisé une tâche semblable ?', 'Ai-je bien exploré la situation ? Ai-je bien observé ?', 'Ai-je pris le temps de bien écouter toutes les explications ?', 'Ai-je confiance en moi ? Est-ce que je me crois capable de réaliser la tâche ?']
PE = ['Est-ce que je commence à temps ?', 'Suis-je à mon affaire ?', 'Ai-je besoin d’aide ? Est-ce que je sais qui peut m’aider ?', 'Est-ce que je prends le temps de penser à la tâche dans son ensemble ?', 'Est-ce que je pense à consulter mes outils de référence ?', 'Suis-je capable de réaliser cette tâche ?', 'Est-ce que j’ai compris ?', 'Suis-je motivé ou motivée à faire le travail ?', 'Ai-je pris le temps de me vérifier ?', 'Est-ce que je sais m’arrêter pour vérifier si j’ai compris ?', 'Mon comportement est-il correct ?', 'Est-ce que j’accorde de l’importance aux bonnes choses ?', 'Est-ce que je peux enlever des éléments inutiles ?', 'Y a-t-il assez de précisions dans mon travail ?', 'Est-ce que je m’exprime bien ?', 'Est-ce que je prends le temps de bien observer ?', 'Ai-je utilisé les bonnes techniques ? Est-ce que je m’y prends de la bonne façon ?', 'Ai-je pensé à plusieurs solutions possibles ?', 'Est-ce que je connais bien les étapes pour réaliser la tâche ?', 'Est-ce que je prends le temps d’aller chercher dans ma tête les connaissances apprises ?', 'Ai-je peur de me tromper ? Suis-je nerveux ou nerveuse ? Ai-je confiance en moi ?']
AP = ['Qu’est-ce que j’ai appris ? Ai-je fait de nouveaux apprentissages ?', 'Qu’est-ce que j’ai compris ? Qu’est-ce que j’ai découvert ?', 'Qu’est-ce que je retiens ?', 'Ai-je atteint l’objectif ?', 'Comment m’y suis-je pris pour réussir ?', 'Ai-je utilisé les bonnes stratégies ? Lesquelles m’ont été utiles ?', 'Ai-je pris le temps de bien lire les démarches ?', 'Comment ai-je vérifié mon travail ?', 'Ai-je utilisé les outils nécessaires ?', 'Ai-je utilisé tout mon temps ?', 'Ai-je réalisé la tâche de mon mieux ?', 'Suis-je content ou contente de mon travail ?', 'Étais-je motivé ou motivée ? Est-ce que je désirais réussir ?', 'Ai-je montré de bonnes attitudes ?', 'Y a-t-il quelque chose qui m’a empêché de bien travailler ?', 'Ai-je eu besoin d’aide ? Ai-je aidé les autres ?', 'Si j’avais à revivre cette activité, qu’est-ce que je ferais de différent ?', 'Quand vais-je me servir de cette nouvelle notion ?', 'Ai-je le goût d’aller plus loin ? Ai-je aimé cette activité ?', 'Y a-t-il des points à retravailler ?', 'Quelle opinion ai-je de moi-même ?', 'Je félicite… · Je remercie… · Je suis fier ou fière de…']
ol = lambda L: '<ol class="qq">' + ''.join(f'<li>{x}</li>' for x in L) + '</ol>'
outil('Les questions : à piger, pas à poser toutes', 'Avant et pendant', 'Se mettre en projet, puis se réguler en cours de route', f'<div class="qcols"><div><p class="band" style="background:#20375F">Avant · se mettre en projet</p>{ol(AV)}</div><div><p class="band" style="background:#0F766E">Pendant · se réguler</p>{ol(PE)}</div></div>', CR_OBJ)
outil('Les questions : à piger, pas à poser toutes', 'Après', 'Intégrer ce qu’on vient de vivre, et se projeter', f'<p class="band" style="background:#E89A2B">Après · intégrer et se projeter</p><div class="qafter">{ol(AP)}</div>', CR_OBJ)

# --- 23-24 · cadre d'innovation, en gros caractères --------------------------
outil('Formation générale des adultes', 'Innover au CFGA', 'Un cadre pour essayer sans se mettre en danger', '''
<p class="band" style="background:#0F766E">Ce sur quoi ça repose · les quatre fondations</p>
<div class="f4"><div><b>Durabilité et flexibilité</b>Penser le changement sur la durée, sans viser le coup d’éclat.</div><div><b>Le droit d’essayer</b>Un bac à sable où se tromper sans se sentir évalué.</div><div class="hot"><b>Du temps protégé</b>Le temps de planification existe. L’enjeu : le réserver et le tenir.</div><div><b>La réussite des adultes</b>La seule finalité qui tranche quand on hésite.</div></div>
<p class="band" style="background:#E89A2B">Ce qu’on examine · avant, pendant, après</p>
<div class="r4 r3"><div><b>Pédagogique</b>Est-ce que ça sert l’apprentissage ?</div><div><b>Éthique</b>À qui ça profite, à qui ça nuit ?</div><div><b>Légal</b>Vie privée, droits d’auteur, encadrements</div></div>
<p class="band" style="background:#7A9A3A">Les trois ajouts des COP IA du CSSDLJ</p>
<div class="r4 r3"><div><b>Soutien</b>Qui m’accompagne, avec quel temps.</div><div><b>Validation par les pairs</b>Qui peut enrichir mon idée et en voir les angles morts.</div><div><b>Pérennité</b>Qui l’a vue assez de fois pour la refaire sans moi.</div></div>
<p class="band" style="background:#20375F">Ce que ça change en FGA</p>
<ul class="obj5"><li><b>Enseignement individualisé</b>Chacun avance à son rythme : une pratique de groupe ne « tombe » pas toute seule.</li><li><b>Entrées continues</b>Le groupe change chaque semaine : l’innovation doit tenir sans cohorte stable.</li><li><b>Groupes multiniveaux</b>Plusieurs sigles dans la même classe, donc plusieurs programmes.</li><li><b>Une présence volontaire</b>Personne n’est obligé d’être là. Une pratique qui exige tout le monde ne tient pas.</li></ul>
<p class="tranche"><b>La question qui tranche</b>« Qui l’a vue assez de fois pour la refaire sans moi ? » Sinon, ça meurt avec la personne qui l’a portée.</p>
''', CR_CADRE)
SIXQ = [('Le cadre ministériel', [('Pertinence pédagogique', 'Mon projet a-t-il une pertinence pédagogique ?'), ('Éthique', 'Ai-je réfléchi aux principes éthiques en jeu ?'), ('Cadre légal', 'Mon initiative respecte-t-elle le cadre légal ?')]),
        ('Les trois ajouts des COP IA', [('Soutien', 'Ai-je accès au soutien nécessaire pour la mettre en œuvre ?'), ('Validation par les pairs', 'Ai-je consulté mes pairs pour enrichir mon idée et en voir les angles morts ?'), ('Pérennité', 'Peut-elle être maintenue dans le temps et adaptée ailleurs ?')])]
_n = iter(range(1, 7))
outil('À remplir avant de se lancer', 'Six questions', 'Un « non » ne bloque rien : il signale qu’il reste à réfléchir', ''.join(f'<p class="band" style="background:{c}">{g}</p><div class="sixq">' + ''.join(f'<div><i>{next(_n)}</i><span><b>{a}</b>{q}</span><em>oui</em><em>non</em></div>' for a, q in L) + '</div>' for (g, L), c in zip(SIXQ, ['#0F766E', '#7A9A3A'])) + '''
<p class="band" style="background:#E89A2B">Comment s’en servir</p>
<ul class="obj5"><li><b>Avant</b>Poser les six questions à voix haute, avec quelqu’un d’autre. Seul, on se répond trop vite.</li><li><b>Pendant</b>Y revenir une fois. Ce qui était « oui » en septembre ne l’est pas forcément en novembre.</li><li><b>Après</b>La question 6 se répond seulement à la fin. C’est elle qui décide si ça reste.</li></ul>
<p class="tranche"><b>En FGA, la question 4 est la plus souvent oubliée</b>Le soutien, ce n’est pas seulement quelqu’un de disponible : c’est du temps réservé à l’horaire, et tenu.</p>
''', CR_CADRE)

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
