// Nos deux âmes : ce que nos deux points de départ donnent quand on les tisse ensemble.
// Pas un formulaire relu : des croisements (ce que l'un apporte, ce que l'autre veut apprendre), nos frottements
// féconds, des pistes hors sentier tirées de nos propres mots, et ce que nos traces disent déjà. La page se recalcule
// à chaque visite : plus on crée, plus elle change.
import { espace, profileOf, onEspace } from '../espace.js';
import { MEMBERS, BESOINS, STAGES, memberColor, aspect, lienAuMoment } from '../duo.js';
import { esc, espaceGate } from './carnet.js';
import { arcSVG, triskelSVG } from '../talismans.js';
import { nomNote } from '../oreille.js';
import { store } from '../ui.js';

const bas = (s) => String(s || '').toLowerCase();
const tout = (p) => bas([p.force, p.apprendre, p.instruments, p.apporte, p.bloque, p.besoin, p.fierte, p.objectifLibre, ...(p.objectifs || []), ...(p.styles || []), ...(p.artistes || []).flatMap((a) => [a?.nom, a?.pourquoi, ...(a?.aime || []).map(aspect)])].join(' · '));

// Des pistes hors sentier, chacune née de ce que vous avez écrit (on dit pourquoi).
function pistes(z, f, nz, nf) {
  const tz = tout(z); const tf = tout(f); const t = `${tz} ${tf}`; const out = [];
  const styles = new Set([...(z.styles || []), ...(f.styles || [])].map(bas));
  if ((styles.has('ambient') || /ambient/.test(t)) && /overdrive|cri|rock|joplin/.test(t)) out.push(['L’orage dans le brouillard', `Une nappe ambient de ${nf}, immobile et douce. Au moment fort, la voix de ${nz} entre en overdrive, comme un orage. Puis le brouillard revient.`, `Parce que vous avez nommé l’ambient, et que ${nz} cite l’overdrive et Janis Joplin.`]);
  if (/visuel|perform/.test(tf)) out.push(['Une chanson qui se voit', `Pendant que vous jouez, le portrait de L’oreille est projeté derrière vous et réagit en direct. La performance devient image, l’image devient partition.`, `Parce que ${nf} apporte des « éléments sonores et visuels performatifs ».`]);
  if (/invisible|piano version|version piano/.test(t)) out.push(['La version « piano invisible »', 'Prenez votre chanson la plus électro et refaites-la nue : piano et voix, rien d’autre. Ce qui tient encore, c’est le cœur de la chanson.', 'Parce que vous avez mis la version piano d’un morceau électro dans vos inspirations.']);
  if (styles.has('musique de film') || /kill bill|film/.test(t)) out.push(['La scène qui n’existe pas', 'Inventez une scène de film (un lieu, une heure, un geste) et écrivez la chanson qui jouerait dessus. Le film reste dans vos têtes ; la chanson, elle, existera.', 'Parce que la musique de film et Kill Bill sont dans vos couleurs.']);
  if (/filon|finir|originaux/.test(t)) out.push(['La boucle-mère', 'Une seule boucle, déclinée en trois chansons : le couplet de l’une devient le pont de l’autre. Trois originaux qui se répondent, un même filon qu’on ne peut plus arrêter de nourrir.', `Parce que ${nz} veut finir 3 à 5 originaux et que ${nf} cherche « un filon de création commune qu’il devient inévitable de nourrir infiniment ».`]);
  if (/justice|électro|electro/.test(t)) out.push(['Le filtre qui respire', 'Une boucle à la Justice dont le filtre s’ouvre lentement ; chaque ouverture fait entrer une couche de voix. La production devient dramaturgie.', 'Parce que Justice et l’électro sont dans vos inspirations.']);
  if (/improvis/.test(bas(z.bloque)) || /improvis/.test(tf)) out.push(['L’impro à boussole', `Avant chaque impro, ${nf} donne UNE boussole en trois mots (« sombre, lent, trois notes »). ${nz} sait où aller ; ${nf} garde toute sa liberté.`, `Parce que ${nf} brille en impro et que ${nz} redoute de se perdre quand on improvise sans savoir ce qui est cherché.`]);
  if (z.voix && z.voix.high - z.voix.low >= 28) out.push(['Trois octaves en une chanson', `Une chanson qui commence murmurée tout en bas (${nomNote(z.voix.low + 2)}) et finit en cri tout en haut (${nomNote(z.voix.high - 2)}). Toute la voix de ${nz}, d’un bout à l’autre.`, `Parce que la tessiture mesurée de ${nz} couvre ${Math.round((z.voix.high - z.voix.low) / 12 * 10) / 10} octaves.`]);
  if (!out.length) out.push(['Une contrainte par séance', 'Tirez une contrainte au dé avant chaque séance et gardez-la jusqu’au bout.', 'Parce que la contrainte libère.']);
  // Ce que vous cherchez tous les deux dans vos inspirations devient une façon de commencer.
  const aime = (p) => new Set((p.artistes || []).flatMap((a) => a?.aime || []));
  const az = aime(z); const af = aime(f);
  const DEPART = {
    rythme: ['Le groove d’abord', `Partez d’une rythmique que vous aimez tous les deux. ${nf} la refait au beat, ${nz} la mumble avant le moindre accord. Les accords viendront se poser sur le corps de la chanson.`],
    voix: ['La voix devant', `Une chanson où la voix porte tout : ${nf} ne joue que ce qui la met en valeur (une pédale, deux accords). Enregistrez la voix d’abord, l’arrangement après.`],
    texte: ['Une ligne qui tient seule', `Écrivez une seule phrase qui vous touche tous les deux, lue à voix haute sans musique. Si elle tient nue, construisez la chanson autour.`],
    son: ['Le grain avant la note', `Choisissez un son (un piano abîmé, un souffle, un bruit de la pièce) et faites-en le personnage principal. La chanson naît de sa couleur.`],
    ambiance: ['Le lieu avant la note', `Décrivez ensemble un lieu précis (une heure, une lumière, une température). Ambiances → écrire dedans, puis jouez ce lieu.`],
    melodie: ['La mélodie qui reste', `Une mélodie fredonnable en 4 mesures, chantée par ${nz}, harmonisée ensuite par ${nf} de trois façons différentes. Gardez celle qui surprend.`],
    accords: ['Les accords qui racontent', `Une suite de quatre accords qui raconte déjà quelque chose sans voix. Studio → Mes propres accords, puis la voix cherche sa place.`],
    emotion: ['Une seule émotion, sans détour', `Nommez une émotion précise (pas « triste » : « soulagé mais honteux ») et refusez tout ce qui ne la sert pas.`],
    energie: ['La montée', `Une chanson qui ne fait que monter : chaque section ajoute une couche, rien ne redescend avant la fin.`],
  };
  [...az].filter((k) => af.has(k) && DEPART[k]).slice(0, 2).forEach((k) => out.push([...DEPART[k], `Parce que vous aimez tous les deux ${aspect(k)} dans vos inspirations.`]));
  return out;
}

