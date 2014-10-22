var assert = require('assert');
var http = require('http');
var net = require('net');
var multiparty = require('../../');

var client;
var server = http.createServer(function (req, res) {
  var form = new multiparty.Form({maxFields: 1});
  form.on('aborted', function () {
    throw new Error("did not expect aborted");
  });
  var first = true;
  form.on('error', function (err) {
    assert.ok(first);
    first = false;
    client.end();
    assert.ok(/maxFields/.test(err.message));
    server.close();
  });
  form.on('end', function () {
    throw new Error('Unexpected "end" event');
  });
  form.parse(req);
});
server.listen(function() {
  client = net.connect(server.address().port);

  client.write("POST /upload HTTP/1.1\r\n" +
    "Content-Length: 728\r\n" +
    "Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "Content-Disposition: form-data; name=\"title\"\r\n" +
    "\r\n" +
    "foofoo" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "Content-Disposition: form-data; name=\"upload\"; filename=\"blah1.txt\"\r\n" +
    "Content-Type: text/plain\r\n" +
    "\r\n" +
    "hi1\r\n" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n");
});
