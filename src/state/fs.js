import { readFile, writeFile, rename } from 'node:fs/promises';
import { State as State_ } from './base.js';

export async function State(path, interval) {
  return await State_({
    interval,
    async write(self) {
      await writeFile(path + '.tmp', JSON.stringify(self.data));
      await rename(path + '.tmp', path);
    },
    async read(self) {
      try {
        self.data = JSON.parse(await readFile(path));
      } catch (e) {
        if (e.errno !== -2) throw e;
      }
    },
  });
}

