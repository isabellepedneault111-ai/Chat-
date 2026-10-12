# Trance lourde 128 BPM, 32 mesures (60 s), calée sur film.html
# intro 0-4 | montée 4-8 | DROP 1 8-16 | pause planante 16-22 | DROP 2 22-30 | fin 30-32
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
BPM = 128; BEAT = 60 / BPM; BAR = 4 * BEAT; S16 = BEAT / 4
TOTAL = 32 * BAR + 2.0
N = int(TOTAL * SR)
rng = np.random.default_rng(3)
b = lambda x: x * BAR

def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], "band", fs=SR, output="sos"), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def saw_ph(ph): return 2 * (ph % 1) - 1
def add(buf, x, t0):
    i = int(round(t0 * SR))
    if i >= buf.shape[-1] or i < 0: return
    n = min(x.shape[-1], buf.shape[-1] - i); buf[..., i:i + n] += x[..., :n]

L = np.zeros((2, N))  # bus stéréo par couche
kick, bass, saws, lead, perc, fx, pad, arp = (np.zeros((2, N)) for _ in range(8))

# ---- progression : Am F C G (2 mesures chacune) ----
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
def chord_at(bar): return PROG[(int(bar) // 2) % 4]

def supersaw(freq, n, voices=7, spread=0.25):
    t = np.arange(n) / SR; out = np.zeros((2, n))
    for k in range(voices):
        det = (k - (voices - 1) / 2) / ((voices - 1) / 2) * spread  # demi-tons
        f = freq * 2 ** (det / 12); ph = rng.random()
        s = saw_ph(f * t + ph); pan = 0.5 + 0.45 * (k - (voices - 1) / 2) / ((voices - 1) / 2)
        out[0] += s * (1 - pan); out[1] += s * pan
    return out / voices

# ---- KICK lourd ----
def kick_hit(g=1.0):
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 48 + 150 * np.exp(-t * 32) + 40 * np.exp(-t * 300)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 350) * .5
    k = np.tanh((body + click) * 2.6) * g
    return np.stack([k, k])
KH = kick_hit()

def full(bar): return 8 <= bar < 16 or 22 <= bar < 30.5
for i in range(int(32 * 4)):
    t = i * BEAT; bar = t / BAR
    if full(bar) or (4 <= bar < 8 and (bar < 7 or i % 1 == 0)):
        g = 1.0 if full(bar) else 0.85
        add(kick, KH * g, t)

# ---- BASSE roulante (16es 2,3,4 de chaque temps) ----
for i in range(int(32 * 16)):
    t = i * S16; bar = t / BAR
    if i % 4 == 0: continue
    if not (full(bar) or 4 <= bar < 8): continue
    root = chord_at(bar)[0] - 24
    n = int(S16 * SR * .95); tt = np.arange(n) / SR
    f = hz(root)
    x = saw_ph(f * tt) * .6 + saw_ph(f * 1.006 * tt + .3) * .6 + np.sin(2 * np.pi * f / 2 * tt) * .8
    cut = 350 + 1500 * np.exp(-tt * 30)
    if 4 <= bar < 8: cut = cut * (0.35 + 0.65 * (bar - 4) / 4)
    y = np.tanh(lp(x, float(np.mean(cut))) * 2.2) * np.minimum(1, (n - np.arange(n)) / 200) * .42
    add(bass, np.stack([y, y]), t)

# ---- SUPERSAW : nappes (intro/pause) et stabs gatés (drops) ----
GATE = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1]
for bar in range(32):
    ch = chord_at(bar); t0 = b(bar)
    notes = ch + [ch[0] + 12, ch[0] - 12]
    n = int(BAR * SR) + 2400
    s = sum(supersaw(hz(m), n) for m in notes) / 2.2
    if full(bar) and bar < 30:
        g = np.zeros(n); tt = np.arange(n) / SR
        for k, on in enumerate(GATE):
            if on:
                i0 = int(k * S16 * SR); i1 = int((k + .8) * S16 * SR)
                env = np.exp(-np.arange(i1 - i0) / SR * 9); g[i0:i1] = env
        cut = 5200 if bar >= 22 else 3600
        add(saws, np.stack([lp(s[0], cut), lp(s[1], cut)]) * g * .55, t0)
    else:
        prog = 1.0
        if bar < 4: prog = .15 + .2 * bar / 4
        elif bar < 8: prog = .35 + .4 * (bar - 4) / 4
        elif 16 <= bar < 22: prog = .55 + .45 * (bar - 16) / 6
        cut = 400 + 3800 * prog
        env = np.minimum(1, np.arange(n) / (.25 * SR)) * np.minimum(1, (n - np.arange(n)) / (.1 * SR))
        add(pad, np.stack([lp(s[0], cut), lp(s[1], cut)]) * env * (.32 if bar < 30 else .3), t0)

