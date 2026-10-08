import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

export const locales = ['en', 'ko', 'ja', 'es', 'zh-Hans', 'zh-Hant'];
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const contract = JSON.parse(await fs.readFile(new URL('./entity.schema.json', import.meta.url), 'utf8'));
const validateEntity = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true }).compile(contract);
export async function filesUnder(root, relative = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are forbidden: ${name}`);
    if (entry.isDirectory()) files.push(...await filesUnder(root, name));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unsupported file: ${name}`);
  }
  return files.sort();
}
export function safePath(name) {
  return typeof name === 'string' && /^(entities\/[a-z-]+\.json|locales\/(en|ko|ja|es|zh-Hans|zh-Hant)\.json|assets\/[a-f0-9]{24}\.png|schema\/entity\.schema\.json)$/.test(name);
}
export function visit(value, fn, field = '') {
  fn(value, field);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error(`Forbidden object key: ${field}.${key}`);
    visit(child, fn, `${field}.${key}`);
  }
}
export function validateGraph(entities, declaredFiles = null) {
  const ids = new Map(); const urls = new Set();
  for (const entity of entities) {
    if (!validateEntity(entity)) throw new Error(`${entity.wikiId}: ${JSON.stringify(validateEntity.errors)}`);
    if (entity.wikiId !== `${entity.kind}:${entity.slug}`) throw new Error(`ID and slug disagree: ${entity.wikiId}`);
    if (ids.has(entity.wikiId) || urls.has(`${entity.kind}/${entity.slug}`)) throw new Error(`Duplicate ID or URL: ${entity.wikiId}`);
    ids.set(entity.wikiId, entity); urls.add(`${entity.kind}/${entity.slug}`);
    visit(entity.data, (value, field) => {
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${entity.wikiId}${field}: non-finite number`);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return;
      if (value.$type === 'RewardProbabilityDataSO') {
        const weights = value.entries.filter(e => e.itemId && e.itemCountRange?.[1] > 0).map(e => e.itemProbability);
        if (value.chooseOneItem && (!weights.length || weights.reduce((a, b) => a + b, 0) <= 0)) throw new Error(`${entity.wikiId}${field}: empty weighted pool`);
      }
      if (value.$type === 'ChestRewardProbabilityDataSO' && value.entries.reduce((s, e) => s + e.probability, 0) > 1.000001) throw new Error(`${entity.wikiId}${field}: chest cumulative probability exceeds one`);
      for (const [key, n] of Object.entries(value)) {
        if (/^(probability|itemProbability|goldProbability|chance01|idleUnlockChance01|combatUnlockChance01|objectiveUnlockChance01)$/.test(key) && (typeof n !== 'number' || n < 0 || n > 1)) throw new Error(`${entity.wikiId}${field}.${key}: invalid probability`);
        // Both 0.56 reward resolvers explicitly use Min/Max on the stored endpoints.
        // Preserve those endpoints in the snapshot; reversed order is valid source data.
        if (/^(quantityRange|itemCountRange|goldRange)$/.test(key) && (!Array.isArray(n) || n.length !== 2 || n.some(x => !Number.isInteger(x) || x < 0))) throw new Error(`${entity.wikiId}${field}.${key}: invalid quantity range`);
      }
    });
    visit(entity, (value, field) => {
      if (value?.path?.startsWith('assets/')) {
        if (!safePath(value.path) || (declaredFiles && !declaredFiles.has(value.path))) throw new Error(`${entity.wikiId}${field}: missing/unsafe image`);
      }
      if (typeof value === 'string' && /(?:[A-Z]:[\\/]|Assets[\\/]|ProjectSettings[\\/])/.test(value)) throw new Error(`${entity.wikiId}${field}: internal path in public data`);
    });
  }
  for (const entity of entities) {
    visit(entity.data, (value, field) => { if (value?.ref && !ids.has(value.ref)) throw new Error(`${entity.wikiId}${field}: missing reference ${value.ref}`); });
    for (const relation of entity.relations) if (!ids.has(relation.target)) throw new Error(`${entity.wikiId}: missing relation ${relation.target}`);
    const seen = new Set([entity.wikiId]); let next = entity.data.next?.ref;
    while (next) { if (seen.has(next)) throw new Error(`Objective progression cycle: ${next}`); seen.add(next); next = ids.get(next)?.data.next?.ref; }
  }
  return ids;
}
export async function validatePackage(root) {
  root = path.resolve(root);
  const stat = await fs.lstat(root); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Package must be a real directory');
  const read = async name => {
    const stat = await fs.lstat(path.join(root, name));
    if (stat.size > 64 * 1024 * 1024) throw new Error(`Oversized package file: ${name}`);
    return fs.readFile(path.join(root, name));
  };
  const actual = await filesUnder(root);
  const manifest = JSON.parse(await read('manifest.json'));
  if (manifest.schemaVersion !== 1 || !/^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/.test(manifest.release) || !/^[a-f0-9]{40}$/.test(manifest.sourceRevision)) throw new Error('Unsupported manifest or invalid release provenance');
  if (manifest.release === '0.56' && manifest.sourceRevision !== 'fd02bba2d2e4e677e39a0334461c3a9d61d5f0ee') throw new Error('0.56 source revision mismatch');
  if (JSON.stringify(manifest.locales) !== JSON.stringify(locales)) throw new Error('All six release locales are required');
  if (!manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) throw new Error('Missing file inventory');
  const inventory = Object.keys(manifest.files).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...inventory, 'manifest.json'].sort())) throw new Error('Package inventory differs from declared files');
  for (const name of inventory) {
    if (!safePath(name)) throw new Error(`Unsafe or unexpected package path: ${name}`);
    if (!/^[a-f0-9]{64}$/.test(manifest.files[name]) || sha256(await read(name)) !== manifest.files[name]) throw new Error(`Hash mismatch: ${name}`);
  }
  if (!inventory.includes('schema/entity.schema.json')) throw new Error('Missing packaged schema');
  const suppliedSchema = JSON.parse(await read('schema/entity.schema.json'));
  if (JSON.stringify(suppliedSchema) !== JSON.stringify(contract)) throw new Error('Packaged schema differs from the trusted importer contract');
  const translations = {};
  for (const locale of locales) {
    if (!inventory.includes(`locales/${locale}.json`)) throw new Error(`Missing locale: ${locale}`);
    translations[locale] = JSON.parse(await read(`locales/${locale}.json`));
  }
  const entities = [];
  for (const name of inventory.filter(n => n.startsWith('entities/'))) {
    const rows = JSON.parse(await read(name));
    if (!Array.isArray(rows) || rows.some(e => name !== `entities/${e.kind}.json`)) throw new Error(`Wrong entity partition: ${name}`);
    entities.push(...rows);
  }
  if (!entities.length || entities.length !== manifest.entityCount) throw new Error('Empty or incomplete entity snapshot');
  const ids = validateGraph(entities, new Set(inventory));
  return { manifest, entities, ids, translations, root };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validatePackage(process.argv[2] ?? 'data/iris');
  console.log(`Validated ${result.entities.length} entities, six locales, release ${result.manifest.release}.`);
}
