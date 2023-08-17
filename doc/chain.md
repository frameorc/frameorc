# frameorc chain

**frameorc chain** is a foundational library that defines points of call (chains)
to which any number of functions can be dynamically attached and subsequently
detached. There are mechanisms to define the order of execution of such
functions when the chain is called.

The library is intended for the library authors. If your goal is just building
web applications with frameorc, you do not need to understand this library.

This document is a work in progress.

The following is an excerpt from [frameorc dom](dom.md) document.

# reactive chains

`Chain` constructs the chain object. This object:
- can be called as a function with any number of arguments,
- had an `.add`, `.delete` and `.on` methods, which receive one or more
  functions as arguments.

These methods allow to add and remove the functions which will be called
after the chain is called as a function itself.

Multiple functions can be added as such handlers by sequentially calling the
`.add` method: `v.add(f1).add(f2).add(f3)`.
This is the equivalent: `v.add(f1, f2, f3)`

When the chain is called as a function with arguments `...args`, the first
handler is determined (in order of handler addition). Also, the `next` (in that
case, the second handler is determined).

The handler receives its arguments as `(next, ...args)`. `next` is a function
that is called as `next(...args)` and will call the handler following after the
current one called. It is safe to call the `next` function when there are no
handlers left, as such calls will have no effect.

The handler can call the `next` function before, after or in the middle of its\
own code. It has liberty not to call the next function at all, or call it
multiple times — in that case it will be called the same following handler every
time.

The handler can pass `args` to the `next` unchanged, or modify them as
necessary. The normal call is just `next(...args)`. It is the handler's author's
responsibility to catch the errors that may arise during the call of the `next`
function, and to decide whether to `await` on that call or not.

If you don't want to deal with the `next` manually, and the behaviour of your
handler is predictable, there are wrappers available, `inOrder` or `postOrder`.
These will generate the handler from the normal function. `inOrder` will
call `next` after the function, `postOrder` will call `next` and then the
function, allowing it to deal with the effects of all chain handlers installed
after it.

The simpler way of adding a handler is the `.on` method, as it receives the function
that does not have the `next` argument. The call for the next handler is done
automatically, with `inOrder`.

The handler cannot be added twice. If the handler is installed, calls of `.on` 
or `.add` with the same handler are ignored. The results of `inOrder` and
`postOrder` are considered equal to the original function. That means if you
call `v.add(f).add(inOrder(f)).add(postOrder(f))` the result will be the same as
`v.add(f)`. The subsequent calls are ignored.

To delete the handler, use the `.delete` method. If the function is absent, it
does nothing.

As `inOrder` and `postOrder` return a new function every time, you can use the
original function as an argument to `delete` to remove that handler.

# reactive storage

`rVal` is a storage for any value. You can create it as `v = rVal()` to store
`undefined`, or `v = rVal(value)` to store something since the creation.

The value can be obtained by calling `v()` with no arguments.

If you call it with one argument, it counts as an assignment and will replace the
stored value: `v(newValue)`.

If you call it with multiple arguments, an array of them will be stored. For
example, calling `v(1, 2, 3, 4, 5)` is the same as calling `v([1, 2, 3, 4, 5])`.

Reactive storage has all the methods of a reactive chain. Handlers are called
**only as a result of assignment**. They are not called upon a stored value
retrieval. Equality checks are not performed. The assignment of a value that is
already stored still counts as an assignment.

Note that `v([])` is an assignment of an empty array, constructed anew from the
literal every time this code is executed. However, the following are not
assignments, but value retrievals: `v(...[])` or `v.apply(v, [])`.

[frameorc dom](dom.md) uses `rVal` to provide `Val` (see point 35). The `Val`
the dom library provides already has one preinstalled handler that schedules
the DOM update whenever the reactive storage is assigned to.

`rRef` behaves the same way as `rVal`, but is constructed from the object and
the property name. It then retrieves the value and assigns it to the
corresponding property of that object.

