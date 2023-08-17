// ROUTE ARGUMENT (DE)SERIALISATION
// routes are strings, but we would like to treat them as objects in our code

// In case we are changing the route parameters, represented as an object,
// modern JavaScript has convenient syntax: `patchArg(a, b) = {...a, ...b}`

// Two approaches in representing the object-like route as a string:
// - human-readable (path <-> object), but parameters can only be a simple
//   dictionary of strings 
export const p2o = s => s ? Object.fromEntries(s.split(';').map(p => p.split('=').map(c => decodeURIComponent(c)))) : ({});
export const o2p = o => Object.entries(o).map(e => e.map(c => encodeURIComponent(c)).join('=')).join(';');
// - not human-readable, but parameters can contain complex data structures
export const decodeArg = s => s ? JSON.parse(atob(s)) : ({});
export const encodeArg = o => btoa(JSON.stringify(o));

export const hrRoute = f => ({ arg, ...rest }) => f(p2o(arg), rest);
export const bRoute = f => ({ arg, ...rest }) => f(decodeArg(arg), rest);

// ROUTER CODE

/**
  `router(target, params)`
  
  Create a router that later can be called as a function with parameters
  `{ name, arg }`. The function of the router is to update its `target`
  by loading and caching modules (defined by `name`, `basePath` and `resolver`),
  requesting the modules to render the content (by calling their `default`
  function with `name` and `arg` parameters), handling errors and displaying
  error interfaces, handling delays in module loading, and avoiding race
  conditions in interface updates.

  `target` is a setter function, such as `body`. Any setter should work,
  including `Val`s and `Ref`s, as well as the ones created by `attach`ing to
  an element or a shadow root.

  `params` is an object that may contain optional parameters:
  - `pages`: cache of pages, can contain pre-loaded pages, which can be taken
    from the explicitly imported modules. This works well with bundlers.
  - `basePath`: relative to what paths JavaScript modules containing pages 
    should be located. By default it is the location of the current document.
    Set it to `null` explicitly to prevent pages being loaded dynamically from
    the imported modules.
  - `notFound`: page that is shown when the module could not be loaded. As it
    receives `name` and `arg` of the page that has failed to be found, it can
    use that information to show the error or a replacement.
  - `loading`: a placeholder page that is shown if the page module has been
    loading longer than a certain amount of time,
  - `loadingScreenTimeout`: time in milliseconds after which the `loading`
    placeholder page is shown,
  - `errorView`: a special view that takes {name, arg, e, retry} arguments.
    While the first two are the same as in any other page, e contains an
    exception that was thrown, and retry is a function that can be called
    to attempt to load the page again,
  - `resolver`: an async function that takes a module name and returns a
    promise with the module object.
**/
export function router(target, params) {
  let {
    pages = {},
    basePath = new URL('./', document.location).href,
    notFound = ({ name, arg }) => [name, ' not found'],
    loading = ({ name, arg }) => ['Loading...'],
    loadingScreenTimeout = 150,
    errorView = ({ name, arg, e, retry=update }) => ['Error: ', e],
    resolver = basePath == null ? null : async (name) => {
      let res = await import(basePath + name + '.js');
      // delay/race condition test:
      // await new Promise(ok => setTimeout(ok, 5000));
      return res;
    },
  } = params;

  let curOp = { target }; // current loading request, can be cancelled

  async function getModule({ name, arg }) {
    let mod = pages[name];
    if (mod !== undefined) return mod;
    if (resolver == null) return notFound;

    let to = setTimeout(
      () => curOp.target?.(loading({ name, arg })),
      loadingScreenTimeout);
    try {
      return pages[name] = (await resolver(name)).default;        
    } finally {
      clearTimeout(to);
    }
  }

  async function update({ name, arg }) {
    curOp.target = null; curOp = { target };
    try {
      let mod = await getModule({ name, arg });
      curOp.target?.(typeof mod === 'function' ? mod({ name, arg }) : mod);
    } catch(e) {
      console.error(e);
      curOp.target?.(errorView({ name, arg, e }));
    }
  }
  
  return update;
}

// SPECIFIC ROUTERS

// Hash-based routes have the following form: basePath#modulePath#args
// For example, https://frameorc.github.io/examples/router/#doc/examples/styling#background=orange;text=black
// - The module doc/examples/styling.js will be located and loaded
// - Its default export function will be called with 'doc/examples/styling'
//   and unparsed arguments 'background=orange;text=black', which can then be
//   decoded with p2o function.
// If the arguments change, the function will be called again. Use the fact that
// modules are singletons and module-level variables persist.

function locateByHash() {
  let hash = location.hash.slice(1), idx = hash.indexOf('#');
  if (idx === -1) idx = hash.length;
  return { name: hash.slice(0, idx), arg: hash.slice(idx+1), };
}

/**
  `installOnHash(router, signal)`
  
  connects the router to the `window.location.hash`
  
  - `router`: result of a router function
  - `signal`: an abort signal which makes the router stop listening on
    `hashchange` events in the current window.
**/
export function installOnHash(router, signal) {
  let update = () => router(locateByHash());
  addEventListener('hashchange', update);
  signal?.addEventListener('abort', () =>
    removeEventListener('hashchange', update));
  update();
}

