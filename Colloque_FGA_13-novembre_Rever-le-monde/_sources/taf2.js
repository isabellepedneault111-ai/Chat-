const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [f, out] of [['affiche', 'affiche'], ['affiche_monde', 'affiche_monde'], ['affiche_projet', 'affiche_projet']]) {
    const p = await b.newPage({ viewport: { width: 1056, height: 1632 } }); await p.goto('file://' + __dirname + '/' + f + '.html'); await p.waitForTimeout(700);
    await p.pdf({ path: __dirname + '/' + out + '.pdf', width: '11in', height: '17in', printBackground: true }); await p.screenshot({ path: __dirname + '/' + out + '_prev.jpg', quality: 60 });
    if (f === 'affiche') { const p2 = await b.newPage({ viewport: { width: 1056, height: 1632 }, deviceScaleFactor: 2 }); await p2.goto('file://' + __dirname + '/affiche.html'); await p2.waitForTimeout(700); await p2.screenshot({ path: __dirname + '/img/affiche_mur.png' }); }
  } await b.close(); })();
