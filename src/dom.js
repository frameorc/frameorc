// frameorc dom, edition 20230715
// MIT License
// (c) 2015­-2023 Michael Lazarev

import { Builder, launch, isBuilder } from './builder.js';
import { rVal, rRef, postOrder } from './chain.js';
import { patch, VNode } from './snabb.js';

// VDOM MODEL

export const Element = VNode;

function append(child, el, ctx) {
  if (child === undefined || child === null || child === false) {}
  else if (Array.isArray(child)) { child.forEach(c => append(c, el, ctx)); }
  else if (typeof child === 'function') {
    if (isBuilder(child)) { launch(child, el, ctx); }
    else { append(child(), el, ctx); }
  } else if (child instanceof VNode) { el.children.push(child); }
  else { el.children.push({ text: String(child) }); }    
}

const kebab = s => s.replaceAll(
    /[A-Z]/g,
    (char, pos) => (pos !== 0 ? '-' : '') + char.toLowerCase()
  ).replace(/^_/, '-');

export const isTemplateCall = args =>
  Array.isArray(args[0]) && Object.hasOwn(args[0], 'raw');

function mixWithTemplate(args) {
  if (!isTemplateCall(args)) return args;
  let i = 0, result = [];
  for (let part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
}

const NS_SVG = 'http://www.w3.org/2000/svg';

export const c = Builder((tasks, parent, ctx={}) => {
  let result = new VNode("div", {}, []);
  for (let { names } of tasks) {
    for (let name of names) {
      if (name.match(/^[A-Z]/)) result.sel = kebab(name);        
      else (result.data.classes ??= new Set()).add(kebab(name));
    }
  }
  // saving/determining namespace
  let prevNamespace = ctx.ns;
  if (result.sel === 'svg') ctx.ns = NS_SVG;
  if (ctx.ns !== undefined) result.data.ns = ctx.ns;
  // adding children
  for (let { args } of tasks)
    for (let child of mixWithTemplate(args))
      append(child, result, ctx);
  // restoring the namespace
  ctx.ns = prevNamespace;
  // operator effect
  parent.children.push(result);
});

export const frag = Builder((tasks, parent, ctx={}) => {
  let result = new VNode(undefined, {}, []);
  // adding children
  for (let { args } of tasks)
    for (let child of mixWithTemplate(args))
      append(child, result, ctx);
  // operator effect
  parent.children.push(result);
});

// OPERATORS

export const unwrap = (x) => (typeof x === 'function') ? unwrap(x()) : x;

function unfoldToString(x) {
    if (Array.isArray(x)) return x.map(unfoldToString).join('');
    if (typeof x === 'function') return unfoldToString(x());
    if (x === undefined) return '';
    return String(x);
}

const argsToString = args => unfoldToString(mixWithTemplate(args));

export function operator(f) {
  return Builder((_, ...args) => f(...args));
}

export const key = (...args) =>
  operator((el, ctx) => el.key = el.data.key = argsToString(args));
export const on = Builder((tasks, el, ctx) => {
  let evts = el.data.on ??= {};
  for (let {names, args} of tasks)
    for (let name of names)
     (evts[name] ??= []).push(...args);
});
export const hook = Builder((tasks, el, ctx) => {
  let hooks = el.data.hook ??= {};
  for (let {names, args} of tasks)
    for (let name of names) {
      let oldHook = hooks[name];
      hooks[name] = (!oldHook && args.length === 1) ? args[0]
        : (...a) => {
          oldHook?.(...a);
          args.forEach(f => f(...a));
        };
    }
});
export const cls = Builder((tasks, el, ctx) => {
  let classes = el.data.classes ??= new Set();
  for (let { names, args } of tasks) {
    if (!args.length || args.some(x => unwrap(x))) {
      names.forEach(n => classes.add(kebab(n)));
    } else {
      names.forEach(n => classes.delete(kebab(n)));
    }    
  }
});
export const prop = Builder((tasks, el, ctx) => {
  let props = el.data.props ??= {};
  for (let {names, args} of tasks)
    for (let name of names)
      props[name] =
        isTemplateCall(args) ? argsToString(args)
        : args.length === 1  ? unwrap(args[0])
                             : args.map(unwrap);
});
export const css = Builder((tasks, el, ctx) => {
  let styles = el.data.style ??= {};
  for (let {names, args} of tasks)
    for (let name of names)
      styles[kebab(name)] = argsToString(args);
});
export const attr = Builder((tasks, el, ctx) => {
  let attrs;
  for (let {names, args} of tasks)
    for (let name of names)
      if (isTemplateCall(args) || false !== (args[0] = unwrap(args[0])))
         (attrs ??= el.data.attrs ??= {})[name] = argsToString(args);
});

// RENDERING

export function throttle(f) {
  let p; return () => (p ??= Promise.resolve().then(() => p = null).then(f));
}

export function attach(el) {
  let vEl, content = [], refresh = throttle(() => {
    let view = new VNode(el.tagName, {}, []);
    view.data.classes = new Set(el.getAttribute?.("class")?.split(" "));
    let ctx = {};
    content.forEach(element => append(element, view, ctx));
    vEl = patch(vEl ?? el, view);
  });
  const refreshHandler = postOrder((v) => { refresh(); return v; });
  let Val = (v) => rVal(v).add(refreshHandler);
  let Ref = (obj, name) => rRef(obj, name).add(refreshHandler);
  return Object.assign((...args) => { // setter only
    content = args;
    return refresh();
  }, { Val, Ref, refresh });
}

export const body = attach(globalThis.document?.body);
export const Val = body.Val;
export const Ref = body.Ref;

