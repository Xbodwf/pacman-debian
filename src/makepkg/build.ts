import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { parsePkgbuild, pkgFilename } from './pkgbuild';
import type { PkgbuildInfo } from './pkgbuild';

const SRC_DIR = '/var/cache/pacman-debian/makepkg/src';
const PKG_DIR = '/var/cache/pacman-debian/makepkg/pkg';
const OUT_DIR = '/var/cache/pacman-debian/makepkg/out';

function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function downloadSource(url: string, destDir: string): string {
  const filename = path.basename(url.split('?')[0].split('#')[0]);
  const dest = path.join(destDir, filename);
  if (fs.existsSync(dest)) return dest;

  console.log(`  downloading ${filename}...`);

  // Use curl for download (more reliable with redirects)
  try {
    execSync(`curl -fsSL -o "${dest}" "${url}"`, { stdio: 'pipe', timeout: 120000 });
  } catch {
    // Fallback to wget
    execSync(`wget -q -O "${dest}" "${url}"`, { stdio: 'pipe', timeout: 120000 });
  }

  return dest;
}

function extractSource(filePath: string, destDir: string): void {
  const name = path.basename(filePath);

  if (name.endsWith('.tar.gz') || name.endsWith('.tgz')) {
    execSync(`tar -xzf "${filePath}" -C "${destDir}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.tar.xz')) {
    execSync(`tar -xJf "${filePath}" -C "${destDir}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.tar.bz2')) {
    execSync(`tar -xjf "${filePath}" -C "${destDir}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.tar.zst')) {
    execSync(`tar --zstd -xf "${filePath}" -C "${destDir}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.zip')) {
    execSync(`unzip -q -o "${filePath}" -d "${destDir}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.gz')) {
    execSync(`gunzip -c "${filePath}" > "${destDir}/${name.replace(/\.gz$/, '')}"`, { stdio: 'pipe' });
  } else if (name.endsWith('.xz')) {
    execSync(`xz -dc "${filePath}" > "${destDir}/${name.replace(/\.xz$/, '')}"`, { stdio: 'pipe' });
  } else {
    // Copy plain files
    fs.copyFileSync(filePath, path.join(destDir, name));
  }
}

function getSourceFilename(url: string): string {
  return path.basename(url.split('?')[0].split('#')[0]);
}

export interface BuildOptions {
  install?: boolean;
  clean?: boolean;
  skipExtract?: boolean;
  skipBuild?: boolean;
  skipPackage?: boolean;
  pkgbuild?: string;
}

export async function buildPkgbuild(options: BuildOptions): Promise<string> {
  const pkgbuildPath = path.resolve(options.pkgbuild || 'PKGBUILD');
  const workDir = path.dirname(pkgbuildPath);

  console.log(`:: Building ${path.basename(workDir)}`);

  const info = parsePkgbuild(pkgbuildPath);
  console.log(`  package: ${info.pkgname}-${info.pkgver}-${info.pkgrel}`);

  ensureDir(SRC_DIR);
  ensureDir(PKG_DIR);
  ensureDir(OUT_DIR);

  const srcdir = path.join(SRC_DIR, `${info.pkgname}-${info.pkgver}`);
  const pkgdir = path.join(PKG_DIR, `${info.pkgname}-${info.pkgver}`);

  if (options.clean) {
    if (fs.existsSync(srcdir)) fs.rmSync(srcdir, { recursive: true });
    if (fs.existsSync(pkgdir)) fs.rmSync(pkgdir, { recursive: true });
  }

  ensureDir(srcdir);
  ensureDir(pkgdir);

  // --- Download sources ---
  console.log('  sources:');
  const sourceFiles: string[] = [];
  for (const src of info.source) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('ftp://')) {
      const file = downloadSource(src, srcdir);
      sourceFiles.push(file);
      console.log(`    downloaded ${path.basename(file)}`);
    } else if (fs.existsSync(path.join(workDir, src))) {
      const file = path.join(workDir, src);
      fs.cpSync(file, path.join(srcdir, path.basename(file)), { recursive: true });
      sourceFiles.push(file);
    }
  }

  // --- Extract sources ---
  if (!options.skipExtract) {
    console.log('  extracting...');
    const noextract = new Set(options.skipExtract ? [] : info.noextract);
    for (const file of sourceFiles) {
      const name = path.basename(file);
      if (noextract.has(name)) {
        console.log(`    skipping extract: ${name}`);
        continue;
      }
      try {
        extractSource(file, srcdir);
      } catch (e: any) {
        console.error(`    warning: failed to extract ${name}: ${e.message}`);
      }
    }
  }

  // --- Create build script and run ---
  const buildScript = path.join(os.tmpdir(), `makepkg-build-${info.pkgname}.sh`);
  try {
    const scriptLines = [
      '#!/bin/bash',
      'set -e',
      `export srcdir="${srcdir}"`,
      `export pkgdir="${pkgdir}"`,
      `export pkgname="${info.pkgname}"`,
      `export pkgver="${info.pkgver}"`,
      `export pkgrel="${info.pkgrel}"`,
      '',
      'cd "$srcdir"',
      '',
    ];

    // --- build() ---
    if (info.buildFn && !options.skipBuild) {
      console.log('  building...');
      scriptLines.push(info.buildFn);
      scriptLines.push('build');
    }

    // --- package() ---
    if (info.packageFn && !options.skipPackage) {
      console.log('  packaging...');
      scriptLines.push(info.packageFn);
      scriptLines.push('package');
    }

    if (scriptLines.length <= 7) {
      throw new Error('PKGBUILD has no build() or package() function');
    }

    fs.writeFileSync(buildScript, scriptLines.join('\n'), { mode: 0o755 });

    try {
      execSync(`/bin/bash "${buildScript}"`, { stdio: 'inherit', timeout: 600000, cwd: srcdir });
    } catch (e: any) {
      throw new Error(`build failed: ${e.message}`);
    }
  } finally {
    try { fs.unlinkSync(buildScript); } catch {}
  }

  // --- Create .pkg.tar.zst ---
  if (!options.skipPackage) {
    console.log('  creating package...');
    const outFile = path.join(OUT_DIR, pkgFilename(info));

    // Check if pkgdir has contents
    const pkgContents = fs.readdirSync(pkgdir);
    if (pkgContents.length === 0) {
      throw new Error('package() produced no files in $pkgdir');
    }

    // Build .PKGINFO
    const pkginfoLines = [
      '# generated by pacman-debian makepkg',
      `pkgname = ${info.pkgname}`,
      `pkgver = ${info.pkgver}-${info.pkgrel}`,
      `pkgdesc = `,
      `url = ${info.url || ''}`,
      `builddate = ${Math.floor(Date.now() / 1000)}`,
      `packager = pacman-debian`,
      `size = ${getDirSize(pkgdir)}`,
      `arch = ${info.arch[0] || 'any'}`,
      ...info.license.map(l => `license = ${l}`),
      ...info.depends.map(d => `depend = ${d}`),
    ];
    fs.writeFileSync(path.join(pkgdir, '.PKGINFO'), pkginfoLines.join('\n') + '\n');

    // .INSTALL is not generated (no install scripts from PKGBUILD functions)

    // Package into .pkg.tar.zst
    execSync(
      `tar --zstd -cf "${outFile}" -C "${pkgdir}" .`,
      { stdio: 'pipe', timeout: 60000 }
    );

    const stat = fs.statSync(outFile);
    console.log(`  created: ${path.basename(outFile)} (${(stat.size / 1024).toFixed(0)} KiB)`);

    if (options.install) {
      console.log(`  installing via pacman...`);
      const { installPkgFile } = await import('../ops/install');
      await installPkgFile(outFile, 'explicit');
    }

    return outFile;
  }

  return '';
}

function getDirSize(dir: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(dir, e.name);
      if (e.isFile()) total += fs.statSync(fp).size;
      else if (e.isDirectory()) total += getDirSize(fp);
    }
  } catch {}
  return total;
}
