import * as readline from 'node:readline';

export let noconfirm = false;

export function setNoConfirm(val: boolean): void {
  noconfirm = val;
}

export function confirm(prompt: string, defaultYes: boolean = true): Promise<boolean> {
  if (noconfirm) return Promise.resolve(defaultYes);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise(resolve => {
    rl.question(`${prompt} ${suffix} `, answer => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}
