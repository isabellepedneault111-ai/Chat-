"""Cahier papier « Détectives de la pub » (PPS-Z128 / Z127) : publicité et sollicitation. Style sobre, économe en encre.
Usage : python3 cahier_pub.py   (réutilise le style de la trousse Z101)"""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
Z101 = os.path.join(os.path.dirname(RACINE), "PPS_Z101_Projection-avenir_Trousse", "_sources")
sys.path.insert(0, Z101)
import style
from style import doc, ico, CAT
from blocs import L, CB, OPTS, SCALE
sys.path.insert(0, ICI)
from renard import renard, tete

style.COURS = "PPS-Z128-2"
style.TITRE_COURS = "Budget et consommation"
CAT["pub"] = dict(nom="Publicité et sollicitation", court="Détectives de la pub", c="#B45318", cl="#FFF1E7", crit="")
CAT["sol"] = dict(nom="Publicité et sollicitation", court="Détectives de la pub", c="#0F766E", cl="#E3F4F1", crit="")
D = os.path.join(RACINE, "Lecons", "Cahier_Publicite-et-sollicitation")
CORR = os.path.join(RACINE, "99_ENSEIGNANTE_SEULEMENT", "Corriges")
os.makedirs(D, exist_ok=True); os.makedirs(CORR, exist_ok=True)

RUSES = [("Tout le monde l'a", "« Tous tes amis l'ont déjà ! »", "La pub me fait croire que je serai mis de côté si je ne l'achète pas."),
         ("Vite, vite !", "« Aujourd'hui seulement ! Il en reste 3 ! »", "La pub me presse pour que je n'aie pas le temps de réfléchir."),
         ("La vedette", "« Max, le champion, l'adore ! »", "Une personne connue est payée pour dire qu'elle aime le produit."),
         ("Les petits caractères", "« GRATUIT* »", "L'étoile cache le vrai prix ou une condition, écrite tout petit."),
         ("Le prix magique", "« 9,99 $ »", "9,99 $ semble moins cher que 10 $. Mais c'est presque pareil."),
         ("Tu seras plus heureux", "« Deviens beau, fort, populaire ! »", "La pub me promet du bonheur. Elle crée un faux besoin."),
         ("Payez plus tard", "« 0 $ aujourd'hui ! »", "Je paie quand même, souvent plus cher, avec les intérêts."),
         ("Le cadeau piège", "« Tu as gagné ! Clique ici ! »", "On veut mes informations ou mon argent : c'est une arnaque.")]
