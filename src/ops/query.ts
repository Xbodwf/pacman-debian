import * as fs from 'node:fs';
import { execSync } from 'node:child_process';
import { readDpkgStatus } from '../db/dpkg-compat';
import { searchRepo } from '../repo/repository';
import { loadDatabase } from '../db/database';

function managed(name: string): boolean {
  return loadDatabase().packages.has(name);
}

export function listInstalled(filter?: string): void {
  const dpkg = readDpkgStatus();
  let pkgs = [...dpkg.values()];
  if (filter) {
    const lq = filter.toLowerCase();
    pkgs = pkgs.filter(p => p.package.toLowerCase().includes(lq) || (p.description && p.description.toLowerCase().includes(lq)));
  }
  if (pkgs.length === 0) { console.log('no packages installed'); return; }
  pkgs.sort((a, b) => a.package.localeCompare(b.package));
  for (const p of pkgs) console.log(`${p.package} ${p.version}`);
}

export function listExplicit(): void {
  const db = loadDatabase();
  for (const [name, p] of db.packages) {
    if (p.reason === 'explicit') console.log(`${name} ${p.version}`);
  }
}

export function listDeps(): void {
  const db = loadDatabase();
  for (const [name, p] of db.packages) {
    if (p.reason === 'dependency') console.log(`${name} ${p.version}`);
  }
}

export function listOrphans(): void {
  const db = loadDatabase();
  const needed = new Set<string>();
  for (const [, p] of db.packages) {
    const deps = (p.depends || '').split(',').map(s => s.trim().split(/\s/)[0]).filter(Boolean);
    for (const d of deps) needed.add(d);
  }
  for (const [name, p] of db.packages) {
    if (p.reason === 'dependency' && !needed.has(name)) console.log(`${name} ${p.version}`);
  }
}

export function checkIntegrity(name?: string): void {
  const db = loadDatabase();
  if (name) {
    const p = db.packages.get(name);
    if (!p) { console.error(`error: '${name}' is not installed`); return; }
    let missing = 0;
    for (const f of p.files) { if (!fs.existsSync(f)) missing++; }
    console.log(missing === 0 ? `${name}: ${p.files.length} files, 0 missing` : `${name}: WARNING: ${missing} files missing`);
    return;
  }
  for (const [n, p] of db.packages) {
    let missing = 0;
    for (const f of p.files) { if (!fs.existsSync(f)) missing++; }
    if (missing > 0) console.log(`${n}: WARNING: ${missing} files missing`);
  }
}

export function showInfo(name: string, fromRepo: boolean): void {
  if (fromRepo) {
    const r = searchRepo(name);
    const p = r.find(x => x.package === name);
    if (!p) { console.error(`error: '${name}' not found`); return; }
    console.log(`Repository     : ${p.repo}`);
    console.log(`Name           : ${p.package}`);
    console.log(`Version        : ${p.version}`);
    console.log(`Description    : ${p.description || ''}`);
    if (p.depends) console.log(`Depends On     : ${p.depends}`);
    if (p.size) console.log(`Download Size  : ${(p.size / 1024).toFixed(2)} KiB`);
    return;
  }

  const dpkg = readDpkgStatus();
  const p = dpkg.get(name);
  if (!p) { console.error(`error: '${name}' was not found`); return; }

  const m = managed(name);
  const our = m ? loadDatabase().packages.get(name) : undefined;

  console.log(`Name           : ${p.package}`);
  console.log(`Version        : ${p.version}`);
  console.log(`Description    : ${p.description || ''}`);
  console.log(`Architecture   : ${p.architecture}`);
  console.log(`URL            : ${p.homepage || ''}`);
  if (m && our) console.log(`Install Reason : ${our.reason === 'explicit' ? 'Explicitly installed' : 'Installed as a dependency'} (pacman-debian)`);
  if (!m) console.log(`Install Reason : Installed via dpkg`);
  if (p.depends) console.log(`Depends On     : ${p.depends}`);
  if (p.installedSize) console.log(`Installed Size : ${(p.installedSize / 1024).toFixed(2)} KiB`);
  if (p.maintainer) console.log(`Packager       : ${p.maintainer}`);

  if (our) {
    console.log(`Files          : ${our.files.length}`);
    console.log(`Install Date   : ${new Date(our.installTime).toISOString().slice(0, 10)}`);
  }
}

export function queryFile(fp: string): void {
  const db = loadDatabase();
  const owner = db.fileIndex.get(fp);
  if (owner) { console.log(`${fp} is owned by ${owner}`); return; }
  try {
    const out = execSync(`dpkg -S ${fp} 2>/dev/null`, { encoding: 'utf8' });
    console.log(out.trim());
  } catch {
    console.error(`error: no package owns ${fp}`);
  }
}

export function listFiles(name: string): void {
  const db = loadDatabase();
  const p = db.packages.get(name);
  if (p) { for (const f of p.files) console.log(`${name} ${f}`); return; }
  const lp = `/var/lib/dpkg/info/${name}.list`;
  if (fs.existsSync(lp)) {
    for (const f of fs.readFileSync(lp, 'utf8').split('\n').filter(Boolean)) console.log(`${name} ${f}`);
    return;
  }
  console.error(`error: '${name}' was not found`);
}
