// Jeux d'écriture : se délier avant d'écrire une chanson. Un champ lexical qu'on remplit à deux,
// un mot tiré au sort et une consigne d'atelier, un cadavre exquis à distance,
// et les ateliers de Zaza, qu'elle ajoute elle-même au paquet.
import { espace, onEspace, saveEntry, uid } from '../espace.js';
import { toast } from '../ui.js';
import { esc, espaceGate, ago } from './carnet.js';
import { memberColor, MEMBERS } from '../duo.js';
import { ecrire } from '../ecrire.js';
import { rituel } from '../rituel.js';
import { FLAME } from '../marque.js';
import { intentions } from './relais.js';
import { logPractice } from '../traces.js';

// Le paquet : consignes classiques d'ateliers d'écriture. brise = 1 à 3 minutes pour se délier.
export const CARTES = [
  { id: 'souviens', nom: 'Je me souviens', brise: true, min: 3, consigne: 'Cinq lignes qui commencent par « Je me souviens », autour du mot. Des souvenirs minuscules et précis.', src: 'Georges Perec, 1978' },
  { id: 'acro', nom: 'Acrostiche', brise: true, min: 3, consigne: 'Écris le mot à la verticale : chaque lettre ouvre une ligne.' },
  { id: 'interdit', nom: 'Le mot interdit', brise: true, min: 2, consigne: 'Décris le mot sans jamais l’écrire. L’autre doit deviner en lisant.' },
  { id: 'portrait', nom: 'Portrait chinois', brise: true, min: 3, consigne: 'Si ce mot était une couleur, un son, une heure, un lieu, un geste, une saison… Une ligne pour chaque.' },
  { id: 'auto', nom: 'Écriture automatique', brise: true, min: 3, consigne: 'Trois minutes sans t’arrêter ni te relire, en partant du mot. Si tu bloques, réécris le mot jusqu’à ce que ça reparte.', src: 'Breton et Soupault, 1919' },
  { id: 'inventaire', nom: 'Inventaire', brise: true, min: 4, consigne: 'Une liste de dix choses qu’on trouve dans ce mot, comme s’il était une pièce, une poche, une boîte.', src: 'à la manière de Prévert' },
  { id: 'imposes', nom: 'Trois mots imposés', min: 6, trois: true, consigne: 'Une strophe de quatre lignes qui contient les trois mots tirés du champ.' },
  { id: 'anaphore', nom: 'Anaphore', min: 6, consigne: 'Six lignes qui commencent toutes par la même expression (ex. « Il y a… », « Avant toi… »). Le refrain naît souvent là.' },
  { id: 'lipo', nom: 'Lipogramme', min: 6, consigne: 'Quatre lignes sur le mot sans jamais utiliser la lettre E. La contrainte force les images neuves.', src: 'Oulipo' },
  { id: 'zoom', nom: 'Gros plan, plan large', min: 6, consigne: 'Deux lignes sur le mot vu à deux centimètres, deux lignes vu à deux cents mètres.' },
  { id: 'dialogue', nom: 'Dialogue', min: 6, consigne: 'Six répliques entre toi et le mot. Il a le droit de te répondre mal.' },
  { id: 'lettre', nom: 'Lettre au mot', min: 8, consigne: 'Une courte lettre adressée au mot, comme à quelqu’un qu’on n’a pas vu depuis longtemps.' },
  { id: 'haiku', nom: 'Haïku', min: 5, check: [5, 7, 5], consigne: 'Trois lignes de 5, 7 et 5 syllabes chantées. L’app compte pour toi.' },
  { id: 'refrain', nom: 'Refrain express', min: 8, check: [8, 8, 8, 8], consigne: 'Un refrain de quatre lignes de huit syllabes, qui rime AABB. Le mot doit y être.', src: 'Pattison 2009' },
];

const other = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'Frog';
const find = (id) => espace.entries.find((e) => e.id === id);
async function merge(id, title, fn) {
  const cur = find(id);
  const r = await saveEntry({ id, type: 'jeu', title, data: fn(cur?.data || {}) }, { baseUpdatedAt: cur?.updatedAt });
  if (r.conflict) await saveEntry({ ...r.current, data: fn(r.current.data || {}) }, { baseUpdatedAt: r.current.updatedAt });
}
const CHAMP = 'jeu-champ';
const ATELIERS = 'jeu-ateliers';

