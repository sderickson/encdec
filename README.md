# encdec

## Minimal audio file encoder/decoder node socket server.

Runs LAME and FLAC commands, piping audio files in and out through
the websocket to minimize memory usage.

Dependencies: [node 0.10.x](https://nodejs.org/), [flac](https://xiph.org/flac/index.html), and [lame](http://lame.sourceforge.net/index.php). Once these are available on the command line, this should work.

To run:

`node server.js`

To test:

`node test.js`

To use from another server, see `demo.js`. Currently indicates when the process fails by sending the string 'PROCESS_ERROR', which the client must look for and handle accordingly.

If you'd like to use this, I recommend forking, then editing server.js to use the command line arguments you would like.
