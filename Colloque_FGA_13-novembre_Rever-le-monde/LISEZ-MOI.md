# Rêver le monde de demain… De l’idéation à l’action

Atelier du colloque régional FGA, le 13 novembre 2026, au CFGA De Jonquière. Engagement citoyen et autodétermination en FGA.
Coanimé par Isabelle Pedneault (CP, CFGA De Jonquière) et Francis Laroche (éducateur en citoyenneté mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean (CSI)). Durée : 90 minutes, en 4 phases (30, 30, 20 et 10 minutes).

## Les fichiers

| Fichier | Pour qui | Contenu |
|---|---|---|
| `01_Guide-animation_Isabelle-Francis.docx` | Les deux animateurs | Intentions, déroulé minuté, rôles, plans B, script phase par phase, matériel, suites |
| `02_Cahier-du-participant.docx` | Chaque participant | Le cahier qui suit l’atelier, avec des espaces pour noter à chaque phase et la fiche « Mon premier pas » |
| `03_Aide-memoire-Copilot.docx` | Chaque participant | La formule rôle, contexte, tâche, contraintes, 5 invites prêtes à copier, les balises |
| `04_Annexe_Objectivation.docx` | Chaque participant | Définition, la maison à trois étages, la banque de questions, 7 formats, un gabarit de carnet de bord |
| `05_Materiel-a-imprimer.docx` | Les animateurs | Affiche du mur d’enjeux, cartes-citations, fiches « Mon premier pas », jetons, cartons de signaux |
| `presentation/index.html` | La salle | Présentation interactive de 20 diapos, en 3D, qui fonctionne sans Internet |

## La présentation

Ouvrir `presentation/index.html` dans Chrome ou Edge.

La présentation est un voyage dans un seul monde 3D en cel-shading : un sol de papier tramé, un sentier mauve et 11 stations (globe des enjeux, village 2036, triade, 4 sphères, pyramide, nom et verbe, escalier des 5 marches, trois portes, jetons, premier pas, maison à trois étages). À chaque diapo pertinente, la caméra s’envole vers la station suivante ; sur les autres, elle revient à une vue aérienne du parcours. Le contenu est posé sur des cartes papier à gauche.

- **Navigation :** flèches du clavier ou barre d’espace. Sur une tablette, glisser vers la gauche ou la droite.
- **P** ouvre le mode présentateur dans une 2e fenêtre : notes, qui anime, diapo suivante, chrono, boutons pour avancer. Gardez-la sur l’écran du portable (Windows + P, « Étendre ») ; la salle ne voit que la projection.
- **N** affiche les notes sur l’écran projeté : la salle les voit aussi.
- **T** lance un minuteur de 5 minutes. Plusieurs diapos ont aussi leurs propres boutons de minuteur.
- **F** passe en plein écran.

Ce qui est interactif :

- **Diapo 2 :** les présentations d’Isabelle et de Francis (ma devise, mon outil préféré, si c’était à refaire, mon conseil numéro 1). On clique sur un champ pour l’écrire.
- **Diapo 3 :** le globe 3D des enjeux. On tape un enjeu et il s’accroche au globe.
- **Diapo 5 :** le tri des citations, en glisser-déposer.
- **Diapo 9 :** les 4 sphères en 3D. On clique sur une planète pour voir sa définition.
- **Diapo 10 :** la pyramide 3D. On vote pour l’étage de sa dernière formation.
- **Diapo 11 :** le détecteur « résultat ou action ? », et des cartes qu’on retourne.
- **Diapo 12 :** les marches de l’Incubateur, qu’on révèle une à une.
- **Diapo 13 :** les scénarios, à filtrer par matière.
- **Diapo 14 :** l’espace pour glisser la vidéo des élèves (fichier local).
- **Diapo 16 :** le générateur d’invites Copilot.
- **Diapo 17 :** les piles de jetons 3D du vote.
- **Diapo 20 :** le code QR des ressources, dont on peut changer l’adresse.

Ce que la salle saisit (enjeux, votes, tri) reste sur l’ordinateur qui présente. Les boutons « Vider » et « Remettre à zéro » effacent ces données entre deux séances.

## Les exemples concrets

Les mots d’élèves et de parents viennent de la classe d’Isabelle, du temps où elle enseignait au primaire. Seuls les extraits qui parlent de projets, de confiance, de forces et d’appartenance sont utilisés, sans nom, sans prénom et sans signature.

## Les choix graphiques

Le style est celui d’un carnet d’atelier en cel-shading : encre noire en trait (jamais en aplat), mauve d’imprimerie, jaune or et papier crème. Les titres sont en Anton, une police intégrée aux fichiers Word ; les annotations sont en Caveat. Le manifeste visuel est dans `_sources/philosophie_design.md`.

La pyramide de rétention est présentée comme un repère, du passif à l’actif, sans pourcentages : les chiffres qui circulent ne viennent d’aucune étude solide.

## Changer une image

Les illustrations vedettes sont dans `_sources/img/` : `nb_mur.jpg`, `nb_compost.jpg`, `nb_bulletin.jpg` (la rencontre de suivi animée par l’élève) et `nb_maison.jpg`. Remplacez un fichier en gardant le même nom, puis régénérez les documents depuis `_sources/` :

```bash
node doc01_guide.js ../01_Guide-animation_Isabelle-Francis.docx
```

```bash
python3 build_pres.py . ../presentation/index.html /tmp/presentation_web.html
```

## Les prompts d’images

Ces prompts décrivent la technique (cel-shading BD) sans nommer d’œuvre existante, et aucun ne représente de vrai élève.

1. **Mur d’enjeux (16:9).** Cel-shaded comic illustration, thick black ink outlines, cross-hatching shadows and halftone dot textures, limited palette: matte black, deep purple #5B2A86, golden yellow #F2C230, cream #FBF8EF. A diverse group of young adults (16 to 25) in an adult education centre in Quebec, around a table covered with yellow sticky notes; one pins a note onto a wall-sized world map. Through a large window, a snowy boreal landscape with a river. Hopeful, energetic, serious. No text.
2. **De l’idée à l’action (16:9).** Same style and palette. Young adult learners installing compost bins next to their centre in a Quebec town, one with a clipboard, one measuring with a tape. Dynamic diagonal composition, sense of pride. No text.
3. **La rencontre de suivi animée par l’élève (4:3).** Same style and palette. A young adult learner confidently presents a portfolio and a laptop to a teacher who listens and takes notes: the learner leads. Warm light, plants, sticky notes. No text.
4. **La maison à trois étages (1:1).** Same style and palette. Cutaway of a three-floor house shaped like a human head in profile: ground floor with a bed and a meal, second floor with a glowing heart and friends, top floor with tidy drawers full of glowing ideas. A small figure climbs the stairs. No text.

## Sources

- Deci, E. L. et Ryan, R. M. (2000). The « what » and « why » of goal pursuits. *Psychological Inquiry*, 11(4), 227-268.
- Wehmeyer, M. L. (1999). A functional model of self-determination. *Focus on Autism and Other Developmental Disabilities*, 14(1), 53-61.
- Fredricks, J. A., Blumenfeld, P. C. et Paris, A. H. (2004). School engagement. *Review of Educational Research*, 74(1), 59-109.
- Pedneault, I. *L’objectivation*, fiche de classe.
- Documents de préparation de l’atelier : offre de service du Centre de solidarité internationale du Saguenay–Lac-Saint-Jean (CSI), pistes de clarification, plans de synthèse 1.1 à 1.4.
