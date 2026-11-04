const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 1000 } });
  await p.goto('file://' + __dirname + '/plates.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const id of ['cover','billet','maison','gngv','pyramide','spheres','escalier','jetons']) {
    await (await p.$('#' + id + ' svg')).screenshot({ path: __dirname + '/img/il_' + id + '.png', omitBackground: true });
  }
  await b.close();
})();
