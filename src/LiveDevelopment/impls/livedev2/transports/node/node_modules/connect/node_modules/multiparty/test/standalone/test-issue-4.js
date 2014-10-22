var http = require('http')
  , multiparty = require('../../')
  , assert = require('assert')
  , superagent = require('superagent')
  , path = require('path')

var server = http.createServer(function(req, res) {
  assert.strictEqual(req.url, '/upload');
  assert.strictEqual(req.method, 'POST');

  var form = new multiparty.Form({autoFields:true,autoFiles:true});

  form.on('error', function(err) {
    console.log(err);
  });

  form.on('close', function() {
  });

  var fileCount = 0;
  form.on('file', function(name, file) {
    fileCount += 1;
  });

  form.parse(req, function(err, fields, files) {
    var objFileCount = 0;
    for (var file in files) {
      objFileCount += 1;
    }
    // multiparty does NOT try to do intelligent things based on
    // the part name.
    assert.strictEqual(fileCount, 2);
    assert.strictEqual(objFileCount, 1);
    res.end();
  });
});
server.listen(function() {
  var url = 'http://localhost:' + server.address().port + '/upload';
  var req = superagent.post(url);
  req.attach('files[]', fixture('pf1y5.png'), 'SOG2.JPG');
  req.attach('files[]', fixture('binaryfile.tar.gz'), 'BenF364_LIB353.zip');
  req.end(function(err, resp) {
    assert.ifError(err);
    resp.on('end', function() {
      server.close();
    });
  });
});
function fixture(name) {
  return path.join(__dirname, '..', 'fixture', 'file', name)
}
