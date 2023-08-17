# frameorc state

This is a building block for database functionality. It provides **Durability**.
Atomicity, Consistency and Isolation are left for you to implement yourself, or
to rely on other building blocks.

The data is manipulated in RAM and is saved to persistent storage no later than
the designated amount of time. One can choose whether to continue the flow of a
subroutine relying on a promise that the data will be saved, or to await for a
completion event.

# API

```js
// state.fs.js for filesystem, state.ls.js for LocalStorage
import { State } from 'frameorc/state.fs.js';

// Fetch the data from path, if it exists
let s = await State(path);

// Display the data
console.log(s.data);

// Modify the data
s.data.x = { a: 1, b: 2};
s.data.y = 3;

// Request the data to be saved later, in 1 second
s.save(1000);

// Replace the data
s.data = { c: 4, d: 5 };

// Request the data to be saved immediately and wait until it's done
await s.save(0);
```

# Works in server and browser environments

Server code should work in Node.js, Deno and Bun. `state.fs.js` provides the
filesystem-backed storage.

Client code works with LocalStorage and is provided by `state.ls.js`. LocalStorage
is available in browsers and Deno.


