module.exports = preferredCharsets;
preferredCharsets.preferredCharsets = preferredCharsets;

function parseAcceptCharset(accept) {
  return accept.split(',').map(function(e) {
    return parseCharset(e.trim());
  }).filter(function(e) {
    return e;
  });
}

function parseCharset(s) {
  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);
  if (!match) return null;

  var charset = match[1];
  var q = 1;
  if (match[2]) {
    var params = match[2].split(';')
    for (var i = 0; i < params.length; i ++) {
      var p = params[i].trim().split('=');
      if (p[0] === 'q') {
        q = parseFloat(p[1]);
        break;
      }
    }
  }

  return {
    charset: charset,
    q: q
  };
}

function getCharsetPriority(charset, accepted) {
  return (accepted.filter(function(a) {
    return specify(charset, a);
  }).sort(function (a, b) {
    // revsort
    return a.s > b.s ? -1 : 1;
  })[0] || {q:0}).q;
}

function specify(charset, spec) {
  var s = 0;
  if(spec.charset === charset){
    s |= 1;
  } else if (spec.charset !== '*' ) {
    return null
  }

  return {
    s: s,
    q: spec.q,
  }
}

function preferredCharsets(accept, provided) {
  accept = parseAcceptCharset(accept || '');
  if (provided) {
    return provided.map(function(type) {
      return [type, getCharsetPriority(type, accept)];
    }).filter(function(pair) {
      return pair[1] > 0;
    }).sort(function(a, b) {
      // revsort
      return a[1] > b[1] ? -1 : 1;
    }).map(function(pair) {
      return pair[0];
    });
  } else {
    return accept.sort(function (a, b) {
      // revsort
      return a.q < b.q ? 1 : -1;
    }).filter(function(type) {
      return type.q > 0;
    }).map(function(type) {
      return type.charset;
    });
  }
}
