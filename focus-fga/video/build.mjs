// Génère index.html — Focus FGA « Teams : entrez dans l'équipe »
// Modifier les textes ici, puis : node build.mjs
import { writeFileSync } from "node:fs";

const BLUE = "#2456B0";
const GREEN = "#6CB33F";
const GOLD = "#F5C542";

// Compte à rebours : #10 → #1 (7 s chacune, à partir de 32 s)
const PEPITES = [
  { n: 10, tag: "Esprit critique", irritant: "« Ils copient le premier site venu. »", title: ["Progrès", "en recherche"], benefit: "Des sources fiables, une démarche visible : tu vois comment l'élève cherche.", color: GREEN },
  { n: 9, tag: "Communication orale", irritant: "« Ils stressent pour leur exposé. »", title: ["Le coach", "de présentation"], benefit: "Débit, tics de langage, intonation : une rétroaction privée, générée par l'IA.", color: "#FF6B6B" },
  { n: 8, tag: "Formation à distance", irritant: "« Il n'a pas pu venir au cours. »", title: ["Tableau blanc", "enregistré"], benefit: "En direct, en interaction, puis en réécoute. Astuce : partage la fenêtre Whiteboard.", color: "#22C7D6" },
  { n: 7, tag: "Autonomie", irritant: "« Il bloque le soir, seul devant ses exercices. »", title: ["Copilot :", "étudier et apprendre"], benefit: "Un tuteur qui guide sans donner la réponse. Pour les 13 ans et plus.", color: "#9B8CFF" },
  { n: 6, tag: "Individualisation", irritant: "« Chacun avance à son rythme… et moi je cours. »", title: ["Learning", "Zone"], benefit: "Micro-leçons, questionnaires, appariements : intégrés aux devoirs, ajustés à l'élève.", color: "#4FA3FF" },
  { n: 5, tag: "Évaluation", irritant: "« Encore mes grilles papier… »", title: ["Grilles", "générées par IA"], benefit: "L'IA propose la grille à partir de ta consigne. Tu valides. Tes notes deviennent une rétroaction claire.", color: "#FF8A3D" },
  { n: 4, tag: "Bien-être", irritant: "« Je ne l'ai pas vu décrocher. »", title: ["Reflect"], benefit: "Un check-in émotionnel en deux clics. Tu vois qui a besoin de toi.", color: "#F472B6" },
  { n: 3, tag: "Inclusion", irritant: "« Tu peux me lire ça? »", title: ["Le lecteur", "immersif"], benefit: "Lecture à voix haute, syllabes, traduction : chacun lit à sa façon.", color: "#2DD4BF" },
  { n: 2, tag: "Lecture", irritant: "« Je n'ai pas le temps d'écouter tout le monde lire. »", title: ["Progrès", "en lecture"], benefit: "L'élève lit, l'IA écoute, repère les mots difficiles et crée la pratique sur mesure.", color: "#FFB020" },
  { n: 1, tag: "Intégrité", irritant: "« Est-ce qu'on a le droit d'utiliser l'IA? »", title: ["L'IA permise,", "devoir par devoir"], benefit: "Pour chaque devoir, tu choisis le niveau d'IA permis : d'aucune IA à Copilot au complet.", color: GOLD },
];

const P0 = 38; // début du compte à rebours
const PD = 14; // durée par pépite (place pour la voix off)
const TC = P0 + 10 * PD; // convergence + murale
const TE = TC + 8.5; // carte finale
const TT = TE + 9.5; // durée totale

