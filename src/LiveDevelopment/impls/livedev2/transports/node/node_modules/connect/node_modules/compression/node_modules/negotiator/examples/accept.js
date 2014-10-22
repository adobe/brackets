(function() {
  var Negotiator, availableMediaTypes, http, key, representations, server, val;

  Negotiator = require('../lib/negotiator').Negotiator;

  http = require('http');

  representations = {
    'text/html': '<h1>Hello world!</h1>',
    'text/plain': 'Hello World!',
    'application/json': JSON.stringify({
      hello: 'world!'
    })
  };

  availableMediaTypes = (function() {
    var _results;
    _results = [];
    for (key in representations) {
      val = representations[key];
      _results.push(key);
    }
    return _results;
  })();

  server = http.createServer(function(req, res) {
    var mediaType, negotiator;
    negotiator = new Negotiator(req);
    console.log("Accept: " + req.headers['accept']);
    console.log("Preferred: " + (negotiator.preferredMediaTypes()));
    console.log("Possible: " + (negotiator.preferredMediaTypes(availableMediaTypes)));
    mediaType = negotiator.preferredMediaType(availableMediaTypes);
    console.log("Selected: " + mediaType);
    if (mediaType) {
      res.writeHead(200, {
        'Content-Type': mediaType
      });
      return res.end(representations[mediaType]);
    } else {
      res.writeHead(406);
      return res.end();
    }
  });

  server.listen(8080);

}).call(this);
