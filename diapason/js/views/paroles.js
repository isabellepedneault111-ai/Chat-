// Atelier de paroles : sections, syllabes chantées par ligne, rimes, synonymes, passages incertains et trous.
import { espace, onEspace, saveEntry, deleteEntry, uid } from '../espace.js';
import { store, toast } from '../ui.js';
import { loadLexique, lineSyll, rhymes, synonyms, rimeOf, wordSyll } from '../lexique.js';
import { esc, ago, espaceGate } from './carnet.js';
import { jeter } from '../corbeille.js';
import { SECTION_KINDS } from '../data.js';

const LOCAL = 'parolesLocal';
const blankSong = () => ({
  id: uid(),
  title: '',
  data: {
    sections: [
      { id: uid(), kind: 'couplet', text: '', target: 8 },
      { id: uid(), kind: 'refrain', text: '', target: 8 },
    ],
  },
});

// Où vivent les chansons : l'espace du duo si on est connecté, sinon ce navigateur.
const songs = {
  list() {
    if (espace.connected) return espace.entries.filter((e) => e.type === 'paroles');
    return store.get(LOCAL, []);
  },
  async save(song, base) {
    if (espace.connected) return saveEntry({ id: song.id, type: 'paroles', title: song.title, body: plain(song), data: song.data }, { baseUpdatedAt: base });
    const all = store.get(LOCAL, []).filter((s) => s.id !== song.id);
    const saved = { ...song, type: 'paroles', updatedAt: Date.now(), createdAt: song.createdAt || Date.now(), author: espace.me };
    store.set(LOCAL, [saved, ...all]);
    return { entry: saved };
  },
  async remove(id) {
    if (espace.connected) { const en = espace.entries.find((x) => x.id === id); return en ? jeter(en) : deleteEntry(id); }
    store.set(LOCAL, store.get(LOCAL, []).filter((s) => s.id !== id));
  },
};
function plain(song) {
  return song.data.sections.map((s) => `[${kindLabel(song, s)}]\n${s.text}`).join('\n\n');
}
function kindLabel(song, sec) {
  const k = SECTION_KINDS.find((x) => x.id === sec.kind);
  if (!k?.numbered) return k?.label || sec.kind;
  const same = song.data.sections.filter((s) => s.kind === sec.kind);
  return same.length > 1 ? `${k.label} ${same.indexOf(sec) + 1}` : k.label;
}
const LETTERS = 'ABCDEFGHIJ';

