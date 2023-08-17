# frameorc router

frameorc router contains a reactive component that can be used with or without
frameorc DOM.

The router module consists of three parts:
- router component
- hashchange handler
- argument (de)serialisation functions

# `router` component

`router(target, params)`: creates a router. The router is a function. To perform
the route change, it will be called with the parameters `{ name, arg }`.

What does a router do? When the route changes, it finds or loads the component
corresponding to the route, and updates its `target` with the visual built by
that component.

`target` is a setter function, such as `body`. Any setter should work,
including `Val`s and `Ref`s, as well as the ones created by `attach`ing to
an element or a shadow root.

The event of route change itself is out of the scope of the router and is taken
care of by a handler. To notify the router of the change, it is being called
with the parameters `{ name, arg }`.

For instance, this module provides a function `installOnHash`. If you create a
router, `let r = router(body, ...)` and then call `installOnHash(r)`, then
`installOnHash` will check the current hash part of the browser window location,
parse it into two strings, `name` and `part`, and will call `r({ name, part })`.

## How does a router find the module corresponding to the route?

First, it will check its cache, which is passed in initialisation parameters as
`pages`. If `name` is already in `pages` cache, the entry will be placed into
`target` if the entry is a simple value. Or, if the entry is a function, it will
be called with `(name, arg)` and the result (usually, a DOM tree) will be placed
into the `target`.

If the `name` is not in cache, another parameter, `resolver`, comes into play.
`resolver` is a function that returns a promise. When the promise is resolved,
it will contain a module. Module's `default` export goes into `pages` cache and
then is being used to form a content that is placed into `target`.

You can supply a router with the pre-populated cache, by passing `pages`
parameter filled with component functions, so that it does not try to
load the modules dynamically. This strategy works well with bundlers, when you
import some component modules explicitly and put their render functions into the
cache. Bundlers will join all these modules with the rest of your code, so it
can be loaded as a single file, and no extra requests are made over the network.
However, in the presence of HTTP/2 and HTTP/3 protocols, it may not be that
important.

By default, the `resolver` function imports a module from
`basePath + '/' + name + '.js'`. Where `basePath` is another parameter,
a relative or an absolute URL from which to load modules dynamically. If you
want to preclude all dynamic loading of modules, set `basePath` parameter to
`null` explicitly.

If dynamic loading is precluded and the router is handling the navigation to a
`name` that is not in cache, `notFound` view will be rendered.

If the module has been loaded with an error, `errorView` is being rendered
instead.

If the module is being loaded for longer than `loadingScreenTimeout`,
a placeholder view from `loading` will be rendered in the meantime.

All these parameters are optional and some sane defaults have been provided by
the module.

## `router` parameters

`params` is an object that may contain optional properties:
- `pages`: cache of pages, can contain pre-loaded pages, which can be taken
  from the explicitly imported modules. This works well with bundlers.
- `basePath`: relative to what paths JavaScript modules containing pages
  should be located. By default it is the location of the current document.
  Set it to `null` explicitly to prevent pages being loaded dynamically from
  the imported modules.
- `notFound`: page that is shown when the module could not be loaded. As it
  receives the `name` and `arg` of the page that has failed to be found, it can
  use that information to show the error or a replacement.
- `loading`: a placeholder page that is shown if the page module has been
  loading longer than a certain amount of time,
- `loadingScreenTimeout`: time in milliseconds after which the `loading`
  placeholder page is shown,
- `errorView`: a special view that takes (name, arg, e, retry) arguments.
  While the first two are the same as in any other page, e contains an
  exception that was thrown, and retry is a function that can be called
  to attempt to load the page again,
- `resolver`: an async function that takes a module name and returns a
  promise with the module object.

# `installOnHash` handler

If you create a router, `let r = router(body, ...)` and then call
`installOnHash(r)`, then `installOnHash` will check the current hash part of the
browser window location, parse it into two strings, `name` and `part`, and will
call `r({ name, part })`.

Every time the window location hash changes, it will parse it and call
`r({ name, part })` .

The handler can be stopped using the AbortController/AbortSignal mechanism
that nowadays gains increasing popularity.

```js
const controller = new AbortController();
const signal = controller.signal;
const mainRouter = router(body);
installOnHash(mainRouter, signal);
// some time later
controller.abort();
```

In the above example, `controller.abort()` will make the hash change handler
stop listening for the hash changes and stop calling the router function.


## How is the location parsed?

How is the location parsed into the module name and argument?

Hash-based routes have the following form: `basePath#name#arg`.

For example, in `https://frameorc.github.io/router-example.html#doc/examples/styling#background=orange;text=black`
the `basePath` is `https://frameorc.github.io/router-example.html`. The `name`
after parsing the hash part will be `doc/examples/styling`, and the `arg` is
`background=orange;text=black`.

If you are using the default settings, the module `https://frameorc.github.io/doc/examples/styling`
shall be loaded, its `deafult` export, if it is a function, called as
`default('doc/examples/styling', 'background=orange;text=black')`.

It helps that the module knows the name under which it is loaded, as it can
change its appearance depending on that. In the least, such behaviour is useful
for error pages, but also sub-routers, menus and suchlike can be built upon
that feature.

Please, note that `arg` is passed to the module as-is. It is up to the module
to decode it and to decide what to do with it. Which brings us to the next
section.

# (de)serialisation of arguments

Ultimately, we are dealing with URLs, which are strings, and module arguments
are encoded as parts of them.

But in code, it is useful to work with module arguments as objects with
properties.

To facilitate the translation between the string and object forms of
module arguments, frameorc router provides several helper functions.

Use `p2o` and `o2p` (`o` stands for object, `p` for path), if you prefer the
human-readable form of arguments, like in the above example:
`p2o(background=orange;text=black)` returns
`{ background: "orange", text: "black" }`. However, this form has a limitation,
such that values in the object must only be strings. The programmer must be
careful, as trying to encode objects or numbers will not raise any errors, but
decoding them back and attempting to work with them as objects and numbers again
will cause subtle, hard to detect semantic errors.

`decodeArg` and `encodeArg` do not have that drawback and can correctly deal
with anything that is compatible with JSON. However, the paths in that form are
not human-readable. The programmer also must be careful, as it is very easy to
encode too much data into paths and make them exceedingly long.

