module.exports = preferredLanguages;
preferredLanguages.preferredLanguages = preferredLanguages;

function parseAcceptLanguage(accept) {
  return accept.split(',').map(function(e) {
    return parseLanguage(e.trim());
  }).filter(function(e) {
    return e && e.q > 0;
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
  var match = getClosestMatch(language, accepted);
  return match ? match.q : 0;
}

function getClosestMatch(language, accepted) {
  var parsed = parseLanguage(language);

  var matches = accepted.filter(function(a) {
    return a.full === parsed.full;
  });
  if (matches.length) return matches[0];

  matches = accepted.filter(function(a) {
    return a.prefix === parsed.prefix && !a.suffix;
  });
  if (matches.length) return matches[0];

  matches = accepted.filter(function(a) {
    return a.prefix === parsed.prefix;
  });
  if (matches.length) return matches[0];

  matches = accepted.filter(function(a) {
    return a.prefix === '*';
  });
  return matches[0];
}

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
    }).map(function(type) {
      return type.full;
    });
  }
}
