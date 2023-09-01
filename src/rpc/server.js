import { Proto } from "./proto.js";

const EMPTY = new Uint8Array(0);

export function RpcServer({ PULSE = 60_000 } = {}) {
  function upgrade(socket) {

    // If the client does not send anything within the 2*PULSE interval,
    // the socket will be closed. The client logic makes sure that at least
    // every 60 seconds rpc call data or empty data (ping) will be sent.
    let to;
    function kick(shouldClose) {
      clearTimeout(to);
      if (socket.readyState === 1 /* WebSocket.OPEN */) {
        if (shouldClose) {
          socket.close();
        } else {
          to = setTimeout(kick, 2*PULSE, true);
        }
      }
    }

    function send(data) {
      try {
        kick();
        socket.send(data);
      } catch (e) {
        // there is no need to crash the whole server upon an error in a socket
        console.log("Error while sending the data over the RPC WebSocket");
        console.error(e);
      }
    }

    let closePromiseResolve,
        closePromise = new Promise(ok => closePromiseResolve = ok);
    const { process, cast, call, abort } = Proto(send, upgrade/*.methods*/);
    const instance = {
      close() {
        socket.close();
        return closePromise;
      },
      cast,
      call,
      onClose: undefined,
    };

    socket.binaryType = "arraybuffer";
    let handlers = {
      close(e) {
        clearTimeout(to);
        closePromiseResolve();
        upgrade.all.delete(instance);
        instance.onClose?.(e);
        upgrade.onClose?.(instance, e);
        abort(e);
      },
      error(e) {
        console.error("RPC WebSocket error:", e.type, e.message);
      },
      message(data) {
        kick();
        if (data?.byteLength > 0) {
          process(instance, data);
        } else {
          send(EMPTY); // PONG RESPONSE
        }
      },
    };
    if (typeof socket.on === 'function') {
      for (let name in handlers) socket.on(name, handlers[name]);
    } else {
      let m = handlers.message; handlers.message = (e) => m(e.data);
      for (let name in handlers) socket.addEventListener(name, handlers[name]);
    }
    upgrade.all.add(instance);
    upgrade.onOpen?.(instance);
    kick();

    return instance;
  }

  upgrade.all = new Set();
  upgrade.methods = {};
  upgrade.close = () => {
    return Promise.allSettled(
      Array.from(upgrade.all.values())
        .map((c) => c.close()));
  }
  // .onOpen, .onClose
  return upgrade;
}

