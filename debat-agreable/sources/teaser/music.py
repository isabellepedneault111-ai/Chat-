# Trame électro synthétisée (100 BPM, la mineur : Am - F - C - G) + effets sonores calés sur timeline.json
import json, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
TL = json.load(open("timeline.json"))
TOTAL = TL["total"] + 1.5
N = int(TOTAL * SR)
BEAT = TL["beat"]; BAR = BEAT * 4; S16 = BEAT / 4
rng = np.random.default_rng(7)
sc = {s["id"]: s for s in TL["scenes"]}
T_DROP, T_BREAK, T_RISE2, T_DROP2, T_END = sc["l3"]["start"], sc["l7"]["start"], sc["l9"]["start"], sc["l10"]["start"], sc["l11"]["start"] + sc["l11"]["dur"]

def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, n, ph=0): t = np.arange(n) / SR; return 2 * ((t * f + ph) % 1) - 1
def add(buf, x, t0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]; buf[i : i + len(x)] += x
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e

CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
pad = np.zeros(N); arp = np.zeros(N); bass = np.zeros(N); kick = np.zeros(N); hat = np.zeros(N); clap = np.zeros(N); fx = np.zeros(N); lead = np.zeros(N)

nbars = int(np.ceil(TOTAL / BAR))
for b in range(nbars):
    t0 = b * BAR; chord = CH[b % 4]
    if t0 > T_END: break
    # nappe
    n = int(BAR * SR * 1.05)
    x = sum(saw(hz(m) * d, n, r) for m in chord for d, r in ((1, 0), (1.004, .3), (0.996, .7)))
    add(pad, lp(x, 1400) * env(n, .5, .6) * 0.05, t0)
    # arpège (dès l1)
    if t0 >= sc["l1"]["start"] - 0.01:
        notes = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24]
        for k in range(16):
            tk = t0 + k * S16; m = notes[k % 4] + (12 if (k // 4) % 2 and t0 >= T_DROP2 else 0)
            nn = int(0.22 * SR); tt = np.arange(nn) / SR
            sq = np.sign(np.sin(2 * np.pi * hz(m) * tt)) * 0.6 + saw(hz(m) * 1.003, nn) * 0.4
            cut = 900 if tk < T_DROP else (2200 if tk < T_BREAK else (700 if tk < T_DROP2 else 3200))
            add(arp, lp(sq * np.exp(-tt * 14), cut) * 0.07, tk)
    # basse (sections pleines)
    if T_DROP <= t0 < T_BREAK or T_DROP2 <= t0 < T_END:
        for k in range(8):
            tk = t0 + k * BEAT / 2; nn = int(0.28 * SR); tt = np.arange(nn) / SR
            f = hz(chord[0] - 24)
            x = saw(f, nn) + 0.5 * np.sin(2 * np.pi * f / 2 * tt)
            add(bass, lp(x, 380) * np.exp(-tt * 7) * 0.22, tk)
    # mélodie principale au 2e refrain
    if T_DROP2 <= t0 < T_END:
        mel = [chord[2] + 12, chord[1] + 12, chord[0] + 12, chord[1] + 12]
        for k, m in enumerate(mel):
            nn = int(BEAT * SR * 0.95); tt = np.arange(nn) / SR
            vib = np.sin(2 * np.pi * 5 * tt) * 0.004
            x = saw(hz(m) * (1 + vib), nn) + saw(hz(m) * 1.01, nn)
            add(lead, lp(x, 2600) * env(nn, .02, .25) * 0.045, t0 + k * BEAT)

# batterie
def kick_hit():
    nn = int(0.4 * SR); tt = np.arange(nn) / SR
    f = 45 + 85 * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7) * 0.9
KH = kick_hit()
nb = int(TOTAL / BEAT)
for k in range(nb):
    tk = k * BEAT
    full = T_DROP <= tk < T_BREAK or T_DROP2 <= tk < T_END
    if full:
        add(kick, KH, tk)
        nn = int(0.05 * SR); add(hat, hp(rng.standard_normal(nn), 7000) * np.exp(-np.arange(nn) / SR * 70) * 0.12, tk + BEAT / 2)
        if k % 2 == 1:
            nn = int(0.18 * SR); add(clap, bp(rng.standard_normal(nn), 900, 2600) * np.exp(-np.arange(nn) / SR * 22) * 0.25, tk)
    elif T_BREAK <= tk < T_DROP2 and k % 4 == 0:  # battement de cœur pendant la pause
        add(kick, KH * 0.55, tk); add(kick, KH * 0.35, tk + 0.22)

# sidechain
side = np.ones(N)
for k in range(nb):
    tk = k * BEAT
    if T_DROP <= tk < T_BREAK or T_DROP2 <= tk < T_END:
        i = int(tk * SR); nn = int(0.3 * SR); side[i:i + nn] = np.minimum(side[i:i + nn], 1 - 0.6 * np.exp(-np.arange(min(nn, N - i)) / SR * 9))

# montées avant les drops
def riser(t1, length):
    nn = int(length * SR); tt = np.arange(nn) / SR
    noise = rng.standard_normal(nn)
    out = np.zeros(nn); seg = int(0.05 * SR)
    for i in range(0, nn, seg):
        fc = 400 + 7000 * (i / nn) ** 2
        out[i:i + seg] = bp(noise[i:i + seg + 0], fc * 0.7, min(fc * 1.3, 20000))
    sw = np.sin(2 * np.pi * np.cumsum(200 + 1200 * (tt / length) ** 2) / SR) * 0.15
    add(fx, (out * 0.35 + sw) * (tt / length) ** 2, t1 - length)
riser(T_DROP, 2.4); riser(T_DROP2, 3.6)

# impacts
def impact(t0, g=1.0):
    nn = int(1.6 * SR); tt = np.arange(nn) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-tt * 10)) / SR) * np.exp(-tt * 2.2)
    add(fx, (boom * 0.8 + lp(rng.standard_normal(nn), 3000) * np.exp(-tt * 6) * 0.3) * g, t0)
