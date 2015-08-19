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
  client.destroy();
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



// HTTP SERVER

var express = require('express');
var multer = require('multer');
var http = require('http');
var winston = require('winston');
var onFinished = require('on-finished');
var fs = require('fs');


winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: true
});

var app = express();

var CONVERSION_TIMEOUT = 1800000;

app.post(function (req, res, next) {
  res.connection.setTimeout(CONVERSION_TIMEOUT);
  next();
});

app.set('port', 8010);

var storage = multer.diskStorage({
  filename: function(req, file, cb) {
    return cb(null, Date.now()+'-'+file.originalname);
  }
});

var upload = multer({storage: storage});
app.use(upload.single('file'));

app.post('/wav-to-mp3', function(req, res) {
  winston.info('WAV => MP3', req.file.originalname);
  var topath = req.file.path.replace('.wav', '.mp3');
  var child = spawn('lame', ["-q0", "-b320", "--quiet", req.file.path, topath]);
  child.on('close', function(code) {
    winston.info('WAV => MP3 done', req.file.originalname, code);
    if (code) {
      res.status(422).send('Failure');
    }
    else {
      res.sendFile(topath);
    }
    onFinished(res, function() {
      fs.unlink(req.file.path);
      fs.unlink(topath);
    });
  });
});

app.post('/wav-to-flac', function(req, res) {
  winston.info('WAV => FLAC', req.file.originalname);
  var topath = req.file.path.replace('.wav', '.flac');
  var child = spawn('flac', [req.file.path, '--verify', '--best', '-o', topath]);
  child.on('close', function(code) {
    winston.info('WAV => FLAC done', req.file.originalname, code);
    if (code) {
      res.status(422).send('Failure');
    }
    else {
      res.sendFile(topath);
    }
    onFinished(res, function() {
      fs.unlink(req.file.path);
      fs.unlink(topath);
    });
  });
});

app.post('/flac-to-wav', function(req, res) {
  winston.info('FLAC => WAV begin', req.file.originalname);
  var topath = req.file.path.replace('.flac', '.wav');
  var child = spawn('flac', [req.file.path, '-d', '-o', topath]);
  child.on('close', function(code) {
    winston.info('FLAC => WAV done', req.file.originalname);
    if (code) {
      res.status(422).send('Failure');
    }
    else {
      res.sendFile(topath);
    }
    onFinished(res, function() {
      fs.unlink(req.file.path);
      fs.unlink(topath);
    });
  });
});

app.all('*', function(req, res) {
  res.status(404).send('Not found');
});

http.createServer(app).listen(8010, function() {
  winston.info('HTTP server live on 8010');
});