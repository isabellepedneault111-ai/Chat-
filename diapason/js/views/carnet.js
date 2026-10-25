// Carnet partagé du duo : écrits, audios, bilans, évaluations, essais — un seul fil, synchronisé.
import { espace, onEspace, createEspace, joinEspace, leaveEspace, deleteEspace, renameEspace, saveEntry, deleteEntry, uploadAudio, audioURL } from '../espace.js';
import { toast } from '../ui.js';
import { CARNET_TYPES, BILAN_QUESTIONS, EVAL_CRITERES } from '../data.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function ago(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
}

// Écran « qui es-tu? » + créer / rejoindre un espace. Réutilisé par l'Atelier de paroles et le Parcours.
export function espaceGate(host, { onReady, title = 'Votre espace à deux' } = {}) {
  // Espace déjà rejoint (lien d'invitation) : il ne manque que le prénom.
  if (espace.connected) {
    host.innerHTML = `
      <div class="gate"><div class="gate-card panel">
        <p class="tape">Bienvenue</p>
        <h2>${esc(espace.meta.name)}</h2>
        <p>Ton duo t’a invité·e dans cet espace. Comment veux-tu signer tes ajouts?</p>
        <label class="field col"><span>Ton prénom (ou pseudo)</span><input class="input" data-g="me" maxlength="40" placeholder="Ex. : Noah"></label>
        <div class="row"><button class="btn primary" data-g="enter">Entrer</button></div>
      </div></div>`;
    const go = () => {
      const me = host.querySelector('[data-g=me]').value.trim();
      if (!me) { toast('Écris d’abord ton prénom.'); return; }
      espace.me = me;
      onReady?.();
    };
    host.querySelector('[data-g=enter]').addEventListener('click', go);
    host.querySelector('[data-g=me]').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    return;
  }
  host.innerHTML = `
    <div class="gate">
      <div class="gate-card panel">
        <p class="tape">Espace du duo</p>
        <h2>${title}</h2>
        <p>Un seul endroit pour vos écrits, vos audios, vos bilans et votre parcours d’album. Ce que l’un ajoute, l’autre le voit en quelques secondes.</p>
        <label class="field col"><span>Ton prénom (ou pseudo)</span><input class="input" data-g="me" maxlength="40" placeholder="Ex. : Léa" value="${esc(espace.me)}"></label>
        <div class="gate-actions">
          <div>
            <label class="field col"><span>Nom de votre projet</span><input class="input" data-g="name" maxlength="80" placeholder="Ex. : Album Lumières du Nord"></label>
            <button class="btn primary" data-g="create">Créer notre espace</button>
          </div>
          <div class="gate-or">ou</div>
          <div>
            <label class="field col"><span>Lien reçu de ton ou ta partenaire</span><input class="input" data-g="link" placeholder="Colle le lien ici"></label>
            <button class="btn" data-g="join">Rejoindre</button>
          </div>
        </div>
        <p class="fineprint">Pas de compte, pas de mot de passe : <b>le lien est la clé</b>. Toute personne qui l’a peut lire et écrire. Ne le partage qu’avec ton duo et ton enseignant·e, et n’inscris pas de renseignements personnels sensibles.</p>
      </div>
    </div>`;
  host.querySelector('.gate').addEventListener('click', async (e) => {
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a !== 'create' && a !== 'join') return;
    const me = host.querySelector('[data-g=me]').value.trim();
    if (!me) { toast('Écris d’abord ton prénom.'); host.querySelector('[data-g=me]').focus(); return; }
    espace.me = me;
    e.target.disabled = true;
    try {
      if (a === 'create') await createEspace(host.querySelector('[data-g=name]').value.trim());
      else {
        const v = host.querySelector('[data-g=link]').value.trim();
        const id = (v.match(/rejoindre\/([A-Za-z0-9_-]{8,40})/) || v.match(/^([A-Za-z0-9_-]{8,40})$/) || [])[1];
        if (!id) throw new Error('Ce lien ne ressemble pas à un lien d’espace Diapason.');
        await joinEspace(id);
      }
      onReady?.();
    } catch (err) {
      toast(err.status === 404 ? 'Espace introuvable : vérifie le lien.' : err.message || 'Connexion impossible pour l’instant.');
      e.target.disabled = false;
    }
  });
}

