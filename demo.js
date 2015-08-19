var net = require('net');
var fs = require('fs');
var HOST = '127.0.0.1';
//var HOST = '192.168.59.103';

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

//PORT = 8003;
//ext = 'txt';

fileStream = fs.createReadStream(process.argv[2]);
outputFilename = "output.wav";
//data = '';
//client = new net.Socket();
//
//var endBuffer = new Buffer(0);
//var errorString = 'PROCESS_ERROR';
//var errorBuffer = JSON.stringify(new Buffer(errorString).toJSON());
//
//client.connect(PORT, HOST, function() {
//  fileStream.pipe(client).pipe(writeStream);
//  client.on('error', function() {
//    console.log('Client stream errored.');
//  });
//  client.on('data', function(chunk) {
//    endBuffer = Buffer.concat([endBuffer, chunk]);
//    if(endBuffer.length > errorString.length) {
//      endBuffer = endBuffer.slice(endBuffer.length-errorString.length)
//    }
//  });
//  client.on('close', function() {
//    console.log('client closed');
//    if(errorBuffer === JSON.stringify(endBuffer.toJSON())) {
//      console.log('Process failed.')
//    }
//  });
//});

var request = require('request');

var url = 'http://'+HOST+':'+8010+'/wav-to-mp3';

var req = request.post({
  url: url,
  formData: {
    'file': fileStream
  }
});

req.on('response', function(response) {
  if(response.statusCode === 200) {
    var writeStream = fs.createWriteStream(outputFilename);
    req.pipe(writeStream);
  }
  else {
    console.log('failed?', response.statusCode);
  }
});
