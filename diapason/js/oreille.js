// L'oreille de FLIP : elle écoute une pièce entière et en sort ce qu'un musicien cherche à la main.
// Silences, parties, tempo, tonalité, moment fort, et une boucle invisible pour écrire ou chanter dessus.
// Tout se calcule dans le navigateur : la pièce ne quitte pas l'appareil.

const NOTES = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
// Profils de tonalité (Krumhansl et Kessler 1982).
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const pause = () => new Promise((r) => setTimeout(r, 0));

// Mono, ré-échantillonné à ~11 kHz : assez pour l'analyse, rapide à calculer.
function mono(buf) {
  const sr = buf.sampleRate; const k = Math.max(1, Math.floor(sr / 11025));
  const n = Math.floor(buf.length / k); const out = new Float32Array(n);
  const chs = [...Array(buf.numberOfChannels)].map((_, c) => buf.getChannelData(c));
  for (let i = 0; i < n; i++) { let s = 0; for (const ch of chs) s += ch[i * k]; out[i] = s / chs.length; }
  return { x: out, sr: sr / k };
}

// FFT radix 2 (réelle → amplitudes), pour la tonalité.
function fftMag(re) {
  const n = re.length; const im = new Float32Array(n);
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len; const wr = Math.cos(a); const wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1; let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j]; const ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci; const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  const m = new Float32Array(n / 2); for (let i = 0; i < n / 2; i++) m[i] = Math.hypot(re[i], im[i]); return m;
}

