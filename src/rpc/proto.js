import { addExtension, encode } from "./pack.js";
import { decode } from "./unpack.js";

const INCLUDE_STACK_TRACE = false;

addExtension({
  Class: Error,
  type: 1,
  read: function (e) {
    return e;
  },
  write: function (e) {
    let result = { name: e.name, message: e.message };
    if (INCLUDE_STACK_TRACE) result.stack = e.stack;
    return result;
  },
});

export class RpcError extends Error {
  constructor(base, ...args) {
    super(...args);
    this.name = "RpcError";
    this.message = base?.message ?? '';
    if (base?.stack) this.stack = "RpcError/" + base.stack;
  }
}

export function Proto(send, methodsBag) {
  let handlers = {};
  let counter = 0;
  async function process(ctx, data /* : ArrayBuffer */) {
    try {
      data = decode(new Uint8Array(data));
      // message ::= { call, from, args } | { to, res|err }
      if ('to' in data) handlers[data.to]?.(data);
      else if ('call' in data && Array.isArray(data.args)) {
        let response = {}, m = methodsBag.methods[data.call];
        if (typeof m === "function") {
          try { response.res = await m.apply(ctx, data.args); }
          catch (e) { console.error(e); response.err = e; }
        } else {
          response.err = new Error('Method "' + data.call + '" is not defined');
        }
        if ('from' in data) {
          response.to = data.from;
          send(encode(response));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  function call(target, ...args) {
    return new Promise((resolve, reject) => {
      let from = ++counter;
      handlers[from] = (v) => {
        ('err' in v) ? reject(new RpcError(v.err)) : resolve(v.res);
        delete handlers[from];
      };
      send(encode({ call: target, from, args }));
    });
  }
  function cast(target, ...args) {
    return send(encode({ call: target, args }));
  }
  function abort(e) {
    for (let i in handlers) {
      try { handlers[i]({ err: e }); }
      catch (e) { console.error(e); }
    }
  }
  return { process, cast, call, abort };
}

