# Référence de la configuration

Un jeu = un fichier JSON. L'exemple complet est `exemples/estimer-au-saguenay.json`. **Clés de premier niveau** : `id`, `fichier`, `titre`, …, `niveaux`, `elements`, `autoeval`, `stations`, `trucs`, `capsules`, **`questions`** (la liste des défis) et `reinvest`. `scripts/valider.py` vérifie tout ce qui est décrit ici.

## Sommaire
1. Champs généraux
2. Niveaux, éléments de grille, autoévaluation
3. Stations et décors
4. Trucs et capsules (visuels)
5. Les 11 types de défis
6. Défi supplémentaire (`reinvest`)

## 1. Champs généraux
| Champ | Rôle |
|---|---|
| `id` | Clé de sauvegarde dans le navigateur. Change-la (`-v2`) si tu modifies la structure des défis d'un jeu déjà utilisé. |
| `fichier` | Nom du fichier HTML produit (sans `.html`). |
| `titre`, `sousTitre`, `accroche` | Textes de l'accueil. |
| `cours`, `matiere` | Pour le PDF (en-tête et pied de page). |
| `enseignant` | Prénom de l'enseignant (« Remets ton bilan à … », « … va lire »). |
| `cleEnseignant` | Mot de l'URL de l'espace enseignant : `?mode=<cle>` (`?mode=enseignant` marche aussi). |
| `intention` | L'intention pédagogique : elle figure dans l'espace enseignant et dans le bilan PDF. |
| `duree` | Durée annoncée, en minutes. |
| `unite` | Unité par défaut des nombres (`"$"` par défaut, `""` pour aucune unité). Avec `"$"`, un nombre s'affiche avec 2 décimales (4,99 $). Avec une autre unité, il s'affiche tel quel (280 mg, 12,5 g). Chaque défi peut avoir son propre `unite`, qui s'applique à ses `articles`, à ses `lignes`, à `num` et à `curseur`. |
| `mascotte` | `{fichier: "renard" \| "hibou" \| "aucune", nom: "le renard", du: "du renard"}`. Le champ `du` forme les libellés « Le truc du renard », « Les trucs du renard ». |
| `theme` | `{accent, accentFonce, accentPale, formes: [4 couleurs des formes de fond]}`. |
| `carte` | `{trajet: "de Jonquière à Chicoutimi", depart, arrivee, riviere}`. La rivière est facultative. |
| `remise` | Phrase qui explique comment remettre le bilan (facultatif). |

## 2. Niveaux, grille, autoévaluation
```json
"niveaux": [{"id": "E", "nom": "Érable", "clair": "#F5C6C2", "fonce": "#A9372B", "description": "je manipule",
             "intro": {"texte": "Au niveau Érable, tu apprends…", "capsules": ["arrondir"]}}, …]
```
- De 1 à 4 niveaux ; 3 est la norme. Choisis des noms neutres.
- `intro.capsules` liste les capsules jouées au début du niveau ; la liste peut être vide.