export default {
  id: 'jeux',
  mount(el) {
    let filtre = 'brise';
    let writer = null;
    let tirage = null;
    let picker = null;

    function shell() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: shell }); return; }
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Le grimoire</p>
            <h1>Avant d’écrire, un rituel</h1>
            <p class="muted">Nos mots, réunis à deux. Une carte qu’on tire dans les braises. Un cadavre exquis qui voyage entre nous. Pas pour écrire une bonne chanson tout de suite : pour délier la main et ouvrir la porte. La chanson passe ensuite.</p>
          </div>
          <div class="actions"><a class="btn" href="#/paroles">Atelier de paroles →</a></div>
        </div>
        <section class="panel jx-champ">
          <div class="panel-head"><h2>Notre champ de mots</h2><label class="jx-theme"><span>Thème</span><input class="input" data-j="theme" maxlength="60" placeholder="l’hiver, la route, nous deux…"></label></div>
          <p class="muted small">Chacun y dépose ses mots, ensemble ou chacun de son côté. Les tiens et ceux de ${esc(other())} se mêlent ici : c’est dans ce champ que les cartes puisent.</p>
          <div class="jx-words"></div>
          <form class="jx-add"><input class="input" data-j="word" maxlength="40" placeholder="Un mot, puis Entrée" autocomplete="off"><button class="btn">Ajouter</button></form>
        </section>
        <section class="jx-draw screen panel">
          <div class="jx-draw-head">
            <div class="seg-tabs" role="tablist">${[['brise', 'Rituel court · 3 min'], ['atelier', 'Rituel long'], ['tout', 'Tout le grimoire']].map(([id, l]) => `<button role="tab" data-filtre="${id}" aria-selected="${id === filtre}">${l}</button>`).join('')}</div>
            <button class="btn big jx-open" data-j="draw">${FLAME('jx-flame')} Ouvrir le grimoire</button>
          </div>
          <div class="jx-card"></div>
        </section>
        <section class="panel jx-cadavre"><h2>Cadavre exquis à deux</h2><div class="jx-cad-body"></div></section>
        <section class="panel jx-ateliers">
          <div class="panel-head"><h2>Les rituels de ${esc(espace.meta.createdBy || 'Zaza')}</h2></div>
          <p class="muted small">Tes propres consignes d’ateliers d’écriture. Elles entrent dans le grimoire et sortent au tirage, signées de ton nom.</p>
          <div class="jx-perso"></div>
          <form class="jx-new">
            <input class="input" data-j="nom" maxlength="60" placeholder="Nom du rituel">
            <textarea class="input" data-j="consigne" rows="2" maxlength="400" placeholder="La consigne, comme tu la dirais en atelier"></textarea>
            <label class="check"><input type="checkbox" data-j="brise"> Rituel court (3 minutes ou moins)</label>
            <button class="btn">Inscrire dans le grimoire</button>
          </form>
        </section>`;
      refresh();
    }

    const words = () => find(CHAMP)?.data?.words || [];
    const perso = () => (find(ATELIERS)?.data?.cards || []).map((c) => ({ ...c, perso: true }));
    function refresh() {
      if (!el.querySelector('.jx-champ')) return;
      const th = el.querySelector('[data-j=theme]');
      if (document.activeElement !== th) th.value = find(CHAMP)?.data?.theme || '';
      el.querySelector('.jx-words').innerHTML = words().length
        ? words().map((w, i) => `<span class="jx-w" style="--c:${memberColor(w.by)}">${esc(w.w)}${w.by === espace.me ? `<button data-del="${i}" aria-label="Retirer">×</button>` : ''}</span>`).join('')
        : '<p class="muted small">Le champ est vide. Commencez par trois mots chacun, sans réfléchir.</p>';
      el.querySelector('.jx-perso').innerHTML = perso().map((c) => `<div class="jx-pc"><b>${esc(c.nom)}</b>${c.brise ? '<span class="rl-mood">rituel court</span>' : ''}<p>${esc(c.consigne)}</p><button class="btn small ghost" data-delcard="${esc(c.id)}">Retirer</button></div>`).join('');
      renderCadavre();
    }

    // ---------- Tirage ----------
    function draw() {
      const ws = words().map((w) => w.w);
      if (!ws.length) { toast('Le grimoire puise dans vos mots : déposez-en quelques-uns d’abord.'); el.querySelector('[data-j=word]').focus(); return; }
      const deck = [...CARTES, ...perso()].filter((c) => filtre === 'tout' || (filtre === 'brise' ? c.brise : !c.brise));
      // Trois cartes face cachée, chacune avec son mot : on en choisit une.
      const cards = [...deck].sort(() => Math.random() - 0.5).slice(0, 3);
      const all = [...CARTES, ...perso()];
      const tirages = cards.map((card) => {
        const sh = [...ws].sort(() => Math.random() - 0.5);
        return { card, mots: card.trois ? sh.slice(0, 3) : [sh[0]], num: all.indexOf(card) };
      });
      rituel(tirages, {
        theme: find(CHAMP)?.data?.theme || '',
        onAccept: (t) => { tirage = t; logPractice('grimoire', 1, { carte: t.card.nom, mot: t.mots.join(', ') }); renderCard(); el.querySelector('.jx-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      });
    }
    function renderCard() {
      const box = el.querySelector('.jx-card');
      writer?.dispose(); writer = null;
      if (!tirage) { box.innerHTML = ''; return; }
      const { card, mots } = tirage;
      box.innerHTML = `
        <p class="jx-mot">${mots.map(esc).join(' · ')}</p>
        <div class="jx-consigne"><b>${esc(card.nom)}</b>${card.perso ? `<span class="rl-mood">atelier de ${esc(card.by || 'Zaza')}</span>` : ''}<p>${esc(card.consigne)}</p>${card.src ? `<cite>${esc(card.src)}</cite>` : ''}</div>
        <div class="jx-actions"><button class="btn" data-j="defi">Lancer ce défi à ${esc(other())}</button><button class="btn ghost" data-j="draw">Retourner au feu</button></div>
        <div class="jx-pad"></div>
        <div class="jx-intents"></div>`;
      picker = intentions(box.querySelector('.jx-intents'), { to: other(), dark: true });
      writer = ecrire(box.querySelector('.jx-pad'), {
        mots, minutes: card.min || 3, senses: false, check: card.check || null,
        how: `${esc(card.consigne)} Le minuteur est là si tu veux jouer serré.`,
        saveLabel: `Envoyer à ${other()}`,
        title: `${card.nom} · ${mots.join(', ')}`,
        onSave: async (text) => {
          const v = picker.value();
          await saveEntry({ type: 'note', title: `${card.nom} · ${mots.join(', ')}`, body: text, data: { relais: true, jeu: card.id, ask: v.asks[0] || '', ...v, stage: 0, song: '' } });
          toast(`Dans le relais : ${other()} peut répondre.`);
        },
      });
    }

    // ---------- Cadavre exquis ----------
    const cadavres = () => espace.entries.filter((e) => e.type === 'jeu' && e.data?.kind === 'cadavre').sort((a, b) => b.createdAt - a.createdAt);
    function renderCadavre() {
      const box = el.querySelector('.jx-cad-body');
      if (!box || box.contains(document.activeElement)) return;
      const list = cadavres();
      const cur = list.find((c) => !c.data.revealed);
      const done = list.filter((c) => c.data.revealed).slice(0, 3);
      let html = '<p class="muted small">Chacun écrit une ligne en ne voyant que la dernière ligne de l’autre. Après huit lignes, on révèle tout. Souvent absurde, parfois un refrain.</p>';
      if (!cur) html += '<form class="jx-cad-form" data-new="1"><input class="input" data-j="cadline" maxlength="140" placeholder="La toute première ligne…"><button class="btn primary">Commencer</button></form>';
      else {
        const lines = cur.data.lines || [];
        const last = lines[lines.length - 1];
        html += `<div class="jx-cad-now"><p class="mono small">${lines.length} / 8 lignes</p>`;
        if (last.by === espace.me) html += `<p>Ta ligne est partie. On attend celle de <b>${esc(other())}</b>.</p>`;
        else html += `<p class="jx-last" style="--c:${memberColor(last.by)}">« ${esc(last.text)} »</p><form class="jx-cad-form" data-id="${esc(cur.id)}"><input class="input" data-j="cadline" maxlength="140" placeholder="Ta ligne, qui suit celle-là"><button class="btn primary">Ajouter</button></form>`;
        html += `${lines.length >= 4 ? `<button class="btn small ghost" data-reveal="${esc(cur.id)}">Révéler maintenant</button>` : ''}</div>`;
      }
      html += done.map((c) => `<div class="jx-cad-done"><p class="mono small">Révélé ${ago(c.updatedAt)}</p>${c.data.lines.map((l) => `<p style="--c:${memberColor(l.by)}">${esc(l.text)}</p>`).join('')}</div>`).join('');
      box.innerHTML = html;
    }
    async function addLine(form) {
      const text = form.querySelector('[data-j=cadline]').value.trim();
      if (!text) return;
      if (form.dataset.new) {
        await saveEntry({ id: `cad-${uid()}`.slice(0, 30), type: 'jeu', title: 'Cadavre exquis', data: { kind: 'cadavre', lines: [{ by: espace.me, text }] } });
        toast(`Première ligne lancée. ${other()} ne verra qu’elle.`);
      } else {
        const id = form.dataset.id;
        await merge(id, 'Cadavre exquis', (d) => { const lines = [...(d.lines || []), { by: espace.me, text }]; return { ...d, lines, revealed: lines.length >= 8 }; });
        toast((find(id)?.data?.lines || []).length >= 8 ? 'Huit lignes : on révèle!' : 'Ligne ajoutée.');
      }
      form.reset();
      document.activeElement?.blur();
      renderCadavre();
    }

    el.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        if (f.classList.contains('jx-add')) {
          const inp = f.querySelector('[data-j=word]');
          const fresh = inp.value.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
          if (!fresh.length) return;
          inp.value = '';
          await merge(CHAMP, 'Notre champ lexical', (d) => ({ ...d, words: [...(d.words || []), ...fresh.map((w) => ({ w: w.slice(0, 40), by: espace.me }))].slice(-200) }));
        }
        if (f.classList.contains('jx-cad-form')) await addLine(f);
        if (f.classList.contains('jx-new')) {
          const nom = f.querySelector('[data-j=nom]').value.trim();
          const consigne = f.querySelector('[data-j=consigne]').value.trim();
          if (!nom || !consigne) { toast('Un nom et une consigne.'); return; }
          const brise = f.querySelector('[data-j=brise]').checked;
          await merge(ATELIERS, 'Nos ateliers', (d) => ({ cards: [...(d.cards || []), { id: uid().slice(0, 10), nom, consigne, brise, min: brise ? 3 : 8, by: espace.me }] }));
          f.reset();
          toast('Inscrit dans le grimoire.');
        }
      } catch (err) { toast(err.message); }
    });
    el.addEventListener('click', async (e) => {
      const fb = e.target.closest('[data-filtre]');
      if (fb) { filtre = fb.dataset.filtre; el.querySelectorAll('[data-filtre]').forEach((b) => b.setAttribute('aria-selected', b === fb)); return; }
      const del = e.target.closest('[data-del]');
      if (del) { const i = +del.dataset.del; await merge(CHAMP, 'Notre champ lexical', (d) => ({ ...d, words: (d.words || []).filter((w, k) => !(k === i && w.by === espace.me)) })); return; }
      const dc = e.target.closest('[data-delcard]');
      if (dc) { await merge(ATELIERS, 'Nos ateliers', (d) => ({ cards: (d.cards || []).filter((c) => c.id !== dc.dataset.delcard) })); return; }
      const rv = e.target.closest('[data-reveal]');
      if (rv) { await merge(rv.dataset.reveal, 'Cadavre exquis', (d) => ({ ...d, revealed: true })); renderCadavre(); return; }
      const j = e.target.closest('[data-j]')?.dataset.j;
      if (j === 'draw') draw();
      if (j === 'defi' && tirage) {
        const { card, mots } = tirage;
        const v = picker.value();
        await saveEntry({ type: 'note', title: `Défi : ${card.nom} · ${mots.join(', ')}`, body: card.consigne, data: { relais: true, jeu: card.id, ask: v.asks[0] || 'ecris', asks: v.asks.length ? v.asks : ['ecris'], intent: v.intent, stage: 0, song: '' } });
        toast(`Défi lancé. ${other()} le verra sur l’accueil.`);
      }
    });
    el.addEventListener('change', async (e) => {
      if (e.target.dataset.j === 'theme') await merge(CHAMP, 'Notre champ lexical', (d) => ({ ...d, theme: e.target.value.trim() })).catch((err) => toast(err.message));
    });
    const off = onEspace((w) => { if (w === 'entries') refresh(); if (w === 'meta' && !el.querySelector('.jx-champ')) shell(); });
    shell();
    return () => { off(); writer?.dispose(); };
  },
};