PUBS = [dict(nom="Les espadrilles SUPER-SOUPLE", slogan="Les espadrilles des CHAMPIONS. Le champion Max Vitesse les porte ! Tous les jeunes en ont déjà.", prix="89,99 $", petit="Taxes en sus. Max Vitesse a été payé pour cette publicité.",
             q="Combien vais-je payer à la caisse, avec les taxes ?", ruses=[1, 3, 5], rep="89,99 $ ≈ 90 $ ; taxes ≈ 15 % ≈ 13,50 $ ; environ 103,50 $ (exact : 103,47 $)."),
        dict(nom="La crème GLOW+", slogan="Deviens BEAU en 3 jours ! Plus d'amis, plus de confiance ! IL EN RESTE 3 !", prix="49,99 $", petit="Résultats non garantis. Les photos sont retouchées. Taxes en sus.",
             q="Est-ce un besoin ? Combien avec les taxes ?", ruses=[6, 2, 5, 4], rep="Un désir. 49,99 $ ≈ 50 $ + 7,50 $ = environ 57,50 $ (exact : 57,48 $). L'effet n'est pas garanti."),
        dict(nom="Le cellulaire X12 « gratuit »", slogan="GRATUIT* Le cellulaire le plus puissant ! Offre de la fin de semaine seulement.", prix="0 $*", petit="*Avec forfait de 65 $/mois pendant 24 mois. Frais d'activation : 50 $. Taxes en sus.",
             q="Combien vais-je payer en 2 ans ?", ruses=[4, 2], rep="65 $ × 24 = 1 560 $ + 50 $ = environ 1 610 $ (plus les taxes). Pas gratuit du tout."),
        dict(nom="Le divan NUAGE", slogan="Dormez comme un bébé. Achetez aujourd'hui, PAYEZ DANS 12 MOIS ! 0 $ AUJOURD'HUI", prix="999 $", petit="Si le montant n'est pas payé en entier après 12 mois : intérêts de 29,9 % sur tout le montant.",
             q="Que se passe-t-il si je ne paie pas tout en 12 mois ?", ruses=[7, 4, 2], rep="999 $ ≈ 1 000 $ ; 30 % ≈ 300 $ d'intérêts ; environ 1 300 $."),
        dict(nom="L'abonnement GALAXIA PASS", slogan="Rejoins 2 MILLIONS de joueurs ! ESSAI GRATUIT de 7 jours. Inscris-toi en 1 clic !", prix="GRATUIT*", petit="*Puis 14,99 $/mois. Renouvellement automatique. Annulation par téléphone seulement.",
             q="Combien ça coûte en 1 an si j'oublie d'annuler ?", ruses=[4, 1, 2], rep="14,99 $ ≈ 15 $ × 12 = environ 180 $ par année (exact : 179,88 $)."),
        dict(nom="Le texto « Tu as gagné ! »", slogan="FÉLICITATIONS ! Tu as gagné un iPhone. Clique sur le lien et entre ta carte de crédit pour payer les frais de livraison (2 $).", prix="2 $ ?", petit="Message reçu d'un numéro inconnu.",
             q="Est-ce que je donne ma carte de crédit ? Que dois-je faire ?", ruses=[8, 2], rep="Non. C'est une arnaque. Je ne clique pas, je ne réponds pas, je supprime et j'en parle à quelqu'un de confiance.")]
SOLLIC = [("Au téléphone", "« Bonjour ! Vous avez gagné une croisière. Il suffit de payer les taxes aujourd'hui. »"),
          ("À la porte", "« Je fais le tour du quartier. Votre chauffe-eau est dangereux, je peux le changer aujourd'hui, signez ici. »"),
          ("Par texto ou courriel", "« Votre colis est bloqué. Payez 1,99 $ ici pour la livraison. »"),
          ("Sur les réseaux sociaux", "« Une influenceuse que j'aime dit : utilisez mon code pour 20 % de rabais, seulement ce soir ! »")]
NOM = '<div class="g2" style="margin-bottom:6px"><div class="small"><b>Prénom :</b> ______________________</div><div class="small"><b>Date :</b> ____________</div></div>'


def truc(texte):
    return f'<div style="display:flex;gap:10px;align-items:center;border:1.5px dashed #D9844A;border-radius:14px;padding:6px 12px;margin-top:8px">{tete(46)}<div><span class="tag" style="color:#B45318">Le truc du renard</span><div class="small">{texte}</div></div></div>'


def pg(cat, titre, corps, kick, sous="", n=1, tot=12, etiq="Cahier de l'élève"):
    return style.page(cat, titre, corps, kick=kick, sous=sous, etiquette=etiq, n=n, tot=tot)


def couverture(tot):
    parts = [("1", "La pub est partout"), ("2", "Les 8 ruses de la pub"), ("3", "Enquêtes de détective"), ("4", "La sollicitation"), ("5", "Je résiste et je crée"), ("6", "Mon bilan")]
    corps = f'''<div style="margin-top:.9in"><div class="kick" style="color:#B45318;font-size:10pt;letter-spacing:.2em;text-transform:uppercase;font-weight:800">PPS-Z128 · Cahier de l'élève</div>
<div style="font-size:50pt;font-weight:900;letter-spacing:-.035em;line-height:.95;margin-top:10px;color:#0E1330">Détectives<br>de la pub</div>
<div class="lede" style="margin-top:14px;max-width:4.2in">La publicité et la sollicitation : repérer les ruses, calculer le vrai prix, savoir dire non.</div></div>
<div style="position:absolute;right:.6in;bottom:.75in">{renard(330)}</div>
<div class="card" style="margin-top:.5in;max-width:4.6in"><div class="small"><b>Mon nom :</b> ____________________________________</div><div class="small mt"><b>Mon groupe :</b> ______________</div></div>
<div class="g3" style="margin-top:.55in">{"".join(f'<div style="border-top:3px solid #B45318;padding-top:8px"><div style="font-size:22pt;font-weight:900;color:transparent;-webkit-text-stroke:1.2px #B45318;line-height:1">0{n}</div><div style="font-weight:800;margin-top:4px">{t}</div></div>' for n, t in parts)}</div>'''
    return pg("pub", "", corps, kick="", n=1, tot=tot)


