const ORIGINAL = Symbol();

export function inOrder(f) {
  const result = (next, ...args) => { f(...args); next(...args); };
  result[ORIGINAL] = f;
  return result;
}

export function postOrder(f) {
  const result = (next, ...args) => { next(...args); f(...args); };
  result[ORIGINAL] = f;
  return result;
}

export function Chain() {
  let handlersMap = new Map(), handlers;
  function makeNext(pos = 0, hs = handlers ??= Array.from(handlersMap.values())) {
    return (...args) => hs[pos]?.(makeNext(pos+1, hs), ...args);
  }
  const trigger = (...args) => makeNext()(...args);
  const change = func => (...hs) => {
    for (let h of hs) func(h);
    handlers = undefined;
    return trigger;
  };
  return Object.assign(trigger, {
    on: change(h => handlersMap.set(h, inOrder(h))),
    add: change(h => handlersMap.set(h[ORIGINAL] ?? h, h)),
    delete: change(h => handlersMap.delete(h[ORIGINAL] ?? h)),
  });
}

export function rVal(v) {
  return Chain().add((next, ...args) => {
    if (args.length > 0) next(v = (args.length === 1) ? args[0] : args);
    return v;
  });
}

export function rRef(obj, name) {
  return Chain().add((next, ...args) => {
    if (args.length > 0) next(obj[name] = (args.length === 1) ? args[0] : args);
    return obj[name];
  });
}

