# pacman-debian

一个采用 Arch Linux pacman 命令行语法的包管理器，直接操作 Debian/Ubuntu 的 `.deb` 包。它在 dpkg 层面管理软件包——绕过 APT——同时也支持原生 Arch Linux 的 `.pkg.tar.zst` 包。

## 目标

- 在基于 Debian 的系统上提供一致的 pacman 风格的包管理 CLI。
- 消除在 `apt`、`dpkg` 和各种前端之间切换的概念开销。
- 支持在单一工具中组合 Debian/Ubuntu 和 Arch Linux 仓库的多仓库配置。
- 保持与 dpkg 数据库（`/var/lib/dpkg/status`）的完全兼容，允许与 APT 及其他 dpkg 前端共存。

## 非目标

- 取代 APT 或 dpkg 作为系统包管理器。
- 实现 AUR 支持或任何特定于 Arch Linux 的构建系统集成。
- 提供可与 APT 高级解析器相媲美的完整依赖解析器。

## 系统要求

- Node.js 18+（TypeScript，使用 `tsc` 编译）
- Debian 12 Bookworm（或兼容的基于 Debian 的发行版）
- 安装、删除和升级操作需要 root 权限

## 快速开始

```bash
# 编译
pnpm install && pnpm build

# 安装为系统命令
sudo ln -sf "$PWD/dist/cli/pacman.js" /usr/local/bin/pacman

# 同步仓库
sudo pacman -Sy

# 搜索软件包
pacman -Ss neofetch

# 安装
sudo pacman -S neofetch

# 升级所有软件包
sudo pacman -Syu

# 删除
sudo pacman -R neofetch
```

## 配置

配置文件：`/etc/pacman-debian/pacman.conf`

如果文件不存在，默认配置使用 `ports.ubuntu.com` 的 Ubuntu Noble (24.04) ARM64 仓库。配置示例：

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

## 仓库支持

- **Debian/Ubuntu**：从标准仓库索引读取 `Packages.gz` / `Packages.xz`。
- **Arch Linux**：从兼容的 Arch 仓库读取 `db.tar.gz`。下载的 `.pkg.tar.zst` 文件使用 `zstd` 解压后直接安装。

## 数据库

- 自有数据库：`/var/lib/pacman-debian/status.json`
- dpkg 兼容：向 `/var/lib/dpkg/status` 写入条目，实现与 APT 和 `dpkg` 命令的互操作。
- 已安装包文件索引：`/var/lib/pacman-debian/file-index.json`（用于 `-Qo`）

## 命令

### 同步 (-S)

| 命令 | 说明 |
|------|------|
| `pacman -S <pkg>` | 从仓库安装软件包 |
| `pacman -Sy` | 刷新软件包数据库 |
| `pacman -Syy` | 强制刷新软件包数据库 |
| `pacman -Su` | 升级所有已安装的软件包 |
| `pacman -Syu` | 刷新数据库并升级 |
| `pacman -Ss <keyword>` | 搜索仓库 |
| `pacman -Si <pkg>` | 显示远程软件包信息 |
| `pacman -Sl` | 列出仓库中的所有软件包 |
| `pacman -Sw <pkg>` | 下载软件包但不安装 |
| `pacman -Sc` | 删除未使用的缓存软件包 |
| `pacman -Scc` | 删除所有缓存软件包 |
| `pacman -Sp <pkg>` | 预览要安装的软件包（模拟运行） |

### 删除 (-R)

| 命令 | 说明 |
|------|------|
| `pacman -R <pkg>` | 删除软件包 |
| `pacman -Rs <pkg>` | 删除软件包及其未使用的依赖 |
| `pacman -Rns <pkg>` | 删除软件包、依赖并跳过脚本 |
| `pacman -Rc <pkg>` | 级联删除：删除依赖于目标包的包 |
| `pacman -Rdd <pkg>` | 删除时跳过依赖检查 |
| `pacman -Rp <pkg>` | 预览要删除的软件包（模拟运行） |

### 查询 (-Q)

| 命令 | 说明 |
|------|------|
| `pacman -Q` | 列出所有已安装的软件包 |
| `pacman -Qe` | 列出显式安装的软件包 |
| `pacman -Qd` | 列出作为依赖安装的软件包 |
| `pacman -Qdt` | 列出孤儿软件包（未使用的依赖） |
| `pacman -Qi <pkg>` | 显示详细的软件包信息 |
| `pacman -Ql <pkg>` | 列出软件包拥有的文件 |
| `pacman -Qo <file>` | 查询文件属于哪个软件包 |
| `pacman -Qs <keyword>` | 搜索已安装的软件包 |
| `pacman -Qk [pkg]` | 验证已安装软件包的文件完整性 |

### 其他

| 命令 | 说明 |
|------|------|
| `pacman -U <file>` | 安装本地软件包文件 |
| `pacman -D --asdeps <pkg>` | 将软件包标记为依赖 |
| `pacman -D --asexplicit <pkg>` | 将软件包标记为显式安装 |
| `pacman -T <pkg>` | 检查依赖是否满足 |
| `pacman -F <file>` | 搜索哪个软件包提供某个文件 |
| `pacman -V` | 显示版本信息 |

### 全局标志

| 标志 | 说明 |
|------|------|
| `--noconfirm` | 跳过确认提示 |
| `--confirm` | 始终询问确认（默认） |
| `--needed` | 不重新安装已是最新的软件包 |
| `--noscriptlet` | 不执行安装脚本 |
| `--print` | 模拟运行：显示将要执行的操作而不实际执行 |

## 架构

```
src/
├── cli/pacman.ts       # CLI 参数解析和分发
├── core/               # 包格式解析器 (ar, tar, control, deb, Arch .PKGINFO)
├── db/                 # 本地数据库 (status.json, file-index.json) 和 dpkg 兼容层
├── ops/                # 操作：安装、删除、查询、升级
├── repo/               # 仓库同步 (Debian Packages.gz, Arch db.tar.gz) 和配置
└── ui/                 # 用户界面 (提示、格式化)
```

## 许可证

GNU General Public License v3.0
