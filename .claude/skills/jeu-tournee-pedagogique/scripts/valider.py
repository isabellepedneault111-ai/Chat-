"""Vérifie un fichier de configuration de jeu avant la construction.
Usage : python3 valider.py config.json
Affiche les ERREURS (bloquantes) et les AVERTISSEMENTS (à regarder), puis une estimation de durée."""
import json, sys, os

DECORS = ["cafe", "depanneur", "magasin", "epicerie", "cinema", "restaurant", "arena", "grande-surface", "pharmacie",
          "centre-commercial", "maison-halloween", "ecole", "bibliotheque", "parc", "banque", "clinique", "maison", "cuisine", "gare", "casse-croute", "cafeteria", "planete", "station-spatiale", "observatoire", "lancement", "base-lunaire", "tour-controle", "atelier-robot", "constellation", "asteroides", "cockpit"]
TYPES = {"droite": ["a", "p"], "tri": ["boites", "etiquettes"], "jetons": ["articles"], "qcm": ["choix", "bonne"],
         "num": ["accepteMin", "accepteMax"], "assez": ["budget", "reponse"], "ordre": ["etapes"],
         "curseur": ["min", "max", "accepteMin", "accepteMax"], "vf": ["reponse"], "erreur": ["lignes", "fausses"], "texte": []}
VISUELS = {"comparer", "tableauNutritif", "droite", "recu", "recuArrondi", "billets", "taxes", "grand", "colonnes", "mascotte", "decor", "image", "html"}

