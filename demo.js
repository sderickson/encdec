var net = require('net');
var fs = require('fs');
var HOST = '127.0.0.1';

if(process.argv.length < 3) {
  console.log("Needs song name as an argument");
  process.exit(1);
}

var PORT;
var ext = process.argv[3] || 'mp3';
if (ext==='mp3') {
  PORT = 8000;
}
else if (ext==='flac') {
  PORT = 8001;
}
else {
  ext = 'wav';
  PORT = 8002;
}

fileStream = fs.createReadStream(process.argv[2]);
outputFilename = "output."+ext;
writeStream = fs.createWriteStream(outputFilename);
data = '';
client = new net.Socket();

var endBuffer = new Buffer(0);
var errorString = 'PROCESS_ERROR';
var errorBuffer = JSON.stringify(new Buffer(errorString).toJSON());

client.connect(PORT, HOST, function() {
  fileStream.pipe(client).pipe(writeStream);
  client.on('error', function() {
    console.log('Client stream errored.');
  });
  client.on('data', function(chunk) {
    endBuffer = Buffer.concat([endBuffer, chunk]);
    if(endBuffer.length > errorString.length) {
      endBuffer = endBuffer.slice(endBuffer.length-errorString.length)
    }
  });
  client.on('close', function() {
    console.log('client closed');
    if(errorBuffer === JSON.stringify(endBuffer.toJSON())) {
      console.log('Process failed.')
    }
  });
});