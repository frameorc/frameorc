// frameorc dom, edition 20230901
// MIT License
// (c) 2015­-2023 Michael Lazarev

import Builder from './builder.js';
import { rVal, rRef, postOrder } from './chain.js';
import { patch, VNode } from './snabb.js';

// VDOM MODEL

export const Element = VNode;

function append(child, el, ctx) {
  if (child === undefined || child === null || child === false) {}
  else if (Array.isArray(child)) { child.forEach(c => append(c, el, ctx)); }
  else if (typeof child === 'function') {
    if (Builder.is(child)) { append(Builder.complete(child), el, ctx); }
    else if (operator.is(child)) { child(el, ctx); }
    else { append(child(), el, ctx); }
  } else if (child instanceof VNode) { el.children.push(child); }
  else { el.children.push({ text: String(child) }); }    
}

const appendAll = (collection, view, ctx) => collection.forEach(element =>
  append(element, view, ctx));

const kebab = s => s.replaceAll(
    /[A-Z]/g,
    (char, pos) => (pos !== 0 ? '-' : '') + char.toLowerCase()
  ).replace(/^_/, '-');

const NS_SVG = 'http://www.w3.org/2000/svg';

export const c = Builder(tasks => operator((parent, ctx={}) => {
  const result = new VNode("div", {}, []);
  for (let { names } of tasks) {
    for (let name of names) {
      if (name.match(/^[A-Z]/)) result.sel = kebab(name);        
      else (result.data.classes ??= new Set()).add(kebab(name));
    }
  }
  // saving/determining namespace
  const prevNamespace = ctx.ns;
  if (result.sel === 'svg') ctx.ns = NS_SVG;
  if (ctx.ns !== undefined) result.data.ns = ctx.ns;
  // adding children
  for (let { args } of tasks) appendAll(args, result, ctx);
  // restoring the namespace
  ctx.ns = prevNamespace;
  // operator effect
  parent.children.push(result);
}));

export const frag = Builder(tasks => operator((parent, ctx={}) => {
  const result = new VNode(undefined, {}, []);
  for (let { args } of tasks) appendAll(args, result, ctx);
  parent.children.push(result);
}));

// OPERATORS

const IS_OPERATOR = Symbol('FRAMEORC_OPERATOR');
export function operator(f) {
  f[IS_OPERATOR] = true;
  return f;
}
operator.is = f => Object.hasOwn(f, IS_OPERATOR);

export const unwrap = (x) => (typeof x === 'function') ? unwrap(x()) : x;

function unfoldToString(x) {
    if (Array.isArray(x)) return x.map(unfoldToString).join('');
    if (typeof x === 'function') return unfoldToString(x());
    if (x === undefined) return '';
    return String(x);
}

export const key = (...args) =>
  operator((el, ctx) => el.key = el.data.key = unfoldToString(args));
export const on = Builder(tasks => operator((el, ctx) => {
  const evts = el.data.on ??= {};
  for (let {names, args} of tasks)
    for (let name of names)
     (evts[name] ??= []).push(...args);
}));
export const hook = Builder(tasks => operator((el, ctx) => {
  const hooks = el.data.hook ??= {};
  for (let {names, args} of tasks)
    for (let name of names) {
      let oldHook = hooks[name];
      hooks[name] = (!oldHook && args.length === 1) ? args[0]
        : (...a) => {
          oldHook?.(...a);
          args.forEach(f => f(...a));
        };
    }
}));
export const cls = Builder(tasks => operator((el, ctx) => {
  const classes = el.data.classes ??= new Set();
  for (let { names, args } of tasks) {
    if (!args.length || args.some(x => unwrap(x))) {
      names.forEach(n => classes.add(kebab(n)));
    } else {
      names.forEach(n => classes.delete(kebab(n)));
    }    
  }
}));
export const prop = Builder(tasks => operator((el, ctx) => {
  const props = el.data.props ??= {};
  for (let { names, args, templateCall } of tasks)
    for (let name of names)
      props[name] =
        templateCall ? unfoldToString(args)
        : args.length === 1  ? unwrap(args[0])
                             : args.map(unwrap);
}));
export const css = Builder(tasks => operator((el, ctx) => {
  const styles = el.data.style ??= {};
  for (let { names, args } of tasks)
    for (let name of names)
      styles[kebab(name)] = unfoldToString(args);
}));
export const attr = Builder(tasks => operator((el, ctx) => {
  let attrs;
  for (let { names, args, templateCall } of tasks)
    for (let name of names)
      if (templateCall || ((args[0] = unwrap(args[0])) !== false))
         (attrs ??= el.data.attrs ??= {})[name] = unfoldToString(args);
}));

// RENDERING

export function throttle(f) {
  let p;
  return function throttled() {
    p ??= Promise.resolve().then(() => {
      p = undefined;
      return f();
    });
  }
}

export function attach(el) {
  let content = [], vEl;
  function setContent(...args) {
    content = args;
    return refresh();
  };
  const refresh = throttle(function refreshBase() {
    let view = new VNode(el.tagName, {
      classes: new Set(el.getAttribute?.("class")?.split(" ")),
    }, []);
    appendAll(content, view, { container: setContent });
    vEl = patch(vEl ?? el, view);
  });
  const refreshHandler = postOrder((v) => { refresh(); return v; });
  const Val = (v) => rVal(v).add(refreshHandler);
  const Ref = (obj, name) => rRef(obj, name).add(refreshHandler);
  return Object.assign(setContent, { Val, Ref, refresh });
}

export const body = attach(globalThis.document?.body);
export const Val = body.Val;
export const Ref = body.Ref;

