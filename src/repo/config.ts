import * as fs from 'node:fs';
import type { Config, RepoConfig } from '../core/types';

const CONFIG_PATH = '/etc/pacman-debian/pacman.conf';

export function loadConfig(): Config {
  const cfg: Config = { architecture: 'arm64', repos: [] };
  if (!fs.existsSync(CONFIG_PATH)) {
    cfg.repos.push({ name: 'ubuntu', type: 'debian', server: 'http://ports.ubuntu.com/ubuntu-ports', dist: 'noble', components: ['main', 'universe'] });
    return cfg;
  }
  const content = fs.readFileSync(CONFIG_PATH, 'utf8');
  let cur: RepoConfig | null = null;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const sm = t.match(/^\[(.+)\]$/);
    if (sm) {
      if (cur) cfg.repos.push(cur);
      const n = sm[1];
      if (n === 'options') { cur = null; continue; }
      cur = { name: n, type: 'debian', server: '', dist: '', components: [] };
      continue;
    }
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim().toLowerCase();
    const v = t.slice(eq + 1).trim();
    if (!cur) { if (k === 'architecture') cfg.architecture = v; }
    else if (k === 'type') cur.type = v === 'arch' ? 'arch' : 'debian';
    else if (k === 'server') cur.server = v;
    else if (k === 'dist') cur.dist = v;
    else if (k === 'components') cur.components = v.split(/\s+/).filter(Boolean);
    else if (k === 'dbfile') cur.dbFile = v;
    else if (k === 'architecture') cur.architecture = v;
  }
  if (cur) cfg.repos.push(cur);
  return cfg;
}
