var superagent = require('superagent')
  , multiparty = require('../../')
  , http = require('http')

var server = http.createServer(function(req, resp) {
  var form = new multiparty.Form();

  var errCount = 0;
  form.on('error', function(err) {
    errCount += 1;
    resp.end();
  });
  form.on('file', function(name, file) {
  });
  form.on('field', function(name, file) {
  });

  form.parse(req);
});
server.listen(function() {
  var url = 'http://localhost:' + server.address().port + '/'
  var req = superagent.post(url)
  req.set('Content-Type', 'multipart/form-data; boundary=foo')
  req.write('--foo\r\n')
  req.write('Content-filename="foo.txt"\r\n')
  req.write('\r\n')
  req.write('some text here')
  req.write('Content-Disposition: form-data; name="text"; filename="bar.txt"\r\n')
  req.write('\r\n')
  req.write('some more text stuff')
  req.write('\r\n--foo--')
  req.end(function(err, resp) {
    server.close();
  });
});
