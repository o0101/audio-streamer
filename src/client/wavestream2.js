{
  const audios = [];
  self.audios = audios;
  const wsUri = new URL(location.href);
  wsUri.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUri.pathname = '/wavestream2';
  let ws;
  const min_sample_duration = 2; // seconds;
  const sample_rate = 44100; // Hz;
  const min_sample_size = min_sample_duration * sample_rate;
  let chunk_size = 2**14;
  let counter = 1;
  let playing = false;
  let active = false;
  let ctx;
  let gain;
  let fetchedData;
  let activeNode;
  let is_reading = false;
  let stopped = true;
  fetchedData = new Float32Array( 0 );

  document.addEventListener('click', () => {
    stopped = false;
    active = true;
    ctx = new AudioContext();
    gain = ctx.createGain();
    gain.gain.value = 0.1;
    gain.connect( ctx.destination );
    ws = new WebSocket(wsUri);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('message', async msg => {
      console.log('client got msg %s', msg.data.length || msg.data.byteLength);
      if ( typeof msg.data === "string" ) {
        console.log(msg.data);
        return;
      }
      const audioBuffer = new Float32Array(msg.data);
      fetchedData = concat(fetchedData, audioBuffer);
      if ( !is_reading && fetchedData.length >= min_sample_size ) {
        readingLoop();
      }
    });
    ws.addEventListener('error', async err => {
      console.warn('client got error', err);
    });
    readingLoop();
  }, {once:true});


  function readingLoop() {
    if ( stopped || fetchedData.length < min_sample_size ) {
      is_reading = false;
      console.log('not playing');
      return;
    }

    is_reading = true;
    console.log('reading');

    const audio_buffer = ctx.createBuffer(
      1, 
      fetchedData.length,
      sample_rate
    );

    try {
      console.log(fetchedData.length);
      audio_buffer.copyToChannel( fetchedData, 0 );

      fetchedData = new Float32Array( 0 );

      activeNode = ctx.createBufferSource();
      activeNode.buffer = audio_buffer;
      // ended not end
      activeNode.addEventListener('ended', () => {
        console.log('node end');
        readingLoop();
      });
      activeNode.connect( gain );
      activeNode.start( 0 );
      console.log('playing');
    } catch(e) {
      console.warn(e);
    }
  }


  function concat( arr1, arr2 ) {
    if( !arr1 || !arr1.length ) {
      return arr2 && arr2.slice();
    }
    if( !arr2 || !arr2.length ) {
      return arr1 && arr1.slice();
    }
    if ( arr1.constructor !== arr2.constructor ) {
      throw new TypeError(`Both arrays to concat need to be of the same type, received: ${arr1} and ${arr2}`);
    }
    const out = new arr1.constructor( arr1.length + arr2.length );
    out.set( arr1 );
    out.set( arr2, arr1.length );
    return out;
  }

  function send(o) {
    if ( typeof o === 'string' ) {
      ws.send(o);
    } else if ( o instanceof ArrayBuffer ) {
      ws.send(o); 
    } else {
      ws.send(JSON.stringify(o));
    }
  }

  function startPlaying() {
    console.log('start playing', playing, audios);
    if ( playing || !active ) return;
    console.warn(`startPlaying not implemented yet`);
  }
}