export async function ecouter(buf, onStep = () => {}) {
  const { x, sr } = mono(buf);
  const duree = x.length / sr;
  // 1. L'énergie, 20 fois par seconde.
  onStep('J’écoute l’énergie…'); await pause();
  const hop = Math.floor(sr / 20); const nE = Math.floor(x.length / hop);
  const db = new Float32Array(nE);
  for (let i = 0; i < nE; i++) { let s = 0; for (let j = i * hop; j < (i + 1) * hop; j++) s += x[j] * x[j]; db[i] = 10 * Math.log10(s / hop + 1e-12); }
  const fort = Math.max(...db);
  // 2. Les silences : plus de 2 s à 40 dB sous le plus fort.
  const silences = []; let deb = -1;
  for (let i = 0; i <= nE; i++) {
    const calme = i < nE && db[i] < fort - 40;
    if (calme && deb < 0) deb = i;
    if (!calme && deb >= 0) { if ((i - deb) / 20 >= 2) silences.push([deb / 20, i / 20]); deb = -1; }
  }
  // 3. Les parties : entre les silences, et là où l'énergie change franchement (lissée sur 4 s).
  onStep('Je cherche les parties…'); await pause();
  const lis = db.map((_, i) => { let s = 0; let c = 0; for (let j = Math.max(0, i - 40); j < Math.min(nE, i + 40); j++) { s += db[j]; c++; } return s / c; });
  const cuts = [0];
  silences.forEach(([a, b]) => { cuts.push(a, b); });
  for (let i = 80; i < nE - 80; i += 10) { if (Math.abs(lis[i + 40] - lis[i - 40]) > 6 && !cuts.some((c) => Math.abs(c - i / 20) < 12)) cuts.push(i / 20); }
  cuts.push(duree); cuts.sort((a, b) => a - b);
  const parties = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]];
    if (b - a < 3) continue;
    const silence = silences.some(([s, e]) => Math.abs(s - a) < 0.2 && Math.abs(e - b) < 0.2);
    let s = 0; for (let j = Math.floor(a * 20); j < Math.floor(b * 20); j++) s += db[j];
    parties.push({ a, b, silence, niveau: s / ((b - a) * 20) });
  }
  // 4. Le tempo : l'autocorrélation des attaques (60 à 180 BPM).
  onStep('Je trouve le tempo…'); await pause();
  const on = new Float32Array(nE); for (let i = 1; i < nE; i++) on[i] = Math.max(0, db[i] - db[i - 1]);
  let bpm = 0; let best = -1;
  for (let b = 60; b <= 180; b++) {
    const lag = (20 * 60) / b; let s = 0;
    for (let i = 0; i + lag * 2 < nE; i++) s += on[i] * (on[Math.round(i + lag)] + 0.5 * on[Math.round(i + lag * 2)]);
    if (s > best) { best = s; bpm = b; }
  }
  // 5. La tonalité : les douze notes, comparées aux profils majeur et mineur.
  onStep('J’écoute la tonalité…'); await pause();
  const N = 4096; const chroma = new Float64Array(12);
  for (let p = 0; p + N < x.length; p += N * 4) {
    const w = new Float32Array(N); for (let i = 0; i < N; i++) w[i] = x[p + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
    const m = fftMag(w);
    for (let k = 4; k < N / 2; k++) { const f = (k * sr) / N; if (f < 65 || f > 2000) continue; const pc = ((Math.round(12 * Math.log2(f / 261.63)) % 12) + 12) % 12; chroma[pc] += m[k]; }
    if (p % (N * 40) === 0) await pause();
  }
  const corr = (prof, r) => { const a = [...Array(12)].map((_, i) => chroma[(i + r) % 12]); const ma = a.reduce((s, v) => s + v, 0) / 12; const mp = prof.reduce((s, v) => s + v, 0) / 12; let num = 0; let da = 0; let dp = 0; for (let i = 0; i < 12; i++) { num += (a[i] - ma) * (prof[i] - mp); da += (a[i] - ma) ** 2; dp += (prof[i] - mp) ** 2; } return num / Math.sqrt(da * dp); };
  // Quand majeur et mineur se valent presque, on le dit plutôt que de trancher au hasard.
  const cands = [];
  for (let r = 0; r < 12; r++) { cands.push([corr(MAJ, r), r, 'majeur'], [corr(MIN, r), r, 'mineur']); }
  cands.sort((u, v) => v[0] - u[0]);
  const [c1, c2] = cands;
  const relatif = c2[2] !== c1[2] && ((c1[2] === 'majeur' && (c1[1] + 9) % 12 === c2[1]) || (c1[2] === 'mineur' && (c1[1] + 3) % 12 === c2[1]));
  const ton = c1[0] - c2[0] < 0.04 && (c2[1] === c1[1] || relatif)
    ? `${NOTES[c1[1]]} ${c1[2]} ou ${NOTES[c2[1]]} ${c2[2]}`
    : `${NOTES[c1[1]]} ${c1[2]}`;
  // 6. Le moment fort : les 10 secondes les plus intenses.
  let mf = 0; let mfv = -1e9;
  for (let i = 0; i + 200 < nE; i += 10) { let s = 0; for (let j = i; j < i + 200; j++) s += db[j]; if (s > mfv) { mfv = s; mf = i / 20; } }
  // 7. Une boucle invisible : dans la plus longue partie jouée, deux passages qui se ressemblent assez pour s'enchaîner.
  onStep('Je cherche une boucle qui ne s’entend pas…'); await pause();
  const jouees = parties.filter((p) => !p.silence).sort((u, v) => (v.b - v.a) - (u.b - u.a));
  let boucle = null;
  if (jouees.length && jouees[0].b - jouees[0].a > 20) {
    const P = jouees[0]; const L = 80; // 4 s d'énergie
    const env = (t) => { const i = Math.floor(t * 20); return db.subarray(i, i + L); };
    const sim = (s, e) => { const a = env(s); const b = env(e); if (b.length < L) return -1; let ma = 0; let mb = 0; for (let i = 0; i < L; i++) { ma += a[i]; mb += b[i]; } ma /= L; mb /= L; let n = 0; let da = 0; let dbb = 0; for (let i = 0; i < L; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; dbb += (b[i] - mb) ** 2; } return n / Math.sqrt(da * dbb + 1e-9); };
    let bv = -1;
    const mesure = 240 / bpm; // une mesure en 4/4
    for (let s = P.a + 2; s < P.a + Math.min(30, (P.b - P.a) / 3); s += 0.5) {
      for (let e = s + Math.max(12, 4 * mesure); e < P.b - 4.5; e += 0.05) { const v = sim(s, e); if (v > bv) { bv = v; boucle = { a: s, b: e, qualite: v }; } }
      await pause();
    }
  }
  return { duree, db, silences, parties, bpm, ton, momentFort: [mf, mf + 10], boucle };
}

