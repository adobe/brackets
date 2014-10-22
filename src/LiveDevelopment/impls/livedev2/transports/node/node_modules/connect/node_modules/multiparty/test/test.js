var spawn = require('child_process').spawn
  , findit = require('findit')
  , path = require('path')
  , hashish = require('hashish')
  , fs = require('fs')
  , http = require('http')
  , net = require('net')
  , assert = require('assert')
  , multiparty = require('../')
  , mkdirp = require('mkdirp')
  , STANDALONE_PATH = path.join(__dirname, 'standalone')
  , server = http.createServer()
  , PORT = 13532
  , FIXTURE_PATH = path.join(__dirname, 'fixture')
  , TMP_PATH = path.join(__dirname, 'tmp')

mkdirp.sync(TMP_PATH);

describe("fixtures", function() {
  before(function(done) {
    server.listen(PORT, done);
  });
  var fixtures = [];
  findit
    .sync(path.join(FIXTURE_PATH, 'js'))
    .forEach(function(jsPath) {
      if (!/\.js$/.test(jsPath)) return;
      var group = path.basename(jsPath, '.js');
      hashish.forEach(require(jsPath), function(fixture, name) {
        it(group + '/' + name, createTest({
          name    : group + '/' + name,
          fixture : fixture,
        }));
      });
    });
});

describe("standalone", function() {
  findit
    .sync(STANDALONE_PATH)
    .forEach(function(jsPath) {
      if (!/\.js$/.test(jsPath)) return;
      it(path.basename(jsPath, '.js'), function(done) {
        var child = spawn(process.execPath, [jsPath], { stdio: 'inherit' });
        child.on('error', function(err) {
          done(err);
        });
        child.on('exit', function(code) {
          if (code) return done(new Error("exited with code " + code));
          done();
        });
      });
    });
});

function createTest(fixture) {
  var name = fixture.name;
  fixture = fixture.fixture;
  return function(done) {
    uploadFixture(name, function(err, parts) {
      if (err) return done(err);
      fixture.forEach(function(expectedPart, i) {
        var parsedPart = parts[i];
        assert.equal(parsedPart.type, expectedPart.type);
        assert.equal(parsedPart.name, expectedPart.name);

        if (parsedPart.type === 'file') {
          var file = parsedPart.value;
          assert.equal(file.originalFilename, expectedPart.filename);
          if(expectedPart.sha1) assert.strictEqual(file.hash, expectedPart.sha1);
          if(expectedPart.size) assert.strictEqual(file.size, expectedPart.size);
        }
      });
      done();
    });
  };

}

function uploadFixture(name, cb) {
  server.once('request', function(req, res) {
    var parts = [];
    var form = new multiparty.Form({
      autoFields: true,
      autoFiles: true,
    });
    form.uploadDir = TMP_PATH;
    form.hash = "sha1";

    form.on('error', callback);
    form.on('file', function(name, value) {
      parts.push({type: 'file', name: name, value: value});
    });
    form.on('field', function(name, value) {
      parts.push({type: 'field', name: name, value: value});
    });
    form.on('close', function() {
      res.end('OK');
      callback(null, parts);
    });
    form.parse(req);

    function callback() {
      var realCallback = cb;
      cb = function() {};
      realCallback.apply(null, arguments);
    }
  });

  var socket = net.createConnection(PORT);
  var file = fs.createReadStream(FIXTURE_PATH + '/http/' + name);

  file.pipe(socket, {end: false});
  socket.on('data', function () {
    socket.end();
  });
}
