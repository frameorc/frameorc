import { parse } from 'node:url';
import process from 'node:process';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { WebSocketServer } from 'ws';
import { RpcServer } from '../rpc/server.js';

export function Oneliner() {
  let verbosity = 0;

  let wss = {};
  function createWebSocketServer(pathPrefix, { message, open, close, error, ...options }) {
    return (wss[pathPrefix] ??= {}).server = new WebSocketServer({ ...options, noServer: true })
      .on('connection', function connection(ws, req) {
        open?.(ws, req);
        if (message) ws.on('message', message);
        if (close) ws.on('close', close);        
        if (error) ws.on('error', error);
      });
  }
  function report({ hostname, port }) {
    if (verbosity) console.log(`Listening on http://${hostname}:${port}/`);
  }

  let app = express(), server, closePromise;
  let self;
  return self = {
    static(pathPrefix, localDir, options) {
      if (localDir instanceof URL) localDir = localDir.pathname;
      app.use(pathPrefix, express.static(localDir, options));
      if (verbosity) console.log(`Static on ${pathPrefix} served from ${localDir}`);
      return self;
    },
    rpc(pathPrefix, methods) {
      let group = wss[pathPrefix] ??= {};
      if (group.server && !group.upgrade)
        throw new Error(`Cannot install RPC on path ${pathPrefix} already taken by WebSocket`);
      group.upgrade ??= RpcServer();
      Object.assign(group.upgrade.methods, methods);
      if (!group.server) createWebSocketServer(pathPrefix, {
        open(ws, req) { group.upgrade(ws); },
      });
      return self;
    },
    log(format = 'combined') {
      app.use(morgan(format));
      return self;
    },
    verbose(x) {
      verbosity = x;
      return self;
    },
    on(verb, pathPrefix, handler) {
      app[verb](pathPrefix, handler);
      return self;
    },
    ws(pathPrefix, { message, open, close, error, ...options }) {
      if (wss[pathPrefix]?.server)
        throw new Error(`WebSockets are already served on path ${pathPrefix}`);
      createWebSocketServer(pathPrefix, options);
      return self;
    },
    listen({ hostname = process.env.HOST, port = process.env.PORT, signal, reusePort = true, onListen = report, ...options }={}) {
      return closePromise ??= new Promise(resolve => {
        signal?.addEventListener('abort', () => {
          Promise
            .allSettled(Array.from(Object.values(wss)).map(g => g.upgrade.close()));
        });
        server = app.listen({ host: hostname, port, signal, exclusive: !reusePort, ...options }, () => {
          let addr = server.address();
          onListen?.({ hostname: addr.address, port: addr.port });
        }).on('upgrade', function upgrade(request, socket, head) {
          const { pathname } = parse(request.url);
          let webSocketServer = wss[pathname].server;
          if (!webSocketServer) socket.destroy();
          webSocketServer.handleUpgrade(request, socket, head, function done(ws) {
            webSocketServer.emit('connection', ws, request);
          });
        }).on('close', () => {
          server = undefined;
          closePromise = undefined;
          resolve();
        });
      });
    },
  };
}

