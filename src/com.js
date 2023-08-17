import { attach, c, hook } from './dom.js';

export function Component(f) {
  let cont;
  function create(_, n) {
    cont = attach(n.elm.attachShadow({ mode: "open" }));
    f(cont);
  }
  function destroy(n) {
    cont.stop?.();
  }
  return c[f.name ?? 'Div'](hook.create(create).destroy(destroy));
}