// Joue un passage en boucle, avec un court fondu enchaîné à chaque tour pour que la jonction disparaisse.
export function boucler(ctx, buf, { a, b }, dest, xf = 0.12) {
  let stop = false; let timer = 0; const srcs = [];
  const tour = (offset, when) => {
    if (stop) return;
    const src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain();
    src.connect(g).connect(dest); g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(1, when + xf);
    src.start(when, offset); srcs.push(src);
    const fin = when + (b - offset);
    g.gain.setValueAtTime(1, fin - xf); g.gain.linearRampToValueAtTime(0.0001, fin + 0.02); src.stop(fin + 0.05);
    timer = setTimeout(() => tour(a - xf, fin - xf), Math.max(0, (fin - ctx.currentTime - 1) * 1000));
  };
  tour(a, ctx.currentTime + 0.05);
  return () => { stop = true; clearTimeout(timer); srcs.forEach((s) => { try { s.stop(); } catch { /* fini */ } }); };
}

// Fabrique un fichier de la boucle répétée (pour écrire dessus ou l'envoyer au relais).
export async function rendreBoucle(buf, { a, b }, tours = 4, xf = 0.12) {
  const sr = buf.sampleRate; const lenTour = b - a;
  const off = new OfflineAudioContext(buf.numberOfChannels, Math.ceil((lenTour * tours + 1) * sr), sr);
  for (let k = 0; k < tours; k++) {
    const src = off.createBufferSource(); src.buffer = buf; const g = off.createGain(); src.connect(g).connect(off.destination);
    const when = k * (lenTour - xf);
    g.gain.setValueAtTime(k ? 0.0001 : 1, when); g.gain.linearRampToValueAtTime(1, when + xf);
    g.gain.setValueAtTime(1, when + lenTour - xf); g.gain.linearRampToValueAtTime(k === tours - 1 ? 1 : 0.0001, when + lenTour);
    src.start(when, a, lenTour + 0.02);
  }
  const r = await off.startRendering();
  return wav(r);
}
export function wav(buf) {
  const ch = buf.numberOfChannels; const n = buf.length; const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); data.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
  data.setUint32(24, buf.sampleRate, true); data.setUint32(28, buf.sampleRate * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, n * ch * 2, true);
  const chs = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { data.setInt16(o, Math.max(-1, Math.min(1, chs[c][i])) * 32767, true); o += 2; }
  return new Blob([data], { type: 'audio/wav' });
}

