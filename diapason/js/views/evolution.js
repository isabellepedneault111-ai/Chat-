// Notre évolution : rendre visibles les progrès de Zaza et Frog.
// Graphiques SVG sobres (traits de 2 px, points cerclés, grille discrète), survol + vue tableau.
import { espace, onEspace, profileOf } from '../espace.js';
import { nameFR } from '../music.js';
import { MEMBERS, EVAL, STAGES } from '../duo.js';
import { esc, espaceGate } from './carnet.js';

const DAY = 86400000;
const WEEK = 7 * DAY;
const COL = { Zaza: '#b04e00', Frog: '#5b3a8c', ensemble: '#1b1915' }; // braise et mûre : distinctes aussi pour un daltonien
const colorOf = (n, mem) => (n === mem[1] ? COL.Frog : COL.Zaza);
const fmtDate = (t) => new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const monday = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() - ((d.getDay() + 6) % 7) * DAY; };

// Petit graphique de lignes (y de 1 à 10) : un par critère, les deux personnes dedans.
function lineChart(series, { t0, t1, title }) {
  const W = 300; const H = 150; const L = 22; const R = 34; const T = 12; const B = 22;
  const x = (t) => L + ((t - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (v - 1) / 9) * (H - T - B);
  const grid = [1, 5, 10].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${L - 6}" y="${y(v) + 3}" class="ax" text-anchor="end">${v}</text>`).join('');
  const lines = series.filter((s) => s.pts.length).map((s) => {
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const last = s.pts[s.pts.length - 1];
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${s.pts.map((p) => `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="4.5" fill="${s.color}" stroke="var(--card)" stroke-width="2"/><circle cx="${x(p.t)}" cy="${y(p.v)}" r="12" fill="transparent" data-tip="${esc(s.name)} · ${esc(title)}<br>${fmtDate(p.t)} : <b>${p.v} / 10</b>"/>`).join('')}
      <text x="${x(last.t) + 8}" y="${y(last.v) + 4}" class="lbl">${esc(s.name[0])} ${last.v}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="viz" role="img" aria-label="${esc(title)} dans le temps">${grid}${lines}
    <text x="${L}" y="${H - 6}" class="ax">${fmtDate(t0)}</text><text x="${W - R}" y="${H - 6}" class="ax" text-anchor="end">${fmtDate(t1)}</text></svg>`;
}

// Colonnes empilées : sessions par semaine (ensemble, solo de chacun), 2 px d'air entre les segments.
function weekBars(weeks, keys, colors, labels) {
  const W = 960; const H = 240; const L = 26; const R = 8; const T = 10; const B = 26;
  const max = Math.max(3, ...weeks.map((w) => keys.reduce((s, k) => s + w[k], 0)));
  const step = (W - L - R) / weeks.length;
  const bw = Math.min(24, step * 0.6);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, Math.ceil(max / 2), max].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${L - 6}" y="${y(v) + 3}" class="ax" text-anchor="end">${v}</text>`).join('');
  const bars = weeks.map((w, i) => {
    let acc = 0;
    const cx = L + step * i + step / 2;
    const segs = keys.map((k, j) => {
      if (!w[k]) return '';
      const y0 = y(acc); acc += w[k]; const y1 = y(acc);
      const top = keys.slice(j + 1).every((kk) => !w[kk]);
      const h = Math.max(0, y0 - y1 - 2);
      return top
        ? `<path d="M${cx - bw / 2},${y0 - 2} V${y1 + 4} Q${cx - bw / 2},${y1} ${cx - bw / 2 + 4},${y1} H${cx + bw / 2 - 4} Q${cx + bw / 2},${y1} ${cx + bw / 2},${y1 + 4} V${y0 - 2} Z" fill="${colors[j]}"/>`
        : `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${h}" fill="${colors[j]}"/>`;
    }).join('');
    const total = keys.reduce((s, k) => s + w[k], 0);
    return `${segs}<rect x="${cx - step / 2}" y="${T}" width="${step}" height="${H - T - B}" fill="transparent" data-tip="Semaine du ${fmtDate(w.t)}<br>${keys.map((k, j) => `${labels[j]} : <b>${w[k]}</b>`).join('<br>')}"/>
      ${i % 2 === weeks.length % 2 ? '' : `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${fmtDate(w.t)}</text>`}${total && i === weeks.length - 1 ? `<text x="${cx}" y="${y(total) - 5}" class="lbl" text-anchor="middle">${total}</text>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="viz wide" role="img" aria-label="Sessions par semaine">${ticks}${bars}</svg>`;
}

// Courbe cumulée des idées (une seule série : pas de légende, le titre la nomme).
function cumulative(pts) {
  const W = 960; const H = 220; const L = 26; const R = 30; const T = 12; const B = 24;
  if (pts.length < 2) return '<p class="muted small">La courbe apparaît après quelques idées.</p>';
  const t0 = pts[0].t; const t1 = Math.max(pts[pts.length - 1].t, t0 + DAY);
  const max = pts[pts.length - 1].v;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - v / Math.max(1, max)) * (H - T - B);
  const d = pts.map((p, i) => `${i ? `H${x(p.t).toFixed(1)}V` : `M${x(p.t).toFixed(1)},`}${y(p.v).toFixed(1)}`).join('');
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="viz wide" role="img" aria-label="Idées au fil du temps">
    ${[0, Math.round(max / 2), max].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${L - 6}" y="${y(v) + 3}" class="ax" text-anchor="end">${v}</text>`).join('')}
    <path d="${d}V${y(0)}H${x(t0)}Z" fill="#1b1915" opacity=".08"/>
    <path d="${d}" fill="none" stroke="#1b1915" stroke-width="2" stroke-linejoin="round"/>
    ${pts.filter((_, i) => i % Math.ceil(pts.length / 30) === 0 || i === pts.length - 1).map((p) => `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="12" fill="transparent" data-tip="${fmtDate(p.t)} : <b>${p.v}</b> idée${p.v > 1 ? 's' : ''}<br>${esc(p.title || '')}"/>`).join('')}
    <circle cx="${x(last.t)}" cy="${y(last.v)}" r="4.5" fill="#1b1915" stroke="var(--card)" stroke-width="2"/>
    <text x="${x(last.t) + 8}" y="${y(last.v) + 4}" class="lbl">${last.v}</text>
    <text x="${L}" y="${H - 6}" class="ax">${fmtDate(t0)}</text><text x="${W - R}" y="${H - 6}" class="ax" text-anchor="end">${fmtDate(t1)}</text></svg>`;
}

// Étendue vocale : une barre flottante (grave → aigu) par test, par personne.
function voiceChart(people) {
  const all = people.flatMap((p) => p.hist);
  if (!all.length) return '<p class="muted small">Faites le test de tessiture (Voix → Empreinte) : chaque test ajoute une barre ici.</p>';
  const lo = Math.min(...all.map((h) => h.low)) - 2; const hi = Math.max(...all.map((h) => h.high)) + 2;
  const rows = people.flatMap((p) => p.hist.map((h) => ({ ...h, name: p.name, color: p.color })));
  const W = 960; const L = 130; const R = 16; const rowH = 26; const H = rows.length * rowH + 30;
  const x = (m) => L + ((m - lo) / (hi - lo)) * (W - L - R);
  const ticks = [];
  for (let m = Math.ceil(lo / 12) * 12; m <= hi; m += 12) ticks.push(`<line x1="${x(m)}" x2="${x(m)}" y1="4" y2="${H - 22}" class="g"/><text x="${x(m)}" y="${H - 8}" class="ax" text-anchor="middle">${nameFR(m)}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" class="viz wide" role="img" aria-label="Étendue vocale au fil des tests">${ticks.join('')}
    ${rows.map((r, i) => { const yy = 8 + i * rowH; return `<text x="${L - 8}" y="${yy + 13}" class="ax" text-anchor="end">${esc(r.name)} · ${fmtDate(r.at)}</text>
      <rect x="${x(r.low)}" y="${yy + 3}" width="${Math.max(4, x(r.high) - x(r.low))}" height="14" rx="4" fill="${r.color}"/>
      <rect x="${L}" y="${yy}" width="${W - L - R}" height="${rowH - 4}" fill="transparent" data-tip="${esc(r.name)} · ${fmtDate(r.at)}<br>${nameFR(r.low)} → ${nameFR(r.high)} (<b>${r.high - r.low}</b> demi-tons)"/>`; }).join('')}</svg>`;
}

export default {
  id: 'evolution',
  mount(el) {
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const mem = espace.meta.members || MEMBERS;
      const E = espace.entries;
      const sessions = E.filter((e) => e.type === 'session' && e.data?.done);
      const minutes = sessions.reduce((s, e) => s + Math.max(0, Math.min(240, (e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)), 0);
      const creative = E.filter((e) => ['note', 'texte', 'audio', 'essai', 'paroles'].includes(e.type)).sort((a, b) => a.createdAt - b.createdAt);
      const fixed = E.filter((e) => ['note', 'texte', 'audio', 'essai', 'paroles', 'lien'].includes(e.type) && (e.data?.stage ?? 0) >= 3).length;
      const bravos = E.filter((e) => e.type === 'bravo');
      const evals = E.filter((e) => e.type === 'evaluation' && e.data?.v === 2).sort((a, b) => a.createdAt - b.createdAt);

      // Sessions par semaine (12 dernières semaines)
      const now = monday(Date.now());
      const weeks = Array.from({ length: 12 }, (_, i) => ({ t: now - (11 - i) * WEEK, ensemble: 0, [mem[0]]: 0, [mem[1]]: 0 }));
      sessions.forEach((s) => {
        const w = weeks.find((x) => s.data.doneAt >= x.t && s.data.doneAt < x.t + WEEK);
        if (!w) return;
        if (s.data.format === 'solo') w[s.author] = (w[s.author] || 0) + 1; else w.ensemble++;
      });
      // Autoévaluations : une série par personne évaluée
      const t0 = evals.length ? evals[0].createdAt : Date.now() - WEEK;
      const t1 = evals.length ? Math.max(evals[evals.length - 1].createdAt, t0 + DAY) : Date.now();
      const evalSeries = (c) => mem.map((m) => ({ name: m, color: colorOf(m, mem), pts: evals.filter((e) => e.data.about === m && e.data.scores?.[c.id]).map((e) => ({ t: e.createdAt, v: e.data.scores[c.id] })) }));
      const cum = creative.map((e, i) => ({ t: e.createdAt, v: i + 1, title: e.title }));
      const voices = mem.map((m) => ({ name: m, color: colorOf(m, mem), hist: (profileOf(m)?.voixHist || (profileOf(m)?.voix ? [profileOf(m).voix] : [])) }));
      const legend = `<p class="viz-legend">${mem.map((m) => `<span><i style="background:${colorOf(m, mem)}"></i>${esc(m)}</span>`).join('')}</p>`;
      const stat = (n, l) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`;

      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Notre évolution</p>
            <h1>Regarde-nous aller</h1>
            <p class="muted">Tout se remplit tout seul : chaque session, chaque idée, chaque autoévaluation, chaque bravo.</p>
          </div>
          <a class="btn" href="#/carnet">+ Une autoévaluation</a>
        </div>
        <div class="stats-row">
          ${stat(`${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, '0')}`, 'jouées ensemble ou seuls')}
          ${stat(sessions.length, 'sessions')}
          ${stat(creative.length, 'idées')}
          ${stat(fixed, 'fixées ou dans le set')}
          ${mem.map((m) => stat(bravos.filter((b) => b.data?.to === m).length, `bravos reçus · ${esc(m)}`)).join('')}
        </div>
        <section class="panel">
          <div class="panel-head"><h2>Comment on se sent progresser</h2>${legend}</div>
          ${evals.length ? `<div class="small-multiples">${EVAL.map((c) => `<figure><figcaption>${c.label}</figcaption>${lineChart(evalSeries(c), { t0, t1, title: c.label })}</figure>`).join('')}</div>`
            : '<p class="muted">Pas encore d’autoévaluation. Sur le mur : « Bilan, évaluation… » → Évaluation. Deux minutes, des curseurs, et un bravo pour l’autre.</p>'}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Nos sessions, semaine après semaine</h2>
            <p class="viz-legend"><span><i style="background:${COL.ensemble}"></i>Ensemble</span>${mem.map((m) => `<span><i style="background:${colorOf(m, mem)}"></i>Solo ${esc(m)}</span>`).join('')}</p></div>
          ${weekBars(weeks, ['ensemble', mem[0], mem[1]], [COL.ensemble, colorOf(mem[0], mem), colorOf(mem[1], mem)], ['Ensemble', `Solo ${mem[0]}`, `Solo ${mem[1]}`])}
          <p class="muted small">Le rythme visé : 2 sessions ensemble et 3 micro-sessions solo chacun par semaine.</p>
        </section>
        <section class="panel"><h2>Nos idées au fil du temps</h2>${cumulative(cum)}
          <p class="muted small">Aujourd’hui : ${STAGES.map((s) => `${E.filter((e) => ['note', 'texte', 'audio', 'essai', 'paroles', 'lien'].includes(e.type) && (e.data?.stage ?? (e.type === 'paroles' ? 2 : 0)) === s.id).length} ${s.label.toLowerCase()}`).join(' · ')}</p></section>
        <section class="panel"><div class="panel-head"><h2>Nos voix</h2>${legend}</div>${voiceChart(voices)}</section>
        <details class="panel data-table"><summary>Voir les données en tableau</summary>
          <table><thead><tr><th>Date</th><th>Qui</th>${EVAL.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
            <tbody>${evals.map((e) => `<tr><td>${fmtDate(e.createdAt)}</td><td>${esc(e.data.about)}</td>${EVAL.map((c) => `<td>${e.data.scores?.[c.id] ?? ''}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="8">—</td></tr>'}</tbody></table>
          <table><thead><tr><th>Semaine</th><th>Ensemble</th>${mem.map((m) => `<th>Solo ${esc(m)}</th>`).join('')}</tr></thead>
            <tbody>${weeks.map((w) => `<tr><td>${fmtDate(w.t)}</td><td>${w.ensemble}</td>${mem.map((m) => `<td>${w[m] || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>
        </details>
        <div class="viz-tip" hidden></div>`;
    }

    // Une infobulle pour tous les graphiques.
    el.addEventListener('pointermove', (e) => {
      const tip = el.querySelector('.viz-tip');
      if (!tip) return;
      const t = e.target.closest('[data-tip]');
      if (!t) { tip.hidden = true; return; }
      tip.innerHTML = t.dataset.tip;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      tip.style.left = `${Math.min(e.clientX - r.left + 14, r.width - 200)}px`;
      tip.style.top = `${e.clientY - r.top + 14}px`;
    });
    el.addEventListener('pointerleave', () => { const tip = el.querySelector('.viz-tip'); if (tip) tip.hidden = true; });
    const off = onEspace((w) => { if (w === 'entries' || w === 'meta') render(); });
    render();
    return () => off();
  },
};
