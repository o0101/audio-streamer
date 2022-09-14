import afs from 'node:fs/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import https from 'https';

import express from 'express';
import WebRTC from '@koush/wrtc';
import WebSockets from 'ws';

let app;


addHandlers();
startServer();

function addHandlers() {
  app = express();
  app.use(express.static(path.resolve('src', 'client')));
}

async function startServer() {
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
  console.log({secure});
  const protocol = secure ? https : http;
  const server = protocol.createServer.apply(protocol, secure ? [secure_options, app] : [app]);

  let resolve, reject;

  const startup = new Promise((res, rej) => (resolve = res, reject = rej));

  server.listen(PORT, err => {
    if ( err ) {
      console.error('Server start error', err);
      reject();
      throw err;
    }
    console.info({serverUp:{port:PORT, at:new Date}});
    resolve();
  });

  await startup;

  return server;
}

