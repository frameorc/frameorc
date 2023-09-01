# frameorc builder

**frameorc builder** is a foundational library used to define mini-DSLs based on
what has become popularly known as "builder pattern".

The library is intended for the library authors. If your goal is just building
web applications with frameorc, you do not need to understand this library.

This document is a work in progress.

Let's imagine that ordinary JavaScript property accesses and function calls are
rewritten like this:

```
obj.prop --> get(obj, prop)
f(...args) --> call(f, args)
```

This is similar to how those are defined in the ECMAScript standard, but for the
sake of the scope of the current document, we simplify the notation and
concentrate only on relevant details.

To provide an example of more complex combinations thereof:

```
-- obj.p1.p2.p3 --> get(get(get(obj, p1), p2), p3)
-- f(...a1)(...a2)(...a3) --> call(call(call(f, a1), a2), a3)
-- f(obj1.p1.p2).p3.p4(obj2.p5) -->
     call(get(get(call(f, get(get(obj1, p1), p2)), p3), p4), get(obj2, p5))
```

In that case, the library could be defined in the following pattern-matching notation:

```
builder = f => Builder{Tree=[], Current=[], Func=f}
get = (Builder{Tree=t, Current=c, Func=f}, String s) => Builder{Tree=t, Current=[...c, s], Func=f}
call = (Builder{Tree=t, Current=c, Func=f}, Any[] args) => Builder{Tree=[...t, {c, args}], Current=[], Func=f}
render = (Builder{Tree=t, Current=c, Func=f}, Any[] args) => f(...args, [...t, {c, []}])
```

This allows us to create a builder, and then take its properties and call it with
any arguments any number of times, and in any combinations of property accesses
and calls.

Finally, there is a function `complete` which calls the function stored in the
builder with the data of all property accesses and calls.

