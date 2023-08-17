import { State as State_ } from './base.js';

export async function State(path, interval) {
  return await State_({
    interval,
    write(self) {
      localStorage.setItem(path, JSON.stringify(self.data));
    },
    read(self) {
      let res = localStorage.getItem(path);
      if (res !== undefined) self.data = JSON.parse(res);
    },
  });
}

