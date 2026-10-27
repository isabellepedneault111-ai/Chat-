// Joue toute la tournée automatiquement et vérifie qu'il n'y a pas d'erreur.
// Usage : node tester.js <chemin du jeu .html ou URL> <dossier de captures>
// Produit : captures de l'accueil, de la carte, de chaque station (décor), de quelques défis, du bilan,
// des activités de réinvestissement, de l'espace enseignant, une vue mobile, et les PDF (bilan, défi).
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] })); }
const { chromium } = pw;
const path = require('path');
const fs = require('fs');
const CIBLE = process.argv[2], OUT = process.argv[3];
if (!CIBLE || !OUT) { console.error('Usage : node tester.js jeu.html dossier'); process.exit(2); }
const URL = /^https?:/.test(CIBLE) ? CIBLE : 'file://' + path.resolve(CIBLE);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 900, height: 1000 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page : ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push('console : ' + m.text()); });
  await p.goto(URL); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/01_accueil.png', fullPage: true });
  await p.fill('#pn', 'Testeur');
  await p.click('#nv'); await p.waitForTimeout(1700);
  await p.screenshot({ path: OUT + '/02_carte.png', fullPage: true });
  let nQ = 0, nSt = 0, fini = false;
  for (let g = 0; g < 400 && !fini; g++) {
    const scr = await p.evaluate(() => document.getElementById('vb') ? 'autoeval' : document.getElementById('dl') ? 'bilan' :
      document.getElementById('qc') ? 'q' : document.getElementById('sk') ? 'intro' : document.querySelector('svg.decor') ? 'station' : document.getElementById('go') ? 'go' : 'autre');
    if (scr === 'intro') { if (nSt === 0) { await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/03_capsule.png', fullPage: true }); } await p.click('#sk'); await p.waitForTimeout(250); continue; }
    if (scr === 'station') { await p.waitForTimeout(700); if (await p.$('#sk2')) { await p.screenshot({ path: OUT + `/st_${String(nSt++).padStart(2, '0')}.png` }); await p.click('#sk2'); await p.waitForTimeout(250); continue; } await p.screenshot({ path: OUT + `/st_${String(nSt++).padStart(2, '0')}.png` }); await p.click('#go'); await p.waitForTimeout(250); continue; }
    if (scr === 'go') { await p.click('#go'); await p.waitForTimeout(250); continue; }
    if (scr === 'autoeval') { for (const gr of await p.$$('.av')) await (await gr.$$('button'))[0].click(); await p.click('#vb'); await p.waitForTimeout(600); continue; }
    if (scr === 'bilan') { fini = true; break; }
    if (scr !== 'q') { errs.push('écran inconnu'); break; }
    const faux = nQ % 4 === 2; // une erreur de temps en temps, pour tester le 2e essai
    if (nQ % 5 === 1) { const hb = await p.$('#hb'); if (hb) await hb.click(); }
    await p.evaluate(({ faux }) => {
      const q = Q[S.i], z = document.getElementById('zone'), c = el => el && el.click();
      const fait = w => { switch (q.type) {
        case 'droite': c(z.querySelector(`[data-v="${w ? (rond(q.p) === q.a ? q.a + 1 : q.a) : rond(q.p)}"]`)); break;
        case 'tri': q.items.forEach((it, k) => { c(z.querySelector(`.tag[data-k="${k}"]`)); c(z.querySelectorAll('.bin')[w && k === 0 ? (it[1] + 1) % q.bins.length : it[1]]); }); c(z.querySelector('#vt')); break;
        case 'jetons': q.items.forEach((it, k) => { const n = z.querySelector(`#tr${k}`).querySelectorAll('svg').length, cible = rond(it[1]) + (w && k === 0 ? 1 : 0); for (let j = n; j < cible; j++) c(z.querySelector(`.pm[data-k="${k}"][data-d="1"]`)); for (let j = n; j > cible; j--) c(z.querySelector(`.pm[data-k="${k}"][data-d="-1"]`)); }); c(z.querySelector('#vj')); break;
        case 'qcm': c(z.querySelector(`[data-k="${w ? (q.rep + 1) % q.opts.length : q.rep}"]`)); break;
        case 'num': z.querySelector('#ni').value = w ? String(q.okMax + 100) : String(q.okMin); c(z.querySelector('#nv')); break;
        case 'assez': case 'vf': c(z.querySelector(`[data-v="${(w ? !q.rep : q.rep) ? 1 : 0}"]`)); break;
        case 'ordre': if (w) { [...q.steps.keys()].reverse().forEach(k => c(z.querySelector(`.ord [data-k="${k}"]`))); } else { q.steps.forEach((s, k) => c(z.querySelector(`.ord [data-k="${k}"]`))); } c(z.querySelector('#ov')); break;
        case 'curseur': { const r = z.querySelector('#rg'); r.value = w ? (q.max > q.okMax ? q.max : q.min) : q.okMin; r.dispatchEvent(new Event('input')); c(z.querySelector('#vc')); break; }
        case 'erreur': c(z.querySelector(`[data-k="${w ? q.lignes.findIndex((l, i) => !q.bad.includes(i)) : q.bad[0]}"]`)); break;
        case 'texte': { const t = z.querySelector('#tx'); t.value = 'Voici mon explication avec mes mots, étape par étape.'; t.dispatchEvent(new Event('input')); c(z.querySelector('#tv')); break; }
      } };
      fait(faux); if (faux && !cur.done) fait(false);
    }, { faux });
    await p.waitForTimeout(450);
    if (nQ < 3 || nQ % 6 === 0 || (await p.evaluate(() => !!Q[S.i].visuel))) await p.screenshot({ path: OUT + `/q_${String(nQ).padStart(2, '0')}.png`, fullPage: true });
    if (!(await p.evaluate(() => cur.done))) { errs.push('défi non terminé : ' + (await p.evaluate(() => Q[S.i].id))); break; }
    nQ++; await p.click('#nx'); await p.waitForTimeout(220);
  }
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/90_bilan.png', fullPage: true });
  await p.fill('#pp', ''); await p.click('#dl');
  if (!(await p.textContent('#pm'))) errs.push('le prénom n’est pas exigé avant le téléchargement');
  if (await p.$('#r2')) { // panier
    await p.click('#r2');
    await p.click('.cat [data-k="0"][data-d="1"]'); await p.click('.cat [data-k="0"][data-d="1"]'); await p.click('.cat [data-k="1"][data-d="1"]'); await p.click('.cat [data-k="1"][data-d="0"]');
    const q0 = await p.evaluate(() => document.querySelectorAll('.qc').length);
    if (q0 !== 1) errs.push('panier : retirer un article ne fonctionne pas');
    await p.fill('#es', '10'); await p.click('#cs'); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + '/91_panier.png', fullPage: true }); await p.click('#rt');
  }
  for (const [bt, kind] of [['#r3', 'argent'], ['#r4', 'question']]) { // studio de création (affiche TNI)
    if (!(await p.$(bt))) continue;
    await p.click(bt); await p.waitForTimeout(300);
    const st = await p.$$('[data-st]'); if (st.length > 1) await st[1].click();
    await p.screenshot({ path: OUT + `/97_${kind}_1lieu.png`, fullPage: true }); await p.click('#sv');
    if (kind === 'argent') { await p.click('[data-f="assez"]'); await p.check('#dt'); } else await p.click('[data-f="qcm"]');
    await p.click('#sv');
    if (await p.$('#insp')) await p.click('#insp');
    else { await p.fill('#qq', 'Quelle est la bonne réponse à ma question de test ?'); const cc = await p.$$('.cc'); for (const [k, i] of cc.entries()) await i.fill('Choix ' + k); }
    await p.waitForTimeout(300); await p.screenshot({ path: OUT + `/97_${kind}_3contenu.png`, fullPage: true });
    await p.click('#sv'); if (await p.isVisible('#msg') && (await p.textContent('#msg'))) errs.push(kind + ' : étape contenu refusée : ' + await p.textContent('#msg'));
    if (kind === 'argent') { await p.fill('#rp', 'J’arrondis et j’additionne : environ 12 $.'); await p.click('#vc2'); }
    else if (await p.$('#pq')) await p.fill('#pq', 'Parce que c’est ce qu’on a appris en classe.');
    await p.click('#sv');
    await p.click('[data-sk="eclair"]'); await p.click('[data-et="2"]'); await p.click('[data-ch="30"]');
    await p.waitForTimeout(400); await p.screenshot({ path: OUT + `/97_${kind}_5finition.png`, fullPage: true }); await p.click('#sv');
    const [dd] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#dpdf')]); await dd.saveAs(OUT + '/' + dd.suggestedFilename());
    await p.waitForTimeout(1200); if (!(await p.$('.tm'))) errs.push(kind + ' : étapes Teams absentes');
    await p.screenshot({ path: OUT + `/97_${kind}_6publier.png`, fullPage: true }); await p.click('#fn'); await p.waitForTimeout(300);
  }
  if (await p.$('#r1')) { await p.click('#r1'); await p.click('.choix[data-k]'); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/93_capsule.png', fullPage: true }); await p.click('#rt'); }
  await p.fill('#pp', 'Testeur Éloïse');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#dl')]); await dl.saveAs(OUT + '/' + dl.suggestedFilename());
  // arrêt en cours de route
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('arrêt : ' + e.message));
  await p2.goto(URL); await p2.waitForTimeout(300); await p2.click('#nv'); await p2.waitForTimeout(300);
  await p2.evaluate(() => { S.vus = {}; }); // rien
  // mobile
  const m = await b.newPage({ viewport: { width: 380, height: 800 } }); m.on('pageerror', e => errs.push('mobile : ' + e.message));
  await m.goto(URL); await m.waitForTimeout(400); await m.screenshot({ path: OUT + '/95_mobile.png', fullPage: true });
  const sw = await m.evaluate(() => document.documentElement.scrollWidth); if (sw > 381) errs.push('défilement horizontal sur mobile : ' + sw);
  const cle = await m.evaluate(() => CFG.cleEnseignant || 'enseignant');
  await m.goto(URL + '?mode=' + cle); await m.waitForTimeout(400); await m.screenshot({ path: OUT + '/96_enseignant.png', fullPage: true });
  console.log(`${nQ} défis joués, ${nSt} stations vues.`);
  console.log(errs.length ? 'ERREURS :\n- ' + errs.join('\n- ') : 'Aucune erreur.');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
