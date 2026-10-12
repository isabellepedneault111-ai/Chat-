import json
BEAT = 0.6; BAR = 2.4  # 100 BPM
# (id, qui, durée en demi-mesures, texte tapé à l'écran)
S = [
 ("intro", "SYS", 2, ""),
 ("l1", "IA", 3, "ANALYSE EN COURS… DÉBAT DÉTECTÉ."),
 ("l2", "HUMAIN", 4, "Avez-vous déjà gagné un débat… et perdu un ami?"),
 ("l3", "IA", 5, "38 stratagèmes pour avoir toujours raison. Schopenhauer, 1830. Archivés."),
 ("l4", "HUMAIN", 3, "On les apprend… pour s'en protéger."),
 ("l5", "IA", 5, "Profils détectés :"),
 ("l6", "HUMAIN", 4, "Et le Bâtisseur : dur sur les idées, doux avec les gens."),
 ("l7", "IA", 4, "Si je vous comprends bien… gagner ne suffit pas?"),
 ("l8", "HUMAIN", 3, "Exactement. Tu viens de reformuler."),
 ("l9", "IA", 4, "Mise à jour : j'avais tort sur ce bout-là."),
 ("l10", "SYS", 5, ""),
 ("l11", "SYS", 6, ""),
]
CHAR = 0.032; TYPE_DELAY = 0.25
t = 0; out = []
for i, w, h, txt in S:
    d = h * BAR / 2
    out.append({"id": i, "who": w, "start": round(t, 3), "dur": d, "text": txt, "typeStart": round(t + TYPE_DELAY, 3), "char": CHAR})
    t += d
json.dump({"scenes": out, "total": round(t + 1.2, 3), "beat": BEAT}, open("timeline.json", "w"), ensure_ascii=False, indent=1)
print("total", t + 1.2)