impact(T_DROP); impact(T_DROP2, 1.2); impact(T_END, 1.1)

# effets d'interface : glitch à chaque scène, clics de frappe, carillons
for s in TL["scenes"]:
    nn = int(0.12 * SR); g = rng.standard_normal(nn)
    g = np.round(g * 4) / 4  # bitcrush
    add(fx, hp(g, 1500) * np.exp(-np.arange(nn) / SR * 25) * 0.10, s["start"])
    for c in range(len(s["text"])):
        if s["text"][c] == " ": continue
        nn = int(0.006 * SR); add(fx, hp(rng.standard_normal(nn), 4000) * 0.022 * np.hanning(nn), s["typeStart"] + c * s["char"])
def chime(t0, notes, step=0.09, g=0.12):
    for i, m in enumerate(notes):
        nn = int(0.6 * SR); tt = np.arange(nn) / SR
        add(fx, (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt)) * np.exp(-tt * 6) * g, t0 + i * step)
chime(sc["l8"]["start"] + 1.6, [76, 81, 88])                       # reformulation validée
chime(sc["l9"]["start"] + 1.3, [69, 72, 76, 81, 84, 88], 0.07, 0.08)  # mise à jour

# réverbération (nappe, arpège, mélodie, carillons)
ir_n = int(2.2 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.6); ir = lp(ir, 5000); ir /= np.abs(ir).sum() / 6
wet_src = pad * side + arp + lead + fx * 0.3
wet = fftconvolve(wet_src, ir)[:N] * 0.25
mix = pad * side + arp * (0.6 + 0.4 * side) + bass * side + kick + hat + clap + lead * side + fx + wet
# fondu final
fade = np.ones(N); f0 = int((T_END + 0.3) * SR); mix[f0:] *= np.linspace(1, 0, N - f0) ** 2
fi = int(0.8 * SR); mix[:fi] *= np.linspace(0, 1, fi)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= np.abs(mix).max() / 0.89
st = np.stack([mix, np.roll(mix, int(0.0007 * SR)) * 0.98], 1)
wavfile.write("music.wav", SR, (st * 32767).astype(np.int16))
print("ok", round(TOTAL, 1))
