# Focus FGA — « Teams : entrez dans l'équipe »

Bande-annonce de 2 min (1920×1080, 30 i/s) pour lancer la CoP pédagonumérique du CFGA de la Jonquière.
Construite avec [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP + Three.js → MP4).

## Modifier un texte
Tous les textes (10 pépites, irritants, carte finale) sont en haut de `video/build.mjs`.

```bash
cd focus-fga && npm install            # une seule fois
cd video && node build.mjs             # régénère index.html
npx hyperframes check                  # validation
npx hyperframes render -q high -o renders/focus-fga.mp4
```

## Séquencier (≈120 s)
| Temps | Scène |
|---|---|
| 0–3,5 | Machine à écrire « CFGA de la Jonquière · mardi, 8 h 12 » |
| 3,5–13,5 | Corridor / escalier (footage) + voix de trailer en texte |
| 13,5–19,5 | 3 irritants « slam » — **à remplacer par tes vox pop de profs dans CapCut** |
| 19,5–24 | Enseigne « La réussite, notre priorité » — « Cette année, on change de jeu » |
| 24–32 | Titre 3D FOCUS FGA + anneau de pépites d'or |
| 32–102 | Compte à rebours des 10 pépites (7 s chacune) |
| 102–110,5 | Murale « Je laisse ma trace » — « Le film, on le fait ensemble » |
| 110,5–120 | Carte finale CoP pédagonumérique |

## Finition dans CapCut
- Musique : piste épique/trailer, avec des « hits » à 13,5 s, 24 s, 95 s (pépite #1) et 110,5 s.
- Captures d'écran Teams : en incrustation (PiP) dans la moitié gauche, par-dessus la pépite d'or, de s+3 à s+6,5 (s = 32 + 7 × rang).
- Vox pop des profs : remplacent les cartes 13,5–19,5 s.