// ---------- Ce qui brille, ce qui est à retravailler ----------
// Des repères tirés du son, pas des jugements de goût : l'énergie qui retombe, une longue partie sans relief,
// un groove régulier, des parties qui contrastent. À vous de décider quoi en faire.
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export function diagnostic(res) {
  const { db, parties, duree } = res; const nE = db.length;
  const moy = (a, b) => { let s = 0; let c = 0; for (let i = Math.max(0, a); i < Math.min(nE, b); i++) { s += db[i]; c++; } return c ? s / c : -99; };
  const brille = []; const travail = [];
  const jouees = parties.filter((p) => !p.silence);
  brille.push({ a: res.momentFort[0], b: res.momentFort[1], titre: `Le moment fort, à ${mmss(res.momentFort[0])}`, quoi: 'Les 10 secondes les plus intenses : c’est là que la chanson frappe. Une bonne place pour le refrain ou le titre.' });
  if (res.boucle?.qualite >= 0.85) brille.push({ a: res.boucle.a, b: res.boucle.b, titre: 'Un passage qui tourne tout seul', quoi: `De ${mmss(res.boucle.a)} à ${mmss(res.boucle.b)}, il s’enchaîne sans couture (${Math.round(res.boucle.qualite * 100)} %) : parfait pour écrire ou improviser dessus.` });
  // La régularité du groove : les attaques reviennent-elles au même endroit, mesure après mesure?
  const on = new Float32Array(nE); for (let i = 1; i < nE; i++) on[i] = Math.max(0, db[i] - db[i - 1]);
  const lag = Math.round((20 * 60) / res.bpm); let sl = 0; let sm = 0; let c = 0;
  for (let i = 0; i + lag < nE; i++) { sl += on[i] * on[i + lag]; sm += on[i] * on[Math.min(nE - 1, i + Math.round(lag * 0.62))]; c++; }
  if (c && sl > sm * 1.35) brille.push({ titre: 'Un groove régulier', quoi: `Les attaques reviennent à leur place, autour de ${res.bpm < 80 ? res.bpm * 2 : res.bpm} BPM : la pulsion tient la route.` });
  // Le contraste se mesure entre de vraies parties : pas l'intro qui s'allume ni la fin qui s'éteint.
  const vraies = jouees.filter((p) => p.b - p.a >= 12 && !(p.b > duree - 1 && p.b - p.a < 20) && !(p.a < 1 && p.b - p.a < 12));
  if (vraies.length >= 2) {
    // Le haut de chaque partie (90e centile) : une partie qui s'éteint en fondu n'a pas l'air « douce » pour autant.
    const haut = (p) => { const v = Array.from(db.subarray(Math.floor(p.a * 20), Math.floor(p.b * 20))).sort((x, y) => x - y); return v[Math.floor(v.length * 0.9)] ?? -99; };
    const nv = vraies.map(haut); const ecart = Math.max(...nv) - Math.min(...nv);
    if (ecart >= 4) { const f = vraies[nv.indexOf(Math.max(...nv))]; const d = vraies[nv.indexOf(Math.min(...nv))]; brille.push({ titre: 'Des parties qui contrastent', quoi: `La partie de ${mmss(d.a)} est plus douce, celle de ${mmss(f.a)} plus pleine (${Math.round(ecart)} dB d’écart) : l’oreille sent le chemin.` }); }
    else travail.push({ titre: 'Des parties qui se ressemblent', quoi: `À peine ${Math.round(ecart)} dB d’écart entre les parties : un couplet plus dépouillé ou un refrain plus plein ferait sentir le chemin.` });
  }
  // L'énergie qui retombe au milieu d'une partie (pas à ses bords, pas dans la fin qui s'éteint).
  jouees.forEach((p) => {
    if (p.b - p.a < 14) return;
    const m = moy(p.a * 20, p.b * 20); let deb = -1;
    for (let t = p.a + 3; t <= p.b - 3; t += 1) {
      const bas = t < p.b - 4 && t < duree - 8 && moy(t * 20, (t + 4) * 20) < m - 6;
      if (bas && deb < 0) deb = t;
      if (!bas && deb >= 0) { if (t - deb >= 3) travail.push({ a: deb, b: t + 3, titre: `L’énergie retombe à ${mmss(deb)}`, quoi: `Pendant ${Math.round(t + 3 - deb)} s, le son baisse nettement au milieu d’une partie. Voulu? Sinon : une couche, une voix, ou couper plus court.` }); deb = -1; }
    }
    // Une longue partie au même niveau, sans relief.
    if (p.b - p.a > 60) {
      const pts = []; for (let t = p.a; t < p.b - 4; t += 4) pts.push(moy(t * 20, (t + 4) * 20));
      const mu = pts.reduce((s, v) => s + v, 0) / pts.length; const sd = Math.sqrt(pts.reduce((s, v) => s + (v - mu) ** 2, 0) / pts.length);
      if (sd < 1.6) travail.push({ a: p.a, b: p.b, titre: `${Math.round(p.b - p.a)} s au même niveau`, quoi: `De ${mmss(p.a)} à ${mmss(p.b)}, l’énergie ne bouge presque pas. Un break, un pont ou une entrée de voix relancerait l’écoute.` });
    }
  });
  return { brille, travail };
}

