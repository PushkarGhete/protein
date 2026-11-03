import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSeed } from './seed.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
export const storePath = path.join(dataDir, 'store.json');

let chain = Promise.resolve();

export function initStore() {
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(buildSeed(), null, 2));
  }
}

export function read() {
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

export function update(mutator) {
  const run = chain.then(() => {
    const data = read();
    const result = mutator(data);
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
