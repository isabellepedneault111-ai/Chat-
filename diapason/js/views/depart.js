// Étape 1 : chacun son point de départ, puis notre portrait commun, qui nourrit la vision et le plan.
import { espace, onEspace, profileOf, saveProfile, updateEspace } from '../espace.js';
import { toast } from '../ui.js';
import { nameFR, FR, mod12, spanText } from '../music.js';
import { MEMBERS, ROLES, memberColor, OBJECTIFS, STYLES, BESOINS, MOTS } from '../duo.js';
import { esc, espaceGate } from './carnet.js';

const STEPS = ['Ce que je veux', 'Ma voix, mon jeu', 'Mes styles', 'Mes besoins', 'Mes mots'];
const done = (p) => !!p && (p.objectifs?.length > 0) && (p.styles?.length > 0) && !!p.besoins;

// Tonalités confortables : une mélodie type va de la quinte sous la tonique à la sixte au-dessus de l'octave.
export function keysFor(low, high) {
  const out = [];
  for (let t = low + 5; t <= high - 9; t++) if (!out.includes(mod12(t))) out.push(mod12(t));
  if (!out.length && high > low) out.push(mod12(Math.round((low + high) / 2) - 2));
  return out.slice(0, 5);
}

export default {
  id: 'depart',
  mount(el) {
    let step = 0;
    let saveT = 0;

    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const mem = espace.meta.members || MEMBERS;
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Étape 1</p>
            <h1>Notre point de départ</h1>
            <p class="muted">Chacun le sien, honnêtement. Puis on regarde nos deux portraits côte à côte.</p>
          </div>
          <div class="who-status">${mem.map((m) => `<span style="--c:${memberColor(m)}" class="${done(profileOf(m)) ? 'ok' : ''}"><b>${esc(m)}</b>${done(profileOf(m)) ? 'prêt·e' : 'à remplir'}</span>`).join('')}</div>
        </div>
        <section class="panel depart-form">
          <ol class="dsteps">${STEPS.map((s, i) => `<li><button class="${i === step ? 'on' : ''} ${i < step ? 'past' : ''}" data-step="${i}"><span class="mono">${i + 1}</span>${s}</button></li>`).join('')}</ol>
          <div class="dbody"></div>
          <div class="row"><button class="btn" data-a="prev" ${step === 0 ? 'disabled' : ''}>← Avant</button><span class="spacer"></span><span class="save-state muted small"></span>${step < STEPS.length - 1 ? '<button class="btn primary" data-a="next">Suivant →</button>' : '<button class="btn primary" data-a="finish">C’est mon portrait</button>'}</div>
        </section>
        <section class="portrait"></section>`;
      renderStep();
      renderPortrait();
    }

    const me = () => profileOf(espace.me) || {};
    // Les modifications s'accumulent, puis partent ensemble (rien ne se perd si on tape vite).
    let pending = {};
    function save(change) {
      Object.assign(pending, change(me()));
      const st = el.querySelector('.save-state');
      if (st) st.textContent = 'enregistrement…';
      clearTimeout(saveT);
      saveT = setTimeout(async () => {
        const patch = pending;
        pending = {};
        try { await saveProfile(() => patch); const s2 = el.querySelector('.save-state'); if (s2) s2.textContent = `${otherName()} le voit ✓`; } catch (err) { toast(err.message); }
      }, 500);
    }
    const otherName = () => (espace.meta.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';

    function renderStep() {
      const p = me();
      const b = el.querySelector('.dbody');
      const chips = (list, sel, key) => `<div class="pick">${list.map((x) => `<button class="pick-chip ${sel?.includes(x) ? 'on' : ''}" data-pick="${key}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
      if (step === 0) {
        b.innerHTML = `<h2>Dans six mois, qu’est-ce que tu veux?</h2><p class="muted">Touche tout ce qui te parle. Pas de mauvaise réponse.</p>${chips(OBJECTIFS, p.objectifs, 'objectifs')}
          <label class="field col"><span>À tes mots</span><input class="input" data-f="objectifLibre" maxlength="200" value="${esc(p.objectifLibre || '')}" placeholder="Ex. : jouer au Quai des Brumes"></label>`;
      }
      if (step === 1) {
        const v = p.voix;
        b.innerHTML = `<h2>Ta voix, ton jeu</h2>
          <div class="voice-card">${v ? `<b>${esc(v.type)}</b> · ${nameFR(v.low)} → ${nameFR(v.high)} <span class="muted">(${spanText(v.high - v.low)})</span>` : '<span class="muted">Pas encore d’empreinte vocale.</span>'}
            <a class="btn small" href="#/tessiture">${v ? 'Refaire mon test' : 'Faire mon test de tessiture'} (3 min)</a></div>
          <p class="muted small">Même si tu chantes peu : ça sert aux harmonies et aux tonalités.</p>
          <label class="field col"><span>Tes instruments et ton matériel</span><input class="input" data-f="instruments" maxlength="300" value="${esc(p.instruments ?? ROLES[espace.me] ?? '')}"></label>
          <label class="field col"><span>Ce que tu maîtrises le mieux</span><input class="input" data-f="force" maxlength="200" value="${esc(p.force || '')}" placeholder="Ex. : les nappes, les accords ouverts, l’harmonie vocale"></label>
          <label class="field col"><span>Ce que tu veux apprendre</span><input class="input" data-f="apprendre" maxlength="200" value="${esc(p.apprendre || '')}"></label>`;
      }
      if (step === 2) {
        const arts = p.artistes || [];
        b.innerHTML = `<h2>Ce qui t’allume</h2>${chips(STYLES, p.styles, 'styles')}
          <h4>3 artistes ou morceaux qui t’inspirent</h4>
          ${[0, 1, 2].map((i) => `<div class="art-row"><input class="input" data-art="${i}" data-k="nom" placeholder="Artiste ou morceau" value="${esc(arts[i]?.nom || '')}"><input class="input" data-art="${i}" data-k="lien" placeholder="Lien Spotify, YouTube…" value="${esc(arts[i]?.lien || '')}"></div>`).join('')}`;
      }
      if (step === 3) {
        const bs = p.besoins || {};
        b.innerHTML = `<h2>Comment tu crées le mieux</h2><p class="muted">Glisse vers le côté qui te ressemble.</p>
          ${BESOINS.map(([k, l, r]) => `<div class="need"><span>${l}</span><input type="range" min="0" max="100" value="${bs[k] ?? 50}" data-need="${k}" aria-label="${l} ou ${r}"><span>${r}</span></div>`).join('')}`;
      }
      if (step === 4) {
        b.innerHTML = `<h2>Quelques mots pour ${esc(otherName())}</h2>${MOTS.map(([k, l]) => `<label class="field col"><span>${l}</span><textarea class="input" rows="2" data-f="${k}" maxlength="500">${esc(p[k] || '')}</textarea></label>`).join('')}`;
      }
    }

    // Le portrait commun : ce qu'on partage, ce qui diffère, ce qu'il faut se dire.
    function renderPortrait() {
      const box = el.querySelector('.portrait');
      const mem = espace.meta.members || MEMBERS;
      const [a, b] = mem.map((m) => profileOf(m) || {});
      if (!a.objectifs && !b.objectifs) { box.innerHTML = ''; return; }
      const inter = (x = [], y = []) => x.filter((v) => y.includes(v));
      const only = (x = [], y = []) => x.filter((v) => !y.includes(v));
      const zaza = profileOf(mem[0])?.voix;
      const frog = profileOf(mem[1])?.voix;
      const singer = zaza || frog;
      const keys = singer ? keysFor(singer.low, singer.high) : [];
      const cLow = zaza && frog ? Math.max(zaza.low, frog.low) : null;
      const cHigh = zaza && frog ? Math.min(zaza.high, frog.high) : null;
      const gaps = BESOINS.filter(([k]) => a.besoins && b.besoins && Math.abs((a.besoins[k] ?? 50) - (b.besoins[k] ?? 50)) >= 40);
      box.innerHTML = `
        <h2 class="portrait-title">Notre portrait</h2>
        <div class="portrait-grid">
          <article class="panel"><h3>Ce qu’on veut tous les deux</h3>
            <div class="pick">${inter(a.objectifs, b.objectifs).map((x) => `<span class="pick-chip on">${esc(x)}</span>`).join('') || '<span class="muted small">En attente des deux portraits.</span>'}</div>
            ${mem.map((m, i) => { const o = only([a, b][i].objectifs, [b, a][i].objectifs); return o.length ? `<p class="small"><b style="color:${memberColor(m)}">${esc(m)}</b> aussi : ${o.map(esc).join(', ')}</p>` : ''; }).join('')}
          </article>
          <article class="panel"><h3>Nos couleurs</h3>
            <div class="pick">${inter(a.styles, b.styles).map((x) => `<span class="pick-chip on">${esc(x)}</span>`).join('') || '<span class="muted small">Pas encore de style commun.</span>'}</div>
            ${mem.map((m, i) => { const o = only([a, b][i].styles, [b, a][i].styles); return o.length ? `<p class="small"><b style="color:${memberColor(m)}">${esc(m)}</b> apporte : ${o.map(esc).join(', ')}</p>` : ''; }).join('')}
            <ul class="art-list">${mem.flatMap((m, i) => ([a, b][i].artistes || []).filter((x) => x?.nom).map((x) => `<li style="--c:${memberColor(m)}">${x.lien ? `<a href="${esc(x.lien)}" target="_blank" rel="noopener">${esc(x.nom)} ↗</a>` : esc(x.nom)}</li>`)).join('')}</ul>
          </article>
          <article class="panel"><h3>Nos voix</h3>
            ${singer ? `<p>Tonalités confortables pour la voix de <b>${esc(zaza ? mem[0] : mem[1])}</b> : <b>${keys.map((k) => FR[k]).join(', ') || '—'}</b>.</p>` : '<p class="muted small">Faites le test de tessiture : on en tire vos tonalités.</p>'}
            ${cLow != null ? (cHigh - cLow >= 3 ? `<p class="small">Zone commune pour chanter à deux : ${nameFR(cLow)} → ${nameFR(cHigh)}.</p>` : '<p class="small">Peu de zone commune : idéal pour des harmonies à l’octave ou des registres séparés.</p>') : ''}
          </article>
          <article class="panel"><h3>Comment on crée</h3>
            ${BESOINS.map(([k, l, r]) => `<div class="need-duo"><span>${l}</span><div class="nd-track">${mem.map((m, i) => ([a, b][i].besoins ? `<i style="left:${[a, b][i].besoins[k] ?? 50}%;--c:${memberColor(m)}" title="${esc(m)}">${esc(m[0])}</i>` : '')).join('')}</div><span>${r}</span></div>`).join('')}
            ${gaps.length ? `<p class="talk"><b>À se dire :</b> vous êtes loin l’un de l’autre sur « ${gaps.map(([, l, r]) => `${l} / ${r}`).join(' », « ')} ». Pas un problème : un accord à trouver.</p>` : ''}
          </article>
          <article class="panel wide"><h3>Nos mots</h3>
            <div class="mots">${MOTS.map(([k, l]) => `<div><h4>${l}</h4>${mem.map((m, i) => ([a, b][i][k] ? `<p style="--c:${memberColor(m)}"><b>${esc(m)}</b> ${esc([a, b][i][k])}</p>` : '')).join('')}</div>`).join('')}</div>
          </article>
        </div>
        ${mem.every((m) => profileOf(m)?.doneAt)
    ? '<div class="row"><button class="btn primary big" data-a="vision">Construire notre vision à partir de ça</button></div>'
    : `<p class="muted portrait-wait">Notre vision et notre plan se construiront quand ${esc(mem.find((m) => !profileOf(m)?.doneAt))} aura fait son point de départ : rien de commun n’est fixé avant, et rien ne change dans sa visite.</p>`}`;
    }

    el.addEventListener('click', async (e) => {
      const st = e.target.closest('[data-step]');
      if (st) { step = +st.dataset.step; render(); return; }
      const pk = e.target.closest('[data-pick]');
      if (pk) {
        pk.classList.toggle('on');
        const key = pk.dataset.pick;
        const vals = [...el.querySelectorAll(`[data-pick="${key}"].on`)].map((x) => x.dataset.v);
        save(() => ({ [key]: vals }));
        return;
      }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'next') { step = Math.min(STEPS.length - 1, step + 1); render(); }
      if (a === 'prev') { step = Math.max(0, step - 1); render(); }
      if (a === 'finish') {
        clearTimeout(saveT);
        const patch = pending;
        pending = {};
        await saveProfile((d) => ({ ...patch, besoins: patch.besoins || d.besoins || Object.fromEntries(BESOINS.map(([k]) => [k, 50])), doneAt: Date.now() })).catch(() => {});
        toast(`Ton portrait est prêt. ${otherName()} le voit déjà.`);
        render();
        el.querySelector('.portrait')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (a === 'vision') {
        const mem = espace.meta.members || MEMBERS;
        const [pa, pb] = mem.map((m) => profileOf(m) || {});
        const singer = pa.voix || pb.voix;
        const keys = singer ? keysFor(singer.low, singer.high) : [];
        const common = (pa.styles || []).filter((s) => (pb.styles || []).includes(s));
        const v = { ...(espace.meta.vision || {}) };
        if (!v.tonalite && keys.length) v.tonalite = keys.slice(0, 3).map((k) => FR[k]).join(', ');
        if (!v.genre && (common.length || pa.styles?.length)) v.genre = (common.length ? common : [...(pa.styles || []), ...(pb.styles || [])]).slice(0, 3).join(' · ');
        if (!v.instrumentation) v.instrumentation = mem.map((m, i) => `${m} : ${[pa, pb][i].instruments || ROLES[m] || ''}`).join(' · ');
        if (!v.style) v.style = mem.flatMap((m, i) => ([pa, pb][i].artistes || []).filter((x) => x?.nom).map((x) => x.nom)).slice(0, 4).join(', ');
        if (!v.intention) v.intention = [pa.fierte, pb.fierte].filter(Boolean).join(' / ').slice(0, 200);
        const body = { vision: v };
        if (!espace.meta.plan?.start) body.plan = { start: new Date().toISOString().slice(0, 10) };
        await updateEspace(body).catch((err) => toast(err.message));
        toast('Vision posée. Votre plan part de là.');
        location.hash = '#/';
      }
    });
    el.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.f) { const k = t.dataset.f; const v = t.value; save(() => ({ [k]: v })); }
      if (t.dataset.need) {
        const vals = Object.fromEntries([...el.querySelectorAll('[data-need]')].map((x) => [x.dataset.need, +x.value]));
        save(() => ({ besoins: vals }));
      }
      if (t.dataset.art != null) {
        const arts = [0, 1, 2].map((i) => ({ nom: el.querySelector(`[data-art="${i}"][data-k=nom]`).value.trim(), lien: el.querySelector(`[data-art="${i}"][data-k=lien]`).value.trim() }));
        save(() => ({ artistes: arts }));
      }
    });
    // Quand l'autre remplit le sien, notre portrait commun se met à jour (sans toucher au formulaire).
    const off = onEspace((what) => {
      if (what === 'meta' && el.querySelector('.gate')) { render(); return; }
      if (what === 'entries' && el.querySelector('.portrait')) {
        renderPortrait();
        const ws = el.querySelector('.who-status');
        if (ws) { const mem = espace.meta.members || MEMBERS; ws.innerHTML = mem.map((m) => `<span style="--c:${memberColor(m)}" class="${done(profileOf(m)) ? 'ok' : ''}"><b>${esc(m)}</b>${done(profileOf(m)) ? 'prêt·e' : 'à remplir'}</span>`).join(''); }
      }
    });
    render();
    return () => { off(); clearTimeout(saveT); };
  },
};
