import * as fs from 'node:fs';

export interface ArMember {
  name: string;
  size: number;
  data: Buffer;
}

export function parseAr(data: Buffer): ArMember[] {
  const members: ArMember[] = [];
  let offset = 0;

  const magic = data.subarray(0, 8).toString('ascii');
  if (magic !== '!<arch>\n') {
    throw new Error(`Not a valid ar archive: bad magic "${magic}"`);
  }
  offset = 8;

  let strTable: string[] | null = null;

  while (offset < data.length) {
    if (offset + 60 > data.length) break;

    const nameRaw = data.subarray(offset, offset + 16).toString('ascii');
    const sizeStr = data.subarray(offset + 48, offset + 58).toString('ascii').trim();
    const headerMagic = data.subarray(offset + 58, offset + 60).toString('ascii');

    if (headerMagic !== '`\n') break;

    const size = parseInt(sizeStr, 10);
    if (isNaN(size)) break;

    offset += 60;
    const content = data.subarray(offset, offset + size);
    const rawName = nameRaw.replace(/\//g, '').trim();

    if (rawName === '//' && strTable === null) {
      strTable = content.toString('ascii').split('\n')
        .map(s => s.replace(/\0/g, '').trim()).filter(Boolean);
    } else {
      let name: string;
      if (rawName.startsWith('/') && strTable) {
        name = strTable[parseInt(rawName.slice(1), 10)] || rawName;
      } else {
        name = rawName.replace(/\/$/, '');
      }
      members.push({ name, size, data: content });
    }

    offset += Math.ceil(size / 2) * 2;
  }

  return members;
}
