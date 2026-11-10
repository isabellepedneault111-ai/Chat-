const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/cahier.html'); await p.waitForTimeout(800);
  const over = await p.$$eval('.pg .in', ins => ins.map((e, i) => [i + 1, e.scrollHeight - e.clientHeight]).filter(x => x[1] > 2));
  console.log('débordements', JSON.stringify(over));
  await p.pdf({ path: __dirname + '/cahier.pdf', width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true }); await b.close(); })();