def valider(cfg):
    err, warn = [], []
    for k in ["id", "titre", "enseignant", "niveaux", "elements", "stations", "questions"]:
        if k not in cfg: err.append(f"Champ obligatoire manquant : {k}")
    if err: return err, warn
    nivs = [n["id"] for n in cfg["niveaux"]]
    if not 1 <= len(nivs) <= 4: warn.append("Le moteur est pensé pour 3 niveaux (de 1 à 4 fonctionnent).")
    els = [e["id"] for e in cfg["elements"]]
    for e in cfg["elements"]:
        if len(e.get("descripteurs", [])) != 4: err.append(f"Élément {e['id']} : il faut 4 descripteurs (échelle 1 à 4).")
    trucs, caps = cfg.get("trucs", {}), cfg.get("capsules", {})
    def vis_ok(v, ou):
        if v is None or isinstance(v, str): return
        if v.get("type") not in VISUELS: err.append(f"{ou} : visuel de type inconnu « {v.get('type')} ».")
        if v.get("type") == "html" and not v.get("dit"): warn.append(f"{ou} : visuel html sans « dit » (il ne sera pas lu à voix haute).")
        if v.get("type") == "comparer" and len(v.get("tableaux", [])) < 2: err.append(f"{ou} : « comparer » demande au moins 2 tableaux.")
        if v.get("type") == "decor" and v.get("decor") not in DECORS: err.append(f"{ou} : décor inconnu « {v.get('decor')} ».")
    for k, c in caps.items():
        if not c.get("scenes"): err.append(f"Capsule {k} : aucune scène.")
        for i, s in enumerate(c.get("scenes", [])):
            if not s.get("texte"): err.append(f"Capsule {k}, scène {i+1} : texte manquant.")
            vis_ok(s.get("visuel"), f"Capsule {k}, scène {i+1}")
    for k, t in trucs.items():
        if not t.get("lignes"): err.append(f"Truc {k} : lignes manquantes.")
        vis_ok(t.get("visuel"), f"Truc {k}")
    for n in cfg["niveaux"]:
        for k in (n.get("intro") or {}).get("capsules", []):
            if k not in caps: err.append(f"Niveau {n['id']} : capsule d’introduction inconnue « {k} ».")
    st = cfg["stations"]
    for i, s in enumerate(st):
        if s.get("niveau") not in nivs: err.append(f"Station {i} ({s.get('nom')}) : niveau inconnu.")
        if s.get("decor") not in DECORS: err.append(f"Station {i} ({s.get('nom')}) : décor inconnu « {s.get('decor')} ». Choix : {', '.join(DECORS)}")
        for k in s.get("capsules") or []:
            if k not in caps: err.append(f"Station {i} : capsule inconnue « {k} ».")
        if len(s.get("court") or s.get("nom", "")) > 16: warn.append(f"Station {i} : ajoute un « court » (16 caractères max) pour la carte.")
    ordre_niv = [nivs.index(s["niveau"]) for s in st if s.get("niveau") in nivs]
    if ordre_niv != sorted(ordre_niv): warn.append("Les stations ne vont pas du premier au dernier niveau dans l’ordre.")
    ids, prev = set(), -1
    for i, q in enumerate(cfg["questions"]):
        o = f"Question {i+1} ({q.get('id')})"
        if q.get("id") in ids: err.append(f"{o} : id en double.")
        ids.add(q.get("id"))
        t = q.get("type")
        if t not in TYPES: err.append(f"{o} : type inconnu « {t} ». Types : {', '.join(TYPES)}"); continue
        for k in TYPES[t]:
            if k not in q: err.append(f"{o} : champ « {k} » obligatoire pour le type {t}.")
        for k in ["station", "element", "titre", "resume", "explication"]:
            if k not in q: err.append(f"{o} : champ « {k} » manquant.")
        if not isinstance(q.get("station"), int) or not 0 <= q.get("station", -1) < len(st): err.append(f"{o} : station invalide.")
        elif q["station"] < prev: err.append(f"{o} : les questions doivent suivre l’ordre des stations.")
        else: prev = q["station"]
        if q.get("element") not in els: err.append(f"{o} : élément de grille inconnu « {q.get('element')} ».")
        if q.get("truc") and q["truc"] not in trucs: err.append(f"{o} : truc inconnu « {q['truc']} ».")
        if t != "texte" and not q.get("truc"): warn.append(f"{o} : pas de « truc » (indice) associé.")
        if t == "qcm" and not 0 <= q.get("bonne", -1) < len(q.get("choix", [])): err.append(f"{o} : « bonne » hors des choix.")
        if t == "tri":
            for e in q.get("etiquettes", []):
                if not 0 <= e[1] < len(q.get("boites", [])): err.append(f"{o} : étiquette « {e[0]} » vers une boîte inexistante.")
        if t == "ordre" and len(q.get("etapes", [])) < 3: warn.append(f"{o} : moins de 3 étapes.")
        if t == "erreur":
            for b in q.get("fausses", []):
                if not 0 <= b < len(q.get("lignes", [])): err.append(f"{o} : ligne fausse inexistante.")
        if t in ("num", "curseur") and q.get("accepteMin", 0) > q.get("accepteMax", 0): err.append(f"{o} : accepteMin > accepteMax.")
        if t == "curseur" and not (q.get("min", 0) <= q.get("accepteMin", 0) and q.get("accepteMax", 0) <= q.get("max", 0)): err.append(f"{o} : la plage acceptée sort du curseur.")
        if t == "droite" and not (q["a"] <= q["p"] <= q["a"] + 1): err.append(f"{o} : p doit être entre a et a+1.")
        vis_ok(q.get("visuel"), o)
        if not q.get("explication"): err.append(f"{o} : explication vide (une étape par ligne).")
        for k in ("articles",):
            for a in q.get(k) or []:
                if len(a) != 2: err.append(f"{o} : chaque article = [nom, prix].")
    for n in nivs:
        if not any(st[q["station"]]["niveau"] == n for q in cfg["questions"] if isinstance(q.get("station"), int) and q["station"] < len(st)):
            err.append(f"Le niveau {n} n’a aucune question.")
    for e in els:
        if not any(q.get("element") == e for q in cfg["questions"]): warn.append(f"L’élément « {e} » n’est évalué par aucune question.")
    if "unite" in cfg and not isinstance(cfg["unite"], str): err.append("« unite » doit être un texte (\"$\", \"g\", \"\" …).")
    for q in cfg["questions"]:
        if "unite" in q and not isinstance(q["unite"], str): err.append(f"Question {q.get('id')} : « unite » doit être un texte.")
    re_ = cfg.get("reinvest") or {}
    for k in ("defi", "creation"):
        if re_.get(k) and not (re_[k].get("teams") or re_.get("teams")): warn.append(f"reinvest.{k} : pas de « teams » (équipe et canal) — les étapes de publication seront génériques.")
    for a in cfg.get("autoeval", []):
        if a.get("element") not in els: err.append(f"Autoévaluation : élément inconnu « {a.get('element')} ».")
    return err, warn

def duree(cfg):
    sc = sum(len(c["scenes"]) for c in cfg.get("capsules", {}).values())
    x = len(cfg["questions"]) * 0.9 + sc * 0.3 + len(cfg["stations"]) * 0.3 + 2
    return int(x + 0.5)

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    err, warn = valider(cfg)
    for e in err: print("ERREUR :", e)
    for w in warn: print("Avertissement :", w)
    if "questions" in cfg: print(f"{len(cfg['questions'])} questions, {len(cfg.get('stations', []))} stations, durée estimée ≈ {duree(cfg)} min (prévu : {cfg.get('duree', '?')} min)")
    print("OK" if not err else f"{len(err)} erreur(s)")
    sys.exit(1 if err else 0)
