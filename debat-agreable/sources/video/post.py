import json, re, subprocess
T = json.load(open('timing.json')); LEAD, TAIL = 0.6, 1.0
# audio : silence + voix par scène
inputs, filt, t = [], [], 0.0
for i, s in enumerate(T):
    inputs += ['-i', f"a_{s['id']}.mp3"]
    filt.append(f"[{i}:a]aresample=48000,apad=pad_dur={TAIL},adelay={int(LEAD*1000)}:all=1,atrim=0:{LEAD+s['dur']+TAIL}[a{i}]")
filt.append(''.join(f'[a{i}]' for i in range(len(T))) + f"concat=n={len(T)}:v=0:a=1[out]")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt), '-map', '[out]', '-c:a', 'aac', '-b:a', '160k', 'voice.m4a'], check=True)
# sous-titres : découpage en segments ≤ 70 caractères, temps au prorata des caractères
def fmt(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s-int(s))*1000)):03d}"
srt, n, start = [], 1, 0.0
for s in T:
    sents = re.split(r'(?<=[.?!…:;])\s+', s['text'])
    chunks = []
    for se in sents:
        words, cur = se.split(), ''
        for w in words:
            if len(cur) + len(w) + 1 > 70 and cur: chunks.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        if cur: chunks.append(cur)
    tot = sum(len(c) for c in chunks); t0 = start + LEAD
    for c in chunks:
        d = s['dur'] * len(c) / tot
        srt.append(f"{n}\n{fmt(t0)} --> {fmt(t0 + d - 0.05)}\n{c}\n"); n += 1; t0 += d
    start += LEAD + s['dur'] + TAIL
open('video.srt', 'w').write('\n'.join(srt))
print('audio+srt ok', round(start, 2))
