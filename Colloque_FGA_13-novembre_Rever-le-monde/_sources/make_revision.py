"""Grille de révision complète pour Francis : un Google Doc à remplir (tableaux)."""
import json, html
S = json.load(open('slides.json', encoding='utf8'))
SITE = 'https://rever-le-monde.netlify.app'
PRES = SITE + '/presentation/'
CAHIER = SITE + '/fichiers/02_Cahier-du-participant.pdf'
GUIDE = 'https://github.com/isabellepedneault111-ai/Chat-/raw/claude/friendly-hawking-lwif5a/Colloque_FGA_13-novembre_Rever-le-monde/01_Guide-animation_Isabelle-Francis.docx'
e = html.escape

Q = {  # questions précises par diapo ; les autres reçoivent la question générale
    2: 'Tu animes. La question est-elle assez simple maintenant ? La consigne à l’écran : « Un post-it, puis au mur. »',
    3: 'Ta fiche de présentation te ressemble-t-elle ? Écris ici ta définition courte de l’<b>éducation à la citoyenneté mondiale</b> et du <b>CSI</b> (2 phrases chacune) : on l’ajoute.',
    6: 'Tu animes. Les 4 verbes (décrire, reconnaître, analyser, esquisser) en blocs d’environ 15 minutes : ça te va ?',
    7: 'Étape 2 : le visuel de l’allumette et du feu te parle-t-il ? Étape 4 : le miroir des gestes (ce que l’enseignant dit, ce que l’élève se dit). Étape 5 : ta définition est-elle bien reprise ? « S’engager, c’est arrêter d’être spectateur : mettre son art au service d’une cause. C’est l’acte de l’humain libre qui cherche aussi à libérer les autres. »',
    9: 'Tu animes. Consigne et exemple clairs ? (Les minuteurs se réduisent ou se masquent : lien « masquer » à côté du minuteur.)',
    13: 'Qui anime quelle étape ? Le coup de pouce des 4 besoins, à droite : utile ou de trop ?',
    14: 'Fais le test Copilot de la section C avant de répondre. L’exemple modélisé avec un îlot : qui le fait ?',
    15: 'Isabelle l’anime (comme tu le proposais). Rien à faire, sauf si tu veux ajouter un exemple.',
    17: 'Votes en vrai, au plexiglas, avec une personne responsable qui reste à la table et reçoit les commentaires. « Je suis capable » : chacun colle son propre post-it. Les photos et totaux à l’écran : on les fait après, ou on les laisse tomber ?',
    19: 'Teste le bouton « Copier l’invite » avec un projet inventé. Le résultat dans Copilot est-il utile ?',
    21: 'Pas de photos d’élèves, pas d’autorisations à prévoir. On garde la diapo avec les photos des productions (votes, énoncés) prises sur place ?',
    22: 'L’idée est maintenant « en discussion : les élèves d’arts en PPS + ceux qui font les décors de l’école ». Est-ce exact ? Les pistes : en ajouter, en retirer ?',
    23: 'Tes 5 projets sont à l’écran : la forêt des Lions, le podcast, la coopérative agricole, le camp hivernal (avec Mashteuiatsh et MAMIK), le projet de lecture. Une phrase par projet ? Dépose les photos dans le dossier Drive « 1 - À l’écran ».',
    26: '« Mon élan » est maintenant à la fin, juste avant le merci : pas un devoir, une direction. Le mot te convient-il ? Les exemples ?',
    27: 'La page « Ce qui reste » du cahier : « Dans un an, qu’est-ce qui sera resté ? ». Garder telle quelle ?',
}
GEN = 'Clair ? Trop de texte ? Un mot à changer ?'

