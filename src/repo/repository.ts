import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';
import { loadConfig } from './config';
import { parseControlFile } from '../core/control';
import { decompress } from '../core/compress';
import { iterateTar, readFileFromTar } from '../core/tar';
import { parseDescFile } from '../core/pkgfile';
import type { RepoPkg, RepoConfig } from '../core/types';

const CACHE_DIR = '/var/cache/pacman-debian';
const PKG_CACHE = path.join(CACHE_DIR, 'packages');
const DEB_CACHE = path.join(CACHE_DIR, 'pkg');

async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject).on('timeout', function (this: any) { this.destroy(); reject(new Error('timeout')); });
  });
}

// ---- Debian repo parser ----
function parseDebianPackages(content: string, repo: string): RepoPkg[] {
  const pkgs: RepoPkg[] = [];
  for (const entry of content.split('\n\n').filter(Boolean)) {
    const f = parseControlFile(entry);
    if (!f['package']) continue;
    pkgs.push({
      package: f['package'], version: f['version'] || '0.0',
      architecture: f['architecture'] || 'amd64',
      description: f['description']?.split('\n')[0],
      depends: f['depends'], conflicts: f['conflicts'], provides: f['provides'],
      filename: f['filename'] || '',
      size: f['size'] ? parseInt(f['size'], 10) : undefined,
      installedSize: f['installed-size'] ? parseInt(f['installed-size'], 10) : undefined,
      sha256: f['sha256'], repo, repoType: 'debian',
    });
  }
  return pkgs;
}

async function syncDebian(repo: RepoConfig, arch: string): Promise<{ pkgs: RepoPkg[]; size: number }> {
  const all: RepoPkg[] = [];
  let totalSize = 0;
  const comps = repo.components || ['main'];
  for (const comp of comps) {
    const base = `${repo.server}/dists/${repo.dist}/${comp}/binary-${arch}/Packages`;
    let buf: Buffer | null = null;
    for (const ext of ['gz', 'xz']) {
      try {
        const raw = await downloadFile(`${base}.${ext}`);
        totalSize += raw.length;
        buf = decompress(raw, `packages.${ext}`);
        break;
      } catch { continue; }
    }
    if (buf) all.push(...parseDebianPackages(buf.toString('utf8'), repo.name));
  }
  return { pkgs: all, size: totalSize };
}

// ---- Arch repo parser ----
function parseArchDb(dbTar: Buffer, repo: string): RepoPkg[] {
  const pkgs: RepoPkg[] = [];
  const entries = new Map<string, Buffer[]>();

  // Collect all files per package directory
  for (const entry of iterateTar(dbTar)) {
    const parts = entry.name.split('/');
    if (parts.length < 2) continue;
    const pkgDir = parts[0];
    const fileName = parts.slice(1).join('/');
    if (!entries.has(pkgDir)) entries.set(pkgDir, []);
    const data = entry.data || Buffer.alloc(0);
    // Store as pair: name + data (we'll use a simple format)
    const nameBuf = Buffer.from(fileName + '\0');
    const combined = Buffer.concat([nameBuf, data]);
    entries.get(pkgDir)!.push(combined);
  }

  for (const [dir, files] of entries) {
    let descContent = '';
    let dependsContent = '';
    for (const combined of files) {
      const nullIdx = combined.indexOf(0);
      if (nullIdx === -1) continue;
      const name = combined.subarray(0, nullIdx).toString('utf8');
      const content = combined.subarray(nullIdx + 1).toString('utf8');
      if (name === 'desc') descContent = content;
      else if (name === 'depends') dependsContent = content;
    }
    if (!descContent) continue;

    const desc = parseDescFile(descContent);
    const depends = dependsContent.split('\n').map(l => l.trim().split(/[<>=]/)[0].trim()).filter(Boolean);

    const filename = (desc['filename'] || [''])[0];
    const pkgName = (desc['name'] || [''])[0];
    const version = (desc['version'] || [''])[0];
    if (!pkgName || !version) continue;

    const arch = (desc['arch'] || [''])[0];
    const csize = (desc['csize'] || [''])[0];
    const isize = (desc['isize'] || [''])[0];
    const descText = (desc['desc'] || [''])[0];

    pkgs.push({
      package: pkgName, version,
      architecture: arch || 'any',
      description: descText,
      depends: depends.join(', '),
      conflicts: (desc['conflicts'] || []).join(', '),
      provides: (desc['provides'] || []).join(', '),
      filename,
      size: csize ? parseInt(csize, 10) : undefined,
      installedSize: isize ? Math.ceil(parseInt(isize, 10) / 1024) : undefined,
      repo, repoType: 'arch',
    });
  }

  return pkgs;
}

