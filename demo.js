net = require('net');
fs = require('fs');
HOST = '127.0.0.1';
PORT = 8001;
if(process.argv.length != 3) {
  console.log("Needs song name as an argument");
  process.exit(1);
}

fileStream = fs.createReadStream(process.argv[2]);
outputFilename = "output.flac";
writeStream = fs.createWriteStream(outputFilename);
data = '';
client = new net.Socket();

client.connect(PORT, HOST, function() {
  console.log('Connected!');
  fileStream.pipe(client);
  client.pipe(writeStream);
  console.log("Streaming to file #{outputFilename}!");
  client.on('end', function() {
    console.log('finished client stream');
  });
  client.on('error', function() {
    console.log('errored client stream');
  });
  writeStream.on('end', function() {
    console.log('finished write stream');
  });
  writeStream.on('error', function() {
    console.log('errored write stream');
  });
  fileStream.on('end', function() {
    console.log('finished file stream');
  });
  fileStream.on('error', function() {
    console.log('errored file stream');
  });
});