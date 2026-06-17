import * as zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export function decompress(data: Buffer, filename: string): Buffer {
  if (filename.endsWith('.gz')) return zlib.gunzipSync(data);
  if (filename.endsWith('.xz')) return decompressWith(data, 'xz');
  if (filename.endsWith('.zst')) return decompressWith(data, 'zstd');
  return data;
}

function decompressWith(data: Buffer, tool: string): Buffer {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pmdeb-'));
  const inFile = path.join(tmp, `input.${tool === 'xz' ? 'xz' : 'zst'}`);
  const outFile = path.join(tmp, 'output');
  try {
    fs.writeFileSync(inFile, data);
    execSync(`${tool} -d -f "${inFile}" --stdout > "${outFile}"`, { stdio: 'pipe' });
    return fs.readFileSync(outFile);
  } finally {
    try { fs.unlinkSync(inFile); } catch {}
    try { fs.unlinkSync(outFile); } catch {}
    try { fs.rmdirSync(tmp); } catch {}
  }
}
