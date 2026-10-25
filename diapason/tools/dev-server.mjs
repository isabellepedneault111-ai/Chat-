// Serveur local : fichiers statiques + l'API de l'espace partagé avec un stockage en mémoire.
// node tools/dev-server.mjs  →  http://localhost:8888
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../netlify/functions/espace.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = +process.env.PORT || 8888;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.tsv': 'text/tab-separated-values; charset=utf-8', '.png': 'image/png' };

// Même interface que la partie de @netlify/blobs utilisée par la fonction.
const mem = new Map();
const store = {
  async set(k, v, o = {}) { mem.set(k, { data: v, metadata: o.metadata || {} }); },
  async setJSON(k, v) { mem.set(k, { data: JSON.stringify(v), metadata: {} }); },
  async get(k, o = {}) {
    const e = mem.get(k);
    if (!e) return null;
    if (o.type === 'json') return JSON.parse(e.data);
    if (o.type === 'arrayBuffer') return e.data;
    return typeof e.data === 'string' ? e.data : Buffer.from(e.data).toString();
  },
  async getWithMetadata(k, o) { const e = mem.get(k); return e ? { data: await this.get(k, o), metadata: e.metadata } : null; },
  async list({ prefix }) { return { blobs: [...mem.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  async delete(k) { mem.delete(k); },
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/espace')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const r = await handle(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), store);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  const path = normalize(join(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (!path.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404).end('Introuvable'); }
}).listen(port, () => console.log(`Diapason : http://localhost:${port}`));