async function syncArch(repo: RepoConfig, arch: string): Promise<RepoPkg[]> {
  const url = `${repo.server}/${repo.name}/os/${arch}/${repo.name}.db.tar.gz`;
  const buf = await downloadFile(url);
  const tar = decompress(buf, 'repo.tar.gz');
  return parseArchDb(tar, repo.name);
}

// ---- Main sync ----
export async function syncRepos(onProgress?: (repo: string, size: number, count: number) => void): Promise<void> {
  const cfg = loadConfig();
  if (!fs.existsSync(PKG_CACHE)) fs.mkdirSync(PKG_CACHE, { recursive: true });

  const tasks = cfg.repos.map(async (repo) => {
    let pkgs: RepoPkg[] = [];
    try {
      if (repo.type === 'arch') {
        pkgs = await syncArch(repo, cfg.architecture);
      } else {
        const result = await syncDebian(repo, cfg.architecture);
        pkgs = result.pkgs;
      }
      fs.writeFileSync(path.join(PKG_CACHE, `${repo.name}.json`), JSON.stringify(pkgs));
      if (onProgress) onProgress(repo.name, 0, pkgs.length);
      if (pkgs.length === 0) {
        console.error(`  WARNING: ${repo.name} returned 0 packages (wrong architecture? check pacman.conf)`);
      }
    } catch (e: any) {
      console.error(`  WARNING: failed to sync ${repo.name}: ${e.message}`);
      if (onProgress) onProgress(repo.name, 0, 0);
    }
  });

  await Promise.all(tasks);
  invalidateCache();
}

// ---- Cache ----
let _cache: RepoPkg[] | null = null;

export function getRepoCache(): RepoPkg[] {
  if (_cache) return _cache;
  if (!fs.existsSync(PKG_CACHE)) { _cache = []; return _cache; }
  const all: RepoPkg[] = [];
  for (const f of fs.readdirSync(PKG_CACHE)) {
    if (f.endsWith('.json')) all.push(...JSON.parse(fs.readFileSync(path.join(PKG_CACHE, f), 'utf8')));
  }
  _cache = all;
  return all;
}

export function invalidateCache(): void { _cache = null; }

export function searchRepo(query: string): RepoPkg[] {
  const lq = query.toLowerCase();
  return getRepoCache().filter(p =>
    p.package.toLowerCase().includes(lq) ||
    (p.description && p.description.toLowerCase().includes(lq))
  );
}

export function findInRepo(pkgName: string): RepoPkg | undefined {
  return getRepoCache().find(p => p.package === pkgName);
}

export async function downloadPkg(rp: RepoPkg, dest?: string): Promise<string> {
  if (!fs.existsSync(DEB_CACHE)) fs.mkdirSync(DEB_CACHE, { recursive: true });
  const fn = path.basename(rp.filename);
  const local = path.join(dest || DEB_CACHE, fn);
  if (fs.existsSync(local)) return local;

  let url: string;
  if (rp.repoType === 'arch') {
    const cfg = loadConfig();
    const repo = cfg.repos.find(r => r.name === rp.repo);
    if (!repo) throw new Error(`repo ${rp.repo} not found`);
    url = `${repo.server}/${repo.name}/os/${cfg.architecture}/${rp.filename}`;
  } else {
    const cfg = loadConfig();
    const repo = cfg.repos.find(r => r.name === rp.repo);
    if (!repo) throw new Error(`repo ${rp.repo} not found`);
    url = `${repo.server}/${rp.filename}`;
  }

  const data = await downloadFile(url);
  fs.writeFileSync(local, data);
  return local;
}
