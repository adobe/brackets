var fs = require('fs');
var trycatch = require('../lib/trycatch');

setInterval(function() {
	console.log('Still running.');
}, 1000);

trycatch(function init() {
		one();
	},
	function onerror(err) {
		console.log("This is a scoped error handler!\n", err.stack);
	}
);

function one() {
	setTimeout(two, 5);
}

function two() {
	three();
}

function three() {
	fs.readFile(__filename, function (err, data) {
		console.log(''+data);
		throw new Error("Hellow World");
	});
}


