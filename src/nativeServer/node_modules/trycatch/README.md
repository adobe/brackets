trycatch
=======

An asynchronous try catch / exception handler with long stack traces for node.js

Background
----------

See the "Background" from the [long-stack-traces](https://github.com/tlrobinson/long-stack-traces) module.

Install
-------

	npm install trycatch

Basic Example
-------------

	trycatch(function() {
		function f() {
			throw new Error('foo');
		}
		
		setTimeout(f, Math.random()*1000);
		setTimeout(f, Math.random()*1000);
	}, function(err) {
		console.log("This is an asynchronous scoped error handler!\n", err.stack);
	});
	
#### Output

	$ node examples/setTimeout.js 
	This is an asynchronous scoped error handler!
	 Error: foo
	    at Object.f (/path/to/trycatch/examples/setTimeout.js:5:9)
	    at Timer.callback (timers.js:83:39)
	----------------------------------------
	    at setTimeout
	    at /path/to/trycatch/examples/setTimeout.js:8:2
	    at Object.<anonymous> (/path/to/trycatch/examples/setTimeout.js:3:1)
	    at Module._compile (module.js:404:26)
	    at Object..js (module.js:410:10)
	    at Module.load (module.js:336:31)
	This is an asynchronous scoped error handler!
	 Error: foo
	    at Object.f (/path/to/trycatch/examples/setTimeout.js:5:9)
	    at Timer.callback (timers.js:83:39)
	----------------------------------------
	    at setTimeout
	    at /path/to/trycatch/examples/setTimeout.js:9:2
	    at Object.<anonymous> (/path/to/trycatch/examples/setTimeout.js:3:1)
	    at Module._compile (module.js:404:26)
	    at Object..js (module.js:410:10)
	    at Module.load (module.js:336:31)


Returning 500s on Server Request
--------------------------------

	http.createServer(function(req, res) {
		trycatch(function() {
			setTimeout(function() {
				throw new Error('Baloney!');
			}, 1000);
		}, function(err) {
			res.writeHead(500);
			res.end(err.stack);
		});
	}).listen(8000);

Visit http://localhost:8000 and get your 500.