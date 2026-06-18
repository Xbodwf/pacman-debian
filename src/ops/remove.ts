import * as fs from 'node:fs';
import { initDb, loadDatabase, saveDatabase, removePkg, getPackage, runScript } from '../db/database';
import { removeDpkgEntry } from '../db/dpkg-compat';
import { confirm } from '../ui/prompt';
import type { RemoveOptions } from '../core/options';

function removeSingle(name: string, opts: RemoveOptions = {}): boolean {
  initDb();
  const db = loadDatabase();
  const pkg = getPackage(db, name);
  if (!pkg) { console.error(`error: '${name}' is not installed`); return false; }

  if (opts.recursive && !opts.nodeps) {
    const deps = (pkg.depends || '').split(',').map(s => s.trim().split(/\s/)[0]).filter(Boolean);
    for (const d of deps) {
      const dp = getPackage(db, d);
      if (dp && (dp.reason === 'dependency' || opts.cascade)) {
        removeSingle(d, { ...opts, recursive: false });
      }
    }
  }

  if (opts.cascade) {
    const db = loadDatabase();
    for (const [pname, ppkg] of db.packages) {
      if (ppkg.depends && ppkg.depends.includes(name)) {
        removeSingle(pname, { ...opts, recursive: false, cascade: true });
      }
    }
  }

  if (!opts.noscriptlet) {
    runScript(name, 'prerm', ['remove']);
  }

  for (const f of pkg.files) {
    try {
      if (fs.existsSync(f)) {
        const s = fs.lstatSync(f);
        if (s.isDirectory()) { try { fs.rmdirSync(f); } catch {} }
        else fs.unlinkSync(f);
      }
    } catch {}
  }

  if (!opts.noscriptlet) {
    runScript(name, 'postrm', ['remove']);
  }

  try { removeDpkgEntry(name); } catch {}
  removePkg(db, name);
  saveDatabase(db);
  return true;
}

export async function removeByName(name: string, opts: RemoveOptions = {}): Promise<boolean> {
  initDb();
  const db = loadDatabase();
  const pkg = getPackage(db, name);
  if (!pkg) { console.error(`error: '${name}' is not installed`); return false; }

  if (opts.print) { console.log(`  would remove: ${name}`); return true; }

  console.log('checking dependencies...\n');
  console.log(`Packages (1): ${name}-${pkg.version}`);
  console.log('');

  if (!await confirm(':: Proceed with removal?', false)) return false;

  const cols = process.stdout.columns || 80;
  const bar = '#'.repeat(Math.max(Math.floor((cols - 45) * 0.35), 8));
  removeSingle(name, opts);
  process.stdout.write(`(1/1) removing ${name.padEnd(25)}${bar} 100%\n`);
  console.log(`:: ${name} removed`);
  return true;
}
