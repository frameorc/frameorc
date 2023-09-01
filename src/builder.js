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

export function Builder(effect) {
  function builder(tasks=[], names=[]) {
    function func(...args) {
      const templateCall = isTemplateCall(args);
      if (templateCall) args = mixWithTemplate(args);
      const task = { names, args, templateCall };
      return builder([...tasks, task], []);
    };
    func[Builder.symbol] = true;
    return new Proxy(func, {
      get: (_object, name, _proxy) => (name === Builder.symbol) ? ({
        effect,
        tasks: [...tasks, { names, args: [], templateCall: false }],
      }) : builder(tasks, [...names, name])
    });
  }
  return builder();
}

export function inspect(construct) {
  return construct[Builder.symbol];
}

export function complete(construct, ...args) {
  const { effect, tasks } = inspect(construct);
  return effect(tasks, ...args);
}

const FRAMEORC_BUILDER = Symbol('FRAMEORC_BUILDER');
Builder.symbol = FRAMEORC_BUILDER;
const isBuilder = f => Object.hasOwn(f, FRAMEORC_BUILDER);
Builder.is = isBuilder;
Builder.complete = complete;
Builder.inspect = inspect;
export default Builder;

