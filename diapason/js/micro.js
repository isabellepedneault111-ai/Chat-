// Une seule porte pour le micro, partout dans l'app (toutes les pages appellent getUserMedia ; on l'enveloppe ici).
// 1. Si une demande trop précise échoue (un micro choisi qui n'est plus là, des réglages que l'appareil refuse),
//    on redemande tout simplement « un micro », sans rien dire.
// 2. Si ça échoue encore, on dit POURQUOI et QUOI FAIRE, selon l'appareil : un micro bloqué dans le navigateur
//    (souvent un « Ne pas autoriser » touché un jour, que le navigateur retient), un micro pris par une autre app
//    (un appel, FaceTime, la dictée, Zoom), ou pas de micro du tout. Avant : « Le micro est refusé », point.
const md = navigator.mediaDevices;
const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const mac = !iOS && /Mac/.test(navigator.platform || navigator.userAgent);
const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const app = matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

function etapes(nom) {
  if (nom === 'NotReadableError' || nom === 'AbortError' || nom === 'TrackStartError') {
    return { titre: 'Le micro est déjà pris', texte: 'Une autre app l’utilise en ce moment (un appel, FaceTime, la dictée, Zoom, un autre onglet qui enregistre).', pas: ['Ferme l’autre app ou raccroche.', 'Puis retouche le bouton du micro ici.'] };
  }
  if (nom === 'NotSupportedError' || nom === 'TypeError' || !window.isSecureContext) {
    return { titre: 'Ce navigateur ne donne pas le micro ici', texte: 'Souvent : le lien s’est ouvert dans Messenger, Instagram ou Facebook, qui bloquent le micro.', pas: ['Touche ⋯ (ou le bouton de partage) › « Ouvrir dans Safari » (ou dans Chrome).', 'Ou tape l’adresse toi-même : diapason-labo.netlify.app', 'Puis retouche le bouton du micro.'] };
  }
  if (nom === 'NotFoundError' || nom === 'DevicesNotFoundError' || nom === 'OverconstrainedError') {
    return { titre: 'Aucun micro trouvé', texte: 'L’appareil ne voit pas de micro en ce moment.', pas: ['Branche un micro (ou des écouteurs avec micro).', 'Ou choisis-le dans Jouer › Mon studio.'] };
  }
  if (iOS) {
    return { titre: 'Le micro est bloqué sur cet iPhone', texte: 'Safari se souvient d’un « Ne pas autoriser » touché un jour. Il faut le réautoriser une fois :',
      pas: app
        ? ['Ouvre Réglages (l’app grise de l’iPhone).', 'Apps › Safari › Microphone : choisis « Demander » ou « Autoriser ».', 'Reviens ici et touche « Recharger ».']
        : ['Dans la barre d’adresse, touche « aA » (ou l’icône à gauche de l’adresse).', 'Réglages du site web › Microphone : « Autoriser ».', 'Si ça n’y est pas : Réglages de l’iPhone › Apps › Safari › Microphone › « Demander ».', 'Touche « Recharger ».'] };
  }
  if (mac && safari) {
    return { titre: 'Le micro est bloqué dans Safari', texte: 'Il faut le réautoriser pour ce site :', pas: ['Menu Safari › Réglages › Sites web › Microphone.', 'Pour diapason-labo.netlify.app : « Autoriser ».', 'Touche « Recharger ».'] };
  }
  return { titre: 'Le micro est bloqué dans ce navigateur', texte: 'Il faut le réautoriser pour ce site :',
    pas: ['Clique l’icône à gauche de l’adresse (le cadenas ou les réglages).', 'Microphone : « Autoriser ».', ...(mac ? ['Si le micro reste muet : Réglages Système du Mac › Confidentialité et sécurité › Microphone : active ton navigateur.'] : []), 'Touche « Recharger ».'] };
}

let dernier = 0;
export function aideMicro(err) {
  if (Date.now() - dernier < 4000) return; dernier = Date.now();
  const e = etapes(err?.name || 'NotAllowedError');
  document.querySelector('.micro-aide')?.remove();
  const v = document.createElement('div'); v.className = 'micro-aide'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', e.titre);
  v.innerHTML = `<div class="micro-aide-c"><p class="micro-aide-t">🎤 ${e.titre}</p><p>${e.texte}</p><ol>${e.pas.map((x) => `<li>${x}</li>`).join('')}</ol>
    <div class="micro-aide-b"><button class="btn primary" data-a="recharger">↻ Recharger</button><button class="btn" data-a="fermer">Fermer</button></div>
    <p class="micro-aide-pt">(${err?.name || 'refus'}${err?.message ? ` : ${String(err.message).slice(0, 80)}` : ''})</p></div>`;
  v.addEventListener('click', (x) => { const a = x.target.closest('[data-a]')?.dataset.a; if (a === 'recharger') location.reload(); if (a === 'fermer' || x.target === v) v.remove(); });
  document.body.append(v);
}

if (md?.getUserMedia && !md.__flip) {
  const original = md.getUserMedia.bind(md);
  md.getUserMedia = async (c) => {
    try { return await original(c); } catch (err) {
      // Une demande précise (un micro donné, des réglages) qui échoue : on redemande « un micro », tout simplement.
      if (c?.audio && typeof c.audio === 'object' && !['NotAllowedError', 'SecurityError'].includes(err?.name)) {
        try { return await original({ audio: true }); } catch (err2) { if (c?.audio) aideMicro(err2); throw err2; }
      }
      if (c?.audio) aideMicro(err);
      throw err;
    }
  };
  md.__flip = true;
}
