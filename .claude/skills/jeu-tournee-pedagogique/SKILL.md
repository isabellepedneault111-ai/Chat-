---
name: jeu-tournee-pedagogique
description: >-
  Crée une application web d'apprentissage ou de révision en forme de « tournée » (des lieux à visiter, chacun avec son décor animé), sur 3 niveaux différenciés, avec une grille d'évaluation descriptive liée au programme, des capsules animées et narrées, 11 modalités de réponse, un bilan PDF que l'élève remet à son enseignant, et un défi supplémentaire que l'élève crée puis publie dans Teams. Utilise ce skill dès qu'un enseignant, un conseiller pédagogique ou une conseillère pédagogique veut un jeu en ligne, une activité interactive, une révision, une évaluation formative ou des « défis » pour ses élèves, même sans le mot « tournée » : par exemple « fais-moi un jeu comme Estimer au Saguenay pour… », « une activité en ligne avec des niveaux », « une révision avec une grille et un bilan PDF », ou « mettre ça sur Netlify pour mes élèves ».
---

# Jeu en tournée pédagogique

Ce skill produit un site statique : une page HTML, des polices et jsPDF. Le site se publie sur Netlify ou sur tout autre hébergement statique. Tout le contenu vient d'**un seul fichier de configuration JSON**, et le moteur fait le reste. Exemple complet et éprouvé en classe : `exemples/estimer-au-saguenay.json`, un jeu de mathématiques financières en PPS. Il est en ligne sur https://pps-z128-estimer.netlify.app/estimer-au-saguenay.html.

## Ce que l'élève vit (et pourquoi)

- **Accueil :** l'élève écrit son prénom. Rien n'est envoyé en ligne : le travail reste sur l'appareil et peut être repris (respect de la Loi 25).
- **Carte de la tournée :** une mascotte avance d'un arrêt à l'autre. Le chemin donne un sens à la progression et coupe la tâche en petits morceaux, ce qui aide les élèves qui se découragent vite.
- **Trois niveaux :** au début de chaque niveau, une **capsule** animée et narrée montre « les trucs » ; c'est le modelage avant la pratique. Une capsule peut aussi être placée juste avant une station, pour un nouveau truc difficile. Faire découvrir un truc là où on en a besoin évite la surcharge.
- **Chaque station :** un décor animé propre au lieu, puis des défis.
- **Chaque défi :** 2 essais, un bouton « Le truc » (un indice, noté dans le bilan), puis l'**explication complète, une étape par ligne**. La voix ne joue qu'au clic, jamais toute seule.
- **Arrêter en tout temps :** le bouton « Terminer et voir mon bilan » est toujours visible. Le jeu propose aussi de s'arrêter à la fin de chaque niveau. Un élève peut donc faire seulement le premier niveau sans être pénalisé : ce qui n'est pas fait est « non évalué ».
- **Bilan :**
  - une autoévaluation ;
  - une **grille descriptive** au « je », avec la case « Tu es ici » et une **prochaine étape** par élément. Les élèves voient ce qu'ils savent faire et quoi faire ensuite, sans note chiffrée ;
  - un PDF pour l'enseignant (grille au complet, détail des défis, réponses écrites), téléchargeable seulement après avoir écrit son prénom.
- **Défi supplémentaire, un studio de création :** l'élève est guidé en 6 étapes, avec un aperçu en direct de son affiche paysage pour le TNI. Il choisit un décor du cours, une forme de défi, un autocollant, la difficulté et un chrono. Il a des suggestions, des débuts de phrase et un bouton « Inspire-moi ». Le PDF fait 2 pages, l'affiche et le corrigé, et des étapes Teams illustrées l'accompagnent. L'enseignant vérifie le corrigé ; ce défi n'entre pas dans le bilan. Remplis `suggestions`, ou `amorces` et `idees`, pour que le studio soit en lien avec le cours.
- **Espace enseignant :** `?mode=<cleEnseignant>`. On y trouve l'intention, la grille, le calcul de la cote, le corrigé et les capsules à projeter.

## Démarche

### 1. Cadrer avec l'enseignant (court)
Ce qu'il faut savoir avant d'écrire. Propose des choix par défaut plutôt que de tout demander.
- **Le cours et le savoir visé :** le cours (code, PFEQ, PPS, FGA…), le savoir visé et l'**intention pédagogique** en une phrase.
- **Les élèves :** la clientèle (âge, besoins, FALC ou non) et le prénom de l'enseignant qui recevra les bilans.
- **Les trois niveaux :** des noms neutres qui ne stigmatisent pas (arbres, rivières, saisons…). Par défaut, la progression va du concret à l'imagé à l'abstrait.
- **La grille :** de 3 à 6 éléments **observables**, liés au programme, chacun avec 4 descripteurs.
- **Le contexte :** des lieux réels et proches des élèves ; c'est ce qui rend le jeu vivant.
- **Les visuels :** les décors (montre `assets/galerie-decors.png`), la mascotte (`renard`, `hibou` ou `aucune`), la couleur d'accent.
- **La durée :** `valider.py` l'estime (environ 1 min par défi, plus les capsules et les stations). 25 min ≈ 18 à 20 défis, 30 min ≈ 22 à 26 défis.
- **L'équipe et le canal Teams** où publier les défis des élèves.

