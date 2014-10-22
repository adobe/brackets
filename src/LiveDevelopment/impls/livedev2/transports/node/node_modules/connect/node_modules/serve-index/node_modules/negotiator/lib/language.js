module.exports = preferredLanguages;
preferredLanguages.preferredLanguages = preferredLanguages;

function parseAcceptLanguage(accept) {
  return accept.split(',').map(function(e) {
    return parseLanguage(e.trim());
  }).filter(function(e) {
    return e;
  });
}

function parseLanguage(s) {
  var match = s.match(/^\s*(\S+?)(?:-(\S+?))?\s*(?:;(.*))?$/);
  if (!match) return null;

  var prefix = match[1],
      suffix = match[2],
      full = prefix;

  if (suffix) full += "-" + suffix;

  var q = 1;
  if (match[3]) {
    var params = match[3].split(';')
    for (var i = 0; i < params.length; i ++) {
      var p = params[i].split('=');
      if (p[0] === 'q') q = parseFloat(p[1]);
    }
  }

  return {
    prefix: prefix,
    suffix: suffix,
    q: q,
    full: full
  };
}

function getLanguagePriority(language, accepted) {
  return (accepted.map(function(a){
    return specify(language, a);
  }).filter(function(a){
    return a;
  }).sort(function(a, b){
    // revsort
    return a.s > b.s ? -1 : 1;
  })[0] || {q:0}).q;
}

function specify(language, spec) {
  var p = parseLanguage(language)
  var s = 0;
  if(spec.full === p.full){
    s |= 4;
  } else if (spec.prefix === p.full) {
    s |= 2;
  } else if (spec.full === p.prefix) {
    s |= 1;
  } else if (spec.full !== '*' ) {
    return null
  }

  return {
    s: s,
    q: spec.q,
  }
};

function preferredLanguages(accept, provided) {
  accept = parseAcceptLanguage(accept || '');
  if (provided) {

    var ret = provided.map(function(type) {
      return [type, getLanguagePriority(type, accept)];
    }).filter(function(pair) {
      return pair[1] > 0;
    }).sort(function(a, b) {
      // revsort
      return a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1;
    }).map(function(pair) {
      return pair[0];
    });
    return ret;

  } else {
    return accept.sort(function (a, b) {
      // revsort
      return a.q < b.q ? 1 : -1;
    }).filter(function(type) {
      return type.q > 0;
    }).map(function(type) {
      return type.full;
    });
  }
}
