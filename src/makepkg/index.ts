#!/usr/bin/env node
import { buildPkgbuild } from './build';

function help(): void {
  console.log(`usage:  makepkg [options]

options:
  -i, --install     Install package after build
  -c, --clean       Clean build directory before building
  -o, --nobuild     Download and extract only (skip build)
  -e, --noextract   Skip extraction
  -p, --pkgbuild    Use an alternate build script (default: PKGBUILD)
  -r, --rmdeps      Remove dependencies after build (not implemented)
  -s, --syncdeps    Install dependencies (not implemented)
  -h, --help        Show this help
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) { help(); return; }

  const options: any = {
    install: args.includes('-i') || args.includes('--install'),
    clean: args.includes('-c') || args.includes('--clean'),
    skipBuild: args.includes('-o') || args.includes('--nobuild'),
    skipExtract: args.includes('-e') || args.includes('--noextract'),
    skipPackage: args.includes('-o') || args.includes('--nobuild'),
  };

  const pkgbuildIdx = args.indexOf('-p');
  if (pkgbuildIdx !== -1 && args[pkgbuildIdx + 1]) {
    options.pkgbuild = args[pkgbuildIdx + 1];
  } else if (args.indexOf('--pkgbuild') !== -1) {
    const idx = args.indexOf('--pkgbuild');
    if (args[idx + 1]) options.pkgbuild = args[idx + 1];
  }

  // Check if root is needed for install
  if (options.install && (process.getuid && process.getuid() !== 0)) {
    console.error('error: --install requires root');
    process.exit(1);
  }

  await buildPkgbuild(options);
}

main().catch(e => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
