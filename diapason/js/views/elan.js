// Notre élan : la tresse du duo. Deux fils, un par personne, dans le temps. Chaque création est un nœud sur son fil ;
// chaque réponse, un lien d'un fil à l'autre. Plus on échange un jour, plus les fils se rapprochent ; une séance
// ensemble, ils se touchent. Les jours calmes, ils s'écartent, sans reproche. Pas de score : un mouvement, et ses mots.
import { espace, onEspace } from '../espace.js';
import { MEMBERS, memberColor } from '../duo.js';
import { esc, espaceGate } from './carnet.js';
import { echanges, creations, seances, montees, lecture } from '../elan.js';

const J = 864e5;
const jourDe = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const date = (t) => new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const PERIODES = [['14', 'Ces deux semaines', 14], ['31', 'Ce mois-ci', 31], ['tout', 'Depuis le début', 0]];
const delai = (ms) => (ms < 3600e3 ? 'dans l’heure' : ms < J ? 'le jour même' : ms < 2 * J ? 'le lendemain' : `${Math.round(ms / J)} jours après`);

function tresse(depuis) {
  const [z, f] = espace.meta?.members || MEMBERS;
  const cr = creations().filter((e) => e.createdAt >= depuis); const ech = echanges().filter((x) => x.t1 >= depuis);
  const ss = seances().filter((s) => s.b >= depuis); const mt = montees().filter((m) => m.at >= depuis);
  const t0 = jourDe(Math.max(depuis, Math.min(...cr.map((e) => e.createdAt), ...ech.map((x) => x.t0 >= depuis ? x.t0 : x.t1), Date.now()))); const t1 = jourDe(Date.now()) + J;
  const jours = Math.max(1, Math.round((t1 - t0) / J)); const PX = Math.max(70, Math.min(160, 900 / jours)); const W = jours * PX + 80;
  const X = (t) => 40 + ((t - t0) / J) * PX; const C = 130; const H = 270;
  // L'écart entre les fils, jour par jour : 96 px un jour sans échange, de plus en plus serré quand on se répond, 6 px ensemble.
  const ecart = []; for (let i = 0; i <= jours; i++) {
    const a = t0 + i * J; const b = a + J;
    const n = ech.filter((x) => x.t1 >= a && x.t1 < b).length + 0.5 * cr.filter((e) => e.createdAt >= a && e.createdAt < b).length;
    const ens = ss.some((s) => s.ensemble && s.a < b && s.b >= a);
    ecart.push(ens ? 6 : 96 / (1 + 0.55 * n));
  }
  const g = (t) => { const u = Math.max(0, Math.min(jours, (t - t0) / J - 0.5)); const i = Math.floor(u); const k = (1 - Math.cos((u - i) * Math.PI)) / 2; return ecart[i] * (1 - k) + (ecart[Math.min(jours, i + 1)] ?? ecart[i]) * k; };
  // Une vraie tresse : à chaque séance à deux, les fils se croisent. Plus on joue ensemble, plus ils se tressent.
  const croisements = ss.filter((s) => s.ensemble).map((s) => (s.a + s.b) / 2).sort((a, b) => a - b);
  const cote = (t) => (croisements.filter((c) => c <= t).length % 2 ? -1 : 1);
  const Y = (qui, t) => {
    const prochain = croisements.find((c) => Math.abs(c - t) < 0.5 * J);
    if (prochain != null) { const u = (t - prochain) / (0.5 * J); const s0 = cote(prochain - 1); return C + (qui === f ? 1 : -1) * s0 * -Math.sin((u * Math.PI) / 2) * g(t) / 2; }
    return C + (qui === f ? 1 : -1) * cote(t) * g(t) / 2;
  };
  const fil = (qui) => { const pts = []; for (let x = 40; x <= W - 40; x += 4) { const t = t0 + ((x - 40) / PX) * J; pts.push(`${x.toFixed(1)},${Y(qui, t).toFixed(1)}`); } return `<polyline points="${pts.join(' ')}" class="el-fil" style="stroke:${memberColor(qui)}"/>`; };
  const items = [];
  const pt = (o) => items.push(o) - 1;
  let svg = '';
  for (let i = 0; i < jours; i++) { const x = X(t0 + i * J); svg += `<line x1="${x}" x2="${x}" y1="20" y2="${H - 34}" class="el-jour"/><text x="${x + 4}" y="${H - 18}" class="el-date">${date(t0 + i * J)}</text>`; }
  ss.forEach((s) => { const m = X((s.a + s.b) / 2); svg += `<ellipse cx="${m}" cy="${C}" rx="${Math.max(14, (X(s.b) - X(s.a)) / 2)}" ry="${s.ensemble ? 26 : 18}" class="el-seance ${s.ensemble ? '' : 'solo'}" data-el="${pt({ k: 'seance', s })}"><title>Séance</title></ellipse>`; });
  svg += fil(z) + fil(f);
  ech.forEach((x) => {
    const xa = X(Math.max(x.t0, t0)); const xb = X(x.t1); const ya = Y(x.de, x.t0); const yb = Y(x.vers, x.t1);
    const bomb = x.de === z ? -1 : 1; const h = Math.min(70, 18 + (xb - xa) * 0.25);
    const d = `M${xa} ${ya} C${xa + (xb - xa) * 0.3} ${ya + bomb * -h}, ${xb - (xb - xa) * 0.3} ${yb + bomb * h}, ${xb} ${yb}`; const i = pt({ k: 'echange', x });
    svg += `<path d="${d}" class="el-lien" data-el="${i}"/><path d="${d}" class="el-zone" data-el="${i}"/>`;
  });
  cr.forEach((e) => { const r = e.audio ? 6.5 : e.type === 'image' ? 5.5 : 4.5; svg += `<circle cx="${X(e.createdAt)}" cy="${Y(e.author, e.createdAt)}" r="${r}" class="el-noeud" style="fill:${memberColor(e.author)}" data-el="${pt({ k: 'creation', e })}"/>`; });
  mt.forEach((m) => { const x = X(m.at); const y = Y(m.by, m.at) + (m.by === f ? 16 : -16); svg += `<path d="M${x - 5} ${y + 3} L${x} ${y - 4} L${x + 5} ${y + 3}" class="el-monte" data-el="${pt({ k: 'montee', m })}"/>`; });
  svg += `<text x="12" y="${C - 50}" class="el-nom" style="fill:${memberColor(z)}">${esc(z)}</text><text x="12" y="${C + 60}" class="el-nom" style="fill:${memberColor(f)}">${esc(f)}</text>`
    + [z, f].map((q) => `<text x="${W - 34}" y="${Y(q, t1 - 1) + (Y(q, t1 - 1) < C ? -10 : 18)}" class="el-nom" text-anchor="end" style="fill:${memberColor(q)}">${esc(q)}</text>`).join('');
  return { html: `<svg class="el-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="La tresse de ${esc(z)} et ${esc(f)} dans le temps">${svg}</svg>`, items, vide: !cr.length && !ech.length };
}

