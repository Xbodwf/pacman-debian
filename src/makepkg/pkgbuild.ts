import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PkgbuildInfo {
  pkgname: string;
  pkgver: string;
  pkgrel: string;
  arch: string[];
  url?: string;
  license: string[];
  depends: string[];
  makedepends: string[];
  source: string[];
  sha256sums: string[];
  noextract: string[];
  validpgpkeys: string[];
  buildFn: string;
  packageFn: string;
}

function bashGet(varname: string, pkgbuildPath: string): string {
  try {
    const cmd = 'bash -c \'source "' + pkgbuildPath + '" 2>/dev/null; printf "%s" "${' + varname + '}"\'';
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
  } catch { return ''; }
}

function bashGetArray(varname: string, pkgbuildPath: string): string[] {
  try {
    const cmd = 'bash -c \'source "' + pkgbuildPath + '" 2>/dev/null; for i in "${' + varname + '[@]}"; do echo "$i"; done\'';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
    return out ? out.split('\n') : [];
  } catch { return []; }
}

function bashGetFn(fnname: string, pkgbuildPath: string): string {
  try {
    const cmd = 'bash -c \'source "' + pkgbuildPath + '" 2>/dev/null; declare -f ' + fnname + ' 2>/dev/null\'';
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
  } catch { return ''; }
}

export function parsePkgbuild(pkgbuildPath: string): PkgbuildInfo {
  if (!fs.existsSync(pkgbuildPath)) {
    throw new Error(`PKGBUILD not found: ${pkgbuildPath}`);
  }

  const absPath = path.resolve(pkgbuildPath);

  const info: PkgbuildInfo = {
    pkgname: bashGet('pkgname', absPath),
    pkgver: bashGet('pkgver', absPath),
    pkgrel: bashGet('pkgrel', absPath),
    arch: bashGetArray('arch', absPath),
    url: bashGet('url', absPath) || undefined,
    license: bashGetArray('license', absPath),
    depends: bashGetArray('depends', absPath),
    makedepends: bashGetArray('makedepends', absPath),
    source: bashGetArray('source', absPath),
    sha256sums: bashGetArray('sha256sums', absPath),
    noextract: bashGetArray('noextract', absPath),
    validpgpkeys: bashGetArray('validpgpkeys', absPath),
    buildFn: bashGetFn('build', absPath),
    packageFn: bashGetFn('package', absPath),
  };

  if (!info.pkgname) throw new Error('PKGBUILD missing pkgname');
  if (!info.pkgver) throw new Error('PKGBUILD missing pkgver');

  return info;
}

export function pkgFilename(info: PkgbuildInfo): string {
  return `${info.pkgname}-${info.pkgver}-${info.pkgrel}-${info.arch[0] || 'any'}.pkg.tar.zst`;
}
