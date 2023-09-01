import { Oneliner } from './node.js';

let ac = new AbortController(); setTimeout(() => ac.abort(), 10000);

await Oneliner()
  .verbose(1)
  .log()
  .static('/pub', new URL('./pub', import.meta.url))
  .static('/examples', new URL('../../examples', import.meta.url))
  .static('/', new URL('../../', import.meta.url))
  .rpc('/api', {
    setUid(uid) {
      this.uid = uid;
    },
  })
  .rpc('/api', {
    getUid() {
      return this.uid;
    },
  })
  .listen({ signal: ac.signal }); // HOST, PORT

console.log('end');