function fiche(o) {
  if (o.k === 'creation') { const e = o.e; return `<b style="color:${memberColor(e.author)}">${esc(e.author)}</b> a ajouté « ${esc(e.title || 'sans titre')} », le ${date(e.createdAt)}.`; }
  if (o.k === 'echange') { const x = o.x; return `<b style="color:${memberColor(x.vers)}">${esc(x.vers)}</b> a répondu à « ${esc(x.a.title || 'sans titre')} » de ${esc(x.de)} : ${esc(x.quoi)}, ${delai(x.t1 - x.t0)}.`; }
  if (o.k === 'montee') { const m = o.m; return `<b style="color:${memberColor(m.by)}">${esc(m.by)}</b> a fait monter « ${esc(m.e.title || 'sans titre')} » d’une étape, le ${date(m.at)}.`; }
  const s = o.s; const min = Math.round((s.b - s.a - (s.e.data.pausedTotal || 0)) / 60000);
  return `Une séance ${s.ensemble ? 'à deux' : 'en solo'}, le ${date(s.a)} : « ${esc(s.e.data.cible || s.e.title || '')} », ${min} minutes.`;
}

export default {
  id: 'elan',
  mount(el) {
    let per = '14'; let items = [];
    function rendre() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: rendre }); return; }
      const [z, f] = espace.meta?.members || MEMBERS;
      const jours = PERIODES.find((p) => p[0] === per)[2]; const depuis = jours ? jourDe(Date.now()) - (jours - 1) * J : 0;
      const t = tresse(depuis); items = t.items; const lec = lecture(depuis);
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Notre élan</p>
          <h1>La tresse.</h1>
          <p class="muted">Deux fils : <b style="color:${memberColor(z)}">${esc(z)}</b> et <b style="color:${memberColor(f)}">${esc(f)}</b>. Chaque création est un nœud sur son fil, chaque réponse un lien d’or d’un fil à l’autre. Plus vous échangez, plus les fils se rapprochent ; à chaque séance ensemble, ils se croisent : plus vous jouez ensemble, plus ils se tressent. Les jours calmes, ils respirent. Pas de score : un mouvement.</p>
        </div></div>
        <div class="el-barre seg-tabs" role="tablist">${PERIODES.map(([k, l]) => `<button role="tab" data-per="${k}" aria-selected="${k === per}">${l}</button>`).join('')}</div>
        <section class="el-scene">${t.vide ? '<p class="el-vide">La tresse commence au premier son, au premier mot. Elle vous attend.</p>' : `<div class="el-host">${t.html}</div>`}
          <p class="el-fiche" aria-live="polite">Touche un nœud ou un lien : il raconte ce qui s’est passé.</p>
          <p class="el-cles"><span><i class="k-n"></i>une création</span><span><i class="k-l"></i>une réponse</span><span><i class="k-m"></i>une idée qui monte</span><span><i class="k-s"></i>une séance</span></p>
        </section>
        <section class="el-lecture"><h2>Ce que la tresse raconte</h2>
          ${lec.length ? `<dl>${lec.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '<p class="muted">Rien encore sur cette période.</p>'}
          <p class="muted small">Lu dans vos traces : le relais (couches, mots, musique sur des mots), les mots sur les idées du mur, les idées de l’autre qu’on fait monter, les rencontres, les « J’ai fait ça », les séances.</p>
        </section>`;
      const h = el.querySelector('.el-host'); if (h) h.scrollLeft = h.scrollWidth;
    }
    el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-per]'); if (p) { per = p.dataset.per; rendre(); return; }
      const n = e.target.closest('[data-el]'); if (!n) return;
      el.querySelectorAll('.el-choisi').forEach((x) => x.classList.remove('el-choisi')); n.classList.add('el-choisi');
      el.querySelector('.el-fiche').innerHTML = fiche(items[+n.dataset.el]);
    });
    const off = onEspace((w) => { if (w === 'entries') rendre(); });
    rendre();
    return off;
  },
};
