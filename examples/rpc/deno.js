import { serveDir } from "https://deno.land/std@0.192.0/http/file_server.ts";
import { RpcServer } from "../../src/rpc/server.js";

const path = new URL('.', import.meta.url).pathname;
const connect = RpcServer();
connect.methods.plus = function plus(a, b) {
  return { result: a + b, sid: this.sid };
};
connect.methods.sid = function sid(id) {
  console.log('sid', id);
  this.onClose = () =>
    console.log(`Disconnected ${this.connData.hostname}:${this.connData.port}`);
  return this.sid = id;
};

Deno.serve({
    hostname: '127.0.0.1',
    port: 8080,
    onListen(where) {
      // console.log('Ahoy', where);
      console.log('Static is served from', path);
    }
  },
  async function handler(request, { remoteAddr: { hostname, port } }) {
    const rp = new URL(request.url).pathname;
    if (rp === '/api') {
      console.log(`Connected from ${hostname}:${port}`);
      const { socket, response } = Deno.upgradeWebSocket(request, {
        // set explicitly to disable Deno's websocket idle timeout logic
        idleTimeout: 0,
      });
      let instance = connect(socket);
      instance.connData = { hostname, port };
      return response;
    }
    let res = await serveDir(request, {
      fsRoot: path,
      headers: [
        'Cache-control: must-revalidate, max-age=0',
      ]
    });
    try { res.headers.delete('server'); } catch { /* impossible on redirects */ }
    return res;
  }
);

