import afs from 'node:fs/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import https from 'https';

import express from 'express';
import WebRTC from '@koush/wrtc';
import {WebSocketServer} from 'ws';

let app;


addHandlers();
startServer();

function addHandlers() {
  app = express();
  app.use(express.static(path.resolve('src', 'client')));
}

async function startServer() {
  const sockets = new Set();
  const PORT = Number.isInteger(process.argv[2]) ? parseInt(process.argv[2]) : 8080;
  const SSL_CERTS = process.env.LOCAL_HTTPS ? 'localhost-sslcerts' : 'sslcerts';
  const GO_SECURE = fs.existsSync(path.resolve(os.homedir(), SSL_CERTS, 'privkey.pem'));
  const secure_options = {};

  try {
    const sec = {
      key: fs.readFileSync(path.resolve(os.homedir(), SSL_CERTS, 'privkey.pem')),
      cert: fs.readFileSync(path.resolve(os.homedir(), SSL_CERTS, 'fullchain.pem')),
      ca: fs.existsSync(path.resolve(os.homedir(), SSL_CERTS, 'chain.pem')) ? 
          fs.readFileSync(path.resolve(os.homedir(), SSL_CERTS, 'chain.pem'))
        :
          undefined
    };
    Object.assign(secure_options, sec);
  } catch(e) {
    console.error(e);
    console.warn(`No certs found so will use insecure no SSL.`); 
  }

  const secure = GO_SECURE && secure_options.cert && secure_options.key;
  const protocol = secure ? https : http;
  const httpServer = protocol.createServer.apply(protocol, secure ? [secure_options, app] : [app]);
  const websocketServer = new WebSocketServer({
    server: httpServer,
    perMessageDeflate: false,
  });

  let shuttingDown = false;

  const shutDown = () => {
    if ( shuttingDown ) return;
    shuttingDown = true;
    httpServer.close(() => console.info(`Server closed on SIGINT`));
    sockets.forEach(socket => {
      try { socket.destroy() } catch(e) {
        DEBUG && console.warn(`MAIN SERVER: port ${httpServer_port}, error closing socket`, e)
      }
    });
    process.exit(0);
  };

  httpServer.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  httpServer.on('upgrade', (req, socket, head) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  websocketServer.on('connection', async ws => {
    ws.on('message', async msg => {
      console.log('msg: %s', msg);
    });
    ws.on('error', err => console.warn('WebSocket error', err));
  });

  let resolve, reject;

  const startup = new Promise((res, rej) => (resolve = res, reject = rej));

  httpServer.listen(PORT, err => {
    if ( err ) {
      console.error('Server start error', err);
      reject();
      throw err;
    }
    console.info({serverUp:{port:PORT, at:new Date}});
    resolve();
  });

  await startup;

  return httpServer;
}

