// Rend chaque visuel HTML (élément #v) en PNG haute résolution : node render.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
const fichiers = process.argv.slice(2).length ? process.argv.slice(2) : ['menu', 'etapes', 'besoins'];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1.5 });
  for (const f of fichiers) {
    await p.goto('file://' + path.resolve(__dirname, f + '.html'));
    await p.evaluate(async () => { await Promise.all(['800 20px Montserrat', '700 20px Montserrat', '500 20px Montserrat'].map(x => document.fonts.load(x))); await document.fonts.ready; });
    await (await p.$('#v')).screenshot({ path: path.join(__dirname, f + '.png') });
    console.log(f);
  }
  await b.close();
})();
