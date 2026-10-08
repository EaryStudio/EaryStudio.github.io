import fs from 'node:fs/promises';
import path from 'node:path';
import { filesUnder, sha256 } from './validate.mjs';
import { siteConfig } from './model.mjs';
const config = siteConfig(); const output = '_site';
const files = await filesUnder(output); const available = new Set(files); const failures = [];
let bytes = 0;
for (const file of files) {
  const info = await fs.stat(path.join(output, file)); bytes += info.size;
  if (!file.endsWith('.html')) continue;
  const html = await fs.readFile(path.join(output, file), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const raw = match[1].replace(/&amp;/g, '&');
    if (/^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(raw)) continue;
    let target = decodeURIComponent(raw.split(/[?#]/)[0]); if (!target) continue;
    if (target.startsWith(config.basePath)) target = target.slice(config.basePath.length);
    else if (target.startsWith('/')) target = target.slice(1);
    else target = path.posix.normalize(path.posix.join(path.posix.dirname(file), target));
    if (!target || target.endsWith('/')) target += 'index.html';
    if (!available.has(target)) failures.push(`${file}: ${raw}`);
  }
  if (file.startsWith('iris/wiki/') && /<html lang="(?:undefined|null)"/.test(html)) failures.push(`${file}: missing language`);
}
for (const root of ['index.html', '404.html', '.nojekyll', 'css', 'assets', 'steam-auth', 'config', '.well-known']) {
  const stat = await fs.stat(root); const originals = stat.isDirectory() ? (await filesUnder(root)).map(f => `${root}/${f}`) : [root];
  for (const file of originals) {
    if (!available.has(file) || sha256(await fs.readFile(file)) !== sha256(await fs.readFile(path.join(output, file)))) failures.push(`Existing site changed in build: ${file}`);
  }
}
if (bytes > 900 * 1024 * 1024) failures.push(`Pages artifact exceeds 900 MiB budget: ${bytes}`);
await fs.mkdir('reports', { recursive: true });
await fs.writeFile('reports/wiki-build.json', JSON.stringify({ files: files.length, bytes, failures }, null, 2) + '\n');
if (failures.length) throw new Error(`Site validation failed (${failures.length}):\n${failures.slice(0, 30).join('\n')}`);
console.log(`Verified ${files.length} output files, ${(bytes / 1024 / 1024).toFixed(1)} MiB, links and original site preservation.`);