def p_partout(n, tot):
    lieux = ["Mon téléphone", "La télé", "YouTube", "Les réseaux sociaux", "Les jeux vidéo", "L'autobus et la rue", "Le magasin", "Le courrier et les circulaires", "La radio", "Les vêtements (logos)"]
    corps = f'''{NOM}
<p class="lede">Une <b>publicité</b>, c'est un message payé par une entreprise pour <b>me donner envie d'acheter</b>.</p>
<div class="ex mt"><div class="h"><span class="n">1</span><b>Où est-ce que je vois des pubs ?</b><span class="tag">Je coche</span></div>{OPTS(lieux)}
<p class="mt">Ce matin, avant d'arriver au centre, j'ai vu environ ______ pubs.</p></div>
<div class="ex"><div class="h"><span class="n">2</span><b>À quoi sert une pub ?</b><span class="tag">Je choisis</span></div>
{OPTS(["À m'informer gratuitement", "À me faire acheter", "À me divertir"])}<div class="logic">{ico("logique", 16)}<span>La pub peut informer ou divertir, mais son vrai but est toujours de <b>vendre</b>.</span></div></div>
<div class="ex"><div class="h"><span class="n">3</span><b>Besoin ou désir ?</b><span class="tag">Rappel</span></div>
<div class="g2"><div class="card t"><b>Un besoin</b><p class="small">Je ne peux pas m'en passer : manger, me loger, me soigner, me déplacer.</p></div><div class="card t" style="--cl:#FFF1E7"><b>Un désir</b><p class="small">Ce serait le fun, mais je peux vivre sans.</p></div></div>
<p class="mt">Une pub qui m'a donné envie d'un <b>désir</b> :</p>{L(1)}</div>
{truc("Quand une pub me parle, je me demande : qui a payé pour ce message, et qu'est-ce qu'il veut que je fasse ?")}'''
    return pg("pub", "La pub est partout", corps, kick="Partie 1", sous="Combien de pubs je vois dans une journée ?", n=n, tot=tot)


def p_musee(n, tot):
    corps = f'''<p class="lede">Je choisis <b>une vraie pub</b> : une circulaire, une page de revue, une vidéo, une pub sur mon téléphone.</p>
<table class="t grid mt"><tr><th style="width:36%">Question</th><th>Ma réponse</th></tr>
<tr><td>Quel produit ou service ?</td><td style="height:42px"></td></tr>
<tr><td>Pour qui est cette pub ? (jeunes, parents, sportifs…)</td><td style="height:42px"></td></tr>
<tr><td>Ce que je vois et j'entends (couleurs, musique, vedette, décor)</td><td style="height:58px"></td></tr>
<tr><td>Ce que la pub me <b>promet</b></td><td style="height:48px"></td></tr>
<tr><td>Ce que la pub <b>ne dit pas</b> (prix, taxes, conditions)</td><td style="height:48px"></td></tr>
<tr><td>Est-ce un besoin ou un désir ?</td><td>{OPTS(["Besoin", "Désir"])}</td></tr></table>
<div class="card box mt" style="flex:1;min-height:2.2in"><span class="tag">Je colle ma pub ou je la dessine ici</span></div>'''
    return pg("pub", "Le musée des pubs", corps, kick="Partie 1", sous="J'observe une pub comme un détective.", n=n, tot=tot)


