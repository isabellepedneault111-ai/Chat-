# Style des visuels Focus FGA

Guide pour refaire des visuels du même style sur un autre sujet. Une nouvelle session Claude Code peut le lire et reproduire le look tel quel.

## Recette en une phrase
Une image fixe de 1920×1080 en HTML, rendue en PNG avec HyperFrames. Fond bleu nuit avec une grille verte discrète, de gros titres condensés en majuscules, des cartes crème et des accents jaune et vert.

## Palette
| Rôle | Couleur |
|---|---|
| Fond | `#060B1C`, avec des halos radiaux `#13265A` (haut gauche) et `#1E3A1A` (bas droite) |
| Jaune (accent principal, citations) | `#F5C542`, avec le texte `#1A1400` dessus |
| Vert (sur-titres, étapes réussies) | `#6CB33F`, plus foncé : `#2F7A2A` |
| Bleu (mots en relief) | `#2456B0` |
| Cartes claires | `#F4F1E6`, avec le texte `#12131A` |
| Accents secondaires | `#4FA3FF` `#FF6B6B` `#B9A7FF` `#2DD4BF` `#FF8A3D` `#F472B6` |

## Typographie
- **Titres :** League Gothic, en MAJUSCULES, interligne serré (0.86 à 0.95).
- **Texte courant :** Montserrat, de 22 à 30 px.
- **Sur-titres :** Space Mono, en majuscules, espacement des lettres de 0.25 à 0.35 em, en vert.

## Briques réutilisables (copier depuis ces fichiers)
| Brique | Fichier modèle |
|---|---|
| Ligne du temps avec pastilles numérotées | `bio/index.html` (`.tl`, `.st`, `.dot`) |
| Grille de faits (chiffre géant + légende) | `bio/index.html` (`.facts`, `.fact`) |
| Étiquettes (pilules colorées) | `bio/index.html` (`.chips`, `.chip`) |
| Bloc citation jaune | `bio/index.html`, `accueil/index.html` (`.quote`) |
| Chemin en étapes avec trait dégradé | `accueil/index.html` (`.road`, `.steps`) |
| Grille de cartes avec icônes SVG | `copia/index.html` (`.cards`, `.card`) |
| Bandeau « compétence » jaune arrondi | `copia/index.html` |

## Faire un nouveau visuel
```bash
cd focus-fga/visuels
mkdir nouveau && cp bio/gsap.min.js bio/hyperframes.json nouveau/
# écrire nouveau/index.html (partir d'un modèle ci-dessus)
cd nouveau && npx hyperframes snapshot --at 1
# résultat : snapshots/frame-00-at-1s.png
```

## Règles de contenu (les préférences d'Isabelle)
- Des mots-clés, pas des phrases. Ce qui est à l'écran reste court.
- Un seul message fort par visuel, mis dans le bloc jaune.
- Des chiffres réels seulement, avec la source en petit au bas.
- Ne viser aucun département en particulier dans les exemples.
- Les exemples sont présentés comme des exemples, et c'est écrit.
