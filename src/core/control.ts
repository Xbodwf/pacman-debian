export function parseControlFile(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let key = '';
  let val = '';

  for (const line of content.split('\n')) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      val += '\n' + line.trimEnd();
    } else if (line.trim() === '') {
      continue;
    } else {
      if (key) fields[key.toLowerCase()] = val.trimEnd();
      const ci = line.indexOf(':');
      if (ci === -1) continue;
      key = line.slice(0, ci).trim();
      val = line.slice(ci + 1).trim();
    }
  }

  if (key) fields[key.toLowerCase()] = val.trimEnd();
  return fields;
}
