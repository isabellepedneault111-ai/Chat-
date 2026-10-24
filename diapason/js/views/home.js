import { MODULES } from '../data.js';
import { mic } from '../audio.js';
import { autoCanvas, animate, keyboard, getProfile } from '../ui.js';
import { nameFR } from '../music.js';

export default {
  id: 'home',
  mount(el) {
    const profile = getProfile();
    el.innerHTML = `
      <section class="hero">
        <canvas class="hero-wave" aria-hidden="true"></canvas>
        <div class="hero-inner">
          <p class="eyebrow">Labo sonore · pour la classe</p>
          <h1 class="display">Diapa<span>son</span></h1>
          <p class="lead">Le labo où le son devient <em>visible</em>. Chante, frappe, compose&nbsp;: chaque vibration se dessine en direct.</p>
          <div class="hero-cta">
            <a class="btn primary big" href="#/miroir">Commencer par ma voix →</a>
            <a class="btn ghost big" href="#/labo">Voir un rythme devenir une note</a>
          </div>
          ${profile ? `<p class="profile-chip">Ton empreinte&nbsp;: <b>${profile.type}</b> · ${nameFR(profile.low)} → ${nameFR(profile.high)}</p>` : '<p class="hint">Allume le micro en haut à droite : les vagues vont réagir à ta voix.</p>'}
        </div>
      </section>

      <section class="cards" aria-label="Modules">
        ${MODULES.map((m) => `
          <a class="card" href="#/${m.id}" style="--c:${m.color}">
            <span class="card-num">${m.num}</span>
            <h2>${m.name}</h2>
            <p>${m.tagline}</p>
            <p class="card-q">« ${m.question} »</p>
            <span class="card-go" aria-hidden="true">→</span>
          </a>`).join('')}
      </section>

      <section class="panel kb-panel">
        <div class="panel-head">
          <h2>Clavier libre</h2>
          <span class="muted">Souris, doigt, ou touches <kbd>A</kbd> <kbd>W</kbd> <kbd>S</kbd> <kbd>E</kbd> <kbd>D</kbd> … <kbd>K</kbd></span>
        </div>
        <div class="kb-host"></div>
      </section>

      <section class="manifest">
        <div><b>Et si</b> on évaluait la justesse avec les yeux avant les oreilles?</div>
        <div><b>Et si</b> les fractions s’entendaient?</div>
        <div><b>Et si</b> chaque élève sortait de la période avec sa pochette d’album?</div>
      </section>`;

    const kb = keyboard(el.querySelector('.kb-host'), { from: 48, to: 76, pcKeys: true });

    // Vagues du héros : réagissent à la souris et au micro.
    const cv = autoCanvas(el.querySelector('.hero-wave'));
    let mx = 0.5;
    let lvl = 0;
    const onMove = (e) => { mx = e.clientX / window.innerWidth; };
    window.addEventListener('pointermove', onMove);
    const colors = ['#3ee6ff', '#9b6bff', '#ff4fb3', '#b6ff3e'];
    const stop = animate((t) => {
      const { ctx, w, h } = cv;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      lvl += ((mic.active ? Math.min(1, mic.level * 14) : 0.12) - lvl) * 0.08;
      const pitch = mic.current ? (mic.current.midi - 40) / 40 : mx;
      colors.forEach((c, i) => {
        ctx.beginPath();
        const amp = h * (0.06 + lvl * 0.28) * (1 - i * 0.15);
        const k = 0.004 + pitch * 0.012 + i * 0.0015;
        for (let x = 0; x <= w; x += 4) {
          const y = h * 0.62 + Math.sin(x * k + t * 0.0012 * (i + 1) + i) * amp * Math.sin((x / w) * Math.PI);
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.55 - i * 0.1;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = c;
        ctx.shadowBlur = 18;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    return () => { stop(); cv.dispose(); kb.dispose(); window.removeEventListener('pointermove', onMove); };
  },
};
