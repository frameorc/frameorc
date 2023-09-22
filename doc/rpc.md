# frameorc rpc

frameorc rpc is a library that makes client (usually, a browser) and server work
together as seamlessly as possible.

# client

To use the library on the client, import `RpcClient` from `rpc/client.js`.
Construct an instance of rpc client providing it a WebSocket URL and,
optionally, a pulse parameter. If the `pulse` is provided, it must match the value
on the server. By default, the `pulse` is 60 seconds. If there is no communication
within a single `pulse` interval, the client will ping the server. If there is
still no communication for 2*pulse time in total, it will detect the fact that
there is no connection.

`.isOpen` is a reactive value container. It holds the `false` value when
there is no connection, `undefined` when the client is attempting to connect,
and `true` when connected.

See [frameorc chain](chain.md) library documentation for a more detailed
explanation of how reactive value containers work. Generally, it means that you
can read the value and install handers for its assignment, in our case, when the
library detects changes in the state of the connection.

`.connect()` connects to the server and returns the promise which is
resolved when the connection is established. It is safe to call `.connect()`
multiple times in a row, as it will return the same promise. If the client is
already connected to the server, `.connect()` immediately returns the resolved
promise.

`.close()` closes the connection.

# the common between the client and the server

The core of the protocol and the library is made symmetrical. There is a 
difference between the server and the client in that the former is waiting for
the connections and the latter connects, but as soon as the connection is
established, the library works the same.

This section describes the details that are the same on the client and the
server. We will use the term peer to designate both the client and the server
after the connection between them has been established.

First of all, both have the property `methods`. It is an object with string keys
corresponding to the function values. These are the published methods the peers
can call from the other side.

If `conn` is a variable referring to the rpc connection, to call a method of a
peer, the code is `let result = await conn.call('method name', ...args)`.

Sometimes, when the goal is just to notify the peer about some event, and its
response is not required, `cast` is used: `conn.cast('event', ...args)`.

# The specifics of the client

The specifics of the client is that if the connection to the server has not
been previously established, or is currently lost, it will attempt to connect
upon the execution of `call` and `cast`.

By installing the `.isOpen.on((state) => state === true && ...)` handler on the
client, one can perform some actions before the awaiting `call`s are executed. For
example, that can be a preflight authentication request. The most frequent case
is to establish the client ID. A library function `assignUid` is provided on the
client to perform that task.

`assignUid(client, key, remoteMethod, len=32)` checks localStorage for the `key`,
if it is absent, generates a new random one consisting of `len` bytes, and
records it in the localStorage. Then, it uses that key to authenticate the
client to the server. To do that, it calls `remoteMethod` and passes the value
of the client identifier.


# server

There are multiple implementations of WebSockets in server environments. In
node.js, the most widespread is the `ws` npm package, which provides the interface
which is very close to the browser. In Deno, the decision had been made to adhere to
the browser WebSocket API as closely as possible. Bun, if you import the `ws` module,
does not use the one from npm, but stealthily replaces it with its own internal
implementation. That may come as a surprise to the unwitting user.

There is another API for WebSockets, provided for node.js by the high-speed
`uWebSockets.js` (`uWS`) library. Bun under the hood uses parts of it.

In its present state, frameorc rpc/server.js works with the first type of the
API. When you have successfully performed an upgrade request and have a WebSocket
object in your server code, you can use it with frameorc rpc/server module.

To do so, and before you are dealing with any websockets, construct an
`RpcServer` object. `RpcServer` is a function that takes one optional argument,
the pulse time, with the same semantics as described in the client section of
this document. Server does not send any data to clients to check if they are
alive. In frameorc rpc, this task is reserved to the client, which is programmed
to do so diligently. In absence of the real data, such as method calls and
return values, the client periodically sends a zero-length data packet to ensure
the connection is there. If there is nothing from the client within 2*pulse time
interval, the client is considered disconnected.

`RpcServer` returns a function `upgrade`. When you call `upgrade` on your
websocket, it is ready to respond to method calls from the client. In the
previous section, it was explained that the methods are stored in the `.methods`
property of the `RpcServer` instance.

Apart from `.methods`, `RpcServer` instance has `.close()`, `.all` Set containing
all the connected clients, and optionally, `.onOpen(instance)` and
`.onClose(instance)`, which are only called when defined.

The instance is an object corresponding to the connected client. It is passed to
`.onOpen` and `.onClose` when they are defined, it is accessible from the `.all`
Set, and in methods called by the client, it is accessible as `this` variable.

The instance has `.cast` and `.call` explained in the common section, `.close`
with the obvious meaning, and optionally `.onClose` which will be called if
defined.

To put it all together, see the following example.

That is what could be done with the RpcServer instance and in methods:

```js
let upgrade = RpcServer();
upgrade.methods = {
  add: function(a, b) {
    return a + b;
  },
  surprise: function() {
    this.cast('updateInterface', { message: 'Surprise!' });
  },
  setName: function(name) {
    this.name = name;
  },
  tellEverybody: function(message) {
    for (client of upgrade.all)
      if (client !== this)
        client.cast('incomingMessage', { message, from: name });
  },
}
upgrade.onOpen = function (instance) {
  instance.cast('updateInterface', { message: 'Welcome to the server!' });
}
```

When you have a WebSocket object, for example, in a `socket` variable, just call
`upgrade(socket)` to make it work.


