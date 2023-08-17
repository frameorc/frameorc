import { run, bench, group, baseline } from 'mitata';
import { State } from './fs.js';
import { tmpFile, cleanup } from './temp.js';

let s = await State(await tmpFile('data'));

bench('update', () => {
  s.data = '';
});

bench('save', async () => {
  await s.save(0);
});


let res = await run();
let b = {}; res.benchmarks.forEach(x => b[x.name] = 1e9 / x.stats.avg);
console.log();
for (let name in b)
  console.log(name.padEnd(10, '.') + '.' + b[name].toFixed(0).padStart(10, '.') + ' op/s');

await cleanup();

