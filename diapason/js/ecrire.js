// Écrire sans freiner l'élan : écriture-objet (10 minutes sans s'arrêter, par les sens),
// syllabes chantées ligne par ligne, rimes du dernier mot. Sert dans le Relais.
import { loadLexique, lineSyll, rhymes, rimeOf } from './lexique.js';
import { espace, saveEntry, uid } from './espace.js';
import { toast } from './ui.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Les 7 sens de l'écriture-objet (Pat Pattison, Berklee) : les 5 classiques + le corps + le mouvement.
const SENS = [
  ['vue', 'Vue', 'voir|regard|lumi|couleur|rouge|bleu|blanc|noir|gris|vert|jaune|or|ombre|brill|neige|ciel|nuit|soleil|lune|reflet|vitre|fen[eê]tre|flou|clair|sombre|[ée]toile|phare|n[ée]on|feu'],
  ['son', 'Son', 'entend|[ée]cout|bruit|voix|chant|silence|[ée]cho|cri|murmur|souffl|son\\b|sons\\b|note|craqu|vent|pluie|cloche|radio|moteur|rire|pleur|battement|grond|siffl'],
  ['toucher', 'Toucher', 'touch|froid|chaud|peau|main|doigt|doux|douce|rugueu|glac|gel|br[uû]l|ti[eè]de|humide|mouill|sec\\b|s[eè]che|velours|laine|caress|serr|lourd|l[ée]ger'],
  ['odeur', 'Odeur', 'odeur|sent(ir|ait|eur)|parfum|fum[ée]e|pin\\b|r[ée]sine|terre|cendre|pain|caf[ée]|essence|encens|rose|lilas|moisi|air\\b'],
  ['gout', 'Goût', 'go[uû]t|sel|sal[ée]|sucr|amer|acide|miel|vin\\b|caf[ée]|th[ée]\\b|l[eè]vre|langue|bouche|boire|mord|croqu|fraise|citron'],
  ['corps', 'Corps', 'c(oe|œ)ur|ventre|gorge|poitrine|sang|os\\b|frisson|vertige|fatigu|faim|soif|respir|nause|tremb|veine|muscle|nuque|dos\\b|poumon|larme'],
  ['mouvement', 'Mouvement', 'cour(ir|s|t)|march|tomb|dans|gliss|tourn|part(ir|s|ons)|route|chemin|vol(er|e)|nag|sauter?|saut|roul|fuir|fui|traverse|tangu|flott|berc|recul|avanc'],
].map(([id, label, re]) => ({ id, label, re: new RegExp(`\\b(${re})`, 'i') }));

const MOTS = ['fleuve', 'cuisine à 2 h', 'autoroute', 'fenêtre', 'premier hiver', 'quai de gare', 'chalet', 'néon', 'grand-mère', 'feu de camp', 'patinoire', 'dernière cigarette', 'parking vide', 'lac gelé', 'radio', 'tempête', 'ruelle', 'lit défait', 'aurore', 'manteau'];

