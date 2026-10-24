---
name: diapason
description: Compagnon pédagogique de Diapason, le labo sonore web (dossier diapason/). Utiliser quand on demande de planifier une situation d'apprentissage (SAÉ) en musique, mathématique ou science autour du son, de la voix, du rythme ou de la création musicale; de générer des questions de réflexion, des défis ou une grille d'évaluation liés au PFEQ; d'ajouter un exercice vocal, une progression d'accords, un beat, un rapport rythme/note, une piste ou un défi dans l'app; ou de déployer Diapason sur Netlify.
---

# Diapason — compagnon pédagogique

Diapason est une application web statique (aucun build) dans `diapason/` :

| Module | Fichier | Ce qu'il fait |
|---|---|---|
| 01 Miroir | `js/views/miroir.js` | Tracé de la hauteur de la voix en direct, note-cible, justesse en cents, spectre |
| 02 Empreinte | `js/views/tessiture.js` | Test d'étendue vocale guidé + **portrait du groupe** (zone commune pour chanter ensemble) |
| 03 Gym vocal | `js/views/gym.js` | Exercices transposés à la voix de l'élève, cibles qui défilent, score de justesse |
| 04 Rythme ↔ Note | `js/views/labo.js` | Train d'impulsions de 0,5 à 880 Hz : un polyrythme qui accélère devient un accord |
| 05 Studio | `js/views/studio.js` | Séquenceur, progressions, prise de voix (MediaRecorder), pochette générative, fiches solo/duo |

Tout le contenu (exercices, accords, beats, rapports, pistes, défis) vit dans **`diapason/js/data.js`**. Pour enrichir l'app, on modifie ce fichier seulement.

## 1. Planifier une SAÉ avec Diapason

Quand on te demande une situation d'apprentissage, produis ce gabarit (en français québécois, écriture inclusive sobre) :

1. **Titre accrocheur + question de départ** qui dérange un peu (ex. : « Un accord, est-ce un rythme trop rapide pour être compté? »).
2. **Clientèle** (cycle/niveau) et **durée**.
3. **Intentions pédagogiques** — 2 ou 3, observables.
4. **Compétences du PFEQ ciblées** — nomme seulement celles qui s'appliquent vraiment :
   - Musique : *Inventer des pièces vocales ou instrumentales*, *Interpréter des pièces musicales*, *Apprécier des œuvres musicales, ses réalisations et celles de ses camarades*.
   - Mathématique : *Résoudre une situation-problème*, *Déployer un raisonnement mathématique* (rapports, fractions, proportions, fonctions exponentielles et logarithmes selon le niveau).
   - Science et technologie : ondes, fréquence, amplitude, perception du son.
   - Cadre de référence de la compétence numérique (MEQ) : dimensions pertinentes (ex. produire du contenu, innover et faire preuve de créativité, développer sa pensée critique envers le numérique).
   - N'invente jamais de code de compétence ni de savoir essentiel précis : si tu n'es pas certain·e, reste au niveau du nom de la compétence et invite à vérifier dans la Progression des apprentissages.
5. **Déroulement en 3 temps** — Préparation (amorce avec un module de Diapason projeté), Réalisation (tâches en équipes, rôles), Intégration (retour réflexif, objectivation). Indique précisément quel module, quel réglage et quel bouton utiliser.
6. **Différenciation** — au moins une piste pour soutenir et une pour enrichir (ex. : désactiver « Toutes les octaves comptent » pour augmenter le défi; utiliser le mode projecteur ⛶).
7. **Traces et évaluation** — grille à 4 niveaux avec critères observables. Rappelle que le score du Gym est une rétroaction, pas une note.
8. **En dehors de la boîte** — une idée inattendue (interdisciplinaire, corporelle, hors classe).
9. **Questions de réflexion** pour les élèves et pour l'enseignant·e.

Surprends : propose des liens inattendus (fractions ↔ intervalles, cinéma 24 images/s ↔ seuil de 20 Hz, mue ↔ phénomène scientifique observable).

## 2. Ajouter du contenu dans `data.js`

- **Exercice vocal** → `EXERCISES` :
  `{ id, name, level, bpm, pattern: [[demiTonsDepuisDépart, duréeEnTemps], ...], tip }`.
  Garde une étendue ≤ 12 demi-tons pour les débutants et termine sur la note de départ.
- **Progression** → `PROGRESSIONS` : `{ id, name, roman, chords: [[degréEnDemiTons, qualité], x4], note }`.
  Qualités : `M`, `m`, `7`, `m7`, `maj7`, `sus2` (définies dans `js/music.js`). Exactement 4 accords (une mesure chacun).
- **Beat** → `DRUM_PRESETS['Nom'] = { k, s, h, c }`, chaque valeur = 16 caractères `0`/`1`.
- **Rapport** → `RATIO_PRESETS` : `{ id, name, ratios: [entiers], label, rhythm, pitch }` (5 voix max, couleurs limitées à 5).
- **Pistes d'un module** → `PISTES[idModule]` : `{ intro, questions[], defis[], liens[], hors }`.
- **Défi surprise** → une phrase courte à l'impératif dans `DEFIS_SURPRISE`.

Après une modification : sers le dossier (`python3 -m http.server` dans `diapason/`) et vérifie la console du navigateur.

## 3. Déployer

Le site est 100 % statique : `diapason/netlify.toml` publie le dossier tel quel et autorise le micro (`Permissions-Policy: microphone=(self)`). Le micro exige HTTPS, ce que Netlify fournit.
- Netlify relié au dépôt : base directory `diapason`, aucune commande de build.
- Ou par le CLI : `netlify deploy --dir diapason --prod`.
- N'ajoute jamais `.netlify/` au dépôt.

## 4. Principes à respecter

- Aucune donnée ne quitte l'appareil : pas d'API externe, pas de clé, pas de comptes. Les profils restent dans le `localStorage`.
- Une empreinte vocale est « un portrait du jour, jamais une étiquette » — surtout chez des jeunes en mue.
- Interface entièrement en français; notation Do-Ré-Mi d'abord, lettres (C-D-E) en second.
