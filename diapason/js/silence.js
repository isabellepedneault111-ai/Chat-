// « ■ Arrêter le son » : dès que l'app joue quelque chose (une boucle, un son du mur, une œuvre), ce bouton apparaît en
// bas de l'écran, partout. Un geste, et tout se tait : la page qui joue s'arrête elle-même si elle sait le faire
// (elle écoute l'évènement « diapason:stop ») ; sinon, la page est remontée à neuf, ce qui arrête ses boucles.
import { sonne, couper } from './audio.js';
import { arreterMetronome } from './metronome.js';

const medias = () => [...document.querySelectorAll('audio, video')].filter((m) => !m.paused && !m.ended);

export function installerSilence(remonter) {
  const b = document.createElement('button');
  b.className = 'arret-son'; b.type = 'button'; b.hidden = true; b.innerHTML = '<i aria-hidden="true"></i>Arrêter le son';
  document.body.append(b);
  let oui = 0; let non = 0;
  setInterval(() => {
    const joue = sonne() || medias().length > 0;
    if (joue) { oui++; non = 0; } else { non++; oui = 0; }
    if (oui >= 2) b.hidden = false; // deux relevés de suite : pas pour un clic isolé
    if (non >= 4) b.hidden = true;
  }, 300);
  b.addEventListener('click', () => {
    const boucle = sonne() && !medias().length;
    const ev = new CustomEvent('diapason:stop', { cancelable: true });
    dispatchEvent(ev);
    medias().forEach((m) => m.pause());
    arreterMetronome(); couper();
    if (boucle && !ev.defaultPrevented) remonter();
    b.hidden = true; oui = 0;
  });
}