// L’atelier d’écriture minuté : un mot imposé, un chrono, les sens détectés dans le texte et un bouton pour garder.
export function ecrire(host, { mots = MOTS, minutes = 10, initial = '', title = '', onSave, saveLabel = 'Garder', song = '', how = null, senses = true, check = null } = {}) {
  let word = mots[Math.floor(Math.random() * mots.length)];
  let left = minutes * 60;
  let timer = 0;
  host.innerHTML = `
    <div class="ecr">
      <div class="ecr-top">
        <p class="ecr-prompt"><small class="mono">Mot de départ</small><b></b><button class="icon-btn tiny" data-e="reroll" aria-label="Autre mot" title="Autre mot">↻</button></p>
        <div class="ecr-clock"><button class="btn small" data-e="timer">▶ ${minutes} min sans t’arrêter</button><span class="mono"></span></div>
      </div>
      <p class="muted small ecr-how">${how ?? 'Écris ce que tu <b>vois, entends, touches, sens, goûtes, ce que ton corps ressent et ce qui bouge</b> autour du mot. Pas de rimes, pas de relecture : juste la matière. Le tri vient après.'}</p>
      <textarea class="ecr-text" rows="9" placeholder="Commence par une image, pas par une idée…">${esc(initial)}</textarea>
      <div class="ecr-sens" aria-label="Sens touchés"></div>
      <div class="ecr-lines"></div>
      <div class="ecr-rimes"></div>
      <div class="ecr-actions">
        ${onSave ? `<button class="btn primary" data-e="save">${esc(saveLabel)}</button>` : ''}
        ${espace.connected ? '<button class="btn" data-e="paroles">→ Dans nos paroles</button>' : ''}
      </div>
    </div>`;
  const q = (s) => host.querySelector(s);
  const ta = q('.ecr-text');
  const showWord = () => { q('.ecr-prompt b').textContent = word; };
  const showClock = () => { q('.ecr-clock span').textContent = timer || left < minutes * 60 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : ''; };
  showWord();

  // Relit le texte en direct : quels sens (vue, ouïe, toucher…) il touche déjà.
  function analyse() {
    const text = ta.value;
    q('.ecr-sens').hidden = !senses;
    q('.ecr-sens').innerHTML = `${SENS.map((s) => `<span class="sens ${s.re.test(text) ? 'on' : ''}">${s.label}</span>`).join('')}<span class="mono small">${SENS.filter((s) => s.re.test(text)).length} / 7 sens</span>`;
    const lines = text.split('\n').filter((l) => l.trim());
    if (!lines.length) { q('.ecr-lines').innerHTML = ''; q('.ecr-rimes').innerHTML = ''; return; }
    const counts = lines.map((l) => lineSyll(l).count);
    const ref = counts[0];
    // check : un patron de syllabes attendu (haïku 5-7-5, refrain 8-8-8-8…)
    const want = (i) => (check ? check[i % check.length] : ref);
    const ok = check && counts.length >= check.length && check.every((n, i) => counts[i] === n);
    q('.ecr-lines').innerHTML = `<small class="mono">Syllabes chantées par ligne${check ? ` · visé : ${check.join('-')}${ok ? ' · <b class="ok-mark">réussi ✓</b>' : ''}` : ''}</small><div>${counts.map((c, i) => `<span class="${(check ? c !== want(i) : Math.abs(c - ref) > 1) ? 'off' : ''}" title="${esc(lines[i])}">${c}</span>`).join('')}</div>`;
    // Rimes du dernier mot de la ligne où est le curseur.
    const upto = text.slice(0, ta.selectionStart).split('\n');
    const cur = upto[upto.length - 1] || lines[lines.length - 1];
    const last = lineSyll(cur).last;
    const r = last && rhymes(last, 14);
    const same = lines.filter((l) => l !== cur && rimeOf(l) && rimeOf(l) === rimeOf(cur)).length;
    q('.ecr-rimes').innerHTML = r ? `<small class="mono">Rimes pour « ${esc(last)} »${same ? ` · déjà ${same} ligne${same > 1 ? 's' : ''} sur ce son` : ''}</small><div class="chips small">${[...r.riches, ...r.suffisantes].slice(0, 14).map((w) => `<button class="chip" data-rime="${esc(w)}">${esc(w)}</button>`).join('')}</div>` : '';
  }
  loadLexique().then(analyse);
  ta.addEventListener('input', analyse);
  ta.addEventListener('click', analyse);
  ta.addEventListener('keyup', (e) => { if (e.key.startsWith('Arrow')) analyse(); });

  host.addEventListener('click', async (e) => {
    const rime = e.target.closest('[data-rime]');
    if (rime) { insert(` ${rime.dataset.rime}`); return; }
    const a = e.target.closest('[data-e]')?.dataset.e;
    if (a === 'reroll') { word = mots[(mots.indexOf(word) + 1 + Math.floor(Math.random() * (mots.length - 1))) % mots.length]; showWord(); }
    if (a === 'timer') {
      if (timer) { clearInterval(timer); timer = 0; e.target.textContent = '▶ Reprendre'; return; }
      e.target.textContent = '❚❚ Pause';
      ta.focus();
      timer = setInterval(() => {
        left--;
        showClock();
        if (left <= 0) { clearInterval(timer); timer = 0; left = minutes * 60; e.target.textContent = `▶ ${minutes} min sans t’arrêter`; toast('Temps! Maintenant, souligne les 3 images les plus fortes.'); }
      }, 1000);
      showClock();
    }
    if (a === 'save' && ta.value.trim()) await onSave(ta.value.trim(), word);
    if (a === 'paroles' && ta.value.trim()) {
      const counts = ta.value.split('\n').filter((l) => l.trim()).map((l) => lineSyll(l).count);
      const t = title || `Matière · ${word}`;
      await saveEntry({ type: 'paroles', title: t, body: `[Couplet]\n${ta.value.trim()}`, data: { song, sections: [{ id: uid(), kind: 'couplet', text: ta.value.trim(), target: counts[0] || 8 }] } });
      toast('Dans l’atelier de paroles, prêt à être sculpté.');
    }
  });
  // Insère un mot là où est le curseur.
  function insert(s) {
    const i = ta.selectionEnd;
    ta.value = ta.value.slice(0, i) + s + ta.value.slice(i);
    ta.selectionStart = ta.selectionEnd = i + s.length;
    ta.focus();
    analyse();
  }
  return { text: () => ta.value, dispose: () => clearInterval(timer) };
}
