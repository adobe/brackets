var assert = require('assert');
var http = require('http');
var net = require('net');
var multiparty = require('../../');

var client;
var server = http.createServer(function(req, res) {
  var form = new multiparty.Form();

  form.parse(req, function(err, fieldsTable, filesTable, fieldsList, filesList) {
    if (err) {
      console.error(err.stack);
      return;
    }
    assert.strictEqual(fieldsList.length, 1);
    assert.strictEqual(fieldsList[0].name, "title");
    assert.strictEqual(fieldsList[0].value, "foofoo");
    assert.strictEqual(filesList.length, 4);
    assert.strictEqual(filesList[0].fieldName, "upload");
    assert.strictEqual(filesList[1].fieldName, "upload");
    assert.strictEqual(filesList[2].fieldName, "upload");
    assert.strictEqual(filesList[3].fieldName, "upload");
    res.end();
    client.end();
    server.close();
  });
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
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "Content-Disposition: form-data; name=\"upload\"; filename=\"blah2.txt\"\r\n" +
    "Content-Type: text/plain\r\n" +
    "\r\n" +
    "hi2\r\n" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "Content-Disposition: form-data; name=\"upload\"; filename=\"blah3.txt\"\r\n" +
    "Content-Type: text/plain\r\n" +
    "\r\n" +
    "hi3\r\n" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF\r\n" +
    "Content-Disposition: form-data; name=\"upload\"; filename=\"blah4.txt\"\r\n" +
    "Content-Type: text/plain\r\n" +
    "\r\n" +
    "hi4\r\n" +
    "\r\n" +
    "------WebKitFormBoundaryvfUZhxgsZDO7FXLF--\r\n"
  );
});
