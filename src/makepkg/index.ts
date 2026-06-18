#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { buildPkgbuild } from './build';

function help(): void {
  console.log(`makepkg (pacman-debian) - build packages from PKGBUILD

usage:  makepkg [options]

options:
  -i, --install      Install package after build
  -s, --syncdeps     Install missing dependencies
  -r, --rmdeps       Remove dependencies after build (use with -s)
  -c, --clean        Clean build files before building
  -f, --force        Overwrite existing package
  -o, --nobuild      Download and extract only
  -e, --noextract    Skip extraction (use existing src dir)
  -d, --nodeps       Skip all dependency checks
  -L, --log          Log build output to file
  -A, --ignorearch   Ignore architecture mismatch
  -p, --pkgbuild     Use an alternate build script (default: PKGBUILD)
      --printsrcinfo Print .SRCINFO and exit
      --geninteg     Generate integrity checksums
      --nocheck      Skip check() function
      --noprepare    Skip prepare() function
  -h, --help         Show this help
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) { help(); return; }

  const has = (short: string, long: string) => args.includes(short) || args.includes(long);

  const options: any = {
    install: has('-i', '--install'),
    syncdeps: has('-s', '--syncdeps'),
    rmdeps: has('-r', '--rmdeps'),
    clean: has('-c', '--clean'),
    force: has('-f', '--force'),
    skipBuild: has('-o', '--nobuild'),
    skipExtract: has('-e', '--noextract'),
    skipPackage: has('-o', '--nobuild'),
    nodeps: has('-d', '--nodeps'),
    log: has('-L', '--log'),
    ignoreArch: has('-A', '--ignorearch'),
    printsrcinfo: has('', '--printsrcinfo'),
    geninteg: has('', '--geninteg'),
    nocheck: has('', '--nocheck'),
    noprepare: has('', '--noprepare'),
  };

  // --nocheck sets skipBuild to skip check, but still run build
  // --noprepare sets skipBuild to skip prepare, but still run build

  const pkgbuildIdx = args.indexOf('-p');
  if (pkgbuildIdx !== -1 && args[pkgbuildIdx + 1]) options.pkgbuild = args[pkgbuildIdx + 1];
  else {
    const idx = args.indexOf('--pkgbuild');
    if (idx !== -1 && args[idx + 1]) options.pkgbuild = args[idx + 1];
  }

  if (options.printsrcinfo || options.geninteg) {
    await buildPkgbuild(options);
    return;
  }

  const needsRoot = (options.install || options.syncdeps) && !options.skipPackage;
  if (needsRoot && (process.getuid && process.getuid() !== 0)) {
    // Use sudo for the install part
    if (options.install || options.syncdeps) {
      // Re-run self with sudo for install, but build as user first
      const skipInstall = { ...options, install: false, syncdeps: false };
      await buildPkgbuild(skipInstall);
      // Now re-run with sudo for install
      const self = process.argv[1];
      const sudoArgs = process.argv.slice(2).filter(a => a !== '-i' && a !== '--install' && a !== '-s' && a !== '--syncdeps');
      if (options.install) sudoArgs.push('-i');
      if (options.syncdeps) sudoArgs.push('-s');
      execSync(`sudo "${self}" ${sudoArgs.join(' ')}`, { stdio: 'inherit' });
      return;
    }
  }

  await buildPkgbuild(options);
}

main().catch(e => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