CAH = [
    (1, 'Couverture', 'Les noms, les titres, le pictogramme IA de l’UQAC : ça te va ?'),
    (2, 'Avertissement et repères', 'L’avertissement « Faites-nous confiance » : le ton est-il juste ?'),
    (3, '01 Post-it · 02 Notre pari', 'Les exemples du post-it ? Le pari ?'),
    (4, '03 Mon monde idéal (on tourne le cahier)', 'Assez de place pour écrire ?'),
    (5, '04 Parle et partage · 05 Analyse de contexte', 'Les questions guides aident-elles ?'),
    (6, '06 Résultat ou action ?', 'L’exemple du coin de verdure : parlant ?'),
    (7, 'SMART · coup de pouce des 4 besoins', 'Utile ou de trop ?'),
    (8, '07 Notre projet d’îlot', 'Les cases à cocher suivent-elles ce qu’on fera vraiment ?'),
    (9, '08 La galerie et les votes', 'Les couleurs (vert, jaune-beige, rose) : on a ces post-it ?'),
    (10, '09 Mes forces · 10 Un projet, toutes nos disciplines', ''),
    (11, '11 Des idées', 'Ajoute une idée à toi, et ce que tu veux qu’on retienne des incubateurs.'),
    (12, '12 Objectivation 3-2-1', ''),
    (13, 'Ce qui a été vécu dans cet atelier', 'Une pratique manque-t-elle ?'),
    (14, '13 Mon élan', 'Des idées à ajouter à la liste ? Le ton « pas de devoir » est-il respecté ?'),
    (15, 'Ce qui reste · dans un an', ''),
    (16, 'La démarche en un coup d’œil', ''),
    (17, 'Pour aller plus loin : la liste des outils', 'Ajouter une ressource du CSI ?'),
    ('18-22', 'Boîte à outils : l’engagement, les gestes et leur miroir, l’objectivation et ses questions', ''),
    ('23-24', 'Innover au CFGA · Six questions', ''),
]

COP = [
    ('Ouvre <a href="%s">le site</a>, onglet « Mon invite Copilot ».' % SITE, 'Ça s’ouvre ? Les onglets du haut se comprennent ?'),
    ('Étape 1 : choisis un rôle. Étape 2 : touche une ou deux réponses et écris un enjeu (ex. « nos élèves ne connaissent pas les organismes du quartier »).', 'Clair ?'),
    ('Étape 3 : tape « PPS » ou « français », puis touche un sigle. Ajoutes-en un deuxième.', 'Facile de trouver ?'),
    ('Étape 4 : choisis la tâche « Des micro-actions SMART » et remplis les deux champs.', 'Les champs demandés ont-ils du sens ?'),
    ('Étapes 5 et 6 : un format, puis une ou deux consignes (ouvrir ou restreindre).', 'Le vocabulaire te parle-t-il ?'),
    ('Touche « ✓ Copier mon invite », puis « Ouvrir Copilot ». Colle et envoie.', 'Ça a marché du premier coup ?'),
    ('Lis la réponse de Copilot.', 'Utile pour un participant ? Note sur 5 et pourquoi.'),
    ('Copilot a-t-il inventé quelque chose qui n’est pas dans le programme ?', ''),
    ('Combien de temps t’a pris le test, du début à la réponse ?', ''),
    ('Diapo 19 : touche « Voir un exemple », puis « Copier l’invite ». Colle dans Copilot.', 'La réponse montre-t-elle bien ce que chaque discipline peut apporter ?'),
]

SITE_T = [
    ('Onglet « Le programme de mon sigle »', 'L’exemple de Julie (FRA-2101) : clair ?'),
    ('Onglet « Ce qui est commun »', 'Les exemples FGA (frigo partagé, individualisé, co-enseignement) : parlants ?'),
    ('Onglet « 7 invites prêtes »', 'Une invite à retirer ou à ajouter ?'),
    ('Onglet « Ils l’ont fait »', 'On y ajoute tes projets d’incubateurs ?'),
    ('Onglet « Les documents »', 'Touche un bouton PDF et un bouton Word : téléchargent-ils le bon fichier ?'),
    ('Sur ton téléphone', 'Le site se lit-il bien ? (C’est ce que les participants verront avec le code QR.)'),
]

ANIM = [
    ('Le plan de match, heure par heure (guide, section 2)', 'Les grands blocs te conviennent-ils ?'),
    ('Qui parle (cadre de couleur : jaune = Francis, mauve = Isabelle, blanc = les deux)', 'La répartition des diapos te va ?'),
    ('Les minuteurs (réductibles en une ligne ou en sablier)', 'On les garde visibles, réduits ou cachés ?'),
    ('Les moments à l’écran : seulement 2, et au besoin (Copilot, diapos 14 et 19)', 'Est-ce que ça règle ton malaise avec le numérique ?'),
    ('La disposition : en îlot, des structures en petit cercle, seulement les consignes à l’écran', 'Il manque quelque chose ?'),
]

LOG = [
    ('Impression des cahiers (24 pages, livret 11 × 17, 40 exemplaires)', 'Qui imprime ? Pour quand ?'),
    ('Affiches 11 × 17 : mur d’enjeux, « Notre monde idéal », « Notre projet » (4 de chaque)', ''),
    ('Post-it de vote vert, jaune-beige et rose (3 par personne)', 'Qui les achète ?'),
    ('Étiquettes de nom avec le centre de services', ''),
    ('Plexiglas ou surfaces verticales, crayons effaçables', ''),
    ('Ordinateurs : les participants apportent le leur ?', ''),
]

