/*jslint strict: false*/
/*global require: false, console: false */

var http = require('http'),
    host = '0.0.0.0',
    port = 9320,
    config;

http.createServer(function (req, res) {

    req.on('end', function () {

        var contents = '500 server error';

        res.writeHead(500, {
            'Content-Type': 'text/plain',
            'Content-Length': contents.length
        });

        res.write(contents, 'utf8');
        res.end();
    });

}).listen(port, host);

console.log('Server running at http://' + host + ':' + port + '/');
