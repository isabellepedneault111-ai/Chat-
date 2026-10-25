# Diapason — le carnet de route d'un album, pour la classe

Refonte complète de « Musiqu-Action Studio ». *Diapason* veut dire à la fois **l'outil qui donne la note** et **l'étendue d'une voix**.

## Modules

1. **Miroir** — ta voix tracée en direct, note-cible à atteindre, aiguille de justesse, spectre.
2. **Empreinte** — test d'étendue guidé (voix synthétique fr-CA) + **portrait vocal du groupe** qui calcule la zone où toute la classe peut chanter.
3. **Gym vocal** — 6 exercices transposés à ta voix, cibles qui défilent, montée par demi-tons, score et records.
4. **Rythme ↔ Note** — des disques qui tournent comme des vinyles : leur contour *est* l'onde (n bosses = n clics par tour), la ligne blanche est leur somme. Jusqu'à 6 disques ajoutables (1 à 16 bosses, coupables), clavier avec notes fantômes (×2 = une octave), oscilloscope au ralenti, particules d'air, ligne du temps. 2 : 3 est une hémiole quand c'est lent, une quinte quand c'est rapide.
5. **Studio** — séquenceur 16 pas, 6 progressions dans 12 tonalités, « notes sûres » pour improviser, prise de voix mixée sur le beat (téléchargeable), pochette générative, et la **Scène** : 8 pastilles pentatoniques pour composer une mélodie qui reste dans la boucle, visible comme une constellation qui tourne, en solo ou en duo question/réponse, exportable en **clip vidéo** (image + son + voix).

Partout : 💡 pistes pédagogiques (questions, défis, liens PFEQ et compétence numérique), 🎲 défi surprise, ⛶ mode projecteur.

## Pour un duo, de l'idée à l'album

- **Parcours** (accueil) : le duo fixe son objectif (titre, nombre de chansons, date de lancement, couleur musicale). Diapason trace les étapes datées (Face A : accorder le duo, une section par chanson, Face B : sortir l'album) et propose toujours la prochaine action.
- **Carnet partagé** : écrits, audios (mémo du cellulaire ou prise directe), essais, bilans de séance, évaluations sur des critères communs. Ce que l'un ajoute, l'autre le voit en quelques secondes.
- **Atelier de paroles** : sections (couplet, refrain, pont…), syllabes chantées par ligne avec la règle du e muet, cible en syllabes, schéma de rimes, passages `[? incertains ?]` et trous `___`, boîte à mots (rimes riches, suffisantes, assonances, synonymes).
- **Mon instrument** (Studio) : Diapason écoute une guitare, un piano ou un clavier MIDI, reconnaît les accords et la tonalité, propose des enchaînements et des notes à chanter, puis envoie la progression dans le beat.

## L'espace partagé (serveur)

Une seule fonction Netlify (`netlify/functions/espace.mjs`) stocke les espaces dans Netlify Blobs. Pas de compte : l'identifiant aléatoire de l'espace (128 bits), partagé par lien, sert de clé. Toute personne qui a le lien peut lire et écrire, et l'interface le dit. Les audios sont envoyés en morceaux de 3 Mo (75 Mo max.). La synchronisation interroge le serveur toutes les 2,5 s quand il y a de l'activité, toutes les 10 s au repos, et jamais quand l'onglet est caché.

Localement : `npm install` puis `npm run dev` (http://localhost:8888) — même API, stockage en mémoire.

## Données de langue

- `data/lexique-fr.tsv` : 39 000 mots fréquents tirés de **Lexique 3.83** (New, B. & Pallier, C., www.lexique.org, licence CC BY-SA 4.0), avec phonétique et syllabes. Regénérer : `python3 tools/build_lexique.py Lexique383.tsv data/lexique-fr.tsv 1`.
- Synonymes : **Wiktionnaire** (CC BY-SA), interrogé en direct depuis le navigateur.

## Ce qui a été corrigé par rapport à la version d'origine

- La détection de note utilisait un état React figé dans la boucle d'animation : les étapes du test ne réagissaient pas. Réécrit sans état périmé.
- Autocorrélation O(n²) à chaque image → algorithme **YIN** avec médiane glissante (plus juste, beaucoup plus léger).
- Génération d'image via une API Gemini sans clé (échec garanti hors de Google) → **pochette générative locale**, sans IA externe ni données envoyées.
- Classification vocale basée sur la seule note grave → plancher **et** plafond, deux familles proches proposées.

## Lancer

Aucun build. `python3 -m http.server` dans ce dossier, puis http://localhost:8000. Le micro exige `localhost` ou HTTPS.

## Modifier le contenu

Tout est dans `js/data.js`. Le skill `.claude/skills/diapason/SKILL.md` décrit le format et aide à créer des SAÉ.