def p_ruses(n, tot):
    cartes = "".join(f'<div class="card" style="padding:10px 12px;display:grid;grid-template-columns:42px 1fr;gap:10px"><div style="font-size:26pt;font-weight:900;line-height:1;color:transparent;-webkit-text-stroke:1.3px #B45318">{i + 1}</div><div><b>{t}</b><div class="small" style="color:#B45318;font-weight:700">{ex}</div><div class="small">{d}</div></div></div>' for i, (t, ex, d) in enumerate(RUSES))
    corps = f'''<p class="lede">Les publicitaires utilisent des <b>ruses</b> pour me donner envie. Quand je les connais, je les repère.</p>
<div class="g2 mt" style="gap:9px">{cartes}</div>
{truc("Une seule ruse suffit pour me faire acheter trop vite. J'en cherche toujours au moins deux.")}
<div class="card k mt"><h2>{ico("loupe")}Mon truc pour m'en souvenir</h2><p class="small">La ruse que je trouve la plus sournoise, c'est la n° ____ parce que…</p>{L(1)}</div>'''
    return pg("pub", "Les 8 ruses de la pub", corps, kick="Partie 2", sous="Ma fiche de référence. Je la garde pour les enquêtes.", n=n, tot=tot)


def enquete(i, p):
    return f'''<div class="ex"><div class="h"><span class="n">{i}</span><b>{p["nom"]}</b><span class="tag">Prix affiché : {p["prix"]}</span></div>
<div class="g21"><div><div class="quote">{p["slogan"]}</div><div class="xs" style="margin-top:4px">En petits caractères : {p["petit"]}</div></div>
<div><span class="tag">Les ruses que je trouve</span><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">{"".join(f'<span style="width:22px;height:22px;border:1.4px solid #8A90A6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;font-weight:800">{k}</span>' for k in range(1, 9))}</div></div></div>
<p class="small" style="margin-top:6px"><b>{p["q"]}</b></p>{L(2)}</div>'''


def p_enquetes(a, b, n, tot):
    corps = f'''<p class="small" style="margin-bottom:8px">Fausses publicités créées pour la classe. J'encercle les numéros des ruses. Je réponds à la question, avec un calcul s'il le faut. <b>Taxes : environ 15 %</b>.</p>{truc("Je lis toujours les petits caractères en premier : c'est là que se cache le vrai prix.") if a == 0 else ""}
{"".join(enquete(i + 1, PUBS[i]) for i in range(a, b))}'''
    return pg("pub", "Enquêtes de détective" if a == 0 else "", corps, kick="Partie 3", sous="Six fausses pubs à analyser, seul ou en équipe." if a == 0 else "", n=n, tot=tot)


def p_sollic(n, tot):
    cas = "".join(f'<tr><td style="width:24%"><b>{o}</b></td><td class="small">{t}</td><td style="width:26%">{OPTS(["Arnaque probable", "À vérifier"])}</td></tr>' for o, t in SOLLIC)
    corps = f'''<p class="lede">La <b>sollicitation</b>, c'est quand quelqu'un vient me chercher pour me vendre quelque chose : au téléphone, à la porte, par texto, sur les réseaux.</p>
<table class="t grid mt"><tr><th>Où</th><th>Ce qu'on me dit</th><th>Mon avis</th></tr>{cas}</table>
<div class="g2 mt"><div class="card"><h2>{ico("attention")}Les signes d'alerte</h2><ul class="ticks"><li>On me presse : « aujourd'hui seulement ».</li><li>On me demande ma carte, mon NAS ou un mot de passe.</li><li>J'ai « gagné » à un concours où je ne me suis pas inscrit.</li><li>On veut que je signe tout de suite.</li><li>C'est trop beau pour être vrai.</li></ul></div>
<div class="card t" style="--cl:#FFF1E7"><h2>{ico("ok")}Mes 3 réflexes</h2><ol class="steps"><li><span><b>Je prends mon temps.</b> Une bonne offre sera encore là demain.</span></li><li><span><b>Je ne donne jamais</b> ma carte, mon NAS ou mes mots de passe.</span></li><li><span><b>J'en parle</b> à une personne de confiance avant de dire oui.</span></li></ol></div></div>
{truc("Si c'est trop beau pour être vrai, c'est probablement faux.")}'''
    return pg("sol", "La sollicitation", corps, kick="Partie 4", sous="Quand on vient me chercher pour me vendre quelque chose.", n=n, tot=tot)


