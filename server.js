var net = require('net');
var spawn = require('child_process').spawn;


// WAV => MP3

var toMP3Server = net.createServer(function(c) {
  console.log('BEGIN WAV => MP3');

  encoder = spawn('lame', ["-f", "-b320", "-", "-"], { stdio: ['pipe', 'pipe'] });
  c.pipe(encoder.stdin);
  encoder.stdout.pipe(c);

  num = 0;

  c.on('end', function() { console.log('END   WAV => MP3'); });
  c.on('data', function(chunk) {
    num += chunk.length;
    console.log((num/1048576).toFixed(2)+'MB read');
  });
});

toMP3Server.listen(8000, function() {
  console.log('MP3 encoder live on 8000');
});


// WAV => FLAC

var toFLACServer = net.createServer(function(c) {
  console.log('BEGIN WAV => FLAC');

  encoder = spawn('flac', ['-'], { stdio: ['pipe', 'pipe'] });
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
  console.log('FLAC encoder live on 8001');
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
  console.log('FLAC decoder live on 8002');
});