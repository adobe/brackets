(function() {
  var Buffer, Iconv, Negotiator, availableCharsets, http, iconv, key, message, messages, server, val;

  Negotiator = require('../lib/negotiator').Negotiator;

  http = require('http');

  Buffer = require('buffer').Buffer;

  Iconv = require('iconv').Iconv;

  iconv = new Iconv('UTF-8', 'ISO-8859-1');

  message = "ë";

  messages = {
    'utf-8': message,
    'iso-8859-1': iconv.convert(new Buffer(message))
  };

  availableCharsets = (function() {
    var _results;
    _results = [];
    for (key in messages) {
      val = messages[key];
      _results.push(key);
    }
    return _results;
  })();

  server = http.createServer(function(req, res) {
    var charset, negotiator;
    negotiator = new Negotiator(req);
    console.log("Accept-Charset: " + req.headers['accept-charset']);
    console.log("Preferred: " + (negotiator.preferredCharsets()));
    console.log("Possible: " + (negotiator.preferredCharsets(availableCharsets)));
    charset = negotiator.preferredCharset(availableCharsets);
    console.log("Selected: " + charset);
    if (charset) {
      res.writeHead(200, {
        'Content-Type': "text/html; charset=" + charset
      });
      return res.end(messages[charset]);
    } else {
      res.writeHead(406);
      return res.end();
    }
  });

  server.listen(8080);

}).call(this);
