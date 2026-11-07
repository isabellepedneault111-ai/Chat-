const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1056, height: 1632 }, deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/affiche.html'); await p.waitForTimeout(800);
  await p.pdf({ path: __dirname + '/affiche.pdf', width: '11in', height: '17in', printBackground: true });
  await p.screenshot({ path: __dirname + '/affiche_prev.jpg', quality: 70 });
  const p2 = await b.newPage({ viewport: { width: 1056, height: 1632 }, deviceScaleFactor: 2 }); await p2.goto('file://' + __dirname + '/affiche.html'); await p2.waitForTimeout(800);
  await p2.screenshot({ path: __dirname + '/img/affiche_mur.png' }); await b.close();
})();