// ---------- Les notes d'une voix seule ----------
// Hauteur par autocorrélation normalisée (comme un accordeur), note par note. Seulement si l'enregistrement est
// surtout une voix seule : dans un mélange d'instruments, la mesure ne serait pas fiable, et on le dit.
export async function notesVoix(buf, onStep = () => {}) {
  onStep('J’écoute les notes de la voix…'); await pause();
  const sr0 = buf.sampleRate; const k = Math.max(1, Math.floor(sr0 / 11025)); const sr = sr0 / k;
  const chs = [...Array(buf.numberOfChannels)].map((_, c) => buf.getChannelData(c));
  const n = Math.min(Math.floor(buf.length / k), Math.floor(sr * 120)); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (const ch of chs) for (let j = 0; j < k; j++) s += ch[i * k + j] || 0; x[i] = s / (chs.length * k); }
  const L = 512; const hop = 256; const lmin = Math.floor(sr / 1000); const lmax = Math.floor(sr / 75);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i]));
  const fr = []; let actives = 0; let claires = 0;
  for (let p = 0; p + L + lmax < n; p += hop) {
    let e = 0; for (let i = 0; i < L; i++) e += x[p + i] * x[p + i];
    if (Math.sqrt(e / L) < peak * 0.04) { fr.push(null); continue; }
    actives++;
    let best = 0; let bl = 0; const r = new Float32Array(lmax + 2);
    for (let l = lmin; l <= lmax + 1; l++) { let s = 0; let e2 = 0; for (let i = 0; i < L; i++) { s += x[p + i] * x[p + i + l]; e2 += x[p + i + l] * x[p + i + l]; } r[l] = s / Math.sqrt(e * e2 + 1e-12); }
    for (let l = lmin + 1; l <= lmax; l++) if (r[l] > best && r[l] >= r[l - 1] && r[l] >= r[l + 1]) { best = r[l]; bl = l; }
    // Le premier pic presque aussi haut que le meilleur : sinon on entendrait la note une octave trop bas.
    for (let l = lmin + 1; l < bl; l++) if (r[l] >= best * 0.93 && r[l] >= r[l - 1] && r[l] >= r[l + 1]) { bl = l; best = r[l]; break; }
    if (best < 0.86) { fr.push(null); continue; }
    claires++;
    const d = (r[bl - 1] - r[bl + 1]) / (2 * (r[bl - 1] - 2 * r[bl] + r[bl + 1]) || 1); // interpolation parabolique
    const f = sr / (bl + d); const midi = 69 + 12 * Math.log2(f / 440);
    fr.push(midi);
    if (fr.length % 200 === 0) await pause();
  }
  if (actives < 40 || claires / actives < 0.45) return { voix: false };
  // Des notes : au moins ~140 ms sur le même demi-ton.
  const notes = []; let cur = null;
  const fin = () => { if (cur && cur.v.length >= 6) { const cents = cur.v.map((m) => (m - cur.m) * 100); const mu = cents.reduce((s, v) => s + v, 0) / cents.length; notes.push({ m: cur.m, t: cur.t, cents: mu, sd: Math.sqrt(cents.reduce((s, v) => s + (v - mu) ** 2, 0) / cents.length) }); } cur = null; };
  fr.forEach((m, i) => { if (m == null) { fin(); return; } const r = Math.round(m); if (cur && cur.m === r) cur.v.push(m); else { fin(); cur = { m: r, t: (i * hop) / sr, v: [m] }; } });
  fin();
  const parNote = {};
  notes.forEach((o) => { (parNote[o.m] ||= []).push(o); });
  const bilan = Object.entries(parNote).map(([m, l]) => ({ m: +m, n: l.length, cents: l.reduce((s, o) => s + o.cents, 0) / l.length, sd: l.reduce((s, o) => s + o.sd, 0) / l.length })).sort((a, b) => a.m - b.m);
  const fortes = bilan.filter((b) => b.n >= 2 && Math.abs(b.cents) < 12 && b.sd < 22).sort((a, b) => b.n - a.n).slice(0, 4);
  const aTravailler = bilan.filter((b) => b.n >= 2 && Math.abs(b.cents) >= 20).sort((a, b) => Math.abs(b.cents) - Math.abs(a.cents)).slice(0, 4);
  return { voix: true, notes: bilan, fortes, aTravailler, nNotes: notes.length };
}
export const nomNote = (m) => `${NOTES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

// ---------- Les accords d'un enregistrement ----------
// Temps par temps : les douze notes entendues (chroma), comparées à des gabarits d'accords. On fusionne les temps
// voisins qui donnent le même accord. Fiable sur un clavier ou une guitare clairs ; moins sous une batterie chargée.
const GABARITS = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6] };
const SUF = { M: '', m: 'm', 7: '7', maj7: 'maj7', m7: 'm7', sus2: 'sus2', sus4: 'sus4', dim: 'dim' };
export async function trouverAccords(buf, bpm, onStep = () => {}) {
  onStep('Je cherche les accords…'); await pause();
  const { x, sr } = mono(buf);
  const tempo = bpm < 80 ? bpm * 2 : bpm; const temps = 60 / tempo;
  // Une mesure tous les quarts de temps : les changements d'accords sont datés finement, quel que soit le tempo estimé.
  const N = 4096; const pasT = Math.max(N / 2, Math.floor((temps / 4) * sr));
  const brut = [];
  for (let p = 0; p + N < x.length; p += pasT) {
    const ch = new Float64Array(12); let e = 0;
    for (let o = 0; (o === 0 || o + N <= pasT) && p + o + N < x.length; o += N / 2) {
      const w = new Float32Array(N); for (let i = 0; i < N; i++) { const v = x[p + o + i]; w[i] = v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N)); e += v * v; }
      const m = fftMag(w);
      for (let k = 6; k < N / 2; k++) { const f = (k * sr) / N; if (f < 60 || f > 1800) continue; const pc = ((Math.round(12 * Math.log2(f / 261.63)) % 12) + 12) % 12; ch[pc] += m[k] * (f < 300 ? 1.4 : 1); }
    }
    let best = null; const tot = ch.reduce((s, v) => s + v, 0) || 1;
    if (e > 1e-4) {
      for (let r = 0; r < 12; r++) for (const [q, iv] of Object.entries(GABARITS)) {
        let dans = 0; iv.forEach((d) => { dans += ch[(r + d) % 12]; });
        const sc = dans / tot - (iv.length - 3) * 0.035 + (q === 'M' || q === 'm' ? 0.02 : 0);
        if (!best || sc > best.sc) best = { r, q, sc };
      }
    }
    brut.push(best && best.sc > 0.38 ? best : null);
    if (brut.length % 40 === 0) await pause();
  }
  // Lisser : un accord isolé d'un seul temps entre deux identiques est sans doute une note de passage.
  // (Les mesures sont des quarts de temps : on lisse les îlots de moins d'un temps, en deux passes.)
  for (let passe = 0; passe < 2; passe++) for (let w = 1; w <= 3; w++) for (let i = 1; i + w < brut.length; i++) { const a = brut[i - 1]; const c = brut[i + w]; if (a && c && a.r === c.r && a.q === c.q) for (let k = i; k < i + w; k++) if (!brut[k] || brut[k].r !== a.r || brut[k].q !== a.q) brut[k] = a; }
  const segs = [];
  brut.forEach((b, i) => {
    const t = (i * pasT) / sr; const last = segs[segs.length - 1];
    if (b && last && last.r === b.r && last.q === b.q && Math.abs(last.b - t) < 0.01) last.b = t + pasT / sr;
    else if (b) segs.push({ r: b.r, q: b.q, a: t, b: t + pasT / sr });
  });
  return segs.filter((s) => s.b - s.a >= temps * 0.9).map((s) => ({ ...s, nom: NOTES[s.r] + SUF[s.q], temps: Math.round((s.b - s.a) / temps) }));
}

// ---------- La grille par mesures ----------
// Comme une feuille d'accords de musicien : 4 temps par mesure, 4 mesures par ligne. Une mesure identique à la précédente
// devient « % » ; si toute la suite tourne en boucle, on l'écrit une fois, avec ses reprises (‖: … :‖ × n).
export function grilleMesures(accs, bpm, parMesure = 4) {
  if (!accs?.length) return null;
  const t0 = bpm < 80 ? bpm * 2 : bpm; const debut = accs[0].a;
  // Recaler le tempo : les changements d'accords tombent sur des temps. On cherche, à ±6 % du tempo entendu,
  // la durée de temps qui les aligne le mieux (sinon, une petite erreur s'accumule et tout glisse en fin de grille).
  const changes = accs.slice(1).map((x) => x.a - debut); let temps = 60 / t0; let mieux = -Infinity;
  for (let k = -120; k <= 120; k++) { const L = (60 / t0) * (1 + k * 0.0005); const sc = changes.reduce((s2, c) => s2 + Math.cos((2 * Math.PI * c) / L), 0) - Math.abs(k) * 0.002; if (sc > mieux) { mieux = sc; temps = L; } }
  const tempo = Math.round(60 / temps);
  // Et la phase : on décale le départ pour que les changements tombent pile sur les temps, en moyenne.
  const ph = Math.atan2(changes.reduce((s2, c) => s2 + Math.sin((2 * Math.PI * c) / temps), 0), changes.reduce((s2, c) => s2 + Math.cos((2 * Math.PI * c) / temps), 0));
  const debutCale = debut + (ph / (2 * Math.PI)) * temps;
  const fin = accs[accs.length - 1].b; const nb = Math.max(1, Math.ceil((fin - debut) / (temps * parMesure) - 0.25));
  // Un petit trou (moins d'un temps) entre deux accords : l'accord continue, le son s'est juste éteint un instant.
  const a = (t) => (accs.find((x) => t >= x.a - temps * 0.25 && t < x.b - temps * 0.25) || accs.find((x) => t >= x.b - temps * 0.25 && t < x.b + temps))?.nom || '';
  const mesures = [];
  for (let m = 0; m < nb; m++) {
    const tps = [...Array(parMesure)].map((_, k) => a(debutCale + (m * parMesure + k + 0.5) * temps));
    // Les temps qui répètent l'accord d'avant s'effacent : « Rém · · · », « Do · Sol · ».
    const cases = tps.map((x, k) => (k && x === tps[k - 1] ? '' : x || '—'));
    mesures.push({ m: m + 1, t: debutCale + m * parMesure * temps, cases, cle: tps.join('|') });
  }
  // La boucle : la plus petite période (en mesures) qui se répète sur toute la suite, au moins deux fois.
  // (Tolérante : 80 % des mesures doivent revenir, car l'oreille peut se tromper sur un temps au début ou à la fin.)
  let periode = 0;
  for (let p = 1; p <= Math.floor(mesures.length / 2); p++) {
    const ok = mesures.filter((x, i) => i >= p && x.cle === mesures[i - p].cle).length;
    if (ok >= 0.8 * (mesures.length - p) && !(p > 1 && mesures.slice(0, p).every((x) => x.cle === mesures[0].cle))) { periode = p; break; }
  }
  // La boucle écrite une fois : pour chaque mesure de la boucle, la version la plus fréquente.
  const boucle = periode ? [...Array(periode)].map((_, j) => { const v = mesures.filter((_, i) => i % periode === j); const n = {}; v.forEach((x) => { n[x.cle] = (n[x.cle] || 0) + 1; }); const top = Object.entries(n).sort((a2, b2) => b2[1] - a2[1])[0][0]; return v.find((x) => x.cle === top); }) : null;
  return { mesures, periode, boucle, tours: periode ? Math.round(mesures.length / periode) : 0, tempo };
}
export function grilleTexte(g, titre = '') {
  const l = g.boucle || g.mesures; const lignes = [];
  for (let i = 0; i < l.length; i += 4) lignes.push(`| ${l.slice(i, i + 4).map((x, k) => (i + k && x.cle === l[i + k - 1].cle ? '%' : x.cases.map((c) => c || '·').join(' '))).join(' | ')} |`);
  return `${titre ? `${titre}\n` : ''}${g.tempo} BPM · 4 temps par mesure\n${g.periode ? `‖: répété ${g.tours} fois :‖\n` : ''}${lignes.join('\n')}\n`;
}
