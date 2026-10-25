import { mic, onPitch, startMic, stopMic } from '../audio.js';
import { keyboard, store, getProfile, toast, ring } from '../ui.js';
import { nameFR, nameEN, spanText, pcFR } from '../music.js';
import { VOICE_TYPES } from '../data.js';

const FROM = 36;
const TO = 88;

function speak(text) {
  if (!store.get('voiceGuide', true) || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-CA';
  u.rate = 1.02;
  speechSynthesis.speak(u);
}

function classify(low, high) {
  return VOICE_TYPES
    .map((v) => ({ ...v, score: 1.3 * Math.abs(low - v.low) + Math.abs(high - v.high) }))
    .sort((a, b) => a.score - b.score);
}

export default {
  id: 'tessiture',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head">
        <div>
          <p class="eyebrow">02 · Empreinte</p>
          <h1>L’étendue de ta voix</h1>
          <p class="muted">Pas un examen : un portrait du jour. On cherche ton terrain <em>confortable</em>, sans forcer.</p>
        </div>
        <div class="actions">
          <label class="switch"><input type="checkbox" data-guide ${store.get('voiceGuide', true) ? 'checked' : ''}><span></span> Guide vocal</label>
        </div>
      </div>

      <div class="panel">
        <div class="kb-host big"></div>
        <div class="legend">
          <span><i class="lg live"></i>Note chantée</span>
          <span><i class="lg low"></i>Plancher</span>
          <span><i class="lg high"></i>Plafond</span>
          <span><i class="lg range"></i>Ton étendue</span>
        </div>
      </div>

      <div class="tess-grid">
        <div class="panel step-panel" aria-live="polite"></div>
        <div class="panel live-panel">
          <div class="live-ring"></div>
          <div class="live-note">—</div>
          <div class="muted live-sub">Stabilité de la note</div>
        </div>
      </div>

      <section class="panel group-panel">
        <div class="panel-head">
          <div><h2>La zone du duo</h2><p class="muted">Ajoutez vos deux empreintes : la zone où vous chantez <b>tous les deux</b> sans forcer, donc vos tonalités.</p></div>
          <button class="btn small" data-act="clear-group">Vider</button>
        </div>
        <div class="group-chart"></div>
      </section>`;

    const q = (s) => el.querySelector(s);
    const kb = keyboard(q('.kb-host'), { from: FROM, to: TO, labels: true });
    let step = 'intro';
    let recLow = null;
    let recHigh = null;
    let result = null;
    const recent = [];
    let stableSince = 0;

    q('[data-guide]').addEventListener('change', (e) => {
      store.set('voiceGuide', e.target.checked);
      if (!e.target.checked) speechSynthesis?.cancel();
    });

    function paintRange() {
      kb.clear('k-low'); kb.clear('k-high'); kb.clear('k-range');
      const lo = recLow;
      const hi = recHigh;
      if (lo != null) kb.mark(lo, 'k-low');
      if (hi != null) kb.mark(hi, 'k-high');
      if (lo != null && hi != null) for (let m = lo + 1; m < hi; m++) kb.mark(m, 'k-range');
    }

    function render() {
      const p = q('.step-panel');
      if (step === 'intro') {
        p.innerHTML = `
          <h2>Prêt·e?</h2>
          <ol class="steps">
            <li><b>Plancher</b> — descends doucement sur un « ahhh » jusqu’à ta note grave la plus confortable.</li>
            <li><b>Plafond</b> — monte comme une sirène, sans crier, jusqu’à ta note aiguë confortable.</li>
            <li><b>Empreinte</b> — tu découvres ta famille vocale et ce que ça change pour choisir tes chansons.</li>
          </ol>
          <button class="btn primary big" data-act="start">Commencer le test →</button>
          <p class="fineprint">Conseil : un endroit calme, le téléphone ou l’ordi à 30 cm de la bouche.</p>`;
      } else if (step === 'low' || step === 'high') {
        const isLow = step === 'low';
        const rec = isLow ? recLow : recHigh;
        p.innerHTML = `
          <p class="eyebrow">${isLow ? 'Étape 1 / 2' : 'Étape 2 / 2'}</p>
          <h2>${isLow ? 'Ton plancher (grave)' : 'Ton plafond (aigu)'}</h2>
          <p>${isLow
            ? 'Inspire par le ventre. Chante « ahhh » et glisse vers le grave. Chaque note tenue une demi-seconde devient ton nouveau record.'
            : 'Glisse vers l’aigu comme une sirène de pompier. Pas besoin de crier : on cherche ce qui est <em>confortable</em>.'}</p>
          <div class="record">
            <span class="muted">Record ${isLow ? 'grave' : 'aigu'}</span>
            <b class="record-note">${rec != null ? nameFR(rec) : '—'}</b>
            <span class="mono muted">${rec != null ? nameEN(rec) : ''}</span>
          </div>
          <div class="row">
            <button class="btn primary" data-act="validate" ${rec == null ? 'disabled' : ''}>${isLow ? 'C’est mon plancher ✓' : 'C’est mon plafond ✓'}</button>
            <button class="btn ghost" data-act="reset-rec">Recommencer l’étape</button>
          </div>`;
      } else if (step === 'result' && result) {
        const [best, second] = result.types;
        const span = recHigh - recLow;
        const center = Math.round((recLow + recHigh) / 2);
        p.innerHTML = `
          <p class="eyebrow">Ton empreinte</p>
          <h2 class="result-type">${best.name}</h2>
          <p class="mono range-line">${nameFR(recLow)} → ${nameFR(recHigh)} · ${spanText(span)}</p>
          <p>${best.desc}</p>
          <p class="muted">Tu partages aussi du terrain avec la famille <b>${second.name}</b>. Les voix ne rentrent jamais parfaitement dans des cases — et elles changent, surtout à l’adolescence.</p>
          <div class="tip-box"><b>Concrètement</b><p>Ton centre de gravité est autour de <b>${nameFR(center)}</b>. Pour une chanson, vise une mélodie qui reste entre <b>${nameFR(recLow + 2)}</b> et <b>${nameFR(recHigh - 2)}</b>. Si c’est trop haut, transpose vers ${pcFR(center - 2)} ou ${pcFR(center - 3)}.</p></div>
          <div class="row">
            <input class="input" data-name placeholder="Prénom ou pseudo" maxlength="20" aria-label="Prénom ou pseudo">
            <button class="btn primary" data-act="add-group">+ Ajouter à la zone du duo</button>
          </div>
          <div class="row">
            <a class="btn" href="#/gym">Aller au Gym vocal (adapté à ta voix) →</a>
            <button class="btn ghost" data-act="restart">Refaire le test</button>
          </div>`;
      }
    }

    function finish() {
      if (recHigh <= recLow) { toast('Ton plafond doit être plus haut que ton plancher. Réessaie l’étape 2.'); return; }
      const types = classify(recLow, recHigh);
      result = { types };
      store.set('profile', { low: recLow, high: recHigh, type: types[0].name, at: Date.now() });
      step = 'result';
      stopMic();
      speak(`Voilà ton empreinte. Famille ${types[0].name}, de ${nameFR(recLow)} à ${nameFR(recHigh)}.`);
      render();
    }

    el.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'start') {
        if (!(await startMic())) return;
        step = 'low'; recLow = null; recHigh = null; paintRange(); render();
        speak('Étape un. Inspire par le ventre, chante ahhh, et descends doucement vers le grave, sans que ça gratte.');
      } else if (act === 'validate') {
        if (step === 'low') {
          step = 'high'; render();
          speak('Super. Étape deux. Monte maintenant comme une sirène, sans crier, jusqu’à ton plafond confortable.');
        } else finish();
      } else if (act === 'reset-rec') {
        if (step === 'low') recLow = null; else recHigh = null;
        paintRange(); render();
      } else if (act === 'restart') {
        step = 'intro'; recLow = null; recHigh = null; paintRange(); render();
      } else if (act === 'add-group') {
        const name = (q('[data-name]').value || '').trim() || `Voix ${store.get('group', []).length + 1}`;
        const group = store.get('group', []);
        group.push({ name, low: recLow, high: recHigh });
        store.set('group', group);
        q('[data-name]').value = '';
        toast(`${name} ajouté·e à la zone du duo.`);
        renderGroup();
      } else if (act === 'clear-group') {
        if (confirm('Vider la zone du duo sur cet appareil?')) { store.set('group', []); renderGroup(); }
      } else if (act === 'del') {
        const group = store.get('group', []);
        group.splice(+e.target.closest('[data-i]').dataset.i, 1);
        store.set('group', group);
        renderGroup();
      }
    });

    function renderGroup() {
      const group = store.get('group', []);
      const host = q('.group-chart');
      if (!group.length) {
        host.innerHTML = '<p class="muted empty">Aucune empreinte pour l’instant. Fais le test, puis ajoute-toi au portrait.</p>';
        return;
      }
      const pct = (m) => ((m - FROM) / (TO - FROM)) * 100;
      const cLow = Math.max(...group.map((g) => g.low));
      const cHigh = Math.min(...group.map((g) => g.high));
      const hasZone = cHigh - cLow >= 2;
      const ticks = [];
      for (let m = FROM; m <= TO; m += 12) ticks.push(`<span style="left:${pct(m)}%">${nameFR(m)}</span>`);
      host.innerHTML = `
        <div class="gc-area">
          ${hasZone ? `<div class="gc-zone" style="left:${pct(cLow)}%;width:${pct(cHigh) - pct(cLow)}%"><span>Zone commune</span></div>` : ''}
          ${group.map((g, i) => `
            <div class="gc-row" data-i="${i}">
              <span class="gc-name">${g.name.replace(/[<>&]/g, '')}</span>
              <div class="gc-track"><div class="gc-bar" style="left:${pct(g.low)}%;width:${pct(g.high) - pct(g.low)}%">
                <small>${nameFR(g.low)}</small><small>${nameFR(g.high)}</small></div></div>
              <button class="icon-btn tiny" data-act="del" aria-label="Retirer ${g.name.replace(/[<>&"]/g, '')}">×</button>
            </div>`).join('')}
          <div class="gc-ticks">${ticks.join('')}</div>
        </div>
        <div class="gc-verdict ${hasZone ? 'ok' : 'warn'}">
          ${hasZone
            ? `<b>${group.length} voix · zone commune ${nameFR(cLow)} → ${nameFR(cHigh)}</b> (${spanText(cHigh - cLow)}). Choisissez des chansons dont la mélodie reste dans cette zone, ou transposez-les pour qu’elles y entrent.`
            : `<b>Pas de zone commune assez large.</b> Une force pour un duo : prenez chacun votre registre (l’un grave, l’autre aigu), ou chantez à l’octave — même note, deux hauteurs.`}
        </div>`;
    }

    const off = onPitch((p) => {
      kb.clear('k-live');
      const liveRing = q('.live-ring');
      if (!p) {
        recent.length = 0;
        q('.live-note').textContent = '—';
        liveRing.innerHTML = ring(0, 120, 10);
        return;
      }
      const r = Math.round(p.midi);
      kb.mark(r, 'k-live');
      q('.live-note').textContent = nameFR(r);
      const t = performance.now();
      recent.push({ t, m: p.midi });
      while (recent.length && recent[0].t < t - 600) recent.shift();
      const ms = recent.map((x) => x.m);
      const stable = recent.length > 8 && Math.max(...ms) - Math.min(...ms) < 0.8;
      if (!stable) stableSince = t;
      const pctStable = Math.min(1, (t - stableSince) / 500);
      liveRing.innerHTML = ring(stable ? pctStable : 0, 120, 10);
      if (stable && pctStable >= 1 && p.clarity > 0.8) {
        const note = Math.round([...ms].sort((a, b) => a - b)[ms.length >> 1]);
        if (step === 'low' && (recLow == null || note < recLow)) { recLow = note; paintRange(); render(); }
        if (step === 'high' && note > (recLow ?? 0) && (recHigh == null || note > recHigh)) { recHigh = note; paintRange(); render(); }
      }
    });

    const existing = getProfile();
    if (existing) {
      recLow = existing.low; recHigh = existing.high;
      result = { types: classify(recLow, recHigh) };
      step = 'result';
      paintRange();
    }
    q('.live-ring').innerHTML = ring(0, 120, 10);
    render();
    renderGroup();

    return () => { off(); kb.dispose(); speechSynthesis?.cancel(); };
  },
};
