// Génère Projet-Z101.pdf à partir de projet.html : node pdf.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, 'projet.html'), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await Promise.all(['800 20px Montserrat', '700 20px Montserrat', '500 20px Montserrat', '400 20px Montserrat'].map(f => document.fonts.load(f))); await document.fonts.ready; });
  // signale tout contenu qui déborde de sa page
  const deb = await p.$$eval('.page', ps => ps.map((pg, i) => { const R = pg.getBoundingClientRect(); const pied = pg.querySelector('.pied'); const lim = pied ? pied.getBoundingClientRect().top : R.bottom;
    const trop = [...pg.children].filter(c => c !== pied && !c.classList.contains('chiffres') && c.getBoundingClientRect().bottom > lim + 1); return trop.length ? 'page ' + (i + 1) : null; }).filter(Boolean));
  if (deb.length) console.log('Débordement :', deb.join(', '));
  await p.pdf({ path: path.join(__dirname, 'Projet-Z101.pdf'), preferCSSPageSize: true, printBackground: true });
  await b.close();
  console.log('ok');
})();
