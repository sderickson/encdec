var net = require('net');
var spawn = require('child_process').spawn;

log = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(new Date().toString() + " || ");
  console.log.apply(console, args);
};

handleError = function(client) {
  log('Encoding/decoding failed.');
  client.end('PROCESS_ERROR');
};

// WAV => MP3

var toMP3Server = net.createServer({allowHalfOpen: true}, function(client) {
  // hook up streams
  var encoder = spawn('lame', ["-q0", "-b320", "-", "-"], { stdio: ['pipe', 'pipe'] });
  client.pipe(encoder.stdin);
  encoder.stdout.pipe(client, {end: false});

  // progress logging
  var dataSize = 0;
  client.on('data', function(chunk) {
    dataSize += chunk.length;
    process.stdout.write(' '+(dataSize/1048576).toFixed(2)+'MB read\r');
    //if(dataSize > 1000000) { encoder.kill(); } // testing
  });

  // handle client/process errors
  client.on('error', function() { console.log('Client abruptly disconnected'); });
  encoder.stdout.on('error', function() { handleError(client); });
  encoder.stdin.on('error', function() { handleError(client); });
  encoder.on('close', function(code) { code ? handleError(client) : client.end(); });

  // logging open/close events
  log('OPEN  WAV => MP3');
  client.on('close', function() {
    process.stdout.write('\n');
    log('CLOSE WAV => MP3')
  });
});

toMP3Server.listen(8000, function() { log('MP3 encoder live on 8000'); });


// WAV => FLAC

var toFLACServer = net.createServer(function(c) {
  console.log('BEGIN WAV => FLAC');

  encoder = spawn('flac', ['-', '--verify', '--best'], { stdio: ['pipe', 'pipe'] });
  c.pipe(encoder.stdin);
  encoder.stdout.pipe(c);

  num = 0;

  c.on('end', function() { console.log('END   WAV => FLAC'); });
  c.on('data', function(chunk) {
    num += chunk.length;
    console.log((num/1048576).toFixed(2)+'MB read');
  });
});

toFLACServer.listen(8001, function() {
  log('FLAC encoder live on 8001');
});


// FLAC => WAV

var toWAVServer = net.createServer(function(c) {
  console.log('BEGIN FLAC => WAV');

  encoder = spawn('flac', ['-d', '-'], { stdio: ['pipe', 'pipe'] });
  c.pipe(encoder.stdin);
  encoder.stdout.pipe(c);

  num = 0;

  c.on('end', function() { console.log('END   FLAC => WAV'); });
  c.on('data', function(chunk) {
    num += chunk.length;
    console.log((num/1048576).toFixed(2)+'MB read');
  });
});

toWAVServer.listen(8002, function() {
  log('FLAC decoder live on 8002');
});