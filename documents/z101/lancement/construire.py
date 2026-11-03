# Assemble Lancement-Z101.html : polices, logo, diapos « Ça ou ça » et questions intégrées
import base64, json, html, pathlib
ici = pathlib.Path(__file__).parent
fonts = ici.parent / 'visuels' / 'fonts'
b64 = lambda p: base64.b64encode(p.read_bytes()).decode()
s = (ici / 'source.html').read_text()

OUCA = [
  ("Du ketchup sur la tourtière?", "Oui, toujours", "Jamais de la vie", ""),
  ("Un meuble IKEA à monter", "Je fonce sans plan", "Tuto YouTube d'abord", ""),
  ("Le matin", "Trois cafés avant de parler", "De bonne humeur à 8 h", ""),
  ("Ton café", "Tim Hortons", "McDo", ""),
  ("Au travail, je préfère…", "Être avec les clients", "Travailler en coulisses", "Indice : ça peut t'aider à choisir ton plateau!"),
  ("Devant une nouvelle tâche", "Une liste claire, étape par étape", "J'improvise en chemin", "Indice : ça peut t'aider à choisir ton plateau!"),
  ("En équipe", "Je prends les commandes", "J'aime suivre le plan", "Les deux sont essentiels dans une équipe."),
  ("Un samedi parfait", "Sortie entre amis", "Pyjama et série", ""),
  ("Pour jaser", "Texto", "Appel", ""),
  ("L'hiver au Saguenay", "J'adore la neige", "J'hiberne jusqu'en avril", ""),
  ("Le grand classique", "Poutine", "Pizza", ""),
  ("Ma chambre", "Je range tout de suite", "Je range… un jour", ""),
]
diapos = []
for q, g, d, ind in OUCA:
    e = html.escape
    diapos.append(f'''<section class="slide ouca" data-phase="2">
  <div class="q">{e(q)}</div>
  <div class="moitie g"><span class="fleche">← GAUCHE</span><b>{e(g)}</b></div>
  <div class="ou">OU</div>
  <div class="moitie d"><span class="fleche">DROITE →</span><b>{e(d)}</b></div>
  {f'<div class="indice">{e(ind)}</div>' if ind else ''}
</section>''')

QUESTIONS = [
  "Si tu devais dépenser 5 000 $ comptant avant minuit, tu achètes quoi?",
  "As-tu un talent caché?",
  "Quelle application utilises-tu le plus sur ton téléphone, à part les réseaux sociaux?",
  "Ta recette la plus bizarre, mais savoureuse?",
  "Un métier que tu aimerais essayer pour une seule journée?",
  "Ta chanson pour te donner de l'énergie?",
  "Ton endroit préféré au Saguenay–Lac-Saint-Jean?",
  "Si tu ouvrais une entreprise, elle vendrait quoi?",
  "Le meilleur repas que tu aies mangé?",
  "Une chose que tu pourrais montrer au groupe?",
  "Le plus beau compliment que tu aies reçu?",
  "Un superpouvoir pour une journée : lequel?",
  "Ton film ou ta série préférée de tous les temps?",
  "Quel animal te ressemble le plus? Pourquoi?",
  "Une petite chose qui rend ta journée meilleure?",
  "Si tu gagnais un voyage, tu partirais où?",
]
dents = ''.join(f'<rect x="-7" y="-47" width="14" height="18" rx="3" transform="rotate({a})"/>' for a in range(0, 360, 45))

remp = {
  '__MONT800__': b64(fonts / 'Montserrat-800-latin.woff2'),
  '__MONT700__': b64(fonts / 'Montserrat-700-latin.woff2'),
  '__MONT500__': b64(fonts / 'Montserrat-500-latin.woff2'),
  '__LEAGUE__': b64(fonts / 'LeagueGothic-400-latin.woff2'),
  '__LOGO__': b64(ici / 'logo-220.png'),
  '__OUCA__': '\n'.join(diapos),
  '__QUESTIONS__': json.dumps(QUESTIONS, ensure_ascii=False),
  '__DENTS__': dents,
}
for k, v in remp.items():
    assert k in s, k
    s = s.replace(k, v)
(ici / 'Lancement-Z101.html').write_text(s)
print('ok', len(s) // 1024, 'Ko')
