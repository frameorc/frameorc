import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { RpcServer } from './lib/rpc/server.js';

const app = express();
app.use(express.static('.'));
const server = app.listen({ host: '127.0.0.1', port: 8080 });
const wss = new WebSocketServer({ server });
const rpc = RpcServer();

rpc.methods.plus = function plus(a, b) { return { result: a + b, sid: this.sid }; }
rpc.methods.sid = function sid(id) {
  console.log('sid', id);
  this.onClose = () => console.log(`Disconnected ${this.connData.hostname}:${this.connData.port}`);
  return this.sid = id;
}

wss.on('connection', function connection(ws, req) {
  let instance = rpc(ws);
  instance.connData = { hostname: req.socket.remoteAddress, port: req.socket.remotePort };
  console.log(`Connected from ${instance.connData.hostname}:${instance.connData.port}`);
});

