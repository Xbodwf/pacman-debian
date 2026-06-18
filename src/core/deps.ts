import { execSync } from 'node:child_process';
import { findInRepo, getRepoCache } from '../repo/repository';
import { readDpkgStatus, dpkgHasPackage } from '../db/dpkg-compat';
import { loadDatabase, isInstalled } from '../db/database';
import type { RepoPkg } from './types';

export interface Dep {
  name: string;
  version?: string;
  operator?: string;
  arch?: string;
}

export interface DepResult {
  pkg: RepoPkg;
  needed: boolean;
  reason: string;
}

/* ---- Dependency string parser ---- */
export function parseDep(s: string): Dep[] {
  // Handle OR deps: "foo | bar >= 1.0"
  const alternatives = s.split('|').map(a => a.trim());
  return alternatives.map(a => {
    let name = a;
    let operator: string | undefined;
    let version: string | undefined;

    const opMatch = a.match(/([\(<>=!]+)\s*([\d:\w.~+*-]+[\w.+*~-]*)\s*\)?$/);
    if (opMatch) {
      operator = opMatch[1].trim();
      version = opMatch[2].trim();
      name = a.slice(0, a.indexOf(opMatch[1])).trim();
    }

    // Architecture qualifier: "pkg:any", "libc6:arm64"
    const archSep = name.lastIndexOf(':');
    let arch: string | undefined;
    if (archSep > 0 && name.length - archSep <= 8 && !name.includes('/')) {
      arch = name.slice(archSep + 1);
      name = name.slice(0, archSep);
    }

    return { name, version, operator, arch };
  });
}

/* ---- Version comparison ---- */
function verCmp(a: string, b: string): number {
  // Try dpkg compare first
  try {
    const out = execSync(`dpkg --compare-versions "${a}" gt "${b}" 2>/dev/null && echo gt || (dpkg --compare-versions "${a}" eq "${b}" 2>/dev/null && echo eq) || echo lt`, { encoding: 'utf8', timeout: 5000 }).trim();
    if (out === 'gt') return 1;
    if (out === 'eq') return 0;
    if (out === 'lt') return -1;
  } catch {}

  // Fallback: simple numeric/string comparison
  const aParts = a.replace(/[^\d.]/g, '').split('.').map(Number);
  const bParts = b.replace(/[^\d.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const an = aParts[i] || 0, bn = bParts[i] || 0;
    if (an !== bn) return an - bn;
  }
  return a.localeCompare(b);
}

function checkVersion(installed: string, operator: string, required: string): boolean {
  const cmp = verCmp(installed, required);
  switch (operator) {
    case '>=': return cmp >= 0;
    case '<=': return cmp <= 0;
    case '>': return cmp > 0;
    case '<': return cmp < 0;
    case '=': case '==': return cmp === 0;
    default: return true; // no constraint
  }
}

/* ---- Check if dep is satisfied ---- */
function isDepSatisfied(dep: Dep): boolean {
  // Check our local DB
  const db = loadDatabase();
  const local = db.packages.get(dep.name);

  // Check dpkg
  const dpkg = readDpkgStatus();
  const fromDpkg = dpkg.get(dep.name);

  const installedVer = local?.version || fromDpkg?.version;
  if (!installedVer) return false; // not installed

  if (dep.operator && dep.version) {
    return checkVersion(installedVer, dep.operator, dep.version);
  }
  return true;
}

/* ---- Find provider in repo ---- */
function findProvider(name: string): RepoPkg | undefined {
  // Direct match
  const direct = findInRepo(name);
  if (direct) return direct;

  // Search provides field
  const cache = getRepoCache();
  return cache.find(p => {
    const provides = p.provides || '';
    return provides.split(',').some(pr => {
      const pn = pr.trim().split(/[<>=]/)[0].trim();
      return pn === name;
    });
  });
}

/* ---- Full dependency resolution ---- */
export function resolveDeps(targets: string[]): { install: DepResult[]; errors: string[] } {
  const install: DepResult[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const toProcess: string[] = [...targets];

  while (toProcess.length > 0) {
    const name = toProcess.shift()!;
    if (seen.has(name)) continue;
    seen.add(name);

    // Check if installed
    if (isDepSatisfied({ name })) continue;

    // Find provider
    const rp = findProvider(name);
    if (!rp) {
      errors.push(`'${name}' not found`);
      continue;
    }

    const alreadyResolved = install.some(i => i.pkg.package === rp.package);
    if (!alreadyResolved) {
      install.push({ pkg: rp, needed: true, reason: 'target' });
    }

    // Process dependencies
    const deps = parseDepList(rp.depends);
    for (const d of deps) {
      if (!seen.has(d.name) && !isDepSatisfied(d)) {
        toProcess.push(d.name);
      }
    }
  }

  return { install, errors };
}

function parseDepList(s?: string): Dep[] {
  if (!s) return [];
  const result: Dep[] = [];
  for (const part of s.split(',')) {
    const parsed = parseDep(part.trim());
    if (parsed.length > 0) result.push(parsed[0]); // take first alternative
  }
  return result;
}

/* ---- Conflict detection ---- */
export interface Conflict {
  a: string;
  b: string;
  reason: string;
}

export function detectConflicts(packages: RepoPkg[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const names = new Set(packages.map(p => p.package));

  for (const pkg of packages) {
    const pkgConflicts = pkg.conflicts || '';
    const conflictNames = pkgConflicts.split(',').map(s => s.trim().split(/[<>=]/)[0].trim()).filter(Boolean);

    for (const c of conflictNames) {
      // Check against other to-be-installed packages
      for (const other of packages) {
        if (other.package !== pkg.package && other.package === c) {
          conflicts.push({ a: pkg.package, b: c, reason: `${pkg.package} conflicts with ${c}` });
        }
      }
      // Check against installed packages
      if (dpkgHasPackage(c) || loadDatabase().packages.has(c)) {
        conflicts.push({ a: pkg.package, b: c, reason: `${pkg.package} conflicts with installed ${c}` });
      }
    }
  }

  return conflicts;
}