const QUOTES = [
  { text: "T'as-tu mon document?", who: "Prof n° 1 · 8 h 13", bg: BLUE },
  { text: "C'était quoi, déjà, le lien?", who: "Prof n° 2 · 8 h 14", bg: "#2F7A2A" },
  { text: "Je l'ai envoyé… mais je sais pu où.", who: "Prof n° 3 · 8 h 15", bg: "#0B0F1E" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const chars = (s, cls) =>
  [...s].map((c) => `<span class="${cls}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");

const logoSvg = (id) => `
<svg id="${id}" class="logo" viewBox="0 0 200 200" aria-label="CFGA de la Jonquière">
  <path class="logo-arc" d="M122.8 15 A88 88 0 1 1 23.8 144" fill="none" stroke="${GREEN}" stroke-width="9" stroke-linecap="round" pathLength="1"/>
  <text x="70" y="64" class="logo-word">CFGA</text>
  <g class="logo-bldg">
    <rect x="30" y="72" width="128" height="58" rx="2" fill="${BLUE}"/>
    ${[0, 1]
      .map((r) =>
        Array.from({ length: 7 }, (_, c) => `<rect x="${37 + c * 17}" y="${78 + r * 18}" width="11" height="13" fill="#fff"/>`).join(""),
      )
      .join("")}
    ${Array.from({ length: 7 }, (_, c) => `<rect x="${37 + c * 17}" y="114" width="11" height="16" fill="#fff"/>`).join("")}
  </g>
  <text x="96" y="157" text-anchor="middle" class="logo-sub">DE LA JONQUIÈRE</text>
</svg>`;

const pepiteHtml = PEPITES.map((p, i) => {
  const s = P0 + i * PD;
  return `
    <div id="pbg${i}" class="clip scene pbg" data-start="${s}" data-duration="${PD}" data-track-index="2" style="--c:${p.color}">
      <div class="pglow"></div>
      <div class="pnum">${p.n}</div>
    </div>
    <div id="ptx${i}" class="clip scene ptx" data-start="${s}" data-duration="${PD}" data-track-index="6" style="--c:${p.color}">
      <div class="pcol">
        <div class="pkick"><span class="pk-n">PÉPITE #${String(p.n).padStart(2, "0")}</span><span class="pk-sep"></span><span class="pk-tag">${esc(p.tag.toUpperCase())}</span></div>
        <div class="pirr"><span class="pirr-t">${esc(p.irritant)}</span><span class="pirr-x"></span></div>
        <h2 class="ptitle">${p.title.map((l) => `<span class="pline"><span class="pline-in">${esc(l)}</span></span>`).join("")}</h2>
        <p class="pben">${esc(p.benefit)}</p>
      </div>
    </div>`;
}).join("");

const quoteHtml = QUOTES.map(
  (q, i) => `
    <div id="q${i}" class="clip scene quote" data-start="${13.5 + i * 2}" data-duration="2" data-track-index="6" style="background:${q.bg}B8">
      <div class="q-in">
        <div class="q-text">${esc(q.text)}</div>
        <div class="q-who">— ${esc(q.who)}</div>
      </div>
    </div>`,
).join("");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="assets/vendor/gsap.min.js"></script>
<script type="importmap">
{ "imports": {
  "three": "./assets/vendor/three.module.js"
} }
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #050816; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #050816; font-family: Montserrat, sans-serif; color: #fff; }
  .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
  .layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .mono { font-family: "Space Mono", monospace; }
  .disp { font-family: "League Gothic", sans-serif; font-weight: 400; text-transform: uppercase; letter-spacing: 0.01em; }

  /* Fond permanent */
  #bg { z-index: 0; background: radial-gradient(1200px 700px at 30% 40%, #0E1B3D 0%, #050816 70%); }
  #bg-grid { z-index: 0; opacity: 0.18; background-image: linear-gradient(rgba(108,179,63,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(108,179,63,.25) 1px, transparent 1px); background-size: 80px 80px; }

  /* Footage */
  .vwrap { z-index: 1; overflow: hidden; }
  .vwrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .dim { z-index: 2; background: radial-gradient(1200px 700px at 50% 45%, rgba(5,8,22,.25), rgba(5,8,22,.7)); }
  .shade { z-index: 6; background: linear-gradient(180deg, rgba(5,8,22,.15) 0%, rgba(5,8,22,.25) 55%, rgba(5,8,22,.85) 100%); }
  .bars { z-index: 9; }
  .bars::before, .bars::after { content: ""; position: absolute; left: 0; right: 0; height: 120px; background: #000; }
  .bars::before { top: 0; } .bars::after { bottom: 0; }

  /* Canvas 3D */
  #three { z-index: 5; }
  #three canvas { width: 100%; height: 100%; display: block; }

  /* 1. Ouverture */
  #open { z-index: 10; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
  #open .l1 { font-size: 46px; letter-spacing: 0.12em; color: #fff; }
  #open .l2 { font-size: 30px; letter-spacing: 0.3em; color: ${GREEN}; }
  #open .caret { display: inline-block; width: 22px; height: 44px; background: ${GREEN}; vertical-align: middle; margin-left: 8px; }

  /* Textes de trailer */
  .trailer { z-index: 10; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 190px; }
  .tline { opacity: 0; position: absolute; left: 0; right: 0; bottom: 190px; text-align: center; font-size: 112px; line-height: 1; text-shadow: 0 6px 40px rgba(0,0,0,.6); }
  .tline em { font-style: normal; color: ${GREEN}; }

  /* Irritants */
  .quote { z-index: 10; display: flex; align-items: center; justify-content: center; }
  .q-in { width: 1500px; }
  .q-text { font-family: "League Gothic", sans-serif; font-size: 210px; line-height: 0.92; text-transform: uppercase; }
  .q-who { margin-top: 36px; font-family: "Space Mono", monospace; font-size: 30px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,.75); }

  /* Titre */
  #title { z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  #title .pre { font-size: 26px; letter-spacing: 0.4em; color: rgba(255,255,255,.8); margin-bottom: 10px; }
  #title .big { display: flex; gap: 40px; font-size: 330px; line-height: 0.9; }
  #title .big .w2 { color: ${GREEN}; }
  #title .ch { display: inline-block; }
  #title .sub { margin-top: 26px; font-size: 40px; letter-spacing: 0.18em; }
  #title .chip { margin-top: 30px; padding: 12px 28px; border: 2px solid ${GOLD}; color: ${GOLD}; font-size: 24px; letter-spacing: 0.3em; border-radius: 999px; }

  /* Pépites */
  .pbg { z-index: 2; }
  .pglow { position: absolute; left: -200px; top: 40px; width: 1300px; height: 1000px; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in srgb, var(--c) 45%, transparent), transparent 75%); }
  .pnum { position: absolute; right: 70px; top: 120px; font-family: "League Gothic", sans-serif; font-size: 780px; line-height: 0.85; color: var(--c); opacity: 0.1; }
  .ptx { z-index: 10; display: flex; align-items: center; justify-content: flex-end; padding-right: 130px; }
  .pcol { width: 900px; }
  .pkick { display: flex; align-items: center; gap: 18px; font-family: "Space Mono", monospace; font-size: 26px; letter-spacing: 0.2em; }
  .pk-n { color: var(--c); font-weight: 700; }
  .pk-sep { display: block; width: 60px; height: 2px; background: rgba(255,255,255,.5); }
  .pk-tag { color: rgba(255,255,255,.85); }
  .pirr { position: relative; display: inline-block; margin-top: 34px; font-family: "Space Mono", monospace; font-size: 32px; color: rgba(255,255,255,.9); }
  .pirr-x { position: absolute; left: -6px; right: -6px; top: 52%; height: 5px; background: var(--c); transform-origin: left center; display: block; }
  .ptitle { margin-top: 26px; font-family: "League Gothic", sans-serif; font-weight: 400; font-size: 150px; line-height: 0.9; text-transform: uppercase; }
  .pline { display: block; overflow: hidden; padding-bottom: 6px; }
  .pline-in { display: block; }
  .pline:last-child .pline-in { color: var(--c); }
  .pben { margin-top: 30px; font-size: 36px; line-height: 1.35; font-weight: 400; color: rgba(255,255,255,.92); max-width: 860px; }

  /* Murale */
  #mural-tx .tline { font-size: 100px; }

  /* Fin */
  #end { z-index: 10; display: flex; align-items: center; justify-content: center; gap: 90px; }
  #end .logo { width: 400px; height: 400px; display: block; }
  .logo-word { font-family: Montserrat, sans-serif; font-weight: 900; font-size: 34px; fill: #fff; }
  .logo-sub { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 15px; fill: #fff; letter-spacing: 0.02em; }
  #end .ecol { width: 980px; }
  #end .ek { font-size: 26px; letter-spacing: 0.35em; color: ${GOLD}; }
  #end .et { margin-top: 18px; font-size: 190px; line-height: 0.88; }
  #end .et .g { color: ${GREEN}; }
  #end .ecta { margin-top: 34px; display: inline-block; padding: 18px 36px; background: ${GREEN}; color: #06120A; font-weight: 900; font-size: 34px; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 6px; }
  #end .esig { margin-top: 30px; font-size: 24px; letter-spacing: 0.2em; color: rgba(255,255,255,.7); }

  #gag { z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 140px; }
  #gag .g-k { font-size: 26px; letter-spacing: .3em; color: #6CB33F; }
  #gag .g-q { margin-top: 26px; font-size: 150px; line-height: .95; color: #fff; }
  #gag .g-a { position: absolute; left: 0; right: 0; top: 50%; margin-top: -110px; font-size: 230px; line-height: 1; color: #F5C542; opacity: 0; }
  .mk { z-index: 8; opacity: 0; }
  .mk-frame { position: absolute; left: 80px; top: 300px; width: 740px; height: 430px; border-radius: 22px; overflow: hidden; border: 4px solid var(--c); background: #F6F7FB; color: #1B2240; box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 60px color-mix(in srgb, var(--c) 40%, transparent); transform: perspective(1500px) rotateY(12deg); font-family: Montserrat, sans-serif; }
  .mk-bar { height: 44px; background: #E9ECF4; display: flex; align-items: center; gap: 12px; padding: 0 18px; font-size: 16px; font-weight: 700; color: #2B3150; }
  .mk-bar i { display: block; width: 12px; height: 12px; border-radius: 50%; background: var(--c); }
  .mk-body { padding: 18px 26px; }
  .mk-h { font-size: 25px; font-weight: 900; margin-bottom: 12px; }
  .mk-row { display: grid; grid-template-columns: 200px 200px 1fr; align-items: center; gap: 14px; margin: 9px 0; font-size: 15px; }
  .mk-row b { font-size: 16px; }
  .mk-row em { font-style: normal; color: #4A5370; font-size: 14px; }
  .mk-g { height: 14px; border-radius: 8px; background: #DDE2EE; position: relative; overflow: hidden; }
  .mk-fill { position: absolute; left: 0; top: 0; height: 14px; width: 200px; border-radius: 8px; transform-origin: left center; display: block; }
  .mk-tip { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #FFF4D6; font-size: 15px; color: #5A4500; }
  .rf-faces { display: flex; gap: 14px; margin-top: 4px; }
  .rf { width: 118px; padding: 10px 6px; border-radius: 14px; background: #fff; text-align: center; box-shadow: 0 2px 8px rgba(20,30,60,.08); }
  .rf svg { width: 54px; height: 54px; display: block; margin: 0 auto; }
  .rf span { display: block; margin-top: 6px; font-size: 13px; font-weight: 700; }
  .rf b { display: block; margin-top: 4px; font-size: 26px; color: var(--f); }
  .rf-alert { margin-top: 16px; padding: 12px 16px; border-radius: 12px; background: #1B2240; color: #fff; font-size: 17px; }
  .rf-alert b { color: #F472B6; }
  .rf-alert u { color: #9FD3FF; }
  .li-tools { display: flex; gap: 8px; }
  .li-tools span { padding: 7px 12px; border-radius: 999px; background: #E9ECF4; font-size: 14px; font-weight: 700; }
  .li-tools span.on { background: #0F766E; color: #fff; }
  .li-txt { margin-top: 20px; font-family: "Open Sans", sans-serif; font-size: 34px; line-height: 1.6; letter-spacing: .02em; }
  .lw { padding: 0 4px; border-radius: 6px; }
  .lw i { font-style: normal; color: #E8590C; opacity: 0; }
  .li-tr { margin-top: 18px; padding: 12px 16px; border-radius: 12px; background: #E6FFFA; font-size: 18px; opacity: 0; }
  .li-tr b { display: block; font-size: 13px; color: #0F766E; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 4px; }
  .pl-top { display: flex; gap: 16px; }
  .pl-top div { flex: 1; padding: 10px 14px; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(20,30,60,.08); }
  .pl-top b { font-size: 34px; font-weight: 900; color: #B26A00; }
  .pl-top small { font-size: 20px; color: #B26A00; font-weight: 900; }
  .pl-top span { display: block; font-size: 13px; color: #4A5370; font-weight: 700; }
  .pl-txt { margin-top: 16px; font-size: 20px; line-height: 1.6; }
  .pl-x { border-bottom: 3px solid transparent; }
  .pl-gen { margin-top: 14px; padding: 10px 14px; border-radius: 12px; background: #1B2240; color: #fff; font-size: 16px; opacity: 0; }
  .pl-gen b { display: block; font-size: 12px; letter-spacing: .12em; color: #FFB020; text-transform: uppercase; margin-bottom: 3px; }
  #wbp { z-index: 8; opacity: 0; }
  .wb-frame { position: absolute; left: 80px; top: 300px; width: 740px; height: 416px; border-radius: 22px; overflow: hidden; border: 4px solid #22C7D6; box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(34,199,214,.35); transform: perspective(1500px) rotateY(12deg); }
  .wb-frame video { width: 100%; height: 100%; object-fit: cover; display: block; }
  #flash { z-index: 50; background: #fff; opacity: 0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TT}" data-width="1920" data-height="1080">

  <div id="bg" class="layer"></div>
  <div id="bg-grid" class="layer"></div>

  <!-- FOOTAGE -->

  <!-- FOOTAGE STABILISÉ -->
  <div id="vw-a" class="layer vwrap"><video id="v-a" class="clip" src="assets/corridor-stab.mp4" muted playsinline data-start="3.5" data-duration="3.3" data-media-start="6.0" data-track-index="1"></video></div>
  <div id="vw-b" class="layer vwrap"><video id="v-b" class="clip" src="assets/corridor-stab.mp4" muted playsinline data-start="6.8" data-duration="6.7" data-media-start="10.4" data-track-index="1"></video></div>
  <div id="vw-c" class="layer vwrap"><video id="v-c" class="clip" src="assets/corridor-stab.mp4" muted playsinline data-start="19.5" data-duration="4.5" data-media-start="0.3" data-playback-rate="0.8" data-track-index="1"></video></div>
  <div id="vw-d" class="layer vwrap"><video id="v-d" class="clip" src="assets/murale.mp4" muted playsinline data-start="${TC}" data-duration="8.5" data-media-start="0" data-playback-rate="0.66" data-track-index="1"></video></div>
  <div id="dim-a" class="clip layer dim" data-start="3.5" data-duration="10" data-track-index="2"></div>
  <div id="dim-b" class="clip layer dim" data-start="19.5" data-duration="4.5" data-track-index="2"></div>
  <div id="dim-c" class="clip layer dim" data-start="${TC}" data-duration="8.5" data-track-index="2"></div>

  <div id="shade-a" class="clip layer shade" data-start="3.5" data-duration="10" data-track-index="3"></div>
  <div id="shade-b" class="clip layer shade" data-start="19.5" data-duration="4.5" data-track-index="3"></div>
  <div id="shade-c" class="clip layer shade" data-start="${TC}" data-duration="8.5" data-track-index="3"></div>
  <div id="bars-a" class="clip layer bars" data-start="3.5" data-duration="10" data-track-index="4"></div>
  <div id="bars-b" class="clip layer bars" data-start="19.5" data-duration="4.5" data-track-index="4"></div>
  <div id="bars-c" class="clip layer bars" data-start="${TC}" data-duration="8.5" data-track-index="4"></div>

  <!-- PÉPITES (fonds) -->
  ${pepiteHtml.split("\n").filter((l) => true).join("\n")}

  <!-- 3D -->
  <div id="three" class="layer"><canvas id="three-c" width="1920" height="1080"></canvas></div>

  <!-- 1. OUVERTURE -->
  <div id="open" class="clip scene" data-start="0" data-duration="3.5" data-track-index="6">
    <div class="l1 mono">${chars("CFGA DE LA JONQUIÈRE", "oc1")}<span class="caret"></span></div>
    <div class="l2 mono">${chars("MARDI · 8 H 12", "oc2")}</div>
  </div>

  <!-- 2. TRAILER CORRIDOR -->
  <div id="corr-tx" class="clip scene trailer" data-start="3.5" data-duration="10" data-track-index="6">
    <div id="tl1" class="tline disp" data-layout-allow-overlap>Dans un monde…</div>
    <div id="tl2" class="tline disp" data-layout-allow-overlap>…où les <em>feuilles volantes</em> règnent…</div>
    <div id="tl3" class="tline disp" data-layout-allow-overlap>…et où personne ne retrouve <em>le lien</em>.</div>
  </div>

  <!-- 3. IRRITANTS -->
  ${quoteHtml}

  <!-- 4. ENSEIGNE -->
  <div id="sign-tx" class="clip scene trailer" data-start="19.5" data-duration="4.5" data-track-index="6">
    <div id="sl1" class="tline disp" data-layout-allow-overlap>Cette année…</div>
    <div id="sl2" class="tline disp" data-layout-allow-overlap>…on change <em>de jeu</em>.</div>
  </div>

  <!-- 5. TITRE -->
  <div id="title" class="clip scene" data-start="24" data-duration="8" data-track-index="6">
    <div class="pre mono">CFGA DE LA JONQUIÈRE PRÉSENTE</div>
    <div class="big disp"><span class="w1">${chars("FOCUS", "ch")}</span><span class="w2">${chars("FGA", "ch")}</span></div>
    <div class="sub mono">TEAMS : ENTREZ DANS L'ÉQUIPE</div>
    <div class="chip mono">10 PÉPITES · 2 MINUTES</div>
  </div>

  <!-- GAG : TEAMS, C'EST PAS JUSTE POUR LES RÉUNIONS? -->
  <div id="gag" class="clip scene" data-start="32" data-duration="6" data-track-index="6">
    <div class="g-k mono">PENDANT CE TEMPS, QUELQUE PART AU CFGA…</div>
    <div class="g-q disp">« Teams, c'est pas juste pour les réunions, ça?! »</div>
    <div class="g-a disp">Attends de voir.</div>
  </div>


  <!-- ÉCRANS DE DÉMO EN FRANÇAIS -->
  <div id="mk1" class="layer mk" style="--c:#FF6B6B"><div class="mk-frame"><div class="mk-bar"><i></i><span>Coach de présentation · Rapport de répétition</span></div><div class="mk-body">
    <div class="mk-h">Ta répétition · 2 min 14 s</div>
    <div class="mk-row"><b>Débit</b><div class="mk-g"><span class="mk-fill" style="--w:.72;background:#2E7D32"></span></div><em>152 mots/min · bon rythme</em></div>
    <div class="mk-row"><b>Mots de remplissage</b><div class="mk-g"><span class="mk-fill" style="--w:.55;background:#E8590C"></span></div><em>« euh » × <span class="cnt" data-to="7">0</span> · « genre » × <span class="cnt" data-to="3">0</span></em></div>
    <div class="mk-row"><b>Intonation</b><div class="mk-g"><span class="mk-fill" style="--w:.8;background:#2E7D32"></span></div><em>variée, ça garde l'attention</em></div>
    <div class="mk-row"><b>Lecture de la diapo</b><div class="mk-g"><span class="mk-fill" style="--w:.3;background:#C62828"></span></div><em>2 fois : regarde ton public</em></div>
    <div class="mk-tip">Conseil : fais une courte pause au lieu de dire « euh ».</div>
  </div></div></div>

  <div id="mk6" class="layer mk" style="--c:#F472B6"><div class="mk-frame"><div class="mk-bar"><i></i><span>Reflect · Check-in de la semaine</span></div><div class="mk-body">
    <div class="mk-h">Comment te sens-tu aujourd'hui?</div>
    <div class="rf-faces">
      <div class="rf" style="--f:#2E7D32"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="var(--f)"/><circle cx="21" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path d="M18 36 Q30 48 42 36" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span>Fier·ère</span><b class="cnt" data-to="6">0</b></div>
      <div class="rf" style="--f:#1E88E5"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="var(--f)"/><circle cx="21" cy="26" r="3.5" fill="#fff"/><circle cx="39" cy="26" r="3.5" fill="#fff"/><path d="M20 39 H40" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg><span>Calme</span><b class="cnt" data-to="8">0</b></div>
      <div class="rf" style="--f:#8E7CC3"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="var(--f)"/><path d="M16 26 H26 M34 26 H44" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M22 40 Q30 36 38 40" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span>Fatigué·e</span><b class="cnt" data-to="5">0</b></div>
      <div class="rf" style="--f:#E8590C"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="var(--f)"/><circle cx="21" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path d="M19 41 L24 37 L30 41 L36 37 L41 41" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg><span>Stressé·e</span><b class="cnt" data-to="4">0</b></div>
      <div class="rf" style="--f:#C62828"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="var(--f)"/><circle cx="21" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path d="M18 43 Q30 32 42 43" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span>Découragé·e</span><b class="cnt" data-to="1">0</b></div>
    </div>
    <div class="rf-alert"><b>3 élèves</b> aimeraient te parler cette semaine · <u>Voir qui</u></div>
    <div class="mk-tip">Visible seulement par toi. 24 réponses sur 26.</div>
  </div></div></div>

  <div id="mk7" class="layer mk" style="--c:#2DD4BF"><div class="mk-frame"><div class="mk-bar"><i></i><span>Lecteur immersif</span></div><div class="mk-body li">
    <div class="li-tools"><span class="on">▶ Lire à voix haute</span><span>Syllabes</span><span>Parties du discours</span><span>Traduire</span></div>
    <div class="li-txt">${["Cal·cu·le","le","coût","to·tal","si","tu","u·ti·li·ses","150","Mo","ce","mois-ci."].map((w, i) => `<span class="lw" data-k="${i}">${w.replace(/·/g, '<i>·</i>')}</span>`).join(" ")}</div>
    <div class="li-tr"><b>Traduction · espagnol</b> Calcula el costo total si usas 150 MB este mes.</div>
  </div></div></div>

  <div id="mk8" class="layer mk" style="--c:#FFB020"><div class="mk-frame"><div class="mk-bar"><i></i><span>Progrès en lecture · Rapport de Samir</span></div><div class="mk-body">
    <div class="pl-top"><div><b class="cnt" data-to="92">0</b><small> %</small><span>précision</span></div><div><b class="cnt" data-to="118">0</b><span>mots/min</span></div><div><b class="cnt" data-to="4">0</b><span>mots à pratiquer</span></div></div>
    <div class="pl-txt">Le transport collectif est <span class="pl-x">particulièrement</span> utile pour protéger l'<span class="pl-x">environnement</span>. Chaque jour, des milliers de <span class="pl-x">travailleurs</span> l'utilisent pour se rendre au <span class="pl-x">centre-ville</span>.</div>
    <div class="pl-gen"><b>Pratique générée par l'IA</b> particulièrement · environnement · travailleurs · centre-ville</div>
  </div></div></div>

  <div id="wbp" class="layer"><div class="wb-frame"><video id="v-wb" class="clip" src="assets/whiteboard.mp4" muted playsinline data-start="${P0 + 2 * PD + 0.5}" data-duration="${PD - 1}" data-media-start="24" data-track-index="5"></video></div></div>

  <!-- 7. MURALE -->
  <div id="mural-tx" class="clip scene trailer" data-start="${TC}" data-duration="8.5" data-track-index="6">
    <div id="ml1" class="tline disp" data-layout-allow-overlap>Les pépites, c'était <em>la bande-annonce</em>.</div>
    <div id="ml2" class="tline disp" data-layout-allow-overlap>Le film, on le fait <em>ensemble</em>.</div>
  </div>

  <!-- 8. FIN -->
  <div id="end" class="clip scene" data-start="${TE}" data-duration="9.5" data-track-index="6">
    ${logoSvg("end-logo")}
    <div class="ecol">
      <div class="ek mono">FOCUS FGA · AUTOMNE 2026</div>
      <div class="et disp">Labo <span class="g">techno-IA</span></div>
      <div class="ecta">Inscris-toi. On t'attend.</div>
      <div class="esig mono">LA RÉUSSITE, NOTRE PRIORITÉ.</div>
    </div>
  </div>

  <div id="flash" class="layer"></div>

  <div id="grain-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;">
    <div class="grain-texture"></div>
  </div>
  <style>
    @keyframes hf-grain-noise { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-5%,-5%)} 20%{transform:translate(-10%,5%)} 30%{transform:translate(5%,-10%)} 40%{transform:translate(-5%,15%)} 50%{transform:translate(-10%,5%)} 60%{transform:translate(15%,0)} 70%{transform:translate(0,10%)} 80%{transform:translate(-15%,0)} 90%{transform:translate(10%,5%)} }
    #grain-overlay .grain-texture { position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); opacity:0.09; animation: hf-grain-noise 0.5s steps(1) infinite; }
  </style>
</div>

<script>
  const tl = gsap.timeline({ paused: true });
  const P0 = ${P0}, PD = ${PD};

  // 1. Ouverture : machine à écrire
  tl.fromTo(".oc1", { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.055 }, 0.25);
  tl.fromTo(".oc2", { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.05 }, 1.55);
  tl.fromTo("#open .caret", { opacity: 1 }, { opacity: 0, duration: 0.01, repeat: 6, yoyo: true, repeatDelay: 0.24 }, 0);
  tl.to("#open .l1, #open .l2", { opacity: 0, duration: 0.3 }, 3.15);

  // 2. Corridor : lente poussée + textes
  const tline = (sel, a, b) => {
    tl.fromTo(sel, { opacity: 0, y: 30, scale: 1.06 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }, a);
    tl.to(sel, { opacity: 0, y: -16, duration: 0.4, ease: "power2.in" }, b);
  };
  tline("#tl1", 3.9, 6.4);
  tline("#tl2", 6.9, 9.8);
  tline("#tl3", 10.2, 13.0);

  // 3. Irritants : slam
  [0, 1, 2].forEach((i) => {
    const s = 13.5 + i * 2;
    tl.fromTo("#q" + i + " .q-text", { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "power4.out" }, s);
    tl.fromTo("#q" + i + " .q-in", { x: -14 }, { x: 0, duration: 0.25, ease: "elastic.out(1.2, 0.3)" }, s + 0.12);
    tl.fromTo("#q" + i + " .q-who", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 }, s + 0.35);
  });

  // 4. Enseigne
  tline("#sl1", 19.8, 21.3);
  tline("#sl2", 21.6, 23.6);
  tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.12 }, 23.85);
  tl.to("#flash", { opacity: 0, duration: 0.5 }, 24.0);

  // 5. Titre
  tl.fromTo("#title .pre", { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }, 24.3);
  tl.fromTo("#title .ch", { opacity: 0, y: 140, rotationX: -80, transformPerspective: 800 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: "back.out(1.6)", stagger: 0.07 }, 24.8);
  tl.fromTo("#title .sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 26.0);
  tl.fromTo("#title .chip", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 26.6);
  tl.to("#title .big, #title .pre, #title .sub, #title .chip", { opacity: 0, scale: 1.08, duration: 0.45, ease: "power2.in" }, 31.4);

  // Footage : lente poussée
  tl.fromTo("#vw-a", { scale: 1.04 }, { scale: 1.1, duration: 3.3, ease: "none" }, 3.5);
  tl.fromTo("#vw-b", { scale: 1.04 }, { scale: 1.14, duration: 6.7, ease: "none" }, 6.8);
  tl.fromTo("#vw-c", { scale: 1.12 }, { scale: 1.0, duration: 4.5, ease: "power1.out" }, 19.5);
  tl.fromTo("#vw-d", { scale: 1.0 }, { scale: 1.1, duration: 8.5, ease: "none" }, ${TC});

  // Gag
  tl.fromTo("#gag .g-k", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 32.2);
  tl.fromTo("#gag .g-q", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power4.out" }, 32.7);
  tl.fromTo("#gag .g-q", { x: 0 }, { x: 10, duration: 0.05, repeat: 7, yoyo: true }, 33.0);
  tl.to("#gag .g-q, #gag .g-k", { opacity: 0, scaleY: 0.02, duration: 0.18, ease: "power2.in" }, 35.3);
  tl.fromTo("#gag .g-a", { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power4.out" }, 35.5);
  tl.to("#gag .g-a", { opacity: 0, scale: 1.15, duration: 0.4, ease: "power2.in" }, 37.5);

  // Écrans de démo
  const mkIn = (id, i) => {
    const s0 = P0 + i * PD;
    tl.fromTo(id, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, s0 + 0.5);
    tl.to(id, { opacity: 0, duration: 0.4 }, s0 + PD - 0.5);
    gsap.utils.toArray(id + " .cnt").forEach((el) => {
      const o = { v: 0 }, to = +el.dataset.to;
      tl.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } }, s0 + 1.6);
    });
    return s0;
  };
  let s1 = mkIn("#mk1", 1);
  [0.72, 0.55, 0.8, 0.3].forEach((w, k) => tl.fromTo("#mk1 .mk-row:nth-of-type(" + (k + 2) + ") .mk-fill", { scaleX: 0 }, { scaleX: w, duration: 1.2, ease: "power2.out" }, s1 + 1.3 + k * 0.35));
  tl.fromTo("#mk1 .mk-tip", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, s1 + 4.0);
  let s6 = mkIn("#mk6", 6);
  tl.fromTo("#mk6 .rf", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15 }, s6 + 1.0);
  tl.fromTo("#mk6 .rf-alert", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, s6 + 3.6);
  tl.fromTo("#mk6 .mk-tip", { opacity: 0 }, { opacity: 1, duration: 0.5 }, s6 + 4.4);
  let s7 = mkIn("#mk7", 7);
  tl.to("#mk7 .lw i", { opacity: 1, duration: 0.3 }, s7 + 1.2);
  gsap.utils.toArray("#mk7 .lw").forEach((w, k) => {
    tl.fromTo(w, { backgroundColor: "rgba(253,224,71,0)" }, { backgroundColor: "rgba(253,224,71,1)", duration: 0.12 }, s7 + 1.6 + k * 0.38);
    tl.to(w, { backgroundColor: "rgba(253,224,71,0)", duration: 0.2 }, s7 + 1.6 + k * 0.38 + 0.36);
  });
  tl.fromTo("#mk7 .li-tr", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, s7 + 6.0);
  let s8 = mkIn("#mk8", 8);
  tl.fromTo("#mk8 .pl-x", { borderBottomColor: "rgba(198,40,40,0)", color: "#1B2240" }, { borderBottomColor: "rgba(198,40,40,1)", color: "#C62828", duration: 0.3, stagger: 0.5 }, s8 + 2.2);
  tl.fromTo("#mk8 .pl-gen", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, s8 + 4.6);

  // Pépite #8 : extrait de la vidéo Whiteboard
  tl.fromTo("#wbp", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, ${P0 + 2 * PD + 0.5});
  tl.to("#wbp", { opacity: 0, duration: 0.4 }, ${P0 + 3 * PD - 0.5});

  // 6. Pépites
  for (let i = 0; i < 10; i++) {
    const s = P0 + i * PD;
    const bg = "#pbg" + i, tx = "#ptx" + i;
    tl.fromTo(bg + " .pnum", { opacity: 0, scale: 1.25 }, { opacity: 0.1, scale: 1, duration: 0.9, ease: "power3.out" }, s);
    tl.fromTo(bg + " .pglow", { opacity: 0 }, { opacity: 1, duration: 0.8 }, s);
    tl.fromTo(tx + " .pkick", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, s + 0.35);
    tl.fromTo(tx + " .pirr", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, s + 0.6);
    tl.fromTo(tx + " .pirr-x", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, s + 1.9);
    tl.to(tx + " .pirr-t", { opacity: 0.45, duration: 0.3 }, s + 2.1);
    tl.fromTo(tx + " .pline-in", { yPercent: 105 }, { yPercent: 0, duration: 0.7, ease: "power4.out", stagger: 0.12 }, s + 2.25);
    tl.fromTo(tx + " .pben", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, s + 3.0);
    tl.to(tx + " .pcol", { opacity: 0, x: 60, duration: 0.4, ease: "power2.in" }, s + PD - 0.45);
    tl.to(bg + " .pnum, " + bg + " .pglow", { opacity: 0, duration: 0.4 }, s + PD - 0.45);
  }
  // Pépite #1 : éclair doré
  tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.75, duration: 0.1 }, P0 + 9 * PD - 0.05);
  tl.to("#flash", { opacity: 0, duration: 0.6 }, P0 + 9 * PD + 0.05);

  // 7. Murale
  tline("#ml1", ${TC + 0.6}, ${TC + 3.6});
  tline("#ml2", ${TC + 4}, ${TC + 8.1});

  // 8. Fin
  tl.fromTo("#end-logo .logo-arc", { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, ${TE + 0.2});
  tl.fromTo("#end-logo .logo-bldg", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, ${TE + 0.5});
  tl.fromTo("#end-logo .logo-word, #end-logo .logo-sub", { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.2 }, ${TE + 0.8});
  tl.fromTo("#end .ek", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 }, ${TE + 0.9});
  tl.fromTo("#end .et", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, ${TE + 1.2});
  tl.fromTo("#end .ecta", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, ${TE + 2.3});
  tl.fromTo("#end .esig", { opacity: 0 }, { opacity: 1, duration: 0.8 }, ${TE + 3.5});
  tl.to("#end .logo, #end .ecol", { opacity: 0, duration: 0.8 }, ${TE + 8.5});

  window.__timelines["main"] = tl;
</script>

<script type="module">
  import * as THREE from "three";
  import { RoomEnvironment } from "./assets/vendor/RoomEnvironment.js";

  const canvas = document.getElementById("three-c");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1920, 1080, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1920 / 1080, 0.1, 200);

  // PRNG déterministe
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // Pépite d'or : icosaèdre déformé, facettes
  function nuggetGeometry(seed) {
    const r = rng(seed * 7919 + 13);
    const waves = Array.from({ length: 6 }, () => ({ k: new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(1.5 + r() * 3), ph: r() * 6.28, a: 0.05 + r() * 0.09 }));
    const g = new THREE.IcosahedronGeometry(1, 3);
    const pos = g.attributes.position; const v = new THREE.Vector3();
    const cache = new Map();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const key = v.x.toFixed(4) + "," + v.y.toFixed(4) + "," + v.z.toFixed(4);
      let d = cache.get(key);
      if (d === undefined) { d = 1; for (const w of waves) d += Math.sin(v.dot(w.k) + w.ph) * w.a; cache.set(key, d); }
      pos.setXYZ(i, v.x * d * 1.08, v.y * d * 0.82, v.z * d * 0.95);
    }
    g.computeVertexNormals();
    return g;
  }
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc23d, metalness: 1, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.2 });

  const nuggets = [];
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(nuggetGeometry(i + 1), gold); m.visible = false; scene.add(m); nuggets.push(m); }
  const hero = new THREE.Mesh(nuggetGeometry(42), gold); hero.visible = false; scene.add(hero);

  const key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(4, 5, 6); scene.add(key);
  const rim = new THREE.PointLight(0xffffff, 60, 30, 1.6); scene.add(rim);

  // Poussière d'or
  const N = 420, rd = rng(2026), dustPos = new Float32Array(N * 3), dustSeed = [];
  for (let i = 0; i < N; i++) { dustSeed.push([rd() * 16 - 8, rd() * 10 - 5, rd() * 8 - 6, rd() * 6.28, 0.2 + rd() * 0.5]); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd36b, size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  const COLORS = ${JSON.stringify(PEPITES.map((p) => p.color))};
  // Texture de halo (dégradé radial, déterministe)
  const gc = document.createElement("canvas"); gc.width = gc.height = 256;
  const gx = gc.getContext("2d"); const gg = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gg.addColorStop(0, "rgba(255,255,255,1)"); gg.addColorStop(0.25, "rgba(255,255,255,0.55)"); gg.addColorStop(1, "rgba(255,255,255,0)");
  gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(gc); glowTex.colorSpace = THREE.SRGBColorSpace;
  const mkGlow = () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.visible = false; scene.add(sp); return sp; };
  const glowA = mkGlow(), glowB = mkGlow();

  // Ondes de choc
  const mkRing = () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; };
  const shockA = mkRing(), shockB = mkRing();

  // Tornade de feuilles volantes
  const NP = 520, rp = rng(77);
  const paperGeo = new THREE.PlaneGeometry(0.42, 0.56);
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, emissive: 0x223355, emissiveIntensity: 0.25 });
  const papers = new THREE.InstancedMesh(paperGeo, paperMat, NP);
  const PS = [];
  const pal = [0xffffff, 0xffffff, 0xffffff, 0xe8f0ff, 0xdbe9ff, 0xfff3a6, 0xc8f0b0];
  for (let i = 0; i < NP; i++) {
    PS.push({ a0: rp() * 6.283, r0: 1.2 + rp() * 6.5, h0: rp() * 14 - 7, sp: 0.35 + rp() * 0.9, s1: rp() * 4 - 2, s2: rp() * 4 - 2, s3: rp() * 3 - 1.5, ph: rp() * 6.283, b: 0.5 + rp() });
    papers.setColorAt(i, new THREE.Color(pal[Math.floor(rp() * pal.length)]));
  }
  papers.visible = false; scene.add(papers);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const SLAMS = [13.5, 15.5, 17.5];

  function paperStorm(t) {
    papers.visible = true;
    const k = Math.pow(clamp((t - 19.5) / 4.3), 2);
    let shake = 0;
    for (const ts of SLAMS) if (t > ts) shake += Math.exp(-(t - ts) * 7) * 0.22;
    let cz = t < 13.5 ? 16.5 - (t - 1.8) * 0.5 : 10.65 - clamp((t - 19.5) / 4.3) * 3.2;
    camera.position.set(Math.sin(t * 0.25) * 1.6 + Math.sin(t * 83) * shake, 0.4 + Math.cos(t * 71) * shake, cz);
    camera.lookAt(0, 0, -2);
    for (let i = 0; i < NP; i++) {
      const P = PS[i];
      const fade = clamp((t - 2.5 - i * 0.003) / 1.2);
      let burst = 0;
      for (const ts of SLAMS) if (t > ts) burst += 3.2 * P.b * Math.exp(-(t - ts) * 2.4);
      const r = (P.r0 + burst) * (1 - k);
      const ang = P.a0 + t * (0.35 + 1.1 / P.r0) + k * k * 9;
      const y = ((((P.h0 + t * P.sp * 1.1 + 7) % 14) + 14) % 14 - 7) * (1 - k);
      _p.set(Math.cos(ang) * r, y, Math.sin(ang) * r - 2);
      _e.set(t * P.s1 + P.ph, t * P.s2, t * P.s3 + P.ph);
      _q.setFromEuler(_e);
      const sc = fade * (1 - k * 0.9);
      _s.set(sc, sc, sc);
      _m.compose(_p, _q, _s);
      papers.setMatrixAt(i, _m);
    }
    papers.instanceMatrix.needsUpdate = true;
    // Cœur lumineux du vortex
    if (t > 19.5) {
      glowA.visible = true; glowA.material.color.set(0xfff0c0);
      glowA.position.set(0, 0, -2); glowA.scale.setScalar(0.6 + k * 9);
      glowA.material.opacity = 0.25 + k * 0.75;
    }
    // Onde de choc à chaque irritant
    for (const ts of SLAMS) {
      const u = t - ts;
      if (u > 0 && u < 0.9) {
        shockA.visible = true; shockA.material.color.set(0xffffff);
        shockA.position.set(0, 0, 0); shockA.lookAt(camera.position);
        shockA.scale.setScalar(0.5 + u * 14); shockA.material.opacity = (1 - u / 0.9) * 0.7;
      }
    }
  }

  // Convergence finale des 10 pépites
  function converge(t, t0, t1) {
    camera.position.set(0, 0.3, 12); camera.lookAt(0, 0.6, 0);
    const u = easeInOut(clamp((t - t0) / 3.6)), out = clamp((t1 - t) / 0.5);
    nuggets.forEach((m, i) => {
      const a = i / 10 * Math.PI * 2 + (t - t0) * (0.6 + u * 1.2);
      const rad = 9.5 * (1 - u) + (1.05 + 0.3 * Math.sin(i * 2.1)) * u;
      m.visible = true;
      m.position.set(Math.cos(a) * rad, 1.0 + Math.sin(a) * rad * 0.38 + Math.sin(i * 1.7) * 0.45 * u, Math.sin(a) * rad * 0.6);
      m.rotation.set(t * 0.9 + i, t * 1.3 + i, 0);
      m.scale.setScalar(0.55 * out);
    });
    glowA.visible = true; glowA.material.color.set(0xffd36b);
    glowA.position.set(0, 1.0, -1.5); glowA.scale.setScalar(2 + u * 7); glowA.material.opacity = (0.15 + u * 0.6) * out;
    if (t > t0 + 3.4 && t < t0 + 4.6) {
      const v = (t - t0 - 3.4) / 1.2;
      shockA.visible = true; shockA.material.color.set(0xffd36b);
      shockA.position.set(0, 1.0, 0); shockA.lookAt(camera.position);
      shockA.scale.setScalar(1 + v * 12); shockA.material.opacity = (1 - v) * 0.8;
    }
    rim.color.set(0xffd36b); rim.intensity = 90; rim.position.set(0, 1, -3);
    updateDust(t, u * out, 1.0);
  }


  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const P0 = ${P0}, PD = ${PD};
  const SCREENS = [1, 2, 6, 7, 8];

  function updateDust(t, alpha, spread) {
    for (let i = 0; i < N; i++) {
      const [x, y, z, ph, sp] = dustSeed[i];
      dustPos[i * 3] = x * spread + Math.sin(t * 0.3 + ph) * 0.3;
      dustPos[i * 3 + 1] = ((y + t * sp + 5) % 10 + 10) % 10 - 5;
      dustPos[i * 3 + 2] = z;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = 0.8 * alpha;
    dust.visible = alpha > 0.001;
  }

  function ring(t, t0, t1, rx, ry, camZ) {
    camera.position.set(0, 0, camZ); camera.lookAt(0, 0, 0);
    const out = clamp((t1 - t) / 0.5);
    nuggets.forEach((m, i) => {
      const local = clamp((t - t0 - 0.12 * i) / 1.0);
      const a = i / 10 * Math.PI * 2 + (t - t0) * 0.22;
      m.visible = local > 0;
      m.position.set(Math.cos(a) * rx, Math.sin(a) * ry + Math.sin(t * 1.3 + i) * 0.08, Math.sin(a * 2) * 0.4 - (1 - easeInOut(local)) * 25);
      m.rotation.set(t * 0.9 + i, t * 1.2 + i * 0.7, 0);
      m.scale.setScalar(0.4 * easeOutBack(local) * out);
    });
    rim.color.set(0x6cb33f); rim.intensity = 60; rim.position.set(0, 0, -4);
    updateDust(t, clamp((t - t0) * 2) * out, 1.1);
  }

  // Carte finale : pépites en bandes haut/bas, hors du texte
  function bands(t, t0, t1) {
    camera.position.set(0, 0, 15); camera.lookAt(0, 0, 0);
    const out = clamp((t1 - t) / 0.6);
    nuggets.forEach((m, i) => {
      const top = i % 2 === 0, k = Math.floor(i / 2);
      const local = clamp((t - t0 - 0.6 - 0.1 * i) / 0.9);
      const x = -7.2 + k * 3.6 + (top ? 0 : 1.8);
      const y = (top ? 3.85 : -3.85) + Math.sin(t * 1.1 + i) * 0.1 + (1 - easeOutBack(local)) * (top ? 3 : -3);
      m.visible = local > 0;
      m.position.set(x, y, 0);
      m.rotation.set(t * 0.7 + i, t * 1.0 + i * 0.9, 0.2);
      m.scale.setScalar(0.36 * local * out);
    });
    rim.color.set(0x6cb33f); rim.intensity = 60; rim.position.set(0, 0, -4);
    updateDust(t, clamp((t - t0) * 2) * out * 0.7, 1.1);
  }

  function renderAt(t) {
    nuggets.forEach((m) => (m.visible = false)); hero.visible = false; dust.visible = false;
    papers.visible = false; glowA.visible = false; glowB.visible = false; shockA.visible = false; shockB.visible = false;
    if (t >= 2.5 && t < 24.2) {
      paperStorm(t);
    }
    if (t >= 35.5 && t < 36.6) {
      const v = (t - 35.5) / 1.1;
      camera.position.set(0, 0, 13); camera.lookAt(0, 0, 0);
      shockB.visible = true; shockB.material.color.set(0xf5c542); shockB.position.set(0, 0, 0); shockB.lookAt(camera.position); shockB.scale.setScalar(1 + v * 14); shockB.material.opacity = (1 - v) * 0.9;
    }
    if (t >= 24 && t < 32) {
      ring(t, 24, 32, 5.7, 3.05, 13);
      const u = t - 24;
      glowB.visible = true; glowB.material.color.set(0xffe9a8); glowB.position.set(0, 0, -4); glowB.scale.setScalar(16); glowB.material.opacity = 0.32 * clamp(u / 0.8) * clamp((32 - t) / 0.5);
      if (u < 1.2) { shockB.visible = true; shockB.material.color.set(0xffffff); shockB.position.set(0, 0, 0); shockB.lookAt(camera.position); shockB.scale.setScalar(0.5 + u * 16); shockB.material.opacity = (1 - u / 1.2) * 0.9; }
    } else if (t >= P0 && t < P0 + 10 * PD) {
      const i = Math.floor((t - P0) / PD), u = t - P0 - i * PD;
      camera.position.set(0, 0, 11); camera.lookAt(0, 0, 0);
      const m = nuggets[i];
      const inn = clamp(u / 0.85), out = clamp((PD - u) / 0.45);
      const big = i === 9 ? 1.12 : 1;
      m.visible = !SCREENS.includes(i);
      m.position.set(-3.0, (1 - easeOutBack(inn)) * 7 + Math.sin(t * 1.4) * 0.12 + (1 - out) * 1.5, 0);
      m.rotation.set(0.35 + Math.sin(t * 0.7) * 0.25, t * 0.9 + i * 1.7 + (1 - inn) * 3, 0.15);
      m.scale.setScalar(1.75 * big * out);
      rim.color.set(COLORS[i]); rim.intensity = 140; rim.position.set(-1.2, 1.2, -3.2);
      updateDust(t, Math.min(clamp(u / 0.6), out) * (i === 9 ? 1 : 0.55), 0.55);
      dust.position.set(-3.2, 0, 0);
      glowA.visible = !SCREENS.includes(i); glowA.material.color.set(COLORS[i]);
      glowA.position.set(m.position.x, m.position.y, -1.5); glowA.scale.setScalar(7.5 * big); glowA.material.opacity = 0.55 * inn * out;
      const w = u - 0.6;
      if (w > 0 && w < 1.1 && !SCREENS.includes(i)) {
        shockA.visible = true; shockA.material.color.set(COLORS[i]);
        shockA.position.set(m.position.x, m.position.y, 0); shockA.lookAt(camera.position);
        shockA.scale.setScalar(1.2 + w * 6); shockA.material.opacity = (1 - w / 1.1) * 0.85;
        if (i === 9) { shockB.visible = true; shockB.material.color.set(0xffffff); shockB.position.copy(shockA.position); shockB.lookAt(camera.position); shockB.scale.setScalar(0.8 + w * 11); shockB.material.opacity = (1 - w / 1.1) * 0.7; }
      }
    } else if (t >= ${TC} && t < ${TE}) {
      converge(t, ${TC}, ${TE});
    } else if (t >= ${TE} && t <= ${TT}) {
      dust.position.set(0, 0, 0);
      bands(t, ${TE}, ${TT});
    }
    if (!(t >= P0 && t < P0 + 10 * PD)) dust.position.set(0, 0, 0);
    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
</script>
</body>
</html>
`;

writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("index.html généré");
