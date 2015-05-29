var net = require('net');
var fs = require('fs');
var HOST = '127.0.0.1';

var errorString = 'PROCESS_ERROR';
var errorBuffer = JSON.stringify(new Buffer(errorString).toJSON());

var success = function(name) { console.log('PASSED', name); };
var failure = function(name) { console.log('----> FAILED', name); };

var test = function (inputFilename, outputFilename, port, succeeds) {
  var name = inputFilename + ' -> ' + outputFilename + ' ' + (succeeds ? 'succeeds' : 'fails');

  var fileStream = fs.createReadStream(inputFilename);
  var writeStream = fs.createWriteStream(outputFilename);
  var conn = new net.Socket();

  conn.connect(port, HOST, function() {
    fileStream.pipe(conn).pipe(writeStream);
    var endBuffer = new Buffer(0);
    conn.on('data', function(chunk) {
      endBuffer = Buffer.concat([endBuffer, chunk]);
      if(endBuffer.length > errorString.length) {
        endBuffer = endBuffer.slice(endBuffer.length-errorString.length)
      }
    });
    conn.on('close', function() {
      if(errorBuffer === JSON.stringify(endBuffer.toJSON())) {
        if(succeeds) { failure(name); }
        else { success(name); }
      }
      else {
        if(succeeds) { success(name); }
        else { failure(name); }
      }
    });
  });
};

test('o.wav', 'test-result-1.mp3', 8000, true);
test('o.wav', 'test-result-2.flac', 8001, true);
test('o.flac', 'test-result-3.wav', 8002, true);
test('o.flac', 'test-result-4.flac', 8001, true); // succeeds apparently, because flac can take flacs

test('o.mp3', 'test-result-5.mp3', 8000, false);
test('o.flac', 'test-result-6.mp3', 8000, false);
test('o.mp3', 'test-result-7.flac', 8001, false);
test('o.wav', 'test-result-8.wav', 8002, false);

test('broken.flac', 'test-result-9.wav', 8002, false); // broken.flac has a single bit removed