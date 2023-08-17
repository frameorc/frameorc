const FRAMEORC_BUILDER = Symbol('FRAMEORC_BUILDER');

export function isBuilder(f) {
  return Object.hasOwn(f, FRAMEORC_BUILDER);
}

function builder(f) {
  f[FRAMEORC_BUILDER] = true;
  return f;
}

export function Builder(effect, tasks=[], names=[]) {
  return new Proxy(builder((...args) => (args[0] === FRAMEORC_BUILDER)
      ? effect([...tasks, { names, args: [] }], ...args.slice(1))
      : Builder(effect, [...tasks, { names, args }], [])), {
    get: (_object, name, _proxy) => Builder(effect, tasks, [...names, name]),
  });
}

export function launch(construct, ...args) {
  return construct(FRAMEORC_BUILDER, ...args);
}

