// Le bouton de la lampe : une lampe dessinée dont le filament rougeoit quand elle chauffe, et sa « chauffe ».
// Le même réglage partout (labo, cathédrale, Jouer) : c'est la sortie de l'app qui passe par la lampe.
import { store } from './ui.js';
import { regler_lampe, etatLampe } from './audio.js';

const tube = '<svg viewBox="0 0 32 40" class="lp-tube" aria-hidden="true"><path d="M8 30V14a8 8 0 0 1 16 0v16z" class="lp-verre"/><path d="M12 26V16l4 6 4-6v10" class="lp-fil"/><rect x="7" y="30" width="18" height="5" rx="1.5" class="lp-culot"/><path d="M11 35v4M16 35v4M21 35v4" class="lp-broche"/></svg>';
// Les commandes de la lampe (le tube qui réchauffe la sortie de l’app).
export const lampeHTML = () => `<div class="lampe-ctl" data-lampe>
  <button type="button" class="lp-bouton" data-lp="on" aria-pressed="false">${tube}<span><b>Lampe</b><small class="lp-etat">éteinte</small></span></button>
  <label class="lp-chauffe"><span>chauffe</span><input type="range" min="0" max="100" data-lp="chauffe" aria-label="Chauffe de la lampe"></label>
  <details class="lp-quoi"><summary aria-label="Ce que fait la lampe">?</summary><p>Comme une vraie lampe (un tube) dans un ampli : une saturation douce et asymétrique (des harmoniques paires, la « chaleur »), une compression naturelle quand on joue fort, et le <b>bruit de grenaille</b>, le souffle des électrons qui arrivent un par un (Schottky, 1918), qui suit le signal. Allumée, elle met une dizaine de secondes à chauffer.</p></details>
</div>`;
// Branche la lampe : rallume-la si on l’avait laissée allumée, règle sa chauffe ; renvoie de quoi la débrancher.
export function brancherLampe(root) {
  const box = root.querySelector('[data-lampe]'); if (!box) return () => {};
  const voulu = store.get('lampe', { on: false, chauffe: 0.5 });
  if (voulu.on && !etatLampe().on) regler_lampe(voulu);
  const maj = () => { const e = etatLampe(); box.classList.toggle('on', e.on); box.style.setProperty('--tiede', e.on ? e.tiede : 0); box.querySelector('[data-lp=on]').setAttribute('aria-pressed', e.on); box.querySelector('.lp-etat').textContent = !e.on ? 'éteinte' : e.tiede < 1 ? 'elle chauffe…' : 'chaude'; box.querySelector('[data-lp=chauffe]').value = Math.round(e.chauffe * 100); };
  box.addEventListener('click', (ev) => { if (!ev.target.closest('[data-lp=on]')) return; const e = etatLampe(); regler_lampe({ on: !e.on }); store.set('lampe', { on: !e.on, chauffe: e.chauffe }); maj(); });
  box.addEventListener('input', (ev) => { if (ev.target.dataset.lp !== 'chauffe') return; const e = etatLampe(); regler_lampe({ on: e.on, chauffe: +ev.target.value / 100 }); store.set('lampe', { on: e.on, chauffe: +ev.target.value / 100 }); maj(); });
  maj(); const id = setInterval(maj, 500);
  return () => clearInterval(id);
}
