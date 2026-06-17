import * as fs from 'node:fs';
import { parseAr } from './ar';
import { decompress } from './compress';
import { readFileFromTar, listTarEntries } from './tar';
import { parseControlFile } from './control';
import type { DebPackage, DebControl } from './types';

export function parseDeb(filePath: string): DebPackage {
  const rawMembers = parseAr(fs.readFileSync(filePath));
  let debianBinary: Buffer | null = null;
  let controlTarRaw: Buffer | null = null;
  let controlTarName = '';
  let dataTarRaw: Buffer | null = null;
  let dataTarName = '';

  for (const m of rawMembers) {
    if (m.name === 'debian-binary') debianBinary = m.data;
    else if (m.name.startsWith('control.tar')) { controlTarRaw = m.data; controlTarName = m.name; }
    else if (m.name.startsWith('data.tar')) { dataTarRaw = m.data; dataTarName = m.name; }
  }

  if (!debianBinary) throw new Error(`Missing debian-binary in ${filePath}`);
  if (!controlTarRaw || !dataTarRaw) throw new Error(`Malformed .deb: missing tar members`);

  const controlTar = decompress(controlTarRaw, controlTarName);
  const dataTar = decompress(dataTarRaw, dataTarName);

  const controlFileBuf = readFileFromTar(controlTar, './control')
    ?? readFileFromTar(controlTar, 'control');
  if (!controlFileBuf) throw new Error(`Missing control file in ${filePath}`);

  const fields = parseControlFile(controlFileBuf.toString('utf8'));
  if (!fields['package']) throw new Error(`control file missing Package field`);

  const control: DebControl = { package: fields['package'], version: fields['version'] || '0.0', architecture: fields['architecture'] || 'amd64' };
  for (const [k, v] of Object.entries(fields)) if (!(k in control)) (control as any)[k] = v;

  return { path: filePath, control, controlTar, dataTar };
}

export function readScript(pkg: DebPackage, name: string): string | null {
  for (const prefix of ['', './']) {
    const buf = readFileFromTar(pkg.controlTar, prefix + name);
    if (buf) return buf.toString('utf8');
  }
  return null;
}