def p_refus(n, tot):
    corps = f'''<div class="card d"><h2>{ico("drapeau")}Ma phrase de refus</h2><p class="lede" style="font-size:14pt">« Non merci, je ne suis pas intéressé. Bonne journée. »</p><p class="small">Je la dis calmement. Je n'ai pas besoin de me justifier. Je peux raccrocher ou fermer la porte.</p></div>
<p class="mt"><b>Ma phrase à moi</b>, avec mes mots :</p>{L(1)}
<h2 class="mt2">{ico("groupe")}Jeu de rôle en duo</h2><p class="small">Une personne joue le vendeur, l'autre résiste. Ensuite, on change.</p>
<div class="g2 mt"><div class="ex"><div class="h"><span class="n">A</span><b>Au téléphone</b></div><div class="quote small">« Félicitations ! Vous avez gagné une croisière. Il faut juste payer 99 $ de taxes avec votre carte de crédit, aujourd'hui. »</div><p class="small mt">Ce que j'ai répondu :</p>{L(2)}<p class="small">Les ruses utilisées : n° ____ et n° ____</p></div>
<div class="ex"><div class="h"><span class="n">B</span><b>À la porte</b></div><div class="quote small">« Votre chauffe-eau est dangereux. Je peux le remplacer aujourd'hui. Signez ici, vous paierez dans un an. »</div><p class="small mt">Ce que j'ai répondu :</p>{L(2)}<p class="small">Les ruses utilisées : n° ____ et n° ____</p></div></div>
<div class="ex"><div class="h"><span class="n">?</span><b>Si j'ai déjà dit oui par erreur</b></div><p class="small">Au Québec, pour un contrat signé à la maison avec un vendeur itinérant, j'ai <b>10 jours</b> pour annuler. Je peux demander de l'aide à l'Office de la protection du consommateur.</p>
<p class="small">Une personne à qui j'en parlerais :</p>{L(1)}</div>'''
    return pg("sol", "Je sais dire non", corps, kick="Partie 4", sous="Je pratique mon refus avant d'en avoir besoin.", n=n, tot=tot)


def p_creer(n, tot):
    corps = f'''<p class="lede">À mon tour : je crée une <b>pub piège</b> pour un produit inventé. Les autres détectives devront trouver mes ruses.</p>
<table class="t grid mt"><tr><th style="width:34%">Ma pub</th><th>Mes idées</th></tr>
<tr><td>Nom du produit</td><td style="height:34px"></td></tr><tr><td>Pour qui ?</td><td style="height:34px"></td></tr>
<tr><td>Mon slogan</td><td style="height:40px"></td></tr><tr><td>Le prix affiché</td><td style="height:34px"></td></tr>
<tr><td>Mes petits caractères (le vrai prix ou la condition cachée)</td><td style="height:48px"></td></tr>
<tr><td>Mes ruses (au moins 3)</td><td>{"".join(f'<span class="opt"><span class="cb"></span>{k}</span>' for k in range(1, 9))}</td></tr></table>
<div class="card box mt" style="flex:1;min-height:2.6in"><span class="tag">Le croquis de ma pub</span></div>
{truc("Ma pub doit avoir l'air honnête au premier coup d'œil. Le piège est caché dans les détails.")}
<p class="small mt">Le vrai prix, avec les taxes (environ 15 %) : __________ $ &nbsp;·&nbsp; Ruses trouvées par les autres : ____ sur ____</p>'''
    return pg("pub", "Je crée ma pub piège", corps, kick="Partie 5", sous="Le meilleur moyen de comprendre une ruse : l'utiliser soi-même.", n=n, tot=tot)


