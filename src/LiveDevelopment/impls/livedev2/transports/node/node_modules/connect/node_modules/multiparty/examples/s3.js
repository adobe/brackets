var http = require('http')
  , util = require('util')
  , multiparty = require('../')
  , knox = require('knox')
  , Batch = require('batch')
  , PORT = process.env.PORT || 27372

var s3Client = knox.createClient({
  secure: false,
  key: process.env.S3_KEY,
  secret: process.env.S3_SECRET,
  bucket: process.env.S3_BUCKET,
});

var server = http.createServer(function(req, res) {
  if (req.url === '/') {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
      '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="path"><br>'+
      '<input type="file" name="upload"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );
  } else if (req.url === '/upload') {
    var headers = {
      'x-amz-acl': 'public-read',
    };
    var form = new multiparty.Form();
    var batch = new Batch();
    batch.push(function(cb) {
      form.on('field', function(name, value) {
        if (name === 'path') {
          var destPath = value;
          if (destPath[0] !== '/') destPath = '/' + destPath;
          cb(null, destPath);
        }
      });
    });
    batch.push(function(cb) {
      form.on('part', function(part) {
        if (! part.filename) return;
        cb(null, part);
      });
    });
    batch.end(function(err, results) {
      if (err) throw err;
      form.removeListener('close', onEnd);
      var destPath = results[0]
        , part = results[1];

      headers['Content-Length'] = part.byteCount;
      s3Client.putStream(part, destPath, headers, function(err, s3Response) {
        if (err) throw err;
        res.statusCode = s3Response.statusCode;
        s3Response.pipe(res);
        console.log("https://s3.amazonaws.com/" + process.env.S3_BUCKET + destPath);
      });
    });
    form.on('close', onEnd);
    form.parse(req);
    
  } else {
    res.writeHead(404, {'content-type': 'text/plain'});
    res.end('404');
  }

  function onEnd() {
    throw new Error("no uploaded file");
  }
});
server.listen(PORT, function() {
  console.info('listening on http://0.0.0.0:'+PORT+'/');
});
