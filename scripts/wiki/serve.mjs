import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('_site');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'); let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const actual = await fs.realpath(file); if (!actual.startsWith(root + path.sep)) throw new Error('Invalid resolved path');
    const font = path.extname(file) === '.woff2';
    const headers = { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': font ? 'public, max-age=3600' : 'no-store' };
    if (font) {
      const stat = await fs.stat(actual);
      headers.ETag = `"${stat.size}-${Math.trunc(stat.mtimeMs)}"`;
      if (req.headers['if-none-match'] === headers.ETag) { res.writeHead(304, headers); res.end(); return; }
    }
    const body = await fs.readFile(actual);
    res.writeHead(200, headers); res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
}).listen(8088, '127.0.0.1', () => console.log('Wiki preview: http://127.0.0.1:8088/iris/wiki/'));
