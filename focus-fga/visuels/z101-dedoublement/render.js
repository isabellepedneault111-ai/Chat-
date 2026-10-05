// Rend chaque visuel en PNG 1920×1080 et assemble un PDF de présentation.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  await p.evaluate(async () => { await Promise.all(['400 40px "League Gothic"','400 20px Montserrat','700 20px Montserrat','800 20px Montserrat','700 20px "Space Mono"'].map(f => document.fonts.load(f))); await document.fonts.ready; });
  await p.waitForTimeout(800);
  const ids = await p.$$eval('.slide', s => s.map(e => e.id));
  for (const [i, id] of ids.entries()) {
    const over = await p.$eval('#' + id, e => [...e.querySelectorAll('*')].some(c => { const r = c.getBoundingClientRect(), R = e.getBoundingClientRect(); if (c.closest('.pied')) return false; return r.bottom > R.bottom - 100 || r.right > R.right - 100; }));
    if (over) console.log('Débordement sur', id, over);
    await (await p.$('#' + id)).screenshot({ path: `snapshots/z101-${String(i + 1).padStart(2, '0')}.png` });
  }
  await p.pdf({ path: 'Z101-dedoublement.pdf', width: '1920px', height: '1080px', printBackground: true });
  await b.close();
})();
