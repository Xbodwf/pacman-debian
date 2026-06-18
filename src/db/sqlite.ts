import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseControlFile } from '../core/control';
import type { InstalledPackage } from '../core/types';

const DB_PATH = '/var/lib/pacman-debian/packages.db';
const DPKG_STATUS = '/var/lib/dpkg/status';

let _db: DatabaseSync | null = null;

function open(): DatabaseSync {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode=WAL');
  _db.exec('PRAGMA synchronous=NORMAL');
  initSchema();
  return _db;
}

function initSchema(): void {
  _db!.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      name TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      architecture TEXT DEFAULT '',
      description TEXT DEFAULT '',
      depends TEXT DEFAULT '',
      pre_depends TEXT DEFAULT '',
      conflicts TEXT DEFAULT '',
      provides TEXT DEFAULT '',
      maintainer TEXT DEFAULT '',
      homepage TEXT DEFAULT '',
      section TEXT DEFAULT '',
      priority TEXT DEFAULT '',
      installed_size INTEGER DEFAULT 0,
      install_time INTEGER DEFAULT 0,
      reason TEXT DEFAULT 'explicit',
      repo_type TEXT DEFAULT 'debian'
    );
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      package TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_files_package ON files(package);
    CREATE TABLE IF NOT EXISTS dpkg_cache (
      name TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      architecture TEXT DEFAULT '',
      description TEXT DEFAULT '',
      maintainer TEXT DEFAULT '',
      depends TEXT DEFAULT '',
      installed_size INTEGER DEFAULT 0,
      section TEXT DEFAULT '',
      priority TEXT DEFAULT '',
      homepage TEXT DEFAULT '',
      mtime INTEGER DEFAULT 0
    );
  `);
}

/* ---- packages (our own DB) ---- */
export function loadAllPackages(): InstalledPackage[] {
  const rows = open().prepare('SELECT * FROM packages').all() as any[];
  return rows.map(installedFromRow);
}

export function getPackage(name: string): InstalledPackage | undefined {
  const row = open().prepare('SELECT * FROM packages WHERE name = ?').get(name) as any;
  return row ? installedFromRow(row) : undefined;
}

export function searchPackages(query: string): InstalledPackage[] {
  const q = `%${query.toLowerCase()}%`;
  const rows = open().prepare(
    'SELECT * FROM packages WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?'
  ).all(q, q) as any[];
  return rows.map(installedFromRow);
}

export function savePackage(pkg: InstalledPackage): void {
  const stmt = open().prepare(`
    INSERT OR REPLACE INTO packages
    (name,version,architecture,description,depends,pre_depends,conflicts,provides,
     maintainer,homepage,section,priority,installed_size,install_time,reason,repo_type)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  stmt.run(
    pkg.name, pkg.version, pkg.architecture, pkg.description || '',
    pkg.depends || '', pkg['pre-depends'] || '', pkg.conflicts || '', pkg.provides || '',
    pkg.maintainer || '', pkg.homepage || '',
    pkg.controlSection || 'misc', pkg.controlPriority || 'optional',
    pkg.installedSize || 0, pkg.installTime, pkg.reason, pkg.repoType || 'debian'
  );
}

export function removePackage(name: string): void {
  open().prepare('DELETE FROM packages WHERE name = ?').run(name);
  open().prepare('DELETE FROM files WHERE package = ?').run(name);
}

export function countPackages(): number {
  const row = open().prepare('SELECT COUNT(*) as c FROM packages').get() as any;
  return row?.c ?? 0;
}

/* ---- files ---- */
export function getFileOwner(filePath: string): string | undefined {
  const row = open().prepare('SELECT package FROM files WHERE path = ?').get(filePath) as any;
  return row?.package;
}

export function getPackageFiles(name: string): string[] {
  const rows = open().prepare('SELECT path FROM files WHERE package = ? ORDER BY path').all(name) as any[];
  return rows.map(r => r.path);
}

