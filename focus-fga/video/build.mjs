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

const P0 = 32; // début du compte à rebours
const PD = 7; // durée par pépite

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
    <div id="q${i}" class="clip scene quote" data-start="${13.5 + i * 2}" data-duration="2" data-track-index="6" style="background:${q.bg}">
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
  .shade { z-index: 3; background: linear-gradient(180deg, rgba(5,8,22,.15) 0%, rgba(5,8,22,.25) 55%, rgba(5,8,22,.85) 100%); }
  .bars { z-index: 9; }
  .bars::before, .bars::after { content: ""; position: absolute; left: 0; right: 0; height: 120px; background: #000; }
  .bars::before { top: 0; } .bars::after { bottom: 0; }

  /* Canvas 3D */
  #three { z-index: 5; }
  #three canvas { width: 100%; height: 100%; display: block; }

  /* 1. Ouverture */
  #open { z-index: 10; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
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

  #flash { z-index: 50; background: #fff; opacity: 0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="120" data-width="1920" data-height="1080">

  <div id="bg" class="layer"></div>
  <div id="bg-grid" class="layer"></div>

  <!-- FOOTAGE -->
  <div id="vw-corr" class="layer vwrap"><video id="v-corr" class="clip" src="assets/corridor.mp4" muted playsinline data-start="3.5" data-duration="10" data-media-start="6" data-track-index="1"></video></div>
  <div id="vw-sign" class="layer vwrap"><video id="v-sign" class="clip" src="assets/corridor.mp4" muted playsinline data-start="19.5" data-duration="4.5" data-media-start="0.3" data-playback-rate="0.8" data-track-index="1"></video></div>
  <div id="vw-mur" class="layer vwrap"><video id="v-mur" class="clip" src="assets/murale.mp4" muted playsinline data-start="102" data-duration="8.5" data-media-start="0" data-playback-rate="0.66" data-track-index="1"></video></div>

  <div id="shade-a" class="clip layer shade" data-start="3.5" data-duration="10" data-track-index="3"></div>
  <div id="shade-b" class="clip layer shade" data-start="19.5" data-duration="4.5" data-track-index="3"></div>
  <div id="shade-c" class="clip layer shade" data-start="102" data-duration="8.5" data-track-index="3"></div>
  <div id="bars-a" class="clip layer bars" data-start="3.5" data-duration="10" data-track-index="4"></div>
  <div id="bars-b" class="clip layer bars" data-start="19.5" data-duration="4.5" data-track-index="4"></div>
  <div id="bars-c" class="clip layer bars" data-start="102" data-duration="8.5" data-track-index="4"></div>

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

  <!-- 7. MURALE -->
  <div id="mural-tx" class="clip scene trailer" data-start="102" data-duration="8.5" data-track-index="6">
    <div id="ml1" class="tline disp" data-layout-allow-overlap>Les pépites, c'était <em>la bande-annonce</em>.</div>
    <div id="ml2" class="tline disp" data-layout-allow-overlap>Le film, on le fait <em>ensemble</em>.</div>
  </div>

  <!-- 8. FIN -->
  <div id="end" class="clip scene" data-start="110.5" data-duration="9.5" data-track-index="6">
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
  tl.fromTo("#vw-corr", { scale: 1.04 }, { scale: 1.16, duration: 10, ease: "none" }, 3.5);
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
  tl.fromTo("#vw-sign", { scale: 1.12 }, { scale: 1.0, duration: 4.5, ease: "power1.out" }, 19.5);
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
  tl.fromTo("#vw-mur", { scale: 1.0 }, { scale: 1.12, duration: 8.5, ease: "none" }, 102);
  tline("#ml1", 102.6, 105.6);
  tline("#ml2", 106.0, 110.1);

  // 8. Fin
  tl.fromTo("#end-logo .logo-arc", { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 110.7);
  tl.fromTo("#end-logo .logo-bldg", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, 111.0);
  tl.fromTo("#end-logo .logo-word, #end-logo .logo-sub", { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.2 }, 111.3);
  tl.fromTo("#end .ek", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 }, 111.4);
  tl.fromTo("#end .et", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, 111.7);
  tl.fromTo("#end .ecta", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 112.8);
  tl.fromTo("#end .esig", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 114.0);
  tl.to("#end .logo, #end .ecol", { opacity: 0, duration: 0.8 }, 119.0);

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
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const P0 = ${P0}, PD = ${PD};

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
    if (t >= 24 && t < 32) {
      ring(t, 24, 32, 5.7, 3.05, 13);
    } else if (t >= P0 && t < P0 + 10 * PD) {
      const i = Math.floor((t - P0) / PD), u = t - P0 - i * PD;
      camera.position.set(0, 0, 11); camera.lookAt(0, 0, 0);
      const m = nuggets[i];
      const inn = clamp(u / 0.85), out = clamp((PD - u) / 0.45);
      const big = i === 9 ? 1.12 : 1;
      m.visible = true;
      m.position.set(-3.0, (1 - easeOutBack(inn)) * 7 + Math.sin(t * 1.4) * 0.12 + (1 - out) * 1.5, 0);
      m.rotation.set(0.35 + Math.sin(t * 0.7) * 0.25, t * 0.9 + i * 1.7 + (1 - inn) * 3, 0.15);
      m.scale.setScalar(1.75 * big * out);
      rim.color.set(COLORS[i]); rim.intensity = 140; rim.position.set(-1.2, 1.2, -3.2);
      updateDust(t, Math.min(clamp(u / 0.6), out) * (i === 9 ? 1 : 0.55), 0.55);
      dust.position.set(-3.2, 0, 0);
    } else if (t >= 110.5 && t <= 120) {
      dust.position.set(0, 0, 0);
      bands(t, 110.5, 120);
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
