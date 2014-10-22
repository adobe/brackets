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
    return e && specify('identity', e);
  })) {
    /*
     * If identity doesn't explicitly appear in the accept-encoding header,
     * it's added to the list of acceptable encoding with the lowest q
     *
     */
    var lowestQ = 1;

    for(var i = 0; i < acceptableEncodings.length; i++){
      var e = acceptableEncodings[i];
      if(e && e.q < lowestQ){
        lowestQ = e.q;
      }
    }
    acceptableEncodings.push({
      encoding: 'identity',
      q: lowestQ / 2,
    });
  }

  return acceptableEncodings.filter(function(e) {
    return e;
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
  return (accepted.map(function(a) {
    return specify(encoding, a);
  }).filter(function(a){
    return a;
  }).sort(function (a, b) {
    // revsort
    return a.s > b.s ? -1 : 1;
  })[0] || {q:0}).q;
}

function specify(encoding, spec) {
  var s = 0;
  if(spec.encoding === encoding){
    s |= 1;
  } else if (spec.encoding !== '*' ) {
    return null
  }

  return {
    s: s,
    q: spec.q,
  }
};

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
    }).filter(function(type){
      return type.q > 0;
    }).map(function(type) {
      return type.encoding;
    });
  }
}