export default {
  id: 'paroles',
  mount(el) {
    let song = null;
    let base = 0; // updatedAt de la version qu'on édite
    let saveTimer = 0;
    let lastTyping = 0;
    let lastField = null;
    let word = '';
    let dirty = false;

    function openFromHash() {
      const id = location.hash.split('/')[2];
      const found = id && songs.list().find((s) => s.id === id);
      if (found) { song = JSON.parse(JSON.stringify(found)); base = found.updatedAt; }
    }

    function render() {
      if (espace.id && !espace.connected) { el.innerHTML = '<p class="muted">Connexion à votre espace…</p>'; return; }
      const list = songs.list();
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Atelier de paroles</p>
            <h1>Écrire pour être chanté</h1>
            <p class="muted">${espace.connected ? `Partagé avec votre duo dans <b>${esc(espace.meta.name)}</b>.` : 'Sur cet appareil seulement. <a href="#/carnet">Créez votre espace</a> pour écrire à deux.'}</p>
          </div>
          <div class="actions"><a class="btn" href="#/jeux">Le grimoire : un rituel avant d’écrire</a><button class="btn primary" data-p="new">Nouvelle chanson</button></div>
        </div>
        <div class="paroles-grid">
          <aside class="song-list panel">
            <p class="tape">Nos chansons</p>
            <ul>${list.length ? list.map((s) => `<li><a href="#/paroles/${s.id}" class="song-link${song?.id === s.id ? ' active' : ''}"><b>${esc(s.title || 'Sans titre')}</b><small>${esc(s.author || '')} · ${ago(s.updatedAt)}</small></a></li>`).join('') : '<li class="muted small">Aucune chanson encore.</li>'}</ul>
          </aside>
          <section class="editor"></section>
          <aside class="wordbox panel">
            <p class="tape">Boîte à mots</p>
            <input class="input" data-w="q" placeholder="Un mot à faire rimer" aria-label="Mot à chercher" value="${esc(word)}">
            <div class="wb-out"><p class="muted small">Tape un mot, ou touche un mot de ton texte : rimes, synonymes et syllabes apparaissent ici. Touche un résultat pour l’insérer.</p></div>
          </aside>
        </div>`;
      renderEditor();
      if (word) lookup(word);
    }

    function renderEditor() {
      const ed = el.querySelector('.editor');
      if (!song) {
        ed.innerHTML = `<div class="panel editor-empty"><h2>Choisis une chanson ou commence-en une.</h2><p class="muted">Astuce : écris d’abord le refrain. C’est la phrase que tout le monde va chanter.</p><button class="btn primary" data-p="new">Nouvelle chanson</button></div>`;
        return;
      }
      ed.innerHTML = `
        <div class="panel song-head">
          <input class="title-input" data-p="title" placeholder="Titre de la chanson" value="${esc(song.title)}" aria-label="Titre">
          <div class="row">
            <span class="save-state muted small">${espace.connected ? 'Enregistré pour vous deux' : 'Enregistré sur cet appareil'}</span>
            <span class="spacer"></span>
            <button class="btn small" data-p="speak">Lire à voix haute</button>
            <button class="btn small ghost" data-p="delete">Supprimer</button>
          </div>
        </div>
        ${song.data.sections.map((s, i) => sectionHTML(s, i)).join('')}
        <div class="add-sections">${SECTION_KINDS.map((k) => `<button class="btn small" data-add="${k.id}">+ ${k.label}</button>`).join('')}</div>`;
      song.data.sections.forEach((s) => analyse(s.id));
    }

    function sectionHTML(s, i) {
      const n = song.data.sections.length;
      return `
        <article class="panel section kind-${s.kind}" data-sec="${s.id}">
          <header class="sec-head">
            <select data-k="${s.id}" aria-label="Type de section">${SECTION_KINDS.map((k) => `<option value="${k.id}" ${k.id === s.kind ? 'selected' : ''}>${k.label}</option>`).join('')}</select>
            <b class="sec-label">${esc(kindLabel(song, s))}</b>
            <label class="target">cible <input type="number" min="0" max="24" value="${s.target || 0}" data-t="${s.id}" aria-label="Syllabes visées par ligne"> syll.</label>
            <span class="spacer"></span>
            <button class="icon-btn tiny" data-mv="${s.id}:-1" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn tiny" data-mv="${s.id}:1" aria-label="Descendre" ${i === n - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn tiny" data-rm="${s.id}" aria-label="Retirer la section">×</button>
          </header>
          <div class="sec-tools">
            <button class="btn small" data-mark="${s.id}:doute" title="Entoure la sélection de [? … ?]">[? incertain ?]</button>
            <button class="btn small" data-mark="${s.id}:trou" title="Insère un trou à combler">___ trou</button>
          </div>
          <div class="sec-body">
            <textarea class="lyrics" data-x="${s.id}" rows="${Math.max(4, s.text.split('\n').length + 1)}" placeholder="${SECTION_KINDS.find((k) => k.id === s.kind)?.hint || ''}">${esc(s.text)}</textarea>
            <ol class="meter" data-m="${s.id}" aria-label="Syllabes par ligne"></ol>
          </div>
          <div class="syll-view" data-v="${s.id}"></div>
        </article>`;
    }

    // Analyse ligne par ligne : syllabes chantées, écart à la cible, schéma de rimes, doutes et trous.
    function analyse(id) {
      const s = song.data.sections.find((x) => x.id === id);
      const meter = el.querySelector(`[data-m="${id}"]`);
      const view = el.querySelector(`[data-v="${id}"]`);
      if (!s || !meter) return;
      const lines = s.text.split('\n');
      const keys = [];
      const letters = lines.map((l) => {
        if (!l.trim()) return '';
        const k = rimeOf(l);
        let i = keys.indexOf(k);
        if (i < 0) { keys.push(k); i = keys.length - 1; }
        return LETTERS[i] || '?';
      });
      meter.innerHTML = lines.map((l, i) => {
        if (!l.trim()) return '<li class="blank"></li>';
        const { count } = lineSyll(l);
        const d = s.target ? count - s.target : 0;
        const cls = !s.target ? '' : d === 0 ? 'ok' : Math.abs(d) <= 1 ? 'near' : 'off';
        const flags = `${/\[\?/.test(l) ? '<i class="flag doute" title="Passage incertain">?</i>' : ''}${/_{2,}|\[\.\.\.\]/.test(l) ? '<i class="flag trou" title="Trou à combler">_</i>' : ''}`;
        return `<li class="${cls}"><b>${count}</b>${s.target && d ? `<small>${d > 0 ? '+' : ''}${d}</small>` : ''}<span class="rl">${letters[i]}</span>${flags}</li>`;
      }).join('');
      view.innerHTML = lines.filter((l) => l.trim()).map((l) => {
        const r = lineSyll(l);
        const html = r.words.map((w) => `<span class="w${w.known === false ? ' unknown' : ''}" data-word="${esc(w.word.replace(/['’]$/, ''))}">${w.parts.map((p, i) => `<span class="${w.silent.includes(i) ? 'mute' : 'sy'}">${esc(p)}</span>`).join('<i>·</i>')}</span>`).join(' ');
        return `<p>${html}${/_{2,}|\[\.\.\.\]/.test(l) ? ' <span class="hole">trou</span>' : ''}${/\[\?/.test(l) ? ' <span class="doubt">à revoir</span>' : ''}</p>`;
      }).join('');
      const total = lines.filter((l) => l.trim()).length;
      const holes = (s.text.match(/_{2,}|\[\.\.\.\]/g) || []).length;
      const doubts = (s.text.match(/\[\?/g) || []).length;
      el.querySelector(`[data-sec="${id}"] .sec-label`).textContent = `${kindLabel(song, s)}${total ? ` · ${total} ligne${total > 1 ? 's' : ''}` : ''}${holes ? ` · ${holes} trou${holes > 1 ? 's' : ''}` : ''}${doubts ? ` · ${doubts} à revoir` : ''}`;
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      dirty = true;
      const st = el.querySelector('.save-state');
      if (st) st.textContent = 'Modification…';
      saveTimer = setTimeout(doSave, 1200);
    }
    async function doSave(force) {
      if (!song) return;
      try {
        const r = await songs.save(song, force ? undefined : base);
        if (r?.conflict) {
          const who = r.current.editedBy || 'Ton duo';
          if (confirm(`${who} a modifié cette chanson en même temps que toi.\n\nOK : garder TA version (elle remplace la sienne)\nAnnuler : prendre SA version`)) {
            base = r.current.updatedAt;
            return doSave(true);
          }
          song = JSON.parse(JSON.stringify(r.current));
          base = r.current.updatedAt;
          renderEditor();
          return;
        }
        base = r.entry.updatedAt;
        dirty = false;
        if (!song.createdAt) song.createdAt = r.entry.createdAt;
        const st = el.querySelector('.save-state');
        if (st) st.textContent = espace.connected ? 'Enregistré pour vous deux' : 'Enregistré sur cet appareil';
        refreshList();
      } catch (err) {
        const st = el.querySelector('.save-state');
        if (st) st.textContent = 'Hors ligne : on réessaie…';
        saveTimer = setTimeout(doSave, 5000);
      }
    }
    function refreshList() {
      const ul = el.querySelector('.song-list ul');
      if (!ul) return;
      const list = songs.list();
      ul.innerHTML = list.map((s) => `<li><a href="#/paroles/${s.id}" class="song-link${song?.id === s.id ? ' active' : ''}"><b>${esc(s.title || 'Sans titre')}</b><small>${esc(s.author || '')} · ${ago(s.updatedAt)}</small></a></li>`).join('');
    }

    async function lookup(w) {
      word = w;
      const out = el.querySelector('.wb-out');
      const inp = el.querySelector('[data-w=q]');
      if (inp && inp.value !== w) inp.value = w;
      if (!w) return;
      out.innerHTML = '<p class="muted small">Recherche…</p>';
      await loadLexique();
      const sy = wordSyll(w);
      const r = rhymes(w);
      const chips = (arr) => arr.map((x) => `<button class="word-chip" data-ins="${esc(x)}">${esc(x)}</button>`).join('');
      out.innerHTML = `
        <h3 class="wb-word">${esc(w)}</h3>
        <p class="wb-syll">${sy.parts.map((p, i) => `<span class="${sy.mute && i === sy.parts.length - 1 ? 'mute' : 'sy'}">${esc(p)}</span>`).join('<i>·</i>')} <small class="muted">${sy.parts.length - (sy.mute ? 1 : 0)}${sy.mute ? ` (+1 e muet)` : ''} syll.</small></p>
        ${r ? `
          <h4>Rimes riches</h4><div class="chips-w">${chips(r.riches) || '<span class="muted small">—</span>'}</div>
          <h4>Rimes suffisantes</h4><div class="chips-w">${chips(r.suffisantes.slice(0, 50)) || '<span class="muted small">—</span>'}</div>
          <details><summary>Assonances (même voyelle)</summary><div class="chips-w">${chips(r.assonances)}</div></details>`
          : '<p class="muted small">Mot absent du lexique : les rimes ne sont pas disponibles, mais les syllabes sont estimées.</p>'}
        <h4>Synonymes</h4><div class="chips-w syn"><span class="muted small">Wiktionnaire…</span></div>`;
      const syn = await synonyms(w);
      const box = el.querySelector('.syn');
      if (box && word === w) box.innerHTML = syn == null ? '<span class="muted small">Wiktionnaire inaccessible pour l’instant.</span>' : syn.length ? chips(syn) : '<span class="muted small">Aucun synonyme répertorié.</span>';
    }

    function insertWord(w) {
      const ta = lastField && el.contains(lastField) ? lastField : el.querySelector('.lyrics');
      if (!ta) { navigator.clipboard?.writeText(w); toast(`« ${w} » copié.`); return; }
      const { selectionStart: a, selectionEnd: b, value } = ta;
      const before = value.slice(0, a);
      const pad = before && !/\s$/.test(before) ? ' ' : '';
      ta.value = before + pad + w + value.slice(b);
      ta.selectionStart = ta.selectionEnd = a + pad.length + w.length;
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    el.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.x) {
        const s = song.data.sections.find((x) => x.id === t.dataset.x);
        s.text = t.value;
        t.rows = Math.max(4, t.value.split('\n').length + 1);
        lastTyping = Date.now();
        analyse(s.id);
        scheduleSave();
      }
      if (t.dataset.p === 'title') { song.title = t.value; lastTyping = Date.now(); scheduleSave(); }
      if (t.dataset.t) { song.data.sections.find((x) => x.id === t.dataset.t).target = +t.value || 0; analyse(t.dataset.t); scheduleSave(); }
      if (t.dataset.w === 'q') { clearTimeout(t._d); t._d = setTimeout(() => lookup(t.value.trim()), 350); }
    });
    el.addEventListener('focusin', (e) => { if (e.target.classList.contains('lyrics')) lastField = e.target; });
    el.addEventListener('change', (e) => {
      if (e.target.dataset.k) {
        song.data.sections.find((x) => x.id === e.target.dataset.k).kind = e.target.value;
        renderEditor();
        scheduleSave();
      }
    });
    // Double-clic (ou toucher) sur un mot : la boîte à mots le cherche.
    el.addEventListener('dblclick', (e) => {
      if (!e.target.classList.contains('lyrics')) return;
      const ta = e.target;
      const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
      if (sel && !/\s/.test(sel)) lookup(sel.replace(/[^\p{L}'’-]/gu, ''));
    });
    el.addEventListener('click', async (e) => {
      const wEl = e.target.closest('[data-word]');
      if (wEl) {
        lookup(wEl.dataset.word);
        if (window.innerWidth < 900) el.querySelector('.wordbox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const ins = e.target.closest('[data-ins]');
      if (ins) { insertWord(ins.dataset.ins); return; }
      const add = e.target.closest('[data-add]');
      if (add) {
        song.data.sections.push({ id: uid(), kind: add.dataset.add, text: '', target: song.data.sections.at(-1)?.target || 8 });
        renderEditor();
        scheduleSave();
        return;
      }
      const mv = e.target.closest('[data-mv]');
      if (mv) {
        const [id, d] = mv.dataset.mv.split(':');
        const arr = song.data.sections;
        const i = arr.findIndex((x) => x.id === id);
        const j = i + +d;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        renderEditor();
        scheduleSave();
        return;
      }
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const s = song.data.sections.find((x) => x.id === rm.dataset.rm);
        if (!s.text.trim() || confirm('Retirer cette section et son texte?')) {
          song.data.sections = song.data.sections.filter((x) => x !== s);
          renderEditor();
          scheduleSave();
        }
        return;
      }
      const mk = e.target.closest('[data-mark]');
      if (mk) {
        const [id, kind] = mk.dataset.mark.split(':');
        const ta = el.querySelector(`[data-x="${id}"]`);
        const { selectionStart: a, selectionEnd: b, value } = ta;
        const mid = kind === 'trou' ? '___' : `[?${value.slice(a, b) || '…'}?]`;
        ta.value = value.slice(0, a) + mid + value.slice(b);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = a + mid.length;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      const a = e.target.closest('[data-p]')?.dataset.p;
      if (a === 'new') {
        song = blankSong();
        base = 0;
        history.replaceState(null, '', `#/paroles/${song.id}`);
        render();
        await doSave();
        el.querySelector('.title-input')?.focus();
      }
      if (a === 'delete' && confirm(`Supprimer « ${song.title || 'Sans titre'} »${espace.connected ? ' pour vous deux' : ''}?`)) {
        await songs.remove(song.id);
        song = null;
        history.replaceState(null, '', '#/paroles');
        render();
      }
      if (a === 'speak' && window.speechSynthesis) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(song.data.sections.map((s) => s.text.replace(/\[\?|\?\]|_{2,}/g, ' ')).join('. '));
        u.lang = 'fr-CA';
        u.rate = 0.95;
        speechSynthesis.speak(u);
      }
    });

    // Une modification du duo arrive : on recharge si on n'est pas en train de taper.
    const off = onEspace((what) => {
      if (what === 'meta') { openFromHash(); render(); return; }
      if (what !== 'entries' || !song) { if (what === 'entries') refreshList(); return; }
      refreshList();
      const remote = songs.list().find((s) => s.id === song.id);
      if (remote && remote.updatedAt > base && Date.now() - lastTyping > 4000) {
        song = JSON.parse(JSON.stringify(remote));
        base = remote.updatedAt;
        renderEditor();
        toast(`${remote.editedBy || 'Ton duo'} vient de modifier « ${remote.title || 'Sans titre'} ».`);
      }
    });

    if (!espace.me && espace.id) { espaceGate(el, { onReady: () => { openFromHash(); render(); } }); }
    else { openFromHash(); render(); }
    loadLexique().then(() => song?.data.sections.forEach((s) => analyse(s.id)));
    return () => { off(); clearTimeout(saveTimer); if (song && dirty) doSave(); };
  },
};
