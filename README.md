# pacman-debian

A package manager that adopts the Arch Linux pacman command-line syntax while operating directly on Debian/Ubuntu `.deb` packages. It manages packages at the dpkg level — bypassing APT — and also supports native Arch Linux `.pkg.tar.zst` packages.

## Goals

- Provide a consistent, pacman-style CLI for package management on Debian-based systems.
- Eliminate the conceptual overhead of switching between `apt`, `dpkg`, and their various frontends.
- Support multi-repository setups combining Debian/Ubuntu and Arch Linux repositories under a single tool.
- Maintain full compatibility with dpkg's database (`/var/lib/dpkg/status`), allowing coexistence with APT and other dpkg frontends.

## Non-Goals

- Replace APT or dpkg as the system package manager.
- Implement AUR support or any Arch Linux-specific build system integration.
- Provide a full dependency resolver comparable to APT's advanced solver.

## Requirements

- Node.js 18+ (TypeScript, compiled with `tsc`)
- Debian 12 Bookworm (or compatible Debian-based distribution)
- Root privileges for install, remove, and upgrade operations

## Quick Start

```bash
# Build
pnpm install && pnpm build

# Install as system command
sudo ln -sf "$PWD/dist/cli/pacman.js" /usr/local/bin/pacman

# Sync repositories
sudo pacman -Sy

# Search packages
pacman -Ss neofetch

# Install
sudo pacman -S neofetch

# Upgrade all packages
sudo pacman -Syu

# Remove
sudo pacman -R neofetch
```

## Configuration

Configuration file: `/etc/pacman-debian/pacman.conf`

If the file does not exist, the default configuration uses Ubuntu Noble (24.04) ARM64 repositories from `ports.ubuntu.com`. Example configuration:

```ini
[options]
Architecture = arm64

[ubuntu]
Type = debian
Server = http://ports.ubuntu.com/ubuntu-ports
Dist = noble
Components = main universe

[arch]
Type = arch
Server = https://mirror.example.com/archlinux
```

## Repository Support

- **Debian/Ubuntu**: Reads `Packages.gz` / `Packages.xz` from standard repository indices.
- **Arch Linux**: Reads `db.tar.gz` from Arch-compatible repositories. Downloaded `.pkg.tar.zst` files are extracted using `zstd` and installed directly.

## Database

- Own database: `/var/lib/pacman-debian/status.json`
- dpkg compatibility: writes entries to `/var/lib/dpkg/status` for interoperability with APT and `dpkg` commands.
- Installed package files index: `/var/lib/pacman-debian/file-index.json` (used by `-Qo`).

## Commands

### Sync (-S)

| Command | Description |
|---------|-------------|
| `pacman -S <pkg>` | Install package(s) from repositories |
| `pacman -Sy` | Refresh package databases |
| `pacman -Syy` | Force refresh package databases |
| `pacman -Su` | Upgrade all installed packages |
| `pacman -Syu` | Refresh databases and upgrade |
| `pacman -Ss <keyword>` | Search repositories |
| `pacman -Si <pkg>` | Show remote package information |
| `pacman -Sl` | List all packages in repositories |
| `pacman -Sw <pkg>` | Download packages without installing |
| `pacman -Sc` | Remove unused cached packages |
| `pacman -Scc` | Remove all cached packages |
| `pacman -Sp <pkg>` | Print what would be installed (dry-run) |

### Remove (-R)

| Command | Description |
|---------|-------------|
| `pacman -R <pkg>` | Remove a package |
| `pacman -Rs <pkg>` | Remove package and unused dependencies |
| `pacman -Rns <pkg>` | Remove package, dependencies, and skip scripts |
| `pacman -Rc <pkg>` | Cascade: remove packages that depend on the target |
| `pacman -Rdd <pkg>` | Skip dependency checks during removal |
| `pacman -Rp <pkg>` | Print what would be removed (dry-run) |

### Query (-Q)

| Command | Description |
|---------|-------------|
| `pacman -Q` | List all installed packages |
| `pacman -Qe` | List explicitly installed packages |
| `pacman -Qd` | List packages installed as dependencies |
| `pacman -Qdt` | List orphan packages (unused dependencies) |
| `pacman -Qi <pkg>` | Show detailed package information |
| `pacman -Ql <pkg>` | List files owned by a package |
| `pacman -Qo <file>` | Query which package owns a file |
| `pacman -Qs <keyword>` | Search installed packages |
| `pacman -Qk [pkg]` | Verify installed package file integrity |

### Other

| Command | Description |
|---------|-------------|
| `pacman -U <file>` | Install a local package file |
| `pacman -D --asdeps <pkg>` | Mark package as dependency |
| `pacman -D --asexplicit <pkg>` | Mark package as explicitly installed |
| `pacman -T <pkg>` | Check if dependencies are satisfied |
| `pacman -F <file>` | Search which package provides a file |
| `pacman -V` | Show version |

### Global Flags

| Flag | Description |
|------|-------------|
| `--noconfirm` | Skip confirmation prompts |
| `--confirm` | Always ask for confirmation (default) |
| `--needed` | Do not reinstall packages that are already up-to-date |
| `--noscriptlet` | Do not execute install scripts |
| `--print` | Dry-run: show what would be done without executing |

## Architecture

```
src/
├── cli/pacman.ts       # CLI argument parsing and dispatch
├── core/               # Package format parsers (ar, tar, control, deb, Arch .PKGINFO)
├── db/                 # Local database (status.json, file-index.json) and dpkg compatibility
├── ops/                # Operations: install, remove, query, upgrade
├── repo/               # Repository sync (Debian Packages.gz, Arch db.tar.gz) and configuration
└── ui/                 # User interface (prompt, formatting)
```

## License

GNU General Public License v3.0
