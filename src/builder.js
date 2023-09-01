const FRAMEORC_BUILDER = Symbol('FRAMEORC_BUILDER');

export function isBuilder(f) {
  return Object.hasOwn(f, FRAMEORC_BUILDER);
}

function builder(f) {
  f[FRAMEORC_BUILDER] = true;
  return f;
}

const isTemplateCall = args =>
  Array.isArray(args[0]) && Object.hasOwn(args[0], 'raw');

function mixWithTemplate(args) {
  let i = 0, result = [];
  for (let part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
}

export function Builder(effect, tasks=[], names=[]) {
  return new Proxy(builder((...args) => {
    if (args[0] === FRAMEORC_BUILDER)
      return effect([...tasks, { names, args: [] }], ...args.slice(1));
    let templateCall = isTemplateCall(args);
    if (templateCall) args = mixWithTemplate(args);
    let task = { names, args, templateCall };
    return Builder(effect, [...tasks, task], []);
  }), {
    get: (_object, name, _proxy) => Builder(effect, tasks, [...names, name]),
  });
}

export function launch(construct, ...args) {
  return construct(FRAMEORC_BUILDER, ...args);
}