def p_bouclier(n, tot):
    corps = f'''<div class="card d"><h2>{ico("ok")}Mon bouclier : 3 questions avant d'acheter</h2><ol class="steps"><li><span><b>Besoin ou désir ?</b> Est-ce que je peux vivre sans ?</span></li><li><span><b>Combien ça coûte VRAIMENT ?</b> Taxes, frais, intérêts, abonnement.</span></li><li><span><b>Est-ce que je peux attendre 24 heures ?</b> Si l'envie passe, c'était la pub.</span></li></ol></div>
<div class="ex mt"><div class="h"><span class="n">1</span><b>Le vrai prix</b><span class="tag">J'estime</span></div>
<table class="t grid"><tr><th>Prix affiché</th><th>Arrondi</th><th>Taxes (≈ 15 %)</th><th>Vrai prix environ</th></tr>
<tr><td>19,99 $</td><td></td><td></td><td></td></tr><tr><td>39,95 $</td><td></td><td></td><td></td></tr><tr><td>149,99 $</td><td></td><td></td><td></td></tr></table>
{truc("Pour les taxes : 10 % de 40 $, c'est 4 $. La moitié de 4 $, c'est 2 $. 4 $ + 2 $ = environ 6 $ de taxes.")}</div>
<div class="ex"><div class="h"><span class="n">2</span><b>J'applique mon bouclier</b></div><p class="small">Une chose que j'ai envie d'acheter en ce moment :</p>{L(1)}
<p class="small">Besoin ou désir ? ____________ &nbsp; Vrai prix : ________ $ &nbsp; Je peux attendre ? {OPTS(["Oui", "Non"])}</p><p class="small">Ma décision :</p>{L(1)}</div>'''
    return pg("pub", "Mon bouclier", corps, kick="Partie 5", sous="Ce que je fais avant chaque achat.", n=n, tot=tot)


def p_bilan(n, tot):
    items = ["Je sais à quoi sert une pub.", "Je repère au moins 4 ruses dans une pub.", "Je fais la différence entre un besoin et un faux besoin créé par la pub.",
             "J'estime le vrai prix avec les taxes et les frais.", "Je reconnais une sollicitation ou une arnaque.", "Je sais dire non clairement."]
    rows = "".join(f'<tr><td>{t}</td><td style="width:42%"><span class="opt" style="color:#127A45"><span class="dot" style="margin-right:4px"></span>Oui</span><span class="opt" style="color:#946200"><span class="dot" style="margin-right:4px"></span>Presque</span><span class="opt" style="color:#B3341B"><span class="dot" style="margin-right:4px"></span>Pas encore</span></td></tr>' for t in items)
    corps = f'''<p class="lede">Je colorie le rond qui me ressemble. <b>Pas de note</b> : c'est pour savoir où j'en suis.</p>
<table class="t mt">{rows}</table>
<div class="g2 mt2"><div class="card"><h2>{ico("idee")}Aujourd'hui, j'ai appris…</h2>{L(3)}</div><div class="card"><h2>{ico("fusee")}La prochaine fois que je vois une pub, je vais…</h2>{L(3)}</div></div>
<div class="card k mt2"><h2>{ico("crayon")}Mon billet de sortie</h2><p class="small">La ruse que je vais le plus surveiller : n° ____ &nbsp; Une personne à qui je peux demander conseil avant un gros achat :</p>{L(1)}</div>
<div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:10px;margin-top:auto"><div class="quote small" style="max-width:3in">Bravo, détective ! Tu sais maintenant repérer les ruses et dire non.</div>{renard(120, loupe=False)}</div>'''
    return pg("pub", "Mon bilan", corps, kick="Partie 6", sous="Ce que je sais faire maintenant.", n=n, tot=tot)


