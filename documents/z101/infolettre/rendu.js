// Rend encart.html en PNG puis en JPG : node rendu.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2400, height: 930 } });
  await p.goto('file://' + path.resolve(__dirname, 'encart.html'));
  await p.evaluate(async () => { await Promise.all(['40px "Didact Gothic"', '800 40px Montserrat', '40px "League Gothic"'].map(f => document.fonts.load(f))); await document.fonts.ready; });
  const trop = await p.$eval('.cadre', c => [...c.querySelectorAll('*')].some(e => e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().bottom > c.getBoundingClientRect().bottom - 30));
  if (trop) console.log('Attention : débordement');
  await (await p.$('#v')).screenshot({ path: path.join(__dirname, 'encart.png') });
  await b.close();
})();
