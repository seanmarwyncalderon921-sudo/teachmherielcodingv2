import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import aiHandler from './api/ai.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };

async function loadLocalEnv() {
  for (const filename of ['.env', path.join('api', '.env')]) {
    let source = '';
    try { source = await readFile(path.join(root, filename), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const meaningfulLines = source.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    if (meaningfulLines.length === 1 && /^gsk_[A-Za-z0-9_-]+$/.test(meaningfulLines[0]) && process.env.GROQ_API_KEY === undefined) {
      process.env.GROQ_API_KEY = meaningfulLines[0];
    }
    for (const entry of source.split(/\r?\n/)) {
      const line = entry.trim().replace(/^export\s+/, '');
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator < 1) continue;
      const name = line.slice(0, separator).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || process.env[name] !== undefined) continue;
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[name] = value;
    }
  }
}

await loadLocalEnv();
const server = http.createServer(async (req, res) => {
  if (req.url?.split('?')[0] === '/api/ai') {
    const chunks = []; let length = 0;
    for await (const chunk of req) { length += chunk.length; if (length > 32768) { res.writeHead(413).end('Request too large'); return; } chunks.push(chunk); }
    try { req.body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; }
    catch { res.writeHead(400, { 'Content-Type':'application/json' }).end(JSON.stringify({ error:'Invalid JSON request.' })); return; }
    const response = { status(code) { this.code = code; return this; }, json(data) { res.writeHead(this.code || 200, { 'Content-Type':'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); } };
    await aiHandler(req, response); return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end('Method not allowed'); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end('Bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const segments = relative.split(/[\\/]+/);
  if (segments.some(segment => segment.startsWith('.') || segment.toLowerCase() === 'node_modules')) { res.writeHead(404).end('Not found'); return; }
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root + path.sep) && filename !== path.join(root, 'index.html')) { res.writeHead(403).end('Forbidden'); return; }
  try { const contents = await readFile(filename); res.writeHead(200, { 'Content-Type':mime[path.extname(filename)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' }); res.end(req.method === 'HEAD' ? undefined : contents); }
  catch { res.writeHead(404).end('Not found'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, () => console.log(`MherielCode running at http://localhost:${port} · Sean AI ${process.env.GROQ_API_KEY ? 'ready' : 'not configured'}`));
