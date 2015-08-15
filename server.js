var net = require('net');
var spawn = require('child_process').spawn;

var log = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(new Date().toString() + " || ");
  console.log.apply(console, args);
};

var handleError = function(client, child) {
  log('Encoding/decoding failed.');
  child.stdin.pause();
  child.kill();
  client.end('PROCESS_ERROR'); // client should check this isn't the last piece of data sent
};

var handleProcess = function(client, child, processName) {
  var done = false;

  // handle client/process errors
  client.on('error', function() {
    console.log('Client abruptly disconnected');
    child.stdin.pause();
    child.kill();
  });
  child.stdout.on('error', function() { handleError(client, child); });
  child.stdin.on('error', function() {
    if(!done || processName !== 'WAV => MP3')
      handleError(client, child);
  });
  child.on('close', function(code) { code ? handleError(client, child) : client.end(); });

  child.stderr.on('data', function(chunk) {
    done = true;
    console.log('error data', chunk.toString());
  });

  // logging open/close events
  log('OPEN  ' + processName);
  client.on('close', function() {
    process.stdout.write('\n');
    log('CLOSE ' + processName)
  });
};


//- WAV => MP3

var toMP3Server = net.createServer({allowHalfOpen: true}, function(client) {
  // hook up streams
  var child = spawn('lame', ["-q0", "-b320", "--quiet", "-", "-"], { stdio: ['pipe', 'pipe'] });
  client.pipe(child.stdin);
  child.stdout.pipe(client, {end: false});
  handleProcess(client, child, "WAV => MP3");
});

toMP3Server.listen(8000, function() { log('MP3  encoder live on 8000'); });


//- WAV => FLAC

var toFLACServer = net.createServer({allowHalfOpen: true}, function(client) {
  // hook up streams
  var child = spawn('flac', ['-', '--verify', '--best'], { stdio: ['pipe', 'pipe'] });
  client.pipe(child.stdin);
  child.stdout.pipe(client, {end: false});
  handleProcess(client, child, "WAV => FLAC");
});

toFLACServer.listen(8001, function() { log('FLAC encoder live on 8001'); });


// FLAC => WAV

var toWAVServer = net.createServer({allowHalfOpen: true}, function(client) {
  // hook up streams
  var child = spawn('flac', ['-d', '-'], { stdio: ['pipe', 'pipe'] });
  client.pipe(child.stdin);
  child.stdout.pipe(client, {end: false});
  handleProcess(client, child, "FLAC => WAV");
});

toWAVServer.listen(8002, function() { log('FLAC decoder live on 8002'); });


// IDENTIFY

var identifyServer = net.createServer({allowHalfOpen: true}, function(client) {
  var child = spawn('sox', ['--i', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
  client.pipe(child.stdin);
  child.stdout.pipe(client, {end: false});
  handleProcess(client, child, "FILE => INFO");
});

identifyServer.listen(8003, function() { log('ID server live on 8003'); });