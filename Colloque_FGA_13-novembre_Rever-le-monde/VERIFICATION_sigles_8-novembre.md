# Vérification des sigles · 8 novembre 2026

Trois sources comparées pour le générateur d'invite Copilot :

1. **La Boussole d'Isabelle** (`cfga.netlify.app/data/sigles.json`, 103 sigles).
2. **Les documents Perplexity** : « Rapport — Programmes d'études FGA » (186 fiches) et « Progression FGA — Toutes matières et couche transversale ».
3. **La source officielle** : les pages du ministère (quebec.ca, 34 pages de programmes, 193 sigles avec leur DDE), le *Programme de la formation de base commune*, l'*Introduction générale de la FBD* et le document administratif *Services et programmes d'études 2026-2027*.

Quand les sources divergent, **la source officielle l'emporte**.

## Ce qui est solide

- Les **167 liens** des documents Perplexity fonctionnent tous (vérifiés un par un).
- Les contenus de la Boussole vérifiés dans les programmes officiels sont exacts. Exemple : MAT-1101 retient bien *Communiquer* et *Raisonner avec logique* ; le rapport Perplexity n'en nommait qu'une.

## Corrections de titres (source officielle)

| Sigle | Boussole | Rapport Perplexity | Titre officiel |
|---|---|---|---|
| FRA-3101 | Découvrir des personnages intéressants | idem | **Découvrir des personnages importants** |
| FRA-5205 | (absent) | Du français écrit | **Approfondir ses connaissances du français écrit** |
| FRA-5206 | (absent) | Découvrir l'univers dramatique | **Découvrir l'univers médiatique** |
| CHI-5061 | Propriétés des gaz | Propriétés des gaz et énergie chimique | **Propriétés des gaz et énergie chimique** |
| PHY-5061 | Cinématique et optique | | **Cinématique et optique géométrique** |
| ISP-3018 | Gestion de ses interactions | | **Gestion de ses interactions au travail** |
| ISP-3023 | Formation à un métier | | **Formation à un métier semi-spécialisé** |
| EVR-5001 | Engagement vers ma réussite | | **Initiation à la démarche de formation** (programme Engagement vers sa réussite) |
| SCE-5102 | | Et intégrer le monde du travail | **Poursuivre des études et intégrer le monde du travail** |
| ANG-3101 à 5103 | titres anglais | titres français | Le ministère affiche les **titres français** ; le générateur montre les deux |

## Erreurs de fond dans le document « Progression »

- **Compétences polyvalentes.** Le document dit que *Communiquer, Agir avec méthode, Coopérer* sont prescrites dans chaque cours. C'est faux :
  - la FBC compte **6 compétences polyvalentes** (communiquer, coopérer, agir avec méthode, raisonner avec logique, exercer sa créativité, exercer son sens critique et éthique) ;
  - la FBD compte **9 compétences transversales** (exploiter l'information, résoudre des problèmes, exercer son jugement critique, mettre en œuvre sa pensée créatrice, se donner des méthodes de travail efficaces, exploiter les TIC, actualiser son potentiel, coopérer, communiquer de façon appropriée) ;
  - dans les deux cas, **chaque cours n'en retient que certaines**.
- **Francisation et français langue seconde** sont deux programmes distincts : francisation = LAN-1019 à LAN-5089 (niveaux 1 à 8) ; français, langue seconde = FRE-3101 à FRE-4103.
- **DHS** : le nom officiel est **Développement des habiletés spécifiques** (codes temporaires DHS-Z001 psychomotrices, Z002 expression, Z003 relationnelles, Z004 cognitives ; document administratif 2026-2027, annexe V). Il n'y a pas de programme d'études publié : les contenus suivent le plan d'intervention.

## Ce qui reste à valider

- Les **extraits tirés du rapport Perplexity** (130 sigles) portent la mention « Extrait à valider dans la DDE » dans le générateur : certains passages ont été mal extraits des PDF (critères coupés, phrases tronquées). Les lignes brouillées ont été retirées.
- Deux titres de la page officielle contiennent des coquilles du ministère (« géomatrique » pour MAT-4153, « Creation d'un base » pour INF-5072) : le générateur affiche l'orthographe corrigée.

## Ce que le générateur contient maintenant

- **256 sigles**, dont 196 avec le lien direct vers leur DDE officielle.
- La **progression** : pour chaque sigle, le sigle d'avant et celui d'après, cliquables.
- L'étape « L'universel » enrichie : situations de vie, compétences polyvalentes ou transversales, fonctions exécutives, pratiques probantes.
- Trois nouvelles tâches : planifier une séquence progressive, planifier un co-enseignement, relier la planification au projet d'engagement.
- Dans la page Ressources, la nouvelle section « Ce qui est commun à toutes les matières » : la matrice FGA, CUA, pratiques probantes et fonctions exécutives, avec des liens vérifiés.

## Mise à jour du 9 novembre : un extrait pour chaque sigle

- Les **199 définitions du domaine d'évaluation (DDE)** officielles ont été téléchargées et lues. Pour chaque sigle qui n'avait pas d'extrait (français langue seconde, English Language Arts, intégration socioprofessionnelle, Engagement vers sa réussite, développement de la personne, informatique…), le générateur ajoute maintenant les **éléments essentiels et les critères d'évaluation tirés de la DDE**.
- Les extraits du rapport Perplexity qui avaient une DDE ont été remplacés par la DDE officielle ; il reste 32 extraits du rapport, sans DDE publiée (surtout en formation de base commune), marqués « à valider ».
- **MAT-4261 à 4263** : même cours que MAT-4161 à 4163 (le programme et la DDE n'utilisent pas le même code).
- **PER-2101 et PER-2102** : pas de DDE ; extrait tiré du programme d'études officiel. Le programme affiche encore l'ancien code SAN-2102 pour Santé et sexualité ; le répertoire 2026-2027 utilise PER-2102.
- La Boussole classait les FRE en « Francisation » : ce sont des cours de **français, langue seconde**, un programme distinct de la francisation (LAN).
- Résultat : **256 sigles, tous avec un extrait**, et un menu « Parcourir par matière » qui les affiche tous.
