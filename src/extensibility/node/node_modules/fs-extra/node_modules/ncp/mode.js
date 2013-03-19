

var fs = require('fs');

fs.lstat('hahaha', function (err, stats) {
  if (err) throw err;
  var stream = fs.createWriteStream('laull', {
    mode: stats.mode
  });
  stream.on('end', function () {
    if (err) throw err;
    fs.lstat('laull', function (err, stats2) {
      if (err) throw err;
      console.dir(stats2);
    });
  });
  stream.write('OMG LULZ OMG HI\n\n\n');
  stream.end();
});
