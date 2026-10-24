# Diapason — le labo où le son devient visible

Refonte complète de « Musiqu-Action Studio ». *Diapason* veut dire à la fois **l'outil qui donne la note** et **l'étendue d'une voix**.

## Modules

1. **Miroir** — ta voix tracée en direct, note-cible à atteindre, aiguille de justesse, spectre.
2. **Empreinte** — test d'étendue guidé (voix synthétique fr-CA) + **portrait vocal du groupe** qui calcule la zone où toute la classe peut chanter.
3. **Gym vocal** — 6 exercices transposés à ta voix, cibles qui défilent, montée par demi-tons, score et records.
4. **Rythme ↔ Note** — un train d'impulsions de 0,5 à 880 Hz : 2 : 3 est une hémiole quand c'est lent, une quinte quand c'est rapide. « Grande glissade » de 20 s et tap tempo.
5. **Studio** — séquenceur 16 pas, 6 progressions dans 12 tonalités, « notes sûres » pour improviser, prise de voix mixée sur le beat (téléchargeable), pochette générative, fiches Solo/Duo avec minuterie.

Partout : 💡 pistes pédagogiques (questions, défis, liens PFEQ et compétence numérique), 🎲 défi surprise, ⛶ mode projecteur.

## Ce qui a été corrigé par rapport à la version d'origine

- La détection de note utilisait un état React figé dans la boucle d'animation : les étapes du test ne réagissaient pas. Réécrit sans état périmé.
- Autocorrélation O(n²) à chaque image → algorithme **YIN** avec médiane glissante (plus juste, beaucoup plus léger).
- Génération d'image via une API Gemini sans clé (échec garanti hors de Google) → **pochette générative locale**, sans IA externe ni données envoyées.
- Classification vocale basée sur la seule note grave → plancher **et** plafond, deux familles proches proposées.

## Lancer

Aucun build. `python3 -m http.server` dans ce dossier, puis http://localhost:8000. Le micro exige `localhost` ou HTTPS.

## Modifier le contenu

Tout est dans `js/data.js`. Le skill `.claude/skills/diapason/SKILL.md` décrit le format et aide à créer des SAÉ.
