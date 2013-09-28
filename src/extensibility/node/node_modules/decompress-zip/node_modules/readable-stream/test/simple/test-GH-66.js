var assert = require('assert');
var http = require('http');
var net = require('net');
var stream = require('readable-stream');
var PORT = require('../common.js').PORT;

var server = http.createServer(function (req, res) {
  res.end('ok');
  server.close(function() {
    console.log('ok');
  });
}).listen(PORT, 'localhost', function () {
  var client = net.connect(PORT);
  client.write(
    "GET / HTTP/1.1\r\n" +
    "Host: localhost\r\n\r\n")
  client.end();
});
