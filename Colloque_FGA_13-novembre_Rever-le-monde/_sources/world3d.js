// =================== MONDE 3D EN CEL-SHADING ===================
// Un seul monde, 17 stations reliées par un sentier. La caméra vole d'une station à l'autre.
const STATIONS = ['aerial', 'duo', 'globe', 'mots', 'mots', 'cible', 'village', 'triade', 'spheres', 'pyr', 'nomverbe', 'escalier', 'portes', 'ecran', 'table', 'idee', 'jetons', 'pas', 'maison', 'aerial'];
const G3 = (() => {
  if (!window.THREE) return { activate() {}, st: {} };
  const T = THREE, V = T.Vector3;
  const cv = document.createElement('canvas'); cv.id = 'world'; cv.setAttribute('aria-hidden', 'true'); document.body.prepend(cv);
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setClearColor(0xFBF8EF);
  const scene = new T.Scene(); scene.fog = new T.Fog(0xFBF8EF, 30, 100);
  const camera = new T.PerspectiveCamera(42, 1, .1, 300);
  scene.add(new T.AmbientLight(0xffffff, .42)); const dl = new T.DirectionalLight(0xffffff, .62); dl.position.set(20, 40, 25); scene.add(dl);
  const grad = (() => { const d = new Uint8Array([105, 105, 105, 255, 185, 185, 185, 255, 235, 235, 235, 255]); const t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = c => new T.MeshToonMaterial({ color: c, gradientMap: grad });
  const INK = new T.MeshBasicMaterial({ color: 0x1E1A22, side: T.BackSide });
  const GOLD = 0xF2C230, MAUVE = 0x5B2A86, CREAM = 0xFBF8EF, PAPER2 = 0xF3EDDF;
  function inked(geo, color, w = .05) { const g = new T.Group(); const m = new T.Mesh(geo, toon(color)); const o = new T.Mesh(geo, INK); o.scale.setScalar(1 + w); g.add(m, o); g.userData.body = m; return g; }
  function lab(txt, o = {}) {
    const w = o.w || 512, h = o.h || 128, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, w, h); x.strokeStyle = '#1E1A22'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); }
    x.font = (o.size || 70) + 'px ' + (o.font || 'Anton, Impact, sans-serif'); x.textAlign = 'center'; x.textBaseline = 'middle';
    if (o.stroke !== false) { x.lineWidth = o.lw || 10; x.strokeStyle = '#1E1A22'; x.lineJoin = 'round'; x.strokeText(txt, w / 2, h / 2 + 4); }
    x.fillStyle = o.color || '#F2C230'; x.fillText(txt, w / 2, h / 2 + 4);
    const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true })); const sc = o.scale || 3; s.scale.set(sc, sc * h / w, 1); return s;
  }
  function noteTex(txt, bg = '#F2C230') { const c = document.createElement('canvas'); c.width = 256; c.height = 200; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 200); x.strokeStyle = '#1E1A22'; x.lineWidth = 10; x.strokeRect(5, 5, 246, 190); x.fillStyle = '#1E1A22'; x.font = '600 40px Caveat, cursive'; x.textAlign = 'center';
    const words = txt.split(' '); let lines = [''], i = 0; words.forEach(w => { if ((lines[i] + ' ' + w).length > 13) lines[++i] = w; else lines[i] = (lines[i] + ' ' + w).trim(); }); lines = lines.slice(0, 4); lines.forEach((l, k) => x.fillText(l, 128, 100 - (lines.length - 1) * 21 + k * 42 + 12)); return new T.CanvasTexture(c); }
  function pawn(color, s = 1) { const g = new T.Group(); const b = inked(new T.CylinderGeometry(.5 * s, .78 * s, 1.5 * s, 24), color, .06); b.position.y = .75 * s; const h = inked(new T.SphereGeometry(.52 * s, 24, 16), color, .06); h.position.y = 2.05 * s; g.add(b, h); return g; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- sol, stations, sentier ----------
  const dots = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#F3EDDF'; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(91,42,134,.16)'; [[16, 16], [48, 48]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); }); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(60, 60); return t; })();
  const ground = new T.Mesh(new T.CircleGeometry(46, 96), new T.MeshBasicMaterial({ map: dots })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const rim = new T.Mesh(new T.RingGeometry(46, 46.6, 96), new T.MeshBasicMaterial({ color: 0x1E1A22 })); rim.rotation.x = -Math.PI / 2; rim.position.y = .01; scene.add(rim);
  const NAMES = ['duo', 'globe', 'mots', 'cible', 'village', 'triade', 'spheres', 'pyr', 'nomverbe', 'escalier', 'portes', 'ecran', 'table', 'idee', 'jetons', 'pas', 'maison'];
  const S = {};
  NAMES.forEach((n, i) => { const a = i * .62 + .3, R = 13 + i * 1.5; const g = new T.Group(); g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); g.userData.out = new V(Math.cos(a), 0, Math.sin(a)); g.lookAt(g.position.clone().add(g.userData.out)); scene.add(g);
    const plat = inked(new T.CylinderGeometry(3.4, 3.6, .35, 40), CREAM, .03); plat.position.y = .17; g.add(plat);
    S[n] = { g, pick: [], tick: null, enter: null, look: 2.2, dist: 10.5, h: 4.2 }; });
  const curve = new T.CatmullRomCurve3(NAMES.map(n => S[n].g.position.clone().setY(.06)));
  const path = new T.Mesh(new T.TubeGeometry(curve, 500, .16, 6), new T.MeshBasicMaterial({ color: MAUVE })); scene.add(path);
  for (let k = 0; k < 120; k++) { const p = curve.getPointAt(k / 120); const d = new T.Mesh(new T.CylinderGeometry(.22, .22, .08, 12), new T.MeshBasicMaterial({ color: GOLD })); d.position.copy(p).setY(.1); scene.add(d); }
  const add = (n, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); S[n].g.add(o); return o; };

  // ---------- duo ----------
  { const a = add('duo', pawn(GOLD), -1.3, .35, 0), b = add('duo', pawn(MAUVE), 1.3, .35, 0);
    add('duo', lab('ISABELLE', { scale: 2.4 }), -1.3, 3.5, 0); add('duo', lab('FRANCIS', { scale: 2.4, color: '#FBF8EF' }), 1.3, 3.5, 0);
    S.duo.tick = t => { a.position.y = .35 + Math.max(0, Math.sin(t * 3)) * .5; b.position.y = .35 + Math.max(0, Math.sin(t * 3 + Math.PI)) * .5; }; }

  // ---------- globe ----------
  { const globe = inked(new T.SphereGeometry(2.3, 48, 32), GOLD, .05); add('globe', globe, 0, 3.1, 0);
    globe.add(new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(2.31, 12, 8)), new T.LineBasicMaterial({ color: MAUVE, transparent: true, opacity: .5 })));
    const notes = new T.Group(); globe.add(notes); let rotY = 0, vel = .004;
    const st = S.globe; st.look = 3; st.dist = 10;
    st.add = (txt, save = true) => { const m = new T.Mesh(new T.PlaneGeometry(1.5, 1.17), new T.MeshBasicMaterial({ map: noteTex(txt, notes.children.length % 4 === 2 ? '#FBF8EF' : '#F2C230'), side: T.DoubleSide }));
      const n = notes.children.length / 2, phi = Math.acos(1 - 2 * ((n * .618 + .1) % 1)), th = n * 2.4; const p = new V().setFromSphericalCoords(2.7, phi, th); m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); m.rotateZ((Math.random() - .5) * .4);
      const pin = new T.Mesh(new T.CylinderGeometry(.03, .03, .45), INK); pin.position.copy(p.clone().multiplyScalar(.93)); pin.lookAt(0, 0, 0); pin.rotateX(Math.PI / 2); notes.add(m, pin);
      if (save) { const l = store.get('enjeux', []); l.push(txt); store.set('enjeux', l); } };
    st.clear = () => { while (notes.children.length) notes.remove(notes.children[0]); store.set('enjeux', []); };
    st.drag = dx => { rotY += dx * .01; };
    st.tick = () => { if (!reduce) rotY += vel; globe.rotation.y = rotY; globe.rotation.x = .2; };
    const l = store.get('enjeux', null); (l && l.length ? l : ['le gaspillage alimentaire', 'l’isolement', 'le coût des loyers']).forEach(t => st.add(t, !(l && l.length))); }

  // ---------- mots ----------
  { const words = ['projets', 'confiance', 'forces', 'accepté', 'envie', 'sans jugement'];
    const sp = words.map((w, i) => { const s = new T.Sprite(new T.SpriteMaterial({ map: noteTex(w, i % 2 ? '#FBF8EF' : '#F2C230') })); s.scale.set(1.6, 1.25, 1); S.mots.g.add(s); return s; });
    add('mots', lab('« »', { size: 120, w: 512, h: 160, scale: 4.5, color: '#5B2A86', lw: 12 }), 0, 2.6, 0);
    S.mots.look = 2.6; S.mots.tick = t => sp.forEach((s, i) => { const a = t * .4 + i * Math.PI / 3; s.position.set(Math.cos(a) * 2.7, 2.6 + Math.sin(t + i) * .5, Math.sin(a) * 2.7); }); }

  // ---------- cible ----------
  { const tg = new T.Group(); [[2.3, GOLD], [1.7, CREAM], [1.1, MAUVE], [.5, GOLD]].forEach(([r, c], i) => { const d = inked(new T.CylinderGeometry(r, r, .25, 48), c, .03); d.rotation.x = Math.PI / 2; d.position.z = i * .06; tg.add(d); });
    add('cible', tg, 0, 3, 0); const arrow = new T.Group(); const shaft = inked(new T.CylinderGeometry(.07, .07, 3, 10), MAUVE, .2); shaft.rotation.x = Math.PI / 2; const tip = inked(new T.ConeGeometry(.22, .5, 12), 0x1E1A22, .1); tip.rotation.x = -Math.PI / 2; tip.position.z = -1.7; const fl = inked(new T.BoxGeometry(.5, .02, .6), GOLD, .1); fl.position.z = 1.3; arrow.add(shaft, tip, fl); add('cible', arrow, 0, 3, 1.8);
    let t0 = 0; S.cible.look = 3; S.cible.enter = () => { t0 = performance.now(); };
    S.cible.tick = () => { const k = reduce ? 1 : Math.min(1, (performance.now() - t0) / 900); arrow.position.z = 1.9 + (1 - k) * 9; arrow.rotation.z = (1 - k) * 3; }; }

  // ---------- village 2036 ----------
  { const rnd = (a => () => (a = (a * 9301 + 49297) % 233280) / 233280)(7);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 1.6 + rnd() * 1.2; const h = new T.Group(); const b = inked(new T.BoxGeometry(.9, .8 + rnd() * .6, .9), CREAM, .05); b.position.y = b.userData.body.geometry.parameters.height / 2; const rf = inked(new T.ConeGeometry(.8, .7, 4), i % 3 ? GOLD : MAUVE, .05); rf.rotation.y = Math.PI / 4; rf.position.y = b.userData.body.geometry.parameters.height + .35; h.add(b, rf); h.rotation.y = rnd() * 3; add('village', h, Math.cos(a) * r, .35, Math.sin(a) * r); }
    const ch = new T.Group(); const cb = inked(new T.BoxGeometry(.9, 1.8, .9), CREAM, .05); cb.position.y = .9; const sp = inked(new T.ConeGeometry(.45, 1.6, 4), GOLD, .05); sp.rotation.y = Math.PI / 4; sp.position.y = 2.6; ch.add(cb, sp); add('village', ch, 0, .35, 0);
    for (let i = 0; i < 6; i++) { const tr = inked(new T.ConeGeometry(.35, 1.2, 6), MAUVE, .06); add('village', tr, Math.cos(i) * 3, .95, Math.sin(i) * 3); }
    const yr = add('village', lab('2036', { size: 110, scale: 3.4 }), 0, 4.6, 0); S.village.look = 1.8; S.village.tick = t => { yr.position.y = 4.6 + Math.sin(t * 1.5) * .2; }; }

  // ---------- triade ----------
  { const rings = [[GOLD, -1, 0, 'ÉCOLE'], [MAUVE, 1, 0, 'COMMUNAUTÉ'], [CREAM, 0, -1.6, 'ENVIRONNEMENT']].map(([c, x, y, n]) => { const r = inked(new T.TorusGeometry(1.4, .22, 14, 60), c, .06); add('triade', r, x, 3.6 + y, 0); add('triade', lab(n, { scale: 2.2, color: c === MAUVE ? '#FBF8EF' : '#F2C230' }), x * 2.1, 3.6 + y * 1.9 + (y ? -.4 : 1.9), 0); return r; });
    S.triade.look = 3; S.triade.tick = t => rings.forEach((r, i) => { r.rotation.y = Math.sin(t * .6 + i) * .5; r.rotation.x = Math.cos(t * .5 + i) * .3; }); }

  // ---------- 4 sphères ----------
  { const SPH = [['Affective', GOLD, 'Motivation, sentiment de compétence, plaisir d’apprendre.', 'Il arrive à l’heure, sourit, parle de son projet en dehors de la classe.'], ['Cognitive', MAUVE, 'Stratégies actives : faire des liens, questionner, planifier.', 'Elle pose des questions, explique sa démarche, fait des liens avec sa vie.'], ['Comportementale', CREAM, 'Persévérance, régularité, présence.', 'Il revient après un échec et termine ce qu’il commence.'], ['Citoyenne', GOLD, 'Agir concrètement dans son milieu, pour d’autres.', 'Elle propose, mobilise d’autres personnes, agit pour quelqu’un d’autre.']];
    const star = inked(new T.OctahedronGeometry(.8), GOLD, .06); add('spheres', star, 0, 2.8, 0);
    const pl = SPH.map((d, i) => { const g = inked(new T.SphereGeometry(.7, 32, 24), d[1], .05); g.userData.body.userData.i = i; S.spheres.g.add(g); S.spheres.pick.push(g.userData.body); const l = lab(d[0].toUpperCase(), { scale: 2, color: d[1] === MAUVE ? '#FBF8EF' : '#F2C230' }); g.add(l); l.position.y = 1.15; return g; });
    let sel = -1; S.spheres.look = 2.8;
    S.spheres.onPick = o => { sel = o.userData.i; const d = SPH[sel]; const out = document.getElementById('sphereOut'); if (out) out.innerHTML = `<h3>${d[0]}</h3><p>${d[2]}</p><p class="hand">Je l’observe quand… ${d[3]}</p>`; };
    S.spheres.tick = t => { const a = reduce ? 0 : t * .3; pl.forEach((p, i) => { const th = a + i * Math.PI / 2; p.position.set(Math.cos(th) * 2.7, 2.8 + Math.sin(th * 2) * .35, Math.sin(th) * 2.7); p.scale.setScalar(i === sel ? 1.3 : 1); }); star.rotation.y = a * 2; }; }

  // ---------- pyramide ----------
  { const LAY = ['Écouter', 'Lire', 'Voir, observer', 'Discuter', 'Faire, pratiquer', 'Enseigner aux autres'], LCOL = [CREAM, CREAM, CREAM, GOLD, GOLD, MAUVE];
    const grp = new T.Group(); add('pyr', grp, 0, .35, 0); const layers = []; const tokens = new T.Group(); grp.add(tokens); const H = .62;
    LAY.forEach((n, i) => { const rTop = .3 + i * .55, rBot = .3 + (i + 1) * .55; const g = inked(new T.CylinderGeometry(rTop, rBot, H, 4, 1), LCOL[i], .03); g.children.forEach(c => c.rotation.y = Math.PI / 4); g.userData.target = (5 - i) * (H + .02) + H / 2; g.userData.delay = (5 - i) * .22; g.userData.body.userData.i = i; grp.add(g); layers.push(g); S.pyr.pick.push(g.userData.body);
      const l = lab(n.toUpperCase(), { scale: 3, color: i === 5 ? '#FBF8EF' : '#1E1A22', stroke: i === 5 }); l.material.depthTest = false; l.renderOrder = 10; l.position.set(0, 0, (rTop + rBot) / 2 * .7071 + .1); g.add(l); });
    const st = S.pyr; st.look = 2; st.dist = 10; st.mode = 0; st.votes = store.get('pyr', [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]);
    st.redraw = () => { while (tokens.children.length) tokens.remove(tokens.children[0]); st.votes.forEach((arr, m) => arr.forEach((n, i) => { for (let k = 0; k < n; k++) { const t = inked(new T.CylinderGeometry(.16, .16, .07, 20), m ? MAUVE : GOLD, .08); const r = .3 + (i + .5) * .55; t.position.set((m ? 1 : -1) * (r * .55 + .3 + (k % 4) * .36), layers[i].userData.target + .38 + Math.floor(k / 4) * .09, r * .62); tokens.add(t); } })); };
    st.redraw(); st.onPick = o => { st.votes[st.mode][o.userData.i]++; store.set('pyr', st.votes); st.redraw(); };
    let t0 = -1e9; st.enter = () => { t0 = performance.now(); };
    st.tick = () => layers.forEach(L => { const p = Math.min(1, Math.max(0, ((performance.now() - t0) / 1000 - .9 - L.userData.delay) / .6)); const e = 1 - Math.pow(1 - p, 3); L.position.y = reduce ? L.userData.target : L.userData.target + (1 - e) * 7; }); }

  // ---------- nom → verbe ----------
  { const a = inked(new T.BoxGeometry(1.7, 1.7, 1.7), CREAM, .05); add('nomverbe', a, -2.3, 1.2, 0); add('nomverbe', lab('UN NOM', { scale: 2.4, color: '#FBF8EF' }), -2.3, 2.7, 0); add('nomverbe', lab('résultat', { font: 'Caveat, cursive', size: 80, scale: 2.2, color: '#5B2A86', stroke: false }), -2.3, 3.4, 0);
    const b = inked(new T.BoxGeometry(1.7, 1.7, 1.7), GOLD, .05); add('nomverbe', b, 2.3, 1.2, 0); add('nomverbe', lab('UN VERBE', { scale: 2.4 }), 2.3, 2.7, 0); add('nomverbe', lab('action !', { font: 'Caveat, cursive', size: 80, scale: 2.2, color: '#5B2A86', stroke: false }), 2.3, 3.4, 0);
    const ar = new T.Group(); const sh = inked(new T.CylinderGeometry(.12, .12, 1.6, 10), MAUVE, .15); sh.rotation.z = Math.PI / 2; const tp = inked(new T.ConeGeometry(.35, .6, 12), MAUVE, .1); tp.rotation.z = -Math.PI / 2; tp.position.x = 1; ar.add(sh, tp); add('nomverbe', ar, -.1, 1.2, 0);
    S.nomverbe.look = 2; S.nomverbe.tick = t => { b.rotation.y = t * 1.2; b.position.y = 1.2 + Math.abs(Math.sin(t * 2.4)) * .6; ar.position.x = -.1 + Math.sin(t * 3) * .15; }; }

  // ---------- escalier ----------
  { const steps = []; for (let i = 0; i < 5; i++) { const h = .55 * (i + 1); const s = inked(new T.BoxGeometry(1.1, h, 1.8), i % 2 ? MAUVE : GOLD, .04); add('escalier', s, -2.6 + i * 1.15, .35 + h / 2, 0); steps.push(.35 + h); add('escalier', lab(String(i + 1), { scale: 1.3, color: i % 2 ? '#F2C230' : '#5B2A86' }), -2.6 + i * 1.15, .35 + h + .9, .95); }
    const pole = inked(new T.CylinderGeometry(.04, .04, 1.6, 8), 0x1E1A22, .1); add('escalier', pole, 2.2, steps[4] + .8, -.6); const flag = inked(new T.BoxGeometry(.9, .5, .04), GOLD, .08); add('escalier', flag, 2.65, steps[4] + 1.35, -.6);
    const pw = add('escalier', pawn(CREAM, .55), -2.6, steps[0], .2); S.escalier.look = 2;
    S.escalier.tick = t => { const k = (t * .9) % 6, i = Math.min(4, Math.floor(k)), f = k - Math.floor(k); if (k >= 5) { pw.position.set(2.0, steps[4], .2); return; } const from = i === 0 && f < .001 ? 0 : i; const x0 = -2.6 + Math.max(0, i - 1) * 1.15, x1 = -2.6 + i * 1.15; const y0 = steps[Math.max(0, i - 1)], y1 = steps[i]; pw.position.set(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + Math.sin(f * Math.PI) * .7, .2); flag.rotation.y = Math.sin(t * 4) * .3; }; }

  // ---------- portes A B C ----------
  { const doors = [[GOLD, 'A'], [MAUVE, 'B'], [CREAM, 'C']].map(([c, L], i) => { const x = -2.4 + i * 2.4; const fr = inked(new T.BoxGeometry(1.7, 2.8, .3), 0x1E1A22, .02); add('portes', fr, x, 1.75, 0); const hinge = new T.Group(); add('portes', hinge, x - .7, 1.7, .2); const d = inked(new T.BoxGeometry(1.4, 2.5, .12), c, .05); d.position.x = .7; hinge.add(d); add('portes', lab(L, { size: 110, scale: 1.3, color: c === MAUVE ? '#FBF8EF' : '#F2C230' }), x, 3.7, 0); return hinge; });
    S.portes.look = 2; S.portes.tick = t => doors.forEach((h, i) => { h.rotation.y = -(Math.sin(t * .9 + i * 1.2) * .5 + .5) * 1.3; }); }

  // ---------- écran ----------
  { const st = inked(new T.CylinderGeometry(.12, .12, 1.6, 10), 0x1E1A22, .1); add('ecran', st, 0, 1.15, 0); const fr = inked(new T.BoxGeometry(4.4, 2.6, .25), MAUVE, .03); add('ecran', fr, 0, 3.1, 0);
    const sc = new T.Mesh(new T.PlaneGeometry(4, 2.2), new T.MeshBasicMaterial({ color: 0x1E1A22 })); add('ecran', sc, 0, 3.1, .14); const pl = add('ecran', lab('▶', { size: 110, scale: 1.4 }), 0, 3.1, .3);
    add('ecran', lab('LA PAROLE AUX ÉLÈVES', { scale: 4, w: 1024, size: 70 }), 0, 4.9, 0); S.ecran.look = 3; S.ecran.tick = t => { pl.scale.setScalar(1.4 * (1 + Math.sin(t * 3) * .08)); pl.scale.y *= .25; }; }

  // ---------- table d'idéation ----------
  { const top = inked(new T.BoxGeometry(4.2, .18, 2.4), GOLD, .03); add('table', top, 0, 1.45, 0); [[-1.9, -1], [1.9, -1], [-1.9, 1], [1.9, 1]].forEach(([x, z]) => add('table', inked(new T.CylinderGeometry(.08, .08, 1.1, 8), 0x1E1A22, .1), x, .9, z));
    const ns = []; for (let i = 0; i < 9; i++) { const n = new T.Mesh(new T.PlaneGeometry(.55, .55), toon(i % 3 ? GOLD : CREAM)); n.rotation.x = -Math.PI / 2; n.rotation.z = i; add('table', n, -1.6 + (i % 5) * .8, 1.56, -.6 + Math.floor(i / 5) * .9); ns.push(n); }
    const pw = [add('table', pawn(MAUVE, .55), -2.6, .35, .4), add('table', pawn(CREAM, .55), 2.6, .35, -.2), add('table', pawn(GOLD, .55), 0, .35, 1.8)];
    S.table.look = 1.6; S.table.tick = t => { pw.forEach((p, i) => p.position.y = .35 + Math.max(0, Math.sin(t * 2.2 + i * 2)) * .3); ns.forEach((n, i) => n.position.y = 1.56 + Math.max(0, Math.sin(t * 1.3 + i)) * .25); }; }

  // ---------- idée (Copilot) ----------
  { const bulb = inked(new T.SphereGeometry(1.1, 32, 24), GOLD, .05); add('idee', bulb, 0, 3.3, 0); const base = inked(new T.CylinderGeometry(.55, .45, .8, 20), MAUVE, .06); add('idee', base, 0, 2.05, 0);
    const rays = new T.Group(); for (let i = 0; i < 10; i++) { const r = inked(new T.BoxGeometry(.12, .7, .12), GOLD, .15); const a = i / 10 * Math.PI * 2; r.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0); r.rotation.z = a - Math.PI / 2; rays.add(r); } add('idee', rays, 0, 3.3, 0);
    S.idee.look = 3; S.idee.tick = t => { rays.rotation.z = t * .5; const s = 1 + Math.sin(t * 3) * .06; bulb.scale.setScalar(s); rays.scale.setScalar(1 + Math.sin(t * 3) * .12); }; }

  // ---------- jetons ----------
  { const grp = new T.Group(); add('jetons', grp, 0, .35, 0); const VC = [GOLD, CREAM, MAUVE]; const falling = [];
    S.jetons.look = 1.6; S.jetons.dist = 9.5;
    S.jetons.draw = data => { while (grp.children.length) grp.remove(grp.children[0]); falling.length = 0; const n = data.length; data.forEach((p, i) => { const x = (i - (n - 1) / 2) * 1.35; let y = .02; grp.add(Object.assign(lab((p.n || '').slice(0, 14), { font: 'Caveat, cursive', size: 70, scale: 1.6, color: '#5B2A86', stroke: false }), {}).translateX(x).translateY(-.1).translateZ(1.2));
      [0, 1, 2].forEach(k => { for (let j = 0; j < p.v[k]; j++) { const c = inked(new T.CylinderGeometry(.5, .5, .16, 28), VC[k], .06); c.position.set(x, y + .08 + 4 + j * .2, 0); c.userData.y = y + .08; grp.add(c); falling.push(c); y += .18; } }); }); };
    S.jetons.tick = () => falling.forEach(c => { c.position.y += (c.userData.y - c.position.y) * (reduce ? 1 : .12); }); }

  // ---------- premier pas ----------
  { const steps = []; for (let i = 0; i < 8; i++) { const f = new T.Mesh(new T.CircleGeometry(.28, 20), new T.MeshBasicMaterial({ color: MAUVE })); f.scale.set(1, 1.7, 1); f.rotation.x = -Math.PI / 2; f.rotation.z = -Math.PI / 2; add('pas', f, -3 + i * .8, .37, i % 2 ? .35 : -.35); steps.push(f); }
    const pw = add('pas', pawn(GOLD, .7), -3, .35, 0); add('pas', lab('MON PREMIER PAS', { scale: 3.6, w: 768 }), 0, 3.6, 0);
    S.pas.look = 1.6; S.pas.tick = t => { const k = (t * .5) % 1; pw.position.x = -3 + k * 6; pw.position.y = .35 + Math.abs(Math.sin(k * Math.PI * 8)) * .2; steps.forEach((f, i) => f.material.color.setHex((-3 + i * .8) < pw.position.x ? GOLD : MAUVE)); }; }

  // ---------- maison à 3 étages ----------
  { const floors = [[CREAM, '1ER', 'besoins de base'], [MAUVE, '2E', 'émotions'], [GOLD, '3E', 'apprentissages']].map(([c, n, s], i) => { const g = new T.Group(); const b = inked(new T.BoxGeometry(3, 1.25, 2.2), c, .03); g.add(b); const l = lab(n + ' · ' + s.toUpperCase(), { scale: 3.4, w: 768, size: 60, color: c === MAUVE ? '#FBF8EF' : '#F2C230' }); l.position.set(0, 0, 1.25); l.material.depthTest = false; g.add(l); add('maison', g, 0, .35 + .63 + i * 1.27, 0); return g; });
    const roof = inked(new T.ConeGeometry(2.4, 1.4, 4), MAUVE, .04); roof.rotation.y = Math.PI / 4; add('maison', roof, 0, 4.9, 0);
    let open = 0; const st = S.maison; st.look = 2.6; st.dist = 10;
    st.tick = (t, active) => { open += ((active ? 1 : 0) - open) * .05; floors.forEach((g, i) => { g.position.y = .35 + .63 + i * (1.27 + open * .55); g.rotation.y = open * (i - 1) * .25; }); roof.position.y = .35 + 3 * 1.27 + open * 2 + .7; }; }

  // ---------- caméra ----------
  let camPos = new V(0, 52, 52), camTgt = new V(0, 0, 0), from = null, to = null, t0 = 0, curName = 'aerial', pending = null;
  function poseFor(n) { if (!S[n]) return { p: new V(0, 44, 46), t: new V(0, 0, 4) }; const s = S[n], out = s.g.userData.out, side = new V(-out.z, 0, out.x);
    return { p: s.g.position.clone().add(out.clone().multiplyScalar(s.dist)).add(side.multiplyScalar(2.2)).add(new V(0, s.h, 0)), t: s.g.position.clone().add(new V(0, s.look, 0)) }; }
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function activate(slide) { const i = [...document.querySelectorAll('.slide')].indexOf(slide); const n = STATIONS[i] || 'aerial'; if (n === curName && from === null && to === null && pending === null) { S[n] && S[n].enter && S[n].enter(); return; }
    curName = n; const pose = poseFor(n); if (reduce) { camPos.copy(pose.p); camTgt.copy(pose.t); } else { from = { p: camPos.clone(), t: camTgt.clone() }; to = pose; t0 = performance.now(); } S[n] && S[n].enter && S[n].enter(); }
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; if (w > 820) camera.setViewOffset(w, h, -w * .21, 0, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  const clock = new T.Clock();
  (function loop() { requestAnimationFrame(loop); const t = clock.getElapsedTime();
    if (to) { const k = Math.min(1, (performance.now() - t0) / 1900), e = ease(k); camPos.lerpVectors(from.p, to.p, e); camPos.y += Math.sin(Math.PI * e) * Math.min(16, from.p.distanceTo(to.p) * .35); camTgt.lerpVectors(from.t, to.t, e); if (k >= 1) { from = to = null; } }
    const sw = reduce ? 0 : Math.sin(t * .25) * .5; camera.position.set(camPos.x + sw, camPos.y + (reduce ? 0 : Math.sin(t * .4) * .12), camPos.z); camera.lookAt(camTgt);
    NAMES.forEach(n => S[n].tick && S[n].tick(t, n === curName)); renderer.render(scene, camera); })();
  // pointeur : clic sur une station active, glisser pour tourner le globe
  const ray = new T.Raycaster(), mv = new T.Vector2(); let drag = null;
  cv.addEventListener('pointerdown', e => { const s = S[curName]; if (!s) return; drag = e.clientX; if (!s.pick.length || !s.onPick) return; mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mv, camera); const h = ray.intersectObjects(s.pick, false)[0]; if (h) s.onPick(h.object); });
  addEventListener('pointermove', e => { if (drag === null) return; S[curName] && S[curName].drag && S[curName].drag(e.clientX - drag); drag = e.clientX; });
  addEventListener('pointerup', () => { drag = null; });
  return { activate, st: S };
})();

