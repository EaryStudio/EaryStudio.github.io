import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (process.cwd() !== root) throw new Error('Run the build from the website repository root');
const lockPath = path.join(root, 'data/iris.operation.lock');
await fs.mkdir(path.dirname(lockPath), { recursive: true });
const lock = await fs.open(lockPath, 'wx').catch(error => { throw new Error(`A wiki build/import is already active. If its process ended, remove ${lockPath}. ${error.message}`); });
try {
  await lock.writeFile(JSON.stringify({ pid: process.pid, action: 'build' }));
  const output = path.resolve(root, '_site');
  if (output !== path.join(root, '_site')) throw new Error('Unsafe output directory');
  try { if ((await fs.lstat(output)).isSymbolicLink()) throw new Error('Output directory cannot be a symlink'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.rm(output, { recursive: true, force: true });
  const args = [path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs'), '--quiet'];
  if (process.argv.includes('--serve')) args.push('--serve');
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0))); });
  process.exitCode = code;
} finally { await lock.close(); await fs.unlink(lockPath); }
