import { Proto } from "./proto.js";
import { Chain, rVal } from "../chain.js";

const normUrl = (s) => {
  let u = new URL(s, globalThis.document?.location ?? s);
  if (u.procotol === "https") u.protocol = "wss";
  if (u.protocol !== "wss") u.protocol = "ws";
  return u.toString();
};

const EMPTY = new Uint8Array(0);

export function genKey(len=32) {
  return btoa(
    String.fromCharCode.apply(String,
      crypto.getRandomValues(new Uint8Array(len))));
}

globalThis.localStorage ??= {};

export function assignUid(client, key, remoteMethod, len=32) {
  client.isOpen.on(async (state) => {
    if (state)
      await client.call(remoteMethod, localStorage[key] ??= genKey(len));
  });
}

export function RpcClient(url, PULSE = 60_000) {
  // PULSE is the minimum throughput. The default is one frame per minute.
  // 2 minutes without communication will close the socket.

  url = normUrl(url);
  let ws, connPromise;

  // the keep-alive mechanism allows the client to discover
  // a half-closed TCP socket using only the application layer API
  // and close it if there is no communication with the server
  // within 2*PULSE time interval
  let to;
  function kick(retry = 0) {
    clearTimeout(to);
    if (ws.readyState === WebSocket.OPEN) {
      if (retry < 2) {
        to = setTimeout(kick, PULSE, retry + 1);
        if (retry !== 0) ws.send(EMPTY);
      } else {
        // console.log('closing the websocket due to communication timeout');
        // NB. that on a half-closed TCP socket the browser will take about
        // one minute to proceed
        ws.close(4000, "Server communication timeout");
        // thus, manually reset the state
        handleClosing(ws, undefined);
      }
    }
  }

  function send(data) {
    if (ws.readyState === WebSocket.OPEN) {
      kick();
      ws.send(data);
    }
  }
  const self = { methods: {} };
  const { process, cast, call, abort } = Proto(send, self/*.methods*/);

  function handleClosing(ws, e) {
    // take care to avoid race conditions with stale websockets
    ws.onclose = null;
    connPromise = undefined;
    clearTimeout(to);
    self.isOpen?.(false);
    self.onClose?.();
    closePromiseResolve?.();
    abort(e);
  }

  let closePromiseResolve, closePromise = Promise.resolve();

  function connect() {
    return connPromise ??= new Promise((resolve, reject) => {
      self.isOpen?.(undefined); // connecting...
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      ws.onopen = async (e) => {
        // the strange order of calls in the next three lines guarantees that
        // the preflight RPC calls happening in isOpen will go before any
        // standard calls
        connPromise = Promise.resolve(ws);
        closePromise = new Promise(ok => closePromiseResolve = ok);
        self.isOpen?.(true);
        resolve(ws);
        kick();
      };
      ws.onclose = async (e) => {
        reject(e);
        handleClosing(ws, e);
      };
      ws.onmessage = (e) => {
        kick();
        if (e.data?.byteLength > 0) process(self, e.data);
      };
      ws.onerror = (e) => {
        reject(e.error);
      };
    });
  }

  return Object.assign(self, {
    isOpen: rVal(false),
    onClose: Chain(),
    connect,
    close() {
      ws?.close();
      return closePromise;
    },
    cast: (target, ...args) => connect().then((ws) => cast(target, ...args)),
    call: (target, ...args) => connect().then((ws) => call(target, ...args)),
  });
}