export default {
  id: 'carnet',
  mount(el) {
    let filter = 'tout';
    let composing = 'note';
    let recorder = null;
    let pendingAudio = null;
    let offEsp = () => {};

    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Carnet partagé</p>
            <h1 class="esp-name">${esc(espace.meta.name)}</h1>
            <p class="muted">Tu écris en tant que <b>${esc(espace.me)}</b> · <span class="sync-state">synchronisé</span></p>
          </div>
          <div class="actions">
            <button class="btn" data-c="share">Inviter mon duo</button>
            <button class="btn ghost" data-c="settings" aria-expanded="false">Réglages</button>
          </div>
        </div>
        <div class="panel settings" hidden>
          <label class="field col"><span>Nom du projet</span><input class="input" data-s="name" maxlength="80" value="${esc(espace.meta.name)}"></label>
          <label class="field col"><span>Ton prénom</span><input class="input" data-s="me" maxlength="40" value="${esc(espace.me)}"></label>
          <label class="field col"><span>Lien de l’espace (garde-le précieusement)</span><input class="input mono" readonly value="${esc(espace.link)}"></label>
          <div class="row">
            <button class="btn" data-c="save-settings">Enregistrer</button>
            <button class="btn ghost" data-c="leave">Quitter cet appareil</button>
            <button class="btn danger" data-c="destroy">Effacer tout l’espace</button>
          </div>
        </div>

        <div class="carnet-grid">
          <section class="panel composer">
            <div class="type-tabs" role="tablist" aria-label="Type d’entrée">
              ${CARNET_TYPES.map((t) => `<button role="tab" data-type="${t.id}" aria-selected="${t.id === composing}">${t.label}</button>`).join('')}
            </div>
            <div class="composer-body"></div>
          </section>
          <section class="feed-wrap">
            <div class="feed-tools">
              <div class="filters" role="group" aria-label="Filtrer">
                <button class="chip" data-f="tout">Tout</button>
                ${CARNET_TYPES.map((t) => `<button class="chip" data-f="${t.id}">${t.label}</button>`).join('')}
              </div>
              <input class="input search" type="search" placeholder="Chercher dans le carnet" aria-label="Chercher">
            </div>
            <ol class="feed"></ol>
          </section>
        </div>`;
      renderComposer();
      renderFeed();
    }

    function renderComposer() {
      el.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-selected', b.dataset.type === composing));
      const body = el.querySelector('.composer-body');
      const t = CARNET_TYPES.find((x) => x.id === composing);
      let fields = '';
      if (composing === 'audio') {
        fields = `
          <div class="audio-drop">
            <button class="btn rec" data-c="rec">● Enregistrer ici</button>
            <span class="muted">ou</span>
            <label class="btn">Choisir un fichier<input type="file" accept="audio/*,video/*" data-c="file" hidden></label>
          </div>
          <p class="muted small audio-status">Mémo vocal du cellulaire, prise de guitare, idée de mélodie… (75 Mo max.)</p>`;
      } else if (composing === 'bilan') {
        fields = BILAN_QUESTIONS.map((qq, i) => `<label class="field col"><span>${qq}</span><textarea class="input" data-b="${i}" rows="2"></textarea></label>`).join('')
          + `<div class="scale-row"><span>Énergie du duo</span>${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="energie" value="${n}"><span>${n}</span></label>`).join('')}</div>`;
      } else if (composing === 'evaluation') {
        fields = `<table class="eval-table"><thead><tr><th>Critère</th>${['Début', 'En route', 'Solide', 'Wow'].map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>
          ${EVAL_CRITERES.map((c, i) => `<tr><th scope="row">${c.label}<small>${c.aide}</small></th>${[1, 2, 3, 4].map((n) => `<td><label><input type="radio" name="crit${i}" value="${n}"><span class="sr">${n}</span></label></td>`).join('')}</tr>`).join('')}
          </tbody></table>
          <label class="field col"><span>Qui évalue quoi?</span><select data-e="mode"><option>Autoévaluation</option><option>Évaluation par mon ou ma partenaire</option><option>Évaluation de l’enseignant·e</option></select></label>`;
      }
      body.innerHTML = `
        <p class="muted small">${t.aide}</p>
        <label class="field col"><span>Titre</span><input class="input" data-c="title" maxlength="200" placeholder="${t.placeholder}"></label>
        ${fields}
        <label class="field col"><span>${composing === 'audio' ? 'Note pour ton duo' : composing === 'bilan' || composing === 'evaluation' ? 'Commentaire' : 'Texte'}</span><textarea class="input" data-c="body" rows="${composing === 'texte' ? 8 : 4}"></textarea></label>
        <div class="row"><button class="btn primary" data-c="post">Ajouter au carnet</button></div>`;
      pendingAudio = null;
    }

    function entryHTML(e) {
      const t = CARNET_TYPES.find((x) => x.id === e.type) || { label: e.type };
      const mine = e.author === espace.me;
      let extra = '';
      if (e.type === 'bilan' && e.data?.answers) {
        extra = `<dl class="bilan">${BILAN_QUESTIONS.map((qq, i) => (e.data.answers[i] ? `<dt>${qq}</dt><dd>${esc(e.data.answers[i])}</dd>` : '')).join('')}${e.data.energie ? `<dt>Énergie</dt><dd>${'▮'.repeat(e.data.energie)}${'▯'.repeat(5 - e.data.energie)}</dd>` : ''}</dl>`;
      }
      if (e.type === 'evaluation' && e.data?.scores) {
        extra = `<p class="eval-mode">${esc(e.data.mode || '')}</p><ul class="eval-bars">${EVAL_CRITERES.map((c, i) => (e.data.scores[i] ? `<li><span>${c.label}</span><i style="--v:${e.data.scores[i]}"></i><b>${['', 'Début', 'En route', 'Solide', 'Wow'][e.data.scores[i]]}</b></li>` : '')).join('')}</ul>`;
      }
      if (e.type === 'paroles') {
        extra = `<a class="btn small" href="#/paroles/${e.id}">Ouvrir dans l’atelier</a>`;
      }
      return `
        <li class="entry type-${e.type}" data-id="${e.id}">
          <div class="entry-head">
            <span class="entry-type">${t.label}</span>
            <span class="entry-who"><b>${esc(e.author || '?')}</b> · ${ago(e.createdAt)}${e.updatedAt - e.createdAt > 60000 ? ` · modifié par ${esc(e.editedBy)}` : ''}</span>
            ${mine ? `<button class="icon-btn tiny" data-del="${e.id}" aria-label="Supprimer">×</button>` : ''}
          </div>
          ${e.title ? `<h3>${esc(e.title)}</h3>` : ''}
          ${e.audio ? `<div class="entry-audio" data-audio="${e.id}"><button class="btn small" data-play="${e.id}">▶ Écouter (${(e.audio.size / 1048576).toFixed(1).replace('.', ',')} Mo)</button></div>` : ''}
          ${extra}
          ${e.body ? `<div class="entry-body">${esc(e.body).replace(/\n/g, '<br>')}</div>` : ''}
        </li>`;
    }

    function renderFeed() {
      const feed = el.querySelector('.feed');
      if (!feed) return;
      const qv = (el.querySelector('.search')?.value || '').toLowerCase();
      const list = espace.entries.filter((e) => e.type !== 'parcours'
        && (filter === 'tout' || e.type === filter)
        && (!qv || `${e.title} ${e.body} ${e.author}`.toLowerCase().includes(qv)));
      el.querySelectorAll('[data-f]').forEach((b) => b.classList.toggle('active', b.dataset.f === filter));
      feed.innerHTML = list.length ? list.map(entryHTML).join('')
        : `<li class="empty-feed"><p><b>Le carnet est vide… pour l’instant.</b></p><p class="muted">Commencez par un bilan de votre première rencontre, ou déposez le mémo vocal de votre première idée.</p></li>`;
    }

    async function post() {
      const title = el.querySelector('[data-c=title]').value.trim();
      const body = el.querySelector('[data-c=body]').value.trim();
      const entry = { type: composing, title, body };
      if (composing === 'bilan') {
        entry.data = {
          answers: BILAN_QUESTIONS.map((_, i) => el.querySelector(`[data-b="${i}"]`).value.trim()),
          energie: +(el.querySelector('[name=energie]:checked')?.value || 0),
        };
        if (!title) entry.title = `Bilan du ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
      }
      if (composing === 'evaluation') {
        entry.data = { scores: EVAL_CRITERES.map((_, i) => +(el.querySelector(`[name=crit${i}]:checked`)?.value || 0)), mode: el.querySelector('[data-e=mode]').value };
      }
      if (composing === 'audio') {
        if (!pendingAudio) { toast('Enregistre ou choisis d’abord un audio.'); return; }
        const status = el.querySelector('.audio-status');
        try {
          entry.audio = await uploadAudio(pendingAudio, (p) => { status.textContent = `Envoi… ${Math.round(p * 100)} %`; });
        } catch (err) { toast(err.message); return; }
        if (!title) entry.title = pendingAudio.name || 'Mémo vocal';
      }
      if (!entry.title && !entry.body && !entry.data && !entry.audio) { toast('Le carnet attend quelques mots!'); return; }
      try {
        await saveEntry(entry);
        toast('Ajouté. Ton duo le voit déjà.');
        renderComposer();
      } catch (err) { toast(err.message || 'Envoi impossible : réessaie dans un instant.'); }
    }

    async function toggleRec(btn) {
      if (recorder) { recorder.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const type = recorder.mimeType || 'audio/webm';
          pendingAudio = new Blob(chunks, { type });
          recorder = null;
          btn.textContent = '● Refaire';
          btn.classList.remove('on');
          el.querySelector('.audio-status').innerHTML = `Prise prête (${Math.round(pendingAudio.size / 1024)} Ko). <audio controls src="${URL.createObjectURL(pendingAudio)}"></audio>`;
        };
        recorder.start();
        btn.textContent = '■ Arrêter';
        btn.classList.add('on');
      } catch { toast('Micro refusé. Autorise-le dans la barre d’adresse.'); }
    }

    el.addEventListener('click', async (e) => {
      const tt = e.target.closest('[data-type]');
      if (tt) { composing = tt.dataset.type; renderComposer(); return; }
      const f = e.target.closest('[data-f]');
      if (f) { filter = f.dataset.f; renderFeed(); return; }
      const del = e.target.closest('[data-del]');
      if (del && confirm('Supprimer cette entrée pour vous deux?')) { await deleteEntry(del.dataset.del).catch((err) => toast(err.message)); return; }
      const pl = e.target.closest('[data-play]');
      if (pl) {
        const en = espace.entries.find((x) => x.id === pl.dataset.play);
        pl.textContent = 'Chargement…';
        try {
          const url = await audioURL(en.audio);
          const box = el.querySelector(`[data-audio="${en.id}"]`);
          box.innerHTML = en.audio.type?.startsWith('video') ? `<video controls playsinline src="${url}"></video>` : `<audio controls src="${url}"></audio>`;
          box.querySelector('audio,video').play().catch(() => {});
        } catch (err) { toast(err.message); pl.textContent = '▶ Réessayer'; }
        return;
      }
      const a = e.target.closest('[data-c]')?.dataset.c;
      if (a === 'post') post();
      if (a === 'rec') toggleRec(e.target.closest('[data-c]'));
      if (a === 'share') {
        const text = `Rejoins notre espace Diapason « ${espace.meta.name} » : ${espace.link}`;
        if (navigator.share) navigator.share({ title: 'Diapason', text, url: espace.link }).catch(() => {});
        else { await navigator.clipboard?.writeText(espace.link); toast('Lien copié : envoie-le à ton duo.'); }
      }
      if (a === 'settings') {
        const s = el.querySelector('.settings');
        s.hidden = !s.hidden;
        e.target.setAttribute('aria-expanded', !s.hidden);
      }
      if (a === 'save-settings') {
        espace.me = el.querySelector('[data-s=me]').value.trim() || espace.me;
        await renameEspace(el.querySelector('[data-s=name]').value.trim()).catch((err) => toast(err.message));
        render();
      }
      if (a === 'leave' && confirm('Cet appareil oubliera l’espace. Garde le lien pour revenir!')) { leaveEspace(); render(); }
      if (a === 'destroy' && confirm('Effacer DÉFINITIVEMENT tout l’espace (écrits, audios, parcours) pour vous deux?')) {
        await deleteEspace().catch((err) => toast(err.message));
        render();
      }
    });
    el.addEventListener('change', (e) => {
      if (e.target.dataset.c === 'file' && e.target.files[0]) {
        pendingAudio = e.target.files[0];
        el.querySelector('.audio-status').textContent = `${pendingAudio.name} · ${(pendingAudio.size / 1048576).toFixed(1).replace('.', ',')} Mo — prêt à envoyer.`;
      }
    });
    el.addEventListener('input', (e) => { if (e.target.classList.contains('search')) renderFeed(); });

    offEsp = onEspace((what, extra) => {
      if (what === 'entries') {
        renderFeed();
        extra?.fresh?.forEach((x) => toast(`${x.author} a ajouté : ${x.title || (CARNET_TYPES.find((t) => t.id === x.type)?.label ?? 'une entrée')}`));
      }
      if (what === 'online') {
        const s = el.querySelector('.sync-state');
        if (s) s.textContent = espace.online ? 'synchronisé' : 'hors ligne — on réessaie…';
      }
      // On ne redessine pas tout (et on ne perd pas un texte en cours) pour un simple changement d'objectif.
      if (what === 'meta' && (!el.querySelector('.composer') || !espace.connected || el.querySelector('.esp-name')?.textContent !== espace.meta.name)) render();
    });

    render();
    return () => { offEsp(); recorder?.stop(); };
  },
};
