{
  const audios = [];
  self.audios = audios;
  const wsUri = new URL(location.href);
  wsUri.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUri.pathname = '/wavechunks1';
  const ws = new WebSocket(wsUri);
  ws.binaryType = 'arraybuffer';
  let counter = 1;
  let playing = false;
  let active = false;

  document.addEventListener('click', () => {
    active = true;
    playNext();
  }, {once:true});

  ws.addEventListener('message', async msg => {
    console.log('client got msg %s', msg);
    const audioBuffer = msg.data;
    const blob = new Blob([audioBuffer], {type: 'audio/wav'});
    const file = new File([blob], +new Date+"test.wav", {type: 'audio/wav'});
    const audio = new Audio(URL.createObjectURL(file));
    console.log(audio);
    audios.push(audio);
    playNext(); 
    audio.addEventListener('ended', () => {
      playing = false;
      playNext();
    });
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

  function playNext() {
    console.log('play next', playing, audios);
    if ( playing || !active ) return;
    if ( audios.length ) {
      playing = true;
      audios.shift().play();
    } else {
      playing = false;
    }
  }
}