export default {
  id: 'ames',
  mount(el) {
    store.set('amesVu', true);
    const rendre = () => {
      if (!espace.connected) { espaceGate(el, { onReady: rendre }); return; }
      const mem = espace.meta.members || MEMBERS; const [nz, nf] = mem;
      const z = profileOf(nz) || {}; const f = profileOf(nf) || {};
      if (!z.doneAt || !f.doneAt) { el.innerHTML = `<div class="mod-head"><div><p class="eyebrow">Nos deux âmes</p><h1>Il manque un portrait.</h1><p class="muted">Cette page se tisse quand vous avez fait tous les deux votre étape 1. <a href="#/depart">L’étape 1 →</a></p></div></div>`; return; }
      const communs = (z.objectifs || []).filter((o) => (f.objectifs || []).includes(o));
      const stylesC = (z.styles || []).filter((o) => (f.styles || []).includes(o));
      const ecarts = BESOINS.map(([k, g, d]) => ({ k, g, d, a: z.besoins?.[k] ?? 50, b: f.besoins?.[k] ?? 50 })).sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b));
      const ents = espace.entries.filter((e) => !e.demo && !e.data?.demo);
      const traces = {
        seances: ents.filter((e) => e.type === 'session' && e.data?.done).length,
        prises: ents.filter((e) => e.audio).length,
        chansons: ents.filter((e) => e.type === 'chanson').length,
        pages: ents.filter((e) => e.data?.journal).length,
        idees: STAGES.map((s) => ents.filter((e) => ['note', 'texte', 'audio', 'essai', 'paroles'].includes(e.type) && !e.data?.journal && (e.data?.stage || 0) === s.id).length),
      };
      const fortes = (p) => Object.entries(p.notesVoix || {}).filter(([, o]) => o.n >= 3 && Math.abs(o.cents) < 12).sort((a, b) => b[1].n - a[1].n).slice(0, 5).map(([m]) => nomNote(+m));
      const insp = mem.flatMap((m, i) => ([z, f][i].artistes || []).filter((a) => a?.nom).map((a) => ({ ...a, de: m })));
      const P = pistes(z, f, nz, nf);
      const cz = memberColor(nz); const cf = memberColor(nf);
      el.innerHTML = `
        <div class="ames-hero">
          <div class="ah-z" style="--c:${cz}">${arcSVG()}<b>${esc(nz)}</b><span>${esc(z.force || '')}</span></div>
          <div class="ah-mid"><p class="eyebrow">Nos deux âmes</p><h1>L’arc et le triskel</h1><p>Ce que nos deux points de départ deviennent quand on les tisse. Cette page se recalcule à chaque visite : plus on crée, plus elle change.</p></div>
          <div class="ah-f" style="--c:${cf}">${triskelSVG()}<b>${esc(nf)}</b><span>${esc(f.force || '')}</span></div>
        </div>
        <section class="ames-grid">
          <article class="panel"><h2>Ce qui nous unit</h2>
            <div class="pick">${communs.map((o) => `<span class="pick-chip on">${esc(o)}</span>`).join('') || '<span class="muted">Pas encore d’objectif en commun : c’est une conversation à avoir.</span>'}</div>
            ${stylesC.length ? `<p>Nos couleurs communes : <b>${stylesC.map(esc).join(', ')}</b>.</p>` : ''}
            ${z.fierte || f.fierte ? `<p class="ames-horizon">Dans six mois, on sera fiers si… <span style="color:${cz}">« ${esc(z.fierte || '')} »</span> <span style="color:${cf}">« ${esc(f.fierte || '')} »</span></p>` : ''}
          </article>
          <article class="panel"><h2>Ce que l’un apporte, ce que l’autre cherche</h2>
            <div class="ames-echange"><p><b style="color:${cz}">${esc(nz)} apporte</b> ${esc(z.apporte || z.force || '—')}</p><p class="fl">→</p><p><b style="color:${cf}">${esc(nf)} veut apprendre</b> ${esc(f.apprendre || '—')}</p></div>
            <div class="ames-echange"><p><b style="color:${cf}">${esc(nf)} apporte</b> ${esc(f.apporte || f.force || '—')}</p><p class="fl">→</p><p><b style="color:${cz}">${esc(nz)} veut apprendre</b> ${esc(z.apprendre || '—')}</p></div>
          </article>
          <article class="panel"><h2>Nos frottements féconds</h2>
            <p class="muted small">Là où vous êtes loin l’un de l’autre. Pas un problème : c’est là que naissent les accords à trouver.</p>
            ${ecarts.slice(0, 3).map((x) => `<div class="need-duo"><span>${esc(x.g)}</span><div class="nd-track"><i style="left:${x.a}%;--c:${cz}">${esc(nz[0])}</i><i style="left:${x.b}%;--c:${cf}">${esc(nf[0])}</i></div><span>${esc(x.d)}</span></div>`).join('')}
            ${z.bloque || f.bloque ? `<p class="small"><b>Ce qui pourrait coincer :</b> <span style="color:${cz}">${esc(nz)}</span> : « ${esc((z.bloque || '').slice(0, 160))} » · <span style="color:${cf}">${esc(nf)}</span> : « ${esc((f.bloque || '').slice(0, 160))} »</p>` : ''}
          </article>
        </section>
        <section class="ames-pistes"><h2>Nos pistes hors sentier</h2><p class="muted">Tirées de vos propres mots. Chacune dit pourquoi elle est là.</p>
          <div class="ap-grid">${P.map(([t, q, pq]) => `<article class="ap"><h3>${esc(t)}</h3><p>${esc(q)}</p><small>${esc(pq)}</small></article>`).join('')}</div>
        </section>
        <section class="ames-grid">
          <article class="panel"><h2>Nos inspirations</h2><ul class="ames-insp">${insp.map((a) => `<li style="--c:${memberColor(a.de)}">${a.lien ? `<a href="${esc(lienAuMoment(a.lien, a.moment))}" target="_blank" rel="noopener">${esc(a.nom)}${a.moment ? ` à ${esc(a.moment)}` : ''} ↗</a>` : esc(a.nom)} <small>${esc(a.de)}</small>${a.aime?.length ? `<span class="art-aime">${a.aime.map(aspect).map(esc).join(' · ')}</span>` : ''}${a.pourquoi ? `<em class="art-pq">« ${esc(a.pourquoi)} »</em>` : ''}</li>`).join('') || '<li class="muted">Aucune encore.</li>'}</ul></article>
          <article class="panel"><h2>Ce que nos traces disent déjà</h2>
            <ul class="ames-traces"><li><b>${traces.seances}</b> séance${traces.seances > 1 ? 's' : ''} terminée${traces.seances > 1 ? 's' : ''}</li><li><b>${traces.prises}</b> prise${traces.prises > 1 ? 's' : ''} enregistrée${traces.prises > 1 ? 's' : ''}</li><li><b>${traces.chansons}</b> chanson${traces.chansons > 1 ? 's' : ''} montée${traces.chansons > 1 ? 's' : ''} au studio</li><li><b>${traces.pages}</b> page${traces.pages > 1 ? 's' : ''} au journal</li></ul>
            <p class="small">Nos idées au mur : ${STAGES.map((s, i) => `${esc(s.label)} <b>${traces.idees[i]}</b>`).join(' · ')}</p>
            ${mem.map((m, i) => { const n = fortes([z, f][i]); return n.length ? `<p class="small">Les notes fortes de <b style="color:${memberColor(m)}">${esc(m)}</b>, mesurées par L’oreille : ${n.join(', ')}.</p>` : ''; }).join('') || `<p class="small muted">Quand vous gardez une prise de voix dans L’oreille, vos meilleures notes apparaissent ici.</p>`}
            <p class="small muted">Tout se recalcule : chaque séance, chaque prise et chaque idée qui monte font bouger votre plan de match et cette page.</p>
          </article>
        </section>
        <p class="ec-row"><a class="btn" href="#/depart">Revoir nos étapes 1</a><a class="btn" href="#/">Notre plan de match →</a></p>`;
    };
    rendre();
    return onEspace((what) => { if (what === 'meta' || what === 'entries' || what === 'connected') rendre(); });
  },
};
