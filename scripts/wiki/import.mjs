import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackage, sha256 } from './validate.mjs';

export function changes(before, after) {
  const previous = new Map((before?.entities ?? []).map(e => [e.wikiId, e]));
  const report = { added: [], removed: [], values: [], translations: [], images: [] };
  for (const e of after.entities) {
    const old = previous.get(e.wikiId); previous.delete(e.wikiId);
    if (!old) { report.added.push(e.wikiId); continue; }
    if (e.slug !== old.slug || e.kind !== old.kind) throw new Error(`Published URL changed: ${e.wikiId}. Add an explicit migration before importing.`);
    for (const [category, fields] of Object.entries({ values: ['data', 'relations'], translations: ['names', 'descriptions'], images: ['image'] }))
      if (fields.some(f => JSON.stringify(e[f]) !== JSON.stringify(old[f]))) report[category].push(e.wikiId);
  }
  report.removed = [...previous.keys()].sort();
  return report;
}
async function importUnlocked(source, destination, reportFile) {
  source = path.resolve(source); destination = path.resolve(destination);
  if (source === destination || source.startsWith(destination + path.sep) || destination.startsWith(source + path.sep)) throw new Error('Source and destination must be separate');
  const after = await validatePackage(source);
  let before;
  try { await fs.access(destination); before = await validatePackage(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const report = changes(before, after);
  // Removal needs a committed tombstone; silently deleting published URLs is forbidden.
  const migrations = JSON.parse(await fs.readFile(new URL('../../data/wiki-migrations.json', import.meta.url), 'utf8'));
  const undocumented = report.removed.filter(id => !migrations.some(m => `${m.kind}:${m.slug}` === id && m.removedIn === after.manifest.release));
  if (undocumented.length) throw new Error(`Removed entities need migration/tombstone review: ${undocumented.join(', ')}`);
  const parent = path.dirname(destination); await fs.mkdir(parent, { recursive: true });
  const stage = await fs.mkdtemp(path.join(parent, '.wiki-import-'));
  const backup = `${destination}.previous`;
  try {
    await fs.cp(source, stage, { recursive: true, dereference: false });
    await validatePackage(stage);
    try { await fs.access(backup); throw new Error(`Existing recovery backup: ${backup}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (before) await fs.rename(destination, backup);
    try { await fs.rename(stage, destination); } catch (error) { if (before) await fs.rename(backup, destination); throw error; }
    if (before) await fs.rm(backup, { recursive: true });
    if (reportFile) {
      await fs.mkdir(path.dirname(reportFile), { recursive: true });
      await fs.writeFile(reportFile, JSON.stringify({ release: after.manifest.release, sourceRevision: after.manifest.sourceRevision, packageHash: sha256(await fs.readFile(path.join(destination, 'manifest.json'))), ...report }, null, 2) + '\n');
    }
    return report;
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
}
export async function importPackage(source, destination = 'data/iris') {
  destination = path.resolve(destination); await fs.mkdir(path.dirname(destination), { recursive: true });
  const lockPath = `${destination}.operation.lock`;
  const lock = await fs.open(lockPath, 'wx').catch(error => { throw new Error(`Another wiki build/import is active: ${lockPath}. ${error.message}`); });
  try { await lock.writeFile(JSON.stringify({ pid: process.pid, action: 'import' })); return await importUnlocked(source, destination, destination === path.resolve('data/iris') ? 'reports/wiki-import.json' : null); }
  finally { await lock.close(); await fs.unlink(lockPath); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: npm run wiki:import -- <export-directory>');
  const report = await importPackage(process.argv[2]);
  console.log(Object.fromEntries(Object.entries(report).map(([kind, ids]) => [kind, ids.length])));
}