def tbl(head, rows):
    th = ''.join(f'<th style="background:#5B2A86;color:#ffffff;text-align:left;padding:6px">{h}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td style="padding:6px;vertical-align:top">{c}</td>' for c in r) + '<td style="padding:6px;background:#FFF6D6"> </td></tr>' for r in rows)
    return f'<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">{"<tr>" + th + "</tr>"}{tr}</table>'

H = [f'''<html><head><meta charset="utf-8"></head><body style="font-family:Arial">
<h1>RÉVISION 2 · Francis · tout l’atelier</h1>
<p><b>Atelier « Rêver le monde de demain » · 13 novembre 2026.</b> Réponds dans la <b>colonne jaune</b>, quelques mots suffisent : « OK », « à changer : … », ou la nouvelle version du texte. Compte environ 1 h 30. Tu peux t’arrêter et revenir.</p>
<h2>Ce qui a changé depuis ta première révision</h2>
<ul>
<li>Beaucoup moins de texte à l’écran : des mots-clés, une idée par diapo. Le reste est dans les notes (touche N).</li>
<li>Les 4 verbes toujours visibles en haut : <b>Rêver · Cibler · Choisir · S’engager</b>.</li>
<li>« Premier pas » devient <b>« Mon élan »</b> : pas un devoir, une direction.</li>
<li>Ta définition de l’engagement (diapo 7), tes projets (diapo 23) et l’idée des décors (diapo 22) sont intégrés. La diapo 15 : Isabelle l’anime. « Mon élan » arrive à la fin (diapo 26).</li>
<li>Un nouveau cahier du participant, en livret, plus visuel. L’invite Copilot se fait étape par étape.</li>
</ul>
<h2>Les liens</h2>
<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
<tr><td><b>La présentation</b></td><td><a href="{PRES}">{PRES}</a><br>Chrome ou Edge. <b>F</b> : plein écran. Flèches : avancer. <b>P</b> : le plan. <b>N</b> : les notes.</td></tr>
<tr><td><b>Le cahier du participant (PDF)</b></td><td><a href="{CAHIER}">{CAHIER}</a></td></tr>
<tr><td><b>Le site des participants</b></td><td><a href="{SITE}">{SITE}</a></td></tr>
<tr><td><b>Le guide d’animation (Word)</b></td><td><a href="{GUIDE}">télécharger la dernière version</a></td></tr>
</table>
<h2>A · La présentation, diapo par diapo</h2>
<p>La colonne « Qui » dit qui anime. Une diapo où tu n’as rien à dire : écris « OK » ou laisse vide.</p>
''',
 tbl(['#', 'Diapo', 'Qui', 'Question', 'Ta réponse'], [[str(n), f'<b>{e(t)}</b><br><i>{e(k)}</i>', e(w), Q.get(n, GEN)] for n, k, t, w in S]),
 '<h2>B · Le cahier du participant, page par page</h2><p>Ouvre le PDF. Regarde surtout : est-ce que le participant comprend quoi faire, sans nous ?</p>',
 tbl(['Page', 'Contenu', 'Question', 'Ta réponse'], [[str(p), e(c), q or GEN] for p, c, q in CAH]),
 '<h2>C · Le test Copilot (15 minutes)</h2><p>Fais-le pour vrai, comme un participant. Sur ton ordinateur, avec ton compte Copilot du centre de services.</p>',
 tbl(['#', 'À faire', 'Question', 'Ta réponse'], [[str(i), a, q] for i, (a, q) in enumerate(COP, 1)]),
 '<h2>D · Le site des participants</h2>',
 tbl(['Où', 'Question', 'Ta réponse'], [[a, q] for a, q in SITE_T]),
 '<h2>E · L’animation</h2>',
 tbl(['Sujet', 'Question', 'Ta réponse'], [[a, q] for a, q in ANIM]),
 '<h2>F · La logistique</h2>',
 tbl(['Quoi', 'Question', 'Ta réponse'], [[a, q or 'C’est réglé ?'] for a, q in LOG]),
 '''<h2>G · Pour finir</h2>''',
 tbl(['Question', 'Ta réponse'], [['Ce que tu préfères dans l’atelier, maintenant ?'], ['Ce qui te rend encore mal à l’aise ?'], ['Ce que tu enlèverais si on manque de temps ?'], ['On se parle quand ? (mercredi ou jeudi soir ?)']]),
 '</body></html>']
open('revision_francis.html', 'w', encoding='utf8').write(''.join(H))
print('ok', len(''.join(H)))