export function saveFileIndex(pkg: InstalledPackage): void {
  const stmt = open().prepare('INSERT OR REPLACE INTO files (path, package) VALUES (?, ?)');
  for (const f of pkg.files) stmt.run(f, pkg.name);
}

export function removeFileIndex(pkg: InstalledPackage): void {
  open().prepare('DELETE FROM files WHERE package = ?').run(pkg.name);
}

/* ---- dpkg cache ---- */
let _dpkgMtime = 0;

export function refreshDpkgCache(): void {
  if (!fs.existsSync(DPKG_STATUS)) return;
  const mtime = fs.statSync(DPKG_STATUS).mtimeMs;
  if (mtime === _dpkgMtime) return;
  _dpkgMtime = mtime;

  const db = open();
  db.exec('DELETE FROM dpkg_cache');
  const stmt = db.prepare(`
    INSERT INTO dpkg_cache
    (name,version,architecture,description,maintainer,depends,installed_size,section,priority,homepage,mtime)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
  `);

  const content = fs.readFileSync(DPKG_STATUS, 'utf8');
  for (const entry of content.split('\n\n').filter(Boolean)) {
    const fields = parseControlFile(entry);
    const name = fields['package'];
    if (!name) continue;
    const status = (fields['status'] || '').trim();
    if (!status.startsWith('install ok installed')) continue;
    stmt.run(
      name, fields['version'] || '', fields['architecture'] || '',
      fields['description']?.split('\n')[0] || '',
      fields['maintainer'] || '', fields['depends'] || '',
      fields['installed-size'] ? parseInt(fields['installed-size'], 10) : 0,
      fields['section'] || '', fields['priority'] || '',
      fields['homepage'] || '', Math.floor(mtime)
    );
  }
}

export function dpkgHasPackage(name: string): boolean {
  refreshDpkgCache();
  const row = open().prepare('SELECT 1 FROM dpkg_cache WHERE name = ?').get(name) as any;
  return !!row;
}

export function upsertDpkgEntry(name: string, version: string, architecture: string, description: string, installedSize: number): void {
  open().prepare(`
    INSERT OR REPLACE INTO dpkg_cache
    (name,version,architecture,description,installed_size,mtime)
    VALUES(?,?,?,?,?,?)
  `).run(name, version, architecture, description || '', installedSize || 0, Date.now());
}

export function removeDpkgCacheEntry(name: string): void {
  open().prepare('DELETE FROM dpkg_cache WHERE name = ?').run(name);
}

/** Call after directly writing to dpkg status + updating dpkg_cache to prevent full rebuild */
export function syncDpkgCache(): void {
  if (fs.existsSync(DPKG_STATUS)) {
    _dpkgMtime = fs.statSync(DPKG_STATUS).mtimeMs;
  }
}

export function getDpkgPackage(name: string): Record<string, any> | undefined {
  refreshDpkgCache();
  const row = open().prepare('SELECT * FROM dpkg_cache WHERE name = ?').get(name) as any;
  return row || undefined;
}

export function getAllDpkgPackages(): Record<string, any>[] {
  refreshDpkgCache();
  return open().prepare('SELECT * FROM dpkg_cache ORDER BY name').all() as any[];
}

export function countDpkgPackages(): number {
  refreshDpkgCache();
  const row = open().prepare('SELECT COUNT(*) as c FROM dpkg_cache').get() as any;
  return row?.c ?? 0;
}

/* ---- helpers ---- */
function installedFromRow(row: any): InstalledPackage {
  return {
    name: row.name, version: row.version, architecture: row.architecture,
    description: row.description, depends: row.depends, 'pre-depends': row.pre_depends,
    conflicts: row.conflicts, provides: row.provides,
    maintainer: row.maintainer, homepage: row.homepage,
    controlSection: row.section, controlPriority: row.priority,
    installedSize: row.installed_size, installTime: row.install_time,
    reason: row.reason, files: [], repoType: row.repo_type || 'debian',
  };
}