# ---- LEAD : mélodie planante (pause) puis hymne (drop 2) ----
MEL = [76, 74, 72, 74, 76, 79, 76, 74,  72, 71, 72, 74, 72, 69, 67, 69]  # croches
def lead_line(start_bar, end_bar, octave=0, g=.22, cut=4500):
    for i in range(int((end_bar - start_bar) * 8)):
        t = b(start_bar) + i * BEAT / 2
        m = MEL[i % 16] + octave
        n = int(BEAT / 2 * SR * .92); tt = np.arange(n) / SR
        vib = 1 + .003 * np.sin(2 * np.pi * 5.5 * tt)
        s = supersaw(hz(m) * vib.mean(), n, 5, .18)
        env = np.minimum(1, tt / .01) * np.exp(-tt * 2.2)
        add(lead, np.stack([lp(s[0], cut), lp(s[1], cut)]) * env * g, t)
lead_line(18, 22, 0, .16, 3000)
lead_line(22, 30, 12, .17, 5200)
lead_line(22, 30, 0, .12, 4200)

# ---- ARPÈGE pluck (intro, pause) ----
for i in range(int(32 * 16)):
    t = i * S16; bar = t / BAR
    if not (2 <= bar < 8 or 16 <= bar < 22): continue
    ch = chord_at(bar); m = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 12][i % 4]
    n = int(.25 * SR); tt = np.arange(n) / SR
    x = (np.sign(np.sin(2 * np.pi * hz(m) * tt)) * .5 + saw_ph(hz(m) * 1.004 * tt) * .5) * np.exp(-tt * 16)
    y = lp(x, 2800) * .1; pan = .5 + .35 * np.sin(i * .7)
    add(arp, np.stack([y * (1 - pan), y * pan]) * 1.6, t)

# ---- PERCUSSIONS ----
def noise(n): return rng.standard_normal(n)
for i in range(int(32 * 16)):
    t = i * S16; bar = t / BAR
    if not (full(bar) or 4 <= bar < 8): continue
    beat_pos = i % 4
    if beat_pos == 2:  # charleston ouverte
        n = int(.12 * SR); y = hp(noise(n), 8000) * np.exp(-np.arange(n) / SR * 28) * .22; add(perc, np.stack([y * .8, y]), t)
    elif full(bar):  # 16es fermées
        n = int(.03 * SR); y = hp(noise(n), 9000) * np.exp(-np.arange(n) / SR * 120) * .07; add(perc, np.stack([y, y * .8]), t)
    if full(bar) and i % 16 in (4, 12):  # clap
        n = int(.25 * SR); tt = np.arange(n) / SR
        y = bp(noise(n), 900, 3200) * (np.exp(-tt * 18) + .6 * np.exp(-np.maximum(tt - .012, 0) * 40) * (tt > .012)) * .5
        add(perc, np.stack([y, y]), t)

# ---- ROULEMENTS de caisse claire + montées ----
def snare(g):
    n = int(.14 * SR); tt = np.arange(n) / SR
    y = (bp(noise(n), 1500, 7000) * .7 + np.sin(2 * np.pi * 190 * tt) * .5) * np.exp(-tt * 26) * g
    return np.stack([y, y])
def roll(b0, b1):
    t = b(b0)
    while t < b(b1):
        k = (t - b(b0)) / (b(b1) - b(b0))
        step = S16 * 2 if k < .4 else (S16 if k < .8 else S16 / 2)
        add(perc, snare(.12 + .4 * k), t); t += step