def corrige():
    lignes = "".join(f'<tr><td><b>{i + 1}. {p["nom"]}</b></td><td>{", ".join(str(r) for r in p["ruses"])}</td><td>{p["rep"]}</td></tr>' for i, p in enumerate(PUBS))
    corps = f'''<div class="dense"><h2>{ico("loupe")}Enquêtes de détective (partie 3)</h2><table class="t"><tr><th style="width:26%">Pub</th><th style="width:12%">Ruses</th><th>Réponse attendue</th></tr>{lignes}</table>
<p class="xs mt">Accepter d'autres ruses si l'élève justifie (par exemple « Vite, vite » pour une offre de fin de semaine).</p>
<h2 class="mt2">{ico("attention")}La sollicitation (partie 4)</h2><table class="t"><tr><th style="width:26%">Situation</th><th>Réponse attendue</th></tr>
<tr><td>Téléphone : croisière gagnée</td><td>Arnaque probable : concours non inscrit, paiement immédiat, carte demandée (ruses 8, 2).</td></tr>
<tr><td>Porte : chauffe-eau</td><td>À vérifier : peur, pression, payer plus tard (ruses 2, 7). Ne rien signer ; 10 jours pour annuler un contrat de vendeur itinérant.</td></tr>
<tr><td>Texto : colis bloqué</td><td>Arnaque probable (hameçonnage) : ne pas cliquer, supprimer.</td></tr>
<tr><td>Réseaux : code d'influenceuse</td><td>À vérifier : la vedette est payée (3), urgence (2). Se demander : besoin ou désir ?</td></tr></table>
<h2 class="mt2">{ico("ok")}Mon bouclier (partie 5)</h2><table class="t"><tr><th>Prix affiché</th><th>Arrondi</th><th>Taxes ≈ 15 %</th><th>Vrai prix environ</th><th>Exact (14,975 %)</th></tr>
<tr><td>19,99 $</td><td>20 $</td><td>3 $</td><td>23 $</td><td>22,98 $</td></tr><tr><td>39,95 $</td><td>40 $</td><td>6 $</td><td>46 $</td><td>45,93 $</td></tr><tr><td>149,99 $</td><td>150 $</td><td>22,50 $</td><td>172,50 $</td><td>172,45 $</td></tr></table>
<div class="card t mt2"><h2>{ico("logique")}Liens avec le programme</h2><p>Influence de la publicité sur ses choix (création de faux besoins, incitation à la consommation). Réactions en cas de sollicitation (refus, consentement, demande de conseils). Risques de la publicité et de la sollicitation.</p></div></div>'''
    return style.page("pub", "Corrigé", corps, kick="Enseignante seulement", sous="Détectives de la pub · cahier papier", etiquette="Corrigé")


def construire():
    fns = [couverture, p_partout, p_musee, p_ruses, None, None, p_sollic, p_refus, p_creer, p_bouclier, p_bilan]
    tot = 11
    pages = [couverture(tot), p_partout(2, tot), p_musee(3, tot), p_ruses(4, tot), p_enquetes(0, 3, 5, tot), p_enquetes(3, 6, 6, tot),
             p_sollic(7, tot), p_refus(8, tot), p_creer(9, tot), p_bouclier(10, tot), p_bilan(11, tot)]
    jobs = [("pub_cahier", doc("Détectives de la pub · cahier", pages), os.path.join(D, "Cahier-eleve_Detectives-de-la-pub_complet.pdf")),
            ("pub_corr", doc("Détectives de la pub · corrigé", [corrige()]), os.path.join(CORR, "Pub_Corrige_Cahier-Detectives-de-la-pub.pdf"))]
    tmp = "/tmp/claude-0/pps/pubhtml"; os.makedirs(tmp, exist_ok=True); a = []
    for nom, html, out in jobs:
        h = os.path.join(tmp, nom + ".html"); open(h, "w").write(html); a += [h, out]
    subprocess.run(["node", os.path.join(Z101, "rendre.js")] + a, check=True)


if __name__ == "__main__":
    construire()
