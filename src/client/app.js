  const wsUri = new URL(location.href);
  wsUri.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(wsUri);
  let counter = 1;

  ws.addEventListener('message', async msg => {
    console.log('client got msg %s', msg);
  });

  ws.addEventListener('error', async err => {
    console.warn('client got error', err);
  });

  setInterval(() => {
    send(`counter: ${counter++}`);
    send({counter});
  }, 1000);

  function send(o) {
    if ( typeof o === 'string' ) {
      ws.send(o);
    } else if ( o instanceof ArrayBuffer ) {
      ws.send(o); 
    } else {
      ws.send(JSON.stringify(o));
    }
  }
