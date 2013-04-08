var http = require('http');
var trycatch = require('../lib/trycatch');

http.createServer(function(req, res) {
	console.log('you');
	trycatch(function() {
		setTimeout(function() {
			throw new Error('Baloney!');
		}, 1000);
	}, function(err) {
		res.writeHead(500);
		res.end(err.stack);
	});
}).listen(8000);
