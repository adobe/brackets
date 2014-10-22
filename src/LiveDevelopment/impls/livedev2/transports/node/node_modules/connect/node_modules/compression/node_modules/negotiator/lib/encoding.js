module.exports = preferredEncodings;
preferredEncodings.preferredEncodings = preferredEncodings;

function parseAcceptEncoding(accept) {
  var acceptableEncodings;

  if (accept) {
    acceptableEncodings = accept.split(',').map(function(e) {
      return parseEncoding(e.trim());
    });
  } else {
    acceptableEncodings = [];
  }

  if (!acceptableEncodings.some(function(e) {
    return e && e.encoding === 'identity';
  })) {
    acceptableEncodings.push({
      encoding: 'identity',
      q: 0.1
    });
  }

  return acceptableEncodings.filter(function(e) {
    return e && e.q > 0;
  });
}

function parseEncoding(s) {
  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);

  if (!match) return null;

  var encoding = match[1];
  var q = 1;
  if (match[2]) {
    var params = match[2].split(';');
    for (var i = 0; i < params.length; i ++) {
      var p = params[i].trim().split('=');
      if (p[0] === 'q') {
        q = parseFloat(p[1]);
        break;
      }
    }
  }

  return {
    encoding: encoding,
    q: q
  };
}

function getEncodingPriority(encoding, accepted) {
  return (accepted.filter(function(a) {
    return specify(encoding, a);
  }).sort(function (a, b) {
    // revsort
    return a.q === b.q ? 0 : a.q > b.q ? -1 : 1;
  })[0] || {q:0}).q;
}

function specify(encoding, spec) {
  if (spec.encoding === '*' || spec.encoding === encoding) {
    return spec;
  }
}

function preferredEncodings(accept, provided) {
  accept = parseAcceptEncoding(accept || '');
  if (provided) {
    return provided.map(function(type) {
      return [type, getEncodingPriority(type, accept)];
    }).filter(function(pair) {
      return pair[1] > 0;
    }).sort(function(a, b) {
      // revsort
      return a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1;
    }).map(function(pair) {
      return pair[0];
    });
  } else {
    return accept.sort(function (a, b) {
      // revsort
      return a.q < b.q ? 1 : -1;
    }).map(function(type) {
      return type.encoding;
    });
  }
}