Lis `references/pedagogie.md` pour bâtir les niveaux, les descripteurs, les prochaines étapes et les explications.

### 2. Écrire la configuration
Pars de `exemples/estimer-au-saguenay.json` et lis `references/configuration.md`, qui donne le schéma complet et les 11 types de défis.
- **Les réponses :** calcule toutes les réponses numériques avec un petit script et vérifie-les avec des `assert`. Une seule erreur de corrigé ruine la confiance des élèves.
- **Les modalités :** varie-les (tri, ordre, curseur, erreur à trouver, réponse écrite…). La variété garde l'attention et donne d'autres portes d'entrée.
- **L'ordre :** les défis suivent l'ordre des stations, et les stations, l'ordre des niveaux.

### 3. Valider, construire, tester
```bash
python3 scripts/valider.py config.json                 # erreurs bloquantes + durée estimée
python3 scripts/construire.py config.json <dossier>     # <dossier>/<fichier>.html + fonts/ + lib/
node scripts/tester.js <dossier>/<fichier>.html <captures>   # joue toute la tournée (Playwright + Chromium)
```
`tester.js` joue chaque défi (avec quelques erreurs volontaires), fait une capture de chaque décor, du bilan, de la vue mobile et de l'espace enseignant, et télécharge les PDF. **Regarde les captures** (montage avec PIL) et les PDF (`pdftoppm`) avant de livrer. Le script cherche Playwright normalement, puis dans le dossier courant et dans `NODE_PATH` ; s'il ne le trouve pas, installe-le (`npm i playwright`) ou règle `NODE_PATH`.

Pour aider l'enseignant à choisir les décors : `python3 scripts/galerie.py galerie.html --png galerie.png`.

### Dans le clavardage claude.ai (sans Claude Code)
Le skill fonctionne aussi dans le clavardage, à condition que l'exécution de code soit activée. Il y a deux différences :
- **Construire en un seul fichier :** `python3 scripts/construire.py config.json /mnt/user-data/outputs --autonome` (ou le dossier de sortie prévu). Ce fichier HTML contient tout (polices, outils PDF) et s'ouvre tel quel. Remets-le à l'enseignant comme fichier à télécharger.
- **Tester :** `tester.js` a besoin de Playwright et de Chromium, souvent absents dans le clavardage. Si `node` ou Playwright manquent, lance au moins `valider.py`, relis la configuration (réponses calculées par script) et dis-le à l'enseignant.
- **Publier :** l'enseignant glisse le fichier HTML sur https://app.netlify.com/drop, ou sur son site Netlify existant (onglet « Deploys »). Pour garder le même lien qu'avant, il faut garder le **même nom de fichier** et publier sur le **même site**.

### 4. Publier
- **Avec le connecteur Netlify :** l'opération `deploy-site` avec le `siteId` du site renvoie une commande `npx @netlify/mcp …`. Lance-la dans le dossier de sortie. Ne crée jamais un nouveau site sans l'accord de l'enseignant.
- **Sans connecteur :** l'enseignant glisse le dossier sur https://app.netlify.com/drop.
- Après la mise en ligne, relance `tester.js` sur l'URL publique. Le badge Netlify occupe le coin en bas à droite ; c'est pourquoi le bouton « Terminer » est en bas à gauche.

### 5. Livrer
Donne :
- le lien élève et le lien enseignant (`?mode=…`) ;
- un résumé des niveaux et des stations ;
- la façon de recevoir les bilans (un devoir Teams « Remets ton bilan » est le plus simple) ;
- 2 ou 3 pistes de réflexion.

Si l'élève ouvre le jeu **à l'intérieur de Teams**, les téléchargements peuvent être bloqués. Le jeu affiche alors un lien de secours, mais conseille d'ouvrir le lien dans Edge ou Chrome.

## Points d'attention
- **Pas de noms d'élèves** dans la configuration ni dans un dépôt public. Le prénom n'existe que dans le navigateur de l'élève et dans son PDF.
- **Le texte affiché aux élèves :** phrases courtes, un verbe d'action, une idée par ligne. On peut mettre du `<b>` dans `titre`, mais pas ailleurs.
- **Le contenu à vérifier par l'enseignant :** signale-lui ce que tu as dû supposer (valeurs nutritives génériques, classement d'un aliment, prix). Il connaît ses élèves et son programme.
- **Pour les matières autres que l'argent,** mets `"unite": ""` au niveau global et une `unite` par défi (`g`, `mg`, `%`). Pour un tableau de la valeur nutritive, utilise le visuel `tableauNutritif`, qui est lu à voix haute.
- **Les modalités « argent »** (`droite`, `jetons`, `assez`, les visuels `billets` et `taxes`, et les activités `panier` et `defi`) servent la littératie financière. Pour les autres matières, utilise `qcm`, `vf`, `tri`, `ordre`, `num`, `curseur`, `erreur` et `texte` (avec `unite` au besoin), et le défi supplémentaire `creation`.
- **Les taxes au Québec :** TPS 5 % + TVQ 9,975 % = 14,975 %, soit environ 15 %. Les aliments de base ne sont pas taxés ; les grignotines, les sucreries, le restaurant et les produits de soins ou ménagers le sont.
- **Faire évoluer le moteur :** modifie `moteur/moteur.html` ou `moteur/decors.js`, puis reconstruis **et reteste** le jeu d'exemple pour éviter les régressions.