roll(6, 8); roll(20, 22)
def riser(t_end, length, g=1):
    n = int(length * SR); tt = np.arange(n) / SR; k = tt / length
    x = noise(n); out = np.zeros(n); seg = int(.04 * SR)
    for i in range(0, n, seg):
        fc = 300 + 9000 * k[i] ** 2.2; out[i:i + seg] = bp(x[i:i + seg], fc * .7, fc * 1.4)
    sweep = saw_ph(np.cumsum(120 + 1400 * k ** 2) / SR) * .12
    y = (out * .5 + lp(sweep, 4000)) * k ** 2 * g
    add(fx, np.stack([y, y]), t_end - length)
riser(b(8), b(2)); riser(b(22), b(3), 1.2)
def impact(t, g=1):
    n = int(2.5 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(28 + 90 * np.exp(-tt * 8)) / SR) * np.exp(-tt * 1.6)
    crash = hp(noise(n), 4000) * np.exp(-tt * 2.4) * .35
    y = np.tanh((boom * .9 + crash) * 1.5) * g
    add(fx, np.stack([y, y * .97]), t)
impact(b(8)); impact(b(22), 1.1); impact(b(31), 1.1)
def reverse_swell(t_end, length=1.2):
    n = int(length * SR); tt = np.arange(n) / SR
    y = hp(noise(n), 3000) * (tt / length) ** 3 * .3
    add(fx, np.stack([y, y]), t_end - length)
reverse_swell(b(8)); reverse_swell(b(16)); reverse_swell(b(22))
# drone d'intro
n = int(b(8) * SR); tt = np.arange(n) / SR
dr = (np.sin(2 * np.pi * 55 * tt) * .25 + lp(noise(n), 300) * .05) * np.minimum(1, tt / 3)
add(pad, np.stack([dr, dr]), 0)

# ---- SIDECHAIN ----
side = np.ones(N)
for i in range(int(32 * 4)):
    t = i * BEAT
    if full(t / BAR) or 4 <= t / BAR < 8:
        i0 = int(t * SR); n = min(int(BEAT * SR), N - i0); k = np.arange(n) / SR
        side[i0:i0 + n] = np.minimum(side[i0:i0 + n], 1 - .75 * np.exp(-k * 11))

# ---- RÉVERB stéréo ----
def ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-t * 6.9 / sec); x = lp(x, 6000); return x / np.sqrt((x ** 2).sum())
IRL, IRR = ir(3.2, 1), ir(3.2, 2)
send = pad * .5 + saws * .35 + lead * .5 + arp * .8 + perc * .15 + fx * .2
wet = np.stack([fftconvolve(send[0], IRL)[:N], fftconvolve(send[1], IRR)[:N]]) * .55
# delay pointé sur l'arpège et le lead
dl = int(BEAT * .75 * SR); echo = np.zeros((2, N)); src = arp + lead * .6
echo[0, dl:] += src[1, :-dl] * .35; echo[1, 2 * dl:] += src[0, :-2 * dl] * .25

bg = np.ones(N); i4, i8 = int(b(4) * SR), int(b(8) * SR); bg[i4:i8] = np.linspace(.35, .7, i8 - i4)
pg_ = np.ones(N); i16, i22 = int(b(16) * SR), int(b(22) * SR); pg_[i16:i22] = 2.2
pad *= pg_; arp *= pg_
kick *= bg; bass *= bg; perc *= np.where(np.arange(N) < i8, bg, 1)
mix = kick * 1.0 + bass * side + (saws + pad + lead + arp) * side + perc + fx + (wet + echo) * (0.4 + 0.6 * side)
# fondu
f0 = int((32 * BAR - .2) * SR); mix[:, f0:] *= np.linspace(1, 0, N - f0) ** 1.5
mix[:, :int(.5 * SR)] *= np.linspace(0, 1, int(.5 * SR))
mix = hp(mix, 25)
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
mix *= .89
wavfile.write("music_raw.wav", SR, (mix.T * 32767).astype(np.int16))
print("ok", TOTAL)