```json
"elements": [{"id": "arr", "nom": "Arrondir un prix au dollar",
  "descripteurs": ["(1) Avec facilité…", "(2) Un peu de soutien…", "(3) Beaucoup d'aide…", "(4) N'y arrive pas…"],
  "descripteursEleve": ["J'arrondis seul…", "…", "…", "…"],
  "prochaines": ["(si cote 1) Pour aller plus loin…", "(si 2)…", "(si 3)…", "(si 4)…"]}]
```
- `descripteurs` est la version enseignant, pour le PDF et l'espace enseignant. L'ordre va de 1 (avec facilité) à 4 (n'y arrive pas), la même échelle que l'outil de suivi.
- `descripteursEleve` est la version au « je » affichée à l'élève dans sa grille. Si le champ est absent, le moteur prend `descripteurs`.
- `prochaines` donne la prochaine étape selon la cote. Si le champ est absent, le moteur affiche « Vise : » suivi du descripteur du niveau au-dessus.
- `echelle` et `echelleEleve` (facultatifs) remplacent les libellés de l'échelle.
- `autoeval` : `[{"element": "arr", "phrase": "Je suis capable de…"}]`. Seuls les éléments vraiment travaillés sont demandés.

**La cote** : chaque défi vaut 1 (premier essai sans aide), 0,75 (premier essai avec le truc), 0,6 (deuxième essai), 0,5 (deuxième essai avec le truc) ou 0. On fait la moyenne par élément : 0,85 et plus donne 1 ; 0,6 et plus, 2 ; 0,35 et plus, 3 ; moins, 4. Un défi `texte` n'est pas noté : il est remis tel quel à l'enseignant.

## 3. Stations
```json
{"nom": "Centre Georges-Vézina", "court": "Saguenéens", "lieu": "Chicoutimi", "niveau": "B",
 "couleur": "#1F3A93", "decor": "arena", "texte": "Direction Chicoutimi…", "capsules": ["rabais"]}
```
- `court` est l'étiquette sur la carte (16 caractères au maximum).
- `capsules` (facultatif) joue une capsule sur l'écran de la station, juste avant ses défis. C'est l'endroit idéal pour un nouveau truc difficile.
- **Décors disponibles** : `cafe`, `depanneur`, `magasin` (avec citrouilles et ballons), `epicerie`, `cinema`, `restaurant` (pizzéria), `casse-croute` (frites et table à pique-nique), `cafeteria` (intérieur, menu du jour), `arena`, `grande-surface`, `pharmacie`, `centre-commercial` (avec neige), `maison-halloween`, `ecole`, `bibliotheque`, `parc`, `banque`, `clinique`, `maison`, `cuisine` (intérieur), `gare` (arrêt d'autobus). Ils sont tous animés : fumée, néon, chauves-souris, autobus, flocons… Pour voir la galerie : `python3 scripts/galerie.py`.
- Quand une station a des `capsules`, la capsule s'affiche **avant** le bouton de départ (avec un lien « Passer le truc »).

## 4. Trucs et capsules
```json
"trucs": {"t1": {"titre": "…", "lignes": ["…", "…"], "visuel": {…}}},
"capsules": {"arrondir": {"titre": "…", "scenes": [{"texte": "…", "visuel": {…}}]}}
```
**Les visuels** (dans `visuel`, ou dans le champ `visuel` d'un défi) :
| type | champs | rendu |
|---|---|---|
| `droite` | `a`, `p` (ou `null`), `fleche`, `milieu` | Droite de `a` à `a+1`, avec un marqueur qui glisse jusqu'à `p` |
| `recu` | `articles: [[nom, prix]]`, `note` | Reçu vertical |
| `recuArrondi` | `articles` | Reçu avec « → prix arrondi » |
| `billets` | `montant` | Billets canadiens dans un portefeuille |
| `taxes` | `base`, `etape` 0 à 3 | Barre prix + 10 % + la moitié = total |
| `grand` | `html` | Grosse équation manuscrite |
| `colonnes` | `colonnes: [{titre, texte, couleur}]` | Deux colonnes de comparaison |
| `mascotte` | `taille`, `html` | Mascotte, avec un texte au besoin |
| `decor` | `decor`, `nom`, `couleur` | Un décor |
| `image` | `src`, `alt` | Image (URL ou fichier placé à côté du jeu) |
| `tableauNutritif` | `titre`, `portion` (mets-y le nom du produit), `calories`, `lignes: [[nom, "quantité avec unité", %VQ ou null, "sous"?]]`, `repere`, `ingredients`, `note` | Tableau de la valeur nutritive, lu à voix haute. `"sous"` décale une sous-ligne (saturés, fibres, sucres). `repere: true` colore les % selon le seuil 5 %/15 % ; absent : pas de couleur, mais la note « 5 % ou moins… » reste ; `false` : ni couleur ni note. N'utilise pas `repere: true` dans un défi `erreur` ou quand la couleur donnerait la réponse ; attention, pour les fibres, « beaucoup » est une bonne chose. |
| `comparer` | `tableaux: [{nom, …champs de tableauNutritif}, …]` | Deux produits côte à côte (lus à voix haute) |
| `html` | `html` | HTML libre (non lu à voix haute : ajoute `dit` pour la voix) |

Tout visuel accepte `dit` : le texte lu par le bouton « Écouter » du défi.

Une capsule fait de 3 à 6 scènes, chacune avec une seule idée. Le texte est lu à voix haute.

## 5. Types de défis
La liste des défis est la clé **`questions`**. Champs communs : `id`, `station` (l'index), `element` (l'id de la grille), `type`, `truc` (l'id du truc, sauf pour `texte`), `titre` (on peut y mettre `<b>`), `resume` (court, pour le PDF), `explication` (une étape par ligne). Champs facultatifs : `articles` + `note` (un reçu affiché au-dessus), `visuel`, `unite`.

| type | champs propres | l'élève… |
|---|---|---|
| `qcm` | `choix: [..]`, `bonne` (index) | touche une réponse |
| `vf` | `reponse: true/false` | touche Vrai ou Faux |
| `tri` | `boites: [..]`, `etiquettes: [[texte, indexBoite]]` | touche une étiquette, puis une boîte (2 boîtes ou plus) |
| `ordre` | `etapes: [..]` (dans le bon ordre) | touche les étapes dans l'ordre |
| `num` | `accepteMin`, `accepteMax` | tape un nombre (la virgule est acceptée) |
| `curseur` | `min`, `max`, `pas`, `depart`, `accepteMin`, `accepteMax` | glisse un curseur (+/−) |
| `erreur` | `lignes: [[texte, valeur]]`, `fausses: [index]` | touche la ligne fausse d'un reçu ou d'une liste |
| `texte` | — | écrit ou dicte une réponse ; un exemple de réponse s'affiche ensuite |
| `droite` | `a`, `p` | choisit l'entier le plus proche sur une droite animée (argent) |
| `jetons` | `articles` | met des pièces de 1 $ par article (argent) |
| `assez` | `budget`, `reponse`, `articles` | choisit « J'ai assez » ou « Pas assez » (argent) |

Pour `erreur`, une valeur peut être un nombre (formaté selon l'unité) ou un texte (par exemple `"120 g"`, `"Vrai"`).

## 6. Défi supplémentaire (`reinvest`)
```json
"reinvest": {"capsules": false,
  "defi": {"lieux": ["Maxi (Jonquière)", …], "liens": [{"nom": "Circulaire Walmart", "lien": "https://…"}],
           "teams": {"equipe": "Budget et consommation PPS", "canal": "le canal de ton cours (PPS-Z128)"}},
  "creation": {"titre": "Crée ta question", "consigne": "…", "teams": {…}},
  "panier": {"titre": "…", "budget": 30, "taxe": 0.14975, "catalogue": [[nom, prix, taxable 0/1]]},
  "dansBilan": false}
```
- `defi` (argent) : un assistant en 6 étapes. L'élève choisit la forme de question (« As-tu assez d'argent ? », « Environ combien ça coûte ? », « Combien va-t-il rester ? », « Quel article enlever ? ») et peut ajouter les taxes. Il trouve de vrais prix grâce aux liens, écrit sa réponse et la compare au corrigé calculé. Il télécharge ensuite un PDF paysage pour le TNI (défi en page 1, corrigé en page 2), puis suit les étapes illustrées pour le publier dans Teams.
- `creation` (toutes les matières) : `{"titre": "Crée ta question", "description": "(texte de la carte dans le bilan)", "consigne": "…", "teams": {"equipe": "Alimentation saine PPS", "canal": "le canal « PPS-Z107 »"}}`. Le moteur affiche « Choisis » suivi de `canal` : écris donc `canal` comme une suite de phrase (« le canal « PPS-Z107 » »). C'est un assistant en 5 étapes. La forme se choisit dans un menu (choix multiples, vrai ou faux, réponse courte). L'élève écrit la question et la réponse, puis explique pourquoi. Il télécharge un PDF paysage et le publie dans Teams.
- `panier` : une épicerie virtuelle avec budget (boutons + et −, « Retirer »).
- `capsules` : permet de revoir les capsules.
- `dansBilan` : `true` pour ajouter ces activités au bilan PDF. Par défaut, elles n'y sont pas, et l'enseignant vérifie le travail publié dans Teams.
- **Lien direct** vers l'activité, sans faire la tournée : `?mode=defi` ou `?mode=question`. Il est affiché dans l'espace enseignant.
- Pour désactiver une activité, retire sa clé ou préfixe-la de `_`.

### Le studio de création (défi ou question)
`defi` (argent) et `creation` (toutes les matières) ouvrent le même **studio guidé en 6 étapes**, avec un aperçu en direct de l'affiche paysage (TNI) :
1. **Le lieu** : un décor parmi ceux des stations du jeu, le nom du lieu et la couleur.
2. **La forme** : avec `defi`, c'est assez ?, combien ?, combien reste-t-il ? ou quoi enlever ?, et l'option des taxes. Avec `creation` : choix multiples, vrai ou faux, ou réponse courte.
3. **Le contenu** : pour `defi`, des produits suggérés, de vrais prix et un curseur pour le budget. Pour `creation`, des débuts de phrase et une étoile ⭐ qui marque la bonne réponse. Les deux offrent « Inspire-moi ».
4. **Le corrigé** : avec `defi`, le corrigé est calculé et l'élève le compare à sa réponse. Avec `creation`, l'élève explique son « pourquoi » à l'aide de débuts de phrase.
5. **La touche finale** : titre, autocollant (étoile, éclair, cœur, érable, flocon, citrouille, pomme, fusée, trophée), difficulté, chrono, phrase de la mascotte.
6. **Publier** : un PDF de 2 pages (affiche et corrigé), identique à l'aperçu, et les étapes Teams illustrées.

Champs pour enrichir le studio en lien avec le cours :
- `defi.suggestions: [[nom, prix], …]` : les produits proposés en un clic et pour « Inspire-moi ». Reprends les articles du jeu.
- `defi.liens: [{nom, lien}]` : les circulaires et menus pour trouver de vrais prix.
- `creation.amorces: ["Laquelle de ces collations…", …]` : les débuts de phrase.
- `creation.idees: [{forme: "qcm"|"vf"|"courte", question, choix, bonne, vf, reponse, pourquoi}, …]` : des exemples à modifier, pour « Inspire-moi ». Prévois-en 5 ou 6, en lien direct avec le cours.
