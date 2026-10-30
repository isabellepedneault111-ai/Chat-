# Trousse Teams · PPS-Z101-3 Projection vers l'avenir

Elle a la même structure que la trousse Budget et consommation : **un dossier = une section OneNote, un fichier = une page**. On la dépose telle quelle dans Teams ; le guide est dans `00_COMMENCER-ICI`. Aucun nom d'élève.

## Par où commencer
1. `00_COMMENCER-ICI/1_Dossier-maitre_Enseignante.pdf` (9 pages) :
   - le cours en une page ;
   - l'organisation chez nous (horaire, groupes A et B, ateliers) ;
   - la séquence ;
   - les pistes d'observation bloc par bloc ;
   - l'évaluation ;
   - 10 principes pour enseigner en PPS.
2. `00_COMMENCER-ICI/2_Guide-Teams-OneNote.pdf` : déposer la trousse en 15 minutes.

## Leçon clé en main : le premier mardi
`Lecons/Premier-mardi_Accueil-et-ateliers/` contient la journée en 3 périodes :
1. Se connaître, tout le groupe ensemble.
2. Bâtir nos ateliers, groupes A et B ensemble.
3. Mettre en commun.

| Fichier | Usage |
|---|---|
| `0_Plan-du-premier-mardi_Enseignante.pdf` | Déroulement minuté, local coocooning, outils d'animation participative |
| `1_P1_Ma-carte-de-joueur.pdf` | 4 cartes par feuille : stats, pouvoir spécial |
| `2_P1_Bingo-humain.pdf` | « Trouve quelqu'un qui… », aucune question sensible |
| `3_P1_Cartes-de-questions.pdf` | 24 cartes en 3 paquets, on peut passer son tour |
| `4_P2_Fiches-d-equipe_plan-de-match-par-atelier.pdf` | Une fiche par atelier : rôles, tâches (garder, changer, enlever), qui fait quoi, règle d'or |
| `5_P2_Carnet-de-passation-de-quart.pdf` | Le relais entre A et B : fait, à faire, ce qui manque |
| `6_P3_Entente-de-passation_affiche.pdf` | Règles communes votées avec les doigts |
| `7_P3_Mon-cercle-d-influence.pdf` | Retour réflexif individuel |
| `8_P3_Mon-billet-de-sortie.pdf` | 3 mots, 2 choses, 1 question |
| `9_En-reserve_...pdf` | Défi de la tour, Deux vérités un mensonge, Si j'étais… |

Au TNI, la boîte à animation (météo, plutôt ceci ou cela, la roue, chrono, vote) est à l'adresse https://pps-z101-avenir.netlify.app/brise-glace.html

## Les blocs (cahier de l'élève)

| Dossier | Savoirs | Fichiers |
|---|---|---|
| `Bloc-C0` Mon carnet de route | Point de départ | Ma mission · Feuille de notes · Je m'exerce |
| `Bloc-C1` Qui je suis | Traits de personnalité, habiletés | idem |
| `Bloc-C2` Mon parcours | Expériences, facteurs de délimitation | idem |
| `Bloc-C3` Ce qui me fait avancer | Motivation, habitudes de vie | idem |
| `Bloc-C4` Moi avec les autres | Fonctionnement en groupe, milieux d'appartenance | idem |
| `Bloc-C5` Mon projet prend forme | Buts, besoins de formation | idem |
| `Bloc-C6` Je me prépare à réussir | Conditions de réussite, partenaires | idem |
| `Bloc-C7` Je présente mon projet | Les 12 savoirs | Fiche de l'épreuve · Mon projet en une page · Mon autoévaluation |

Le fil rouge est **Léo**, un personnage fictif. Il modèle chaque bloc : l'élève voit comment faire avant de parler de lui-même.

## Pour les enseignants seulement (canal privé)
- `99_ENSEIGNANTE_SEULEMENT/Evaluation` :
  - la grille critérielle (5 échelons, seuil Acceptable) ;
  - les fiches descriptives par critère ;
  - les formes d'épreuve et la couverture des savoirs ;
  - la grille d'observation des ateliers, vierge.
- `99_ENSEIGNANTE_SEULEMENT/Materiel-a-imprimer` :
  - les cartes « Forces » (30 habiletés) ;
  - les cartes des 27 cours ;
  - le journal d'atelier en version papier.

## Refaire les PDF
`python3 _sources/construire.py tout` (ou `blocs`, `brise`, `evaluation`, `maitre`, `materiel`). Il faut Python, segno, Node et Playwright.
