// node rendre.js entree1.html sortie1.pdf [entree2.html sortie2.pdf ...] : signale les pages qui débordent
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: ['/tmp/claude-0/pps/gen', process.cwd()] })); }
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage(); const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    await p.goto('file://' + a[i], { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const over = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
      const f = pg.querySelector('.foot'); const pb = pg.getBoundingClientRect().bottom - 30; const lim = f ? Math.min(f.getBoundingClientRect().top, pb) : pb; let w = 0;
      pg.querySelectorAll('*').forEach(e => { if (f && (e === f || f.contains(e)) || e.closest('.deco')) return; const r = e.getBoundingClientRect(); if (r.height && r.width) w = Math.max(w, r.bottom - lim); });
      return w > 1 ? `page ${i + 1} déborde de ${Math.round(w)} px` : null; }).filter(Boolean));
    if (over.length) console.log('DÉBORDE', a[i + 1].split('/').pop(), over.join('; '));
    await p.pdf({ path: a[i + 1], width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true });
  }
  await b.close();
})();
