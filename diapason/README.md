# Zaza × Frog · diapason

L'espace de création de Zaza (voix + guitare) et Frog (piano + effets) : six mois pour passer d'idées brutes à 3 à 5 morceaux originaux.

Tout le contenu (plan, rythme des séances, déroulé d'une session, exercices, grilles, gabarits d'arrangement, signaux d'entrée) vient de la recherche Consensus de Zaza ; chaque élément garde ses sources dans `js/duo.js`.

## Les pièces

- **Plan** (accueil) : le mois en cours sur six, sa sortie visée mesurée automatiquement à partir du mur, le rythme de la semaine (2 sessions duo, 3 micro-sessions solo chacun, une écoute commune aux 2 semaines), la vision commune, la prochaine cible notée au dernier debrief.
- **Session** : séance guidée (duo 60 ou 90 min, solo 25 min, écoute commune 20 min). Une cible, des phases minutées (check-in, échauffement, impro dirigée, développer, structure, prise, debrief), un exercice tiré de la banque à chaque phase, la grille du jour en boucle, la prise qui part sur le mur. Le minuteur est partagé entre les deux appareils.
- **Le mur** : toutes les idées (notes, mémos vocaux, écrits, essais, paroles), en trois vues : par étape (Idée brute → À creuser → En chantier → Fixé → Dans le set), par morceau, ou en fil. Glisser-déposer, réponses sur chaque idée, filtres Zaza / Frog.
- **Paroles** : syllabes chantées (règle du e muet), cible par ligne, schéma de rimes, passages incertains et trous, rimes (Lexique 3) et synonymes (Wiktionnaire).
- **Studio** : beat, accords, écoute d'instrument (micro, interface ou MIDI : accords, tonalité, suggestions), scène question/réponse, clip vidéo, pochette.
- **Voix** : Miroir, Empreinte (et la zone du duo), Gym vocal.
- **Le labo** (à part) : rythme ↔ note, quand un polyrythme devient un accord.
- **La visite** : à la première visite de Frog, le mot d'accueil de Zaza (texte + audio facultatif, à régler dans Mur → Réglages), puis le sens de l'app en quelques écrans.

## L'espace partagé (serveur)

Une fonction Netlify (`netlify/functions/espace.mjs`) + Netlify Blobs. Pas de compte : le lien secret de l'espace est la clé. Audios en morceaux de 3 Mo (75 Mo max.). Synchronisation toutes les 2,5 s quand ça bouge, 10 s au repos, rien quand l'onglet est caché.

Localement : `npm install` puis `npm run dev` (http://localhost:8888), même API avec un stockage en mémoire.

## Données de langue

- `data/lexique-fr.tsv` : 39 000 mots de **Lexique 3.83** (New & Pallier, www.lexique.org, CC BY-SA 4.0). Regénérer : `python3 tools/build_lexique.py Lexique383.tsv data/lexique-fr.tsv 1`.
- Synonymes : **Wiktionnaire** (CC BY-SA), en direct depuis le navigateur.
