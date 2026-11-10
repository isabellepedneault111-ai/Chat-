const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 946, height: 711 }, deviceScaleFactor: 3 });
  await p.goto('file://' + __dirname + '/venn_land.html'); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/img/venn_land_h.png' }); await b.close(); })();
