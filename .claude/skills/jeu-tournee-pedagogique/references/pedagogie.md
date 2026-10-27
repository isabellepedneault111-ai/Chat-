# Guide pédagogique pour concevoir une tournée

## L'intention d'abord
Écris l'intention en une phrase : « *Savoir… pour…* ». Chaque élément de grille, chaque niveau et chaque défi doit servir cette phrase. Si un défi n'y sert pas, retire-le.

## Trois niveaux, une progression
- **Par défaut, du concret à l'imagé à l'abstrait** (Van de Walle). Au premier niveau, on manipule et on voit (droite animée, pièces, tri). Au deuxième, on raisonne sur papier (reçus, estimation, comparaison). Au troisième, on combine et on transfère (plusieurs étapes, cas réels, justifications).
- **Une seule nouveauté à la fois.** Si un niveau demande deux nouveaux trucs, sépare-les : le premier dans la capsule d'introduction, le second dans une capsule placée juste avant la station qui l'utilise.
- **Des nombres doux pour la première rencontre d'une idée** (50 %, c'est la moitié ; 10 %, je recule la virgule), puis on varie. Un exemple trop difficile au début d'un niveau fait décrocher.
- **Découper les tâches en plusieurs étapes** : d'abord un défi pour l'étape 1, puis un défi pour l'étape 1 et l'étape 2 ensemble.
- **Des noms de niveaux neutres et non hiérarchiques** (arbres, rivières, saisons). Les élèves voient le nom de leur niveau.

## La grille descriptive
- **De 3 à 6 éléments observables**, liés au programme (PFEQ, programme PPS, FGA…). Commence chaque élément par un verbe.
- **4 descripteurs** par élément, sur l'échelle de l'outil de suivi : 1 Avec facilité · 2 Un peu de soutien · 3 Beaucoup d'aide · 4 N'y arrive pas. Le descripteur décrit **ce qu'on voit**, pas un jugement.
- **`descripteursEleve`** : la même chose au « je », en mots simples (« J'arrondis seul et j'explique « plus proche de » »).
- **`prochaines`** : une action concrète et faisable aujourd'hui, pour chaque cote. Pour la cote 1, c'est « pour aller plus loin » (aider un ami, créer un défi, une version plus difficile). Pour la cote 4, l'action se fait avec un adulte et du matériel.
- Prévois au moins 2 défis par élément pour que la cote soit fiable, et au moins un défi `texte` ou `ordre` si un élément porte sur « expliquer ».

## Les défis
- **Varie les modalités** dans une même station quand c'est possible.
- **Le titre :** une seule question, en langage simple. Mets en gras (`<b>`) l'information clé : prix, budget, pourcentage.
- **Les distracteurs (`qcm`) :** ils doivent correspondre à des erreurs typiques (oublier les taxes, appliquer les taxes avant le rabais, prendre le prix exact au lieu d'estimer). Ainsi, la réponse fausse est elle-même un diagnostic.
- **L'explication :** de 3 à 5 lignes, une étape par ligne, au « je », et elle finit par la réponse. Elle sert autant à l'élève qui a réussi (confirmation) qu'à celui qui s'est trompé (modelage).
- **Le truc :** des lignes courtes et un visuel. C'est le même truc que dans la capsule, pour que l'élève reconnaisse le geste mental.
- **Les cas serrés :** inclus-en au moins un (« c'est serré, je vérifie ») pour travailler la prudence et la vérification.
- **Les nombres :** calcule tout avec un script. Arrondir au plus proche, ici, veut dire que 50 ¢ et plus montent au dollar suivant.

## Les capsules
- De 3 à 6 scènes, une idée par scène, une phrase lue à voix haute.
- La dernière scène résume le truc en une phrase, avec la mascotte.
- Elles servent aussi en classe : l'enseignant les projette depuis `?mode=…`.

## Le contexte
- Des lieux réels et proches des élèves : leur ville, leurs commerces, leurs loisirs. Le jeu devient « leur » monde.
- Des prix plausibles, et des taxes exactes (Québec : environ 15 % ; aliments de base non taxés).
- Rien de stigmatisant ni d'enfantin pour les adolescents. Si la mascotte est perçue comme « bébé », choisis `aucune` ou `hibou`.

## La durée
`valider.py` estime : 0,9 min par défi + 0,3 min par scène de capsule + 0,3 min par station + 2 min (accueil et bilan). Repères : 25 min ≈ 18 à 20 défis; 30 min ≈ 22 à 26 défis, selon le nombre de capsules. Vise la durée annoncée à ± 3 minutes.

## Le défi supplémentaire
L'élève devient créateur : il crée un défi ou une question, avec le corrigé, et le publie dans Teams. L'enseignant vérifie le corrigé et peut projeter les meilleurs défis au TNI. C'est une façon simple de rendre visible la compréhension et de bâtir une banque de défis par et pour les élèves.
