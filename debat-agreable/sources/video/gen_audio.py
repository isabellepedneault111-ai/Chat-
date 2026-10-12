import sys, json, asyncio, certifi, subprocess
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
sys.path.insert(0, '.')
from script import SCENES
VOICE, RATE = "fr-CA-SylvieNeural", "-3%"
async def one(sid, text):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    audio = bytearray(); words = []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    open(f"a_{sid}.mp3", "wb").write(audio)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"a_{sid}.mp3"]))
    return {"id": sid, "dur": dur, "words": words, "text": text}
async def main():
    out = [await one(s, t) for s, t in SCENES]
    json.dump(out, open("timing.json", "w"), ensure_ascii=False)
    for o in out: print(o["id"], round(o["dur"], 1), len(o["words"]))
asyncio.run(main())
