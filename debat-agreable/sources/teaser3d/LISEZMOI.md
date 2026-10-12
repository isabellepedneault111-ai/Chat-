# Bande-annonce 3D (60 s)

- `film.html` : scène three.js (0.160.0), personnages, caméras, textes, rendue image par image.
- `music.py` : trame trance 128 BPM synthétisée (numpy/scipy), puis `ffmpeg -af loudnorm=I=-10:TP=-1`.
- `rec.js` : capture Playwright → ffmpeg (`node rec.js video <de> <à> <sortie.mp4> <port>`).

Modèles 3D (non inclus ici, à placer dans `models/`), tirés des exemples three.js r160 :
`RobotExpressive.glb` (Tomás Laulhé, CC0), `Xbot.glb` et `Michelle.glb` (Mixamo).
Polices dans `fonts/` : Orbitron, Space Grotesk (OFL).