// globe : formulaire
$('#enjeuForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#enjeuIn').value.trim(); if (!v || !G3.st.globe) return; G3.st.globe.add(v); $('#enjeuIn').value = ''; });
$('#enjeuClear').onclick = () => G3.st.globe && G3.st.globe.clear();
// pyramide : bascule
$('#pyrSwitch').onclick = () => { const s = G3.st.pyr; if (!s) return; s.mode = 1 - s.mode; $('#pyrQ').textContent = s.mode ? 'Où se situe l’atelier d’aujourd’hui ?' : 'Où se situait votre dernière formation ?'; $('#pyrSwitch').textContent = s.mode ? 'Revenir à la dernière formation' : 'Et l’atelier d’aujourd’hui ?'; };
$('#pyrReset').onclick = () => { const s = G3.st.pyr; if (!s) return; s.votes = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]; store.set('pyr', s.votes); s.redraw(); };
// votes
const vData = store.get('votes', [1, 2, 3, 4, 5].map(i => ({ n: 'Îlot ' + i, v: [0, 0, 0] })));
const vEl = $('#votes');
function drawVotes() { vEl.innerHTML = ''; vData.forEach((p, i) => { const d = document.createElement('div'); d.innerHTML = `<input type="text" id="vn${i}" aria-label="Nom du projet ${i + 1}" value="${p.n.replace(/"/g, '&quot;')}"><div><button style="background:var(--gold)">+ I</button><button style="background:var(--paper)">+ F</button><button style="background:var(--mauve);color:var(--paper)">+ O</button></div><div class="cap">${p.v[0]} · ${p.v[1]} · ${p.v[2]}</div>`;
  d.querySelector('input').onchange = e => { p.n = e.target.value; store.set('votes', vData); G3.st.jetons && G3.st.jetons.draw(vData); };
  d.querySelectorAll('button').forEach((b, k) => b.onclick = () => { p.v[k]++; store.set('votes', vData); drawVotes(); });
  vEl.appendChild(d); }); G3.st.jetons && G3.st.jetons.draw(vData); }
drawVotes();
const rz = document.createElement('button'); rz.className = 'btn alt'; rz.textContent = 'Remettre à zéro'; rz.style.marginTop = '10px'; rz.onclick = () => { vData.forEach(p => p.v = [0, 0, 0]); store.set('votes', vData); drawVotes(); }; vEl.after(rz);
