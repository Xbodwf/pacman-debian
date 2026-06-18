import * as fs from 'node:fs';
import { refreshDpkgCache, getAllDpkgPackages, getDpkgPackage, dpkgHasPackage as sqlDpkgHas, upsertDpkgEntry, removeDpkgCacheEntry, syncDpkgCache } from './sqlite';
import type { InstalledPackage } from '../core/types';

const DPKG_STATUS = '/var/lib/dpkg/status';
const DPKG_INFO = '/var/lib/dpkg/info';

export interface DpkgEntry {
  package: string;
  version: string;
  architecture: string;
  status: string;
  description?: string;
  maintainer?: string;
  depends?: string;
  installedSize?: number;
  section?: string;
  priority?: string;
  homepage?: string;
}

export function readDpkgStatus(): Map<string, DpkgEntry> {
  refreshDpkgCache();
  const result = new Map<string, DpkgEntry>();
  for (const row of getAllDpkgPackages()) {
    result.set(row.name, {
      package: row.name, version: row.version, architecture: row.architecture,
      status: 'install ok installed', description: row.description,
      maintainer: row.maintainer, depends: row.depends,
      installedSize: row.installed_size, section: row.section,
      priority: row.priority, homepage: row.homepage,
    });
  }
  return result;
}

export function dpkgHasPackage(name: string): boolean {
  return sqlDpkgHas(name);
}

const ARCH_MAP: Record<string, string> = {
  aarch64: 'arm64', x86_64: 'amd64', i686: 'i386',
  armv7h: 'armhf', armv6h: 'armhf', riscv64: 'riscv64',
};

function toDpkgArch(arch: string): string {
  return ARCH_MAP[arch] || arch;
}

function formatDescription(desc?: string): string | undefined {
  if (!desc || desc.trim() === '') return undefined;
  const lines = desc.split('\n');
  if (lines.length <= 1) return `Description: ${desc}`;
  const first = lines[0];
  const rest = lines.slice(1).map(l => ' ' + l).join('\n');
  return `Description: ${first}\n${rest}`;
}

export function writeDpkgEntry(pkg: InstalledPackage): void {
  if (!fs.existsSync(DPKG_STATUS)) return;

  const content = fs.readFileSync(DPKG_STATUS, 'utf8');
  const entries = content.split('\n\n').filter((e: string) => e.trim() !== '');
  let kept = entries.filter((e: string) => {
    const m = e.match(/^Package: (.+)$/m);
    return !(m && m[1] === pkg.name);
  });

  const entry = [
    `Package: ${pkg.name}`,
    `Status: install ok installed`,
    `Priority: ${pkg.controlPriority || 'optional'}`,
    `Section: ${pkg.controlSection || 'misc'}`,
    `Installed-Size: ${pkg.installedSize || 0}`,
    `Maintainer: ${pkg.maintainer || 'Unknown'}`,
    `Architecture: ${toDpkgArch(pkg.architecture)}`,
    `Version: ${pkg.version}`,
  ];

  if (pkg.depends) entry.push(`Depends: ${pkg.depends}`);
  const desc = formatDescription(pkg.description);
  if (desc) entry.push(desc);
  if (pkg.homepage) entry.push(`Homepage: ${pkg.homepage}`);

  kept = kept.filter((e: string) => e.trim() !== '');
  kept.push(entry.join('\n'));
  fs.writeFileSync(DPKG_STATUS, kept.join('\n\n') + '\n');

  if (fs.existsSync(DPKG_INFO)) {
    const lp = `${DPKG_INFO}/${pkg.name}.list`;
    const existing = fs.existsSync(lp)
      ? fs.readFileSync(lp, 'utf8').split('\n').filter(Boolean)
      : [];
    fs.writeFileSync(lp, [...new Set([...existing, ...pkg.files])].sort().join('\n') + '\n');
  }
  upsertDpkgEntry(pkg.name, pkg.version, toDpkgArch(pkg.architecture), pkg.description || '', pkg.installedSize || 0);
  syncDpkgCache();
}

export function removeDpkgEntry(name: string): void {
  if (!fs.existsSync(DPKG_STATUS)) return;
  const content = fs.readFileSync(DPKG_STATUS, 'utf8');
  const entries = content.split('\n\n').filter((e: string) => e.trim() !== '');
  const kept = entries.filter((e: string) => {
    const m = e.match(/^Package: (.+)$/m);
    if (m && m[1] === name) return false;
    return true;
  });
  fs.writeFileSync(DPKG_STATUS, kept.join('\n\n') + '\n');
  removeDpkgCacheEntry(name);
  syncDpkgCache();

  const lp = `${DPKG_INFO}/${name}.list`;
  if (fs.existsSync(lp)) fs.unlinkSync(lp);
}
